import { clamp, distance2D as dist } from "../core/math.js";
import { specialTeams } from "../sim/special_teams.js";

export function createKickReturn() {
  let H,
    P,
    TEAM_NAMES,
    blockBattle,
    hud,
    isFreeKick,
    matchState,
    pursuitAim,
    setDriveSpot,
    setResultUI,
    speed,
    spotText,
    steer,
    steerEscapeRecovery;

  function finishReturn(type, x, detail) {
    if (matchState.phase !== "live" || !matchState.specialState) return;
    const k = matchState.specialState;
    // A returner who fields a free kick in his own end zone may choose to
    // return it or down it. A tackle or voluntary give-up before he advances
    // out is a touchback, not a ball spotted at the one-yard line.
    if (
      isFreeKick(k) &&
      k.returnCaughtInEndzone &&
      !k.advancedOutOfEndzone &&
      x <= 10.05 &&
      type !== "touchdown"
    ) {
      type = "touchback";
      x = k.returnTouchbackSpot || 45;
      detail =
        "Kick fielded and downed in the end zone · touchback at own " +
        Math.round(x - 10);
    }
    // Persist return exertion so a long kickoff cannot be followed by a magically fresh runner.
    for (const p of matchState.players) {
      const recovery =
        (p === matchState.ballCarrier ? 0.015 : 0.345) * (0.85 + p.STA / 500);
      matchState.fatigueBank[p.key] = clamp(p.stam + recovery, 0.045, 1);
    }
    matchState.ball = null;
    const mark = clamp(x, 10, 110);
    const touchdown = type === "touchdown" || mark >= 109.8;
    if (touchdown) {
      matchState.teamPoints[matchState.possession] += 6;
      matchState.score = matchState.teamPoints[matchState.possession];
      matchState.tryState = { team: matchState.possession };
      matchState.postWhistle = "try";
    } else {
      setDriveSpot(matchState.possession, clamp(mark, 11, 109));
      matchState.postWhistle = "scrimmage";
    }
    matchState.gameFlowNote = touchdown
      ? "Return touchdown"
      : type === "touchback"
        ? "Touchback — receiving team ball"
        : "Special-teams play complete";
    matchState.specialState = null;
    matchState.phase = "dead";
    matchState.clockRunning = false;
    matchState.ballCarrier = null;
    for (const p of matchState.players) {
      p.vx = 0;
      p.vy = 0;
      p.intent = "whistle";
    }
    const name = touchdown
      ? "RETURN TOUCHDOWN"
      : type === "touchback"
        ? "TOUCHBACK"
        : type === "fair"
          ? "FAIR CATCH"
          : type === "out"
            ? "RETURN OUT OF BOUNDS"
            : "RETURN TACKLED";
    setResultUI(
      name,
      detail || `${TEAM_NAMES[matchState.possession]} starts at ${spotText()}`,
      touchdown ? "CHOOSE TRY" : "CALL OFFENSE",
    );
    hud();
  }

  function backupReturnerLeadBlock(o, ret, dt, claimed) {
    const k = matchState.specialState;
    // A backup returner becomes a lead escort once possession is established.
    // Only contest threats ahead of the runner; never sprint behind him to
    // chase a technically closer but irrelevant coverage player.
    const forwardThreats = matchState.def.filter(
      (d) =>
        !d.ground &&
        d.key !== "K" &&
        d.x >= ret.x + 0.45 &&
        d.x <= ret.x + 17 &&
        Math.abs(d.y - ret.y) < 13 &&
        !claimed.has(d.key) &&
        d.beatenUntil <= matchState.playClock,
    );
    const threat = forwardThreats.sort(
      (a, b) =>
        Math.abs(a.x - (ret.x + 5)) +
        Math.abs(a.y - ret.y) * 0.5 -
        (Math.abs(b.x - (ret.x + 5)) + Math.abs(b.y - ret.y) * 0.5),
    )[0];
    const leadX = clamp(ret.x + 4.2, ret.x + 2.5, 109);
    const leadY = clamp(ret.y * 0.68 + k.returnLaneY * 0.32, 3, H - 3);
    // The non-catching deep returner may be BEHIND the carrier after a short
    // kick. First run a shallow diagonal catch-up lane, then become an escort.
    // Don't seek an unreachable defender upfield while the carrier runs away.
    const trailing = o.x < ret.x - 2.2;
    if (trailing) {
      const side = o.y <= ret.y ? -1 : 1;
      const catchY = clamp(ret.y + side * 2.4, 3, H - 3);
      o.intent = "return-escort-catchup";
      o.intentTarget = ret.key;
      steer(
        o,
        clamp(ret.x + 2.4, ret.x + 1.8, 109) - o.x,
        catchY - o.y,
        dt,
        1.08,
      );
      return;
    }
    if (!threat) {
      o.intent = "lead-return-escort";
      o.intentTarget = ret.key;
      steer(o, leadX - o.x, leadY - o.y, dt, 1.08);
      return;
    }
    const projectedX = Math.max(ret.x + 1.3, threat.x + threat.vx * 0.2);
    const projectedY = threat.y + threat.vy * 0.2;
    o.intent = "lead-return-block";
    o.intentTarget = threat.key;
    claimed.add(threat.key);
    steer(o, projectedX - o.x, projectedY - o.y, dt, 1.06);
    if (dist(o, threat) < 2.15) blockBattle(o, threat, dt);
  }

  function returnBlockerAI(o, ret, dt, claimed) {
    const k = matchState.specialState;
    // React to the kicker's actual landing side, then gradually set the
    // wedge toward the chosen LEFT / MIDDLE / RIGHT return lane.
    const progress = clamp((ret.x - k.landingX) / 20, 0, 1);
    const preferred =
      k.targetY * (0.75 - 0.68 * progress) +
      k.returnLaneY * (0.25 + 0.68 * progress);
    const locked = matchState.blockLinks.get(o.key);
    const kept = locked ? P(locked.defender) : null;
    const picked = specialTeams.chooseReturnThreat({
      blocker: o,
      playTime: matchState.playClock,
      defenders: matchState.def,
      carrier: ret,
      claimed,
      returnLaneY: preferred,
      speedOf: speed,
    });
    const best = kept && !kept.ground && dist(o, kept) < 2.5 ? kept : picked;
    const wedgeY = clamp(preferred + (o.returnSlot - 4) * 1.7, 4, H - 4);
    const wedgeX = clamp(
      ret.x + clamp(3 + (o.returnSlot % 3) * 1.2, 3, 6),
      ret.x + 2,
      ret.x + 9,
    );
    if (!best) {
      o.intent = "return-lane";
      o.intentTarget = "wedge";
      steer(o, wedgeX - o.x, wedgeY - o.y, dt, 0.92);
      return;
    }
    claimed.add(best.key);
    o.intent = "return-block";
    o.intentTarget = best.key;
    if (speed(o) < 0.25 && dist(o, ret) > 10) {
      o.returnStall = (o.returnStall || 0) + dt;
    } else o.returnStall = 0;
    if (o.returnStall > 0.9) {
      o.returnStall = 0;
      o.beatenTarget = best.key;
      o.beatenUntil = matchState.playClock + 0.75;
      steer(o, ret.x + 4 - o.x, k.returnLaneY - o.y, dt, 0.96);
      return;
    }
    // Meet the threat on the approach to the returner, rather than chasing
    // its current position from behind. Protect the returner's actual lane.
    const lead = clamp(
      dist(o, best) / Math.max(3, speed(o) + speed(best)),
      0.12,
      0.58,
    );
    const projectedX = best.x + best.vx * lead,
      projectedY = best.y + best.vy * lead;
    const targetX = projectedX + clamp((ret.x - projectedX) * 0.1, -0.4, 0.8);
    const laneBlend = clamp((dist(best, ret) - 6) / 16, 0, 0.26);
    const targetY = projectedY * (1 - laneBlend) + preferred * laneBlend;
    steer(o, targetX - o.x, targetY - o.y, dt, 1.06);
    if (dist(o, best) < 2.15) blockBattle(o, best, dt);
  }

  // Avoid escaping toward a sideline: a player pinned against the left/right
  // boundary cannot run around a blocker on the outside of the field.
  function returnEscapeSide(d, blocker) {
    if (d.y < 7) return 1;
    if (d.y > H - 7) return -1;
    return blocker ? (d.y <= blocker.y ? -1 : 1) : d.y < H / 2 ? 1 : -1;
  }

  function returnBypassTarget(d, blocker, aimY) {
    const side = d.returnBypassSide || 1;
    return clamp(
      blocker ? blocker.y + side * 3.4 : aimY + side * 3.4,
      2.5,
      H - 2.5,
    );
  }

  function coverReturnAI(d, ret, dt) {
    if (steerEscapeRecovery(d, ret, dt)) return;
    const aim = pursuitAim(d, ret);
    // Close coverage already includes a finite observed-reaction delay in pursuitAim.
    // Do not override it with instantaneous carrier tracking here.
    // A coverage player can be jammed against a return blocker even after the
    // block resolver claims to have shed him. Measure actual displacement over
    // time, not just whether his AI is repeatedly issuing a run instruction.
    if (!d.returnTrack) d.returnTrack = { x: d.x, y: d.y, age: 0, still: 0 };
    const track = d.returnTrack;
    track.age += dt;
    if (track.age >= 0.3) {
      const travelled = Math.hypot(d.x - track.x, d.y - track.y);
      track.still =
        travelled < 0.3 && aim.sep > 7 && d.ground === null
          ? track.still + track.age
          : Math.max(0, track.still - track.age * 2);
      track.x = d.x;
      track.y = d.y;
      track.age = 0;
    }
    if (track.still > 0.9 && d.returnBypassUntil <= matchState.playClock) {
      // Release stale physical engagements and go around the nearest blocker.
      const link = [...matchState.blockLinks].find(
        ([key, e]) => e.defender === d.key,
      );
      const blocker = link
        ? P(link[1].blocker)
        : matchState.off
            .filter((o) => o !== ret)
            .sort((a, b) => dist(a, d) - dist(b, d))[0];
      if (link) matchState.blockLinks.delete(link[0]);
      d.blocked = 0;
      d.shedCooldown = Math.max(d.shedCooldown, 0.4);
      d.returnBypassBlocker = blocker?.key || null;
      d.returnBypassSide = returnEscapeSide(d, blocker);
      d.returnBypassUntil = matchState.playClock + 1.15;
      d.vy += d.returnBypassSide * 1.2;
      track.still = 0;
    }
    let targetY = aim.y;
    if (d.returnBypassUntil > matchState.playClock) {
      targetY = returnBypassTarget(d, P(d.returnBypassBlocker), aim.y);
      d.intent = "return-bypass";
    } else d.intent = "kick-cover";
    d.intentTarget = ret.key;
    steer(d, aim.x - d.x, targetY - d.y, dt, aim.sep < 4 ? 1.18 : 1.05);
  }

  return {
    bind(services) {
      ({
        H,
        P,
        TEAM_NAMES,
        blockBattle,
        hud,
        isFreeKick,
        matchState,
        pursuitAim,
        setDriveSpot,
        setResultUI,
        speed,
        spotText,
        steer,
        steerEscapeRecovery,
      } = services);
    },
    finishReturn,
    backupReturnerLeadBlock,
    returnBlockerAI,
    returnEscapeSide,
    returnBypassTarget,
    coverReturnAI,
  };
}
