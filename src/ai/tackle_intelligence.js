import { clamp } from "../core/math.js";
("use strict");
// CHAOS v0.36.4r — intent/decision policy only. Nothing here creates contact.
function direction(defender, stick) {
  if (stick && stick.mag > 0.14) {
    const n = Math.max(0.001, Math.hypot(stick.x, stick.y));
    return { x: stick.x / n, y: stick.y / n };
  }
  const speed = Math.hypot(defender.vx || 0, defender.vy || 0);
  if (speed > 0.65) return { x: defender.vx / speed, y: defender.vy / speed };
  return { x: Math.cos(defender.face || 0), y: Math.sin(defender.face || 0) };
}
function selection(d, a, geometry) {
  if (!d || !a || d.ground || d.stun > 0) return "none";
  const gap = geometry.gap,
    contact = geometry.contact,
    closing = geometry.closing;
  if (gap > 3.15) return "pursue";
  const toward = geometry.facing;
  if (toward < -0.15) return "pursue";
  // A dive is a commitment when the runner is escaping beyond a normal reach,
  // not an automatic tackle from contact-distance or an artificial skill roll.
  const desperate =
    gap > contact + 0.48 &&
    gap < contact + 1.8 &&
    closing < 0.85 &&
    geometry.runnerSpeed > 3.25;
  const competent = d.TAK >= 66 && d.AGI >= 59;
  if (desperate && competent && toward > 0.35 && geometry.freeLane)
    return "tackle-dive";
  const leverage = clamp(geometry.frontality, 0, 1);
  if (
    gap <= contact + 0.27 &&
    closing > 2.5 &&
    leverage > 0.65 &&
    d.HIT >= 83 &&
    d.TAK >= 71 &&
    geometry.freeLane
  )
    return "hit-stick";
  return gap <= contact + 0.45 ? "wrap" : "pursue";
}
function impact(d, other, closing) {
  const power = clamp(
    ((d.HIT || 65) * 0.55 + (d.STR || 65) * 0.3 + (d.PMV || 65) * 0.15 - 50) /
      45,
    0.18,
    1.35,
  );
  const resistance = clamp(
    ((other.STR || 60) * 0.6 + (other.BLO || 55) * 0.4 - 50) / 45,
    0.2,
    1.4,
  );
  const strength = clamp(
    (Math.max(0, closing) * (0.21 + 0.24 * power)) / (1 + 0.32 * resistance),
    0,
    2.6,
  );
  return { strength, power, resistance };
}
export const ChaosTackleIntelligence = Object.freeze({
  direction,
  selection,
  impact,
});
