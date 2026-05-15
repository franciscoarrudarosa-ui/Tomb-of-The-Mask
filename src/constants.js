// ============================================
// CONSTANTS — Game-wide configuration values
// ============================================

export const TILE_SIZE = 32;
export const MAP_COLS = 22;
export const MAP_ROWS = 14;

export const GAME_WIDTH = MAP_COLS * TILE_SIZE;
export const GAME_HEIGHT = MAP_ROWS * TILE_SIZE;

export const TILE = {
  VOID: 0, WALL: 1, FLOOR: 2, SPIKE: 3, COIN: 4,
  EXIT: 5, ENTRANCE: 6, SWITCH: 7, GATE: 8, TORCH: 9, ENEMY_PATH: 10,
  PORTAL_IN: 11, PORTAL_OUT: 12
};

export const COLORS = {
  VOID: 0x0a0a12,
  WALL_DARK: 0x2d2d3d, WALL_MID: 0x3d3d52, WALL_LIGHT: 0x4a4a5a, WALL_HIGHLIGHT: 0x5a5a6e,
  FLOOR_DARK: 0x1a1a2e, FLOOR_MID: 0x22223a, FLOOR_LIGHT: 0x2a2a3e,
  PLAYER_BODY: 0x8b9dc3, PLAYER_ARMOR: 0xc0c0d0, PLAYER_VISOR: 0x4fc3f7,
  TRAIL_PURPLE: 0x8b5cf6, TRAIL_BLUE: 0x6366f1,
  COIN_GOLD: 0xf5c518, COIN_SHINE: 0xffe066,
  SPIKE_RED: 0xe94560, SPIKE_DARK: 0xa83248,
  EXIT_CYAN: 0x06d6a0, EXIT_GLOW: 0x00f5d4,
  TORCH_ORANGE: 0xff9f43, TORCH_YELLOW: 0xffd93d,
  TIDE_PURPLE: 0x533483,
  ENEMY_GREEN: 0x2ecc71, ENEMY_DARK: 0x1a8a4a,
  SWITCH_BLUE: 0x3498db, GATE_BROWN: 0x8b6914,
  UI_PARCHMENT: 0xd4b896, UI_INK: 0x2c1810,
  TEXT_GOLD: 0xf5c518, TEXT_WHITE: 0xe8e8f0,
  PORTAL_PURPLE: 0x9b59b6, PORTAL_GLOW: 0xd2b4de
};

export const PLAYER_SLIDE_SPEED = 600;
export const PLAYER_SLIDE_DURATION_PER_TILE = 50;
export const TIDE_BASE_SPEED = 8;
export const TIDE_SPEED_INCREMENT = 2;
export const COIN_SCORE = 100;
export const FLOOR_BONUS = 500;
export const STARTING_LIVES = 1;
export const MIN_ROOMS = 4;
export const MAX_ROOMS = 8;
export const MIN_ROOM_SIZE = 3;
export const MAX_ROOM_SIZE = 5;
export const SPIKE_DENSITY = 0.08;
export const COIN_DENSITY = 0.06;
export const ENEMY_CHANCE = 0.4;

export const DIFFICULTY = {
  ROOMS_PER_FLOOR: 0.3,
  SPIKE_PER_FLOOR: 0.01,
  CORRIDOR_NARROW_FLOOR: 5,
  MAX_ENEMIES: 5
};
