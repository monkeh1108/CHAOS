import { clamp, distance2D as dist } from "../core/math.js";

export function createAirOutcomes() {
  let G,
    H,
    catchReach,
    cueForSelectedCatch,
    finish,
    log,
    matchState,
    message,
    rand,
    startAirAnimation;

  function airOffenseStyle(p, crowd) {
    if (
      p === matchState.intended &&
      matchState.controlMode === "offense" &&
      matchState.airSelection.offense
    )
      return matchState.airSelection.offense;
    // CPU receivers also make situational choices; this is not a global guarantee.
    if (crowd >= 2 && p.JMP > p.CAT - 4) return "aggressive";
    if (crowd >= 1) return "possession";
    return "rac";
  }

  function airDefenseStyle(d) {
    if (
      matchState.controlMode === "defense" &&
      matchState.airSelection.defenderKey === d.key &&
      matchState.airSelection.defense
    )
      return matchState.airSelection.defense;
    const instinct = 0.46 * d.COV + 0.29 * d.AWR + 0.25 * d.CAT;
    const ballSkill = 0.55 * d.CAT + 0.3 * d.JMP + 0.15 * d.RCR;
    if (ballSkill > 86 && instinct > 81 && rand() < 0.57) return "ball";
    if (d.CAT < 60 && d.TAK > 76 && rand() < 0.48) return "receiver";
    return rand() < 0.21 + clamp((d.CAT - 67) / 100, 0, 0.22) ? "ball" : "swat";
  }

  function airContext(p, point) {
    const opposing = matchState.players.filter(
      (d) =>
        d.team !== p.team &&
        !d.ground &&
        ["CB", "FS", "SS", "OLB", "MLB", "WR", "TE", "RB"].includes(d.pos) &&
        dist(d, p) < 2.9,
    );
    const nearby = opposing.filter((d) => dist(d, p) < 2.1);
    const separation = nearby.length
      ? Math.min(...nearby.map((d) => dist(p, d)))
      : 8;
    return { nearby, opposing, separation, crowd: nearby.length };
  }

  function airCatchProbability(p, style, ctx) {
    // Contests depend on proximity AND defender ball skills. Three well-placed
    // defenders are much more dangerous than a single defender five yards away.
    const skill = p.CAT * 0.64 + p.AWR * 0.19 + p.JMP * 0.17;
    const coverage = ctx.opposing.reduce((n, d) => {
      const proximity = clamp((3.1 - dist(d, p)) / 2.5, 0, 1);
      const quality = clamp(
        (0.52 * (d.COV || d.CAT) + 0.3 * d.AWR + 0.18 * d.JMP) / 85,
        0.65,
        1.25,
      );
      return n + proximity * quality;
    }, 0);
    let chance = 0.63 + (skill - 73) * 0.0061 - coverage * 0.155;
    if (style === "rac") chance += ctx.crowd ? -0.085 : 0.045;
    if (style === "possession") chance += 0.09 - (ctx.crowd === 0 ? 0.025 : 0);
    if (style === "aggressive") chance += ctx.crowd ? 0.065 : -0.07;
    if (p === matchState.intended) chance += 0.035;
    if (p.team === 1) chance -= 0.075;
    if (matchState.ball?.deflected) chance -= 0.12;
    return clamp(chance, 0.08, 0.94);
  }

  function defenderAirProbability(d, style, receiver) {
    const near = receiver ? dist(d, receiver) : 1.7;
    const leverage = clamp((2.8 - near) / 2.5, 0, 1);
    const ballDist = Math.hypot(
      d.x - matchState.ball.x,
      d.y - matchState.ball.y,
    );
    const geometry = clamp((1.6 - ballDist) / 1.5, 0, 1);
    const grade =
      style === "ball"
        ? 0.41 * d.CAT + 0.27 * d.JMP + 0.2 * d.COV + 0.12 * d.AWR
        : style === "swat"
          ? 0.47 * d.COV + 0.23 * d.RCR + 0.18 * d.JMP + 0.12 * d.AWR
          : 0.42 * d.COV + 0.34 * d.AWR + 0.24 * d.TAK;
    const base = style === "ball" ? 0.1 : style === "swat" ? 0.28 : 0.17;
    return clamp(
      base +
        (grade - 70) * 0.0075 +
        leverage * 0.15 +
        geometry * 0.09 +
        (style === "ball" ? 0 : 0.04),
      0.045,
      style === "ball" ? 0.7 : 0.86,
    );
  }

  function awardAirInterception(d) {
    startAirAnimation(d, "ball");
    matchState.ball.flying = false;
    matchState.lastAirResult = {
      result: "interception",
      player: d.key,
      action: "ball",
      distance: dist(d, matchState.intended || d),
    };
    matchState.airCounters.interception++;
    log("BALL HAWK · " + d.name + " INTERCEPTION");
    matchState.ball = null;
    finish("intercept", d.x, "Defender " + d.name + " intercepted the pass.");
  }

  function awardAirBreakup(d, style) {
    startAirAnimation(d, style);
    matchState.lastAirResult = {
      result: "breakup",
      player: d.key,
      action: style,
    };
    matchState.airCounters.broken++;
    if (style === "swat") matchState.airCounters.swat++;
    else matchState.airCounters.playReceiver++;
    log(
      (style === "swat" ? "SWAT / PASS BREAKUP" : "PLAY RECEIVER / BREAKUP") +
        " · " +
        d.name,
    );
    matchState.ball = null;
    finish(
      "incomplete",
      matchState.playStart,
      "Pass broken up by " + d.name + ".",
    );
  }

  function awardAirCatch(p, style, chance) {
    startAirAnimation(p, style);
    matchState.ball.flying = false;
    matchState.tackleLinks.clear();
    matchState.pileState = null;
    matchState.ballCarrier = p;
    if (matchState.controlMode === "offense") matchState.active = p;
    // RAC preserves momentum. Secure possession and jumping contests take
    // extra time to plant after the catch; no magical sprint animation.
    if (style === "possession") {
      p.vx *= 0.58;
      p.vy *= 0.58;
      p.shield = 0.32;
    } else if (style === "aggressive") {
      p.vx *= 0.68;
      p.vy *= 0.68;
      p.shield = 0.2;
    } else {
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.shield = 0.12;
    }
    p.touches++;
    matchState.lastAirResult = {
      result: p.team === 1 ? "interception" : "complete",
      player: p.key,
      style,
      chance,
    };
    if (p.team === 0) {
      matchState.airCounters[style]++;
      matchState.airCounters.complete++;
    }
    log(
      (p.team === 1 ? "INTERCEPTION" : "CATCH · " + style.toUpperCase()) +
        " · " +
        p.name +
        " · " +
        Math.round(chance * 100) +
        "% chance",
    );
    message(
      "<strong>" +
        style.toUpperCase() +
        " catch!</strong> " +
        p.name +
        " secures the pass.",
    );
    matchState.ball = null;
    if (p.team === 1)
      finish("intercept", p.x, "Defender " + p.name + " intercepted the pass.");
  }

  function airBall(dt) {
    if (!matchState.ball || !matchState.ball.flying) return;
    cueForSelectedCatch();
    matchState.ball.t += dt;
    matchState.ball.x += matchState.ball.vx * dt;
    matchState.ball.y += matchState.ball.vy * dt;
    matchState.ball.z += matchState.ball.vz * dt - 0.5 * G * dt * dt;
    matchState.ball.vz -= G * dt;
    if (matchState.ball.t > Math.max(0.2, matchState.ball.flight * 0.6)) {
      const recs = matchState.players.filter(
        (p) =>
          p.team === 0 && !p.ground && ["WR", "TE", "FB", "RB"].includes(p.pos),
      );
      const reachable = recs
        .map((p) => {
          const ctx = airContext(p),
            style = airOffenseStyle(p, ctx.crowd);
          const reach = catchReach(p) + (style === "aggressive" ? 0.19 : 0);
          return {
            p,
            style,
            ctx,
            reach,
            range:
              1.02 + (p.CAT - 65) * 0.005 + (style === "aggressive" ? 0.1 : 0),
          };
        })
        .filter(
          (o) =>
            !matchState.ball.attempts.includes(o.p.key) &&
            matchState.ball.z >= 0.18 &&
            matchState.ball.z <= o.reach &&
            dist(o.p, matchState.ball) < o.range,
        );
      // Defenders have their own independent opportunity to attack the ball.
      // Their reach, spacing and ratings matter; mere proximity never guarantees a pick.
      const defenders = matchState.def
        .filter(
          (d) =>
            !d.ground &&
            !matchState.ball.attempts.includes(d.key) &&
            ["CB", "FS", "SS", "OLB", "MLB"].includes(d.pos) &&
            dist(d, matchState.ball) < 1.32 + (d.COV - 70) * 0.003 &&
            matchState.ball.z > 0.2 &&
            matchState.ball.z <= catchReach(d) + 0.09,
        )
        .sort((a, b) => dist(a, matchState.ball) - dist(b, matchState.ball));
      for (const d of defenders) {
        if (!matchState.ball?.flying) return;
        matchState.ball.attempts.push(d.key);
        const style = airDefenseStyle(d);
        const nearest = recs.reduce(
          (best, p) => (dist(p, d) < dist(best, d) ? p : best),
          recs[0] || d,
        );
        const chance = defenderAirProbability(d, style, nearest);
        startAirAnimation(d, style);
        if (rand() < chance) {
          if (style === "ball") awardAirInterception(d);
          else awardAirBreakup(d, style);
          return;
        }
        // A missed ball-hawk attempt costs body position but cannot grant a catch.
        if (style === "ball") {
          d.balance = Math.max(0.6, d.balance - 0.05);
          d.coverAim = null;
        }
      }
      reachable.sort(
        (a, b) => dist(a.p, matchState.ball) - dist(b.p, matchState.ball),
      );
      for (const { p, style, ctx } of reachable) {
        if (!matchState.ball?.flying) return;
        matchState.ball.attempts.push(p.key);
        startAirAnimation(p, style);
        const chance = airCatchProbability(p, style, ctx);
        if (rand() < chance) {
          awardAirCatch(p, style, chance);
          return;
        }
        // A dropped pass may be tipped to another receiver behind the target.
        // A player cannot attempt the same pass twice.
        matchState.ball.deflected = true;
        matchState.airCounters.drops++;
        log(
          "CATCH MISSED · " +
            p.name +
            " · " +
            style.toUpperCase() +
            " · " +
            Math.round(chance * 100) +
            "% chance",
        );
      }
    }
    if (
      matchState.ball &&
      (matchState.ball.z <= 0.1 ||
        matchState.ball.t > matchState.ball.ttl ||
        matchState.ball.x > 112 ||
        matchState.ball.y < -0.5 ||
        matchState.ball.y > H + 0.5)
    ) {
      if (!matchState.lastAirResult)
        matchState.lastAirResult = { result: "incomplete", action: "uncaught" };
      matchState.ball = null;
      finish("incomplete", matchState.playStart, "Pass falls incomplete.");
    }
  }

  return {
    bind(services) {
      ({
        G,
        H,
        catchReach,
        cueForSelectedCatch,
        finish,
        log,
        matchState,
        message,
        rand,
        startAirAnimation,
      } = services);
    },
    airContext,
    airCatchProbability,
    defenderAirProbability,
    awardAirInterception,
    awardAirCatch,
    airBall,
  };
}
