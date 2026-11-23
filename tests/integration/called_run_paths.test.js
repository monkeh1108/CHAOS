const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame } = require("../../src/engine.js");

const line = ["LT", "LG", "C", "RG", "RT"];

function run(play, tick) {
  const game = createGame({}, 431);
  game.reset();
  game.debugSeed(431);
  game.select(play);
  game.snap();
  game.step(tick);
  const state = game.getState();
  assert.equal(state.players.length, 22);
  return new Map(state.players.map((p) => [p.key, p]));
}

test("the called run changes the neutral runner's approach to the line", () => {
  const inside = run("inside", 78).get("RB");
  const stretch = run("stretch", 78).get("RB");
  const power = run("power", 78).get("RB");
  const counter = run("counter", 78).get("RB");
  const sweep = run("sweep", 78).get("RB");
  assert.ok(Math.abs(inside.y - 26.65) < 1);
  assert.ok(stretch.y < inside.y - 3 && stretch.vy < -6);
  assert.ok(power.y > stretch.y + 1 && power.vy < -0.5);
  assert.ok(counter.y > inside.y + 3 && counter.vy > 2);
  assert.ok(sweep.y > inside.y + 3 && sweep.vy > 4);
  assert.ok(run("sweep", 138).get("RB").y > run("counter", 138).get("RB").y + 2.5);
});

test("the offensive line keeps play-specific leverage and guard pulls through the handoff", () => {
  for (const tick of [24, 44]) {
    const inside = run("inside", tick);
    const stretch = run("stretch", tick);
    const power = run("power", tick);
    const counter = run("counter", tick);
    const sweep = run("sweep", tick);
    const lineFlow = (players) => line.reduce((sum, key) => sum + players.get(key).vy, 0);
    assert.ok(lineFlow(stretch) < -2);
    assert.ok(lineFlow(sweep) > 3);
    assert.equal(inside.get("C").intent, "zone-combo");
    assert.equal(power.get("RG").intentTarget, "left C-gap");
    assert.ok(power.get("RG").vy < -1);
    assert.equal(counter.get("LG").intentTarget, "right C-gap");
    assert.ok(counter.get("LG").vy > 1);
    assert.equal(sweep.get("RG").intentTarget, "right C-gap");
    assert.ok(sweep.get("RG").vy > 1);
    assert.equal(stretch.get("WR1").intentTarget, "CB1");
    assert.equal(sweep.get("WR2").intentTarget, "CB2");
  }
});
