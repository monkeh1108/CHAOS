import { clamp } from "../core/math.js";

export function createPlayLifecycle() {
  let DefensiveMemory,
    PRESNAP_PLAY_SECONDS,
    TEAM_NAMES,
    advancePeriodIfNeeded,
    chooseCPUPlay,
    chooseSpecial,
    emitPresentation,
    finishReturn,
    hidePlaybook,
    hud,
    log,
    matchState,
    message,
    newPossession,
    rand,
    setup,
    setupKickoff,
    showPlaybook,
    spotText,
    startThirdQuarter,
    traceSample;

  function finish(type, x, detail) {
    if (matchState.phase !== "live") return;
    const runner = matchState.ballCarrier;
    // Presentation can follow an existing fall while the ruling takes effect now.
    const landingRunner =
      (type === "tackle" || type === "sack") &&
      runner?.ground?.kind === "tackle" &&
      runner.ground.stage === "fall"
        ? runner.key
        : null;
    if (matchState.specialState) {
      finishReturn(type, x, detail, landingRunner);
      return;
    }
    traceSample();
    // Record observed play after the whistle, before any new play can be chosen.
    if (matchState.currentMemoryPlay) {
      const played = { ...matchState.currentMemoryPlay, result: type };
      played.scramble =
        played.kind === "pass" &&
        !matchState.passThrown &&
        matchState.ballCarrier?.key === "QB";
      DefensiveMemory.record(played.team, played);
      matchState.currentMemoryPlay = null;
    }
    // A player who was heavily involved recovers less before the next snap.
    // Non-ball-carriers recover more, but prolonged sprints still have a cost.
    for (const p of matchState.players) {
      const hadBall = p.touches > 0,
        effort = clamp((p.travel || 0) / 35, 0, 1);
      // A fully exhausted athlete needs roughly three quiet plays without carrying the ball
      // to recover. Carrying again provides almost no between-play recovery.
      const recovery =
        (hadBall ? 0.015 : 0.345) * (0.85 + p.STA / 500) * (1 - effort * 0.12);
      matchState.fatigueBank[p.key] = clamp(p.stam + recovery, 0.045, 1);
    }
    matchState.pendingPass = null;
    const progressMark = matchState.pileState?.maxX ?? null;
    matchState.phase = "dead";
    matchState.blockLinks.clear();
    matchState.tackleLinks.clear();
    matchState.pileState = null;
    for (const p of matchState.players) {
      p.intent = "whistle";
      p.intentTarget = null;
      p.stiffArmHeld = false;
      p.vx = 0;
      p.vy = 0;
      p.stun = 0;
      p.ground = ["trip", "tackle"].includes(p.ground?.kind) ? p.ground : null;
      p.groundLock = 0;
    }
    if (type === "touchdown") x = 110;
    else if (
      matchState.ballCarrier &&
      type !== "incomplete" &&
      type !== "intercept"
    ) {
      x = clamp(
        type === "tackle" && progressMark !== null
          ? Math.max(matchState.ballCarrier.x, progressMark)
          : matchState.ballCarrier.x,
        10,
        110,
      );
    }
    const gained = Math.round((x - matchState.playStart) * 10) / 10;
    let heading =
      type === "touchdown"
        ? "TOUCHDOWN"
        : type === "tackle"
          ? "TACKLED"
          : type === "sack"
            ? "QUARTERBACK SACK"
            : type === "incomplete"
              ? "INCOMPLETE"
              : type === "intercept"
                ? "INTERCEPTED"
                : type === "out"
                  ? "OUT OF BOUNDS"
                  : type === "timeout"
                    ? "PLAY CLOCK EXPIRED"
                    : type.toUpperCase();
    if (matchState.tryState?.mode === "two") {
      const scored = type === "touchdown";
      if (scored) {
        matchState.teamPoints[matchState.possession] += 2;
        matchState.score = matchState.teamPoints[matchState.possession];
      }
      detail = scored
        ? "Two-point conversion GOOD · +2"
        : "Two-point conversion failed · no points";
      heading = scored ? "TWO POINTS" : "TRY FAILED";
      matchState.tryState = null;
      matchState.postWhistle = "kickoff";
      matchState.clockRunning = false;
    } else if (type === "touchdown") {
      matchState.teamPoints[matchState.possession] += 6;
      matchState.score = matchState.teamPoints[matchState.possession];
      detail = detail || "Touchdown! Six points; choose the extra-point try.";
      matchState.tryState = { team: matchState.possession };
      matchState.postWhistle = "try";
      matchState.clockRunning = false;
      matchState.flash = 2;
    }
    matchState.result = heading;
    message("<strong>" + heading + ".</strong> " + detail, landingRunner);
    emitPresentation({
      type: "resultShown",
      heading,
      detail:
        detail +
        " · " +
        (type === "intercept"
          ? "Next drive: " + spotText(clamp(120 - (x >= 110 ? 90 : x), 11, 109))
          : (gained >= 0 ? "+" : "") + gained.toFixed(1) + " yards gained"),
      action: "NEXT SNAP",
      ...(landingRunner ? { landingRunner } : {}),
    });
    log(
      heading +
        " · " +
        (type === "intercept"
          ? "change of possession at " +
            spotText(clamp(120 - (x >= 110 ? 90 : x), 11, 109))
          : (gained >= 0 ? "+" : "") + gained.toFixed(1) + " yd"),
    );
    const nYd = Math.max(10, Math.round(x * 10) / 10);
    if (
      matchState.tryState ||
      matchState.postWhistle === "kickoff" ||
      matchState.postWhistle === "try"
    ) {
      // The kickoff/try is presented after the whistle, not automatically skipped.
    } else if (type === "intercept") {
      // Spot the ball where the interception was secured, not where the throw began.
      // An end-zone interception is a touchback to the defender's own 20.
      // Interception returns are not live yet; they need a separate possession-state update.
      newPossession(1 - matchState.possession, nYd >= 110 ? 90 : nYd);
      matchState.postWhistle = "scrimmage";
      matchState.clockRunning = false;
    } else {
      matchState.yard =
        type === "incomplete" || type === "timeout"
          ? matchState.playStart
          : nYd;
      if (
        type === "safety" ||
        (["tackle", "sack", "out", "down"].includes(type) &&
          matchState.ballCarrier &&
          matchState.ballCarrier.x <= 10.05)
      ) {
        matchState.teamPoints[1 - matchState.possession] += 2;
        matchState.score = matchState.teamPoints[matchState.possession];
        matchState.postWhistle = "safety-kick";
        matchState.clockRunning = false;
        emitPresentation({
          type: "resultHeadingChanged",
          heading: "SAFETY · +2",
        });
        log("SAFETY · +2 to defense");
      } else if (matchState.yard >= matchState.first - 0.05) {
        matchState.down = 1;
        matchState.first = Math.min(110, matchState.yard + 10);
        matchState.togo = matchState.first - matchState.yard;
        log("FIRST DOWN · Chains move");
      } else {
        matchState.down++;
        matchState.togo = matchState.first - matchState.yard;
      }
      if (matchState.down > 4 && matchState.postWhistle !== "safety-kick") {
        const lostTeam = matchState.possession;
        newPossession(1 - lostTeam, matchState.yard);
        matchState.postWhistle = "scrimmage";
        matchState.clockRunning = false;
        log(
          "TURNOVER ON DOWNS · " + TEAM_NAMES[matchState.possession] + " ball",
        );
      }
    }
    if (
      type === "incomplete" ||
      type === "out" ||
      type === "timeout" ||
      matchState.twoMinutePending
    ) {
      matchState.clockRunning = false;
      matchState.twoMinutePending = false;
    }
    if (matchState.postWhistle === "try")
      emitPresentation({ type: "snapControlChanged", text: "CHOOSE TRY" });
    if (matchState.postWhistle === "kickoff")
      emitPresentation({ type: "snapControlChanged", text: "KICKOFF" });
    if (matchState.postWhistle === "scrimmage")
      emitPresentation({ type: "snapControlChanged", text: "NEXT DRIVE" });
    if (matchState.postWhistle === "safety-kick")
      emitPresentation({
        type: "snapControlChanged",
        text: "SAFETY FREE KICK",
      });
    hud();
  }

  function nextDown() {
    if (matchState.phase === "halftime") {
      startThirdQuarter();
      return;
    }
    if (matchState.phase !== "dead") return;
    if (matchState.quarterSeconds <= 0 && !matchState.tryState) {
      advancePeriodIfNeeded();
      return;
    }
    const action = matchState.postWhistle;
    matchState.postWhistle = null;
    if (action === "try") {
      // Keep the scoring team on the field until the try is selected.
      matchState.yard = 95;
      matchState.down = 1;
      matchState.togo = 10;
      matchState.first = 105;
      matchState.specialState = null;
      setup();
      matchState.playSeconds = 25;
      showPlaybook();
      if (
        matchState.gameStarted &&
        matchState.possession === matchState.controllerTeams.cpu
      )
        chooseSpecial("pat");
    } else if (action === "kickoff") {
      setupKickoff(1 - matchState.possession);
    } else if (action === "safety-kick") {
      setupKickoff(1 - matchState.possession, "safety-kick");
    } else {
      if (
        matchState.gameStarted &&
        matchState.possession === matchState.controllerTeams.cpu
      )
        chooseCPUPlay();
      setup();
      matchState.playSeconds =
        matchState.gameStarted &&
        matchState.possession === matchState.controllerTeams.cpu
          ? PRESNAP_PLAY_SECONDS
          : 40;
      matchState.scrimmagePlayCalled =
        matchState.gameStarted &&
        matchState.possession === matchState.controllerTeams.cpu;
      matchState.cpuSnapAt = clamp(11 + rand() * 5, 11, 16);
      // CPU possessions show the field immediately for defensive repositioning.
      // VIEW still opens the optional defensive call sheet.
      if (
        matchState.gameStarted &&
        matchState.possession === matchState.controllerTeams.cpu
      )
        hidePlaybook();
      else showPlaybook();
    }
  }

  return {
    bind(services) {
      ({
        DefensiveMemory,
        PRESNAP_PLAY_SECONDS,
        TEAM_NAMES,
        advancePeriodIfNeeded,
        chooseCPUPlay,
        chooseSpecial,
        emitPresentation,
        finishReturn,
        hidePlaybook,
        hud,
        log,
        matchState,
        message,
        newPossession,
        rand,
        setup,
        setupKickoff,
        showPlaybook,
        spotText,
        startThirdQuarter,
        traceSample,
      } = services);
    },
    finish,
    nextDown,
  };
}
