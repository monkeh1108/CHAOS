import { clamp } from "../core/math.js";

export function createGameClock() {
  let PRESNAP_PLAY_SECONDS,
    QUARTER_DURATION_SECONDS,
    TEAM_NAMES,
    chooseCPUPlay,
    closeAudibles,
    dispatchInput,
    emitPresentation,
    hidePlaybook,
    hud,
    isFreeKick,
    log,
    matchState,
    message,
    rand,
    setResultUI,
    setup,
    setupKickoff,
    showPlaybook;

  function startThirdQuarter() {
    if (matchState.phase !== "halftime") return false;
    matchState.quarter = 3;
    matchState.quarterSeconds = QUARTER_DURATION_SECONDS;
    matchState.playSeconds = 25;
    matchState.timeOuts = [3, 3];
    matchState.twoMinuteNoted = false;
    matchState.twoMinutePending = false;
    matchState.postWhistle = null;
    matchState.clockRunning = false;
    setupKickoff(matchState.secondHalfReceiver);
    matchState.gameFlowNote = "Third quarter kickoff ready";
    log(
      "START OF Q3 · " +
        TEAM_NAMES[matchState.secondHalfReceiver] +
        " receiving",
    );
    hud();
    return true;
  }

  function advancePeriodIfNeeded() {
    if (
      matchState.quarterSeconds > 0 ||
      matchState.matchOver ||
      matchState.tryState ||
      matchState.phase === "halftime"
    )
      return false;
    if (matchState.quarter === 4) {
      matchState.matchOver = true;
      matchState.phase = "gameover";
      matchState.clockRunning = false;
      hidePlaybook();
      setResultUI(
        "FINAL",
        `${TEAM_NAMES[0]} ${matchState.teamPoints[0]} – ${matchState.teamPoints[1]} ${TEAM_NAMES[1]}`,
        "FINAL",
      );
      emitPresentation({ type: "snapControlChanged", disabled: true });
      hud();
      return true;
    }
    if (matchState.quarter === 2) {
      matchState.phase = "halftime";
      matchState.clockRunning = false;
      matchState.playSeconds = 0;
      matchState.scrimmagePlayCalled = false;
      matchState.specialState = null;
      matchState.postWhistle = null;
      closeAudibles();
      hidePlaybook();
      matchState.gameFlowNote = "HALFTIME — waiting for continue";
      setResultUI(
        "HALFTIME",
        `${TEAM_NAMES[0]} ${matchState.teamPoints[0]} – ${matchState.teamPoints[1]} ${TEAM_NAMES[1]} · ${TEAM_NAMES[matchState.secondHalfReceiver]} receives the second-half kickoff`,
        "START THIRD QUARTER",
      );
      emitPresentation({ type: "snapControlChanged", disabled: false });
      hud();
      log("HALFTIME · third quarter requires continue");
      return true;
    }
    matchState.quarter++;
    matchState.quarterSeconds = QUARTER_DURATION_SECONDS;
    matchState.twoMinuteNoted = false;
    matchState.twoMinutePending = false;
    matchState.postWhistle = null;
    matchState.clockRunning = false;
    if (matchState.specialState?.kind === "kickoff")
      setupKickoff(matchState.possession);
    else {
      setup();
      if (
        matchState.gameStarted &&
        matchState.possession === matchState.controllerTeams.cpu
      ) {
        chooseCPUPlay();
        matchState.scrimmagePlayCalled = true;
        matchState.playSeconds = PRESNAP_PLAY_SECONDS;
        matchState.cpuSnapAt = clamp(11 + rand() * 5, 11, 16);
        hidePlaybook();
      } else showPlaybook();
    }
    matchState.gameFlowNote = "Quarter " + matchState.quarter + " ready";
    log("START OF Q" + matchState.quarter);
    hud();
    return true;
  }

  function applyDelayOfGame() {
    if (
      matchState.phase !== "presnap" ||
      matchState.specialState ||
      matchState.tryState ||
      matchState.matchOver
    )
      return false;
    matchState.yard = Math.max(11, matchState.yard - 5);
    matchState.first = Math.max(matchState.yard + 1, matchState.first);
    matchState.togo = Math.max(1, matchState.first - matchState.yard);
    matchState.penaltyCount++;
    log(
      "DELAY OF GAME · " +
        TEAM_NAMES[matchState.possession] +
        " offense -5 yards",
    );
    matchState.gameFlowNote =
      "Delay of game · " + TEAM_NAMES[matchState.possession] + " -5 yards";
    setup();
    matchState.playSeconds =
      matchState.possession === matchState.controllerTeams.cpu &&
      matchState.gameStarted
        ? PRESNAP_PLAY_SECONDS
        : 40;
    matchState.scrimmagePlayCalled =
      matchState.possession === matchState.controllerTeams.cpu &&
      matchState.gameStarted;
    if (matchState.scrimmagePlayCalled) {
      matchState.cpuSnapAt = clamp(11 + rand() * 5, 11, 16);
      hidePlaybook();
    } else showPlaybook();
    message(
      "<strong>DELAY OF GAME.</strong> " +
        TEAM_NAMES[matchState.possession] +
        " loses five yards.",
    );
    hud();
    return true;
  }

  function gameTick(dt) {
    if (
      matchState.matchOver ||
      matchState.paused ||
      matchState.phase === "halftime"
    )
      return;
    // End a quarter at a dead-ball boundary. Do not accidentally leave a
    // 0:00 clock running while a user is stuck in the play sheet.
    if (
      matchState.phase === "presnap" &&
      matchState.quarterSeconds <= 0 &&
      !matchState.tryState
    ) {
      advancePeriodIfNeeded();
      return;
    }
    if (
      matchState.phase === "presnap" &&
      (matchState.scrimmagePlayCalled ||
        matchState.specialState ||
        matchState.tryState)
    ) {
      matchState.playSeconds = Math.max(0, matchState.playSeconds - dt);
      if (matchState.playSeconds === 0) {
        if (isFreeKick(matchState.specialState)) {
          matchState.playSeconds = 25;
          message("<strong>KICKOFF READY.</strong> Press kick to start.");
        } else if (matchState.tryState) {
          matchState.playSeconds = 25;
          message("<strong>TRY READY.</strong> Select extra point or two.");
        } else {
          applyDelayOfGame();
          return;
        }
      }
      if (
        matchState.gameStarted &&
        matchState.possession === matchState.controllerTeams.cpu &&
        matchState.scrimmagePlayCalled &&
        !matchState.specialState &&
        (!matchState.tryState || matchState.tryState.mode === "two") &&
        matchState.playSeconds <= matchState.cpuSnapAt
      ) {
        dispatchInput({
          type: "snap",
          playerSlot: matchState.controllerTeams.cpu,
        });
        return;
      }
    }
    if (
      matchState.clockRunning &&
      (matchState.phase === "live" || matchState.phase === "presnap")
    ) {
      const old = matchState.quarterSeconds;
      matchState.quarterSeconds = Math.max(0, matchState.quarterSeconds - dt);
      if (
        QUARTER_DURATION_SECONDS > 120 &&
        !matchState.twoMinuteNoted &&
        (matchState.quarter === 2 || matchState.quarter === 4) &&
        old > 120 &&
        matchState.quarterSeconds <= 120
      ) {
        matchState.twoMinuteNoted = true;
        matchState.twoMinutePending = matchState.phase === "live";
        if (!matchState.twoMinutePending) matchState.clockRunning = false;
        log("TWO-MINUTE WARNING");
      }
    }
    if (matchState.phase === "presnap" && matchState.quarterSeconds === 0)
      advancePeriodIfNeeded();
  }

  function requestTimeout() {
    if (
      matchState.matchOver ||
      matchState.phase === "live" ||
      matchState.timeOuts[matchState.possession] < 1
    )
      return false;
    matchState.timeOuts[matchState.possession]--;
    matchState.clockRunning = false;
    matchState.playSeconds = 25;
    log(
      TEAM_NAMES[matchState.possession] +
        " TIMEOUT · " +
        matchState.timeOuts[matchState.possession] +
        " left",
    );
    hud();
    return true;
  }

  return {
    bind(services) {
      ({
        PRESNAP_PLAY_SECONDS,
        QUARTER_DURATION_SECONDS,
        TEAM_NAMES,
        chooseCPUPlay,
        closeAudibles,
        dispatchInput,
        emitPresentation,
        hidePlaybook,
        hud,
        isFreeKick,
        log,
        matchState,
        message,
        rand,
        setResultUI,
        setup,
        setupKickoff,
        showPlaybook,
      } = services);
    },
    startThirdQuarter,
    advancePeriodIfNeeded,
    applyDelayOfGame,
    gameTick,
    requestTimeout,
  };
}
