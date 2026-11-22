import { angleFromCosine, clamp, distance2D as dist } from "../core/math.js";
import { CoverageRoutePolicy } from "../ai/coverage_route_policy.js";

export function createReceivingRoutes() {
  let H,
    P,
    RUNS,
    arrive,
    catchReach,
    flightMarkers,
    matchState,
    maxSpeed,
    rand,
    steer;

  function eligibleTargets() {
    return [
      P("WR1"),
      P("WR2"),
      P("TE"),
      P("WR3") || P("TE2") || P("FB"),
    ].filter(Boolean);
  }

  function skillOffense() {
    return matchState.off.filter(
      (p) => !["LT", "LG", "C", "RG", "RT", "QB"].includes(p.key),
    );
  }

  function alignRoutes() {
    const x = matchState.playStart,
      receivers = eligibleTargets();
    const wr1 = P("WR1"),
      wr2 = P("WR2"),
      te = P("TE"),
      other = receivers[3];
    const positions = [wr1, wr2, te, other];
    for (const p of positions) {
      if (!p) continue;
      const yy = p.y;
      let route;
      if (matchState.selectedPlay === "slants")
        route = [
          [x + 4, yy],
          [x + 13, 26.6 + (yy < 26 ? -4 : 4)],
          [x + 22, 26.6 + (yy < 26 ? 1 : -1)],
        ];
      else if (matchState.selectedPlay === "verticals")
        route = [
          [x + 11, yy],
          [x + 23, yy],
          [x + 42, yy + (yy < 26 ? 2 : -2)],
        ];
      else if (matchState.selectedPlay === "mesh") {
        // Mesh is a staggered shallow-cross concept: one crosser passes
        // *behind* the other, not two receivers occupying the same depth.
        if (p === wr1)
          route = [
            [x + 4, yy],
            [x + 8.6, 37],
            [x + 13.8, 45],
          ];
        else if (p === wr2)
          route = [
            [x + 4, yy],
            [x + 5.2, 16],
            [x + 12.0, 8],
          ];
        else if (p === te)
          route = [
            [x + 5, yy],
            [x + 11, 25],
            [x + 17, 25],
          ];
        else
          route = [
            [x + 8, yy],
            [x + 16, yy],
            [x + 24, yy],
          ];
      } else if (matchState.selectedPlay === "sluggo") {
        // Slant-and-go: outside WRs sell the slant before redirecting vertical.
        const inward = yy < 26 ? 1 : -1;
        if (p === wr1 || p === wr2)
          route = [
            [x + 5, yy],
            [x + 11, yy + inward * 8],
            [x + 25, yy + inward * 8],
            [x + 43, yy + inward * 8],
          ];
        else if (p === te)
          route = [
            [x + 7, yy],
            [x + 14, yy + inward * 3],
            [x + 22, yy + inward * 3],
          ];
        else
          route = [
            [x + 5, yy],
            [x + 12, yy - inward * 5],
            [x + 20, yy - inward * 6],
          ];
      } else if (matchState.selectedPlay === "flood") {
        if (p === wr2)
          route = [
            [x + 11, 46],
            [x + 25, 44],
            [x + 41, 42],
          ];
        else if (p === te)
          route = [
            [x + 7, 38],
            [x + 12, 42],
            [x + 16, 44],
          ];
        else if (p === other)
          route = [
            [x + 3, yy],
            [x + 4, 47],
            [x + 10, 48],
          ];
        else
          route = [
            [x + 9, 7],
            [x + 16, 19],
            [x + 23, 27],
          ];
      } else if (matchState.selectedPlay === "stick") {
        if (p === te)
          route = [
            [x + 5, yy],
            [x + 7, yy],
            [x + 7, clamp(yy + (yy < 26 ? -4 : 4), 3, 50)],
          ];
        else if (p === wr1)
          route = [
            [x + 5, yy],
            [x + 9, clamp(yy + 7, 2, 51)],
            [x + 15, clamp(yy + 8, 2, 51)],
          ];
        else if (p === wr2)
          route = [
            [x + 3, yy],
            [x + 5, clamp(yy - 6, 2, 51)],
            [x + 9, clamp(yy - 7, 2, 51)],
          ];
        else
          route = [
            [x + 7, yy],
            [x + 16, yy],
            [x + 25, yy],
          ];
      } else if (matchState.selectedPlay === "dagger") {
        if (p === wr1)
          route = [
            [x + 10, yy],
            [x + 21, yy],
            [x + 30, clamp(yy + 15, 3, 50)],
          ];
        else if (p === wr2)
          route = [
            [x + 12, yy],
            [x + 23, yy],
            [x + 36, yy],
          ];
        else if (p === te)
          route = [
            [x + 7, yy],
            [x + 13, clamp(yy - 8, 3, 50)],
            [x + 18, clamp(yy - 8, 3, 50)],
          ];
        else
          route = [
            [x + 6, yy],
            [x + 13, clamp(yy + 6, 3, 50)],
            [x + 18, clamp(yy + 8, 3, 50)],
          ];
      } else if (matchState.selectedPlay === "smash") {
        if (p === wr1 || p === wr2)
          route = [
            [x + 5, yy],
            [x + 7, clamp(yy + (yy < 26 ? 5 : -5), 2, 51)],
            [x + 8, clamp(yy + (yy < 26 ? 8 : -8), 2, 51)],
          ];
        else if (p === te)
          route = [
            [x + 7, yy],
            [x + 17, clamp(yy + (yy < 26 ? -9 : 9), 2, 51)],
            [x + 25, clamp(yy + (yy < 26 ? -13 : 13), 2, 51)],
          ];
        else
          route = [
            [x + 7, yy],
            [x + 16, yy],
            [x + 28, yy],
          ];
      } else
        route = [
          [x + 3, yy],
          [x + 8, yy],
          [x + 14, yy],
        ];
      // A route's concept remains recognizable; only execution varies slightly.
      // Avoid large distortions of collision/crossing concepts and boundary routes.
      const variation = p.routeVariation;
      if (variation) {
        for (let i = 1; i < route.length; i++) {
          const taper = i === route.length - 1 ? 0.55 : 1;
          route[i] = [
            route[i][0] + variation.breakX * taper,
            clamp(route[i][1] + variation.breakY * taper, 1.4, H - 1.4),
          ];
        }
      }
      p.route = route;
      p.routeIdx = 0;
      p.routeComplete = false;
      p.scrambleTarget = null;
      p.scrambleReplanAt = 0;
      p.scrambleStepCount = 0;
      p.routeBreaks = 0;
      p.doubleMoveWins = 0;
    }
  }

  function resolvePressMatchups() {
    if (RUNS.has(matchState.selectedPlay)) return;
    for (const d of matchState.def) {
      if (d.assignment?.kind !== "man" || d.ground) continue;
      const p = P(d.assignment.target);
      if (!p || !["WR", "TE"].includes(p.pos) || dist(d, p) > 3.9) continue;
      const win = p.REL * 0.44 + p.HND * 0.28 + p.AGI * 0.16 + p.STR * 0.12;
      const resist = d.PRS * 0.47 + d.JAM * 0.29 + d.STR * 0.15 + d.MIR * 0.09;
      const margin = win - resist + (rand() - 0.5) * 8;
      p.pressOpponent = d.key;
      if (margin < -2) {
        p.releaseSlow = clamp(0.22 + (-margin - 2) * 0.008, 0.22, 0.58);
        p.pressResult = "jammed";
        d.pressResult = "jammed";
      } else if (margin > 2) {
        p.releaseBurst = clamp(0.19 + (margin - 2) * 0.006, 0.19, 0.47);
        p.pressResult = "clean-release";
        d.pressResult = "beaten-release";
        d.mirrorDelay = clamp((margin - 2) * 0.002, 0.0, 0.12);
      } else {
        p.pressResult = "even";
        d.pressResult = "even";
      }
    }
  }

  function handleRouteBreak(p, oldIdx, newIdx) {
    const r = p.route;
    if (!r || newIdx >= r.length) return;
    // The first point is the initial stem; later points are actual cuts.
    if (newIdx < 1) return;
    const from = newIdx === 1 ? [p.spawnX, p.spawnY] : r[newIdx - 2];
    const vertex = r[newIdx - 1],
      to = r[newIdx];
    const ax = vertex[0] - from[0],
      ay = vertex[1] - from[1];
    const bx = to[0] - vertex[0],
      by = to[1] - vertex[1];
    const ma = Math.hypot(ax, ay),
      mb = Math.hypot(bx, by);
    if (ma < 0.01 || mb < 0.01) return;
    const bend = angleFromCosine((ax * bx + ay * by) / (ma * mb));
    if (bend < 0.34) return;
    const isDouble =
      matchState.selectedPlay === "sluggo" &&
      newIdx === 2 &&
      (p.key === "WR1" || p.key === "WR2");
    p.routeBreaks++;
    p.routeBreakTime = clamp(
      (0.2 + bend * 0.15) * (p.routeVariation?.tempo || 1),
      0.2,
      0.49,
    );
    const matched = matchState.def.find(
      (d) =>
        d.assignment?.kind === "man" &&
        d.assignment.target === p.key &&
        !d.ground,
    );
    if (matched && !p.prediction) {
      // A route break creates finite defensive reaction delay. Excellent mirrors
      // read earlier and stay plastered; poor mirrors are later to redirect.
      const skill = p.CUT * 0.43 + p.RTE * 0.35 + p.AGI * 0.22;
      const guard = matched.MIR * 0.38 + matched.COV * 0.2 + matched.RCR * 0.42;
      const fakeSkill = p.DBL * 0.55 + p.RTE * 0.25 + p.HND * 0.2;
      const discipline =
        matched.DIS * 0.54 + matched.RCR * 0.29 + matched.AWR * 0.17;
      const fake = isDouble ? fakeSkill - discipline : 0;
      // Good defenders read route cuts sooner; elite WRs can still separate on a
      // real change of direction. No instant separation or predetermined win.
      const delay = clamp(
        0.078 +
          bend * 0.034 +
          (skill - guard) * 0.004 +
          (isDouble ? Math.max(-8, fake) * 0.0043 : 0) +
          (matched.coverageVariation?.react || 0),
        0.025,
        0.39,
      );
      matched.mirrorDelay = Math.max(matched.mirrorDelay, delay);
      matched.routeReadCount++;
      if (isDouble && fake > 12) {
        // Low-discipline defenders physically take a *false step* toward the
        // selling slant. It is brief, capped and steer-driven, not teleportation.
        const direction = Math.sign(ay) || 1;
        const duration = clamp(0.1 + (fake - 12) * 0.006, 0.1, 0.27);
        matched.falseStep = {
          until: matchState.playClock + duration,
          x: matched.x + 0.35,
          y:
            matched.y + direction * clamp(0.55 + (fake - 12) * 0.04, 0.55, 1.6),
        };
        p.doubleMoveWins++;
      }
    }
  }

  // Once an initial route ends, keep helping the QB. Pick reachable open space
  // based on defenders and other receivers. No fixed waypoint or random wandering.
  // Before the QB crosses LOS, this is still a pass route, NOT downfield blocking.
  function scrambleOpenSpace(p) {
    const qb = P("QB"),
      forward = qb && qb.x > matchState.playStart - 3.0 && qb.vx > 1.2;
    const options = [];
    // A receiver may work underneath, deeper, or horizontally across coverage.
    // Slow receivers prefer shorter windows; smarter route runners anticipate them.
    const longBreak = clamp(
      (p.RTE * 0.48 + p.AWR * 0.33 + p.CUT * 0.19 - 60) / 39,
      0.2,
      1,
    );
    const depth = [-3, 2.5, 6 + longBreak * 2.3];
    const lateral = [-8, -4, 0, 4, 8];
    const minX = Math.max(
      matchState.playStart + 1.2,
      (qb?.x || matchState.playStart) + 2.0,
    );
    for (const dx of depth)
      for (const dy of lateral) {
        const x = clamp(p.x + dx, Math.min(minX, 108.2), 108.2),
          y = clamp(p.y + dy, 2.4, H - 2.4);
        const move = Math.hypot(x - p.x, y - p.y);
        if (move < 1.3 || move > 12.5) continue;
        const threats = matchState.def
          .filter((d) => !d.ground)
          .map((d) =>
            Math.hypot(x - (d.x + d.vx * 0.17), y - (d.y + d.vy * 0.17)),
          )
          .sort((a, b) => a - b);
        const separation =
          (threats[0] || 10) * 0.84 + (threats[1] || 12) * 0.18;
        const others = matchState.off
          .filter((o) => o !== p && o.pos !== "QB" && o.pos !== "RB")
          .map((o) => dist(o, { x, y }));
        const spacing = others.length ? Math.min(...others) : 10;
        // Stayout-of-bounds buffer; the QB needs a sensible throwing lane.
        const nearSide = Math.min(y, H - y);
        const qbProximity = qb ? Math.hypot(x - qb.x, y - qb.y) : 15;
        const passLane = qb ? Math.abs(y - qb.y) / Math.max(3, x - qb.x) : 0;
        const score =
          separation * 2.2 +
          Math.min(spacing, 11) * 0.63 +
          Math.min(nearSide, 5) * 0.18 -
          Math.abs(move - 5.2) * 0.23 -
          Math.max(0, qbProximity - 30) * 0.23 -
          Math.max(0, passLane - 1.4) * 1.2 +
          (forward ? Math.max(0, 5 - Math.abs(y - qb.y)) * 0.23 : 0) +
          (dx > 0 ? 0.5 : 0);
        options.push({ x, y, score });
      }
    options.sort((a, b) => b.score - a.score);
    return (
      options[0] || {
        x: clamp(p.x + 2, 7, 108),
        y: clamp(p.y + (p.y < 26.6 ? 3 : -3), 2.4, H - 2.4),
      }
    );
  }

  function scrambleRouteAI(p, dt) {
    // A receiver can continue his scramble drill only while a legal forward pass
    // is still available. QB possession beyond the LOS is handled by ballCarrier.
    const done =
      !p.scrambleTarget ||
      matchState.playClock >= p.scrambleReplanAt ||
      dist(p, p.scrambleTarget) < 1.4;
    if (done) {
      p.scrambleTarget = scrambleOpenSpace(p);
      p.scrambleReplanAt =
        matchState.playClock + clamp(0.5 + (100 - p.AWR) * 0.006, 0.5, 0.82);
      p.scrambleStepCount = (p.scrambleStepCount || 0) + 1;
    }
    p.intent = "scramble-open";
    p.intentTarget = "space-" + p.scrambleStepCount;
    // No braking at the terminal route point. Keep feet moving on timed breakouts.
    const t = p.scrambleTarget;
    steer(
      p,
      t.x - p.x,
      t.y - p.y,
      dt,
      clamp(0.92 + (p.CUT - 70) * 0.004 + (p.RTE - 70) * 0.002, 0.78, 1.14),
    );
  }

  function AIroute(p, dt) {
    p.intent = "route";
    const r = p.route;
    if (!r) {
      p.intent = "hold";
      arrive(p, p.spawnX, p.spawnY, dt);
      return;
    }
    // Real route end is a physical arrival, not just reaching the last index.
    let pt = r[Math.min(p.routeIdx, r.length - 1)];
    if (!p.routeComplete && Math.hypot(pt[0] - p.x, pt[1] - p.y) < 1.5) {
      if (p.routeIdx < r.length - 1) {
        const old = p.routeIdx;
        p.routeIdx++;
        handleRouteBreak(p, old, p.routeIdx);
        pt = r[p.routeIdx];
      } else {
        p.routeComplete = true;
        p.scrambleReplanAt = 0;
      }
    }
    p.releaseSlow = Math.max(0, p.releaseSlow - dt);
    p.releaseBurst = Math.max(0, p.releaseBurst - dt);
    p.routeBreakTime = Math.max(0, p.routeBreakTime - dt);
    if (p.routeComplete) {
      scrambleRouteAI(p, dt);
      return;
    }
    p.intent = p.routeIdx === r.length - 1 ? "route-final-stem" : "route";
    p.intentTarget = "waypoint-" + p.routeIdx;
    // Mesh crossers make small, skill-dependent adjustments for real traffic.
    // Keep the original route target and timing; only change the steering vector.
    const avoid = CoverageRoutePolicy.meshAvoidance(
      p,
      matchState.off,
      matchState.selectedPlay,
    );
    steer(
      p,
      pt[0] - p.x + avoid.x * 4.5,
      pt[1] - p.y + avoid.y * 4.5,
      dt,
      (p.routeIdx === 0 ? 1.03 : 1) * (p.routeVariation?.tempo || 1),
    );
  }

  // Receivers make a real run to the projected catch point before the football
  // arrives. Only the target and teammates who could realistically reach the
  // ball join the contest; unrelated receivers keep running their routes.

  return {
    bind(services) {
      ({
        H,
        P,
        RUNS,
        arrive,
        catchReach,
        flightMarkers,
        matchState,
        maxSpeed,
        rand,
        steer,
      } = services);
    },
    eligibleTargets,
    skillOffense,
    alignRoutes,
    resolvePressMatchups,
    AIroute,
  };
}
