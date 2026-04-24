// ============================================
// ParticleTrail — Movement trail VFX
// ============================================

export class ParticleTrail {
  constructor(scene) {
    this.scene = scene;
    this.emitter = null;
  }

  create(followTarget) {
    this.emitter = this.scene.add.particles(0, 0, 'particle', {
      speed: { min: 10, max: 40 },
      scale: { start: 1.2, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 400,
      blendMode: 'ADD',
      frequency: 20,
      follow: followTarget,
      emitting: false
    });
    this.emitter.setDepth(5);
  }

  start() { if (this.emitter) this.emitter.start(); }
  stop() { if (this.emitter) this.emitter.stop(); }
  destroy() { if (this.emitter) this.emitter.destroy(); }
}
