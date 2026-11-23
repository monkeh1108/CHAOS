import { clamp, distance2D as dist } from "../core/math.js";

export function createReceiverFlight() {
  let catchReach, flightMarkers, matchState, maxSpeed, steer;

  function receiverFlightAI(o, dt) {
    if (
      !matchState.ball?.flying ||
      !["WR", "TE", "FB", "RB"].includes(o.pos) ||
      o.ground
    )
      return false;
    const m = flightMarkers(),
      target = { x: m.catchX, y: m.catchY };
    const distance = dist(o, target),
      primary = o === matchState.intended;
    const remaining = Math.max(0.02, m.remaining);
    const attainable =
      distance <= maxSpeed(o) * (remaining + 0.11) + catchReach(o) * 0.35;
    if (!primary && (!attainable || distance > 13.5)) return false;
    if (matchState.ball.t < (o.airReadAt ?? (primary ? 0.07 : 0.26)))
      return false;
    o.intent = primary ? "air-track" : "air-backup";
    o.intentTarget = matchState.intended?.key || "football";
    // Lower-rated players take a slightly wider path to the spot. Skill is not
    // overridden by the marker or a button press.
    const reach =
      distance < 1.3
        ? Math.min(1.02, Math.max(0.7, remaining * 1.6))
        : clamp(1.03 + (o.AWR - 70) * 0.0015, 0.96, 1.1);
    steer(o, target.x - o.x, target.y - o.y, dt, reach);
    return true;
  }

  return {
    bind(services) {
      ({ catchReach, flightMarkers, matchState, maxSpeed, steer } = services);
    },
    receiverFlightAI,
  };
}
