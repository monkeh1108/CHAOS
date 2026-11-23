const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createGridironRenderer } = require("../../src/render/renderer3d.js");
const { idleArmWeight } = require("../../src/render/animation_policy.js");

function rendererFixture() {
  const draws = [];
  const noop = () => {};
  let model, color;
  const gl = new Proxy(
    {
      getShaderParameter: () => true,
      getProgramParameter: () => true,
      getAttribLocation: () => 0,
      getUniformLocation: (_, name) => name,
      uniformMatrix4fv: (name, _, value) => {
        if (name === "uModel") model = value;
      },
      uniform3fv: (_, values) => {
        color = values.map((v) => Math.round(v * 255)).join(",");
      },
      drawArrays: () => draws.push({ model, color }),
      readPixels: (...args) => args.at(-1).fill(0),
      isContextLost: () => false,
    },
    { get: (target, name) => target[name] ?? noop },
  );
  globalThis.window = { devicePixelRatio: 1 };
  const renderer = createGridironRenderer({
    getContext: () => gl,
    getBoundingClientRect: () => ({ width: 640, height: 360 }),
  });
  const player = {
    key: "RB",
    team: 0,
    pos: "RB",
    x: 36,
    y: 26.65,
    face: 0,
    vx: 7.2,
    vy: 0,
    travel: 0,
  };
  const scene = {
    players: [player],
    clock: 0,
    phase: "live",
    los: 36,
    first: 46,
    play: "stretch",
    carrier: player,
    tackles: [],
    blocks: [],
  };
  return {
    player,
    scene,
    draw() {
      draws.length = 0;
      renderer.draw(scene);
      return draws.slice();
    },
  };
}

const translation = (m) => m.slice(12, 15);
const span = (m, axis) => Math.hypot(...m.slice(axis * 4, axis * 4 + 3));
const near = (a, b, tolerance) => Math.abs(a - b) < tolerance;
const balls = (draws) => draws.filter((d) => d.color === "141,81,43");
const gloves = (draws) =>
  draws.filter(
    ({ model, color }) =>
      color === "232,234,218" &&
      near(span(model, 0), 0.12, 1e-5) &&
      near(span(model, 1), 0.18, 1e-5) &&
      near(span(model, 2), 0.16, 1e-5),
  );

test("one held ball follows the carrying glove through stride, juke and stiff-arm poses", () => {
  const { player, scene, draw } = rendererFixture();
  let first;
  let travel = 0;
  for (let i = 0; i < 25; i++) {
    scene.clock = i / 60;
    player.travel = i * 0.12;
    if (i === 15) {
      player.action = { kind: "juke", time: 0.32 };
      player.jukeDrive = {
        nx: 0,
        ny: 1,
        duration: 0.42,
        remaining: 0.32,
        power: 1,
      };
    } else if (i === 21) {
      player.jukeDrive = null;
      player.action = { kind: "stiff", time: 0.25 };
    }
    const drawings = draw();
    assert.equal(balls(drawings).length, 1);
    assert.equal(gloves(drawings).length, 2);
    const ball = balls(drawings)[0].model;
    const carryingGlove = gloves(drawings)[1].model;
    // The grip end stays fixed in the palm while the opposite end leans
    // inward. A center offset alone would look like a glued-on football.
    let inward = 0;
    for (let axis = 0; axis < 3; axis++) {
      const component =
        (carryingGlove[axis] * 0.078) / 0.12 -
        (carryingGlove[axis + 4] * 0.032) / 0.18 -
        (carryingGlove[axis + 8] * 0.074) / 0.16;
      const grip = ball[12 + axis] - (ball[axis + 4] * 0.122) / 0.32;
      assert.ok(near(grip, carryingGlove[12 + axis] + component, 1e-5));
      inward += (ball[axis + 4] * carryingGlove[axis + 8]) / (0.32 * 0.16);
    }
    assert.ok(inward < -0.2, "the far end tucks in while the player carries");
    first ??= translation(ball);
    travel = Math.max(
      travel,
      Math.hypot(
        ...translation(ball).map((value, axis) => value - first[axis]),
      ),
    );
  }
  assert.ok(
    travel > 0.12,
    "the held ball moves with the pose even at a fixed field position",
  );
});

test("the QB marker can show a held ball, and a pass uses only the world-space ball", () => {
  const { player, scene, draw } = rendererFixture();
  scene.carrier = null;
  scene.markerCarrier = player;
  assert.equal(balls(draw()).length, 1);

  scene.ball = { x: 38, y: 23, z: 2, flying: true };
  scene.carrier = player;
  const flight = balls(draw());
  assert.equal(flight.length, 1);
  assert.deepEqual([...translation(flight[0].model)], [38, 2, 23]);

  scene.carrier = scene.markerCarrier = scene.ball = null;
  assert.equal(balls(draw()).length, 0);
});

test("arm relaxation fades into movement and excludes ready, contact and planted poses", () => {
  assert.equal(idleArmWeight({ state: "idle", speed: 0 }), 1);
  assert.ok(near(idleArmWeight({ state: "idle", speed: 0.6 }), 0.5, 1e-9));
  assert.equal(idleArmWeight({ state: "idle", speed: 0.9 }), 0);
  assert.equal(idleArmWeight({ state: "idle", speed: 0, plant: true }), 0);
  for (const state of [
    "stance-coverage-ready",
    "block-drive",
    "air-possession",
    "engaged",
    "run",
  ]) {
    assert.equal(idleArmWeight({ state, speed: 0 }), 0);
  }
});
