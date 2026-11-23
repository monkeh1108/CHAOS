const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame, step } = require("../../src/engine.js");
const { readCarrierObstacle } = require("../../src/ai/carrier_obstacles.js");

function arrange({ awareness = 99, agility = 99, speed = 6 } = {}) {
  const game = createGame({}, 431);
  Object.assign(game.custom.RB, { AWR: awareness, AGI: agility });
  game.reset();
  game.debugSeed(431);
  game.select("inside");
  game.snap();
  const lineup = game.getState().players;
  assert.equal(lineup.length, 22);
  for (const [i, p] of lineup.entries())
    game.debugMovePlayer(p.key, 12 + (i % 11) * 3, p.team === 0 ? 3 : 49);
  game.debugForceCarrier("RB");
  game.debugMovePlayer("RB", 55, 26);
  game.debugSetVelocity("RB", speed, 0);
  return game;
}

function runner(game) {
  return game.getState().players.find(({ key }) => key === "RB");
}

function sample(
  game,
  frames,
  { blocked = false, far = false, stick, oneSide = false } = {},
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
    history.push(runner(game));
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
  const slowFrames = sample(slow, 56);
  const fastFrames = sample(fast, 44);
  assert.ok(
    slowFrames.findIndex((p) => p.intentTarget === "LG") >
      fastFrames.findIndex((p) => p.intentTarget === "LG"),
  );
  assert.equal(slow.debugIndirectContact(), null);
  assert.ok(slowFrames.at(-1).x > 60.6);
  assert.equal(fast.debugIndirectContact().kind, "teammate-bump");
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

test("an ordinary Inside Zone play still hands off in a full lineup", () => {
  const game = createGame({}, 431);
  game.reset();
  game.debugSeed(431);
  game.select("inside");
  game.snap();
  game.step(95);
  const state = game.getState();
  assert.equal(state.players.length, 22);
  assert.equal(state.ballCarrier, "RB");
  assert.ok(runner(game).x > state.yard);
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
  const blocker = { key: "LG", pos: "LG", x: 54, y: 25, vx: 0, vy: 0 };
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
  blocker.vx = -3;
  assert.equal(readCarrierObstacle(player, state, radius, 1 / 60, 53.3), null);
  assert.equal(player.carrierObstacle, undefined);
});
