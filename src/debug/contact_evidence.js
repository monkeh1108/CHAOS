import { AnatomyHitboxes } from "../physics/anatomy_hitboxes.js";

// CHAOS v0.36.4e: original, dependency-free contact evidence system.
// Observe true body-region intersections; NEVER award tackles or change velocity.
const MAX = 160;
export function createContactEvidenceState() {
  return {
    enabled: true,
    fullScan: false,
    events: [],
    active: new Map(),
    last: [],
    tick: 0,
  };
}

export function createContactEvidence(state = createContactEvidenceState()) {
  const data = typeof state === "function" ? state : () => state;
  const poseCopy = (p) => ({
    key: p.key,
    pos: p.pos,
    team: p.team,
    h: p.h,
    w: p.w,
    x: p.x,
    y: p.y,
    vx: p.vx,
    vy: p.vy,
    face: p.face,
    action: p.action ? { ...p.action } : null,
    ground: p.ground ? { ...p.ground } : null,
    spin: p.spin,
    lean: p.lean,
    sprinting: p.sprinting,
    travel: p.travel,
  });
  function record(evt) {
    data().events.push(evt);
    if (data().events.length > MAX) data().events.shift();
  }
  const distanceSegmentSq = (p0, p1, q0, q1) => {
    const dx = p1.x - p0.x,
      dy = p1.y - p0.y,
      ex = q1.x - q0.x,
      ey = q1.y - q0.y;
    const rx = p0.x - q0.x,
      ry = p0.y - q0.y;
    const ax = dx - ex,
      ay = dy - ey,
      den = ax * ax + ay * ay;
    const t =
      den > 1e-12 ? Math.max(0, Math.min(1, -(rx * ax + ry * ay) / den)) : 0;
    return (rx + ax * t) ** 2 + (ry + ay * t) ** 2;
  };
  function scan(before, after, at, { all = false } = {}) {
    if (!data().enabled) return [];
    data().tick++;
    const previous = new Map(before.map((p) => [p.key, p]));
    const now = new Map(after.map((p) => [p.key, p]));
    const pairs = [];
    for (let i = 0; i < after.length; i++)
      for (let j = i + 1; j < after.length; j++) {
        const a = after[i],
          b = after[j];
        if (a.team === b.team) continue;
        // In normal play, save CPU time by observing imminent tackles only.
        // Debug mode watches blocks and all other possible contact pairs as well.
        if (
          !all &&
          !a.isCarrier &&
          !b.isCarrier &&
          a.action?.kind !== "tackle-dive" &&
          b.action?.kind !== "tackle-dive"
        )
          continue;
        const a0 = previous.get(a.key) || a,
          b0 = previous.get(b.key) || b;
        if (distanceSegmentSq(a0, a, b0, b) > 15.21) continue; // 3.9 yards swept broadphase
        const movement = Math.hypot(
          a.x - a0.x - b.x + b0.x,
          a.y - a0.y - b.y + b0.y,
        );
        const steps = Math.max(2, Math.min(24, Math.ceil(movement / 0.28)));
        const intervals = AnatomyHitboxes.sweptContacts(a0, a, b0, b, steps);
        if (intervals.length) {
          const first = intervals[0],
            strongest = intervals
              .flatMap((it) => it.hits)
              .sort((x, y) => y.penetration - x.penetration)[0];
          const key = a.key + "|" + b.key;
          const rvx = (a.vx || 0) - (b.vx || 0),
            rvy = (a.vy || 0) - (b.vy || 0);
          const evt = {
            time: +at.toFixed(3),
            pair: [a.key, b.key],
            regionA: strongest.a,
            regionB: strongest.b,
            sideA: strongest.aSide,
            sideB: strongest.bSide,
            penetration: +strongest.penetration.toFixed(3),
            relativeSpeed: +Math.hypot(rvx, rvy).toFixed(2),
            swept: !AnatomyHitboxes.contacts(
              AnatomyHitboxes.sample(a),
              AnatomyHitboxes.sample(b),
            ).length,
            timeFraction: +first.t.toFixed(3),
            kind: data().active.has(key) ? "ongoing" : "entry",
          };
          if (
            !data().active.has(key) ||
            at - data().active.get(key).lastAt > 0.22
          ) {
            record(evt);
            pairs.push(evt);
          }
          data().active.set(key, { lastAt: at });
        }
      }
    for (const [key, value] of data().active)
      if (at - value.lastAt > 0.18) data().active.delete(key);
    data().last = pairs;
    return pairs;
  }
  function reset() {
    data().events = [];
    data().active.clear();
    data().last = [];
    data().tick = 0;
  }
  return Object.freeze({
    scan,
    poseCopy,
    reset,
    history: () => data().events.slice(),
    last: () => data().last.slice(),
    setEnabled: (v) => {
      data().enabled = !!v;
      if (!data().enabled) data().active.clear();
    },
    isEnabled: () => data().enabled,
    setFullScan: (v) => {
      data().fullScan = !!v;
    },
    isFullScan: () => data().fullScan,
    distanceSegmentSq,
  });
}

export const ChaosContactEvidence = createContactEvidence();
