import { clamp } from "../core/math.js";
// A player's right to *choose* a pass-defense action is not the right to touch
// the football. Ball flight, collision, leap height and ratings determine the
// eventual attempt. This policy only finds plausible participants while the
// ball is traveling, including CBs tracking receivers still far downfield.
const distance = (a, b) =>
  Math.hypot((a?.x ?? 0) - (b?.x ?? 0), (a?.y ?? 0) - (b?.y ?? 0));
function evaluate(player, receiver, flight, football, topSpeed, reach) {
  const not = (reason) => ({
    eligible: false,
    reason,
    paired: false,
    reachable: false,
    distance: null,
    remaining: flight?.remaining ?? 0,
  });
  if (
    !player ||
    player.team !== 1 ||
    player.ground ||
    !football?.flying ||
    !flight
  )
    return not("not-in-play");
  if (!["CB", "FS", "SS", "OLB", "MLB"].includes(player.pos))
    return not("not-coverage-player");
  const spot = { x: flight.catchX, y: flight.catchY };
  const remaining = Math.max(0, flight.remaining);
  const gap = distance(player, spot),
    ballGap = distance(player, football);
  const receiverGap = receiver ? distance(player, receiver) : Infinity;
  // Following the target with normal man leverage is a *football-specific*
  // reason to prepare early; being on the wrong side of the field is not.
  const paired =
    !!receiver &&
    (player.assignment?.target === receiver.key || receiverGap <= 4.8);
  const dx = (spot.x - player.x) / (gap || 1),
    dy = (spot.y - player.y) / (gap || 1);
  const toward = Math.max(0, (player.vx || 0) * dx + (player.vy || 0) * dy);
  const ratedSpeed = Math.max(0, topSpeed || 0);
  const available = Math.max(0, remaining);
  // Approximate a defender's *credible travel window* with acceleration and
  // present momentum. Tracking a WR grants earlier recognition, not free speed.
  const initial = Math.min(available, 0.3);
  const travel =
    toward * initial +
    Math.max(toward, ratedSpeed * 0.89) * Math.max(0, available - initial) +
    ratedSpeed * 0.4 * initial;
  const earlyTrackingBudget =
    ratedSpeed * (available + 0.4) + Math.min(1.6, (reach || 0) * 0.45);
  const physicalArrival =
    gap <= travel + Math.min(1.8, (reach || 0) * 0.65) + 0.8;
  const trackingArrival = paired && gap <= earlyTrackingBudget + 2.5;
  const nearBall = ballGap <= 3.7;
  // A defender reading the trajectory may join from zone coverage; we avoid
  // giving every distant athlete a contest just because they see the pass.
  const read = football.t >= Math.max(0, (player.airReadAt ?? 0.3) - 0.065);
  const reachable = physicalArrival || trackingArrival || nearBall;
  const eligible = reachable && (paired || read || nearBall);
  return {
    eligible,
    reason: eligible
      ? paired
        ? "tracking-receiver"
        : nearBall
          ? "near-ball"
          : "breaking-on-ball"
      : !reachable
        ? "cannot-arrive"
        : "has-not-read-flight",
    paired,
    reachable,
    distance: +gap.toFixed(2),
    remaining: +remaining.toFixed(2),
    travelBudget: +travel.toFixed(2),
    trackingBudget: +earlyTrackingBudget.toFixed(2),
    ballDistance: +ballGap.toFixed(2),
    read,
  };
}
export const AirContestPolicy = Object.freeze({ evaluate });
