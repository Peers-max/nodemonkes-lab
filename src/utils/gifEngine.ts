export interface GifImages {
  upper: string;
  lower: string;
  full?: string;
}

export type GifActionType = 
  | 'masternod' 
  | 'nod' 
  | 'headbang' 
  | 'boxing' 
  | 'boss' 
  | 'pump' 
  | 'moon' 
  | 'orbit';

export interface GifActionMeta {
  id: GifActionType;
  icon: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  frameCount: number;
}

export const GIF_ACTION_PRESETS: GifActionMeta[] = [
  {
    id: 'masternod',
    icon: '✨',
    nameZh: '多层惯性大师点头',
    nameEn: 'Master Layered Nod',
    descZh: '下身挤压 + 头部穿插 + 附属惯性',
    descEn: 'Layered compression, head dip & secondary rebound',
    frameCount: 36,
  },
  {
    id: 'nod',
    icon: '🎵',
    nameZh: '经典律动点头',
    nameEn: 'Classic Groove Nod',
    descZh: '官方金牌原汁原味基础动作',
    descEn: 'Authentic NodeMonkes golden standard nod',
    frameCount: 36,
  },
  {
    id: 'headbang',
    icon: '🫨',
    nameZh: '狂暴甩头 (Metal)',
    nameEn: 'Heavy Metal Headbang',
    descZh: '重金属超速高频下砸甩头',
    descEn: 'Fast high-energy vertical thrash',
    frameCount: 16,
  },
  {
    id: 'boxing',
    icon: '🥊',
    nameZh: '拳击 U 型摇闪',
    nameEn: 'Boxing Bob & Weave',
    descZh: '8字形摇闪 + 离心圆周弧线',
    descEn: 'Figure-8 evasive head weave & roll',
    frameCount: 48,
  },
  {
    id: 'boss',
    icon: '🦹',
    nameZh: '大佬重节奏颠肩',
    nameEn: 'Boss Beat Bounce',
    descZh: '双肩重拍颠动 + 头部轻晃',
    descEn: 'Heavy shoulder bop & effortless swagger',
    frameCount: 24,
  },
  {
    id: 'pump',
    icon: '🎧',
    nameZh: '嘻哈前后探颈',
    nameEn: 'Hip-Hop Neck Pump',
    descZh: '街舞鸽子探颈前推 + 卡点回缩',
    descEn: 'Funk pigeon head thrust & lock',
    frameCount: 36,
  },
  {
    id: 'moon',
    icon: '🚀',
    nameZh: '乘火箭冲上月球',
    nameEn: 'Rocket To The Moon',
    descZh: 'To The Moon! 胖火箭 + 舷窗冲刺',
    descEn: 'Classic crypto rocket blasting to the moon',
    frameCount: 32,
  },
  {
    id: 'orbit',
    icon: '🌀',
    nameZh: '360° 丝滑绕颈回旋',
    nameEn: '360° Neck Orbit Roll',
    descZh: '以颈椎为轴平滑 360° 绕圆',
    descEn: 'Smooth circular head rotation around neck',
    frameCount: 40,
  },
];

export interface GifOptions {
  upperUrl: string;
  lowerUrl: string;
  fullUrl?: string;
  action: GifActionType;
  backgroundColor: string | null; // null for transparent, or hex string
  speed?: number; // 1 = normal, 0.5 = slow, 2 = fast
  resolution?: number; // e.g. 400 or 600
  onProgress?: (progress: number) => void;
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function safeDraw(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  fallbackImg: HTMLImageElement | null,
  dx: number,
  dy: number,
  dw: number,
  dh: number
): boolean {
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
  }
  if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
    ctx.drawImage(fallbackImg, dx, dy, dw, dh);
    return true;
  }
  return false;
}

// Pre-seeded stars for To The Moon
const SPACE_STARS = Array.from({ length: 35 }, (_, i) => ({
  x: (i * 87 + 23) % 400,
  y: (i * 113 + 47) % 400,
  size: 1 + (i % 3),
  twinkle: (i * 0.7) % (Math.PI * 2)
}));

/**
 * Universal Master Action Drawing Engine
 */
export function drawActionFrame(
  ctx: CanvasRenderingContext2D,
  upperImg: HTMLImageElement | null,
  lowerImg: HTMLImageElement | null,
  monkeImg: HTMLImageElement | null,
  action: GifActionType,
  progress: number, // 0 to 1
  size: number,
  bgColor: string | null
) {
  ctx.clearRect(0, 0, size, size);

  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  // ================= 1. MASTER LAYERED NOD =================
  if (action === 'masternod') {
    const nodPhase = Math.sin(progress * Math.PI * 2);
    const pressDown = Math.max(0, nodPhase);
    const headOffset = pressDown * 32 * (size / 400);
    const lowerSquash = pressDown * 0.12;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const scaleY = 1 - easeInOutQuad(lowerSquash);
    const scaleX = 1 + easeInOutQuad(lowerSquash) * 0.2;
    ctx.translate(size / 2, size);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-size / 2, -size);
    safeDraw(ctx, lowerImg, monkeImg, 0, headOffset * 0.3, size, size);
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const pivotX = Math.floor(size * 0.43);
    const pivotY = size - Math.floor(size * 0.22);
    ctx.translate(pivotX, pivotY + headOffset);
    ctx.rotate(nodPhase * 0.04);
    ctx.translate(-pivotX, -(pivotY + headOffset));
    safeDraw(ctx, upperImg, monkeImg, 0, headOffset, size, size);
    ctx.restore();
  }

  // ================= 2. CLASSIC NOD =================
  else if (action === 'nod') {
    const rotation = Math.sin(progress * Math.PI * 2) * 0.045;
    const isRaising = rotation < 0;

    const pressDownPhase = Math.max(0, Math.sin(progress * Math.PI * 2));
    const pressDownOffset = pressDownPhase * 35 * (size / 400);
    const compressionFactor = pressDownPhase * 0.12;
    const smoothCompression = easeInOutQuad(compressionFactor);

    ctx.save();
    const scaleY = 1 - smoothCompression;
    const scaleX = 1 + smoothCompression * 0.2;
    ctx.translate(size / 2, size);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-size / 2, -size);
    ctx.imageSmoothingEnabled = false;
    safeDraw(ctx, lowerImg, monkeImg, 0, pressDownOffset, size, size);
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (isRaising) {
      const raisePivotX = Math.floor((size * 3) / 7);
      const pivotY = size - Math.floor((size * 2) / 9);
      ctx.translate(raisePivotX, pivotY + pressDownOffset);
      ctx.rotate(rotation);
      ctx.translate(-raisePivotX, -(pivotY + pressDownOffset));
      safeDraw(ctx, upperImg, monkeImg, 0, pressDownOffset, size, size);
    } else {
      const pivotX = Math.floor((size * 2) / 7);
      const pivotY = size - Math.floor((size * 2) / 9);
      ctx.translate(pivotX, pivotY + pressDownOffset);
      ctx.rotate(0.045 * pressDownPhase);
      ctx.translate(-pivotX, -(pivotY + pressDownOffset));
      safeDraw(ctx, upperImg, monkeImg, 0, pressDownOffset + 20 * (size / 400) * pressDownPhase, size, size);
    }
    ctx.restore();
  }

  // ================= 3. HEADBANG =================
  else if (action === 'headbang') {
    const downOffset = Math.sin(progress * Math.PI * 2) * 26 * (size / 400);
    const headRot = Math.sin(progress * Math.PI * 2) * 0.2;

    ctx.save();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.85, (90 + Math.abs(downOffset) * 2) * (size / 400), 14 * (size / 400), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    safeDraw(ctx, lowerImg, monkeImg, 0, downOffset * 0.35, size, size);
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const pivotX = size * 0.45;
    const pivotY = size * 0.65;
    ctx.translate(pivotX, pivotY + downOffset);
    ctx.rotate(headRot);
    ctx.translate(-pivotX, -pivotY);
    safeDraw(ctx, upperImg, monkeImg, 0, 0, size, size);
    ctx.restore();
  }

  // ================= 4. BOXING BOB & WEAVE =================
  else if (action === 'boxing') {
    const weavePhase = Math.sin(progress * Math.PI * 2);
    const weaveX = weavePhase * 24 * (size / 400);
    const weaveY = Math.abs(weavePhase) * 22 * (size / 400);
    const rollTilt = weavePhase * 0.15;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(size / 2 + weaveX * 0.4, size * 0.86, 65 * (size / 400), 10 * (size / 400), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(size / 2 + weaveX, size / 2 + weaveY);
    ctx.rotate(rollTilt);
    ctx.translate(-size / 2, -size / 2);
    safeDraw(ctx, lowerImg, monkeImg, 0, 0, size, size);
    safeDraw(ctx, upperImg, monkeImg, 0, 0, size, size);
    ctx.restore();
  }

  // ================= 5. BOSS BEAT BOUNCE =================
  else if (action === 'boss') {
    const bopY = Math.sin(progress * Math.PI * 2) * 13 * (size / 400);
    const headTilt = Math.sin(progress * Math.PI * 2) * 0.08;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(size / 2, size / 2 + bopY * 0.5);
    ctx.translate(-size / 2, -size / 2);
    safeDraw(ctx, lowerImg, monkeImg, 0, 0, size, size);
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const pivotX = Math.floor(size * 0.45);
    const pivotY = Math.floor(size * 0.65);
    ctx.translate(pivotX, pivotY + bopY);
    ctx.rotate(headTilt);
    ctx.translate(-pivotX, -(pivotY + bopY));
    safeDraw(ctx, upperImg, monkeImg, 0, 0, size, size);
    ctx.restore();
  }

  // ================= 6. HIP-HOP PIGEON NECK PUMP =================
  else if (action === 'pump') {
    const pumpForward = Math.sin(progress * Math.PI * 2);
    const headX = pumpForward * 22 * (size / 400);
    const headDrop = Math.max(0, pumpForward) * 12 * (size / 400);
    const headAngle = pumpForward * 0.05;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(size / 2 - headX * 0.2, size / 2);
    ctx.translate(-size / 2, -size / 2);
    safeDraw(ctx, lowerImg, monkeImg, 0, 0, size, size);
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const pivotX = Math.floor(size * 0.43);
    const pivotY = Math.floor(size * 0.68);
    ctx.translate(pivotX + headX, pivotY + headDrop);
    ctx.rotate(headAngle);
    ctx.translate(-pivotX, -(pivotY + headDrop));
    safeDraw(ctx, upperImg, monkeImg, 0, 0, size, size);
    ctx.restore();
  }

  // ================= 7. ROCKET TO THE MOON =================
  else if (action === 'moon') {
    const scale = size / 400;

    // Space Background Stars
    ctx.save();
    SPACE_STARS.forEach((s) => {
      const alpha = 0.3 + Math.sin(progress * Math.PI * 2 + s.twinkle) * 0.45;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.12, alpha)})`;
      ctx.fillRect(s.x * scale, s.y * scale, s.size * scale, s.size * scale);
    });

    const moonX = 330 * scale, moonY = 70 * scale;
    ctx.save();
    ctx.shadowBlur = 32 * scale;
    ctx.shadowColor = 'rgba(254, 240, 138, 0.65)';
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 36 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(moonX - 12 * scale, moonY - 8 * scale, 8 * scale, 0, Math.PI * 2);
    ctx.arc(moonX + 10 * scale, moonY + 12 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.arc(moonX + 14 * scale, moonY - 12 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const rocketBaseX = 130 * scale;
    const rocketBaseY = 270 * scale;
    const dx = moonX - rocketBaseX;
    const dy = moonY - rocketBaseY;
    const angleToMoon = Math.atan2(dy, dx);
    const rocketRotAngle = angleToMoon + Math.PI / 2;

    const boostOffset = Math.sin(progress * Math.PI * 2) * 12 * scale;
    const gForceLean = -Math.sin(progress * Math.PI * 2) * 0.08;

    const rocketX = rocketBaseX + Math.cos(angleToMoon) * boostOffset;
    const rocketY = rocketBaseY + Math.sin(angleToMoon) * boostOffset;

    // Speed Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2 * scale;
    for (let i = 0; i < 4; i++) {
      const sx = ((progress * 400 + i * 110) % 460) * scale;
      const sy = ((progress * 400 + i * 110) % 460) * scale;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 40 * scale, sy + 40 * scale);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(rocketX, rocketY);
    ctx.rotate(rocketRotAngle);

    // Flame Exhaust
    const flameLen = (75 + Math.random() * 35) * scale;
    const flameSpread = (42 + Math.random() * 8) * scale;
    ctx.save();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(-flameSpread, 125 * scale);
    ctx.lineTo(flameSpread, 125 * scale);
    ctx.lineTo(0, 125 * scale + flameLen);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(-flameSpread * 0.6, 125 * scale);
    ctx.lineTo(flameSpread * 0.6, 125 * scale);
    ctx.lineTo(0, 125 * scale + flameLen * 0.68);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 125 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Chubby Rocket Hull
    const rw = 140 * scale;
    const rh = 210 * scale;
    const halfW = rw / 2;

    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    (ctx as any).roundRect(-halfW, -75 * scale, rw, rh, [30 * scale, 30 * scale, 12 * scale, 12 * scale]);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-halfW, 55 * scale, rw, 8 * scale);
    ctx.fillRect(-halfW, -70 * scale, rw, 6 * scale);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -170 * scale);
    ctx.lineTo(-halfW, -75 * scale);
    ctx.lineTo(halfW, -75 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(-halfW, 45 * scale);
    ctx.lineTo(-halfW - 42 * scale, 135 * scale);
    ctx.lineTo(-halfW, 125 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(halfW, 45 * scale);
    ctx.lineTo(halfW + 42 * scale, 135 * scale);
    ctx.lineTo(halfW, 125 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-8 * scale, 80 * scale, 16 * scale, 55 * scale);
    ctx.restore();

    // Cockpit Window
    const winX = 0, winY = -8 * scale;
    const winR = 48 * scale;

    ctx.save();
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.arc(winX, winY, winR, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(winX, winY, winR - 3 * scale, 0, Math.PI * 2);
    ctx.clip();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(winX, winY + 4 * scale);
    ctx.rotate(gForceLean);
    safeDraw(ctx, upperImg, monkeImg, -68 * scale, -70 * scale, 135 * scale, 135 * scale);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(winX - 14 * scale, winY - 14 * scale, 24 * scale, 10 * scale, -0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // End clip

    ctx.save();
    ctx.lineWidth = 6 * scale;
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(winX, winY, winR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const rx = winX + Math.cos(a) * winR;
      const ry = winY + Math.sin(a) * winR;
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.restore(); // End rocket matrix
    ctx.restore();
  }

  // ================= 8. 360° NECK ORBIT ROLL =================
  else if (action === 'orbit') {
    const angle = progress * Math.PI * 2;
    const radiusX = 14 * (size / 400);
    const radiusY = 10 * (size / 400);
    const circleX = Math.cos(angle) * radiusX;
    const circleY = Math.sin(angle) * radiusY;
    const rollTilt = Math.sin(angle) * 0.12;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(size / 2 - circleX * 0.3, size / 2);
    ctx.translate(-size / 2, -size / 2);
    safeDraw(ctx, lowerImg, monkeImg, 0, 0, size, size);
    ctx.restore();

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    const pivotX = Math.floor(size * 0.43);
    const pivotY = Math.floor(size * 0.68);
    ctx.translate(pivotX + circleX, pivotY + circleY);
    ctx.rotate(rollTilt);
    ctx.translate(-pivotX, -(pivotY + circleY));
    safeDraw(ctx, upperImg, monkeImg, 0, 0, size, size);
    ctx.restore();
  }
}

/**
 * Get Upper & Lower body URLs for a Monke
 */
export function getSplitImageUrls(imageId: number, mode: 'normal' | 'santa' = 'normal'): GifImages {
  if (mode === 'santa') {
    return {
      upper: `https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santaupperbody/${imageId}.png`,
      lower: `https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santalowerbody/${imageId}.png`,
      full: `https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santa/${imageId}.png`,
    };
  }
  return {
    upper: `https://pub-b4dd93b94d3b4b3a93fa599c57a78615.r2.dev/upperbody/${imageId}.png`,
    lower: `https://pub-b4dd93b94d3b4b3a93fa599c57a78615.r2.dev/lowerbody/${imageId}.png`,
    full: `https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/${imageId}.png`,
  };
}

export function getFallbackSplitImageUrls(imageId: number, mode: 'normal' | 'santa' = 'normal'): GifImages {
  if (mode === 'santa') {
    return {
      upper: `https://santamonkes.138148178.xyz/santaupperbody/${imageId}.png`,
      lower: `https://santamonkes.138148178.xyz/santalowerbody/${imageId}.png`,
      full: `https://santamonkes.138148178.xyz/santa/${imageId}.png`,
    };
  }
  return {
    upper: `https://nodemonkegif.138148178.xyz/upperbody/${imageId}.png`,
    lower: `https://nodemonkegif.138148178.xyz/lowerbody/${imageId}.png`,
    full: `https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/${imageId}.png`,
  };
}

/**
 * Helper to load an image with CORS and fallback
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Generate high quality GIF with gif.js using any of the 8 master actions
 */
export async function generateMasterGif(options: GifOptions): Promise<Blob> {
  const {
    upperUrl,
    lowerUrl,
    fullUrl,
    action,
    backgroundColor,
    speed = 1,
    resolution = 400,
    onProgress,
  } = options;

  const [upperImg, lowerImg, fullImg] = await Promise.all([
    loadImage(upperUrl).catch(() => null),
    loadImage(lowerUrl).catch(() => null),
    fullUrl ? loadImage(fullUrl).catch(() => null) : Promise.resolve(null),
  ]);

  const meta = GIF_ACTION_PRESETS.find((p) => p.id === action) || GIF_ACTION_PRESETS[0];

  // Ensure GIF library is loaded
  let GIFConstructor = (window as any).GIF;
  if (!GIFConstructor) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load gif.js script'));
      document.head.appendChild(script);
    });
    GIFConstructor = (window as any).GIF;
  }

  if (!GIFConstructor) {
    throw new Error('GIF encoder not available');
  }

  const effectiveBg = backgroundColor || '#06080F';

  const gif = new GIFConstructor({
    workers: 2,
    quality: 10,
    width: resolution,
    height: resolution,
    workerScript: './gif.worker.js',
    transparent: backgroundColor === null ? 0x00000000 : null,
    background: effectiveBg,
    repeat: 0,
  });

  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');

  const totalFrames = meta.frameCount;
  const baseFrameDelay = Math.round(1200 / totalFrames);
  const frameDelay = Math.max(20, Math.round(baseFrameDelay / speed));

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    drawActionFrame(ctx, upperImg, lowerImg, fullImg, action, progress, resolution, backgroundColor);
    gif.addFrame(ctx, { copy: true, delay: frameDelay });
    await new Promise((r) => setTimeout(r, 4));
  }

  return new Promise((resolve) => {
    gif.on('progress', (p: number) => {
      if (onProgress) onProgress(p);
    });
    gif.on('finished', (blob: Blob) => {
      resolve(blob);
    });
    gif.render();
  });
}

