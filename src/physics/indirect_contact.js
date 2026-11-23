import { clamp } from "../core/math.js";

const DRIVE_LIFETIME = 0.14;
export const MIN_DRIVE_IMPULSE = 30;
const LINE_BLOCKERS = new Set(["LT", "LG", "C", "RG", "RT", "TE", "FB"]);

export function indirectContactActive(state) {
  return (
    state.phase === "live" &&
    state.selectedPlay === "inside" &&
    !state.specialState &&
    state.ballCarrier?.team === 0
  );
}

export function ageIndirectDrive(player, dt) {
  const drive = player.indirectDrive;
  if (!drive) return;
  drive.remaining -= dt;
  if (drive.remaining <= 0) player.indirectDrive = null;
}

export function recordDefenderDrive(
  state,
  blocker,
  defender,
  x,
  y,
  engaged = false,
) {
  if (
    !indirectContactActive(state) ||
    blocker.team !== 0 ||
    defender.team !== 1 ||
    blocker === state.ballCarrier ||
    x >= 0 ||
    (!engaged && !LINE_BLOCKERS.has(blocker.pos))
  ) {
    return;
  }
  const impulse = Math.hypot(x, y);
  if (impulse < (engaged ? 2 : MIN_DRIVE_IMPULSE)) return;
  const previous = blocker.indirectDrive;
  if (previous?.defender === defender.key && previous.blockers.length === 1) {
    const retained = previous.remaining / DRIVE_LIFETIME;
    x += previous.x * retained;
    y += previous.y * retained;
  } else if (previous && Math.hypot(previous.x, previous.y) > impulse) {
    return;
  }
  blocker.indirectDrive = {
    defender: defender.key,
    blockers: [blocker.key],
    x,
    y,
    remaining: DRIVE_LIFETIME,
  };
}

function transmittedDrive(
  blocker,
  teammate,
  normalX,
  normalY,
  approach,
  impulse,
) {
  const drive = blocker.indirectDrive;
  if (!drive || drive.blockers.includes(teammate.key) || approach < 0.6) {
    return null;
  }
  const projection = drive.x * normalX + drive.y * normalY;
  const transmitted = Math.min(impulse, projection);
  if (transmitted < MIN_DRIVE_IMPULSE) return null;
  // A following hit can only transmit the unused portion of this contact.
  drive.x -= transmitted * normalX;
  drive.y -= transmitted * normalY;
  return {
    defender: drive.defender,
    blockers: [...drive.blockers, teammate.key],
    x: transmitted * normalX,
    y: transmitted * normalY,
    remaining: drive.remaining,
  };
}

export function resolveTeammateImpact(
  state,
  blocker,
  teammate,
  normalX,
  normalY,
  approach,
  speed,
  impulse,
  mass,
) {
  if (
    !indirectContactActive(state) ||
    blocker.team !== 0 ||
    teammate.team !== 0
  ) {
    return;
  }
  if (blocker === state.ballCarrier) return;
  const drive = transmittedDrive(
    blocker,
    teammate,
    normalX,
    normalY,
    approach,
    impulse,
  );
  if (teammate !== state.ballCarrier) {
    if (
      drive &&
      (!teammate.indirectDrive ||
        Math.hypot(drive.x, drive.y) >
          Math.hypot(teammate.indirectDrive.x, teammate.indirectDrive.y))
    ) {
      teammate.indirectDrive = drive;
    }
    return;
  }
  if (teammate.ground || speed < 1.1 || impulse < 45) return;
  const causalImpulse = drive ? Math.hypot(drive.x, drive.y) : 0;
  const facing =
    Math.cos(teammate.face || 0) * -normalX +
    Math.sin(teammate.face || 0) * -normalY;
  const ratings =
    teammate.STR * 0.25 +
    teammate.AWR * 0.25 +
    teammate.AGI * 0.3 +
    teammate.STA * 0.2;
  const stability = clamp(
    0.58 +
      (ratings - 65) * 0.006 +
      teammate.balance * 0.36 +
      facing * 0.07 -
      (teammate.airState ? 0.12 : 0),
    0.58,
    1.35,
  );
  // The solver already transferred momentum. This response changes only
  // balance and footing. An ordinary teammate collision is much easier to brace for.
  const severity =
    (drive ? causalImpulse : impulse * 0.44) / (mass * 3.6 * stability);
  const before = teammate.balance;
  const fall = drive
    ? severity > 1.12 && (before < 0.7 || severity > 1.42)
    : severity > 1.35 && before < 0.52;
  const stagger = severity > (drive ? 0.52 : 0.8);
  teammate.lastIndirectContact = {
    kind: !drive
      ? "teammate-bump"
      : drive.blockers.length > 2
        ? "chain-collapse"
        : "driven-blocker",
    blocker: blocker.key,
    defender: drive?.defender ?? null,
    chain: drive?.blockers.slice(0, -1) ?? [blocker.key],
    impulse,
    causalImpulse,
    speed,
    severity,
    outcome: fall ? "fall" : stagger ? "stagger" : "deflect",
  };
  if (!stagger) return;
  teammate.balance = clamp(before - severity * 0.14, 0.25, 1);
  teammate.stumbleTime = Math.max(
    teammate.stumbleTime || 0,
    clamp(severity * 0.28, 0.16, 0.55),
  );
  if (fall) {
    teammate.action = null;
    teammate.airState = null;
    teammate.sprinting = false;
    teammate.ground = {
      stage: "fall",
      time: 0.17,
      fall: 0.17,
      rest: 0.32,
      rise: 0.25,
      age: 0,
      from: blocker.key,
      kind: "indirect-contact",
      dir: Math.atan2(normalY, normalX),
      severity,
    };
  }
}
