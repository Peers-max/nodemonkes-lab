/**
 * Zero-dependency Web Audio Generative Ambient Synth & Lo-Fi Beats Engine
 * Generates chill, relaxing cyberpunk & ambient chords in real-time with live AnalyserNode FFT.
 */

class AudioSynthEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private masterGain: GainNode | null = null;
  private isPlayingState = false;
  private timerId: any = null;
  private currentTrack = 0;

  // Chord Progressions (Frequencies in Hz for ambient notes)
  // Track 1: Cyber Chill (Am9 - Fmaj7 - Cmaj7 - G6)
  // Track 2: Bitcoin Aurora (Dm7 - Em7 - Fmaj7 - Am)
  // Track 3: Deep Space (C#m7 - Amaj7 - Emaj7 - B7)
  private tracks = [
    [
      [220.0, 261.63, 329.63, 392.0, 493.88], // Am9
      [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj7
      [130.81, 164.81, 196.0, 246.94, 293.66], // Cmaj7
      [196.0, 246.94, 293.66, 329.63, 392.0], // G6
    ],
    [
      [146.83, 174.61, 220.0, 261.63, 329.63], // Dm7
      [164.81, 196.0, 246.94, 293.66, 349.23], // Em7
      [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj7
      [220.0, 261.63, 329.63, 392.0, 440.0], // Am
    ],
    [
      [138.59, 164.81, 207.65, 246.94, 277.18], // C#m7
      [220.0, 277.18, 329.63, 415.3, 493.88], // Amaj7
      [164.81, 207.65, 246.94, 329.63, 370.0], // Emaj7
      [246.94, 293.66, 370.0, 440.0, 493.88], // B7
    ],
  ];

  private chordIndex = 0;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.85;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play() {
    this.init();
    if (!this.ctx || this.isPlayingState) return;
    this.isPlayingState = true;

    this.playNextChord();
    this.timerId = setInterval(() => {
      this.playNextChord();
    }, 4000);
  }

  private playNextChord() {
    if (!this.ctx || !this.masterGain || !this.isPlayingState) return;

    const track = this.tracks[this.currentTrack % this.tracks.length];
    const chord = track[this.chordIndex % track.length];
    this.chordIndex++;

    const now = this.ctx.currentTime;
    const duration = 4.2;

    // Play each note in chord as warm soft synth pad
    chord.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Warm triangle / sine blend
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Soft low-pass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + idx * 120, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + duration);

      // Envelope: Slow attack & long release
      noteGain.gain.setValueAtTime(0.001, now);
      noteGain.gain.exponentialRampToValueAtTime(0.035, now + 1.2);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }

  public stop() {
    this.isPlayingState = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public toggle(): boolean {
    if (this.isPlayingState) {
      this.stop();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public nextTrack() {
    this.currentTrack = (this.currentTrack + 1) % this.tracks.length;
    this.chordIndex = 0;
  }

  public isPlaying(): boolean {
    return this.isPlayingState;
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol * 0.2)), this.ctx.currentTime);
    }
  }

  public getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(32);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

export const audioSynth = new AudioSynthEngine();
