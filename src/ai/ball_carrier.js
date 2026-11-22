import { clamp } from "../core/math.js";

export function createBallCarrierAI() {
  let H, P, matchState, steer;

  // A ball carrier's objective is the opposing end zone. Prior versions used a
  // landmark anchored to the snap time; a breakaway RB would outrun that landmark
  // and literally steer back toward it. All automatic targets are now IN FRONT.
  function autoCarry(p, dt) {
    p.intent = "carry-auto";
    p.intentTarget = "endzone";
    const inBackfield =
      p.x < matchState.playStart + 5.5 && matchState.playClock < 2.5;
    const lane =
      matchState.selectedPlay === "stretch"
        ? 16
        : matchState.selectedPlay === "sweep"
          ? 39
          : matchState.selectedPlay === "counter"
            ? 35
            : matchState.selectedPlay === "power"
              ? 22.5
              : 24.2;
    // A run gap influences the FIRST few steps only. After breaking contain, keep
    // the runner's current lane, especially along an empty sideline.
    let targetY =
      inBackfield && p === P("RB")
        ? p.y + clamp(lane - p.y, -3.0, 3.0) * 0.62
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
    if (inFront) {
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
    const dx = Math.max(2, aheadX - p.x);
    const dy = (targetY - p.y) * 2.0;
    steer(p, dx, dy, dt, 1.02);
  }

  return {
    bind(services) {
      ({ H, P, matchState, steer } = services);
    },
    autoCarry,
  };
}
