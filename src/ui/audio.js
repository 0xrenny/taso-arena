// WebAudio ile basit efekt sesleri (dosya yok).
let ctx = null;
let enabled = true;
export const setSound = (on) => { enabled = on; };

function ac() {
  if (!enabled) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq, dur, type = 'sine', vol = 0.2, delay = 0, slideTo = null) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, vol = 0.2, delay = 0, hp = 800) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + delay;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(); s.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination); s.start(t);
}

export const sfx = {
  click: () => tone(660, 0.06, 'square', 0.06),
  slam: (power = 1) => { tone(160, 0.25, 'sine', 0.5 * power, 0, 45); noise(0.12, 0.25 * power, 0, 300); },
  flip: (i = 0) => { tone(900 + i * 120, 0.07, 'triangle', 0.12, 0.05 + i * 0.07); noise(0.04, 0.08, 0.05 + i * 0.07, 3000); },
  perfect: () => { [784, 988, 1175].forEach((f, i) => tone(f, 0.12, 'square', 0.08, i * 0.06)); },
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'square', 0.09, i * 0.11)); },
  lose: () => { [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.07, i * 0.15)); },
  pack: () => { noise(0.35, 0.25, 0, 1500); tone(300, 0.3, 'triangle', 0.1, 0.25, 900); },
  levelUp: () => { [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.15, 'triangle', 0.12, i * 0.08)); },
  tick: () => tone(1200, 0.02, 'square', 0.03),
};
