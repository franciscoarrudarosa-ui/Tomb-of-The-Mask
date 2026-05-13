// ============================================
// HUDScene — Overlay UI (score, floor, tide bar)
// ============================================

import { COLORS } from '../constants.js';

export class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUDScene' }); }

  init(data) {
    this.floor = data.floor || 1;
    this.score = data.score || 0;
    this.coins = data.coins || 0;
  }

  create() {
    const { width, height } = this.scale;
    const pad = 12;

    const topBar = this.add.graphics();
    topBar.fillStyle(0x0a0a12, 0.7);
    topBar.fillRect(0, 0, width, 44);
    topBar.lineStyle(1, 0x3d3d52, 0.5);
    topBar.lineBetween(0, 44, width, 44);

    this.floorText = this.add.text(pad, 12, `Floor ${this.floor}`, {
      fontSize: '15px', fontFamily: 'MedievalSharp, serif', color: '#e8e8f0',
      stroke: '#0a0a12', strokeThickness: 2
    });

    this.scoreText = this.add.text(width / 2, 12, `${this.score}`, {
      fontSize: '17px', fontFamily: 'MedievalSharp, serif', color: '#f5c518',
      stroke: '#0a0a12', strokeThickness: 2
    }).setOrigin(0.5, 0);

    this.coinText = this.add.text(width - pad, 12, `${this.coins}`, {
      fontSize: '15px', fontFamily: 'MedievalSharp, serif', color: '#f5c518',
      stroke: '#0a0a12', strokeThickness: 2
    }).setOrigin(1, 0);

    // Tide bar (right side)
    this.tideBarBg = this.add.graphics();
    this.tideBarBg.fillStyle(0x1a1a2e, 0.6);
    this.tideBarBg.fillRect(width - 20, 50, 8, height - 60);
    this.tideBar = this.add.graphics();
    this.tideBarHeight = height - 60;
  }

  updateScore(score, coins) {
    this.score = score; this.coins = coins;
    if (this.scoreText) this.scoreText.setText(`${score}`);
    if (this.coinText) this.coinText.setText(`${coins}`);
    if (this.scoreText) this.tweens.add({
      targets: this.scoreText, scaleX: 1.3, scaleY: 1.3, duration: 100, yoyo: true, ease: 'Back.easeOut'
    });
  }

  updateTide(tideWorldY, playerWorldY, mapHeight) {
    if (!this.tideBar) return;
    const { width } = this.scale;
    const barX = width - 20, barTop = 50, barH = this.tideBarHeight;
    const tidePct = Math.min(1, Math.max(0, 1 - (tideWorldY / mapHeight)));
    this.tideBar.clear();
    this.tideBar.fillStyle(COLORS.TIDE_PURPLE, 0.8);
    const fillH = barH * tidePct;
    this.tideBar.fillRect(barX, barTop + barH - fillH, 8, fillH);
    const playerPct = Math.min(1, Math.max(0, 1 - (playerWorldY / mapHeight)));
    this.tideBar.fillStyle(COLORS.PLAYER_VISOR, 1);
    this.tideBar.fillCircle(barX + 4, barTop + barH - (barH * playerPct), 3);
  }
}
