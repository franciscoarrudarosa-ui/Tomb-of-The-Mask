// ============================================
// Collectible — Coins with animation
// ============================================

import { TILE_SIZE } from '../constants.js';

export class Collectible {
  constructor(scene, tileX, tileY) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.collected = false;
    this.frame = 0;
    this.frameTimer = 0;

    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.image(wx, wy, 'coin_0').setDepth(7);

    scene.tweens.add({
      targets: this.sprite, y: wy - 3, duration: 600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  update(delta) {
    if (this.collected) return;
    this.frameTimer += delta;
    if (this.frameTimer > 120) {
      this.frame = (this.frame + 1) % 4;
      this.sprite.setTexture(`coin_${this.frame}`);
      this.frameTimer = 0;
    }
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    this.scene.tweens.add({
      targets: this.sprite, y: this.sprite.y - 20, alpha: 0, scaleX: 1.5, scaleY: 1.5,
      duration: 300, ease: 'Power2', onComplete: () => this.sprite.destroy()
    });
  }

  destroy() { if (this.sprite) this.sprite.destroy(); }
}
