// ============================================
// CONSTANTS — Game-wide configuration values
// ============================================

export const TILE_SIZE = 32;
export const MAP_COLS = 22;
export const MAP_ROWS = 40; // Increased for vertical scrolling

export const GAME_WIDTH = MAP_COLS * TILE_SIZE;
export const GAME_HEIGHT = MAP_ROWS * TILE_SIZE;

export const TILE = {
  VOID: 0, WALL: 1, FLOOR: 2, SPIKE: 3, COIN: 4,
  EXIT: 5, ENTRANCE: 6, SWITCH: 7, GATE: 8, TORCH: 9, ENEMY_PATH: 10,
  TIMED_SPIKE: 11, CRUMBLE: 12, DART_LAUNCHER: 13,
  TELEPORT_A: 14, TELEPORT_B: 15,
  POWERUP_SHIELD: 16, POWERUP_FREEZE: 17, POWERUP_MAGNET: 18
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
  ENEMY_GREEN: 0x2ecc71, ENEMY_DARK: 0x1a8a4a, ENEMY_RED: 0xe74c3c, ENEMY_BLUE: 0x3498db,
  SWITCH_BLUE: 0x3498db, GATE_BROWN: 0x8b6914,
  UI_PARCHMENT: 0xd4b896, UI_INK: 0x2c1810,
  TEXT_GOLD: 0xf5c518, TEXT_WHITE: 0xe8e8f0,
  TELEPORT_A: 0x9b59b6, TELEPORT_B: 0x1abc9c,
  POWERUP_SHIELD: 0xf1c40f, POWERUP_FREEZE: 0x00cec9, POWERUP_MAGNET: 0xd63031,
  DART_GREY: 0x7f8c8d
};

export const BIOMES = [
  { // 1-5: Catacombs
    wallMid: COLORS.WALL_MID, wallDark: COLORS.WALL_DARK, wallLight: COLORS.WALL_LIGHT, wallHigh: COLORS.WALL_HIGHLIGHT,
    floorMid: COLORS.FLOOR_MID, floorDark: COLORS.FLOOR_DARK, floorLight: COLORS.FLOOR_LIGHT
  },
  { // 6-10: Fire Ruins
    wallMid: 0x4a2a2a, wallDark: 0x2a1a1a, wallLight: 0x6a3a3a, wallHigh: 0x8a4a4a,
    floorMid: 0x3a1e1e, floorDark: 0x1e0f0f, floorLight: 0x4a2e2e
  },
  { // 11-15: Ice Crypt
    wallMid: 0x2a4a5a, wallDark: 0x1a2a3a, wallLight: 0x3a5a7a, wallHigh: 0x4a6a8a,
    floorMid: 0x1e3a4a, floorDark: 0x0f1e2e, floorLight: 0x2e4a5a
  },
  { // 16+: Abyss
    wallMid: 0x1a0525, wallDark: 0x0a0010, wallLight: 0x2a1040, wallHigh: 0x3a1555,
    floorMid: 0x150020, floorDark: 0x05000a, floorLight: 0x200530
  }
];

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
  SPIKE_PER_FLOOR: 0.015,
  CORRIDOR_NARROW_FLOOR: 5,
  MAX_ENEMIES: 10,
  TIMED_SPIKE_CHANCE_BASE: 0.05,
  DART_LAUNCHER_CHANCE_BASE: 0.03,
  CRUMBLE_CHANCE_BASE: 0.05
};

export const ENEMY_TYPES = { PATROL: 0, CHASER: 1, ORBITER: 2 };
export const POWERUP_TYPES = { SHIELD: 0, FREEZE: 1, MAGNET: 2 };
export const POWERUP_DURATION = { FREEZE: 4000, MAGNET: 6000 };
export const MAGNET_RADIUS = 3;
