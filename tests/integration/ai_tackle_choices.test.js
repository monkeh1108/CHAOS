const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame } = require("../../src/engine.js");
const { ChaosLowContact } = require("../../src/physics/low_contact.js");

function setupChase(hasHelp) {
  const game = createGame({}, 431);
  game.reset();
  game.select("inside");
  game.snap();
  for (const [i, p] of game.getState().players.entries())
    game.debugMovePlayer(p.key, 12 + (i % 11) * 3, p.team === 0 ? 3 : 49);
  game.debugForceCarrier("RB");
  game.debugMovePlayer("RB", 55, 26);
  game.debugMovePlayer("MLB", 53.2, 26);
  game.debugSetDefenderState("MLB", { face: 0 });
  game.debugSetVelocity("RB", 6.2, 0);
  game.debugSetVelocity("MLB", 5.5, 0);
  if (hasHelp) game.debugMovePlayer("FS", 58, 26);
  game.step(1);
  return game.getState().players.find((p) => p.key === "MLB").action;
}

test("an isolated defender can make a last-reach dive but stays up with help ahead", () => {
  assert.equal(setupChase(false)?.kind, "tackle-dive");
  assert.equal(setupChase(true), null);
});

test("a grounded defender has to settle and face the runner before reaching once", () => {
  const runner = { x: 0, y: 0, vx: 5, vy: 0, face: 0 };
  const defender = { x: 0.75, y: 0, TAK: 80, face: Math.PI };
  const reaches = (ground, face = Math.PI) => {
    const d = { ...defender, ground, face };
    return ChaosLowContact.evaluate(runner, runner, d, d, true).hit;
  };
  assert.equal(reaches({ stage: "fall", age: 0.12, fall: 0.18 }), false);
  assert.equal(reaches({ stage: "winded", age: 0.17, fall: 0.18 }), false);
  assert.equal(reaches({ stage: "winded", age: 0.33, fall: 0.18 }, 0), false);
  assert.equal(reaches({ stage: "winded", age: 0.33, fall: 0.18 }), true);
  assert.equal(reaches({ stage: "winded", age: 0.33, fall: 0.18, ankleAttempted: true }), false);
});
