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
  mainWeaponLevel: number; // 1 to 5 (Lv.1: twin shot -> Lv.5: 9-way heavy storm)
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
  | 'midboss'
  | 'boss'
  | 'mothership'
  | 'carrier'
  | 'walker' 
  | 'runner' 
  | 'tank' 
  | 'exploder';

export type ZombieType = EnemyAircraftType;

export interface Zombie {
  id: number;
  type: ZombieType;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
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
  // Boss & MidBoss extensions
  isBoss?: boolean;
  isMidBoss?: boolean;
  bossName?: string;
  phase?: number;
  maxPhase?: number;
  attackTimer?: number;
  attackPattern?: number;
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
  type: 'normal' | 'aimed' | 'spread' | 'heavy' | 'spiral';
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

export type StageTerrainType = 
  | 'sky' 
  | 'storm' 
  | 'canyon' 
  | 'cyber' 
  | 'arctic' 
  | 'volcano' 
  | 'orbit' 
  | 'asteroid' 
  | 'void' 
  | 'core';

export type StageState = 'intro' | 'playing' | 'midboss' | 'stageboss' | 'clear' | 'all_clear';

export interface StageConfig {
  stageNumber: number; // 1 .. 10
  nameZh: string;
  nameEn: string;
  subtitleZh: string;
  subtitleEn: string;
  terrain: StageTerrainType;
  bgColor: string;
  starColor: string;
  cloudColor?: string;
  targetDistance: number; // distance to spawn stage boss
  midBossHp: number;
  midBossNameZh: string;
  midBossNameEn: string;
  bossHp: number;
  bossNameZh: string;
  bossNameEn: string;
  bossColor: string;
  clearBonus: number;
}

export const STAGE_CONFIGS: StageConfig[] = [
  {
    stageNumber: 1,
    nameZh: '平流层巡航',
    nameEn: 'Stratosphere Patrol',
    subtitleZh: '晨光穿云 • 扫清前哨空域',
    subtitleEn: 'Sunlit Cloudscape • Clear the Forward Post',
    terrain: 'sky',
    bgColor: '#03142e',
    starColor: '#e0f2fe',
    cloudColor: 'rgba(255, 255, 255, 0.12)',
    targetDistance: 1200,
    midBossHp: 750,
    midBossNameZh: '「狂风」双联装甲截击机',
    midBossNameEn: 'Gale Twin-Interceptor',
    bossHp: 2200,
    bossNameZh: '空中巡洋要塞「天穹一号」',
    bossNameEn: 'Aero Cruiser Skyward I',
    bossColor: '#38bdf8',
    clearBonus: 3000,
  },
  {
    stageNumber: 2,
    nameZh: '雷暴积雨云',
    nameEn: 'Thunderstorm Alley',
    subtitleZh: '狂暴电弧 • 突破风暴航线',
    subtitleEn: 'Violent Arc • Pierce the Storm Corridor',
    terrain: 'storm',
    bgColor: '#16092b',
    starColor: '#c084fc',
    cloudColor: 'rgba(168, 85, 247, 0.15)',
    targetDistance: 1350,
    midBossHp: 950,
    midBossNameZh: '「电弧」磁暴拦截艇',
    midBossNameEn: 'Arc Tempest Interceptor',
    bossHp: 2800,
    bossNameZh: '雷暴风暴母舰「雷神之锤」',
    bossNameEn: 'Thunderstrike Fortress Mjolnir',
    bossColor: '#a855f7',
    clearBonus: 4000,
  },
  {
    stageNumber: 3,
    nameZh: '荒漠大峡谷',
    nameEn: 'Red Rock Canyon',
    subtitleZh: '黄沙漫卷 • 贴地超音速突防',
    subtitleEn: 'Dust Storm • Supersonic Low-Altitude Strike',
    terrain: 'canyon',
    bgColor: '#261208',
    starColor: '#fdba74',
    cloudColor: 'rgba(249, 115, 22, 0.14)',
    targetDistance: 1450,
    midBossHp: 1200,
    midBossNameZh: '「穿山甲」重装巡航炮艇',
    midBossNameEn: 'Armadillo Armored Gunboat',
    bossHp: 3400,
    bossNameZh: '荒漠战列巨舰「沙暴利维坦」',
    bossNameEn: 'Desert Battleship Leviathan',
    bossColor: '#f97316',
    clearBonus: 5000,
  },
  {
    stageNumber: 4,
    nameZh: '霓虹不夜城',
    nameEn: 'Cyberpunk Metropolis',
    subtitleZh: '赛博矩阵 • 楼宇缝隙弹幕突围',
    subtitleEn: 'Cyber Grid • Skyscraper Danmaku Breach',
    terrain: 'cyber',
    bgColor: '#081426',
    starColor: '#22d3ee',
    cloudColor: 'rgba(236, 72, 153, 0.15)',
    targetDistance: 1550,
    midBossHp: 1400,
    midBossNameZh: '「魅影」浮游矩阵机',
    midBossNameEn: 'Phantom Matrix Drone',
    bossHp: 4000,
    bossNameZh: '超空泡浮空航母「新东京号」',
    bossNameEn: 'Hover Carrier Neo-Tokyo',
    bossColor: '#ec4899',
    clearBonus: 6000,
  },
  {
    stageNumber: 5,
    nameZh: '极地冰川海',
    nameEn: 'Arctic Glaciers',
    subtitleZh: '极光幽辉 • 破击绝对零度防线',
    subtitleEn: 'Aurora Glow • Shatter the Absolute Zero Line',
    terrain: 'arctic',
    bgColor: '#021827',
    starColor: '#a5f3fc',
    cloudColor: 'rgba(6, 182, 212, 0.15)',
    targetDistance: 1650,
    midBossHp: 1650,
    midBossNameZh: '「暴风雪」重装破冰炮艇',
    midBossNameEn: 'Blizzard Heavy Icebreaker',
    bossHp: 4800,
    bossNameZh: '极寒空天要塞「绝对零度」',
    bossNameEn: 'Cryo Dreadnought Absolute Zero',
    bossColor: '#06b6d4',
    clearBonus: 7500,
  },
  {
    stageNumber: 6,
    nameZh: '熔岩火山口',
    nameEn: 'Volcano Caldera',
    subtitleZh: '暗红地狱 • 迎击地热重炮群',
    subtitleEn: 'Infernal Abyss • Intercept Geothermal Artillery',
    terrain: 'volcano',
    bgColor: '#240606',
    starColor: '#fca5a5',
    cloudColor: 'rgba(239, 68, 68, 0.18)',
    targetDistance: 1750,
    midBossHp: 1900,
    midBossNameZh: '「地狱犬」熔岩突防机',
    midBossNameEn: 'Cerberus Magma Striker',
    bossHp: 5600,
    bossNameZh: '炎狱重炮要塞「火神核」',
    bossNameEn: 'Volcanic Core Fortress Vulcan',
    bossColor: '#ef4444',
    clearBonus: 9000,
  },
  {
    stageNumber: 7,
    nameZh: '天梯轨道站',
    nameEn: 'Orbital Elevator',
    subtitleZh: '天穹边界 • 仰冲近地轨道防御网',
    subtitleEn: 'Edge of Horizon • Breach Low Earth Defense',
    terrain: 'orbit',
    bgColor: '#09091a',
    starColor: '#93c5fd',
    cloudColor: 'rgba(59, 130, 246, 0.15)',
    targetDistance: 1850,
    midBossHp: 2200,
    midBossNameZh: '「守门人」轨道拦截舰',
    midBossNameEn: 'Gatekeeper Orbital Frigate',
    bossHp: 6400,
    bossNameZh: '轨道防御平台「天基神盾」',
    bossNameEn: 'Orbital Defense Aegis Platform',
    bossColor: '#3b82f6',
    clearBonus: 11000,
  },
  {
    stageNumber: 8,
    nameZh: '小行星陨石带',
    nameEn: 'Asteroid Belt',
    subtitleZh: '碎石密布 • 撕裂巨神采掘要塞',
    subtitleEn: 'Dense Debris • Tear Down Titan Mining Rig',
    terrain: 'asteroid',
    bgColor: '#0a0a0f',
    starColor: '#e2e8f0',
    cloudColor: 'rgba(148, 163, 184, 0.12)',
    targetDistance: 1950,
    midBossHp: 2500,
    midBossNameZh: '「石碎」重装开采突击舰',
    midBossNameEn: 'Crusher Assault Cruiser',
    bossHp: 7200,
    bossNameZh: '小行星机械巢穴「巨神兵」',
    bossNameEn: 'Asteroid Hive Titan Goliath',
    bossColor: '#94a3b8',
    clearBonus: 13000,
  },
  {
    stageNumber: 9,
    nameZh: '异星先锋前哨',
    nameEn: 'Alien Vanguard',
    subtitleZh: '暗黑星云 • 迎击生化浮游主力舰队',
    subtitleEn: 'Dark Nebula • Engage Bio-Mechanical Armada',
    terrain: 'void',
    bgColor: '#150324',
    starColor: '#f472b6',
    cloudColor: 'rgba(217, 70, 239, 0.16)',
    targetDistance: 2100,
    midBossHp: 2800,
    midBossNameZh: '「虚空幽灵」生化先锋',
    midBossNameEn: 'Void Wraith Bio-Vanguard',
    bossHp: 8000,
    bossNameZh: '异星无畏旗舰「终焉序曲」',
    bossNameEn: 'Alien Dreadnought Void Harbinger',
    bossColor: '#d946ef',
    clearBonus: 16000,
  },
  {
    stageNumber: 10,
    nameZh: '节点母星核心',
    nameEn: 'The Monke Matrix Core',
    subtitleZh: '黄金星宿 • 决战终极要塞！',
    subtitleEn: 'Golden Matrix • Final Decisive Battle!',
    terrain: 'core',
    bgColor: '#1a1002',
    starColor: '#fde047',
    cloudColor: 'rgba(245, 158, 11, 0.2)',
    targetDistance: 2300,
    midBossHp: 3200,
    midBossNameZh: '「黄金近卫」皇家旗舰',
    midBossNameEn: 'Golden Guard Royal Flagship',
    bossHp: 9500,
    bossNameZh: '终极空天要塞「节点霸王」',
    bossNameEn: 'Omega Monke Overlord Sovereign',
    bossColor: '#f59e0b',
    clearBonus: 25000,
  },
];

export interface GameStats {
  score: number;
  zombiesKilled: number;
  wave: number;
  currentStage: number; // 1 to 10
  stageState: StageState;
  stageProgress: number; // 0 to 100
  stageNameZh: string;
  stageNameEn: string;
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
  // Boss stats for dynamic HUD
  isBossActive?: boolean;
  bossName?: string;
  bossHp?: number;
  bossMaxHp?: number;
  bossPhase?: number;
  // Legacy / optional metric fields for backward compatibility
  maxCrowd?: number;
  gatesPassed?: number;
  armor?: number;
  maxArmor?: number;
  nukeCharge?: number;
  freezeTimeLeft?: number;
}

