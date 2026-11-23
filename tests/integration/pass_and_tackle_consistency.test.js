const assert = require("node:assert/strict");
const test = require("node:test");
const { createGame } = require("../../src/engine.js");
const { CoverageRoutePolicy } = require("../../src/ai/coverage_route_policy.js");

test("a compressed deep half protects the end zone as a flat defender closes underneath", () => {
  const game = createGame({}, 431);
  game.reset();
  game.debugSeed(431);
  game.debugSetSpot(103);
  game.select("verticals");
  game.snap();
  game.step(80);
  const { players, coverage } = game.getState();
  const safety = players.find(({ key }) => key === "FS");
  const corner = players.find(({ key }) => key === "CB1");
  const receiver = players.find(({ key }) => key === "WR1");
  assert.equal(coverage, "cover2");
  assert.ok(safety.assignment.depth < 12);
  assert.ok(CoverageRoutePolicy.isDeepZone(safety.assignment));
  assert.ok(safety.x > 113 && safety.x > receiver.x + 4);
  assert.ok(Math.abs(corner.x - receiver.x) < 2);
  assert.ok(safety.y < safety.assignment.baseY + 3);
});

test("repeated scrimmage tackle breaks separate the stock and elite backs", () => {
  const repeatPlays = (elite) => {
    let repeated = 0;
    let breaks = 0;
    for (const seed of [410, 415, 429, 431]) {
      for (const call of ["stretch", "sweep", "inside"]) {
        const game = createGame({}, seed);
        if (elite)
          Object.assign(game.custom.RB, { TRK: 99, STR: 99, AGI: 99, ACC: 99 });
        game.reset();
        game.debugSeed(seed);
        game.select(call);
        game.snap();
        for (let tick = 0; tick < 760 && game.getState().phase === "live"; tick++)
          game.step(1);
        const count = game.getState().contacts.brokenTackleCount;
        breaks += count;
        repeated += Number(count > 1);
      }
    }
    return { breaks, repeated };
  };
  const stock = repeatPlays(false);
  const elite = repeatPlays(true);
  assert.ok(stock.breaks > 0);
  assert.equal(stock.repeated, 0);
  assert.ok(elite.repeated >= 3);
});
