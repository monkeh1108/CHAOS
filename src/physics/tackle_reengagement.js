import { clampFinite as clamp } from "../core/math.js";
// Require physical separation before the defender can re-engage after a broken grip.
// Not an artificial "can't tackle twice" rule: the same defender can reengage
// once he has ACTUALLY let go, regained a pursuit stance and closed the gap.
function release(defender, runner, bodyGap, clock) {
  const separation = Math.hypot(
    (runner.x || 0) - (defender.x || 0),
    (runner.y || 0) - (defender.y || 0),
  );
  defender.reengage = {
    carrier: runner.key,
    requiredGap:
      bodyGap +
      clamp(0.32 + Math.max(0, 1 - (defender.balance ?? 1)) * 0.24, 0.32, 0.56),
    releasedAt: clock,
    hasSeparated: separation > bodyGap + 0.32,
    regainedControl: false,
    contactRecovery: 0,
    lastObservedAt: clock,
  };
}
function observe(defender, runner, bodyGap, clock) {
  const state = defender.reengage;
  if (!state || state.carrier !== runner.key) return true;
  const distance = Math.hypot(runner.x - defender.x, runner.y - defender.y);
  if (distance >= state.requiredGap) state.hasSeparated = true;
  // Recovery requires balance and the end of the actual failed engagement.
  // Most escapes clear this state after genuine physical separation.
  const recovered =
    !defender.ground &&
    (defender.stun || 0) <= 0 &&
    (defender.diveRecovery || 0) <= 0 &&
    (defender.tackleCooldown || 0) <= 0 &&
    (defender.balance ?? 1) >= 0.27;
  // But two bodies can remain in contact after a failed grip. A stopped runner
  // must NOT become tackle-immune simply because separation never occurred.
  // Once the tackler has physically recovered, sustained *new* body contact
  // with a near-stationary runner may establish a fresh attempt. This is not
  // a timer-only regrip: stationary contact is essential, and a runner still
  // moving freely must separate before a second tackle can be attempted.
  const dt = clamp(clock - (state.lastObservedAt ?? clock), 0, 0.06);
  state.lastObservedAt = clock;
  const slowRunner = Math.hypot(runner.vx || 0, runner.vy || 0) < 0.85;
  const settledDefender =
    Math.hypot(defender.vx - runner.vx, defender.vy - runner.vy) < 1.45;
  const recontact =
    distance <= bodyGap + 0.035 && slowRunner && settledDefender;
  state.contactRecovery =
    recovered && recontact
      ? Math.min(0.5, (state.contactRecovery || 0) + dt)
      : 0;
  if ((state.hasSeparated || state.contactRecovery >= 0.24) && recovered) {
    defender.reengage = null;
    return true;
  }
  return false;
}
export const ChaosTackleReengagement = Object.freeze({ release, observe });
