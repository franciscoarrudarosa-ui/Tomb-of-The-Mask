// ============================================
// RisingTide — Shadow that rises from below
// ============================================

import { TILE_SIZE, MAP_COLS, COLORS, TIDE_BASE_SPEED, TIDE_SPEED_INCREMENT } from '../constants.js';

export class RisingTide {
  constructor(scene, floor = 1) {
    this.scene = scene;
    this.floor = floor;
    this.speed = TIDE_BASE_SPEED + (floor - 1) * TIDE_SPEED_INCREMENT;
    this.y = 0;
    this.active = false;
    this.graphics = null;
    this.particles = null;
    this.warningTriggered = false;
    this.mapHeight = 0;
  }

  create(mapHeight) {
    this.mapHeight = mapHeight;
    this.y = 0;
    this.active = false;
    this.warningTriggered = false;
    this.graphics = this.scene.add.graphics();
    this.graphics.setDepth(15);
    this.particles = this.scene.add.particles(0, 0, 'tide_particle', {
      speed: { min: 5, max: 20 },
      angle: { min: 250, max: 290 },
      scale: { start: 1, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 600,
      frequency: 40,
      emitting: false,
      blendMode: 'ADD'
    });
    this.particles.setDepth(16);
  }

  start(delay = 3000) {
    this.scene.time.delayedCall(delay, () => {
      this.active = true;
      if (this.particles) this.particles.start();
    });
  }

  update(delta, playerY) {
    if (!this.active) return 'safe';
    this.y += this.speed * (delta / 1000);
    const tideWorldY = this.mapHeight - this.y;

    this.graphics.clear();
    this.graphics.fillStyle(COLORS.TIDE_PURPLE, 0.6);
    this.graphics.fillRect(0, tideWorldY, MAP_COLS * TILE_SIZE, this.y + 100);
    for (let i = 0; i < 8; i++) {
      this.graphics.fillStyle(COLORS.TIDE_PURPLE, 0.4 * (1 - i / 8));
      this.graphics.fillRect(0, tideWorldY - (i * 4), MAP_COLS * TILE_SIZE, 4);
    }

    if (this.particles) this.particles.setPosition(MAP_COLS * TILE_SIZE / 2, tideWorldY);

    if (playerY > tideWorldY) return 'dead';
    if (playerY - tideWorldY < 100 && !this.warningTriggered) {
      this.warningTriggered = true;
      return 'warning';
    }
    if (playerY - tideWorldY >= 100) this.warningTriggered = false;
    return 'safe';
  }

  getWorldY() { return this.mapHeight - this.y; }

  destroy() {
    if (this.graphics) this.graphics.destroy();
    if (this.particles) this.particles.destroy();
  }
}
