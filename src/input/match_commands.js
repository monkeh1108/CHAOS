export function createMatchCommands({
  P,
  applyAudible,
  burst,
  carrierMove,
  chooseAirAction,
  chooseCoinToss,
  choosePlay,
  chooseSpecial,
  closeAudibles,
  cycleControlMode,
  cycleSheetFormation,
  defensiveFaceButton,
  defensiveStick,
  downSafe,
  emitPresentation,
  evade,
  hidePlaybook,
  holdStiffArm,
  hud,
  lineImpact,
  matchState,
  message,
  nextDown,
  openAudibles,
  organizeReturnUnit,
  passTo,
  protectBall,
  refreshPauseUI,
  releasePass,
  requestTimeout,
  reset,
  selectCPUPlay,
  setup,
  showPlaybook,
  snap,
  startNewMatch,
  startPass,
  startThirdQuarter,
  switchDefender,
  switchToIntendedReceiver,
}) {
  const matchActions = {
    applyAudible,
    openAudibles,
    closeAudibles,
    showPlaybook,
    hidePlaybook,
    cycleSheetFormation,
    chooseSpecial,
    nextDown,
    startThirdQuarter,
    switchDefender,
    switchToIntendedReceiver,
    chooseAirAction,
    startPass,
    releasePass,
    carrierMove,
    holdStiffArm,
    protectBall,
    defensiveFaceButton,
    defensiveStick,
    lineImpact,
    burst,
    evade,
    reset,
    startNewMatch,
    requestTimeout,
    cycleControlMode,
    setScheme: (setting, value, keepClock, showSheet) => {
      const fields = {
        formation: "selectedFormation",
        front: "selectedFront",
        coverage: "coveragePreference",
        pressure: "pressurePreference",
      };
      if (!Object.hasOwn(fields, setting)) return;
      matchState[fields[setting]] = value;
      if (showSheet)
        emitPresentation({ type: "selectionChanged", key: setting, value });
      const remaining = matchState.playSeconds;
      const wasCalled = matchState.scrimmagePlayCalled;
      setup();
      if (keepClock) {
        matchState.playSeconds = remaining;
        matchState.scrimmagePlayCalled = wasCalled;
      }
      if (showSheet) showPlaybook();
    },
    returnCall: (call) => {
      matchState.returnCall = call;
      organizeReturnUnit();
      showPlaybook();
    },
    defensiveHold: (held, refresh) => {
      const selected = P(matchState.selectedDefenderKey);
      if (!selected) return;
      selected.conservativeHeld = held;
      if (held && refresh)
        selected.conservativeUntil = matchState.playClock + 0.12;
    },
    downHold: (action) => {
      if (action === "release" && !matchState.xDiveFired) downSafe();
      matchState.xHoldStart = action === "start" ? matchState.playClock : null;
      if (action !== "cancel") matchState.xDiveFired = false;
    },
    cancelCarrierMove: () => {
      matchState.queuedCarrierMove = null;
    },
    cancelPass: () => {
      matchState.pendingPass = null;
    },
    fairCatch: (notice) => {
      matchState.returnFairCatch = true;
      if (notice) message(notice);
    },
    autoRun: (untilNeutral) => {
      matchState.manualDrive = false;
      if (untilNeutral) matchState.suppressManualUntilNeutral = true;
      hud();
    },
    togglePause: () => {
      if (matchState.phase !== "live") return false;
      matchState.paused = !matchState.paused;
      refreshPauseUI();
      hud();
      return matchState.paused;
    },
  };
  const inputHandlers = {
    coinToss: ({ choice }) => chooseCoinToss(choice),
    selectPlay: ({ play, formation }, team) =>
      team === matchState.controllerTeams.cpu
        ? selectCPUPlay(play, formation)
        : choosePlay(play),
    snap: (_command, team) => snap(team === matchState.controllerTeams.cpu),
    pass: ({ receiver, hold }) => passTo(receiver, hold),
    controls: ({ move, sprint, conservative, quarterbackMoves }) => {
      matchState.controls = {
        move: { x: move.x, y: move.y, mag: move.mag },
        sprint: !!sprint,
        conservative: !!conservative,
        quarterbackMoves: !!quarterbackMoves,
      };
    },
    ...Object.fromEntries(
      Object.entries(matchActions).map(([type, action]) => [
        type,
        ({ args = [] }) => action(...args),
      ]),
    ),
  };

  function validateInput(command) {
    if (!command || !Object.hasOwn(inputHandlers, command.type)) {
      throw new TypeError("Unknown CHAOS tick command");
    }
    const team = command.playerSlot ?? matchState.controllerTeams.local;
    if (
      team !== matchState.controllerTeams.local &&
      team !== matchState.controllerTeams.cpu
    ) {
      throw new RangeError("Unknown CHAOS player slot");
    }
    if (
      team === matchState.controllerTeams.cpu &&
      !["selectPlay", "snap", "pass"].includes(command.type)
    ) {
      throw new TypeError("Unsupported CPU input command");
    }
    if (command.args !== undefined && !Array.isArray(command.args)) {
      throw new TypeError("Invalid CHAOS command arguments");
    }
    if (
      command.type === "controls" &&
      (!command.move ||
        !Number.isFinite(command.move.x) ||
        !Number.isFinite(command.move.y) ||
        !Number.isFinite(command.move.mag))
    ) {
      throw new TypeError("Invalid CHAOS movement command");
    }
    return team;
  }

  function dispatchInput(command) {
    const team = validateInput(command);
    return inputHandlers[command.type](command, team);
  }

  return { dispatchInput, validateInput };
}
