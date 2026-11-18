// KILNSONG configuration: view, palette, glazes, and the ten commissions.
// One clear job: hold every tunable number and the campaign data.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const PROFILE_ROWS = 16;
export const MAX_HEARTS = 3;
export const PASS_SHAPE = 0.6;

export const PALETTE = {
  paper: '#f2e3c9',
  wall: '#e8cfa8',
  wallBand: '#b4552d',
  table: '#8a5a33',
  tableDark: '#6e4525',
  clay: '#c96f3f',
  clayLight: '#e8a06a',
  clayDark: '#9c4f27',
  ink: '#3a2418',
  inkSoft: '#6b4a30',
  cream: '#fff6e3',
  gold: '#d9a441',
  green: '#5d8a4a',
  greenLight: '#8fbf7a',
  red: '#b3362a',
  redLight: '#d96a5a',
  panel: 'rgba(58, 36, 24, 0.88)',
};

export const GLAZES = [
  { id: 'indigo', name: 'Indigo', color: '#2e4a7a', light: '#5a76ad' },
  { id: 'celadon', name: 'Celadon', color: '#7fae7a', light: '#a9cba4' },
  { id: 'rust', name: 'Rust', color: '#b34a2a', light: '#d97a52' },
];

// A commission's target silhouette is base + belly bump + rim taper.
// profile(t) = rim + (base - rim) * (1 - t)^1.5 + belly * exp(-((t - at) / 0.18)^2),
// clamped to [0.15, 1]. t = 0 is the foot, t = 1 is the rim.
export const COMMISSIONS = [
  {
    name: 'Little Bowl', shape: { base: 0.38, belly: 0.62, at: 0.5, rim: 0.88 },
    glaze: [0, 1, 0], shapeTime: 45, fireTime: 14, spike: 0.10, band: [35, 65],
  },
  {
    name: 'Tea Cup', shape: { base: 0.42, belly: 0.34, at: 0.55, rim: 0.66 },
    glaze: [1, 1, 2], shapeTime: 45, fireTime: 14, spike: 0.12, band: [35, 65],
  },
  {
    name: 'Flower Vase', shape: { base: 0.4, belly: 0.44, at: 0.35, rim: 0.45 },
    glaze: [2, 0, 2], shapeTime: 40, fireTime: 16, spike: 0.14, band: [35, 65],
  },
  {
    name: 'Honey Jar', shape: { base: 0.45, belly: 0.48, at: 0.5, rim: 0.55 },
    glaze: [0, 2, 1], shapeTime: 40, fireTime: 16, spike: 0.16, band: [35, 65],
  },
  {
    name: 'Soup Bowl', shape: { base: 0.4, belly: 0.62, at: 0.5, rim: 0.92 },
    glaze: [1, 0, 1], shapeTime: 40, fireTime: 18, spike: 0.18, band: [35, 65],
  },
  {
    name: 'Water Pitcher', shape: { base: 0.42, belly: 0.44, at: 0.45, rim: 0.6 },
    glaze: [2, 2, 0], shapeTime: 38, fireTime: 18, spike: 0.2, band: [35, 65],
  },
  {
    name: 'Tall Bottle', shape: { base: 0.42, belly: 0.32, at: 0.3, rim: 0.38 },
    glaze: [0, 1, 2], shapeTime: 38, fireTime: 20, spike: 0.22, band: [35, 65],
  },
  {
    name: 'Storage Urn', shape: { base: 0.48, belly: 0.56, at: 0.55, rim: 0.58 },
    glaze: [1, 2, 2], shapeTime: 35, fireTime: 20, spike: 0.24, band: [35, 65],
  },
  {
    name: 'Tea Pot', shape: { base: 0.45, belly: 0.46, at: 0.5, rim: 0.5 },
    glaze: [2, 0, 0], shapeTime: 35, fireTime: 22, spike: 0.26, band: [35, 65],
  },
  {
    name: 'THE GREAT URN', shape: { base: 0.5, belly: 0.58, at: 0.5, rim: 0.55 },
    glaze: [0, 2, 1], shapeTime: 35, fireTime: 26, spike: 0.32, band: [35, 65],
    boss: true, bossName: 'THE CRACK',
  },
];

export const BOSS_PHASES = [
  { name: 'Phase 1 — Hairline', band: [30, 60] },
  { name: 'Phase 2 — Spreading', band: [45, 75] },
  { name: 'Phase 3 — The Break', band: [25, 55] },
];
