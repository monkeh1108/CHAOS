import { clamp } from "../core/math.js";

export function createPlayerSetup() {
  let matchState, rand;

  function create(k, x, y) {
    const p = {
      ...matchState.custom[k],
      key: k,
      x,
      y,
      spawnX: x,
      spawnY: y,
      vx: 0,
      vy: 0,
      face: matchState.custom[k].team === 1 ? Math.PI : 0,
      dirX: matchState.custom[k].team === 1 ? -1 : 1,
      dirY: 0,
      stam: matchState.fatigueBank[k] ?? 1,
      gaitCap: null,
      travel: 0,
      touches: 0,
      blockWins: 0,
      blockMode: null,
      action: null,
      covering: false,
      actionOutcomes: 0,
      beatenTarget: null,
      beatenUntil: 0,
      blockFocus: null,
      runRead: false,
      readAt: 0,
      fit: null,
      readAtTime: -1,
      ground: null,
      groundLock: 0,
      diveRecovery: 0,
      shield: 0,
      stun: 0,
      blocked: 0,
      tackleCooldown: 0,
      reengage: null,
      wrapReach: 0,
      wrapLinked: false,
      tackleStrain: 0,
      escapeReaction: null,
      breakExertion: 0,
      airState: null,
      stumbleTime: 0,
      autoHopCooldown: 0,
      lowContactCooldown: 0,
      ankleReachTime: 0,
      standContact: 0,
      squareImpact: null,
      shedCooldown: 0,
      spin: 0,
      lean: 0,
      balance: 1,
      impact: 0,
      pushing: false,
      sprinting: false,
      technique: "none",
      throwing: false,
      route: null,
      routeIdx: 0,
      routeTime: 0,
      routeBreakTime: 0,
      routeComplete: false,
      scrambleTarget: null,
      scrambleReplanAt: 0,
      scrambleStepCount: 0,
      releaseSlow: 0,
      releaseBurst: 0,
      passRushLane: null,
      passRushStyle: "balanced",
      spy: false,
      blitz: false,
      rushEngaged: 0,
      pressResult: "",
      pressOpponent: null,
      mirrorDelay: 0,
      coverAim: null,
      falseStep: null,
      routeReadCount: 0,
      routeBreaks: 0,
      doubleMoveWins: 0,
      target: null,
      failed: 0,
      number: k.replace(/\D/g, "") || "",
      pulse: 0,
      intent: "align",
      intentTarget: null,
      supportTarget: null,
      primaryRunBlock: null,
      supportUntil: 0,
      jukeDrive: null,
      contactCount: 0,
      routeVariation: null,
      coverageVariation: null,
      jukeRecovery: 0,
      stiffArmHeld: false,
      airPose: null,
    };
    matchState.players.push(p);
    (p.team === 0 ? matchState.off : matchState.def).push(p);
    return p;
  }

  function P(k) {
    return matchState.players.find((q) => q.key === k);
  }

  function snapVariation(p) {
    // Small, seeded execution variance, not a new overall ability rating.
    // Elite technique tightens the distribution: it never makes all reps identical.
    const rating =
      p.team === 0
        ? 0.55 * p.RTE + 0.45 * p.CUT
        : 0.45 * p.MIR + 0.3 * p.RCR + 0.25 * p.DIS;
    const spread = clamp((112 - rating) / 75, 0.16, 0.95);
    const roll = () => (rand() + rand() + rand() - 1.5) / 0.75; // center-weighted, bounded
    if (p.team === 0) {
      p.routeVariation = {
        breakY: roll() * 0.9 * spread,
        breakX: roll() * 0.62 * spread,
        tempo: clamp(1 + roll() * 0.09 * spread, 0.88, 1.12),
        plant: clamp(1 + roll() * 0.16 * spread, 0.78, 1.19),
      };
    } else {
      p.coverageVariation = {
        react: roll() * 0.095 * spread,
        mirror: clamp(1 + roll() * 0.1 * spread, 0.83, 1.17),
        cushion: roll() * 0.4 * spread,
      };
    }
  }

  return {
    bind(services) {
      ({ matchState, rand } = services);
    },
    create,
    P,
    snapVariation,
  };
}
