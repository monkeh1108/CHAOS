export function createMatchStart() {
  let DefensiveMemory,
    QUARTER_DURATION_SECONDS,
    RANDOM_RANGE,
    TEAM_NAMES,
    emitPresentation,
    hidePlaybook,
    log,
    matchRandom,
    matchState,
    refreshPauseUI,
    seed,
    selectControlMode,
    setDriveSpot,
    setup,
    setupKickoff;

  function tossScreen(title, description, buttons) {
    emitPresentation({ type: "coinTossShown", title, description, buttons });
  }

  function chooseCoinToss(value) {
    if (matchState.tossStage === "call") flipCoin(value);
    else if (matchState.tossStage === "decision") resolveToss(value);
  }

  function startCoinToss() {
    emitPresentation({ type: "coinTossInputReset" });
    matchState.tossStage = "call";
    matchState.tossCall = null;
    matchState.tossWinner = null;
    tossScreen(
      "OPENING COIN TOSS",
      TEAM_NAMES[matchState.controllerTeams.local] +
        " calls the coin. Choose heads or tails.",
      [
        { label: "HEADS", value: "heads" },
        { label: "TAILS", value: "tails" },
      ],
    );
  }

  function flipCoin(call) {
    if (matchState.tossStage !== "call") return;
    matchState.tossCall = call;
    const result = matchRandom() < 0.5 ? "heads" : "tails";
    matchState.tossWinner =
      result === call
        ? matchState.controllerTeams.local
        : matchState.controllerTeams.cpu;
    matchState.tossStage = "decision";
    if (matchState.tossWinner === matchState.controllerTeams.local) {
      tossScreen(
        "COIN: " +
          result.toUpperCase() +
          " · " +
          TEAM_NAMES[matchState.controllerTeams.local] +
          " WINS",
        "Choose to receive, kick, or defer the choice to the second half.",
        [
          { label: "RECEIVE", value: "receive" },
          { label: "KICK", value: "kick" },
          { label: "DEFER", value: "defer" },
        ],
      );
    } else {
      // CPU decision uses no hidden gameplay info. It generally defers.
      const choice = matchRandom() < 0.7 ? "defer" : "receive";
      tossScreen(
        "COIN: " +
          result.toUpperCase() +
          " · " +
          TEAM_NAMES[matchState.controllerTeams.cpu] +
          " WINS",
        TEAM_NAMES[matchState.controllerTeams.cpu] +
          " selects " +
          choice.toUpperCase() +
          ". The opening kickoff is determined.",
        [{ label: "CONTINUE", value: choice }],
      );
    }
  }

  function resolveToss(choice) {
    if (matchState.tossStage !== "decision") return;
    const winner = matchState.tossWinner;
    // Defer = opponent chooses first half; winner gets second-half choice.
    // For this version the non-deferring team elects to receive.
    matchState.firstHalfReceiver =
      choice === "defer"
        ? 1 - winner
        : choice === "receive"
          ? winner
          : 1 - winner;
    // An outright election to kick differs from deferring: the other team
    // controls the second-half choice and would normally elect to receive.
    matchState.secondHalfReceiver =
      choice === "kick" ? 1 - winner : 1 - matchState.firstHalfReceiver;
    matchState.tossStage = "complete";
    emitPresentation({ type: "coinTossHidden" });
    beginOpeningKickoff(matchState.firstHalfReceiver);
  }

  function beginOpeningKickoff(receiver) {
    setDriveSpot(receiver, 20);
    matchState.returnCall = "middle";
    setupKickoff(receiver);
    log(
      "COIN TOSS · " +
        TEAM_NAMES[matchState.tossWinner] +
        " won · " +
        TEAM_NAMES[matchState.controllerTeams.local] +
        " called " +
        matchState.tossCall +
        " · " +
        TEAM_NAMES[receiver] +
        " receives",
    );
  }

  function startNewMatch() {
    matchState.gameFlowNote = "Coin toss";
    matchState.penaltyCount = 0;
    DefensiveMemory.reset();
    matchState.currentMemoryPlay = null;
    for (const k of Object.keys(matchState.fatigueBank))
      delete matchState.fatigueBank[k];
    matchState.teamPoints = [0, 0];
    matchState.possession = 0;
    matchState.score = 0;
    matchState.quarter = 1;
    matchState.quarterSeconds = QUARTER_DURATION_SECONDS;
    matchState.playSeconds = 25;
    matchState.clockRunning = false;
    matchState.gameStarted = true;
    matchState.matchOver = false;
    matchState.timeOuts = [3, 3];
    matchState.twoMinuteNoted = false;
    matchState.twoMinutePending = false;
    matchState.tryState = null;
    matchState.specialState = null;
    matchState.postWhistle = null;
    matchState.lastWhistleType = "";
    matchState.logs = [];
    emitPresentation({ type: "logChanged", logs: matchState.logs });
    seed(Math.floor(matchRandom() * RANDOM_RANGE) >>> 0);
    matchState.returnCall = "middle";
    startCoinToss();
  }

  function reset() {
    matchState.gameFlowNote = "Ready";
    matchState.penaltyCount = 0;
    DefensiveMemory.reset();
    matchState.currentMemoryPlay = null;
    matchState.gameStarted = false;
    selectControlMode("offense");
    matchState.possession = 0;
    matchState.teamPoints = [0, 0];
    matchState.quarter = 1;
    matchState.quarterSeconds = QUARTER_DURATION_SECONDS;
    matchState.timeOuts = [3, 3];
    matchState.playSeconds = 40;
    matchState.specialState = null;
    matchState.tryState = null;
    matchState.postWhistle = null;
    matchState.clockRunning = false;
    hidePlaybook();
    for (const k of Object.keys(matchState.fatigueBank))
      delete matchState.fatigueBank[k];
    matchState.paused = false;
    refreshPauseUI();
    matchState.score = 0;
    matchState.down = 1;
    matchState.togo = 10;
    matchState.yard = 30;
    matchState.first = 40;
    matchState.totalClock = 0;
    matchState.logs = [];
    emitPresentation({ type: "logChanged", logs: matchState.logs });
    seed(Math.floor(matchRandom() * RANDOM_RANGE) >>> 0);
    setup();
    log("New drive · ball on own 20");
  }

  return {
    bind(services) {
      ({
        DefensiveMemory,
        QUARTER_DURATION_SECONDS,
        RANDOM_RANGE,
        TEAM_NAMES,
        emitPresentation,
        hidePlaybook,
        log,
        matchRandom,
        matchState,
        refreshPauseUI,
        seed,
        selectControlMode,
        setDriveSpot,
        setup,
        setupKickoff,
      } = services);
    },
    chooseCoinToss,
    flipCoin,
    resolveToss,
    startNewMatch,
    reset,
  };
}
