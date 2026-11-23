import { clamp } from "../core/math.js";

// Redirect existing momentum when the runner plants to change lanes.
// Larger reversals still brake through the ordinary movement step.
export function runnerCut(player, vx, vy, targetAngle, mass, dt) {
  const speed = Math.hypot(vx, vy);
  const difference = targetAngle - Math.atan2(vy, vx);
  const turn = Math.atan2(Math.sin(difference), Math.cos(difference));
  const magnitude = Math.abs(turn);
  if (speed < 2.4 || magnitude < 0.17 || magnitude > 2.15) return null;

  const skill = clamp(
    (player.AGI * 0.55 + (player.JUK ?? 65) * 0.30 +
      (player.CUT ?? 65) * 0.15 - 25) / 74,
    0,
    1,
  );
  const balance = clamp(player.balance, 0.4, 1);
  const plantRate = (1.35 + 2.55 * skill) * balance * Math.pow(95 / mass, 0.14);
  const angle = clamp(turn, -plantRate * dt, plantRate * dt) /
    (1 + Math.max(0, speed - 5) * 0.10);
  const retained = 1 - Math.abs(angle) * (0.44 - 0.32 * skill) * (1 + magnitude * 0.2);
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    vx: (vx * c - vy * s) * retained,
    vy: (vy * c + vx * s) * retained,
    bank: clamp(turn * 0.34, -0.24, 0.24) * balance,
  };
}
