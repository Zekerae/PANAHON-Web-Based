// ===== PANAHON: CHRONO SHIFT - Web Audio Sound Engine =====

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgMusic = null;
    this.musicStarted = false;
    this.sfxGain = null;

    // Load persisted volume levels (0.0 to 1.0)
    let savedSfx = 0.8;
    let savedMusic = 0.75;
    try {
      if (typeof localStorage !== "undefined") {
        const s = localStorage.getItem("panahon_sfx_vol");
        if (s !== null) savedSfx = Math.max(0, Math.min(100, parseInt(s, 10))) / 100;
        const m = localStorage.getItem("panahon_music_vol");
        if (m !== null) savedMusic = Math.max(0, Math.min(100, parseInt(m, 10))) / 100;
      }
    } catch (_) {}

    this.sfxVolume = savedSfx;
    this.musicVolume = savedMusic;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    if (!this.musicStarted && !this.muted) {
      this.initBgMusic();
    }
  }

  getSfxDestination() {
    if (!this.ctx) return null;
    if (!this.sfxGain) {
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.ctx.destination);
    }
    return this.sfxGain;
  }

  initBgMusic() {
    if (!this.bgMusic) {
      try {
        this.bgMusic = new Audio("/BgMusic.mp3");
        this.bgMusic.loop = true;
        this.bgMusic.volume = this.musicVolume * 0.4;
      } catch (err) {
        console.warn("Could not initialize BgMusic:", err);
      }
    }
    if (this.bgMusic && !this.muted && !this.musicStarted) {
      this.bgMusic.play().then(() => {
        this.musicStarted = true;
      }).catch(() => {
        // Autoplay restrictions will be satisfied on next user gesture
      });
    }
  }

  startBgMusic() {
    this.initBgMusic();
    if (this.bgMusic && !this.muted) {
      this.bgMusic.volume = this.musicVolume * 0.4;
      this.bgMusic.play().then(() => {
        this.musicStarted = true;
      }).catch(() => {});
    }
  }

  stopBgMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
  }

  setMusicVolume(vol) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgMusic) {
      this.bgMusic.volume = this.musicVolume * 0.4;
    }
    try {
      localStorage.setItem("panahon_music_vol", String(Math.round(this.musicVolume * 100)));
    } catch (_) {}
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    try {
      localStorage.setItem("panahon_sfx_vol", String(Math.round(this.sfxVolume * 100)));
    } catch (_) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      if (this.bgMusic) {
        this.bgMusic.pause();
      }
    } else {
      if (this.bgMusic) {
        this.bgMusic.volume = this.musicVolume * 0.4;
        this.bgMusic.play().catch(() => {});
      } else {
        this.startBgMusic();
      }
    }
    return this.muted;
  }

  // --- Sound Effects ---

  btnClick() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(720, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.07);
  }

  diceRoll() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    for (let i = 0; i < 7; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180 + Math.random() * 260, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
      }, i * 65);
    }
  }

  moveStep() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(540, this.ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  portal() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.35);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.7);
  }

  clue() {
    this.clueDiscovery();
  }

  clueDiscovery() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;

    // 1. Ancient parchment unroll flutter
    [180, 260, 340].forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const pOsc = this.ctx.createOscillator();
        const pGain = this.ctx.createGain();
        pOsc.type = "triangle";
        pOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        pOsc.frequency.linearRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.08);
        pGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        pGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        pOsc.connect(pGain);
        pGain.connect(dest);
        pOsc.start();
        pOsc.stop(this.ctx.currentTime + 0.12);
      }, idx * 25);
    });

    // 2. Shimmering antique golden bell arpeggio (C5, E5, G5, C6, E6)
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.13, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
      }, 70 + i * 55);
    });
  }

  eventTrigger() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;

    // 1. Deep low-frequency timeline resonance rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(75, this.ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.6);
    subGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);
    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start();
    subOsc.stop(this.ctx.currentTime + 0.7);

    // 2. Mystical chronal shimmer sweep
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweepOsc.type = "sine";
    sweepOsc.frequency.setValueAtTime(220, this.ctx.currentTime);
    sweepOsc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.4);
    sweepGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.48);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(dest);
    sweepOsc.start();
    sweepOsc.stop(this.ctx.currentTime + 0.5);

    // 3. Bright chronal bell triad
    [659.25, 880, 1318.5].forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
      }, 180 + idx * 60);
    });
  }

  dangerAlarm() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;

    // 1. Heavy ominous drum thud
    const drumOsc = this.ctx.createOscillator();
    const drumGain = this.ctx.createGain();
    drumOsc.type = "triangle";
    drumOsc.frequency.setValueAtTime(95, this.ctx.currentTime);
    drumOsc.frequency.exponentialRampToValueAtTime(36, this.ctx.currentTime + 0.35);
    drumGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    drumGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    drumOsc.connect(drumGain);
    drumGain.connect(dest);
    drumOsc.start();
    drumOsc.stop(this.ctx.currentTime + 0.45);

    // 2. Dual urgent hazard warning alert pulses (diminished tension intervals)
    [0, 160].forEach((delay) => {
      setTimeout(() => {
        if (!this.ctx) return;
        [185, 233].forEach((f) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(f, this.ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(f * 0.92, this.ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.13);
          osc.connect(gain);
          gain.connect(dest);
          osc.start();
          osc.stop(this.ctx.currentTime + 0.15);
        });
      }, delay);
    });
  }

  artifact() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.38);
      }, i * 110);
    });
  }

  danger() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  paradox() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.setValueAtTime(80, this.ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(200, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.38);
  }

  victory() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
      }, i * 140);
    });
  }

  collapse() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.9);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.0);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.05);
  }

  turnStart() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.38);
      }, i * 65);
    });
  }

  stepHop() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(280, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(460, this.ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  tileLand() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.24);
  }

  abilityActivate() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [329.63, 440, 554.37, 659.25, 880, 1108.7].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.45);
      }, i * 45);
    });
  }

  timeFreeze() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    // Crystalline stasis chime cascade
    [880, 1174.66, 1396.91, 1760, 2093].reverse().forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.38);
      }, i * 40);
    });
    // Deep temporal sub thud
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(110, this.ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.6);
    subGain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);
    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start();
    subOsc.stop(this.ctx.currentTime + 0.7);
  }

  timeRift() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.52);
  }

  chatChirp() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(580, this.ctx.currentTime);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  // --- THEMATIC CHARACTER ABILITY IMMERSION AUDIO ---
  momentumSurge() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    // Rising kinetic sonic sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1180, this.ctx.currentTime + 0.38);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.48);

    // Sonic burst sub-thud
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(85, this.ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.4);
    subGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    subOsc.connect(subGain);
    subGain.connect(dest);
    subOsc.start();
    subOsc.stop(this.ctx.currentTime + 0.5);
  }

  trapPlant() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    // Double metallic ratchet click
    [0, 60, 140].forEach((delay, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i === 2 ? "triangle" : "square";
        osc.frequency.setValueAtTime(i === 2 ? 880 : (320 + i * 180), this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.09);
      }, delay);
    });
  }

  trapSnap() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    // Violent mechanical snare clamp
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(620, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(65, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  holyRepair() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    // Radiant celestial triad chord (C5, E5, G5, C6)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.13, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.7);
      }, idx * 45);
    });
  }

  shadowSwipe() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    // Dark phantom swoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(280, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);

    // Stolen loot coin sparkle
    setTimeout(() => {
      if (!this.ctx) return;
      const coin = this.ctx.createOscillator();
      const coinG = this.ctx.createGain();
      coin.type = "sine";
      coin.frequency.setValueAtTime(1760, this.ctx.currentTime);
      coin.frequency.setValueAtTime(2637, this.ctx.currentTime + 0.05);
      coinG.gain.setValueAtTime(0.12, this.ctx.currentTime);
      coinG.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      coin.connect(coinG);
      coinG.connect(dest);
      coin.start();
      coin.stop(this.ctx.currentTime + 0.3);
    }, 90);
  }

  decipherScroll() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    // Ancient golden parchment shimmer
    [440, 554.37, 659.25, 880, 1108.73].forEach((f, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.11, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.38);
      }, idx * 40);
    });
  }

  chronalRewind() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    // Reverse time tape warble
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(540, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.3);
    osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.55);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
  }
}

export const sounds = new SoundManager();
export default sounds;
