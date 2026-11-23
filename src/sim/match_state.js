import { createContactEvidenceState } from "../debug/contact_evidence.js";
import { createDefensiveMemoryState } from "../ai/defensive_memory.js";
import { QUARTER_DURATION_SECONDS } from "./match_config.js";
import { createPlayerProfiles } from "./player_profiles.js";

export function createMatchState(localTeam, initialSeed) {
  const matchState = {
    controllerTeams: { local: localTeam, cpu: 1 - localTeam },
    controls: {
      move: { x: 0, y: 0, mag: 0 },
      sprint: false,
      conservative: false,
      quarterbackMoves: false,
    },
    bootstrapSequence: initialSeed === undefined ? null : initialSeed >>> 0,
    contactEvidence: createContactEvidenceState(),
    defensiveMemory: createDefensiveMemoryState(),
  };
  matchState.custom = createPlayerProfiles();
  matchState.players = [];
  matchState.off = [];
  matchState.def = [];
  // Persist fatigue between snaps. Keep physical engagements only for the current snap.
  matchState.fatigueBank = Object.create(null);
  matchState.blockLinks = new Map();
  matchState.tackleLinks = new Map();
  // Store anatomical contact evidence before the solver separates the players.
  matchState.liveTackleContacts = new Map();
  matchState.tackleDiagnostics = null;
  matchState.carrierCollisionDiagnostics = null;
  matchState.tackleCount = 0;
  matchState.brokenTackleCount = 0;
  matchState.blockShedCount = 0;
  matchState.hitStickCount = 0;
  matchState.impactBlockCount = 0;
  matchState.powerMoveCount = 0;
  matchState.pileState = null;
  matchState.pileStarts = 0;
  matchState.pilePushYards = 0;
  matchState.chainHits = 0;
  matchState.windedHits = 0;
  matchState.standUps = 0;
  matchState.playTrace = [];
  matchState.lastTraceMeta = null;
  matchState.traceAccum = 0;
  matchState.lastAnatomyTackle = null;
  matchState.suppressManualUntilNeutral = false;
  matchState.controlMode = "offense";
  matchState.selectedDefenderKey = "MLB";
  matchState.selectedLinemanKey = "LG";
  matchState.xHoldStart = null;
  matchState.xDiveFired = false;
  matchState.paused = false;
  matchState.sheetFocusIndex = 0;
  matchState.sheetFocusKey = "";
  matchState.selectedFormation = "spread";
  matchState.selectedFront = "nickel";
  matchState.selectedCoverage = "cover1";
  matchState.pressurePreference = "mix";
  matchState.selectedPressure = "balanced";
  matchState.previousPressure = null;
  matchState.pressureRepeat = 0;
  matchState.lowDiveContacts = 0;
  matchState.lastLowDiveImpact = null;
  matchState.footContacts = 0;
  matchState.lastFootContact = null;
  matchState.manualReceiver = false;
  matchState.coveragePreference = "mix";
  matchState.previousMixedCoverage = null;
  matchState.mixRepeatCount = 0;
  matchState.selectedPlay = "inside";
  matchState.phase = "presnap";
  matchState.score = 0;
  matchState.down = 1;
  matchState.togo = 10;
  matchState.yard = 30;
  matchState.first = 40;
  matchState.totalClock = 0;
  matchState.playClock = 0;
  matchState.active = null;
  matchState.ball = null;
  matchState.ballCarrier = null;
  matchState.intended = null;
  matchState.passThrown = false;
  matchState.result = "";
  matchState.playStart = 30;
  matchState.lastContact = 0;
  matchState.msg = "";
  matchState.logs = [];
  matchState.burstTime = 0;
  matchState.burstCool = 0;
  matchState.evadeTime = 0;
  matchState.evadeCool = 0;
  matchState.seq = 0;
  matchState.flash = 0;
  matchState.confetti = [];
  matchState.shake = 0;
  matchState.offset = 0;
  matchState.manualDrive = false;
  matchState.contactEnabled = true;
  matchState.pendingPass = null;
  matchState.moveCooldown = 0;
  matchState.queuedCarrierMove = null;
  matchState.cpuQB = {
    nextRead: 0,
    choice: null,
    reads: 0,
    passes: 0,
    lastScore: 0,
    lastRisk: 0,
  };
  matchState.airSelection = { offense: null, defense: null, defenderKey: null };
  matchState.currentMemoryPlay = null;
  matchState.lastAirResult = null;
  matchState.airCounters = {
    rac: 0,
    possession: 0,
    aggressive: 0,
    swat: 0,
    interception: 0,
    playReceiver: 0,
    broken: 0,
    drops: 0,
    complete: 0,
  };
  matchState.scrimmagePlayCalled = false;
  matchState.firstHalfReceiver = 0;
  matchState.secondHalfReceiver = 1;
  matchState.tossStage = "none";
  matchState.tossCall = null;
  matchState.tossWinner = null;
  matchState.audibleOpen = false;
  matchState.cpuSnapAt = 14;
  matchState.protectionRead = null;
  matchState.gameFlowNote = "Ready";
  matchState.penaltyCount = 0;
  matchState.possession = 0;
  matchState.teamPoints = [0, 0];
  matchState.quarter = 1;
  matchState.quarterSeconds = QUARTER_DURATION_SECONDS;
  matchState.playSeconds = 25;
  matchState.clockRunning = false;
  matchState.gameStarted = false;
  matchState.matchOver = false;
  matchState.timeOuts = [3, 3];
  matchState.specialState = null;
  matchState.postWhistle = null;
  matchState.tryState = null;
  matchState.playbookOpen = false;
  matchState.lastWhistleType = "";
  matchState.returnCall = "middle";
  matchState.returnFairCatch = false;
  matchState.twoMinuteNoted = false;
  matchState.twoMinutePending = false;
  return matchState;
}
