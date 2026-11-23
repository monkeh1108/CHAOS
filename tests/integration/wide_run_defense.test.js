const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame } = require("../../src/engine.js");

function startRun(call, spot, seed) {
  const game = createGame({}, seed);
  game.reset();
  game.debugSeed(seed);
  game.debugSetSpot(spot);
  game.select(call);
  game.snap();
  return game;
}

for (const [call, spot, seed, nearKey, farKey, side] of [
  ["stretch", 30, 431, "FS", "SS", -1],
  ["sweep", 55, 121, "SS", "FS", 1],
]) {
  test(`${call} pursuit keeps a second safety ahead and closes the outside run`, () => {
    const game = startRun(call, spot, seed);
    game.step(80);
    const state = game.getState();
    assert.equal(state.players.length, 22);
    assert.equal(state.ballCarrier, "RB");
    const runner = state.players.find((p) => p.key === "RB");
    const near = state.players.find((p) => p.key === nearKey).pursuitPoint;
    const far = state.players.find((p) => p.key === farKey).pursuitPoint;
    assert.ok(near.x > runner.x + 5);
    assert.ok(far.x > near.x + 2);
    assert.ok((near.y - far.y) * side > 0);

    for (let frame = 80; frame < 760 && game.getState().phase === "live"; frame++)
      game.step(1);
    const finished = game.getState();
    assert.equal(finished.phase, "dead");
    assert.equal(game.getMatch().teamPoints[0], 0);
    assert.ok(finished.logs.some((line) => line.startsWith("TACKLED")));
  });
}
