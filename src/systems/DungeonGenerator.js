// ============================================
// DungeonGenerator — Procedural Vertical Maze
// ============================================

import { TILE, MAP_COLS, MAP_ROWS, SPIKE_DENSITY, COIN_DENSITY, DIFFICULTY, ENEMY_TYPES, POWERUP_TYPES } from '../constants.js';

export class DungeonGenerator {
  constructor(floor = 1) {
    this.floor = floor;
    this.grid = [];
    this.rooms = []; // Used as open chambers
    this.entrance = null;
    this.exit = null;
    
    // Entity positions
    this.coinPositions = [];
    this.spikePositions = [];
    this.enemyPaths = [];
    this.torchPositions = [];
    this.trapPositions = [];
    this.powerUpPositions = [];
    this.teleporters = [];
    this.switches = [];
  }

  generate() {
    for (let attempt = 0; attempt < 150; attempt++) {
      this._reset();
      this._initGrid();
      
      // Create maze
      this._generateMaze();
      
      // Add open chambers
      this._placeChambers();
      
      // Entrance at bottom, exit at top
      this._placeEntranceAndExit();
      
      // Ensure reachability
      if (!this._isReachable(this.entrance, this.exit)) continue;
      
      // Place entities that affect slide path
      this._placeSpikes();
      this._placeTraps();
      this._placeTeleporters();
      this._placeSwitches();
      
      // Validate true slide path
      if (!this._hasSlidePath()) continue;
      
      // Place remaining entities
      this._placeTorches();
      this._placeCoins();
      this._placePowerUps();
      this._placeEnemies();

      console.log(`[DungeonGen] Floor ${this.floor} generated in ${attempt + 1} attempts`);
      return this;
    }
    
    console.warn('[DungeonGen] Unreachable after 150 attempts, generating fallback');
    this._generateFallback();
    this._placeCoins();
    return this;
  }

  _reset() {
    this.grid = [];
    this.rooms = [];
    this.coinPositions = [];
    this.spikePositions = [];
    this.enemyPaths = [];
    this.torchPositions = [];
    this.trapPositions = [];
    this.powerUpPositions = [];
    this.teleporters = [];
    this.switches = [];
    this.entrance = null;
    this.exit = null;
  }

  _initGrid() {
    for (let r = 0; r < MAP_ROWS; r++) {
      this.grid[r] = [];
      for (let c = 0; c < MAP_COLS; c++) {
        this.grid[r][c] = TILE.WALL;
      }
    }
  }

  // Recursive Backtracker Maze Generation
  _generateMaze() {
    // Only carve on odd coordinates to leave walls between paths
    const startC = 1 + 2 * Math.floor(Math.random() * ((MAP_COLS - 2) / 2));
    const startR = MAP_ROWS - 2; // Start from bottom
    
    this.grid[startR][startC] = TILE.FLOOR;
    const stack = [{ r: startR, c: startC }];
    
    const dirs = [
      { dr: -2, dc: 0 }, { dr: 2, dc: 0 }, 
      { dr: 0, dc: -2 }, { dr: 0, dc: 2 }
    ];
    
    while (stack.length > 0) {
       const current = stack[stack.length - 1];
       const unvisited = [];
       
       for (const dir of dirs) {
           const nr = current.r + dir.dr;
           const nc = current.c + dir.dc;
           if (nr > 0 && nr < MAP_ROWS - 1 && nc > 0 && nc < MAP_COLS - 1) {
               if (this.grid[nr][nc] === TILE.WALL) {
                   unvisited.push(dir);
               }
           }
       }
       
       if (unvisited.length > 0) {
           // Favor moving UP for verticality
           let dir;
           const upDirs = unvisited.filter(d => d.dr === -2);
           if (upDirs.length > 0 && Math.random() < 0.6) {
               dir = upDirs[0];
           } else {
               dir = unvisited[Math.floor(Math.random() * unvisited.length)];
           }
           
           const nr = current.r + dir.dr;
           const nc = current.c + dir.dc;
           
           this.grid[current.r + dir.dr/2][current.c + dir.dc/2] = TILE.FLOOR;
           this.grid[nr][nc] = TILE.FLOOR;
           
           stack.push({ r: nr, c: nc });
       } else {
           stack.pop();
       }
    }
    
    // Add some random loops to make it less perfect
    for (let i = 0; i < 8; i++) {
       const r = 1 + Math.floor(Math.random() * (MAP_ROWS - 2));
       const c = 1 + Math.floor(Math.random() * (MAP_COLS - 2));
       if (this.grid[r][c] === TILE.WALL) {
           // Check if it connects two floors
           let floors = 0;
           if (this.grid[r-1][c] === TILE.FLOOR) floors++;
           if (this.grid[r+1][c] === TILE.FLOOR) floors++;
           if (this.grid[r][c-1] === TILE.FLOOR) floors++;
           if (this.grid[r][c+1] === TILE.FLOOR) floors++;
           if (floors >= 2) this.grid[r][c] = TILE.FLOOR;
       }
    }
  }

  _placeChambers() {
    const numChambers = 1 + Math.floor(this.floor * 0.1); // Reduced to favor corridors
    for (let i = 0; i < numChambers; i++) {
        const w = 3 + Math.floor(Math.random() * 2);
        const h = 3 + Math.floor(Math.random() * 2);
        const x = 2 + Math.floor(Math.random() * (MAP_COLS - w - 4));
        const y = 4 + Math.floor(Math.random() * (MAP_ROWS - h - 8)); // avoid extreme top/bottom
        
        for (let r = y; r < y + h; r++) {
            for (let c = x; c < x + w; c++) {
                this.grid[r][c] = TILE.FLOOR;
            }
        }
        this.rooms.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
    }
  }

  _placeEntranceAndExit() {
    // Entrance at bottom center-ish
    let startX = Math.floor(MAP_COLS / 2);
    while (this.grid[MAP_ROWS-2][startX] !== TILE.FLOOR && startX > 1) startX--;
    if (this.grid[MAP_ROWS-2][startX] !== TILE.FLOOR) startX = 1;
    
    this.entrance = { x: startX, y: MAP_ROWS - 2 };
    this.grid[this.entrance.y][this.entrance.x] = TILE.ENTRANCE;
    
    // Clear area around entrance
    for(let dx=-1; dx<=1; dx++) {
        if(this.grid[this.entrance.y-1][this.entrance.x+dx] === TILE.WALL)
            this.grid[this.entrance.y-1][this.entrance.x+dx] = TILE.FLOOR;
    }

    // Exit at top
    let exitX = Math.floor(MAP_COLS / 2);
    while (this.grid[1][exitX] !== TILE.FLOOR && exitX > 1) exitX--;
    if (this.grid[1][exitX] !== TILE.FLOOR) exitX = 1;
    
    this.exit = { x: exitX, y: 1 };
    this.grid[this.exit.y][this.exit.x] = TILE.EXIT;
    
    // Clear area around exit
    for(let dx=-1; dx<=1; dx++) {
        if(this.grid[this.exit.y+1][this.exit.x+dx] === TILE.WALL)
            this.grid[this.exit.y+1][this.exit.x+dx] = TILE.FLOOR;
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

  _placeSpikes() {
    const SAFE_RADIUS = 5;
    const density = DIFFICULTY.SPIKE_PER_FLOOR + Math.min(0.05, this.floor * 0.002);
    const tiles = this._getFloorTiles();
    const num = Math.floor(tiles.length * density);
    const shuffled = this._shuffle(tiles);
    
    let count = 0;
    for (let i = 0; i < shuffled.length && count < num; i++) {
      const { x, y } = shuffled[i];
      if (this._distTo(x, y, this.entrance.x, this.entrance.y) < SAFE_RADIUS) continue;
      if (this._distTo(x, y, this.exit.x, this.exit.y) < SAFE_RADIUS) continue;
      
      // Ensure we don't completely block a 1-wide corridor
      if (this._isCorridorBlocked(x, y)) continue;

      this.grid[y][x] = TILE.SPIKE;
      this.spikePositions.push({ x, y });
      count++;
    }
  }

  _isCorridorBlocked(x, y) {
      if (y <= 0 || y >= MAP_ROWS - 1 || x <= 0 || x >= MAP_COLS - 1) return false;
      const up = this.grid[y-1][x]; const down = this.grid[y+1][x];
      const left = this.grid[y][x-1]; const right = this.grid[y][x+1];
      if ((up === TILE.WALL && down === TILE.WALL) || (left === TILE.WALL && right === TILE.WALL)) {
          return true; // 1-wide corridor
      }
      return false;
  }

  _placeTraps() {
      // Timed Spikes, Dart Launchers, Crumble
      const tiles = this._getFloorTiles();
      const shuffled = this._shuffle(tiles);
      
      for (const { x, y } of shuffled) {
          if (this._distTo(x, y, this.entrance.x, this.entrance.y) < 6) continue;
          if (this._distTo(x, y, this.exit.x, this.exit.y) < 6) continue;
          
          if (Math.random() < DIFFICULTY.TIMED_SPIKE_CHANCE_BASE + (this.floor*0.001)) {
              this.grid[y][x] = TILE.TIMED_SPIKE;
              this.trapPositions.push({ x, y, type: 'timed_spike' });
          } else if (Math.random() < DIFFICULTY.CRUMBLE_CHANCE_BASE + (this.floor*0.001)) {
              this.grid[y][x] = TILE.CRUMBLE;
              this.trapPositions.push({ x, y, type: 'crumble' });
          } else if (Math.random() < DIFFICULTY.DART_LAUNCHER_CHANCE_BASE) {
              // Place in wall facing a corridor
              if (this.grid[y][x-1] === TILE.WALL && this.grid[y][x+1] === TILE.FLOOR) {
                  this.grid[y][x-1] = TILE.DART_LAUNCHER;
                  this.trapPositions.push({ x: x-1, y, type: 'dart_launcher' });
              }
          }
      }
  }

  _placeTeleporters() {
      if (this.floor < 3) return; // Introduce later
      
      const tiles = this._getFloorTiles();
      if (tiles.length < 2) return;
      const shuffled = this._shuffle(tiles);
      
      // Place pair A
      if (Math.random() > 0.5) {
          const t1 = shuffled[0]; const t2 = shuffled[1];
          this.grid[t1.y][t1.x] = TILE.TELEPORT_A;
          this.grid[t2.y][t2.x] = TILE.TELEPORT_A;
          this.teleporters.push({ x1: t1.x, y1: t1.y, x2: t2.x, y2: t2.y, type: TILE.TELEPORT_A });
      }
  }

  _placeSwitches() {
      if (this.floor < 5) return; // Introduce later
      
      // Need a room for the switch and a corridor for the gate
      if (this.rooms.length > 0) {
          const room = this.rooms[0];
          const sx = room.cx, sy = room.cy;
          if (this.grid[sy][sx] === TILE.FLOOR) {
              this.grid[sy][sx] = TILE.SWITCH;
              
              // Find a corridor tile for gate
              const tiles = this._getFloorTiles();
              for (const {x, y} of tiles) {
                  if (this._isCorridorBlocked(x, y) && this._distTo(x,y,sx,sy) > 10) {
                      this.grid[y][x] = TILE.GATE;
                      this.switches.push({ sx, sy, gx: x, gy: y });
                      break;
                  }
              }
          }
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

  _placePowerUps() {
      const tiles = this._getFloorTiles();
      const shuffled = this._shuffle(tiles);
      
      const powerUpTypes = [TILE.POWERUP_SHIELD, TILE.POWERUP_FREEZE, TILE.POWERUP_MAGNET];
      
      // 1 power up per 5 floors, max 3
      const num = Math.min(3, Math.ceil(this.floor / 5));
      for (let i = 0; i < num && i < shuffled.length; i++) {
          const { x, y } = shuffled[i];
          const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
          this.grid[y][x] = type;
          let pTypeStr = 'shield';
          if (type === TILE.POWERUP_FREEZE) pTypeStr = 'freeze';
          if (type === TILE.POWERUP_MAGNET) pTypeStr = 'magnet';
          this.powerUpPositions.push({ x, y, type: pTypeStr });
      }
  }

  _placeEnemies() {
    const SAFE_RADIUS = 8;
    const maxEn = Math.min(DIFFICULTY.MAX_ENEMIES + Math.floor(this.floor / 2), 20);
    let placed = 0;
    
    // Patrollers in corridors
    const tiles = this._getFloorTiles();
    for (const {x, y} of this._shuffle(tiles)) {
        if (placed >= maxEn) break;
        if (this._distTo(x, y, this.entrance.x, this.entrance.y) < SAFE_RADIUS) continue;
        
        if (Math.random() < 0.05) {
            // Horizontal patrol
            if (this.grid[y][x-1] === TILE.FLOOR && this.grid[y][x+1] === TILE.FLOOR) {
                let startX = x, endX = x;
                while(this.grid[y][startX-1] === TILE.FLOOR) startX--;
                while(this.grid[y][endX+1] === TILE.FLOOR) endX++;
                if (endX - startX > 2) {
                    this.enemyPaths.push({ startX, endX, y, direction: 1, type: ENEMY_TYPES.PATROL });
                    placed++;
                }
            }
            // Vertical patrol
            else if (this.grid[y-1][x] === TILE.FLOOR && this.grid[y+1][x] === TILE.FLOOR) {
                let startY = y, endY = y;
                while(this.grid[startY-1][x] === TILE.FLOOR) startY--;
                while(this.grid[endY+1][x] === TILE.FLOOR) endY++;
                if (endY - startY > 2) {
                    this.enemyPaths.push({ startX: x, endX: x, startY, endY, direction: 1, type: ENEMY_TYPES.PATROL });
                    placed++;
                }
            }
        }
    }
    
    // Chasers and Orbiters in rooms
    for (const room of this.rooms) {
      if (placed >= maxEn) break;
      if (this._distTo(room.cx, room.cy, this.entrance.x, this.entrance.y) < SAFE_RADIUS) continue;
      
      if (room.w >= 4 && room.h >= 4) {
          if (this.floor > 3 && Math.random() < 0.5) {
              this.enemyPaths.push({ startX: room.cx, y: room.cy, type: ENEMY_TYPES.CHASER });
              placed++;
          } else if (this.floor > 5 && Math.random() < 0.5) {
              this.enemyPaths.push({ startX: room.cx, y: room.cy, cx: room.cx, cy: room.cy, radius: 1.5, type: ENEMY_TYPES.ORBITER });
              placed++;
          }
      }
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

  // Validation
  _isReachable(from, to) {
    const visited = Array.from({ length: MAP_ROWS }, () => new Uint8Array(MAP_COLS));
    const queue = [[from.x, from.y]];
    visited[from.y][from.x] = 1;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    while (queue.length) {
      const [cx, cy] = queue.shift();
      if (cx === to.x && cy === to.y) return true;
      for (const [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) continue;
        if (visited[ny][nx]) continue;
        const t = this.grid[ny][nx];
        if (t === TILE.WALL) continue; // Gate is treated as wall for slide path, but reachable for structural
        visited[ny][nx] = 1;
        queue.push([nx, ny]);
      }
    }
    return false;
  }

  _hasSlidePath() {
    const key = (x, y) => y * MAP_COLS + x;
    const visited = new Set();
    const queue = [{ x: this.entrance.x, y: this.entrance.y }];
    visited.add(key(this.entrance.x, this.entrance.y));
    const dirs = [{ dx:1, dy:0 }, { dx:-1, dy:0 }, { dx:0, dy:1 }, { dx:0, dy:-1 }];

    while (queue.length) {
      const { x, y } = queue.shift();
      for (const { dx, dy } of dirs) {
        let hitSpike = false, reachedExit = false, hitStopTile = false;
        let destX = x, destY = y;
        
        while (true) {
          const nx = destX + dx, ny = destY + dy;
          if (nx < 0 || nx >= MAP_COLS || ny < 0 || ny >= MAP_ROWS) break;
          const t = this.grid[ny][nx];
          if (t === TILE.WALL || t === TILE.GATE) break;
          
          destX = nx; destY = ny;
          
          if (t === TILE.SPIKE || t === TILE.TIMED_SPIKE) { hitSpike = true; break; }
          if (t === TILE.EXIT) { reachedExit = true; break; }
          if (t === TILE.SWITCH || t === TILE.TELEPORT_A || t === TILE.TELEPORT_B) { hitStopTile = true; break; }
        }
        
        if (destX === x && destY === y) continue;
        if (reachedExit) return true;
        
        if (hitStopTile) {
            const t = this.grid[destY][destX];
            if (t === TILE.TELEPORT_A || t === TILE.TELEPORT_B) {
                const tp = this.teleporters.find(tele => 
                    (tele.x1 === destX && tele.y1 === destY) || (tele.x2 === destX && tele.y2 === destY)
                );
                if (tp) {
                    destX = destX === tp.x1 ? tp.x2 : tp.x1;
                    destY = destY === tp.y1 ? tp.y2 : tp.y1;
                }
            }
        }
        
        if (hitSpike) continue;
        
        const k = key(destX, destY);
        if (!visited.has(k)) { 
            visited.add(k); 
            queue.push({ x: destX, y: destY }); 
        }
      }
    }
    return false;
  }

  _generateFallback() {
      this._reset();
      this._initGrid();
      for (let y = 1; y < MAP_ROWS - 1; y++) {
          this.grid[y][Math.floor(MAP_COLS/2)] = TILE.FLOOR;
      }
      this.entrance = { x: Math.floor(MAP_COLS/2), y: MAP_ROWS - 2 };
      this.grid[this.entrance.y][this.entrance.x] = TILE.ENTRANCE;
      this.exit = { x: Math.floor(MAP_COLS/2), y: 1 };
      this.grid[this.exit.y][this.exit.x] = TILE.EXIT;
  }
}
