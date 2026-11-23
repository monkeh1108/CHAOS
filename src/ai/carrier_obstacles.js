import { clamp } from "../core/math.js";

const BLOCKER_POSITIONS = new Set(["LT", "LG", "C", "RG", "RT", "TE", "FB"]);
const PAD_MARGIN = 0.14;

function reactionTiming(runner) {
  // Vision is already rated for QBs. Runners without VIS use their awareness.
  const awareness = clamp(
    (runner.AWR * 0.65 + (runner.VIS ?? runner.AWR) * 0.35 - 30) / 69,
    0,
    1,
  );
  return { lookAhead: 0.33 + awareness * 0.46, delay: 0.26 - awareness * 0.18 };
}

function canSeeBlocker(runner, blocker, players, radius) {
  const dx = blocker.x - runner.x;
  const dy = blocker.y - runner.y;
  const distanceSquared = dx * dx + dy * dy;
  const facing = Math.cos(runner.face) * dx + Math.sin(runner.face) * dy;
  if (facing < Math.sqrt(distanceSquared) * 0.76) return false;

  return !players.some((other) => {
    if (other === runner || other === blocker || other.ground) return false;
    const x = other.x - runner.x;
    const y = other.y - runner.y;
    const fraction = (x * dx + y * dy) / distanceSquared;
    return (
      fraction > 0 &&
      fraction < 1 &&
      Math.hypot(x - fraction * dx, y - fraction * dy) < radius(other)
    );
  });
}

function laneIsOpen(runner, blocker, players, radius, time, targetY) {
  const dx = blocker.x + blocker.vx * time - runner.x;
  const dy = targetY - runner.y;
  return !players.some((other) => {
    if (other === runner || other === blocker) return false;
    // Sample each body at the moment the runner would reach its depth.
    const relativeX = dx - other.vx * time;
    const fraction = clamp(
      (other.x - runner.x) / Math.max(relativeX, 0.1),
      0,
      1,
    );
    const x = other.x + other.vx * time * fraction - runner.x - dx * fraction;
    const y = other.y + other.vy * time * fraction - runner.y - dy * fraction;
    return Math.hypot(x, y) < radius(runner) + radius(other) + PAD_MARGIN;
  });
}

export function readCarrierObstacle(runner, state, radius, dt, fieldWidth) {
  if (
    state.selectedPlay !== "inside" ||
    state.specialState ||
    state.suppressManualUntilNeutral ||
    runner.pos !== "RB" ||
    runner.vx < 1.8 ||
    runner.stun > 0 ||
    runner.action ||
    runner.ground ||
    runner.airState ||
    runner.stumbleTime > 0 ||
    state.tackleLinks.size
  ) {
    if (runner.carrierObstacle) runner.carrierObstacle = null;
    return null;
  }

  const previous = runner.carrierObstacle;
  const { lookAhead, delay } = reactionTiming(runner);
  let threat = null;
  for (const blocker of state.off) {
    if (
      blocker === runner ||
      !BLOCKER_POSITIONS.has(blocker.pos) ||
      blocker.ground ||
      blocker.indirectDrive ||
      state.blockLinks.has(blocker.key) ||
      Math.hypot(blocker.vx, blocker.vy) > 1.15
    )
      continue;

    const clearance = radius(runner) + radius(blocker) + PAD_MARGIN;
    const dx = blocker.x - runner.x;
    const closing = runner.vx - blocker.vx;
    const time = (dx - clearance) / closing;
    if (
      dx <= 0 ||
      closing < 1.2 ||
      time < 0 ||
      time > lookAhead ||
      (threat && time >= threat.time)
    )
      continue;
    const offset = blocker.y - runner.y;
    const intercept = offset + (blocker.vy - runner.vy) * time;
    const committed = previous?.key === blocker.key && previous.side;
    if (
      Math.abs(offset) > clearance + 0.42 ||
      (!committed && Math.abs(intercept) >= clearance) ||
      !canSeeBlocker(runner, blocker, state.players, radius)
    )
      continue;
    threat = { blocker, clearance, time, intercept };
  }

  if (!threat) {
    if (runner.carrierObstacle) runner.carrierObstacle = null;
    return null;
  }

  const { blocker, clearance, time, intercept } = threat;
  const read =
    previous?.key === blocker.key
      ? previous
      : { key: blocker.key, elapsed: 0, side: 0, steeringTime: 0 };
  if (read === previous) read.elapsed += dt;
  runner.carrierObstacle = read;
  if (read.elapsed < delay || time < 0.11) return null;

  const agility = clamp((runner.AGI - 30) / 69, 0, 1);
  const steeringLimit =
    (0.23 + 0.55 * agility) * clamp(runner.balance, 0.45, 1);
  const side = intercept >= 0 ? -1 : 1;
  for (const direction of read.side ? [read.side] : [side, -side]) {
    const targetY =
      blocker.y + blocker.vy * time + direction * (clearance + 0.15);
    if (
      targetY < 1.35 ||
      targetY > fieldWidth - 1.35 ||
      !laneIsOpen(runner, blocker, state.players, radius, time, targetY)
    )
      continue;
    read.side = direction;
    read.steeringTime += dt;
    const commitment = clamp(read.steeringTime / 0.07, 0, 1);
    const slope =
      direction *
      commitment *
      clamp((targetY - runner.y) * direction * 1.3, 0, steeringLimit);
    return { key: blocker.key, slope };
  }
  read.steeringTime = 0;
  return null;
}
