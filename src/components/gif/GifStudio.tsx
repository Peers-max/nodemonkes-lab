import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Download, Shuffle, RefreshCw, Gift, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { BODY_COLORS, PRESET_COLORS } from '../../utils/constants';
import { useLanguage } from '../../utils/i18n';

interface GifStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function reduceColorDepth(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / 8) * 8;
    data[i + 1] = Math.round(data[i + 1] / 8) * 8;
    data[i + 2] = Math.round(data[i + 2] / 8) * 8;
  }
}

function drawOriginalFrame(
  ctx: CanvasRenderingContext2D,
  upperImg: HTMLImageElement,
  lowerImg: HTMLImageElement,
  progress: number,
  size: number,
  bgColor: string | null
) {
  const PARAMS = {
    rotationRange: 0.045,
    pressDownStrength: 50,
    insertionStrength: 30,
    insertionAngle: 0.045,
    squashStrength: 0.12,
  };

  ctx.clearRect(0, 0, size, size);
  if (bgColor && bgColor !== 'transparent') {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
  }

  const rotation = Math.sin(progress * Math.PI * 2) * PARAMS.rotationRange;
  const isRaising = rotation < 0;

  const pressDownPhase = Math.max(0, Math.sin(progress * Math.PI * 2));
  const pressDownOffset = pressDownPhase * PARAMS.pressDownStrength;
  const insertionOffset = pressDownPhase * PARAMS.insertionStrength;
  const insertionRotation = pressDownPhase * PARAMS.insertionAngle;
  const compressionFactor = pressDownPhase * PARAMS.squashStrength;

  const smoothCompression = easeInOutQuad(compressionFactor);

  ctx.save();
  const scaleY = 1 - smoothCompression;
  const scaleX = 1 + smoothCompression * 0.2;

  ctx.translate(size / 2, size);
  ctx.scale(scaleX, scaleY);
  ctx.translate(-size / 2, -size);
  ctx.drawImage(lowerImg, 0, pressDownOffset, size, size);
  ctx.restore();

  ctx.save();
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

async function loadImagePromise(src: string): Promise<HTMLImageElement> {
  try {
    const res = await fetch(src, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Decode error'));
      };
      img.src = objectUrl;
    });
  } catch {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src.includes('?') ? `${src}&t=${Date.now()}` : `${src}?t=${Date.now()}`;
    });
  }
}

export const GifStudio: React.FC<GifStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  onToast,
}) => {
  const { lang, t } = useLanguage();
  const [idInput, setIdInput] = useState(String(initialMonkeId));
  const [currentId, setCurrentId] = useState(initialMonkeId);
  const [mode, setMode] = useState<'normal' | 'santa'>('normal');
  const [resolution, setResolution] = useState(600);
  const [bgMode, setBgMode] = useState<'transparent' | 'auto' | 'custom'>('transparent');
  const [customColor, setCustomColor] = useState('#FFFFFF');
  const [speed, setSpeed] = useState(1.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  const [images, setImages] = useState<{ upper: string | null; lower: string | null }>({
    upper: null,
    lower: null,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();
  const upperImgRef = useRef<HTMLImageElement | null>(null);
  const lowerImgRef = useRef<HTMLImageElement | null>(null);
  const progressRef = useRef(0);
  const lastTimeRef = useRef(0);

  const getImageUrls = (imageId: number, m: 'normal' | 'santa') => {
    if (m === 'santa') {
      return {
        upper: `https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santaupperbody/${imageId}.png`,
        lower: `https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santalowerbody/${imageId}.png`,
      };
    }
    return {
      upper: `https://pub-b4dd93b94d3b4b3a93fa599c57a78615.r2.dev/upperbody/${imageId}.png`,
      lower: `https://pub-b4dd93b94d3b4b3a93fa599c57a78615.r2.dev/lowerbody/${imageId}.png`,
    };
  };

  const getAutoBackground = (imageId: number) => {
    const item = monkes.find((m) => m.id === imageId);
    if (item?.attributes?.Body) {
      const bodyType = item.attributes.Body.toLowerCase();
      return BODY_COLORS[bodyType] || null;
    }
    return null;
  };

  const bgColor = bgMode === 'transparent' ? null : bgMode === 'auto' ? (getAutoBackground(currentId) || '#FFFFFF') : customColor;

  const loadPreview = useCallback(async (monkeId: number, m: 'normal' | 'santa') => {
    setStatusText(lang === 'zh' ? `正在加载 #${monkeId}...` : `Loading #${monkeId}...`);
    const urls = getImageUrls(monkeId, m);
    setImages(urls);
    setCurrentId(monkeId);
  }, [lang]);

  useEffect(() => {
    loadPreview(currentId, mode);
  }, [currentId, mode, loadPreview]);

  useEffect(() => {
    if (!canvasRef.current || !images.upper || !images.lower) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = resolution;
    canvasRef.current.height = resolution;

    let imagesLoaded = 0;
    const totalImages = 2;

    const onImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        progressRef.current = 0;
        lastTimeRef.current = 0;
        setStatusText(`${t.gifReady} (#${currentId})`);
        animate();
      }
    };

    const upperImg = new Image();
    upperImg.crossOrigin = 'anonymous';
    upperImg.onload = onImageLoad;
    upperImg.onerror = () => setStatusText(lang === 'zh' ? `加载上半身失败: #${currentId}` : `Error loading upper #${currentId}`);
    upperImg.src = images.upper;
    upperImgRef.current = upperImg;

    const lowerImg = new Image();
    lowerImg.crossOrigin = 'anonymous';
    lowerImg.onload = onImageLoad;
    lowerImg.onerror = () => setStatusText(lang === 'zh' ? `加载下半身失败: #${currentId}` : `Error loading lower #${currentId}`);
    lowerImg.src = images.lower;
    lowerImgRef.current = lowerImg;

    function animate(currentTime?: number) {
      if (!currentTime) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const cycleDurationMs = 1200 / speed;
      progressRef.current = (progressRef.current + (deltaTime / cycleDurationMs)) % 1;

      const c = canvasRef.current?.getContext('2d');
      if (c && upperImgRef.current && lowerImgRef.current) {
        drawOriginalFrame(
          c,
          upperImgRef.current,
          lowerImgRef.current,
          progressRef.current,
          resolution,
          bgColor
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [images, bgColor, resolution, speed, currentId, t.gifReady, lang]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(idInput.trim(), 10);
    if (!isNaN(val) && val >= 1 && val <= 10000) {
      loadPreview(val, mode);
    } else {
      onToast(t.gifErrorInput, t.gifErrorInputDesc, 'error');
    }
  };

  const handleRandom = () => {
    const rand = Math.floor(Math.random() * 10000) + 1;
    setIdInput(String(rand));
    loadPreview(rand, mode);
  };

  const handleGenerate = async () => {
    if (!images.upper || !images.lower || isGenerating) return;
    setIsGenerating(true);
    setProgress(0);

    try {
      let GIFConstructor = (window as any).GIF;
      if (!GIFConstructor) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load gif.js'));
          document.head.appendChild(script);
        });
        GIFConstructor = (window as any).GIF;
      }

      const effectiveBg = bgColor || '#FFFFFF';

      const gif = new GIFConstructor({
        workers: 2,
        quality: 10,
        width: resolution,
        height: resolution,
        dither: false,
        transparent: null,
        background: effectiveBg,
        repeat: 0,
        workerScript: './gif.worker.js',
      });

      gif.on('progress', (p: number) => {
        setProgress(Math.round(p * 100));
      });

      const cycleDurationMs = 1200 / speed;
      const maxPossibleFrames = Math.floor(cycleDurationMs / 20);
      const numFrames = Math.max(12, Math.min(36, maxPossibleFrames));
      const frameDelay = Math.max(20, Math.round(cycleDurationMs / numFrames));

      if (!outputCanvasRef.current) {
        outputCanvasRef.current = document.createElement('canvas');
      }
      outputCanvasRef.current.width = resolution;
      outputCanvasRef.current.height = resolution;

      const ctx = outputCanvasRef.current.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas not available');

      const upperImg = await loadImagePromise(images.upper);
      const lowerImg = await loadImagePromise(images.lower);

      for (let i = 0; i < numFrames; i++) {
        const p = i / numFrames;
        drawOriginalFrame(ctx, upperImg, lowerImg, p, resolution, effectiveBg);

        const imageData = ctx.getImageData(0, 0, resolution, resolution);
        reduceColorDepth(imageData.data);
        ctx.putImageData(imageData, 0, 0);

        gif.addFrame(ctx.canvas, { copy: true, delay: frameDelay });
        await new Promise((r) => setTimeout(r, 5));
      }

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nodemonke_${currentId}_${mode}_${resolution}px_${speed.toFixed(1)}x.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        // Celebratory Confetti Burst
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#F59E0B', '#F97316', '#EF4444', '#10B981'],
        });

        onToast(t.gifSuccess, `${t.gifSuccessDesc} (${resolution}px • ${speed.toFixed(1)}x)`, 'success');
        setProgress(0);
        setIsGenerating(false);
      });

      gif.render();
    } catch (err: any) {
      console.error('GIF export error:', err);
      onToast(lang === 'zh' ? '导出失败' : 'Export failed', err.message || (lang === 'zh' ? '请重试' : 'Please retry'), 'error');
      setProgress(0);
      setIsGenerating(false);
    }
  };

  const modeLabel = mode === 'normal' ? (lang === 'zh' ? '普通版' : 'NORMAL') : (lang === 'zh' ? '圣诞版' : 'SANTA');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2 px-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-mono font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.gifBadge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {t.gifTitle}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-sans">
          {t.gifSub}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Preview Canvas */}
        <div className="lg:col-span-6 flex flex-col items-center gap-3.5">
          <div className="relative w-full aspect-square max-w-[460px] rounded-3xl glass-panel p-2.5 flex items-center justify-center border border-white/10 overflow-hidden shadow-2xl">
            {bgMode === 'transparent' && (
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
            )}
            
            <canvas
              ref={canvasRef}
              width={resolution}
              height={resolution}
              className="w-full h-full object-contain pixelated relative z-10"
            />

            <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] sm:text-[11px] font-mono text-slate-300 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>#{currentId} ({modeLabel}) • {speed.toFixed(1)}x • {resolution}px</span>
            </div>
          </div>

          {/* Search ID Form */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-[460px] flex items-center gap-2">
            <input
              type="text"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder={t.gifSearchPlaceholder}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 shadow-inner"
            />
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shrink-0 shadow-md"
            >
              {t.gifConfirm}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={handleRandom}
              className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs flex items-center gap-1.5 font-mono transition-all shrink-0 shadow-sm"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.gifRandom}</span>
            </motion.button>
          </form>

          {statusText && (
            <span className="text-[11px] font-mono text-slate-400">{statusText}</span>
          )}
        </div>

        {/* Right Side: Pro Controls Console */}
        <div className="lg:col-span-6 space-y-4 glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl">
          
          {/* 1. Mode Switcher */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
              {t.gifModeTitle}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setMode('normal')}
                className={clsx(
                  'py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                  mode === 'normal'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.gifModeClassic}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setMode('santa')}
                className={clsx(
                  'py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                  mode === 'santa'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-md'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                )}
              >
                <Gift className="w-3.5 h-3.5 text-rose-400" />
                <span>{t.gifModeSanta}</span>
              </motion.button>
            </div>
          </div>

          {/* 2. Background Controls */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
              {t.gifBgTitle}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBgMode('transparent')}
                className={clsx(
                  'py-2.5 px-2 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1 transition-all',
                  bgMode === 'transparent'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                )}
              >
                <div className="w-4 h-4 rounded border border-dashed border-slate-500 flex items-center justify-center text-[9px]">
                  ⛶
                </div>
                <span className="text-[11px] sm:text-xs truncate max-w-full">{t.gifBgNone}</span>
              </button>

              <button
                type="button"
                onClick={() => setBgMode('auto')}
                className={clsx(
                  'py-2.5 px-2 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1 transition-all',
                  bgMode === 'auto'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                )}
              >
                <div
                  className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: getAutoBackground(currentId) || '#FFFFFF' }}
                />
                <span className="text-[11px] sm:text-xs truncate max-w-full">{t.gifBgAuto}</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBgMode('custom')}
                  className={clsx(
                    'w-full h-full py-2.5 px-2 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1 transition-all relative overflow-hidden',
                    bgMode === 'custom'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  <Palette className="w-4 h-4 text-purple-400" />
                  <span className="text-[11px] sm:text-xs truncate max-w-full">{t.gifBgCustom}</span>
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setBgMode('custom');
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </button>
              </div>
            </div>

            {bgMode === 'custom' && (
              <div className="p-2.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-2 flex-wrap animate-in fade-in">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      setCustomColor(c.value);
                      setBgMode('custom');
                    }}
                    title={c.name}
                    className={clsx(
                      'w-6 h-6 rounded-lg border transition-transform',
                      customColor.toLowerCase() === c.value.toLowerCase()
                        ? 'scale-110 ring-2 ring-amber-400 border-white'
                        : 'border-white/20 hover:scale-105'
                    )}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 3. Speed Control */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold uppercase">{t.gifSpeedTitle}</span>
              <span className="text-amber-400 font-bold text-sm bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">{speed.toFixed(1)}x</span>
            </div>
            
            <input
              type="range"
              min={0.1}
              max={5.0}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
            />

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { label: t.gifSpeedSlow, val: 0.5 },
                { label: t.gifSpeedNormal, val: 1.0 },
                { label: t.gifSpeedFast, val: 2.0 },
                { label: t.gifSpeedUltra, val: 3.5 },
                { label: t.gifSpeedExtreme, val: 5.0 },
              ].map((s) => (
                <button
                  key={s.val}
                  type="button"
                  onClick={() => setSpeed(s.val)}
                  className={clsx(
                    'py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-mono transition-all text-center truncate',
                    Math.abs(speed - s.val) < 0.05
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                      : 'bg-slate-950/40 text-slate-400 border border-white/5 hover:text-white'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Resolution Control */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300 font-bold uppercase">{t.gifResTitle}</span>
              <span className="text-white font-bold text-sm bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">{resolution} × {resolution} px</span>
            </div>

            <input
              type="range"
              min={100}
              max={1200}
              step={50}
              value={resolution}
              onChange={(e) => setResolution(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-900 rounded-lg"
            />

            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[
                { label: '200px', val: 200 },
                { label: '400px', val: 400 },
                { label: '600px', val: 600 },
                { label: '800px', val: 800 },
                { label: '1200px', val: 1200 },
              ].map((r) => (
                <button
                  key={r.val}
                  type="button"
                  onClick={() => setResolution(r.val)}
                  className={clsx(
                    'py-1.5 px-1 rounded-xl text-[10px] sm:text-[11px] font-mono transition-all text-center',
                    resolution === r.val
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                      : 'bg-slate-950/40 text-slate-400 border border-white/5 hover:text-white'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Export Button with Tactile Physics */}
          <div className="pt-3 border-t border-white/[0.06]">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !images.upper || !images.lower}
              className={clsx(
                'w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-xl',
                isGenerating
                  ? 'bg-slate-800 text-slate-500 cursor-wait'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:brightness-110 text-slate-950 shadow-amber-500/25'
              )}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{t.gifSavingBtn} {progress}%</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{t.gifSaveBtn} ({resolution}px • {speed.toFixed(1)}x)</span>
                </>
              )}
            </motion.button>
          </div>

        </div>

      </div>

    </div>
  );
};
