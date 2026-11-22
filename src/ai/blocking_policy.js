// Deterministic blocking decisions, separate from steering, rendering and game rules.
// This module can be ported independently to another engine.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const stat = (p, key, fallback = 70) =>
  Number.isFinite(p?.[key]) ? p[key] : fallback;
const mass = (p) => (Number.isFinite(p?.w) ? p.w : 220);
function match(blocker, defender, helpers = 0) {
  const attack =
    0.38 * stat(blocker, "BLO") +
    0.2 * stat(blocker, "IBL") +
    0.27 * stat(blocker, "STR") +
    0.15 * stat(blocker, "AWR") +
    clamp((mass(blocker) - 220) * 0.055, -8, 8);
  const resist =
    0.35 * stat(defender, "STR") +
    0.3 * stat(defender, "PMV") +
    0.17 * stat(defender, "AGI") +
    0.18 * stat(defender, "AWR") +
    clamp((mass(defender) - 220) * 0.045, -8, 8);
  return {
    advantage: clamp(attack - resist + Math.min(2, helpers) * 9, -50, 50),
    power: stat(defender, "PMV") * 0.52 + stat(defender, "STR") * 0.48,
    agility: stat(defender, "AGI"),
  };
}
function decideDefender(defender, blocker, threatDistance = 12) {
  const gap = mass(blocker) - mass(defender);
  const skill = stat(defender, "AGI") * 0.55 + stat(defender, "AWR") * 0.45;
  const force = stat(defender, "STR") * 0.45 + stat(defender, "PMV") * 0.55;
  // Faster, lighter players prefer a path around a much stronger opponent.
  if (gap > 45 && skill > force - 5 && threatDistance > 2.4) return "maneuver";
  if (force > skill + 13 && gap < 65) return "power";
  return "engage";
}
function contact({
  blocker,
  defender,
  secured = 0,
  age = 0,
  helpers = 0,
  runner = null,
}) {
  const { advantage, power } = match(blocker, defender, helpers);
  const dx = (defender.x || 0) - (blocker.x || 0),
    dy = (defender.y || 0) - (blocker.y || 0);
  const distance = Math.max(0.001, Math.hypot(dx, dy)),
    nx = dx / distance,
    ny = dy / distance;
  const toward = runner
    ? {
        x: (runner.x || 0) - (defender.x || 0),
        y: (runner.y || 0) - (defender.y || 0),
      }
    : { x: -nx, y: -ny };
  const laneLength = Math.max(0.001, Math.hypot(toward.x, toward.y));
  const laneDot = (nx * toward.x + ny * toward.y) / laneLength;
  const hold = clamp(
    secured * 0.5 + age * 0.14 + 0.18 + advantage * 0.006,
    0.12,
    1,
  );
  const strength = clamp((0.6 + advantage * 0.012) * hold, 0.08, 1.65);
  const state =
    helpers > 0 && advantage > 5
      ? "double-team"
      : advantage > 9 && age > 0.22
        ? "drive"
        : advantage > 0 && laneDot < 0.2
          ? "seal"
          : advantage < -12 && age > 0.25
            ? "losing"
            : "stonewall";
  return {
    state,
    nx,
    ny,
    distance,
    strength,
    advantage,
    hold,
    breakBonus: advantage < -10 ? clamp((-advantage - 10) * 0.008, 0, 0.23) : 0,
  };
}
export const BlockingPolicy = Object.freeze({ match, decideDefender, contact });
