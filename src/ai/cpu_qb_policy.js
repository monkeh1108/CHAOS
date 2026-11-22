// Pure timing policy. Does not know about AI movement, coverage entities,
// or gamepad input. An elite DEC changes decisiveness, not instant telepathy.
export const CpuQBPolicy = Object.freeze({
  minimumSettle(play, dec, vision) {
    const depth = {
      verticals: 2.35,
      sluggo: 2.35,
      dagger: 2.1,
      flood: 1.8,
      smash: 1.65,
      mesh: 1.35,
      slants: 1.2,
      stick: 1.17,
    };
    const base = depth[play] ?? 1.55;
    return (
      base +
      Math.max(-0.18, Math.min(0.36, (78 - dec) * 0.012)) +
      Math.max(-0.07, Math.min(0.18, (72 - vision) * 0.003))
    );
  },
  hasDeveloped(play, elapsed, routeProgress, pressure) {
    const floor =
      {
        verticals: 12.5,
        sluggo: 10.5,
        dagger: 9.3,
        flood: 7,
        smash: 6,
        mesh: 4,
        slants: 3,
        stick: 3,
      }[play] ?? 5;
    return routeProgress >= floor || (pressure > 0.87 && elapsed > 1.05);
  },
  selectThreshold(dec, vision) {
    return 6.6 + Math.max(0, 78 - dec) * 0.17 + Math.max(0, 70 - vision) * 0.08;
  },
  dangerLimit(vision) {
    return Math.max(0.4, Math.min(0.88, 0.58 + (vision - 60) * 0.004));
  },
});
