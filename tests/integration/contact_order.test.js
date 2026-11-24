const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame } = require("../../src/engine.js");

function encounter({
  speed = 8.8,
  gap = 0.62,
  offset = 0,
  face = Math.PI,
  cooldown = 0,
  defenderSpeed = speed * 0.86,
}) {
  const game = createGame({}, 431);
  game.reset();
  game.select("stretch");
  game.snap();
  for (const p of game.getState().players) {
    game.debugMovePlayer(p.key, p.team ? 108 : 16, p.team ? 48 : 2);
  }
  game.debugForceCarrier("RB");
  game.debugTackleWatch();
  game.debugMovePlayer("RB", 55, 26);
  game.debugSetVelocity("RB", speed, 0);
  game.debugMovePlayer("FS", 55 + gap, 26 + offset);
  game.debugSetVelocity("FS", -defenderSpeed, 0);
  game.debugSetDefenderState("FS", {
    face,
    blocked: 0,
    tackleCooldown: cooldown,
  });
  game.debugBodyContacts();
  game.debugResolveTackle(1);
  return {
    impact: game
      .debugCarrierCollisionImpulses()
      .find(({ pair }) => pair.includes("FS")),
    decision: game
      .debugTackleEligibility()
      .find(({ defender }) => defender === "FS"),
    defender: game.getState().players.find(({ key }) => key === "FS"),
  };
}

test("balanced square contact reaches the tackle resolver at run and sprint speed", () => {
  for (const speed of [5, 8.8]) {
    for (const offset of [0, 0.14]) {
      const result = encounter({ speed, offset });
      assert.ok(result.impact.normalNs > 240);
      assert.equal(result.decision.reason, "grip started");
      assert.ok(!result.defender.ground);
    }
  }
});

test("opposing near misses remain free and cooldown still excludes a defender", () => {
  const miss = encounter({ gap: 0.15, offset: 0.85, face: 2.5 });
  assert.equal(miss.impact, undefined);
  assert.equal(miss.decision.reason, "missed standing contact");
  const cooling = encounter({ cooldown: 0.3 });
  assert.ok(cooling.impact.normalNs > 240);
  assert.notEqual(cooling.decision.reason, "grip started");
});

test("a runner with dominant incoming momentum can still knock a defender down", () => {
  const result = encounter({ defenderSpeed: 2 });
  assert.equal(result.defender.ground?.kind, "body");
  assert.equal(result.decision.reason, "grounded");
});
