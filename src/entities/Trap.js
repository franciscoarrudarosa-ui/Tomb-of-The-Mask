// ============================================
// Trap — Dynamic obstacles and hazards
// ============================================

import { TILE_SIZE, TILE } from '../constants.js';
import { soundGen } from '../utils/SoundGenerator.js';

export class Trap {
  constructor(scene, tileX, tileY, type) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.type = type; // 'timed_spike', 'dart_launcher', 'crumble'
    
    this.timer = 0;
    this.active = false;
    this.frozen = false;

    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;

    if (type === 'timed_spike') {
      this.sprite = scene.add.image(wx, wy, 'timed_spike_0').setDepth(3);
      this.interval = Phaser.Math.Between(1500, 2500);
      this.timer = Phaser.Math.Between(0, this.interval);
    } else if (type === 'dart_launcher') {
      this.sprite = scene.add.image(wx, wy, 'dart_launcher').setDepth(3);
      // Determine direction based on adjacent floors
      this.direction = { dx: 0, dy: 1 }; // Default down
      this.interval = Phaser.Math.Between(2000, 3000);
      this.timer = Phaser.Math.Between(0, this.interval);
      this.darts = [];
    } else if (type === 'crumble') {
      this.sprite = scene.add.image(wx, wy, 'crumble_0').setDepth(1);
      this.state = 0; // 0: solid, 1: cracking, 2: broken
    }
  }

  update(delta, grid, player) {
    if (this.frozen) return;

    this.timer += delta;

    if (this.type === 'timed_spike') {
      if (this.timer >= this.interval) {
        this.timer = 0;
        this.active = !this.active;
        this.sprite.setTexture(`timed_spike_${this.active ? 1 : 0}`);
        grid[this.tileY][this.tileX] = this.active ? TILE.SPIKE : TILE.FLOOR; // Need a way to distinguish from normal floor?
        // Actually, let's keep the tile as TIMED_SPIKE and handle logic in GameScene or Player
      }
    } else if (this.type === 'dart_launcher') {
      if (this.timer >= this.interval) {
        this.timer = 0;
        this.fireDart();
      }
      for (let i = this.darts.length - 1; i >= 0; i--) {
        const dart = this.darts[i];
        dart.x += this.direction.dx * 300 * (delta / 1000);
        dart.y += this.direction.dy * 300 * (delta / 1000);
        
        // Check collision with wall or player
        const dx = Math.floor(dart.x / TILE_SIZE);
        const dy = Math.floor(dart.y / TILE_SIZE);
        
        if (dy >= 0 && dy < grid.length && dx >= 0 && dx < grid[0].length) {
          const t = grid[dy][dx];
          if (t === TILE.WALL || t === TILE.GATE) {
            dart.destroy();
            this.darts.splice(i, 1);
            continue;
          }
        }
        
        if (!player.sliding && player.alive) {
            const px = player.sprite.x;
            const py = player.sprite.y;
            if (Phaser.Math.Distance.Between(dart.x, dart.y, px, py) < 16) {
                if (this.scene._playerDeath) {
                    this.scene._playerDeath();
                    dart.destroy();
                    this.darts.splice(i, 1);
                }
            }
        }
      }
    }
  }

  fireDart() {
    soundGen.playDart();
    const wx = this.tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = this.tileY * TILE_SIZE + TILE_SIZE / 2;
    const dart = this.scene.add.image(wx, wy, 'dart').setDepth(4);
    
    // Rotate dart based on direction (assuming dart image faces right)
    if (this.direction.dx === 1) dart.angle = 0;
    else if (this.direction.dx === -1) dart.angle = 180;
    else if (this.direction.dy === 1) dart.angle = 90;
    else if (this.direction.dy === -1) dart.angle = -90;

    this.darts.push(dart);
  }

  triggerCrumble() {
    if (this.type !== 'crumble' || this.state > 0) return;
    this.state = 1;
    this.sprite.setTexture('crumble_1');
    soundGen.playCrumble();
    this.scene.time.delayedCall(500, () => {
      this.state = 2;
      this.sprite.setTexture('crumble_2');
      this.active = true; // Represents broken state
    });
  }

  setFrozen(isFrozen) {
    this.frozen = isFrozen;
    if (this.type === 'dart_launcher') {
        this.darts.forEach(d => {
            if (isFrozen) d.setTint(0x00cec9);
            else d.clearTint();
        });
    } else {
        if (isFrozen) this.sprite.setTint(0x00cec9);
        else this.sprite.clearTint();
    }
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.darts) this.darts.forEach(d => d.destroy());
  }
}
