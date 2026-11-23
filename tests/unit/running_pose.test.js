const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  AnimationPolicy,
  runningLeg,
  runningBody,
  runningCycle,
  runningWeight,
} = require("../../src/render/animation_policy.js");

const runner = (speed) => ({ vx: speed, vy: 0, face: 0 });
function frame(speed, phase, scale = 1, side = -1) {
  const hip = [];
  hip[1] = 0;
  hip[5] = scale;
  hip[13] = 0.8 * scale;
  const cycle = { ...runningCycle(0, speed, scale), phase };
  const angles = runningLeg(cycle, speed, side, scale, hip);
  const shin = angles.hip + angles.knee;
  const pitch = shin + angles.ankle;
  const x =
    0.48 * Math.sin(angles.hip) +
    0.03 * Math.cos(angles.hip) +
    0.405 * Math.sin(shin);
  const ankleY =
    0.8 -
    0.48 * Math.cos(angles.hip) +
    0.03 * Math.sin(angles.hip) -
    0.405 * Math.cos(shin);
  const sole =
    ankleY +
    0.12 * Math.sin(pitch) -
    Math.hypot(0.185 * Math.sin(pitch), 0.0725 * Math.cos(pitch));
  return { ...angles, x, sole };
}

test("running stance follows travel and the heel recovers above the turf", () => {
  for (const height of [0.92, 1.09]) {
    for (const speed of [3.2, 5, 7.8]) {
      const a = frame(speed, 0.14, height);
      const b = frame(speed, 0.34, height);
      const swing = frame(speed, 0.7, height);
      assert.ok(Math.abs(a.sole) < 0.005 && Math.abs(b.sole) < 0.005);
      assert.ok(
        Math.abs(a.x - b.x - 0.2 * runningCycle(0, speed, 1).stride) < 0.005,
      );
      assert.ok(swing.sole > 0.1);
      assert.ok(swing.knee < b.knee - 0.35, "knee folds back during swing");
      assert.ok(
        swing.knee > -2.5,
        "avoid folding the lower leg through the thigh",
      );
      assert.deepEqual(frame(speed, 0.2, height, 1), frame(speed, 0.7, height));
    }
  }
  assert.ok(frame(7.8, 0.7).sole > frame(3.2, 0.7).sole);
});

test("the forward gait blends out on a cut and yields to action poses", () => {
  const weight = (player) =>
    runningWeight(player, AnimationPolicy.sample(player));
  assert.equal(weight(runner(0)), 0);
  assert.ok(weight(runner(2)) > 0 && weight(runner(2)) < 1);
  assert.equal(weight(runner(7.8)), 1);
  assert.ok(weight({ ...runner(7.8), face: Math.PI / 3 }) < 0.5);
  assert.equal(weight({ ...runner(7.8), face: Math.PI / 2 }), 0);
  assert.equal(
    weight({ ...runner(7.8), action: { kind: "juke", time: 0.2, age: 0 } }),
    0,
  );
  assert.equal(weight({ ...runner(7.8), ground: { stage: "fall" } }), 0);
});

test("sprinting increases stride reach and speed changes preserve phase", () => {
  const jog = runningCycle(0, 3.2, 1);
  const sprint = runningCycle(0, 7.8, 1);
  assert.ok(sprint.stride > jog.stride * 1.3);
  assert.ok(frame(7.8, 0.42).x < frame(3.2, 0.42).x - 0.12);
  const acceleration = runningCycle(0.2, 4.8, 1, jog);
  assert.equal(
    runningCycle(0.2, 7.8, 1, acceleration).phase,
    acceleration.phase,
  );
  const slower = runningCycle(0.35, 3.2, 1, acceleration);
  assert.ok(
    Math.abs(slower.phase - acceleration.phase - 0.15 / jog.stride) < 1e-9,
  );
});

test("the arm pump follows the opposite leg without changing stride phase", () => {
  const jog = { ...runningCycle(0, 3.2, 1), phase: 0.1 };
  const sprint = { ...runningCycle(0, 7.8, 1), phase: jog.phase };
  assert.ok(runningBody(sprint).armDrive > runningBody(jog).armDrive * 1.5);
  assert.ok(runningBody(sprint).lean > runningBody(jog).lean + 0.05);
  assert.ok(runningBody(sprint).elbow > runningBody(jog).elbow);
  const opposite = runningBody({ ...sprint, phase: sprint.phase + 0.5 });
  assert.ok(opposite.armDrive < 0 && opposite.pelvisYaw < 0);
  assert.ok(Math.abs(opposite.armDrive + runningBody(sprint).armDrive) < 1e-9);
});

test("acceleration adds forward lean and braking straightens the running pose", () => {
  const start = runningCycle(0, 4.5, 1, undefined, 1);
  const drive = runningCycle(0.25, 5, 1, start, 1.05);
  const slowing = runningCycle(0.25, 4, 1, start, 1.05);
  assert.ok(
    runningBody(drive).lean > runningBody({ ...drive, acceleration: 0 }).lean,
  );
  assert.ok(
    runningBody(slowing).lean <
      runningBody({ ...slowing, acceleration: 0 }).lean,
  );
  assert.ok(drive.pace > start.speed && drive.pace < drive.speed);
  assert.equal(
    runningCycle(drive.travel, drive.speed, 1, drive, drive.clock),
    drive,
  );
  assert.equal(
    runningWeight(
      { ...runner(7.8), wrapReach: 0.4 },
      AnimationPolicy.sample(runner(7.8)),
    ),
    0,
  );
});
