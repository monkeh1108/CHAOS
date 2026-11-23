import { ageIndirectDrive } from "./indirect_contact.js";
import { clamp } from "../core/math.js";
import { ChaosDiveCollision } from "../physics/dive_collision.js";
import { ChaosLowContact } from "../physics/low_contact.js";
import { ChaosContactFeedback } from "../render/contact_feedback_policy.js";

export function createMotionStep() {
  let ChaosContactEvidence,
    H,
    actionCue,
    finish,
    finishReturn,
    log,
    mass,
    matchState,
    maxSpeed,
    resolveBodyContacts,
    speed;

  function applyMotion(dt) {
    matchState.liveTackleContacts.clear();
    if (matchState.carrierCollisionDiagnostics)
      matchState.carrierCollisionDiagnostics.length = 0;
    const anatomyBefore = matchState.players.map((p) =>
      ChaosContactEvidence.poseCopy(p),
    );
    for (const p of matchState.players) {
      if (p.indirectDrive) ageIndirectDrive(p, dt);
      if (p.ground) {
        p.vx *= 0.66;
        p.vy *= 0.66;
      }
      ChaosLowContact.advance(p, dt);
      p.travel += Math.hypot(p.vx, p.vy) * dt;
      p.x = clamp(p.x + p.vx * dt, 0, 120);
      p.y = clamp(p.y + p.vy * dt, -0.3, H + 0.3);
      p.diveRecovery = Math.max(0, (p.diveRecovery || 0) - dt);
      p.blocked = Math.max(0, p.blocked - dt);
      p.tackleCooldown = Math.max(0, p.tackleCooldown - dt);
      p.shedCooldown = Math.max(0, p.shedCooldown - dt);
      p.pulse = Math.max(0, p.pulse - dt);
      p.impact = Math.max(0, p.impact - dt * 1.5);
      p.standContact = Math.max(0, (p.standContact || 0) - dt * 1.6);
      p.spin *= Math.max(0, 1 - dt * 3.7);
      p.tackleStrain = Math.max(0, (p.tackleStrain || 0) - dt * 2.3);
      p.breakExertion = Math.max(0, (p.breakExertion || 0) - dt * 0.075);
      if (p.escapeReaction) {
        p.escapeReaction.time -= dt;
        if (p.escapeReaction.time <= 0) p.escapeReaction = null;
      }
      p.lean *= Math.max(0, 1 - dt * 2.0);
      p.balance = clamp(p.balance + dt * 0.34, 0.3, 1);
    }
    // React to downed defenders ahead; this is a *small* conditional hop, not
    // invulnerability, and a reachable grounded defender may still grab the foot.
    if (
      matchState.phase === "live" &&
      matchState.ballCarrier &&
      !matchState.ballCarrier.ground &&
      matchState.ballCarrier.team === 0
    ) {
      const r = matchState.ballCarrier;
      if (!r.airState && r.action?.kind !== "hurdle")
        for (const d of matchState.def) {
          if (ChaosLowContact.shouldAutoHop(r, d)) {
            if (ChaosLowContact.initiate(r, "hop")) {
              r.autoHopCooldown = 1.05;
              r.stam = Math.max(0.04, r.stam - 0.009);
              actionCue(r, "HOP", true);
              break;
            }
          }
        }
    }
    resolveBodyContacts();
    // Physically stop low diving shoulders/arms crossing the runner's legs.
    // This applies to special-teams returns and scrimmage; contact is NOT a
    // tackle award and a genuinely wide miss is untouched.
    if (
      matchState.phase === "live" &&
      matchState.ballCarrier &&
      !matchState.ballCarrier.ground
    ) {
      const pre = new Map(anatomyBefore.map((p) => [p.key, p]));
      for (const d of matchState.def) {
        if (d.ground || d.action?.kind !== "tackle-dive" || d.action.time <= 0)
          continue;
        const runnerBefore = pre.get(matchState.ballCarrier.key),
          diveBefore = pre.get(d.key);
        if (!runnerBefore || !diveBefore) continue;
        const sample = ChaosDiveCollision.evaluate(
          runnerBefore,
          matchState.ballCarrier,
          diveBefore,
          d,
        );
        if (!sample.hit) continue;
        // Avoid injecting the impulse repeatedly during one continuing overlap.
        const fresh = matchState.playClock - (d.lowDiveImpactAt ?? -999) > 0.13;
        const outcome = fresh
          ? ChaosDiveCollision.response(
              matchState.ballCarrier,
              d,
              runnerBefore,
              diveBefore,
              sample,
              dt,
              mass(matchState.ballCarrier),
              mass(d),
            )
          : sample;
        if (fresh) {
          d.lowDiveImpactAt = matchState.playClock;
          matchState.lowDiveContacts++;
          matchState.lastLowDiveImpact = {
            time: +matchState.playClock.toFixed(3),
            runner: matchState.ballCarrier.key,
            defender: d.key,
            kind: outcome.kind,
            physical: !!outcome.physical,
            regions: outcome.regions,
            swept: outcome.swept,
          };
        }
      }
    }
    // Low foot/ankle impacts: momentum, balance and lower-body placement
    // choose a stumble, a trip or a clean clearance. This works on kickoffs too.
    if (
      matchState.phase === "live" &&
      matchState.ballCarrier &&
      !matchState.ballCarrier.ground &&
      matchState.ballCarrier.team === 0
    ) {
      const r = matchState.ballCarrier,
        prior = new Map(anatomyBefore.map((p) => [p.key, p]));
      for (const d of matchState.def) {
        if (!ChaosLowContact.isLowThreat(d) || r.lowContactCooldown > 0)
          continue;
        const hit = ChaosLowContact.evaluate(
          prior.get(r.key) || r,
          r,
          prior.get(d.key) || d,
          d,
          !matchState.specialState,
        );
        if (!hit.hit) continue;
        // Ignore early capsule fringe overlaps; measure meaningful contact nearer
        // the runner's leg instead of latching a long cooldown on a toe brush.
        if (hit.contact < 0.35) continue;
        r.lowContactCooldown = 0.27;
        d.lowContactCooldown = 0.28;
        const velocity = Math.hypot(r.vx, r.vy);
        const raw =
          hit.contact *
          (0.46 +
            0.07 * Math.min(7, velocity) +
            0.034 * Math.min(7, hit.closing));
        const resistance = clamp(
          (r.AGI * 0.43 + r.STR * 0.22 + r.TRK * 0.2 + r.AWR * 0.15 - 65) / 175,
          -0.08,
          0.19,
        );
        const grip = clamp(
          (d.TAK * 0.62 + d.STR * 0.23 + d.AWR * 0.15 - 65) / 150,
          -0.08,
          0.22,
        );
        // Harder to brace or redirect a body with no foot planted under it.
        const airRisk = ChaosLowContact.bodyVulnerability(r);
        const severity = clamp(
          raw * (1 + grip - resistance) * airRisk,
          0,
          1.65,
        );
        r.vx *= Math.max(0.57, 1 - severity * 0.28);
        r.vy *= Math.max(0.57, 1 - severity * 0.28);
        r.balance = clamp(r.balance - severity * 0.32, 0.16, 1);
        r.impact = Math.max(r.impact, Math.min(0.6, 0.2 + severity * 0.3));
        r.stumbleTime = Math.max(r.stumbleTime, 0.21 + severity * 0.3);
        const dir = Math.atan2(r.y - d.y, r.x - d.x);
        r.lean = clamp(r.lean - 0.22 * severity, -0.56, 0.56);
        r.spin = clamp(
          r.spin + Math.sin(dir - (r.face || 0)) * severity * 0.4,
          -3,
          3,
        );
        d.vx *= Math.max(0.22, 1 - severity * 0.34);
        d.vy *= Math.max(0.22, 1 - severity * 0.34);
        if (d.ground) {
          d.ankleReachTime = 0.34;
          if (!matchState.specialState) d.ground.ankleAttempted = true;
        } else d.impact = Math.max(d.impact, 0.18 + severity * 0.17);
        const truckWon =
          r.lastTruckOutcome?.win &&
          r.lastTruckOutcome.defender === d.key &&
          matchState.playClock - r.lastTruckOutcome.at < 0.48;
        // Keep real ankle forces even during a truck, but do not overwrite a
        // successfully resolved TRUCK cue with a small leg-contact notification.
        const feedback = ChaosContactFeedback.label({
          severity,
          balance: r.balance,
          truckWon,
          tripped: false,
        });
        const visibleStumble = feedback === "STUMBLE";
        if (feedback) actionCue(r, feedback, false);
        // Severe actual contact plus loss of support can take a runner down. A
        // light toe touch or a cleanly hurdled body never forces a tackle.
        const tripped =
          (severity > 0.88 && (r.balance < 0.72 || severity > 1.08)) ||
          (severity > 0.64 && r.balance < 0.45);
        matchState.lastFootContact = {
          kind: hit.kind,
          part: hit.part,
          airHeight: +hit.height.toFixed(3),
          severity: +severity.toFixed(3),
          result: tripped
            ? "trip"
            : truckWon
              ? "truck-with-leg-contact"
              : visibleStumble
                ? "stumble"
                : "minor-leg-contact",
          defender: d.key,
          time: +matchState.playClock.toFixed(3),
        };
        matchState.footContacts++;
        if (tripped) {
          actionCue(r, "TRIPPED", true);
          r.airState = null;
          r.ground = {
            stage: "winded",
            time: 0.5,
            fall: 0.1,
            rest: 0.4,
            rise: 0.4,
            age: 0.3,
            kind: "trip",
            from: d.key,
            dir,
            severity,
          };
          log(d.pos + " trips " + r.name + " at " + hit.part);
          if (matchState.specialState)
            finishReturn("tackle", r.x, r.name + " tripped at the ankles");
          else finish("tackle", r.x, r.name + " tripped at the ankles");
          break;
        } else if (visibleStumble)
          log(d.pos + " clips " + r.name + " lower leg · stumbles");
      }
    }
    // Read-only swept anatomical evidence after contact resolution. Physical
    // outcomes remain governed by the existing, stable tackle/block solvers.
    if (matchState.phase === "live")
      ChaosContactEvidence.scan(
        anatomyBefore,
        matchState.players.map((p) => {
          const s = ChaosContactEvidence.poseCopy(p);
          s.isCarrier = p === matchState.ballCarrier;
          return s;
        }),
        matchState.playClock,
        { all: ChaosContactEvidence.isFullScan() },
      );
    for (const p of matchState.players) {
      p.x = clamp(p.x, 0, 120);
      p.y = clamp(p.y, -0.3, H + 0.3);
      const v = speed(p),
        limit = maxSpeed(p) * 1.32;
      if (v > limit) {
        p.vx *= limit / v;
        p.vy *= limit / v;
      }
    }
  }

  return {
    bind(services) {
      ({
        ChaosContactEvidence,
        H,
        actionCue,
        finish,
        finishReturn,
        log,
        mass,
        matchState,
        maxSpeed,
        resolveBodyContacts,
        speed,
      } = services);
    },
    applyMotion,
  };
}
