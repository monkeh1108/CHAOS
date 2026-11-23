import { clamp, distance2D as dist } from "../core/math.js";

import { ChaosContactOutcomes } from "../physics/contact_outcomes.js";
import { ChaosEscapeReactions } from "../physics/escape_reactions.js";
import { ChaosGripAttachment } from "../physics/grip_attachment.js";
import { ChaosSquareContact } from "../physics/square_contact.js";
import { ChaosTackleEscape } from "../physics/tackle_escape.js";

import { ChaosTackleStruggle } from "../physics/tackle_struggle.js";

export function createTackleResolution() {
  let collectTackleContacts,
    P,
    finishTackle,
    log,
    maintainPile,
    mass,
    matchState,
    maxSpeed,
    radius,
    releaseTackle,
    speed,
    tackleLeverage;

  function resolveTackles(a, dt) {
    if (!a || a.team !== 0) return;
    collectTackleContacts(a, dt);
    const scrimmage = !matchState.specialState;
    let combinedGrip = 0,
      engaged = 0,
      totalBrake = 0,
      contacts = [];
    for (const [key, t] of [...matchState.tackleLinks]) {
      const d = P(key);
      if (!d || d.tackleCooldown > 0) {
        matchState.tackleLinks.delete(key);
        continue;
      }
      const gap = dist(a, d),
        rad = radius(a) + radius(d);
      if (gap > rad + 1.07) {
        releaseTackle(d, a, "distance");
        continue;
      }
      t.age += dt;
      // Physically established square contact can hold both players face-to-face;
      // the renderer reads this posture. Does not force a tackle or a skill roll.
      if (t.square > 0.42 && t.grip > 0.3) {
        const brace = t.square * clamp((t.grip - 0.22) / 0.55, 0, 1);
        a.standContact = Math.max(a.standContact || 0, brace);
        d.standContact = Math.max(d.standContact || 0, brace);
      }
      const anatomy = ChaosContactOutcomes.evaluate(a, d, t);
      t.anatomyKind = anatomy.kind;
      const hit = tackleLeverage(a, d);
      const escape =
        a.TRK * 0.53 +
        a.STR * 0.24 +
        a.AGI * 0.15 +
        a.AWR * 0.08 -
        (d.TAK * 0.57 + d.STR * 0.19 + d.AWR * 0.15 + d.HIT * 0.09);
      const drive = speed(a) / Math.max(1, maxSpeed(a));
      // Recalculate contact quality as the hold develops. A poor initial hit
      // cannot instantly become a perfect grip; legitimate improved placement can
      // gradually strengthen it. This is independent of the tackle result.
      const observedQuality = ChaosGripAttachment.contactQuality(
        anatomy,
        d,
        hit,
        t.style,
      );
      t.quality = clamp(
        (t.quality ?? observedQuality) +
          clamp(
            observedQuality - (t.quality ?? observedQuality),
            -dt * 0.85,
            dt * 0.85,
          ),
        0.18,
        1.25,
      );
      const gripRate = clamp(
        (1.83 +
          hit.advantage * 0.027 -
          escape * 0.012 -
          drive * 0.11 +
          (t.style === "hit" ? 0.12 : 0)) *
          (0.68 + 0.32 * t.quality),
        0.32,
        3.45,
      );
      // Maintaining a wrap is a skill, not just a timer. Poor tacklers cannot
      // build an unbreakable grip on an elite runner without help or clean leverage.
      const security =
        clamp(
          1.15 +
            (d.TAK - a.TRK) * 0.009 +
            (d.STR - a.STR) * 0.003 +
            hit.advantage * 0.004 +
            Math.max(0, hit.closing - 2) * 0.026 +
            (speed(a) < 2 ? 0.2 : 0) +
            (a.balance < 0.65 ? 0.16 : 0),
          0.45,
          1.6,
        ) * clamp(0.78 + 0.22 * t.quality, 0.6, 1.2);
      t.grip = clamp(t.grip + dt * gripRate, 0, security);
      // Linked players resist separation through a damped, bounded force rather
      // than teleporting into a tackle pose. This runs only after real contact.
      t.attachment = ChaosGripAttachment.step(
        a,
        d,
        t,
        dt,
        radius(a),
        radius(d),
      );
      // A sustained leg-drive/hold contest can shed a weak tackle or, with more
      // effort, work out of a secure wrap. Grip and contact still have to exist.
      // This never declares a winner merely because an animation played.
      const escapeContest = ChaosTackleEscape.step(
        a, d, t, dt, scrimmage ? matchState.brokenTackleCount : 0,
      );
      t.escapeDiagnostics = escapeContest;
      const visualStrain = ChaosEscapeReactions.strain(a, d, t, escapeContest);
      a.tackleStrain = Math.max(a.tackleStrain || 0, visualStrain.runnerStrain);
      d.tackleStrain = Math.max(
        d.tackleStrain || 0,
        visualStrain.defenderStrain,
      );
      if (escapeContest.broken) {
        releaseTackle(d, a, "escape", escapeContest);
        continue;
      }
      const contribution = clamp(t.grip, 0.06, 1.6);
      engaged++;
      combinedGrip += contribution;
      totalBrake += clamp(
        0.3 + contribution * 1.23 + (mass(d) / mass(a)) * 0.37,
        0.35,
        2.45,
      );
      contacts.push({ t, d, hit });
      d.intent = "wrap";
      d.intentTarget = a.key;
      d.pulse = Math.max(0.12, d.pulse);
      const dMass = mass(d),
        aMass = mass(a);
      const blend = clamp(dt * (0.43 + contribution * 0.82), 0, 0.12);
      d.vx += ((a.vx - d.vx) * blend * aMass) / (aMass + dMass);
      d.vy += ((a.vy - d.vy) * blend * aMass) / (aMass + dMass);
      // A low grip ceiling is NOT an automatic broken tackle. The old rule
      // released weak-grip wraps after ~0.7 seconds regardless of whether the
      // defender had caught the runner, producing endless chase/bend/recover loops.
      // True escapes require superior runner power or a genuinely insecure grip.
      const runnerEdge =
        a.TRK * 0.54 +
        a.STR * 0.24 +
        a.AGI * 0.22 -
        (d.TAK * 0.59 + d.STR * 0.23 + d.AWR * 0.18);
      const outrunningGrip = speed(a) > 3.3 && t.grip < 0.44 && t.age > 0.68;
      const physicallyEscaping =
        runnerEdge > 14 && security < 0.94 && t.age > 0.9 && t.grip < 0.76;
      // A runner can pull free of a stretched weak grip; a strong wrap pulls the
      // defender along and can produce extra forward yards before resolution.
      const stretchedLoose =
        t.attachment?.reason === "overextended" &&
        t.grip < 0.68 &&
        t.age > 0.28;
      const legacyEscape = !scrimmage && (outrunningGrip || physicallyEscaping);
      if (legacyEscape || stretchedLoose) {
        releaseTackle(d, a, scrimmage ? "distance" : "escape", t.escapeDiagnostics);
        contacts.pop();
        engaged--;
        combinedGrip -= contribution;
        totalBrake -= clamp(
          0.3 + contribution * 1.23 + (mass(d) / mass(a)) * 0.37,
          0.35,
          2.45,
        );
      }
    }
    if (!engaged) {
      matchState.pileState = null;
      return;
    }
    const inertia = clamp(mass(a) / 97, 0.68, 1.55);
    const struggle = ChaosTackleStruggle.state(a, contacts, a.vx);
    const brake = clamp(
      (totalBrake / inertia) * 0.92 * struggle.brakeMultiplier,
      0.2,
      6.15,
    );
    a.vx *= Math.max(0, 1 - brake * dt);
    a.vy *= Math.max(0, 1 - brake * dt);
    // A clean high-rating solo tackle doesn't require an almost-stopped carrier.
    const winners = contacts.filter(({ d, t, hit }) => {
      const skill = d.TAK * 0.59 + d.AWR * 0.16 + d.STR * 0.16 + d.HIT * 0.09;
      const survive = a.TRK * 0.54 + a.STR * 0.22 + a.AGI * 0.17 + a.AWR * 0.07;
      const edge = skill - survive + hit.advantage * 0.24;
      const cleanWrap = scrimmage && t.style === "wrap" && t.quality >= 0.72;
      const gripNeed = clamp(
        (cleanWrap ? 0.89 : 0.92) - edge * 0.008 + (speed(a) > 5 ? 0.06 : 0),
        0.63,
        1.36,
      );
      // Allow a visible, short carry/drag interval before a solo tackle finishes.
      // This does not change rating advantage or make every grasp succeed.
      const earlier = ChaosSquareContact.settleAge(
        t.square || 0,
        t.grip,
        t.quality,
        a.balance,
        a.action?.kind,
      );
      const ageNeed = clamp(
        (cleanWrap ? 0.59 : 0.64) -
          edge * 0.002 +
          (speed(a) > 5 ? 0.025 : 0) +
          struggle.finishDelay -
          earlier,
        0.34,
        1.34,
      );
      return t.grip >= gripNeed && t.age >= ageNeed;
    });
    // A fully established textbook wrap has controlled the runner for several
    // frames, with real body-region contact. It is an earned finish, not a magic
    // tackle on the first frame of overlap or a light brush.
    const textbook = contacts.find(
      ({ t }) =>
        t.age >= 0.54 &&
        t.anatomyKind === "guaranteed tackle" &&
        a.balance < 0.67,
    );
    if (textbook) {
      finishTackle(a, contacts, "Textbook secured wrap");
      return;
    }
    // A stumble leaves the ball live. An attached, close defender can finish
    // sooner when the runner is still trying to regain a planted base.
    if (scrimmage && a.stumbleTime > 0 && a.balance < 0.84 &&
        contacts.some(({ t, d }) =>
          t.age >= 0.23 && t.grip >= 0.58 && t.quality >= 0.63 &&
          dist(a, d) <= radius(a) + radius(d) + 0.28)) {
      finishTackle(a, contacts, "Wrapped while stumbling");
      return;
    }
    const oldest = Math.max(...contacts.map((c) => c.t.age));
    // Rear-angle drag: once a pursuing defender gets hands onto a runner and
    // maintains a secure grip, forward momentum should not endlessly tow him.
    // A clean tackle break is handled above and puts the failed tackler down.
    const rearDrag = contacts.find(
      ({ t, d }) =>
        t.style === "wrap" &&
        (t.square || 0) < 0.42 &&
        t.age >= 0.78 + struggle.finishDelay * 0.65 &&
        t.grip >= 0.65 &&
        d.x < a.x - 0.08 &&
        Math.abs(d.y - a.y) < radius(a) + radius(d) + 0.45 &&
        dist(d, a) < radius(a) + radius(d) + 0.75,
    );
    if (rearDrag) {
      rearDrag.d.technique = "drag-tackle";
      a.lean = clamp(a.lean - 0.32, -0.56, 0.56);
      finishTackle(a, contacts, "Drag-down tackle");
      return;
    }
    // A secured wrap on a returner must eventually complete. The ordinary
    // ratings threshold can otherwise stay above a lone tackler's grip ceiling
    // forever, letting an exhausted runner be pushed downfield without a whistle.
    // Escapes still happen through the existing grip-break/leverage rules.
    if (
      matchState.specialState?.returning &&
      contacts.some(
        ({ t }) => t.age > 1.1 + struggle.finishDelay && t.grip > 0.68,
      ) &&
      (speed(a) < 3.6 || a.stam < 0.12 || engaged >= 2)
    ) {
      finishTackle(a, contacts, "Secured return tackle");
      return;
    }
    // Each additional defender adds grip and makes a standing runner less likely.
    const groupReady =
      engaged >= 2 &&
      oldest > 0.17 &&
      combinedGrip > clamp(1.06 - (engaged - 2) * 0.2, 0.52, 1.06);
    if (matchState.pileState?.active) {
      // Three-plus secured defenders defeat a small unsupported pile quickly.
      if (
        engaged >= 3 &&
        matchState.pileState.age > 0.4 &&
        matchState.pileState.pushers.length < engaged - 1
      ) {
        finishTackle(a, contacts, "Gang tackle");
        return;
      }
      maintainPile(a, engaged, combinedGrip, dt);
      return;
    }
    if (groupReady) {
      const nearbyPushers = matchState.off.some(
        (p) => p !== a && p.pos !== "QB" && dist(p, a) < 5.2 && p.x < a.x + 1,
      );
      const runnerUpright =
        a.balance > 0.63 && (speed(a) > 1.2 || a.TRK >= 87) && engaged <= 2;
      const canScrum = runnerUpright && nearbyPushers;
      if (canScrum) {
        matchState.pileState = {
          active: true,
          carrier: a.key,
          startX: a.x,
          lastX: a.x,
          maxX: a.x,
          age: 0,
          stalled: 0,
          loose: 0,
          pushers: [],
          wrappers: contacts.map((c) => c.d.key),
        };
        matchState.pileStarts++;
        log("STANDING PILE · teammates can push");
        return;
      }
      finishTackle(a, contacts, "Gang tackle");
      return;
    }
    if (winners.length) {
      finishTackle(a, contacts, "Open-field tackle");
      return;
    }
  }

  return {
    bind(services) {
      ({
        collectTackleContacts,
        P,
        finishTackle,
        log,
        maintainPile,
        mass,
        matchState,
        maxSpeed,
        radius,
        releaseTackle,
        speed,
        tackleLeverage,
      } = services);
    },
    resolveTackles,
  };
}
