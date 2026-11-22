import { AnimationPolicy } from "../render/animation_policy.js";
import { BlockingPolicy } from "../ai/blocking_policy.js";
import { CoverageRoutePolicy } from "../ai/coverage_route_policy.js";
import { CpuQBPolicy } from "../ai/cpu_qb_policy.js";
import { DefensivePresnap } from "../ai/defensive_presnap.js";
import { InsideZoneIQ } from "../ai/inside_zone_iq.js";
import { ProtectionRead } from "../ai/protection_read.js";
import { RushAwareness } from "../ai/rush_awareness.js";

export function createMatchDebug({
  DefensiveMemory,
  P,
  QUARTER_DURATION_SECONDS,
  advanceTick,
  applyAudible,
  applyDelayOfGame,
  audibleChoices,
  chooseSpecial,
  cycleSheetFormation,
  defensiveFaceButton,
  dispatchInput,
  finish,
  flipCoin,
  getVisual,
  getVisualMode,
  hud,
  kickRatings,
  kickSpecial,
  matchState,
  nextDown,
  openAudibles,
  presentation,
  rbPassProtection,
  requestTimeout,
  resolveToss,
  restore,
  returnBypassTarget,
  returnEscapeSide,
  selectControlMode,
  setup,
  snapshot,
  startNewMatch,
  startThirdQuarter,
  stickInput,
}) {
  return {
    captureSnapshot: snapshot,
    restoreSnapshot: restore,
    advanceTick,
    dispatchInput,
    policies: Object.freeze({
      AnimationPolicy,
      BlockingPolicy,
      CoverageRoutePolicy,
      DefensiveMemory,
      ProtectionRead,
      InsideZoneIQ,
    }),
    debugTackleDecision: (key) => P(key)?.lastTackleDecision || null,
    debugSetConservative: (key, held) => {
      const d = P(key);
      if (!d || d.team !== 1) return false;
      d.conservativeHeld = !!held;
      d.conservativeUntil = held ? matchState.playClock + 0.15 : 0;
      return true;
    },
    getDefensiveMemory: (team = 0) => DefensiveMemory.report(team),
    getDefensivePosition: () => ({
      key: matchState.selectedDefenderKey,
      assignment: DefensivePresnap.description(
        P(matchState.selectedDefenderKey),
      ),
      gapTarget: DefensivePresnap.gapTarget(
        P(matchState.selectedDefenderKey),
        matchState.off,
        matchState.playStart,
      ),
    }),
    debugPositionDefender: (key, x, y) => {
      if (
        matchState.phase !== "presnap" ||
        matchState.controlMode !== "defense"
      )
        return false;
      matchState.selectedDefenderKey = key;
      matchState.active = P(key);
      if (!matchState.active || matchState.active.team !== 1) return false;
      const dx = x - matchState.active.x,
        dy = y - matchState.active.y;
      const length = Math.hypot(dx, dy);
      for (let i = 0; i < Math.ceil(length / 0.055) && i < 1500; i++) {
        const step = DefensivePresnap.move(
          matchState.active,
          { x: dx / (length || 1), y: dy / (length || 1) },
          1 / 60,
          matchState.playStart,
          matchState.def,
        );
        if (!step) break;
        matchState.active.x = step.x;
        matchState.active.y = step.y;
      }
      if (matchState.active.assignment?.kind === "zone") {
        const a = matchState.active.assignment;
        if (a.homeX === undefined) {
          a.homeX = a.baseX;
          a.homeY = a.baseY;
        }
        const v = DefensivePresnap.zoneAnchor(matchState.active);
        a.baseX = v.x;
        a.baseY = v.y;
      }
      return true;
    },
    debugReturnEscapeSide: (defenderY, blockerY) =>
      returnEscapeSide({ y: defenderY }, { y: blockerY }),
    debugReturnBypassTarget: (defenderY, blockerY, side) =>
      returnBypassTarget(
        { y: defenderY, returnBypassSide: side },
        { y: blockerY },
        defenderY,
      ),
    defensiveFaceButton,
    cycleSheetFormation,
    debugDefensePresnap: () => {
      matchState.possession = 1;
      selectControlMode("defense");
      setup();
      matchState.playSeconds = 20;
      matchState.scrimmagePlayCalled = true;
      hud();
    },
    getAudibles: () => ({
      open: matchState.audibleOpen,
      choices: audibleChoices(),
      clock: matchState.playSeconds,
    }),
    openAudibles,
    applyAudible,
    getSheet: () => ({
      open: matchState.playbookOpen,
      index: matchState.sheetFocusIndex,
      items: presentation?.getSheetItems() ?? [],
    }),
    debugCpuTiming: () =>
      CpuQBPolicy.minimumSettle(
        matchState.selectedPlay,
        P("QB")?.DEC || 75,
        P("QB")?.VIS || 75,
      ),
    debugRushTarget: (key) =>
      RushAwareness.target(
        P(key),
        P("QB"),
        matchState.playStart,
        matchState.playClock,
      ),
    debugWhistle: (type) => finish(type, matchState.playStart, type),
    debugForceWhistleAt: (type, x) => {
      if (matchState.phase !== "live") return false;
      finish(type, x, "Test whistle");
      return true;
    },
    newGame: startNewMatch,
    chooseSpecial,
    requestTimeout,
    nextDown,
    startKick: kickSpecial,
    getProtectionRead: () =>
      matchState.protectionRead ? { ...matchState.protectionRead } : null,
    debugProtectionStep: () => {
      const rb = P("RB");
      if (!rb) return null;
      rbPassProtection(rb, 1 / 60);
      return { target: rb.intentTarget, alert: rb.protectionAlert };
    },
    getQuarterDuration: () => QUARTER_DURATION_SECONDS,
    startThirdQuarter,
    applyDelayOfGame,
    getCoinToss: () => ({
      stage: matchState.tossStage,
      call: matchState.tossCall,
      winner: matchState.tossWinner,
      firstHalfReceiver: matchState.firstHalfReceiver,
      secondHalfReceiver: matchState.secondHalfReceiver,
    }),
    debugFinishCoinToss: (call = "heads", choice = "receive") => {
      if (matchState.tossStage === "call") flipCoin(call);
      if (matchState.tossStage === "decision") {
        matchState.tossWinner = matchState.controllerTeams.local;
        resolveToss(choice);
      }
      return matchState.tossStage;
    },
    getMatch: () => ({
      gameFlowNote: matchState.gameFlowNote,
      penaltyCount: matchState.penaltyCount,
      phase: matchState.phase,
      quarter: matchState.quarter,
      quarterSeconds: matchState.quarterSeconds,
      playSeconds: matchState.playSeconds,
      clockRunning: matchState.clockRunning,
      teamPoints: [...matchState.teamPoints],
      possession: matchState.possession,
      controlMode: matchState.controlMode,
      returnCall: matchState.returnCall,
      kicker: { ...kickRatings() },
      timeOuts: [...matchState.timeOuts],
      specialState: matchState.specialState
        ? { ...matchState.specialState }
        : null,
      tryState: matchState.tryState ? { ...matchState.tryState } : null,
      postWhistle: matchState.postWhistle,
      matchOver: matchState.matchOver,
      playbookOpen: matchState.playbookOpen,
    }),
    debugSetQuarterTime: (v) => {
      matchState.quarterSeconds = v;
      hud();
    },
    debugSetPlayClock: (v) => {
      matchState.playSeconds = v;
      hud();
    },
    debugSetSpot: (x, d = 1) => {
      matchState.yard = x;
      matchState.down = d;
      matchState.first = x + 10;
      matchState.togo = 10;
      setup();
      hud();
    },
    getTrace: () => ({
      meta: matchState.lastTraceMeta,
      samples: matchState.playTrace.length,
      last: matchState.playTrace.at(-1) || null,
    }),
    getVisual,
    getController: () => ({
      ...(presentation?.getController?.() ?? {
        connected: false,
        index: -1,
        id: "",
        standard: false,
        lx: 0,
        ly: 0,
        rx: 0,
        ry: 0,
        lt: 0,
        rt: 0,
      }),
      paused: matchState.paused,
    }),
    getSteering: () => ({ viewMode: getVisualMode(), ...stickInput() }),
  };
}
