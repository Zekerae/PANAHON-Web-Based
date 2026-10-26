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
    if (this.muted || this.sfxVolume <= 0) return;
    this.init();
    const dest = this.getSfxDestination();
    if (!this.ctx || !dest) return;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
      }, i * 90);
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
}

export const sounds = new SoundManager();
export default sounds;
