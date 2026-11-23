// Presentation-only procedural animation decisions. This module may READ
// simulation state but may not change movement, physics, actions, or outcomes.
// Future higher-quality rigs can consume these same named animation states.
const limit = (value, min, max) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
const actions = new Set([
  "juke",
  "spin",
  "hesi",
  "truck",
  "stiff",
  "hurdle",
  "dive",
  "tackle-dive",
  "hit-stick",
  "cut-stick",
  "conservative",
  "impact-block",
  "kick",
  "giveup",
]);
const airActions = new Set([
  "aggressive",
  "ball",
  "swat",
  "possession",
  "receiver",
  "rac",
]);
const ease = (t) => {
  t = limit(t, 0, 1);
  return t * t * (3 - 2 * t);
};
function preSnapStance(p) {
  const pos = p.pos || "";
  if (
    ["LT", "LG", "C", "RG", "RT", "OL", "DT", "NT", "DE", "EDGE"].includes(pos)
  )
    return "three-point";
  if (pos === "QB") return "quarterback";
  if (pos === "WR") return "receiver";
  if (
    pos === "CB" ||
    pos === "FS" ||
    pos === "SS" ||
    pos === "MLB" ||
    pos === "OLB" ||
    pos === "LB"
  )
    return "coverage-ready";
  if (pos === "RB" || pos === "FB" || pos === "TE") return "skill-ready";
  return "ready";
}
function sample(p, contact = false, preSnap = false) {
  const speed = Math.hypot(p.vx || 0, p.vy || 0),
    run = limit(speed / 6.5, 0, 1);
  const movePhase = (p.travel || 0) * 2.65;
  const cycle = Math.sin(movePhase),
    pulse = Math.abs(cycle);
  const action =
    p.action?.time > 0 && actions.has(p.action.kind) ? p.action.kind : null;
  const air =
    p.airPose?.time > 0 && airActions.has(p.airPose.kind)
      ? p.airPose.kind
      : null;
  const ground = p.ground?.stage || null;
  const progress = action
    ? limit((p.action.age || 0) / ((p.action.age || 0) + p.action.time), 0, 1)
    : 0;
  const burst = action ? Math.sin(Math.PI * ease(progress)) : 0;
  const flavor = limit(p.animationFlavor ?? 0.5, 0, 1);
  const square = limit(p.standContact || 0, 0, 1);
  const strain = limit(p.tackleStrain || 0, 0, 1);
  const release = p.escapeReaction?.time > 0 ? p.escapeReaction : null;
  const releaseProgress = release
    ? 1 - limit(release.time / Math.max(0.01, release.duration), 0, 1)
    : 0;
  const releasePulse = release
    ? Math.sin(Math.PI * releaseProgress) * limit(release.intensity || 0, 0, 1)
    : 0;
  const carrier = p.team === 0;
  const brace =
    !!contact ||
    square > 0.05 ||
    strain > 0.12 ||
    !!release ||
    !!p.pushing ||
    /block|wrap|pile/.test(p.intent || "");
  // Rushing toward a blocker is not itself a blocking engagement. Keep arms
  // available for running until a real contact link exists.
  const blockMode = contact && p.blockMode ? p.blockMode : null;
  const blockArms = !!contact && !!blockMode;
  const plant =
    action === "juke" || action === "hesi" || !!(p.jukeDrive?.remaining > 0);
  const stance =
    preSnap && speed < 0.55 && !contact && !ground && !action && !air
      ? preSnapStance(p)
      : null;
  let state = "idle";
  if (ground)
    state =
      ground === "rise"
        ? "get-up"
        : ground === "fall"
          ? "knockdown"
          : "grounded";
  else if (air) state = "air-" + air;
  else if (action) state = action;
  else if (stance) state = "stance-" + stance;
  else if (blockMode) state = "block-" + blockMode;
  else if (release)
    state = carrier ? "escape-" + release.kind : "grip-" + release.kind;
  else if (strain > 0.28)
    state = carrier ? "leg-drive-struggle" : "holding-strain";
  else if (square > 0.34) state = "stand-up";
  else if (brace) state = "engaged";
  else if (run > 0.72) state = "sprint";
  else if (run > 0.14) state = "run";
  // Small per-player accents stay stable across frames; no random animation
  // choice at render time. Normal locomotion is separate from contact events.
  const stride =
    run *
    (p.sprinting ? 0.68 : 0.45) *
    (1 + (flavor - 0.5) * 0.12) *
    (carrier ? 1 + strain * 0.22 : 1 - strain * 0.18);
  const contactLean =
    blockMode === "drive" || blockMode === "double-team"
      ? -0.28
      : blockMode === "seal"
        ? -0.16
        : brace
          ? -0.18
          : -0.07 * run;
  const actionLean =
    action === "truck"
      ? -0.19 * burst
      : action === "hesi"
        ? -0.15 * burst
        : action === "hit-stick"
          ? -0.22 * burst
          : action === "juke"
            ? -0.12 * burst
            : action === "stiff"
              ? -0.08 * burst
              : 0;
  return {
    state,
    action,
    air,
    ground,
    speed,
    run,
    cycle,
    progress,
    bob: ground
      ? 0
      : run > 0.15
        ? 0.035 * run * pulse * (1 - square * 0.85) +
          strain * (carrier ? 0.028 : 0) * pulse
        : 0,
    stride: stride * (1 - square * 0.7),
    brace,
    plant,
    blockMode,
    blockArms,
    stance,
    standUp: square,
    escapeStrain: strain,
    escapePulse: releasePulse,
    escapeKind: release?.kind || null,
    stanceLean:
      stance === "three-point"
        ? -0.35
        : stance === "receiver"
          ? -0.23
          : stance === "coverage-ready"
            ? -0.13
            : stance === "skill-ready"
              ? -0.12
              : 0,
    crouch:
      stance === "three-point"
        ? 0.22
        : stance === "coverage-ready"
          ? 0.12
          : stance === "receiver"
            ? 0.13
            : stance === "skill-ready"
              ? 0.1
              : 0,
    lean:
      contactLean +
      (plant ? -0.17 * burst : 0) +
      actionLean +
      (p.lean || 0) * 0.17 -
      square * 0.07 -
      strain * (carrier ? 0.13 : 0.05) +
      releasePulse * (carrier ? -0.19 : 0.14),
    // 3D torso bank; lightweight articulation, not a new collision system.
    // Physical release state only changes presentation; zero effect on grip.
    // Twist is shown as lateral banking, drag as a forward stumble.
    bank:
      (action === "juke"
        ? (p.action?.side || 1) * 0.16 * burst
        : action === "spin"
          ? 0.09 * burst
          : action === "hesi"
            ? -0.07 * burst
            : 0) +
      (release?.kind === "twist"
        ? (release.side || 1) * 0.24 * releasePulse
        : release?.kind === "drag-release"
          ? 0.11 * releasePulse
          : 0),
    yaw:
      action === "spin"
        ? (p.action?.side || 1) * 0.38 * burst
        : release?.kind === "twist"
          ? (release.side || 1) * 0.22 * releasePulse
          : 0,
    armDrive: brace ? 0.65 : 1,
    impactAccent:
      action === "hit-stick" || action === "impact-block" ? 0.18 * burst : 0,
  };
}
export const AnimationPolicy = Object.freeze({
  sample,
  states: Object.freeze([
    "idle",
    "run",
    "sprint",
    "engaged",
    "stand-up",
    "juke",
    "spin",
    "hesi",
    "truck",
    "stiff",
    "hurdle",
    "dive",
    "tackle-dive",
    "hit-stick",
    "cut-stick",
    "conservative",
    "impact-block",
    "kick",
    "giveup",
    "knockdown",
    "grounded",
    "get-up",
    "air-aggressive",
    "air-ball",
    "air-swat",
    "air-possession",
    "air-receiver",
    "air-rac",
    "block-stonewall",
    "block-drive",
    "block-seal",
    "block-double-team",
    "block-losing",
    "stance-three-point",
    "stance-quarterback",
    "stance-receiver",
    "stance-coverage-ready",
    "stance-skill-ready",
    "stance-ready",
  ]),
});
