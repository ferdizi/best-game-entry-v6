// KILNSONG audio: tiny WebAudio blips, one clear job. No assets, no network.
let ctx = null;
let muted = false;
export function isMuted() {
  return muted;
}
export function toggleMute() {
  muted = !muted;
  return muted;
}
function tone(freq, dur, type, gain) {
  if (muted) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain || 0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch (err) {
    // Audio is decoration; a blocked context must never break the game.
  }
}
export function blip() {
  tone(520, 0.07, 'sine', 0.05);
}
export function chime() {
  tone(660, 0.12, 'sine', 0.07);
  setTimeout(() => tone(880, 0.18, 'sine', 0.07), 90);
}
export function crack() {
  tone(140, 0.25, 'sawtooth', 0.09);
  setTimeout(() => tone(90, 0.3, 'sawtooth', 0.08), 80);
}
export function winFanfare() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.08), i * 130));
}
