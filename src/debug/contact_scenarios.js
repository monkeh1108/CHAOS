import { clamp } from "../core/math.js";
import { AnatomyHitboxes } from "../physics/anatomy_hitboxes.js";
import { ChaosDiveCollision } from "../physics/dive_collision.js";

export function createContactScenarios({
  ChaosContactEvidence,
  P,
  blockBattle,
  groundContact,
  log,
  matchState,
  radius,
  resolveBodyContacts,
  resolveTackles,
}) {
  return {
    debugForceCarrier: (key) => {
      if (matchState.phase !== "live") return false;
      const p = P(key);
      if (!p || p.team !== 0) return false;
      matchState.tackleLinks.clear();
      matchState.pileState = null;
      matchState.ballCarrier = p;
      matchState.active = p;
      matchState.passThrown = true;
      return true;
    },
    debugMissTackle: (key) => {
      if (matchState.phase !== "live" || !matchState.ballCarrier) return false;
      const d = P(key),
        a = matchState.ballCarrier;
      if (!d || d.team !== 1) return false;
      d.x = a.x + radius(a) + radius(d) + 0.05;
      d.y = a.y;
      d.vx = 0;
      d.vy = 0;
      d.stun = 0;
      a.shield = 0;
      d.intent = "recover";
      d.intentTarget = a.key;
      d.stun = 0.55 + (a.TRK / 99) * 0.55;
      d.shield = 0.2;
      a.shield = 0.68;
      d.contactCount++;
      a.contactCount++;
      log(a.name + " breaks " + d.pos + " tackle (test scenario)");
      return true;
    },
    debugMovePlayer: (key, x, y) => {
      const p = P(key);
      if (!p) return false;
      p.x = x;
      p.y = y;
      p.vx = 0;
      p.vy = 0;
      return true;
    },
    debugSetVelocity: (key, vx, vy) => {
      const p = P(key);
      if (!p) return false;
      p.vx = vx;
      p.vy = vy;
      return true;
    },
    debugSetStamina: (key, value) => {
      const p = P(key);
      if (!p) return false;
      p.stam = clamp(value, 0, 1);
      return true;
    },
    debugSetBalance: (key, value) => {
      const p = P(key);
      if (!p) return false;
      p.balance = clamp(value, 0.1, 1);
      return true;
    },
    debugSetDefenderState: (key, changes) => {
      const d = P(key);
      if (!d || d.team !== 1) return false;
      for (const k of [
        "face",
        "blocked",
        "shedCooldown",
        "tackleCooldown",
        "stun",
        "diveRecovery",
        "readAt",
      ])
        if (Number.isFinite(changes[k])) d[k] = changes[k];
      if (changes.action === null) d.action = null;
      return true;
    },
    debugGroundContact: (
      victim,
      attacker,
      impulse,
      speed = 6,
      nx = 1,
      ny = 0,
    ) => {
      const v = P(victim),
        a = P(attacker);
      return v && a ? groundContact(v, a, impulse, speed, nx, ny) : false;
    },
    debugSetContactEnabled: (enabled) => {
      matchState.contactEnabled = !!enabled;
      if (!matchState.contactEnabled) matchState.tackleLinks.clear();
    },
    debugResolveTackle: (n = 1) => {
      if (matchState.phase !== "live" || !matchState.ballCarrier) return false;
      for (let i = 0; i < n && matchState.phase === "live"; i++)
        resolveTackles(matchState.ballCarrier, 1 / 60);
      return true;
    },
    debugBlockPair: (offense, defense) => {
      if (matchState.phase !== "live") return false;
      const o = P(offense),
        d = P(defense);
      if (!o || !d || o.team !== 0 || d.team !== 1) return false;
      blockBattle(o, d, 1 / 60);
      return matchState.blockLinks.has(offense);
    },
    debugAnatomy: (key) => {
      const p = P(key);
      return p
        ? AnatomyHitboxes.sample(p, { presnap: matchState.phase === "presnap" })
        : null;
    },
    debugAnatomyPair: (one, two) => {
      const a = P(one),
        b = P(two);
      return a && b
        ? AnatomyHitboxes.contacts(
            AnatomyHitboxes.sample(a),
            AnatomyHitboxes.sample(b),
          )
        : null;
    },
    debugBodyContacts: (n = 1) => {
      for (let i = 0; i < n; i++) resolveBodyContacts();
      return true;
    },
    debugSetupLowDive: (
      runner = "RB",
      defender = "MLB",
      approach = "front",
    ) => {
      if (matchState.phase !== "live") return false;
      const a = P(runner),
        d = P(defender);
      if (!a || !d || a.team !== 0 || d.team !== 1) return false;
      for (const p of matchState.players) {
        if (p !== a && p !== d) {
          p.x = p.team === 0 ? 18 : 108;
          p.y = (p.key.charCodeAt(0) % 42) + 5;
          p.vx = 0;
          p.vy = 0;
        }
      }
      matchState.ballCarrier = a;
      matchState.active = a;
      matchState.passThrown = true;
      matchState.tackleLinks.clear();
      matchState.pileState = null;
      a.x = 75;
      a.y = 26;
      a.vx = 1.4;
      a.vy = 0;
      a.face = 0;
      a.ground = null;
      a.balance = 1;
      const angles = {
        front: Math.PI,
        side: Math.PI / 2,
        diagonal: (Math.PI * 3) / 4,
        miss: Math.PI / 2,
      };
      const angle = angles[approach] ?? Math.PI;
      const lateral = approach === "miss" ? 3.2 : 0;
      d.x = a.x + Math.cos(angle) * 1.6;
      d.y = a.y + Math.sin(angle) * 1.6 + lateral;
      d.face = Math.atan2(a.y - d.y, a.x - d.x);
      d.vx = Math.cos(d.face) * 8;
      d.vy = Math.sin(d.face) * 8;
      d.ground = null;
      d.stun = 0;
      d.tackleCooldown = 0;
      d.blocked = 0;
      d.lowDiveImpactAt = -999;
      d.action = { kind: "tackle-dive", time: 0.43, age: 0.1, used: false };
      ChaosContactEvidence.reset();
      matchState.lowDiveContacts = 0;
      matchState.lastLowDiveImpact = null;
      return true;
    },
    debugDiveCollision: (
      runner = "RB",
      defender = "MLB",
      runnerPrev = null,
      defPrev = null,
    ) => {
      const a = P(runner),
        d = P(defender);
      if (!a || !d) return null;
      const oldA = runnerPrev || ChaosContactEvidence.poseCopy(a),
        oldD = defPrev || ChaosContactEvidence.poseCopy(d);
      return ChaosDiveCollision.evaluate(oldA, a, oldD, d);
    },
    debugLowContact: () => ({
      footContacts: matchState.footContacts,
      lastFootContact: matchState.lastFootContact,
      carrierAir: matchState.ballCarrier?.airState || null,
    }),
    debugFootScenario: (runner = "RB", defender = "MLB", kind = "dive") => {
      const r = P(runner),
        d = P(defender);
      if (!r || !d) return false;
      for (const p of matchState.players)
        if (p !== r && p !== d) {
          p.x = p.team === 0 ? 18 : 106;
          p.y = 2 + (p.key.charCodeAt(0) % 40);
        }
      matchState.ballCarrier = r;
      matchState.active = r;
      matchState.passThrown = true;
      matchState.specialState = null;
      matchState.tackleLinks.clear();
      r.x = 70;
      r.y = 26;
      r.vx = 5;
      r.vy = 0;
      r.face = 0;
      r.balance = 1;
      r.ground = null;
      r.airState = null;
      r.lowContactCooldown = 0;
      r.stumbleTime = 0;
      d.x = 71.45;
      d.y = 26;
      d.face = Math.PI;
      d.vx = -4;
      d.vy = 0;
      d.ground =
        kind === "ground"
          ? { stage: "winded", time: 1, rest: 1, rise: 0.3, age: 0 }
          : null;
      d.action =
        kind === "dive"
          ? { kind: "tackle-dive", time: 0.5, age: 0.14, used: false }
          : null;
      d.lowContactCooldown = 0;
      return true;
    },
  };
}
