// Rated top speed scales in yards per second before the fatigue multiplier.
export const runningSpeed = Object.freeze({
  baseYardsPerSecond: 6.6,
  baseRating: 55,
  yardsPerSecondPerRating: 0.089,
  fatigueStaminaThreshold: 0.35,
  maximumFatiguePenalty: 0.26,
  fatigueExponent: 1.35,
});
