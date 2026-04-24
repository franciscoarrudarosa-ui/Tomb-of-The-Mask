// ============================================
// MenuScene — Medieval title screen
// ============================================

import { COLORS } from '../constants.js';
import { soundGen } from '../utils/SoundGenerator.js';

export class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.VOID);
    this.cameras.main.fadeIn(500, 10, 10, 18);

    // Background ambient particles
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const p = this.add.image(x, y, 'particle')
        .setAlpha(Phaser.Math.FloatBetween(0.05, 0.15))
        .setScale(Phaser.Math.FloatBetween(0.5, 2))
        .setBlendMode('ADD');
      this.tweens.add({
        targets: p, y: y - Phaser.Math.Between(30, 80), alpha: 0,
        duration: Phaser.Math.Between(2000, 4000), repeat: -1,
        onRepeat: () => {
          p.x = Phaser.Math.Between(0, width);
          p.y = Phaser.Math.Between(height * 0.5, height);
          p.setAlpha(Phaser.Math.FloatBetween(0.05, 0.15));
        }
      });
    }

    // Title
    const titleY = height * 0.2;
    this.add.text(width / 2, titleY, 'CITADEL', {
      fontSize: '42px', fontFamily: 'MedievalSharp, serif', color: '#f5c518',
      stroke: '#2c1810', strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5);

    this.add.text(width / 2, titleY + 48, 'OF SHADOWS', {
      fontSize: '28px', fontFamily: 'MedievalSharp, serif', color: '#8b5cf6',
      stroke: '#1a1a2e', strokeThickness: 3,
      shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 6, fill: true }
    }).setOrigin(0.5);

    // Knight
    const knight = this.add.image(width / 2, height * 0.45, 'player_idle').setScale(3);
    this.tweens.add({
      targets: knight, y: height * 0.45 - 6, duration: 1200,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    const glow = this.add.image(width / 2, height * 0.45, 'player_glow')
      .setScale(2).setBlendMode('ADD').setAlpha(0.4);
    this.tweens.add({
      targets: glow, alpha: 0.7, scaleX: 2.3, scaleY: 2.3,
      duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Start text
    const startText = this.add.text(width / 2, height * 0.7, '⚔  TAP TO START  ⚔', {
      fontSize: '20px', fontFamily: 'MedievalSharp, serif', color: '#e8e8f0',
      stroke: '#1a1a2e', strokeThickness: 2
    }).setOrigin(0.5);
    this.tweens.add({
      targets: startText, alpha: 0.3, duration: 800,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    // Controls hint
    this.add.text(width / 2, height * 0.82, 'Arrow Keys / WASD / Swipe', {
      fontSize: '12px', fontFamily: 'MedievalSharp, serif', color: '#6a6a8a'
    }).setOrigin(0.5);

    // High score
    const hs = localStorage.getItem('citadel_highscore') || 0;
    const hf = localStorage.getItem('citadel_highfloor') || 0;
    if (hs > 0) {
      this.add.text(width / 2, height * 0.9, `Best: Floor ${hf} • ${hs} pts`, {
        fontSize: '13px', fontFamily: 'MedievalSharp, serif', color: '#f5c518'
      }).setOrigin(0.5);
    }

    this.input.once('pointerup', () => this._startGame());
    this.input.keyboard.once('keydown', () => this._startGame());
  }

  _startGame() {
    soundGen.resume();
    soundGen.playSelect();
    this.cameras.main.fadeOut(300, 10, 10, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { floor: 1, score: 0, coins: 0 });
    });
  }
}
