import React, { useState, useEffect, useMemo } from 'react';
import { Paintbrush, Download, Shuffle, RefreshCw, Check } from 'lucide-react';
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

  const saveAvatar = async () => {
    setSaving(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not available');

      const size = saveResolution;
      canvas.width = size;
      canvas.height = size;
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

      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Blob creation failed');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nodemonke_avatar_${activeSeries}_${size}px_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        // Confetti Celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#F59E0B', '#6EE7B7'],
        });

        onToast(t.diySuccess, `${t.diySuccessDesc} (${size} × ${size})`, 'success');
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
    <div className="max-w-6xl mx-auto space-y-6">
      
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

            {/* Quick Actions */}
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

            {/* Background Selector */}
            <div className="space-y-2 pt-3 border-t border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                {t.diyBgTitle}
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setBgMode('transparent')}
                  className={clsx(
                    'py-2 px-1 rounded-xl text-xs font-medium border transition-all text-center',
                    bgMode === 'transparent'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgNone}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('orange')}
                  className={clsx(
                    'py-2 px-1 rounded-xl text-xs font-medium border transition-all text-center',
                    bgMode === 'orange'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgOrange}
                </button>

                <button
                  type="button"
                  onClick={() => setBgMode('auto')}
                  className={clsx(
                    'py-2 px-1 rounded-xl text-xs font-medium border transition-all text-center',
                    bgMode === 'auto'
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {t.diyBgAuto}
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBgMode('custom')}
                    className={clsx(
                      'w-full py-2 px-1 rounded-xl text-xs font-medium border transition-all text-center relative overflow-hidden flex items-center justify-center',
                      bgMode === 'custom'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                    )}
                  >
                    <span>{t.diyBgCustom}</span>
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
                          ? 'scale-110 ring-2 ring-emerald-400 border-white'
                          : 'border-white/20 hover:scale-105'
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Series Buttons */}
            <div className="space-y-2 pt-3 border-t border-white/[0.06]">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                {t.diySeriesTitle}
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {SERIES_BUTTONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSeriesHandler(s.id)}
                    className={clsx(
                      'py-2 rounded-xl text-xs font-mono font-semibold transition-all text-center border',
                      activeSeries === s.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20 scale-[1.02]'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                    )}
                  >
                    {lang === 'zh' ? s.zh : s.en}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Category Tabs & Trait Parts Grid */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl flex flex-col min-h-[580px]">
          
          {/* Category Tabs with Fluid Indicator */}
          <div className="relative flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-2xl border border-white/10 mb-4 shadow-inner">
            {CATEGORIES.map((cat) => {
              const isSupported = SERIES_COMPONENTS[activeSeries].includes(cat);
              const isActive = activeCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => isSupported && setActiveCategory(cat)}
                  disabled={!isSupported}
                  className={clsx(
                    'relative flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors text-center select-none z-10',
                    !isSupported && 'opacity-30 cursor-not-allowed text-slate-600',
                    isActive ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="diyCategoryPill"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl shadow-md"
                    />
                  )}
                  <span className="relative z-10">{getCategoryLabel(cat)}</span>
                  {!isSupported && <span className="relative z-10 text-[10px] ml-1 opacity-60">({lang === 'zh' ? '无' : 'N/A'})</span>}
                </button>
              );
            })}
          </div>

          {/* Parts Grid */}
          <div className="flex-1 overflow-y-auto max-h-[480px] pr-1">
            {!SERIES_COMPONENTS[activeSeries].includes(activeCategory) ? (
              <div className="flex items-center justify-center h-64 text-slate-500 text-sm font-mono">
                {activeSeriesLabel} {t.diyNotSupported}
              </div>
            ) : currentParts.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-slate-500 text-sm font-mono">
                {t.diyLoadingComponents}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
                {currentParts.map((part) => {
                  const isSelected = selectedParts[activeCategory] === part.url;
                  const isNone = part.url === 'none';

                  return (
                    <motion.div
                      key={part.value}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => selectPart(activeCategory, part.url)}
                      className={clsx(
                        'aspect-square rounded-2xl p-2 cursor-pointer transition-all duration-200 flex flex-col items-center justify-between border group relative overflow-hidden',
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-950/40 border-white/5 hover:border-emerald-500/40 hover:bg-slate-900/80'
                      )}
                    >
                      <div className="w-full h-full flex items-center justify-center overflow-hidden p-1">
                        {isNone ? (
                          <div className="relative w-10 h-10 rounded-full border-2 border-dashed border-slate-500 flex items-center justify-center">
                            <div className="w-8 h-0.5 bg-slate-500 transform rotate-45" />
                          </div>
                        ) : (
                          <img
                            src={part.url}
                            alt={part.value}
                            loading="lazy"
                            className="w-full h-full object-contain pixelated transform group-hover:scale-110 transition-transform duration-200"
                          />
                        )}
                      </div>

                      <span className="text-[10px] text-center font-sans text-slate-300 truncate w-full px-1">
                        {isNone ? (lang === 'zh' ? '无' : 'None') : part.value}
                      </span>

                      {isSelected && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
