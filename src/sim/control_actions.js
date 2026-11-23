import { distance2D as dist } from "../core/math.js";
import { DefensivePresnap } from "../ai/defensive_presnap.js";
import { ChaosTackleIntelligence } from "../ai/tackle_intelligence.js";
import { AirContestPolicy } from "../physics/air_contest_policy.js";

export function createControlActions() {
  let P,
    RUNS,
    TEAM_NAMES,
    autoCarry,
    blockBattle,
    catchReach,
    closestThreat,
    eligibleTargets,
    emitPresentation,
    flightMarkers,
    hud,
    log,
    matchState,
    maxSpeed,
    message,
    protectBall,
    radius,
    steer,
    stickInput;

  function selectControlMode(mode) {
    if (!["offense", "defense", "line"].includes(mode)) return false;
    protectBall(false);
    matchState.controlMode = mode;
    matchState.manualDrive = false;
    emitPresentation({ type: "rightStickReset" });
    matchState.queuedCarrierMove = null;
    matchState.active =
      matchState.phase === "live"
        ? mode === "defense"
          ? P(matchState.selectedDefenderKey)
          : mode === "line"
            ? P(matchState.selectedLinemanKey)
            : matchState.ballCarrier || P("QB")
        : null;
    emitPresentation({ type: "controlModeChanged", mode });
    hud();
    return true;
  }

  function cycleControlMode() {
    if (matchState.gameStarted) {
      message(
        "<strong>GAME DAY.</strong> " +
          TEAM_NAMES[matchState.controllerTeams.local] +
          " controls offense when receiving and defense when " +
          TEAM_NAMES[matchState.controllerTeams.cpu] +
          " has the football. Use practice reset for manual role testing.",
      );
      return matchState.controlMode;
    }
    const all = ["offense", "defense", "line"];
    return selectControlMode(
      all[(all.indexOf(matchState.controlMode) + 1) % all.length],
    );
  }

  // Movement updates only the selected player's actual location and the
  // matching zone shade / run-fit lane. Man targets and rush/spy roles persist.
  function positionSelectedDefender(dt) {
    if (
      matchState.paused ||
      matchState.phase !== "presnap" ||
      matchState.controlMode !== "defense" ||
      matchState.specialState ||
      matchState.playbookOpen ||
      matchState.audibleOpen ||
      !matchState.scrimmagePlayCalled
    )
      return false;
    const d = P(matchState.selectedDefenderKey),
      axes = stickInput();
    const next = DefensivePresnap.move(
      d,
      axes,
      dt,
      matchState.playStart,
      matchState.def,
      sprintHeld(),
    );
    if (!next) return false;
    d.x = next.x;
    d.y = next.y;
    d.vx = 0;
    d.vy = 0;
    d.face = Math.atan2(axes.y, axes.x);
    if (d.assignment?.kind === "zone") {
      const a = d.assignment;
      if (a.homeX === undefined) {
        a.homeX = a.baseX;
        a.homeY = a.baseY;
      }
      const anchor = DefensivePresnap.zoneAnchor(d);
      a.baseX = anchor.x;
      a.baseY = anchor.y;
    }
    // Keep the run-fit lane anchored to the offensive gaps; moving a linebacker
    // alters his approach angle, not which A/B gap he is assigned.
    // Stunt lane logic remains assigned, but ordinary rushers can use
    // their shifted starting lane rather than returning to the old spot.
    if (d.rush && d.passRushStyle !== "stunt") d.passRushLane = d.y;
    return true;
  }

  function switchDefender() {
    if (
      matchState.controlMode !== "defense" ||
      (matchState.phase !== "live" && matchState.phase !== "presnap")
    )
      return false;
    let next;
    if (matchState.phase === "presnap") {
      // Predictable left-to-right sequence: defensive front, linebackers, corners, safeties.
      const category = (d) =>
        ["EDGE", "DE", "DT", "NT"].includes(d.pos)
          ? 0
          : ["LB", "OLB", "MLB"].some((v) => d.pos.includes(v))
            ? 1
            : d.pos === "CB"
              ? 2
              : 3;
      const order = [...matchState.def].sort(
        (a, b) => category(a) - category(b) || a.y - b.y,
      );
      const i = order.findIndex(
        (d) => d.key === matchState.selectedDefenderKey,
      );
      next = order[(i + 1) % order.length];
    } else {
      const carrier = matchState.ballCarrier || P("QB");
      if (!carrier) return false;
      const airborne = !!matchState.ball?.flying;
      const spot = airborne ? matchState.intended || flightMarkers() : carrier;
      const point =
        airborne && !matchState.intended
          ? { x: spot.catchX, y: spot.catchY }
          : spot;
      const order = [...matchState.def]
        .filter((d) => !d.ground)
        .sort((a, b) => {
          const distance = dist(a, point) - dist(b, point);
          return Math.abs(distance) > 0.01
            ? distance
            : a.key.localeCompare(b.key);
        });
      next = order.find((d) => d.key !== matchState.selectedDefenderKey);
    }
    if (!next) return false;
    matchState.selectedDefenderKey = next.key;
    matchState.active = next;
    hud();
    log("USER DEFENDER → " + next.pos);
    return true;
  }

  function manualAthlete(p, dt, label) {
    // A diving tackle is a committed momentum action. Steering again during its
    // flight made the athlete visually truck/turn before falling a second time.
    if (p.action?.kind === "tackle-dive" && p.action.time > 0) {
      p.intent = "committed-dive";
      p.intentTarget = "user";
      return;
    }
    p.intent = label;
    p.intentTarget = "user";
    const input = stickInput();
    if (input.mag > 0.13)
      steer(p, input.x, input.y, dt, sprintHeld() ? 1.2 : 1.0);
    else steer(p, 0, 0, dt);
  }

  // An athlete tracking the target receiver may queue a response *well before*
  // reaching the landing area if he can realistically arrive in time. Rotating
  // help defenders qualify independently after reading the ball. No animations
  // or interceptions are granted by this decision; physical ball contact remains
  // controlled by airBall() and the existing reach/ratings checks.
  function defenderAirEligibility(d) {
    return AirContestPolicy.evaluate(
      d,
      matchState.intended,
      flightMarkers(),
      matchState.ball,
      d ? maxSpeed(d) : 0,
      d ? catchReach(d) : 0,
    );
  }

  function defenderAirInteractionZone(d) {
    return defenderAirEligibility(d).eligible;
  }

  function defensiveOpenFieldDive() {
    const d = P(matchState.selectedDefenderKey);
    if (
      matchState.controlMode !== "defense" ||
      matchState.phase !== "live" ||
      !d ||
      matchState.paused ||
      !matchState.ball?.flying ||
      d.stun > 0 ||
      d.ground ||
      d.tackleCooldown > 0 ||
      d.diveRecovery > 0 ||
      d.action?.time > 0
    )
      return false;
    const stick = stickInput();
    const angle = Number.isFinite(d.face) ? d.face : Math.PI;
    const dx = stick.mag > 0.14 ? stick.x : Math.cos(angle),
      dy = stick.mag > 0.14 ? stick.y : Math.sin(angle);
    const length = Math.max(0.01, Math.hypot(dx, dy));
    d.action = { kind: "tackle-dive", time: 0.53, age: 0, used: false };
    d.technique = "tackle-dive";
    d.pulse = 0.3;
    d.stam = Math.max(0, d.stam - 0.032);
    d.diveRecovery = Math.max(d.diveRecovery, 1.2);
    d.tackleCooldown = Math.max(d.tackleCooldown, 0.68);
    d.vx += (dx / length) * 1.28;
    d.vy += (dy / length) * 1.28;
    d.face = Math.atan2(dy, dx);
    d.intent = "committed-dive";
    d.intentTarget = "user";
    log(d.pos + " OPEN-FIELD DIVE (ball out of reach)");
    return true;
  }

  function defensiveFaceButton(button) {
    const d = P(matchState.selectedDefenderKey);
    if (
      matchState.controlMode !== "defense" ||
      matchState.phase !== "live" ||
      !d ||
      matchState.paused ||
      matchState.ball?.flying
    )
      return false;
    if (button === "A") {
      // Only indicate intent; no phantom animation, grip, or tackle. A may be
      // held for many frames without any opponent in reach.
      d.conservativeHeld = true;
      d.conservativeUntil = matchState.playClock + 0.23;
      return true;
    }
    if (button !== "X") return false;
    return commitDefenderImpact(d, "X");
  }

  function commitDefenderImpact(d, mode = "X") {
    if (
      !d ||
      d.team !== 1 ||
      d.stun > 0 ||
      d.ground ||
      d.tackleCooldown > 0 ||
      d.diveRecovery > 0 ||
      d.action?.time > 0
    )
      return false;
    // No target selection: launch along player motion or left-stick direction.
    const dir = ChaosTackleIntelligence.direction(d, stickInput());
    const nearest = matchState.off
      .filter((o) => !o.ground)
      .map((o) => ({ o, gap: dist(d, o) }))
      .sort((a, b) => a.gap - b.gap)[0];
    const near = nearest && nearest.gap <= radius(d) + radius(nearest.o) + 0.5;
    const kind =
      mode === "cut-stick"
        ? "cut-stick"
        : mode === "hit-stick" || near
          ? "hit-stick"
          : "tackle-dive";
    d.action = {
      kind,
      time: kind === "tackle-dive" ? 0.53 : 0.38,
      age: 0,
      used: false,
      direction: { ...dir },
      impactContactKey: null,
    };
    d.technique = kind;
    d.pulse = 0.3;
    d.stam = Math.max(0, d.stam - (kind === "tackle-dive" ? 0.032 : 0.026));
    d.face = Math.atan2(dir.y, dir.x);
    const launch =
      kind === "tackle-dive" ? 1.6 : kind === "cut-stick" ? 0.55 : 0.75;
    d.vx += dir.x * launch;
    d.vy += dir.y * launch;
    if (kind === "tackle-dive") {
      d.diveRecovery = Math.max(d.diveRecovery, 1.2);
      d.tackleCooldown = Math.max(d.tackleCooldown, 0.68);
    }
    // Power contact has no pre-contact tackle cooldown: the collision solver
    // must be able to observe the actual impact on this frame.
    d.intent = "committed-" + kind;
    d.intentTarget = "direction";
    log(d.pos + " commits " + kind + " (directional; no target lock)");
    return true;
  }

  function defensiveStick(kind) {
    const d = P(matchState.selectedDefenderKey);
    if (
      matchState.controlMode !== "defense" ||
      matchState.phase !== "live" ||
      !d ||
      matchState.paused ||
      matchState.ball?.flying
    )
      return false;
    if (kind !== "hit-stick" && kind !== "cut-stick") return false;
    return commitDefenderImpact(d, kind);
  }

  function lineImpact() {
    const o = P(matchState.selectedLinemanKey);
    if (
      matchState.controlMode !== "line" ||
      matchState.phase !== "live" ||
      !o ||
      matchState.paused
    )
      return false;
    o.action = { kind: "impact-block", time: 0.53, age: 0, used: false };
    o.technique = "impact-block";
    o.pulse = 0.33;
    o.stam = Math.max(0, o.stam - 0.021);
    const threat = closestThreat(o, matchState.def);
    if (threat.p && threat.d < 2.5) blockBattle(o, threat.p, 1 / 60);
    log(o.pos + " drives impact block");
    return true;
  }

  function sprintHeld() {
    return matchState.controls.sprint;
  }

  function userCarry(p, dt) {
    const input = stickInput();
    if (matchState.suppressManualUntilNeutral) {
      if (input.mag <= 0.12) matchState.suppressManualUntilNeutral = false;
      autoCarry(p, dt);
      return;
    }
    if (input.mag > 0.12) matchState.manualDrive = true;
    if (matchState.manualDrive) {
      p.intent = input.mag > 0.12 ? "carry-manual" : "carry-coast";
      p.intentTarget = "user";
      if (input.mag > 0.12)
        steer(p, input.x, input.y, dt, sprintHeld() ? 1.2 : 1.0);
      else steer(p, 0, 0, dt); // neutral stick brakes; does NOT reactivate AI by surprise
    } else autoCarry(p, dt);
  }

  function receiverPromptTargets() {
    if (
      matchState.controlMode !== "offense" ||
      matchState.possession !== matchState.controllerTeams.local ||
      matchState.paused ||
      matchState.matchOver ||
      matchState.specialState ||
      (matchState.tryState && matchState.tryState.mode !== "two") ||
      (matchState.phase !== "presnap" && matchState.phase !== "live") ||
      RUNS.has(matchState.selectedPlay) ||
      matchState.passThrown ||
      matchState.ball?.flying ||
      matchState.ballCarrier
    )
      return [];
    // Dropback possession is implicit until the QB throws or becomes a runner.
    const qb = P("QB");
    if (
      !qb ||
      (matchState.phase === "live" &&
        (matchState.active !== qb || qb.x > matchState.playStart + 0.1))
    )
      return [];
    return eligibleTargets();
  }

  return {
    bind(services) {
      ({
        P,
        RUNS,
        TEAM_NAMES,
        autoCarry,
        blockBattle,
        catchReach,
        closestThreat,
        eligibleTargets,
        emitPresentation,
        flightMarkers,
        hud,
        log,
        matchState,
        maxSpeed,
        message,
        protectBall,
        radius,
        steer,
        stickInput,
      } = services);
    },
    selectControlMode,
    cycleControlMode,
    positionSelectedDefender,
    switchDefender,
    manualAthlete,
    defenderAirEligibility,
    defenderAirInteractionZone,
    defensiveOpenFieldDive,
    defensiveFaceButton,
    defensiveStick,
    lineImpact,
    sprintHeld,
    userCarry,
    receiverPromptTargets,
  };
}
