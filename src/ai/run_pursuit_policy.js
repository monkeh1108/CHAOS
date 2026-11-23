// v0.35.2: live ball-carrier pursuit with assignment-based edge containment.
// PUR (pursuit) and PRC (play recognition) *both* govern angle quality.
// Stable, per-snap misreads make lower-rated defenders imperfect without
// re-rolling a random angle every animation frame or peeking at play calls.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const rating = (v) => (Number.isFinite(v) ? clamp(v, 1, 99) : 70);
function quality(defender) {
  // A 99/99 player predicts the visible movement almost optimally. A 60/60
  // player reacts later, often chooses a worse lane, and may over-/under-run.
  // The skill does not change speed, acceleration, or tackling probability.
  const combined = 0.55 * rating(defender.PUR) + 0.45 * rating(defender.PRC);
  return clamp((combined - 50) / 49, 0, 1);
}
// Familiarity uses only *completed* rushing plays from the same visible
// formation. Even a repeated pattern leaves uncertainty; no play identity
// or current play call is consulted when choosing a pursuit lane.
function experience(history, formation) {
  const recent = Array.isArray(history) ? history.slice(-16) : [];
  let seen = 0,
    left = 0,
    right = 0;
  for (const play of recent) {
    if (play.kind !== "run" || play.formation !== formation) continue;
    seen++;
    if (play.retreatSide === "left") left++;
    else if (play.retreatSide === "right") right++;
  }
  const familiarity = (hits) =>
    hits < 2
      ? 0
      : clamp(((hits - 1) / 3) * (hits / Math.max(3, seen)), 0, 0.85);
  return { left: familiarity(left), right: familiarity(right) };
}
function plan(
  defender,
  carrier,
  base,
  { fieldWidth, peakX, enabled = true } = {},
) {
  if (
    !enabled ||
    !defender ||
    !carrier ||
    !base ||
    !Number.isFinite(fieldWidth)
  )
    return base;
  const sep = Math.hypot(carrier.x - defender.x, carrier.y - defender.y);
  // At tackling range: finish the contact rather than aim for a speculative
  // lane. This also protects the rear-contact tackle fix from v0.34.8.
  if (sep < 4.6) return { ...base, retreatRead: false };
  const baseQuality = quality(defender);
  const center = fieldWidth / 2,
    side = carrier.y < center ? -1 : 1;
  const familiarity = clamp(
    (side < 0
      ? defender.pursuitExperience?.left
      : defender.pursuitExperience?.right) || 0,
    0,
    0.85,
  );
  const retreat = Math.max(
    0,
    (Number.isFinite(peakX) ? peakX : carrier.x) - carrier.x,
  );
  const backwardSpeed = Math.max(0, -(carrier.vx || 0));
  const outwardSpeed = Math.max(0, (carrier.vy || 0) * side);
  const outsideThreat = outwardSpeed > 1.1 && Math.abs(carrier.y - center) > 5;
  // A poor defender can occasionally make an excellent *learned* read,
  // but only on the matching visible sideline escape, not on every play.
  // The one-time roll is assigned at the snap; no frame-by-frame luck.
  const opportunity =
    outsideThreat &&
    (retreat > 1 || backwardSpeed > 0.7) &&
    familiarity > 0 &&
    (defender.pursuitReadRoll ?? 1) < 0.08 + 0.67 * familiarity;
  const q = opportunity
    ? baseQuality + (1 - baseQuality) * (0.55 + 0.3 * familiarity)
    : baseQuality;
  const uncertainty = Math.pow(1 - q, 1.15);
  // Read errors are randomized once per snap, not per frame, avoiding twitchy
  // steering. Without a stored bias (e.g., debug tools), the angle is neutral.
  const lateralBias = clamp(defender.pursuitLateralBias ?? 0, -1, 1);
  const depthBias = clamp(defender.pursuitDepthBias ?? 0, -1, 1);
  const lateralError =
    lateralBias * uncertainty * Math.min(4.2, 1.8 + sep * 0.115);
  const depthError = depthBias * uncertainty * Math.min(3.6, 1.3 + sep * 0.09);
  const role = base.role || "";
  const onSide =
    (side < 0 && role === "force-left") || (side > 0 && role === "force-right");
  // Recognition is based on the runner's observable direction and history.
  // Lower PRC/PUR means the runner has to give clearer evidence of a retreat.
  const retreatRead =
    outsideThreat &&
    (retreat > 1.6 + (1 - q) * 2.0 || backwardSpeed > 1.15 + (1 - q) * 0.8);
  let x = base.x,
    y = base.y,
    mode = base.mode;
  if (onSide && outsideThreat) {
    // Force defender protects the OUTSIDE shoulder, not the runner's
    // current spot. Poor angles can drift too wide or cut too far inside.
    const cushion = clamp(0.65 + q * 1.55 + outwardSpeed * 0.24, 0.7, 3.6);
    y = clamp(
      carrier.y + side * cushion + lateralError,
      0.65,
      fieldWidth - 0.65,
    );
    const ahead = clamp(
      1.15 +
        outwardSpeed * (0.17 + 0.2 * q) +
        (retreatRead ? Math.min(1.5, retreat * 0.3) : 0),
      1.15,
      4.8,
    );
    x = Math.max(base.x, carrier.x + ahead + depthError);
    if (retreatRead) {
      // Don't let a retreating runner drag a high-recognition force defender
      // backward indefinitely. The defender still must physically get there.
      x = Math.max(x, Math.min(defender.x, carrier.x + 5.5));
    }
    mode = retreatRead ? "retreat-contain" : "edge-contain";
  } else if (retreatRead) {
    // Interior / cutback / last-line defenders take DIFFERENT lanes, so the
    // defense doesn't send all eleven players at one identical point.
    const insideGap =
      role === "cutback" ? 2.4 : role === "last-line" ? 1.5 : 1.05;
    x = Math.max(
      base.x,
      carrier.x + clamp(0.7 + q * 1.8, 0.7, 2.5) + depthError,
    );
    y = clamp(
      carrier.y - side * insideGap + lateralError,
      0.65,
      fieldWidth - 0.65,
    );
    mode = role === "last-line" ? "last-line" : "retreat-pursue";
  } else {
    // All normal open-field angles also benefit from both skills. Poor
    // players under/over-anticipate by a few yards, but never teleport and
    // correct naturally as the runner changes direction.
    const ahead = outsideThreat ? outwardSpeed * 0.16 * q : 0;
    x = Math.max(10, x + ahead + depthError);
    y = clamp(y + lateralError, 0.65, fieldWidth - 0.65);
  }
  return {
    ...base,
    x: clamp(x, 10, 110),
    y,
    mode,
    retreatRead,
    lateralThreat: outsideThreat,
    lead: base.lead,
    angleQuality: +q.toFixed(3),
    learnedRead: opportunity,
    observedFamiliarity: +familiarity.toFixed(3),
  };
}
export const RunPursuitPolicy = { plan, quality, experience };
