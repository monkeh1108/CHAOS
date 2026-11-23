import { clamp, distance2D as dist } from "../core/math.js";

export function createRunSupport() {
  let H,
    P,
    RUNS,
    acceleration,
    arrive,
    blockBattle,
    matchState,
    maxSpeed,
    pileSupport,
    speed,
    steer;

  // Reserve each wide receiver's *own* outside corner on designed runs.
  // In Cover 1, use the defender whose man assignment is this receiver. In zone,
  // match the aligned corner on the same side. A receiver does NOT automatically
  // chase the nearest linebacker toward midfield merely because he moved closer.
  function assignRunBlockMatches() {
    const receivers = matchState.off.filter((o) => o.pos === "WR");
    const available = new Set(
      matchState.def.filter((d) => !d.rush).map((d) => d.key),
    );
    // Outside receivers get the outside corners first; don't steal CB1 for a
    // slot receiver when a base defense has only two corners.
    for (const o of [...receivers].sort(
      (a, b) => Math.abs(b.spawnY - 26.65) - Math.abs(a.spawnY - 26.65),
    )) {
      const assigned = matchState.def.find(
        (d) =>
          available.has(d.key) &&
          d.assignment?.kind === "man" &&
          d.assignment.target === o.key,
      );
      const sameSide = matchState.def.filter(
        (d) =>
          available.has(d.key) &&
          d.pos === "CB" &&
          Math.sign(d.spawnY - 26.65) === Math.sign(o.spawnY - 26.65),
      );
      const pick =
        assigned ||
        sameSide.sort(
          (a, b) =>
            Math.abs(a.spawnY - o.spawnY) - Math.abs(b.spawnY - o.spawnY),
        )[0] ||
        matchState.def
          .filter(
            (d) =>
              available.has(d.key) &&
              d.pos !== "CB" &&
              Math.abs(d.spawnY - o.spawnY) < 16,
          )
          .sort(
            (a, b) =>
              Math.abs(a.spawnY - o.spawnY) - Math.abs(b.spawnY - o.spawnY),
          )[0] ||
        matchState.def
          .filter((d) => available.has(d.key))
          .sort(
            (a, b) =>
              Math.abs(a.spawnY - o.spawnY) - Math.abs(b.spawnY - o.spawnY),
          )[0];
      if (pick) {
        o.primaryRunBlock = pick.key;
        available.delete(pick.key);
      }
    }
  }

  // Run-blocking WRs defend a *lane*, not the ball carrier's position.
  // A CB cutting all the way across the field to chase the runner should not drag
  // the outside WR into the middle. Keep the aligned matchup while reachable;
  // otherwise locate the closest threat to the WR inside his home lane.
  function receiverRunBlock(o, dt, claims, carrier = null) {
    const primary = o.primaryRunBlock ? P(o.primaryRunBlock) : null;
    const engaged = matchState.blockLinks.get(o.key);
    const laneWidth = o.key === "WR3" ? 9.0 : 8.0;
    const homeY = o.spawnY;
    const onAssignmentSide = (d) =>
      d &&
      !d.ground &&
      d.beatenUntil < matchState.playClock &&
      Math.abs(d.y - homeY) <= laneWidth &&
      Math.sign(d.y - 26.65) === Math.sign(homeY - 26.65) &&
      dist(o, d) < 15.5;
    let target = null;
    // Finishing an existing engagement always takes precedence over chasing a
    // new defender. Release only if the original opponent has truly escaped the
    // receiver's outside blocking lane or won the block.
    if (engaged) {
      const existing = P(engaged.defender);
      if (onAssignmentSide(existing)) target = existing;
    }
    if (!target && onAssignmentSide(primary) && !claims.has(primary.key))
      target = primary;
    if (!target) {
      const otherAssignments = new Set(
        matchState.off
          .filter((w) => w !== o && w.pos === "WR" && w.primaryRunBlock)
          .map((w) => w.primaryRunBlock),
      );
      const inLane = matchState.def.filter(
        (d) =>
          onAssignmentSide(d) &&
          !claims.has(d.key) &&
          d.key !== o.beatenTarget &&
          !otherAssignments.has(d.key) &&
          ["CB", "SS", "FS", "LB", "OLB", "MLB"].includes(d.pos),
      );
      // Distance FROM THE RECEIVER is the principal selection criterion, not the
      // distance to the carrier or which defender happens to pursue the runner.
      inLane.sort((a, b) => {
        const score = (d) =>
          dist(o, d) +
          Math.abs(d.y - homeY) * 0.18 +
          (d.pos === "CB" ? -1.4 : 0);
        return score(a) - score(b);
      });
      target = inLane[0] || null;
    }
    if (target) {
      claims.add(target.key);
      o.intent = "run-block";
      o.intentTarget = target.key;
      const lead = clamp(0.12 + dist(o, target) / 35, 0.16, 0.37);
      const tx = target.x + target.vx * lead - 0.48;
      const lane = clamp(
        target.y + target.vy * lead,
        Math.max(0.8, homeY - laneWidth),
        Math.min(H - 0.8, homeY + laneWidth),
      );
      // A moving corner is not a stationary waypoint: accelerate into the block
      // rather than braking just before making contact.
      if (dist(o, target) > 1.1) steer(o, tx - o.x, lane - o.y, dt, 1.12);
      else arrive(o, tx, lane, dt, 1.0);
      if (dist(o, target) < 2.12) blockBattle(o, target, dt);
    } else {
      // No corner in reach? Hold an outside stalk position and wait for a threat.
      // Do not escort toward the RB's y-coordinate in the middle of the field.
      o.intent = "edge-stalk";
      o.intentTarget = primary?.key || "outside-lane";
      const advance = carrier
        ? Math.min(carrier.x + 3.1, matchState.playStart + 13)
        : matchState.playStart + 6;
      const x = clamp(Math.max(o.x, advance), matchState.playStart + 0.6, 109);
      arrive(o, x, homeY, dt, 0.93);
    }
  }

  // Forecast the danger of a defender reaching the live carrier. The estimate
  // uses motion, defender top speed, acceleration, PUR and tackling technique.
  // It is a stable threat estimate, not a random "choose somebody" roll.
  function defenderTackleThreat(d, a) {
    const sep = Math.max(0.1, dist(d, a)),
      nx = (a.x - d.x) / sep,
      ny = (a.y - d.y) / sep;
    const defenderMax = Math.max(2, maxSpeed(d));
    const currentToward = d.vx * nx + d.vy * ny;
    const carrierAway = a.vx * nx + a.vy * ny;
    const approach = clamp(currentToward / defenderMax, -1, 1);
    const anticipation = clamp((d.PUR - 40) / 60, 0.08, 0.94);
    const look = clamp(
      (sep / (defenderMax + 2)) * (0.25 + 0.27 * anticipation),
      0.08,
      0.58,
    );
    const tx = a.x + a.vx * look,
      ty = a.y + a.vy * look;
    const interceptGap = Math.hypot(tx - d.x, ty - d.y);
    // Acceleration affects how soon the defender can exploit the pursuit angle.
    const attainable = clamp(
      Math.max(0, currentToward) + acceleration(d) * 0.62,
      2.6,
      defenderMax,
    );
    const eta = clamp(Math.max(0, interceptGap - 1.15) / attainable, 0.04, 5);
    const tackles = clamp(
      (d.TAK * 0.42 + d.PUR * 0.33 + d.ACC * 0.18 + d.AWR * 0.07) / 100,
      0.25,
      0.99,
    );
    const behind = a.x > d.x + 3 && a.vx > 1.5;
    const relativeClosing = currentToward - carrierAway;
    const trailing =
      behind && relativeClosing < 0
        ? clamp(0.58 + relativeClosing * 0.055, 0.22, 0.75)
        : 1;
    const readiness = clamp(0.76 + approach * 0.24, 0.52, 1);
    const timeUrgency = 1 / (0.32 + Math.pow(eta, 1.2));
    const risk = clamp(
      44 * tackles * timeUrgency * readiness * trailing,
      0,
      100,
    );
    return { risk, eta, sep, closing: relativeClosing };
  }

  // A high-threat defender matters only if this blocker can realistically
  // reach him. This also prevents a WR chasing a defensive tackle across the
  // field after a short completion. Ratings determine strength of a contest.
  function blockTargetMerit(o, d, a, assigned = null) {
    const danger = defenderTackleThreat(d, a),
      reach = dist(o, d);
    const blockerVelocity = Math.max(
      2.2,
      Math.min(maxSpeed(o), speed(o) + acceleration(o) * 0.65),
    );
    const blockEta = Math.max(0, reach - 1.4) / blockerVelocity;
    const chance = clamp(0.73 + (danger.eta - blockEta) * 0.3, 0.22, 1.12);
    const physical = clamp(
      o.BLO * 0.47 + o.IBL * 0.25 + o.STR * 0.28 - (d.PMV * 0.5 + d.STR * 0.5),
      -35,
      35,
    );
    const current = matchState.blockLinks.get(o.key)?.defender === d.key;
    const previous =
      o.supportTarget === d.key && matchState.playClock < (o.supportUntil || 0);
    const matchup = assigned === d ? 3.6 : 0;
    // Threat leads, but nearby opponents remain worth blocking before they close.
    return (
      danger.risk * chance +
      Math.max(0, 9 - reach) * 0.72 +
      matchup +
      (current ? 23 : 0) +
      (previous ? 7 : 0) +
      physical * 0.075 -
      reach * 0.74 -
      Math.max(0, blockEta - danger.eta) * 8
    );
  }

  // Dynamic blocking intercept: meet the dangerous defender on his route to
  // the carrier rather than chasing a defender's old position. Re-evaluate
  // every physics tick so the intercept moves immediately when defenders cut.
  function blockInterceptPoint(o, d, a) {
    const incoming = defenderTackleThreat(d, a);
    const blockerSpeed = Math.max(
      2.0,
      Math.min(maxSpeed(o), speed(o) + acceleration(o) * 0.38),
    );
    const arrival = clamp((dist(o, d) - 1.3) / blockerSpeed, 0.05, 0.46);
    const lead = clamp(Math.min(arrival, incoming.eta * 0.62), 0.045, 0.38);
    const velocityX = d.x + d.vx * lead,
      velocityY = d.y + d.vy * lead;
    const towardX = a.x - d.x,
      towardY = a.y - d.y,
      sep = Math.max(0.1, Math.hypot(towardX, towardY));
    const align = clamp(
      (d.vx * towardX + d.vy * towardY) / (Math.max(0.1, speed(d)) * sep),
      -1,
      1,
    );
    const anticipation = clamp((d.PUR - 45) / 55, 0.1, 0.95);
    const more =
      align > 0.15
        ? clamp(0.12 * anticipation * (1 - arrival / 0.6), 0, 0.11)
        : 0;
    const projectedX = velocityX + (towardX / sep) * maxSpeed(d) * more;
    const projectedY = velocityY + (towardY / sep) * maxSpeed(d) * more;
    // Intercept on the carrier side of the target without running past him.
    const angle = Math.atan2(a.y - projectedY, a.x - projectedX),
      offset = clamp(0.36 + (o.BLO - 65) * 0.002, 0.3, 0.48);
    return {
      x: clamp(projectedX + Math.cos(angle) * offset, 10, 109.5),
      y: clamp(projectedY + Math.sin(angle) * offset, 0.5, H - 0.5),
      eta: incoming.eta,
      threat: incoming.risk,
    };
  }

  function bestLiveBlockTarget(o, a, options, claims, assigned = null) {
    const ranked = options
      .filter((d) => !claims.has(d.key))
      .map((d) => ({ d, merit: blockTargetMerit(o, d, a, assigned) }))
      .sort((q, r) => r.merit - q.merit);
    return ranked[0]?.merit > 0 ? ranked[0].d : null;
  }

  // Receivers go from route-running to threat-aware downfield blocking. They
  // prioritize an imminent tackler near their own route location, not a distant
  // DL or whoever was first to chase the runner. Current blocks persist until
  // contact truly breaks; new targets are held briefly to prevent oscillation.
  function receiverAfterCatchBlock(o, a, dt, claims) {
    const linked = matchState.blockLinks.get(o.key),
      current = linked ? P(linked.defender) : null;
    const assigned = matchState.def.find(
      (d) => d.assignment?.kind === "man" && d.assignment.target === o.key,
    );
    const eligible = (d) =>
      d &&
      !d.ground &&
      d.stun < 0.65 &&
      d.beatenUntil < matchState.playClock &&
      d.key !== o.beatenTarget &&
      dist(o, d) < 11.5 &&
      d.x >= a.x - 9 &&
      d.x <= a.x + 17;
    let target = null;
    if (current && !current.ground && dist(o, current) < 2.75) target = current;
    if (!target) {
      const options = matchState.def.filter(eligible);
      const best = bestLiveBlockTarget(o, a, options, claims, assigned);
      const previous = options.find(
        (d) => d.key === o.supportTarget && !claims.has(d.key),
      );
      if (
        previous &&
        matchState.playClock < (o.supportUntil || 0) &&
        (!best ||
          blockTargetMerit(o, previous, a, assigned) >=
            blockTargetMerit(o, best, a, assigned) - 8)
      )
        target = previous;
      else target = best;
    }
    if (target) {
      claims.add(target.key);
      o.supportTarget = target.key;
      o.supportUntil = matchState.playClock + 0.3;
      o.intent = "catch-block";
      o.intentTarget = target.key;
      const intercept = blockInterceptPoint(o, target, a);
      o.blockApproach = intercept;
      // Replan every physics frame; don't follow a stale waypoint after a cut.
      if (dist(o, target) > 1.12)
        steer(o, intercept.x - o.x, intercept.y - o.y, dt, 1.13);
      else arrive(o, intercept.x, intercept.y, dt, 1.0);
      if (dist(o, target) < 2.12) blockBattle(o, target, dt);
      return;
    }
    o.supportTarget = null;
    o.supportUntil = 0;
    // If nobody nearby threatens the carrier, screen off the lane from the WR's
    // current route position rather than jogging toward a random inside lineman.
    o.intent = "catch-screen";
    o.intentTarget = a.key;
    const tx = clamp(Math.max(o.x, a.x + 1.2), 10, 109);
    const ty = clamp(o.y + (a.y - o.y) * 0.075, 0.8, H - 0.8);
    arrive(o, tx, ty, dt, 0.95);
  }

  // After the handoff/catch, receivers become downfield blockers, backs provide
  // protection, and OL leave pass-protection routes to locate immediate threats.
  // Stable targets plus claims keep six blockers from chasing the same defender.
  function runSupportAI(o, a, dt, claims) {
    if (
      matchState.pileState?.active &&
      matchState.pileState.carrier === a.key &&
      pileSupport(o, a, dt)
    )
      return;
    const lineman = ["LT", "LG", "C", "RG", "RT"].includes(o.key),
      interior = lineman || o.pos === "FB" || o.pos === "TE",
      maxReach = interior ? 12 : 17,
      scope = interior ? 13 : 17;
    const reserved = new Set(
      matchState.off
        .filter((p) => p.pos === "WR" && p.primaryRunBlock)
        .map((p) => p.primaryRunBlock),
    );
    const livePassSupport =
      !RUNS.has(matchState.selectedPlay) && a.x >= matchState.playStart;
    const candidates = matchState.def.filter(
      (d) =>
        !d.ground &&
        d.stun < 0.65 &&
        d.beatenUntil < matchState.playClock &&
        d.key !== o.beatenTarget &&
        d.x > a.x - (livePassSupport ? 9 : 5.5) &&
        d.x < a.x + 16 &&
        dist(d, a) < (livePassSupport ? scope + 3 : scope) &&
        dist(d, o) < maxReach &&
        (livePassSupport || !reserved.has(d.key) || dist(d, a) < 2.4),
    );
    let chosen = null;
    const current = matchState.blockLinks.get(o.key),
      engaged = current ? P(current.defender) : null;
    if (engaged && candidates.includes(engaged)) chosen = engaged;
    if (!chosen) {
      const best = livePassSupport
        ? bestLiveBlockTarget(o, a, candidates, claims)
        : null;
      const keep = candidates.find(
        (d) => d.key === o.supportTarget && !claims.has(d.key),
      );
      if (
        keep &&
        (livePassSupport
          ? matchState.playClock < (o.supportUntil || 0) &&
            (!best ||
              blockTargetMerit(o, keep, a) >= blockTargetMerit(o, best, a) - 8)
          : dist(keep, o) < maxReach * 0.85)
      )
        chosen = keep;
      if (!chosen && best) chosen = best;
    }
    if (!chosen && !livePassSupport) {
      const ranked = candidates
        .filter((d) => !claims.has(d.key))
        .sort((d, e) => {
          const merit = (t) =>
            dist(t, a) * 1.15 +
            dist(t, o) * 0.65 +
            Math.max(0, o.x - t.x) * 0.3 -
            (t.rush && lineman ? 2 : 0);
          return merit(d) - merit(e);
        });
      chosen = ranked[0] || null;
    }
    if (chosen) {
      claims.add(chosen.key);
      o.supportTarget = chosen.key;
      o.supportUntil = matchState.playClock + 0.3;
      o.intent = "block";
      o.intentTarget = chosen.key;
      const intercept = blockInterceptPoint(o, chosen, a);
      o.blockApproach = intercept;
      if (dist(o, chosen) < 1.75) blockBattle(o, chosen, dt);
      if (dist(o, chosen) > 1.8)
        steer(
          o,
          intercept.x - o.x,
          intercept.y - o.y,
          dt,
          interior ? 1.02 : 1.1,
        );
      else arrive(o, intercept.x, intercept.y, dt, interior ? 0.98 : 1.02);
      return;
    }
    o.supportTarget = null;
    o.supportUntil = 0;
    // No nearby immediate threat? Escort on the appropriate side of the carrier.
    // Don't send a faraway WR on an endless trek across the entire field.
    const side = o.spawnY < a.y ? -1 : 1;
    const forward = lineman ? 2.2 : o.pos === "WR" ? 5.5 : 3.3;
    const spacing = lineman ? 1.8 : o.pos === "WR" ? 4.8 : 2.7;
    const homeX = clamp(a.x + forward, 10, 109),
      homeY = clamp(a.y + side * spacing, 0.8, H - 0.8);
    o.intent = "escort";
    o.intentTarget = a.key;
    arrive(o, homeX, homeY, dt, lineman ? 0.91 : 0.98);
  }

  function quarterbackSupport(q, a, dt) {
    q.intent = "trail";
    q.intentTarget = a.key;
    // Having pitched or handed off, the QB does not keep dropping backwards forever.
    const x = clamp(matchState.playStart - 3.6, 10, 109);
    const y = clamp(q.spawnY + (a.y < q.spawnY ? 2.8 : -2.8), 1, H - 1);
    arrive(q, x, y, dt, 0.82);
  }

  return {
    bind(services) {
      ({
        H,
        P,
        RUNS,
        acceleration,
        arrive,
        blockBattle,
        matchState,
        maxSpeed,
        pileSupport,
        speed,
        steer,
      } = services);
    },
    assignRunBlockMatches,
    receiverRunBlock,
    blockInterceptPoint,
    receiverAfterCatchBlock,
    runSupportAI,
    quarterbackSupport,
  };
}
