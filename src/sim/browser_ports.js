import {
  TEAM_STYLES,
  AUDIBLE_BUTTONS,
  coverageDesc,
  defenseDesc,
  formationDesc,
  H,
  MPS_TO_MPH,
  PASS_ICONS,
  plays,
  pressureDesc,
  RUNS,
  TEAM_NAMES,
  W,
  YARD_M,
} from "./match_config.js";

export function createBrowserPorts({
  P,
  acceleration,
  audibleChoices,
  availableRunner,
  catchReach,
  clockText,
  closestThreat,
  defenderAirInteractionZone,
  dispatchInput,
  eligibleTargets,
  flightMarkers,
  gameTick,
  hud,
  isFreeKick,
  kickLineX,
  mass,
  matchState,
  maxSpeed,
  positionSelectedDefender,
  radius,
  receiverPromptTargets,
  speed,
  spotText,
  tickGround,
  update,
}) {
  return {
    dispatchInput,
    get localTeam() {
      return matchState.controllerTeams.local;
    },
    get sheetFocusKey() {
      return matchState.sheetFocusKey;
    },
    set sheetFocusKey(value) {
      matchState.sheetFocusKey = value;
    },
    set sheetFocusIndex(value) {
      matchState.sheetFocusIndex = value;
    },
    get sheetFocusIndex() {
      return matchState.sheetFocusIndex;
    },
    get TEAM_STYLES() {
      return TEAM_STYLES;
    },
    get active() {
      return matchState.active;
    },
    get airSelection() {
      return matchState.airSelection;
    },
    get AUDIBLE_BUTTONS() {
      return AUDIBLE_BUTTONS;
    },
    get audibleOpen() {
      return matchState.audibleOpen;
    },
    get ball() {
      return matchState.ball;
    },
    get ballCarrier() {
      return matchState.ballCarrier;
    },
    get blockLinks() {
      return matchState.blockLinks;
    },
    get burstCool() {
      return matchState.burstCool;
    },
    get burstTime() {
      return matchState.burstTime;
    },
    get controlMode() {
      return matchState.controlMode;
    },
    get coverageDesc() {
      return coverageDesc;
    },
    get coveragePreference() {
      return matchState.coveragePreference;
    },
    set coveragePreference(value) {
      matchState.coveragePreference = value;
    },
    get custom() {
      return matchState.custom;
    },
    get def() {
      return matchState.def;
    },
    get defenseDesc() {
      return defenseDesc;
    },
    get down() {
      return matchState.down;
    },
    get first() {
      return matchState.first;
    },
    get flash() {
      return matchState.flash;
    },
    set flash(value) {
      matchState.flash = value;
    },
    get formationDesc() {
      return formationDesc;
    },
    get gameFlowNote() {
      return matchState.gameFlowNote;
    },
    get gameStarted() {
      return matchState.gameStarted;
    },
    get H() {
      return H;
    },
    get intended() {
      return matchState.intended;
    },
    get lastContact() {
      return matchState.lastContact;
    },
    get lastTraceMeta() {
      return matchState.lastTraceMeta;
    },
    get logs() {
      return matchState.logs;
    },
    get manualDrive() {
      return matchState.manualDrive;
    },
    set manualDrive(value) {
      matchState.manualDrive = value;
    },
    get manualReceiver() {
      return matchState.manualReceiver;
    },
    get moveCooldown() {
      return matchState.moveCooldown;
    },
    get MPS_TO_MPH() {
      return MPS_TO_MPH;
    },
    get off() {
      return matchState.off;
    },
    get PASS_ICONS() {
      return PASS_ICONS;
    },
    get passThrown() {
      return matchState.passThrown;
    },
    get paused() {
      return matchState.paused;
    },
    set paused(value) {
      matchState.paused = value;
    },
    get pendingPass() {
      return matchState.pendingPass;
    },
    set pendingPass(value) {
      matchState.pendingPass = value;
    },
    get phase() {
      return matchState.phase;
    },
    get pileState() {
      return matchState.pileState;
    },
    get playbookOpen() {
      return matchState.playbookOpen;
    },
    get playClock() {
      return matchState.playClock;
    },
    get players() {
      return matchState.players;
    },
    get plays() {
      return plays;
    },
    get playSeconds() {
      return matchState.playSeconds;
    },
    set playSeconds(value) {
      matchState.playSeconds = value;
    },
    get playStart() {
      return matchState.playStart;
    },
    get playTrace() {
      return matchState.playTrace;
    },
    get possession() {
      return matchState.possession;
    },
    get pressureDesc() {
      return pressureDesc;
    },
    get pressurePreference() {
      return matchState.pressurePreference;
    },
    set pressurePreference(value) {
      matchState.pressurePreference = value;
    },
    get quarter() {
      return matchState.quarter;
    },
    get quarterSeconds() {
      return matchState.quarterSeconds;
    },
    get returnCall() {
      return matchState.returnCall;
    },
    set returnCall(value) {
      matchState.returnCall = value;
    },
    get returnFairCatch() {
      return matchState.returnFairCatch;
    },
    set returnFairCatch(value) {
      matchState.returnFairCatch = value;
    },
    get RUNS() {
      return RUNS;
    },
    get scrimmagePlayCalled() {
      return matchState.scrimmagePlayCalled;
    },
    set scrimmagePlayCalled(value) {
      matchState.scrimmagePlayCalled = value;
    },
    get secondHalfReceiver() {
      return matchState.secondHalfReceiver;
    },
    get selectedCoverage() {
      return matchState.selectedCoverage;
    },
    get selectedDefenderKey() {
      return matchState.selectedDefenderKey;
    },
    get selectedFormation() {
      return matchState.selectedFormation;
    },
    set selectedFormation(value) {
      matchState.selectedFormation = value;
    },
    get selectedFront() {
      return matchState.selectedFront;
    },
    set selectedFront(value) {
      matchState.selectedFront = value;
    },
    get selectedLinemanKey() {
      return matchState.selectedLinemanKey;
    },
    get selectedPlay() {
      return matchState.selectedPlay;
    },
    get selectedPressure() {
      return matchState.selectedPressure;
    },
    get shake() {
      return matchState.shake;
    },
    get specialState() {
      return matchState.specialState;
    },
    get suppressManualUntilNeutral() {
      return matchState.suppressManualUntilNeutral;
    },
    set suppressManualUntilNeutral(value) {
      matchState.suppressManualUntilNeutral = value;
    },
    get tackleLinks() {
      return matchState.tackleLinks;
    },
    get TEAM_NAMES() {
      return TEAM_NAMES;
    },
    get teamPoints() {
      return matchState.teamPoints;
    },
    get timeOuts() {
      return matchState.timeOuts;
    },
    get togo() {
      return matchState.togo;
    },
    get tossStage() {
      return matchState.tossStage;
    },
    get totalClock() {
      return matchState.totalClock;
    },
    get tryState() {
      return matchState.tryState;
    },
    get W() {
      return W;
    },
    get xHoldStart() {
      return matchState.xHoldStart;
    },
    get yard() {
      return matchState.yard;
    },
    get YARD_M() {
      return YARD_M;
    },
    P,
    acceleration,
    audibleChoices,
    availableRunner,
    catchReach,
    clockText,
    closestThreat,
    defenderAirInteractionZone,
    eligibleTargets,
    flightMarkers,
    gameTick,
    hud,
    isFreeKick,
    kickLineX,
    mass,
    maxSpeed,
    positionSelectedDefender,
    radius,
    receiverPromptTargets,
    speed,
    spotText,
    tickGround,
    update,
  };
}
