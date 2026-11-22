import { clamp } from "../core/math.js";
import { DefensivePresnap } from "../ai/defensive_presnap.js";

export function createCoverageSetup() {
  let P, matchState, rand, skillOffense;

  function chooseMixedCoverage() {
    const choices = ["cover1", "cover2", "cover3", "quarters"];
    // Weighted toward common simple calls, with no fixed repeating sequence.
    const weights = [0.37, 0.22, 0.27, 0.14];
    let r = rand(),
      choice = choices[0];
    for (let i = 0; i < choices.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        choice = choices[i];
        break;
      }
    }
    if (
      choice === matchState.previousMixedCoverage &&
      matchState.mixRepeatCount >= 1 &&
      rand() < 0.76
    ) {
      const other = choices.filter((c) => c !== choice);
      choice = other[Math.floor(rand() * other.length)];
    }
    matchState.mixRepeatCount =
      choice === matchState.previousMixedCoverage
        ? matchState.mixRepeatCount + 1
        : 1;
    matchState.previousMixedCoverage = choice;
    return choice;
  }

  // Pressure plans alter actual rush personnel and assignments. The QB spy
  // trades underneath coverage for containment; a blitz trades coverage for a
  // fifth rusher. No invisible speed or automatic pass-rush wins are granted.
  function choosePressure() {
    if (matchState.pressurePreference !== "mix")
      return matchState.pressurePreference;
    const opts = ["balanced", "contain", "spy", "blitz", "stunt"];
    const weights = [0.22, 0.22, 0.21, 0.2, 0.15];
    let r = rand(),
      call = opts[0];
    for (let i = 0; i < opts.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        call = opts[i];
        break;
      }
    }
    if (
      call === matchState.previousPressure &&
      matchState.pressureRepeat >= 1 &&
      rand() < 0.7
    ) {
      call = opts.filter((o) => o !== call)[Math.floor(rand() * 4)];
    }
    matchState.pressureRepeat =
      call === matchState.previousPressure ? matchState.pressureRepeat + 1 : 1;
    matchState.previousPressure = call;
    return call;
  }

  function assignPassRushPlan() {
    for (const d of matchState.def) {
      d.spy = false;
      d.blitz = false;
      d.passRushLane = d.spawnY;
      d.rushEngaged = 0;
      const rating = 0.55 * d.PMV + 0.3 * d.AWR + 0.15 * d.ACC;
      const variance = clamp((100 - rating) / 60, 0.16, 0.85);
      const styleRoll = rand(),
        style =
          styleRoll < 0.34 ? "power" : styleRoll < 0.7 ? "speed" : "counter";
      d.passRushStyle = style;
      d.rushExecution = clamp(
        1 + (rand() + rand() - 1) * variance * 0.19,
        0.83,
        1.16,
      );
    }
    if (matchState.selectedPressure === "spy") {
      const spy = matchState.def
        .filter((d) => !d.rush && ["MLB", "OLB"].includes(d.pos))
        .sort(
          (a, b) =>
            b.PUR * 0.5 +
            b.AWR * 0.3 +
            b.TAK * 0.2 -
            (a.PUR * 0.5 + a.AWR * 0.3 + a.TAK * 0.2),
        )[0];
      if (spy) spy.spy = true;
    } else if (matchState.selectedPressure === "blitz") {
      const blitz = matchState.def
        .filter((d) => !d.rush && ["MLB", "OLB"].includes(d.pos))
        .sort(
          (a, b) =>
            b.PMV * 0.5 +
            b.ACC * 0.25 +
            b.AWR * 0.25 -
            (a.PMV * 0.5 + a.ACC * 0.25 + a.AWR * 0.25),
        )[0];
      if (blitz) {
        blitz.rush = true;
        blitz.blitz = true;
        blitz.passRushLane = blitz.spawnY;
      }
    } else if (matchState.selectedPressure === "stunt") {
      const interiors = matchState.def.filter(
        (d) => d.rush && ["DT", "NT", "DE"].includes(d.pos),
      );
      if (interiors.length >= 2) {
        const a = interiors[0],
          b = interiors[1];
        a.passRushStyle = "stunt";
        b.passRushStyle = "stunt";
        a.passRushLane = b.spawnY;
        b.passRushLane = a.spawnY;
      }
    }
  }

  function zone(d, tag, depth, lat, width) {
    const adjusted = DefensivePresnap.compressedDepth(
      matchState.playStart,
      depth,
    );
    d.assignment = {
      kind: "zone",
      tag,
      baseX: matchState.playStart + adjusted,
      baseY: lat,
      width,
      depth: adjusted,
      originalDepth: depth,
    };
  }

  function assignCoverage() {
    const backs = matchState.def.filter((d) => !d.rush && !d.spy),
      rec = skillOffense(),
      safety = P("FS"),
      strong = P("SS"),
      left = P("CB1"),
      right = P("CB2");
    if (matchState.selectedCoverage === "cover1") {
      for (const d of backs) zone(d, "deep-middle", 19, 26.65, 15);
      const available = backs.filter((d) => d !== safety);
      const order = [
        P("WR1"),
        P("WR2"),
        P("WR3") || P("TE2") || P("FB"),
        P("TE"),
        P("RB"),
      ].filter(Boolean);
      const priority = ["CB1", "CB2", "CB3", "OLB", "WILL", "MLB", "SAM", "SS"];
      const assigned = new Set();
      for (const t of order) {
        const candidates = available.filter((d) => !assigned.has(d.key));
        candidates.sort(
          (a, b) =>
            Math.abs(a.y - t.y) +
            (a.pos === "CB" && t.pos === "WR" ? -3 : 0) +
            priority.indexOf(a.key) * 0.02 -
            (Math.abs(b.y - t.y) +
              (b.pos === "CB" && t.pos === "WR" ? -3 : 0) +
              priority.indexOf(b.key) * 0.02),
        );
        const d = candidates[0];
        if (d) {
          d.assignment = { kind: "man", target: t.key };
          assigned.add(d.key);
        }
      }
      if (safety) zone(safety, "deep-middle", 19, 26.65, 16);
      for (const d of available) {
        if (!assigned.has(d.key)) zone(d, "robber", 7, 26.65, 14);
      }
    } else {
      const zones = [];
      if (matchState.selectedCoverage === "cover2") {
        if (safety) zone(safety, "deep-half-left", 19, 13.3, 17);
        if (strong) zone(strong, "deep-half-right", 19, 40, 17);
        if (left) zone(left, "flat-left", 3, 8, 10);
        if (right) zone(right, "flat-right", 3, 45, 10);
        zones.push(
          ["hook-left", 8, 16, 13],
          ["hook-middle", 8, 26.6, 13],
          ["hook-right", 8, 38, 13],
        );
      } else if (matchState.selectedCoverage === "cover3") {
        if (safety) zone(safety, "deep-middle", 18, 26.65, 12);
        if (left) zone(left, "deep-left", 18, 9, 13);
        if (right) zone(right, "deep-right", 18, 44, 13);
        zones.push(
          ["flat-left", 4, 8, 10],
          ["hook-left", 8, 19, 12],
          ["hook-right", 8, 34, 12],
          ["flat-right", 4, 45, 10],
        );
      } else {
        if (safety) zone(safety, "deep-quarter-inner-left", 18, 20, 9);
        if (strong) zone(strong, "deep-quarter-inner-right", 18, 34, 9);
        if (left) zone(left, "deep-quarter-outside-left", 18, 7, 10);
        if (right) zone(right, "deep-quarter-outside-right", 18, 47, 10);
        zones.push(
          ["flat-left", 5, 10, 13],
          ["hook-middle", 8, 26.6, 15],
          ["flat-right", 5, 43, 13],
        );
      }
      let free = backs.filter((d) => !d.assignment);
      // Assign short areas based on initial alignment; nearest helps nickel/4-3/3-4 adjust.
      for (const [tag, depth, lat, width] of zones) {
        if (!free.length) break;
        free.sort((a, b) => Math.abs(a.y - lat) - Math.abs(b.y - lat));
        zone(free.shift(), tag, depth, lat, width);
      }
      for (const d of free) zone(d, "hook-help", 8, d.y, 12);
    }
  }

  return {
    bind(services) {
      ({ P, matchState, rand, skillOffense } = services);
    },
    chooseMixedCoverage,
    choosePressure,
    assignPassRushPlan,
    assignCoverage,
  };
}
