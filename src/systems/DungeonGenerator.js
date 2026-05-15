// ============================================
// DungeonGenerator — Procedural rooms & corridors
// with guaranteed winnability validation
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
    this.hasPortal = false;
    this.portalIn = null;
    this.portalOut = null;
  }

  generate() {
    for (let attempt = 0; attempt < 50; attempt++) {
      this._reset();
      this.hasPortal = Math.random() < 0.40;
      this._initGrid();
      this._placeRooms();
      // Ensure we have enough rooms for a portal
      if (this.hasPortal && this.rooms.length <= 2) this.hasPortal = false;
      
      this._connectRooms();
      this._placeEntrance();
      if (this.hasPortal) this._placePortals();
      this._placeExit();

      // Layer 1: structural reachability (tile-by-tile walk)
      if (!this._isReachable(this.entrance, this.exit)) continue;

      this._placeSpikes();

      // Layer 2: validate slide-mechanic reachability
      if (!this._hasSlidePath()) {
        // Try to carve a safe corridor and revalidate
        this._carveSafeSlideCorridor();
        if (!this._hasSlidePath()) continue; // still stuck, regenerate
      }

      this._placeCoins();
      this._placeEnemies();
      this._placeTorches();
      console.log(`[DungeonGen] Floor ${this.floor} OK in ${attempt + 1} attempt(s)`);
      return this;
    }
    // Fallback: guaranteed-winnable simple level
    console.warn('[DungeonGen] Fallback level generated');
    this._generateFallback();
    return this;
  }

  _reset() {
    this.rooms = [];
    this.coinPositions = [];
    this.spikePositions = [];
    this.enemyPaths = [];
    this.torchPositions = [];
    this.entrance = null;
    this.exit = null;
    this.portalIn = null;
    this.portalOut = null;
    this.hasPortal = false;
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
    this.rooms.sort((a, b) => a.cx - b.cx);
  }

  _connectRooms() {
    const limit = this.hasPortal ? this.rooms.length - 2 : this.rooms.length - 1;
    for (let i = 0; i < limit; i++) {
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
    const room = this.rooms[0];
    this.entrance = { x: room.cx, y: room.cy };
    this.grid[room.cy][room.cx] = TILE.ENTRANCE;
  }

  _placePortals() {
    const connectedRoom = this.rooms[this.rooms.length - 2];
    const isolatedRoom = this.rooms[this.rooms.length - 1];

    this.portalIn = { x: connectedRoom.cx, y: connectedRoom.cy };
    this.grid[this.portalIn.y][this.portalIn.x] = TILE.PORTAL_IN;

    this.portalOut = { x: isolatedRoom.cx, y: isolatedRoom.cy };
    this.grid[this.portalOut.y][this.portalOut.x] = TILE.PORTAL_OUT;
  }

  _placeExit() {
    const startNode = this.hasPortal ? this.portalOut : this.entrance;
    const targetRoom = this.rooms[this.rooms.length - 1];
    
    // Find furthest floor tile in the target room (or overall reachable structurally)
    // To ensure it's random but at the end, we BFS from startNode
    const visited = new Map();
    const queue = [{ x: startNode.x, y: startNode.y, dist: 0 }];
    visited.set(`${startNode.x},${startNode.y}`, 0);
    
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    let maxDist = 0;
    const tilesByDist = [];

    while (queue.length) {
      const { x, y, dist } = queue.shift();
      if (dist > maxDist) maxDist = dist;
      if (!tilesByDist[dist]) tilesByDist[dist] = [];
      tilesByDist[dist].push({ x, y });

      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) continue;
        const t = this.grid[ny][nx];
        // Only walk on FLOOR or ENTRANCE or PORTAL_OUT
        if (t === TILE.WALL || t === TILE.GATE || t === TILE.PORTAL_IN) continue;
        
        const k = `${nx},${ny}`;
        if (!visited.has(k)) {
          visited.set(k, dist + 1);
          queue.push({ x: nx, y: ny, dist: dist + 1 });
        }
      }
    }

    // Pick a random tile from the top 10% furthest distances, that is inside the target room if possible
    const farDist = Math.max(0, Math.floor(maxDist * 0.9));
    let candidates = [];
    for (let d = farDist; d <= maxDist; d++) {
      if (tilesByDist[d]) candidates.push(...tilesByDist[d]);
    }
    
    // Filter to target room if hasPortal to ensure it stays in isolated room
    if (this.hasPortal) {
      const roomCand = candidates.filter(c => 
        c.x >= targetRoom.x && c.x < targetRoom.x + targetRoom.w &&
        c.y >= targetRoom.y && c.y < targetRoom.y + targetRoom.h
      );
      if (roomCand.length > 0) candidates = roomCand;
    }
    
    // Fallback if no candidates (should not happen)
    if (candidates.length === 0) {
      candidates = [{ x: targetRoom.cx, y: targetRoom.cy }];
    }

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    this.exit = { x: chosen.x, y: chosen.y };
    this.grid[this.exit.y][this.exit.x] = TILE.EXIT;
  }

  _placeSpikes() {
    const SAFE_RADIUS = 4; // safe zone around entrance and exit
    const density = SPIKE_DENSITY + this.floor * DIFFICULTY.SPIKE_PER_FLOOR;
    const tiles = this._getFloorTiles();
    const num = Math.floor(tiles.length * density);
    const shuffled = this._shuffle(tiles);
    for (let i = 0; i < Math.min(num, shuffled.length); i++) {
      const { x, y } = shuffled[i];
      if (this._distTo(x, y, this.entrance.x, this.entrance.y) < SAFE_RADIUS) continue;
      if (this._distTo(x, y, this.exit.x, this.exit.y) < SAFE_RADIUS) continue;
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
    const SAFE_RADIUS = 5; // safe zone — no enemies near entrance
    const maxEn = Math.min(DIFFICULTY.MAX_ENEMIES, Math.floor(this.floor * ENEMY_CHANCE));
    let placed = 0;
    for (const room of this.rooms) {
      if (placed >= maxEn) break;
      if (Math.random() > ENEMY_CHANCE || room.w < 3 || room.h < 3) continue;
      // Skip rooms too close to the entrance (safe zone)
      if (this._distTo(room.cx, room.cy, this.entrance.x, this.entrance.y) < SAFE_RADIUS) continue;
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

  // ================================================================
  // VALIDATION LAYER 1: Structural BFS (tile-by-tile, ignores spikes)
  // ================================================================
  _isReachable(from, to) {
    const visited = Array.from({ length: MAP_ROWS }, () => new Uint8Array(MAP_COLS));
    const queue = [[from.x, from.y]];
    visited[from.y][from.x] = 1;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (queue.length) {
      const [cx, cy] = queue.shift();
      if (cx === to.x && cy === to.y) return true;
      
      // If we are at PORTAL_IN, jump to PORTAL_OUT
      if (this.grid[cy][cx] === TILE.PORTAL_IN && this.portalOut) {
        const {x: px, y: py} = this.portalOut;
        if (!visited[py][px]) {
          visited[py][px] = 1;
          queue.push([px, py]);
        }
      }

      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) continue;
        if (visited[ny][nx]) continue;
        const t = this.grid[ny][nx];
        if (t === TILE.WALL || t === TILE.GATE) continue;
        visited[ny][nx] = 1;
        queue.push([nx, ny]);
      }
    }
    return false;
  }

  // ================================================================
  // VALIDATION LAYER 2: Slide-mechanic BFS
  // Simulates actual game movement — player slides until hitting wall
  // ================================================================
  _hasSlidePath() {
    const key = (x, y) => y * MAP_COLS + x;
    const visited = new Set();
    const queue = [{ x: this.entrance.x, y: this.entrance.y }];
    visited.add(key(this.entrance.x, this.entrance.y));
    const dirs = [{ dx:1, dy:0 }, { dx:-1, dy:0 }, { dx:0, dy:1 }, { dx:0, dy:-1 }];

    while (queue.length) {
      const { x, y } = queue.shift();
      
      // Stop and jump through portal if standing on PORTAL_IN
      if (this.grid[y][x] === TILE.PORTAL_IN && this.portalOut) {
        const k = key(this.portalOut.x, this.portalOut.y);
        if (!visited.has(k)) {
          visited.add(k);
          queue.push({ x: this.portalOut.x, y: this.portalOut.y });
        }
        continue; // Since we stop at portal, we don't slide from PORTAL_IN
      }

      for (const { dx, dy } of dirs) {
        let cx = x, cy = y, hitSpike = false, reachedExit = false, hitPortal = false;
        while (true) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) break;
          const t = this.grid[ny][nx];
          if (t === TILE.WALL || t === TILE.GATE) break;
          cx = nx; cy = ny;
          if (t === TILE.SPIKE) { hitSpike = true; break; }
          if (t === TILE.EXIT) { reachedExit = true; break; }
          if (t === TILE.PORTAL_IN) { hitPortal = true; break; }
        }
        if (cx === x && cy === y) continue;
        if (reachedExit) return true;
        if (hitSpike) continue;
        const k = key(cx, cy);
        if (!visited.has(k)) { 
          visited.add(k); 
          queue.push({ x: cx, y: cy }); 
        }
      }
    }
    return false;
  }

  // ================================================================
  // REPAIR: Carve safe corridor by removing ALL spikes on the
  // structural shortest path + neighbours, ensuring slide stops
  // ================================================================
  _carveSafeSlideCorridor() {
    const path = this._bfsStructuralPath(this.entrance, this.exit);
    if (!path) return;

    // Collect all tiles on the path and within 2-tile radius
    const toClear = new Set();
    for (const { x, y } of path) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < MAP_COLS && ny >= 0 && ny < MAP_ROWS) {
            toClear.add(ny * MAP_COLS + nx);
          }
        }
      }
    }

    // Clear all spikes in that zone
    for (const k of toClear) {
      const sx = k % MAP_COLS, sy = Math.floor(k / MAP_COLS);
      if (this.grid[sy][sx] === TILE.SPIKE) {
        this.grid[sy][sx] = TILE.FLOOR;
      }
    }
    this.spikePositions = this.spikePositions.filter(
      s => !toClear.has(s.y * MAP_COLS + s.x)
    );
  }

  _bfsStructuralPath(from, to) {
    const key = (x, y) => y * MAP_COLS + x;
    const visited = new Map();
    const queue = [{ x: from.x, y: from.y }];
    visited.set(key(from.x, from.y), null);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (queue.length) {
      const { x, y } = queue.shift();
      if (x === to.x && y === to.y) {
        const path = [];
        let cur = key(x, y);
        while (cur !== null) {
          path.push({ x: cur % MAP_COLS, y: Math.floor(cur / MAP_COLS) });
          cur = visited.get(cur);
        }
        return path;
      }
      
      if (this.grid[y][x] === TILE.PORTAL_IN && this.portalOut) {
        const k = key(this.portalOut.x, this.portalOut.y);
        if (!visited.has(k)) {
          visited.set(k, key(x, y));
          queue.push({ x: this.portalOut.x, y: this.portalOut.y });
        }
      }

      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) continue;
        const t = this.grid[ny][nx];
        if (t === TILE.WALL || t === TILE.GATE) continue;
        const k = key(nx, ny);
        if (visited.has(k)) continue;
        visited.set(k, key(x, y));
        queue.push({ x: nx, y: ny });
      }
    }
    return null;
  }

  // ================================================================
  // FALLBACK: Simple guaranteed-winnable level
  // ================================================================
  _generateFallback() {
    this._reset();
    this._initGrid();

    const cy = Math.floor(MAP_ROWS / 2);

    // Left room (entrance)
    for (let y = cy - 2; y <= cy + 2; y++)
      for (let x = 2; x < 6; x++)
        if (y >= 1 && y < MAP_ROWS - 1) this.grid[y][x] = TILE.FLOOR;
    this.rooms.push({ x: 2, y: cy - 2, w: 4, h: 5, cx: 4, cy });

    // Right room (exit)
    for (let y = cy - 2; y <= cy + 2; y++)
      for (let x = MAP_COLS - 6; x < MAP_COLS - 2; x++)
        if (y >= 1 && y < MAP_ROWS - 1) this.grid[y][x] = TILE.FLOOR;
    this.rooms.push({ x: MAP_COLS - 6, y: cy - 2, w: 4, h: 5, cx: MAP_COLS - 4, cy });

    // Middle room
    const mx = Math.floor(MAP_COLS / 2);
    for (let y = cy - 2; y <= cy + 2; y++)
      for (let x = mx - 2; x <= mx + 2; x++)
        if (y >= 1 && y < MAP_ROWS - 1 && x >= 1 && x < MAP_COLS - 1) this.grid[y][x] = TILE.FLOOR;
    this.rooms.push({ x: mx - 2, y: cy - 2, w: 5, h: 5, cx: mx, cy });

    // Connect with horizontal corridors
    this._carveCorridorL(4, cy, mx, cy);
    this._carveCorridorL(mx, cy, MAP_COLS - 4, cy);

    this.entrance = { x: 4, y: cy };
    this.grid[cy][4] = TILE.ENTRANCE;
    this.exit = { x: MAP_COLS - 4, y: cy };
    this.grid[cy][MAP_COLS - 4] = TILE.EXIT;

    this._placeCoins();
    this._placeTorches();
  }
}
