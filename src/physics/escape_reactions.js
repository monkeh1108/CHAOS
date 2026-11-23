"use strict";
// CHAOS v0.36.4p: physics-driven grip release and presentation evidence.
// These outputs describe the physical contest, not animation-triggered wins.
const clamp = (v, min, max) =>
  Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
function signSide(runner, defender) {
  const x = (runner.x || 0) - (defender.x || 0),
    y = (runner.y || 0) - (defender.y || 0);
  const f = runner.face || 0,
    cross = Math.cos(f) * y - Math.sin(f) * x;
  return Math.abs(cross) > 0.06 ? Math.sign(cross) : 0;
}
// Updated every live contact frame: current resistance and escape effort
// control foot cadence, torso bracing, and arm tension, not the result.
function strain(runner, defender, link, contest) {
  const threshold = contest.kind === "wrap break" ? 0.62 : 0.19;
  const fraction = clamp((link.escapeProgress || 0) / threshold, 0, 1);
  const grip = clamp(link.grip || 0, 0, 1.6),
    effort = clamp(contest.effort || 0, 0, 1);
  const drag = clamp(
    (link.attachment?.force || 0) / 9 + (link.attachment?.stretch || 0),
    0,
    2,
  );
  const runnerStrain = clamp(
    (0.18 + 0.33 * effort + 0.3 * fraction + 0.12 * drag) *
      clamp(grip / 0.52, 0, 1),
    0,
    1,
  );
  const defenderStrain = clamp(
    0.22 + 0.26 * grip + 0.22 * fraction + 0.12 * drag,
    0,
    1,
  );
  return {
    runnerStrain,
    defenderStrain,
    side: signSide(runner, defender),
    fraction,
    effort,
  };
}
function release(runner, defender, link, contest) {
  const grip = clamp(link.grip || 0, 0, 1.6),
    quality = clamp(link.quality ?? 0.6, 0, 1.25);
  const dx = (runner.x || 0) - (defender.x || 0),
    dy = (runner.y || 0) - (defender.y || 0);
  const dist = Math.max(0.001, Math.hypot(dx, dy)),
    nx = dx / dist,
    ny = dy / dist;
  const relVx = (runner.vx || 0) - (defender.vx || 0),
    relVy = (runner.vy || 0) - (defender.vy || 0);
  const separating = Math.max(0, relVx * nx + relVy * ny);
  const tangent = Math.abs(relVx * -ny + relVy * nx);
  const effort = clamp(contest?.effort || 0, 0, 1);
  const attached = clamp(
    (link.attachment?.force || 0) / 9 + (link.attachment?.stretch || 0),
    0,
    1.5,
  );
  // A high-speed physical pull with compromised balance can knock someone
  // down. Merely breaking a hold never satisfies that condition.
  const instability = clamp(
    (1 - clamp(defender.balance ?? 1, 0, 1)) * 0.62 +
      separating * 0.05 +
      tangent * 0.044 +
      attached * 0.1 +
      effort * 0.06,
    0,
    1.5,
  );
  const diving =
    defender.action?.kind === "tackle-dive" && defender.action.time > 0;
  const fall =
    diving ||
    (instability > 0.79 && (defender.balance ?? 1) < 0.43 && separating > 3.0);
  const sideways = signSide(runner, defender);
  let kind = "slip";
  if (diving) kind = "dive-follow-through";
  else if (link.style === "wrap" && grip > 0.77 && quality > 0.72)
    kind = "power-pull";
  else if (sideways !== 0 && tangent > 1.4) kind = "twist";
  else if (attached > 0.3 || separating > 3.4) kind = "drag-release";
  const intensity = clamp(0.25 + instability * 0.46 + effort * 0.18, 0.18, 0.9);
  // A small bounded velocity response along the physical separation axis.
  // Never teleport, fake a truck, or kill the defender's entire velocity.
  const tug = clamp(separating * 0.105 + attached * 0.13, 0, 0.65);
  return {
    kind,
    fall,
    instability,
    intensity,
    side: sideways,
    nx,
    ny,
    tug,
    duration:
      kind === "slip" ? 0.24 : kind === "dive-follow-through" ? 0.42 : 0.4,
    recovery: kind === "slip" ? 0.16 : kind === "twist" ? 0.29 : 0.34,
  };
}
export const ChaosEscapeReactions = Object.freeze({ strain, release });
