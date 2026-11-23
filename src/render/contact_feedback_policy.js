// Presentation ONLY: no changes to forces, trip thresholds,
// action matchup odds, or possession/tackle resolution.
function label({ severity, balance, truckWon, tripped }) {
  if (tripped) return "TRIPPED";
  if (truckWon) return null; // a real TRUCK cue already describes this contact
  return severity > 0.45 && (balance < 0.78 || severity > 0.72)
    ? "STUMBLE"
    : null;
}
export const ChaosContactFeedback = Object.freeze({ label });
