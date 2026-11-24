const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createGame,
  getSnapshot,
  restoreSnapshot,
} = require("../../src/engine.js");
const { createTackleLinks } = require("../../src/physics/tackle_links.js");

function arrangeWrap({ kickoff, side, balance }) {
  const events = [];
  const game = createGame({ onEvent: (event) => events.push(event) }, 431);
  game.newGame();
  game.debugFinishCoinToss("heads", "receive");
  if (kickoff) {
    assert.ok(game.startKick());
    const kick = game.getMatch().specialState;
    game.debugMovePlayer("RB", 10, 4);
    game.debugMovePlayer("WR2", kick.landingX, kick.targetY);
    for (
      let tick = 0;
      tick < 300 && !game.getMatch().specialState?.returning;
      tick++
    ) {
      game.advanceTick([]);
    }
    assert.ok(game.getMatch().specialState?.returning);
  } else {
    game.reset();
    game.select("stretch");
    game.snap();
    assert.ok(game.debugForceCarrier("RB"));
  }
  const runner = game.getState().ballCarrier;
  const defender = kickoff ? "EDGE1" : "MLB";
  for (const player of game.getState().players) {
    game.debugMovePlayer(player.key, player.team ? 105 : 16, player.team ? 48 : 2);
  }
  game.debugMovePlayer(runner, 55, 26);
  game.debugSetVelocity(runner, 6, 0);
  game.debugMovePlayer(defender, side ? 55 : 54.45, side ? 26.68 : 26);
  game.debugSetDefenderState(defender, {
    face: side ? -Math.PI / 2 : 0,
    blocked: 0,
    stun: 0,
    tackleCooldown: 0,
    action: null,
  });
  game.debugSetBalance(defender, balance);
  game.debugSetVelocity(defender, 0, 0);
  return { game, events, runner, defender };
}

function resolveWrap(options) {
  const { game, events, runner, defender } = arrangeWrap(options);
  const player = (key) => game.getState().players.find((p) => p.key === key);
  events.length = 0;
  assert.ok(game.debugResolveTackle(20));
  assert.equal(game.getState().contacts.tackles[0]?.style, "wrap");
  const resume = restoreSnapshot(
    createGame({}, 987),
    JSON.parse(JSON.stringify(getSnapshot(game))),
  );
  let ticks = 20;
  while (game.getState().phase === "live" && ticks < 100) {
    game.debugResolveTackle(1);
    resume.debugResolveTackle(1);
    ticks++;
  }
  assert.equal(game.getState().phase, "dead");
  assert.deepEqual(getSnapshot(resume), getSnapshot(game));

  const ground = player(defender).ground;
  const wrap = events.find((event) => event.type === "wrapFinished");
  assert.ok(wrap);
  const finish = events.find((event) => event.type === "resultShown");
  const { yard, down, togo, contacts, ball } = game.getState();
  const arm = wrap.wraps.find((grip) => grip.defender === defender);
  assert.equal(arm.upright, !ground);
  assert.equal(wrap.pairedDefender, ground ? defender : undefined);
  if (ground) {
    assert.equal(ground.kind, "tackle");
    assert.equal(ground.from, runner);
    assert.equal(ground.stage, "fall");
    assert.ok(Number.isFinite(ground.dir));
  }
  const defenderStages = new Set();
  let runnerLandingTick;
  for (let tick = 1; tick <= 70; tick++) {
    game.advanceTick([]);
    if (player(runner).ground?.stage !== "fall") runnerLandingTick ??= tick;
    defenderStages.add(player(defender).ground?.stage);
  }
  if (ground) {
    assert.ok(defenderStages.has("winded"));
    assert.ok(defenderStages.has("rise"));
    assert.equal(player(defender).ground, null);
  }
  return {
    paired: wrap.pairedDefender,
    outcome: {
      yard, down, togo, tackles: contacts.tackleCount, ball, ticks, finish,
      runnerLandingTick,
    },
  };
}

for (const [label, setup] of [
  ["rear scrimmage wrap", { kickoff: false, side: false }],
  ["side scrimmage wrap", { kickoff: false, side: true }],
  ["rear kickoff wrap", { kickoff: true, side: false }],
]) {
  test(label + " pairs only the off-balance defender and preserves the down", () => {
    const paired = resolveWrap({ ...setup, balance: 0.55 });
    const standing = resolveWrap({ ...setup, balance: 1 });
    assert.ok(paired.paired);
    assert.equal(standing.paired, undefined);
    assert.deepEqual(paired.outcome, standing.outcome);
  });
}

test("a group finish grounds only the strongest loaded wrap", () => {
  const tackle = createTackleLinks();
  const runner = { key: "RB", x: 50, y: 26, stam: 1 };
  const events = [];
  const finishes = [];
  tackle.bind({
    P: () => null,
    log() {},
    emitPresentation: (event) => events.push(event),
    matchState: {},
    finish: (type, spot) => finishes.push({ type, spot }),
  });
  function contact(key, style, x, active = true) {
    return {
      d: { key, pos: "LB", x: 49, y: 26, vx: 2, vy: 0, face: 0,
        stam: 1, balance: 0.56, AGI: 75, STR: 75, TAK: 75 },
      t: { style, age: 0.6, grip: 0.9, quality: 0.9, initialImpulse: 100,
        supportLoad: { x, y: 0 }, attachment: { active, force: 4 } },
      hit: { closing: 1 },
    };
  }

  const weak = contact("MLB", "wrap", 0.4);
  const strong = contact("WLB", "wrap", 0.7);
  const hit = contact("SS", "hit", 1);
  const dive = contact("CB1", "dive", 1);
  const released = contact("SLB", "wrap", 1, false);
  const contacts = [weak, hit, dive, released, strong];
  tackle.finishTackle(runner, contacts, "Gang tackle");
  assert.deepEqual(finishes, [{ type: "tackle", spot: 50 }]);
  assert.deepEqual(
    contacts.filter(({ d }) => d.ground).map(({ d }) => d.key),
    ["WLB"],
  );
  assert.equal(events[0].pairedDefender, "WLB");
  assert.deepEqual(
    events[0].wraps.map(({ defender, upright }) => [defender, upright]),
    [["MLB", true], ["SLB", true], ["WLB", false]],
  );
});

