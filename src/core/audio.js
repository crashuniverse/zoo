/**
 * Procedural game audio — no external files needed.
 * Uses Web Audio API to synthesize sounds.
 *
 * iOS Safari requirements:
 *  - AudioContext must be created + resumed in a user gesture (touchend/click)
 *  - A silent buffer must be played first to "unlock" audio output
 *  - Gain values must be high enough for phone speakers
 */

let ctx;
let footstepSource = null;
let footstepGain = null;
let masterGain = null;
let unlocked = false;

export function initAudio() {
  // Pre-create context so it's ready for the first gesture
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1.0;
    masterGain.connect(ctx.destination);
  }
}

/**
 * Must be called from a direct user gesture (click / touchend).
 * Resumes the context and plays a silent buffer to unlock iOS audio.
 */
export function unlockAudio() {
  if (!ctx) initAudio();
  if (ctx.state === 'suspended') ctx.resume();

  if (!unlocked) {
    // Play a tiny silent buffer — iOS Safari requires this to unlock output
    const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = silent;
    src.connect(ctx.destination);
    src.start();
    unlocked = true;
  }
}

/* ---------- Game start chime ---------- */
export function playStartSound() {
  if (!ctx) return;
  const now = ctx.currentTime;

  // Bright ascending chime — triangle waves are louder/richer than sine
  [440, 660, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t0 = now + i * 0.12;
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.45, t0 + 0.03);
    gain.gain.linearRampToValueAtTime(0.001, t0 + 0.4);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.45);
  });
}

/* ---------- Star collect sparkle ---------- */
export function playStarSound() {
  if (!ctx) return;
  const now = ctx.currentTime;

  // Ascending sparkle — triangle waves, higher gain
  [1200, 1500, 1800, 2200].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t0 = now + i * 0.06;
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(0.35, t0 + 0.02);
    gain.gain.linearRampToValueAtTime(0.001, t0 + 0.22);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.25);
  });
}

/* ---------- Soft footstep noise (looping) ---------- */
export function startFootsteps() {
  if (footstepSource) return;
  if (!ctx) return;

  // Low-pass filtered noise with rhythmic envelope — soft running on grass
  const bufLen = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);

  const stepRate = 5;
  for (let i = 0; i < bufLen; i++) {
    const t = i / ctx.sampleRate;
    const envelope = 0.5 + 0.5 * Math.sin(t * stepRate * Math.PI * 2);
    data[i] = (Math.random() * 2 - 1) * envelope;
  }

  footstepSource = ctx.createBufferSource();
  footstepSource.buffer = buf;
  footstepSource.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;

  footstepGain = ctx.createGain();
  footstepGain.gain.value = 0;

  footstepSource.connect(filter);
  filter.connect(footstepGain);
  footstepGain.connect(masterGain);
  footstepSource.start(0);
}

/** Set footstep volume (0 = silent, 1 = full). Call every frame. */
export function setFootstepVolume(v) {
  if (footstepGain) {
    footstepGain.gain.value = Math.min(v, 1) * 0.25;
  }
}
