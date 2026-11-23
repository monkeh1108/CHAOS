const assert = require("node:assert/strict");
const { test } = require("node:test");
const { armArticulation } = require("../../src/render/animation_policy.js");

test("arm articulation adds no offset to idle and other unselected poses", () => {
  assert.equal(armArticulation(-1, null, false, false), null);
  assert.equal(armArticulation(1, "swat", false, false), null);
  assert.ok(armArticulation(-1, "swat", false, false).lift > 0);
});

test("balanced catches and blocks mirror their shoulder and palm angles", () => {
  for (const [catchKind, blocking] of [
    ["aggressive", false],
    [null, true],
  ]) {
    const left = armArticulation(-1, catchKind, blocking, false);
    const right = armArticulation(1, catchKind, blocking, false);
    assert.deepEqual(left, { ...right, yaw: -right.yaw, roll: -right.roll });
    assert.ok(right.lift > 0 && right.lift <= 0.04);
  }
});

test("possession can reach across the chest while the throw-ready wrist can flex independently", () => {
  const guiding = armArticulation(1, "possession", false, false);
  const supporting = armArticulation(-1, "possession", false, false);
  assert.ok(guiding.yaw > Math.abs(supporting.yaw) * 2);
  assert.ok(guiding.yaw < Math.PI / 4);
  const throwing = armArticulation(1, null, false, true);
  assert.ok(throwing.flex > 0 && guiding.flex < 0);
  assert.equal(throwing.lift, 0);
});
