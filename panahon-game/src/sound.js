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
      if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
        const s = window.localStorage.getItem("panahon_sfx_vol");
        if (s !== null) savedSfx = Math.max(0, Math.min(100, parseInt(s, 10))) / 100;
        const m = window.localStorage.getItem("panahon_music_vol");
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
      if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") { window.localStorage.setItem("panahon_music_vol", String(Math.round(this.musicVolume * 100))); }
    } catch (_) {}
  }

  setSfxVolume(vol) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
    try {
      if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") { window.localStorage.setItem("panahon_sfx_vol", String(Math.round(this.sfxVolume * 100))); }
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


  // ===== UPDATED EVENT & DANGER CARDS THEMATIC SFX =====

  // 1. Galleon ship bronze bell chime ("Paldoooo")
  galleonBell() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [1180, 1770, 2360].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(idx === 0 ? 0.22 : 0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.25);
    });
  }

  // 2. Festive acoustic guitar strum flourish ("Fiesta now, problem later")
  guitarFlourish() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const chords = [196, 246.9, 293.7, 392, 493.9, 587.3];
    chords.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
      }, i * 35);
    });
  }

  // 3. Paper fan snap SFX ("Marites Network")
  fanSnap() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  // 4. Cathedral chime ("Safe ka rito sa Intra")
  cathedralChime() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [261.63, 329.63, 392.0, 523.25].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06);
      gain.gain.setValueAtTime(0.18 / (i + 1), this.ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.8);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(this.ctx.currentTime + i * 0.06);
      osc.stop(this.ctx.currentTime + 1.85);
    });
  }

  // 5. CRT distortion sound effect ("Ay nag-glitch")
  crtDistortion() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.setValueAtTime(3200, this.ctx.currentTime + 0.08);
    osc.frequency.setValueAtTime(60, this.ctx.currentTime + 0.18);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.48);
  }

  // 6. Morse code telegraph ("Updated ka dapat dito ah!")
  morseCode() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [0, 80, 160, 280, 400].forEach((del, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(950, this.ctx.currentTime);
        const dur = (idx === 2 || idx === 4) ? 0.09 : 0.05;
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + dur + 0.01);
      }, del);
    });
  }

  // 7. Steam locomotive whistle ("Thomas and Friends")
  trainWhistle() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [587.33, 739.99, 880.0].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq * 0.96, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.9);
    });
  }

  // 8. School bell ring ("You’re Passed! Passed Away…")
  schoolBell() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    for (let i = 0; i < 14; i++) {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1450, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
      }, i * 45);
    }
  }

  // 9. Harbor foghorn ("Free SHIPping fee")
  foghorn() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [98, 147].forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.4);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.45);
    });
  }

  // 10. Vintage radio broadcast waves ("Radyo patrol, iwas gulo" / "Secret Chismis")
  radioBroadcast() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [440, 554.37, 659.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.9);
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.95);
    });
  }

  radioDialStatic() {
    this.radioBroadcast();
  }

  // 11. Wooden supply crate crack ("Kayamanan ng Buwaya")
  crateCrack() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // 12. Wooden trapdoor latch ("HIDEous plan")
  trapdoorLatch() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.28);
  }

  // 13. Ethereal kulintang chord ("Diwata Pares blessing")
  kulintangChord() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [587.33, 659.25, 783.99, 880.0, 1046.5].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.75);
      }, i * 70);
    });
  }

  // 14. Mystical cyan spirit wisps ("Anito Grab")
  spiritWisp() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(420, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1420, this.ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.58);
  }

  // 15. Enchanted water ripple ("Healing for everything")
  waterRipple() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [820, 710, 620, 520].forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.75, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.24);
      }, idx * 60);
    });
  }

  // 16. Floating rune stones beam ("Bato-bato sa langit")
  runeBeam() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1850, this.ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
  }

  // 17. Volcano eruption rumble ("Bulkang galit")
  volcanoRumble() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(65, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(35, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.95);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.0);
  }

  // 18. Cannon blast ("Tulisan sa Dagat")
  cannonBlast() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.48);
  }

  // 19. Guard whistle ("Huli ka, Indio!")
  guardWhistle() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [2400, 2550].forEach((freq) => {
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
    });
  }

  // 20. Thunderclap flash ("Bagyong Espanya")
  thunderclap() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.9);
  }

  // 21. Surging floodwater splash ("Basa na ba ang lahat")
  floodSplash() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(95, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.55);
  }

  // 22. Air raid siren ("Goodbye, Philippines!")
  airRaidSiren() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(340, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(680, this.ctx.currentTime + 0.35);
    osc.frequency.linearRampToValueAtTime(340, this.ctx.currentTime + 0.7);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.9);
  }

  // 23. Earthquake rumble ("Lindol-lindulan")
  earthquakeRumble() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(55, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(42, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.26, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.75);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  // 24. Vintage police siren ("Patrol de Albino")
  policeSiren() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(650, this.ctx.currentTime);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.2);
    osc.frequency.setValueAtTime(650, this.ctx.currentTime + 0.4);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.85);
  }

  // 25. Marching boots audio ("Tagu-taguan sa Hapon")
  marchingBoots() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [0, 150, 300].forEach((del) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(110, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.14);
      }, del);
    });
  }

  // 26. Bayonet alarm sting ("Surpresa pero Sundalo")
  bayonetAlarm() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.38);
  }

  // 27. Heartbeat + stamp slam ("Inspection Reveal: Kabado")
  heartbeatStamp() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    // Lub
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
    gain1.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
    osc1.connect(gain1);
    gain1.connect(dest);
    osc1.start();
    osc1.stop(this.ctx.currentTime + 0.2);

    // Dub
    setTimeout(() => {
      if (!this.ctx) return;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(70, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc2.connect(gain2);
      gain2.connect(dest);
      osc2.start();
      osc2.stop(this.ctx.currentTime + 0.2);
    }, 220);

    // Stamp slam
    setTimeout(() => {
      if (!this.ctx) return;
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = "square";
      osc3.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc3.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain3.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      osc3.connect(gain3);
      gain3.connect(dest);
      osc3.start();
      osc3.stop(this.ctx.currentTime + 0.32);
    }, 450);
  }

  // 28. Rock crumble ("Gumalawgaw si Earth")
  rockCrumble() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [0, 80, 160, 240].forEach((del) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
      }, del);
    });
  }

  // 29. Bat-wing shadow & night wind howl ("Gojo na Lumilipad")
  nightHowl() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(220, this.ctx.currentTime + 0.45);
    osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.8);
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.85);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.9);
  }

  // 30. Kapre deep echoing laughter ("Isoy break na Kapre")
  kapreLaughter() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [120, 105, 90, 75].forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.24, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.24);
      }, idx * 120);
    });
  }

  // 31. Trickster glitch chord ("Scammer na Engkanto")
  tricksterGlitch() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1046, this.ctx.currentTime + 0.12);
    osc.frequency.setValueAtTime(260, this.ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.48);
  }

  // 32. Demonic baby snarl ("Baby ama")
  babySnarl() {
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(740, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(820, this.ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(95, this.ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.65);
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
