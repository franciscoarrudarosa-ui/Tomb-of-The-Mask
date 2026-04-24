import { TILE_SIZE, COLORS } from '../constants.js';

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

export function generateAllSprites(scene) {
  const S = TILE_SIZE, P = 2;
  genWall(scene,S,P); genFloor(scene,S,P); genPlayer(scene,S,P);
  genCoin(scene,S,P); genSpike(scene,S,P); genExit(scene,S,P);
  genTorch(scene,S,P); genEnemy(scene,S,P); genParticles(scene);
  genSwitch(scene,S,P); genGate(scene,S,P);
}

function genWall(sc,S,P){
  const c=sc.textures.createCanvas('wall',S,S), x=c.context;
  pxR(x,0,0,16,16,COLORS.WALL_MID,P);
  pxR(x,0,0,16,1,COLORS.WALL_HIGHLIGHT,P); pxR(x,0,0,1,8,COLORS.WALL_HIGHLIGHT,P);
  pxR(x,0,8,16,1,COLORS.WALL_DARK,P); pxR(x,8,0,1,8,COLORS.WALL_DARK,P);
  pxR(x,0,9,16,1,COLORS.WALL_HIGHLIGHT,P); pxR(x,4,9,1,7,COLORS.WALL_DARK,P);
  pxR(x,12,9,1,7,COLORS.WALL_DARK,P);
  for(let i=0;i<6;i++) px(x,~~(Math.random()*15),~~(Math.random()*15),Math.random()>0.5?COLORS.WALL_DARK:COLORS.WALL_LIGHT,P);
  c.refresh();
}

function genFloor(sc,S,P){
  const c=sc.textures.createCanvas('floor',S,S), x=c.context;
  pxR(x,0,0,16,16,COLORS.FLOOR_MID,P);
  pxR(x,0,0,16,1,COLORS.FLOOR_LIGHT,P); pxR(x,0,0,1,16,COLORS.FLOOR_LIGHT,P);
  pxR(x,15,0,1,16,COLORS.FLOOR_DARK,P); pxR(x,0,15,16,1,COLORS.FLOOR_DARK,P);
  for(let i=0;i<3;i++) px(x,~~(Math.random()*14)+1,~~(Math.random()*14)+1,COLORS.FLOOR_DARK,P);
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
  for(let f=0;f<2;f++){
    const c=sc.textures.createCanvas(`enemy_${f}`,S,S), x=c.context;
    pxR(x,5,3,6,8,COLORS.ENEMY_GREEN,P); pxR(x,4,4,8,6,COLORS.ENEMY_DARK,P);
    pxR(x,5,1,6,4,COLORS.ENEMY_GREEN,P);
    pxR(x,6,2,2,2,COLORS.SPIKE_RED,P); pxR(x,10,2,2,2,COLORS.SPIKE_RED,P);
    px(x,7,2,COLORS.TEXT_WHITE,P); px(x,11,2,COLORS.TEXT_WHITE,P);
    const lx=f===0?5:6, rx=f===0?9:8;
    pxR(x,lx,11,2,4,COLORS.ENEMY_DARK,P); pxR(x,rx,11,2,4,COLORS.ENEMY_DARK,P);
    pxR(x,3,5,2,3,COLORS.ENEMY_GREEN,P); pxR(x,11,5,2,3,COLORS.ENEMY_GREEN,P);
    c.refresh();
  }
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
