// ============================================
// Player — Knight with snap-to-wall movement
// ============================================

import { TILE_SIZE, TILE, PLAYER_SLIDE_DURATION_PER_TILE } from '../constants.js';
import { soundGen } from '../utils/SoundGenerator.js';

export class Player {
  constructor(scene, tileX, tileY) {
    this.scene = scene;
    this.tileX = tileX;
    this.tileY = tileY;
    this.sliding = false;
    this.alive = true;
    this.currentDir = 'idle';

    const wx = tileX * TILE_SIZE + TILE_SIZE / 2;
    const wy = tileY * TILE_SIZE + TILE_SIZE / 2;

    this.sprite = scene.add.image(wx, wy, 'player_idle').setDepth(10);
    this.glow = scene.add.image(wx, wy, 'player_glow').setBlendMode('ADD').setAlpha(0.5).setDepth(9);
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
    const collected = [];
    let hitSpike = false, hitExit = false, hitSwitch = false, hitPortal = false;

    while (true) {
      const nx = destX + d.dx, ny = destY + d.dy;
      if (nx < 0 || nx >= grid[0].length || ny < 0 || ny >= grid.length) break;
      const nt = grid[ny][nx];
      if (nt === TILE.WALL || nt === TILE.GATE) break;
      destX = nx; destY = ny; tilesTraversed++;
      if (nt === TILE.SPIKE) { hitSpike = true; break; }
      if (nt === TILE.COIN) collected.push({ x: nx, y: ny });
      if (nt === TILE.EXIT) { hitExit = true; break; }
      if (nt === TILE.SWITCH) hitSwitch = true;
      if (nt === TILE.PORTAL_IN) { hitPortal = true; break; }
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
      targets: [this.sprite, this.glow],
      x: tx, y: ty,
      duration: dur,
      ease: 'Power2',
      onComplete: () => {
        this.tileX = destX; this.tileY = destY; this.sliding = false;
        soundGen.playWallHit();
        this.scene.cameras.main.shake(60, 0.005);
        if (onComplete) onComplete({ collected, hitSpike, hitExit, hitSwitch, hitPortal, destX, destY });
      }
    });
    return true;
  }

  die() {
    this.alive = false;
    soundGen.playDeath();
    this.scene.tweens.add({
      targets: this.sprite, alpha: 0, scaleX: 1.5, scaleY: 1.5, angle: 180, duration: 500, ease: 'Power2'
    });
    this.scene.tweens.add({ targets: this.glow, alpha: 0, duration: 300 });
  }

  getWorldPos() { return { x: this.sprite.x, y: this.sprite.y }; }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.glow) this.glow.destroy();
  }
}
