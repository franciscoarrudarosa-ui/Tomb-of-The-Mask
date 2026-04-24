// ============================================
// BootScene — Generate assets and show splash
// ============================================

import { COLORS } from '../constants.js';
import { generateAllSprites } from '../utils/PixelArtGenerator.js';
import { soundGen } from '../utils/SoundGenerator.js';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.VOID);

    this.add.text(width / 2, height / 2, 'Forging sprites...', {
      fontSize: '16px', fontFamily: 'MedievalSharp, serif', color: '#e8e8f0'
    }).setOrigin(0.5);

    generateAllSprites(this);
    soundGen.init();

    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(400, 10, 10, 18);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MenuScene'));
    });
  }
}
