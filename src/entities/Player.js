// ============================================
// Player — Knight with snap-to-wall movement
// ============================================

import { TILE_SIZE, TILE, PLAYER_SLIDE_DURATION_PER_TILE, MAGNET_RADIUS } from '../constants.js';
import { soundGen } from '../utils/SoundGenerator.js';

export class Player {
  constructor(scene, tileX, tileY) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.sliding = false;
    this.alive = true;
    this.currentDir = 'idle';
    this.hasShield = false;

    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;

    this.sprite = scene.add.image(wx, wy, 'player_idle').setDepth(10);
    this.glow = scene.add.image(wx, wy, 'player_glow').setBlendMode('ADD').setAlpha(0.5).setDepth(9);
    
    this.shieldGlow = scene.add.image(wx, wy, 'light_glow').setBlendMode('ADD').setAlpha(0).setTint(0xf1c40f).setDepth(11);
    this.magnetAura = scene.add.graphics().setDepth(8).setAlpha(0);
  }

  getTextureForDir(dir) {
    const map = { left:'player_left', right:'player_right', up:'player_up', down:'player_idle' };
    return map[dir] || 'player_idle';
  }

  slide(direction, grid, onComplete) {
    if (this.sliding || !this.alive) return false;

    const dirMap = { left:{dx:-1,dy:0}, right:{dx:1,dy:0}, up:{dx:0,dy:-1}, down:{dx:0,dy:1} };
    const d = dirMap[direction];
    if (!d) return false;

    let destX = this.tileX, destY = this.tileY, tilesTraversed = 0;
    const collectedCoins = [];
    const collectedPowerups = [];
    const triggeredTraps = []; // e.g. crumble
    let hitSpike = false, hitExit = false;
    let hitSwitch = null, hitTeleport = null;

    while (true) {
      const nx = destX + d.dx, ny = destY + d.dy;
      if (nx < 0 || nx >= grid[0].length || ny < 0 || ny >= grid.length) break;
      const nt = grid[ny][nx];
      
      // Stop conditions
      if (nt === TILE.WALL || nt === TILE.GATE) break;
      
      destX = nx; destY = ny; tilesTraversed++;
      
      // Death / Exit
      if (nt === TILE.SPIKE || nt === TILE.TIMED_SPIKE) { hitSpike = true; break; }
      if (nt === TILE.EXIT) { hitExit = true; break; }
      
      // Collectibles
      if (nt === TILE.COIN) collectedCoins.push({ x: nx, y: ny });
      if (nt === TILE.POWERUP_SHIELD || nt === TILE.POWERUP_FREEZE || nt === TILE.POWERUP_MAGNET) {
          collectedPowerups.push({ x: nx, y: ny, type: nt });
      }
      
      // Interactions
      if (nt === TILE.SWITCH) { hitSwitch = { x: nx, y: ny }; break; } // stop on switch
      if (nt === TILE.TELEPORT_A || nt === TILE.TELEPORT_B) { hitTeleport = { x: nx, y: ny, type: nt }; break; } // stop on teleporter
      if (nt === TILE.CRUMBLE) triggeredTraps.push({ x: nx, y: ny, type: 'crumble' });
    }

    if (destX === this.tileX && destY === this.tileY) return false;

    this.sliding = true;
    this.currentDir = direction;
    this.sprite.setTexture(this.getTextureForDir(direction));
    soundGen.playSlide();

    const tx = destX * TILE_SIZE + TILE_SIZE / 2;
    const ty = destY * TILE_SIZE + TILE_SIZE / 2;
    const dur = Math.max(80, tilesTraversed * PLAYER_SLIDE_DURATION_PER_TILE);

    this.scene.tweens.add({
      targets: [this.sprite, this.glow, this.shieldGlow],
      x: tx, y: ty,
      duration: dur,
      ease: 'Power2',
      onUpdate: () => {
         if (this.magnetAura.alpha > 0) {
             this.magnetAura.x = this.sprite.x;
             this.magnetAura.y = this.sprite.y;
         }
      },
      onComplete: () => {
        this.tileX = destX; this.tileY = destY; this.sliding = false;
        soundGen.playWallHit();
        this.scene.cameras.main.shake(60, 0.005);
        if (onComplete) onComplete({ 
            collectedCoins, collectedPowerups, triggeredTraps,
            hitSpike, hitExit, hitSwitch, hitTeleport, 
            destX, destY 
        });
      }
    });
    return true;
  }
  
  activateShield() {
    this.hasShield = true;
    soundGen.playShield();
    this.scene.tweens.add({
      targets: this.shieldGlow, alpha: 0.6, scaleX: 1.2, scaleY: 1.2,
      duration: 500, yoyo: true, repeat: -1
    });
  }
  
  breakShield() {
    this.hasShield = false;
    soundGen.playShieldBreak();
    this.scene.tweens.killTweensOf(this.shieldGlow);
    this.scene.tweens.add({
      targets: this.shieldGlow, alpha: 0, scaleX: 2, scaleY: 2, duration: 300
    });
    // Temporary invulnerability
    this.sprite.setAlpha(0.5);
    this.scene.time.delayedCall(1000, () => {
        if (this.alive) this.sprite.setAlpha(1);
    });
  }

  activateMagnet(duration) {
    this.magnetAura.clear();
    this.magnetAura.lineStyle(2, 0xd63031, 0.5);
    this.magnetAura.strokeCircle(0, 0, MAGNET_RADIUS * TILE_SIZE);
    
    this.magnetAura.x = this.sprite.x;
    this.magnetAura.y = this.sprite.y;
    
    this.scene.tweens.add({
      targets: this.magnetAura, alpha: 1, duration: 300,
      onComplete: () => {
        this.scene.tweens.add({
           targets: this.magnetAura, scaleX: 1.1, scaleY: 1.1, alpha: 0.5,
           duration: 500, yoyo: true, repeat: -1
        });
      }
    });
    
    this.scene.time.delayedCall(duration, () => {
        this.scene.tweens.killTweensOf(this.magnetAura);
        this.magnetAura.setAlpha(0);
        this.magnetAura.clear();
    });
  }

  die() {
    this.alive = false;
    soundGen.playDeath();
    this.scene.tweens.add({
      targets: this.sprite, alpha: 0, scaleX: 1.5, scaleY: 1.5, angle: 180, duration: 500, ease: 'Power2'
    });
    this.scene.tweens.add({ targets: [this.glow, this.shieldGlow, this.magnetAura], alpha: 0, duration: 300 });
  }

  getWorldPos() { return { x: this.sprite.x, y: this.sprite.y }; }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.glow) this.glow.destroy();
    if (this.shieldGlow) this.shieldGlow.destroy();
    if (this.magnetAura) this.magnetAura.destroy();
  }
}
