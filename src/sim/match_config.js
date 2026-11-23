export const W = 120,
  H = 53.333,
  G = 10.73,
  YARD_M = 0.9144,
  MPS_TO_MPH = 2.23694;

export const plays = [
  "inside",
  "stretch",
  "power",
  "counter",
  "sweep",
  "slants",
  "verticals",
  "mesh",
  "flood",
  "sluggo",
  "stick",
  "dagger",
  "smash",
];

export const RUN_LANDMARKS = {
  inside: { bend: [8, 26.65], finish: [16, 26.65] },
  stretch: { bend: [6, 8], finish: [15, 8], block: { shift: -2.8, leadY: 19 } },
  power: {
    entry: [1, 22.3],
    bend: [5, 19],
    finish: [13, 16],
    block: { shift: 0.75, leadY: 22, pull: "RG" },
  },
  counter: {
    entry: [1, 33.2],
    bend: [6, 38],
    finish: [15, 39],
    block: { shift: -0.75, leadY: 32.5, pull: "LG" },
  },
  sweep: { bend: [8, 43], finish: [16, 46], block: { shift: 3.2, leadY: 35, pull: "RG" } },
};

export const RUNS = new Set(Object.keys(RUN_LANDMARKS));

export const PASS_ICONS = ["X", "Y", "A", "B"];

export const formationDesc = {
  spread: "11 personnel · shotgun 2×2",
  trips: "11 personnel · trips right; isolated X",
  ace: "12 personnel · singleback Ace with two tight ends",
  iform: "21 personnel · I-formation with lead fullback",
  bunch: "11 personnel · shotgun bunch right, isolated X",
  pistol: "11 personnel · pistol with back directly behind QB",
};

export const defenseDesc = {
  nickel: "4 DL, 2 LB, 5 DB",
  base43: "4 DL, 3 LB, 4 DB",
  base34: "3 DL, 4 LB, 4 DB (one OLB rushes)",
};

export const coverageDesc = {
  cover1:
    "Man defenders trail assigned eligible receivers; a free safety protects the deep middle.",
  cover2:
    "Two safeties split deep halves. Corners handle flats; underneath defenders handle hooks.",
  cover3:
    "Two corners and a safety divide three deep thirds; underneath defenders split flats/hooks.",
  quarters:
    "Corners and safeties divide deep quarters. Underneath defenders guard shorter routes.",
};

export const pressureDesc = {
  balanced: "Four-man rush with edge-lane integrity",
  contain: "Disciplined outside shoulders to prevent rollouts",
  spy: "Linebacker monitors QB and fills the escape lane",
  blitz: "Extra linebacker rush; fewer coverage defenders",
  stunt: "Inside rushers exchange lanes while edges contain",
};

export const PRESNAP_PLAY_SECONDS = 20;

export const AUDIBLE_BUTTONS = ["A", "B", "X", "Y"];

export const OFFENSE_AUDIBLES = {
  spread: ["inside", "flood", "verticals", "slants"],
  trips: ["inside", "flood", "verticals", "slants"],
  ace: ["inside", "flood", "verticals", "slants"],
  iform: ["inside", "flood", "verticals", "slants"],
  bunch: ["inside", "flood", "verticals", "slants"],
  pistol: ["inside", "flood", "verticals", "slants"],
};

export const QUARTER_DURATION_SECONDS = 60;

export const TEAM_NAMES = ["HOME", "AWAY"];

export const TEAM_STYLES = [
  {
    name: "HOME",
    identity: "Spread & Tempo",
    pool: [
      "mesh",
      "slants",
      "stick",
      "verticals",
      "inside",
      "stretch",
      "flood",
      "dagger",
      "smash",
    ],
  },
  {
    name: "AWAY",
    identity: "Multiple & Power",
    pool: [
      "inside",
      "power",
      "counter",
      "stretch",
      "slants",
      "mesh",
      "smash",
      "verticals",
      "flood",
      "stick",
    ],
  },
];
