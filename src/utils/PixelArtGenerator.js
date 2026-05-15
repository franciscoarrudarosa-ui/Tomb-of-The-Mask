import { TILE_SIZE, COLORS, BIOMES } from '../constants.js';

function hexToRgba(hex, alpha = 1) {
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

function px(ctx, x, y, color, s = 1) {
  ctx.fillStyle = typeof color === 'string' ? color : hexToRgba(color);
  ctx.fillRect(x * s, y * s, s, s);
}

function pxR(ctx, x, y, w, h, color, s = 1) {
  ctx.fillStyle = typeof color === 'string' ? color : hexToRgba(color);
  ctx.fillRect(x * s, y * s, w * s, h * s);
}

export function generateAllSprites(scene, floor = 1) {
  const S = TILE_SIZE, P = 2;
  const biomeIdx = Math.min(Math.floor((floor - 1) / 5), BIOMES.length - 1);
  const biome = BIOMES[biomeIdx];

  genWall(scene,S,P,biome); genFloor(scene,S,P,biome); genPlayer(scene,S,P);
  genCoin(scene,S,P); genSpike(scene,S,P); genExit(scene,S,P);
  genTorch(scene,S,P); genEnemy(scene,S,P); genParticles(scene);
  genSwitch(scene,S,P); genGate(scene,S,P);
  genPowerUps(scene,S,P); genTraps(scene,S,P); genTeleporters(scene,S,P);
}

function genWall(sc,S,P,biome){
  const c=sc.textures.createCanvas('wall',S,S), x=c.context;
  pxR(x,0,0,16,16,biome.wallMid,P);
  pxR(x,0,0,16,1,biome.wallHigh,P); pxR(x,0,0,1,8,biome.wallHigh,P);
  pxR(x,0,8,16,1,biome.wallDark,P); pxR(x,8,0,1,8,biome.wallDark,P);
  pxR(x,0,9,16,1,biome.wallHigh,P); pxR(x,4,9,1,7,biome.wallDark,P);
  pxR(x,12,9,1,7,biome.wallDark,P);
  for(let i=0;i<6;i++) px(x,~~(Math.random()*15),~~(Math.random()*15),Math.random()>0.5?biome.wallDark:biome.wallLight,P);
  c.refresh();
}

function genFloor(sc,S,P,biome){
  const c=sc.textures.createCanvas('floor',S,S), x=c.context;
  pxR(x,0,0,16,16,biome.floorMid,P);
  pxR(x,0,0,16,1,biome.floorLight,P); pxR(x,0,0,1,16,biome.floorLight,P);
  pxR(x,15,0,1,16,biome.floorDark,P); pxR(x,0,15,16,1,biome.floorDark,P);
  for(let i=0;i<3;i++) px(x,~~(Math.random()*14)+1,~~(Math.random()*14)+1,biome.floorDark,P);
  c.refresh();
}

function genPlayer(sc,S,P){
  ['player_idle','player_right','player_left','player_up'].forEach((key,fi)=>{
    const c=sc.textures.createCanvas(key,S,S), x=c.context;
    pxR(x,5,4,6,8,COLORS.PLAYER_ARMOR,P); pxR(x,4,5,8,6,COLORS.PLAYER_BODY,P);
    pxR(x,5,1,6,4,COLORS.PLAYER_ARMOR,P); pxR(x,6,2,4,2,COLORS.WALL_DARK,P);
    if(fi===0){px(x,7,2,COLORS.PLAYER_VISOR,P);px(x,9,2,COLORS.PLAYER_VISOR,P);}
    else if(fi===1) pxR(x,8,2,2,1,COLORS.PLAYER_VISOR,P);
    else if(fi===2) pxR(x,6,2,2,1,COLORS.PLAYER_VISOR,P);
    else pxR(x,7,2,2,1,COLORS.PLAYER_VISOR,P);
    pxR(x,5,12,2,3,COLORS.PLAYER_BODY,P); pxR(x,9,12,2,3,COLORS.PLAYER_BODY,P);
    pxR(x,4,14,3,1,COLORS.WALL_DARK,P); pxR(x,9,14,3,1,COLORS.WALL_DARK,P);
    if(fi===1) pxR(x,12,5,2,4,COLORS.PLAYER_BODY,P);
    else if(fi===2) pxR(x,2,5,2,4,COLORS.PLAYER_BODY,P);
    else{pxR(x,3,6,2,3,COLORS.PLAYER_BODY,P);pxR(x,11,6,2,3,COLORS.PLAYER_BODY,P);}
    px(x,5,1,COLORS.TEXT_WHITE,P);
    c.refresh();
  });
}

function genCoin(sc,S,P){
  const ws=[6,4,2,4];
  for(let f=0;f<4;f++){
    const c=sc.textures.createCanvas(`coin_${f}`,S,S), x=c.context, w=ws[f], ox=8-~~(w/2);
    pxR(x,ox,4,w,8,COLORS.COIN_GOLD,P); pxR(x,ox+1,3,Math.max(1,w-2),10,COLORS.COIN_GOLD,P);
    if(w>2) pxR(x,ox+1,5,1,4,COLORS.COIN_SHINE,P);
    if(w>=4){pxR(x,7,5,2,1,COLORS.TORCH_ORANGE,P);pxR(x,7,7,2,1,COLORS.TORCH_ORANGE,P);}
    c.refresh();
  }
}

function genSpike(sc,S,P){
  const c=sc.textures.createCanvas('spike',S,S), x=c.context;
  pxR(x,1,13,14,2,COLORS.SPIKE_DARK,P);
  [{bx:2,ty:4},{bx:6,ty:2},{bx:10,ty:5}].forEach(s=>{
    for(let y=13;y>=s.ty;y--){
      const p=(13-y)/(13-s.ty), hw=Math.max(0,~~(1.5*(1-p))), cx=s.bx+1;
      for(let d=-hw;d<=hw;d++) px(x,cx+d,y,p>0.7?COLORS.SPIKE_RED:COLORS.SPIKE_DARK,P);
    }
    px(x,s.bx+1,s.ty,COLORS.TEXT_WHITE,P);
  });
  c.refresh();
}

function genExit(sc,S,P){
  for(let f=0;f<2;f++){
    const c=sc.textures.createCanvas(`exit_${f}`,S,S), x=c.context;
    const col=f===0?COLORS.EXIT_CYAN:COLORS.EXIT_GLOW, is=f===0?4:5, o=8-~~(is/2);
    pxR(x,3,3,10,10,col,P); pxR(x,o,o,is,is,COLORS.VOID,P);
    px(x,3,3,COLORS.VOID,P);px(x,12,3,COLORS.VOID,P);px(x,3,12,COLORS.VOID,P);px(x,12,12,COLORS.VOID,P);
    px(x,5,5,COLORS.TEXT_WHITE,P);px(x,10,10,COLORS.TEXT_WHITE,P);
    c.refresh();
  }
}

function genTorch(sc,S,P){
  for(let f=0;f<2;f++){
    const c=sc.textures.createCanvas(`torch_${f}`,S,S), x=c.context, fh=f===0?5:6;
    pxR(x,6,8,4,6,COLORS.WALL_DARK,P); pxR(x,7,7,2,2,COLORS.GATE_BROWN,P);
    pxR(x,7,7-fh,2,fh,COLORS.TORCH_ORANGE,P); pxR(x,6,8-fh,4,fh-2,COLORS.TORCH_YELLOW,P);
    px(x,7+f,7-fh-1,COLORS.TORCH_YELLOW,P); pxR(x,7,9-fh,2,2,COLORS.TEXT_WHITE,P);
    c.refresh();
  }
}

function genEnemy(sc,S,P){
  const types = [
    { key: 'enemy_patrol', main: COLORS.ENEMY_GREEN, dark: COLORS.ENEMY_DARK },
    { key: 'enemy_chaser', main: COLORS.ENEMY_RED, dark: 0xa83232 },
    { key: 'enemy_orbiter', main: COLORS.ENEMY_BLUE, dark: 0x2980b9 }
  ];

  types.forEach(t => {
    for(let f=0;f<2;f++){
      const c=sc.textures.createCanvas(`${t.key}_${f}`,S,S), x=c.context;
      pxR(x,5,3,6,8,t.main,P); pxR(x,4,4,8,6,t.dark,P);
      pxR(x,5,1,6,4,t.main,P);
      pxR(x,6,2,2,2,COLORS.SPIKE_RED,P); pxR(x,10,2,2,2,COLORS.SPIKE_RED,P);
      px(x,7,2,COLORS.TEXT_WHITE,P); px(x,11,2,COLORS.TEXT_WHITE,P);
      const lx=f===0?5:6, rx=f===0?9:8;
      pxR(x,lx,11,2,4,t.dark,P); pxR(x,rx,11,2,4,t.dark,P);
      pxR(x,3,5,2,3,t.main,P); pxR(x,11,5,2,3,t.main,P);
      if(t.key === 'enemy_orbiter') { px(x,7,4,COLORS.TEXT_WHITE,P); px(x,8,4,COLORS.TEXT_WHITE,P); }
      c.refresh();
    }
  });

  // Frozen state overlay
  const c=sc.textures.createCanvas('frozen_overlay',S,S), x=c.context;
  pxR(x,3,1,10,14,COLORS.POWERUP_FREEZE,P);
  c.context.globalCompositeOperation = 'destination-in';
  pxR(x,0,0,16,16,'rgba(0,0,0,0.6)',P);
  c.refresh();
}

function genParticles(sc){
  const c1=sc.textures.createCanvas('particle',8,8), x1=c1.context;
  const g1=x1.createRadialGradient(4,4,0,4,4,4);
  g1.addColorStop(0,hexToRgba(COLORS.TEXT_WHITE,1));
  g1.addColorStop(0.4,hexToRgba(COLORS.TRAIL_PURPLE,0.8));
  g1.addColorStop(1,hexToRgba(COLORS.TRAIL_PURPLE,0));
  x1.fillStyle=g1; x1.fillRect(0,0,8,8); c1.refresh();

  const c2=sc.textures.createCanvas('tide_particle',8,8), x2=c2.context;
  const g2=x2.createRadialGradient(4,4,0,4,4,4);
  g2.addColorStop(0,hexToRgba(COLORS.TIDE_PURPLE,1));
  g2.addColorStop(1,hexToRgba(COLORS.TIDE_PURPLE,0));
  x2.fillStyle=g2; x2.fillRect(0,0,8,8); c2.refresh();

  const c3=sc.textures.createCanvas('light_glow',128,128), x3=c3.context;
  const g3=x3.createRadialGradient(64,64,0,64,64,64);
  g3.addColorStop(0,hexToRgba(COLORS.TORCH_ORANGE,0.25));
  g3.addColorStop(0.5,hexToRgba(COLORS.TORCH_ORANGE,0.08));
  g3.addColorStop(1,'rgba(0,0,0,0)');
  x3.fillStyle=g3; x3.fillRect(0,0,128,128); c3.refresh();

  const c4=sc.textures.createCanvas('player_glow',96,96), x4=c4.context;
  const g4=x4.createRadialGradient(48,48,0,48,48,48);
  g4.addColorStop(0,hexToRgba(COLORS.PLAYER_VISOR,0.2));
  g4.addColorStop(0.6,hexToRgba(COLORS.TRAIL_BLUE,0.05));
  g4.addColorStop(1,'rgba(0,0,0,0)');
  x4.fillStyle=g4; x4.fillRect(0,0,96,96); c4.refresh();
}

function genSwitch(sc,S,P){
  const c=sc.textures.createCanvas('switch',S,S), x=c.context;
  pxR(x,4,10,8,4,COLORS.WALL_DARK,P); pxR(x,5,11,6,2,COLORS.SWITCH_BLUE,P);
  pxR(x,7,4,2,7,COLORS.WALL_LIGHT,P); pxR(x,6,3,4,2,COLORS.SWITCH_BLUE,P);
  c.refresh();
}

function genGate(sc,S,P){
  const c=sc.textures.createCanvas('gate',S,S), x=c.context;
  for(let i=1;i<15;i+=3) pxR(x,i,0,2,16,COLORS.WALL_DARK,P);
  pxR(x,0,2,16,1,COLORS.WALL_LIGHT,P); pxR(x,0,8,16,1,COLORS.WALL_LIGHT,P);
  pxR(x,0,14,16,1,COLORS.WALL_LIGHT,P);
  c.refresh();
}

function genPowerUps(sc,S,P){
  const pUps = [
    { key: 'powerup_shield', color: COLORS.POWERUP_SHIELD },
    { key: 'powerup_freeze', color: COLORS.POWERUP_FREEZE },
    { key: 'powerup_magnet', color: COLORS.POWERUP_MAGNET }
  ];
  pUps.forEach(p => {
    const c=sc.textures.createCanvas(p.key,S,S), x=c.context;
    pxR(x,4,4,8,8,COLORS.VOID,P);
    pxR(x,5,3,6,10,p.color,P); pxR(x,3,5,10,6,p.color,P);
    pxR(x,6,5,4,6,COLORS.TEXT_WHITE,P);
    if(p.key === 'powerup_shield') { pxR(x,7,4,2,2,COLORS.TEXT_GOLD,P); }
    if(p.key === 'powerup_freeze') { pxR(x,7,7,2,2,COLORS.TEXT_WHITE,P); px(x,6,6,COLORS.TEXT_WHITE,P); }
    if(p.key === 'powerup_magnet') { pxR(x,6,5,1,3,COLORS.TEXT_GOLD,P); pxR(x,9,5,1,3,COLORS.TEXT_GOLD,P); }
    c.refresh();
  });
}

function genTraps(sc,S,P){
  // Timed Spikes
  for(let f=0;f<2;f++){
    const c=sc.textures.createCanvas(`timed_spike_${f}`,S,S), x=c.context;
    pxR(x,1,13,14,2,COLORS.SPIKE_DARK,P);
    if (f === 1) { // Active
      [{bx:2,ty:4},{bx:6,ty:2},{bx:10,ty:5}].forEach(s=>{
        for(let y=13;y>=s.ty;y--){
          const p=(13-y)/(13-s.ty), hw=Math.max(0,~~(1.5*(1-p))), cx=s.bx+1;
          for(let d=-hw;d<=hw;d++) px(x,cx+d,y,p>0.7?COLORS.SPIKE_RED:COLORS.SPIKE_DARK,P);
        }
        px(x,s.bx+1,s.ty,COLORS.TEXT_WHITE,P);
      });
    } else { // Inactive
      pxR(x,2,11,12,2,COLORS.WALL_DARK,P);
    }
    c.refresh();
  }

  // Dart Launcher
  const cDartL=sc.textures.createCanvas('dart_launcher',S,S), xDartL=cDartL.context;
  pxR(xDartL,2,2,12,12,COLORS.WALL_DARK,P);
  pxR(xDartL,4,4,8,8,COLORS.VOID,P);
  pxR(xDartL,6,6,4,4,COLORS.DART_GREY,P);
  cDartL.refresh();

  // Dart
  const cDart=sc.textures.createCanvas('dart',S,S), xDart=cDart.context;
  pxR(xDart,4,7,8,2,COLORS.DART_GREY,P);
  pxR(xDart,10,6,2,4,COLORS.TEXT_WHITE,P);
  px(xDart,12,7,COLORS.SPIKE_RED,P); px(xDart,12,8,COLORS.SPIKE_RED,P);
  cDart.refresh();

  // Crumble Floor
  for(let f=0;f<3;f++){
    const c=sc.textures.createCanvas(`crumble_${f}`,S,S), x=c.context;
    pxR(x,2,2,12,12,COLORS.FLOOR_DARK,P);
    if(f === 0) { // Solid
      pxR(x,3,3,10,10,COLORS.FLOOR_MID,P);
    } else if (f === 1) { // Cracking
      pxR(x,3,3,10,10,COLORS.FLOOR_MID,P);
      pxR(x,5,5,6,1,COLORS.VOID,P); pxR(x,7,4,1,6,COLORS.VOID,P);
    } else { // Broken (mostly transparent)
      px(x,3,3,COLORS.FLOOR_MID,P); px(x,12,12,COLORS.FLOOR_MID,P);
    }
    c.refresh();
  }
}

function genTeleporters(sc,S,P){
  const tps = [{key: 'teleport_a', c: COLORS.TELEPORT_A}, {key: 'teleport_b', c: COLORS.TELEPORT_B}];
  tps.forEach(tp => {
    for(let f=0;f<2;f++){
      const c=sc.textures.createCanvas(`${tp.key}_${f}`,S,S), x=c.context;
      const r = f === 0 ? 5 : 6;
      pxR(x, 8-r, 8-r, r*2, r*2, tp.c, P);
      pxR(x, 8-(r-2), 8-(r-2), (r-2)*2, (r-2)*2, COLORS.VOID, P);
      px(x, 7, 7, COLORS.TEXT_WHITE, P); px(x, 8, 8, COLORS.TEXT_WHITE, P);
      c.refresh();
    }
  });
}
