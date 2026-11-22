export function createPlaySelection() {
  let RUNS, TEAM_STYLES, dispatchInput, emitPresentation, matchState, rand;

  function chooseCPUPlay() {
    const style = TEAM_STYLES[matchState.possession];
    const distance = Math.max(1, matchState.togo);
    const chooseRun =
      matchState.down === 1
        ? rand() < 0.47
        : matchState.down === 2
          ? rand() < 0.39
          : rand() < 0.21;
    const pool = style.pool.filter((p) =>
      chooseRun ? RUNS.has(p) : !RUNS.has(p),
    );
    const play = pool.length
      ? pool[Math.floor(rand() * pool.length)]
      : matchState.selectedPlay;
    const formation = RUNS.has(play)
      ? rand() < 0.5
        ? "iform"
        : "ace"
      : rand() < 0.43
        ? "trips"
        : rand() < 0.58
          ? "spread"
          : "bunch";
    return dispatchInput({
      type: "selectPlay",
      playerSlot: matchState.controllerTeams.cpu,
      play,
      formation,
    });
  }

  function selectCPUPlay(play, formation) {
    matchState.selectedPlay = play;
    matchState.selectedFormation = formation;
    emitPresentation({
      type: "playSelectionChanged",
      play: matchState.selectedPlay,
    });
    emitPresentation({
      type: "selectionChanged",
      key: "formation",
      value: matchState.selectedFormation,
    });
    return matchState.selectedPlay;
  }

  return {
    bind(services) {
      ({
        RUNS,
        TEAM_STYLES,
        dispatchInput,
        emitPresentation,
        matchState,
        rand,
      } = services);
    },
    chooseCPUPlay,
    selectCPUPlay,
  };
}
