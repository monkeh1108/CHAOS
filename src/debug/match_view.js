import { clamp } from "../core/math.js";
import { InsideZoneIQ } from "../ai/inside_zone_iq.js";

export function createMatchView({
  P,
  TICK_SECONDS,
  acceleration,
  airCatchProbability,
  airContext,
  blockInterceptPoint,
  burst,
  carrierMove,
  catchReach,
  chooseAirAction,
  choosePlay,
  defenderAirEligibility,
  defenderAirProbability,
  defensiveStick,
  diveForYards,
  downSafe,
  evade,
  flightMarkers,
  getVisualMode,
  hud,
  lineImpact,
  mass,
  matchState,
  maxSpeed,
  passTo,
  presentation,
  protectBall,
  pursuitAim,
  quarterbackWindow,
  radius,
  releasePass,
  reset,
  resolveHurdle,
  seed,
  selectControlMode,
  setVisualMode,
  snap,
  startPass,
  switchDefender,
  switchToIntendedReceiver,
  update,
}) {
  return {
    getState: () => ({
      paused: matchState.paused,
      manualDrive: matchState.manualDrive,
      controlMode: matchState.controlMode,
      selectedDefenderKey: matchState.selectedDefenderKey,
      selectedLinemanKey: matchState.selectedLinemanKey,
      moveCooldown: matchState.moveCooldown,
      queuedCarrierMove: matchState.queuedCarrierMove
        ? { ...matchState.queuedCarrierMove }
        : null,
      rightStickLatched: presentation?.getRightStick?.().latched ?? false,
      rightStickDirection: presentation?.getRightStick?.().direction ?? "",
      burstCool: matchState.burstCool,
      evadeCool: matchState.evadeCool,
      formation: matchState.selectedFormation,
      front: matchState.selectedFront,
      coverage: matchState.selectedCoverage,
      coveragePreference: matchState.coveragePreference,
      pressure: matchState.selectedPressure,
      pressurePreference: matchState.pressurePreference,
      airSelection: { ...matchState.airSelection },
      airCounters: { ...matchState.airCounters },
      lastAirResult: matchState.lastAirResult,
      play: matchState.selectedPlay,
      phase: matchState.phase,
      score: matchState.score,
      down: matchState.down,
      yard: matchState.yard,
      togo: matchState.togo,
      playClock: matchState.playClock,
      ballCarrier: matchState.ballCarrier?.key,
      target: matchState.intended?.key,
      passThrown: matchState.passThrown,
      manualReceiver: matchState.manualReceiver,
      active: matchState.active?.key,
      passProtection: matchState.players
        .filter((p) => ["LT", "LG", "C", "RG", "RT", "RB"].includes(p.key))
        .map((p) => ({
          key: p.key,
          assignment: p.passAssignment || null,
          block: p.blockTarget || null,
          intent: p.intent,
          target: p.intentTarget,
        })),
      cpuQB: {
        ...matchState.cpuQB,
        choice: matchState.cpuQB.choice?.key || null,
      },
      viewMode: getVisualMode(),
      flightMarkers: flightMarkers(),
      ball: matchState.ball
        ? {
            x: matchState.ball.x,
            y: matchState.ball.y,
            z: matchState.ball.z,
            flight: matchState.ball.flight,
            aimX: matchState.ball.aimX,
            aimY: matchState.ball.aimY,
            quality: matchState.ball.quality,
            accuracyError: matchState.ball.accuracyError,
            style: matchState.ball.style,
            loft: matchState.ball.loft,
          }
        : null,
      pendingPass: matchState.pendingPass
        ? { ...matchState.pendingPass }
        : null,
      fatigueBank: { ...matchState.fatigueBank },
      pile: matchState.pileState
        ? {
            ...matchState.pileState,
            pushers: [...matchState.pileState.pushers],
            wrappers: [...matchState.pileState.wrappers],
          }
        : null,
      contacts: {
        pileStarts: matchState.pileStarts,
        pilePushYards: matchState.pilePushYards,
        chainHits: matchState.chainHits,
        windedHits: matchState.windedHits,
        standUps: matchState.standUps,
        hitStickCount: matchState.hitStickCount,
        impactBlockCount: matchState.impactBlockCount,
        powerMoveCount: matchState.powerMoveCount,
        tackles: [...matchState.tackleLinks.values()].map((t) => ({
          ...t,
          attachment: t.attachment ? { ...t.attachment } : null,
        })),
        blocks: [...matchState.blockLinks.values()].map((t) => ({ ...t })),
        tackleCount: matchState.tackleCount,
        brokenTackleCount: matchState.brokenTackleCount,
        blockShedCount: matchState.blockShedCount,
      },
      players: matchState.players.map((p) => ({
        key: p.key,
        team: p.team,
        pos: p.pos,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        face: p.face,
        spawnX: p.spawnX,
        diveRecovery: p.diveRecovery,
        reengage: p.reengage ? { ...p.reengage } : null,
        stam: p.stam,
        gaitCap: p.gaitCap,
        SPD: p.SPD,
        ACC: p.ACC,
        PRC: p.PRC,
        PUR: p.PUR,
        STA: p.STA,
        runRead: p.runRead,
        readAt: p.readAt,
        readAtTime: p.readAtTime,
        fit: p.fit,
        blocked: p.blocked,
        assignment: p.assignment || null,
        rush: !!p.rush,
        spy: !!p.spy,
        blitz: !!p.blitz,
        rushStyle: p.passRushStyle,
        rushLane: p.passRushLane,
        passAssignment: p.passAssignment || null,
        passProtector: p.passProtector || null,
        routeIdx: p.routeIdx,
        routeComplete: p.routeComplete,
        scrambleTarget: p.scrambleTarget ? { ...p.scrambleTarget } : null,
        scrambleStepCount: p.scrambleStepCount,
        RTE: p.RTE,
        CUT: p.CUT,
        DBL: p.DBL,
        REL: p.REL,
        HND: p.HND,
        PRS: p.PRS,
        JAM: p.JAM,
        MIR: p.MIR,
        RCR: p.RCR,
        DIS: p.DIS,
        falseStep: p.falseStep ? { ...p.falseStep } : null,
        routeReadCount: p.routeReadCount,
        pressResult: p.pressResult,
        pressOpponent: p.pressOpponent,
        releaseSlow: p.releaseSlow,
        releaseBurst: p.releaseBurst,
        mirrorDelay: p.mirrorDelay,
        routeBreaks: p.routeBreaks,
        doubleMoveWins: p.doubleMoveWins,
        intent: p.intent,
        intentTarget: p.intentTarget,
        supportTarget: p.supportTarget,
        supportUntil: p.supportUntil,
        closePursuitRead: p.closePursuitRead ? { ...p.closePursuitRead } : null,
        lastTruckOutcome: p.lastTruckOutcome ? { ...p.lastTruckOutcome } : null,
        pursuitPoint: p.pursuitPoint ? { ...p.pursuitPoint } : null,
        primaryRunBlock: p.primaryRunBlock,
        jukeDrive: p.jukeDrive ? { ...p.jukeDrive } : null,
        blockApproach: p.blockApproach ? { ...p.blockApproach } : null,
        blockWins: p.blockWins,
        blockMode: p.blockMode,
        beatenTarget: p.beatenTarget,
        beatenUntil: p.beatenUntil,
        action: p.action ? { ...p.action } : null,
        covering: p.covering,
        actionOutcomes: p.actionOutcomes,
        touches: p.touches,
        travel: p.travel,
        stun: p.stun,
        ground: p.ground ? { ...p.ground } : null,
        airReadAt: p.airReadAt,
        stiffArmHeld: p.stiffArmHeld,
        routeVariation: p.routeVariation ? { ...p.routeVariation } : null,
        coverageVariation: p.coverageVariation
          ? { ...p.coverageVariation }
          : null,
        jukeRecovery: p.jukeRecovery,
        pushing: p.pushing,
        sprinting: p.sprinting,
        airPose: p.airPose ? { ...p.airPose } : null,
        actionCue: p.actionCue ? { ...p.actionCue } : null,
        technique: p.technique,
        HIT: p.HIT,
        PMV: p.PMV,
        IBL: p.IBL,
        TAK: p.TAK,
        TRK: p.TRK,
        JUK: p.JUK,
        SFA: p.SFA,
        AGI: p.AGI,
        balance: p.balance,
        spin: p.spin,
        lean: p.lean,
        impact: p.impact,
        w: p.w,
        STR: p.STR,
        BLO: p.BLO,
        tackleCooldown: p.tackleCooldown,
        shedCooldown: p.shedCooldown,
        tackleStrain: p.tackleStrain,
        breakExertion: p.breakExertion,
        escapeReaction: p.escapeReaction ? { ...p.escapeReaction } : null,
        airState: p.airState ? { ...p.airState } : null,
        stumbleTime: p.stumbleTime,
        ankleReachTime: p.ankleReachTime,
        standContact: p.standContact,
        squareImpact: p.squareImpact ? { ...p.squareImpact } : null,
        contactCount: p.contactCount,
      })),
      lastContact: matchState.lastContact,
      logs: [...matchState.logs],
    }),
    select: choosePlay,
    snap,
    passTo,
    startPass,
    releasePass,
    carrierMove,
    protectBall,
    downSafe,
    diveForYards,
    selectControlMode,
    switchDefender,
    switchToIntendedReceiver,
    defensiveStick,
    lineImpact,
    burst,
    evade,
    reset,
    chooseAirAction,
    debugHurdleTest: (carrier, defender, low = true) => {
      const a = P(carrier),
        d = P(defender);
      if (!a || !d) return false;
      return resolveHurdle(a, d, low ? "cut" : "hit");
    },
    debugCatchChance: (key, style = "possession") => {
      const p = P(key);
      return p ? airCatchProbability(p, style, airContext(p)) : null;
    },
    debugDefenseAirChance: (key, style = "swat", receiver = "WR1") => {
      const d = P(key);
      const r = P(receiver);
      return d ? defenderAirProbability(d, style, r) : null;
    },
    debugAirEligibility: (key) => defenderAirEligibility(P(key)),
    debugSetFlight: (
      x,
      y,
      z = 1.5,
      flight = 1.0,
      progress = 0.7,
      receiverKey = null,
    ) => {
      if (matchState.phase !== "live") return false;
      matchState.ball = {
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        t: flight * clamp(progress, 0, 0.99),
        flight,
        ttl: flight + 1,
        aimX: x,
        aimY: y,
        style: "TOUCH",
        flying: true,
        attempts: [],
        deflected: false,
      };
      matchState.intended = receiverKey ? P(receiverKey) : null;
      matchState.passThrown = true;
      hud();
      return true;
    },
    step: (n) => {
      for (let i = 0; i < n && matchState.phase === "live"; i++)
        update(TICK_SECONDS);
    },
    getPhysics: (key) => {
      const p = matchState.custom[key];
      return p
        ? {
            massKg: mass(p),
            accelerationYdPerSec2: acceleration(p),
            topSpeedYdPerSec: maxSpeed({ ...p, stam: 1 }),
            catchReachYd: catchReach(p),
            collisionRadiusYd: radius(p),
          }
        : null;
    },
    custom: matchState.custom,
    debugSeed: seed,
    debugPursuitAim: (key, carrier = "RB") => {
      const d = P(key),
        a = P(carrier);
      return d && a ? pursuitAim(d, a) : null;
    },
    debugSetPursuitBias: (key, lateral, depth) => {
      const d = P(key);
      if (!d || d.team !== 1) return false;
      d.pursuitLateralBias = clamp(lateral, -1, 1);
      d.pursuitDepthBias = clamp(depth, -1, 1);
      return true;
    },
    debugSetPursuitReadRoll: (key, roll) => {
      const d = P(key);
      if (!d || d.team !== 1) return false;
      d.pursuitReadRoll = clamp(roll, 0, 1);
      return true;
    },
    debugInsideZonePlan: () =>
      Object.fromEntries(
        ["LT", "LG", "C", "RG", "RT"].map((k) => [
          k,
          P(k)?.insideZonePlan || null,
        ]),
      ),
    debugInsideZoneSight: (observer, target) =>
      InsideZoneIQ.visible(P(observer), P(target)),
    debugInsideZoneThreat: (blocker, defender, carrier = "RB") => {
      const o = P(blocker),
        d = P(defender),
        a = P(carrier);
      return o && d && a
        ? InsideZoneIQ.threat(o, d, a, matchState.playStart)
        : null;
    },
    debugBlockAim: (blocker, defender, carrier = "RB") => {
      const o = P(blocker),
        d = P(defender),
        a = P(carrier);
      return o && d && a ? blockInterceptPoint(o, d, a) : null;
    },
    debugSelectView: (mode) => setVisualMode(mode),
    debugQuarterbackWindow: (key) => {
      const p = P(key);
      return p ? quarterbackWindow(P("QB"), p) : null;
    },
  };
}
