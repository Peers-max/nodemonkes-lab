import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Pause, Sparkles, Gift, ExternalLink } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(false);
    }
  }, [isOpen, initialIndex]);

  const currentMonke = monkes[currentIndex] || monkes[0];

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : monkes.length - 1));
  }, [monkes.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < monkes.length - 1 ? prev + 1 : 0));
  }, [monkes.length]);

  // Autoplay Timer
  useEffect(() => {
    if (!isPlaying || !isOpen) return;
    const timer = setInterval(() => {
      handleNext();
    }, 2200);
    return () => clearInterval(timer);
  }, [isPlaying, isOpen, handleNext]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentMonke) return null;

  const attrs = currentMonke.attributes;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden select-none"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono text-xs font-bold shadow-lg">
              🎬
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white font-mono flex items-center gap-2">
                <span>NodeMonke #{currentMonke.id}</span>
                {currentMonke.rank && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Rank #{currentMonke.rank}
                  </span>
                )}
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                Inscription #{currentMonke.inscription} • Block #{currentMonke.block}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isPlaying ? t.theatrePause : t.theatreAutoPlay}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/30 text-white hover:text-rose-300 transition-colors"
              title={t.theatreClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Stage: Monke Display with Cinematic Ambient Halo */}
        <div className="relative flex-1 flex items-center justify-center my-4">
          
          {/* Ambient Glow */}
          <div className="absolute w-[360px] sm:w-[520px] h-[360px] sm:h-[520px] bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />

          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-6 z-30 p-3.5 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-95 shadow-xl"
            title={t.theatrePrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Monke Image Stage */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <motion.div
              key={currentMonke.id}
              initial={{ opacity: 0, scale: 0.88, filter: 'blur(6px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.88, filter: 'blur(6px)' }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="w-[220px] h-[220px] sm:w-[320px] sm:h-[320px] md:w-[380px] md:h-[380px] rounded-3xl bg-black/60 border border-white/10 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center"
            >
              <img
                src={getMonkeImageUrl(currentMonke.id)}
                alt={`NodeMonke #${currentMonke.id}`}
                className="w-full h-full object-contain pixelated filter drop-shadow-2xl"
              />
            </motion.div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-6 z-30 p-3.5 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 backdrop-blur-md transition-all active:scale-95 shadow-xl"
            title={t.theatreNext}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Bar: Traits & Fast Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/80 border border-white/10 backdrop-blur-xl z-20">
          {/* Traits Chips */}
          <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10">
              Body: <strong className="text-white">{attrs.Body}</strong>
            </span>
            {attrs.Head && attrs.Head !== 'None' && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Head: <strong className="text-white">{attrs.Head}</strong>
              </span>
            )}
            {attrs.Eyes && attrs.Eyes !== 'None' && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Eyes: <strong className="text-white">{attrs.Eyes}</strong>
              </span>
            )}
            {attrs.Earring && attrs.Earring !== 'None' && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Earring: <strong className="text-white">{attrs.Earring}</strong>
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onOpenInGif(currentMonke.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.actionMakeGif}</span>
            </button>

            <button
              onClick={() => {
                onOpenInSanta(currentMonke.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-sm"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>{t.actionSanta}</span>
            </button>

            <button
              onClick={() => {
                onOpenInPoster(currentMonke.id);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all shadow-sm"
            >
              <span>🖼️</span>
              <span>{t.tabPoster}</span>
            </button>
          </div>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};
