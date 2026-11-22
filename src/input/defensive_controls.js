// V33: pure policy for the user's defensive face-button tackles.
// No engine globals or physics mutations: proximity selects the animation/technique.
export const DefensiveControls = Object.freeze({
  choose(button, distance, contactRadius) {
    if (button === "A") return "conservative";
    if (button !== "X") return null;
    return distance <= Math.max(1.35, contactRadius + 0.4)
      ? "hit-stick"
      : "tackle-dive";
  },
  diveRange(agi) {
    return 2.35 + Math.max(0, Math.min(99, agi) - 55) * 0.01;
  },
  conservativeGrip(tak) {
    return Math.max(0.03, Math.min(0.16, 0.06 + (tak - 60) * 0.0014));
  },
});
