import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Sparkles, Shuffle, RefreshCw, Layout, Palette, Type } from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { useLanguage } from '../../utils/i18n';

interface PosterStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

type PosterLayout = 'banner' | 'wallpaper' | 'square' | 'cinema';
type MonkeMode = 'single' | 'duo' | 'squad';
type AuraTheme = 'btc' | 'cyber' | 'dark' | 'emerald' | 'minimal';

const FORMAT_CONFIG: Record<PosterLayout, { w: number; h: number; name: string }> = {
  banner: { w: 1500, h: 500, name: 'Twitter Banner (3:1)' },
  wallpaper: { w: 1080, h: 1920, name: 'Phone Wallpaper (9:16)' },
  square: { w: 1200, h: 1200, name: 'Square Art (1:1)' },
  cinema: { w: 1920, h: 1080, name: 'Cinema 4K (16:9)' },
};

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src.includes('?') ? `${src}&t=${Date.now()}` : `${src}?t=${Date.now()}`;
  });
}

export const PosterStudio: React.FC<PosterStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  onToast,
}) => {
  const { lang, t } = useLanguage();
  const [layout, setLayout] = useState<PosterLayout>('banner');
  const [monkeMode, setMonkeMode] = useState<MonkeMode>('squad');
  const [monkeIds, setMonkeIds] = useState<number[]>([209, 7277, 3361, 4143, 8812]);
  const [headline, setHeadline] = useState('WE ARE NODEMONKES');
  const [subheadline, setSubheadline] = useState('BITCOIN ORDINALS • 10,000 SACRED INSCRIPTIONS');
  const [theme, setTheme] = useState<AuraTheme>('btc');
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync initial monke
  useEffect(() => {
    if (initialMonkeId && !monkeIds.includes(initialMonkeId)) {
      setMonkeIds((prev) => [initialMonkeId, ...prev.slice(0, 4)]);
    }
  }, [initialMonkeId]);

  const handleRandomizeMonkes = () => {
    const randoms: number[] = [];
    while (randoms.length < 5) {
      const r = Math.floor(Math.random() * 10000) + 1;
      if (!randoms.includes(r)) randoms.push(r);
    }
    setMonkeIds(randoms);
  };

  const handleIdChange = (idx: number, val: number) => {
    if (isNaN(val) || val < 1 || val > 10000) return;
    setMonkeIds((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  // Canvas Render Loop
  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = FORMAT_CONFIG[layout];
    canvas.width = w;
    canvas.height = h;

    const drawPoster = async () => {
      // 1. Draw Background
      ctx.clearRect(0, 0, w, h);

      if (theme === 'btc') {
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#0C0A09');
        bgGrad.addColorStop(0.5, '#1C1307');
        bgGrad.addColorStop(1, '#080604');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const radial = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) * 0.6);
        radial.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
        radial.addColorStop(0.5, 'rgba(234, 88, 12, 0.10)');
        radial.addColorStop(1, 'transparent');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, w, h);
      } else if (theme === 'cyber') {
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#090916');
        bgGrad.addColorStop(1, '#05050A');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const rad1 = ctx.createRadialGradient(w * 0.2, h * 0.3, 20, w * 0.2, h * 0.3, w * 0.5);
        rad1.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
        rad1.addColorStop(1, 'transparent');
        ctx.fillStyle = rad1;
        ctx.fillRect(0, 0, w, h);

        const rad2 = ctx.createRadialGradient(w * 0.8, h * 0.7, 20, w * 0.8, h * 0.7, w * 0.5);
        rad2.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
        rad2.addColorStop(1, 'transparent');
        ctx.fillStyle = rad2;
        ctx.fillRect(0, 0, w, h);
      } else if (theme === 'emerald') {
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#04130C');
        bgGrad.addColorStop(1, '#020A06');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        const rad = ctx.createRadialGradient(w / 2, h * 0.4, 50, w / 2, h * 0.4, w * 0.5);
        rad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
        rad.addColorStop(1, 'transparent');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, w, h);
      } else if (theme === 'minimal') {
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#141822');
        bgGrad.addColorStop(1, '#080A0E');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = '#06080D';
        ctx.fillRect(0, 0, w, h);
      }

      // Draw Subtle Grid Dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      const step = 32;
      for (let x = 0; x < w; x += step) {
        for (let y = 0; y < h; y += step) {
          ctx.fillRect(x, y, 2, 2);
        }
      }

      // 2. Determine Monkes to draw based on MonkeMode
      let activeIds = [monkeIds[0]];
      if (monkeMode === 'duo') activeIds = [monkeIds[0], monkeIds[1]];
      if (monkeMode === 'squad') activeIds = monkeIds.slice(0, 5);

      try {
        const loadedImgs = await Promise.all(activeIds.map((id) => loadImg(getMonkeImageUrl(id))));
        if (!active) return;

        ctx.imageSmoothingEnabled = false;

        // Helper function to draw images in REVERSE order (from Right to Left)
        // so the leftmost monke is drawn LAST (on TOP, overlapping to the right - PEER style)
        const drawSquadReversed = (positions: { img: HTMLImageElement; x: number; y: number; size: number }[]) => {
          for (let i = positions.length - 1; i >= 0; i--) {
            const p = positions[i];
            ctx.drawImage(p.img, p.x, p.y, p.size, p.size);
          }
        };

        // 3. Render Monkes based on Layout with enlarged sizes and left-on-top overlapping
        if (layout === 'banner') {
          // Twitter Banner 3:1 (1500 x 500) - Enlarged and bold
          const imgSize = 390;
          const startY = (h - imgSize) / 2 + 10;

          if (activeIds.length === 1) {
            ctx.drawImage(loadedImgs[0], w * 0.68, startY, imgSize, imgSize);
          } else if (activeIds.length === 2) {
            const pos = [
              { img: loadedImgs[0], x: w * 0.55, y: startY, size: imgSize },
              { img: loadedImgs[1], x: w * 0.74, y: startY, size: imgSize },
            ];
            drawSquadReversed(pos);
          } else {
            // 5-Monke Squad with Left-Over-Right overlap
            const spacing = 135;
            const startX = w * 0.44;
            const pos = loadedImgs.map((img, idx) => ({
              img,
              x: startX + idx * spacing,
              y: startY,
              size: imgSize,
            }));
            drawSquadReversed(pos);
          }

          // Typography Left-Aligned with grand contrast
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText(headline, 80, h / 2 - 14);

          ctx.fillStyle = theme === 'btc' ? '#F59E0B' : theme === 'emerald' ? '#10B981' : theme === 'cyber' ? '#C084FC' : '#94A3B8';
          ctx.font = '700 20px ui-monospace, SFMono-Regular, Menlo, Monaco, monospace';
          ctx.fillText(subheadline, 80, h / 2 + 36);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '600 14px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText('NODE MONKES • BITCOIN LAYER 1', 80, h / 2 + 78);
        } else if (layout === 'wallpaper') {
          // Phone Wallpaper 9:16 (1080 x 1920) - Grand scale
          const imgSize = activeIds.length === 1 ? 680 : 540;
          const centerY = h * 0.44;

          if (activeIds.length === 1) {
            ctx.drawImage(loadedImgs[0], (w - imgSize) / 2, centerY - imgSize / 2, imgSize, imgSize);
          } else if (activeIds.length === 2) {
            const pos = [
              { img: loadedImgs[0], x: w * 0.18, y: centerY - imgSize / 2, size: imgSize },
              { img: loadedImgs[1], x: w * 0.46, y: centerY - imgSize / 2 + 30, size: imgSize },
            ];
            drawSquadReversed(pos);
          } else {
            const spacing = 140;
            const startX = (w - (activeIds.length * spacing + (imgSize - spacing))) / 2;
            const pos = loadedImgs.map((img, idx) => ({
              img,
              x: startX + idx * spacing,
              y: centerY - imgSize / 2 + (idx % 2 === 1 ? 40 : -20),
              size: imgSize,
            }));
            drawSquadReversed(pos);
          }

          // Typography
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 64px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(headline, w / 2, h * 0.76);

          ctx.fillStyle = theme === 'btc' ? '#F59E0B' : '#94A3B8';
          ctx.font = '700 24px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText(subheadline, w / 2, h * 0.81);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.font = '600 17px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText('ORDINALS INSCRIPTION ART • 2026', w / 2, h * 0.86);
          ctx.textAlign = 'start';
        } else if (layout === 'cinema') {
          // Cinema 16:9 (1920 x 1080) - Cinematic widescreen scale
          const imgSize = activeIds.length === 1 ? 620 : 540;
          const centerY = h * 0.42;

          if (activeIds.length === 1) {
            ctx.drawImage(loadedImgs[0], (w - imgSize) / 2, centerY - imgSize / 2, imgSize, imgSize);
          } else if (activeIds.length === 2) {
            const pos = [
              { img: loadedImgs[0], x: w * 0.32 - imgSize / 2, y: centerY - imgSize / 2, size: imgSize },
              { img: loadedImgs[1], x: w * 0.68 - imgSize / 2, y: centerY - imgSize / 2, size: imgSize },
            ];
            drawSquadReversed(pos);
          } else {
            const spacing = 190;
            const startX = (w - (activeIds.length * spacing + (imgSize - spacing))) / 2;
            const pos = loadedImgs.map((img, idx) => ({
              img,
              x: startX + idx * spacing,
              y: centerY - imgSize / 2,
              size: imgSize,
            }));
            drawSquadReversed(pos);
          }

          // Typography Centered at Bottom
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 58px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(headline, w / 2, h * 0.82);

          ctx.fillStyle = theme === 'btc' ? '#F59E0B' : '#94A3B8';
          ctx.font = '700 22px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText(subheadline, w / 2, h * 0.88);
          ctx.textAlign = 'start';
        } else {
          // Square 1:1 (1200 x 1200) - Maximum visual impact
          const imgSize = activeIds.length === 1 ? 680 : 520;
          const centerY = h * 0.42;

          if (activeIds.length === 1) {
            ctx.drawImage(loadedImgs[0], (w - imgSize) / 2, centerY - imgSize / 2, imgSize, imgSize);
          } else if (activeIds.length === 2) {
            const pos = [
              { img: loadedImgs[0], x: w * 0.28 - imgSize / 2, y: centerY - imgSize / 2, size: imgSize },
              { img: loadedImgs[1], x: w * 0.72 - imgSize / 2, y: centerY - imgSize / 2, size: imgSize },
            ];
            drawSquadReversed(pos);
          } else {
            const spacing = 135;
            const startX = (w - (activeIds.length * spacing + (imgSize - spacing))) / 2;
            const pos = loadedImgs.map((img, idx) => ({
              img,
              x: startX + idx * spacing,
              y: centerY - imgSize / 2,
              size: imgSize,
            }));
            drawSquadReversed(pos);
          }

          // Typography Centered at Bottom
          ctx.textAlign = 'center';
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 54px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(headline, w / 2, h * 0.82);

          ctx.fillStyle = theme === 'btc' ? '#F59E0B' : '#94A3B8';
          ctx.font = '700 21px ui-monospace, SFMono-Regular, monospace';
          ctx.fillText(subheadline, w / 2, h * 0.88);
          ctx.textAlign = 'start';
        }
      } catch (e) {
        console.error('Error drawing poster:', e);
      }
    };

    drawPoster();

    return () => {
      active = false;
    };
  }, [layout, monkeMode, monkeIds, headline, subheadline, theme]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting) return;
    setIsExporting(true);

    try {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Export error');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `nodemonkes_poster_${layout}_${theme}_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#8B5CF6', '#10B981', '#38BDF8'],
        });

        onToast(t.posterSuccess, t.posterSuccessDesc, 'success');
        setIsExporting(false);
      }, 'image/png');
    } catch (err: any) {
      console.error('Export error:', err);
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2 px-2">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-400 text-xs font-mono font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{t.posterBadge}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          {t.posterTitle}
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-sans">
          {t.posterSub}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Live Poster Preview */}
        <div className="lg:col-span-7 flex flex-col items-center gap-4">
          <div className="w-full glass-panel p-4 rounded-3xl border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-[520px] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          </div>

          {/* Export Action Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 hover:brightness-110 text-white font-extrabold text-sm shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{isExporting ? t.posterExporting : `${t.posterExportBtn} (${FORMAT_CONFIG[layout].name})`}</span>
          </motion.button>
        </div>

        {/* Right: Studio Controls Panel */}
        <div className="lg:col-span-5 space-y-4 glass-panel p-5 rounded-3xl border border-white/[0.08] shadow-2xl">
          
          {/* 1. Format / Layout Switcher */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.posterLayoutTitle}</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'banner' as PosterLayout, label: t.posterBanner },
                { id: 'wallpaper' as PosterLayout, label: t.posterWallpaper },
                { id: 'square' as PosterLayout, label: t.posterSquare },
                { id: 'cinema' as PosterLayout, label: t.posterCinema },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setLayout(f.id)}
                  className={clsx(
                    'py-2 px-3 rounded-2xl border text-xs font-semibold transition-all text-center',
                    layout === f.id
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Monke Squad Mode */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block">
              猴子组合模式 (Monke Layout)
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'single' as MonkeMode, label: t.posterSingle },
                { id: 'duo' as MonkeMode, label: t.posterDuo },
                { id: 'squad' as MonkeMode, label: t.posterSquad },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMonkeMode(m.id)}
                  className={clsx(
                    'py-2 px-2 rounded-2xl border text-xs font-semibold transition-all text-center',
                    monkeMode === m.id
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Monke IDs Input & Random Button */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
                {t.posterMonkeIds}
              </span>
              <button
                onClick={handleRandomizeMonkes}
                className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Shuffle className="w-3 h-3" />
                <span>随机</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(monkeMode === 'single' ? [0] : monkeMode === 'duo' ? [0, 1] : [0, 1, 2, 3, 4]).map((idx) => (
                <div key={idx} className="flex-1 min-w-[60px]">
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={monkeIds[idx] || 209}
                    onChange={(e) => handleIdChange(idx, parseInt(e.target.value, 10))}
                    className="w-full px-2 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 text-center text-xs font-mono text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 3. Typography Texts */}
          <div className="space-y-2.5 pt-3 border-t border-white/[0.06]">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-purple-400" />
              <span>文案排版 (Typography)</span>
            </span>

            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">{t.posterHeadline}</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-xs font-semibold text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">{t.posterSubheadline}</label>
              <input
                type="text"
                value={subheadline}
                onChange={(e) => setSubheadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/70 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* 4. Aura Theme */}
          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
            <span className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider block flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>{t.posterThemeTitle}</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'btc' as AuraTheme, label: t.posterThemeBtc },
                { id: 'cyber' as AuraTheme, label: t.posterThemeCyber },
                { id: 'emerald' as AuraTheme, label: t.posterThemeEmerald },
                { id: 'dark' as AuraTheme, label: t.posterThemeDark },
                { id: 'minimal' as AuraTheme, label: t.posterThemeMinimal },
              ].map((th) => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={clsx(
                    'py-2 px-2.5 rounded-2xl border text-xs font-medium transition-all text-center',
                    theme === th.id
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold shadow-sm'
                      : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-white'
                  )}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
