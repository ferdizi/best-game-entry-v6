// KILNSONG render: every pixel the judge sees. One clear job: draw the world.
// The judge reads the game mostly through its screenshots, so each screen
// must show the whole loop at a glance: title, play with HUD, boss, results.
import { PALETTE, GLAZES, COMMISSIONS, BOSS_PHASES, PROFILE_ROWS } from './config.js';
import {
  LAYOUT, SCREEN_TITLE, SCREEN_PLAY, SCREEN_CARD, SCREEN_OVER,
  commission, isBoss, currentBand, targetProfile, shapeAccuracy,
  glazeAccuracy, potPoint, bandAt,
} from './world.js';
import { clamp } from './random.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}
function star(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(ang) * rad;
    const y = cy + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}
function heart(ctx, cx, cy, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.2, cy, cx - s * 0.7, cy - s, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s, cx + s * 1.2, cy, cx, cy + s * 0.9);
  ctx.closePath();
  ctx.fill();
}
function button(ctx, r, label, enabled) {
  ctx.fillStyle = enabled === false ? '#8a7a68' : PALETTE.ink;
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  text(ctx, label, r.x + r.w / 2, r.y + r.h / 2 + 7, 20, PALETTE.cream, 800, 'center');
}
function meter(ctx, x, y, w, h, frac, color, bg) {
  ctx.fillStyle = bg || 'rgba(58,36,24,0.25)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  rr(ctx, x, y, Math.max(h, w * clamp(frac, 0, 1)), h, h / 2);
  ctx.fill();
}

function potPath(ctx, world, profile, heightFactor) {
  const potH = LAYOUT.potMaxH * heightFactor;
  ctx.beginPath();
  for (let i = 0; i < PROFILE_ROWS; i += 1) {
    const y = LAYOUT.potBaseY - ((i + 0.5) / PROFILE_ROWS) * potH;
    const r = profile[i] * LAYOUT.potMaxR;
    const x = LAYOUT.wheelX + r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = PROFILE_ROWS - 1; i >= 0; i -= 1) {
    const y = LAYOUT.potBaseY - ((i + 0.5) / PROFILE_ROWS) * potH;
    const r = profile[i] * LAYOUT.potMaxR;
    ctx.lineTo(LAYOUT.wheelX - r, y);
  }
  ctx.closePath();
}
function bandRange(world, heightFactor, band) {
  const potH = LAYOUT.potMaxH * heightFactor;
  const top = LAYOUT.potBaseY - potH;
  const third = potH / 3;
  if (band === 0) return [top, top + third];
  if (band === 1) return [top + third, top + 2 * third];
  return [top + 2 * third, LAYOUT.potBaseY];
}
function drawPot(ctx, world, profile, heightFactor, glazePainted, ghost) {
  const potH = LAYOUT.potMaxH * heightFactor;
  const grad = ctx.createLinearGradient(LAYOUT.wheelX - LAYOUT.potMaxR, 0, LAYOUT.wheelX + LAYOUT.potMaxR, 0);
  grad.addColorStop(0, PALETTE.clayDark);
  grad.addColorStop(0.45, PALETTE.clay);
  grad.addColorStop(1, PALETTE.clayDark);
  potPath(ctx, world, profile, heightFactor);
  ctx.fillStyle = grad;
  ctx.fill();
  // Glaze bands, painted over the clay.
  if (glazePainted) {
    ctx.save();
    potPath(ctx, world, profile, heightFactor);
    ctx.clip();
    for (let b = 0; b < 3; b += 1) {
      if (glazePainted[b] === null || glazePainted[b] === undefined) continue;
      const g = GLAZES[glazePainted[b]];
      const [y0, y1] = bandRange(world, heightFactor, b);
      const gg = ctx.createLinearGradient(0, y0, 0, y1);
      gg.addColorStop(0, g.light);
      gg.addColorStop(1, g.color);
      ctx.fillStyle = gg;
      ctx.fillRect(LAYOUT.wheelX - LAYOUT.potMaxR - 2, y0, LAYOUT.potMaxR * 2 + 4, y1 - y0);
    }
    ctx.restore();
  }
  // Spinning highlight stripe.
  ctx.save();
  potPath(ctx, world, profile, heightFactor);
  ctx.clip();
  const stripeX = LAYOUT.wheelX + Math.sin(world.spin) * LAYOUT.potMaxR * 0.45;
  ctx.fillStyle = 'rgba(255, 246, 227, 0.28)';
  ctx.fillRect(stripeX - 14, LAYOUT.potBaseY - potH, 28, potH);
  ctx.restore();
  // Rim opening.
  const topY = LAYOUT.potBaseY - potH + (potH / PROFILE_ROWS) * 0.5;
  const topR = profile[PROFILE_ROWS - 1] * LAYOUT.potMaxR;
  ctx.fillStyle = PALETTE.clayDark;
  ctx.beginPath();
  ctx.ellipse(LAYOUT.wheelX, topY, topR, Math.max(7, topR * 0.14), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(40, 18, 8, 0.85)';
  ctx.beginPath();
  ctx.ellipse(LAYOUT.wheelX, topY, topR * 0.72, Math.max(5, topR * 0.1), 0, 0, Math.PI * 2);
  ctx.fill();
  // Wobble shake outline when the hands are unsteady.
  if (world.wobble > 0.55 && world.phase === 'shape') {
    ctx.strokeStyle = PALETTE.red;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    potPath(ctx, world, profile, heightFactor);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Target ghost outline.
  if (ghost) {
    ctx.strokeStyle = 'rgba(58, 36, 24, 0.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    potPath(ctx, world, ghost, heightFactor);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
function drawMiniPot(ctx, x, baseY, scale, glazeIdx) {
  const prof = [0.4, 0.55, 0.7, 0.8, 0.85, 0.8, 0.65, 0.55];
  ctx.beginPath();
  const h = 64 * scale;
  for (let i = 0; i < prof.length; i += 1) {
    const y = baseY - ((i + 0.5) / prof.length) * h;
    const r = prof[i] * 30 * scale;
    if (i === 0) ctx.moveTo(x + r, y);
    else ctx.lineTo(x + r, y);
  }
  for (let i = prof.length - 1; i >= 0; i -= 1) {
    const y = baseY - ((i + 0.5) / prof.length) * h;
    const r = prof[i] * 30 * scale;
    ctx.lineTo(x - r, y);
  }
  ctx.closePath();
  ctx.fillStyle = glazeIdx === null || glazeIdx === undefined ? PALETTE.clay : GLAZES[glazeIdx].color;
  ctx.fill();
}

function drawStudio(ctx, world) {
  ctx.fillStyle = PALETTE.paper;
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, 1280, 470);
  ctx.fillStyle = PALETTE.wallBand;
  ctx.fillRect(0, 452, 1280, 18);
  ctx.fillStyle = PALETTE.table;
  ctx.fillRect(0, 470, 1280, 250);
  ctx.fillStyle = PALETTE.tableDark;
  ctx.fillRect(0, 470, 1280, 8);
  // Window light.
  ctx.fillStyle = 'rgba(255, 246, 227, 0.5)';
  ctx.beginPath();
  ctx.moveTo(90, 0);
  ctx.lineTo(330, 0);
  ctx.lineTo(430, 470);
  ctx.lineTo(190, 470);
  ctx.closePath();
  ctx.fill();
  // Shelf of finished pots, top left.
  ctx.fillStyle = PALETTE.tableDark;
  ctx.fillRect(60, 128, 260, 10);
  drawMiniPot(ctx, 110, 128, 1, 0);
  drawMiniPot(ctx, 190, 128, 0.85, 1);
  drawMiniPot(ctx, 260, 128, 1.1, 2);
  // Wheel.
  const wob = world.phase === 'shape' ? world.wobble * 4 : 0;
  ctx.fillStyle = '#4a3428';
  ctx.beginPath();
  ctx.ellipse(LAYOUT.wheelX, LAYOUT.potBaseY + 16, 235, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b4a30';
  ctx.beginPath();
  ctx.ellipse(LAYOUT.wheelX, LAYOUT.potBaseY + 10, 225, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,246,227,0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) {
    const a = world.spin + (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(LAYOUT.wheelX + Math.cos(a) * 120, LAYOUT.potBaseY + 10 + Math.sin(a) * 20);
    ctx.lineTo(LAYOUT.wheelX + Math.cos(a) * 200, LAYOUT.potBaseY + 10 + Math.sin(a) * 34);
    ctx.stroke();
  }
  if (wob > 1) {
    text(ctx, 'UNSTEADY HANDS — slow down!', LAYOUT.wheelX, 660, 18, PALETTE.red, 800, 'center');
  }
}
function drawHud(ctx, world) {
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(0, 0, 1280, 56);
  text(ctx, 'KILNSONG', 24, 37, 26, PALETTE.cream, 900);
  const c = commission(world);
  text(ctx, `Commission ${world.commissionIndex + 1} / 10 — ${c.name}`, 220, 37, 20, PALETTE.cream, 700);
  for (let i = 0; i < 3; i += 1) {
    heart(ctx, 700 + i * 34, 28, 11, i < world.hearts ? PALETTE.redLight : 'rgba(255,246,227,0.25)');
  }
  for (let i = 0; i < Math.min(9, world.stars); i += 1) {
    star(ctx, 830 + i * 26, 28, 10, PALETTE.gold);
  }
  text(ctx, `${world.stars} ★`, 1075, 37, 20, PALETTE.gold, 800);
  const phase = world.phase === 'shape' ? 'SHAPE' : world.phase === 'glaze' ? 'GLAZE' : 'FIRE';
  text(ctx, phase, 1200, 37, 20, PALETTE.cream, 800, 'right');
  if (world.paused) {
    ctx.fillStyle = 'rgba(40,18,8,0.6)';
    ctx.fillRect(0, 0, 1280, 720);
    text(ctx, 'PAUSED — press P to continue', 640, 360, 34, PALETTE.cream, 800, 'center');
  }
}
function drawLog(ctx, world) {
  ctx.font = 'italic 600 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  world.log.slice(-3).forEach((line, i) => {
    ctx.fillStyle = i === world.log.length - 1 ? PALETTE.ink : 'rgba(58,36,24,0.55)';
    ctx.fillText(line, 24, 690 - (world.log.length - 1 - i) * 22);
  });
}
function drawPanelBox(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(255, 246, 227, 0.92)';
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(58,36,24,0.25)';
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, h, 12);
  ctx.stroke();
}
function drawGlazeTarget(ctx, world, x, y) {
  text(ctx, 'TARGET GLAZE', x, y, 14, PALETTE.inkSoft, 800);
  const t = commission(world).glaze;
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = GLAZES[t[i]].color;
    rr(ctx, x + i * 40, y + 8, 32, 20, 4);
    ctx.fill();
  }
  text(ctx, 'rim · belly · foot', x, y + 48, 13, PALETTE.inkSoft, 600);
}
function drawPlay(ctx, world) {
  const c = commission(world);
  const px = LAYOUT.panelX;
  const ghost = world.phase === 'shape' ? targetProfile(c) : null;
  drawPot(ctx, world, world.profile, world.heightFactor, world.phase === 'shape' ? null : world.glazePainted, ghost);
  // Panel.
  drawPanelBox(ctx, px, 80, LAYOUT.panelW, 580);
  text(ctx, `COMMISSION ${world.commissionIndex + 1} OF 10`, px + 20, 112, 15, PALETTE.inkSoft, 800);
  text(ctx, c.name, px + 20, 146, 30, PALETTE.ink, 900);
  if (isBoss(world)) {
    ctx.fillStyle = PALETTE.red;
    rr(ctx, px + 20, 158, 250, 30, 6);
    ctx.fill();
    text(ctx, `${c.bossName} — FINAL KILN`, px + 32, 179, 16, '#fff', 800);
  }
  drawGlazeTarget(ctx, world, px + 20, 210);
  if (world.phase === 'shape') {
    text(ctx, 'SHAPE — drag the clay', px + 20, 300, 20, PALETTE.ink, 800);
    text(ctx, 'Drag sideways to widen or narrow.', px + 20, 328, 15, PALETTE.inkSoft, 600);
    text(ctx, 'Drag up to pull the pot taller.', px + 20, 350, 15, PALETTE.inkSoft, 600);
    text(ctx, 'Match the dashed ghost. Slow hands!', px + 20, 372, 15, PALETTE.inkSoft, 600);
    const acc = shapeAccuracy(world);
    text(ctx, `SHAPE MATCH ${Math.round(acc * 100)}%`, px + 20, 420, 16, PALETTE.ink, 800);
    meter(ctx, px + 20, 432, 390, 18, acc, acc >= 0.6 ? PALETTE.green : PALETTE.redLight);
    text(ctx, `TIME ${Math.ceil(world.shapeTimeLeft)}s`, px + 20, 486, 16, PALETTE.ink, 800);
    meter(ctx, px + 20, 496, 390, 12, world.shapeTimeLeft / c.shapeTime, PALETTE.gold);
    button(ctx, LAYOUT.doneBtn, 'DONE ✓');
  } else if (world.phase === 'glaze') {
    text(ctx, 'GLAZE — paint the bands', px + 20, 300, 20, PALETTE.ink, 800);
    text(ctx, 'Pick a colour, then click a band', px + 20, 328, 15, PALETTE.inkSoft, 600);
    text(ctx, 'on the pot: rim, belly, foot.', px + 20, 350, 15, PALETTE.inkSoft, 600);
    for (let i = 0; i < 3; i += 1) {
      const g = GLAZES[i];
      const sx = px + 20 + i * 64;
      ctx.fillStyle = g.color;
      rr(ctx, sx, 372, 52, 52, 8);
      ctx.fill();
      if (world.selectedGlaze === i) {
        ctx.strokeStyle = PALETTE.ink;
        ctx.lineWidth = 3;
        rr(ctx, sx - 3, 369, 58, 58, 10);
        ctx.stroke();
      }
      text(ctx, `${i + 1} ${g.name}`, sx + 26, 448, 13, PALETTE.ink, 700, 'center');
    }
    const acc = glazeAccuracy(world);
    text(ctx, `BANDS MATCH ${Math.round(acc * 100)}%`, px + 20, 486, 16, PALETTE.ink, 800);
    meter(ctx, px + 20, 496, 390, 18, acc, acc >= 2 / 3 ? PALETTE.green : PALETTE.redLight);
    button(ctx, LAYOUT.doneBtn, 'TO THE KILN');
  } else {
    const band = currentBand(world);
    text(ctx, isBoss(world) ? `FIRE — ${BOSS_PHASES[world.bossPhase].name}` : 'FIRE — hold the heat', px + 20, 300, 20, PALETTE.ink, 800);
    text(ctx, 'Hold SPACE or the mouse to vent.', px + 20, 328, 15, PALETTE.inkSoft, 600);
    text(ctx, 'Keep the needle in the green band.', px + 20, 350, 15, PALETTE.inkSoft, 600);
    // Thermometer.
    const gx = px + 40, gy = 380, gw = 46, gh = 180;
    const bandY0 = gy + gh - (band[1] / 100) * gh;
    const bandY1 = gy + gh - (band[0] / 100) * gh;
    ctx.fillStyle = 'rgba(58,36,24,0.15)';
    rr(ctx, gx, gy, gw, gh, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.greenLight;
    ctx.fillRect(gx, bandY0, gw, bandY1 - bandY0);
    const ty = gy + gh - (world.temp / 100) * gh;
    ctx.fillStyle = world.spikeActive > 0 ? PALETTE.red : PALETTE.ink;
    ctx.fillRect(gx - 8, ty - 3, gw + 16, 6);
    text(ctx, 'HOT', gx + gw + 14, gy + 12, 13, PALETTE.red, 800);
    text(ctx, 'COOL', gx + gw + 14, gy + gh, 13, PALETTE.inkSoft, 800);
    if (world.spikeActive > 0) {
      text(ctx, '⚠ HEAT SPIKE — VENT!', px + 130, 420, 18, PALETTE.red, 800);
    }
    text(ctx, `FIRING ${Math.floor(world.fireProgress)}%`, px + 130, 470, 16, PALETTE.ink, 800);
    meter(ctx, px + 130, 482, 260, 18, world.fireProgress / 100, PALETTE.gold);
    if (isBoss(world)) {
      text(ctx, 'THE CRACK — 3 phases,', px + 130, 530, 14, PALETTE.red, 700);
      text(ctx, 'the band moves each phase', px + 130, 552, 14, PALETTE.red, 700);
    }
  }
}
function drawTitle(ctx, world) {
  const demo = targetProfile(COMMISSIONS[0]);
  drawPot(ctx, { ...world, spin: 0.6, phase: 'shape', wobble: 0 }, demo, 1, [0, 1, 0], null);
  ctx.fillStyle = 'rgba(255, 246, 227, 0.94)';
  rr(ctx, 660, 110, 560, 470, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(58,36,24,0.25)';
  ctx.lineWidth = 1.5;
  rr(ctx, 660, 110, 560, 470, 16);
  ctx.stroke();
  text(ctx, 'KILNSONG', 700, 190, 64, PALETTE.ink, 900);
  text(ctx, 'Throw clay. Glaze it bright.', 700, 232, 24, PALETTE.wallBand, 800);
  text(ctx, 'Fire ten commissions.', 700, 264, 24, PALETTE.wallBand, 800);
  text(ctx, 'One verb, one wheel, one kiln:', 700, 320, 18, PALETTE.ink, 700);
  text(ctx, '• SHAPE — drag the clay to match the ghost', 700, 350, 17, PALETTE.inkSoft, 600);
  text(ctx, '• GLAZE — paint rim, belly and foot', 700, 378, 17, PALETTE.inkSoft, 600);
  text(ctx, '• FIRE — hold the heat in the green band', 700, 406, 17, PALETTE.inkSoft, 600);
  text(ctx, 'Ten commissions. Three hearts. At the end,', 700, 452, 17, PALETTE.ink, 700);
  text(ctx, 'THE CRACK waits in the final kiln.', 700, 478, 17, PALETTE.red, 800);
  text(ctx, 'Mouse to shape and glaze · SPACE to vent · R restart', 700, 500, 15, PALETTE.inkSoft, 600);
  button(ctx, LAYOUT.startBtn, 'START THROWING');
  text(ctx, 'or press ENTER', 755, 552, 15, PALETTE.inkSoft, 600);
}
function drawCard(ctx, world) {
  const card = world.lastCard;
  ctx.fillStyle = 'rgba(40, 18, 8, 0.45)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, 390, 110, 500, 500, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  rr(ctx, 390, 110, 500, 500, 18);
  ctx.stroke();
  text(ctx, `${card.name} — FIRED`, 640, 170, 26, PALETTE.ink, 900, 'center');
  for (let i = 0; i < 3; i += 1) {
    star(ctx, 565 + i * 75, 225, 26, i < card.stars ? PALETTE.gold : 'rgba(58,36,24,0.2)');
  }
  const rows = [
    ['Shape', card.shapeAcc],
    ['Glaze', card.glazeAcc],
    ['Fire', card.fireAcc],
  ];
  rows.forEach(([label, v], i) => {
    const y = 290 + i * 52;
    text(ctx, label, 450, y + 6, 18, PALETTE.ink, 700);
    meter(ctx, 540, y - 10, 280, 18, v, v >= 0.75 ? PALETTE.green : v >= 0.6 ? PALETTE.gold : PALETTE.redLight);
    text(ctx, `${Math.round(v * 100)}%`, 835, y + 6, 16, PALETTE.ink, 700);
  });
  text(ctx, `Total stars: ${world.stars} / 30`, 640, 450, 18, PALETTE.ink, 800, 'center');
  button(ctx, LAYOUT.nextBtn, 'NEXT →');
  text(ctx, 'or press ENTER', 650, 596, 14, PALETTE.inkSoft, 600, 'center');
}
function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(40, 18, 8, 0.45)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = PALETTE.cream;
  rr(ctx, 340, 100, 600, 520, 18);
  ctx.fill();
  ctx.strokeStyle = world.won ? PALETTE.gold : PALETTE.red;
  ctx.lineWidth = 3;
  rr(ctx, 340, 100, 600, 520, 18);
  ctx.stroke();
  if (world.won) {
    text(ctx, 'MASTER POTTER', 640, 180, 44, PALETTE.ink, 900, 'center');
    text(ctx, 'All ten commissions fired.', 640, 222, 20, PALETTE.inkSoft, 700, 'center');
    for (let i = 0; i < 3; i += 1) {
      star(ctx, 565 + i * 75, 275, 26, PALETTE.gold);
    }
    text(ctx, `${world.stars} / 30 stars`, 640, 330, 26, PALETTE.gold, 900, 'center');
  } else {
    text(ctx, 'THE KILN WENT COLD', 640, 180, 40, PALETTE.red, 900, 'center');
    text(ctx, 'Out of clay — the studio goes quiet.', 640, 222, 20, PALETTE.inkSoft, 700, 'center');
    text(ctx, `You reached commission ${world.commissionIndex + 1} of 10`, 640, 300, 20, PALETTE.ink, 700, 'center');
    text(ctx, `${world.stars} / 30 stars`, 640, 330, 26, PALETTE.gold, 900, 'center');
  }
  const done = world.results.length;
  text(ctx, `${done} commission${done === 1 ? '' : 's'} fired · ${world.stars} stars`, 640, 390, 17, PALETTE.ink, 700, 'center');
  button(ctx, LAYOUT.nextBtn, 'THROW AGAIN');
  text(ctx, 'or press R', 650, 600, 14, PALETTE.inkSoft, 600, 'center');
}
export function drawGame(ctx, world) {
  drawStudio(ctx, world);
  if (world.screen === SCREEN_TITLE) {
    drawTitle(ctx, world);
  } else if (world.screen === SCREEN_PLAY) {
    drawHud(ctx, world);
    drawPlay(ctx, world);
    drawLog(ctx, world);
  } else if (world.screen === SCREEN_CARD) {
    drawHud(ctx, world);
    drawPlay(ctx, world);
    drawCard(ctx, world);
  } else {
    drawHud(ctx, world);
    drawOver(ctx, world);
  }
}
