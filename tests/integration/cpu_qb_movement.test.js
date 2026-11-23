const assert = require("node:assert/strict");
const test = require("node:test");

const { createGame } = require("../../src/engine.js");

function quarterback(state) {
  return state.players.find((player) => player.key === "QB");
}

function snapCpuPass(play, quarterbackRatings = {}) {
  const game = createGame({ random: () => 431 / 4294967296 });
  Object.assign(game.custom.QB, quarterbackRatings);
  game.reset();
  game.debugSeed(431);
  game.select(play);
  game.debugDefensePresnap();
  game.snap(true);
  assert.equal(game.getState().phase, "live");
  assert.equal(game.getState().controlMode, "defense");
  assert.equal(game.getState().players.length, 22);
  return game;
}

function measurePlay(game) {
  const start = quarterback(game.getState());
  let lateral = 0;
  let forward = 0;
  let state = game.getState();
  for (let frame = 0; frame < 240; frame++) {
    if (state.phase !== "live" || state.passThrown || state.ballCarrier === "QB") break;
    game.step(1);
    state = game.getState();
    const qb = quarterback(state);
    if (state.passThrown) break;
    lateral = Math.max(lateral, Math.abs(qb.y - start.y));
    forward = Math.max(forward, qb.x - start.x);
  }
  return { lateral, forward, state };
}

for (const play of ["mesh", "slants"]) {
  test("CPU moves and still throws on seeded " + play, () => {
    const { lateral, forward, state } = measurePlay(snapCpuPass(play));
    assert.ok(lateral > 0.25, "QB adjusted laterally");
    assert.ok(forward > 0.5, "QB stepped forward before the throw");
    assert.equal(state.passThrown, true);
  });
}

function openLane(tendency) {
  const game = snapCpuPass("verticals", { SCT: tendency, PAT: 75, SPD: 94, ACC: 94 });
  for (const player of game.getState().players) {
    if (player.key === "QB") continue;
    game.debugMovePlayer(player.key, player.team === 0 ? 51 : 99, player.y < 26 ? 3 : 50);
    game.debugSetVelocity(player.key, 0, 0);
  }
  return game;
}

test("open lane produces a mobile QB scramble and a pocket QB pass", () => {
  const mobile = openLane(95);
  const mobileResult = measurePlay(mobile);
  assert.ok(mobileResult.forward > 4);
  assert.equal(mobileResult.state.ballCarrier, "QB");
  assert.equal(mobile.passTo(0, 0.25), false);
  assert.equal(mobile.getState().passThrown, false);
  assert.equal(measurePlay(openLane(20)).state.passThrown, true);
});

for (const side of [-1, 1]) {
  test("CPU slides away from a free rusher on side " + side, () => {
    const game = snapCpuPass("verticals");
    const start = quarterback(game.getState());
    const [engaged, free] = game.getState().players.filter(
      (player) => player.rush,
    );
    for (const player of game.getState().players) {
      if (player.key === "QB") continue;
      game.debugMovePlayer(
        player.key,
        player.team === 0 ? 51 : 99,
        player.y < 26 ? 3 : 50,
      );
    }
    game.debugMovePlayer(engaged.key, start.x, start.y - side * 3.4);
    game.debugSetDefenderState(engaged.key, { blocked: 0.8 });
    game.debugMovePlayer(free.key, start.x, start.y + side * 3.6);
    game.debugSetVelocity(free.key, 0, -side * 4);

    game.step(10);

    const state = game.getState();
    assert.equal(state.phase, "live");
    assert.equal(state.passThrown, false);
    assert.equal(state.cpuQB.runTarget, null);
    assert.ok(
      (start.y - quarterback(state).y) * side > 0.05,
      "QB starts sliding away from the free rusher despite a closer, engaged defender",
    );
  });
}
