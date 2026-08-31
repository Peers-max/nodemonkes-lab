import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Paintbrush, 
  Download, 
  Shuffle, 
  RefreshCw, 
  Check, 
  CreditCard, 
  Palette,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { BODY_COLORS, PRESET_COLORS } from '../../utils/constants';
import { useLanguage } from '../../utils/i18n';

interface DiyStudioProps {
  onOpenInPassport?: (avatarUrl?: string, traits?: { Body: string; Head: string; Eyes: string; Earring: string; Count: number }) => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

type SeriesType = 'normal' | 'dog' | 'block' | 'rabbit' | 'peer';
type CategoryType = 'Body' | 'Earring' | 'Eyes' | 'Head';
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
const SPECIAL_SERIES = ['Dog', 'Peer', 'Rabbit', 'Block'];

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

function loadCanvasImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = `${url}?t=${Date.now()}`;
  });
}

export const DiyStudio: React.FC<DiyStudioProps> = ({ onOpenInPassport, onToast }) => {
  const { lang, t } = useLanguage();
  const [activeSeries, setActiveSeries] = useState<SeriesType>('normal');
  const [activeCategory, setActiveCategory] = useState<CategoryType>('Body');

  const [selectedParts, setSelectedParts] = useState<Record<CategoryType, string>>({
    Body: '',
    Earring: '',
    Eyes: '',
    Head: '',
  });

  const [bgMode, setBgMode] = useState<BgModeType>('transparent');
  const [customColor, setCustomColor] = useState<string>('#310000');
  const [saveResolution, setSaveResolution] = useState<number>(1008);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
                if (!(category === 'Head' && SPECIAL_SERIES.includes(value))) {
                  uniqueComponents[category].add(value);
                }
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
              url: `${BASE_URLS[series]}/${category.toLowerCase()}/${value}.png`,
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

    for (const category of CATEGORIES) {
      const imgSrc = selectedParts[category];
      if (imgSrc && imgSrc !== 'none') {
        const img = await loadCanvasImage(imgSrc);
        ctx.drawImage(img, 0, 0, size, size);
      }
    }

    return canvas;
  };

  // 1. Direct Save PNG
  const saveAvatar = async () => {
    setSaving(true);
    try {
      const canvas = await renderCompositeCanvas(saveResolution);

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob creation failed');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nodemonke_diy_${activeSeries}_${saveResolution}px_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#F59E0B', '#6EE7B7'],
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

  // 2. Open DIY Monke in 3D Passport Studio
  const handleOpen3DCard = async () => {
    try {
      setSaving(true);
      const canvas = await renderCompositeCanvas(600);
      const avatarUrl = canvas.toDataURL('image/png');

      if (onOpenInPassport) {
        onOpenInPassport(avatarUrl, {
          Body: traitNames.Body,
          Head: traitNames.Head,
          Eyes: traitNames.Eyes,
          Earring: traitNames.Earring,
          Count: traitNames.Count,
        });
      }
    } catch (e: any) {
      console.error('Failed to prepare DIY 3D Card:', e);
      onToast('加载失败', e?.message || '请重试', 'error');
    } finally {
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* Title Header */}
      <div className="text-center space-y-2 px-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold shadow-sm">
          <Paintbrush className="w-3.5 h-3.5" />
          <span>{t.diyBadge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {t.diyTitle}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-sans">
          {t.diySub}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: 4-Layer DOM Preview & Action Buttons */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-4">
            
            {/* Preview Container */}
            <div 
              className="relative w-full aspect-square rounded-2xl border border-white/10 overflow-hidden shadow-inner flex items-center justify-center transition-colors"
              style={{ backgroundColor: currentBgColor }}
            >
              {currentBgColor === 'transparent' && (
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
              )}

              {/* Layer 1: Body */}
              {selectedParts.Body && selectedParts.Body !== 'none' && (
                <img
                  src={selectedParts.Body}
                  alt="Body Layer"
                  className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-10"
                />
              )}

              {/* Layer 2: Earring */}
              {selectedParts.Earring && selectedParts.Earring !== 'none' && (
                <img
                  src={selectedParts.Earring}
                  alt="Earring Layer"
                  className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-20"
                />
              )}

              {/* Layer 3: Eyes */}
              {selectedParts.Eyes && selectedParts.Eyes !== 'none' && (
                <img
                  src={selectedParts.Eyes}
                  alt="Eyes Layer"
                  className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-30"
                />
              )}

              {/* Layer 4: Head */}
              {selectedParts.Head && selectedParts.Head !== 'none' && (
                <img
                  src={selectedParts.Head}
                  alt="Head Layer"
                  className="absolute inset-0 w-full h-full object-contain pixelated pointer-events-none z-40"
                />
              )}

              {loading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-50">
                  <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono text-slate-300">{t.diyLoadingComponents}</span>
                </div>
              )}

              <div className="absolute top-3 left-3 z-50 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] font-mono text-slate-300 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{activeSeriesLabel} {t.diySeriesSuffix}</span>
              </div>
            </div>

            {/* Quick Actions & 3D Card Jump */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={randomize}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-all shadow-md"
                >
                  <Shuffle className="w-4 h-4 text-emerald-400" />
                  <span>{t.diyRandomBtn}</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={saveAvatar}
                  disabled={loading || saving}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>{saving ? t.diySavingBtn : `${t.diySaveBtn} (${saveResolution}px)`}</span>
                </motion.button>
              </div>

              {/* 3D Web3 Card Quick Studio Link Button */}
              {onOpenInPassport && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={handleOpen3DCard}
                  disabled={loading || saving}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:brightness-110 text-white font-mono font-extrabold text-xs shadow-xl shadow-purple-500/20 transition-all border border-white/10"
                >
                  <CreditCard className="w-4 h-4 text-amber-300" />
                  <span>🎴 制作 3D 极客卡片 / 通行证</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 text-amber-300" />
                </motion.button>
              )}

              {/* Resolution Options Selector */}
              <div className="flex flex-wrap items-center justify-between gap-1 p-1 bg-slate-950/60 rounded-2xl border border-white/5 text-[11px] font-mono shadow-inner">
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
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Trait Pickers */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl space-y-5">
            
            {/* 1. Series Switcher Tabs */}
            <div className="space-y-2">
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
                      'flex-1 min-w-[70px] py-2 px-3 rounded-2xl text-xs font-mono font-bold transition-all border shadow-sm',
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

            {/* 2. Trait Category Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                {lang === 'zh' ? '部件类别' : 'Categories'}
              </label>
              <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/60 rounded-2xl border border-white/5">
                {SERIES_COMPONENTS[activeSeries].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={clsx(
                      'flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold transition-all text-center',
                      activeCategory === cat
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    )}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Trait Items Grid Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{getCategoryLabel(activeCategory)} ({currentParts.length})</span>
                <span className="text-emerald-400 font-semibold">{traitNames[activeCategory]}</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5 max-h-[260px] overflow-y-auto pr-1 no-scrollbar">
                {currentParts.map((item, idx) => {
                  const isSelected = selectedParts[activeCategory] === item.url;
                  const isNone = item.url === 'none';

                  return (
                    <motion.div
                      key={`${item.value}-${idx}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => selectPart(activeCategory, item.url)}
                      className={clsx(
                        'relative aspect-square rounded-2xl border flex flex-col items-center justify-center p-1.5 cursor-pointer transition-all',
                        isSelected
                          ? 'bg-emerald-500/20 border-emerald-400 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-800/60'
                      )}
                    >
                      {isNone ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <span className="text-slate-500 text-lg">✕</span>
                          <span className="text-[10px] font-mono text-slate-400 mt-1">{t.diyNoneOption}</span>
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={item.value}
                          className="w-full h-full object-contain pixelated"
                          loading="lazy"
                        />
                      )}

                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center text-slate-950 shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
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
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all',
                    bgMode === 'transparent'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgNone}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('orange')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all',
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
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all',
                    bgMode === 'auto'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                      : 'bg-slate-900/60 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgAuto}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('custom')}
                  className={clsx(
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all',
                    bgMode === 'custom'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
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

          </div>
        </div>

      </div>

    </div>
  );
};
