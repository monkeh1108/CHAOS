const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  AnimationPolicy,
  jukeBody,
  jukeLegTarget,
  runningLegTarget,
  solveGroundedLeg,
  runningBody,
  runningCycle,
  runningWeight,
} = require("../../src/render/animation_policy.js");

const runner = (speed) => ({ vx: speed, vy: 0, face: 0 });
function frame(speed, phase, scale = 1, side = -1) {
  const hip = hipMatrix(0, 0, 0, scale);
  const cycle = { ...runningCycle(0, speed, scale), phase };
  const target = runningLegTarget(cycle, speed, side, scale);
  const angles = solveGroundedLeg(target, side, scale, hip);
  const shin = angles.hip + angles.knee;
  const pitch = angles.pitch;
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
  return { hip: angles.hip, knee: angles.knee, pitch, x, sole };
}

function hipMatrix(x, z, facing, scale = 1, height = 0.8) {
  const c = scale * Math.cos(facing);
  const s = scale * Math.sin(facing);
  return [c, 0, s, 0, 0, scale, 0, 0, -s, 0, c, 0, x, height * scale, z, 1];
}

function ankleWorld(leg, hip) {
  const shin = leg.hip + leg.knee;
  const x =
    0.03 * Math.cos(leg.hip) +
    0.48 * Math.sin(leg.hip) +
    0.405 * Math.sin(shin);
  const down =
    0.03 * Math.sin(leg.hip) -
    0.48 * Math.cos(leg.hip) -
    0.405 * Math.cos(shin);
  const z = down * Math.sin(leg.roll);
  return [
    hip[12] + hip[0] * x + hip[8] * z,
    hip[14] + hip[2] * x + hip[10] * z,
  ];
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

test("support stays on the same field point through pelvis rotation and angled travel", () => {
  for (const scale of [0.92, 1.09]) {
    const speed = 5;
    const cycle = runningCycle(0, speed, scale);
    let plant;
    let maximumDrift = 0;
    let unlockedDrift = 0;
    let start;
    for (let i = 0; i <= 10; i++) {
      const phase = 0.1 + i * 0.021;
      const target = runningLegTarget({ ...cycle, phase }, speed, -1, scale);
      const hip = hipMatrix(
        cycle.stride * (phase - 0.1),
        0,
        0.36 + i * 0.008,
        scale,
      );
      const leg = solveGroundedLeg(target, -1, scale, hip, plant);
      plant = leg.plant;
      const foot = ankleWorld(leg, hip);
      if (!start) start = foot;
      maximumDrift = Math.max(
        maximumDrift,
        Math.hypot(foot[0] - start[0], foot[1] - start[1]),
      );
      const free = ankleWorld(
        solveGroundedLeg({ ...target, acquire: false }, -1, scale, hip),
        hip,
      );
      unlockedDrift = Math.max(
        unlockedDrift,
        Math.hypot(free[0] - start[0], free[1] - start[1]),
      );
    }
    assert.ok(unlockedDrift > 0.12);
    assert.ok(maximumDrift < 0.015, `support drift: ${maximumDrift} yards`);
  }
});

test("unreachable anchors release without snapping back during the same step", () => {
  const cycle = { ...runningCycle(0, 5, 1), phase: 0.11 };
  const target = runningLegTarget(cycle, 5, -1, 1);
  const initial = hipMatrix(0, 0, 0);
  const leg = solveGroundedLeg(target, -1, 1, initial);
  const tooFar = solveGroundedLeg(target, -1, 1, hipMatrix(0, 2, 0), leg.plant);
  assert.equal(tooFar.plant.weight, 0);
  assert.equal(
    solveGroundedLeg(target, -1, 1, initial, tooFar.plant).plant.weight,
    0,
  );
  const next = runningLegTarget({ ...cycle, step: cycle.step + 1 }, 5, -1, 1);
  assert.equal(
    solveGroundedLeg(next, -1, 1, initial, tooFar.plant).plant.weight,
    1,
  );
});

test("jukes mirror the outside plant, load, push-off and return to stride", () => {
  const sample = (drive, progress, prior) => {
    drive.remaining = 1 - progress;
    return jukeBody(drive, 0, prior, 6);
  };
  const right = { nx: 0, ny: 1, duration: 1, power: 1 };
  const left = { nx: 0, ny: -1, duration: 1, power: 1 };
  const loadR = sample(right, 0.12);
  const loadL = sample(left, 0.12);
  const stride = runningLegTarget(
    { ...runningCycle(0, 6, 1), phase: 0.2 },
    6,
    -1,
    1,
  );
  assert.equal(loadR.side, -1);
  assert.equal(loadL.side, 1);
  assert.equal(loadR.shift, -loadL.shift);
  assert.ok(loadR.drop > 0.07);
  const outside = jukeLegTarget(loadR, stride, -1);
  assert.equal(outside.lock, 1);
  assert.equal(outside.lift, 0);
  assert.deepEqual(outside, {
    ...jukeLegTarget(loadL, stride, 1),
    contact: right,
  });
  assert.equal(jukeLegTarget(loadR, stride, 1).lock, 0);
  const pushR = sample(right, 0.34, loadR);
  assert.ok(pushR.push > 0.9 && pushR.bank > 0);
  assert.ok(jukeLegTarget(pushR, stride, -1).pitch < -0.35);
  assert.ok(jukeLegTarget(sample(right, 0.54, pushR), stride, 1).lock > 0.9);
  const end = jukeLegTarget(sample(right, 1, pushR), stride, -1);
  for (const key of ["x", "lateral", "lift", "pitch"])
    assert.equal(end[key], stride[key]);
  // Turning mid-cut keeps the plant side, while a new move may switch it.
  assert.equal(jukeBody(right, Math.PI, loadR, 6).side, -1);
  assert.equal(jukeBody(left, 0, loadR, 6).side, 1);
});
