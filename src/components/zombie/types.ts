// src/components/zombie/types.ts

export type WeaponType = 'pistol' | 'gatling' | 'shotgun' | 'rocket' | 'laser';
export type SubWeaponType = 'none' | 'missile' | 'laser';

export interface PlayerShip {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  bombs: number;
  maxBombs: number;
  mainWeaponLevel: number; // 1 to 5 (Lv.1: twin shot -> Lv.5: 5-way heavy storm)
  subWeapon: SubWeaponType;
  subWeaponLevel: number; // 1 to 3
  shootCooldown: number;
  subWeaponCooldown: number;
  invulnerableTimer: number;
  bankAngle: number;
  thrusterFrame: number;
  size: number;
  monkeId: number;
}

export type EnemyAircraftType = 
  | 'scout' 
  | 'interceptor' 
  | 'gunship' 
  | 'kamikaze' 
  | 'mothership'
  | 'walker' 
  | 'runner' 
  | 'tank' 
  | 'exploder' 
  | 'boss';

export type ZombieType = EnemyAircraftType;

export interface Zombie {
  id: number;
  type: ZombieType;
  x: number;
  y: number;
  targetX?: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  vx?: number;
  vy?: number;
  color: string;
  skinId: number;
  hitFlash: number;
  scoreValue: number;
  walkFrame: number;
  bankAngle?: number;
  shootCooldown: number;
  shootInterval: number;
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
  isPlayer: boolean;
  isMissile?: boolean;
  targetZombieId?: number;
  life?: number;
}

export interface EnemyBullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  type: 'normal' | 'aimed' | 'spread' | 'heavy';
}

export type PowerupType = 'power' | 'missile' | 'laser' | 'bomb' | 'shield';

export interface DroppedItem {
  id: number;
  type: PowerupType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  label: string;
  color: string;
  bgGlow: string;
  life: number;
  radius: number;
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
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  bombs: number;
  powerLevel: number;
  subWeapon: SubWeaponType;
  subWeaponLevel: number;
  combo: number;
  isFever: boolean;
  isPaused: boolean;
  // Legacy / optional metric fields for backward compatibility
  maxCrowd?: number;
  gatesPassed?: number;
  armor?: number;
  maxArmor?: number;
  nukeCharge?: number;
  freezeTimeLeft?: number;
}
