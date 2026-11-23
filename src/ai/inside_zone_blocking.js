import { clamp, distance2D as dist } from "../core/math.js";
import { InsideZoneIQ } from "../ai/inside_zone_iq.js";

export function createInsideZoneBlocking() {
  let H, P, arrive, blockBattle, matchState, steer;

  function insideZoneBlockerAI(o, dt, claims, runner) {
    const info = o.insideZonePlan || {
      target: null,
      homeY: o.spawnY,
      combo: false,
    };
    const engaged = matchState.blockLinks.get(o.key);
    const contact = engaged ? P(engaged.defender) : null;
    const assigned = info.target ? P(info.target) : null;
    const liveRunner = runner || P("RB");
    const primaryAvailable =
      assigned &&
      !assigned.ground &&
      assigned.beatenUntil < matchState.playClock &&
      assigned.key !== o.beatenTarget &&
      dist(o, assigned) < 6.1;
    let target = contact && !contact.ground ? contact : null;
    // First fulfill the original gap and combo assignment. Do not leave a DT
    // unblocked because a linebacker is briefly closer to the runner.
    if (
      !target &&
      primaryAvailable &&
      (matchState.playClock < 1.08 || !runner || dist(o, assigned) < 3.0)
    )
      target = assigned;
    // Completed assignment: identify a *visible*, physically reachable tackler
    // in the developing RB lane. A blocker can't see someone 180° behind him.
    if (
      !target &&
      runner &&
      matchState.playClock >= (o.insideZoneReadAfter || 0)
    ) {
      const nearby = matchState.def.filter(
        (d) =>
          !d.ground &&
          d.beatenUntil < matchState.playClock &&
          d.key !== o.beatenTarget &&
          dist(o, d) < 11.5 &&
          d.x > matchState.playStart - 0.8 &&
          d.x < runner.x + 15 &&
          (d.pos === "MLB" ||
            d.pos === "OLB" ||
            d.pos === "LB" ||
            d.pos === "WILL" ||
            d.pos === "SAM" ||
            d.pos === "FS" ||
            d.pos === "SS" ||
            d.rush),
      );
      const options = nearby
        .filter((d) => !claims.has(d.key) && InsideZoneIQ.visible(o, d))
        .map((d) => ({
          d,
          value: InsideZoneIQ.threat(o, d, runner, matchState.playStart),
        }))
        .sort((a, b) => b.value - a.value);
      const kept = options.find((q) => q.d.key === o.supportTarget);
      const top = options[0];
      if (
        kept &&
        matchState.playClock < (o.supportUntil || 0) &&
        (!top || kept.value >= top.value - 6)
      )
        target = kept.d;
      else if (top && top.value > 0) target = top.d;
    }
    if (target) {
      if (!contact) claims.add(target.key);
      const initial = target === assigned;
      o.blockTarget = target.key;
      o.intent = initial
        ? info.combo
          ? "zone-combo"
          : "zone-drive"
        : "zone-climb";
      o.intentTarget = target.key;
      if (!initial) {
        o.supportTarget = target.key;
        o.supportUntil =
          matchState.playClock +
          clamp(0.35 + (100 - o.AWR) * 0.004, 0.35, 0.54);
      }
      const lane = InsideZoneIQ.runnerProjection(
        liveRunner,
        matchState.playStart,
      );
      const targetX = target.x - 0.62;
      // Anchor first-level footwork to the original gap. On a climb, the blocker
      // may track the live lane, but only in short believable lateral steps.
      const targetY = initial
        ? clamp(target.y, info.homeY - 2.45, info.homeY + 2.45)
        : clamp(
            target.y + (lane.y - target.y) * 0.1,
            Math.max(0.7, o.y - 2.6),
            Math.min(H - 0.7, o.y + 2.6),
          );
      steer(o, targetX - o.x, targetY - o.y, dt, initial ? 1.07 : 1.02);
      if (dist(o, target) < 2.12) blockBattle(o, target, dt);
      return;
    }
    o.blockTarget = null;
    o.supportTarget = null;
    const p = InsideZoneIQ.runnerProjection(liveRunner, matchState.playStart);
    const forward = clamp(
      matchState.playStart + Math.min(6, matchState.playClock * 2.2),
      matchState.playStart + 1,
      109,
    );
    const home = clamp(
      info.homeY + clamp(p.y - info.homeY, -1.5, 1.5) * 0.22,
      0.7,
      H - 0.7,
    );
    o.intent = "zone-search";
    o.intentTarget = "visible-second-level";
    arrive(o, forward, home, dt, 0.94);
  }

  return {
    bind(services) {
      ({ H, P, arrive, blockBattle, matchState, steer } = services);
    },
    insideZoneBlockerAI,
  };
}
