import { PlaybookNavigation } from "../ui/playbook_navigation.js";

export function createPlayCalling() {
  let OFFENSE_AUDIBLES,
    PRESNAP_PLAY_SECONDS,
    emitPresentation,
    hud,
    matchState,
    message,
    setup;

  function audibleChoices() {
    if (matchState.controlMode === "defense")
      return [
        { label: "BLITZ", coverage: "cover1", pressure: "blitz" },
        { label: "COVER 3", coverage: "cover3", pressure: "balanced" },
        { label: "COVER 2", coverage: "cover2", pressure: "balanced" },
        { label: "MAN COVERAGE", coverage: "cover1", pressure: "balanced" },
      ];
    const keys =
      OFFENSE_AUDIBLES[matchState.selectedFormation] || OFFENSE_AUDIBLES.spread;
    return keys.map((key, i) => ({
      label: ["RUN", "PASS CONCEPT*", "DEEP PASS", "QUICK PASS"][i],
      play: key,
    }));
  }

  function renderAudibles() {
    emitPresentation({ type: "audiblesChanged" });
  }

  function closeAudibles() {
    matchState.audibleOpen = false;
    renderAudibles();
  }

  function openAudibles() {
    if (
      matchState.phase !== "presnap" ||
      matchState.specialState ||
      (matchState.tryState && matchState.tryState.mode !== "two") ||
      matchState.playbookOpen ||
      !matchState.scrimmagePlayCalled
    )
      return false;
    matchState.audibleOpen = !matchState.audibleOpen;
    renderAudibles();
    return true;
  }

  function applyAudible(index) {
    if (
      !matchState.audibleOpen ||
      matchState.phase !== "presnap" ||
      !matchState.scrimmagePlayCalled
    )
      return false;
    const option = audibleChoices()[index];
    if (!option) return false;
    const remaining = matchState.playSeconds;
    if (matchState.controlMode === "defense") {
      matchState.coveragePreference = option.coverage;
      matchState.pressurePreference = option.pressure;
      emitPresentation({
        type: "selectionChanged",
        key: "coverage",
        value: matchState.coveragePreference,
      });
      emitPresentation({
        type: "selectionChanged",
        key: "pressure",
        value: matchState.pressurePreference,
      });
      setup();
    } else {
      matchState.selectedPlay = option.play;
      emitPresentation({
        type: "playSelectionChanged",
        play: matchState.selectedPlay,
      });
      setup();
    }
    matchState.playSeconds = remaining;
    matchState.scrimmagePlayCalled = true;
    closeAudibles();
    hud();
    return true;
  }

  function showPlaybook() {
    closeAudibles();
    if (matchState.phase !== "presnap" || matchState.matchOver) return;
    matchState.playbookOpen = true;
    emitPresentation({ type: "playbookShown" });
  }

  function cycleSheetFormation(direction) {
    if (
      matchState.phase !== "presnap" ||
      matchState.specialState ||
      matchState.tryState
    )
      return false;
    if (matchState.controlMode === "defense") {
      matchState.selectedFront = PlaybookNavigation.cycle(
        ["nickel", "base43", "base34"],
        matchState.selectedFront,
        direction,
      );
      emitPresentation({
        type: "selectionChanged",
        key: "front",
        value: matchState.selectedFront,
      });
    } else {
      matchState.selectedFormation = PlaybookNavigation.cycle(
        ["spread", "trips", "ace", "iform", "bunch", "pistol"],
        matchState.selectedFormation,
        direction,
      );
      emitPresentation({
        type: "selectionChanged",
        key: "formation",
        value: matchState.selectedFormation,
      });
      emitPresentation({
        type: "selectionChanged",
        key: "sheetFormation",
        value: matchState.selectedFormation,
      });
    }
    const remaining = matchState.playSeconds,
      wasCalled = matchState.scrimmagePlayCalled;
    setup();
    matchState.playSeconds = remaining;
    matchState.scrimmagePlayCalled = wasCalled;
    showPlaybook();
    return true;
  }

  function hidePlaybook() {
    matchState.playbookOpen = false;
    emitPresentation({ type: "playbookHidden" });
  }

  function choosePlay(n) {
    if (
      matchState.phase === "live" ||
      matchState.specialState ||
      matchState.controlMode === "defense" ||
      (matchState.gameStarted &&
        matchState.possession !== matchState.controllerTeams.local) ||
      (!!matchState.tryState && !matchState.tryState.mode)
    )
      return;
    matchState.selectedPlay = n;
    emitPresentation({ type: "playSelectionChanged", play: n });
    setup();
    matchState.playSeconds = PRESNAP_PLAY_SECONDS;
    matchState.scrimmagePlayCalled = true;
    hidePlaybook();
    message(
      "<strong>Play called.</strong> " +
        matchState.selectedPlay.toUpperCase() +
        " · A to snap · 20 seconds on the play clock.",
    );
    hud();
  }

  return {
    bind(services) {
      ({
        OFFENSE_AUDIBLES,
        PRESNAP_PLAY_SECONDS,
        emitPresentation,
        hud,
        matchState,
        message,
        setup,
      } = services);
    },
    audibleChoices,
    closeAudibles,
    openAudibles,
    applyAudible,
    showPlaybook,
    cycleSheetFormation,
    hidePlaybook,
    choosePlay,
  };
}
