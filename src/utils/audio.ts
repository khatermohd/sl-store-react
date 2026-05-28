// Web Audio API custom sounds to guarantee flawless performance and zero network dependency

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Synthesizes an authentic wooden gavel (auction hammer) strike.
 * It combines a low wood knock and a higher-pitched impact pop.
 */
export function playBidSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Wood Gavel Body knock (Lower Frequency)
    const lowOsc = ctx.createOscillator();
    const lowGain = ctx.createGain();
    
    lowOsc.type = 'triangle';
    lowOsc.frequency.setValueAtTime(150, now);
    lowOsc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

    lowGain.gain.setValueAtTime(0.8, now);
    lowGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    lowOsc.connect(lowGain);
    lowGain.connect(ctx.destination);

    // Gavel Impact pop (Higher Frequency click)
    const highOsc = ctx.createOscillator();
    const highGain = ctx.createGain();

    highOsc.type = 'sine';
    highOsc.frequency.setValueAtTime(700, now);
    highOsc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

    highGain.gain.setValueAtTime(0.5, now);
    highGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    highOsc.connect(highGain);
    highGain.connect(ctx.destination);

    // Start & Stop
    lowOsc.start(now);
    lowOsc.stop(now + 0.15);

    highOsc.start(now);
    highOsc.stop(now + 0.06);
  } catch (error) {
    console.warn('Audio synthesis disabled or failed:', error);
  }
}

/**
 * Synthesizes a simple high-pitched click sound for a wheel tick.
 */
export function playWheelTickSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.setValueAtTime(800, now + 0.01);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch (error) {
    // Fail silently in unsupported browsers or restrictions
  }
}

/**
 * Synthesizes a beautiful triumph sound for winning an ad / coupon spin.
 */
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Direct chime notes: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.4);
    });
  } catch (error) {
    // Fail silently
  }
}
