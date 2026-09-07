// src/components/zombie/ZombieSprites.ts
import type { ZombieType, SubWeaponType, DroppedItem, EnemyBullet, Bullet } from './types';

// Cache for all pre-rendered pixel sprites
const spriteCache = new Map<string, HTMLCanvasElement>();

/**
 * Helper to draw a pixel rectangle on an offscreen context
 */
function pRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/**
 * Generates an authentic retro pixel-art enemy aircraft sprite
 */
export function getZombieSprite(
  type: ZombieType,
  frame: number, // animation frame
  isHit: boolean,
  stageNum: number = 1,
  isEnraged: boolean = false
): HTMLCanvasElement {
  const key = `${type}_${frame % 2}_${isHit ? 1 : 0}_${stageNum}_${isEnraged ? 1 : 0}`;
  const existing = spriteCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;

  const f = frame % 2;

  if (type === 'boss' || type === 'mothership') {
    // 80x80 Colossal Aerial Dreadnought Boss
    canvas.width = 80;
    canvas.height = 80;
    renderMothershipSprite(ctx, f, isHit, stageNum, isEnraged);
  } else if (type === 'midboss') {
    // 56x56 Heavy Prototype Assault Craft (Mini-Boss)
    canvas.width = 56;
    canvas.height = 56;
    renderMiniBossSprite(ctx, f, isHit, stageNum);
  } else if (type === 'tank' || type === 'gunship') {
    // 48x48 Heavy Armored Flying Fortress Gunship
    canvas.width = 48;
    canvas.height = 48;
    renderGunshipSprite(ctx, f, isHit);
  } else if (type === 'exploder' || type === 'kamikaze') {
    // 36x36 Volatile Plasma Bomb Drone
    canvas.width = 36;
    canvas.height = 36;
    renderKamikazeSprite(ctx, f, isHit);
  } else if (type === 'runner' || type === 'interceptor') {
    // 34x34 Supersonic Interceptor Fighter Jet
    canvas.width = 34;
    canvas.height = 34;
    renderInterceptorSprite(ctx, f, isHit);
  } else {
    // 32x32 Scout Drone Light Fighter
    canvas.width = 32;
    canvas.height = 32;
    renderScoutDroneSprite(ctx, f, isHit);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * 1. SCOUT DRONE (32x32)
 * Green/Cyan high-tech recon drone with swept wings, dual laser pods, and central sensor eye
 */
function renderScoutDroneSprite(ctx: CanvasRenderingContext2D, frame: number, isHit: boolean) {
  const armor = isHit ? '#ffffff' : '#0f766e'; // dark teal
  const armorLight = isHit ? '#ffffff' : '#14b8a6'; // bright teal
  const frameColor = isHit ? '#ffffff' : '#1e293b'; // slate dark
  const eye = isHit ? '#ffffff' : '#22c55e'; // neon green optical core
  const thruster = isHit ? '#ffffff' : frame === 0 ? '#38bdf8' : '#0284c7';

  // Forward wing pylons
  pRect(ctx, 4, 12, 6, 8, armor);
  pRect(ctx, 22, 12, 6, 8, armor);
  pRect(ctx, 2, 14, 3, 10, armorLight);
  pRect(ctx, 27, 14, 3, 10, armorLight);

  // Wingtip gun barrels
  pRect(ctx, 3, 8, 2, 7, frameColor);
  pRect(ctx, 27, 8, 2, 7, frameColor);
  pRect(ctx, 3, 6, 2, 2, '#38bdf8');
  pRect(ctx, 27, 6, 2, 2, '#38bdf8');

  // Central chassis
  pRect(ctx, 10, 8, 12, 18, armor);
  pRect(ctx, 12, 6, 8, 4, armorLight); // nose cone
  pRect(ctx, 11, 10, 10, 12, frameColor);

  // Optical sensor eye
  pRect(ctx, 13, 12, 6, 5, eye);
  pRect(ctx, 15, 13, 2, 3, '#ffffff');

  // Rear thruster exhaust
  pRect(ctx, 13, 26, 6, 3, frameColor);
  pRect(ctx, 14, 28, 4, frame === 0 ? 4 : 2, thruster);
}

/**
 * 2. SUPERSONIC INTERCEPTOR (34x34)
 * Dark purple/violet delta-wing high-speed fighter jet with sharp nose and dual thrusters
 */
function renderInterceptorSprite(ctx: CanvasRenderingContext2D, frame: number, isHit: boolean) {
  const armor = isHit ? '#ffffff' : '#581c87'; // deep violet
  const armorLight = isHit ? '#ffffff' : '#9333ea'; // vivid purple
  const frameColor = isHit ? '#ffffff' : '#1e1b4b'; // dark navy
  const cockpit = isHit ? '#ffffff' : '#f43f5e'; // glowing red visor canopy
  const thruster = isHit ? '#ffffff' : frame === 0 ? '#a855f7' : '#ec4899';

  // Delta Wings
  pRect(ctx, 2, 18, 8, 8, armor);
  pRect(ctx, 24, 18, 8, 8, armor);
  pRect(ctx, 0, 22, 4, 6, armorLight);
  pRect(ctx, 30, 22, 4, 6, armorLight);

  // Sharp Fuselage Body
  pRect(ctx, 15, 2, 4, 6, armorLight); // needle tip
  pRect(ctx, 13, 7, 8, 8, armor);
  pRect(ctx, 11, 14, 12, 14, armor);
  pRect(ctx, 12, 16, 10, 10, frameColor);

  // Glowing Cockpit / Targeting Visor
  pRect(ctx, 14, 10, 6, 6, cockpit);
  pRect(ctx, 16, 11, 2, 2, '#ffffff');

  // Twin Jet Afterburners
  pRect(ctx, 11, 28, 4, 3, frameColor);
  pRect(ctx, 19, 28, 4, 3, frameColor);
  pRect(ctx, 12, 30, 2, frame === 0 ? 5 : 3, thruster);
  pRect(ctx, 20, 30, 2, frame === 0 ? 5 : 3, thruster);
}

/**
 * 3. HEAVY ARMORED GUNSHIP (48x48)
 * Bronze/gold heavy flying fortress with reinforced armor plates and twin rotatable flak turrets
 */
function renderGunshipSprite(ctx: CanvasRenderingContext2D, frame: number, isHit: boolean) {
  const armor = isHit ? '#ffffff' : '#854d0e'; // bronze
  const armorLight = isHit ? '#ffffff' : '#eab308'; // gold
  const frameColor = isHit ? '#ffffff' : '#1c1917'; // stone dark
  const glass = isHit ? '#ffffff' : '#38bdf8'; // blue sensor bridge
  const thruster = isHit ? '#ffffff' : frame === 0 ? '#f97316' : '#eab308';

  // Massive side wing sponsons
  pRect(ctx, 2, 14, 10, 24, armor);
  pRect(ctx, 36, 14, 10, 24, armor);
  pRect(ctx, 4, 18, 6, 18, armorLight);
  pRect(ctx, 38, 18, 6, 18, armorLight);

  // Side Turret Cannons
  pRect(ctx, 5, 8, 4, 8, frameColor);
  pRect(ctx, 39, 8, 4, 8, frameColor);
  pRect(ctx, 6, 6, 2, 4, '#f59e0b');
  pRect(ctx, 40, 6, 2, 4, '#f59e0b');

  // Main Fortress Hull
  pRect(ctx, 12, 10, 24, 30, armor);
  pRect(ctx, 16, 6, 16, 6, armorLight); // armored bow
  pRect(ctx, 14, 14, 20, 22, frameColor);

  // Command Bridge
  pRect(ctx, 18, 12, 12, 5, glass);
  pRect(ctx, 20, 13, 8, 2, '#ffffff');

  // Heavy Center Cannon
  pRect(ctx, 22, 2, 4, 6, '#475569');

  // Heavy Quad Thruster Exhaust
  pRect(ctx, 14, 40, 4, 3, frameColor);
  pRect(ctx, 20, 40, 4, 3, frameColor);
  pRect(ctx, 24, 40, 4, 3, frameColor);
  pRect(ctx, 30, 40, 4, 3, frameColor);

  const flameLen = frame === 0 ? 5 : 3;
  pRect(ctx, 15, 43, 2, flameLen, thruster);
  pRect(ctx, 21, 43, 2, flameLen + 1, thruster);
  pRect(ctx, 25, 43, 2, flameLen + 1, thruster);
  pRect(ctx, 31, 43, 2, flameLen, thruster);
}

/**
 * 4. KAMIKAZE BOMB DRONE (36x36)
 * Glowing red-orange floating bomb craft with pulsing hazardous fusion reactor
 */
function renderKamikazeSprite(ctx: CanvasRenderingContext2D, frame: number, isHit: boolean) {
  const armor = isHit ? '#ffffff' : '#9a3412'; // rust red
  const armorLight = isHit ? '#ffffff' : '#ea580c'; // fiery orange
  const core = isHit ? '#ffffff' : frame === 0 ? '#fbbf24' : '#ef4444'; // pulsing reactor core
  const frameColor = isHit ? '#ffffff' : '#292524';

  // Triangular Aerodynamic Stabilizers
  pRect(ctx, 2, 14, 6, 12, armor);
  pRect(ctx, 28, 14, 6, 12, armor);
  pRect(ctx, 0, 20, 4, 6, armorLight);
  pRect(ctx, 32, 20, 4, 6, armorLight);

  // Main Bomb Fuselage
  pRect(ctx, 8, 8, 20, 22, armor);
  pRect(ctx, 12, 4, 12, 5, armorLight); // warhead detonator tip
  pRect(ctx, 10, 11, 16, 16, frameColor);

  // Pulsing Volatile Core
  pRect(ctx, 12, 13, 12, 12, core);
  pRect(ctx, 15, 16, 6, 6, '#ffffff');

  // Hazard warning chevrons
  pRect(ctx, 11, 24, 4, 2, '#000000');
  pRect(ctx, 21, 24, 4, 2, '#000000');

  // Rear exhaust
  pRect(ctx, 15, 29, 6, 3, frameColor);
  pRect(ctx, 16, 32, 4, frame === 0 ? 4 : 2, '#f97316');
}

/**
 * 4.5 HEAVY PROTOTYPE ASSAULT CRAFT (56x56) - MINI-BOSS
 * Heavy mid-stage elite interceptor with dual rotating plasma generators and reinforced forward armor
 */
function renderMiniBossSprite(
  ctx: CanvasRenderingContext2D,
  frame: number,
  isHit: boolean,
  stageNum: number = 1
) {
  const stagePalettes = [
    { main: '#0369a1', light: '#38bdf8', core: '#e0f2fe' }, // st1
    { main: '#6b21a8', light: '#c084fc', core: '#f3e8ff' }, // st2
    { main: '#9a3412', light: '#fb923c', core: '#ffedd5' }, // st3
    { main: '#be185d', light: '#f472b6', core: '#fdf2f8' }, // st4
    { main: '#0e7490', light: '#22d3ee', core: '#ecfeff' }, // st5
    { main: '#991b1b', light: '#f87171', core: '#fef2f2' }, // st6
    { main: '#1e40af', light: '#60a5fa', core: '#eff6ff' }, // st7
    { main: '#334155', light: '#94a3b8', core: '#f8fafc' }, // st8
    { main: '#86198f', light: '#e879f9', core: '#fdf4ff' }, // st9
    { main: '#92400e', light: '#fbbf24', core: '#fffbeb' }, // st10
  ];
  const p = stagePalettes[(stageNum - 1) % stagePalettes.length];
  const armor = isHit ? '#ffffff' : p.main;
  const armorLight = isHit ? '#ffffff' : p.light;
  const frameColor = isHit ? '#ffffff' : '#0f172a';
  const core = isHit ? '#ffffff' : p.core;
  const warning = isHit ? '#ffffff' : frame === 0 ? '#ef4444' : '#f59e0b';

  // Heavy Swept Mandibles
  pRect(ctx, 4, 18, 10, 26, armor);
  pRect(ctx, 42, 18, 10, 26, armor);
  pRect(ctx, 2, 22, 6, 20, armorLight);
  pRect(ctx, 48, 22, 6, 20, armorLight);

  // Twin Wing Plasma Canister Cannons
  pRect(ctx, 6, 8, 6, 12, frameColor);
  pRect(ctx, 44, 8, 6, 12, frameColor);
  pRect(ctx, 8, 4, 2, 8, warning);
  pRect(ctx, 46, 4, 2, 8, warning);

  // Armored Center Fuselage
  pRect(ctx, 16, 12, 24, 36, armor);
  pRect(ctx, 20, 4, 16, 12, armorLight); // armored prow
  pRect(ctx, 24, 2, 8, 4, '#ffffff');
  pRect(ctx, 18, 16, 20, 26, frameColor);

  // Pulsing Mid-Boss Core Reactor
  pRect(ctx, 22, 22, 12, 12, armorLight);
  pRect(ctx, 25, 25, 6, 6, core);

  // Dual Exhaust Thrusters
  pRect(ctx, 18, 48, 6, 4, frameColor);
  pRect(ctx, 32, 48, 6, 4, frameColor);
  pRect(ctx, 19, 52, 4, frame === 0 ? 6 : 3, '#f97316');
  pRect(ctx, 33, 52, 4, frame === 0 ? 6 : 3, '#f97316');
}

/**
 * 5. COLOSSAL AERIAL DREADNOUGHT BOSS (80x80)
 * Massive stage boss dreadnought with stage-themed armor, command tower, multiple batteries, and raging core in Phase 2
 */
function renderMothershipSprite(
  ctx: CanvasRenderingContext2D,
  frame: number,
  isHit: boolean,
  stageNum: number = 1,
  isEnraged: boolean = false
) {
  const bossPalettes = [
    { armor: '#0369a1', light: '#38bdf8', aura: '#7dd3fc', core: '#38bdf8' }, // 1. Skyward
    { armor: '#581c87', light: '#a855f7', aura: '#e879f9', core: '#c084fc' }, // 2. Storm
    { armor: '#7c2d12', light: '#ea580c', aura: '#fdba74', core: '#f97316' }, // 3. Canyon
    { armor: '#831843', light: '#db2777', aura: '#06b6d4', core: '#f43f5e' }, // 4. Cyber
    { armor: '#164e63', light: '#0891b2', aura: '#67e8f9', core: '#22d3ee' }, // 5. Arctic
    { armor: '#7f1d1d', light: '#dc2626', aura: '#f87171', core: '#ef4444' }, // 6. Volcano
    { armor: '#1e3a8a', light: '#2563eb', aura: '#93c5fd', core: '#60a5fa' }, // 7. Orbit
    { armor: '#1e293b', light: '#475569', aura: '#f59e0b', core: '#94a3b8' }, // 8. Asteroid
    { armor: '#701a75', light: '#c026d3', aura: '#f0abfc', core: '#e879f9' }, // 9. Void
    { armor: '#78350f', light: '#d97706', aura: '#fde047', core: '#fbbf24' }, // 10. Omega Core
  ];
  const p = bossPalettes[(stageNum - 1) % bossPalettes.length];

  const armor = isHit ? '#ffffff' : p.armor;
  const armorLight = isHit ? '#ffffff' : (isEnraged && frame === 0 ? '#ffffff' : p.light);
  const frameColor = isHit ? '#ffffff' : '#09090b';
  const shieldAura = isHit ? '#ffffff' : p.aura;
  const gold = isHit ? '#ffffff' : (isEnraged ? '#ef4444' : '#f59e0b');
  const coreColor = isHit ? '#ffffff' : (isEnraged ? (frame === 0 ? '#ffffff' : '#ef4444') : p.core);
  const thruster = isHit ? '#ffffff' : frame === 0 ? '#ef4444' : '#f97316';

  // Massive Outer Wing Mandibles
  pRect(ctx, 4, 20, 16, 46, armor);
  pRect(ctx, 60, 20, 16, 46, armor);
  pRect(ctx, 2, 28, 8, 32, armorLight);
  pRect(ctx, 70, 28, 8, 32, armorLight);

  // Wing Heavy Turret Pods
  pRect(ctx, 6, 12, 8, 10, frameColor);
  pRect(ctx, 66, 12, 8, 10, frameColor);
  pRect(ctx, 8, 6, 4, 8, gold); // double barrels
  pRect(ctx, 68, 6, 4, 8, gold);

  // Main Dreadnought Hull
  pRect(ctx, 20, 14, 40, 54, armor);
  pRect(ctx, 26, 6, 28, 10, armorLight); // bow ram
  pRect(ctx, 32, 2, 16, 6, isEnraged ? '#ef4444' : '#ffffff'); // prow tip
  pRect(ctx, 24, 20, 32, 42, frameColor);

  // Command Bridge Tower
  pRect(ctx, 32, 22, 16, 12, armorLight);
  pRect(ctx, 34, 26, 12, 4, shieldAura);
  pRect(ctx, 36, 27, 8, 2, '#ffffff');

  // Heavy Central Plasma Core (Pulsating and enraged in phase 2)
  pRect(ctx, 30, 40, 20, 14, gold);
  pRect(ctx, 34, 43, 12, 8, coreColor);
  if (isEnraged) {
    pRect(ctx, 37, 45, 6, 4, '#ffffff');
  }

  // Flank Shield Emitters
  pRect(ctx, 16, 36, 4, 12, shieldAura);
  pRect(ctx, 60, 36, 4, 12, shieldAura);

  // Massive Engine Array (6 Thrusters)
  const engineXs = [10, 24, 34, 42, 52, 66];
  for (const ex of engineXs) {
    pRect(ctx, ex, 68, 4, 4, frameColor);
    pRect(ctx, ex + 1, 72, 2, frame === 0 ? 7 : 4, thruster);
  }
}

/**
 * 6. RETRO FIGHTER PLANE WITH NODEMONKE PILOT IN COCKPIT (38x38)
 * The player's starfighter / jet! Features swept-back wings, wing cannons,
 * twin pulsating jet exhausts, and the NodeMonke's face clearly visible inside the glass canopy!
 */
export function renderFighterJet(
  ctx: CanvasRenderingContext2D,
  monkeSprite: CanvasImageSource,
  mainLevel: number = 1,
  subWeapon: SubWeaponType = 'none',
  subWeaponLevel: number = 1,
  thrusterFrame: number = 0,
  isHyper: boolean = false,
  size: number = 44
) {
  const W = size;
  const H = size;
  ctx.save();

  const fuselageColor = isHyper ? '#1e1b4b' : '#1e293b'; // slate dark metal
  const wingColor = isHyper ? '#4338ca' : '#334155'; // midnight / dark wing
  const highlightColor = isHyper ? '#818cf8' : '#64748b';
  const thrusterColor = isHyper ? '#f59e0b' : '#38bdf8'; // cyan vs intense gold
  const thrusterCore = isHyper ? '#ffffff' : '#e0f2fe';

  // 1. Dual Jet Thruster Exhaust Flames (rendered underneath rear of jet)
  const flamePulse = Math.sin(thrusterFrame * 12) * 3;
  const flameLen = (isHyper ? 16 : 10) + flamePulse;

  // Left Jet Flame
  ctx.fillStyle = thrusterColor;
  ctx.beginPath();
  ctx.moveTo(W * 0.32, H * 0.88);
  ctx.lineTo(W * 0.38, H * 0.88);
  ctx.lineTo(W * 0.35, H * 0.88 + flameLen);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = thrusterCore;
  ctx.beginPath();
  ctx.moveTo(W * 0.33, H * 0.88);
  ctx.lineTo(W * 0.37, H * 0.88);
  ctx.lineTo(W * 0.35, H * 0.88 + flameLen * 0.6);
  ctx.closePath();
  ctx.fill();

  // Right Jet Flame
  ctx.fillStyle = thrusterColor;
  ctx.beginPath();
  ctx.moveTo(W * 0.62, H * 0.88);
  ctx.lineTo(W * 0.68, H * 0.88);
  ctx.lineTo(W * 0.65, H * 0.88 + flameLen);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = thrusterCore;
  ctx.beginPath();
  ctx.moveTo(W * 0.63, H * 0.88);
  ctx.lineTo(W * 0.67, H * 0.88);
  ctx.lineTo(W * 0.65, H * 0.88 + flameLen * 0.6);
  ctx.closePath();
  ctx.fill();

  // 2. Swept-back Wings & Wingtips
  ctx.fillStyle = wingColor;
  ctx.beginPath();
  // Left wing
  ctx.moveTo(W * 0.5, H * 0.25);
  ctx.lineTo(W * 0.04, H * 0.72);
  ctx.lineTo(W * 0.16, H * 0.85);
  ctx.lineTo(W * 0.36, H * 0.78);
  // Right wing
  ctx.lineTo(W * 0.64, H * 0.78);
  ctx.lineTo(W * 0.84, H * 0.85);
  ctx.lineTo(W * 0.96, H * 0.72);
  ctx.closePath();
  ctx.fill();

  // Wing borders / trim
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Wingtip Navigation lights
  pRect(ctx, W * 0.04, H * 0.70, 2.5, 3, '#ef4444'); // red port light
  pRect(ctx, W * 0.93, H * 0.70, 2.5, 3, '#22c55e'); // green starboard light

  // 3. Wing-Mounted Gun Cannons (visual reflects main weapon power level 1-5)
  const gunColor = mainLevel >= 4 ? '#f59e0b' : mainLevel >= 2 ? '#38bdf8' : '#94a3b8';
  // Inner twin blasters
  pRect(ctx, W * 0.22, H * 0.38, 3, 13, '#1e293b');
  pRect(ctx, W * 0.22, H * 0.30, 3, 7, gunColor);
  pRect(ctx, W * 0.75, H * 0.38, 3, 13, '#1e293b');
  pRect(ctx, W * 0.75, H * 0.30, 3, 7, gunColor);

  // Outer extra cannons if mainLevel >= 3
  if (mainLevel >= 3) {
    pRect(ctx, W * 0.12, H * 0.48, 2.5, 10, '#1e293b');
    pRect(ctx, W * 0.12, H * 0.42, 2.5, 6, gunColor);
    pRect(ctx, W * 0.85, H * 0.48, 2.5, 10, '#1e293b');
    pRect(ctx, W * 0.85, H * 0.42, 2.5, 6, gunColor);
  }

  // Heavy muzzle brakes if mainLevel >= 5 (MAX)
  if (mainLevel >= 5) {
    pRect(ctx, W * 0.44, H * 0.12, 5, 8, '#f59e0b');
    pRect(ctx, W * 0.44, H * 0.08, 5, 4, '#ffffff');
  }

  // 4. Sub-Weapon Wing Pod Attachments (外挂战术装备)
  if (subWeapon === 'missile') {
    // Twin Missile Launcher Pods mounted beside wings
    const podW = 5.5;
    const podH = 12;
    // Left Pod
    pRect(ctx, W * 0.06, H * 0.52, podW, podH, '#0f172a');
    pRect(ctx, W * 0.06 + 1, H * 0.52 - 3, podW - 2, 3, '#ef4444'); // red missile warhead tip
    pRect(ctx, W * 0.06, H * 0.52 + 4, podW, 2, '#22c55e'); // green missile pod LED
    // Right Pod
    pRect(ctx, W * 0.88, H * 0.52, podW, podH, '#0f172a');
    pRect(ctx, W * 0.88 + 1, H * 0.52 - 3, podW - 2, 3, '#ef4444'); // red missile warhead tip
    pRect(ctx, W * 0.88, H * 0.52 + 4, podW, 2, '#22c55e');
  } else if (subWeapon === 'laser') {
    // Twin Laser Prism Focusing Emitters
    const podW = 5;
    const podH = 14;
    // Left Prism
    pRect(ctx, W * 0.06, H * 0.50, podW, podH, '#1e1b4b');
    pRect(ctx, W * 0.06 + 1, H * 0.50 + 2, podW - 2, podH - 4, '#a855f7'); // glowing purple core
    pRect(ctx, W * 0.06, H * 0.50 - 4, podW, 4, '#38bdf8'); // cyan focus lens
    // Right Prism
    pRect(ctx, W * 0.88, H * 0.50, podW, podH, '#1e1b4b');
    pRect(ctx, W * 0.88 + 1, H * 0.50 + 2, podW - 2, podH - 4, '#a855f7');
    pRect(ctx, W * 0.88, H * 0.50 - 4, podW, 4, '#38bdf8');
  }

  // 5. Main Fuselage Body
  ctx.fillStyle = fuselageColor;
  ctx.beginPath();
  ctx.moveTo(W * 0.5, H * 0.04); // Sharp aerodynamic nose
  ctx.lineTo(W * 0.65, H * 0.35);
  ctx.lineTo(W * 0.68, H * 0.86);
  ctx.lineTo(W * 0.32, H * 0.86);
  ctx.lineTo(W * 0.35, H * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fuselage armor panel stripes
  pRect(ctx, W * 0.46, H * 0.08, W * 0.08, H * 0.22, highlightColor);

  // 6. Transparent Bubble Cockpit Canopy with the NodeMonke Pilot inside!
  const cockpitW = W * 0.44;
  const cockpitH = H * 0.40;
  const cockpitX = (W - cockpitW) / 2;
  const cockpitY = H * 0.34;

  // Cockpit interior shadow
  ctx.fillStyle = '#090d16';
  ctx.fillRect(cockpitX, cockpitY, cockpitW, cockpitH);

  // DRAW NODEMONKE PILOT HEAD IN COCKPIT!
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  // Clip inside cockpit boundary
  ctx.beginPath();
  ctx.rect(cockpitX + 1, cockpitY + 1, cockpitW - 2, cockpitH - 2);
  ctx.clip();
  // Render scaled Monke face
  ctx.drawImage(monkeSprite, cockpitX, cockpitY - 2, cockpitW, cockpitH + 6);
  ctx.restore();

  // Glass Canopy Dome with Cyan Gloss Reflection
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(cockpitX, cockpitY, cockpitW, cockpitH);

  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.fillRect(cockpitX, cockpitY, cockpitW, cockpitH);

  // Diagonal glass glare sheen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.moveTo(cockpitX + 2, cockpitY + 2);
  ctx.lineTo(cockpitX + cockpitW * 0.4, cockpitY + 2);
  ctx.lineTo(cockpitX + 2, cockpitY + cockpitH * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * 7. DROPPED POWERUP CAPSULE / BADGE ([ P ], [ M ], [ L ], [ B ], [ S ])
 */
export function renderPowerupItem(ctx: CanvasRenderingContext2D, item: DroppedItem) {
  const { x, y, label, color, bgGlow, radius } = item;
  ctx.save();
  ctx.translate(x, y);

  // Subtle floating pulse
  const pulse = Math.sin(item.life * 0.008) * 1.5;
  const r = radius + pulse;

  // Outer neon glow
  ctx.shadowColor = bgGlow;
  ctx.shadowBlur = 10;

  // Capsule body
  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();

  // Icon / Letter badge
  ctx.fillStyle = color;
  ctx.font = `900 ${Math.round(r * 1.15)}px monospace, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 4;
  ctx.fillText(label, 0, 1);

  ctx.restore();
}

/**
 * 8. RETRO ENEMY BULLET (Arcade Glowing Energy Orb)
 */
export function renderEnemyBullet(ctx: CanvasRenderingContext2D, b: EnemyBullet) {
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.shadowColor = b.color;
  ctx.shadowBlur = 8;

  if (b.type === 'heavy') {
    const r = b.radius;
    const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#fde047');
    grad.addColorStop(0.8, '#f97316');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.type === 'spiral') {
    // Diamond high-energy rotating spiral bullet
    ctx.rotate((b.id * 100 + performance.now() * 0.008) % (Math.PI * 2));
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(0, -b.radius * 1.3);
    ctx.lineTo(b.radius, 0);
    ctx.lineTo(0, b.radius * 1.3);
    ctx.lineTo(-b.radius, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, b.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Round energy orb
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    ctx.fill();

    // Hot white core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, b.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 9. HOMING MICRO-MISSILE WITH SMOKE TRAIL
 */
export function renderHomingMissile(ctx: CanvasRenderingContext2D, b: Bullet) {
  ctx.save();
  ctx.translate(b.x, b.y);
  const angle = Math.atan2(b.vy, b.vx);
  ctx.rotate(angle);

  const L = 14;
  const W = 4;
  // Missile body
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(-L / 2, -W / 2, L, W);

  // Red warhead tip
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(L / 2, -W / 2);
  ctx.lineTo(L / 2 + 4, 0);
  ctx.lineTo(L / 2, W / 2);
  ctx.closePath();
  ctx.fill();

  // Stabilizer fins
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-L / 2, -W, 3, W * 2);

  // Jet exhaust flare
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-L / 2 - 5, -1.5, 5, 3);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-L / 2 - 3, -0.8, 3, 1.6);

  ctx.restore();
}

/**
 * Generates an authentic fallback pixel-art NodeMonke face (32x32)
 * Used if image is loading or network is slow so we NEVER display a plain box!
 */
export function getFallbackMonkeSprite(id: number): HTMLCanvasElement {
  const key = `monke_fallback_${id % 5}`;
  const existing = spriteCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;

  const colors = ['#f59e0b', '#d97706', '#92400e', '#b45309', '#eab308'];
  const skin = colors[id % colors.length];
  const darkSkin = '#78350f';

  // Ears
  pRect(ctx, 4, 9, 4, 6, darkSkin);
  pRect(ctx, 5, 10, 2, 4, skin);
  pRect(ctx, 24, 9, 4, 6, darkSkin);
  pRect(ctx, 25, 10, 2, 4, skin);

  // Head
  pRect(ctx, 7, 6, 18, 18, skin);
  pRect(ctx, 8, 7, 16, 3, '#fef08a');

  // Big Classic NodeMonke Eyes
  pRect(ctx, 9, 10, 5, 5, '#ffffff');
  pRect(ctx, 11, 11, 3, 3, '#000000');
  pRect(ctx, 18, 10, 5, 5, '#ffffff');
  pRect(ctx, 20, 11, 3, 3, '#000000');

  // Snout & Mouth
  pRect(ctx, 10, 16, 12, 6, '#fde68a');
  pRect(ctx, 12, 18, 8, 2, darkSkin);

  // Torso / Flight Jacket
  pRect(ctx, 9, 24, 14, 6, darkSkin);

  // Feet / Controls
  pRect(ctx, 10, 29, 4, 3, skin);
  pRect(ctx, 18, 29, 4, 3, skin);

  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * Creates a pixel-crisp 32x32 offscreen canvas from a loaded NodeMonkes image
 */
export function createMonkeCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, 32, 32);
  }
  return canvas;
}
