export interface GifImages {
  upper: string;
  lower: string;
}

export interface GifOptions {
  upperUrl: string;
  lowerUrl: string;
  backgroundColor: string | null; // null for transparent, or hex string
  speed?: number; // 1 = normal, 0.5 = slow, 2 = fast
  resolution?: number; // e.g. 400 or 600
  onProgress?: (progress: number) => void;
}

export const GIF_ANIMATION_PARAMS = {
  frameCount: 36,
  baseFrameDelay: 1000 / 30, // 30 FPS base
  rotationRange: 0.045,
  pressDownStrength: 50,
  insertionStrength: 30,
  insertionAngle: 0.045,
  squashStrength: 0.12,
};

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Exact frame drawing algorithm from original nodemonkes-gif
 */
export function drawOriginalFrame(
  ctx: CanvasRenderingContext2D,
  upperImg: HTMLImageElement,
  lowerImg: HTMLImageElement,
  progress: number, // 0 to 1
  size: number,
  bgColor: string | null
) {
  const PARAMS = GIF_ANIMATION_PARAMS;

  ctx.clearRect(0, 0, size, size);

  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  const rotation = Math.sin(progress * Math.PI * 2) * PARAMS.rotationRange;
  const isRaising = rotation < 0;

  const pressDownPhase = Math.max(0, Math.sin(progress * Math.PI * 2));
  const pressDownOffset = pressDownPhase * PARAMS.pressDownStrength * (size / 600);
  const insertionOffset = pressDownPhase * PARAMS.insertionStrength * (size / 600);
  const insertionRotation = pressDownPhase * PARAMS.insertionAngle;
  const compressionFactor = pressDownPhase * PARAMS.squashStrength;

  const smoothCompression = easeInOutQuad(compressionFactor);

  // 1. Draw Lower Body (Squash & Base)
  ctx.save();
  const scaleY = 1 - smoothCompression;
  const scaleX = 1 + smoothCompression * 0.2;

  ctx.translate(size / 2, size);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-size / 2, -size);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(lowerImg, 0, pressDownOffset, size, size);
  ctx.restore();

  // 2. Draw Upper Body (Head / Torso Nod & Rotation)
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (isRaising) {
    const raisePivotX = Math.floor((size * 3) / 7);
    const pivotY = size - Math.floor((size * 2) / 9);
    ctx.translate(raisePivotX, pivotY + pressDownOffset);
    ctx.rotate(rotation);
    ctx.translate(-raisePivotX, -(pivotY + pressDownOffset));
    ctx.drawImage(upperImg, 0, pressDownOffset, size, size);
  } else {
    const pivotX = Math.floor((size * 2) / 7);
    const pivotY = size - Math.floor((size * 2) / 9);
    ctx.translate(pivotX, pivotY + pressDownOffset);
    ctx.rotate(insertionRotation);
    ctx.translate(-pivotX, -(pivotY + pressDownOffset));
    ctx.drawImage(upperImg, 0, pressDownOffset + insertionOffset, size, size);
  }
  ctx.restore();
}

/**
 * Get Upper & Lower body URLs for a Monke (Normal or Santa mode)
 */
export function getSplitImageUrls(imageId: number, mode: 'normal' | 'santa' = 'normal'): GifImages {
  if (mode === 'santa') {
    return {
      upper: `https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santaupperbody/${imageId}.png`,
      lower: `https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santalowerbody/${imageId}.png`,
    };
  }
  return {
    upper: `https://pub-b4dd93b94d3b4b3a93fa599c57a78615.r2.dev/upperbody/${imageId}.png`,
    lower: `https://pub-b4dd93b94d3b4b3a93fa599c57a78615.r2.dev/lowerbody/${imageId}.png`,
  };
}

export function getFallbackSplitImageUrls(imageId: number, mode: 'normal' | 'santa' = 'normal'): GifImages {
  if (mode === 'santa') {
    return {
      upper: `https://santamonkes.138148178.xyz/santaupperbody/${imageId}.png`,
      lower: `https://santamonkes.138148178.xyz/santalowerbody/${imageId}.png`,
    };
  }
  return {
    upper: `https://nodemonkegif.138148178.xyz/upperbody/${imageId}.png`,
    lower: `https://nodemonkegif.138148178.xyz/lowerbody/${imageId}.png`,
  };
}

/**
 * Helper to load an image with CORS
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
 * Generate high quality GIF using gif.js
 */
export async function generateOriginalGif(options: GifOptions): Promise<Blob> {
  const {
    upperUrl,
    lowerUrl,
    backgroundColor,
    speed = 1,
    resolution = 400,
    onProgress,
  } = options;

  const [upperImg, lowerImg] = await Promise.all([
    loadImage(upperUrl),
    loadImage(lowerUrl),
  ]);

  // Ensure GIF library is loaded
  const GIFConstructor = (window as any).GIF;
  if (!GIFConstructor) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load gif.js script'));
      document.head.appendChild(script);
    });
  }

  const GIFModule = (window as any).GIF;
  if (!GIFModule) {
    throw new Error('GIF encoder not available');
  }

  const gif = new GIFModule({
    workers: 4,
    quality: 10,
    width: resolution,
    height: resolution,
    workerScript: './gif.worker.js',
    transparent: backgroundColor ? null : 0x00000000,
  });

  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas context not available');

  const totalFrames = GIF_ANIMATION_PARAMS.frameCount;
  const frameDelay = Math.round(GIF_ANIMATION_PARAMS.baseFrameDelay / speed);

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    drawOriginalFrame(ctx, upperImg, lowerImg, progress, resolution, backgroundColor);
    gif.addFrame(ctx, { copy: true, delay: frameDelay });
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
