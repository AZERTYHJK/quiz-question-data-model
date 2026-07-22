// Browser Web Audio API Synthesizer for high-fidelity offline audio

let audioCtx: AudioContext | null = null;
let bgMusicInterval: any = null;
let bgOscillators: OscillatorNode[] = [];
let bgGainNode: GainNode | null = null;
let isMuted = false;
let currentVolume = 0.3;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export const GameAudio = {
  toggleMute() {
    isMuted = !isMuted;
    if (isMuted) {
      this.stopBackgroundMusic();
    } else {
      // Background music can be restarted by the component if desired
    }
    return isMuted;
  },

  getMuted() {
    return isMuted;
  },

  playTick() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitched A5 click

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  },

  playCorrect() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Play a dual note major third chime (C5 & E5 -> G5)
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playNote(523.25, now, 0.4); // C5
    playNote(659.25, now + 0.08, 0.4); // E5
    playNote(783.99, now + 0.16, 0.5); // G5
  },

  playWrong() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // A down-slurring low flat buzz sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.4);
  },

  playStreak() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Quick ascending custom arpeggio
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50]; // C5 D5 E5 G5 A5 C6
    scale.forEach((freq, idx) => {
      const start = now + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(start);
      osc.stop(start + 0.25);
    });
  },

  playGameComplete() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Energetic happy fanfare chord
    const playNote = (freq: number, start: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Staccato notes followed by sustained chord
    playNote(523.25, now, 0.15, 0.15); // C5
    playNote(659.25, now + 0.15, 0.15, 0.15); // E5
    playNote(783.99, now + 0.3, 0.15, 0.15); // G5
    
    // Sustained glorious C major chord
    playNote(523.25, now + 0.45, 1.2, 0.1); // C5
    playNote(659.25, now + 0.45, 1.2, 0.1); // E5
    playNote(783.99, now + 0.45, 1.2, 0.1); // G5
    playNote(1046.50, now + 0.45, 1.2, 0.1); // C6
  },

  startBackgroundMusic() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    this.stopBackgroundMusic();

    bgGainNode = ctx.createGain();
    bgGainNode.gain.setValueAtTime(0.04, ctx.currentTime); // Soft background level
    bgGainNode.connect(ctx.destination);

    let step = 0;
    // Charming retro retro-electro arpeggiated bass progression
    const progression = [
      [130.81, 196.00, 261.63], // C3, G3, C4
      [146.83, 220.00, 293.66], // D3, A3, D4
      [164.81, 246.94, 329.63], // E3, B3, E4
      [174.61, 261.63, 349.23], // F3, C4, F4
    ];

    const playAmbientBeats = () => {
      const now = ctx!.currentTime;
      const chord = progression[step % progression.length];
      
      chord.forEach((freq, idx) => {
        const osc = ctx!.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.25);
        
        const noteGain = ctx!.createGain();
        noteGain.gain.setValueAtTime(0, now + idx * 0.25);
        noteGain.gain.linearRampToValueAtTime(0.5, now + idx * 0.25 + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.25 + 0.8);
        
        osc.connect(noteGain);
        noteGain.connect(bgGainNode!);
        
        osc.start(now + idx * 0.25);
        osc.stop(now + idx * 0.25 + 0.85);
        
        bgOscillators.push(osc);
      });
      step++;
    };

    // Play first beat immediately
    playAmbientBeats();
    
    // Loop every 2 seconds
    bgMusicInterval = setInterval(() => {
      const currentCtx = getAudioContext();
      if (currentCtx && currentCtx.state !== "suspended") {
        playAmbientBeats();
      }
    }, 2000);
  },

  stopBackgroundMusic() {
    if (bgMusicInterval) {
      clearInterval(bgMusicInterval);
      bgMusicInterval = null;
    }
    bgOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {}
    });
    bgOscillators = [];
    if (bgGainNode) {
      try {
        bgGainNode.disconnect();
      } catch (e) {}
      bgGainNode = null;
    }
  }
};
