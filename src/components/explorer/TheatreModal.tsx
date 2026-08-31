import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Pause, Sparkles, Gift, Maximize2, Minimize2 } from 'lucide-react';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { useLanguage } from '../../utils/i18n';

interface TheatreModalProps {
  isOpen: boolean;
  monkes: Monke[];
  initialIndex?: number;
  onClose: () => void;
  onOpenInGif: (monkeId: number) => void;
  onOpenInSanta: (monkeId: number) => void;
  onOpenInPoster: (monkeId: number) => void;
}

export const TheatreModal: React.FC<TheatreModalProps> = ({
  isOpen,
  monkes,
  initialIndex = 0,
  onClose,
  onOpenInGif,
  onOpenInSanta,
  onOpenInPoster,
}) => {
  const { lang, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true); // Default to screensaver autoplay!
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHud, setShowHud] = useState(true);

  // Fullscreen Entry & Exit
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(true);
      setShowHud(true);

      // Attempt native browser fullscreen
      try {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {
        console.warn('Fullscreen request bypassed:', e);
      }
    }
  }, [isOpen, initialIndex]);

  const handleExit = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [onClose]);

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const currentMonke = monkes[currentIndex] || monkes[0];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : monkes.length - 1));
  }, [monkes.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < monkes.length - 1 ? prev + 1 : 0));
  }, [monkes.length]);

  // Autoplay Screensaver Timer (every 2.5 seconds switch to next monke)
  useEffect(() => {
    if (!isPlaying || !isOpen) return;
    const timer = setInterval(() => {
      handleNext();
    }, 2500);
    return () => clearInterval(timer);
  }, [isPlaying, isOpen, handleNext]);

  // Keyboard Shortcuts (ESC, F11, Space, Left, Right)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleExit();
      }
      if (e.key === 'F11') {
        e.preventDefault();
        handleExit();
      }
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
      if (e.key === 'ArrowRight') {
        handleNext();
      }
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleExit, handlePrev, handleNext]);

  // Hide HUD on idle
  useEffect(() => {
    if (!isOpen) return;
    let timer: any;
    const onMouseMove = () => {
      setShowHud(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isPlaying) setShowHud(false);
      }, 3500);
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(timer);
    };
  }, [isOpen, isPlaying]);

  if (!isOpen || !currentMonke) return null;

  const attrs = currentMonke.attributes;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#05070B] flex flex-col justify-between p-4 sm:p-8 overflow-hidden select-none"
      >
        {/* Top Screensaver Banner Notice & Controls HUD */}
        <motion.div
          animate={{ opacity: showHud ? 1 : 0, y: showHud ? 0 : -20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 z-30 w-full"
        >
          {/* Left Title & Screensaver Status */}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono text-sm font-bold shadow-lg">
              📺
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold text-white font-mono">
                  NodeMonke #{currentMonke.id}
                </span>
                {currentMonke.rank && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Rank #{currentMonke.rank}
                  </span>
                )}
                {isPlaying && (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>自动屏保中</span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                Inscription #{currentMonke.inscription} • Block #{currentMonke.block}
              </span>
            </div>
          </div>

          {/* Center Hint Prompt Badge */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-300/90 text-xs font-mono shadow-lg">
            <span>💡 提示：按 <strong>ESC</strong> 或 <strong>F11</strong> 退出屏保 • <strong>空格键</strong> 暂停/播放 • <strong>← / →</strong> 切猴</span>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-amber-400" />}
              <span>{isPlaying ? '暂停屏保' : '启动屏保'}</span>
            </button>

            <button
              onClick={handleExit}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/30 transition-all active:scale-95 flex items-center gap-1 text-xs font-mono font-bold"
              title="退出全屏屏保 (ESC / F11)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">退出 (ESC)</span>
            </button>
          </div>
        </motion.div>

        {/* Center Stage: Huge Pixel Art Monke with Ambient Pulsing Aura */}
        <div className="relative flex-1 flex items-center justify-center my-2 sm:my-4">
          
          {/* Ambient Glow Aura */}
          <div className="absolute w-[420px] sm:w-[680px] h-[420px] sm:h-[680px] bg-gradient-to-tr from-amber-500/15 via-orange-500/10 to-rose-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />

          {/* Left Arrow Button */}
          <motion.button
            animate={{ opacity: showHud ? 1 : 0.2 }}
            onClick={handlePrev}
            className="absolute left-2 sm:left-8 z-30 p-4 rounded-2xl bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white border border-white/10 backdrop-blur-xl transition-all active:scale-90 shadow-2xl"
            title={t.theatrePrev}
          >
            <ChevronLeft className="w-7 h-7" />
          </motion.button>

          {/* Monke Image Stage */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <motion.div
              key={currentMonke.id}
              initial={{ opacity: 0, scale: 0.90, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.90, filter: 'blur(8px)' }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-[280px] h-[280px] sm:w-[420px] sm:h-[420px] md:w-[500px] md:h-[500px] lg:w-[560px] lg:h-[560px] rounded-3xl bg-black/40 border border-white/10 p-4 sm:p-6 shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex items-center justify-center backdrop-blur-md"
            >
              <img
                src={getMonkeImageUrl(currentMonke.id)}
                alt={`NodeMonke #${currentMonke.id}`}
                className="w-full h-full object-contain pixelated filter drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
              />
            </motion.div>
          </div>

          {/* Right Arrow Button */}
          <motion.button
            animate={{ opacity: showHud ? 1 : 0.2 }}
            onClick={handleNext}
            className="absolute right-2 sm:right-8 z-30 p-4 rounded-2xl bg-black/50 hover:bg-black/80 text-slate-300 hover:text-white border border-white/10 backdrop-blur-xl transition-all active:scale-90 shadow-2xl"
            title={t.theatreNext}
          >
            <ChevronRight className="w-7 h-7" />
          </motion.button>
        </div>

        {/* Bottom HUD Bar: Traits & Quick Links */}
        <motion.div
          animate={{ opacity: showHud ? 1 : 0, y: showHud ? 0 : 20 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-2xl z-30 w-full shadow-2xl"
        >
          {/* Traits Chips */}
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <span className="px-3 py-1 rounded-xl bg-white/5 text-slate-300 border border-white/10">
              Body: <strong className="text-white">{attrs.Body}</strong>
            </span>
            {attrs.Head && attrs.Head !== 'None' && (
              <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Head: <strong className="text-white">{attrs.Head}</strong>
              </span>
            )}
            {attrs.Eyes && attrs.Eyes !== 'None' && (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Eyes: <strong className="text-white">{attrs.Eyes}</strong>
              </span>
            )}
            {attrs.Earring && attrs.Earring !== 'None' && (
              <span className="px-3 py-1 rounded-xl bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Earring: <strong className="text-white">{attrs.Earring}</strong>
              </span>
            )}
          </div>

          {/* Quick Studio Open Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onOpenInGif(currentMonke.id);
                handleExit();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.actionMakeGif}</span>
            </button>

            <button
              onClick={() => {
                onOpenInSanta(currentMonke.id);
                handleExit();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{t.actionSanta}</span>
            </button>

            <button
              onClick={() => {
                onOpenInPoster(currentMonke.id);
                handleExit();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              <span>🖼️</span>
              <span>{t.tabPoster}</span>
            </button>
          </div>
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
};
