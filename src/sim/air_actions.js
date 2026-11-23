import { clamp, distance2D as dist } from "../core/math.js";

export function createAirActions() {
  let G,
    H,
    P,
    defenderAirEligibility,
    defenderAirInteractionZone,
    defensiveOpenFieldDive,
    hud,
    matchState,
    message;

  // A pass is a contest at a physical catch point, not an automatic receiver win.
  // X/A/Y commands only become ball-in-air commands AFTER the QB has released it.
  // The intended receiving point is calculated once by the QB's actual ballistic
  // throw. Tracking AI may REACT to that information, but it never teleports or
  // moves the ball. The separate ground intercept follows the live trajectory.
  function flightMarkers(b = matchState.ball) {
    if (!b?.flying) return null;
    const remaining = Math.max(0, (b.flight ?? b.t) - b.t);
    const catchX = clamp(
      Number.isFinite(b.aimX) ? b.aimX : b.x + b.vx * remaining,
      0,
      120,
    );
    const catchY = clamp(
      Number.isFinite(b.aimY) ? b.aimY : b.y + b.vy * remaining,
      0.15,
      H - 0.15,
    );
    const gTime = Math.max(
      0,
      ((b.vz || 0) +
        Math.sqrt(Math.max(0, (b.vz || 0) ** 2 + 2 * G * Math.max(0, b.z)))) /
        G,
    );
    return {
      catchX,
      catchY,
      groundX: clamp(b.x + b.vx * gTime, 0, 120),
      groundY: clamp(b.y + b.vy * gTime, 0, H),
      remaining,
      shadowX: b.x,
      shadowY: b.y,
    };
  }

  // V30: visual feedback is a record of the user's actual action choice, not a
  // promise that the resulting catch/swat/hurdle will succeed.
  const AIR_LABELS = {
    rac: "RAC",
    possession: "POSSESSION",
    aggressive: "AGGRESSIVE",
    swat: "SWAT",
    ball: "BALL HAWK",
    receiver: "PLAY RECEIVER",
    hurdle: "HURDLE",
  };

  function actionCue(p, kind, result = false) {
    if (!p) return;
    p.actionCue = {
      kind,
      label: (AIR_LABELS[kind] || kind.toUpperCase()) + (result ? "!" : ""),
      time: result ? 1.15 : 1.0,
      result,
    };
  }

  function startAirAnimation(p, kind, stage = "attempt") {
    if (!p) return;
    // An anticipation pose does not cause a player to leap from 25 yards away.
    const duration =
      stage === "ready"
        ? 2.0
        : kind === "aggressive" || kind === "ball"
          ? 0.78
          : kind === "swat"
            ? 0.64
            : 0.58;
    if (
      stage === "ready" &&
      p.airPose?.stage === "attempt" &&
      p.airPose.time > 0
    )
      return;
    if (
      stage === "attempt" &&
      p.airPose?.stage === "attempt" &&
      p.airPose.kind === kind &&
      p.airPose.time > 0.2
    )
      return;
    p.airPose = {
      kind: stage === "ready" ? "ready-" + kind : kind,
      stage,
      time: duration,
      duration,
      age: 0,
      flavor: p.animationFlavor || 0,
    };
    if (stage === "attempt") actionCue(p, kind, true);
  }

  function cueForSelectedCatch() {
    if (matchState.phase !== "live" || !matchState.ball?.flying) return;
    const f = flightMarkers(),
      remaining = f.remaining;
    if (remaining > 0.37) return;
    const receiv = matchState.intended;
    if (
      receiv &&
      !receiv.ground &&
      dist(receiv, { x: f.catchX, y: f.catchY }) < 3.8 &&
      matchState.airSelection.offense
    ) {
      startAirAnimation(receiv, matchState.airSelection.offense, "attempt");
    }
    const d = matchState.airSelection.defenderKey
      ? P(matchState.airSelection.defenderKey)
      : null;
    // Queuing from 20 yards away never starts a jump. Only a defender arriving
    // within the actual catch area can begin the attempt pose as the ball drops.
    if (
      d &&
      !d.ground &&
      dist(d, { x: f.catchX, y: f.catchY }) < 2.9 &&
      defenderAirEligibility(d).reachable &&
      matchState.airSelection.defense
    ) {
      startAirAnimation(d, matchState.airSelection.defense, "attempt");
    }
  }

  function chooseAirAction(kind, source = "gamepad") {
    if (
      matchState.phase !== "live" ||
      !matchState.ball?.flying ||
      matchState.paused
    )
      return false;
    if (
      matchState.controlMode === "defense" &&
      !defenderAirInteractionZone(P(matchState.selectedDefenderKey))
    ) {
      // An uninvolved defender cannot claim a remote pass reaction; X remains
      // the regular committed tackle dive. A/Y can be HELD and queued once the
      // moving player legitimately becomes eligible (see controller polling).
      return kind === "swat" ? defensiveOpenFieldDive() : false;
    }
    if (matchState.controlMode === "offense") {
      if (!["rac", "possession", "aggressive"].includes(kind)) return false;
      matchState.airSelection.offense = kind;
      if (matchState.intended) {
        startAirAnimation(matchState.intended, kind, "ready");
        actionCue(matchState.intended, kind);
      }
      message(
        "<strong>" +
          kind.toUpperCase() +
          " CATCH selected.</strong> Timing, ratings, flight and defensive positioning still decide.",
      );
    } else if (matchState.controlMode === "defense") {
      if (!["swat", "ball", "receiver"].includes(kind)) return false;
      matchState.airSelection.defense = kind;
      matchState.airSelection.defenderKey = matchState.selectedDefenderKey;
      const d = P(matchState.selectedDefenderKey);
      // Queue intent only. Reaching/jumping is an entirely separate late-ball
      // animation that plays only when the receiver contest develops physically.
      if (d) actionCue(d, kind);
      message(
        "<strong>" +
          { swat: "SWAT", ball: "BALL HAWK", receiver: "PLAY RECEIVER" }[kind] +
          "</strong> QUEUED for " +
          (d?.name || "defender") +
          ". Actual contact requires timing, reach, and position.",
      );
    } else return false;
    hud();
    return true;
  }

  return {
    bind(services) {
      ({
        G,
        H,
        P,
        defenderAirEligibility,
        defenderAirInteractionZone,
        defensiveOpenFieldDive,
        hud,
        matchState,
        message,
      } = services);
    },
    flightMarkers,
    actionCue,
    startAirAnimation,
    cueForSelectedCatch,
    chooseAirAction,
  };
}
