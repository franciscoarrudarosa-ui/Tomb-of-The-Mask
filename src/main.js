// ============================================
// main.js — Game bootstrap (CDN Phaser, no build step)
// ============================================

import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './constants.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.VOID,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, HUDScene, GameOverScene],
  input: { activePointers: 1 },
  render: { antialias: false, antialiasGL: false }
};

new Phaser.Game(config);
