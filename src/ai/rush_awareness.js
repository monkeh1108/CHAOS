// Pure quarterback-movement anticipation for the existing pass-rush AI.
// Edge contain is retained until a genuine lateral rollout is recognized.
export const RushAwareness = Object.freeze({
  assess(qb, los, elapsed) {
    const lateral = qb.y - 26.65;
    const moving = Math.abs(qb.vy || 0) > 1.25;
    const escape =
      Math.abs(lateral) > 4.1 ||
      (Math.abs(lateral) > 2.2 && moving && elapsed > 0.28) ||
      qb.x > los - 1.65;
    const lead = escape
      ? Math.max(-1.15, Math.min(1.15, (qb.vy || 0) * 0.18))
      : 0;
    return {
      escape,
      lead,
      side: Math.sign(lateral || qb.vy || 1),
      urgency: escape ? 1.15 : 1,
    };
  },
  target(d, qb, los, elapsed) {
    const look = this.assess(qb, los, elapsed),
      isEdge =
        d.pos === "EDGE" || d.pos === "DE" || (d.key === "SAM" && d.rush);
    const outside = d.spawnY < 26.65 ? -1 : 1;
    if (isEdge) {
      const threatening =
        look.escape && (outside === look.side || Math.abs(qb.y - 26.65) > 6.0);
      return {
        x: qb.x + (threatening ? 0.5 : 0),
        y: Math.max(
          1.5,
          Math.min(
            51.8,
            qb.y + look.lead + outside * (threatening ? 0.35 : 2.5),
          ),
        ),
        mode: threatening ? "edge-crash" : "edge-contain",
        urgency: look.urgency,
      };
    }
    if (look.escape) {
      return {
        x: qb.x + 0.25,
        y: Math.max(2, Math.min(51.3, qb.y + look.lead * 0.68)),
        mode: d.blitz ? "blitz-close" : "pocket-escape",
        urgency: look.urgency,
      };
    }
    return null; // let existing stunt and interior pocket rules handle stationary QB
  },
});
