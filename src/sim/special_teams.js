import { clamp } from "../core/math.js";
/* Gridiron Lab special-teams decision helpers.
   Pure, independently testable rules; no DOM, physics mutation, or player-control
   side effects. Engine integration is deliberately limited to special plays. */
const lanes = Object.freeze({ left: 13.5, middle: 26.65, right: 39.8 });
function returnLaneY(call) {
  return lanes[call] ?? lanes.middle;
}

function kickerLanding({
  kind,
  previousLandingX,
  accuracy,
  power = 88,
  random,
  fieldHeight = 53.333,
}) {
  if (typeof random !== "function")
    throw new TypeError("A seeded random callback is required");
  // The kicking player chooses the aim; return choice NEVER changes the kick.
  // Punt range is calculated at the punt snap; don't accidentally clamp
  // a 50-yard punt back to the kickoff's 20-yard landing zone.
  const intentX =
    kind === "punt"
      ? previousLandingX
      : kind === "safety-kick"
        ? clamp(25 - (power - 80) * 0.18 + (random() - 0.5) * 7, 16, 30)
        : random() < 0.08 + clamp((power - 82) / 300, 0, 0.06)
          ? 8.2
          : clamp(18.7 - (power - 75) * 0.34 + (random() - 0.5) * 12, 8, 36);
  const intentY = 8 + random() * (fieldHeight - 16);
  const miss = clamp((99 - accuracy) / 99, 0, 1);
  const errorX = (random() + random() - 1) * miss * (kind === "punt" ? 7 : 18);
  return {
    x: clamp(
      intentX + errorX,
      kind === "punt" ? 7 : 6,
      kind === "punt" ? 109 : 38,
    ),
    y: clamp(
      intentY + (random() + random() - 1) * miss * 23,
      2,
      fieldHeight - 2,
    ),
  };
}

function chooseReturnThreat({
  blocker,
  playTime,
  defenders,
  carrier,
  claimed,
  returnLaneY,
  speedOf,
}) {
  // One blocker per claim each decision frame. Already-engaged threats remain
  // eligible through their existing contact; linemen should not be triple-teamed.
  let best = null,
    bestScore = -Infinity;
  for (const defender of defenders) {
    if (
      defender.key === "K" ||
      defender.ground ||
      defender.beatenUntil > playTime ||
      claimed.has(defender.key)
    )
      continue;
    const gap = Math.hypot(blocker.x - defender.x, blocker.y - defender.y);
    const carrierGap = Math.hypot(
      defender.x - carrier.x,
      defender.y - carrier.y,
    );
    const laneGap = Math.abs(defender.y - carrier.y);
    // A defender approaching the returner's lane is more urgent than an
    // equally close defender already behind the play or near the far sideline.
    const approaching =
      defender.x >= carrier.x - 2 && defender.x <= carrier.x + 27;
    const threat = approaching ? clamp((27 - carrierGap) / 27, 0, 1) : 0.15;
    const laneThreat = clamp(1 - laneGap / 17, 0, 1);
    const closing = clamp(
      (carrier.x - defender.x) * 0.12 + speedOf(defender) * 0.11,
      0,
      2.5,
    );
    const lanePenalty = Math.abs(defender.y - returnLaneY) * 0.13;
    const score =
      10 - gap * 0.85 + threat * 4.5 + laneThreat * 2.8 + closing - lanePenalty;
    if (score > bestScore) {
      best = defender;
      bestScore = score;
    }
  }
  return best && bestScore >= -6 ? best : null;
}

function shedBypassY(aimY, side, fieldHeight = 53.333) {
  return clamp(aimY + (side < 0 ? -1 : 1) * 2.4, 1, fieldHeight - 1);
}
export const specialTeams = Object.freeze({
  returnLaneY,
  kickerLanding,
  chooseReturnThreat,
  shedBypassY,
});
