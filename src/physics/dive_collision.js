import { clamp } from "../core/math.js";
import { AnatomyHitboxes } from "./anatomy_hitboxes.js";

// Physical low-dive contact, independent of tackle awards.
// Uses the existing shared pose/anatomy and a short swept trajectory.
const attackerRegions = new Set(["upperArm", "forearm", "hand", "torso"]);
const targetRegions = new Set(["thigh", "shin", "pelvis"]);
const nonHead = (h) => attackerRegions.has(h.b) && targetRegions.has(h.a);
const allLow = (h) =>
  (attackerRegions.has(h.b) || h.b === "helmet") && targetRegions.has(h.a);
function evaluate(carrierBefore, carrier, defBefore, defender) {
  const dive =
    defender.action?.kind === "tackle-dive" && defender.action?.time > 0;
  if (!dive) return { kind: "inactive", hit: false };
  const start = Math.hypot(
    carrierBefore.x - defBefore.x,
    carrierBefore.y - defBefore.y,
  );
  const end = Math.hypot(carrier.x - defender.x, carrier.y - defender.y);
  if (Math.min(start, end) > 3.1) return { kind: "clear", hit: false };
  const relativeTravel = Math.hypot(
    defender.x - defBefore.x - (carrier.x - carrierBefore.x),
    defender.y - defBefore.y - (carrier.y - carrierBefore.y),
  );
  const intervals = AnatomyHitboxes.sweptContacts(
    carrierBefore,
    carrier,
    defBefore,
    defender,
    Math.min(32, Math.max(6, Math.ceil(relativeTravel / 0.09))),
  );
  const contact = intervals.find((i) => i.hits.some(allLow));
  if (!contact) return { kind: "clear", hit: false };
  const low = contact.hits.filter(allLow);
  const wrapped = low.some(nonHead);
  const penetration = Math.max(...low.map((h) => h.penetration));
  return {
    kind: wrapped ? "limb-contact" : "body-only",
    hit: true,
    wrapCandidate: wrapped,
    fraction: contact.t,
    penetration,
    regions: low
      .slice(0, 5)
      .map((h) => ({ runner: h.a, defender: h.b, depth: h.penetration })),
    swept: contact.t < 0.999,
  };
}
function response(
  carrier,
  defender,
  carrierBefore,
  defBefore,
  info,
  dt,
  massCarrier,
  massDefender,
) {
  if (!info.hit) return info;
  // Mere fingertips/brushing capsule surfaces should not halt a runner.
  if (info.penetration < 0.045) return { ...info, physical: false };
  // Prevent the diving shoulder/torso advancing through the runner's legs.
  // On a swept hit, hold the defender at the entry point, allowing a tiny
  // numerical tolerance. Never teleport the runner or force a tackle award.
  if (info.swept) {
    const t = Math.max(0, info.fraction - 0.025);
    defender.x = defBefore.x + (defender.x - defBefore.x) * t;
    defender.y = defBefore.y + (defender.y - defBefore.y) * t;
  }
  const dx = carrier.x - defender.x,
    dy = carrier.y - defender.y;
  const len = Math.max(0.001, Math.hypot(dx, dy));
  const nx = dx / len,
    ny = dy / len;
  const closing = Math.max(
    0,
    (defender.vx - carrier.vx) * nx + (defender.vy - carrier.vy) * ny,
  );
  const significant = info.penetration >= 0.045;
  if (significant) {
    const m1 = Math.max(45, massCarrier),
      m2 = Math.max(45, massDefender);
    // Inelastic push with a capped normal impulse; no animation-set outcome.
    const impact = Math.min(2.9, closing * (info.wrapCandidate ? 0.67 : 0.52));
    carrier.vx += (nx * impact * m2) / (m1 + m2);
    carrier.vy += (ny * impact * m2) / (m1 + m2);
    defender.vx -= (nx * impact * m1) / (m1 + m2);
    defender.vy -= (ny * impact * m1) / (m1 + m2);
    if (closing > 0.85) {
      carrier.balance = clamp(
        (carrier.balance ?? 1) -
          Math.min(0.095, closing * 0.01) * (info.wrapCandidate ? 1 : 0.7),
        0.3,
        1,
      );
      carrier.impact = Math.max(
        carrier.impact || 0,
        Math.min(0.3, closing * 0.036),
      );
    }
  }
  // Reduce the diving player's forward velocity when significant low-body
  // contact exists, even if the later grip skill check fails.
  const along = defender.vx * nx + defender.vy * ny;
  if (significant && along > 0) {
    const reduce = along * (info.wrapCandidate ? 0.48 : 0.58);
    defender.vx -= nx * reduce;
    defender.vy -= ny * reduce;
  }
  return { ...info, closing, physical: significant };
}
export const ChaosDiveCollision = Object.freeze({ evaluate, response });
