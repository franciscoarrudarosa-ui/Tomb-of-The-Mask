// ============================================
// RisingTide — Shadow that rises from below
// ============================================

import { TILE_SIZE, MAP_COLS, COLORS, TIDE_BASE_SPEED, TIDE_SPEED_INCREMENT } from '../constants.js';

export class RisingTide {
  constructor(scene, floor = 1) {
    this.scene = scene;
    this.floor = floor;
    this.baseSpeed = TIDE_BASE_SPEED + (floor - 1) * TIDE_SPEED_INCREMENT;
    this.speed = this.baseSpeed;
    this.y = 0; // distance from bottom
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
      speed: { min: 10, max: 30 },
      angle: { min: 250, max: 290 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 800,
      frequency: 30,
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
    
    // Adaptive speed: catch up if player is too far ahead
    const tideWorldY = this.mapHeight - this.y;
    const distToPlayer = tideWorldY - playerY;
    
    if (distToPlayer > 800) {
       this.speed = this.baseSpeed * 2.5; // Catch up fast
    } else if (distToPlayer > 400) {
       this.speed = this.baseSpeed * 1.5;
    } else {
       this.speed = this.baseSpeed;
    }

    this.y += this.speed * (delta / 1000);
    const newTideWorldY = this.mapHeight - this.y;

    this.graphics.clear();
    this.graphics.fillStyle(COLORS.TIDE_PURPLE, 0.7);
    this.graphics.fillRect(0, newTideWorldY, MAP_COLS * TILE_SIZE, this.y + 200);
    for (let i = 0; i < 8; i++) {
      this.graphics.fillStyle(COLORS.TIDE_PURPLE, 0.5 * (1 - i / 8));
      this.graphics.fillRect(0, newTideWorldY - (i * 4), MAP_COLS * TILE_SIZE, 4);
    }

    if (this.particles) this.particles.setPosition(MAP_COLS * TILE_SIZE / 2, newTideWorldY);

    if (playerY > newTideWorldY) return 'dead';
    if (playerY - newTideWorldY < 150 && !this.warningTriggered) {
      this.warningTriggered = true;
      return 'warning';
    }
    if (playerY - newTideWorldY >= 150) this.warningTriggered = false;
    return 'safe';
  }

  getWorldY() { return this.mapHeight - this.y; }

  destroy() {
    if (this.graphics) this.graphics.destroy();
    if (this.particles) this.particles.destroy();
  }
}
