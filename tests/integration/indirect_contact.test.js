const assert = require("node:assert/strict");
const test = require("node:test");

const { createGame } = require("../../src/engine.js");

function runner(game) {
  return game.getState().players.find((player) => player.key === "RB");
}

function arrange({ scenario, defenderSpeed = 0, runnerSpeed = 0, balance = 1 }) {
  const game = createGame({}, 431);
  Object.assign(game.custom.LG, { STR: 99, AWR: 99, AGI: 99, STA: 99 });
  game.reset();
  game.debugSeed(431);
  game.select("inside");
  game.snap();
  assert.equal(game.getState().players.length, 22);
  for (const [index, player] of game.getState().players.entries()) {
    game.debugMovePlayer(player.key, 12 + (index % 11) * 3, player.team === 0 ? 3 : 49);
    game.debugSetVelocity(player.key, 0, 0);
  }
  game.debugForceCarrier("RB");
  game.debugMovePlayer("RB", 50, 26);
  game.debugSetVelocity("RB", runnerSpeed, 0);
  game.debugSetBalance("RB", balance);
  if (scenario === "chain") {
    game.debugMovePlayer("C", 50.82, 26);
    game.debugMovePlayer("LG", 51.64, 26);
    game.debugMovePlayer("MLB", 52.46, 26);
  } else {
    game.debugMovePlayer("LG", scenario === "overlap" ? 50.3 : 50.9, 26);
    if (scenario === "drive") game.debugMovePlayer("MLB", 51.73, 26);
  }
  if (defenderSpeed) game.debugSetVelocity("MLB", -defenderSpeed, 0);
  return game;
}

test("stationary congestion does not produce a balance event or forward drive", () => {
  const game = arrange({ scenario: "overlap" });
  game.debugMotionOnly(4);
  assert.equal(game.debugIndirectContact(), null);
  assert.equal(runner(game).ground, null);
  assert.equal(runner(game).vx, 0);
  assert.equal(game.getState().phase, "live");
});

test("an ordinary teammate bump deflects without an opponent or automatic fall", () => {
  for (const runnerSpeed of [1.7, 8]) {
    const game = arrange({ scenario: "bump", runnerSpeed });
    game.debugMotionOnly(10);
    const event = game.debugIndirectContact();
    assert.equal(event.kind, "teammate-bump");
    assert.equal(event.defender, null);
    assert.equal(event.causalImpulse, 0);
    assert.equal(event.outcome, "deflect");
    assert.ok(runner(game).vx > 0 && runner(game).vx < runnerSpeed);
    assert.equal(runner(game).ground, null);
  }
});

test("a driven blocker passes existing momentum into the runner and can stagger him", () => {
  const game = arrange({ scenario: "drive", defenderSpeed: 7, balance: 0.45 });
  game.debugMotionOnly(4);
  const event = game.debugIndirectContact();
  assert.equal(event.kind, "driven-blocker");
  assert.equal(event.defender, "MLB");
  assert.deepEqual(event.chain, ["LG"]);
  assert.ok(event.causalImpulse > 0 && event.causalImpulse <= event.impulse);
  assert.equal(event.outcome, "stagger");
  assert.ok(runner(game).vx < 0);
  assert.equal(runner(game).ground, null);
});

test("two blockers carry the same defender's impulse through the chain", () => {
  const game = arrange({ scenario: "chain", defenderSpeed: 15 });
  game.debugMotionOnly(5);
  const event = game.debugIndirectContact();
  assert.equal(event.kind, "chain-collapse");
  assert.equal(event.defender, "MLB");
  assert.deepEqual(event.chain, ["LG", "C"]);
  assert.ok(event.causalImpulse > 0 && event.causalImpulse <= event.impulse);
  assert.equal(game.getState().phase, "live");
});

test("a severe indirect hit puts the runner down physically but needs a direct touch for a whistle", () => {
  const game = arrange({
    scenario: "drive", defenderSpeed: 6, runnerSpeed: 4, balance: 0.45,
  });
  game.debugMotionOnly(1);
  assert.equal(game.debugIndirectContact().outcome, "fall");
  assert.equal(runner(game).ground.kind, "indirect-contact");
  assert.equal(game.getState().phase, "live");
  assert.equal(game.getState().contacts.tackles.length, 0);

  game.debugMovePlayer("MLB", 85, 26);
  game.debugSetVelocity("MLB", 0, 0);
  game.debugMotionOnly(4);
  assert.equal(game.getState().phase, "live");

  const untouched = createGame({}, 431);
  untouched.restoreSnapshot(JSON.parse(JSON.stringify(game.captureSnapshot())));
  for (const [index, player] of untouched.getState().players.filter((player) => player.team === 1).entries()) {
    untouched.debugMovePlayer(player.key, 98 + index * 1.6, 49);
    untouched.debugSetVelocity(player.key, 0, 0);
  }
  untouched.step(56);
  assert.equal(untouched.getState().phase, "live");
  assert.equal(untouched.getState().ballCarrier, "RB");
  assert.equal(runner(untouched).ground, null);

  const position = runner(game);
  game.debugMovePlayer("MLB", position.x + 0.42, position.y);
  assert.equal(game.debugContactCategory("RB", "MLB").bodyContact, true);
  game.debugMotionOnly(1);
  assert.equal(game.getState().phase, "dead");
});
