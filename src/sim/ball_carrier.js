import { clamp, distance2D as dist } from "../core/math.js";
import { ChaosLowContact } from "../physics/low_contact.js";

export function createBallCarrier() {
  let P,
    RUNS,
    actionCue,
    finish,
    log,
    mass,
    matchState,
    maxSpeed,
    rand,
    speed,
    stickInput;

  // The action itself is cheap; exertion and contact determine the additional
  // cost. Each collision is rated, not a guaranteed special-move animation.
  function availableRunner() {
    if (matchState.ballCarrier?.team === 0) return matchState.ballCarrier;
    // LT modifies quarterback face buttons into ball skills. It doesn't throw.
    return !RUNS.has(matchState.selectedPlay) &&
      !matchState.passThrown &&
      matchState.controls.quarterbackMoves &&
      matchState.phase === "live"
      ? P("QB")
      : null;
  }

  function carrierMove(kind, side = 0) {
    const a = availableRunner();
    if (
      matchState.paused ||
      matchState.phase !== "live" ||
      !a ||
      matchState.controlMode !== "offense"
    )
      return false;
    if (matchState.moveCooldown > 0) {
      // One buffered footwork input, replaced by the most recent flick. No free
      // extra actions: fatigue and move costs apply only when it actually fires.
      if (kind === "juke" || kind === "hesi") {
        matchState.queuedCarrierMove = {
          kind,
          side,
          expires: matchState.playClock + 0.42,
        };
        return true;
      }
      return false;
    }
    matchState.queuedCarrierMove = null;
    const exhaustion = clamp(a.stam / 0.38, 0.2, 1);
    const base =
      kind === "juke"
        ? 0.02 * (1 - 0.16 * clamp(((a.JUK || 50) - 30) / 69, 0, 1))
        : kind === "hesi"
          ? 0.016
          : kind === "spin"
            ? 0.027
            : kind === "hurdle"
              ? 0.041
              : kind === "truck"
                ? 0.018
                : 0.018;
    a.stam = Math.max(0, a.stam - base);
    a.action = {
      kind,
      side,
      time:
        kind === "hurdle"
          ? 0.66
          : ["juke", "hesi", "spin"].includes(kind)
            ? 0.4
            : 0.5,
      age: 0,
      used: false,
      power: exhaustion,
    };
    // This is a timing/replant cost, not a one-move-per-play restriction.
    matchState.moveCooldown =
      kind === "juke"
        ? 0.2
        : kind === "hesi"
          ? 0.24
          : kind === "spin"
            ? 0.34
            : kind === "hurdle"
              ? 0.59
              : 0.38;
    a.technique = kind;
    a.pulse = 0.29;
    if (kind === "juke") {
      const stick = stickInput(),
        direction =
          side ||
          (Math.abs(stick.y) > 0.13 ? Math.sign(stick.y) : a.y < 26.6 ? 1 : -1);
      // A right-stick juke has a stable field-relative lateral axis. The
      // offense always attacks positive X; left and right refer to the two
      // sidelines, NOT the runner's momentary velocity. Rotating the juke frame
      // with each prior cut made repeated right flicks trace small circles.
      const fx = 1,
        fy = 0,
        nx = 0,
        ny = direction;
      const effort = clamp(0.25 + 0.75 * exhaustion, 0.4, 1);
      a.jukeDrive = {
        nx,
        ny,
        fx,
        fy,
        remaining: 0.43,
        duration: 0.43,
        power: exhaustion,
        side: direction,
      };
      // The cut itself is applied each physics frame, even when the left stick
      // remains held forward. Avoid a one-frame impulse that disappears at the
      // rated speed cap.
      a.vx += nx * 0.38 * effort;
      a.vy += ny * 0.38 * effort;
      a.spin += direction * 0.27;
    } else if (kind === "hesi") {
      a.vx *= clamp(0.58 + (1 - exhaustion) * 0.22, 0.56, 0.82);
      a.vy += side * 0.26 * exhaustion;
    } else if (kind === "spin") {
      a.spin += (side || 1) * 5.3 * exhaustion;
      a.vy += (side || 1) * 0.64 * exhaustion;
    } else if (kind === "truck")
      a.balance = clamp(a.balance + 0.13 * exhaustion, 0.35, 1);
    else if (kind === "hurdle") {
      // The runner must launch off a planted foot. No teleport or speed boost.
      if (!ChaosLowContact.initiate(a, "hurdle")) return false;
      a.balance = clamp(a.balance - 0.05, 0.35, 1);
      a.vx *= 0.95;
      a.vy *= 0.95;
      actionCue(a, "hurdle");
    }
    log(
      kind.toUpperCase() +
        " · " +
        a.name +
        " · " +
        Math.round(a.stam * 100) +
        "% energy",
    );
    return true;
  }

  function holdStiffArm(held) {
    const a = availableRunner();
    for (const p of matchState.off) if (p !== a) p.stiffArmHeld = false;
    if (
      !a ||
      matchState.controlMode !== "offense" ||
      matchState.phase !== "live" ||
      matchState.paused
    ) {
      if (a) a.stiffArmHeld = false;
      return false;
    }
    if (held && !a.stiffArmHeld) {
      // Begin on press, keep the arm extended until released. Holding doesn't
      // repeatedly trigger the contact win calculation.
      if (!carrierMove("stiff")) return false;
      a.stiffArmHeld = true;
    }
    if (!held) {
      a.stiffArmHeld = false;
      if (a.action?.kind === "stiff")
        a.action.time = Math.min(a.action.time, 0.2);
    }
    return !!a.stiffArmHeld;
  }

  function protectBall(held) {
    const a = availableRunner() || matchState.ballCarrier;
    if (a && a.team === 0) {
      a.covering = !!held;
      return true;
    }
    return false;
  }

  function downSafe() {
    const a = availableRunner() || matchState.ballCarrier;
    if (
      matchState.paused ||
      matchState.phase !== "live" ||
      matchState.controlMode !== "offense" ||
      !a ||
      a.team !== 0
    )
      return false;
    a.action = { kind: "giveup", time: 0.3, age: 0, used: true };
    a.vx = 0;
    a.vy = 0;
    a.stam = Math.max(0, a.stam - 0.004);
    finish("down", a.x, a.name + " safely gives himself up.");
    return true;
  }

  function diveForYards() {
    const a = availableRunner() || matchState.ballCarrier;
    if (
      matchState.paused ||
      matchState.phase !== "live" ||
      matchState.controlMode !== "offense" ||
      !a ||
      a.team !== 0 ||
      a.ground ||
      a.diveRecovery > 0 ||
      (a.action?.kind === "dive" && a.action.time > 0)
    )
      return false;
    a.diveRecovery = 1.1;
    const input = stickInput(),
      nx = input.mag > 0.15 ? input.x : Math.cos(a.face),
      ny = input.mag > 0.15 ? input.y : Math.sin(a.face);
    const energy = clamp(a.stam / 0.3, 0.18, 1);
    a.action = { kind: "dive", time: 0.44, age: 0, used: true };
    a.vx += nx * (1.35 + (0.55 * a.AGI) / 99) * energy;
    a.vy += ny * 1.4 * energy;
    a.stam = Math.max(0, a.stam - 0.032);
    log(a.name + " dives for extra yards");
    return true;
  }

  function resolveCarrierAction(a, d, hit) {
    const act = a.action;
    if (!act || act.time <= 0 || act.used) return false;
    const kind = act.kind;
    if (!["truck", "stiff", "juke", "hesi", "spin"].includes(kind))
      return false;
    const offense =
      kind === "truck"
        ? a.TRK * 0.43 + a.STR * 0.3 + a.w * 0.052 + a.AWR * 0.1
        : kind === "stiff"
          ? a.SFA * 0.4 + a.STR * 0.21 + a.TRK * 0.22 + a.AWR * 0.17
          : kind === "spin"
            ? a.AGI * 0.44 + a.CUT * 0.32 + a.AWR * 0.16 + a.ACC * 0.08
            : kind === "hesi"
              ? a.AGI * 0.33 + a.CUT * 0.3 + a.ACC * 0.24 + a.AWR * 0.13
              : a.JUK * 0.29 +
                a.AGI * 0.27 +
                a.CUT * 0.22 +
                a.ACC * 0.12 +
                a.AWR * 0.1;
    const defense = d.TAK * 0.39 + d.AWR * 0.22 + d.STR * 0.18 + d.PUR * 0.21;
    const angle = hit.advantage * 0.38 + clamp((a.vx - d.vx) * 0.5, -3, 3);
    const margin =
      offense * clamp(act.power ?? 1, 0.22, 1) -
      defense -
      angle +
      (rand() - 0.5) * 16 +
      (a.covering ? -4 : 0);
    const win = margin > (["juke", "spin", "hesi"].includes(kind) ? 0 : -2);
    act.used = true;
    a.actionOutcomes++;
    if (kind === "truck") {
      a.lastTruckOutcome = {
        defender: d.key,
        win,
        at: matchState.playClock,
        margin: +margin.toFixed(2),
      };
      actionCue(a, win ? "TRUCK" : "TRUCK STOPPED", win);
    }
    if (win) {
      const dd = Math.max(0.1, dist(a, d)),
        nx = (d.x - a.x) / dd,
        ny = (d.y - a.y) / dd;
      d.stun = Math.max(
        d.stun,
        ["juke", "spin", "hesi"].includes(kind) ? 0.3 : 0.22,
      );
      d.tackleCooldown = Math.max(
        d.tackleCooldown,
        ["juke", "spin", "hesi"].includes(kind) ? 0.49 : 0.36,
      );
      if (!["juke", "hesi", "spin"].includes(kind)) {
        const push =
          (clamp(0.5 + margin * 0.025, 0.3, 1.95) * mass(a)) /
          (mass(a) + mass(d));
        d.vx += nx * push;
        d.vy += ny * push;
        a.vx -= nx * push * 0.23;
        a.vy -= ny * push * 0.23;
        a.stam = Math.max(0.045, a.stam - (kind === "truck" ? 0.092 : 0.073));
        d.stam = Math.max(0.045, d.stam - 0.022);
      } else a.stam = Math.max(0, a.stam - 0.012);
      a.pulse = 0.4;
      d.impact = 0.45;
      d.balance = clamp(d.balance - 0.16, 0.25, 1);
      log(
        a.name +
          " wins " +
          kind +
          " against " +
          d.pos +
          " (" +
          Math.round(margin) +
          " matchup)",
      );
      return true; // no clean tackle wrap
    }
    // A juke that fails and enters contact costs more than open-field footwork.
    a.stam = Math.max(
      0,
      a.stam - (["juke", "hesi", "spin"].includes(kind) ? 0.016 : 0.023),
    );
    log(d.pos + " defeats " + a.name + " " + kind);
    return false;
  }

  function burst() {
    if (
      matchState.paused ||
      matchState.phase !== "live" ||
      matchState.burstCool > 0
    )
      return;
    const p = matchState.ballCarrier || P("QB");
    if (!p || p.stam < 0.13) return;
    let stick = stickInput(),
      len = Math.hypot(stick.x, stick.y);
    let dx = len > 0.2 ? stick.x : Math.cos(p.face),
      dy = len > 0.2 ? stick.y : Math.sin(p.face);
    if (!isFinite(dx)) dx = 1;
    const kick = clamp(p.stam / 0.55, 0.25, 1);
    p.vx += dx * (0.35 + p.ACC * 0.012) * kick;
    p.vy += dy * (0.35 + p.ACC * 0.012) * kick;
    const burstSpeed = speed(p),
      hardCap = maxSpeed(p);
    if (burstSpeed > hardCap) {
      p.vx *= hardCap / burstSpeed;
      p.vy *= hardCap / burstSpeed;
    }
    matchState.burstTime = 0.75;
    matchState.burstCool = 3.2;
    p.stam = Math.max(0.045, p.stam - 0.18);
    p.shield = Math.max(p.shield, 0.12);
    log(p.name + " accelerates · ACC " + p.ACC);
  }

  function evade() {
    if (matchState.ballCarrier) return carrierMove("juke");
    if (
      matchState.paused ||
      matchState.phase !== "live" ||
      matchState.evadeCool > 0
    )
      return;
    const p = matchState.ballCarrier || P("QB");
    if (!p) return;
    matchState.evadeTime = 0.45;
    matchState.evadeCool = 2.6;
    p.stam = Math.max(0.3, p.stam - 0.15);
    const dir = stickInput();
    p.vy +=
      (Math.abs(dir.y) > 0.1 ? dir.y : rand() > 0.5 ? 1 : -1) *
      2.5 *
      (0.75 + p.AGI / 200);
    log("CUT · " + p.name + " · AGI " + p.AGI);
  }

  return {
    bind(services) {
      ({
        P,
        RUNS,
        actionCue,
        finish,
        log,
        mass,
        matchState,
        maxSpeed,
        rand,
        speed,
        stickInput,
      } = services);
    },
    availableRunner,
    carrierMove,
    holdStiffArm,
    protectBall,
    downSafe,
    diveForYards,
    resolveCarrierAction,
    burst,
    evade,
  };
}
