import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Paintbrush, 
  Download, 
  Shuffle, 
  RefreshCw, 
  Check, 
  Palette,
  Sparkles,
  Ban
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import { BODY_COLORS, PRESET_COLORS } from '../../utils/constants';
import { useLanguage } from '../../utils/i18n';

interface DiyStudioProps {
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

const diyImgCache = new Map<string, HTMLImageElement>();

function loadCanvasImage(url: string): Promise<HTMLImageElement> {
  if (diyImgCache.has(url)) {
    return Promise.resolve(diyImgCache.get(url)!);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      diyImgCache.set(url, img);
      if ('decode' in img) {
        img.decode().catch(() => {}).then(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export const DiyStudio: React.FC<DiyStudioProps> = ({ onToast }) => {
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

const SPECIAL_SERIES = ['Dog', 'Peer', 'Rabbit', 'Block'];

        metadataList.forEach((item) => {
          if (item.attributes) {
            CATEGORIES.forEach((category) => {
              const value = item.attributes[category];
              if (value && value !== 'None') {
                // Exclude special series species identifiers from Head category
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
      
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans">
          {t.diyTitle}
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          {t.diySub}
        </p>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Avatar Canvas, Actions, Resolution, BG Color, Series Switcher */}
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

            {/* 2. Action Buttons: Randomize & Save */}
            <div className="grid grid-cols-2 gap-2.5">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={randomize}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-all shadow-md active:scale-95"
              >
                <Shuffle className="w-4 h-4 text-emerald-400" />
                <span>{t.diyRandomBtn}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={saveAvatar}
                disabled={loading || saving}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 hover:brightness-110 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
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
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
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
                    'py-2 px-1 rounded-2xl text-[11px] font-mono font-bold border transition-all text-center',
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

            {/* 5. Series Switcher Tabs */}
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

          </div>
        </div>

        {/* Right Column: Trait Categories and Grid Selector */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] shadow-2xl min-h-[580px] flex flex-col gap-5">
            
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
              
              {/* Show Disabled Head Tab if current series doesn't support Head (e.g. Rabbit, Dog, Block, Peer) */}
              {!SERIES_COMPONENTS[activeSeries].includes('Head') && (
                <div className="flex-1 py-2.5 px-3 rounded-xl text-xs font-medium text-slate-600 text-center select-none cursor-not-allowed">
                  {lang === 'zh' ? '头部 (无)' : 'Head (N/A)'}
                </div>
              )}
            </div>

            {/* Trait Items Grid Picker with Label Below Each Icon */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-[520px] overflow-y-auto pr-1 no-scrollbar">
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
                      {/* Center Icon / Sprite */}
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

                      {/* Bottom Trait Value Label */}
                      <span className={clsx(
                        'text-[10px] font-mono truncate max-w-full text-center mt-1 leading-tight',
                        isSelected ? 'text-emerald-300 font-bold' : 'text-slate-400'
                      )}>
                        {isNone ? (lang === 'zh' ? '无' : 'None') : item.value}
                      </span>

                      {/* Selected Top-Right Checkmark Badge */}
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
        </div>

      </div>

    </div>
  );
};
