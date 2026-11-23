const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createGame,
  getSnapshot,
  restoreSnapshot,
  step,
} = require("../../src/engine.js");

function restoreInFreshGame(original) {
  const roundTrip = JSON.parse(JSON.stringify(getSnapshot(original)));
  const resumed = restoreSnapshot(createGame({}, 987), roundTrip);
  assert.deepEqual(getSnapshot(resumed), roundTrip);
  return resumed;
}

function compareContinuation(original, resumed, ticks, commandAt = () => []) {
  for (let tick = 0; tick < ticks; tick++) {
    const commands = commandAt(tick);
    const expected = step(original, commands);
    const actual = step(resumed, commands);
    assert.equal(actual.state, resumed);
    assert.deepEqual(actual.events, expected.events, "events at tick " + tick);
  }
  assert.deepEqual(getSnapshot(resumed), getSnapshot(original));
}

for (const play of ["inside", "verticals"]) {
  test("restores " + play + " in progress", () => {
    const original = createGame({}, 431);
    original.debugFinishCoinToss("heads", "receive");
    original.reset();
    original.debugContactWatch(true);
    step(original, [{ type: "selectPlay", play }, { type: "snap" }]);
    if (play === "verticals") {
      for (let tick = 0; tick < 11; tick++) step(original);
      step(original, [{ type: "pass", receiver: 0, hold: 0.24 }]);
      assert.ok(original.getState().ball?.z > 0);
    } else {
      for (let tick = 0; tick < 39; tick++) step(original);
      assert.equal(original.getState().ballCarrier, "RB");
    }
    assert.equal(original.getState().phase, "live");
    const resumed = restoreInFreshGame(original);
    compareContinuation(original, resumed, 150);
    // A new drive uses the saved bootstrap random sequence as well as live RNG state.
    original.reset();
    resumed.reset();
    assert.deepEqual(getSnapshot(resumed), getSnapshot(original));
  });
}

test("restores kickoff flight through the return", () => {
  const original = createGame({}, 431);
  original.debugFinishCoinToss("heads", "receive");
  assert.ok(original.startKick());
  for (let tick = 0; tick < 30; tick++) step(original);
  assert.ok(original.getState().ball?.z > 0);
  const resumed = restoreInFreshGame(original);
  compareContinuation(original, resumed, 185);
  assert.ok(original.getMatch().specialState?.returning || original.getState().phase === "dead");
});

test("rejects invalid commands before changing the game", () => {
  const game = createGame({}, 431);
  const before = getSnapshot(game);
  assert.throws(
    () => step(game, [{ type: "coinToss", choice: "heads" }, { type: "unknown" }]),
    /Unknown CHAOS tick command/,
  );
  assert.deepEqual(getSnapshot(game), before);
});
