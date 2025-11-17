export class AudioManager {
  private bgMusic: HTMLAudioElement | null = null;
  private idleSound: HTMLAudioElement | null = null;
  private engineSound: HTMLAudioElement | null = null;
  private crashSound: HTMLAudioElement | null = null;
  private successSound: HTMLAudioElement | null = null;
  private nitroSound: HTMLAudioElement | null = null;
  private shieldSound: HTMLAudioElement | null = null;
  private splashSound: HTMLAudioElement | null = null;
  private pickupSound: HTMLAudioElement | null = null;
  private brakeSound: HTMLAudioElement | null = null;
  private countdownBeep: HTMLAudioElement | null = null;
  private countdownGo: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private enginePlaying: boolean = false;
  private idlePlaying: boolean = false;
  private lastSpeed: number = 0;

  constructor() {
    this.initAudio();
  }

  private initAudio() {
    this.bgMusic = new Audio("/sounds/background.mp3");
    this.bgMusic.loop = true;
    this.bgMusic.volume = 0.3;

    this.idleSound = new Audio("/sounds/idle.mp3");
    this.idleSound.loop = true;
    this.idleSound.volume = 0.5;

    this.engineSound = new Audio("/sounds/acceleration.mp3");
    this.engineSound.loop = true;
    this.engineSound.volume = 0.4;
    this.engineSound.playbackRate = 0.8;

    this.crashSound = new Audio("/sounds/hit.mp3");
    this.crashSound.volume = 0.6;

    this.successSound = new Audio("/sounds/success.mp3");
    this.successSound.volume = 0.5;

    this.nitroSound = new Audio("/sounds/success.mp3");
    this.nitroSound.volume = 0.6;
    this.nitroSound.playbackRate = 1.3;

    this.shieldSound = new Audio("/sounds/success.mp3");
    this.shieldSound.volume = 0.5;
    this.shieldSound.playbackRate = 0.8;

    this.splashSound = new Audio("/sounds/hit.mp3");
    this.splashSound.volume = 0.4;
    this.splashSound.playbackRate = 1.2;

    this.pickupSound = new Audio("/sounds/success.mp3");
    this.pickupSound.volume = 0.5;

    this.brakeSound = new Audio("/sounds/hit.mp3");
    this.brakeSound.volume = 0.3;
    this.brakeSound.playbackRate = 0.7;

    this.countdownBeep = new Audio("/sounds/hit.mp3");
    this.countdownBeep.volume = 0.7;
    this.countdownBeep.playbackRate = 1.5;

    this.countdownGo = new Audio("/sounds/success.mp3");
    this.countdownGo.volume = 0.8;
  }

  playBackgroundMusic() {
    if (this.bgMusic && !this.isMuted) {
      this.bgMusic
        .play()
        .catch((err) => console.log("Audio play prevented:", err));
    }
  }

  stopBackgroundMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic.currentTime = 0;
    }
  }

  playCrash() {
    if (this.crashSound && !this.isMuted) {
      const clone = this.crashSound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.5;
      clone.play().catch((err) => console.log("Crash sound prevented:", err));
    }
  }

  playSuccess() {
    if (this.successSound && !this.isMuted) {
      const clone = this.successSound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.4;
      clone.play().catch((err) => console.log("Success sound prevented:", err));
    }
  }

  startEngineSound() {
    if (!this.engineSound || this.isMuted || this.enginePlaying) return;
    this.engineSound.loop = true;
    this.engineSound
      .play()
      .catch((err) => console.log("Engine sound prevented:", err));
    this.enginePlaying = true;
  }

  stopEngineSound() {
    if (this.engineSound) {
      this.engineSound.pause();
      this.engineSound.currentTime = 0;
      this.enginePlaying = false;
    }
    if (this.idleSound) {
      this.idleSound.pause();
      this.idleSound.currentTime = 0;
      this.idlePlaying = false;
    }
  }

  updateEngineSound(speed: number, isBraking: boolean = false) {
    if (this.isMuted) return;

    const idleThreshold = 5;

    if (speed < idleThreshold) {
      if (!this.idlePlaying && this.idleSound) {
        this.idleSound
          .play()
          .catch((err) => console.log("Idle sound prevented:", err));
        this.idlePlaying = true;
      }

      if (this.enginePlaying && this.engineSound) {
        this.engineSound.pause();
        this.engineSound.currentTime = 0;
        this.enginePlaying = false;
      }
    } else {
      if (this.idlePlaying && this.idleSound) {
        this.idleSound.pause();
        this.idleSound.currentTime = 0;
        this.idlePlaying = false;
      }

      if (!this.enginePlaying && this.engineSound) {
        this.engineSound
          .play()
          .catch((err) => console.log("Engine sound prevented:", err));
        this.enginePlaying = true;
      }

      if (this.engineSound) {
        const maxSpeed = 180;
        const minPitch = 0.8;
        const maxPitch = 2.8;
        const pitchRange = maxPitch - minPitch;
        const speedRatio = Math.min(speed / maxSpeed, 1);
        const pitchFactor = minPitch + speedRatio * pitchRange;

        this.engineSound.playbackRate = pitchFactor;
        let baseVolume = 0.05 + speedRatio * 0.05;

        if (speedRatio >= 0.95) {
          baseVolume = 0.5 + Math.sin(Date.now() / 100) * 0.03;
        }

        this.engineSound.volume = isBraking ? baseVolume * 0.5 : baseVolume;
      }
    }
  }

  playNitro() {
    console.log("[Audio] Playing nitro sound");
    if (this.nitroSound && !this.isMuted) {
      const clone = this.nitroSound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.6;
      clone.play().catch((err) => console.log("Nitro sound prevented:", err));
    }
  }

  playShield() {
    console.log("[Audio] Playing shield sound");
    if (this.shieldSound && !this.isMuted) {
      const clone = this.shieldSound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.5;
      clone.play().catch((err) => console.log("Shield sound prevented:", err));
    }
  }

  playSplash() {
    console.log("[Audio] Playing splash sound");
    if (this.splashSound && !this.isMuted) {
      const clone = this.splashSound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.4;
      clone.play().catch((err) => console.log("Splash sound prevented:", err));
    }
  }

  playPickup() {
    console.log("[Audio] Playing pickup sound");
    if (this.pickupSound && !this.isMuted) {
      const clone = this.pickupSound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.5;
      clone.play().catch((err) => console.log("Pickup sound prevented:", err));
    }
  }

  playBrake() {
    console.log("[Audio] Playing brake sound");
    if (this.brakeSound && !this.isMuted) {
      const clone = this.brakeSound.cloneNode() as HTMLAudioElement;
      clone.volume = 0.6;
      clone.playbackRate = 1.0;
      clone.play().catch((err) => console.log("Brake sound prevented:", err));
    }
  }

  playCountdownBeep() {
    if (this.countdownBeep && !this.isMuted) {
      const clone = this.countdownBeep.cloneNode() as HTMLAudioElement;
      clone.volume = 0.7;
      clone.playbackRate = 1.5;
      clone
        .play()
        .catch((err) => console.log("Countdown beep prevented:", err));
    }
  }

  playCountdownGo() {
    if (this.countdownGo && !this.isMuted) {
      const clone = this.countdownGo.cloneNode() as HTMLAudioElement;
      clone.volume = 0.8;
      clone.play().catch((err) => console.log("Countdown go prevented:", err));
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.bgMusic) this.bgMusic.pause();
      if (this.engineSound) this.engineSound.pause();
      if (this.idleSound) this.idleSound.pause();
    } else {
      if (this.bgMusic)
        this.bgMusic
          .play()
          .catch((err) => console.log("Audio play prevented:", err));
      if (this.engineSound && this.enginePlaying) {
        this.engineSound
          .play()
          .catch((err) => console.log("Engine sound prevented:", err));
      }
      if (this.idleSound && this.idlePlaying) {
        this.idleSound
          .play()
          .catch((err) => console.log("Idle sound prevented:", err));
      }
    }
    return this.isMuted;
  }

  cleanup() {
    this.stopBackgroundMusic();
    this.stopEngineSound();
    if (this.bgMusic) this.bgMusic.remove();
    if (this.idleSound) this.idleSound.remove();
    if (this.engineSound) this.engineSound.remove();
    if (this.crashSound) this.crashSound.remove();
    if (this.successSound) this.successSound.remove();
    if (this.nitroSound) this.nitroSound.remove();
    if (this.shieldSound) this.shieldSound.remove();
    if (this.splashSound) this.splashSound.remove();
    if (this.pickupSound) this.pickupSound.remove();
  }
}

export const audioManager = new AudioManager();
