// ============================================
// GameScene — Core gameplay loop
// ============================================

import { TILE_SIZE, MAP_COLS, MAP_ROWS, TILE, COLORS, COIN_SCORE, FLOOR_BONUS, POWERUP_DURATION, MAGNET_RADIUS } from '../constants.js';
import { DungeonGenerator } from '../systems/DungeonGenerator.js';
import { InputManager } from '../systems/InputManager.js';
import { ParticleTrail } from '../systems/ParticleTrail.js';
import { RisingTide } from '../systems/RisingTide.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Collectible } from '../entities/Collectible.js';
import { Trap } from '../entities/Trap.js';
import { PowerUp } from '../entities/PowerUp.js';
import { soundGen } from '../utils/SoundGenerator.js';

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.floor = data.floor || 1;
    this.score = data.score || 0;
    this.totalCoins = data.coins || 0;
    this.gameOver = false;
    this.isFrozen = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.VOID);
    this.cameras.main.fadeIn(400, 10, 10, 18);

    // Generate dungeon
    this.dungeon = new DungeonGenerator(this.floor).generate();
    this.grid = this.dungeon.grid;

    // Render map
    this._renderMap();

    // Player
    this.player = new Player(this, this.dungeon.entrance.x, this.dungeon.entrance.y);

    // Particle trail
    this.trail = new ParticleTrail(this);
    this.trail.create(this.player.sprite);

    // Entities
    this.collectibles = this.dungeon.coinPositions.map(p => new Collectible(this, p.x, p.y));
    this.enemies = this.dungeon.enemyPaths.map(p => new Enemy(this, p));
    this.traps = this.dungeon.trapPositions.map(p => new Trap(this, p.x, p.y, p.type));
    this.powerUps = this.dungeon.powerUpPositions.map(p => new PowerUp(this, p.x, p.y, p.type));

    // Torches
    this.torchSprites = [];
    this.torchGlows = [];
    for (const pos of this.dungeon.torchPositions) {
      const wx = pos.x * TILE_SIZE + TILE_SIZE / 2;
      const wy = pos.y * TILE_SIZE + TILE_SIZE / 2;
      this.torchSprites.push({ sprite: this.add.image(wx, wy, 'torch_0').setDepth(6), frame: 0, timer: 0 });
      const glow = this.add.image(wx, wy + 8, 'light_glow').setBlendMode('ADD').setAlpha(0.6).setDepth(1);
      this.torchGlows.push(glow);
      this.tweens.add({
        targets: glow, alpha: 0.3, scaleX: 1.1, scaleY: 1.1,
        duration: Phaser.Math.Between(800, 1200), yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
      });
    }

    // Rising tide
    this.tide = new RisingTide(this, this.floor);
    this.tide.create(MAP_ROWS * TILE_SIZE);
    this.tide.start(4000);

    // Input
    this.inputManager = new InputManager(this);

    // Camera follows player but restricted to map bounds
    this.cameras.main.setBounds(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.15);
    // Vertical deadzone so camera doesn't move on small vertical adjustments
    this.cameras.main.setDeadzone(0, 100); 

    // HUD
    this.scene.launch('HUDScene', { floor: this.floor, score: this.score, coins: this.totalCoins });

    this._showFloorAnnouncement();
  }

  _renderMap() {
    this.mapTiles = [];
    
    // Build static gate images array
    this.gateSprites = [];

    for (let y = 0; y < MAP_ROWS; y++) {
      for (let x = 0; x < MAP_COLS; x++) {
        const tile = this.grid[y][x];
        const wx = x * TILE_SIZE + TILE_SIZE / 2;
        const wy = y * TILE_SIZE + TILE_SIZE / 2;
        
        // Base floor
        if (tile !== TILE.WALL && tile !== TILE.VOID) {
             this.add.image(wx, wy, 'floor').setDepth(0);
        }

        if (tile === TILE.WALL) {
          this.mapTiles.push(this.add.image(wx, wy, 'wall').setDepth(2));
        } else if (tile === TILE.PORTAL_IN || tile === TILE.PORTAL_OUT) {
          this.add.circle(wx, wy, 12, COLORS.PORTAL_PURPLE).setDepth(1);
          const glow = this.add.circle(wx, wy, 16, COLORS.PORTAL_GLOW).setBlendMode('ADD').setAlpha(0.6).setDepth(2);
          this.tweens.add({
            targets: glow, alpha: 0.2, scaleX: 1.2, scaleY: 1.2,
            duration: 800, yoyo: true, repeat: -1
          });
        } else if (tile === TILE.SPIKE) {
          this.mapTiles.push(this.add.image(wx, wy, 'spike').setDepth(3));
        } else if (tile === TILE.EXIT) {
          this.exitSprite = this.add.image(wx, wy, 'exit_0').setDepth(4);
          this._animateExit();
        } else if (tile === TILE.GATE) {
          const gate = this.add.image(wx, wy, 'gate').setDepth(3);
          this.gateSprites.push({ x, y, sprite: gate });
        } else if (tile === TILE.SWITCH) {
          this.add.image(wx, wy, 'switch').setDepth(2);
        } else if (tile === TILE.TELEPORT_A) {
          this.add.image(wx, wy, 'teleport_a_0').setDepth(2);
        } else if (tile === TILE.TELEPORT_B) {
          this.add.image(wx, wy, 'teleport_b_0').setDepth(2);
        }
      }
    }

    // Darkness overlay
    this.darkness = this.add.graphics().setDepth(14).setAlpha(0.3);
    this._updateDarkness();
  }

  _animateExit() {
    if (!this.exitSprite) return;
    let frame = 0;
    this.time.addEvent({
      delay: 500, loop: true,
      callback: () => {
        frame = frame === 0 ? 1 : 0;
        if (this.exitSprite && this.exitSprite.active) this.exitSprite.setTexture(`exit_${frame}`);
      }
    });
    const glow = this.add.image(this.exitSprite.x, this.exitSprite.y, 'player_glow')
      .setBlendMode('ADD').setAlpha(0.3).setTint(COLORS.EXIT_CYAN).setDepth(3);
    this.tweens.add({
      targets: glow, alpha: 0.6, scaleX: 1.3, scaleY: 1.3,
      duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  _updateDarkness() {
    this.darkness.clear();
    this.darkness.fillStyle(0x000000, 1);
    this.darkness.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    this.darkness.setBlendMode('ERASE');
    for (const pos of this.dungeon.torchPositions)
      this.darkness.fillCircle(pos.x * TILE_SIZE + TILE_SIZE / 2, pos.y * TILE_SIZE + TILE_SIZE / 2, 100);
    if (this.dungeon.entrance)
      this.darkness.fillCircle(this.dungeon.entrance.x * TILE_SIZE + TILE_SIZE / 2, this.dungeon.entrance.y * TILE_SIZE + TILE_SIZE / 2, 90);
    if (this.dungeon.exit)
      this.darkness.fillCircle(this.dungeon.exit.x * TILE_SIZE + TILE_SIZE / 2, this.dungeon.exit.y * TILE_SIZE + TILE_SIZE / 2, 90);
    if (this.dungeon.hasPortal) {
      this.darkness.fillCircle(this.dungeon.portalIn.x * TILE_SIZE + TILE_SIZE / 2, this.dungeon.portalIn.y * TILE_SIZE + TILE_SIZE / 2, 70);
      this.darkness.fillCircle(this.dungeon.portalOut.x * TILE_SIZE + TILE_SIZE / 2, this.dungeon.portalOut.y * TILE_SIZE + TILE_SIZE / 2, 70);
    }
    for (const room of this.dungeon.rooms)
      this.darkness.fillCircle((room.x + room.w / 2) * TILE_SIZE, (room.y + room.h / 2) * TILE_SIZE, Math.max(room.w, room.h) * TILE_SIZE * 0.6);
      
    // Light around player
    if (this.player && this.player.alive) {
       this.darkness.fillCircle(this.player.sprite.x, this.player.sprite.y, 120);
    }
    this.darkness.setBlendMode('NORMAL');
  }

  _showFloorAnnouncement() {
    const { width, height } = this.scale;
    const text = this.add.text(width / 2, height / 2, `⚔ FLOOR ${this.floor} ⚔`, {
      fontSize: '28px', fontFamily: 'MedievalSharp, serif', color: '#f5c518',
      stroke: '#2c1810', strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    this.tweens.add({
      targets: text, alpha: 0, y: text.y - 40, duration: 1500, delay: 800, ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  update(time, delta) {
    if (this.gameOver) return;

    this._updateDarkness(); // Update darkness around player

    this.inputManager.update();

    if (!this.player.sliding) {
      const dir = this.inputManager.consume();
      if (dir) {
        this.trail.start();
        this.player.slide(dir, this.grid, (result) => {
          this.trail.stop();
          this._handleSlideResult(result);
        });
      }
      
      // Auto-collect nearby coins if magnet is active
      if (this.player.magnetAura.alpha > 0) {
          const px = this.player.tileX;
          const py = this.player.tileY;
          for (const coin of this.collectibles) {
             if (!coin.collected && Math.abs(coin.tileX - px) + Math.abs(coin.tileY - py) <= MAGNET_RADIUS) {
                 coin.collect();
                 this._addScore(COIN_SCORE);
             }
          }
      }
    }

    for (const enemy of this.enemies) {
      enemy.update(delta, this.player);
      if (!this.player.sliding && this.player.alive && enemy.checkCollision(this.player.sprite.x, this.player.sprite.y)) {
        this._handleDamage();
      }
    }
    
    for (const trap of this.traps) {
        trap.update(delta, this.grid, this.player);
    }

    for (const c of this.collectibles) c.update(delta);

    for (const t of this.torchSprites) {
      t.timer += delta;
      if (t.timer > 250) { t.frame = t.frame === 0 ? 1 : 0; t.sprite.setTexture(`torch_${t.frame}`); t.timer = 0; }
    }

    if (this.player.alive) {
      const ts = this.tide.update(delta, this.player.sprite.y);
      if (ts === 'dead') this._handleDamage();
      else if (ts === 'warning') { soundGen.playTideWarning(); this.cameras.main.shake(200, 0.003); }
      const hud = this.scene.get('HUDScene');
      if (hud && hud.updateTide) hud.updateTide(this.tide.getWorldY(), this.player.sprite.y, MAP_ROWS * TILE_SIZE);
    }
  }

  _handleSlideResult(result) {
    if (!result) return;
    
    for (const pos of result.collectedCoins) {
      const coin = this.collectibles.find(c => c.tileX === pos.x && c.tileY === pos.y && !c.collected);
      if (coin) {
        coin.collect(); 
        this._addScore(COIN_SCORE);
        this.grid[pos.y][pos.x] = TILE.FLOOR;
      }
    }
    
    for (const p of result.collectedPowerups) {
      const pup = this.powerUps.find(c => c.tileX === p.x && c.tileY === p.y && !c.collected);
      if (pup) {
         pup.collect();
         this.grid[p.y][p.x] = TILE.FLOOR;
         this._activatePowerUp(p.type);
      }
    }
    
    for (const t of result.triggeredTraps) {
        if (t.type === 'crumble') {
            const trap = this.traps.find(tr => tr.tileX === t.x && tr.tileY === t.y);
            if (trap) trap.triggerCrumble();
        }
    }

    if (result.hitSpike) { 
        this._handleDamage(); 
        return; 
    }
    if (result.hitExit) { this._floorComplete(); return; }
    if (result.hitPortal) {
      const pout = this.dungeon.portalOut;
      if (pout) {
        this.player.tileX = pout.x;
        this.player.tileY = pout.y;
        const wx = pout.x * TILE_SIZE + TILE_SIZE / 2;
        const wy = pout.y * TILE_SIZE + TILE_SIZE / 2;
        this.player.sprite.setPosition(wx, wy);
        this.player.glow.setPosition(wx, wy);
        this.cameras.main.flash(300, 155, 89, 182);
      }
    }
    
    // Check switch
    if (result.hitSwitch) {
       this._triggerSwitch(result.hitSwitch);
    }
    
    // Check teleport
    if (result.hitTeleport) {
       this._triggerTeleport(result.hitTeleport);
    }

    // Double check enemies
    for (const enemy of this.enemies) {
      if (enemy.checkCollision(this.player.sprite.x, this.player.sprite.y)) { 
          this._handleDamage(); 
          return; 
      }
    }
  }
  _addScore(amount) {
      this.score += amount;
      if (amount === COIN_SCORE) {
          this.totalCoins++;
          soundGen.playCoinCollect();
      }
      const hud = this.scene.get('HUDScene');
      if (hud && hud.updateScore) hud.updateScore(this.score, this.totalCoins);
  }

  _handleDamage() {
      if (this.gameOver) return;
      if (this.player.hasShield) {
          this.player.breakShield();
          // Knockback? Just break shield for now
          return;
      }
      this._playerDeath();
  }
  
  _activatePowerUp(type) {
      if (type === TILE.POWERUP_SHIELD) {
          this.player.activateShield();
      } else if (type === TILE.POWERUP_FREEZE) {
          this._freezeAll();
      } else if (type === TILE.POWERUP_MAGNET) {
          this.player.activateMagnet(POWERUP_DURATION.MAGNET);
          soundGen.playMagnet();
      }
  }
  
  _freezeAll() {
      if (this.isFrozen) return;
      this.isFrozen = true;
      soundGen.playFreeze();
      
      this.enemies.forEach(e => e.setFrozen(true));
      this.traps.forEach(t => t.setFrozen(true));
      
      this.time.delayedCall(POWERUP_DURATION.FREEZE, () => {
          this.isFrozen = false;
          this.enemies.forEach(e => e.setFrozen(false));
          this.traps.forEach(t => t.setFrozen(false));
      });
  }

  _triggerSwitch(pos) {
      // Find corresponding gate
      const sw = this.dungeon.switches.find(s => s.sx === pos.x && s.sy === pos.y);
      if (sw) {
          soundGen.playSwitch();
          this.grid[sw.gy][sw.gx] = TILE.FLOOR; // Open gate
          
          // Animate gate opening (destroy sprite)
          const gateData = this.gateSprites.find(g => g.x === sw.gx && g.y === sw.gy);
          if (gateData && gateData.sprite) {
              this.tweens.add({
                  targets: gateData.sprite, y: gateData.sprite.y - TILE_SIZE, alpha: 0,
                  duration: 500, ease: 'Power2',
                  onComplete: () => gateData.sprite.destroy()
              });
          }
      }
  }

  _triggerTeleport(pos) {
      const tp = this.dungeon.teleporters.find(t => 
          (t.x1 === pos.x && t.y1 === pos.y) || (t.x2 === pos.x && t.y2 === pos.y)
      );
      if (tp) {
          const destX = pos.x === tp.x1 ? tp.x2 : tp.x1;
          const destY = pos.y === tp.y1 ? tp.y2 : tp.y1;
          
          soundGen.playTeleport();
          
          // Flash screen
          this.cameras.main.flash(200, 155, 89, 182);
          
          this.player.tileX = destX;
          this.player.tileY = destY;
          this.player.sprite.x = destX * TILE_SIZE + TILE_SIZE / 2;
          this.player.sprite.y = destY * TILE_SIZE + TILE_SIZE / 2;
          this.player.glow.x = this.player.sprite.x;
          this.player.glow.y = this.player.sprite.y;
      }
  }

  _playerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.player.die();
    this.trail.stop();
    this.cameras.main.shake(500, 0.01);
    this.cameras.main.flash(300, 233, 69, 96, true);
    this.time.delayedCall(1200, () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', { floor: this.floor, score: this.score, coins: this.totalCoins });
    });
  }

  _floorComplete() {
    if (this.gameOver) return;
    this.gameOver = true;
    soundGen.playExitReached();
    this.score += FLOOR_BONUS;
    this.cameras.main.flash(400, 6, 214, 160, true);
    this.time.delayedCall(800, () => {
      this._cleanup();
      this.scene.stop('HUDScene');
      this.scene.start('GameScene', { floor: this.floor + 1, score: this.score, coins: this.totalCoins });
    });
  }

  _cleanup() {
    if (this.trail) this.trail.destroy();
    if (this.player) this.player.destroy();
    for (const e of this.enemies) e.destroy();
    for (const c of this.collectibles) c.destroy();
    for (const t of this.traps) t.destroy();
    for (const p of this.powerUps) p.destroy();
    if (this.tide) this.tide.destroy();
  }

  shutdown() { this._cleanup(); }
}
