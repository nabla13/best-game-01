// Synthesised sound for LUMEN DRIFT: every effect and the music are built
// with WebAudio oscillators and filtered noise, so the game ships no audio
// files and makes no network request. The context starts on the first user
// gesture (browsers block audio before one); muted state persists per page.
export class AudioSys {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicOn = false;
    this._musicTimer = 0;
    this._musicStep = 0;
    this._noiseBuffer = null;
  }

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
      const length = this.ctx.sampleRate;
      this._noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this._noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  _tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _noise(dur, vol, filterFreq, type = 'lowpass') {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  shoot() { this._tone(720 + Math.random() * 120, 0.09, 'square', 0.10, 240); }
  hit() { this._noise(0.06, 0.12, 2400, 'bandpass'); }
  explode(big) {
    this._noise(big ? 0.55 : 0.3, big ? 0.5 : 0.3, big ? 500 : 900);
    this._tone(big ? 160 : 220, big ? 0.5 : 0.25, 'sine', 0.35, 40);
  }
  pickup() { this._tone(880, 0.08, 'sine', 0.16, 1320); }
  heart() { this._tone(523, 0.12, 'sine', 0.2, 784); this._tone(784, 0.16, 'sine', 0.16, 1046); }
  dash() { this._noise(0.18, 0.22, 1800, 'highpass'); }
  nova() {
    this._tone(110, 0.7, 'sawtooth', 0.3, 880);
    this._noise(0.7, 0.4, 700);
  }
  waveHorn() { this._tone(196, 0.35, 'triangle', 0.25, 392); }
  bossAlarm() {
    this._tone(110, 0.4, 'sawtooth', 0.25, 110);
    this._tone(165, 0.4, 'sawtooth', 0.2, 165);
  }
  hurt() { this._tone(180, 0.25, 'sawtooth', 0.3, 60); }
  click() { this._tone(660, 0.05, 'sine', 0.14, 660); }
  gameOver() {
    this._tone(392, 0.5, 'triangle', 0.25, 196);
    this._tone(196, 0.9, 'triangle', 0.25, 98);
  }
  victory() {
    [523, 659, 784, 1046].forEach((f, i) => {
      setTimeout(() => this._tone(f, 0.35, 'triangle', 0.22, f), i * 130);
    });
  }

  // A slow pulsing bass line with a soft hat, sequenced on the update tick
  // so it stays in time with the game loop. Silent until unlock() runs.
  startMusic() {
    this.musicOn = true;
  }

  update(dt) {
    if (!this.ctx || !this.musicOn || this.muted) return;
    this._musicTimer -= dt;
    if (this._musicTimer > 0) return;
    this._musicTimer = 0.21;
    const bass = [55, 0, 55, 0, 65.4, 0, 49, 0, 55, 0, 55, 0, 82.4, 0, 73.4, 0];
    const note = bass[this._musicStep % bass.length];
    this._musicStep += 1;
    if (note > 0) {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = note;
      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + 0.22);
    }
  }
}
