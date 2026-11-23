import { clamp } from "../core/math.js";

export function createPlayerMovement() {
  let acceleration, launchAssist, mass, matchState, maxSpeed, speed, sprintHeld;

  function steer(p, dx, dy, dt, boost = 1) {
    if (p.jukeRecovery > 0) {
      const skill = clamp(
        (p.JUK * 0.36 + p.CUT * 0.29 + p.AGI * 0.23 + p.ACC * 0.12 - 50) / 49,
        0,
        1,
      );
      boost *= 1 + 0.25 * skill;
      p.jukeRecovery = Math.max(0, p.jukeRecovery - dt);
    }
    if (p === matchState.active && matchState.burstTime > 0)
      boost *= 1 + 0.68 * clamp(p.stam / 0.48, 0.15, 1);
    if (p.stun > 0) {
      p.stun = Math.max(0, p.stun - dt);
      dx = 0;
      dy = 0;
      boost = 0.6;
    }
    const goalDistance = Math.hypot(dx, dy);
    let norm = goalDistance;
    if (norm > 1) {
      dx /= norm;
      dy /= norm;
      norm = 1;
    }
    // At arm's length, keep committed pursuit rather than easing off the gas
    // a yard before contact; distance and rated acceleration still govern.
    if (
      p.team === 1 &&
      matchState.ballCarrier &&
      goalDistance > 0.12 &&
      goalDistance < 1 &&
      [
        "kick-cover",
        "punt-cover",
        "return-bypass",
        "return-shed",
        "pursue",
        "contain",
        "run-fit",
        "safety-angle",
      ].includes(p.intent)
    ) {
      dx /= goalDistance;
      dy /= goalDistance;
      norm = 1;
    }
    let vx = p.vx,
      vy = p.vy,
      spd = Math.hypot(vx, vy);
    // Full pursuit includes contain/last-line/run-fit, not only the literal
    // 'pursue' label. Old code accidentally made the outside force defender and
    // safety jog while the ball carrier sprinted straight past them.
    const fullPursuit = [
      "pursue",
      "contain",
      "safety-angle",
      "run-fit",
      "break-on-pass",
      "break-on-ball",
      "air-rally",
      "air-underneath",
      "kick-cover",
      "punt-cover",
      "return-bypass",
      "return-shed",
    ].includes(p.intent);
    const hunting =
      fullPursuit ||
      [
        "escort",
        "block",
        "lead-block",
        "pile-support",
        "rush",
        "run",
        "route",
        "route-finish",
        "route-final-stem",
        "scramble-open",
        "cover-man",
        "cover-zone",
        "carry-auto",
        "run-block",
        "edge-escort",
        "edge-stalk",
        "climb-second-level",
        "zone-drive",
        "zone-combo",
        "zone-climb",
        "zone-search",
        "catch-block",
        "catch-screen",
        "air-track",
        "air-backup",
      ].includes(p.intent);
    const userSteering =
      p === matchState.active &&
      (matchState.controlMode !== "offense" ||
        matchState.manualDrive ||
        (!matchState.ballCarrier && !matchState.passThrown));
    const sprintDistance =
      fullPursuit && matchState.ballCarrier?.team === 0
        ? 0.24
        : fullPursuit
          ? 1.3
          : p.intent === "cover-zone"
            ? 5.5
            : 2.7;
    // Run fits and safety support may accelerate before arriving at the runner.
    // A defender must still *recognize* the run before using knowledge of it.
    // Defensive pursuit must include an endurance decision. Jogging when a
    // tackle is not imminent preserves energy; an approaching score or a tackle
    // window justifies a maximum-effort chase. No forced speed matching.
    const imminent =
      fullPursuit &&
      matchState.ballCarrier &&
      (goalDistance < 16 ||
        matchState.ballCarrier.x > 75 ||
        (p.x < matchState.ballCarrier.x &&
          matchState.ballCarrier.vx > 3 &&
          goalDistance < 28));
    const conserve = fullPursuit && p.stam < 0.37 && !imminent;
    const pursueNow =
      fullPursuit &&
      (imminent || goalDistance < 23 || (p.stam > 0.7 && goalDistance < 36));
    // After a catch, a pursuit defender may lose the first 10 yards by
    // rationing a sprint while the carrier is already at full speed. When the
    // ball is live and the defender is outside tackling distance, close hard;
    // otherwise use the old energy-saving read for deep, low-threat positions.
    const liveChase =
      fullPursuit &&
      matchState.ballCarrier &&
      p.team === 1 &&
      (matchState.ballCarrier.x > p.x - 1.5 || goalDistance < 28);
    const airChase =
      !!matchState.ball?.flying &&
      ["break-on-ball", "air-rally", "air-underneath"].includes(p.intent);
    const aiSprint =
      !userSteering &&
      hunting &&
      p.stam > 0.07 &&
      goalDistance > sprintDistance &&
      p.stun <= 0 &&
      p.blocked < 0.3 &&
      (!fullPursuit || airChase || liveChase || (pursueNow && !conserve));
    const sprinting =
      (aiSprint || (userSteering && sprintHeld() && norm > 0.1)) &&
      p.stam > 0.055;
    p.sprinting = sprinting;
    // AI sprint uses the same full-effort gear as a player's RT rather
    // than a weaker hidden multiplier; still governed by ACC, SPD, and fatigue.
    if (aiSprint)
      boost *=
        clamp(1.2 + (p.ACC - 75) * 0.0012, 1.15, 1.24) *
        clamp(0.68 + p.stam * 0.32, 0.68, 1);
    if (norm > 0.1) {
      const targetAngle = Math.atan2(dy, dx);
      const faceDifference = Math.atan2(
        Math.sin(targetAngle - p.face),
        Math.cos(targetAngle - p.face),
      );
      // Face direction changes quickly; velocity remains physically separate.
      const routeFoot =
        p.intent.startsWith("route") && p.routeBreakTime > 0
          ? clamp(0.83 + (p.CUT - 65) * 0.009 + (p.RTE - 70) * 0.003, 0.63, 1.3)
          : 1;
      const maxTurn =
        (((4.0 + (p.AGI - 55) * 0.105) * routeFoot) /
          (1 + spd * 0.065 + Math.max(0, p.h - 72) * 0.008)) *
        dt;
      p.face += clamp(faceDifference, -maxTurn, maxTurn);
      // A defender doesn't come to a virtual stop every time a
      // receiver catches a ball or the runner changes direction. Rotate some
      // *existing momentum* toward the new pursuit vector. The turn rate is
      // bounded by agility, pursuit skill, recognition, body mass and speed:
      // 180-degree reversals still require braking, but a 20-70 degree redirect
      // can retain substantial momentum. No energy or top speed is created.
      if (p.team === 1 && fullPursuit && spd > 0.65) {
        const heading = Math.atan2(vy, vx),
          desired = Math.atan2(dy, dx);
        const mismatch = Math.atan2(
          Math.sin(desired - heading),
          Math.cos(desired - heading),
        );
        const technique = clamp(
          (p.AGI * 0.52 + p.PUR * 0.33 + p.PRC * 0.15 - 50) / 49,
          0,
          1,
        );
        const bodyTurn = Math.pow(90 / mass(p), 0.13);
        const turnSpeed =
          ((2.25 + 2.15 * technique) * bodyTurn) /
          (1 + Math.max(0, spd - 6) * 0.075);
        // No turning a full-speed runner 180 degrees without a genuine pivot.
        const eligibility = clamp((Math.PI - Math.abs(mismatch)) / 0.95, 0, 1);
        const angle =
          clamp(mismatch, -turnSpeed * dt, turnSpeed * dt) * eligibility;
        const c = Math.cos(angle),
          t = Math.sin(angle);
        const preserved = 1 - Math.abs(angle) * (0.18 - 0.11 * technique);
        const rotatedX = vx * c - vy * t,
          rotatedY = vx * t + vy * c;
        vx = rotatedX * preserved;
        vy = rotatedY * preserved;
      }
      const alignment =
        spd > 0.15 ? (vx * dx + vy * dy) / (Math.hypot(vx, vy) * norm) : 1;
      const traction = clamp(0.9 + (p.AGI - 70) * 0.0027, 0.74, 1.0);
      const turnLoad = clamp(1 - alignment, 0, 2);
      const planting = clamp(
        1 - turnLoad * (0.1 + (95 - p.AGI) * 0.0031),
        0.56,
        1,
      );
      const footwork = clamp(
        (0.6 + p.AGI * 0.009) *
          Math.pow(98 / mass(p), 0.2) *
          p.balance *
          routeFoot,
        0.5,
        2.0,
      );
      // Active foot plant converts sideways skating into turn/braking energy;
      // heavyweight players still take a wider arc than agile skill positions.
      const lateral = vx * -dy + vy * dx;
      // The planted foot still turns the body, but an agile pursuer no longer
      // scrubs off almost all sideways speed after the momentum rotation.
      const pursuitBrake =
        p.team === 1 && fullPursuit
          ? clamp(0.5 - (p.AGI - 60) * 0.004, 0.35, 0.55)
          : 1;
      // At contact distance, commit to the ball carrier instead of endlessly
      // orbiting him on leftover lateral velocity. Preserve turning limits at
      // longer distances and keep this correction limited to live pursuit.
      const tackleApproach =
        p.team === 1 &&
        fullPursuit &&
        matchState.ballCarrier &&
        goalDistance < 3.4;
      const closeControl = tackleApproach ? 1.65 : 1;
      const sidewaysBrake = clamp(
        (2.5 + footwork * 2.9) *
          dt *
          (alignment < 0.8 ? 1 : 0.43) *
          pursuitBrake *
          closeControl,
        0,
        tackleApproach ? 0.34 : 0.22,
      );
      vx += dy * lateral * sidewaysBrake;
      vy -= dx * lateral * sidewaysBrake;
      if (alignment < 0.05) {
        const backwards = Math.max(0, -(vx * dx + vy * dy));
        const brake = clamp((0.85 + footwork * 0.95) * dt, 0, 0.1);
        vx += dx * backwards * brake;
        vy += dy * backwards * brake;
      }
      const turnAssist = 1 + clamp(turnLoad * 0.44 * footwork, 0, 0.6);
      const releaseDrive =
        p.releaseSlow > 0
          ? clamp(0.36 + (p.REL - 30) * 0.0045, 0.37, 0.69)
          : p.releaseBurst > 0
            ? clamp(1.08 + (p.REL - 65) * 0.002, 1.02, 1.17)
            : 1;
      const routeDrive =
        p.intent.startsWith("route") && p.routeBreakTime > 0
          ? clamp(0.93 + (p.CUT - 70) * 0.0048, 0.76, 1.07)
          : 1;
      // A small off-the-mark stride assist. It fades by jogging speed,
      // so ACC still controls launch, SPD remains the absolute top-speed cap,
      // and a moving player receives no artificial speed boost.
      const earlyStride = 1 + 0.16 * clamp((3.2 - spd) / 3.2, 0, 1);
      // Fast initial acceleration until ~85% of the player's *own* rated
      // ceiling, a mild taper near 90%, and a tougher final 95-100%. A 75 SPD
      // defender can never reach a 95 SPD runner's ceiling via this curve.
      const speedFraction = clamp(spd / Math.max(0.1, maxSpeed(p)), 0, 1);
      const accelerationCurve =
        speedFraction <= 0.84
          ? 1.43
          : speedFraction <= 0.9
            ? 1.43 - ((speedFraction - 0.84) / 0.06) * 0.25
            : speedFraction <= 0.95
              ? 1.18 - ((speedFraction - 0.9) / 0.05) * 0.2
              : 0.98 - ((speedFraction - 0.95) / 0.05) * 0.17;
      // Faster first steps for skill positions without changing sprint, rated
      // ceiling, or the existing high-end acceleration taper.
      const launch = launchAssist(p, speedFraction);
      const force =
        acceleration(p) *
        earlyStride *
        accelerationCurve *
        launch *
        (0.67 + 0.33 * p.stam) *
        boost *
        norm *
        traction *
        planting *
        turnAssist *
        releaseDrive *
        routeDrive;
      vx += (dx / norm) * force * dt;
      vy += (dy / norm) * force * dt;
      p.dirX = dx;
      p.dirY = dy;
      // Ratings-driven endurance. Sustained RT sprint still consumes stamina,
      // and sprinting players cannot instantly regenerate while holding RT.
      const endurance = clamp(0.79 + (p.STA - 65) * 0.0085, 0.7, 1.13);
      // Efficient sprint effort: gradual drain at middle speeds, rising steeply
      // when approaching max rated SPD. Player STA softens the energy cost.
      const gear = clamp(
        speed(p) / Math.max(0.01, maxSpeed({ ...p, stam: 1 })),
        0,
        1,
      );
      const topEnd = clamp((gear - 0.72) / 0.28, 0, 1);
      const eliteTop = clamp((p.SPD - 89) / 10, 0, 1);
      const spent = p.sprinting
        ? 0.033 + 0.017 * topEnd + 0.012 * topEnd * topEnd * eliteTop
        : boost > 1.05
          ? 0.024
          : 0.007;
      p.stam = Math.max(0, p.stam - (dt * spent) / endurance);
      // Conserving effort actually recovers energy during a controlled jog.
      // Full sprint carries its own increasing cost near rated top speed.
      if (!p.sprinting && norm > 0.15 && p.stam < 1) {
        const easyPace = clamp(1 - speed(p) / Math.max(1, maxSpeed(p)), 0, 1);
        p.stam = Math.min(
          1,
          p.stam + dt * (0.017 + 0.024 * easyPace) * endurance,
        );
      }
    } else {
      p.sprinting = false;
      p.stam = Math.min(1, p.stam + dt * 0.007 * clamp(p.STA / 75, 0.7, 1.3));
    }
    const drag =
      norm > 0.1 ? (p.team === 1 && fullPursuit ? 0.245 : 0.28) : 3.7;
    vx *= Math.max(0, 1 - drag * dt);
    vy *= Math.max(0, 1 - drag * dt);
    // A right-stick cut has a deliberately short sideways *velocity profile*.
    // Previous versions only added a small force, which forward left-stick
    // steering immediately canceled at full speed. A plant briefly trades some
    // forward velocity for lateral travel while respecting the SPD speed cap.
    if (p.jukeDrive && p.jukeDrive.remaining > 0) {
      const j = p.jukeDrive,
        progress = 1 - j.remaining / j.duration;
      const agility = clamp(0.67 + (p.AGI - 60) * 0.012, 0.36, 1.16);
      const effort = (0.36 + 0.64 * j.power) * agility;
      const targetLateral =
        (8.0 +
          Math.max(0, p.CUT - 70) * 0.023 +
          Math.max(0, p.JUK - 70) * 0.022) *
        effort;
      // Quick plant and lateral shift, then begin a physical replant rather
      // than endlessly sliding toward the sideline.
      const envelope =
        progress < 0.11
          ? progress / 0.11
          : progress < 0.7
            ? 1
            : clamp((1 - progress) / 0.3, 0, 1);
      const currentLateral = vx * j.nx + vy * j.ny;
      const delta = clamp(
        targetLateral * envelope - currentLateral,
        -60 * dt,
        60 * dt,
      );
      vx += j.nx * delta;
      vy += j.ny * delta;
      // A juke is a short sideways plant, not a diagonal sprint. Reduce the
      // forward component at the peak of the cut; then recover it naturally as
      // the envelope fades. A sharper AGI/CUT player can plant closer to 90°.
      const plantSkill = clamp(
        (p.JUK * 0.4 + p.CUT * 0.29 + p.AGI * 0.21 + p.ACC * 0.1 - 48) / 51,
        0,
        1,
      );
      // Better cutting technique preserves forward momentum. A lateral cut must
      // still trade some forward speed: don't exceed the SPD cap or teleport.
      const forwardLimit =
        maxSpeed(p) * (1 - (0.64 - 0.24 * plantSkill) * envelope);
      const forwardSpeed = vx * j.fx + vy * j.fy;
      if (forwardSpeed > forwardLimit) {
        const plantBrake = Math.min(forwardSpeed - forwardLimit, 70 * dt);
        vx -= j.fx * plantBrake;
        vy -= j.fy * plantBrake;
      }
      j.remaining = Math.max(0, j.remaining - dt);
      if (j.remaining <= 0) {
        p.jukeDrive = null;
        p.jukeRecovery = clamp(0.18 + 0.21 * plantSkill, 0.18, 0.39);
      }
    }

    const s = Math.hypot(vx, vy);
    // Two genuine gears: steady running and full sprint. Releasing RT now
    // decreases the available speed, so a sprinting DB can gain ground on a
    // non-sprinting runner. This applies equally to human and AI athletes.
    // Burst is a short acceleration kick, not permanent 20% extra top speed.
    const burstCeiling = 1; // SPD rating is an absolute self-powered ceiling, even during burst
    const targetCap =
      maxSpeed(p) *
      (p.sprinting ? 1 : 0.84) *
      (p.covering ? 0.92 : 1) *
      burstCeiling;
    if (p.gaitCap === null || !Number.isFinite(p.gaitCap))
      p.gaitCap = targetCap;
    const capRise = dt * clamp(5 + (p.ACC - 65) * 0.065, 3, 8);
    const capFall = dt * clamp(4.4 + (p.AGI - 65) * 0.04, 3.2, 6.2);
    p.gaitCap += clamp(targetCap - p.gaitCap, -capFall, capRise);
    if (s > p.gaitCap) {
      vx *= p.gaitCap / s;
      vy *= p.gaitCap / s;
    }
    p.vx = vx;
    p.vy = vy;
  }

  // Deliberate braking prevents orbiting a completed route or an idle assignment.
  function arrive(p, tx, ty, dt, boost = 1) {
    const dx = tx - p.x,
      dy = ty - p.y,
      d = Math.hypot(dx, dy),
      v = speed(p);
    if (d < 0.38) {
      if (v > 0.35) steer(p, -p.vx, -p.vy, dt, 0.94);
      else steer(p, 0, 0, dt);
      return;
    }
    const closing = (p.vx * dx + p.vy * dy) / Math.max(0.1, d);
    const stopDistance =
      Math.max(0, closing) ** 2 / (2 * Math.max(1, acceleration(p) * 0.8));
    if (stopDistance > d * 0.87 && closing > 0.5) {
      steer(p, -p.vx, -p.vy, dt, 0.99);
      return;
    }
    steer(p, dx, dy, dt, boost);
  }

  return {
    bind(services) {
      ({
        acceleration,
        launchAssist,
        mass,
        matchState,
        maxSpeed,
        speed,
        sprintHeld,
      } = services);
    },
    steer,
    arrive,
  };
}
