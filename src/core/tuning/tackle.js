// Rating contributions to active leg drive during a tackle escape.
export const escapeLegDrive = Object.freeze({
  strengthWeight: 0.51,
  truckingWeight: 0.31,
  accelerationWeight: 0.18,
  ratingFloor: 44,
  ratingSpan: 55,
});

// Grip/quality gates identify a secured wrap. Hold style changes resistance.
export const escapeHold = Object.freeze({
  secureGrip: 0.78,
  secureQuality: 0.76,
  secureDifficulty: 1.48,
  wrapDifficulty: 1.12,
  diveDifficulty: 0.94,
  brushDifficulty: 0.78,
});

// A hold must exist and the contest must build before the carrier can escape.
export const escapeProgress = Object.freeze({
  minimumGrip: 0.24,
  lightHoldGrip: 0.75,
  lightThreshold: 0.19,
  wrapThreshold: 0.62,
  minimumAgeSeconds: 0.15,
});

// Incoming speed and alignment determine how square the contact was.
export const squareContact = Object.freeze({
  opposingSpeed: 0.75,
  fullForceSpeed: 3.4,
  minimumAccuracy: 0.63,
  accuracySpan: 0.31,
  minimumSettleSquare: 0.43,
  minimumSettleGrip: 0.66,
  minimumSettleQuality: 0.55,
  maximumSettleSeconds: 0.34,
});
