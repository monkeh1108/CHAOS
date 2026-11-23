import { clamp, distance2D as dist } from "../core/math.js";
import { CoverageRoutePolicy } from "../ai/coverage_route_policy.js";
import { InsideZoneIQ } from "../ai/inside_zone_iq.js";
import { RushAwareness } from "../ai/rush_awareness.js";
import { ChaosTackleIntelligence } from "../ai/tackle_intelligence.js";

export function createDefensiveReaction() {
  let H,
    P,
    RUNS,
    arrive,
    blockBattle,
    closestThreat,
    flightMarkers,
    matchState,
    pursuitAI,
    radius,
    recognizeRun,
    runFitAI,
    skillOffense,
    speed,
    steer;

  function quarterbackSpyAI(d, qb, dt) {
    // Stay goal-side of the quarterback, mirror lateral rollouts, then attack
    // once the QB threatens the line. Don't abandon the area chasing a fake.
    const nearLOS = qb.x >= matchState.playStart - 2.4;
    const near = dist(d, qb) < 4.2;
    const tx =
      nearLOS || near
        ? qb.x + 0.3
        : Math.max(matchState.playStart + 1.0, qb.x + 3.0);
    const ty = clamp(qb.y + qb.vy * (nearLOS ? 0.1 : 0.2), 4, H - 4);
    d.intent = nearLOS || near ? "spy-close" : "qb-spy";
    d.intentTarget = "QB";
    steer(d, tx - d.x, ty - d.y, dt, nearLOS ? 1.17 : 0.96);
  }

  function passRushAI(d, qb, dt) {
    const isEdge =
      ["EDGE", "DE"].includes(d.pos) || (d.key === "SAM" && d.rush);
    const left = d.spawnY < 26.65;
    const threat =
      qb.x >= matchState.playStart - 2.6 || Math.abs(qb.y - 26.65) > 5.0;
    let tx = qb.x;
    let ty, mode;
    if (isEdge) {
      // Set the outside shoulder. Edge rushers must not both dive through center.
      // An actual QB rollout overrides the anchor as the rusher closes downfield.
      const outside = left ? -1 : 1;
      const offset = matchState.selectedPressure === "contain" ? 3.6 : 2.65;
      ty = clamp(qb.y + outside * (threat ? 1.0 : offset), 1.8, H - 1.8);
      tx = qb.x + clamp(qb.x - d.x, -0.3, 0.9);
      mode = threat ? "edge-close" : "edge-contain";
      if (threat && ((left && qb.y < 26.65) || (!left && qb.y >= 26.65))) {
        ty = qb.y + outside * 0.45;
        tx = qb.x + 0.3;
        mode = "edge-crash";
      }
    } else if (
      d.passRushStyle === "stunt" &&
      matchState.playClock > 0.4 &&
      matchState.playClock < 2.4
    ) {
      ty = d.passRushLane;
      tx = qb.x + 0.4;
      mode = "stunt";
    } else if (d.blitz) {
      ty = clamp(qb.y + (d.spawnY < 26.65 ? -1.2 : 1.2), 2, H - 2);
      mode = "blitz";
    } else {
      const lane = clamp((d.spawnY - 26.65) * 0.42, -3, 3);
      ty = clamp(qb.y + lane, 3, H - 3);
      mode = "inside-rush";
    }
    const liveQB = RushAwareness.target(
      d,
      qb,
      matchState.playStart,
      matchState.playClock,
    );
    if (liveQB) {
      tx = liveQB.x;
      ty = liveQB.y;
      mode = liveQB.mode;
    }
    // Line integrity is retained when unblocked, while a blocker can still
    // overpower the rusher or force him into a less efficient path.
    const blockers = [
      P("LT"),
      P("LG"),
      P("C"),
      P("RG"),
      P("RT"),
      P("TE"),
      P("TE2"),
      P("FB"),
    ].filter(Boolean);
    const near = closestThreat(d, blockers);
    if (near.p && near.d < 1.65 && qb.x > d.x - 3.5) blockBattle(near.p, d, dt);
    const execution = d.rushExecution || 1;
    const urgency = RushAwareness.assess(
      qb,
      matchState.playStart,
      matchState.playClock,
    ).urgency;
    const rushEffort =
      (d.blitz ? 1.09 : 1.05) *
      execution *
      urgency *
      (d.blocked > 0 ? 0.53 : 1);
    d.intent = mode;
    d.intentTarget = "QB";
    steer(d, tx - d.x, ty - d.y, dt, rushEffort);
  }

  function chooseDefenderCommitment(d, a) {
    if (
      !a ||
      d.action?.time > 0 ||
      d.tackleCooldown > 0 ||
      d.diveRecovery > 0 ||
      d.ground ||
      d.blocked > 0.25 ||
      d.stun > 0
    )
      return;
    const gap = dist(d, a),
      dx = a.x - d.x,
      dy = a.y - d.y,
      along = Math.max(0.01, gap);
    const closing = ((d.vx - a.vx) * dx + (d.vy - a.vy) * dy) / along;
    const facing =
      (Math.cos(d.face || 0) * dx + Math.sin(d.face || 0) * dy) / along;
    const runnerSpeed = speed(a);
    const breakaway =
      dx > 0.45 &&
      a.vx > 2.5 &&
      (a.vx * dx + a.vy * dy) > along * runnerSpeed * 0.78 &&
      (d.vx * dx + d.vy * dy) > along * 2.6;
    const supportAhead = breakaway && matchState.def.some(
      (other) =>
        other !== d && !other.ground && other.stun <= 0 &&
        !other.action?.time && other.blocked < 0.28 &&
        other.x > a.x + 0.4 && other.x < a.x + 6 &&
        Math.abs(other.y - (a.y + a.vy * 0.25)) < 3.2,
    );
    const choice = ChaosTackleIntelligence.selection(d, a, {
      gap,
      contact: radius(d) + radius(a),
      closing,
      runnerSpeed,
      breakaway,
      supportAhead,
      facing,
      frontality: facing,
      freeLane: d.blocked < 0.12,
    });
    d.lastTackleDecision = {
      choice,
      gap,
      closing,
      facing,
      time: matchState.playClock,
    };
    if (choice === "tackle-dive") {
      // A planted or nearly stopped runner needs a controlled wrap, not a
      // repeated launch of low dives through the same crowded rear contact.
      // AI may commit a physically plausible low dive before contact.
      const dir = { x: dx / along, y: dy / along };
      d.action = {
        kind: "tackle-dive",
        time: 0.53,
        age: 0,
        used: false,
        direction: dir,
        ai: true,
      };
      d.technique = "tackle-dive";
      d.diveRecovery = 1.2;
      d.tackleCooldown = 0.68;
      d.vx += dir.x * 1.35;
      d.vy += dir.y * 1.35;
      d.stam = Math.max(0, d.stam - 0.032);
    }
    // If decision is a power collision, physics still choose whether it hits.
    // Never auto-start a grip or tackle action before anatomical contact.
  }

  function defenderAI(d, dt) {
    if (d.stun > 0) {
      d.intent = "recover";
      d.intentTarget = matchState.ballCarrier?.key || "play";
      steer(d, 0, 0, dt, 0.65);
      return;
    }
    if (matchState.tackleLinks.has(d.key) && matchState.ballCarrier) {
      d.intent = "wrap";
      d.intentTarget = matchState.ballCarrier.key;
      steer(
        d,
        matchState.ballCarrier.x - d.x,
        matchState.ballCarrier.y - d.y,
        dt,
        0.82,
      );
      return;
    }
    const read = recognizeRun(d);
    // Even when playing the pass, a nearby defender can tackle a runner he can see.
    if (
      matchState.ballCarrier &&
      (!RUNS.has(matchState.selectedPlay) ||
        read ||
        dist(d, matchState.ballCarrier) < 3.4)
    ) {
      const seen = InsideZoneIQ.visible(d, matchState.ballCarrier);
      if (
        seen ||
        dist(d, matchState.ballCarrier) < 1.65 ||
        matchState.selectedPlay !== "inside"
      ) {
        if (seen)
          d.lastVisibleRunner = {
            x: matchState.ballCarrier.x,
            y: matchState.ballCarrier.y,
            at: matchState.playClock,
          };
        chooseDefenderCommitment(d, matchState.ballCarrier);
        pursuitAI(d, matchState.ballCarrier, dt);
        return;
      }
      // No instant behind-the-head recognition. Reorient toward the player's
      // last observed lane; he may acquire the runner again after physically turning.
      const last = d.lastVisibleRunner;
      d.intent = "locate-runner";
      d.intentTarget = "last-seen";
      const target =
        last && matchState.playClock - last.at < 0.7
          ? last
          : {
              x: d.fit?.gapSpot?.x || matchState.playStart + 2,
              y: d.fit?.lane || d.spawnY,
            };
      steer(d, target.x - d.x, target.y - d.y, dt, 0.86);
      return;
    }
    // Line defenders shoot gaps; linebackers fill; secondary maintains leverage.
    if (RUNS.has(matchState.selectedPlay) && read) {
      runFitAI(d, dt);
      return;
    }
    if (d.spy && !matchState.passThrown && !matchState.ballCarrier) {
      quarterbackSpyAI(d, P("QB"), dt);
      return;
    }
    if (d.rush) {
      passRushAI(d, P("QB"), dt);
      return;
    }
    // A defender in shallow zone can read an obvious scramble even before the
    // passer crosses the line: coverage players don't all abandon deep routes.
    const qb = P("QB");
    if (
      !RUNS.has(matchState.selectedPlay) &&
      !matchState.passThrown &&
      !matchState.ballCarrier &&
      qb &&
      (qb.x >= matchState.playStart - 1.9 ||
        RushAwareness.assess(qb, matchState.playStart, matchState.playClock)
          .escape) &&
      d.assignment?.kind === "zone" &&
      !CoverageRoutePolicy.isDeepZone(d.assignment) &&
      dist(d, qb) < 12
    ) {
      d.intent = "scramble-alert";
      d.intentTarget = "QB";
      steer(d, qb.x + 0.3 - d.x, qb.y - d.y, dt, 1.06);
      return;
    }
    // Coverage stays intact until the player sees the run cues; pass is not
    // broken merely because the offensive playbook chose a running play.
    const as = d.assignment;
    if (matchState.ball?.flying && defenderFlightAI(d, dt)) return;
    if (!as) {
      d.intent = "hold";
      arrive(d, d.spawnX, d.spawnY, dt);
      return;
    }
    if (matchState.playClock < d.recognition) {
      d.intent = "read";
      steer(d, 0, 0, dt);
      return;
    }
    if (as.kind === "man") {
      const t = P(as.target);
      if (!t) {
        d.intent = "read";
        steer(d, 0, 0, dt);
        return;
      }
      d.intent = "cover-man";
      d.intentTarget = t.key;
      const shadow = clamp(
          (100 - d.COV) * 0.012 + (d.coverageVariation?.cushion || 0),
          0.06,
          0.5,
        ),
        isCB = d.pos === "CB";
      const lead = 0.14 + (d.AWR - 70) * 0.005;
      // Preserve a deeper shoulder when the receiver stays on a vertical stem.
      // Do not instantly mirror every fake; existing mirrorDelay still governs cuts.
      const deepThreat = CoverageRoutePolicy.isVerticalThreat(
        t,
        matchState.playStart,
      );
      const tx =
          t.x +
          clamp(t.vx * lead, -1, 2) +
          (isCB ? (deepThreat ? 1.8 : 1.0) : 0.6),
        ty = t.y + t.vy * lead + Math.sign(d.y - t.y) * shadow;
      d.mirrorDelay = Math.max(0, d.mirrorDelay - dt);
      const mirror = clamp(
        (0.9 + (d.MIR - 75) * 0.005) * (d.coverageVariation?.mirror || 1),
        0.67,
        1.09,
      );
      const effort = clamp(0.92 + (d.COV - 75) * 0.003, 0.86, 1.06) * mirror;
      if (d.falseStep && d.falseStep.until > matchState.playClock) {
        d.intent = "cover-fake";
        steer(d, d.falseStep.x - d.x, d.falseStep.y - d.y, dt, effort);
        return;
      }
      d.falseStep = null;
      const aim =
        d.mirrorDelay > 0 && d.coverAim ? d.coverAim : { x: tx, y: ty };
      if (d.mirrorDelay <= 0 || !d.coverAim) d.coverAim = { x: tx, y: ty };
      steer(d, aim.x - d.x, aim.y - d.y, dt, effort);
      return;
    }
    let tx = as.baseX,
      ty = as.baseY;
    const deep = CoverageRoutePolicy.isDeepZone(as);
    const deepEntry = Math.min(7, Math.max(2, (110 - matchState.playStart) * 0.55));
    const candidates = skillOffense().filter(
      (o) =>
        o.x > matchState.playStart - 0.5 &&
        Math.abs(o.y - as.baseY) < as.width &&
        (!deep
          ? o.x < matchState.playStart + 18
          : o.x >= matchState.playStart + deepEntry),
    );
    if (candidates.length) {
      // Deep defenders prioritize deep threats instead of abandoning a streak
      // for the nearest short receiver. They can carry routes beyond 40 yards.
      const t = CoverageRoutePolicy.zoneThreat(
        candidates,
        as,
        matchState.playStart,
      );
      const predicted = deep
        ? CoverageRoutePolicy.deepIntercept(d, t, as, matchState.playStart)
        : null;
      tx = clamp(
        predicted ? predicted.x : t.x + (deep ? 2.2 : 0.6),
        deep
          ? Math.min(
              matchState.playStart +
                Math.max(
                  1.5,
                  Math.min(8, (110 - matchState.playStart) * 0.6 + 1),
                ),
              114.65,
            )
          : matchState.playStart + 2,
        deep ? 114.65 : Math.min(114.65, matchState.playStart + 16),
      );
      ty = clamp(
        predicted ? predicted.y : t.y,
        as.baseY - as.width * 0.76,
        as.baseY + as.width * 0.76,
      );
      if (deep) tx = Math.max(tx, as.baseX - 1.4);
      d.deepRead = !!predicted;
    } else d.deepRead = false;
    d.intent = "cover-zone";
    d.intentTarget = as.tag;
    tx += d.coverageVariation?.react || 0;
    ty += d.coverageVariation?.cushion || 0;
    const coverEffort = clamp(
      (0.92 + (d.COV - 75) * 0.002) * (d.coverageVariation?.mirror || 1),
      0.82,
      1.1,
    );
    // Don't brake short of a moving streak's projected catch lane.
    if (d.deepRead && Math.hypot(tx - d.x, ty - d.y) > 1.1)
      steer(d, tx - d.x, ty - d.y, dt, coverEffort);
    else arrive(d, tx, ty, dt, coverEffort);
  }

  // EVERY defensive back reads deep throws, not just the corner already in the
  // picture. Recognition delay and actual travel distance determine whether he
  // can arrive in time. Backside corners and safeties rally in support; no
  // guaranteed ball-hawk outcomes or synthetic pursuit speed are added.
  function defenderFlightAI(d, dt) {
    if (!matchState.ball?.flying || d.ground) return false;
    const m = flightMarkers(),
      target = { x: m.catchX, y: m.catchY };
    const db = ["CB", "FS", "SS"].includes(d.pos),
      lb = ["OLB", "MLB"].includes(d.pos);
    if (!db && !lb) return false;
    if (matchState.ball.t < (d.airReadAt ?? 0.34)) return false;
    const distance = dist(d, target),
      primary =
        d.assignment?.target === matchState.intended?.key ||
        (matchState.intended && dist(d, matchState.intended) < 4.6);
    // A linebacker may flow underneath a deep throw, but won't instantly vacate
    // his zone and sprint 40 yards to where a corner should be responsible.
    if (lb && distance > 28) return false;
    let aimX = m.catchX,
      aimY = m.catchY;
    if (lb && distance > 10) {
      aimX -= Math.min(3.5, distance * 0.11);
    }
    const effort = db ? clamp(1.02 + (d.PRC - 70) * 0.0014, 0.97, 1.09) : 0.95;
    d.intent = primary ? "break-on-ball" : db ? "air-rally" : "air-underneath";
    d.intentTarget = matchState.intended?.key || "football";
    steer(d, aimX - d.x, aimY - d.y, dt, effort);
    return true;
  }

  return {
    bind(services) {
      ({
        H,
        P,
        RUNS,
        arrive,
        blockBattle,
        closestThreat,
        flightMarkers,
        matchState,
        pursuitAI,
        radius,
        recognizeRun,
        runFitAI,
        skillOffense,
        speed,
        steer,
      } = services);
    },
    defenderAI,
  };
}
