const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame } = require("../../src/engine.js");
const { runnerCut } = require("../../src/physics/runner_cut.js");

test("both backs can plant, and the better cutter turns sooner and retains more speed", () => {
  function turn(rating) {
    const back = { AGI: rating, JUK: rating, CUT: rating, balance: 1 };
    let vx = 8;
    let vy = 0;
    let frames = 0;
    while (Math.atan2(vy, vx) < 0.42 && frames < 80) {
      ({ vx, vy } = runnerCut(back, vx, vy, 1.05, 95, 1 / 60));
      frames++;
    }
    assert.ok(Math.atan2(vy, vx) >= 0.42);
    return { frames, speed: Math.hypot(vx, vy) };
  }

  const ordinary = turn(42);
  const agile = turn(95);
  assert.ok(agile.frames < ordinary.frames);
  assert.ok(agile.speed > ordinary.speed && agile.speed <= 8);
  const back = { AGI: 95, JUK: 95, CUT: 95, balance: 1 };
  assert.equal(runnerCut(back, 8, 0, 0, 95, 1 / 60), null);
  assert.equal(runnerCut(back, 8, 0, Math.PI, 95, 1 / 60), null);
});

test("neutral backs of both rating levels use running cuts on ordinary plays", () => {
  for (const rating of [42, 95]) {
    for (const call of ["inside", "stretch", "power", "counter", "sweep"]) {
      const game = createGame({}, 431);
      Object.assign(game.custom.RB, { AGI: rating, JUK: rating, CUT: rating });
      game.reset();
      game.debugSeed(431);
      game.select(call);
      game.snap();
      let cuts = 0;
      for (let frame = 0; frame < 240 && game.getState().phase === "live"; frame++) {
        game.step(1);
        const state = game.getState();
        const back = state.players.find((player) => player.key === "RB");
        if (state.ballCarrier === "RB" && Math.abs(back.runnerCutBank) > 0.06)
          cuts++;
      }
      assert.ok(cuts >= 4, `expected a visible cut on ${call}, rated ${rating}: ${cuts}`);
    }
  }
});
