// KILNSONG input: mouse + keyboard, one clear job.
// Hands the world pointer drags, clicks, and key presses; never owns rules.
export function attachInput(canvas, world, hooks) {
  const rect = () => canvas.getBoundingClientRect();
  const toGame = (e) => {
    const r = rect();
    return {
      x: ((e.clientX - r.left) / r.width) * 1280,
      y: ((e.clientY - r.top) / r.height) * 720,
    };
  };
  let dragging = false;

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    dragging = true;
    const p = toGame(e);
    hooks.press(p.x, p.y);
    world.pointer = { x: p.x, y: p.y, down: true };
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toGame(e);
    world.pointer = { x: p.x, y: p.y, down: dragging };
    if (dragging) hooks.drag(p.x, p.y);
  });
  const endDrag = (e) => {
    dragging = false;
    const p = toGame(e);
    world.pointer = { x: p.x, y: p.y, down: false };
    hooks.release(p.x, p.y);
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (k === 'enter') hooks.start();
    else if (k === 'r') hooks.restart();
    else if (k === 'p') hooks.pause();
    else if (k === 'm') hooks.mute();
    else if (k === ' ') { e.preventDefault(); hooks.hold(true); }
    else if (k === '1' || k === '2' || k === '3') hooks.glaze(Number(k) - 1);
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === ' ') hooks.hold(false);
  });
}
