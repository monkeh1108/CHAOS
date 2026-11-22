import {
  escapeLegDrive,
  escapeHold,
  escapeProgress,
} from "../core/tuning/tackle.js";
import { clampFinite as clamp } from "../core/math.js";
// Resolve escape progress as the runner and tackler sustain force.
// Doesn't teleport characters, award an animation, or roll a dice.
// GRIP is not introduced as a redundant new rating: TAK/AWR express hold technique.
function drive(runner, defender, link) {
  const forwardX = Math.cos(runner.face || 0),
    forwardY = Math.sin(runner.face || 0);
  const forwardSpeed = Math.max(
    0,
    (runner.vx || 0) * forwardX + (runner.vy || 0) * forwardY,
  );
  const stamina = clamp(runner.stam ?? 1, 0, 1),
    balance = clamp(runner.balance ?? 1, 0, 1);
  // Existing TRK, STR, ACC and mass have different roles: contact resistance,
  // lower-body force, ability to reaccelerate feet, and inertia respectively.
  const legPower = clamp(
    ((runner.STR || 55) * escapeLegDrive.strengthWeight +
      (runner.TRK || 55) * escapeLegDrive.truckingWeight +
      (runner.ACC || 55) * escapeLegDrive.accelerationWeight -
      escapeLegDrive.ratingFloor) /
      escapeLegDrive.ratingSpan,
    0,
    1,
  );
  const traction =
    clamp(0.2 + 0.8 * balance, 0, 1) * clamp(0.3 + 0.7 * stamina, 0, 1);
  // Successive physically demanding releases tax the planted legs. The load
  // decays with recovery, rather than an artificial "can't break 3 tackles" rule.
  const exertion = clamp(runner.breakExertion || 0, 0, 1);
  // A neutral-input carrier is braking. Collision velocity can still stretch
  // the grip below, but cannot supply active leg drive.
  const appliedLegPower = runner.intent === "carry-coast" ? 0 : legPower;
  const effort = clamp(
    appliedLegPower *
      traction *
      (0.55 + 0.45 * clamp(forwardSpeed / 5, 0, 1)) *
      (1 - 0.36 * exertion),
    0,
    1,
  );
  const grip = clamp(link.grip || 0, 0, 1.6),
    quality = clamp(link.quality ?? 0.65, 0, 1.25);
  const secure =
    link.style === "wrap" &&
    grip >= escapeHold.secureGrip &&
    quality >= escapeHold.secureQuality;
  const hold = clamp(
    (defender.TAK || 65) * 0.5 +
      (defender.STR || 65) * 0.3 +
      (defender.AWR || 65) * 0.2,
    0,
    99,
  );
  const defenderLeverage = clamp(
    (0.34 + 0.66 * quality) * (0.4 + (0.6 * grip) / 1.3),
    0,
    1.5,
  );
  // A controlled wrap is not defeated by the same force as a hand swipe.
  const difficulty = secure
    ? escapeHold.secureDifficulty
    : link.style === "wrap"
      ? escapeHold.wrapDifficulty
      : link.style === "dive"
        ? escapeHold.diveDifficulty
        : escapeHold.brushDifficulty;
  const opposing = clamp((hold / 100) * defenderLeverage * difficulty, 0, 1.7);
  const runnerPower =
    effort * (0.64 + 0.36 * clamp((runner.w || 210) / 230, 0.6, 1.5));
  // Side pulls and momentum can destabilize a grip, but a purely trailing
  // defender shouldn't gain the same mechanical advantage as a square wrap.
  const dx = (runner.x || 0) - (defender.x || 0),
    dy = (runner.y || 0) - (defender.y || 0),
    len = Math.max(0.001, Math.hypot(dx, dy));
  const separation = Math.max(
    0,
    (((runner.vx || 0) - (defender.vx || 0)) * dx) / len +
      (((runner.vy || 0) - (defender.vy || 0)) * dy) / len,
  );
  const tensile = clamp(separation / 8, 0, 0.45);
  const margin = runnerPower + tensile * 0.25 - opposing;
  return {
    effort,
    traction,
    legPower,
    runnerPower,
    opposing,
    margin,
    secure,
    forwardSpeed,
  };
}
function step(runner, defender, link, dt) {
  const contest = drive(runner, defender, link);
  const age = link.age || 0;
  // No grip: not a break-tackle event at all.
  if ((link.grip || 0) < escapeProgress.minimumGrip)
    return { ...contest, broken: false, progress: 0, kind: "none" };
  const lightHold =
    (link.grip || 0) < escapeProgress.lightHoldGrip || link.style !== "wrap";
  const threshold = lightHold
    ? escapeProgress.lightThreshold
    : escapeProgress.wrapThreshold;
  const gain = Math.max(0, contest.margin - (lightHold ? -0.1 : 0.09));
  const recovery = Math.max(0, -contest.margin) * 0.5;
  link.escapeProgress = clamp(
    (link.escapeProgress || 0) + dt * (gain * 2.0 - recovery * 0.85),
    0,
    1.5,
  );
  // Physical contest accumulates over time. No one-frame stat-triggered escape.
  const broken =
    age > escapeProgress.minimumAgeSeconds && link.escapeProgress >= threshold;
  return {
    ...contest,
    broken,
    progress: link.escapeProgress,
    kind: lightHold ? "break tackle" : "wrap break",
  };
}
export const ChaosTackleEscape = Object.freeze({ drive, step });
