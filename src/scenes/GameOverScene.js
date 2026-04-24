// ============================================
// GameOverScene — Death screen with stats
// ============================================

import { COLORS } from '../constants.js';
import { soundGen } from '../utils/SoundGenerator.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOverScene' }); }

  init(data) {
    this.floor = data.floor || 1;
    this.score = data.score || 0;
    this.coins = data.coins || 0;
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.VOID);
    this.cameras.main.fadeIn(300, 10, 10, 18);

    // Save high scores
    const prevScore = parseInt(localStorage.getItem('citadel_highscore') || '0');
    const isNewRecord = this.score > prevScore;
    if (isNewRecord) {
      localStorage.setItem('citadel_highscore', this.score);
      localStorage.setItem('citadel_highfloor', this.floor);
    }

    // Falling ash particles
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(-20, height);
      const p = this.add.image(x, y, 'particle')
        .setAlpha(0.08).setScale(Phaser.Math.FloatBetween(0.3, 1)).setBlendMode('ADD');
      this.tweens.add({
        targets: p, y: height + 20, x: x + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(3000, 6000), repeat: -1,
        onRepeat: () => { p.y = -20; p.x = Phaser.Math.Between(0, width); }
      });
    }

    // Title
    this.add.text(width / 2, height * 0.15, 'YOU PERISHED', {
      fontSize: '32px', fontFamily: 'MedievalSharp, serif', color: '#e94560',
      stroke: '#2c1810', strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 8, fill: true }
    }).setOrigin(0.5);

    // Dead knight
    this.add.image(width / 2, height * 0.32, 'player_idle').setScale(2.5).setAlpha(0.4).setTint(0x666688);

    // Stats panel
    const py = height * 0.45;
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.8);
    bg.fillRoundedRect(width * 0.1, py - 10, width * 0.8, 140, 8);
    bg.lineStyle(1, 0x533483, 0.6);
    bg.strokeRoundedRect(width * 0.1, py - 10, width * 0.8, 140, 8);

    const ss = { fontSize: '16px', fontFamily: 'MedievalSharp, serif', color: '#e8e8f0', stroke: '#0a0a12', strokeThickness: 1 };
    this.add.text(width / 2, py + 15, `Floor Reached: ${this.floor}`, ss).setOrigin(0.5);
    this.add.text(width / 2, py + 45, `Score: ${this.score}`, { ...ss, color: '#f5c518', fontSize: '20px' }).setOrigin(0.5);
    this.add.text(width / 2, py + 75, `Coins: ${this.coins}`, { ...ss, color: '#f5c518' }).setOrigin(0.5);

    if (isNewRecord) {
      const nr = this.add.text(width / 2, py + 105, 'NEW RECORD!', {
        fontSize: '18px', fontFamily: 'MedievalSharp, serif', color: '#f5c518',
        stroke: '#2c1810', strokeThickness: 2
      }).setOrigin(0.5);
      this.tweens.add({ targets: nr, scaleX: 1.1, scaleY: 1.1, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Retry button
    const btnY = height * 0.78;
    const btn = this.add.graphics();
    btn.fillStyle(0x533483, 1);
    btn.fillRoundedRect(width * 0.2, btnY - 20, width * 0.6, 48, 8);
    btn.lineStyle(2, 0x8b5cf6, 0.8);
    btn.strokeRoundedRect(width * 0.2, btnY - 20, width * 0.6, 48, 8);

    this.add.text(width / 2, btnY + 4, 'TRY AGAIN', {
      fontSize: '18px', fontFamily: 'MedievalSharp, serif', color: '#e8e8f0'
    }).setOrigin(0.5);

    const hitArea = this.add.zone(width / 2, btnY + 4, width * 0.6, 48).setInteractive();
    hitArea.on('pointerup', () => this._restart());
    this.input.keyboard.once('keydown', () => this._restart());

    // Menu link
    const menuText = this.add.text(width / 2, height * 0.9, 'Main Menu', {
      fontSize: '14px', fontFamily: 'MedievalSharp, serif', color: '#6a6a8a'
    }).setOrigin(0.5).setInteractive();
    menuText.on('pointerup', () => {
      soundGen.playSelect();
      this.cameras.main.fadeOut(300, 10, 10, 18);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }

  _restart() {
    soundGen.playSelect();
    this.cameras.main.fadeOut(300, 10, 10, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { floor: 1, score: 0, coins: 0 });
    });
  }
}
