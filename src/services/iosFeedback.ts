// iOS-style Haptic & Touch Audio Feedback Engine
// Synthesizes authentic iPhone taptic motor vibrations & clean UI touch sounds

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let hapticsEnabled = true;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play authentic iPhone UI touch sounds synthesized via Web Audio API
 */
export function playTouchSound(type: 'tap' | 'pop' | 'slide' | 'play' | 'success' | 'cinema' | 'install' = 'tap') {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'tap') {
      // iPhone button / keyboard tap: crisp, ultra-short high-frequency click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.014);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.014);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.015);
    } else if (type === 'pop') {
      // iOS modal / card tap: soft bubble pop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.028);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'slide') {
      // iOS swipe / scroll slide sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.018);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.02);
    } else if (type === 'play') {
      // Movie play activation tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc2.frequency.setValueAtTime(880.0, now + 0.03); // A5

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.025);
      osc1.stop(now + 0.08);
      osc2.stop(now + 0.09);
    } else if (type === 'cinema') {
      // Cinema Theatre Opening Bass & Projector Chord
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(85, now);
      subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.6);

      subGain.gain.setValueAtTime(0.25, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.65);

      // Harmonious brass shimmer
      const chordOsc = ctx.createOscillator();
      const chordGain = ctx.createGain();
      chordOsc.type = 'triangle';
      chordOsc.frequency.setValueAtTime(440, now + 0.05);
      chordOsc.frequency.exponentialRampToValueAtTime(659.25, now + 0.35);

      chordGain.gain.setValueAtTime(0.12, now + 0.05);
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      chordOsc.connect(chordGain);
      chordGain.connect(ctx.destination);
      chordOsc.start(now + 0.05);
      chordOsc.stop(now + 0.55);
    } else if (type === 'install') {
      // Digital installation blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.setValueAtTime(880.0, now + 0.04);
      osc.frequency.setValueAtTime(1174.66, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      // iOS success chime (dual harmonious bell)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.05); // E6

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    }
  } catch {}
}

/**
 * Trigger authentic Device Motor vibration feedback (Taptic / Haptic Engine)
 */
export function motorVibrate(pattern: number | number[] = 25) {
  if (!hapticsEnabled) return;
  if (typeof window === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {}
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'cinema' = 'light') {
  if (!hapticsEnabled) return;
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'selection':
        navigator.vibrate(18);
        break;
      case 'light':
        navigator.vibrate(25);
        break;
      case 'medium':
        navigator.vibrate(35);
        break;
      case 'heavy':
        navigator.vibrate([40, 30, 40]);
        break;
      case 'cinema':
        navigator.vibrate([35, 50, 45]);
        break;
      case 'success':
        navigator.vibrate([25, 40, 30]);
        break;
    }
  } catch {}
}

/**
 * Combined iOS Feedback: triggers both Device Motor vibration + subtle UI Touch Sound
 */
export function iosFeedback(type: 'tap' | 'pop' | 'slide' | 'play' | 'success' | 'cinema' | 'install' = 'tap') {
  playTouchSound(type);

  switch (type) {
    case 'tap':
      triggerHaptic('light');
      break;
    case 'pop':
      triggerHaptic('medium');
      break;
    case 'slide':
      triggerHaptic('selection');
      break;
    case 'play':
      triggerHaptic('heavy');
      break;
    case 'cinema':
      triggerHaptic('cinema');
      break;
    case 'install':
      triggerHaptic('medium');
      break;
    case 'success':
      triggerHaptic('success');
      break;
  }
}
