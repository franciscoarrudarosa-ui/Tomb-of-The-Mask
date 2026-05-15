// ============================================
// Enemy — Patrolling obstacle
// ============================================

import { TILE_SIZE, ENEMY_TYPES } from '../constants.js';

export class Enemy {
  constructor(scene, pathData) {
    this.scene = scene;
    this.type = pathData.type || ENEMY_TYPES.PATROL;
    
    // Position
    this.tileX = pathData.startX;
    this.tileY = pathData.startY || pathData.y;
    this.currentX = this.tileX;
    this.currentY = this.tileY;
    
    // Patrol logic
    this.startX = pathData.startX;
    this.endX = pathData.endX || pathData.startX;
    this.startY = pathData.startY || pathData.y;
    this.endY = pathData.endY || pathData.y;
    
    this.isHorizontal = this.startY === this.endY;
    this.direction = pathData.direction || 1;
    this.speed = pathData.speed || (this.type === ENEMY_TYPES.CHASER ? 3.5 : 1.5);
    
    // Animation
    this.frame = 0;
    this.frameTimer = 0;
    this.frozen = false;

    let spriteKey = 'enemy_patrol_0';
    if (this.type === ENEMY_TYPES.CHASER) spriteKey = 'enemy_chaser_0';
    if (this.type === ENEMY_TYPES.ORBITER) spriteKey = 'enemy_orbiter_0';

    const wx = this.currentX * TILE_SIZE + TILE_SIZE / 2;
    const wy = this.currentY * TILE_SIZE + TILE_SIZE / 2;
    this.sprite = scene.add.image(wx, wy, spriteKey).setDepth(8);
    
    // Freeze overlay
    this.freezeOverlay = scene.add.image(wx, wy, 'frozen_overlay').setDepth(9).setVisible(false);

    // Orbiter logic
    if (this.type === ENEMY_TYPES.ORBITER) {
      this.orbitCenter = { x: pathData.cx, y: pathData.cy };
      this.orbitRadius = pathData.radius || 1;
      this.orbitAngle = pathData.startAngle || 0;
      this.orbitSpeed = pathData.orbitSpeed || 2; // radians per second
    }
    
    // Chaser logic
    if (this.type === ENEMY_TYPES.CHASER) {
      this.state = 'idle'; // idle, chase, cooldown
      this.cooldownTimer = 0;
      this.chaseTarget = null;
    }
  }

  update(delta, player) {
    if (this.frozen) return;

    if (this.type === ENEMY_TYPES.PATROL) {
      this._updatePatrol(delta);
    } else if (this.type === ENEMY_TYPES.ORBITER) {
      this._updateOrbiter(delta);
    } else if (this.type === ENEMY_TYPES.CHASER) {
      this._updateChaser(delta, player);
    }

    // Animation
    this.frameTimer += delta;
    if (this.frameTimer > (this.type === ENEMY_TYPES.CHASER && this.state === 'chase' ? 100 : 300)) {
      this.frame = this.frame === 0 ? 1 : 0;
      let baseKey = 'enemy_patrol';
      if (this.type === ENEMY_TYPES.CHASER) baseKey = 'enemy_chaser';
      if (this.type === ENEMY_TYPES.ORBITER) baseKey = 'enemy_orbiter';
      this.sprite.setTexture(`${baseKey}_${this.frame}`);
      this.frameTimer = 0;
    }
    
    if (this.type !== ENEMY_TYPES.ORBITER) {
       this.sprite.setFlipX(this.direction < 0 && this.isHorizontal);
    }
  }

  _updatePatrol(delta) {
    if (this.isHorizontal) {
      this.currentX += this.direction * this.speed * (delta / 1000);
      if (this.currentX >= this.endX) { this.currentX = this.endX; this.direction = -1; }
      else if (this.currentX <= this.startX) { this.currentX = this.startX; this.direction = 1; }
      this.sprite.x = this.currentX * TILE_SIZE + TILE_SIZE / 2;
    } else {
      this.currentY += this.direction * this.speed * (delta / 1000);
      if (this.currentY >= this.endY) { this.currentY = this.endY; this.direction = -1; }
      else if (this.currentY <= this.startY) { this.currentY = this.startY; this.direction = 1; }
      this.sprite.y = this.currentY * TILE_SIZE + TILE_SIZE / 2;
    }
  }

  _updateOrbiter(delta) {
    this.orbitAngle += this.orbitSpeed * (delta / 1000);
    this.currentX = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    this.currentY = this.orbitCenter.y + Math.sin(this.orbitAngle) * this.orbitRadius;
    this.sprite.x = this.currentX * TILE_SIZE + TILE_SIZE / 2;
    this.sprite.y = this.currentY * TILE_SIZE + TILE_SIZE / 2;
  }

  _updateChaser(delta, player) {
    if (this.state === 'idle') {
      // Check line of sight (axis aligned)
      if (!player.alive || player.sliding) return;
      
      const px = player.tileX;
      const py = player.tileY;
      const ex = Math.round(this.currentX);
      const ey = Math.round(this.currentY);
      
      if (px === ex || py === ey) {
        // Distance check
        const dist = Math.abs(px - ex) + Math.abs(py - ey);
        if (dist <= 6) {
          // Check for walls between them
          let blocked = false;
          if (px === ex) {
            const y1 = Math.min(py, ey);
            const y2 = Math.max(py, ey);
            for (let y = y1; y <= y2; y++) {
               // We need grid access here, assume scene has it
               if (this.scene.grid && this.scene.grid[y][px] === 1) blocked = true;
            }
          } else {
             const x1 = Math.min(px, ex);
             const x2 = Math.max(px, ex);
             for (let x = x1; x <= x2; x++) {
               if (this.scene.grid && this.scene.grid[ey][x] === 1) blocked = true;
             }
          }
          
          if (!blocked) {
            this.state = 'chase';
            this.chaseTarget = { x: px, y: py };
            if (px === ex) {
               this.isHorizontal = false;
               this.direction = py > ey ? 1 : -1;
            } else {
               this.isHorizontal = true;
               this.direction = px > ex ? 1 : -1;
            }
          }
        }
      }
    } else if (this.state === 'chase') {
      if (this.isHorizontal) {
        this.currentX += this.direction * this.speed * (delta / 1000);
        if ((this.direction === 1 && this.currentX >= this.chaseTarget.x) || 
            (this.direction === -1 && this.currentX <= this.chaseTarget.x)) {
           this.currentX = this.chaseTarget.x;
           this.state = 'cooldown';
           this.cooldownTimer = 1000;
        }
      } else {
        this.currentY += this.direction * this.speed * (delta / 1000);
        if ((this.direction === 1 && this.currentY >= this.chaseTarget.y) || 
            (this.direction === -1 && this.currentY <= this.chaseTarget.y)) {
           this.currentY = this.chaseTarget.y;
           this.state = 'cooldown';
           this.cooldownTimer = 1000;
        }
      }
      this.sprite.x = this.currentX * TILE_SIZE + TILE_SIZE / 2;
      this.sprite.y = this.currentY * TILE_SIZE + TILE_SIZE / 2;
    } else if (this.state === 'cooldown') {
       this.cooldownTimer -= delta;
       if (this.cooldownTimer <= 0) {
          this.state = 'idle';
       }
    }
  }

  checkCollision(playerWorldX, playerWorldY) {
    // Return true if distance is very small
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerWorldX, playerWorldY);
    return dist < TILE_SIZE * 0.8;
  }

  setFrozen(isFrozen) {
    this.frozen = isFrozen;
    this.freezeOverlay.setVisible(isFrozen);
    this.freezeOverlay.x = this.sprite.x;
    this.freezeOverlay.y = this.sprite.y;
  }

  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.freezeOverlay) this.freezeOverlay.destroy();
  }
}
