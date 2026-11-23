import { clamp, distance2D as dist } from "../core/math.js";
import { DefensiveControls } from "../input/defensive_controls.js";
import { AnatomyHitboxes } from "../physics/anatomy_hitboxes.js";
import { ChaosContactOutcomes } from "../physics/contact_outcomes.js";

import { ChaosGripAttachment } from "../physics/grip_attachment.js";

import { ChaosTackleReengagement } from "../physics/tackle_reengagement.js";

export function createTackleContacts() {
  let ChaosContactEvidence,
    P,
    log,
    mass,
    matchState,
    radius,
    resolveCarrierAction,
    resolveHurdle,
    tackleLeverage,
    tackleStyle;

  function collectTackleContacts(a, dt) {
    const report = matchState.tackleDiagnostics;
    if (report) report.length = 0;
    for (const d of matchState.def) {
      const recovery = d.ground
        ? "grounded"
        : d.stun > 0
          ? "stunned"
          : d.tackleCooldown > 0 && d.action?.kind !== "tackle-dive"
            ? "tackle cooldown"
            : null;
      if (recovery) {
        report?.push({ defender: d.key, reason: recovery });
        d.wrapReach = 0;
        d.wrapLinked = false;
        continue;
      }
      // A quarterback holding the ball can be tackled by ANY defender who
      // physically reaches him, including a user-blitzing safety or linebacker.
      // Rush assignments affect pursuit and blocking, not tackle eligibility.
      const proximity = dist(a, d);
      if (
        !ChaosTackleReengagement.observe(
          d,
          a,
          radius(a) + radius(d),
          matchState.playClock,
        )
      ) {
        report?.push({ defender: d.key, reason: "reengagement" });
        d.wrapReach = 0;
        d.wrapLinked = false;
        continue;
      }
      // Animate hands reaching BEFORE torso collision. This state has no effect on
      // collision awards or grip probabilities; it only drives the shared rig.
      const committedDive =
        d.action?.kind === "tackle-dive" && d.action.time > 0;
      const linkActive = matchState.tackleLinks.has(d.key);
      const towardX = a.x - d.x,
        towardY = a.y - d.y;
      const lookDot =
        (Math.cos(d.face || 0) * towardX + Math.sin(d.face || 0) * towardY) /
        Math.max(0.001, proximity);
      // Facing matters while approaching; it cannot make a body that's already
      // physically interpenetrating the runner permanently untackleable.
      // The actual anatomical/contact test below still decides engagement.
      const establishedBodyContact = proximity <= radius(a) + radius(d) - 0.025;
      // A stale block penalty must not make a defender physically pressing into
      // the carrier ineligible forever. Only a nearby *live* blocker may deny
      // access to the runner; block wins and shed recovery remain meaningful away
      // from the ball. This applies equally to scrimmage and kickoff plays.
      const nearbyBlock = [...matchState.blockLinks.values()].some(
        (link) =>
          link.defender === d.key &&
          P(link.blocker) &&
          dist(P(link.blocker), d) < 2.15 &&
          link.secured > 0.28,
      );
      if (
        proximity < radius(a) + radius(d) + 0.16 &&
        !nearbyBlock &&
        d.blocked > 0.25 &&
        d.shedCooldown <= 0
      )
        d.blocked = 0;
      const eligible =
        !committedDive &&
        (!d.action?.time || ["conservative"].includes(d.action.kind)) &&
        (lookDot > -0.1 || linkActive || establishedBodyContact) &&
        d.blocked < 0.28;
      // Intent never creates a grip or a phantom tackle. Reach begins at
      // overlapping collision bodies; the opponent remains free to sidestep.
      const contactReach =
        proximity <= radius(a) + radius(d) + 0.2 || linkActive;
      const desired =
        eligible && contactReach
          ? clamp((radius(a) + radius(d) + 0.25 - proximity) / 0.65, 0.12, 1)
          : 0;
      d.wrapReach = clamp(
        (d.wrapReach || 0) +
          clamp(desired - (d.wrapReach || 0), -dt * 5.4, dt * 5.4),
        0,
        1,
      );
      d.wrapLinked = linkActive;

      // Broadphase stays cheap; only nearby runners need 15-region analysis.
      const anatomical =
        proximity < 1.65 ? ChaosContactOutcomes.evaluate(a, d) : null;
      const physicalContact = matchState.liveTackleContacts.get(d.key) || null;
      const touching =
        !!physicalContact ||
        proximity < radius(a) + radius(d) + 0.2 ||
        (committedDive &&
          anatomical &&
          anatomical.potential &&
          proximity < 1.45);
      const activeBlock = [...matchState.blockLinks.values()].find(
        (link) =>
          link.defender === d.key &&
          link.secured > 0.42 &&
          dist(P(link.blocker), d) < 2.15,
      );
      if (activeBlock)
        d.blocked = Math.max(d.blocked, 0.34 + activeBlock.secured * 0.15);
      if (touching && matchState.specialState?.returning && d.blocked >= 0.25) {
        const link = [...matchState.blockLinks].find(
          ([, e]) => e.defender === d.key,
        );
        const blocker = link ? P(link[1].blocker) : null;
        if (!blocker || dist(d, blocker) > 2.05) {
          if (link) matchState.blockLinks.delete(link[0]);
          d.blocked = 0;
        }
      }
      if (report && !linkActive && (!touching || d.blocked >= 0.25)) {
        report.push({
          defender: d.key,
          reason: !touching
            ? "out of contact reach"
            : activeBlock
              ? "secured block"
              : d.shedCooldown > 0
                ? "shed recovery"
                : "blocking penalty",
          proximity,
        });
      }
      if (touching && !linkActive && d.blocked < 0.25) {
        const currentContact =
          anatomical || ChaosContactOutcomes.evaluate(a, d);
        // Preserve real pre-separation body evidence when post-solver geometry no
        // longer intersects. This never turns bare proximity into a tackle.
        const padImpact = physicalContact?.padImpact;
        const contactState =
          physicalContact &&
          (!currentContact.bodyContact ||
            physicalContact.penetration > currentContact.penetration)
            ? physicalContact
            : currentContact;
        // A proximity radius is an inexpensive broad-phase only. Do not start a
        // tackle from empty air, and never convert a shallow arm brush into a wrap.
        // A committed dive may also carry swept contact evidence from this step.
        const swept = ChaosContactEvidence.history()
          .slice(-12)
          .some(
            (e) =>
              e.pair.includes(a.key) &&
              e.pair.includes(d.key) &&
              matchState.playClock - e.time >= 0 &&
              matchState.playClock - e.time < 0.075 &&
              e.penetration >= 0.095,
          );
        const committedDive =
          d.action?.kind === "tackle-dive" && d.action.time > 0;
        // Do not let a dive's proximity radius award a ghost tackle. Preserve the
        // stable standing-wrap solver until its full-body geometry is calibrated.
        if (
          (committedDive && contactState.kind === "miss" && !swept) ||
          (contactState.kind === "light contact" && !swept && !padImpact)
        ) {
          report?.push({
            defender: d.key,
            reason:
              contactState.kind === "miss" ? "missed dive" : "light contact",
            contact: contactState,
          });
          continue;
        }
        const hit = tackleLeverage(a, d);
        if (padImpact) hit.impulse = Math.max(hit.impulse, padImpact.impulse);
        const style = tackleStyle(a, d, hit);
        if (style === "cut" && !d.action)
          d.action = { kind: "cut-stick", time: 0.4, age: 0, used: false };
        if (resolveCarrierAction(a, d, hit)) {
          report?.push({
            defender: d.key,
            reason: "carrier action",
            style,
            contact: contactState,
          });
          continue;
        }
        if (resolveHurdle(a, d, style)) {
          report?.push({
            defender: d.key,
            reason: "hurdle clearance",
            style,
            contact: contactState,
          });
          continue;
        }
        // More fatigue from actual contact than ordinary straight-line sprinting.
        a.stam = Math.max(0, a.stam - 0.014);
        d.stam = Math.max(0, d.stam - 0.02);
        d.touches++;
        a.touches++;
        matchState.lastContact = Math.round(hit.impulse);
        matchState.tackleCount++;
        // Independent evidence: legacy radius contact can occur without a capsule hit.
        // Record this divergence for calibration rather than silently awarding a new tackle.
        if (ChaosContactEvidence.isEnabled())
          matchState.lastAnatomyTackle = {
            time: +matchState.playClock.toFixed(3),
            carrier: a.key,
            defender: d.key,
            regions: AnatomyHitboxes.contacts(
              AnatomyHitboxes.sample(a),
              AnatomyHitboxes.sample(d),
            ).slice(0, 3),
            style,
            category: contactState.kind,
          };
        const techniqueBonus =
          style === "cut"
            ? clamp((d.TAK - 70) * 0.003 - (a.w - 220) * 0.0003, -0.06, 0.12)
            : d.conservativeHeld ||
                d.conservativeUntil > matchState.playClock ||
                d.action?.kind === "conservative"
              ? DefensiveControls.conservativeGrip(d.TAK)
              : style === "dive"
                ? -clamp((95 - d.TAK) * 0.0025, 0.015, 0.13)
                : 0;
        const anatomicalQuality = ChaosGripAttachment.contactQuality(
          contactState,
          d,
          hit,
          style,
        );
        const placementQuality = padImpact
          ? Math.max(anatomicalQuality, 0.65 + 0.12 * padImpact.alignment)
          : anatomicalQuality;
        const padGrip = padImpact ? clamp(0.39 + (d.TAK - 60) * 0.004, 0.34, 0.54) : 0.055;
        const handPosition = clamp(
          (0.24 +
            hit.advantage * 0.011 +
            (style === "hit" ? 0.05 : 0) +
            techniqueBonus) *
            (0.72 + 0.28 * placementQuality),
          padGrip,
          0.72,
        );
        if (
          d.action &&
          ["hit-stick", "cut-stick", "conservative", "tackle-dive"].includes(
            d.action.kind,
          )
        ) {
          d.action.used = true;
          if (d.action.kind === "tackle-dive") {
            d.action.contactAge = d.action.age || 0;
            // Recovery is still owed after contact, but pre-launch cooldown must
            // not instantly delete a genuine grip created by this dive.
            d.tackleCooldown = 0;
          }
          d.stam = Math.max(
            0,
            d.stam -
              (style === "hit" ? 0.028 : style === "dive" ? 0.018 : 0.008),
          );
        }
        const freshSquare =
          d.squareImpact?.carrier === a.key &&
          matchState.playClock - d.squareImpact.time < 0.2
            ? d.squareImpact.score
            : 0;
        const link = {
          defender: d.key,
          age: 0,
          grip: handPosition,
          initialImpulse: hit.impulse,
          advantage: hit.advantage,
          style,
          contactCategory: contactState.kind,
          quality: placementQuality,
          attachment: null,
          square: style === "dive" ? 0 : freshSquare,
        };
        report?.push({
          defender: d.key,
          reason: "grip started",
          style,
          contact: contactState,
          quality: placementQuality,
        });
        matchState.tackleLinks.set(d.key, link);
        d.wrapLinked = true;
        d.technique = style === "hit" ? "hit-stick" : "wrap";
        if (style === "hit") {
          matchState.hitStickCount++;
          const gap = Math.max(0.05, dist(a, d)),
            nx = (a.x - d.x) / gap,
            ny = (a.y - d.y) / gap;
          const strike = clamp(
            (d.HIT * 0.58 + d.STR * 0.28 + d.TAK * 0.14 - 55) / 48,
            0.25,
            1.15,
          );
          const hitVelocity = clamp(
            Math.max(0, hit.closing) * strike * 0.52,
            0,
            2.6,
          );
          a.vx += (nx * hitVelocity * mass(d)) / (mass(a) + mass(d));
          a.vy += (ny * hitVelocity * mass(d)) / (mass(a) + mass(d));
          d.vx -= (nx * hitVelocity * mass(a)) / (mass(a) + mass(d));
          d.vy -= (ny * hitVelocity * mass(a)) / (mass(a) + mass(d));
          a.balance = clamp(
            a.balance - 0.09 * strike - hitVelocity * 0.035,
            0.3,
            1,
          );
          a.impact = Math.max(a.impact, 0.42 * strike);
          // Hard hits sacrifice some hand security when outmuscled; high TAK can recover.
          if (a.TRK > d.TAK + 15) link.grip *= 0.75;
          log(
            d.pos + " HIT STICK on " + a.name + " · HIT " + Math.round(d.HIT),
          );
        } else log(d.pos + " wraps " + a.name + " · TAK " + d.TAK);
      }
    }
  }

  return {
    bind(services) {
      ({
        ChaosContactEvidence,
        P,
        log,
        mass,
        matchState,
        radius,
        resolveCarrierAction,
        resolveHurdle,
        tackleLeverage,
        tackleStyle,
      } = services);
    },
    collectTackleContacts,
  };
}
