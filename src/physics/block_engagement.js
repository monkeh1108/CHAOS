import { recordDefenderDrive } from "./indirect_contact.js";
import { clamp, distance2D as dist } from "../core/math.js";
import { BlockingPolicy } from "../ai/blocking_policy.js";
import { InsideZoneIQ } from "../ai/inside_zone_iq.js";

export function createBlockEngagement() {
  let P,
    RUNS,
    YARD_M,
    groundContact,
    mass,
    matchState,
    radius,
    rand,
    returnEscapeSide;

  // Contact is persistent. Winning a block takes position, hand placement,
  // leverage, mass and time; rushers can eventually shed a blocker.
  function blockBattle(o, d, dt) {
    if (
      !o ||
      !d ||
      o.ground ||
      d.ground ||
      o.team === d.team ||
      dist(o, d) > (matchState.specialState?.returning ? 2.15 : 1.95) ||
      d.shedCooldown > 0 ||
      matchState.tackleLinks.has(d.key) ||
      (matchState.specialState?.returning &&
        d.returnBypassBlocker === o.key &&
        d.returnBypassUntil > matchState.playClock)
    )
      return;
    let link = matchState.blockLinks.get(o.key);
    if (link && link.defender !== d.key) {
      // Do not teleport a block to a different opponent while still engaged.
      if (link.age < 0.52 && dist(o, P(link.defender)) < 2.25) return;
      matchState.blockLinks.delete(o.key);
      link = null;
    }
    if (!link) {
      link = {
        blocker: o.key,
        defender: d.key,
        age: 0,
        secured: 0,
        breakAt: 0,
        impactDone: false,
        powerUsed: false,
        mode: "approach",
      };
      matchState.blockLinks.set(o.key, link);
    }
    link.touched = true;
    o.pulse = Math.max(o.pulse, 0.12);
    d.pulse = Math.max(d.pulse, 0.12);
  }

  function resolveBlocks(dt) {
    for (const [key, e] of matchState.blockLinks) {
      const o = P(e.blocker),
        d = P(e.defender);
      if (
        !o ||
        !d ||
        o.ground ||
        d.ground ||
        dist(o, d) > 2.7 ||
        d.shedCooldown > 0
      ) {
        if (
          o &&
          d &&
          matchState.selectedPlay === "inside" &&
          o.insideZonePlan &&
          d.ground
        ) {
          // A pancake makes a teammate available, but finding his next target is
          // a visible read, not a remote animation snap or an instant 180-degree turn.
          o.beatenTarget = d.key;
          o.beatenUntil = matchState.playClock + 0.7;
          o.insideZoneReadAfter = Math.max(
            o.insideZoneReadAfter || 0,
            matchState.playClock + InsideZoneIQ.readDelay(o, rand()),
          );
        }
        if (matchState.specialState?.returning && d && o) {
          d.returnBypassBlocker = o.key;
          d.returnBypassUntil = matchState.playClock + 0.65;
          d.returnBypassSide = returnEscapeSide(d, o);
        }
        matchState.blockLinks.delete(key);
        continue;
      }
      // A clean technique block on an anchored 320lb lineman is different from
      // the same hands against a 180lb receiver.
      const scoreO =
        o.BLO * 0.44 +
        o.IBL * 0.18 +
        o.STR * 0.27 +
        o.AWR * 0.11 +
        (mass(o) - 105) * 0.06;
      const scoreD =
        d.STR * 0.34 +
        d.PMV * 0.34 +
        d.AGI * 0.17 +
        d.AWR * 0.15 +
        (mass(d) - 105) * 0.05;
      const helpers = [...matchState.blockLinks.values()].filter(
        (other) => other !== e && other.defender === d.key,
      ).length;
      const mismatch = scoreO - scoreD + Math.min(2, helpers) * 7;
      const powerEdge =
        d.PMV * 0.48 +
        d.STR * 0.33 +
        d.AWR * 0.19 -
        (o.IBL * 0.31 + o.BLO * 0.4 + o.STR * 0.29);
      e.age += dt;
      if (matchState.specialState?.returning) {
        const choice = BlockingPolicy.decideDefender(
          d,
          o,
          matchState.ballCarrier ? dist(d, matchState.ballCarrier) : 12,
        );
        e.decision = choice;
        // Agile undersized gunners may work around a much larger blocker
        // rather than continue a losing head-on fight indefinitely.
        if (choice === "maneuver" && e.age > 0.24 && e.secured < 0.74) {
          matchState.blockLinks.delete(key);
          d.shedCooldown = 0.28;
          d.blocked = 0;
          d.returnBypassBlocker = o.key;
          d.returnBypassUntil = matchState.playClock + 0.82;
          d.returnBypassSide = returnEscapeSide(d, o);
          d.intent = "return-bypass";
          d.intentTarget = matchState.ballCarrier?.key || "RB";
          continue;
        }
        // On returns the coverage player actively disengages, then goes *around*
        // the blocker. The ordinary pass-protection stay-engaged timer was making
        // all coverage men stop indefinitely and reattach to the same guy.
        const shedAt = clamp(
          0.75 +
            (o.BLO - d.PMV) * 0.009 +
            (o.STR - d.AGI) * 0.003 +
            Math.min(helpers, 2) * 0.2,
          0.35,
          1.48,
        );
        if (e.age >= shedAt) {
          matchState.blockLinks.delete(key);
          d.shedCooldown = 0.45;
          d.blocked = 0;
          d.returnBypassBlocker = o.key;
          d.returnBypassUntil =
            matchState.playClock + clamp(0.68 + d.AGI / 400, 0.72, 1.0);
          d.returnBypassSide = returnEscapeSide(d, o);
          o.beatenTarget = d.key;
          o.beatenUntil = matchState.playClock + 0.6;
          matchState.blockShedCount++;
          d.intent = "return-shed";
          d.intentTarget = matchState.ballCarrier?.key || "RB";
          continue;
        }
      }
      // A powerful, well-timed impact block transfers real velocity to the opponent.
      const dd0 = Math.max(0.01, dist(o, d)),
        ix = (d.x - o.x) / dd0,
        iy = (d.y - o.y) / dd0;
      const approach = Math.max(0, (o.vx - d.vx) * ix + (o.vy - d.vy) * iy);
      if (
        !e.impactDone &&
        (approach > 1.0 ||
          (o.action?.kind === "impact-block" && o.action.time > 0))
      ) {
        e.impactDone = true;
        const strike =
          clamp(
            (o.IBL * 0.54 + o.STR * 0.28 + o.BLO * 0.18 - 45) / 55,
            0.2,
            1.2,
          ) *
          clamp(approach / 4, 0.22, 1.4) *
          (o.action?.kind === "impact-block" ? 1.35 : 1);
        const delivered = clamp(approach * 0.3 * strike, 0, 2.4);
        d.vx += (ix * delivered * mass(o)) / (mass(o) + mass(d));
        d.vy += (iy * delivered * mass(o)) / (mass(o) + mass(d));
        o.vx -= (ix * delivered * mass(d)) / (mass(o) + mass(d));
        o.vy -= (iy * delivered * mass(d)) / (mass(o) + mass(d));
        d.balance = clamp(d.balance - 0.1 * strike, 0.3, 1);
        d.stun = Math.max(d.stun, 0.08 * strike);
        e.secured = clamp(e.secured + strike * 0.24, 0, 1);
        o.technique = "impact-block";
        o.pulse = 0.25;
        matchState.impactBlockCount++;
        groundContact(
          d,
          o,
          delivered * mass(d) * YARD_M * 2,
          approach,
          ix,
          iy,
          "impact-block",
        );
      }
      e.secured = clamp(e.secured + dt * (0.72 + mismatch * 0.0055), 0, 1);
      if (!e.breakAt) {
        e.breakAt = clamp(
          0.99 + mismatch * 0.016 - powerEdge * 0.012,
          0.34,
          2.55,
        );
      }
      // Power rushers actively drive the blocker backward and shorten engagement.
      if (d.PMV >= 69 && e.age > 0.12 && powerEdge > -17) {
        const drive =
          clamp((powerEdge + 24) * 0.018, 0.1, 0.95) *
          clamp(mass(d) / 117, 0.7, 1.4);
        const recoilX = ix * drive * dt * 3.5;
        const recoilY = iy * drive * dt * 3.5;
        o.vx -= recoilX;
        o.vy -= recoilY;
        recordDefenderDrive(
          matchState,
          o,
          d,
          -recoilX * mass(o) * YARD_M,
          -recoilY * mass(o) * YARD_M,
          true,
        );
        d.technique = "power-move";
        d.lean = clamp(d.lean + 0.05 * dt, -0.5, 0.5);
        if (!e.powerUsed) {
          e.powerUsed = true;
          matchState.powerMoveCount++;
        }
      }
      // A defender can shed once hand-fighting has lasted long enough. High
      // blocker skill increases the hold, high rusher skill shortens it.
      const nearRunLane =
        matchState.selectedPlay === "inside" &&
        matchState.ballCarrier &&
        o.insideZonePlan &&
        dist(d, matchState.ballCarrier) < 5.2;
      const earnedHold =
        nearRunLane && e.secured > 0.35
          ? clamp((e.secured - 0.35) * 0.72, 0, 0.36) *
            clamp((30 - powerEdge) / 28, 0.25, 1)
          : 0;
      if (e.age > e.breakAt + earnedHold && (mismatch < 25 || powerEdge > 16)) {
        matchState.blockLinks.delete(key);
        d.shedCooldown = clamp(0.35 + (d.AGI - 65) * 0.003, 0.3, 0.5);
        // Breaking hand contact takes a fraction of a second of balance recovery.
        // This is not a canned animation lock or an automatic missed tackle.
        d.blocked = Math.max(d.blocked, nearRunLane ? 0.44 : 0.22);
        d.tackleCooldown = Math.max(
          d.tackleCooldown,
          nearRunLane ? 0.12 : 0.06,
        );
        o.blockTarget = null;
        matchState.blockShedCount++;
        continue;
      }
      // Finish a clean win: the defender is controlled and moved outside his
      // pursuit lane. The lineman climbs to a linebacker/safety rather than idle.
      const a = matchState.ballCarrier || P("RB");
      const cleanWin =
        (RUNS.has(matchState.selectedPlay) ||
          (matchState.ballCarrier &&
            matchState.ballCarrier.x >= matchState.playStart)) &&
        e.age > 0.47 &&
        e.secured > 0.74 &&
        mismatch > 9 &&
        a &&
        (d.ground ||
          d.stun > 0.12 ||
          (d.x < a.x - 1.8 && dist(d, a) > 3.0) ||
          (Math.abs(d.y - a.y) > 4.5 && d.x < a.x + 2));
      if (cleanWin) {
        o.blockWins++;
        o.beatenTarget = d.key;
        o.beatenUntil = matchState.playClock + 1.25;
        d.beatenUntil = matchState.playClock + 0.7;
        d.blocked = Math.max(d.blocked, 0.63);
        o.blockTarget = null;
        o.supportTarget = null;
        matchState.blockLinks.delete(key);
        if (matchState.selectedPlay === "inside" && o.insideZonePlan) {
          o.insideZoneReadAfter =
            matchState.playClock + InsideZoneIQ.readDelay(o, rand());
        }
        o.intent = "climb-second-level";
        o.intentTarget = "next-threat";
        continue;
      }
      const dd = Math.max(0.01, dist(o, d)),
        nx = (d.x - o.x) / dd,
        ny = (d.y - o.y) / dd;
      // The block is a physical engagement: maintain separation and oppose
      // sideways slip as well as forward penetration. It never teleports players.
      const contact = BlockingPolicy.contact({
        blocker: o,
        defender: d,
        secured: e.secured,
        age: e.age,
        helpers,
        runner: matchState.ballCarrier || P("RB"),
      });
      e.mode = contact.state;
      const desired = clamp(radius(o) + radius(d) + 0.36, 1.28, 1.76);
      // Physically maintain shoulder-pad space while hands are engaged. The
      // small mass-weighted correction is capped per frame (never a teleport).
      if (dd < desired) {
        const separate = Math.min(0.105, (desired - dd) * 0.43);
        const sum = mass(o) + mass(d);
        o.x -= (nx * separate * mass(d)) / sum;
        o.y -= (ny * separate * mass(d)) / sum;
        d.x += (nx * separate * mass(o)) / sum;
        d.y += (ny * separate * mass(o)) / sum;
      }
      const distanceError = clamp(dd - desired, -0.4, 0.85);
      const normalRelative = (d.vx - o.vx) * nx + (d.vy - o.vy) * ny;
      const tangentX = -ny,
        tangentY = nx;
      const slip = (d.vx - o.vx) * tangentX + (d.vy - o.vy) * tangentY;
      const hold = contact.strength;
      const connected =
        clamp(distanceError * 3.0 + normalRelative * 0.32, -2.2, 2.2) *
        hold *
        dt;
      const slipBrake = clamp(slip * hold * dt * 0.95, -0.12, 0.12);
      // A soft spring + tangential friction makes hands-on blocking persistent,
      // while defenders can still win leverage and swim/rip around opponents.
      d.vx -= nx * connected * 0.52 + tangentX * slipBrake * 0.6;
      d.vy -= ny * connected * 0.52 + tangentY * slipBrake * 0.6;
      o.vx += nx * connected * 0.35 + tangentX * slipBrake * 0.33;
      o.vy += ny * connected * 0.35 + tangentY * slipBrake * 0.33;
      if (
        matchState.selectedPlay === "inside" &&
        o.insideZonePlan &&
        d.x >= o.x - 0.1 &&
        e.secured > 0.18
      ) {
        // Vertical displacement is earned by secured hands, coordinated helpers
        // and actual blocking strength. No scripted opening or teleportation.
        const push =
          clamp((contact.advantage + 5) / 34, 0, 1.0) *
          clamp((e.secured - 0.1) * 1.35, 0, 1) *
          (1 + Math.min(1, helpers) * 0.23);
        d.vx +=
          push * 2.35 * dt * clamp(mass(o) / Math.max(70, mass(d)), 0.65, 1.35);
        o.vx += push * 0.23 * dt;
        o.technique = helpers ? "double-team" : "zone-drive";
      }
      if (contact.state === "drive" || contact.state === "double-team") {
        const drive = clamp((contact.advantage - 5) * 0.028, 0.02, 0.65) * dt;
        d.vx += (nx * drive * mass(o)) / Math.max(100, mass(d));
        d.vy += (ny * drive * mass(o)) / Math.max(100, mass(d));
      }
      o.blockMode = e.mode;
      d.blockMode = e.mode;
      o.technique =
        e.mode === "drive"
          ? "drive-block"
          : e.mode === "seal"
            ? "seal-block"
            : e.mode === "double-team"
              ? "double-team"
              : "engaged-block";
      const force = clamp(0.45 + mismatch * 0.015 + e.secured * 0.72, 0.2, 1.9);
      // Braking force is relative to the rusher's movement *through* the block.
      const penetration = d.vx * nx + d.vy * ny;
      if (penetration > 0) {
        d.vx -= nx * penetration * clamp(force * dt, 0, 0.2);
        d.vy -= ny * penetration * clamp(force * dt, 0, 0.2);
      }
      const obstruct = clamp(
        0.25 + mismatch * 0.008 + e.secured * 0.4,
        0.12,
        0.95,
      );
      d.vx *= Math.max(0, 1 - obstruct * dt);
      d.vy *= Math.max(0, 1 - obstruct * dt);
      // Both partners take opposite small forces; bigger bodies are moved less.
      const impulse = clamp(mismatch * 0.025, -0.35, 1.1) * dt;
      d.vx += (nx * impulse * mass(o)) / mass(d);
      d.vy += (ny * impulse * mass(o)) / mass(d);
      o.vx -= nx * impulse * 0.28;
      o.vy -= ny * impulse * 0.28;
      d.blocked = Math.max(d.blocked, 0.18 + e.secured * 0.2);
      if (!matchState.tackleLinks.has(d.key)) {
        // Preserve the rush-lane decision for diagnostics and animation. Block
        // resolution must not erase a live QB-rollout pursuit choice.
        if (matchState.ballCarrier) d.intent = "pursue";
        else if (
          ![
            "edge-contain",
            "edge-crash",
            "pocket-escape",
            "blitz-close",
            "stunt",
            "inside-rush",
          ].includes(d.intent)
        )
          d.intent = "rush";
        d.intentTarget = matchState.ballCarrier?.key || "QB";
      }
    }
  }

  return {
    bind(services) {
      ({
        P,
        RUNS,
        YARD_M,
        groundContact,
        mass,
        matchState,
        radius,
        rand,
        returnEscapeSide,
      } = services);
    },
    blockBattle,
    resolveBlocks,
  };
}
