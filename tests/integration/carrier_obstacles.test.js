const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame, step } = require("../../src/engine.js");
const { readCarrierObstacle } = require("../../src/ai/carrier_obstacles.js");

function arrange({
  awareness = 99,
  agility = 99,
  speed = 6,
  play = "inside",
  carrier = "RB",
} = {}) {
  const game = createGame({}, 431);
  Object.assign(game.custom[carrier], { AWR: awareness, AGI: agility });
  game.reset();
  game.debugSeed(431);
  game.select(play);
  game.snap();
  game.debugForceCarrier(carrier);
  placeCarrierBehindBlocker(game, carrier, speed);
  return game;
}

function placeCarrierBehindBlocker(game, carrier, speed = 6) {
  const lineup = game.getState().players;
  assert.equal(lineup.length, 22);
  for (const [i, p] of lineup.entries())
    game.debugMovePlayer(p.key, 12 + (i % 11) * 3, p.team === 0 ? 3 : 49);
  game.debugMovePlayer(carrier, 55, 26);
  game.debugSetVelocity(carrier, speed, 0);
}

function runner(game, carrier = "RB") {
  return game.getState().players.find(({ key }) => key === carrier);
}

function sample(
  game,
  frames,
  { blocked = false, far = false, stick, oneSide = false, carrier = "RB" } = {},
) {
  const history = [];
  for (let i = 0; i < frames; i++) {
    // A deliberately planted blocker isolates the recognition and collision timings.
    const x = far ? 73 : 60.6;
    game.debugMovePlayer("LG", x, 26);
    if (blocked || oneSide) game.debugMovePlayer("C", x, 24.85);
    if (blocked) game.debugMovePlayer("RG", x, 27.15);
    if (stick) step(game, [{ type: "controls", move: stick }]);
    else game.step(1);
    history.push(runner(game, carrier));
  }
  return history;
}

test("awareness controls reaction time and agility governs clearance on the same approach", () => {
  for (const awareness of [35, 99]) {
    for (const agility of [35, 99]) {
      const game = arrange({ awareness, agility });
      const history = sample(game, 44);
      const firstRead = history.findIndex((p) => p.intentTarget === "LG");
      if (awareness === 99)
        assert.ok(firstRead >= 4 && firstRead <= 9, firstRead);
      else assert.equal(firstRead, -1);
      const last = history.at(-1);
      if (awareness === 99 && agility === 99) {
        assert.ok(last.x > 60.6 && last.y < 25.4, last);
        assert.equal(game.debugIndirectContact(), null);
      } else {
        assert.equal(game.debugIndirectContact().kind, "teammate-bump");
      }
      assert.equal(last.ground, null);
    }
  }
});

test("awareness needs a real gap and has a bounded recognition distance", () => {
  const blocked = arrange();
  assert.ok(
    sample(blocked, 44, { blocked: true }).every(
      (p) => p.intentTarget !== "LG",
    ),
  );
  assert.equal(blocked.debugIndirectContact().kind, "teammate-bump");
  const far = arrange();
  assert.ok(sample(far, 20, { far: true }).every((p) => p.y === 26));
  const oneSide = arrange();
  assert.ok(sample(oneSide, 44, { oneSide: true }).at(-1).y > 26.6);
});

test("slow and fast approaches leave time to react with different outcomes", () => {
  const slow = arrange({ speed: 2 });
  const fast = arrange({ speed: 9 });
  const slowFrames = sample(slow, 72);
  const fastFrames = sample(fast, 44);
  assert.ok(
    slowFrames.findIndex((p) => p.intentTarget === "LG") >
      fastFrames.findIndex((p) => p.intentTarget === "LG"),
  );
  const slowImpact = slow.debugIndirectContact();
  const fastImpact = fast.debugIndirectContact();
  assert.equal(slowImpact.outcome, "deflect");
  assert.ok(slowImpact.impulse < fastImpact.impulse * 0.4);
  assert.ok(slowFrames.at(-1).x > 60.6);
  assert.equal(fastImpact.kind, "teammate-bump");
  // The first recognition tick changes the steering target, not the velocity directly.
  const index = fastFrames.findIndex((p) => p.intentTarget === "LG");
  const before = fastFrames[index - 1];
  const after = fastFrames[index];
  assert.ok(Math.hypot(after.vx - before.vx, after.vy - before.vy) < 0.35);
});

test("manual steering interrupts the sidestep and releasing the stick coasts", () => {
  const game = arrange();
  assert.equal(sample(game, 8).at(-1).intentTarget, "LG");
  const steered = sample(game, 10, { stick: { x: 0.6, y: 0.8, mag: 1 } });
  assert.ok(
    steered.every(
      (p) => p.intent === "carry-manual" && p.intentTarget === "user",
    ),
  );
  assert.ok(steered.at(-1).vy > 0);
  const neutral = sample(game, 5, { stick: { x: 0, y: 0, mag: 0 } });
  assert.ok(neutral.every((p) => p.intent === "carry-coast"));
});

test("a saved read resumes on the same tick after restoring a snapshot", () => {
  const game = arrange();
  sample(game, 4);
  const restored = createGame({}, 17);
  restored.restoreSnapshot(JSON.parse(JSON.stringify(game.captureSnapshot())));
  assert.deepEqual(sample(restored, 18), sample(game, 18));
});

for (const play of ["inside", "stretch"]) {
  test(`an ordinary ${play} handoff sees the center and starts turning before contact`, () => {
    const game = createGame({}, 431);
    game.reset();
    game.debugSeed(431);
    game.select(play);
    game.snap();
    let read;
    let prior;
    for (let tick = 0; tick < 100; tick++) {
      game.step(1);
      const state = game.getState();
      if (state.ballCarrier !== "RB") continue;
      const p = state.players.find(({ key }) => key === "RB");
      const center = state.players.find(({ key }) => key === "C");
      if (p.intentTarget === "C") {
        assert.equal(state.players.length, 22);
        assert.ok(center.x - p.x > 2, "the runner turned before reaching the blocker");
        assert.ok(p.vy > prior.vy, "the runner started turning away from the center");
        read = p;
        break;
      }
      prior = p;
    }
    assert.ok(read, "the normal lineup produced an obstacle read");
  });
}

for (const carrier of ["QB", "WR1"]) {
  test(`${carrier} can read the same blocker on a pass call`, () => {
    const game = arrange({ play: "verticals", carrier });
    const history = sample(game, 20, { carrier });
    const read = history.find((p) => p.intentTarget === "LG");
    assert.ok(read && read.x < 59);
    assert.ok(Math.abs(read.vy) > 0.03);
  });
}

test("the receiver who fields a kickoff can read a blocker on the return", () => {
  const game = createGame({}, 431);
  game.debugFinishCoinToss("heads", "receive");
  game.debugSeed(431);
  game.startKick();
  for (let i = 0; i < 240 && !game.getState().ballCarrier; i++) game.step(1);
  const carrier = game.getState().ballCarrier;
  assert.equal(carrier, "WR2");
  placeCarrierBehindBlocker(game, carrier);
  const history = sample(game, 20, { carrier });
  assert.ok(history.some((p) => p.intentTarget === "LG" && p.x < 59));
});

test("a blocker outside the runner's view or moving into him is not anticipated", () => {
  const player = {
    key: "RB",
    pos: "RB",
    x: 50,
    y: 25,
    vx: 6,
    vy: 0,
    face: Math.PI,
    AWR: 99,
    AGI: 99,
    balance: 1,
  };
  const blocker = { key: "LG", pos: "LG", x: 54, y: 25, vx: 0, vy: 0, face: 0 };
  const state = {
    selectedPlay: "inside",
    off: [player, blocker],
    players: [player, blocker],
    tackleLinks: new Map(),
    blockLinks: new Map(),
  };
  const radius = () => 0.4;
  assert.equal(readCarrierObstacle(player, state, radius, 1 / 60, 53.3), null);
  assert.equal(player.carrierObstacle, undefined);
  player.face = 0;
  blocker.face = Math.PI;
  assert.equal(readCarrierObstacle(player, state, radius, 1 / 60, 53.3), null);
  assert.equal(player.carrierObstacle, undefined);
  blocker.face = 0;
  blocker.indirectDrive = { x: -40, y: 0 };
  assert.equal(readCarrierObstacle(player, state, radius, 1 / 60, 53.3), null);
  assert.equal(player.carrierObstacle, undefined);
  blocker.indirectDrive = null;
  blocker.vx = -3;
  assert.equal(readCarrierObstacle(player, state, radius, 1 / 60, 53.3), null);
  assert.equal(player.carrierObstacle, undefined);
});

test("a receiver is an obstacle while screening for a teammate after the catch", () => {
  const player = {
    key: "WR1",
    pos: "WR",
    x: 50,
    y: 25,
    vx: 6,
    vy: 0,
    face: 0,
    AWR: 99,
    AGI: 99,
    balance: 1,
  };
  const blocker = {
    key: "WR2",
    pos: "WR",
    intent: "catch-route",
    x: 54,
    y: 25,
    vx: 1,
    vy: 0,
    face: 0,
  };
  const state = {
    off: [player, blocker],
    players: [player, blocker],
    tackleLinks: new Map(),
    blockLinks: new Map(),
  };
  const radius = () => 0.4;
  assert.equal(readCarrierObstacle(player, state, radius, 1 / 60, 53.3), null);
  assert.equal(player.carrierObstacle, undefined);
  blocker.intent = "catch-block";
  let turn;
  for (let i = 0; i < 8; i++)
    turn = readCarrierObstacle(player, state, radius, 1 / 60, 53.3);
  assert.equal(turn.key, "WR2");
  assert.ok(turn.slope < 0);
});
