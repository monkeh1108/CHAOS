const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  AnimationPolicy,
  runningBody,
  runningCycle,
  upperBodyArticulation,
} = require("../../src/render/animation_policy.js");

test("waist and neck rest at their existing joint centers in neutral and contact poses", () => {
  for (const player of [
    { pos: "QB", vx: 0, vy: 0 },
    { pos: "MLB", action: { kind: "tackle-dive", time: 0.22 } },
    { pos: "RB", ground: { stage: "fall" } },
    { pos: "LT", intent: "block", blockMode: "drive" },
  ]) {
    const pose = AnimationPolicy.sample(player, true);
    assert.deepEqual(upperBodyArticulation(pose, null, 0, 0), {
      pelvisYaw: 0,
      chestYaw: 0,
      chestPitch: 0,
      neckPitch: 0,
    });
  }
});

test("planted stances can lift the eyes without moving the pelvis", () => {
  const player = { pos: "LT", vx: 0, vy: 0 };
  const pose = AnimationPolicy.sample(player, false, true);
  const base = upperBodyArticulation(pose, null, 0, 0);
  assert.equal(base.pelvisYaw, 0);
  assert.ok(base.chestPitch > 0 && base.chestPitch <= 0.055);
  assert.ok(base.neckPitch > base.chestPitch && base.neckPitch <= 0.18);
  assert.ok(pose.stanceLean + base.chestPitch + base.neckPitch < 0);
  const upright = upperBodyArticulation({ ...pose, stanceLean: 0 }, null, 0, 0);
  assert.equal(upright.chestPitch, 0);
  assert.equal(upright.neckPitch, 0);
});

test("running and juke blends retain the prior chest and pelvis rotation", () => {
  const running = runningBody({ ...runningCycle(0, 7.4, 1), phase: 0.11 });
  for (const gait of [0.3, 1]) {
    for (const cut of [0, 0.45, 1]) {
      assert.deepEqual(upperBodyArticulation({}, running, gait, cut), {
        pelvisYaw: running.pelvisYaw * gait * (1 - cut),
        chestYaw: -running.pelvisYaw * 0.8 * gait,
        chestPitch: -running.lean * gait,
        neckPitch: 0,
      });
    }
  }
});
