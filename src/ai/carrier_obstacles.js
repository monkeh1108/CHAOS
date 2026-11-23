import { clamp } from "../core/math.js";
import { MIN_DRIVE_IMPULSE } from "../physics/indirect_contact.js";

const BLOCKER_POSITIONS = new Set(["LT", "LG", "C", "RG", "RT", "TE", "FB"]);
const BLOCKING_INTENTS = new Set([
  "block",
  "user-block",
  "run-block",
  "edge-stalk",
  "catch-block",
  "catch-screen",
  "lead-return-block",
  "return-block",
]);
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

function laneIsOpen(runner, blocker, players, radius, time, targetX, targetY) {
  return !players.some((other) => {
    if (other === runner || other === blocker) return false;
    const x = other.x - runner.x;
    const y = other.y - runner.y;
    const dx = targetX - runner.x - other.vx * time;
    const dy = targetY - runner.y - other.vy * time;
    const fraction = clamp((x * dx + y * dy) / Math.max(dx * dx + dy * dy, 0.01), 0, 1);
    return Math.hypot(x - dx * fraction, y - dy * fraction) <
      radius(runner) + radius(other) + PAD_MARGIN;
  });
}

export function readCarrierObstacle(runner, state, radius, dt, fieldWidth, aim) {
  const speed = Math.hypot(runner.vx, runner.vy);
  if (
    state.suppressManualUntilNeutral ||
    speed < 1.8 ||
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
  // Start a read from behind a teammate. A blocker being driven back stays a
  // physical impact, even when the runner sees it coming.
  for (const blocker of state.off) {
    if (
      blocker === runner ||
      (!BLOCKER_POSITIONS.has(blocker.pos) &&
        !BLOCKING_INTENTS.has(blocker.intent) &&
        !state.blockLinks.has(blocker.key)) ||
      blocker.ground ||
      blocker.airState ||
      (blocker.indirectDrive &&
        Math.hypot(blocker.indirectDrive.x, blocker.indirectDrive.y) >=
          MIN_DRIVE_IMPULSE)
    )
      continue;

    const clearance = radius(runner) + radius(blocker) + PAD_MARGIN;
    const dx = blocker.x - runner.x;
    const dy = blocker.y - runner.y;
    const committed = previous?.key === blocker.key && previous.side;
    const forwardX = (committed ? previous.forwardX : null) ?? runner.vx / speed;
    const forwardY = (committed ? previous.forwardY : null) ?? runner.vy / speed;
    const distance = dx * forwardX + dy * forwardY;
    const across = dy * forwardX - dx * forwardY;
    const blockerForward = blocker.vx * forwardX + blocker.vy * forwardY;
    const closing = runner.vx * forwardX + runner.vy * forwardY - blockerForward;
    if (distance <= 0 || closing < 1.2 || blockerForward < -0.45) continue;
    const approachTime = (distance - clearance) / closing;
    const time = Math.max(0, approachTime);
    if (
      (!committed && approachTime < 0) ||
      time > lookAhead ||
      (threat && time >= threat.time)
    )
      continue;

    const fromBehind = dx * Math.cos(blocker.face) + dy * Math.sin(blocker.face) > 0;
    const acrossSpeed = (blocker.vy - runner.vy) * forwardX - (blocker.vx - runner.vx) * forwardY;
    const intercept = across + acrossSpeed * time;
    if (
      (!committed && (!fromBehind || Math.abs(intercept) >= clearance)) ||
      (committed && Math.abs(across) > clearance + 0.55) ||
      !canSeeBlocker(runner, blocker, state.players, radius)
    )
      continue;
    threat = { blocker, clearance, time, intercept, distance, closing, forwardX, forwardY };
  }

  if (!threat) {
    if (runner.carrierObstacle) runner.carrierObstacle = null;
    return null;
  }

  const { blocker, clearance, time, intercept, distance, closing, forwardX, forwardY } = threat;
  const read =
    previous?.key === blocker.key
      ? previous
      : { key: blocker.key, elapsed: 0, side: 0, steeringTime: 0 };
  if (read === previous) read.elapsed += dt;
  runner.carrierObstacle = read;
  if (!read.side && (read.elapsed < delay || time < 0.11)) return null;

  const agility = clamp((runner.AGI - 30) / 69, 0, 1);
  const steeringLimit =
    (0.23 + 0.55 * agility) * clamp(runner.balance, 0.45, 1);
  const calledSide = aim ? aim.y * forwardX - aim.x * forwardY : 0;
  const side = Math.abs(calledSide) > 0.22 ? Math.sign(calledSide) : intercept >= 0 ? -1 : 1;
  // Keep the lead point on the chosen shoulder until the runner passes it.
  const passTime = distance / closing;
  for (const direction of read.side ? [read.side] : [side, -side]) {
    const margin = direction * (clearance + 0.22);
    const targetX = blocker.x + blocker.vx * passTime - forwardY * margin;
    const targetY = blocker.y + blocker.vy * passTime + forwardX * margin;
    if (
      targetY < 1.35 ||
      targetY > fieldWidth - 1.35 ||
      !laneIsOpen(runner, blocker, state.players, radius, passTime, targetX, targetY)
    )
      continue;
    read.side = direction;
    read.forwardX = forwardX;
    read.forwardY = forwardY;
    read.steeringTime += dt;
    const commitment = clamp(read.steeringTime / 0.07, 0, 1);
    const lateral = (targetY - runner.y) * forwardX - (targetX - runner.x) * forwardY;
    const slope = direction * commitment *
      clamp(lateral * direction / Math.max(0.9, distance - clearance), 0, steeringLimit);
    read.bank = clamp(slope * 0.34, -0.26, 0.26);
    return { key: blocker.key, x: forwardX - forwardY * slope, y: forwardY + forwardX * slope };
  }
  read.steeringTime = 0;
  read.bank = 0;
  return null;
}
