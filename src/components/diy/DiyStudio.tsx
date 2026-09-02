import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Paintbrush, 
  Download, 
  Shuffle, 
  RefreshCw, 
  Check, 
  Palette,
  Sparkles,
  Ban,
  Ruler,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { BODY_COLORS, PRESET_COLORS } from '../../utils/constants';
import { useLanguage } from '../../utils/i18n';
import { 
  CUSTOM_TRAITS, 
  CustomTraitCategory, 
  CustomTraitItem 
} from '../../utils/customTraits';

interface DiyStudioProps {
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

type StudioMode = 'official' | 'custom';
type SeriesType = 'normal' | 'dog' | 'block' | 'rabbit' | 'peer';
type CategoryType = 'Body' | 'Earring' | 'Eyes' | 'Head';
type CustomCategoryType = 'Head' | 'Eyes' | 'Mouth';
type BgModeType = 'transparent' | 'orange' | 'auto' | 'custom';

interface TraitPart {
  value: string;
  url: string;
}

const METADATA_URL = 'https://pub-ce8a03b190984a3d99332e13b7d5e3cb.r2.dev/metadata.json';

const BASE_URLS: Record<SeriesType, string> = {
  block: 'https://pub-d7a7a960d42949efb84bea391aa90d4c.r2.dev',
  dog: 'https://pub-4d8b3f7049bb4025a6642c75eeb71c46.r2.dev',
  normal: 'https://pub-2f0821e8464b4c139f681d763393f4ee.r2.dev',
  peer: 'https://pub-026e5fdeaab545cc9c5aa34738735770.r2.dev',
  rabbit: 'https://pub-e50795db8d0d41dd942f04a8b290f95f.r2.dev',
};

const CATEGORIES: CategoryType[] = ['Body', 'Earring', 'Eyes', 'Head'];
const CUSTOM_CATEGORIES: CustomCategoryType[] = ['Head', 'Eyes', 'Mouth'];

const SERIES_COMPONENTS: Record<SeriesType, CategoryType[]> = {
  normal: ['Body', 'Earring', 'Eyes', 'Head'],
  dog: ['Body', 'Earring', 'Eyes'],
  block: ['Body', 'Earring', 'Eyes'],
  rabbit: ['Body', 'Earring', 'Eyes'],
  peer: ['Body', 'Eyes'],
};

const SERIES_BUTTONS: { id: SeriesType; zh: string; en: string }[] = [
  { id: 'normal', zh: '普通', en: 'Normal' },
  { id: 'dog', zh: '狗猴', en: 'Dog' },
  { id: 'block', zh: '方块', en: 'Block' },
  { id: 'rabbit', zh: '兔猴', en: 'Rabbit' },
  { id: 'peer', zh: '同行', en: 'Peer' },
];

const RESOLUTION_OPTIONS = [
  { label: '512px', value: 512 },
  { label: '1008px', value: 1008 },
  { label: '2048px (2K)', value: 2048 },
  { label: '4096px (4K)', value: 4096 },
];

export const PRESET_BODIES = [
  { id: 209, nameZh: '🍊 经典橙皮', nameEn: 'Classic Orange', url: 'https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/209.png' },
  { id: 868, nameZh: '👑 纯金金猴', nameEn: 'Pure Gold', url: 'https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/868.png' },
  { id: 1000, nameZh: '👽 异星天青', nameEn: 'Alien Cyan', url: 'https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/1000.png' },
  { id: 4000, nameZh: '🧟 僵尸绿皮', nameEn: 'Zombie Green', url: 'https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/4000.png' },
  { id: 5000, nameZh: '🤖 机械灰钛', nameEn: 'Cyborg Gray', url: 'https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/5000.png' },
  { id: 2332, nameZh: '🟣 赛博暗紫', nameEn: 'Cyber Purple', url: 'https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/2332.png' },
  { id: 6000, nameZh: '💎 钻石白皮', nameEn: 'Diamond White', url: 'https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/6000.png' },
  { id: 7000, nameZh: '🟥 赤红战神', nameEn: 'Crimson Red', url: 'https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/7000.png' },
  { id: 8000, nameZh: '🔵 深海湛蓝', nameEn: 'Ocean Blue', url: 'https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/8000.png' },
];

const diyImgCache = new Map<string, HTMLImageElement>();

function loadCanvasImage(url: string): Promise<HTMLImageElement> {
  if (!url || url === 'none') {
    return Promise.reject(new Error('Empty url'));
  }
  if (diyImgCache.has(url)) {
    const cached = diyImgCache.get(url)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      diyImgCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      // Fallback: try direct image without crossOrigin
      const fallback = new Image();
      fallback.onload = () => {
        diyImgCache.set(url, fallback);
        resolve(fallback);
      };
      fallback.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };
      fallback.src = url;
    };
    img.src = url;
  });
}

export const DiyStudio: React.FC<DiyStudioProps> = ({ onToast }) => {
  const { lang, t } = useLanguage();
  const [studioMode, setStudioMode] = useState<StudioMode>('custom');
  const [activeSeries, setActiveSeries] = useState<SeriesType>('normal');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('Head');
  const [activeCustomCategory, setActiveCustomCategory] = useState<CustomCategoryType>('Head');
  const [showRulers, setShowRulers] = useState(false);
  const [customMonkeInput, setCustomMonkeInput] = useState<string>('209');

  const [selectedParts, setSelectedParts] = useState<Record<CategoryType, string>>({
    Body: PRESET_BODIES[0].url,
    Earring: '',
    Eyes: '',
    Head: '',
  });


  const [activeCustomTraits, setActiveCustomTraits] = useState<Record<CustomCategoryType, string | null>>({
    Head: 'btc_crown',
    Eyes: 'cyber_vr',
    Mouth: 'gold_cigar',
  });

  const [bgMode, setBgMode] = useState<BgModeType>('transparent');
  const [customColor, setCustomColor] = useState<string>('#310000');
  const [saveResolution, setSaveResolution] = useState<number>(1008);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);


  const [components, setComponents] = useState<Record<SeriesType, Record<CategoryType, TraitPart[]>>>({
    normal: { Body: [], Earring: [], Eyes: [], Head: [] },
    dog: { Body: [], Earring: [], Eyes: [], Head: [] },
    block: { Body: [], Earring: [], Eyes: [], Head: [] },
    rabbit: { Body: [], Earring: [], Eyes: [], Head: [] },
    peer: { Body: [], Earring: [], Eyes: [], Head: [] },
  });

  // Extract readable trait names
  const traitNames = useMemo(() => {
    const getTraitName = (url: string) => {
      if (!url || url === 'none') return 'None';
      const file = url.split('/').pop()?.replace('.png', '') || 'None';
      return decodeURIComponent(file);
    };

    return {
      Body: getTraitName(selectedParts.Body),
      Earring: getTraitName(selectedParts.Earring),
      Eyes: getTraitName(selectedParts.Eyes),
      Head: getTraitName(selectedParts.Head),
      Count: Object.values(selectedParts).filter((p) => p && p !== 'none').length,
    };
  }, [selectedParts]);

  const currentBgColor = useMemo(() => {
    if (bgMode === 'transparent') return 'transparent';
    if (bgMode === 'orange') return '#F97316';
    if (bgMode === 'custom') return customColor;
    if (bgMode === 'auto') {
      const bodyUrl = selectedParts.Body;
      if (bodyUrl && bodyUrl !== 'none') {
        const filename = bodyUrl.split('/').pop()?.replace('.png', '').toLowerCase() || '';
        for (const [key, color] of Object.entries(BODY_COLORS)) {
          if (filename.includes(key.toLowerCase())) {
            return color;
          }
        }
      }
      return '#FFAA01';
    }
    return 'transparent';
  }, [bgMode, customColor, selectedParts.Body]);

  useEffect(() => {
    let mounted = true;

    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const res = await fetch(METADATA_URL);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const metadataList: any[] = Array.isArray(data) ? data : [data];

        const uniqueComponents: Record<CategoryType, Set<string>> = {
          Body: new Set(),
          Earring: new Set(),
          Eyes: new Set(),
          Head: new Set(),
        };

        metadataList.forEach((item) => {
          if (item.attributes) {
            CATEGORIES.forEach((category) => {
              const value = item.attributes[category];
              if (value && value !== 'None') {
                uniqueComponents[category].add(value);
              }
            });
          }
        });

        const newComponents: Record<SeriesType, Record<CategoryType, TraitPart[]>> = {
          normal: { Body: [], Earring: [], Eyes: [], Head: [] },
          dog: { Body: [], Earring: [], Eyes: [], Head: [] },
          block: { Body: [], Earring: [], Eyes: [], Head: [] },
          rabbit: { Body: [], Earring: [], Eyes: [], Head: [] },
          peer: { Body: [], Earring: [], Eyes: [], Head: [] },
        };

        (Object.keys(BASE_URLS) as SeriesType[]).forEach((series) => {
          SERIES_COMPONENTS[series].forEach((category) => {
            const parts: TraitPart[] = Array.from(uniqueComponents[category]).map((value) => ({
              value,
              url: `${BASE_URLS[series]}/${category.toLowerCase()}/${value}.png?v=2`,
            }));

            if (['Earring', 'Eyes'].includes(category) || (category === 'Head' && series === 'normal')) {
              parts.unshift({ value: 'None', url: 'none' });
            }

            newComponents[series][category] = parts;
          });
        });

        if (!mounted) return;
        setComponents(newComponents);

        const initialParts: Record<CategoryType, string> = {
          Body: '',
          Earring: '',
          Eyes: '',
          Head: '',
        };

        SERIES_COMPONENTS.normal.forEach((cat) => {
          const parts = newComponents.normal[cat];
          const valid = parts.filter((p) => p.url !== 'none');
          if (valid.length > 0) {
            if (cat === 'Body' || Math.random() > 0.3) {
              const rand = valid[Math.floor(Math.random() * valid.length)];
              initialParts[cat] = rand.url;
            } else {
              initialParts[cat] = 'none';
            }
          }
        });

        setSelectedParts(initialParts);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching DIY metadata:', err);
        if (mounted) setLoading(false);
      }
    };

    fetchMetadata();

    return () => {
      mounted = false;
    };
  }, []);

  const selectPart = (category: CategoryType, src: string) => {
    setSelectedParts((prev) => ({
      ...prev,
      [category]: src,
    }));
  };

  const toggleCustomTrait = (category: CustomCategoryType, traitId: string) => {
    setActiveCustomTraits((prev) => ({
      ...prev,
      [category]: prev[category] === traitId ? null : traitId,
    }));
  };

  const clearCustomCategory = (category: CustomCategoryType) => {
    setActiveCustomTraits((prev) => ({
      ...prev,
      [category]: null,
    }));
  };

  const setActiveSeriesHandler = (series: SeriesType) => {
    setActiveSeries(series);
    if (!SERIES_COMPONENTS[series].includes(activeCategory)) {
      setActiveCategory('Body');
    }

    setSelectedParts({
      Body: '',
      Earring: '',
      Eyes: '',
      Head: '',
    });
  };

  const randomize = () => {
    if (studioMode === 'custom') {
      // Randomize Custom Remix Traits & Base Body
      const headTraits = CUSTOM_TRAITS.Head;
      const eyesTraits = CUSTOM_TRAITS.Eyes;
      const mouthTraits = CUSTOM_TRAITS.Mouth;

      setActiveCustomTraits({
        Head: Math.random() > 0.15 ? headTraits[Math.floor(Math.random() * headTraits.length)].id : null,
        Eyes: Math.random() > 0.15 ? eyesTraits[Math.floor(Math.random() * eyesTraits.length)].id : null,
        Mouth: Math.random() > 0.25 ? mouthTraits[Math.floor(Math.random() * mouthTraits.length)].id : null,
      });

      // Randomize body
      const bodies = components.normal.Body.filter((b) => b.url !== 'none');
      if (bodies.length > 0) {
        const randBody = bodies[Math.floor(Math.random() * bodies.length)].url;
        setSelectedParts((prev) => ({
          ...prev,
          Body: randBody,
          Head: 'none',
          Eyes: 'none',
          Earring: 'none',
        }));
      }
      return;
    }

    const newParts: Record<CategoryType, string> = {
      Body: '',
      Earring: '',
      Eyes: '',
      Head: '',
    };

    SERIES_COMPONENTS[activeSeries].forEach((category) => {
      const parts = components[activeSeries][category];
      if (parts && parts.length > 0) {
        const validParts = parts.filter((item) => item.url !== 'none');
        const useNone = ['Earring', 'Eyes'].includes(category) && Math.random() < 0.2;

        if (!useNone && validParts.length > 0) {
          const randomIndex = Math.floor(Math.random() * validParts.length);
          newParts[category] = validParts[randomIndex].url;
        } else if (useNone) {
          newParts[category] = 'none';
        } else if (validParts.length > 0) {
          const randomIndex = Math.floor(Math.random() * validParts.length);
          newParts[category] = validParts[randomIndex].url;
        }
      }
    });

    setSelectedParts(newParts);
  };

  // Render Full Composite Avatar onto a Canvas
  const renderCompositeCanvas = async (size: number): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context error');

    ctx.imageSmoothingEnabled = false;

    if (currentBgColor && currentBgColor !== 'transparent') {
      ctx.fillStyle = currentBgColor;
      ctx.fillRect(0, 0, size, size);
    }

    if (studioMode === 'custom') {
      // 1. Draw Base Body
      const bodyUrl = selectedParts.Body || components.normal.Body[0]?.url;
      if (bodyUrl && bodyUrl !== 'none') {
        const img = await loadCanvasImage(bodyUrl);
        ctx.drawImage(img, 0, 0, size, size);
      }

      // 2. Draw Custom Traits in anatomical order
      // Eyes
      if (activeCustomTraits.Eyes) {
        const trait = CUSTOM_TRAITS.Eyes.find((t) => t.id === activeCustomTraits.Eyes);
        if (trait) trait.render(ctx, size);
      }
      // Mouth / Neck
      if (activeCustomTraits.Mouth) {
        const trait = CUSTOM_TRAITS.Mouth.find((t) => t.id === activeCustomTraits.Mouth);
        if (trait) trait.render(ctx, size);
      }
      // Head (Topmost)
      if (activeCustomTraits.Head) {
        const trait = CUSTOM_TRAITS.Head.find((t) => t.id === activeCustomTraits.Head);
        if (trait) trait.render(ctx, size);
      }
    } else {
      for (const category of CATEGORIES) {
        const imgSrc = selectedParts[category];
        if (imgSrc && imgSrc !== 'none') {
          const img = await loadCanvasImage(imgSrc);
          ctx.drawImage(img, 0, 0, size, size);
        }
      }
    }

    return canvas;
  };

  // Update Live Preview Canvas
  useEffect(() => {
    const renderPreview = async () => {
      if (!previewCanvasRef.current) return;
      const cvs = previewCanvasRef.current;
      const ctx = cvs.getContext('2d');
      if (!ctx) return;

      cvs.width = 420;
      cvs.height = 420;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 420, 420);

      if (currentBgColor && currentBgColor !== 'transparent') {
        ctx.fillStyle = currentBgColor;
        ctx.fillRect(0, 0, 420, 420);
      }

      if (studioMode === 'custom') {
        // Draw base body
        const bodyUrl = selectedParts.Body || (components.normal.Body.find((b) => b.url !== 'none')?.url || '');
        if (bodyUrl && bodyUrl !== 'none') {
          try {
            const img = await loadCanvasImage(bodyUrl);
            ctx.drawImage(img, 0, 0, 420, 420);
          } catch {}
        }

        // Draw custom traits
        if (activeCustomTraits.Eyes) {
          const trait = CUSTOM_TRAITS.Eyes.find((t) => t.id === activeCustomTraits.Eyes);
          if (trait) trait.render(ctx, 420);
        }
        if (activeCustomTraits.Mouth) {
          const trait = CUSTOM_TRAITS.Mouth.find((t) => t.id === activeCustomTraits.Mouth);
          if (trait) trait.render(ctx, 420);
        }
        if (activeCustomTraits.Head) {
          const trait = CUSTOM_TRAITS.Head.find((t) => t.id === activeCustomTraits.Head);
          if (trait) trait.render(ctx, 420);
        }
      } else {
        for (const category of CATEGORIES) {
          const imgSrc = selectedParts[category];
          if (imgSrc && imgSrc !== 'none') {
            try {
              const img = await loadCanvasImage(imgSrc);
              ctx.drawImage(img, 0, 0, 420, 420);
            } catch {}
          }
        }
      }
    };

    renderPreview();
  }, [selectedParts, activeCustomTraits, currentBgColor, studioMode, components]);

  // Direct Save PNG
  const saveAvatar = async () => {
    setSaving(true);
    try {
      const canvas = await renderCompositeCanvas(saveResolution);

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob creation failed');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nodemonke_${studioMode}_${saveResolution}px_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#06B6D4', '#EF4444'],
        });

        onToast(t.diySuccess, `${t.diySuccessDesc} (${saveResolution} × ${saveResolution})`, 'success');
        setSaving(false);
      }, 'image/png');
    } catch (err: any) {
      console.error('Save failed:', err);
      onToast(t.diySaveFailed, err.message || (lang === 'zh' ? '请重试' : 'Please retry'), 'error');
      setSaving(false);
    }
  };

  const currentParts = components[activeSeries][activeCategory] || [];
  const currentSeriesObj = SERIES_BUTTONS.find((s) => s.id === activeSeries);
  const activeSeriesLabel = currentSeriesObj ? (lang === 'zh' ? currentSeriesObj.zh : currentSeriesObj.en) : activeSeries;

  const getCategoryLabel = (cat: CategoryType) => {
    if (cat === 'Body') return t.diyCatBody;
    if (cat === 'Earring') return t.diyCatEarring;
    if (cat === 'Eyes') return t.diyCatEyes;
    return t.diyCatHead;
  };

  const getCustomCategoryLabel = (cat: CustomCategoryType) => {
    if (cat === 'Head') return lang === 'zh' ? '👑 头部新配件 (6款)' : '👑 New Headwear';
    if (cat === 'Eyes') return lang === 'zh' ? '🕶️ 眼部新配件 (5款)' : '🕶️ New Eyewear';
    return lang === 'zh' ? '🚬 嘴部/面饰 (4款)' : '🚬 New Mouth/Neck';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-mono font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === 'zh' ? '28×28 像素坐标绝对对齐' : '28x28 Native Pixel Studio'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>{studioMode === 'custom' ? (lang === 'zh' ? '✨ 二创限定工坊' : 'Remix Studio') : (lang === 'zh' ? '🏛️ 官方图鉴工坊' : 'Official Studio')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
          {t.diyTitle}
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          {studioMode === 'custom' 
            ? (lang === 'zh' ? '严格遵循神兽骨骼坐标：帽子锁定 Y=9 基准线（只往上生长），眼睛锁定 Y=13~15，嘴部锁定 Y=18~20' : 'Strict anatomical alignment: Hats anchored at Y=9, Eyes at Y=13-15, Mouth at Y=18-20')
            : t.diySub
          }
        </p>

        {/* Mode Switcher Tabs */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-950/80 border border-white/10 shadow-lg mt-2">
          <button
            type="button"
            onClick={() => setStudioMode('custom')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all',
              studioMode === 'custom'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '✨ 二创限定配件 (2026 Remix)' : '✨ 2026 Remix Traits'}</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioMode('official')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all',
              studioMode === 'official'
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{lang === 'zh' ? '🏛️ 官方原版配件 (Official 10K)' : '🏛️ Official 10K Traits'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Avatar Canvas, Actions, Resolution, BG Color */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
            
            {/* 1. Live Composite Preview Canvas */}
            <div 
              style={{ backgroundColor: currentBgColor }}
              className="relative aspect-square w-full rounded-2xl overflow-hidden border border-white/10 shadow-inner flex items-center justify-center transition-colors duration-200"
            >
              {currentBgColor === 'transparent' && (
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
              )}

              {/* Dynamic Composite Canvas */}
              <canvas
                ref={previewCanvasRef}
                width={420}
                height={420}
                className="w-full h-full object-contain pixelated relative z-10"
              />

              {/* Coordinate Guideline Overlay */}
              {showRulers && (
                <div className="absolute inset-0 pointer-events-none z-20">
                  {/* Hat Baseline at Y=9 */}
                  <div className="absolute left-0 right-0 border-b border-amber-400/80 border-dashed" style={{ top: `${(9 / 28) * 100}%` }}>
                    <span className="absolute right-2 -top-4 text-[9px] font-mono text-amber-300 bg-black/80 px-1.5 py-0.5 rounded shadow">Hat Base (Y=9)</span>
                  </div>
                  {/* Eyes Baseline at Y=14 */}
                  <div className="absolute left-0 right-0 border-b border-sky-400/80 border-dashed" style={{ top: `${(14 / 28) * 100}%` }}>
                    <span className="absolute right-2 -top-4 text-[9px] font-mono text-sky-300 bg-black/80 px-1.5 py-0.5 rounded shadow">Eyes (Y=14)</span>
                  </div>
                  {/* Mouth Baseline at Y=19 */}
                  <div className="absolute left-0 right-0 border-b border-rose-400/80 border-dashed" style={{ top: `${(19 / 28) * 100}%` }}>
                    <span className="absolute right-2 -top-4 text-[9px] font-mono text-rose-300 bg-black/80 px-1.5 py-0.5 rounded shadow">Mouth (Y=19)</span>
                  </div>
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-50">
                  <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                  <span className="text-xs font-mono text-slate-300">{t.diyLoadingComponents}</span>
                </div>
              )}

              <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-mono text-slate-300 shadow-md">
                <span className={clsx('w-2 h-2 rounded-full animate-pulse', studioMode === 'custom' ? 'bg-amber-400' : 'bg-emerald-400')} />
                <span>{studioMode === 'custom' ? (lang === 'zh' ? '二创限定模式' : 'Remix Mode') : `${activeSeriesLabel} ${t.diySeriesSuffix}`}</span>
              </div>

              {/* Rulers Toggle Button */}
              <button
                type="button"
                onClick={() => setShowRulers(!showRulers)}
                className={clsx(
                  'absolute bottom-3 right-3 z-30 px-2.5 py-1 rounded-full text-[10px] font-mono border backdrop-blur-md transition-all flex items-center gap-1',
                  showRulers 
                    ? 'bg-amber-500/30 border-amber-400 text-amber-300 font-bold' 
                    : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'
                )}
              >
                <Ruler className="w-3 h-3" />
                <span>{showRulers ? (lang === 'zh' ? '辅助线: 开' : 'Ruler: ON') : (lang === 'zh' ? '坐标辅助线' : 'Rulers')}</span>
              </button>
            </div>

            {/* 2. Action Buttons: Randomize & Save */}
            <div className="grid grid-cols-2 gap-2.5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={randomize}
                disabled={loading}
                className={clsx(
                  'flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-semibold text-xs transition-all shadow-md active:scale-95',
                  studioMode === 'custom'
                    ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                )}
              >
                <Shuffle className={clsx('w-4 h-4', studioMode === 'custom' ? 'text-amber-400' : 'text-emerald-400')} />
                <span>{studioMode === 'custom' ? (lang === 'zh' ? '🎲 随机二创穿搭' : '🎲 Random Remix') : t.diyRandomBtn}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={saveAvatar}
                disabled={loading || saving}
                className={clsx(
                  'flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs shadow-lg transition-all active:scale-95',
                  studioMode === 'custom'
                    ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:brightness-110 text-slate-950 shadow-amber-500/25'
                    : 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 shadow-emerald-500/25'
                )}
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{saving ? t.diySavingBtn : `${t.diySaveBtn} (${saveResolution}px)`}</span>
              </motion.button>
            </div>

            {/* 3. Export Resolution Selector */}
            <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 bg-slate-950/60 rounded-2xl border border-white/5 text-[11px] font-mono shadow-inner">
              <span className="text-slate-400 px-2 font-medium">{t.diyResTitle}</span>
              <div className="flex items-center gap-1">
                {RESOLUTION_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setSaveResolution(r.value)}
                    className={clsx(
                      'px-2.5 py-1 rounded-xl transition-all font-semibold',
                      saveResolution === r.value
                        ? (studioMode === 'custom' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-emerald-500 text-slate-950 shadow-sm')
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Background Color Selector */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                {t.diyBgTitle}
              </label>

              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setBgMode('transparent')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all text-center',
                    bgMode === 'transparent'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgNone}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('orange')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all text-center',
                    bgMode === 'orange'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgOrange}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('auto')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all text-center',
                    bgMode === 'auto'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgAuto}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('custom')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all text-center',
                    bgMode === 'custom'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgCustom}
                </button>
              </div>

              {bgMode === 'custom' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-8 h-8 rounded-xl cursor-pointer border border-white/20 bg-transparent"
                  />
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCustomColor(c.value)}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                        className="w-6 h-6 rounded-lg border border-white/20 transition-transform hover:scale-110 active:scale-95"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Official Series Switcher (Only in Official mode) */}
            {studioMode === 'official' && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                  {t.diySeriesTitle}
                </label>
                <div className="flex flex-wrap gap-2">
                  {SERIES_BUTTONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveSeriesHandler(s.id)}
                      className={clsx(
                        'flex-1 min-w-[58px] py-2 px-2.5 rounded-2xl text-xs font-mono font-bold transition-all border shadow-sm text-center',
                        activeSeries === s.id
                          ? 'bg-emerald-500/20 border-emerald-400/80 text-emerald-300 shadow-emerald-500/10'
                          : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                      )}
                    >
                      {lang === 'zh' ? s.zh : s.en}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Custom Remix Selector OR Official Grid Picker */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] shadow-2xl min-h-[580px] flex flex-col gap-5">
            
            {/* MODE 1: CUSTOM REMIX TRAITS SELECTOR */}
            {studioMode === 'custom' ? (
              <div className="space-y-4 flex-1 flex flex-col">
                
                {/* Category Navigation */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/60 rounded-2xl border border-white/5">
                  {CUSTOM_CATEGORIES.map((cat) => {
                    const isActive = activeCustomCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCustomCategory(cat)}
                        className={clsx(
                          'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center',
                          isActive
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {getCustomCategoryLabel(cat)}
                      </button>
                    );
                  })}
                </div>

                {/* Sub-header info & Clear Button */}
                <div className="flex items-center justify-between bg-black/40 px-3.5 py-2 rounded-xl border border-white/5 text-xs font-mono">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>
                      {activeCustomCategory === 'Head' && (lang === 'zh' ? '👑 头部：基准线 Y=9（严格只往上长至 Y=1~8）' : '👑 Head: Baseline Y=9 (Extends up to Y=1)')}
                      {activeCustomCategory === 'Eyes' && (lang === 'zh' ? '🕶️ 眼部：基准线 Y=13~15，左右眼 X=12 与 X=17' : '🕶️ Eyes: Baseline Y=13-15')}
                      {activeCustomCategory === 'Mouth' && (lang === 'zh' ? '🚬 嘴部：基准线 Y=18~20，胸前饰品至 Y=25' : '🚬 Mouth: Baseline Y=18-20')}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => clearCustomCategory(activeCustomCategory)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 underline font-mono"
                  >
                    {lang === 'zh' ? '卸下当前配件' : 'Unequip'}
                  </button>
                </div>

                {/* Custom Traits Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {CUSTOM_TRAITS[activeCustomCategory].map((trait) => {
                    const isSelected = activeCustomTraits[activeCustomCategory] === trait.id;
                    return (
                      <motion.div
                        key={trait.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleCustomTrait(activeCustomCategory, trait.id)}
                        className={clsx(
                          'p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between',
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                            : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900'
                        )}
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-xs text-white flex items-center justify-between">
                            <span>{lang === 'zh' ? trait.nameZh : trait.nameEn}</span>
                            {isSelected && <span className="text-amber-400 font-bold">✓</span>}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{lang === 'zh' ? trait.descZh : trait.descEn}</p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-white/5 text-[10px] font-mono text-amber-400/80">
                          📐 {trait.baseCoord}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Base Body Selector */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-amber-300 uppercase font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      {lang === 'zh' ? '选择底猴身体 (Base Body & Monke):' : 'Select Base Body / Monke ID:'}
                    </span>
                  </div>

                  {/* 1. Curated Preset Clean Bodies */}
                  <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
                    {PRESET_BODIES.map((body) => {
                      const isSelected = selectedParts.Body === body.url;
                      return (
                        <button
                          key={body.id}
                          type="button"
                          onClick={() => {
                            selectPart('Body', body.url);
                            setCustomMonkeInput(String(body.id));
                          }}
                          className={clsx(
                            'flex items-center gap-2 px-2.5 py-1.5 rounded-xl border flex-shrink-0 transition-all text-xs font-mono',
                            isSelected
                              ? 'border-amber-400 bg-amber-500/20 text-amber-200 ring-1 ring-amber-400 font-bold'
                              : 'border-white/10 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
                          )}
                        >
                          <img src={body.url} alt={body.nameZh} className="w-6 h-6 object-contain pixelated rounded" />
                          <span>{lang === 'zh' ? body.nameZh : body.nameEn}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 2. Custom Monke ID Direct Loader */}
                  <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5 text-xs font-mono">
                    <span className="text-slate-400 flex-shrink-0">
                      {lang === 'zh' ? '神兽编号 #' : 'Monke #'}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={customMonkeInput}
                      onChange={(e) => setCustomMonkeInput(e.target.value)}
                      placeholder="1~10000"
                      className="w-20 px-2 py-1 bg-slate-900 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const id = parseInt(customMonkeInput);
                        if (id >= 1 && id <= 10000) {
                          selectPart('Body', `https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/${id}.png`);
                        }
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all"
                    >
                      {lang === 'zh' ? '加载底猴' : 'Load'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const randomId = Math.floor(Math.random() * 10000) + 1;
                        setCustomMonkeInput(String(randomId));
                        selectPart('Body', `https://raw.githubusercontent.com/supercrypto1984/nodemonkes-gallery/main/images/${randomId}.png`);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all ml-auto"
                    >
                      🎲 {lang === 'zh' ? '随机神兽' : 'Random #'}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* MODE 2: OFFICIAL METADATA TRAITS SELECTOR */
              <div className="space-y-4 flex-1 flex flex-col">
                {/* Top Trait Category Tabs */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/60 rounded-2xl border border-white/5">
                  {SERIES_COMPONENTS[activeSeries].map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategory(cat)}
                        className={clsx(
                          'flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center',
                          isActive
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {getCategoryLabel(cat)}
                      </button>
                    );
                  })}
                  
                  {!SERIES_COMPONENTS[activeSeries].includes('Head') && (
                    <div className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium text-slate-600 text-center select-none cursor-not-allowed">
                      {lang === 'zh' ? '头部 (无)' : 'Head (N/A)'}
                    </div>
                  )}
                </div>

                {/* Trait Items Grid Picker */}
                <div className="flex-1 flex flex-col gap-3">
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
                    {currentParts.map((item, idx) => {
                      const isSelected = selectedParts[activeCategory] === item.url;
                      const isNone = item.url === 'none';

                      return (
                        <motion.div
                          key={`${item.value}-${idx}`}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => selectPart(activeCategory, item.url)}
                          className={clsx(
                            'relative aspect-square rounded-2xl border flex flex-col items-center justify-between p-2 cursor-pointer transition-all',
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                              : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-800/60'
                          )}
                        >
                          <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                            {isNone ? (
                              <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center text-slate-500">
                                <Ban className="w-5 h-5 stroke-[1.5]" />
                              </div>
                            ) : (
                              <img
                                src={item.url}
                                alt={item.value}
                                className="w-14 h-14 object-contain pixelated pointer-events-none"
                                loading="lazy"
                              />
                            )}
                          </div>

                          <span className={clsx(
                            'text-[10px] font-mono truncate max-w-full text-center mt-1 leading-tight',
                            isSelected ? 'text-emerald-300 font-bold' : 'text-slate-400'
                          )}>
                            {isNone ? (lang === 'zh' ? '无' : 'None') : item.value}
                          </span>

                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center text-slate-950 shadow-sm">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};

