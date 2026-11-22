import { clamp } from "../core/math.js";

export function createMatchPossession() {
  let TEAM_NAMES, log, matchState, selectControlMode, spotText;

  function localTeamControl() {
    // Offensive and defensive roles reverse when possession changes.
    const role =
      matchState.possession === matchState.controllerTeams.local
        ? "offense"
        : "defense";
    if (matchState.controlMode !== role) selectControlMode(role);
  }

  function setDriveSpot(team, x) {
    matchState.possession = team;
    matchState.yard = clamp(x, 11, 109);
    matchState.down = 1;
    matchState.togo = Math.min(10, 110 - matchState.yard);
    matchState.first = matchState.yard + matchState.togo;
    if (matchState.gameStarted) localTeamControl();
  }

  function newPossession(team, oppositeSpot) {
    setDriveSpot(team, 120 - oppositeSpot);
    log(TEAM_NAMES[team] + " possession at " + spotText());
  }

  return {
    bind(services) {
      ({ TEAM_NAMES, log, matchState, selectControlMode, spotText } = services);
    },
    setDriveSpot,
    newPossession,
  };
}
