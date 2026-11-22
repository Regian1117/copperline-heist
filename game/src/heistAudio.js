/* Procedural Web Audio API sound effects and alarm-scaled tension heartbeat. */

let audioCtx = null;
let muted = false;
let beatClock = 0;

export function playHeistCue(cueName) {
  if (muted) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (cueName === 'step') {
    playTone(ctx, 'triangle', 110, 68, 0.055, 0.04, now);
  } else if (cueName === 'coin') {
    playTone(ctx, 'sine', 2480, 2240, 0.14, 0.08, now);
    playTone(ctx, 'sine', 3720, 3410, 0.18, 0.05, now + 0.03);
  } else if (cueName === 'jammer') {
    playTone(ctx, 'sawtooth', 760, 140, 0.34, 0.09, now);
    playTone(ctx, 'sine', 380, 95, 0.38, 0.08, now + 0.02);
  } else if (cueName === 'smoke') {
    playNoiseBurst(ctx, 0.42, 950, 0.075, now);
  } else if (cueName === 'bypass') {
    playTone(ctx, 'triangle', 540, 810, 0.11, 0.08, now);
    playTone(ctx, 'triangle', 810, 1180, 0.14, 0.08, now + 0.09);
  } else if (cueName === 'vault') {
    playTone(ctx, 'triangle', 440, 440, 0.18, 0.09, now);
    playTone(ctx, 'triangle', 554, 554, 0.22, 0.09, now + 0.08);
    playTone(ctx, 'triangle', 659, 659, 0.3, 0.1, now + 0.16);
  } else if (cueName === 'caught') {
    playTone(ctx, 'sawtooth', 196, 118, 0.42, 0.13, now);
    playTone(ctx, 'sawtooth', 148, 92, 0.48, 0.12, now + 0.06);
  } else if (cueName === 'getaway') {
    [330, 415, 494, 659].forEach((freq, i) => {
      playTone(ctx, 'triangle', freq, freq * 1.01, 0.38, 0.085, now + i * 0.075);
    });
  }
}

export function pulseTensionHeartbeat(alarm, dt) {
  if (muted || alarm < 25) {
    beatClock = 0;
    return;
  }
  const interval = Math.max(0.42, 1.05 - ((alarm - 25) / 75) * 0.62);
  beatClock += dt;
  if (beatClock >= interval) {
    beatClock -= interval;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const gain = 0.045 + (alarm / 100) * 0.07;
    playTone(ctx, 'sine', 64, 42, 0.12, gain, now);
    playTone(ctx, 'sine', 58, 38, 0.11, gain * 0.72, now + 0.14);
  }
}

export function setAudioMuted(nextMuted) {
  muted = Boolean(nextMuted);
  return muted;
}

export function isAudioMuted() {
  return muted;
}

function ensureAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(ctx, type, startFreq, endFreq, duration, volume, startTime) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playNoiseBurst(ctx, duration, cutoffHz, volume, startTime) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(cutoffHz, startTime);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(startTime);
  src.stop(startTime + duration + 0.02);
}
