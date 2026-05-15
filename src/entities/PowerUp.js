// ============================================
// PowerUp — Collectible enhancements
// ============================================

import { TILE_SIZE } from '../constants.js';

export class PowerUp {
  constructor(scene, tileX, tileY, type) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.type = type; // 'shield', 'freeze', 'magnet'
    this.collected = false;
    this.timer = 0;

    const keyMap = { 'shield': 'powerup_shield', 'freeze': 'powerup_freeze', 'magnet': 'powerup_magnet' };
    
    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.image(wx, wy, keyMap[type]).setDepth(7);

    // Floating animation
    scene.tweens.add({
      targets: this.sprite,
      y: wy - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Glow
    this.glow = scene.add.image(wx, wy, 'light_glow').setBlendMode('ADD').setAlpha(0.4).setDepth(6);
    let color = 0xffffff;
    if (type === 'shield') color = 0xf1c40f;
    if (type === 'freeze') color = 0x00cec9;
    if (type === 'magnet') color = 0xd63031;
    this.glow.setTint(color);
    
    scene.tweens.add({
      targets: this.glow, alpha: 0.2, scaleX: 0.8, scaleY: 0.8,
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  collect() {
    if (this.collected) return;
    this.collected = true;
    
    this.scene.tweens.add({
      targets: [this.sprite, this.glow],
      y: this.sprite.y - 30,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.glow) this.glow.destroy();
  }
}
