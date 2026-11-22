import { clamp } from "../core/math.js";

export function createGroundMotion() {
  let log, mass, matchState;

  // A hard hit can briefly knock an off-ball player winded. This is gameplay,
  // not a medical injury model. The player falls, pauses to recover, then rises.
  // Momentum, angle, impact technique, and victim stability determine severity.
  // The ball carrier uses the tackle subsystem; a winded off-ball player is never
  // removed from the roster or automatically replaced.
  function groundContact(
    victim,
    attacker,
    impulse,
    relativeSpeed,
    nx,
    ny,
    kind = "body",
  ) {
    if (
      matchState.phase !== "live" ||
      victim.ground ||
      victim.groundLock > 0 ||
      victim === matchState.ballCarrier ||
      (victim === matchState.active && !matchState.passThrown) ||
      !Number.isFinite(impulse)
    )
      return false;
    // Cheap accidental shoulder brushes can't trigger the full animation.
    if (relativeSpeed < 3.2 || impulse < 240) return false;
    const technique = attacker.team === 1 ? attacker.HIT : attacker.IBL;
    const impactRating =
      attacker.team === 1
        ? attacker.HIT * 0.62 + attacker.TAK * 0.18 + attacker.STR * 0.2
        : attacker.IBL * 0.52 + attacker.BLO * 0.24 + attacker.STR * 0.24;
    const resistance =
      victim.STR * 0.33 +
      victim.AWR * 0.25 +
      victim.AGI * 0.2 +
      victim.STA * 0.22;
    const facing = Math.cos(victim.face) * -nx + Math.sin(victim.face) * -ny;
    // Bracing for a frontal shot helps. An unprepared hit from behind is harder.
    const penalty = clamp(facing, -1, 1) * 45;
    const base =
      430 +
      (resistance - 75) * 2.2 +
      (mass(victim) - 100) * 0.46 -
      (impactRating - 75) * 2.7 +
      penalty;
    const threshold = clamp(base, 270, 660);
    const quality = impulse / threshold;
    if (quality < 1) return false;
    const excess = clamp(quality - 1, 0, 1.4);
    const fall = clamp(0.16 + 0.06 * excess, 0.16, 0.25);
    const rest = clamp(
      0.4 + 0.32 * excess + (100 - victim.STA) * 0.0035,
      0.38,
      0.92,
    );
    const rise = clamp(0.23 + (100 - victim.AGI) * 0.001, 0.22, 0.31);
    victim.ground = {
      stage: "fall",
      time: fall,
      fall,
      rest,
      rise,
      age: 0,
      force: Math.round(impulse),
      from: attacker.key,
      kind,
      dir: Math.atan2(ny, nx),
      severity: quality,
    };
    victim.groundLock = 0;
    victim.stam = Math.max(
      0.045,
      victim.stam - clamp(0.075 + 0.065 * excess, 0.075, 0.17),
    );
    victim.balance = clamp(victim.balance - 0.3 - 0.1 * excess, 0.25, 0.65);
    victim.technique = "winded";
    victim.intent = "fall";
    victim.intentTarget = attacker.key;
    victim.vx *= 0.32;
    victim.vy *= 0.32;
    victim.sprinting = false;
    // Drop existing blocks. Defensive pursuit resumes after recovery.
    for (const [k, b] of [...matchState.blockLinks])
      if (k === victim.key || b.defender === victim.key)
        matchState.blockLinks.delete(k);
    if (matchState.tackleLinks.has(victim.key))
      matchState.tackleLinks.delete(victim.key);
    if (matchState.pileState?.active && matchState.pileState.pushers)
      matchState.pileState.pushers = matchState.pileState.pushers.filter(
        (p) => p.key !== victim.key,
      );
    matchState.windedHits++;
    victim.pulse = 0.35;
    log(
      victim.pos +
        " " +
        victim.name +
        " down briefly · " +
        Math.round(impulse) +
        " N·s impact",
    );
    return true;
  }

  function tickGround(p, dt) {
    p.groundLock = Math.max(0, p.groundLock - dt);
    if (!p.ground) return false;
    const g = p.ground;
    g.age += dt;
    g.time -= dt;
    if (g.time <= 0) {
      if (g.stage === "fall") {
        g.stage = "winded";
        g.time += g.rest;
      } else if (g.stage === "winded") {
        g.stage = "rise";
        g.time += g.rise;
      } else {
        p.ground = null;
        p.groundLock = 0.65;
        p.balance = clamp(p.balance + 0.2, 0.5, 1);
        matchState.standUps++;
        p.intent = "rejoin";
        p.intentTarget = matchState.ballCarrier?.key || "assignment";
        p.diveRecovery = Math.max(p.diveRecovery || 0, 0.23);
        return false;
      }
    }
    p.intent =
      g.stage === "fall"
        ? "fall"
        : g.stage === "winded"
          ? "winded"
          : "getting-up";
    p.intentTarget = g.from;
    p.sprinting = false;
    p.vx *= Math.max(0, 1 - dt * (g.stage === "fall" ? 11 : 24));
    p.vy *= Math.max(0, 1 - dt * (g.stage === "fall" ? 11 : 24));
    return true;
  }

  return {
    bind(services) {
      ({ log, mass, matchState } = services);
    },
    groundContact,
    tickGround,
  };
}
