// ============================================
// SoundGenerator — Web Audio API SFX
// ============================================

export class SoundGenerator {
  constructor() { this.ctx = null; this.enabled = true; }

  init() {
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { this.enabled = false; }
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  _playTone(freq, duration, type = 'square', vol = 0.15, decay = true) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    if (decay) gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(this.ctx.currentTime); osc.stop(this.ctx.currentTime + duration);
  }

  _playNoise(duration, vol = 0.1) {
    if (!this.enabled || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * vol;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain); gain.connect(this.ctx.destination); source.start();
  }

  playSlide() { this._playNoise(0.15, 0.08); this._playTone(200, 0.1, 'sine', 0.06); }

  playWallHit() {
    this._playTone(180, 0.12, 'square', 0.12);
    this._playTone(90, 0.15, 'sawtooth', 0.08);
    this._playNoise(0.08, 0.1);
  }

  playCoinCollect() {
    this._playTone(880, 0.08, 'square', 0.1);
    setTimeout(() => this._playTone(1100, 0.1, 'square', 0.1), 60);
  }

  playDeath() {
    this._playTone(440, 0.3, 'sawtooth', 0.15);
    setTimeout(() => this._playTone(220, 0.3, 'sawtooth', 0.12), 100);
    setTimeout(() => this._playTone(110, 0.4, 'sawtooth', 0.1), 200);
    this._playNoise(0.5, 0.12);
  }

  playExitReached() {
    [523, 659, 784, 1047].forEach((n, i) => {
      setTimeout(() => this._playTone(n, 0.2, 'square', 0.1), i * 100);
    });
  }

  playSwitch() {
    this._playTone(330, 0.1, 'square', 0.1);
    setTimeout(() => this._playTone(440, 0.15, 'square', 0.1), 80);
  }

  playSelect() { this._playTone(660, 0.08, 'square', 0.08); }
  playTideWarning() { this._playTone(150, 0.3, 'sine', 0.06, false); }
}

export const soundGen = new SoundGenerator();
