import {
  indirectContactActive,
  recordDefenderDrive,
  resolveTeammateImpact,
} from "./indirect_contact.js";
import { clamp } from "../core/math.js";
import { ChaosTackleIntelligence } from "../ai/tackle_intelligence.js";
import { ChaosBodyConstraint } from "../physics/body_constraint.js";
import { ChaosContactOutcomes } from "../physics/contact_outcomes.js";
import { ChaosLowContact } from "../physics/low_contact.js";
import { ChaosSquareContact } from "../physics/square_contact.js";

export function createBodyCollision() {
  let YARD_M, finish, groundContact, log, mass, matchState, radius;

  function bodyCoupling(a, b, pass) {
    // A real airborne foot clearance may pass over a *low* obstacle; upright
    // defenders still collide. A jump never creates a global collision shield.
    if (
      (ChaosLowContact.clearance(a, b) || ChaosLowContact.clearance(b, a)) &&
      !(a.ground && b.ground)
    )
      return false;
    let dx = b.x - a.x,
      dy = b.y - a.y,
      sep = Math.hypot(dx, dy),
      ra = radius(a) * (a.ground ? 0.65 : 1),
      rb = radius(b) * (b.ground ? 0.65 : 1);
    const engaged =
      !!matchState.ballCarrier &&
      ((a === matchState.ballCarrier && matchState.tackleLinks.has(b.key)) ||
        (b === matchState.ballCarrier && matchState.tackleLinks.has(a.key)));
    let minSep = ChaosBodyConstraint.minimumSeparation(ra, rb, engaged);
    const broadSep = minSep;
    // Non-gripped carrier/defender pad collisions were being held farther apart
    // than the anatomical torso/arm capsules could actually meet. That generated
    // pushing impulses while repeatedly denying any real tackle contact.
    // Permit a small shoulder/hip engagement depth; no grip is awarded here.
    if (
      !engaged &&
      matchState.ballCarrier &&
      !a.ground &&
      !b.ground &&
      a.team !== b.team &&
      (a === matchState.ballCarrier || b === matchState.ballCarrier)
    )
      minSep = Math.max(0.3, minSep - 0.17);
    const meshRoutePair =
      matchState.selectedPlay === "mesh" &&
      a.team === 0 &&
      b.team === 0 &&
      !!a.route &&
      !!b.route;
    // Crossing teammates give one another shoulder room instead of fully
    // contacting pad-to-pad. They can still be jostled, but not pancake each other.
    if (meshRoutePair) minSep += 0.32;
    if (sep > broadSep + 0.018) return false;
    if (sep < 0.0001) {
      dx = a.key < b.key ? 1 : -1;
      dy = 0.003;
      sep = Math.hypot(dx, dy);
    }
    const nx = dx / sep,
      ny = dy / sep,
      ma = mass(a),
      mb = mass(b),
      invA = 1 / ma,
      invB = 1 / mb;
    if (
      matchState.phase === "live" &&
      a.team !== b.team &&
      matchState.ballCarrier?.ground?.kind === "indirect-contact" &&
      (a === matchState.ballCarrier || b === matchState.ballCarrier)
    ) {
      const runner = matchState.ballCarrier;
      const defender = runner === a ? b : a;
      const contact = ChaosContactOutcomes.evaluate(runner, defender);
      if (contact.bodyContact && contact.penetration >= 0.065) {
        finish(
          "tackle",
          runner.x,
          runner.name + " touched down by " + defender.pos,
        );
        return true;
      }
    }
    if (pass === 0 && a.team !== b.team) {
      // Physics contact happens first. A committed hit may strike ANY opponent:
      // receiver, blocker, lineman, or carrier. No targeted magnetism/pancake.
      for (const [attacker, victim, sign] of [
        [a, b, 1],
        [b, a, -1],
      ]) {
        const act = attacker.action;
        if (!act || act.kind !== "hit-stick" || act.time <= 0 || act.used)
          continue;
        const dir = act.direction || {
          x: Math.cos(attacker.face || 0),
          y: Math.sin(attacker.face || 0),
        };
        const aim = dir.x * nx * sign + dir.y * ny * sign;
        const normal = Math.max(
          0,
          (attacker.vx - victim.vx) * nx * sign +
            (attacker.vy - victim.vy) * ny * sign,
        );
        if (aim < 0.16 || normal < 0.1) continue;
        const impulse = ChaosTackleIntelligence.impact(
          attacker,
          victim,
          normal,
        );
        act.used = true;
        act.impactContactKey = victim.key;
        if (
          victim !== matchState.ballCarrier &&
          !(
            victim.key === "QB" &&
            !matchState.ballCarrier &&
            !matchState.passThrown
          )
        ) {
          victim.vx += (dir.x * impulse.strength * mass(attacker)) / (ma + mb);
          victim.vy += (dir.y * impulse.strength * mass(attacker)) / (ma + mb);
          victim.balance = clamp(
            victim.balance - impulse.strength * 0.085,
            0.2,
            1,
          );
          victim.impact = Math.max(victim.impact, 0.35 * impulse.power);
          attacker.vx -= dir.x * impulse.strength * 0.23;
          attacker.vy -= dir.y * impulse.strength * 0.23;
          log(
            attacker.pos +
              " POWER CONTACT with " +
              victim.pos +
              " · no automatic pancake",
          );
        }
      }
    }
    // Capture legitimate anatomical contact *before* four positional correction
    // passes can erase it from the post-solver tackle sample. Read-only evidence;
    // the tackle solver still checks eligibility, cooldown, and grip progression.
    if (
      pass === 0 &&
      matchState.ballCarrier &&
      a.team !== b.team &&
      !a.ground &&
      !b.ground &&
      (a === matchState.ballCarrier || b === matchState.ballCarrier)
    ) {
      const runner = a === matchState.ballCarrier ? a : b,
        defender = runner === a ? b : a;
      const body = ChaosContactOutcomes.evaluate(runner, defender);
      if (body.bodyContact && body.penetration >= 0.095) {
        const old = matchState.liveTackleContacts.get(defender.key);
        if (!old || body.penetration > old.penetration)
          matchState.liveTackleContacts.set(defender.key, body);
      }
    }
    const penetration = Math.max(0, minSep - sep);
    // Classify from incoming momentum BEFORE collision impulses. Body contact
    // records a short-lived physical event; animation merely reads it later.
    const candidate =
      !a.ground &&
      !b.ground &&
      a.team !== b.team &&
      matchState.ballCarrier &&
      (a === matchState.ballCarrier || b === matchState.ballCarrier)
        ? ChaosSquareContact.classify(a, b, nx, ny)
        : null;
    if (candidate?.square > 0.32 && pass === 0) {
      const runner = a === matchState.ballCarrier ? a : b,
        defender = runner === a ? b : a;
      const previous = defender.squareImpact;
      if (
        !previous ||
        previous.time < matchState.playClock - 0.05 ||
        candidate.square > previous.score
      ) {
        defender.squareImpact = {
          carrier: runner.key,
          score: candidate.square,
          time: matchState.playClock,
        };
      }
      // Impact posture persists only during real contact and is not a tackle award.
      runner.standContact = Math.max(
        runner.standContact || 0,
        candidate.square * 0.75,
      );
      defender.standContact = Math.max(
        defender.standContact || 0,
        candidate.square * 0.75,
      );
    }
    if (penetration > 0) {
      const correction = meshRoutePair
        ? Math.min(0.22, penetration * 0.88)
        : ChaosBodyConstraint.correction(a, b, penetration, engaged); // bounded core separation
      a.x -= (nx * correction * invA) / (invA + invB);
      a.y -= (ny * correction * invA) / (invA + invB);
      b.x += (nx * correction * invB) / (invA + invB);
      b.y += (ny * correction * invB) / (invA + invB);
    }
    const relX = b.vx - a.vx,
      relY = b.vy - a.vy,
      closing = relX * nx + relY * ny;
    if (closing >= -0.025) return penetration > 0;
    const tracksDrive = indirectContactActive(matchState);
    const approachA = tracksDrive ? a.vx * nx + a.vy * ny : 0;
    const approachB = tracksDrive ? -b.vx * nx - b.vy * ny : 0;
    const normalSpeed = -closing,
      slide = relX * -ny + relY * nx;
    const restitution =
      normalSpeed < 1.0 ? 0.02 : clamp(0.06 + 0.008 * normalSpeed, 0.06, 0.16);
    // kg·yd/s impulse. Convert to N·s (kg·m/s) for HUD.
    const J = (-(1 + restitution) * closing) / (invA + invB);
    a.vx -= J * invA * nx;
    a.vy -= J * invA * ny;
    b.vx += J * invB * nx;
    b.vy += J * invB * ny;
    // Friction + asymmetrical shoulder/hip contact transfers a little sideways
    // velocity and creates a visible loss of balance rather than skating bodies.
    // Opposing square pads create strong lateral friction: avoid sliding past
    // each other. Glancing contacts retain their previous freer response.
    const lateralScale = candidate?.square > 0.5 ? 0.42 : 0.19;
    const jt = clamp(
      -slide / (invA + invB),
      -J * lateralScale,
      J * lateralScale,
    );
    a.vx -= jt * invA * -ny;
    a.vy -= jt * invA * nx;
    b.vx += jt * invB * -ny;
    b.vy += jt * invB * nx;
    const hit = J * YARD_M;
    if (tracksDrive) {
      if (a.team !== b.team) {
        if (a.team === 1 && approachA >= 0.35) {
          recordDefenderDrive(matchState, b, a, nx * hit, ny * hit);
        } else if (b.team === 1 && approachB >= 0.35) {
          recordDefenderDrive(matchState, a, b, -nx * hit, -ny * hit);
        }
      } else if (a.team === 0) {
        resolveTeammateImpact(
          matchState,
          a,
          b,
          nx,
          ny,
          approachA,
          normalSpeed,
          hit,
          mb,
        );
        resolveTeammateImpact(
          matchState,
          b,
          a,
          -nx,
          -ny,
          approachB,
          normalSpeed,
          hit,
          ma,
        );
      }
    }
    if (
      matchState.carrierCollisionDiagnostics &&
      (a === matchState.ballCarrier || b === matchState.ballCarrier)
    ) {
      matchState.carrierCollisionDiagnostics.push({
        pair: [a.key, b.key],
        pass,
        normalNs: hit,
        tangentNs: jt * YARD_M,
      });
    }
    // Only the first contact iteration can generate a new down event. The repeated
    // solver passes still handle momentum transfer and prevent overlapping bodies.
    // Receivers on the same Mesh concept should avoid contact rather than
    // knock one another out of a route. Keep collision separation/impulses;
    // suppress only accidental *teammate knockdowns* from their crossing.
    if (pass === 0 && !meshRoutePair && !a.ground && !b.ground && hit > 240) {
      // A charging player who delivers the collision should not be knocked down
      // as often as the stationary or retreating player who absorbs it. Equal
      // head-on impacts can still knock both down depending on their ratings.
      const closingA = Math.max(0, a.vx * nx + a.vy * ny);
      const closingB = Math.max(0, -b.vx * nx - b.vy * ny);
      if (closingA > closingB * 1.28)
        groundContact(
          b,
          a,
          hit * ChaosLowContact.bodyVulnerability(b),
          normalSpeed,
          nx,
          ny,
          "body",
        );
      else if (closingB > closingA * 1.28)
        groundContact(
          a,
          b,
          hit * ChaosLowContact.bodyVulnerability(a),
          normalSpeed,
          -nx,
          -ny,
          "body",
        );
      else {
        groundContact(
          a,
          b,
          hit * ChaosLowContact.bodyVulnerability(a),
          normalSpeed,
          -nx,
          -ny,
          "body",
        );
        groundContact(
          b,
          a,
          hit * ChaosLowContact.bodyVulnerability(b),
          normalSpeed,
          nx,
          ny,
          "body",
        );
      }
    }
    if (hit > 13) {
      matchState.chainHits++;
      matchState.lastContact = Math.round(hit);
      const sideA = Math.sin(a.face) * nx - Math.cos(a.face) * ny;
      const sideB = -Math.sin(b.face) * nx + Math.cos(b.face) * ny;
      const angularA = clamp(
        ((slide * 0.09 + sideA * normalSpeed * 0.13) * J) / ma,
        -1.9,
        1.9,
      );
      const angularB = clamp(
        ((slide * 0.09 - sideB * normalSpeed * 0.13) * J) / mb,
        -1.9,
        1.9,
      );
      a.spin = clamp(a.spin - angularA, -3, 3);
      b.spin = clamp(b.spin + angularB, -3, 3);
      a.lean = clamp(a.lean + angularA * 0.18, -0.56, 0.56);
      b.lean = clamp(b.lean + angularB * 0.18, -0.56, 0.56);
      a.balance = clamp(
        a.balance - (hit * ChaosLowContact.bodyVulnerability(a)) / (ma * 35),
        0.2,
        1,
      );
      b.balance = clamp(
        b.balance - (hit * ChaosLowContact.bodyVulnerability(b)) / (mb * 35),
        0.2,
        1,
      );
      a.impact = Math.max(a.impact, clamp(hit / 700, 0.1, 0.8));
      b.impact = Math.max(b.impact, clamp(hit / 700, 0.1, 0.8));
      a.pulse = Math.max(a.pulse, 0.16);
      b.pulse = Math.max(b.pulse, 0.16);
    }
    return true;
  }

  function resolveBodyContacts() {
    // Four Gauss-Seidel contact passes transfer impulses down chains: A→B→C.
    // Rotating iteration order prevents all outcomes depending on roster order.
    for (let pass = 0; pass < 4; pass++) {
      const forward = pass % 2 === 0;
      for (let ii = 0; ii < matchState.players.length; ii++) {
        const i = forward ? ii : matchState.players.length - 1 - ii;
        for (let jj = 0; jj < matchState.players.length; jj++) {
          const j = forward ? jj : matchState.players.length - 1 - jj;
          if (i >= j) continue;
          bodyCoupling(matchState.players[i], matchState.players[j], pass);
        }
      }
    }
  }

  return {
    bind(services) {
      ({ YARD_M, finish, groundContact, log, mass, matchState, radius } =
        services);
    },
    resolveBodyContacts,
  };
}
