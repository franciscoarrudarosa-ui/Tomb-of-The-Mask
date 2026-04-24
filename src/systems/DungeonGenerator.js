// ============================================
// DungeonGenerator — Procedural rooms & corridors
// ============================================

import { TILE, MAP_COLS, MAP_ROWS, MIN_ROOMS, MAX_ROOMS, MIN_ROOM_SIZE, MAX_ROOM_SIZE,
         SPIKE_DENSITY, COIN_DENSITY, ENEMY_CHANCE, DIFFICULTY } from '../constants.js';

export class DungeonGenerator {
  constructor(floor = 1) {
    this.floor = floor;
    this.grid = [];
    this.rooms = [];
    this.entrance = null;
    this.exit = null;
    this.coinPositions = [];
    this.spikePositions = [];
    this.enemyPaths = [];
    this.torchPositions = [];
  }

  generate() {
    this._initGrid();
    this._placeRooms();
    this._connectRooms();
    this._placeEntrance();
    this._placeExit();
    this._placeSpikes();
    this._placeCoins();
    this._placeEnemies();
    this._placeTorches();
    return this;
  }

  _initGrid() {
    this.grid = [];
    for (let r = 0; r < MAP_ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < MAP_COLS; c++) {
        this.grid[r][c] = TILE.WALL;
      }
    }
  }

  _rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _placeRooms() {
    const numRooms = Math.min(MAX_ROOMS + 2, Math.floor(
      this._rand(MIN_ROOMS, MAX_ROOMS) + this.floor * DIFFICULTY.ROOMS_PER_FLOOR
    ));
    let attempts = 0;
    while (this.rooms.length < numRooms && attempts < 200) {
      attempts++;
      const w = this._rand(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
      const h = this._rand(MIN_ROOM_SIZE, MAX_ROOM_SIZE);
      const x = this._rand(1, MAP_COLS - w - 1);
      const y = this._rand(2, MAP_ROWS - h - 2);

      let overlap = false;
      for (const room of this.rooms) {
        if (x - 1 < room.x + room.w && x + w + 1 > room.x &&
            y - 1 < room.y + room.h && y + h + 1 > room.y) {
          overlap = true; break;
        }
      }
      if (overlap) continue;

      for (let ry = y; ry < y + h; ry++)
        for (let rx = x; rx < x + w; rx++)
          this.grid[ry][rx] = TILE.FLOOR;

      this.rooms.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
    }
    this.rooms.sort((a, b) => a.cy - b.cy);
  }

  _connectRooms() {
    for (let i = 0; i < this.rooms.length - 1; i++) {
      this._carveCorridorL(this.rooms[i].cx, this.rooms[i].cy, this.rooms[i+1].cx, this.rooms[i+1].cy);
    }
  }

  _carveCorridorL(x1, y1, x2, y2) {
    const cw = this.floor >= DIFFICULTY.CORRIDOR_NARROW_FLOOR ? 1 : 2;
    let cx = x1, cy = y1;
    while (cx !== x2) {
      for (let w = 0; w < cw; w++) {
        const row = cy + w;
        if (row >= 0 && row < MAP_ROWS && cx >= 0 && cx < MAP_COLS) this.grid[row][cx] = TILE.FLOOR;
      }
      cx += cx < x2 ? 1 : -1;
    }
    while (cy !== y2) {
      for (let w = 0; w < cw; w++) {
        const col = cx + w;
        if (cy >= 0 && cy < MAP_ROWS && col >= 0 && col < MAP_COLS) this.grid[cy][col] = TILE.FLOOR;
      }
      cy += cy < y2 ? 1 : -1;
    }
  }

  _placeEntrance() {
    const room = this.rooms[this.rooms.length - 1];
    this.entrance = { x: room.cx, y: room.cy };
    this.grid[room.cy][room.cx] = TILE.ENTRANCE;
  }

  _placeExit() {
    const room = this.rooms[0];
    this.exit = { x: room.cx, y: room.cy };
    this.grid[room.cy][room.cx] = TILE.EXIT;
  }

  _placeSpikes() {
    const density = SPIKE_DENSITY + this.floor * DIFFICULTY.SPIKE_PER_FLOOR;
    const tiles = this._getFloorTiles();
    const num = Math.floor(tiles.length * density);
    const shuffled = this._shuffle(tiles);
    for (let i = 0; i < Math.min(num, shuffled.length); i++) {
      const { x, y } = shuffled[i];
      if (this._distTo(x, y, this.entrance.x, this.entrance.y) < 3) continue;
      if (this._distTo(x, y, this.exit.x, this.exit.y) < 3) continue;
      this.grid[y][x] = TILE.SPIKE;
      this.spikePositions.push({ x, y });
    }
  }

  _placeCoins() {
    const tiles = this._getFloorTiles();
    const num = Math.floor(tiles.length * COIN_DENSITY);
    const shuffled = this._shuffle(tiles);
    for (let i = 0; i < Math.min(num, shuffled.length); i++) {
      const { x, y } = shuffled[i];
      this.grid[y][x] = TILE.COIN;
      this.coinPositions.push({ x, y });
    }
  }

  _placeEnemies() {
    const maxEn = Math.min(DIFFICULTY.MAX_ENEMIES, Math.floor(this.floor * ENEMY_CHANCE));
    let placed = 0;
    for (const room of this.rooms) {
      if (placed >= maxEn) break;
      if (Math.random() > ENEMY_CHANCE || room.w < 3 || room.h < 3) continue;
      const startX = room.x + 1, endX = room.x + room.w - 2;
      if (endX > startX) { this.enemyPaths.push({ startX, endX, y: room.cy, direction: 1 }); placed++; }
    }
  }

  _placeTorches() {
    for (const room of this.rooms) {
      if (room.y > 0) {
        const tx = room.x + Math.floor(room.w / 2), ty = room.y - 1;
        if (this.grid[ty] && this.grid[ty][tx] === TILE.WALL) this.torchPositions.push({ x: tx, y: ty });
      }
    }
  }

  _getFloorTiles() {
    const t = [];
    for (let y = 0; y < MAP_ROWS; y++)
      for (let x = 0; x < MAP_COLS; x++)
        if (this.grid[y][x] === TILE.FLOOR) t.push({ x, y });
    return t;
  }

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = ~~(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
    return a;
  }

  _distTo(x1, y1, x2, y2) { return Math.abs(x1-x2) + Math.abs(y1-y2); }
}
