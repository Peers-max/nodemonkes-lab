// src/components/zombie/ZombieSprites.ts
import type { ZombieType } from './types';

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
 * Generates an authentic retro pixel-art zombie sprite offscreen canvas
 */
export function getZombieSprite(
  type: ZombieType,
  frame: number, // 0 or 1 for walk cycle
  isHit: boolean
): HTMLCanvasElement {
  const key = `${type}_${frame}_${isHit ? 1 : 0}`;
  const existing = spriteCache.get(key);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = false;

  const f = frame % 2;

  if (type === 'boss') {
    // 80x80 Colossal Titan Overlord
    canvas.width = 80;
    canvas.height = 80;
    renderBossSprite(ctx, f, isHit);
  } else if (type === 'tank') {
    // 48x48 Heavy Armored Goliath
    canvas.width = 48;
    canvas.height = 48;
    renderTankSprite(ctx, f, isHit);
  } else if (type === 'exploder') {
    // 36x36 Bloated Acid Pustule Zombie
    canvas.width = 36;
    canvas.height = 36;
    renderExploderSprite(ctx, f, isHit);
  } else if (type === 'runner') {
    // 32x32 Radioactive Toxic Sprinter
    canvas.width = 32;
    canvas.height = 32;
    renderRunnerSprite(ctx, f, isHit);
  } else {
    // 32x32 Standard Walker Zombie Monke
    canvas.width = 32;
    canvas.height = 32;
    renderWalkerSprite(ctx, f, isHit);
  }

  spriteCache.set(key, canvas);
  return canvas;
}

/**
 * 1. WALKER ZOMBIE MONKE (32x32)
 * Decayed green skin, hollow crimson eyes, snarling fangs with acid drool, shambling claws
 */
function renderWalkerSprite(ctx: CanvasRenderingContext2D, frame: number, isHit: boolean) {
  const base = isHit ? '#ffffff' : '#166534';
  const shadow = isHit ? '#e2e8f0' : '#14532d';
  const highlight = isHit ? '#ffffff' : '#22c55e';
  const eye = isHit ? '#ffffff' : '#ef4444';
  const fang = isHit ? '#ffffff' : '#fef08a';
  const slime = isHit ? '#ffffff' : '#86efac';

  // Ears
  pRect(ctx, 3, 7, 4, 6, shadow);
  pRect(ctx, 4, 8, 2, 4, base);
  pRect(ctx, 25, 7, 4, 6, shadow);
  pRect(ctx, 26, 8, 2, 4, base);

  // Head
  pRect(ctx, 6, 4, 20, 18, base);
  pRect(ctx, 7, 5, 18, 3, highlight);
  pRect(ctx, 6, 18, 20, 4, shadow);

  // Necrotic patches
  pRect(ctx, 9, 7, 3, 3, '#052e16');
  pRect(ctx, 19, 10, 4, 3, '#052e16');

  // Sunken Eye Sockets & Glowing Eyes
  pRect(ctx, 8, 9, 6, 5, '#022c22');
  pRect(ctx, 18, 9, 6, 5, '#022c22');
  pRect(ctx, 10, 10, 3, 3, eye);
  pRect(ctx, 20, 10, 3, 3, eye);

  // Gaping Snout & Snarl Mouth
  pRect(ctx, 9, 15, 14, 6, shadow);
  pRect(ctx, 11, 16, 10, 4, '#000000');
  // Fangs
  pRect(ctx, 12, 16, 2, 3, fang);
  pRect(ctx, 18, 16, 2, 3, fang);
  // Toxic Drool
  pRect(ctx, 13, 19, 2, frame === 0 ? 3 : 2, slime);

  // Torso
  pRect(ctx, 8, 22, 16, 6, base);
  pRect(ctx, 10, 23, 12, 5, shadow);

  // Outstretched Zombie Arms / Claws (Walking Shambling)
  if (frame === 0) {
    pRect(ctx, 4, 18, 4, 10, base);
    pRect(ctx, 3, 26, 4, 3, shadow); // claw
    pRect(ctx, 24, 20, 4, 8, base);
    pRect(ctx, 25, 27, 4, 3, shadow);
  } else {
    pRect(ctx, 4, 20, 4, 8, base);
    pRect(ctx, 3, 27, 4, 3, shadow);
    pRect(ctx, 24, 18, 4, 10, base);
    pRect(ctx, 25, 26, 4, 3, shadow);
  }

  // Shuffling Feet
  pRect(ctx, 9, 28, 5, 3, shadow);
  pRect(ctx, 18, 28, 5, 3, shadow);
}

/**
 * 2. RUNNER ZOMBIE (32x32)
 * Sleek radioactive purple body, hunched posture, blazing cyan streak eyes, razor talons
 */
function renderRunnerSprite(ctx: CanvasRenderingContext2D, frame: number, isHit: boolean) {
  const base = isHit ? '#ffffff' : '#9333ea';
  const shadow = isHit ? '#e2e8f0' : '#581c87';
  const highlight = isHit ? '#ffffff' : '#c084fc';
  const eye = isHit ? '#ffffff' : '#22d3ee';
  const claw = isHit ? '#ffffff' : '#f43f5e';

  // Pointed Bat-like Ears
  pRect(ctx, 4, 4, 4, 7, shadow);
  pRect(ctx, 24, 4, 4, 7, shadow);

  // Angular Head
  pRect(ctx, 7, 6, 18, 14, base);
  pRect(ctx, 9, 7, 14, 3, highlight);

  // Piercing Cyan Slit Eyes
  pRect(ctx, 9, 10, 5, 3, '#1e1b4b');
  pRect(ctx, 18, 10, 5, 3, '#1e1b4b');
  pRect(ctx, 10, 11, 4, 2, eye);
  pRect(ctx, 19, 11, 4, 2, eye);

  // Feral Snarl
  pRect(ctx, 11, 14, 10, 4, '#000000');
  pRect(ctx, 12, 14, 2, 2, '#fff');
  pRect(ctx, 18, 14, 2, 2, '#fff');

  // Slender Torso
  pRect(ctx, 10, 20, 12, 7, shadow);

  // Fast Scuttling Talons (Dynamic sprint pose)
  if (frame === 0) {
    pRect(ctx, 2, 17, 7, 4, base);
    pRect(ctx, 1, 19, 3, 5, claw);
    pRect(ctx, 23, 21, 7, 4, base);
    pRect(ctx, 28, 23, 3, 5, claw);
    // Legs
    pRect(ctx, 8, 27, 4, 4, shadow);
    pRect(ctx, 20, 26, 4, 5, shadow);
  } else {
    pRect(ctx, 2, 21, 7, 4, base);
    pRect(ctx, 1, 23, 3, 5, claw);
    pRect(ctx, 23, 17, 7, 4, base);
    pRect(ctx, 28, 19, 3, 5, claw);
    // Legs
    pRect(ctx, 8, 26, 4, 5, shadow);
    pRect(ctx, 20, 27, 4, 4, shadow);
  }
}

/**
 * 3. TANK GOLIATH (48x48)
 * Hulking yellow-amber decayed brute, heavy iron pauldrons, riveted metal jaw mask, dual optics
 */
function renderTankSprite(ctx: CanvasRenderingContext2D, frame: number, isHit: boolean) {
  const base = isHit ? '#ffffff' : '#ca8a04';
  const shadow = isHit ? '#e2e8f0' : '#713f12';
  const iron = isHit ? '#ffffff' : '#475569';
  const ironHi = isHit ? '#ffffff' : '#94a3b8';
  const eye = isHit ? '#ffffff' : '#f97316';

  // Massive Shoulders / Iron Pauldrons
  pRect(ctx, 2, 10, 12, 14, iron);
  pRect(ctx, 4, 12, 8, 3, ironHi);
  pRect(ctx, 34, 10, 12, 14, iron);
  pRect(ctx, 36, 12, 8, 3, ironHi);
  // Rivets
  pRect(ctx, 5, 18, 2, 2, '#fff');
  pRect(ctx, 41, 18, 2, 2, '#fff');

  // Bulky Head
  pRect(ctx, 12, 6, 24, 22, base);
  pRect(ctx, 14, 8, 20, 4, '#eab308');

  // Heavy Brow & Glowing Amber Eyes
  pRect(ctx, 14, 12, 20, 4, shadow);
  pRect(ctx, 15, 14, 5, 4, '#000');
  pRect(ctx, 28, 14, 5, 4, '#000');
  pRect(ctx, 16, 15, 3, 2, eye);
  pRect(ctx, 29, 15, 3, 2, eye);

  // Armored Iron Jaw Mask
  pRect(ctx, 13, 20, 22, 9, iron);
  pRect(ctx, 15, 22, 18, 2, ironHi);
  // Vent slits
  pRect(ctx, 17, 25, 2, 3, '#0f172a');
  pRect(ctx, 21, 25, 2, 3, '#0f172a');
  pRect(ctx, 25, 25, 2, 3, '#0f172a');
  pRect(ctx, 29, 25, 2, 3, '#0f172a');

  // Colossal Torso
  pRect(ctx, 10, 28, 28, 12, shadow);
  pRect(ctx, 14, 30, 20, 8, base);

  // Giant Heavy Fists
  const stepOffset = frame === 0 ? 2 : -2;
  pRect(ctx, 2, 24 + stepOffset, 10, 14, shadow);
  pRect(ctx, 36, 24 - stepOffset, 10, 14, shadow);

  // Heavy Metal Stomp Feet
  pRect(ctx, 12, 40, 10, 6, iron);
  pRect(ctx, 26, 40, 10, 6, iron);
}

/**
 * 4. EXPLODER ACID ZOMBIE (36x36)
 * Bloated orange slime carcass, pulsating green acid sacs, crazed eyes
 */
function renderExploderSprite(ctx: CanvasRenderingContext2D, frame: number, isHit: boolean) {
  const base = isHit ? '#ffffff' : '#ea580c';
  const shadow = isHit ? '#e2e8f0' : '#7c2d12';
  const acid = isHit ? '#ffffff' : '#84cc16';
  const acidGlow = isHit ? '#ffffff' : '#bef264';
  const eye = isHit ? '#ffffff' : '#facc15';

  // Bloated Asymmetrical Head
  pRect(ctx, 8, 4, 20, 14, base);
  pRect(ctx, 10, 5, 16, 3, '#f97316');

  // Crazed Bulging Eyes
  pRect(ctx, 9, 8, 6, 6, '#000000');
  pRect(ctx, 20, 7, 7, 7, '#000000');
  pRect(ctx, 10, 9, 4, 4, eye);
  pRect(ctx, 21, 8, 5, 5, eye);
  pRect(ctx, 12, 10, 2, 2, '#ef4444');
  pRect(ctx, 23, 9, 2, 2, '#ef4444');

  // Twisted Mouth
  pRect(ctx, 12, 15, 12, 3, shadow);
  pRect(ctx, 14, 16, 2, 3, acid); // acid drool

  // Swollen Bloated Torso with Acid Pustules
  pRect(ctx, 4, 18, 28, 14, base);
  pRect(ctx, 6, 20, 24, 10, shadow);

  // Pulsating Acid Bubbles
  const pulse = frame === 0 ? 0 : 1;
  pRect(ctx, 7, 21 - pulse, 6 + pulse, 6 + pulse, acid);
  pRect(ctx, 8, 22 - pulse, 3, 3, acidGlow);

  pRect(ctx, 21 - pulse, 22, 7 + pulse, 6 + pulse, acid);
  pRect(ctx, 23, 23, 3, 3, acidGlow);

  pRect(ctx, 14, 24 + pulse, 5, 5, acid);

  // Tiny Flailing Limbs
  pRect(ctx, 1, 20, 4, 7, shadow);
  pRect(ctx, 31, 20, 4, 7, shadow);
  pRect(ctx, 10, 32, 6, 3, shadow);
  pRect(ctx, 20, 32, 6, 3, shadow);
}

/**
 * 5. TITAN BOSS OVERLORD (80x80)
 * Massive blood-crimson demon overlord, obsidian horn crown, cyber reactor core, lethal claws
 */
function renderBossSprite(ctx: CanvasRenderingContext2D, frame: number, isHit: boolean) {
  const base = isHit ? '#ffffff' : '#991b1b';
  const shadow = isHit ? '#e2e8f0' : '#450a0a';
  const highlight = isHit ? '#ffffff' : '#dc2626';
  const horn = isHit ? '#ffffff' : '#1e1b4b';
  const core = isHit ? '#ffffff' : '#f43f5e';
  const eye = isHit ? '#ffffff' : '#fbbf24';

  // Massive Barbed Crown / Horns
  pRect(ctx, 8, 4, 6, 18, horn);
  pRect(ctx, 14, 10, 6, 12, horn);
  pRect(ctx, 66, 4, 6, 18, horn);
  pRect(ctx, 60, 10, 6, 12, horn);
  pRect(ctx, 36, 2, 8, 14, horn); // center horn

  // Colossal Head
  pRect(ctx, 18, 14, 44, 30, base);
  pRect(ctx, 22, 16, 36, 6, highlight);

  // Menacing Quad Eyes / Demonic Visor
  pRect(ctx, 22, 24, 14, 6, '#000000');
  pRect(ctx, 44, 24, 14, 6, '#000000');
  pRect(ctx, 24, 25, 4, 4, eye);
  pRect(ctx, 30, 25, 4, 4, '#ef4444');
  pRect(ctx, 46, 25, 4, 4, '#ef4444');
  pRect(ctx, 52, 25, 4, 4, eye);

  // Skull Jaw & Massive Fangs
  pRect(ctx, 22, 34, 36, 12, shadow);
  pRect(ctx, 26, 36, 28, 6, '#000000');
  for (let x = 27; x < 53; x += 5) {
    pRect(ctx, x, 36, 3, 4, '#fef08a');
    pRect(ctx, x + 2, 38, 2, 4, '#fef08a');
  }

  // Giant Armored Chest & Reactor Core
  pRect(ctx, 14, 46, 52, 24, shadow);
  pRect(ctx, 18, 48, 44, 18, base);

  // Glowing Cyber Core (Pulses with walk frame)
  const coreW = frame === 0 ? 14 : 16;
  const coreH = frame === 0 ? 14 : 16;
  pRect(ctx, 40 - coreW / 2, 54 - coreH / 2, coreW, coreH, '#450a0a');
  pRect(ctx, 40 - (coreW - 4) / 2, 54 - (coreH - 4) / 2, coreW - 4, coreH - 4, core);
  pRect(ctx, 38, 52, 4, 4, '#ffffff');

  // Gigantic Claws on Sides
  const armOffset = frame === 0 ? 3 : -3;
  pRect(ctx, 2, 36 + armOffset, 14, 32, shadow);
  pRect(ctx, 4, 64 + armOffset, 12, 8, horn); // lethal talons

  pRect(ctx, 64, 36 - armOffset, 14, 32, shadow);
  pRect(ctx, 64, 64 - armOffset, 12, 8, horn);

  // Titan Stomp Feet
  pRect(ctx, 22, 70, 14, 8, horn);
  pRect(ctx, 44, 70, 14, 8, horn);
}

/**
 * Generates an authentic fallback pixel-art NodeMonke face (32x32)
 * Used if image is loading or network is slow so we NEVER display a plain orange box!
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

  // Torso
  pRect(ctx, 9, 24, 14, 6, darkSkin);

  // Feet
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
