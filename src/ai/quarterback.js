import { clamp, distance2D as dist } from "../core/math.js";
import { CpuQBPolicy } from "../ai/cpu_qb_policy.js";

export function createQuarterback() {
  let H,
    arrive,
    radius,
    maxSpeed,
    convertQuarterbackScramble,
    acceleration,
    dispatchInput,
    eligibleTargets,
    log,
    matchState,
    projectedReceiver,
    speed,
    sprintHeld,
    steer,
    stickInput;

  // Independent CPU QB: predict arrival windows instead of scanning only present
  // receiver separation. The defensive player controls never force a scripted pass.
  function quarterbackWindow(qb, rec) {
    const rough = Math.max(0.35, Math.hypot(rec.x - qb.x, rec.y - qb.y) / 23);
    const predicted = projectedReceiver(rec, clamp(rough * 1.35, 0.4, 2.0));
    const flight = clamp(
      (Math.hypot(predicted.x - qb.x, predicted.y - qb.y) /
        (23 + (qb.THP - 65) * 0.22)) *
        1.35,
      0.38,
      2.2,
    );
    const arrival = projectedReceiver(rec, flight);
    const dx = arrival.x - qb.x,
      dy = arrival.y - qb.y,
      range = Math.hypot(dx, dy);
    const ballDepth = range / (35 + (qb.THP - 65) * 0.66);
    let danger = 0,
      nearest = 100,
      inside = 0;
    for (const d of matchState.def) {
      if (d.ground) continue;
      // Defensive coverage can reach the catch point after reacting, not teleport.
      const distNow = Math.hypot(arrival.x - d.x, arrival.y - d.y);
      const avail = Math.max(
        0,
        flight - clamp(0.12 + (100 - d.AWR) * 0.006, 0.12, 0.55),
      );
      const advance = clamp(
        speed(d) * 0.4 * avail,
        0,
        Math.max(0, distNow - 0.35),
      );
      const atCatch = Math.max(0.3, distNow - advance);
      nearest = Math.min(nearest, atCatch);
      const catchRisk =
        clamp((3.2 - atCatch) / 2.8, 0, 1) *
        (d.COV * 0.005 + d.CAT * 0.002 + 0.3);
      // A defender on the flight corridor can break up a flat pass. Evaluate the
      // middle half of the trajectory as well as the catch point.
      const deltaX = arrival.x - qb.x,
        deltaY = arrival.y - qb.y,
        length2 = Math.max(0.01, deltaX * deltaX + deltaY * deltaY);
      const t = clamp(
        ((d.x - qb.x) * deltaX + (d.y - qb.y) * deltaY) / length2,
        0,
        1,
      );
      const lineDist = Math.hypot(
        d.x - (qb.x + t * deltaX),
        d.y - (qb.y + t * deltaY),
      );
      const trajectoryRisk =
        t > 0.16 && t < 0.91
          ? clamp((1.4 - lineDist) / 1.4, 0, 1) * (0.65 * (1 - t))
          : 0;
      danger = Math.max(danger, catchRisk + trajectoryRisk);
      if (atCatch < 1.7) inside++;
    }
    const openness = clamp((nearest - 0.7) / 3.7, 0, 1);
    const catchSkill = rec.CAT * 0.07 + rec.RTE * 0.025;
    // Decision model values yards gained, but may prioritize an easy checkdown.
    const progress = Math.max(0, arrival.x - matchState.playStart);
    const score =
      16 * openness +
      catchSkill +
      Math.min(15, progress * 0.35) -
      danger * 25 -
      ballDepth * 10;
    return { rec, arrival, flight, range, danger, openness, score, inside };
  }

  // Sample the QB's path at estimated arrival times. Engaged defenders still
  // occupy their current lane, but have less freedom to close another one.
  function quarterbackClearance(qb, target, bodies, chase) {
    const length = dist(qb, target),
      initialSpeed = speed(qb),
      accel = acceleration(qb);
    const topSpeed = maxSpeed(qb),
      qbRadius = radius(qb);
    let clearance = 6;
    for (const fraction of [0.25, 0.5, 0.75, 1]) {
      const x = qb.x + (target.x - qb.x) * fraction,
        y = qb.y + (target.y - qb.y) * fraction;
      const travel = length * fraction;
      const time = Math.min(
        2,
        Math.max(
          travel / topSpeed,
          (Math.sqrt(initialSpeed ** 2 + 2 * accel * travel) - initialSpeed) /
            accel,
        ),
      );
      for (const p of bodies) {
        const engaged = p.team === 1 && p.blocked;
        const lead = Math.min(0.65, time) * (engaged ? 0.25 : 1);
        const closing =
          chase && p.team === 1 && !engaged
            ? Math.max(0, time - 0.55) * maxSpeed(p) * 0.52
            : 0;
        clearance = Math.min(
          clearance,
          Math.hypot(x - p.x - p.vx * lead, y - p.y - p.vy * lead) -
            qbRadius -
            radius(p) -
            closing,
        );
      }
    }
    return clearance;
  }
  function quarterbackLane(qb, bodies) {
    let best = null;
    const vision = 0.55 * qb.VIS + 0.45 * qb.AWR;
    const horizon = clamp(maxSpeed(qb) * 1.4 + (qb.ACC - 70) * 0.035, 5, 13);
    const runway = Math.min(110 - matchState.playStart, horizon);
    for (const offset of [0, -2.5, 2.5, -5, 5]) {
      if (Math.abs(offset) > 4 && vision < 70) continue;
      const y = clamp(qb.y + offset, 1, H - 1);
      const entry = { x: matchState.playStart + Math.min(runway, 2), y };
      const entryGap = quarterbackClearance(qb, entry, bodies, true);
      if (entryGap < 0.5) continue;
      let gain = entry.x - matchState.playStart;
      for (const depth of [5, 8]
        .filter((depth) => depth < runway)
        .concat(runway)) {
        const x = matchState.playStart + depth;
        if (quarterbackClearance(qb, { x, y }, bodies, true) < 0.8) break;
        gain = x - matchState.playStart;
      }
      const value =
        gain + Math.min(entryGap, 3) * 0.65 - Math.abs(y - qb.y) * 0.25;
      if (!best || value > best.value) best = { ...entry, gain, value };
    }
    return best;
  }
  function quarterbackPocket(qb, bodies, pressure, rusher) {
    // The QB begins near the traditional dropback spot, so aiming at the fixed
    // home position every tick made him settle after moving only a few inches.
    // Maintain a small moving pocket target even without an immediate rusher;
    // select an actual safe gap rather than sliding through the offensive line.
    const awareness = clamp((qb.AWR + qb.BSK) / 200, 0, 1);
    const threat = rusher
      ? { x: rusher.x + rusher.vx * 0.35, y: rusher.y + rusher.vy * 0.35 }
      : null;
    let best = { x: qb.x, y: qb.y },
      value = -Infinity;
    const desiredStep =
      matchState.playClock > 0.42
        ? clamp(matchState.playStart - qb.x - 1.75, 0, 1.6)
        : 0;
    const step = qb.x + desiredStep;
    const candidates = [
      { x: step, y: qb.y },
      {
        x: Math.min(qb.x + 0.3, matchState.playStart - 1.45),
        y: qb.spawnY - 1.6,
      },
      {
        x: Math.min(qb.x + 0.3, matchState.playStart - 1.45),
        y: qb.spawnY + 1.6,
      },
      { x: step, y: qb.spawnY - 1.25 },
      { x: step, y: qb.spawnY + 1.25 },
    ];
    for (const target of candidates) {
      if (
        target.x > matchState.playStart - 1.4 ||
        target.y < 2 ||
        target.y > H - 2
      )
        continue;
      const gap = quarterbackClearance(qb, target, bodies, false);
      if (gap < 0.12) continue;
      const threatGain = threat ? dist(target, threat) - dist(qb, threat) : 0;
      const travel = dist(qb, target);
      const lateral = Math.abs(target.y - qb.spawnY);
      // In a clean pocket, a short reposition creates a throwing lane. Under
      // pressure, move to maximize distance from the actual oncoming defender.
      const score =
        Math.min(gap, 2.5) * 0.47 +
        threatGain * (pressure > 0.2 ? 0.85 : 0.12) +
        (target.x - qb.x) * (0.25 + 0.38 * awareness) -
        lateral * (pressure > 0.2 ? 0.065 : 0.22) -
        travel * 0.075;
      if (score > value) {
        best = target;
        value = score;
      }
    }
    if (pressure > 0.48 && threat) {
      for (const side of [-1, 1]) {
        if (qb.IMP < 52 || matchState.playClock < 0.85) continue;
        const target = {
          x: Math.min(qb.x + 0.35, matchState.playStart - 1.45),
          y: clamp(qb.y + side * 4.6, 2, H - 2),
        };
        const gap = quarterbackClearance(qb, target, bodies, false);
        const escape = dist(target, threat) - dist(qb, threat);
        if (gap > 0.2 && escape > 1.0 && gap + escape * 0.7 > value + 0.35) {
          best = target;
          value = gap + escape * 0.7;
        }
      }
    }
    return best;
  }
  function cpuQuarterback(qb, dt) {
    if (
      matchState.passThrown ||
      matchState.ballCarrier ||
      convertQuarterbackScramble()
    )
      return;
    const targets = eligibleTargets();
    if (matchState.playClock >= matchState.cpuQB.nextRead) {
      const bodies = matchState.players.filter((p) => p !== qb && !p.ground);
      let rush = { player: null, distance: Infinity, pressure: 0 };
      // Rank by effective pressure so an engaged defender cannot hide a free rusher.
      for (const d of matchState.def) {
        if (d.ground) continue;
        const distance = dist(d, qb);
        const closing = d.vx * (qb.x - d.x) + d.vy * (qb.y - d.y);
        if (
          !d.rush &&
          (distance >= 5.8 || closing <= Math.max(0.6, distance * 0.42))
        )
          continue;
        const protectedRush = d.blocked > 0 && distance > 2.4;
        const pressure =
          clamp((5.2 - distance) / 4.7, 0, 1) * (protectedRush ? 0.55 : 1);
        if (
          pressure > rush.pressure ||
          (pressure === rush.pressure && distance < rush.distance)
        )
          rush = { player: d, distance, pressure };
      }
      const { pressure } = rush;
      matchState.cpuQB.reads++;
      const patience = (qb.PAT - 65) * 0.009;
      const timeDemand =
        CpuQBPolicy.minimumSettle(matchState.selectedPlay, qb.DEC, qb.VIS) +
        patience;
      // Stay within the concept's early progression. Faster processors reach
      // later reads sooner. An emergency may end the progression early.
      const interval = 0.2 + (100 - qb.DEC) * 0.004;
      const progression =
        1 +
        Math.floor(Math.max(0, matchState.playClock - 0.45) / (interval * 2.5));
      const risk = (qb.RSK - 55) / 100;
      const options = targets
        .slice(0, progression)
        .map((r) => quarterbackWindow(qb, r));
      const perceivedScore = (o) =>
        o.score +
        risk *
          (Math.min(18, o.range) * 0.45 +
            (o.inside === 1 && o.range > 15 ? o.danger * 18 : 0)) +
        (75 - qb.VIS) * o.danger * 0.18;
      const chosen = options.sort(
        (a, b) => perceivedScore(b) - perceivedScore(a),
      )[0];
      matchState.cpuQB.choice = chosen?.rec || null;
      matchState.cpuQB.lastScore = chosen?.score || 0;
      matchState.cpuQB.lastRisk = chosen?.danger || 0;
      matchState.cpuQB.nextRead = matchState.playClock + interval;

      const progress = chosen
        ? Math.max(0, chosen.arrival.x - matchState.playStart)
        : 0;
      const developed =
        chosen &&
        CpuQBPolicy.hasDeveloped(
          matchState.selectedPlay,
          matchState.playClock,
          progress,
          pressure,
        );
      const singleCoverage = chosen?.inside === 1 && chosen.range > 15;
      const readable =
        chosen &&
        perceivedScore(chosen) > CpuQBPolicy.selectThreshold(qb.DEC, qb.VIS) &&
        chosen.danger <
          CpuQBPolicy.dangerLimit(qb.VIS) +
            risk * (singleCoverage ? 0.6 : 0.18) &&
        chosen.openness > (singleCoverage ? 0.22 - risk * 0.35 : 0.22);
      const emergency =
        pressure > 0.79 + (qb.BSK - 65) * 0.004 && rush.distance < 2.3;
      const expired = matchState.playClock > Math.max(4.7, timeDemand + 2.6);
      const lane =
        matchState.playClock > 1 ? quarterbackLane(qb, bodies) : null;
      const runValue = lane
        ? lane.value +
          Math.min(lane.gain, matchState.togo) * 0.28 +
          pressure * 5
        : 0;
      const runDemand =
        10.5 +
        (60 - qb.SCT) * 0.16 +
        (qb.PAT - 65) * 0.05 +
        (developed && readable ? 3 : 0) +
        (matchState.down >= 3 && lane && lane.gain < matchState.togo ? 4 : 0);
      // Keep the chosen entry point while it is still clear. This avoids
      // redirecting the runner every time the candidate grid shifts with him.
      const committed = matchState.cpuQB.runTarget;
      matchState.cpuQB.runTarget =
        committed && quarterbackClearance(qb, committed, bodies, true) > 0.3
          ? committed
          : lane &&
              runValue > runDemand &&
              lane.gain >=
                Math.min(110 - matchState.playStart, emergency ? 1.5 : 5)
            ? lane
            : null;
      if (!matchState.cpuQB.runTarget) {
        const set = speed(qb) < 1.8 || qb.TOR > 77 || expired || emergency;
        if (
          chosen &&
          set &&
          ((matchState.playClock >= timeDemand && developed && readable) ||
            expired ||
            (emergency &&
              matchState.playClock > Math.max(0.9, timeDemand - 0.55)))
        ) {
          const hold =
            chosen.range > 19 ? 0.11 : chosen.danger > 0.42 ? 0.46 : 0.29;
          if (
            dispatchInput({
              type: "pass",
              receiver: targets.indexOf(chosen.rec),
              hold,
              playerSlot: matchState.controllerTeams.cpu,
            })
          ) {
            matchState.cpuQB.passes++;
            return;
          }
        }
        matchState.cpuQB.pocketTarget = quarterbackPocket(
          qb,
          bodies,
          pressure,
          rush.player,
        );
      }
    }
    const lane = matchState.cpuQB.runTarget;
    const target = lane || matchState.cpuQB.pocketTarget;
    qb.intent = lane ? "qb-scramble" : "qb-read";
    qb.intentTarget = lane
      ? "rushing-lane"
      : matchState.cpuQB.choice?.key || "pocket";
    if (lane) steer(qb, lane.x - qb.x, lane.y - qb.y, dt, 1.1);
    else if (target) arrive(qb, target.x, target.y, dt, 0.67 + qb.BSK * 0.002);
  }

  function qbAI(p, dt) {
    p.intent = "qb-control";
    p.intentTarget = "user";
    const input = stickInput();
    if (input.mag > 0.12)
      steer(p, input.x, input.y, dt, sprintHeld() ? 1.2 : 1);
    else steer(p, -0.12, 0, dt, 0.7);
  }

  return {
    bind(services) {
      ({
        H,
        arrive,
        radius,
        maxSpeed,
        convertQuarterbackScramble,
        acceleration,
        dispatchInput,
        eligibleTargets,
        log,
        matchState,
        projectedReceiver,
        speed,
        sprintHeld,
        steer,
        stickInput,
      } = services);
    },
    quarterbackWindow,
    cpuQuarterback,
    qbAI,
  };
}
