const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createGridironRenderer } = require("../../src/render/renderer3d.js");
const { idleArmWeight } = require("../../src/render/animation_policy.js");

function rendererFixture() {
  const draws = [];
  const noop = () => {};
  let model, color, limb;
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
      uniform4f: (name, ...values) => {
        if (name === "uLimb") limb = values;
      },
      drawArrays: () => draws.push({ model, color, limb }),
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

function tacklePair(fixture, heading) {
  const { player, scene } = fixture;
  player.vx = 4;
  const defender = {
    ...player,
    team: 1,
    key: "LB",
    pos: "LB",
    x: player.x - Math.cos(heading) * 0.79,
    y: player.y - Math.sin(heading) * 0.79,
    face: heading,
    intent: "wrap",
    wrapReach: 1,
    wrapLinked: true,
  };
  scene.players.push(defender);
  scene.tackles = [
    { defender: defender.key, style: "wrap", age: 0.24, grip: 0.85 },
  ];
  return defender;
}

test("recorded wraps aim two distinct hands toward the runner from front, side and rear", () => {
  for (const heading of [0, Math.PI / 2, Math.PI]) {
    const fixture = rendererFixture();
    const { player, scene, draw } = fixture;
    tacklePair(fixture, heading);
    const before = structuredClone(scene);
    const palms = gloves(draw())
      .slice(2)
      .map(({ model }) => translation(model));
    assert.equal(palms.length, 2);
    const span = Math.hypot(...palms[0].map((n, i) => n - palms[1][i]));
    assert.ok(
      span > 0.16 && span < 0.66,
      "hands approach different sides of the torso",
    );
    for (const [x, y, z] of palms) {
      assert.ok(
        Math.hypot(x - player.x, z - player.y) < 0.56,
        "reach ends near the runner",
      );
      assert.ok(
        y > 0.88 && y < 1.65,
        "hands stay in the torso band: " + y + " at heading " + heading,
      );
    }
    assert.deepEqual(scene, before);
  }
});

test("each live wrap follows the runner's torso as it turns in place", () => {
  const fixture = rendererFixture();
  const { player, scene, draw } = fixture;
  const rear = tacklePair(fixture, 0);
  const rearLink = scene.tackles[0];
  const side = tacklePair(fixture, Math.PI / 2);
  side.key = "CB";
  scene.tackles[0].defender = side.key;
  scene.tackles.unshift(rearLink);
  // The renderer needs to find and pose the runner even when drawn later.
  scene.players = [rear, side, player];

  const hands = () =>
    gloves(draw())
      .slice(2)
      .map(({ model }) => translation(model));
  const initial = hands();
  assert.equal(initial.length, 4);
  player.face = Math.PI / 2;
  const turned = structuredClone(scene);
  const following = hands();
  for (const [i, palm] of following.entries()) {
    assert.ok(
      Math.hypot(...palm.map((value, axis) => value - initial[i][axis])) >
        0.025,
    );
    assert.ok(Math.hypot(palm[0] - player.x, palm[2] - player.y) < 0.6);
  }
  assert.deepEqual(scene, turned);

  scene.tackles = scene.tackles.map((link) => ({ ...link }));
  assert.notDeepEqual(hands().slice(0, 2), following.slice(0, 2));
  assert.notDeepEqual(hands().slice(2), following.slice(2));
});

test("a standing grip turns the spine and hips progressively without moving the player", () => {
  const fixture = rendererFixture();
  const { player, scene, draw } = fixture;
  const defender = tacklePair(fixture, 0);
  const segments = () => {
    const rendered = draw();
    const yaw = (matrix) => Math.atan2(matrix[2], matrix[0]);
    const chest = rendered.find(
      ({ color, model }) =>
        color === "81,193,237" && near(span(model, 1), 0.78, 1e-5),
    ).model;
    const pelvis = rendered
      .filter(
        ({ color, model }) =>
          color === "232,234,218" && near(span(model, 1), 0.37, 1e-5),
      )
      .at(-1).model;
    const knees = rendered.filter(({ limb }) => limb?.[3] === 0.415).slice(-2);
    return {
      chest: yaw(chest),
      pelvis: yaw(pelvis),
      knees: knees.map(({ limb }) => limb[0]),
    };
  };
  const initial = segments();
  player.face = Math.PI / 2;
  assert.deepEqual(
    segments(),
    initial,
    "the body does not snap on a same-tick turn",
  );
  scene.clock += 1 / 60;
  const first = segments();
  let follow;
  for (let i = 0; i < 9; i++) {
    scene.clock += 1 / 60;
    const before = structuredClone(scene);
    follow = segments();
    assert.deepEqual(scene, before);
  }
  assert.ok(first.chest > initial.chest && follow.chest > first.chest);
  assert.ok(follow.pelvis > initial.pelvis);
  assert.ok(
    Math.abs(follow.pelvis - initial.pelvis) <
      Math.abs(follow.chest - initial.chest),
  );
  assert.ok(Math.abs(follow.chest - initial.chest) < 0.44);
  assert.notDeepEqual(follow.knees, initial.knees);

  scene.tackles = [];
  defender.wrapLinked = false;
  defender.wrapReach = 0;
  defender.intent = "recover";
  defender.escapeReaction = {
    kind: "twist",
    time: 0.4,
    duration: 0.4,
    intensity: 0,
  };
  scene.clock += 1 / 60;
  const release = segments();
  defender.escapeReaction.time = 0.2;
  scene.clock += 1 / 60;
  const fading = segments();
  defender.escapeReaction = null;
  scene.clock += 1 / 60;
  const free = segments();
  assert.ok(
    Math.abs(fading.chest - free.chest) < Math.abs(release.chest - free.chest),
  );
});

test("an unreachable hand returns to a bent brace while the other arm can keep tracking", () => {
  const fixture = rendererFixture();
  const { player, scene, draw } = fixture;
  const defender = tacklePair(fixture, Math.PI / 2);
  defender.y = player.y - 0.85;
  const arms = () =>
    draw()
      .filter(({ limb, color }) => limb?.[3] === 0.43 && color === "151,118,87")
      .slice(-2);
  const initial = arms();
  player.face = Math.PI / 2;
  const turned = arms();
  assert.equal(turned.length, 2);
  assert.notDeepEqual(turned[0].limb, initial[0].limb);
  assert.ok(
    near(turned[1].limb[0], -0.49, 1e-5),
    "the far elbow goes back to the brace",
  );
  assert.ok(
    near(turned[1].limb[1], 0, 1e-5),
    "the far arm stops pulling around the runner",
  );
  assert.ok(
    Math.abs(turned[0].limb[1]) > 0.08,
    "the nearer arm still follows independently",
  );
  assert.equal(scene.tackles.length, 1);
});

test("wrap follow-through uses recorded falls and releases the hands on escape", () => {
  const f = rendererFixture();
  const { player, scene, draw } = f;
  const defender = tacklePair(f, 0);
  const hands = () =>
    gloves(draw())
      .slice(2)
      .map(({ model }) => translation(model)[1]);
  const upright = hands();
  scene.tackles = [];
  defender.intent = "recover";
  defender.wrapReach = 0;
  defender.wrapLinked = false;
  defender.escapeReaction = {
    kind: "twist",
    duration: 0.4,
    time: 0.4,
    intensity: 0.8,
  };
  const released = hands();
  assert.notDeepEqual(released, upright);
  assert.equal(defender.ground, undefined);
  defender.escapeReaction = null;
  assert.notDeepEqual(hands(), released);

  defender.intent = "wrap";
  defender.wrapReach = 1;
  defender.wrapLinked = true;
  scene.tackles = [
    { defender: defender.key, style: "wrap", age: 0.24, grip: 0.85 },
  ];
  hands();
  scene.phase = "dead";
  scene.tackles = [];
  player.ground = {
    stage: "fall",
    kind: "tackle",
    from: defender.key,
    age: 0.14,
    fall: 0.25,
  };
  const standing = hands();
  assert.equal(defender.ground, undefined);
  defender.ground = {
    stage: "fall",
    kind: "tackle",
    from: player.key,
    age: 0.17,
    fall: 0.25,
  };
  assert.ok(
    Math.max(...hands()) < Math.max(...standing),
    "only the recorded fall lowers the defender",
  );
});

test("a completed wrap renders even when no live grip was drawn", () => {
  const f = rendererFixture();
  const { scene, player, draw } = f;
  const defender = tacklePair(f, Math.PI / 2);
  scene.phase = "dead";
  scene.tackles = [];
  player.ground = {
    stage: "fall",
    kind: "tackle",
    from: defender.key,
    age: 0.045,
    fall: 0.25,
  };
  defender.wrapReach = 0;
  defender.wrapLinked = false;
  defender.intent = "whistle";
  const fallback = draw();
  scene.wrapFinish = {
    runner: player.key,
    wraps: [
      {
        defender: defender.key,
        category: "torso",
        grip: 0.8,
        angle: defender.face,
        closing: 4,
      },
    ],
  };
  const before = structuredClone(scene);
  const withFinish = draw();
  assert.notDeepEqual(gloves(withFinish).slice(2), gloves(fallback).slice(2));
  assert.notDeepEqual(
    withFinish.filter((d) => d.color === "22,34,43"),
    fallback.filter((d) => d.color === "22,34,43"),
    "stance changes along with the arms",
  );
  assert.deepEqual(scene, before);
  player.ground = null;
  const withoutFall = draw();
  delete scene.wrapFinish;
  assert.deepEqual(
    draw(),
    withoutFall,
    "a stale finish cannot pose an upright runner",
  );
});

test("the fall follows recorded momentum, pull and explicit direction into landing", () => {
  const assess = ({ vx = 0, vy = 0, pull = 0, dir, age = 0.19 }) => {
    const fixture = rendererFixture();
    const { player, scene, draw } = fixture;
    const defender = tacklePair(fixture, 0);
    scene.phase = "dead";
    scene.tackles = [];
    player.ground = {
      kind: "tackle",
      from: defender.key,
      stage: "fall",
      age,
      fall: 0.25,
      dir,
    };
    scene.wrapFinish = {
      runner: player.key,
      clock: 0,
      motion: { vx, vy, face: 0 },
      wraps: [
        {
          defender: defender.key,
          angle: 0,
          age: 0.24,
          closing: 0,
          grip: 0.85,
          pull,
        },
      ],
    };
    const torso = () => {
      const before = structuredClone(scene);
      const parts = draw().filter(({ model }) =>
        near(span(model, 1), 0.78, 1e-5),
      );
      assert.deepEqual(scene, before);
      return parts.map(({ model }) => Array.from(model.slice(4, 7)));
    };
    const [runner, tackler] = torso();
    assert.ok(tackler[1] > 0.65, "the defender is recorded as standing");
    player.ground.stage = "winded";
    return { runner, landed: torso()[0] };
  };
  const forward = assess({ vx: 5 });
  const backward = assess({ vx: 0.3, pull: 12 });
  const side = assess({ vy: 4 });
  const explicit = assess({ vx: 5, dir: -Math.PI / 2 });
  const buckle = assess({});
  assert.ok(forward.runner[0] > 0.5 && backward.runner[0] < -0.5);
  assert.ok(side.runner[2] > 0.5 && explicit.runner[2] < -0.5);
  assert.ok(
    forward.landed[0] > forward.runner[0] &&
      backward.landed[0] < backward.runner[0],
  );
  assert.ok(
    buckle.landed[1] > forward.landed[1],
    "ambiguous evidence favors a shallower buckle",
  );
});

test("finished wraps track the falling torso within reach and release at landing", () => {
  const fixture = rendererFixture();
  const { player, scene, draw } = fixture;
  const defender = tacklePair(fixture, 0);
  const hands = () =>
    gloves(draw())
      .slice(2)
      .map(({ model }) => translation(model));
  const standing = hands();
  scene.phase = "dead";
  scene.tackles = [];
  player.ground = {
    kind: "tackle",
    from: defender.key,
    stage: "fall",
    age: 0.07,
    fall: 0.25,
    dir: Math.PI / 2,
  };
  const finish = {
    runner: player.key,
    clock: scene.clock,
    motion: { vx: 0, vy: 1, face: 0 },
    wraps: [
      {
        defender: defender.key,
        angle: 0,
        age: 0.24,
        closing: 0,
        grip: 0.85,
        pull: 0,
      },
    ],
  };
  scene.wrapFinish = finish;
  const duringFall = hands();
  assert.notDeepEqual(duringFall, standing);
  scene.wrapFinish = { ...finish, motion: { ...finish.motion, vy: -1 } };
  player.ground.dir = -Math.PI / 2;
  assert.notDeepEqual(
    hands(),
    duringFall,
    "hands respond to the torso's actual fall direction",
  );
  scene.wrapFinish = finish;
  defender.x -= 0.85;
  const outOfReach = hands();
  delete scene.wrapFinish;
  assert.deepEqual(
    hands(),
    outOfReach,
    "a distant defender cannot retain the grip pose",
  );
  defender.x += 0.85;
  player.ground.stage = "winded";
  scene.wrapFinish = finish;
  const released = hands();
  delete scene.wrapFinish;
  assert.deepEqual(hands(), released, "the hands are free by landing");
});

test("wrap finish emits grip evidence captured before simulation cleanup", () => {
  const { createTackleLinks } = require("../../src/physics/tackle_links.js");
  const links = createTackleLinks();
  const runner = { key: "RB", x: 4, y: 5, stam: 1, vx: 1.4, vy: -2, face: 0.2 };
  const defender = {
    key: "LB",
    pos: "LB",
    x: 4,
    y: 4,
    stam: 1,
    vx: 0.6,
    vy: -1,
  };
  const grip = {
    style: "wrap",
    contactCategory: "torso",
    initialImpulse: 100,
    grip: 0.72,
    age: 0.24,
    attachment: { active: true, force: 11 },
  };
  const events = [];
  let finished = false;
  links.bind({
    P: () => null,
    log() {},
    matchState: { totalClock: 4 },
    finish() {
      finished = true;
      grip.grip = 0;
      grip.attachment.force = 0;
      runner.vx = defender.vy = 0;
    },
    emitPresentation(event) {
      assert.ok(finished);
      events.push(event);
    },
  });
  links.finishTackle(
    runner,
    [{ d: defender, t: grip, hit: { closing: 5 } }],
    "Wrap",
  );
  assert.deepEqual(events, [
    {
      type: "wrapFinished",
      runner: "RB",
      clock: 4,
      motion: { vx: 1.4, vy: -2, face: 0.2 },
      wraps: [
        {
          defender: "LB",
          category: "torso",
          grip: 0.72,
          angle: Math.PI / 2,
          closing: 5,
          age: 0.24,
          pull: 11,
          vx: 0.6,
          vy: -1,
          upright: true,
        },
      ],
    },
  ]);
  assert.equal(defender.ground, undefined);
});
