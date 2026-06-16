// Procedural sound effects via the Web Audio API -- no asset files needed.
//
// A single, lazily-created AudioContext synthesizes short noise bursts for
// placing/breaking blocks and footsteps, plus a quiet ambient wind pad.
// Browsers require a user gesture before audio can start, so the context is
// created/resumed on first use (placing or breaking a block is a click, so
// by the time anything plays the gesture requirement is already satisfied).
//
// Hooked into the place/remove paths in Chunk.jsx and the movement loop in
// Player.js. Press M in-game to mute/unmute.

let ctx = null;
let masterGain = null;
let noiseBuffer = null;
let enabled = true;
let ambient = null; // { source, gain } once started

function getCtx() {
  if (typeof window === "undefined") {
    return null;
  }
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      return null;
    }
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.6;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    // resume() is a no-op (and harmless) when called outside a gesture; the
    // first place/break click will successfully resume it
    ctx.resume().catch(() => {});
  }
  return ctx;
}

// One second of white noise, reused by every burst.
function getNoiseBuffer(c) {
  if (!noiseBuffer) {
    const len = Math.floor(c.sampleRate);
    noiseBuffer = c.createBuffer(1, len, c.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return noiseBuffer;
}

// A short filtered-noise blip with a fast attack and exponential decay --
// the building block for the chunky, lo-fi block sounds.
function noiseBurst({ duration, gain, freq, q = 1, type = "lowpass", rate = 1 }) {
  const c = getCtx();
  if (!c || !enabled) {
    return;
  }
  const now = c.currentTime;

  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  src.loop = true;
  // a random window into the noise keeps repeated sounds from sounding identical
  src.loopStart = Math.random() * 0.5;
  src.loopEnd = src.loopStart + 0.4;
  src.playbackRate.value = rate;

  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;

  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(gain, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);

  src.start(now);
  src.stop(now + duration + 0.05);
}

// Breaking a block: a longer, fuller crunch.
export function playBreak() {
  noiseBurst({ duration: 0.22, gain: 0.5, freq: 1400, q: 0.8 });
}

// Placing a block: a shorter, lower "thunk".
export function playPlace() {
  noiseBurst({ duration: 0.13, gain: 0.45, freq: 700, q: 1.1 });
}

// A footstep: very short and quiet, with a touch of random pitch so a run
// doesn't sound robotic.
export function playFootstep() {
  noiseBurst({
    duration: 0.09,
    gain: 0.16,
    freq: 420 + Math.random() * 260,
    q: 0.7,
    rate: 0.85 + Math.random() * 0.3,
  });
}

// A continuous, barely-there wind pad for ambience. Safe to call repeatedly;
// it only ever starts one source.
export function startAmbient() {
  const c = getCtx();
  if (!c || ambient) {
    return;
  }
  const src = c.createBufferSource();
  src.buffer = getNoiseBuffer(c);
  src.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 320;
  filter.Q.value = 0.4;

  const g = c.createGain();
  g.gain.value = enabled ? 0.04 : 0;

  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start();

  ambient = { source: src, gain: g };
}

export function setSoundEnabled(on) {
  enabled = on;
  if (ambient) {
    ambient.gain.gain.value = on ? 0.04 : 0;
  }
}

export function isSoundEnabled() {
  return enabled;
}

export function toggleSound() {
  setSoundEnabled(!enabled);
  return enabled;
}
