// src/components/zombie/MoonWarriorsAudio.ts

export class MoonWarriorsAudio {
  private bgmAudio: HTMLAudioElement | null = null;
  private currentBgmTrack: string = '';
  private sfxPool: Map<string, HTMLAudioElement[]> = new Map();
  private poolSize: number = 8;
  public enabled: boolean = true;
  public volume: number = 0.7;

  private soundUrls: Record<string, string> = {
    bgMusic: '/games/moonwarriors/sound/bgMusic.mp3',
    mainMenu: '/games/moonwarriors/sound/mainMainMusic.mp3',
    fire: '/games/moonwarriors/sound/fireEffect.mp3',
    explode: '/games/moonwarriors/sound/explodeEffect.mp3',
    shipDestroy: '/games/moonwarriors/sound/shipDestroyEffect.mp3',
    button: '/games/moonwarriors/sound/buttonEffet.mp3',
  };

  constructor() {
    this.initPools();
  }

  private initPools() {
    if (typeof window === 'undefined') return;

    ['fire', 'explode', 'shipDestroy', 'button'].forEach((key) => {
      const pool: HTMLAudioElement[] = [];
      const url = this.soundUrls[key];
      for (let i = 0; i < this.poolSize; i++) {
        const audio = new Audio(url);
        audio.preload = 'auto';
        pool.push(audio);
      }
      this.sfxPool.set(key, pool);
    });
  }

  public playBGM(track: 'bgMusic' | 'mainMenu' = 'bgMusic') {
    if (!this.enabled || typeof window === 'undefined') return;
    const url = this.soundUrls[track];

    if (this.bgmAudio && this.currentBgmTrack === track && !this.bgmAudio.paused) {
      return;
    }

    this.stopBGM();

    try {
      this.bgmAudio = new Audio(url);
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = Math.min(1, this.volume * 0.75);
      this.currentBgmTrack = track;
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay policy may restrict before user gesture
        });
      }
    } catch {
      // Audio play catch
    }
  }

  public stopBGM() {
    if (this.bgmAudio) {
      try {
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.bgmAudio = null;
      this.currentBgmTrack = '';
    }
  }

  public playFire() {
    this.playSFX('fire', 0.4);
  }

  public playExplode() {
    this.playSFX('explode', 0.8);
  }

  public playShipDestroy() {
    this.playSFX('shipDestroy', 1.0);
  }

  public playButton() {
    this.playSFX('button', 0.6);
  }

  private playSFX(key: string, volScale: number = 1.0) {
    if (!this.enabled || typeof window === 'undefined') return;

    const pool = this.sfxPool.get(key);
    if (!pool || pool.length === 0) {
      const url = this.soundUrls[key];
      if (url) {
        const audio = new Audio(url);
        audio.volume = Math.min(1, Math.max(0, this.volume * volScale));
        audio.play().catch(() => {});
      }
      return;
    }

    // Find available audio or least playing one
    let target = pool.find((a) => a.paused || a.ended);
    if (!target) {
      target = pool[0];
      target.currentTime = 0;
    }

    try {
      target.volume = Math.min(1, Math.max(0, this.volume * volScale));
      target.play().catch(() => {});
    } catch {
      // ignore
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stopBGM();
    } else if (this.currentBgmTrack) {
      this.playBGM(this.currentBgmTrack as 'bgMusic' | 'mainMenu');
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.min(1, Math.max(0, vol));
    if (this.bgmAudio) {
      this.bgmAudio.volume = Math.min(1, this.volume * 0.75);
    }
  }
}
