const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame } = require("../../src/engine.js");

function liveRun() {
  const game = createGame({}, 431);
  game.reset();
  game.select("inside");
  game.snap();
  for (const [i, player] of game.getState().players.entries())
    game.debugMovePlayer(player.key, 12 + (i % 11) * 3, player.team === 0 ? 3 : 49);
  game.debugForceCarrier("RB");
  game.debugTackleWatch();
  return game;
}

function collide(game, key, x, y, gap, speed) {
  game.debugMovePlayer("RB", x, y);
  game.debugMovePlayer(key, x + gap, y);
  game.debugSetVelocity("RB", speed, 0);
  game.debugSetVelocity(key, -1, 0);
  game.debugSetDefenderState(key, { face: Math.PI, blocked: 0 });
  game.debugBodyContacts();
  game.debugResolveTackle(1);
}

test("a head-on pad impact starts a real wrap even when the arms have not reached", () => {
  const game = liveRun();
  collide(game, "MLB", 55, 26, 0.73, 4);
  assert.ok(game.debugCarrierCollisionImpulses().some(
    (event) => event.pair.includes("MLB") && event.normalNs > 200,
  ));
  const firstImpact = game.getState();
  assert.equal(firstImpact.phase, "live");
  assert.ok(firstImpact.contacts.tackles.some(
    (tackle) => tackle.defender === "MLB" && tackle.grip >= 0.4,
  ));
  game.step(45);
  const finished = game.getState();
  assert.equal(finished.phase, "dead");
  assert.ok(finished.logs.some((line) => line.startsWith("TACKLED")));
  assert.equal(finished.contacts.brokenTackleCount, 0);
});

test("being just outside actual pad contact does not start a tackle", () => {
  const game = liveRun();
  collide(game, "MLB", 55, 26, 0.8, 4);
  assert.equal(game.debugCarrierCollisionImpulses().length, 0);
  assert.equal(game.getState().contacts.tackles.length, 0);
});

test("a stumble keeps the play live and a real follow-up wrap can finish it", () => {
  const game = liveRun();
  game.debugFootScenario("RB", "MLB", "dive");
  game.debugSetBalance("RB", 0.77);
  game.debugMotionOnly(5);
  const stumbled = game.getState();
  assert.equal(game.debugLowContact().lastFootContact.result, "stumble");
  assert.equal(stumbled.phase, "live");
  assert.equal(stumbled.contacts.brokenTackleCount, 0);
  const runner = stumbled.players.find(({ key }) => key === "RB");
  assert.ok(runner.stumbleTime > 0 && !runner.ground);

  game.debugMovePlayer("MLB", 103, 40);
  collide(game, "CB1", runner.x, runner.y, 0.72, 2.5);
  assert.ok(game.getState().contacts.tackles.some(({ defender }) => defender === "CB1"));
  game.step(45);
  const finished = game.getState();
  assert.equal(finished.phase, "dead");
  assert.ok(finished.logs.some((line) => line.includes("Wrapped while stumbling")));
  assert.equal(finished.contacts.brokenTackleCount, 0);
});
