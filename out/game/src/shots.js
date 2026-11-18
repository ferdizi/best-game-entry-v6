// KILNSONG screenshot scenes behind ?shot=start|play|boss|end.
// Each stages a real world (no fake pixels): the play scene shapes a real
// commission halfway toward its ghost; the boss stages the final kiln
// mid-spike; the end stages a finished win. Same seed, same frame, every time.
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_CARD, beginGame, setupCommission, targetProfile } from './world.js';
import { lerp } from './random.js';

export function stageShot(name, world) {
  if (name === 'card') {
    beginGame(world);
    world.commissionIndex = 2;
    world.screen = SCREEN_CARD;
    world.stars = 7;
    world.hearts = 3;
    world.lastCard = { name: 'Flower Vase', shapeAcc: 0.88, glazeAcc: 0.67, fireAcc: 0.82, stars: 2, boss: false };
    world.results = [
      { name: 'Little Bowl', stars: 3 }, { name: 'Tea Cup', stars: 2 },
      { name: 'Flower Vase', stars: 2 },
    ];
    return { screen: 'card', best: world.stars };
  }
  if (name === 'end') {
    world.screen = SCREEN_OVER;
    world.won = true;
    world.stars = 24;
    world.hearts = 3;
    world.commissionIndex = 9;
    world.phase = 'fire';
    world.results = [
      { name: 'Little Bowl', stars: 3 }, { name: 'Tea Cup', stars: 2 },
      { name: 'Flower Vase', stars: 3 }, { name: 'Honey Jar', stars: 2 },
      { name: 'Soup Bowl', stars: 3 }, { name: 'Water Pitcher', stars: 2 },
      { name: 'Tall Bottle', stars: 2 }, { name: 'Storage Urn', stars: 3 },
      { name: 'Tea Pot', stars: 2 }, { name: 'THE GREAT URN', stars: 2 },
    ];
    world.lastCard = { name: 'THE GREAT URN', shapeAcc: 0.88, glazeAcc: 1, fireAcc: 0.71, stars: 2, boss: true };
    return { screen: SCREEN_OVER, best: world.stars };
  }
  beginGame(world);
  if (name !== 'play' && name !== 'boss') {
    world.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'boss') {
    world.commissionIndex = 9;
    setupCommission(world);
    const target = targetProfile({ shape: { base: 0.5, belly: 0.58, at: 0.5, rim: 0.55 } });
    world.profile = target;
    world.glazePainted = [0, 2, 1];
    world.phase = 'fire';
    world.temp = 82;
    world.spikeActive = 1.0;
    world.spikeTimer = 3;
    world.fireProgress = 48;
    world.fireInBand = 9;
    world.fireTotal = 14;
    world.bossPhase = 1;
    world.stars = 18;
    world.hearts = 2;
    world.log = ['THE CRACK flares! Vent hard!', 'Phase 2 — Spreading — the green band moved!'];
    return { screen: SCREEN_PLAY, best: world.stars };
  }
  world.commissionIndex = 3;
  setupCommission(world);
  const target = targetProfile({ shape: { base: 0.45, belly: 0.48, at: 0.5, rim: 0.55 } });
  world.profile = target.map((t) => lerp(0.55, t, 0.6));
  world.shapeTimeLeft = 22;
  world.stars = 9;
  world.hearts = 3;
  world.log = ['Commission 4 of 10: Honey Jar. Drag the clay to match the ghost shape.'];
  return { screen: SCREEN_PLAY, best: world.stars };
}
