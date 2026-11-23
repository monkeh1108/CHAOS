import {
  DEFAULT_HANDOFF_SECONDS,
  I_FORM_HANDOFF_SECONDS,
  PASS_AUTO_RELEASE_SECONDS,
} from "../core/tuning/timing.js";
import { distance2D as dist } from "../core/math.js";

export function createMatchTick() {
  let AIroute,
    H,
    P,
    RUNS,
    airBall,
    applyMotion,
    arrive,
    autoCarry,
    availableRunner,
    blockerAI,
    carrierMove,
    convertQuarterbackScramble,
    cpuQuarterback,
    defenderAI,
    diveForYards,
    finish,
    finishMissedDefenderDive,
    hud,
    insideZoneBlockerAI,
    log,
    manualAthlete,
    matchState,
    message,
    qbAI,
    quarterbackSupport,
    rbLeadBlock,
    rbPassProtection,
    receiverAfterCatchBlock,
    receiverFlightAI,
    receiverRunBlock,
    releasePass,
    resolveBlocks,
    resolvePileDrive,
    resolveTackles,
    runSupportAI,
    stepSpecial,
    stickInput,
    tickGround,
    traceSample,
    userCarry;

  function update(dt) {
    if (matchState.specialState) {
      stepSpecial(dt);
      return;
    }
    if (matchState.controlMode === "defense") {
      const selected = P(matchState.selectedDefenderKey);
      if (selected) {
        selected.conservativeHeld = matchState.controls.conservative;
        if (selected.conservativeHeld)
          selected.conservativeUntil = matchState.playClock + 0.13;
      }
    }
    convertQuarterbackScramble();
    matchState.totalClock += dt;
    matchState.playClock += dt;
    matchState.burstTime = Math.max(0, matchState.burstTime - dt);
    matchState.burstCool = Math.max(0, matchState.burstCool - dt);
    matchState.evadeTime = Math.max(0, matchState.evadeTime - dt);
    matchState.evadeCool = Math.max(0, matchState.evadeCool - dt);
    matchState.shake = Math.max(0, matchState.shake - dt);
    const running = RUNS.has(matchState.selectedPlay);
    matchState.moveCooldown = Math.max(0, matchState.moveCooldown - dt);
    // Accept a second quick flick during a plant. It is executed as soon as the
    // physical replant window ends, rather than silently discarded by the input.
    if (matchState.queuedCarrierMove && matchState.moveCooldown <= 0) {
      const queued = matchState.queuedCarrierMove;
      matchState.queuedCarrierMove = null;
      if (matchState.playClock <= queued.expires)
        carrierMove(queued.kind, queued.side);
    }
    if (
      matchState.xHoldStart !== null &&
      !matchState.xDiveFired &&
      matchState.phase === "live" &&
      matchState.playClock - matchState.xHoldStart >= 0.27
    ) {
      matchState.xDiveFired = true;
      diveForYards();
    }

    for (const p of matchState.players) {
      if (p.airPose) {
        p.airPose.time -= dt;
        p.airPose.age = (p.airPose.age || 0) + dt;
        if (p.airPose.time <= 0) p.airPose = null;
      }
      if (p.actionCue) {
        p.actionCue.time -= dt;
        if (p.actionCue.time <= 0) p.actionCue = null;
      }
    }
    for (const p of matchState.players)
      if (p.action) {
        if (
          p.action.kind === "stiff" &&
          p.stiffArmHeld &&
          p === availableRunner()
        ) {
          p.action.time = Math.max(p.action.time, 0.13);
          p.stam = Math.max(0, p.stam - dt * 0.009); // a held arm is not a free infinite shove
        } else p.action.time -= dt;
        p.action.age += dt;
        if (p.action.time <= 0) {
          finishMissedDefenderDive(p);
          p.action = null;
        }
      }
    if (
      matchState.pendingPass &&
      matchState.playClock - matchState.pendingPass.start >=
        PASS_AUTO_RELEASE_SECONDS
    ) {
      releasePass(PASS_AUTO_RELEASE_SECONDS);
    }
    const rb = P("RB"),
      qb = P("QB");
    // Everyone re-evaluates the LIVE BALL each tick. No one continues a pre-catch route
    // or pass-protection target simply because it was assigned before the handoff.
    const claims = new Set();
    const grounded = new Set();
    for (const p of matchState.players)
      if (tickGround(p, dt)) grounded.add(p.key);
    for (const o of matchState.off) {
      if (grounded.has(o.key)) continue;
      if (
        matchState.manualReceiver &&
        o === matchState.active &&
        matchState.ball?.flying
      ) {
        const input = stickInput();
        if (input.mag > 0.12) manualAthlete(o, dt, "user-receiver");
        else if (!receiverFlightAI(o, dt)) AIroute(o, dt);
        continue;
      }
      if (o === matchState.ballCarrier) {
        if (matchState.controlMode === "offense") userCarry(o, dt);
        else autoCarry(o, dt);
        continue;
      }
      if (matchState.ballCarrier) {
        if (
          matchState.selectedPlay === "inside" &&
          ["LT", "LG", "C", "RG", "RT"].includes(o.key)
        ) {
          insideZoneBlockerAI(o, dt, claims, matchState.ballCarrier);
          continue;
        }
        if (o === qb) quarterbackSupport(o, matchState.ballCarrier, dt);
        else if (running && o.pos === "WR")
          receiverRunBlock(o, dt, claims, matchState.ballCarrier);
        else if (
          !running &&
          matchState.ballCarrier.x >= matchState.playStart &&
          (o.pos === "WR" || o.pos === "TE")
        )
          receiverAfterCatchBlock(o, matchState.ballCarrier, dt, claims);
        else runSupportAI(o, matchState.ballCarrier, dt, claims);
        continue;
      }
      if (matchState.ball?.flying && receiverFlightAI(o, dt)) continue;
      if (["LT", "LG", "C", "RG", "RT"].includes(o.key)) {
        if (
          matchState.controlMode === "line" &&
          o.key === matchState.selectedLinemanKey
        )
          manualAthlete(o, dt, "user-block");
        else blockerAI(o, dt);
        continue;
      }
      if (o === qb) {
        if (running) {
          o.intent = "handoff";
          o.intentTarget = "RB";
          arrive(o, matchState.playStart - 2.1, 26.65, dt, 0.7);
        } else if (matchState.passThrown) {
          o.intent = "post-throw";
          o.intentTarget = null;
          arrive(o, o.x - 0.1, o.y, dt, 0.7);
        } else if (matchState.controlMode === "offense") qbAI(o, dt);
        else cpuQuarterback(o, dt);
        continue;
      }
      if (o === rb) {
        if (running) {
          o.intent = "handoff";
          o.intentTarget = "QB";
          arrive(o, qb.x + 0.3, qb.y, dt, 1.1);
        } else {
          rbPassProtection(o, dt);
        }
        continue;
      }
      if (running && o.pos === "WR") receiverRunBlock(o, dt, claims);
      else if (running && (o.pos === "TE" || o.pos === "FB"))
        rbLeadBlock(o, dt);
      else AIroute(o, dt);
    }
    for (const d of matchState.def) {
      if (grounded.has(d.key)) continue;
      if (
        ["tackle-dive", "hit-stick", "cut-stick"].includes(d.action?.kind) &&
        d.action.time > 0
      ) {
        // Both AI and user-controlled defenders finish the dive trajectory before
        // reconsidering pursuit. Prevents a second movement/turn during the lunge.
        d.intent = "committed-dive";
        continue;
      }
      if (
        matchState.controlMode === "defense" &&
        d.key === matchState.selectedDefenderKey &&
        stickInput().mag > 0.12
      ) {
        // Manual input temporarily overrides the defender's responsibility.
        manualAthlete(d, dt, "user-defense");
      } else defenderAI(d, dt); // Released stick resumes the SAME assignment, from the new spot.
    }
    resolveBlocks(dt);
    resolvePileDrive(dt);
    applyMotion(dt);
    if (matchState.phase !== "live") return;
    convertQuarterbackScramble();
    if (
      running &&
      !matchState.ballCarrier &&
      matchState.playClock >
        (matchState.selectedFormation === "iform"
          ? I_FORM_HANDOFF_SECONDS
          : DEFAULT_HANDOFF_SECONDS)
    ) {
      matchState.tackleLinks.clear();
      matchState.pileState = null;
      matchState.ballCarrier = rb;
      if (matchState.controlMode === "offense") matchState.active = rb;
      rb.touches++;
      message(
        "<strong>Handoff!</strong> Drive upfield; your weight and momentum can break a tackle.",
      );
      log("HANDOFF · " + rb.name);
    }

    if (matchState.ball) airBall(dt);
    // The quarterback has the football before a pass or handoff, despite ballCarrier
    // remaining null. Otherwise the tackle system never runs and sacks are impossible.
    if (
      !running &&
      !matchState.passThrown &&
      !matchState.ballCarrier &&
      matchState.contactEnabled
    ) {
      resolveTackles(qb, dt);
      if (matchState.phase !== "live") return;
    }
    if (matchState.ballCarrier) {
      const p = matchState.ballCarrier;
      if (p.action?.kind === "dive" && p.action.age >= 0.42) {
        finish("down", p.x, p.name + " dives forward.");
        return;
      }
      // Crossing our own goal line alone is not a safety. The ball stays live
      // until a tackle, dead-ball dive, out of bounds or another whistle.
      p.shield = Math.max(0, p.shield - dt);
      if (p.x >= 109.8) {
        finish(
          "touchdown",
          110,
          p.name +
            " scores from " +
            Math.round(110 - matchState.playStart) +
            " yards out.",
        );
        return;
      }
      if (p.y < 0.1 || p.y > H - 0.1) {
        finish("out", p.x, p.name + " steps out of bounds.");
        return;
      }
      if (matchState.contactEnabled) resolveTackles(p, dt);
      if (matchState.phase !== "live") return;
      // Forward progress can be ruled stopped during a sustained, crowded contact pile.
      const crowd = matchState.def.filter(
        (d) => !d.ground && dist(d, p) < 2.65,
      ).length;
      if (crowd >= 2 && Math.hypot(p.vx, p.vy) < 0.65) {
        p.stoppedProgress = (p.stoppedProgress || 0) + dt;
        if (p.stoppedProgress > 2.1) {
          finish(
            "tackle",
            p.x,
            "Forward progress stopped in a defensive pile.",
          );
          return;
        }
      } else
        p.stoppedProgress = Math.max(0, (p.stoppedProgress || 0) - dt * 1.5);
    }
    // QB contact was already resolved above. Never force all non-rushers into
    // tackle cooldown here: it made user-blitzing safeties pass harmlessly through the QB.
    matchState.traceAccum += dt;
    if (matchState.traceAccum >= 0.1) {
      traceSample();
      matchState.traceAccum = 0;
    }
    if (matchState.playClock % 0.25 < dt) hud();
  }

  return {
    bind(services) {
      ({
        AIroute,
        H,
        P,
        RUNS,
        airBall,
        applyMotion,
        arrive,
        autoCarry,
        availableRunner,
        blockerAI,
        carrierMove,
        convertQuarterbackScramble,
        cpuQuarterback,
        defenderAI,
        diveForYards,
        finish,
        finishMissedDefenderDive,
        hud,
        insideZoneBlockerAI,
        log,
        manualAthlete,
        matchState,
        message,
        qbAI,
        quarterbackSupport,
        rbLeadBlock,
        rbPassProtection,
        receiverAfterCatchBlock,
        receiverFlightAI,
        receiverRunBlock,
        releasePass,
        resolveBlocks,
        resolvePileDrive,
        resolveTackles,
        runSupportAI,
        stepSpecial,
        stickInput,
        tickGround,
        traceSample,
        userCarry,
      } = services);
    },
    update,
  };
}
