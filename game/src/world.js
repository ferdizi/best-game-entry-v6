// KILNSONG world: state, rules, and the pot. One clear job: own the game.
// Screens: title, play (shape / glaze / fire), card, over.
// Win: finish all 10 commissions. Lose: 3 hearts gone.
import {
  VIEW, STEP, PROFILE_ROWS, MAX_HEARTS, PASS_SHAPE,
  COMMISSIONS, BOSS_PHASES, GLAZES,
} from './config.js';
import { makeRandom, clamp, lerp } from './random.js';
import { blip, chime, crack, winFanfare } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CARD = 'card';
export const SCREEN_OVER = 'over';

export const LAYOUT = {
  wheelX: 470, wheelY: 440, wheelR: 205,
  potBaseY: 560, potMaxH: 330, potMaxR: 150,
  panelX: 790, panelW: 430,
  doneBtn: { x: 1060, y: 620, w: 150, h: 52 },
  startBtn: { x: 540, y: 520, w: 200, h: 56 },
  nextBtn: { x: 540, y: 510, w: 220, h: 56 },
};

export function targetProfile(commission) {
  const s = commission.shape;
  const out = [];
  for (let i = 0; i < PROFILE_ROWS; i += 1) {
    const t = i / (PROFILE_ROWS - 1);
    const bump = s.belly * Math.exp(-(((t - s.at) / 0.18) ** 2));
    const r = s.rim + (s.base - s.rim) * ((1 - t) ** 1.5) + bump;
    out.push(clamp(r, 0.15, 1));
  }
  return out;
}

export function createWorld(seed) {
  const world = {
    seed,
    rng: makeRandom(seed),
    screen: SCREEN_TITLE,
    phase: 'shape',
    paused: false,
    commissionIndex: 0,
    profile: new Array(PROFILE_ROWS).fill(0.55),
    heightFactor: 1,
    wobble: 0,
    shapeTimeLeft: 45,
    glazePainted: [null, null, null],
    selectedGlaze: 0,
    temp: 50,
    venting: false,
    fireProgress: 0,
    fireInBand: 0,
    fireTotal: 0,
    bossPhase: 0,
    spikeTimer: 4,
    spikeActive: 0,
    hearts: MAX_HEARTS,
    stars: 0,
    results: [],
    lastCard: null,
    won: false,
    spin: 0,
    time: 0,
    log: ['Welcome to the studio. Press ENTER to throw your first pot.'],
    pointer: { x: 0, y: 0, down: false },
    lastPointer: null,
  };
  return world;
}

export function commission(world) {
  return COMMISSIONS[world.commissionIndex];
}
export function isBoss(world) {
  return !!commission(world).boss;
}
export function currentBand(world) {
  if (!isBoss(world)) return commission(world).band;
  return BOSS_PHASES[world.bossPhase].band;
}

function say(world, msg) {
  world.log.push(msg);
  if (world.log.length > 3) world.log.shift();
}

export function setupCommission(world) {
  const c = commission(world);
  world.profile = new Array(PROFILE_ROWS).fill(0.55);
  world.heightFactor = 1;
  world.wobble = 0;
  world.shapeTimeLeft = c.shapeTime;
  world.glazePainted = [null, null, null];
  world.selectedGlaze = 0;
  world.temp = 50;
  world.venting = false;
  world.fireProgress = 0;
  world.fireInBand = 0;
  world.fireTotal = 0;
  world.bossPhase = 0;
  world.spikeTimer = 3 + world.rng() * 3;
  world.spikeActive = 0;
  world.phase = 'shape';
  world.lastPointer = null;
}

export function beginGame(world) {
  world.screen = SCREEN_PLAY;
  world.commissionIndex = 0;
  world.hearts = MAX_HEARTS;
  world.stars = 0;
  world.results = [];
  world.lastCard = null;
  world.won = false;
  world.paused = false;
  world.time = 0;
  setupCommission(world);
  say(world, `Commission 1 of 10: ${commission(world).name}. Drag the clay to match the ghost shape.`);
}

export function shapeAccuracy(world) {
  const target = targetProfile(commission(world));
  let diff = 0;
  for (let i = 0; i < PROFILE_ROWS; i += 1) diff += Math.abs(world.profile[i] - target[i]);
  const mean = diff / PROFILE_ROWS;
  return clamp(1 - mean / 0.35, 0, 1);
}
export function glazeAccuracy(world) {
  const target = commission(world).glaze;
  let hit = 0;
  for (let i = 0; i < 3; i += 1) if (world.glazePainted[i] === target[i]) hit += 1;
  return hit / 3;
}

function loseHeart(world, why) {
  world.hearts -= 1;
  crack();
  if (why) say(world, why);
  if (world.hearts <= 0) {
    world.screen = SCREEN_OVER;
    world.won = false;
    say(world, 'Out of clay. The studio goes quiet.');
    return true;
  }
  return false;
}

export function submitShape(world, auto) {
  const acc = shapeAccuracy(world);
  if (acc >= PASS_SHAPE) {
    world.phase = 'glaze';
    chime();
    say(world, `Shape ${Math.round(acc * 100)}% — good enough. Now glaze: pick a colour, paint the three bands.`);
    return;
  }
  say(world, auto
    ? `Time! Shape only ${Math.round(acc * 100)}% — a heart of clay is lost.`
    : `Shape only ${Math.round(acc * 100)}% (need ${Math.round(PASS_SHAPE * 100)}%). A heart of clay is lost.`);
  if (loseHeart(world, '')) return;
  setupCommission(world);
  say(world, `Try the ${commission(world).name} again — slow, steady hands.`);
}

export function submitGlaze(world) {
  const acc = glazeAccuracy(world);
  world.phase = 'fire';
  chime();
  say(world, acc >= 2 / 3
    ? `Glaze ${Math.round(acc * 100)}% — into the kiln. Hold SPACE or the mouse to vent; keep the needle in the green.`
    : `Glaze ${Math.round(acc * 100)}% — the pattern is off, but the kiln waits. Hold SPACE or the mouse to vent.`);
}

function finishCommission(world) {
  const shapeAcc = shapeAccuracy(world);
  const glazeAcc = glazeAccuracy(world);
  const fireAcc = world.fireTotal > 0 ? clamp(world.fireInBand / world.fireTotal, 0, 1) : 1;
  const avg = (shapeAcc + glazeAcc + fireAcc) / 3;
  const stars = avg >= 0.9 ? 3 : avg >= 0.75 ? 2 : 1;
  world.stars += stars;
  const card = {
    name: commission(world).name, shapeAcc, glazeAcc, fireAcc, stars,
    boss: isBoss(world),
  };
  world.results.push(card);
  world.lastCard = card;
  if (world.commissionIndex >= COMMISSIONS.length - 1) {
    world.screen = SCREEN_OVER;
    world.won = true;
    winFanfare();
    say(world, `All ten commissions fired. ${world.stars} of 30 stars — Master Potter.`);
    return;
  }
  world.screen = SCREEN_CARD;
  chime();
  say(world, `${card.name}: ${stars} star${stars > 1 ? 's' : ''}. Press ENTER for the next commission.`);
}

function stepShape(world, dt) {
  world.shapeTimeLeft -= dt;
  const p = world.pointer;
  if (p.down && world.lastPointer) {
    const dx = p.x - world.lastPointer.x;
    const dy = p.y - world.lastPointer.y;
    const potH = LAYOUT.potMaxH * world.heightFactor;
    const rowFloat = clamp(((LAYOUT.potBaseY - p.y) / potH) * PROFILE_ROWS, 0, PROFILE_ROWS - 1);
    const row = Math.round(rowFloat);
    const speed = Math.abs(dx) + Math.abs(dy);
    world.wobble = clamp(world.wobble + speed * 0.0012, 0, 1);
    const steady = world.wobble > 0.7 ? 0.5 : 1;
    for (let i = 0; i < PROFILE_ROWS; i += 1) {
      const dist = Math.abs(i - row);
      const fall = dist === 0 ? 1 : dist === 1 ? 0.6 : dist === 2 ? 0.3 : 0;
      if (fall > 0) {
        world.profile[i] = clamp(world.profile[i] + dx * 0.004 * fall * steady, 0.15, 1);
      }
    }
    world.heightFactor = clamp(world.heightFactor - dy * 0.0016, 0.8, 1.25);
  }
  world.lastPointer = p.down ? { x: p.x, y: p.y } : null;
  world.wobble = clamp(world.wobble - dt * 0.45, 0, 1);
  if (world.shapeTimeLeft <= 0) {
    world.shapeTimeLeft = 0;
    submitShape(world, true);
  }
}

function stepFire(world, dt) {
  const c = commission(world);
  const band = currentBand(world);
  world.fireTotal += dt;
  world.spikeTimer -= dt;
  if (world.spikeTimer <= 0) {
    world.spikeActive = 1.2;
    world.spikeTimer = 4 + world.rng() * 4;
    say(world, isBoss(world) ? 'THE CRACK flares! Vent hard!' : 'Heat spike! Vent hard!');
  }
  if (world.spikeActive > 0) world.spikeActive -= dt;
  const rise = 6 + (world.spikeActive > 0 ? 18 : 0) + (isBoss(world) ? world.bossPhase * 2 : 0);
  const vent = world.venting || world.pointer.down ? -24 : 0;
  world.temp = clamp(world.temp + (rise + vent) * dt, 0, 100);
  if (world.temp >= band[0] && world.temp <= band[1]) {
    world.fireProgress += (dt / c.fireTime) * 100;
    world.fireInBand += dt;
  }
  if (isBoss(world)) {
    const nextPhase = Math.min(2, Math.floor(world.fireProgress / 34));
    if (nextPhase !== world.bossPhase) {
      world.bossPhase = nextPhase;
      say(world, `${BOSS_PHASES[world.bossPhase].name} — the green band moved!`);
    }
  }
  if (world.temp >= 100) {
    say(world, 'CRACK! The kiln ran too hot — a heart of clay is lost.');
    if (loseHeart(world, '')) return;
    world.temp = 50;
    world.fireProgress = Math.max(0, world.fireProgress - 25);
    world.spikeActive = 0;
  }
  if (world.fireProgress >= 100) {
    world.fireProgress = 100;
    finishCommission(world);
  }
}

export function stepWorld(world, dt, input) {
  if (world.screen !== SCREEN_PLAY || world.paused) return;
  world.time += dt;
  world.spin += dt * 2.4;
  if (world.phase === 'shape') stepShape(world, dt);
  else if (world.phase === 'fire') stepFire(world, dt);
}

export function potPoint(world, row) {
  const potH = LAYOUT.potMaxH * world.heightFactor;
  const y = LAYOUT.potBaseY - ((row + 0.5) / PROFILE_ROWS) * potH;
  const r = world.profile[row] * LAYOUT.potMaxR;
  return { x: LAYOUT.wheelX, y, r };
}
export function bandAt(world, x, y) {
  const potH = LAYOUT.potMaxH * world.heightFactor;
  const top = LAYOUT.potBaseY - potH;
  if (x < LAYOUT.wheelX - LAYOUT.potMaxR || x > LAYOUT.wheelX + LAYOUT.potMaxR) return -1;
  if (y < top || y > LAYOUT.potBaseY) return -1;
  const frac = (y - top) / potH; // 0 rim, 1 foot
  return frac < 1 / 3 ? 0 : frac < 2 / 3 ? 1 : 2;
}
function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function press(world, x, y) {
  if (world.screen === SCREEN_TITLE) {
    if (inRect(x, y, LAYOUT.startBtn)) beginGame(world);
    return;
  }
  if (world.screen === SCREEN_CARD) {
    if (inRect(x, y, LAYOUT.nextBtn)) {
      world.commissionIndex += 1;
      world.screen = SCREEN_PLAY;
      setupCommission(world);
      say(world, `Commission ${world.commissionIndex + 1} of 10: ${commission(world).name}.`);
    }
    return;
  }
  if (world.screen === SCREEN_OVER) {
    if (inRect(x, y, LAYOUT.nextBtn)) beginGame(world);
    return;
  }
  if (world.screen !== SCREEN_PLAY || world.paused) return;
  if (world.phase === 'shape') {
    if (inRect(x, y, LAYOUT.doneBtn)) submitShape(world, false);
    return;
  }
  if (world.phase === 'glaze') {
    // Glaze swatches live in the right panel: three squares, keys 1-3.
    for (let i = 0; i < 3; i += 1) {
      const sw = { x: LAYOUT.panelX + i * 64, y: 300, w: 52, h: 52 };
      if (inRect(x, y, sw)) {
        world.selectedGlaze = i;
        blip();
        return;
      }
    }
    const band = bandAt(world, x, y);
    if (band >= 0) {
      world.glazePainted[band] = world.selectedGlaze;
      blip();
      return;
    }
    if (inRect(x, y, LAYOUT.doneBtn)) submitGlaze(world);
    return;
  }
  if (world.phase === 'fire') {
    world.venting = true;
  }
}
export function release(world) {
  world.venting = false;
}
export function selectGlaze(world, i) {
  if (world.screen === SCREEN_PLAY && world.phase === 'glaze') {
    world.selectedGlaze = i;
    blip();
  }
}
export function startKey(world) {
  if (world.screen === SCREEN_TITLE) beginGame(world);
  else if (world.screen === SCREEN_CARD) {
    world.commissionIndex += 1;
    world.screen = SCREEN_PLAY;
    setupCommission(world);
    say(world, `Commission ${world.commissionIndex + 1} of 10: ${commission(world).name}.`);
  } else if (world.screen === SCREEN_OVER) beginGame(world);
  else if (world.screen === SCREEN_PLAY && !world.paused) {
    if (world.phase === 'shape') submitShape(world, false);
    else if (world.phase === 'glaze') submitGlaze(world);
  }
}
export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh);
  world.screen = SCREEN_TITLE;
}
export { VIEW, STEP };
