// src/components/zombie/types.ts

export type WeaponType = 'pistol' | 'shotgun' | 'gatling' | 'laser' | 'rocket';

export interface WeaponConfig {
  type: WeaponType;
  nameZh: string;
  nameEn: string;
  icon: string;
  fireInterval: number; // ms between shots per monke
  bulletSpeed: number;
  damage: number;
  bulletColor: string;
  bulletRadius: number;
  pierce?: number;
  spreadCount?: number;
  spreadAngle?: number;
  splashRadius?: number;
  durationMs?: number; // active duration if picked up as buff
}

export type GateOp = 'add' | 'multiply' | 'subtract' | 'divide' | 'weapon';

export interface Gate {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  op: GateOp;
  value: number; // e.g. +5, x2, -3, or weapon index
  weaponType?: WeaponType;
  speed: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  hitsReceived: number;
  hitsRequired: number;
  maxUpgrades: number;
  upgradesDone: number;
  originalValue: number;
}

export type ZombieType = 'walker' | 'runner' | 'tank' | 'exploder' | 'boss';

export interface Zombie {
  id: number;
  type: ZombieType;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  color: string;
  skinId: number; // for rendering zombie pixel aesthetics
  hitFlash: number;
  scoreValue: number;
  walkFrame: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  pierce: number;
  weaponType: WeaponType;
  splashRadius?: number;
}

export interface MonkeUnit {
  id: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  size: number;
  shootCooldown: number;
  monkeId: number;
  walkFrame: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  alpha: number;
  vy: number;
  life: number;
}

export interface GameStats {
  score: number;
  zombiesKilled: number;
  wave: number;
  maxCrowd: number;
  gatesPassed: number;
}
