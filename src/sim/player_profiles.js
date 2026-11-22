import { startingRoster } from "./starting_roster.js";
import { reserveRoster } from "./reserve_roster.js";
import { clamp } from "../core/math.js";

export function createPlayerProfiles() {
  const custom = structuredClone({ ...startingRoster, ...reserveRoster });
  // The kickoff/punt unit swaps its free safety for a specialist: an actual
  // on-field kicker, rather than a ball launching from a nameless coordinate.
  custom.K = {
    name: "Evan Mercer",
    pos: "K",
    team: 1,
    h: 73,
    w: 198,
    SPD: 65,
    ACC: 67,
    AGI: 57,
    STR: 52,
    TAK: 44,
    BLO: 31,
    CAT: 22,
    JMP: 53,
    THP: 10,
    THA: 10,
    AWR: 85,
    TRK: 32,
    COV: 24,
    KPW: 88,
    KAC: 85,
    PUNT: 87,
  };
  // Quarterback mental and pocket traits. Independent tunable ratings (1–99).
  Object.assign(custom.QB, {
    VIS: 87,
    DEC: 81,
    TOR: 80,
    BSK: 73,
    SCT: 55,
    PAT: 65,
    IMP: 64,
    RSK: 55,
  });
  // Independent, editable contact-technique ratings. Derived defaults are only
  // starting values; simulations always read the live attribute from each player.
  for (const p of Object.values(custom)) {
    p.HIT = clamp(
      0.53 * p.TAK + 0.29 * p.STR + 0.18 * p.AWR + (p.w - 215) * 0.035,
      30,
      99,
    );
    p.PMV = clamp(
      0.39 * p.STR +
        0.3 * p.AGI +
        0.19 * p.AWR +
        0.12 * p.TAK +
        (p.w - 220) * 0.032,
      30,
      99,
    );
    p.IBL = clamp(
      0.53 * p.BLO + 0.3 * p.STR + 0.17 * p.AWR + (p.w - 210) * 0.026,
      30,
      99,
    );
    // Independent recognition, pursuit technique and endurance ratings (live editable).
    p.PRC = clamp(0.69 * p.AWR + 0.18 * p.TAK + 0.13 * p.COV, 30, 99);
    p.PUR = clamp(
      0.28 * p.AWR + 0.27 * p.SPD + 0.23 * p.ACC + 0.22 * p.TAK,
      30,
      99,
    );
    p.STA = clamp(
      0.35 * p.ACC + 0.34 * p.SPD + 0.31 * p.AWR - (p.w > 280 ? 5 : 0),
      30,
      99,
    );
  }
  // Independent, player-specific route and coverage technique profiles. These are
  // fictional athletes, not unverified assertions about real NFL players.
  const TECHNIQUES = {
    WR1: { RTE: 91, CUT: 78, DBL: 76, REL: 77, HND: 73 },
    WR2: { RTE: 87, CUT: 97, DBL: 87, REL: 93, HND: 88 },
    WR3: { RTE: 93, CUT: 91, DBL: 85, REL: 89, HND: 91 },
    TE: { RTE: 75, CUT: 65, DBL: 54, REL: 68, HND: 76 },
    TE2: { RTE: 68, CUT: 57, DBL: 45, REL: 61, HND: 74 },
    FB: { RTE: 56, CUT: 56, DBL: 38, REL: 50, HND: 48 },
    CB1: { PRS: 95, JAM: 91, MIR: 96, RCR: 95, DIS: 96 },
    CB2: { PRS: 79, JAM: 73, MIR: 90, RCR: 75, DIS: 65 },
    CB3: { PRS: 89, JAM: 84, MIR: 82, RCR: 82, DIS: 77 },
    FS: { PRS: 55, JAM: 55, MIR: 89, RCR: 91, DIS: 94 },
    SS: { PRS: 68, JAM: 69, MIR: 80, RCR: 79, DIS: 83 },
    OLB: { PRS: 55, JAM: 62, MIR: 77, RCR: 72, DIS: 74 },
    MLB: { PRS: 51, JAM: 65, MIR: 72, RCR: 71, DIS: 78 },
  };
  for (const [key, t] of Object.entries(TECHNIQUES))
    Object.assign(custom[key], t);
  for (const p of Object.values(custom)) {
    if (p.team === 0) {
      p.RTE ??= clamp(p.AGI * 0.44 + p.AWR * 0.36 + p.ACC * 0.2, 30, 99);
      p.CUT ??= clamp(p.AGI * 0.6 + p.ACC * 0.27 + p.AWR * 0.13, 30, 99);
      p.DBL ??= clamp(p.RTE * 0.49 + p.CUT * 0.31 + p.AWR * 0.2, 30, 99);
      p.REL ??= clamp(p.AGI * 0.42 + p.STR * 0.28 + p.AWR * 0.3, 30, 99);
      p.HND ??= clamp(p.AGI * 0.25 + p.STR * 0.43 + p.AWR * 0.32, 30, 99);
    } else {
      p.PRS ??= clamp(p.COV * 0.49 + p.STR * 0.33 + p.AWR * 0.18, 30, 99);
      p.JAM ??= clamp(p.PRS * 0.54 + p.STR * 0.31 + p.AWR * 0.15, 30, 99);
      p.MIR ??= clamp(p.COV * 0.48 + p.AGI * 0.31 + p.PRC * 0.21, 30, 99);
      // RCR reads route stems and breaks; DIS resists double-move fakes. These
      // are not the same skill as PRC, which controls *run* recognition.
      p.RCR ??= clamp(p.COV * 0.43 + p.AWR * 0.34 + p.MIR * 0.23, 30, 99);
      p.DIS ??= clamp(p.AWR * 0.42 + p.RCR * 0.36 + p.MIR * 0.22, 30, 99);
    }
  }
  // Distinct ball skills; editable independent ratings, not guaranteed-win abilities.
  for (const p of Object.values(custom))
    if (p.team === 0) {
      p.JUK = clamp(p.AGI * 0.45 + p.CUT * 0.33 + p.AWR * 0.22, 30, 99);
      p.SFA = clamp(p.STR * 0.49 + p.TRK * 0.33 + p.AWR * 0.18, 30, 99);
    }
  return custom;
}
