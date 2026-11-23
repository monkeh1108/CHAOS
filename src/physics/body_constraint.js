import { clamp } from "../core/math.js";
// CHAOS physical body contact policy. Torso/hip pads resist interpenetration;
// limbs remain free to wrap. This is a bounded 2D core projection, not a full
// rigid-body skeletal solver. No position teleport across a long distance.
function correction(a, b, penetration, engaged = false) {
  if (penetration <= 0) return 0;
  // More authoritative for a live carrier and an actual tackler than for
  // ordinary traffic. Maximum displacement is limited on every solver pass.
  return Math.min(engaged ? 0.19 : 0.13, penetration * (engaged ? 0.89 : 0.68));
}
function minimumSeparation(ra, rb, engaged = false) {
  return ra + rb + (engaged ? 0.075 : 0);
}
export const ChaosBodyConstraint = Object.freeze({
  correction,
  minimumSeparation,
});
