import { clamp } from "../core/math.js";
import { DefensivePresnap } from "../ai/defensive_presnap.js";
import { InsideZoneIQ } from "../ai/inside_zone_iq.js";
import { ProtectionRead } from "../ai/protection_read.js";
import { RunPursuitPolicy } from "../ai/run_pursuit_policy.js";

export function createPlaySetup() {
  let ChaosContactEvidence,
    DefensiveMemory,
    P,
    RUNS,
    alignRoutes,
    assignCoverage,
    assignPassProtection,
    assignPassRushPlan,
    assignRunBlockMatches,
    chooseMixedCoverage,
    choosePressure,
    closeAudibles,
    create,
    emitPresentation,
    hidePlaybook,
    hud,
    kickSpecial,
    log,
    matchState,
    message,
    nextDown,
    rand,
    refreshPauseUI,
    resolvePressMatchups,
    runFitFor,
    showPlaybook,
    snapVariation,
    traceSample;

  // Inspectable on-field matchups: see whom each receiver is facing, not just
  // the overall "separation" between WR1 and whichever CB happens to be closest.

  function schemeReport() {
    emitPresentation({ type: "schemeChanged" });
  }

  function setup() {
    closeAudibles();
    matchState.scrimmagePlayCalled = false;
    matchState.paused = false;
    refreshPauseUI();
    matchState.suppressManualUntilNeutral = false;
    matchState.xHoldStart = null;
    matchState.xDiveFired = false;
    emitPresentation({ type: "rightStickReset" });
    matchState.queuedCarrierMove = null;
    matchState.players.length = 0;
    matchState.off.length = 0;
    matchState.def.length = 0;
    if (matchState.tackleDiagnostics) matchState.tackleDiagnostics.length = 0;
    if (matchState.carrierCollisionDiagnostics)
      matchState.carrierCollisionDiagnostics.length = 0;
    ChaosContactEvidence.reset();
    matchState.lastAnatomyTackle = null;
    matchState.lowDiveContacts = 0;
    matchState.lastLowDiveImpact = null;
    matchState.blockLinks.clear();
    matchState.tackleLinks.clear();
    matchState.pileState = null;
    matchState.pileStarts = 0;
    matchState.pilePushYards = 0;
    matchState.chainHits = 0;
    matchState.tackleCount = 0;
    matchState.brokenTackleCount = 0;
    matchState.blockShedCount = 0;
    matchState.hitStickCount = 0;
    matchState.impactBlockCount = 0;
    matchState.powerMoveCount = 0;
    matchState.windedHits = 0;
    matchState.standUps = 0;
    matchState.playStart = matchState.yard;
    matchState.selectedCoverage =
      matchState.coveragePreference === "mix"
        ? chooseMixedCoverage()
        : matchState.coveragePreference;
    matchState.selectedPressure = choosePressure();
    matchState.ballCarrier = null;
    matchState.ball = null;
    matchState.intended = null;
    matchState.passThrown = false;
    matchState.active = null;
    matchState.manualReceiver = false;
    matchState.airSelection = {
      offense: null,
      defense: null,
      defenderKey: null,
    };
    matchState.lastAirResult = null;
    matchState.cpuQB = {
      nextRead: 0,
      choice: null,
      reads: 0,
      passes: 0,
      lastScore: 0,
      lastRisk: 0,
      runTarget: null,
      pocketTarget: null,
    };
    matchState.lastContact = 0;
    matchState.playClock = 0;
    matchState.burstTime = 0;
    matchState.burstCool = 0;
    matchState.evadeTime = 0;
    matchState.evadeCool = 0;
    matchState.moveCooldown = 0;
    matchState.pendingPass = null;
    matchState.flash = 0;
    matchState.manualDrive = false;
    matchState.contactEnabled = true;
    const x = matchState.yard,
      ly = 26.65;
    const qbdepth =
      matchState.selectedFormation === "iform"
        ? -1.6
        : matchState.selectedFormation === "ace"
          ? -1.6
          : -4.8;
    create("QB", x + qbdepth, ly);
    create(
      "RB",
      x +
        (matchState.selectedFormation === "iform"
          ? -8.3
          : matchState.selectedFormation === "ace"
            ? -6.9
            : matchState.selectedFormation === "pistol"
              ? -9.1
              : -6.5),
      matchState.selectedFormation === "spread" ? ly + 3 : ly,
    );
    for (const [k, y] of [
      ["LT", ly - 3.6],
      ["LG", ly - 1.8],
      ["C", ly],
      ["RG", ly + 1.8],
      ["RT", ly + 3.6],
    ])
      create(k, x - 0.65, y);
    if (matchState.selectedFormation === "spread") {
      create("WR1", x - 1.2, 6.5);
      create("WR2", x - 1.2, 47);
      create("WR3", x - 2.5, 16);
      create("TE", x - 2.5, 36.2);
    } else if (matchState.selectedFormation === "trips") {
      create("WR1", x - 1.2, 7.5);
      create("WR2", x - 1.2, 47);
      create("WR3", x - 2.5, 40.7);
      create("TE", x - 2.5, 35.6);
    } else if (matchState.selectedFormation === "bunch") {
      create("WR1", x - 1.2, 6.5);
      create("WR2", x - 1.2, 43.3);
      create("WR3", x - 2.1, 48.2);
      create("TE", x - 2.5, 38.0);
    } else if (matchState.selectedFormation === "pistol") {
      create("WR1", x - 1.2, 6.5);
      create("WR2", x - 1.2, 47);
      create("WR3", x - 2.5, 15);
      create("TE", x - 2.0, 36.8);
    } else if (matchState.selectedFormation === "ace") {
      create("WR1", x - 2.3, 6.5);
      create("WR2", x - 2.3, 47);
      create("TE2", x - 0.85, ly - 5.8);
      create("TE", x - 0.85, ly + 5.8);
    } else {
      create("WR1", x - 1.2, 6.5);
      create("WR2", x - 2.3, 47);
      create("TE", x - 0.85, ly + 5.8);
      create("FB", x - 4.3, ly);
    }
    if (matchState.selectedFront === "nickel") {
      create("EDGE1", x + 1.9, ly - 5.4);
      create("DT", x + 1.7, ly - 1.6);
      create("DT2", x + 1.7, ly + 2.1);
      create("EDGE2", x + 1.9, ly + 5.8);
      create("MLB", x + 6, ly - 3.4);
      create("OLB", x + 6, ly + 5);
      create("CB1", x + 6, 6.5);
      create("CB2", x + 6, 47);
      create("CB3", x + 5, matchState.selectedFormation === "spread" ? 16 : 39);
      create("FS", x + 17, 18);
      create("SS", x + 17, 37);
    } else if (matchState.selectedFront === "base43") {
      create("EDGE1", x + 1.9, ly - 5.5);
      create("DT", x + 1.7, ly - 1.6);
      create("DT2", x + 1.7, ly + 2.2);
      create("EDGE2", x + 1.9, ly + 5.5);
      create("WILL", x + 5.5, 17);
      create("MLB", x + 5.5, ly);
      create("OLB", x + 5.5, 36);
      create("CB1", x + 6, 6.5);
      create("CB2", x + 6, 47);
      create("FS", x + 16, 18);
      create("SS", x + 16, 37);
    } else {
      create("DE3A", x + 1.7, ly - 4);
      create("NT", x + 1.7, ly);
      create("DE3B", x + 1.7, ly + 4);
      create("WILL", x + 5.5, 19);
      create("MLB", x + 5.5, 25);
      create("SAM", x + 1.9, ly + 7.0);
      create("OLB", x + 5.5, 35);
      create("CB1", x + 6, 6.5);
      create("CB2", x + 6, 47);
      create("FS", x + 16, 18);
      create("SS", x + 16, 37);
    }
    // Adjust formation geometry *before* building zone and run-fit assignments.
    // The deep safety begins compressing around the 17, while corners and LBs
    // only compress when their own actual depth approaches the goal line.
    DefensivePresnap.compressFormation(matchState.def, matchState.playStart);
    // Four rushers in nickel/base 4–3; in 3–4 one outside linebacker joins three linemen.
    for (const d of matchState.def) {
      d.rush =
        ["EDGE1", "EDGE2", "DT", "DT2", "DE3A", "DE3B", "NT"].includes(d.key) ||
        (matchState.selectedFront === "base34" && d.key === "SAM");
      d.assignment = null;
      d.recognition = clamp(0.08 + (100 - d.AWR) * 0.005, 0.08, 0.37);
      d.fit = runFitFor(d);
      d.runRead = false;
      d.readAtTime = -1;
      const secondary = d.pos === "CB" || d.pos === "FS" || d.pos === "SS";
      d.readAt = clamp(
        0.11 +
          (100 - d.PRC) * 0.009 +
          (100 - d.AWR) * 0.002 +
          (secondary ? 0.18 : 0),
        0.16,
        1.05,
      );
    }
    matchState.protectionRead = null;
    assignPassRushPlan();
    assignPassProtection();
    for (const p of matchState.players) snapVariation(p);
    assignCoverage();
    assignRunBlockMatches();
    alignRoutes();
    if (!RUNS.has(matchState.selectedPlay)) {
      for (const d of matchState.def) {
        if (d.assignment?.kind !== "man" || d.PRS < 75) continue;
        const t = P(d.assignment.target);
        if (!t || t.pos !== "WR") continue;
        d.x = Math.min(d.x, t.x + clamp(2.5 - (d.PRS - 75) * 0.017, 1.75, 2.5));
        d.y = t.y + Math.sign(d.y - t.y || 1) * 0.25;
      }
    }
    matchState.phase = "presnap";
    if (
      matchState.controlMode === "defense" &&
      !P(matchState.selectedDefenderKey)
    )
      matchState.selectedDefenderKey =
        matchState.def[0]?.key || matchState.selectedDefenderKey;
    matchState.active =
      matchState.controlMode === "defense"
        ? P(matchState.selectedDefenderKey)
        : null;
    emitPresentation({
      type: "snapControlChanged",
      text:
        matchState.gameStarted &&
        matchState.possession === matchState.controllerTeams.cpu
          ? "CPU WILL SNAP"
          : "SNAP THE BALL",
    });
    emitPresentation({
      type: "snapControlChanged",
      disabled:
        matchState.gameStarted &&
        matchState.possession === matchState.controllerTeams.cpu,
    });
    emitPresentation({ type: "playControlsLocked", locked: false });
    emitPresentation({ type: "resultHidden" });
    emitPresentation({ type: "receiverPromptsHidden" });
    message(
      "<strong>Ready.</strong> " +
        matchState.selectedFormation.toUpperCase() +
        " vs " +
        matchState.selectedFront.toUpperCase() +
        " · " +
        matchState.selectedCoverage.toUpperCase() +
        ".",
    );
    schemeReport();
    hud();
  }

  function snap(cpu = false) {
    if (matchState.phase === "live" || matchState.matchOver) return;
    if (
      matchState.gameStarted &&
      matchState.possession === matchState.controllerTeams.cpu &&
      !cpu &&
      !matchState.specialState
    )
      return;
    closeAudibles();
    if (matchState.phase === "dead") {
      nextDown();
      return;
    }
    if (matchState.phase !== "presnap") return;
    if (matchState.specialState) {
      kickSpecial();
      return;
    }
    if (matchState.tryState && !matchState.tryState.mode) {
      showPlaybook();
      return;
    }
    matchState.currentMemoryPlay =
      !matchState.specialState &&
      (!matchState.tryState || matchState.tryState.mode === "two")
        ? {
            team: matchState.possession,
            play: matchState.selectedPlay,
            kind: RUNS.has(matchState.selectedPlay) ? "run" : "pass",
            formation: matchState.selectedFormation,
            down: matchState.down,
            quarter: matchState.quarter,
            target: null,
            airYards: null,
            scramble: false,
          }
        : null;
    // Prior observations are frozen at the snap, never recomputed against
    // the offense's hidden current play. Formation alignment is visible.
    const pursuitExperience = RunPursuitPolicy.experience(
      DefensiveMemory.report(matchState.possession)?.history,
      matchState.selectedFormation,
    );
    // Read possible extra rushers from the *visible* defensive alignment.
    // This is a suspicion, not knowledge of whether the defender will actually blitz.
    matchState.protectionRead = ProtectionRead.evaluate(
      matchState.def,
      matchState.playStart,
      P("QB"),
      P("C"),
      rand(),
    );
    const visualAlert = matchState.protectionRead?.recognized
      ? matchState.protectionRead.key
      : null;
    const rbProtector = P("RB");
    if (rbProtector) rbProtector.protectionAlert = visualAlert;
    // The center communicates the look; the nearest outside lineman can help
    // only when free of his actual assignment. This is not a guaranteed blitz ID.
    const line = ["LT", "LG", "C", "RG", "RT"].map(P).filter(Boolean);
    for (const o of line) o.protectionAlert = null;
    if (visualAlert) {
      const suspicious = P(visualAlert);
      const nearest = [...line].sort(
        (a, b) => Math.abs(a.y - suspicious.y) - Math.abs(b.y - suspicious.y),
      )[0];
      if (nearest) nearest.protectionAlert = visualAlert;
      const center = P("C");
      if (center) center.protectionCall = visualAlert;
    }
    // The Inside Zone front is read at the snap, from observable defenders.
    // The combo pair remains committed until contact has played out.
    if (matchState.selectedPlay === "inside") {
      const plan = InsideZoneIQ.assignments(
        ["LT", "LG", "C", "RG", "RT"].map(P).filter(Boolean),
        matchState.def,
        matchState.playStart,
      );
      for (const o of matchState.off)
        if (plan[o.key]) {
          o.insideZonePlan = plan[o.key];
          o.blockTarget = plan[o.key].target;
        }
    }
    // Freeze the real A/B gap target at the snap; OL movement must not drag it.
    for (const d of matchState.def)
      if (d.fit)
        d.fit.gapSpot = DefensivePresnap.gapTarget(
          d,
          matchState.off,
          matchState.playStart,
        );
    hidePlaybook();
    matchState.clockRunning = true;
    matchState.phase = "live";
    matchState.gameFlowNote = "Live scrimmage";
    for (const p of matchState.players) {
      p.animationFlavor = rand();
      p.actionCue = null;
      p.airPose = null;
      // Stable per-snap misread + rare learned read. Ratings still govern how
      // much prior experience can help; no influence on coverage play calls.
      if (p.team === 1) {
        p.pursuitLateralBias = rand() * 2 - 1;
        p.pursuitDepthBias = rand() * 2 - 1;
        p.pursuitReadRoll = rand();
        p.pursuitExperience = pursuitExperience;
      }
    }
    matchState.active =
      matchState.controlMode === "defense"
        ? P(matchState.selectedDefenderKey)
        : matchState.controlMode === "line"
          ? P(matchState.selectedLinemanKey)
          : P("QB");
    matchState.playClock = 0;
    const snapHint =
      matchState.controlMode === "defense"
        ? "Read the play and pursue the ball."
        : RUNS.has(matchState.selectedPlay)
          ? "Find your lane, then burst through the hole."
          : "Choose a receiver icon or press 1–4 to throw. The QB automatically leads the route.";
    message("<strong>Ball snapped.</strong> " + snapHint);
    emitPresentation({ type: "snapControlChanged", disabled: true });
    emitPresentation({ type: "playControlsLocked", locked: true });
    log("SNAP · " + matchState.selectedPlay.toUpperCase());
    matchState.playTrace = [];
    matchState.traceAccum = 0;
    matchState.lastTraceMeta = {
      version: "v0.33",
      formation: matchState.selectedFormation,
      front: matchState.selectedFront,
      coverage: matchState.selectedCoverage,
      play: matchState.selectedPlay,
      seed: matchState.seq,
      playStart: matchState.playStart,
    };
    emitPresentation({ type: "traceReady" });
    traceSample();
    resolvePressMatchups();
    emitPresentation({ type: "fieldFocused" });
    hud();
  }

  return {
    bind(services) {
      ({
        ChaosContactEvidence,
        DefensiveMemory,
        P,
        RUNS,
        alignRoutes,
        assignCoverage,
        assignPassProtection,
        assignPassRushPlan,
        assignRunBlockMatches,
        chooseMixedCoverage,
        choosePressure,
        closeAudibles,
        create,
        emitPresentation,
        hidePlaybook,
        hud,
        kickSpecial,
        log,
        matchState,
        message,
        nextDown,
        rand,
        refreshPauseUI,
        resolvePressMatchups,
        runFitFor,
        showPlaybook,
        snapVariation,
        traceSample,
      } = services);
    },
    setup,
    snap,
  };
}
