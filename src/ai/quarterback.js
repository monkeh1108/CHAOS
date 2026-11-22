import { clamp, distance2D as dist } from "../core/math.js";
import { CpuQBPolicy } from "../ai/cpu_qb_policy.js";

export function createQuarterback() {
  let H,
    arrive,
    closestThreat,
    dispatchInput,
    eligibleTargets,
    log,
    matchState,
    projectedReceiver,
    rand,
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

  function cpuQuarterback(qb, dt) {
    if (matchState.passThrown || matchState.ballCarrier) return;
    // Pressure is physical: an unassigned safety who actually comes downhill
    // counts once close enough to threaten the pocket. A defender merely
    // disguising a blitz before the snap does not.
    const activeRush = matchState.def.filter(
      (d) =>
        !d.ground &&
        (d.rush ||
          (dist(d, qb) < 5.8 &&
            d.vx * (qb.x - d.x) + d.vy * (qb.y - d.y) >
              Math.max(0.6, dist(d, qb) * 0.42))),
    );
    const rush = closestThreat(qb, activeRush);
    const pressure = clamp((5.2 - rush.d) / 4.7, 0, 1);
    // Stay in a pocket with lateral evasions. BSK affects escape composure.
    let wantX = matchState.playStart - 4.2,
      wantY = 26.65;
    if (rush.p && rush.d < 4) {
      wantX = qb.x - (0.6 + pressure * 0.8);
      wantY = clamp(
        qb.y + (qb.y >= rush.p.y ? 1 : -1) * (1.5 + qb.BSK * 0.015),
        10,
        H - 10,
      );
    }
    qb.intent = "qb-read";
    qb.intentTarget = matchState.cpuQB.choice?.key || "pocket";
    arrive(qb, wantX, wantY, dt, 0.58 + qb.BSK * 0.002);
    if (matchState.playClock < matchState.cpuQB.nextRead) return;
    matchState.cpuQB.reads++;
    const options = eligibleTargets().map((r) => quarterbackWindow(qb, r));
    options.sort((a, b) => b.score - a.score);
    // Field vision determines how much coverage the QB correctly perceives.
    // A poor VIS can underestimate risk and pick a lower-quality option.
    const recognition = clamp((qb.VIS - 30) / 69, 0, 1);
    let chosen = options[0];
    if (options.length > 1 && rand() > recognition * 0.93 + 0.05) {
      const chance = rand();
      chosen = options[chance < 0.5 ? 1 : chance < 0.81 ? 2 : 3] || chosen;
    }
    matchState.cpuQB.choice = chosen?.rec || null;
    matchState.cpuQB.lastScore = chosen?.score || 0;
    matchState.cpuQB.lastRisk = chosen?.danger || 0;
    const timeDemand = CpuQBPolicy.minimumSettle(
      matchState.selectedPlay,
      qb.DEC,
      qb.VIS,
    );
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
    const readable =
      chosen &&
      chosen.score > CpuQBPolicy.selectThreshold(qb.DEC, qb.VIS) &&
      chosen.danger < CpuQBPolicy.dangerLimit(qb.VIS) &&
      chosen.openness > 0.22;
    // A QB with enough protection waits for receivers to complete the route's
    // meaningful break. Severe pressure permits a rushed or imperfect throw.
    const emergency =
      (pressure > 0.86 &&
        rush.d < 2.2 &&
        matchState.playClock > Math.max(0.9, timeDemand - 0.75)) ||
      matchState.playClock > Math.max(4.7, timeDemand + 2.6);
    const panic = pressure > 0.86 && rush.d < 2.1;
    if (
      matchState.playClock >= timeDemand &&
      ((developed && readable) || emergency)
    ) {
      const index = eligibleTargets().indexOf(chosen.rec);
      if (index >= 0) {
        const hold =
          chosen.range > 19 ? 0.11 : chosen.danger > 0.42 ? 0.46 : 0.29;
        const fired = dispatchInput({
          type: "pass",
          receiver: index,
          hold,
          playerSlot: matchState.controllerTeams.cpu,
        });
        if (fired) {
          matchState.cpuQB.passes++;
          log(
            "CPU QB · " +
              (emergency ? "UNDER PRESSURE" : "READ") +
              " · " +
              chosen.rec.key +
              " · risk " +
              chosen.danger.toFixed(2),
          );
          return;
        }
      }
    }
    if (
      panic &&
      matchState.playClock > Math.max(1.2, timeDemand - 0.3) &&
      qb.BSK >= 58
    ) {
      // Scramble path responds to rush angle; crossing the LOS disables passing.
      arrive(
        qb,
        matchState.playStart + 3,
        clamp(qb.y + (qb.y >= rush.p.y ? 5 : -5), 5, H - 5),
        dt,
        1.1,
      );
    }
    matchState.cpuQB.nextRead =
      matchState.playClock + clamp(0.19 + (100 - qb.DEC) * 0.004, 0.18, 0.49);
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
        closestThreat,
        dispatchInput,
        eligibleTargets,
        log,
        matchState,
        projectedReceiver,
        rand,
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
