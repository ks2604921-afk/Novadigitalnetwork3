/** Synthesised cinematic intro sound (no audio file): whoosh → sub-bass hit → shimmer. */
export const INTRO_SOUND_KEY = 'nova-intro-sound';

export function introSoundEnabled() {
  try {
    return localStorage.getItem(INTRO_SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setIntroSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(INTRO_SOUND_KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable */
  }
}

export function playIntroSound(ctx: AudioContext) {
  const t0 = ctx.currentTime + 0.05;
  const master = ctx.createGain();
  master.gain.value = 0.8;

  // Simple space: feedback delay
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.23;
  const fb = ctx.createGain();
  fb.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  delay.connect(fb).connect(delay);
  delay.connect(wet).connect(ctx.destination);
  master.connect(ctx.destination);
  master.connect(delay);

  // 1. Rising whoosh (filtered noise) while the N draws
  const len = Math.floor(ctx.sampleRate * 1.6);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(250, t0);
  bp.frequency.exponentialRampToValueAtTime(3800, t0 + 1.1);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, t0);
  ng.gain.exponentialRampToValueAtTime(0.22, t0 + 0.9);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.45);
  noise.connect(bp).connect(ng).connect(master);
  noise.start(t0);
  noise.stop(t0 + 1.6);

  // 2. Sub-bass impact when the prism fills
  const hit = t0 + 1.05;
  const sub = ctx.createOscillator();
  sub.type = 'sine';
  sub.frequency.setValueAtTime(90, hit);
  sub.frequency.exponentialRampToValueAtTime(38, hit + 0.9);
  const sg = ctx.createGain();
  sg.gain.setValueAtTime(0.0001, hit);
  sg.gain.exponentialRampToValueAtTime(0.9, hit + 0.02);
  sg.gain.exponentialRampToValueAtTime(0.0001, hit + 2.2);
  sub.connect(sg).connect(master);
  sub.start(hit);
  sub.stop(hit + 2.3);

  // Low brass-like body for the hit
  const body = ctx.createOscillator();
  body.type = 'sawtooth';
  body.frequency.setValueAtTime(55, hit);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(900, hit);
  lp.frequency.exponentialRampToValueAtTime(120, hit + 1.6);
  const bg = ctx.createGain();
  bg.gain.setValueAtTime(0.0001, hit);
  bg.gain.exponentialRampToValueAtTime(0.18, hit + 0.04);
  bg.gain.exponentialRampToValueAtTime(0.0001, hit + 1.8);
  body.connect(lp).connect(bg).connect(master);
  body.start(hit);
  body.stop(hit + 1.9);

  // 3. Shimmer chord with the light sweep / OVA reveal
  const sh = t0 + 1.55;
  [659.25, 987.77, 1318.51, 1975.53].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.detune.value = (i % 2 ? 1 : -1) * 6;
    const g = ctx.createGain();
    const start = sh + i * 0.06;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(0.05, start + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 2.3);
    o.connect(g).connect(master);
    o.start(start);
    o.stop(start + 2.4);
  });
}
