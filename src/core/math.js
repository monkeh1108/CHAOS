export function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

// Some physics policies treat an invalid measurement as the lower bound.
export function clampFinite(value, low, high) {
  return clamp(Number.isFinite(value) ? value : low, low, high);
}

export function hypot(dx, dy) {
  return Math.hypot(dx, dy);
}

export function distance2D(a, b) {
  return hypot(a.x - b.x, a.y - b.y);
}

export function angleFromCosine(cosine) {
  return Math.acos(clamp(cosine, -1, 1));
}
