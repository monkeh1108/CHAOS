import { clamp, distance2D as dist, hypot } from "../core/math.js";

export function createPassControl() {
  let AIroute,
    G,
    H,
    MPS_TO_MPH,
    P,
    PASS_ICONS,
    RUNS,
    YARD_M,
    closestThreat,
    eligibleTargets,
    emitPresentation,
    hud,
    log,
    matchState,
    message,
    rand,
    speed;

  // Predict where a receiver will actually be after the football's flight time.
  // This copies his physics state and executes the same route steering, rather than
  // guessing by simply multiplying current velocity (which fails on route breaks).
  function projectedReceiver(rec, flight) {
    const ghost = {
      ...rec,
      route: rec.route ? rec.route.map((pt) => pt.slice()) : null,
      prediction: true,
    };
    const steps = Math.max(1, Math.ceil(flight * 60)),
      dt = flight / steps;
    for (let i = 0; i < steps; i++) {
      AIroute(ghost, dt);
      ghost.x = clamp(ghost.x + ghost.vx * dt, 7, 112);
      ghost.y = clamp(ghost.y + ghost.vy * dt, -0.3, H + 0.3);
    }
    return { x: ghost.x, y: ghost.y };
  }

  // Single receiver choice determines the pass. The QB, rather than the player,
  // calculates release, lead and ballistic arc; THA/pressure/distance create misses.
  function convertQuarterbackScramble() {
    const qb = P("QB");
    if (
      matchState.phase !== "live" ||
      RUNS.has(matchState.selectedPlay) ||
      matchState.passThrown ||
      matchState.ballCarrier ||
      !qb ||
      qb.x <= matchState.playStart + 0.1
    )
      return false;
    matchState.pendingPass = null;
    matchState.ballCarrier = qb;
    qb.touches++;
    // Stay under user control, including if the left stick remains held forward.
    if (matchState.controlMode === "offense") {
      matchState.active = qb;
      matchState.manualDrive = true;
      matchState.suppressManualUntilNeutral = false;
    }
    matchState.tackleLinks.clear();
    matchState.pileState = null;
    emitPresentation({ type: "receiverPromptsHidden" });
    message(
      "<strong>QB scramble!</strong> Beyond the line of scrimmage: forward passing is locked and the offense blocks.",
    );
    log("QB CROSSES LOS · RUSH · " + qb.name);
    hud();
    return true;
  }

  function startPass(index, source = "keyboard") {
    convertQuarterbackScramble();
    if (
      matchState.paused ||
      matchState.phase !== "live" ||
      RUNS.has(matchState.selectedPlay) ||
      matchState.passThrown ||
      matchState.ballCarrier
    )
      return false;
    if (matchState.pendingPass) return false;
    if (!eligibleTargets()[index]) return false;
    matchState.pendingPass = { index, start: matchState.playClock, source };
    return true;
  }

  function releasePass(duration = null) {
    if (!matchState.pendingPass) return false;
    const pending = matchState.pendingPass;
    matchState.pendingPass = null;
    return passTo(
      pending.index,
      duration === null ? matchState.playClock - pending.start : duration,
    );
  }

  function passTo(index, hold = 0.27) {
    convertQuarterbackScramble();
    if (
      matchState.paused ||
      matchState.phase !== "live" ||
      RUNS.has(matchState.selectedPlay) ||
      matchState.passThrown ||
      matchState.ballCarrier ||
      !P("QB")
    )
      return false;
    const qb = P("QB"),
      rec = eligibleTargets()[index];
    if (!rec) return false;
    matchState.airSelection = {
      offense: null,
      defense: null,
      defenderKey: null,
    };
    matchState.lastAirResult = null;
    const dx = rec.x - qb.x,
      dy = rec.y - qb.y,
      range = hypot(dx, dy);
    // Holding the icon shapes a real ballistic flight: tap=lob, medium=touch,
    // full hold=bullet. THP controls the maximum launch velocity and range.
    const charge = clamp((hold - 0.09) / 0.48, 0, 1),
      loft = 1 - charge;
    const minV = 23 + (qb.THP - 65) * 0.22;
    const flight = clamp((range / minV) * (1.13 + loft * 0.93), 0.39, 2.45);
    const maxRange = 35 + (qb.THP - 65) * 0.66;
    const powerFactor = range > maxRange ? maxRange / range : 1;
    const predicted = projectedReceiver(rec, flight);
    const pressureDist = closestThreat(
      qb,
      matchState.def.filter((d) => d.rush),
    ).d;
    const pressure = clamp((4.8 - pressureDist) / 4.8, 0, 1);
    const motion = clamp(speed(qb) / 7, 0, 1);
    const rating = clamp((qb.THA - 35) / 64, 0, 1);
    // Normal throws are predominantly catchable: slight misses are possible even with
    // high THA, whereas low THA, distance, moving throws and pressure widen the spread.
    const runPenalty =
      motion * (1 - clamp(((qb.TOR ?? qb.THA) - 30) / 69, 0, 1)) * 0.9;
    const spread =
      0.24 +
      (1 - rating) * 1.25 +
      range * 0.012 +
      pressure * 1.1 +
      motion * 0.18 +
      runPenalty;
    const missX = clamp(
      (rand() + rand() + rand() - 1.5) * spread * 1.4,
      -2.7,
      2.7,
    );
    const missY = clamp(
      (rand() + rand() + rand() - 1.5) * spread * 1.4,
      -2.7,
      2.7,
    );
    const aimX = clamp(
        qb.x + (predicted.x - qb.x) * powerFactor + missX,
        7.2,
        111,
      ),
      aimY = clamp(predicted.y + missY, 0.3, H - 0.3);
    const missSize = Math.hypot(missX, missY);
    const quality =
      missSize < 0.4
        ? "ON TARGET"
        : missSize < 1.35
          ? "SLIGHTLY OFF"
          : "OFF TARGET";
    const originX = qb.x + 0.6,
      originY = qb.y;
    const originZ = (qb.h * 0.0254 + 0.18) / YARD_M,
      targetZ = (rec.h * 0.0254 * 0.63) / YARD_M;
    const vx = (aimX - originX) / flight,
      vy = (aimY - originY) / flight;
    const vz = (targetZ - originZ + 0.5 * G * flight * flight) / flight;
    matchState.ball = {
      x: originX,
      y: originY,
      z: originZ,
      vx,
      vy,
      vz,
      t: 0,
      flight,
      aimX,
      aimY,
      quality,
      accuracyError: missSize,
      pressure,
      ttl: flight + 0.9,
      flying: true,
      style: charge < 0.32 ? "LOB" : charge > 0.77 ? "BULLET" : "TOUCH",
      charge,
      loft,
      attempts: [],
      deflected: false,
    };
    if (matchState.currentMemoryPlay) {
      matchState.currentMemoryPlay.target = rec.key;
      matchState.currentMemoryPlay.airYards = Math.max(
        0,
        aimX - matchState.playStart,
      );
    }
    matchState.intended = rec;
    matchState.active = null;
    matchState.passThrown = true;
    for (const o of matchState.off) {
      const skill = 0.56 * o.AWR + 0.44 * (o.RTE || o.AWR);
      o.airReadAt = clamp(
        (o === rec ? 0.045 : 0.19) +
          (99 - skill) * 0.0035 +
          ((o.routeVariation?.tempo || 1) - 1) * 0.3,
        0.03,
        0.48,
      );
    }
    for (const d of matchState.def) {
      const primary = d.assignment?.target === rec.key || dist(d, rec) < 4.6;
      const recognize =
        0.48 * d.AWR + 0.32 * d.PRC + 0.2 * (d.RCR || d.COV || d.AWR);
      const far = Math.hypot(d.x - aimX, d.y - aimY);
      const base = primary ? 0.07 : 0.19;
      d.airReadAt = clamp(
        base +
          (99 - recognize) * 0.0042 +
          (!primary && far > 22 ? 0.055 : 0) +
          (d.coverageVariation?.react || 0) * 0.75,
        0.06,
        0.73,
      );
    }
    qb.vx *= 0.5;
    qb.vy *= 0.5;
    const mph = Math.hypot(vx, vy, vz) * YARD_M * MPS_TO_MPH;
    message(
      "<strong>" +
        matchState.ball.style +
        " · " +
        quality +
        ".</strong> " +
        qb.name +
        " leads " +
        rec.name +
        " · " +
        range.toFixed(0) +
        " yd · " +
        mph.toFixed(0) +
        " mph.",
    );
    log(
      "PASS " +
        matchState.ball.style +
        " " +
        PASS_ICONS[index] +
        " → " +
        rec.name +
        " · " +
        quality +
        " · THA " +
        qb.THA,
    );
    emitPresentation({ type: "receiverPromptsHidden" });
    hud();
    return true;
  }

  function switchToIntendedReceiver() {
    if (
      matchState.phase !== "live" ||
      matchState.controlMode !== "offense" ||
      !matchState.ball?.flying ||
      !matchState.intended ||
      matchState.intended.ground
    )
      return false;
    matchState.active = matchState.intended;
    matchState.manualReceiver = true;
    message(
      "<strong>USER RECEIVER · " +
        matchState.intended.name +
        ".</strong> Left stick adjusts the catch point · X RAC / A possession / Y aggressive.",
    );
    log("USER SWITCH → " + matchState.intended.key + " (airborne pass)");
    hud();
    return true;
  }

  return {
    bind(services) {
      ({
        AIroute,
        G,
        H,
        MPS_TO_MPH,
        P,
        PASS_ICONS,
        RUNS,
        YARD_M,
        closestThreat,
        eligibleTargets,
        emitPresentation,
        hud,
        log,
        matchState,
        message,
        rand,
        speed,
      } = services);
    },
    projectedReceiver,
    convertQuarterbackScramble,
    startPass,
    releasePass,
    passTo,
    switchToIntendedReceiver,
  };
}
