import { clamp } from "../core/math.js";
// Close-range reaction memory. Chasers follow observed movement,
// not an instantaneous translation of every carrier juke. No velocity or
// position is imposed on either athlete.
function aim(defender, carrier, base, clock) {
  if (!defender || !carrier || !base) return base;
  const distance = Math.hypot(carrier.x - defender.x, carrier.y - defender.y);
  if (distance > 5.3) {
    defender.closePursuitRead = null;
    return base;
  }
  const read = defender.closePursuitRead;
  const skill = clamp(
    ((defender.PUR || 70) * 0.43 +
      (defender.PRC || 70) * 0.3 +
      (defender.AGI || 70) * 0.27 -
      45) /
      54,
    0,
    1,
  );
  const reactDelay = 0.095 + (1 - skill) * 0.12;
  if (!read || clock - read.at >= reactDelay || clock < read.at) {
    defender.closePursuitRead = {
      x: carrier.x,
      y: carrier.y,
      vx: carrier.vx || 0,
      vy: carrier.vy || 0,
      at: clock,
    };
  }
  const known = defender.closePursuitRead;
  const age = clamp(clock - known.at, 0, 0.24);
  // A runner straight ahead remains tackleable. A cut, however, takes time
  // to register; preserve only modest prediction from a *seen* velocity.
  const prediction = clamp(0.035 + skill * 0.055 - age * 0.38, 0, 0.09);
  const x = known.x + known.vx * prediction,
    y = known.y + known.vy * prediction;
  const blend = clamp((5.3 - distance) / 2.6, 0, 0.9);
  return {
    ...base,
    x: base.x * (1 - blend) + x * blend,
    y: base.y * (1 - blend) + y * blend,
    mode: base.mode === "tackle" ? "close-read" : base.mode,
    readAge: +age.toFixed(3),
  };
}
export const ChaosPursuitReaction = Object.freeze({ aim });
