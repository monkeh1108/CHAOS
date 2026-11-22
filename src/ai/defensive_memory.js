// v0.35.2: observed play history; only repeated, *completed* run-escape
// patterns can inform live pursuit. No adaptive play-calling yet.
// Records only revealed actions after the snap; never exposes a selected future play.
const makeTeam = () => ({
  plays: [],
  counts: { run: 0, pass: 0, deep: 0, intermediate: 0, short: 0, scramble: 0 },
  targets: {},
});
export function createDefensiveMemoryState() {
  return { teams: [makeTeam(), makeTeam()] };
}

export function createDefensiveMemory(state = createDefensiveMemoryState()) {
  const data = typeof state === "function" ? state : () => state;
  const classify = (yards) =>
    yards >= 20 ? "deep" : yards >= 10 ? "intermediate" : "short";
  function reset() {
    data().teams = [makeTeam(), makeTeam()];
  }
  function record(team, entry) {
    if (team !== 0 && team !== 1) return false;
    if (
      !entry ||
      typeof entry.play !== "string" ||
      !["run", "pass"].includes(entry.kind)
    )
      return false;
    const target =
      typeof entry.target === "string" &&
      /^(WR1|WR2|TE|SLOT|RB|FB)$/.test(entry.target)
        ? entry.target
        : null;
    const airYards = Number.isFinite(entry.airYards)
      ? Math.max(0, Math.min(100, entry.airYards))
      : null;
    const item = {
      kind: entry.kind,
      play: entry.play,
      formation: String(entry.formation || ""),
      target: entry.kind === "pass" ? target : null,
      depth:
        entry.kind === "pass" && airYards !== null ? classify(airYards) : null,
      airYards: entry.kind === "pass" ? airYards : null,
      scramble: !!entry.scramble,
      retreatSide: ["left", "right"].includes(entry.retreatSide)
        ? entry.retreatSide
        : null,
      result: String(entry.result || ""),
      down: entry.down ?? null,
      quarter: entry.quarter ?? null,
    };
    const t = data().teams[team];
    t.plays.push(item);
    if (t.plays.length > 160) t.plays.shift();
    // Recalculate from bounded history so aggregate counts never go stale.
    t.counts = {
      run: 0,
      pass: 0,
      deep: 0,
      intermediate: 0,
      short: 0,
      scramble: 0,
    };
    t.targets = {};
    for (const p of t.plays) {
      t.counts[p.kind]++;
      if (p.depth) t.counts[p.depth]++;
      if (p.scramble) t.counts.scramble++;
      if (p.target) t.targets[p.target] = (t.targets[p.target] || 0) + 1;
    }
    return true;
  }
  function report(team) {
    const t = data().teams[team];
    if (!t) return null;
    const n = t.plays.length;
    // Neutral prior prevents a few repetitions from producing artificial certainty.
    // Descriptive ONLY; no tactical actions wired to this number.
    const tendency = (category) =>
      Math.min(0.85, Math.max(0.15, ((t.counts[category] || 0) + 2) / (n + 4)));
    return {
      sampleSize: n,
      counts: { ...t.counts },
      targets: { ...t.targets },
      estimatedRunShare: tendency("run"),
      estimatedPassShare: tendency("pass"),
      history: t.plays.map((p) => ({ ...p })),
    };
  }
  return { reset, record, report };
}

export const DefensiveMemory = createDefensiveMemory();
