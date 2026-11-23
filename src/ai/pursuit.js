import { clamp, distance2D as dist } from "../core/math.js";
import { DefensivePresnap } from "../ai/defensive_presnap.js";
import { InsideZoneIQ } from "../ai/inside_zone_iq.js";
import { ChaosPursuitReaction } from "../ai/pursuit_reaction.js";
import { RunPursuitPolicy } from "../ai/run_pursuit_policy.js";

export function createPursuit() {
  let H, P, RUNS, arrive, matchState, maxSpeed, steer;

  // Run fits are assigned before the snap. Defenders recognize *visual* cues at
  // different delays; a coverage player doesn't magically know the offensive call.
  const FITS = {
    EDGE1: ["force-left", 19],
    EDGE2: ["force-right", 34],
    DT: ["gap-left", 24],
    DT2: ["gap-right", 29],
    NT: ["gap-middle", 26.6],
    DE3A: ["gap-left", 22],
    DE3B: ["gap-right", 31],
    MLB: ["fill-left", 22],
    OLB: ["cutback", 31],
    WILL: ["fill-left", 20],
    SAM: ["force-right", 35],
    CB1: ["force-left", 8],
    CB2: ["force-right", 45],
    CB3: ["alley", 18],
    FS: ["last-line", 18],
    SS: ["last-line", 36],
  };

  function runFitFor(d) {
    let [role, lane] = FITS[d.key] || ["fill-left", 26];
    if (d.key === "CB3" && d.spawnY > 26) {
      role = "alley";
      lane = 35;
    }
    return { role, lane };
  }

  function hasRunCue() {
    const rg = P("RG"),
      rb = P("RB");
    // A pulling guard or back accelerating into the mesh can reveal a run.
    const pulling =
      rg && rg.spawnY - rg.y > 0.4 && rg.x < matchState.playStart + 0.2;
    const mesh = rb && rb.x - rb.spawnX > 1.15;
    return !!(matchState.ballCarrier === rb || pulling || mesh);
  }

  function recognizeRun(d) {
    if (!RUNS.has(matchState.selectedPlay)) return false;
    if (d.runRead) return true;
    // Nearby defenders can recognize the football sooner than a deep DB.
    const local =
      matchState.ballCarrier && dist(d, matchState.ballCarrier) < 3.4;
    // Once a handoff is established, deep defenders can recognize the shared
    // backfield/teammate cues even if their eyes are temporarily on a receiver.
    // Require a rating-sensitive read window plus a short post-handoff confirmation;
    // this never reveals a run before the football is actually handed off.
    const confirmedHandoff =
      matchState.ballCarrier === P("RB") &&
      matchState.playClock >=
        d.readAt + (d.pos === "FS" || d.pos === "SS" ? 0.16 : 0.12);
    if (
      (local || matchState.playClock >= d.readAt) &&
      hasRunCue() &&
      (InsideZoneIQ.visible(d, matchState.ballCarrier || P("RB")) ||
        local ||
        confirmedHandoff)
    ) {
      d.runRead = true;
      d.readAtTime = matchState.playClock;
      return true;
    }
    return false;
  }

  function runFitAI(d, dt) {
    const fit = d.fit || runFitFor(d),
      role = fit.role,
      inner = role.includes("gap") || role.includes("fill");
    const anchoredGap =
      fit.gapSpot ??
      DefensivePresnap.gapTarget(d, matchState.off, matchState.playStart);
    const x =
      anchoredGap?.x ??
      matchState.playStart +
        (inner
          ? role.startsWith("gap")
            ? 0.9
            : 3.2
          : role.includes("force")
            ? 2.0
            : 6.2);
    let y = anchoredGap?.y ?? fit.lane;
    // A defender must actually be facing the running back to update his fit.
    // Do not rotate 180° toward a runner outside the player's field of view.
    const a = matchState.ballCarrier || P("RB");
    const seesRunner = a && InsideZoneIQ.visible(d, a);
    if (a && d.runRead && seesRunner) {
      const weight = clamp((d.PRC - 35) / 80, 0.2, 0.78);
      if (inner) y += clamp(a.y - y, -5.5, 5.5) * weight;
      else if (role === "cutback") y += clamp(a.y - y, -6, 6) * 0.26;
      else if (role === "alley") y += clamp(a.y - y, -7, 7) * 0.43;
    }
    d.intent = "run-fit";
    d.intentTarget = role;
    if (
      matchState.selectedPlay === "inside" &&
      d.runRead &&
      seesRunner &&
      !d.ground &&
      d.blocked < 0.2 &&
      matchState.playClock > 0.29 &&
      dist(d, a) > 3.4 &&
      dist(d, a) < 13
    ) {
      const response = InsideZoneIQ.response(
        d,
        matchState.off.filter((o) =>
          ["LT", "LG", "C", "RG", "RT", "TE", "FB"].includes(o.key),
        ),
        a,
        role,
      );
      // Stay near the designed gap: beating a block is not permission to abandon
      // an entire side of the formation to chase an imagined future cut.
      if (response && Math.abs(response.y - fit.lane) < 4.0) {
        d.intent = "run-block-read";
        d.intentTarget = response.blocker;
        steer(d, x + 0.3 - d.x, y + (response.y - d.y) * 0.48 - d.y, dt, 0.98);
        return;
      }
    }
    if (role.startsWith("gap")) steer(d, x - d.x, y - d.y, dt, 0.97);
    else arrive(d, x, y, dt, 1.05);
  }

  // Pursuit is *replanned every frame* from the current carrier velocity.
  // The earlier solver projected up to 1.65 seconds, which made defenders run
  // toward a phantom point long after the runner changed direction. Prediction
  // now gets shorter as the defender gets close enough to tackle.
  function interceptT(d, a) {
    const sep = dist(d, a),
      spd = Math.max(2.0, maxSpeed(d) * (0.87 + 0.13 * d.stam));
    const rx = a.x - d.x,
      ry = a.y - d.y,
      vx = a.vx,
      vy = a.vy;
    const aa = vx * vx + vy * vy - spd * spd,
      bb = 2 * (rx * vx + ry * vy),
      cc = rx * rx + ry * ry;
    let t = sep / spd;
    const disc = bb * bb - 4 * aa * cc;
    if (disc >= 0 && Math.abs(aa) > 1e-6) {
      const root = Math.sqrt(disc);
      const good = [(-bb - root) / (2 * aa), (-bb + root) / (2 * aa)].filter(
        (x) => x > 0.01,
      );
      if (good.length) t = Math.min(...good);
    }
    // A long-horizon meeting point fails when a ball carrier changes lanes.
    return clamp(t, 0.045, 0.85);
  }

  function pursuitAim(d, a) {
    const sep = dist(d, a),
      fit = d.fit || runFitFor(d),
      role = fit.role;
    const pur = clamp((d.PUR - 35) / 64, 0.08, 1);
    let t;
    if (sep <= 4.5) t = 0.035;
    else if (sep <= 9) t = 0.065 + 0.11 * pur;
    else if (sep <= 18) t = Math.min(interceptT(d, a), 0.15 + 0.25 * pur);
    else t = Math.min(interceptT(d, a), 0.26 + 0.33 * pur);
    // If the runner slows or changes direction, aim follows immediately; there
    // is no cached "run lane" or historical target for the tackler.
    let tx = a.x + a.vx * t,
      ty = a.y + a.vy * t;
    let mode = "close";
    if (sep > 8) {
      // Keep the outside shoulder from being surrendered early, but never chase
      // a predefined lane behind the live runner.
      if (role === "force-left" && a.y < 26.6) {
        ty = Math.min(ty, a.y - 0.65);
        mode = "edge-contain";
      } else if (role === "force-right" && a.y > 26.6) {
        ty = Math.max(ty, a.y + 0.65);
        mode = "edge-contain";
      } else if (role === "cutback" && Math.abs(a.y - 26.6) > 7) {
        ty = ty * 0.88 + 26.6 * 0.12;
        mode = "cutback";
      } else if (role === "last-line" && d.x > a.x + 3) {
        // Deep safety protects the goal line before closing. As the runner nears,
        // the safety must still come downhill to actually make the tackle.
        tx = Math.max(tx, a.x + 0.6);
        mode = "last-line";
      }
    }
    if (sep < 5.5) {
      tx = a.x + a.vx * 0.025;
      ty = a.y + a.vy * 0.025;
      mode = "tackle";
    }
    // Never aim *behind* the runner just because the defender trails him.
    if (d.x < a.x - 1 && a.vx > 1.2) tx = Math.max(tx, a.x + 0.1);
    tx = clamp(tx, 10, 110);
    ty = clamp(ty, 0.45, H - 0.45);
    const base = { x: tx, y: ty, lead: t, mode, sep, role };
    // Track only where the live runner has physically been on this play.
    // We do not infer a route or read an unsnapped offensive play call.
    if (
      matchState.ballCarrier === a &&
      !matchState.specialState &&
      Number.isFinite(a.x)
    ) {
      if (!Number.isFinite(a.pursuitHighX)) a.pursuitHighX = a.x;
      a.pursuitHighX = Math.max(a.pursuitHighX, a.x);
      // Learn the *observed* backward/outside escape only after the whistle.
      // This is not an observation of the hidden play or an instant AI adjustment.
      if (
        matchState.currentMemoryPlay?.kind === "run" &&
        matchState.currentMemoryPlay.team === matchState.possession
      ) {
        const side = a.y < H / 2 ? -1 : 1;
        if (
          Math.abs(a.y - H / 2) > 5 &&
          (a.vy || 0) * side > 1.1 &&
          a.pursuitHighX - a.x > 2.2
        ) {
          matchState.currentMemoryPlay.retreatSide =
            side < 0 ? "left" : "right";
        }
      }
    }
    // No change to special-teams pursuit: preserve the newly stabilized returns.
    const planned = RunPursuitPolicy.plan(d, a, base, {
      fieldWidth: H,
      peakX: a.pursuitHighX,
      enabled: matchState.ballCarrier === a && !matchState.specialState,
    });
    return ChaosPursuitReaction.aim(d, a, planned, matchState.playClock);
  }

  function pursuitAI(d, a, dt) {
    const aim = pursuitAim(d, a);
    d.pursuitPoint = aim;
    const rating = clamp(0.95 + (d.PUR - 70) * 0.0032, 0.82, 1.11);
    d.intent = ["edge-contain", "retreat-contain"].includes(aim.mode)
      ? "contain"
      : aim.mode === "last-line"
        ? "safety-angle"
        : "pursue";
    d.intentTarget = aim.role;
    steer(d, aim.x - d.x, aim.y - d.y, dt, rating * (d.blocked > 0 ? 0.54 : 1));
  }

  return {
    bind(services) {
      ({ H, P, RUNS, arrive, matchState, maxSpeed, steer } = services);
    },
    runFitFor,
    recognizeRun,
    runFitAI,
    interceptT,
    pursuitAim,
    pursuitAI,
  };
}
