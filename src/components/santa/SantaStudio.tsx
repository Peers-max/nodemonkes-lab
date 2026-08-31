import React, { useState, useRef, useEffect } from 'react';
import { Gift, Download, Shuffle, Palette, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { BODY_COLORS } from '../../utils/constants';
import { useLanguage } from '../../utils/i18n';

interface SantaStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onOpenInGif: (monkeId: number) => void;
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

const SANTA_PRESETS = [
  '#E11D48',
  '#059669',
  '#2563EB',
  '#D97706',
  '#7C3AED',
  '#0F172A',
];

export const SantaStudio: React.FC<SantaStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  onOpenInGif,
  onToast,
}) => {
  const { lang, t } = useLanguage();
  const [monkeId, setMonkeId] = useState<number>(initialMonkeId);
  const [bgMode, setBgMode] = useState<'transparent' | 'auto' | 'custom'>('custom');
  const [customColor, setCustomColor] = useState<string>('#D97706');
  const [exportRes, setExportRes] = useState<number>(560);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const autoBgColor = React.useMemo(() => {
    const item = monkes.find((m) => m.id === monkeId);
    if (item?.attributes?.Body) {
      const bodyType = item.attributes.Body.toLowerCase();
      return BODY_COLORS[bodyType] || '#D97706';
    }
    return '#D97706';
  }, [monkes, monkeId]);

  const activeBgColor = bgMode === 'transparent' ? null : bgMode === 'auto' ? autoBgColor : customColor;

  useEffect(() => {
    let active = true;
    setIsRendering(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const santaImgUrl = `https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santaupperbody/${monkeId}.png`;
    const lowerImgUrl = `https://pub-048d93bb0a5a448783aecb63c784ccbf.r2.dev/santalowerbody/${monkeId}.png`;

    const imgUpper = new Image();
    const imgLower = new Image();
    imgUpper.crossOrigin = 'anonymous';
    imgLower.crossOrigin = 'anonymous';

    let loaded = 0;
    const checkDraw = () => {
      loaded++;
      if (loaded === 2 && active) {
        ctx.clearRect(0, 0, 280, 280);

        if (activeBgColor) {
          ctx.fillStyle = activeBgColor;
          ctx.fillRect(0, 0, 280, 280);
        }

        ctx.drawImage(imgLower, 0, 0, 280, 280);
        ctx.drawImage(imgUpper, 0, 0, 280, 280);
        setIsRendering(false);
      }
    };

    imgUpper.onload = checkDraw;
    imgLower.onload = checkDraw;

    imgUpper.src = santaImgUrl;
    imgLower.src = lowerImgUrl;

    return () => {
      active = false;
    };
  }, [monkeId, activeBgColor]);

  const handleRandom = () => {
    const r = Math.floor(Math.random() * 10000) + 1;
    setMonkeId(r);
  };

  const handleDownload = (resolution: number = 560) => {
    const canvas = document.createElement('canvas');
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    if (canvasRef.current) {
      if (activeBgColor) {
        ctx.fillStyle = activeBgColor;
        ctx.fillRect(0, 0, resolution, resolution);
      }
      ctx.drawImage(canvasRef.current, 0, 0, resolution, resolution);
    }

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `nodemonke_santa_${monkeId}_${resolution}px.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Festive Confetti Burst
    confetti({
      particleCount: 85,
      spread: 65,
      origin: { y: 0.65 },
      colors: ['#E11D48', '#059669', '#F59E0B', '#FFFFFF'],
    });

    onToast(t.santaDownloadSuccess, `${t.santaDownloadSuccessDesc} (#${monkeId} • ${resolution}px)`, 'success');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-2 px-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-mono font-semibold shadow-sm">
          <Gift className="w-3.5 h-3.5" />
          <span>{t.santaBadge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {t.santaTitle}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-sans">
          {t.santaSub}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left: Preview Canvas */}
        <div className="lg:col-span-5 flex flex-col items-center gap-3.5 sm:gap-4">
          <div className="relative w-full aspect-square max-w-[420px] rounded-3xl glass-panel p-4 sm:p-6 flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden group">
            {bgMode === 'transparent' && (
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
            )}

            <canvas
              ref={canvasRef}
              width={280}
              height={280}
              className="w-full h-full object-contain pixelated relative z-10 filter drop-shadow-xl"
            />

            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-20 flex items-center gap-1.5 sm:gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[11px] sm:text-xs font-mono text-slate-300 shadow-md">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>{t.santaEdition}</span>
            </div>

            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20 text-xs font-mono text-slate-400 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              #{monkeId}
            </div>
          </div>

          <div className="w-full max-w-[420px] flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={10000}
              value={monkeId}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 10000) setMonkeId(v);
              }}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-white/10 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-rose-500/70 focus:ring-2 focus:ring-rose-500/20 shadow-inner"
              placeholder={t.santaSearchPlaceholder}
            />
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleRandom}
              className="px-4 py-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
            >
              <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{t.santaRandomBtn}</span>
            </motion.button>
          </div>

          {/* Direct Download Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDownload(exportRes)}
            disabled={isRendering}
            className="w-full max-w-[420px] flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-red-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-xl shadow-rose-500/25 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{t.santaDownloadBtn} {exportRes}px</span>
          </motion.button>
        </div>

        {/* Right: Studio Controls */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-6 glass-panel p-5 sm:p-6 rounded-3xl border border-white/[0.08] shadow-2xl">
          
          {/* Background Selection */}
          <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
              {t.santaBgTitle}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setBgMode('transparent')}
                className={clsx(
                  'p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1 sm:gap-1.5 transition-all',
                  bgMode === 'transparent'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-md'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                )}
              >
                <span className="text-base sm:text-lg">⛶</span>
                <span className="text-[11px] sm:text-xs truncate max-w-full">{t.santaBgNone}</span>
              </button>

              <button
                onClick={() => setBgMode('auto')}
                className={clsx(
                  'p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1 sm:gap-1.5 transition-all',
                  bgMode === 'auto'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-md'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                )}
              >
                <div className="w-5 h-5 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: autoBgColor }} />
                <span className="text-[11px] sm:text-xs truncate max-w-full">{t.santaBgAuto}</span>
              </button>

              <button
                onClick={() => setBgMode('custom')}
                className={clsx(
                  'p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1 sm:gap-1.5 transition-all',
                  bgMode === 'custom'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-md'
                    : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                )}
              >
                <Palette className="w-5 h-5 text-rose-400" />
                <span className="text-[11px] sm:text-xs truncate max-w-full">{t.santaBgCustom}</span>
              </button>
            </div>

            {bgMode === 'custom' && (
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 flex-wrap">
                  {SANTA_PRESETS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCustomColor(c)}
                      className={clsx(
                        'w-7 h-7 rounded-xl border transition-transform shadow-sm',
                        customColor === c ? 'scale-110 ring-2 ring-rose-400 border-white' : 'border-white/20'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-7 h-7 rounded-xl overflow-hidden cursor-pointer bg-transparent border border-white/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Resolution */}
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono uppercase tracking-wider">
              {t.santaResTitle}
            </h3>
            <div className="grid grid-cols-3 gap-2.5 font-mono">
              {[
                { label: t.santaResStd, res: 280 },
                { label: t.santaResHd, res: 560 },
                { label: t.santaRes4k, res: 1120 },
              ].map((item) => (
                <button
                  key={item.res}
                  onClick={() => setExportRes(item.res)}
                  className={clsx(
                    'p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1',
                    exportRes === item.res
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold shadow-md'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  <span className="text-[11px] sm:text-xs text-center font-bold">{item.label}</span>
                  <span className="text-[10px] text-slate-400">{item.res}×{item.res}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cross Studio Navigation Button */}
          <div className="pt-4 border-t border-white/[0.06]">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenInGif(monkeId)}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-semibold transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t.santaCrossGif}</span>
            </motion.button>
          </div>

        </div>

      </div>

    </div>
  );
};
