import { clamp, distance2D as dist } from "../core/math.js";
import { ChaosEscapeReactions } from "../physics/escape_reactions.js";
import { ChaosLowContact } from "../physics/low_contact.js";
import { ChaosTackleReengagement } from "../physics/tackle_reengagement.js";

export function createTackleLinks() {
  let H,
    P,
    YARD_M,
    acceleration,
    actionCue,
    emitPresentation,
    finish,
    log,
    mass,
    matchState,
    radius,
    speed,
    steer;

  // A standing tackle can develop into a moving scrum. The OL must reach the pile
  // and make contact, not trigger a scripted extra-yard roll from a distance.
  function pileSupport(o, a, dt) {
    if (
      o === a ||
      o.team !== 0 ||
      o.pos === "QB" ||
      !(
        o.pos === "FB" ||
        o.pos === "TE" ||
        o.pos === "OL" ||
        ["LT", "LG", "C", "RG", "RT"].includes(o.key)
      )
    )
      return false;
    if (dist(o, a) > 14) return false;
    const eligible = matchState.off
      .filter(
        (p) =>
          p !== a &&
          (p.pos === "TE" ||
            p.pos === "FB" ||
            ["LT", "LG", "C", "RG", "RT"].includes(p.key)),
      )
      .sort((p, q) => dist(p, a) - dist(q, a))
      .slice(0, 4);
    const slot = eligible.indexOf(o);
    if (slot < 0) return false;
    // Approach the back of the carrier; lateral slots spread the pushers around
    // the hips without instantly teleporting them into position.
    const targetX = a.x - radius(a) - radius(o) * 0.85 - 0.08;
    const targetY = clamp(a.y + (slot - 1.5) * 0.36, 1, H - 1);
    o.intent = "pile-support";
    o.intentTarget = a.key;
    steer(o, targetX - o.x, (targetY - o.y) * 1.2, dt, 1.12);
    return true;
  }

  function resolvePileDrive(dt) {
    for (const p of matchState.off) p.pushing = false;
    if (!matchState.pileState?.active || !matchState.ballCarrier) return;
    const a = matchState.ballCarrier,
      pile = matchState.pileState;
    pile.pushers = [];
    for (const p of matchState.off) {
      if (p === a || p.intent !== "pile-support") continue;
      const dx = a.x - p.x,
        side = Math.abs(a.y - p.y);
      const maxReach = radius(a) + radius(p) + 0.29;
      if (dist(p, a) > maxReach || dx < -0.1 || side > 1.1) continue;
      // True hand contact. Blocking, strength, mass and existing forward velocity
      // determine the OL's foot-drive. A smaller TE pushes less than a strong G.
      const body = clamp(mass(p) / 135, 0.64, 1.3);
      const technique = clamp(
        0.3 + p.BLO * 0.0057 + p.STR * 0.0034,
        0.57,
        1.29,
      );
      const leverage =
        clamp((p.h - a.h) * 0.012 + 0.99, 0.84, 1.13) *
        clamp(p.balance, 0.5, 1);
      const angle = Math.max(0.16, dx / Math.max(0.1, dist(p, a)));
      const output =
        body *
        technique *
        leverage *
        angle *
        clamp(p.stam, 0.3, 1) *
        (p.action?.kind === "impact-block" && p.action.time > 0 ? 1.23 : 1);
      // Feed force to the *lineman*, never teleport the carrier. The body-contact
      // solver transfers that impulse through everyone he's actually touching.
      p.vx += acceleration(p) * output * 0.82 * dt;
      p.vy += (a.y - p.y) * dt * 0.9;
      p.stam = Math.max(0.25, p.stam - dt * 0.047 * output);
      p.pushing = true;
      p.intent = "pile-drive";
      p.lean = clamp(p.lean * 0.92 - 0.1 * output, -0.42, 0.42);
      pile.pushers.push({ key: p.key, output: Number(output.toFixed(3)) });
    }
    const grips = [...matchState.tackleLinks.values()]
      .map((e) => P(e.defender))
      .filter(Boolean);
    pile.wrappers = grips.map((p) => p.key);
    // Tacklers push from opposite angles, holding the runner up. They generate
    // resistance at their own feet, which transmits through the same collisions.
    for (const d of grips) {
      const forwardFacing = d.x >= a.x - 0.1;
      if (!forwardFacing) continue;
      const hold =
        clamp(0.25 + d.TAK * 0.0042 + d.STR * 0.0034, 0.52, 1.15) *
        clamp(mass(d) / 112, 0.72, 1.45) *
        (1 + Math.max(0, grips.length - 2) * 0.16);
      d.vx -= acceleration(d) * hold * 0.38 * dt;
      d.lean = clamp(d.lean + 0.06 * hold, -0.4, 0.4);
    }
  }

  function maintainPile(a, engaged, grip, dt) {
    if (!matchState.pileState?.active) return false;
    const pile = matchState.pileState;
    if (pile.carrier !== a.key) {
      matchState.pileState = null;
      return false;
    }
    pile.age += dt;
    const advance = a.x - pile.lastX;
    if (advance > 0) matchState.pilePushYards += advance;
    // Forward progress resets the stall clock; a tiny head/hip bob doesn't.
    const progress = advance > dt * 0.34;
    pile.stalled = clamp(pile.stalled + (progress ? -dt * 1.4 : dt), 0, 5);
    pile.lastX = a.x;
    pile.maxX = Math.max(pile.maxX, a.x);
    pile.wrappers = [...matchState.tackleLinks.keys()];
    if (engaged < 2) {
      pile.loose += dt;
      if (pile.loose > 0.24) {
        matchState.pileState = null;
        return false;
      }
    } else pile.loose = 0;
    // In actual football this would require officials' judgment: standstill or
    // runner down. This 2D model uses a bounded forward-progress approximation.
    if (
      (pile.age > 0.55 && pile.stalled > 0.88) ||
      pile.age > 3.3 ||
      (grip > 2.75 && a.balance < 0.48 && pile.age > 0.7)
    ) {
      const pusherNames = (pile.pushers || []).map((x) => x.key).join(" + ");
      const gain = Math.max(0, pile.maxX - pile.startX);
      const summary =
        "Standing pile · " +
        Math.round(gain * 10) / 10 +
        " yd driven" +
        (pusherNames ? " · pushed by " + pusherNames : "");
      log(summary);
      matchState.shake = 0.22;
      finish("tackle", a.x, summary);
      return true;
    }
    return true;
  }

  function tackleLeverage(a, d) {
    const delta = Math.max(0.01, dist(a, d)),
      nx = (a.x - d.x) / delta,
      ny = (a.y - d.y) / delta;
    const closing = (d.vx - a.vx) * nx + (d.vy - a.vy) * ny;
    const impact = Math.hypot((d.vx - a.vx) * YARD_M, (d.vy - a.vy) * YARD_M);
    const impulse = ((mass(a) * mass(d)) / (mass(a) + mass(d))) * impact * 1.08;
    // A running back absorbing a blind-side hit is not the same as squaring up
    // an arm tackle from behind. Tackling fundamentals / awareness matter.
    const fromBehind = clamp(
      (a.vx * nx + a.vy * ny) / Math.max(0.4, speed(a)),
      -1,
      1,
    );
    const technique =
      0.49 * d.TAK + 0.18 * d.STR + 0.17 * d.AWR + 0.08 * d.AGI + 0.08 * d.HIT;
    const resistance =
      0.48 * a.TRK + 0.26 * a.STR + 0.15 * a.AGI + 0.11 * a.AWR;
    const weight = (mass(d) - mass(a)) * 0.105;
    const leverage = clamp((d.h - a.h) * 0.48, -5, 5);
    const advantage =
      (technique - resistance) * 0.48 +
      weight +
      leverage +
      closing * 1.0 -
      fromBehind * 7;
    return {
      closing,
      impulse,
      advantage,
      quality: clamp(0.8 + advantage * 0.016, 0.43, 1.43),
    };
  }

  function releaseTackle(d, a, reason, contest = null) {
    const link = matchState.tackleLinks.get(d.key);
    if (!link) return;
    matchState.tackleLinks.delete(d.key);
    d.wrapLinked = false;
    d.wrapReach = 0;
    d.intent = "recover";
    d.intentTarget = a.key;
    if (reason === "escape") {
      ChaosTackleReengagement.release(
        d,
        a,
        radius(a) + radius(d),
        matchState.playClock,
      );
      const reaction = ChaosEscapeReactions.release(
        a,
        d,
        link,
        contest || link.escapeDiagnostics || {},
      );
      // Failure of a grip is not failure of balance. Most defenders stay upright
      // and may pursue again. A committed airborne dive still lands physically.
      d.tackleCooldown = Math.max(
        d.tackleCooldown,
        clamp(reaction.recovery, 0.14, 0.65),
      );
      d.stun = Math.max(
        d.stun,
        reaction.fall
          ? 0.17
          : clamp(0.05 + reaction.instability * 0.18, 0.05, 0.23),
      );
      d.balance = clamp(d.balance - reaction.instability * 0.09, 0.23, 1);
      d.vx += reaction.nx * reaction.tug;
      d.vy += reaction.ny * reaction.tug;
      d.escapeReaction = {
        kind: reaction.kind,
        time: reaction.duration,
        duration: reaction.duration,
        intensity: reaction.intensity,
        side: reaction.side,
      };
      a.escapeReaction = {
        kind: reaction.kind === "power-pull" ? "drive-through" : reaction.kind,
        time: 0.42,
        duration: 0.42,
        intensity: reaction.intensity,
        side: reaction.side,
      };
      if (reaction.fall) {
        d.ground = {
          stage: "fall",
          time: 0.21,
          fall: 0.21,
          rest: 0.23,
          rise: 0.36,
          age: 0,
          force: 0,
          from: a.key,
          kind: reaction.kind,
          dir: Math.atan2(d.y - a.y, d.x - a.x),
          severity: reaction.intensity,
        };
        d.groundLock = 0;
        d.technique = "broken-grip-fall";
        d.intent = "fall";
      } else d.technique = "grip-slip";
      // Breaks consume leg energy and can reduce next attempt's power; the
      // constraint is fatigue and balance, never an arbitrary streak cap.
      const prior = clamp(a.breakExertion || 0, 0, 1);
      a.breakExertion = clamp(prior + 0.17 + 0.11 * reaction.intensity, 0, 1);
      const cost =
        (link.style === "wrap" ? 0.045 : 0.025) +
        0.016 * prior +
        0.014 * reaction.intensity;
      a.stam = Math.max(0.045, a.stam - cost);
      a.balance = clamp(
        a.balance -
          (link.style === "wrap" ? 0.035 : 0.014) * reaction.intensity,
        0.25,
        1,
      );
      d.stam = Math.max(0.045, d.stam - 0.015);
      matchState.brokenTackleCount++;
      const secured = contest?.kind === "wrap break";
      actionCue(a, secured ? "WRAP BREAK" : "BREAK TACKLE", true);
      log(
        a.name +
          " " +
          (secured ? "breaks secured wrap" : "sheds " + d.pos + " grip") +
          " · " +
          reaction.kind +
          (reaction.fall ? " · loses balance" : " · stays upright"),
      );
    } else {
      // A hold slipping out of physical reach is a release, not a stat-awarded
      // break or an automatic defender knockdown.
      d.tackleCooldown = Math.max(d.tackleCooldown, 0.18);
      d.stun = Math.max(d.stun, 0.06);
    }
  }

  // Defenders choose a secure wrap or a momentum-dependent hit. A hit can
  // dislodge the runner but risks failing to wrap if leverage is poor.
  function tackleStyle(a, d, hit) {
    if (
      d.conservativeHeld ||
      d.conservativeUntil > matchState.playClock ||
      (d.action?.time > 0 && d.action.kind === "conservative")
    )
      return "wrap";
    if (d.action?.time > 0 && !d.action.used && d.action.kind === "tackle-dive")
      return "dive";
    if (d.action?.time > 0 && !d.action.used && d.action.kind === "cut-stick")
      return "cut";
    if (
      !d.action &&
      d.lastTackleDecision?.choice === "hit-stick" &&
      matchState.playClock - d.lastTackleDecision.time < 0.15
    )
      return "hit";
    if (
      d.action?.time > 0 &&
      d.action.kind === "hit-stick" &&
      (!d.action.used || d.action.impactContactKey === a.key)
    )
      return "hit";
    // Occasional CPU low tackle against an open-field runner. It can be hurdled,
    // but only when read early, timed and physically close. Rated PUR/TAK affect
    // the decision; the rest of the time the defender prefers the safer wrap.
    // A CPU dive must be committed before collision by chooseDefenderCommitment().
    // No new chance-driven cut-stick can appear from contact alone.
    const speedIn = Math.max(0, hit.closing);
    const headOn = hit.advantage > -12 && d.HIT >= 76 && d.TAK >= 66;
    const power = d.HIT * 0.46 + d.STR * 0.25 + d.TAK * 0.2 + d.AWR * 0.09;
    return headOn && speed(d) > 2.2 && speedIn > 1.05 && power > 79
      ? "hit"
      : "wrap";
  }

  function finishTackle(a, contacts, type) {
    const names = contacts
      .map((c) => c.d.pos + (c.t.style === "hit" ? " HIT" : ""))
      .join(" + ");
    const impulse = Math.round(
      contacts.reduce((sum, c) => sum + c.t.initialImpulse, 0),
    );
    const description = type + " · " + names + " · " + impulse + " N·s";
    a.stam = Math.max(0.045, a.stam - 0.022);
    for (const c of contacts) c.d.stam = Math.max(0.045, c.d.stam - 0.037);
    log(description);
    matchState.shake = 0.18;

    a.ground = {
      stage: "fall",
      time: 0.25,
      fall: 0.25,
      rest: 0.65,
      rise: 0.3,
      age: 0,
      force: impulse,
      from: contacts[0]?.d.key || null,
      kind: "tackle",
    };

    // Snapshot the earned grips before finish() clears them and resets motion.
    const motion = { vx: a.vx || 0, vy: a.vy || 0, face: a.face || 0 };
    const wraps = contacts
      .filter(({ t }) => t.style === "wrap")
      .map(({ d, t, hit }) => ({
        defender: d.key,
        category: t.contactCategory,
        grip: t.grip,
        angle: Math.atan2(a.y - d.y, a.x - d.x),
        closing: hit.closing,
        age: t.age || 0,
        pull: t.attachment?.active ? t.attachment.force : 0,
        vx: d.vx || 0,
        vy: d.vy || 0,
        upright: !d.ground,
      }));
    const clock = matchState.totalClock || 0;
    finish(a === P("QB") ? "sack" : "tackle", a.x, description);
    if (wraps.length)
      emitPresentation({
        type: "wrapFinished",
        runner: a.key,
        clock,
        motion,
        wraps,
      });
  }

  // A hurdle can evade a well-timed low cut, but it exposes the carrier to
  // conventional high/wrap tackling. It never bypasses physical collision rules.
  function resolveHurdle(a, d, style) {
    // Y attempts a jump, not a guaranteed break. A low tackle only misses when
    // the runner's feet really clear the low obstacle at the contact instant.
    const low = style === "cut" || style === "dive" || !!d.ground;
    if (!low || !ChaosLowContact.clearance(a, d)) return false;
    if (a.action?.kind === "hurdle") a.action.used = true;
    if (a.airState?.kind === "hurdle") actionCue(a, "HURDLE", true);
    return true;
  }

  return {
    bind(services) {
      ({
        H,
        P,
        YARD_M,
        acceleration,
        actionCue,
        emitPresentation,
        finish,
        log,
        mass,
        matchState,
        radius,
        speed,
        steer,
      } = services);
    },
    pileSupport,
    resolvePileDrive,
    maintainPile,
    tackleLeverage,
    releaseTackle,
    tackleStyle,
    finishTackle,
    resolveHurdle,
  };
}
