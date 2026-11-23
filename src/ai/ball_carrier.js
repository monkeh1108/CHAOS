import { clamp } from "../core/math.js";
import { readCarrierObstacle } from "./carrier_obstacles.js";
import { RUN_LANDMARKS } from "../sim/match_config.js";

export function createBallCarrierAI() {
  let H, P, matchState, radius, steer;

  // A ball carrier's objective is the opposing end zone. Prior versions used a
  // landmark anchored to the snap time; a breakaway RB would outrun that landmark
  // and literally steer back toward it. All automatic targets are now IN FRONT.
  function autoCarry(p, dt) {
    p.intent = "carry-auto";
    p.intentTarget = "endzone";
    const { playStart, selectedPlay } = matchState;
    const back = !matchState.specialState && p === P("RB");
    const outsideTrack = back && selectedPlay !== "inside" && RUN_LANDMARKS[selectedPlay];
    const runPoint = outsideTrack
      ? [outsideTrack.entry, outsideTrack.bend, outsideTrack.finish]
          .find((point) => point && p.x < playStart + point[0])
      : null;
    // Inside Zone reads the interior gap. Wider runs aim at the points on the play art.
    const readingInside =
      back && !outsideTrack && p.x < playStart + 5.5 && matchState.playClock < 2.5;
    let targetY = runPoint
      ? runPoint[1]
      : readingInside
        ? p.y + clamp(24.2 - p.y, -3.0, 3.0) * 0.62
        : p.y;
    // Special teams: the called return lane guides early auto-return decisions;
    // the actual kick side is independent and the user may steer elsewhere.
    if (
      matchState.specialState?.returning &&
      p === P("RB") &&
      matchState.specialState.elapsed < 8
    )
      targetY =
        p.y + clamp(matchState.specialState.returnLaneY - p.y, -6, 6) * 0.65;
    targetY = clamp(targetY, 1.35, H - 1.35);
    // Only consider defenders AHEAD of the runner. A pursuer behind must never
    // convince an open-field carrier to turn around or cut into the boundary.
    const inFront = matchState.def
      .filter(
        (d) =>
          d.stun <= 0 &&
          d.x > p.x + 0.9 &&
          d.x < p.x + 5 &&
          Math.abs(d.y - p.y) < 2.1,
      )
      .sort((a, b) => a.x - b.x)[0];
    if (inFront && !runPoint) {
      const side =
        p.y <= 3.7 ? 1 : p.y >= H - 3.7 ? -1 : inFront.y >= p.y ? -1 : 1;
      const candidate = clamp(p.y + side * 2.2, 1.35, H - 1.35);
      if (Math.abs(candidate - inFront.y) > Math.abs(targetY - inFront.y) + 0.5)
        targetY = candidate;
    }
    // If the runner is stuck behind a crowded line, look for the less congested
    // side instead of repeatedly steering straight into the same blocking wall.
    if (
      !matchState.specialState &&
      p === P("RB") &&
      p.x < matchState.playStart + 12
    ) {
      const crowded = matchState.def.filter(
        (d) => !d.ground && Math.abs(d.x - p.x) < 4 && Math.abs(d.y - p.y) < 4,
      );
      const movingForward = p.vx > 0.8;
      p.runStall = movingForward
        ? Math.max(0, (p.runStall || 0) - dt * 2)
        : (p.runStall || 0) + dt;
      if (crowded.length >= 2 && p.runStall > 0.65) {
        const left = matchState.def.filter(
          (d) =>
            !d.ground &&
            d.x > p.x - 1 &&
            d.x < p.x + 6 &&
            d.y < p.y &&
            d.y > p.y - 7,
        ).length;
        const right = matchState.def.filter(
          (d) =>
            !d.ground &&
            d.x > p.x - 1 &&
            d.x < p.x + 6 &&
            d.y >= p.y &&
            d.y < p.y + 7,
        ).length;
        const side =
          left === right ? (p.y < H / 2 ? -1 : 1) : left < right ? -1 : 1;
        targetY = clamp(p.y + side * 4, 1.35, H - 1.35);
        p.intent = "cutback";
        p.intentTarget = "escape-congestion";
      }
    }
    const aheadX = Math.max(p.x + 9, matchState.playStart + 10);
    const dx = runPoint
      ? clamp(playStart + runPoint[0] - p.x, 2, 7)
      : Math.max(2, aheadX - p.x);
    const cuttingBack = p.intent === "cutback";
    if (cuttingBack && p.carrierObstacle) p.carrierObstacle = null;
    const trackDy = (targetY - p.y) * (runPoint ? 1 : 2);
    const length = Math.hypot(dx, trackDy);
    const obstacle = cuttingBack
      ? null
      : readCarrierObstacle(
          p, matchState, radius, dt, H,
          runPoint ? { x: dx / length, y: trackDy / length } : null,
        );
    // Use ordinary steering and traction. The collision solver still owns every impact.
    if (obstacle) p.intentTarget = obstacle.key;
    steer(
      p,
      obstacle ? obstacle.x * length : dx,
      obstacle ? obstacle.y * length : trackDy,
      dt,
      1.02,
    );
  }

  return {
    bind(services) {
      ({ H, P, matchState, radius, steer } = services);
    },
    autoCarry,
  };
}
