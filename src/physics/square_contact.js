import { squareContact } from "../core/tuning/tackle.js";
import { clampFinite as clamp } from "../core/math.js";
// CHAOS head-on tackle policy. No animation chooses a winner: this classifier
// reads the *incoming* relative velocities and contact normal before the
// impulse solver changes them. It does not use arbitrary animation chances.
function classify(a, b, nx, ny) {
  const aNormal = (a.vx || 0) * nx + (a.vy || 0) * ny;
  const bNormal = -(b.vx || 0) * nx - (b.vy || 0) * ny;
  const aSpeed = Math.hypot(a.vx || 0, a.vy || 0),
    bSpeed = Math.hypot(b.vx || 0, b.vy || 0);
  const oppose =
    aNormal > squareContact.opposingSpeed &&
    bNormal > squareContact.opposingSpeed;
  const accuracy = Math.min(
    aNormal / Math.max(0.4, aSpeed),
    bNormal / Math.max(0.4, bSpeed),
  );
  const force = clamp(
    Math.min(aNormal, bNormal) / squareContact.fullForceSpeed,
    0,
    1,
  );
  const square = oppose
    ? clamp(
        (accuracy - squareContact.minimumAccuracy) / squareContact.accuracySpan,
        0,
        1,
      ) * force
    : 0;
  return {
    square,
    opposing: oppose,
    accuracy: clamp(accuracy, 0, 1),
    force,
    aNormal,
    bNormal,
  };
}
function settleAge(square, grip, quality, runnerBalance, runnerAction) {
  if (
    square < squareContact.minimumSettleSquare ||
    grip < squareContact.minimumSettleGrip ||
    quality < squareContact.minimumSettleQuality ||
    runnerAction === "truck" ||
    runnerAction === "stiff"
  )
    return 0;
  const gripControl = clamp(
    (grip - squareContact.minimumSettleGrip) / 0.35,
    0,
    1,
  );
  const balanceLoss = clamp((0.92 - runnerBalance) / 0.45, 0, 1);
  return clamp(
    square * (0.13 + 0.15 * gripControl + 0.1 * balanceLoss),
    0,
    squareContact.maximumSettleSeconds,
  );
}
export const ChaosSquareContact = Object.freeze({ classify, settleAge });
