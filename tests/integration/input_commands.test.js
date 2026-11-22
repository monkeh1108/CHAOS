const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame, getSnapshot, step } = require("../../src/engine.js");
const { readFieldControls } = require("../../src/input/controls.js");

const touch = { x: 0, y: 0 };
const pad = {
  lx: 0, ly: 0, lt: 0, rt: 0, connected: false, previous: [],
};

test("keyboard and Xbox movement give the engine the same JSON command", () => {
  const keyboard = readFieldControls({ w: true, shift: true }, touch, pad, "3d", 0);
  const xbox = readFieldControls({}, touch, {
    ...pad, ly: -1, rt: 0.8, connected: true,
  }, "3d", 0);
  assert.deepEqual(xbox, keyboard);
  assert.deepEqual(keyboard.move, { x: 1, y: 0, mag: 1 });

  const games = [createGame({}, 431), createGame({}, 431)];
  for (const game of games) {
    game.reset();
    step(game, [{ type: "selectPlay", play: "verticals" }, { type: "snap" }]);
  }
  step(games[0], [JSON.parse(JSON.stringify(keyboard))]);
  step(games[1], [JSON.parse(JSON.stringify(xbox))]);
  assert.deepEqual(getSnapshot(games[0]), getSnapshot(games[1]));
});

test("the local slot can receive as Away or cover Home", () => {
  for (const [choice, possession, role] of [["receive", 1, "offense"], ["kick", 0, "defense"]]) {
    const game = createGame({ localTeam: 1, random: () => 0.1 });
    step(game, [{ type: "coinToss", playerSlot: 1, choice: "heads" }]);
    assert.equal(game.getCoinToss().winner, 1);
    step(game, [{ type: "coinToss", playerSlot: 1, choice }]);
    assert.equal(game.getMatch().possession, possession);
    assert.equal(game.getState().controlMode, role);
  }
});

test("CPU play calls and snaps use the shared command path", () => {
  const game = createGame({}, 431);
  game.reset();
  step(game, [
    { type: "selectPlay", playerSlot: 1, play: "verticals", formation: "spread" },
    { type: "snap", playerSlot: 1 },
  ]);
  assert.equal(game.getState().play, "verticals");
  assert.equal(game.getState().phase, "live");
  assert.throws(
    () => step(game, [{ type: "controls", playerSlot: 1, move: { x: 0, y: 1, mag: 1 } }]),
    /Unsupported CPU input command/,
  );
});
