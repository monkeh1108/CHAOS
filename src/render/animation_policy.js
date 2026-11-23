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
const thighLength = Math.hypot(0.03, 0.48);
const thighOffset = Math.atan2(0.03, 0.48);
const shinLength = 0.405;
const strideEffort = (speed) => ease((speed - 2.5) / 4.8);
export function runningCycle(travel, speed, scale, previous, clock) {
  if (
    clock !== undefined &&
    clock === previous?.clock &&
    travel === previous.travel
  )
    return previous;
  const continues = previous && travel >= previous.travel;
  const dt = continues ? clock - previous.clock : 0;
  const track = dt > 0 && dt <= 0.12;
  // Integrate phase from authoritative travel. Filter pose intensity and
  // acceleration separately so changing speeds never resets the stride.
  const pace = track
    ? previous.pace + (speed - previous.pace) * limit(dt * 12, 0, 1)
    : speed;
  const acceleration = track
    ? previous.acceleration +
      ((speed - previous.speed) / dt - previous.acceleration) *
        limit(dt * 7, 0, 1)
    : 0;
  const stride = (1.4 + 0.68 * strideEffort(pace)) * scale;
  const phase = continues
    ? previous.phase + (travel - previous.travel) / stride
    : travel / stride;
  const step = (continues ? previous.step : 0) + Math.floor(phase);
  return {
    travel,
    phase: phase % 1,
    step,
    stride,
    speed,
    pace,
    acceleration,
    clock,
  };
}

export function runningBody(cycle) {
  const effort = strideEffort(cycle.pace);
  const drive = ease((cycle.acceleration - 0.4) / 6);
  const braking = ease((-cycle.acceleration - 0.5) / 7);
  // A leg reaches forward at contact. The opposite arm and shoulder lead it.
  const opposition = Math.cos(2 * Math.PI * (cycle.phase + 0.055));
  return {
    lean: limit(
      0.025 + 0.095 * effort + 0.12 * drive - 0.1 * braking,
      -0.045,
      0.19,
    ),
    pelvisYaw: opposition * (0.046 + 0.053 * effort),
    bob:
      (0.012 + 0.009 * effort) *
      (0.5 + 0.5 * Math.cos(4 * Math.PI * (cycle.phase + 0.08))),
    armDrive:
      opposition *
      (0.26 + 0.37 * effort + 0.085 * drive) *
      (1 - 0.23 * braking),
    elbow: 0.84 + 0.39 * effort + 0.08 * drive,
  };
}

// Presentation offsets around the existing waist and collar pivots. Running
// keeps its tested rotation; planted stances let the chest and helmet lift
// independently while the root and hips remain where the stance places them.
export function upperBodyArticulation(pose, running, gait, cutWeight) {
  const stanceLean = pose.stance ? Math.max(0, -pose.stanceLean) : 0;
  return {
    pelvisYaw: running ? running.pelvisYaw * gait * (1 - cutWeight) : 0,
    chestYaw: running ? -running.pelvisYaw * 0.8 * gait : 0,
    chestPitch: running
      ? -running.lean * gait
      : limit(stanceLean * 0.16, 0, 0.055),
    neckPitch: limit(stanceLean * 0.48, 0, 0.18),
  };
}

export function runningWeight(p, pose, cutting = false) {
  // Keep the established poses for a plant, contact, or special action.
  if (
    (pose.action && !(cutting && pose.action === "juke")) ||
    pose.air ||
    pose.ground ||
    pose.stance ||
    (pose.plant && !cutting) ||
    p.airState ||
    (p.wrapReach || 0) > 0.01 ||
    p.intent === "wrap" ||
    p.stumbleTime > 0 ||
    pose.standUp > 0.05 ||
    pose.escapePulse > 0 ||
    pose.blockArms ||
    pose.escapeStrain > 0.12
  )
    return 0;
  const forward =
    (p.vx || 0) * Math.cos(p.face) + (p.vy || 0) * Math.sin(p.face);
  return (
    ease((pose.speed - 0.7) / 2.4) *
    ease((forward / Math.max(0.01, pose.speed) - 0.28) / 0.54)
  );
}

export function runningLegTarget(cycle, speed, side, scale) {
  const effort = strideEffort(speed);
  const support = 0.56 - 0.11 * effort;
  const offset = cycle.phase + (side > 0 ? 0.5 : 0);
  const phase = offset % 1;
  const swing = limit((phase - support) / (1 - support), 0, 1);
  const rollOff = 0.36 + 0.21 * effort + 0.05 * ease(cycle.acceleration / 6);
  const pitch =
    phase < support
      ? 0.12 * (1 - ease(phase / 0.13)) -
        rollOff * ease((phase / support - 0.57) / 0.43)
      : -rollOff + (rollOff + 0.12) * ease(swing);
  const x =
    (cycle.stride / scale) * (support * 0.5 - phase + ease(swing)) -
    (0.025 + 0.035 * effort);
  const lift =
    (0.145 + 0.145 * effort) *
    Math.sin(Math.PI * swing) ** 2 *
    (1.17 - 0.34 * swing);
  const stance = phase / support;
  return {
    x,
    lateral: 0,
    lift,
    pitch,
    contact: cycle.step + Math.floor(offset),
    acquire: stance < 0.33,
    lock: 1 - ease((stance - 0.68) / 0.32),
  };
}

export function jukeBody(drive, facing, previous, speed) {
  const side =
    previous?.drive === drive
      ? previous.side
      : drive.nx * -Math.sin(facing) + drive.ny * Math.cos(facing) < 0
        ? 1
        : -1;
  const progress = limit(1 - drive.remaining / drive.duration, 0, 1);
  const load = ease(progress / 0.12) * (1 - ease((progress - 0.14) / 0.28));
  const push =
    ease((progress - 0.13) / 0.18) * (1 - ease((progress - 0.36) / 0.29));
  const weight = ease(progress / 0.1) * (1 - ease((progress - 0.55) / 0.45));
  const effort =
    0.55 + 0.25 * limit(drive.power, 0, 1) + 0.2 * strideEffort(speed);
  return {
    drive,
    side,
    progress,
    weight,
    effort,
    load,
    push,
    drop: (0.095 * load + 0.034 * push) * effort,
    shift: side * (0.09 * load - 0.045 * push) * effort,
    bank: side * (0.075 * load - 0.23 * push) * effort,
  };
}

export function jukeLegTarget(cut, stride, side) {
  const { progress, weight, effort, side: outside } = cut;
  const support = side === outside;
  const transfer = ease((progress - 0.17) / 0.34);
  const reach = (support ? 0.13 : 0.08 + 0.17 * transfer) * effort;
  // The outside foot braces first. The other foot reaches into the cut
  // and accepts weight before both legs return to the running cycle.
  return {
    x:
      stride.x * (1 - weight) +
      (support ? 0.27 : 0.08 + 0.21 * transfer) * weight,
    lateral: reach * weight,
    lift:
      stride.lift * (1 - weight) +
      (support
        ? 0.18 * Math.sin(Math.PI * ease((progress - 0.32) / 0.34))
        : 0.17 * Math.sin(Math.PI * ease(progress / 0.48))) *
        effort *
        weight,
    pitch:
      stride.pitch * (1 - weight) +
      (support ? -0.49 * ease((progress - 0.14) / 0.23) : 0.11 * transfer) *
        weight,
    contact: cut.drive,
    acquire: support
      ? progress >= 0.04 && progress < 0.22
      : progress >= 0.44 && progress < 0.57,
    lock: support
      ? ease(progress / 0.09) * (1 - ease((progress - 0.19) / 0.14))
      : ease((progress - 0.44) / 0.05) * (1 - ease((progress - 0.57) / 0.19)),
    // A grounded landing can be sampled just before the lock ramps in.
    landing: !support,
  };
}

export function solveGroundedLeg(target, side, scale, hip, previous) {
  const { pitch } = target;
  // Match the ellipsoid sole at the requested pitch. The contact position is
  // latched in field space while the hips translate, bank, and rotate.
  const sole =
    Math.hypot(0.185 * Math.sin(pitch), 0.0725 * Math.cos(pitch)) -
    0.12 * Math.sin(pitch);
  const height = (sole + target.lift) * scale;
  const lateral = target.lateral * side;
  const localY =
    (height - hip[13] - hip[1] * target.x - hip[9] * lateral) / hip[5];
  const worldX =
    hip[12] + hip[0] * target.x + hip[4] * localY + hip[8] * lateral;
  const worldZ =
    hip[14] + hip[2] * target.x + hip[6] * localY + hip[10] * lateral;
  let plant =
    previous?.contact === target.contact && previous?.side === side
      ? previous
      : null;
  if (!plant && target.acquire && (target.lock > 0 || target.landing)) {
    const heading = Math.atan2(hip[2], hip[0]);
    plant = {
      contact: target.contact,
      side,
      x: worldX,
      z: worldZ,
      heading,
      weight: 1,
    };
  }
  let x = target.x;
  let y = localY;
  let z = lateral;
  if (plant && plant.weight > 0 && target.lock > 0) {
    const wx = plant.x - hip[12],
      wy = sole * scale - hip[13],
      wz = plant.z - hip[14];
    const scaleSquared = scale * scale;
    const lockedX = (wx * hip[0] + wy * hip[1] + wz * hip[2]) / scaleSquared;
    const lockedY = (wx * hip[4] + wy * hip[5] + wz * hip[6]) / scaleSquared;
    const lockedZ = (wx * hip[8] + wy * hip[9] + wz * hip[10]) / scaleSquared;
    const reach = Math.hypot(lockedX, lockedY, lockedZ);
    const heading = Math.atan2(hip[2], hip[0]) - plant.heading;
    const turn = Math.abs(Math.atan2(Math.sin(heading), Math.cos(heading)));
    const release =
      (1 - ease((reach - 0.855) / 0.085)) * (1 - ease((turn - 0.47) / 0.65));
    if (release < plant.weight) plant = { ...plant, weight: release };
    const lock = target.lock * plant.weight;
    x += (lockedX - x) * lock;
    y += (lockedY - y) * lock;
    z += (lockedZ - z) * lock;
  }
  const planarY = -Math.hypot(y, z);
  const distance = limit(
    Math.hypot(x, planarY),
    0.21,
    thighLength + shinLength - 0.002,
  );
  const hipAngle =
    Math.atan2(x, -planarY) +
    Math.acos(
      limit(
        (thighLength ** 2 + distance ** 2 - shinLength ** 2) /
          (2 * thighLength * distance),
        -1,
        1,
      ),
    ) -
    thighOffset;
  const knee =
    -Math.acos(
      limit(
        (distance ** 2 - thighLength ** 2 - shinLength ** 2) /
          (2 * thighLength * shinLength),
        -1,
        1,
      ),
    ) + thighOffset;
  return {
    hip: hipAngle,
    knee,
    roll: Math.atan2(-z, -y),
    pitch,
    plant,
  };
}

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
  const sidestep =
    p.intent === "carry-auto" && !air && !ground && !action
      ? p.runnerCutBank || p.carrierObstacle?.bank || 0
      : 0;
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
      sidestep +
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
