const assert = require("node:assert/strict");
const { clamp, clampFinite, distance2D, hypot, angleFromCosine } = require("../../src/core/math.js");

// Ordinary bounds propagate NaN; contact helpers substitute the lower bound.
assert.ok(Number.isNaN(clamp(NaN, -2, 3)));
assert.equal(clamp(Infinity, -2, 3), 3);
assert.equal(clampFinite(NaN, -2, 3), -2);
assert.equal(clampFinite(Infinity, -2, 3), -2);
assert.equal(clampFinite(1, -2, 3), 1);
assert.ok(Object.is(clamp(-0, -1, 1), -0));
assert.equal(hypot(3, -4), 5);
assert.equal(distance2D({ x: 1, y: 2 }, { x: -2, y: 6 }), 5);
assert.equal(angleFromCosine(1 + Number.EPSILON), 0);
assert.equal(angleFromCosine(-1 - Number.EPSILON), Math.PI);
