// ============================================
// Enemy — Patrolling obstacle
// ============================================

import { TILE_SIZE } from '../constants.js';

export class Enemy {
  constructor(scene, pathData) {
    this.scene = scene;
    this.startX = pathData.startX;
    this.endX = pathData.endX;
    this.tileY = pathData.y;
    this.direction = pathData.direction || 1;
    this.speed = 1.5;
    this.currentX = pathData.startX;
    this.frame = 0;
    this.frameTimer = 0;

    const wx = this.currentX * TILE_SIZE + TILE_SIZE / 2;
    const wy = this.tileY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.image(wx, wy, 'enemy_0').setDepth(8);
  }

  update(delta) {
    this.currentX += this.direction * this.speed * (delta / 1000);
    if (this.currentX >= this.endX) { this.currentX = this.endX; this.direction = -1; }
    else if (this.currentX <= this.startX) { this.currentX = this.startX; this.direction = 1; }
    this.sprite.x = this.currentX * TILE_SIZE + TILE_SIZE / 2;
    this.sprite.setFlipX(this.direction < 0);
    this.frameTimer += delta;
    if (this.frameTimer > 300) {
      this.frame = this.frame === 0 ? 1 : 0;
      this.sprite.setTexture(`enemy_${this.frame}`);
      this.frameTimer = 0;
    }
  }

  checkCollision(playerTileX, playerTileY) {
    return playerTileY === this.tileY && Math.abs(playerTileX - this.currentX) < 0.8;
  }

  destroy() { if (this.sprite) this.sprite.destroy(); }
}
