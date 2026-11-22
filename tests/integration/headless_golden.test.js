const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createGame } = require("../../src/engine.js");

const goldenDirectory = path.join(__dirname, "../golden");
const logic = fs.readFileSync(path.join(goldenDirectory, "match_replay.js"), "utf8");
const replayMatch = vm.runInThisContext("(function () {\n" + logic + "\nreturn replayMatch;\n})()");

function capture(scenario) {
  const events = [];
  const game = createGame({
    random: () => 431 / 4294967296,
    onEvent: (event) => events.push(event.type),
  });
  game.debugFinishCoinToss("heads", "receive");
  if (scenario === "run" || scenario === "pass") game.reset();
  game.debugSeed(431);
  const snapshots = JSON.parse(JSON.stringify(replayMatch(game, scenario)));
  return { snapshots, events };
}

function assertBrowserSnapshot(actual, expected, location) {
  if (typeof actual === "number" && typeof expected === "number" &&
      (!Number.isInteger(actual) || !Number.isInteger(expected))) {
    // Node and Chromium can differ in the last digits of a floating-point calculation.
    assert.ok(Math.abs(actual - expected) <= 1e-10, location + ": " + actual + " != " + expected);
  } else if (actual !== null && expected !== null &&
             typeof actual === "object" && typeof expected === "object") {
    assert.equal(Array.isArray(actual), Array.isArray(expected), location);
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), location);
    for (const key of Object.keys(expected)) {
      assertBrowserSnapshot(actual[key], expected[key], location + "." + key);
    }
  } else {
    assert.equal(actual, expected, location);
  }
}

for (const scenario of ["run", "pass", "kickoff"]) {
  const { snapshots, events } = capture(scenario);
  assert.deepEqual({ snapshots, events }, capture(scenario), scenario + " repeats exactly in Node");
  const fixture = fs.readFileSync(path.join(goldenDirectory, "fixtures", scenario + ".json"), "utf8");
  assertBrowserSnapshot(snapshots, JSON.parse(fixture), scenario);
  assert.ok(events.includes("coinTossShown"), scenario);
  assert.ok(events.includes("hudChanged") && events.includes("logChanged"), scenario);
  if (scenario !== "kickoff") assert.ok(events.includes("playSelectionChanged"), scenario);
}

console.log("PASS: run, pass, and kickoff repeat exactly in Node and match browser fixtures within numeric tolerance");
