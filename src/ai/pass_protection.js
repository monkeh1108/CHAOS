import { clamp, distance2D as dist } from "../core/math.js";
import { ProtectionRead } from "../ai/protection_read.js";

export function createPassProtection() {
  let H,
    P,
    RUNS,
    arrive,
    blockBattle,
    closestThreat,
    insideZoneBlockerAI,
    matchState,
    steer;

  // Persistent pass protection: one lineman owns each rush lane, with a center
  // available for inside help. Assignment is decided at the snap, then revisited
  // only for genuine leaks. This prevents all five linemen chasing one DT.
  function assignPassProtection() {
    const line = ["LT", "LG", "C", "RG", "RT"].map(P).filter(Boolean);
    for (const o of line) {
      o.passAssignment = null;
      o.passHelp = null;
    }
    const rushers = matchState.def
      .filter((d) => d.rush && !d.ground)
      .sort((a, b) => a.spawnY - b.spawnY);
    for (const d of rushers) {
      d.passProtector = null;
    }
    // Optimize lateral travel, giving the center the nose when the front is odd.
    const available = [...line];
    const regular = rushers.filter((d) => !d.blitz);
    for (const d of regular) {
      const choice = available.sort((a, b) => {
        const cost = (o) =>
          Math.abs(o.spawnY - d.spawnY) * 1.3 +
          (o.key === "C" && regular.length >= 4 ? 2.0 : 0) +
          (d.pos === "NT" && o.key === "C" ? -3 : 0) +
          (Math.abs(protectionLane(o)) > 2.5 && Math.abs(d.spawnY - 26.65) < 3
            ? 1.7
            : 0);
        return cost(a) - cost(b);
      })[0];
      if (choice) {
        choice.passAssignment = d.key;
        d.passProtector = choice.key;
        available.splice(available.indexOf(choice), 1);
      }
    }
    // One uncovered blitzer is the RB's first job. The C can slide toward a
    // fifth threat when he is free, but must not abandon an inside rusher.
    const rb = P("RB");
    if (rb) {
      rb.passAssignment = null;
      const unclaimed = rushers.filter((d) => !d.passProtector);
      if (unclaimed.length) {
        const threat = unclaimed.sort(
          (a, b) =>
            Math.hypot(a.x - P("QB").x, a.y - P("QB").y) -
            Math.hypot(b.x - P("QB").x, b.y - P("QB").y),
        )[0];
        rb.passAssignment = threat.key;
        threat.passProtector = "RB";
      }
    }
  }

  function protectionLane(o) {
    return { LT: -3.6, LG: -1.8, C: 0, RG: 1.8, RT: 3.6 }[o.key] || 0;
  }

  function runningBlockThreats(o, rushing, run) {
    const lane = 26.65 + protectionLane(o),
      same = o.blockTarget;
    return [...rushing]
      .filter((d) => d.shedCooldown <= 0 || d.key !== same)
      .sort((a, b) => {
        const rating = (d) => {
          const assigned =
            matchState.blockLinks.get(o.key)?.defender === d.key ? -5 : 0;
          const home = Math.abs(d.y - lane),
            distance = dist(o, d);
          const competing = [...matchState.blockLinks.values()].some(
            (link) => link.blocker !== o.key && link.defender === d.key,
          );
          const extra = competing ? 3.5 : 0;
          const overreach = home > 6.2 ? (home - 6.2) * 2 : 0;
          const runSide =
            run && matchState.selectedPlay === "power" && o.key === "RG"
              ? d.y < 23
                ? -2
                : 3
              : run && matchState.selectedPlay === "counter" && o.key === "LG"
                ? d.y > 30
                  ? -2
                  : 3
                : 0;
          return (
            distance * 0.7 + home * 0.8 + overreach + extra + assigned + runSide
          );
        };
        return rating(a) - rating(b);
      });
  }

  function passThreatPriority(d, qb) {
    const gap = dist(d, qb),
      approach =
        ((qb.x - d.x) * d.vx + (qb.y - d.y) * d.vy) / Math.max(0.2, gap);
    return (
      (12 - gap) * 1.4 +
      Math.max(0, approach) * 0.8 +
      (d.blitz ? 2.2 : 0) +
      (d.x < matchState.playStart ? 2 : 0) -
      (d.blocked > 0.2 ? 3.0 : 0)
    );
  }

  function passProtectAI(o, dt) {
    const qb = P("QB"),
      lane = 26.65 + protectionLane(o),
      own = matchState.def.find(
        (d) => d.key === o.passAssignment && d.rush && !d.ground,
      );
    const locked = matchState.blockLinks.get(o.key);
    let t = locked
      ? matchState.def.find((d) => d.key === locked.defender && !d.ground)
      : null;
    if (!t && own) {
      const outside = Math.abs(own.y - lane) > 6.7;
      if (!outside || dist(own, qb) < 5.4) t = own;
    }
    // A free lineman may pick up an alert only AFTER the defender visibly
    // charges the pocket. The primary blocker never abandons an engaged rusher.
    if (!t && o.protectionAlert) {
      const alert = matchState.def.find(
        (d) => d.key === o.protectionAlert && !d.ground,
      );
      if (
        alert &&
        Math.abs(alert.y - lane) < 7.0 &&
        ProtectionRead.committing(
          alert,
          qb,
          matchState.playStart,
          matchState.playClock,
        )
      )
        t = alert;
    }
    // Interior help only when the home rusher has left our lane or another
    // free defender would reach the QB sooner. No arbitrary across-line shifts.
    if (!t) {
      const leaks = matchState.def.filter(
        (d) =>
          d.rush &&
          !d.ground &&
          Math.abs(d.y - lane) < (o.key === "C" ? 5.2 : 4.3) &&
          d.x < matchState.playStart + 2.4 &&
          dist(d, qb) < 7.3 &&
          (!d.passProtector ||
            d.passProtector === o.key ||
            (!matchState.blockLinks.has(d.passProtector) &&
              dist(P(d.passProtector) || o, d) > 3.6)),
      );
      leaks.sort(
        (a, b) => passThreatPriority(b, qb) - passThreatPriority(a, qb),
      );
      t = leaks[0] || null;
    }
    o.intent = "pass-protect";
    o.intentTarget = t?.key || "pocket-lane";
    if (!t) {
      // Hold an actual pass-set shape instead of drifting toward the center.
      const depth = o.key === "LT" || o.key === "RT" ? 1.25 : 2.45;
      arrive(
        o,
        clamp(
          qb.x + depth,
          matchState.playStart - 3.0,
          matchState.playStart - 0.1,
        ),
        lane,
        dt,
        0.93,
      );
      return;
    }
    o.blockTarget = t.key;
    const edge = o.key === "LT" || o.key === "RT";
    const predict = clamp(dist(o, t) / 22, 0.07, 0.23);
    const ty = clamp(
      t.y + t.vy * predict,
      lane - (edge ? 7 : 4.3),
      lane + (edge ? 7 : 4.3),
    );
    // Rushers who have penetrated MUST be followed into the pocket. Keeping
    // every OL permanently pinned to the line of scrimmage caused free sacks.
    const tx = clamp(
      t.x + t.vx * predict - 0.68,
      qb.x + 0.55,
      matchState.playStart + 1.2,
    );
    steer(o, tx - o.x, ty - o.y, dt, 1.04);
    if (dist(o, t) < 1.98) blockBattle(o, t, dt);
  }

  function blockerAI(o, dt) {
    if (matchState.selectedPlay === "inside") {
      insideZoneBlockerAI(o, dt, new Set(), null);
      return;
    }
    const run = RUNS.has(matchState.selectedPlay);
    if (!run) {
      passProtectAI(o, dt);
      return;
    }
    o.intent = "protect";
    o.intentTarget = "run-lane";
    const rushing = matchState.def.filter(
      (d) =>
        !d.ground &&
        d.beatenUntil < matchState.playClock &&
        d.x > matchState.playStart - 1 &&
        d.x < matchState.playStart + 16 &&
        Math.abs(d.y - (26.65 + protectionLane(o))) < 10,
    );
    if (!rushing.length) return;
    if (
      ((matchState.selectedPlay === "power" && o.key === "RG") ||
        (matchState.selectedPlay === "counter" && o.key === "LG")) &&
      matchState.playClock < 0.92
    ) {
      o.intent = "pull";
      o.intentTarget =
        matchState.selectedPlay === "counter" ? "right C-gap" : "left C-gap";
      steer(
        o,
        matchState.playStart - 1.0 - o.x,
        (matchState.selectedPlay === "counter" ? 32.0 : 21.8) - o.y,
        dt,
        0.96,
      );
      return;
    }
    const candidates = runningBlockThreats(o, rushing, run).filter(
      (d) => d.key !== o.beatenTarget,
    );
    const locked = matchState.blockLinks.get(o.key),
      preferred = locked && rushing.find((d) => d.key === locked.defender);
    if (!locked && o.beatenTarget && matchState.playClock >= o.beatenUntil) {
      o.beatenTarget = null;
    }
    let t =
      preferred ||
      (o.blockTarget &&
        rushing.find(
          (d) =>
            d.key === o.blockTarget && dist(d, o) < 4.2 && d.shedCooldown <= 0,
        )) ||
      candidates[0];
    if (!t) {
      o.intent = "climb-second-level";
      o.intentTarget = "find-linebacker";
      arrive(
        o,
        matchState.playStart + clamp(matchState.playClock * 2.0, 2, 9),
        26.65 + protectionLane(o),
        dt,
        0.92,
      );
      return;
    }
    o.blockTarget = t.key;
    o.intentTarget = t.key;
    const lane = 26.65 + protectionLane(o),
      tY = clamp(t.y, lane - 3.4, lane + 3.4);
    const tx = Math.max(matchState.playStart + 0.15, t.x - 0.6);
    const ty = tY + (matchState.selectedPlay === "stretch" ? -0.35 : 0);
    steer(o, tx - o.x, ty - o.y, dt, 0.96);
    if (dist(o, t) < 1.9) blockBattle(o, t, dt);
  }

  function rbPassProtection(p, dt) {
    const qb = P("QB"),
      rushers = matchState.def.filter((d) => d.rush && !d.ground);
    // A suspicious DB/LB remains only a *candidate*: the RB commits if he
    // actually closes toward the pocket. Covering defenders are never chased.
    const alert = matchState.def.find(
      (d) => d.key === p.protectionAlert && !d.ground,
    );
    const extra =
      alert &&
      ProtectionRead.committing(
        alert,
        qb,
        matchState.playStart,
        matchState.playClock,
      )
        ? alert
        : null;
    if (extra && !rushers.includes(extra)) rushers.push(extra);
    const locked = matchState.blockLinks.get(p.key);
    let target = locked ? rushers.find((d) => d.key === locked.defender) : null;
    if (!target && p.passAssignment)
      target = rushers.find((d) => d.key === p.passAssignment);
    if (!target && extra && dist(extra, qb) < 9.0) target = extra;
    if (!target) {
      const unblocked = rushers.filter(
        (d) =>
          !d.passProtector ||
          d.passProtector === "RB" ||
          (!matchState.blockLinks.has(d.passProtector) &&
            dist(P(d.passProtector) || p, d) > 3.6),
      );
      unblocked.sort(
        (a, b) => passThreatPriority(b, qb) - passThreatPriority(a, qb),
      );
      if (unblocked.length && dist(unblocked[0], qb) < 9) target = unblocked[0];
    }
    p.intent = "pass-protect";
    p.intentTarget = target?.key || "pocket-check";
    if (!target) {
      arrive(p, qb.x + 1.6, clamp(qb.y + 1.9, 4, H - 4), dt, 1.0);
      return;
    }
    const future = 0.14;
    const tx = clamp(
      target.x + target.vx * future - 0.68,
      qb.x + 0.6,
      matchState.playStart + 1.0,
    );
    const ty = clamp(target.y + target.vy * future, 2, H - 2);
    steer(p, tx - p.x, ty - p.y, dt, 1.09);
    if (dist(p, target) < 1.98) blockBattle(p, target, dt);
  }

  function rbLeadBlock(p, dt) {
    p.intent = "lead-block";
    p.intentTarget = "front";
    if (p.key === "FB" && matchState.selectedPlay === "power") {
      let target = closestThreat(
        p,
        matchState.def.filter((d) => !d.rush && d.x > matchState.playStart),
      ).p;
      let ty = 22.3,
        tx = matchState.playStart + Math.min(8, matchState.playClock * 3);
      if (target && dist(p, target) < 3) {
        tx = target.x - 0.65;
        ty = target.y;
        blockBattle(p, target, dt);
      }
      steer(p, tx - p.x, ty - p.y, dt, 0.96);
      return;
    }
    const rushers = matchState.def.filter((d) => d.rush);
    const t = closestThreat(p, rushers).p;
    if (t && dist(p, t) < 2.3) {
      steer(p, t.x - 0.45 - p.x, t.y - p.y, dt, 0.94);
      blockBattle(p, t, dt);
    } else {
      steer(p, matchState.playStart + 1 - p.x, p.spawnY - p.y, dt, 0.75);
    }
  }

  return {
    bind(services) {
      ({
        H,
        P,
        RUNS,
        arrive,
        blockBattle,
        closestThreat,
        insideZoneBlockerAI,
        matchState,
        steer,
      } = services);
    },
    assignPassProtection,
    blockerAI,
    rbPassProtection,
    rbLeadBlock,
  };
}
