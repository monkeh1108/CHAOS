// Visible pre-snap protection alert (independent of secret defensive play call).
// The QB/center can only infer a rush from alignment and ratings, not d.rush.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function evaluate(def, los, qb, center, roll) {
  if (!qb) return null;
  const candidates = def
    .filter(
      (d) =>
        !d.ground &&
        ["FS", "SS", "CB", "MLB", "OLB", "WILL", "SAM"].includes(d.pos) &&
        d.x >= los - 0.4 &&
        d.x <= los + 3.6 &&
        Math.abs(d.y - qb.y) < 19,
    )
    .map((d) => ({
      d,
      threat:
        clamp((3.6 - (d.x - los)) * 0.19, 0, 0.67) +
        (d.pos === "FS" || d.pos === "SS" || d.pos === "CB" ? 0.12 : 0.08) +
        (Math.abs(d.y - qb.y) < 9 ? 0.12 : 0),
    }))
    .sort((a, b) => b.threat - a.threat);
  if (!candidates.length)
    return { key: null, recognized: false, confidence: 0 };
  const { d, threat } = candidates[0];
  const awareness = clamp(((center?.AWR || 68) + qb.AWR) / 198, 0, 1);
  const confidence = clamp(0.12 + threat * 0.62 + awareness * 0.28, 0.12, 0.9);
  return {
    key: d.key,
    recognized: roll < confidence,
    confidence: +confidence.toFixed(3),
    visualSide: d.y < qb.y ? "left" : "right",
  };
}
function committing(d, qb, los, elapsed) {
  if (!d || !qb || elapsed > 2.7) return false;
  // Defender must be actively closing the QB and approaching the pocket.
  const dx = qb.x - d.x,
    dy = qb.y - d.y,
    dist = Math.hypot(dx, dy);
  return (
    dist < 8.5 &&
    d.x < los + 5 &&
    d.vx * dx + d.vy * dy > Math.max(0.4, dist * 0.35)
  );
}
export const ProtectionRead = { evaluate, committing };
