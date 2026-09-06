import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import {
  Sparkles,
  Download,
  Shuffle,
  RefreshCw,
  Gift,
  Palette,
  Eye,
  Crown,
  Activity,
  Sliders,
  Check
} from 'lucide-react';
import type { Monke } from '../../types';
import { BODY_COLORS, PRESET_COLORS } from '../../utils/constants';
import { useLanguage } from '../../utils/i18n';
import {
  GifActionType,
  drawActionFrame,
  getSplitImageUrls,
  getFallbackSplitImageUrls
} from '../../utils/gifEngine';
import {
  HEAD_FX_LIST,
  EYE_FX_LIST,
  EARRING_FX_LIST,
  EARRING_TRAITS,
  EarringTraitType,
  MOTION_ACTION_PRESETS,
  MotionActionType,
  PixelGrid,
  PixelColor
} from './types';
import {
  loadCanvasImage,
  imageToGrid,
  applyHeadEffect,
  applyEyeEffect,
  applyEarringEffect,
  renderGridToContext,
  generateComboMonkeGif
} from './diyGifEngine';

function extractNativeEyeGrid(upperImg: HTMLImageElement, isPeer: boolean): PixelGrid {
  const cvs = document.createElement('canvas');
  cvs.width = 28;
  cvs.height = 28;
  const c = cvs.getContext('2d');
  if (!c) return [];
  c.imageSmoothingEnabled = false;
  c.drawImage(upperImg, 0, 0, 28, 28);
  const imgData = c.getImageData(0, 0, 28, 28).data;
  const grid: PixelGrid = [];
  const minX = isPeer ? 6 : 12;
  const maxX = 23;
  const minY = 14;
  const maxY = 15;
  for (let y = 0; y < 28; y++) {
    const row: (PixelColor | null)[] = [];
    for (let x = 0; x < 28; x++) {
      if (y >= minY && y <= maxY && x >= minX && x <= maxX) {
        const idx = (y * 28 + x) * 4;
        const a = imgData[idx + 3];
        if (a > 20) {
          row.push({
            r: imgData[idx],
            g: imgData[idx + 1],
            b: imgData[idx + 2],
            a: a
          });
        } else {
          row.push(null);
        }
      } else {
        row.push(null);
      }
    }
    grid.push(row);
  }
  return grid;
}

interface FxSpeedControlProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  speed: number;
  setSpeed: (val: number) => void;
  color?: 'amber' | 'purple' | 'emerald';
  isZh?: boolean;
}

const FxSpeedControl: React.FC<FxSpeedControlProps> = ({
  title,
  icon: Icon,
  speed,
  setSpeed,
  color = 'amber',
  isZh = true,
}) => {
  const colorMap = {
    amber: {
      text: 'text-amber-300',
      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      accent: 'accent-amber-500',
      activeBtn: 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm',
    },
    purple: {
      text: 'text-purple-300',
      badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      accent: 'accent-purple-500',
      activeBtn: 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40 shadow-sm',
    },
    emerald: {
      text: 'text-emerald-300',
      badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      accent: 'accent-emerald-500',
      activeBtn: 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm',
    },
  }[color];

  return (
    <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2 mt-2">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-300 font-bold flex items-center gap-1.5">
          <Icon className={clsx('w-3.5 h-3.5', colorMap.text)} />
          <span>{title}</span>
        </span>
        <span className={clsx('font-bold text-xs px-2 py-0.5 rounded-lg border font-mono', colorMap.badge)}>
          {speed.toFixed(1)}x
        </span>
      </div>
      <input
        type="range"
        min={0.2}
        max={4.0}
        step={0.1}
        value={speed}
        onChange={(e) => setSpeed(parseFloat(e.target.value))}
        className={clsx('w-full cursor-pointer h-2 bg-slate-900 rounded-lg', colorMap.accent)}
      />
      <div className="grid grid-cols-5 gap-1 pt-0.5">
        {[
          { label: isZh ? '慢速' : 'Slow', val: 0.5 },
          { label: isZh ? '正常' : 'Normal', val: 1.0 },
          { label: isZh ? '律动' : 'Groove', val: 1.5 },
          { label: isZh ? '快闪' : 'Flash', val: 2.5 },
          { label: isZh ? '极速' : 'Turbo', val: 4.0 },
        ].map((s) => (
          <button
            key={s.val}
            type="button"
            onClick={() => setSpeed(s.val)}
            className={clsx(
              'py-1 px-1 rounded-xl text-[10px] font-mono transition-all text-center truncate',
              Math.abs(speed - s.val) < 0.05
                ? colorMap.activeBtn
                : 'bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface DiyGifStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export const DiyGifStudio: React.FC<DiyGifStudioProps> = ({
  initialMonkeId = 209,
  monkes = [],
  onToast,
}) => {
  const { lang, t } = useLanguage();
  const isZh = lang === 'zh';

  // Base state matching original GifStudio
  const [idInput, setIdInput] = useState(String(initialMonkeId));
  const [currentId, setCurrentId] = useState(initialMonkeId);
  const [action, setAction] = useState<MotionActionType>('static');
  const [mode, setMode] = useState<'normal' | 'santa'>('normal');
  const [resolution, setResolution] = useState(600);
  const [antiAlias, setAntiAlias] = useState(true);
  const [bgMode, setBgMode] = useState<'transparent' | 'auto' | 'custom'>('transparent');
  const [customColor, setCustomColor] = useState('#FFFFFF');

  // Independent rhythm/speed states for Action, Head FX, Eye FX, Earring FX
  const [actionSpeed, setActionSpeed] = useState<number>(1.0);
  const [headSpeed, setHeadSpeed] = useState<number>(1.0);
  const [eyeSpeed, setEyeSpeed] = useState<number>(1.0);
  const [earringSpeed, setEarringSpeed] = useState<number>(1.0);

  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Right console active subtab (Settings moved to far left, then Action, Head FX, Eye FX, Earring FX)
  const [activeTab, setActiveTab] = useState<'settings' | 'action' | 'headFx' | 'eyeFx' | 'earringFx'>('settings');

  // Hat, Eye & Earring dynamic FX state
  const [headFx, setHeadFx] = useState<string>('vertical_shimmer');
  const [eyeFx, setEyeFx] = useState<string>('natural_blink');
  const [earringFx, setEarringFx] = useState<string>('none');
  const [headCategory, setHeadCategory] = useState<string>('全部');
  const [eyeCategory, setEyeCategory] = useState<string>('全部');
  const [earringCategory, setEarringCategory] = useState<string>('全部');

  // Native traits strictly from monke metadata
  const [nativeTraits, setNativeTraits] = useState<{ head: string; eyes: string; earring: string; body: string }>({
    head: 'Crown',
    eyes: 'Deathbot',
    earring: 'None',
    body: 'Gold',
  });

  const effectiveEarring = nativeTraits.earring || 'None';
  const hasEarring = effectiveEarring !== 'None' && effectiveEarring !== '';

  const effectiveEyeName = useMemo(() => {
    if (nativeTraits.eyes && nativeTraits.eyes !== 'None') {
      return nativeTraits.eyes;
    }
    if (nativeTraits.body === 'Deathbot') return 'Deathbot';
    if (nativeTraits.body === 'Bot') return 'Bot';
    if (nativeTraits.body === 'Pepe') return 'Pepe';
    if (nativeTraits.head === 'Peer') return 'Peer';
    return 'Classic';
  }, [nativeTraits.eyes, nativeTraits.body, nativeTraits.head]);

  const displayEyeTrait = useMemo(() => {
    if (nativeTraits.eyes && nativeTraits.eyes !== 'None') {
      return nativeTraits.eyes;
    }
    if (nativeTraits.body === 'Deathbot') return isZh ? 'Deathbot 机械红眼' : 'Deathbot Red Eyes';
    if (nativeTraits.body === 'Bot') return isZh ? 'Bot 机械蓝眼' : 'Bot Blue Eyes';
    if (nativeTraits.body === 'Pepe') return isZh ? 'Pepe 原生眼' : 'Pepe Eyes';
    if (nativeTraits.head === 'Peer') return isZh ? 'Peer 原生三眼' : 'Peer 3-Eyes';
    return isZh ? '原生眼眸 (Classic)' : 'Native Eyes';
  }, [nativeTraits.eyes, nativeTraits.body, nativeTraits.head, isZh]);

  const [sampledSkin, setSampledSkin] = useState<{ r: number; g: number; b: number } | null>(null);

  const eyelidColor = useMemo(() => {
    if (nativeTraits.body === 'Pepe') return { r: 45, g: 175, b: 35 };
    if (nativeTraits.body === 'Deathbot') return { r: 18, g: 18, b: 26 };
    if (nativeTraits.body === 'Bot') return { r: 72, g: 72, b: 72 };
    if (nativeTraits.body === 'Gold') return { r: 255, g: 170, b: 1 };
    if (nativeTraits.body === 'Albino') return { r: 189, g: 173, b: 173 };
    if (nativeTraits.body === 'Zombie') return { r: 31, g: 64, b: 30 };
    if (sampledSkin) return sampledSkin;
    const clothingBodies = ['patriot', 'moon', 'safemode', 'vhs', 'mempool', 'striped', 'wrapped', 'underlord', 'boned', 'binary'];
    if (clothingBodies.includes(nativeTraits.body.toLowerCase())) {
      return { r: 239, g: 206, b: 148 }; // Default Monke face skin
    }
    const hex = BODY_COLORS[nativeTraits.body.toLowerCase()] || '#efce94';
    const clean = hex.replace('#', '');
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }, [nativeTraits.body, sampledSkin]);

  // Cached pixel grids for head, eyes and earring in REFS to avoid re-triggering animation teardowns!
  const headGridRef = useRef<PixelGrid | null>(null);
  const eyeGridRef = useRef<PixelGrid | null>(null);
  const earringGridRef = useRef<PixelGrid | null>(null);

  // Split images URLs
  const [images, setImages] = useState<{ upper: string | null; lower: string | null; full?: string }>({
    upper: null,
    lower: null,
  });

  // Animation & Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const upperImgRef = useRef<HTMLImageElement | null>(null);
  const lowerImgRef = useRef<HTMLImageElement | null>(null);
  const monkeImgRef = useRef<HTMLImageElement | null>(null);
  const actionProgressRef = useRef(0);
  const headProgressRef = useRef(0);
  const eyeProgressRef = useRef(0);
  const earringProgressRef = useRef(0);
  const lastTimeRef = useRef(0);
  const dynamicUpperCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto background detection from monke body trait
  const getAutoBackground = useCallback((imageId: number) => {
    const item = monkes.find((m) => m.id === imageId);
    if (item?.attributes?.Body) {
      const bodyType = item.attributes.Body.toLowerCase();
      return BODY_COLORS[bodyType] || null;
    }
    return null;
  }, [monkes]);

  const bgColor = bgMode === 'transparent' ? null : bgMode === 'auto' ? (getAutoBackground(currentId) || '#FFFFFF') : customColor;

  // 1. Auto-detect native traits from monke list when currentId changes
  useEffect(() => {
    const item = monkes.find((m) => m.id === currentId);
    const nativeHead = item?.attributes?.Head && item.attributes.Head !== 'None' ? item.attributes.Head : 'None';
    const nativeEyes = item?.attributes?.Eyes && item.attributes.Eyes !== 'None' ? item.attributes.Eyes : 'None';
    const nativeEarring = item?.attributes?.Earring && item.attributes.Earring !== 'None' ? item.attributes.Earring : 'None';
    const nativeBody = item?.attributes?.Body || 'Light';

    setNativeTraits({ head: nativeHead, eyes: nativeEyes, earring: nativeEarring, body: nativeBody });
  }, [currentId, monkes]);

  // 2. Load Split Image URLs when currentId or mode changes
  const loadPreview = useCallback((monkeId: number, m: 'normal' | 'santa') => {
    setStatusText(isZh ? `正在加载 #${monkeId}...` : `Loading #${monkeId}...`);
    setIsReady(false);
    const urls = getSplitImageUrls(monkeId, m);
    setImages(urls);
    setCurrentId(monkeId);
  }, [isZh]);

  useEffect(() => {
    loadPreview(currentId, mode);
  }, [currentId, mode, loadPreview]);

  // 3. Load Images & Extract Trait Grids (Runs ONLY when images, mode, or nativeTraits change)
  useEffect(() => {
    if (!images.upper || !images.lower) return;

    let isMounted = true;
    setIsReady(false);
    headGridRef.current = null;
    eyeGridRef.current = null;

    let upperLoaded = false;
    let lowerLoaded = false;

    const checkBothLoaded = () => {
      if (upperLoaded && lowerLoaded && isMounted) {
        setIsReady(true);
        setStatusText(isZh ? `准备就绪 (#${currentId})` : `Ready (#${currentId})`);
      }
    };

    // Load Upper Body Image
    const upperImg = new Image();
    upperImg.crossOrigin = 'anonymous';
    upperImg.onload = () => {
      if (!isMounted) return;
      upperImgRef.current = upperImg;
      upperLoaded = true;

      // In Santa mode: isolate Santa hat pixels precisely (identical scope mechanism as normal mode isolated trait PNGs)
      if (mode === 'santa') {
        try {
          const cvs = document.createElement('canvas');
          cvs.width = 28;
          cvs.height = 28;
          const c = cvs.getContext('2d');
          if (c) {
            c.imageSmoothingEnabled = false;
            c.drawImage(upperImg, 0, 0, 28, 28);
            const imgData = c.getImageData(0, 0, 28, 28).data;
            const grid: PixelGrid = [];
            for (let y = 0; y < 28; y++) {
              const row: (PixelColor | null)[] = [];
              for (let x = 0; x < 28; x++) {
                const idx = (y * 28 + x) * 4;
                const r = imgData[idx];
                const g = imgData[idx + 1];
                const b = imgData[idx + 2];
                const a = imgData[idx + 3];

                // The Santa hat strictly occupies y <= 11 and matches the 4 iconic Santa palette colors:
                // 1. Red body: bright red (229, 59, 68) or dark red shadow (162, 38, 52)
                const isRed =
                  (r >= 130 && g <= 85 && b <= 85 && r > g * 1.5 && r > b * 1.5) ||
                  (r >= 200 && g <= 90 && b <= 95);
                // 2. White pom-pom and fluffy trim (233, 229, 225)
                const isWhite = r >= 200 && g >= 195 && b >= 190;
                // 3. Shadowed trim pixels (140, 156, 181)
                const isShadowWhite =
                  r >= 110 && r <= 170 && g >= 130 && g <= 180 && b >= 150 && b <= 200;

                if (y <= 11 && a > 20 && (isRed || isWhite || isShadowWhite)) {
                  row.push({ r, g, b, a });
                } else {
                  row.push(null);
                }
              }
              grid.push(row);
            }
            headGridRef.current = grid;
          }
        } catch (err) {
          console.warn('Could not extract Santa hat grid:', err);
        }
      }

      // Extract native eyes from upper image if no dedicated eye accessory trait exists (handles all 1,195 monkeys with Eyes: None)
      if (!nativeTraits.eyes || nativeTraits.eyes === 'None') {
        try {
          const isPeer = nativeTraits.head === 'Peer';
          eyeGridRef.current = extractNativeEyeGrid(upperImg, isPeer);
        } catch (err) {
          console.warn('Could not extract native eye grid:', err);
        }
      }

      // Sample actual cheek face skin from upperImg
      try {
        const cvs = document.createElement('canvas');
        cvs.width = 28;
        cvs.height = 28;
        const c = cvs.getContext('2d');
        if (c) {
          c.imageSmoothingEnabled = false;
          c.drawImage(upperImg, 0, 0, 28, 28);
          const data = c.getImageData(0, 0, 28, 28).data;
          // Check cheek pixel at x = 16, y = 16 (directly beneath left eye)
          const idx = (16 * 28 + 16) * 4;
          if (data[idx + 3] > 100) {
            setSampledSkin({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
          }
        }
      } catch (err) {
        console.warn('Could not sample skin tone:', err);
      }

      // Auto-extract native eye grid as instant baseline if not yet loaded
      if (!eyeGridRef.current) {
        eyeGridRef.current = extractNativeEyeGrid(upperImg, nativeTraits.head === 'Peer');
      }

      checkBothLoaded();
    };

    upperImg.onerror = () => {
      const fb = getFallbackSplitImageUrls(currentId, mode);
      if (upperImg.src !== fb.upper) {
        upperImg.src = fb.upper;
      }
    };
    upperImg.src = images.upper;
    upperImgRef.current = upperImg;

    // Load Lower Body Image
    const lowerImg = new Image();
    lowerImg.crossOrigin = 'anonymous';
    lowerImg.onload = () => {
      if (!isMounted) return;
      lowerImgRef.current = lowerImg;
      lowerLoaded = true;
      checkBothLoaded();
    };
    lowerImg.onerror = () => {
      const fb = getFallbackSplitImageUrls(currentId, mode);
      if (lowerImg.src !== fb.lower) {
        lowerImg.src = fb.lower;
      }
    };
    lowerImg.src = images.lower;
    lowerImgRef.current = lowerImg;

    // Load Full Image fallback if provided
    if (images.full) {
      const fullImg = new Image();
      fullImg.crossOrigin = 'anonymous';
      fullImg.onload = () => {
        if (isMounted) monkeImgRef.current = fullImg;
      };
      fullImg.onerror = () => {
        if (isMounted) monkeImgRef.current = null;
      };
      fullImg.src = images.full;
    } else {
      monkeImgRef.current = null;
    }

    // In Normal Mode: load native head trait grid (prefer local static bundle)
    if (mode === 'normal' && nativeTraits.head && nativeTraits.head !== 'None') {
      const headName = encodeURIComponent(nativeTraits.head);
      const localHeadUrl = `/traits/normal/head/${headName}.png`;
      loadCanvasImage(localHeadUrl)
        .then((img) => {
          if (isMounted) {
            headGridRef.current = imageToGrid(img);
          }
        })
        .catch(() => {
          const r2Url = `https://pub-2f0821e8464b4c139f681d763393f4ee.r2.dev/head/${headName}.png`;
          loadCanvasImage(r2Url)
            .then((img) => {
              if (isMounted) headGridRef.current = imageToGrid(img);
            })
            .catch((e) => console.warn('Native head grid load error:', e));
        });
    } else {
      headGridRef.current = null;
    }

    // Load native eye trait grid (prefer local static bundle)
    const targetEyeTrait = (nativeTraits.eyes && nativeTraits.eyes !== 'None')
      ? nativeTraits.eyes
      : (effectiveEyeName && effectiveEyeName !== 'Classic')
        ? effectiveEyeName
        : null;

    if (targetEyeTrait) {
      const eyeName = encodeURIComponent(targetEyeTrait);
      const isPeer = nativeTraits.head === 'Peer';
      const localEyeUrl = `/traits/normal/eyes/${eyeName}.png`;
      loadCanvasImage(localEyeUrl)
        .then((img) => {
          if (isMounted) {
            eyeGridRef.current = imageToGrid(img);
          }
        })
        .catch(() => {
          const eyeBaseUrl = isPeer
            ? 'https://pub-026e5fdeaab545cc9c5aa34738735770.r2.dev/eyes'
            : 'https://pub-2f0821e8464b4c139f681d763393f4ee.r2.dev/eyes';
          const r2EyeUrl = `${eyeBaseUrl}/${eyeName}.png`;
          loadCanvasImage(r2EyeUrl)
            .then((img) => {
              if (isMounted) eyeGridRef.current = imageToGrid(img);
            })
            .catch((e) => {
              console.warn('Native eye grid load error:', e);
              if (isMounted && upperImgRef.current && upperImgRef.current.complete) {
                eyeGridRef.current = extractNativeEyeGrid(upperImgRef.current, isPeer);
              }
            });
        });
    } else {
      if (upperImgRef.current && upperImgRef.current.complete) {
        eyeGridRef.current = extractNativeEyeGrid(upperImgRef.current, nativeTraits.head === 'Peer');
      }
    }

    // Load Earring trait grid (prefer local static bundle)
    if (effectiveEarring && effectiveEarring !== 'None') {
      const earringName = encodeURIComponent(effectiveEarring);
      const localEarringUrl = `/traits/normal/earring/${earringName}.png`;
      loadCanvasImage(localEarringUrl)
        .then((img) => {
          if (isMounted) {
            earringGridRef.current = imageToGrid(img);
          }
        })
        .catch(() => {
          const r2EarringUrl = `https://pub-2f0821e8464b4c139f681d763393f4ee.r2.dev/earring/${earringName}.png`;
          loadCanvasImage(r2EarringUrl)
            .then((img) => {
              if (isMounted) earringGridRef.current = imageToGrid(img);
            })
            .catch((e) => console.warn('Earring grid load error:', e));
        });
    } else {
      earringGridRef.current = null;
    }

    return () => {
      isMounted = false;
    };
  }, [images, mode, currentId, nativeTraits.head, nativeTraits.eyes, nativeTraits.earring, effectiveEarring, nativeTraits.body, isZh]);

  // 4. Master Animation Loop (Driven by requestAnimationFrame; reads refs smoothly at 60 FPS)
  useEffect(() => {
    if (!isReady || !canvasRef.current || !upperImgRef.current || !lowerImgRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = resolution;
    canvasRef.current.height = resolution;

    // Create or resize offscreen dynamic upper canvas
    if (!dynamicUpperCanvasRef.current) {
      dynamicUpperCanvasRef.current = document.createElement('canvas');
    }
    dynamicUpperCanvasRef.current.width = resolution;
    dynamicUpperCanvasRef.current.height = resolution;
    const upperCompCtx = dynamicUpperCanvasRef.current.getContext('2d', { willReadFrequently: true });

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    actionProgressRef.current = 0;
    headProgressRef.current = 0;
    eyeProgressRef.current = 0;
    earringProgressRef.current = 0;
    lastTimeRef.current = 0;

    const currentHatName = mode === 'santa' ? 'Santa' : nativeTraits.head;

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

      // 1. Action motion cycle:
      const actionCycleMs = 1200 / actionSpeed;
      actionProgressRef.current = (actionProgressRef.current + (deltaTime / actionCycleMs)) % 1;

      // 2. Hat FX cycle:
      const headCycleMs = 1200 / headSpeed;
      headProgressRef.current = (headProgressRef.current + (deltaTime / headCycleMs)) % 1;
      const headFxFrame = Math.floor(headProgressRef.current * 8) % 8;

      // 3. Eye FX cycle:
      const eyeCycleMs = 1200 / eyeSpeed;
      eyeProgressRef.current = (eyeProgressRef.current + (deltaTime / eyeCycleMs)) % 1;
      const eyeFxFrame = Math.floor(eyeProgressRef.current * 8) % 8;

      // 4. Earring FX cycle:
      const earringCycleMs = 1200 / earringSpeed;
      earringProgressRef.current = (earringProgressRef.current + (deltaTime / earringCycleMs)) % 1;
      const earringFxFrame = Math.floor(earringProgressRef.current * 8) % 8;

      // 1. Synthesize dynamic upper canvas (base upperImg + animated head + animated eyes + animated earring)
      if (upperCompCtx && upperImgRef.current && upperImgRef.current.complete) {
        upperCompCtx.clearRect(0, 0, resolution, resolution);
        upperCompCtx.imageSmoothingEnabled = false;
        upperCompCtx.drawImage(upperImgRef.current, 0, 0, resolution, resolution);

        // Render Head FX overlay (on native hat or Santa hat)
        const activeHeadGrid = headGridRef.current;
        if (headFx !== 'none' && activeHeadGrid && currentHatName !== 'None') {
          const animHead = applyHeadEffect(currentHatName, headFx, activeHeadGrid, headFxFrame, 8);
          renderGridToContext(upperCompCtx, animHead, resolution);
        }

        // Render Eye FX overlay (on native eyes or dedicated accessory)
        const activeEyeGrid = eyeGridRef.current;
        if (eyeFx !== 'none' && activeEyeGrid) {
          const isPeer = nativeTraits.head === 'Peer';
          const animEyes = applyEyeEffect(
            effectiveEyeName,
            eyeFx,
            activeEyeGrid,
            eyeFxFrame,
            8,
            isPeer,
            eyelidColor
          );
          renderGridToContext(upperCompCtx, animEyes, resolution);
        }

        // Render Earring FX overlay (strictly only on monkeys with native earring)
        const activeEarringGrid = earringGridRef.current;
        if (hasEarring && earringFx !== 'none' && activeEarringGrid) {
          const animEarring = applyEarringEffect(
            effectiveEarring,
            earringFx,
            activeEarringGrid,
            earringFxFrame,
            8
          );
          renderGridToContext(upperCompCtx, animEarring, resolution);
        }
      }

      // 2. Render frame to main preview canvas using official drawActionFrame!
      const c = canvasRef.current?.getContext('2d');
      if (c && dynamicUpperCanvasRef.current && lowerImgRef.current) {
        drawActionFrame(
          c,
          dynamicUpperCanvasRef.current,
          lowerImgRef.current,
          monkeImgRef.current,
          action as GifActionType,
          actionProgressRef.current,
          resolution,
          bgColor,
          antiAlias
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    isReady,
    resolution,
    antiAlias,
    action,
    actionSpeed,
    headFx,
    headSpeed,
    eyeFx,
    eyeSpeed,
    earringFx,
    earringSpeed,
    effectiveEarring,
    hasEarring,
    bgColor,
    nativeTraits.head,
    nativeTraits.eyes,
    nativeTraits.earring,
    effectiveEyeName,
    eyelidColor
  ]);

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

  const handleRandomEarringMonke = () => {
    const earringMonkes = monkes.filter(
      (m) => m.attributes?.Earring && m.attributes.Earring !== 'None'
    );
    let targetId = 209;
    if (earringMonkes.length > 0) {
      const picked = earringMonkes[Math.floor(Math.random() * earringMonkes.length)];
      targetId = picked.id;
    } else {
      const fallbackIds = [209, 4379, 10, 31, 88, 142, 365, 789, 1024, 2048, 5555];
      targetId = fallbackIds[Math.floor(Math.random() * fallbackIds.length)];
    }
    setIdInput(String(targetId));
    loadPreview(targetId, mode);
  };

  const handleGenerate = async () => {
    if (!upperImgRef.current || !lowerImgRef.current || isGenerating) return;
    setIsGenerating(true);
    setProgress(0);

    const hatName = mode === 'santa' ? 'Santa' : nativeTraits.head;
    const eyeName = effectiveEyeName;

    try {
      const blob = await generateComboMonkeGif({
        monkeId: currentId,
        upperImg: upperImgRef.current,
        lowerImg: lowerImgRef.current,
        fullImg: monkeImgRef.current,
        headGrid: headGridRef.current,
        eyeGrid: eyeGridRef.current,
        earringGrid: hasEarring ? earringGridRef.current : null,
        headName: hatName,
        eyeName: eyeName,
        earringName: hasEarring ? effectiveEarring : 'None',
        headFxId: headFx,
        eyeFxId: eyeFx,
        earringFxId: hasEarring ? earringFx : 'none',
        action,
        backgroundColor: bgColor,
        resolution,
        actionSpeed,
        headSpeed,
        eyeSpeed,
        earringSpeed,
        antiAlias,
        isPeer: nativeTraits.head === 'Peer',
        eyelidColor: eyelidColor,
        onProgress: (p) => setProgress(p),
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const earTag = hasEarring && earringFx !== 'none' ? `_ear-${earringFx}` : '';
      link.download = `nodemonke_${currentId}_${mode}_${action}_hat-${headFx}_eye-${eyeFx}${earTag}_${resolution}px.gif`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Celebratory Confetti Burst
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'],
      });

      onToast(
        isZh ? '动图导出成功！' : 'GIF Exported Successfully!',
        `${action} • ${mode === 'santa' ? '圣诞版' : '普通版'} • ${resolution}px`,
        'success'
      );
      setProgress(0);
      setIsGenerating(false);
    } catch (err: any) {
      console.error('GIF export error:', err);
      onToast(isZh ? '导出失败' : 'Export failed', err.message || (isZh ? '请重试' : 'Please retry'), 'error');
      setProgress(0);
      setIsGenerating(false);
    }
  };

  const modeLabel = mode === 'normal' ? (isZh ? '普通版' : 'NORMAL') : (isZh ? '圣诞版' : 'SANTA');
  const currentActionMeta = MOTION_ACTION_PRESETS.find((p) => p.id === action) || MOTION_ACTION_PRESETS[0];
  const currentHeadFxMeta = HEAD_FX_LIST.find((f) => f.id === headFx) || HEAD_FX_LIST[0];
  const currentEyeFxMeta = EYE_FX_LIST.find((f) => f.id === eyeFx) || EYE_FX_LIST[0];
  const currentEarringFxMeta = EARRING_FX_LIST.find((f) => f.id === earringFx) || EARRING_FX_LIST[0];

  // Unique categories for filtering
  const headCategories = useMemo(() => ['全部', ...Array.from(new Set(HEAD_FX_LIST.map((h) => h.category)))], []);
  const eyeCategories = useMemo(() => ['全部', ...Array.from(new Set(EYE_FX_LIST.map((e) => e.category)))], []);
  const earringCategories = useMemo(() => ['全部', ...Array.from(new Set(EARRING_FX_LIST.map((e) => e.category)))], []);

  const filteredHeadFx = useMemo(() => {
    if (headCategory === '全部') return HEAD_FX_LIST;
    return HEAD_FX_LIST.filter((h) => h.category === headCategory);
  }, [headCategory]);

  const filteredEyeFx = useMemo(() => {
    if (eyeCategory === '全部') return EYE_FX_LIST;
    return EYE_FX_LIST.filter((e) => e.category === eyeCategory);
  }, [eyeCategory]);

  const filteredEarringFx = useMemo(() => {
    if (earringCategory === '全部') return EARRING_FX_LIST;
    return EARRING_FX_LIST.filter((e) => e.category === earringCategory);
  }, [earringCategory]);

  const getCategoryLabel = useCallback((cat: string) => {
    if (isZh) return cat;
    const map: Record<string, string> = {
      '全部': 'All',
      '原生状态': 'Original',
      '流光光效': 'Shimmer',
      '炫彩流行': 'Vibrant',
      '科技能量': 'Cyber',
      '珠宝自然': 'Jewelry',
      '神态表情': 'Expressions',
      '光影闪耀': 'Gleam',
      '赛博硬核': 'Cyber',
      '能量爆发': 'Energy',
      '潮流动感': 'Dynamic',
      '珠宝闪耀': 'Jewelry',
      '奢华流光': 'Luxe Gleam',
      '科技幻彩': 'Cyber Prism',
    };
    return map[cat] || cat;
  }, [isZh]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="text-center space-y-2 px-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-purple-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>
            {isZh
              ? '原版 10,000 只 + 圣诞版 • 官方原版动态 + 40款配件微动效'
              : '10,000 Originals + Santa • Official Dynamics + 40 Micro-FX'}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {isZh ? '动态配件 GIF 创造台' : 'Motion DIY GIF Studio'}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto font-sans">
          {isZh
            ? '基于 10,000 只原版大猴与圣诞限定版，深度融合 8 大惯性物理动作与 40 款独家帽子/眼部微动特效，支持纯配件微动静止身体无限循环 GIF 导出。'
            : 'Combine 10,000 original NodeMonkes and Santa edition with 8 master physics motions and 40 hat/eye/earring micro-FX. Export loopable GIFs with still body or full motion.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Side: Preview Canvas & Quick Selector */}
        <div className="lg:col-span-6 flex flex-col items-center gap-3.5">
          <div className="relative w-full aspect-square max-w-[480px] rounded-3xl glass-panel p-3 flex items-center justify-center border border-white/10 overflow-hidden shadow-2xl bg-slate-950/80">
            {bgMode === 'transparent' && (
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px]" />
            )}

            <canvas
              ref={canvasRef}
              width={resolution}
              height={resolution}
              className={clsx(
                'w-full h-full object-contain relative z-10 drop-shadow-md transition-all',
                !antiAlias && 'pixelated'
              )}
            />

            {/* Top-left Info Badge */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-[10px] sm:text-[11px] font-mono text-slate-200 shadow-xl max-w-[90%]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold text-amber-300">#{currentId} ({modeLabel})</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300 truncate">{currentActionMeta.icon} {isZh ? currentActionMeta.nameZh : currentActionMeta.nameEn}</span>
              <span className="text-slate-500">•</span>
              <span className="text-amber-300 truncate">🎩 {(isZh ? currentHeadFxMeta.name : currentHeadFxMeta.nameEn).split(' ')[0]}</span>
              <span className="text-slate-500">•</span>
              <span className="text-purple-300 truncate">👀 {(isZh ? currentEyeFxMeta.name : currentEyeFxMeta.nameEn).split(' ')[0]}</span>
            </div>

            {/* Bottom-right Action Pill Badge */}
            <div className="absolute bottom-4 right-4 z-20 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono text-slate-400 shadow-md flex items-center gap-1">
              <span>{action === 'static' ? (isZh ? '纯微动模式' : 'Micro-FX Only') : `${actionSpeed.toFixed(1)}x ${isZh ? '动作' : 'Motion'}`}</span>
              <span className="text-slate-600">•</span>
              <span>{resolution}px</span>
              <span className="text-slate-600">•</span>
              <span className={antiAlias ? 'text-amber-300 font-semibold' : 'text-slate-400'}>
                {antiAlias ? (isZh ? '✨平滑' : '✨Smooth') : (isZh ? '👾硬边' : '👾Retro')}
              </span>
            </div>
          </div>

          {/* Search ID & Random Form */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-[480px] flex items-center gap-2">
            <input
              type="text"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder={isZh ? "输入大猴编号 (1 - 10000)..." : "Monke ID (1 - 10000)..."}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-amber-500/80 focus:ring-2 focus:ring-amber-500/20 shadow-inner"
            />
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shrink-0 shadow-md"
            >
              {isZh ? '确定' : 'Go'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              onClick={handleRandom}
              className="px-3.5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs flex items-center gap-1.5 font-mono transition-all shrink-0 shadow-sm"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-400" />
              <span>{isZh ? '随机' : 'Random'}</span>
            </motion.button>
          </form>

          {/* Authentic Trait Display Bar */}
          <div className="w-full max-w-[480px] px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-white/10 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3 overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="text-slate-400 flex items-center gap-1.5">
                {mode === 'santa' ? (
                  <>
                    <Gift className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-rose-300 font-semibold">{isZh ? '圣诞红帽' : 'Santa Hat'}</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-200">{isZh ? '帽子: ' : 'Hat: '}{nativeTraits.head}</span>
                  </>
                )}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-200">{isZh ? '眼睛: ' : 'Eyes: '}{displayEyeTrait}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-200">{isZh ? '耳饰: ' : 'Earring: '}{effectiveEarring}</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">
                {isZh ? '肤色: ' : 'Body: '}<span className="text-slate-200">{nativeTraits.body}</span>
              </span>
            </div>
            
            {/* Quick Version Toggle Pill */}
            <button
              type="button"
              id="toggle-version-pill"
              onClick={() => setMode(mode === 'normal' ? 'santa' : 'normal')}
              className={clsx(
                'text-[10px] font-mono px-2.5 py-1 rounded-lg border transition-all shrink-0 flex items-center gap-1',
                mode === 'santa'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
              )}
            >
              {mode === 'santa' ? (isZh ? '🎅 圣诞版' : '🎅 Santa') : (isZh ? '🐵 普通版' : '🐵 Normal')}
            </button>
          </div>

          {statusText && (
            <span className="text-[11px] font-mono text-slate-400">{statusText}</span>
          )}
        </div>

        {/* Right Side: Pro Controls Studio */}
        <div className="lg:col-span-6 space-y-4 glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl">

          {/* Navigation Subtabs (5 Tabs: Settings, Action, Hat FX, Eye FX, Earring FX) */}
          <div className="flex items-center gap-1 p-1 bg-slate-950/60 border border-white/10 rounded-2xl">
            {[
              { id: 'settings', label: isZh ? '⚙️ 画面设置' : '⚙️ Settings', icon: Sliders },
              { id: 'action', label: isZh ? '🕺 动作预设' : '🕺 Actions', icon: Activity },
              { id: 'headFx', label: isZh ? '🎩 帽子光效' : '🎩 Hat FX', icon: Crown },
              { id: 'eyeFx', label: isZh ? '👀 眼睛微动' : '👀 Eye FX', icon: Eye },
              { id: 'earringFx', label: isZh ? '👂 耳饰微动' : '👂 Earring FX', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all flex-1 justify-center',
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content 1: Global Settings (Mode, Background, Resolution) */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Mode Switcher */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                  {isZh ? '版本模式选择' : 'Version Mode'}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('normal')}
                    className={clsx(
                      'py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                      mode === 'normal'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md ring-1 ring-amber-400/50'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                    )}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isZh ? '普通经典版 (10,000 原版)' : 'Classic Normal (10,000)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('santa')}
                    className={clsx(
                      'py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                      mode === 'santa'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-md ring-1 ring-rose-400/50'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                    )}
                  >
                    <Gift className="w-4 h-4 text-rose-400" />
                    <span>{isZh ? '圣诞限定红帽版' : 'Santa Hat Limited'}</span>
                  </button>
                </div>
              </div>

              {/* Background Options */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                  {isZh ? '背景底色' : 'Background Color'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBgMode('transparent')}
                    className={clsx(
                      'py-2 px-2 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1 transition-all',
                      bgMode === 'transparent'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                    )}
                  >
                    <div className="w-3.5 h-3.5 rounded border border-dashed border-slate-500 flex items-center justify-center text-[8px]">
                      ⛶
                    </div>
                    <span className="text-[11px]">{isZh ? '透明底色' : 'Transparent'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBgMode('auto')}
                    className={clsx(
                      'py-2 px-2 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1 transition-all',
                      bgMode === 'auto'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                    )}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: getAutoBackground(currentId) || '#FFFFFF' }}
                    />
                    <span className="text-[11px]">{isZh ? '原版肤色' : 'Native Skin'}</span>
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setBgMode('custom')}
                      className={clsx(
                        'w-full h-full py-2 px-2 rounded-2xl border text-xs font-medium flex flex-col items-center gap-1 transition-all relative overflow-hidden',
                        bgMode === 'custom'
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                      )}
                    >
                      <Palette className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[11px]">{isZh ? '自定义' : 'Custom'}</span>
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
                  <div className="p-2 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-2 flex-wrap">
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
                          'w-5 h-5 rounded-lg border transition-transform',
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

              {/* Resolution Slider */}
              <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold uppercase">{isZh ? '输出分辨率' : 'Output Resolution'}</span>
                  <span className="text-white font-bold text-xs bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                    {resolution} × {resolution} px
                  </span>
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
                <div className="grid grid-cols-5 gap-1 pt-0.5">
                  {[
                    { label: isZh ? '200 (轻量)' : '200 (Lite)', val: 200 },
                    { label: '400px', val: 400 },
                    { label: isZh ? '600 (高清)' : '600 (HD)', val: 600 },
                    { label: isZh ? '800 (超清)' : '800 (Ultra)', val: 800 },
                    { label: '1200px', val: 1200 },
                  ].map((r) => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setResolution(r.val)}
                      className={clsx(
                        'py-1.5 px-0.5 rounded-xl text-[10px] font-mono transition-all text-center truncate',
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

              {/* Motion Anti-Aliasing Control */}
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                    {isZh ? '动作抗锯齿平滑' : 'Motion Anti-Aliasing'}
                  </span>
                  <span className={clsx(
                    "text-[10px] font-mono px-2 py-0.5 rounded-md border transition-all",
                    antiAlias 
                      ? "text-amber-300 bg-amber-500/10 border-amber-500/30 font-bold" 
                      : "text-slate-400 bg-slate-900 border-white/10"
                  )}>
                    {antiAlias ? (isZh ? '✨ 开启平滑 (推荐)' : '✨ Smooth (Recommended)') : (isZh ? '👾 原始硬边 (复古)' : '👾 Retro Hard Edge')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAntiAlias(true)}
                    className={clsx(
                      'py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                      antiAlias
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm ring-1 ring-amber-400/40'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isZh ? '平滑抗锯齿 (消除断阶)' : 'Smooth (Anti-Aliased)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAntiAlias(false)}
                    className={clsx(
                      'py-2 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all',
                      !antiAlias
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm ring-1 ring-amber-400/40'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                    )}
                  >
                    <span className="text-xs">👾</span>
                    <span>{isZh ? '原始像素硬边缘 (复古)' : 'Retro Hard Edge'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                  {isZh
                    ? '💡 提示：大猴动起来时（如点头、晃脑）会有微小角度旋转。开启平滑可消除旋转阶梯锯齿，内部方块仍保持高清；关闭则保持 100% 原始阶梯硬像素。'
                    : '💡 Tip: Enables sub-pixel interpolation during rotation to eliminate jagged stair-stepping while preserving crisp pixel grid clarity.'}
                </p>
              </div>
            </div>
          )}

          {/* Tab Content 2: Action Presets */}
          {activeTab === 'action' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                  {isZh ? '动作特效选择 (8大官方大师动作 + 纯配件静止模式)' : 'Motion Presets (8 Master Motions + Still Body Mode)'}
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {currentActionMeta.icon} {isZh ? currentActionMeta.nameZh : currentActionMeta.nameEn}
                </span>
              </div>

              {/* Special Card for Static Accessory Only Mode */}
              <div
                onClick={() => setAction('static')}
                className={clsx(
                  'cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between',
                  action === 'static'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/15 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/40 shadow-lg'
                    : 'bg-slate-950/40 border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-lg">
                    🧘
                  </div>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>{isZh ? '纯配件微动效 (静止身体)' : 'Accessory FX Only (Still Body)'}</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono border border-emerald-500/30">
                        {isZh ? 'NEW 特别模式' : 'NEW SPECIAL'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {isZh
                        ? '身体保持完全静止，仅保留头部光效与眼部眨眼微动，支持导出专属循环 GIF'
                        : 'Keep body still, animate only hat shimmer, eye blinks and earring gleams into loop GIF.'}
                    </div>
                  </div>
                </div>
                {action === 'static' && <Check className="w-4 h-4 text-emerald-400 shrink-0 mr-1" />}
              </div>

              {/* 8 Master Motion Presets Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {MOTION_ACTION_PRESETS.filter((p) => p.id !== 'static').map((p) => {
                  const isActive = action === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAction(p.id)}
                      className={clsx(
                        'py-2 px-2.5 rounded-2xl border text-left transition-all',
                        isActive
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md ring-1 ring-amber-400/50'
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <span>{p.icon}</span>
                        <span className="truncate">{isZh ? p.nameZh : p.nameEn}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5 truncate">
                        {isZh ? p.descZh : p.descEn}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Speed Control */}
              <FxSpeedControl
                title={isZh ? '动作运动节奏' : 'Action Motion Tempo'}
                icon={Activity}
                speed={actionSpeed}
                setSpeed={setActionSpeed}
                color="amber"
                isZh={isZh}
              />
            </div>
          )}

          {/* Tab Content 3: Hat FX (20 Effects + None) */}
          {activeTab === 'headFx' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                  {isZh
                    ? `20款 帽子/头部动态光效 ${mode === 'santa' ? '(生效于圣诞红帽)' : `(生效于 ${nativeTraits.head})`}`
                    : `20 Hat / Head Dynamic FX ${mode === 'santa' ? '(Applied to Santa Hat)' : `(Applied to ${nativeTraits.head})`}`}
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {isZh ? currentHeadFxMeta.name : currentHeadFxMeta.nameEn}
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {headCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setHeadCategory(cat)}
                    className={clsx(
                      'px-2.5 py-1 rounded-xl text-[10px] font-mono whitespace-nowrap transition-all',
                      headCategory === cat
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                        : 'bg-slate-950/40 text-slate-400 border border-white/5 hover:text-white'
                    )}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>

              {/* FX Options Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredHeadFx.map((fx) => {
                  const isActive = headFx === fx.id;
                  return (
                    <button
                      key={fx.id}
                      type="button"
                      onClick={() => setHeadFx(fx.id)}
                      className={clsx(
                        'py-2 px-2.5 rounded-2xl border text-left transition-all relative overflow-hidden',
                        isActive
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md'
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 text-xs">
                        <span className="truncate">{isZh ? fx.name : fx.nameEn}</span>
                        {isActive && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                      </div>
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5 line-clamp-2">
                        {isZh ? fx.desc : fx.descEn}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hat FX Speed Control */}
              <FxSpeedControl
                title={isZh ? '帽子光效节奏' : 'Hat FX Tempo'}
                icon={Crown}
                speed={headSpeed}
                setSpeed={setHeadSpeed}
                color="amber"
                isZh={isZh}
              />
            </div>
          )}

          {/* Tab Content 4: Eye FX (20 Effects + None) */}
          {activeTab === 'eyeFx' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                  {isZh
                    ? `20款 眼部微动/眨眼特效 (生效于 ${displayEyeTrait})`
                    : `20 Eye Micro-FX & Blinks (Applied to ${displayEyeTrait})`}
                </span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                  {isZh ? currentEyeFxMeta.name : currentEyeFxMeta.nameEn}
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {eyeCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEyeCategory(cat)}
                    className={clsx(
                      'px-2.5 py-1 rounded-xl text-[10px] font-mono whitespace-nowrap transition-all',
                      eyeCategory === cat
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                        : 'bg-slate-950/40 text-slate-400 border border-white/5 hover:text-white'
                    )}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>

              {/* FX Options Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredEyeFx.map((fx) => {
                  const isActive = eyeFx === fx.id;
                  return (
                    <button
                      key={fx.id}
                      type="button"
                      onClick={() => setEyeFx(fx.id)}
                      className={clsx(
                        'py-2 px-2.5 rounded-2xl border text-left transition-all relative overflow-hidden',
                        isActive
                          ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold shadow-md'
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 text-xs">
                        <span className="truncate">{isZh ? fx.name : fx.nameEn}</span>
                        {isActive && <Check className="w-3 h-3 text-purple-400 shrink-0" />}
                      </div>
                      <div className="text-[9px] text-slate-400 font-normal mt-0.5 line-clamp-2">
                        {isZh ? fx.desc : fx.descEn}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Eye FX Speed Control */}
              <FxSpeedControl
                title={isZh ? '眼部微动节奏' : 'Eye FX Tempo'}
                icon={Eye}
                speed={eyeSpeed}
                setSpeed={setEyeSpeed}
                color="purple"
                isZh={isZh}
              />
            </div>
          )}

          {/* Tab Content 5: Earring FX (9 Effects + None) */}
          {activeTab === 'earringFx' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
                  {hasEarring ? (
                    isZh
                      ? `9款 原版耳饰微动与光效 (生效于 ${effectiveEarring})`
                      : `9 Native Earring FX (Applied to ${effectiveEarring})`
                  ) : (
                    isZh ? '耳饰动效与光效 (原版无耳饰)' : 'Earring FX (No Native Earring)'
                  )}
                </span>
                {hasEarring && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {isZh ? currentEarringFxMeta.name : currentEarringFxMeta.nameEn}
                  </span>
                )}
              </div>

              {hasEarring ? (
                <>
                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {earringCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEarringCategory(cat)}
                        className={clsx(
                          'px-2.5 py-1 rounded-xl text-[10px] font-mono whitespace-nowrap transition-all',
                          earringCategory === cat
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                            : 'bg-slate-950/40 text-slate-400 border border-white/5 hover:text-white'
                        )}
                      >
                        {getCategoryLabel(cat)}
                      </button>
                    ))}
                  </div>

                  {/* Earring FX Grid */}
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                    {filteredEarringFx.map((fx) => {
                      const isActive = earringFx === fx.id;
                      return (
                        <button
                          key={fx.id}
                          type="button"
                          onClick={() => setEarringFx(fx.id)}
                          className={clsx(
                            'py-2 px-2.5 rounded-2xl border text-left transition-all relative overflow-hidden',
                            isActive
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md ring-1 ring-amber-500/30'
                              : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 text-xs">
                            <span className="truncate">{isZh ? fx.name : fx.nameEn}</span>
                            {isActive && <Check className="w-3 h-3 text-amber-400 shrink-0" />}
                          </div>
                          <div className="text-[9px] text-slate-400 font-normal mt-0.5 line-clamp-2">
                            {isZh ? fx.desc : fx.descEn}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Earring FX Speed Control */}
                  <FxSpeedControl
                    title={isZh ? '耳饰微动节奏' : 'Earring FX Tempo'}
                    icon={Sparkles}
                    speed={earringSpeed}
                    setSpeed={setEarringSpeed}
                    color="amber"
                    isZh={isZh}
                  />
                </>
              ) : (
                <div className="py-10 px-6 rounded-2xl bg-slate-950/40 border border-white/5 text-center space-y-4">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shadow-inner">
                    👂
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-sm font-bold text-slate-200">
                      {isZh ? `当前 #${currentId} 原版未佩戴耳饰 (Earring: None)` : `Monke #${currentId} has no native earring (Earring: None)`}
                    </div>
                    <div className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      {isZh
                        ? '原版 NodeMonkes 仅有 1,401 只大猴拥有原生耳饰（包含 Gold 金耳钉、Silver 银耳钉、Diamond 钻钉、Cross 十字架）。耳饰微动光效仅在拥有原生耳饰时生效。'
                        : 'Only 1,401 of 10,000 NodeMonkes have native earrings (Gold, Silver, Diamond, Cross). Earring effects apply only when a native earring is present.'}
                    </div>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleRandomEarringMonke}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 text-xs font-bold font-mono transition-all shadow-md"
                    >
                      {isZh ? '🎲 换一只带原生耳饰的大猴试试' : '🎲 Try a Monke with Native Earring'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Export Big Button */}
          <div className="pt-3 border-t border-white/[0.06]">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !upperImgRef.current || !lowerImgRef.current}
              className={clsx(
                'w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-xl',
                isGenerating
                  ? 'bg-slate-800 text-slate-400 cursor-wait'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:brightness-110 text-slate-950 shadow-amber-500/25'
              )}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{isZh ? `生成动图中... ${progress}%` : `Generating GIF... ${progress}%`}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {isZh
                      ? `下载高清动图 (${action === 'static' ? '纯配件微动' : currentActionMeta.nameZh} • ${modeLabel} • ${resolution}px)`
                      : `Download HD GIF (${action === 'static' ? 'Accessory FX' : currentActionMeta.nameEn} • ${modeLabel} • ${resolution}px)`}
                  </span>
                </>
              )}
            </motion.button>
          </div>

        </div>

      </div>

    </div>
  );
};
