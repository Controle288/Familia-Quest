// Lightweight synthesized sound effects via the Web Audio API.
// No asset files needed — every sound is generated on the fly.
// A module-level mute flag is persisted in localStorage.

let muted = false;
try {
  muted = localStorage.getItem('fq_muted') === '1';
} catch {
  muted = false;
}

export const isMuted = () => muted;

export const setMuted = (value: boolean) => {
  muted = value;
  try {
    localStorage.setItem('fq_muted', value ? '1' : '0');
  } catch {
    /* ignore */
  }
};

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(
  frequency: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'triangle',
  peakGain = 0.06
) {
  const ac = getContext();
  if (!ac) return;

  const oscillator = ac.createOscillator();
  const gain = ac.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  const startTime = ac.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain).connect(ac.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export function playComplete() {
  if (muted) return;
  tone(523.25, 0, 0.12, 'triangle'); // C5
  tone(659.25, 0.08, 0.16, 'triangle'); // E5
}

export function playReward() {
  if (muted) return;
  tone(659.25, 0, 0.1, 'triangle'); // E5
  tone(880.0, 0.09, 0.14, 'triangle'); // A5
  tone(1046.5, 0.18, 0.22, 'triangle'); // C6
}

export function playLevelUp() {
  if (muted) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => tone(freq, i * 0.09, 0.24, 'triangle', 0.07));
}

export function playError() {
  if (muted) return;
  tone(220.0, 0, 0.15, 'sawtooth', 0.04);
  tone(174.61, 0.1, 0.18, 'sawtooth', 0.04);
}

export function playClick() {
  if (muted) return;
  tone(440.0, 0, 0.05, 'square', 0.03);
}
