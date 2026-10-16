// Web Audio API beep sound generator for Rest Timer completion
export function playRestTimerBeep() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    
    // Play a 3-pip pleasant chime
    const playPip = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playPip(587.33, now, 0.15); // D5
    playPip(739.99, now + 0.18, 0.15); // F#5
    playPip(880.00, now + 0.36, 0.4); // A5

    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 300]);
    }
  } catch (e) {
    console.warn('Could not play timer sound:', e);
  }
}
