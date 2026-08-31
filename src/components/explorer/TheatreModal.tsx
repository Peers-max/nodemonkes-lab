import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Sparkles, 
  Gift, 
  Maximize, 
  Minimize,
  Wand2,
  Clock,
  Gauge,
  Sliders
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { useLanguage } from '../../utils/i18n';

export type EntranceFx = 
  | 'random' 
  | 'zoom' 
  | 'slide' 
  | 'flip3d' 
  | 'flip3dX' 
  | 'drop' 
  | 'launch' 
  | 'glitch' 
  | 'spin' 
  | 'cube' 
  | 'pulse' 
  | 'swing' 
  | 'matrix' 
  | 'fade';

interface TheatreModalProps {
  isOpen: boolean;
  monkes: Monke[];
  initialIndex?: number;
  onClose: () => void;
  onOpenInGif: (monkeId: number) => void;
  onOpenInSanta: (monkeId: number) => void;
  onOpenInPoster: (monkeId: number) => void;
}

const FX_LIST: { id: EntranceFx; icon: string }[] = [
  { id: 'random', icon: '🎲' },
  { id: 'zoom', icon: '🚀' },
  { id: 'slide', icon: '↔️' },
  { id: 'flip3d', icon: '🔄' },
  { id: 'flip3dX', icon: '🔃' },
  { id: 'drop', icon: '🪂' },
  { id: 'launch', icon: '🔥' },
  { id: 'glitch', icon: '⚡' },
  { id: 'spin', icon: '🌀' },
  { id: 'cube', icon: '🧊' },
  { id: 'pulse', icon: '💓' },
  { id: 'swing', icon: '🪢' },
  { id: 'matrix', icon: '👁️' },
  { id: 'fade', icon: '🫧' },
];

const SPEED_OPTIONS = [
  { label: '1.5s', val: 1500 },
  { label: '2.5s', val: 2500 },
  { label: '4.0s', val: 4000 },
  { label: '6.0s', val: 6000 },
];

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHud, setShowHud] = useState(true);
  
  // Transition FX & Speed State
  const [selectedFx, setSelectedFx] = useState<EntranceFx>('random');
  const [activeFx, setActiveFx] = useState<Exclude<EntranceFx, 'random'>>('zoom');
  const [direction, setDirection] = useState<number>(1);
  const [intervalSpeed, setIntervalSpeed] = useState<number>(2500);

  const timerRef = useRef<any>(null);

  // Pick random effect helper among 13 concrete effects
  const pickRandomFx = useCallback((): Exclude<EntranceFx, 'random'> => {
    const candidates: Exclude<EntranceFx, 'random'>[] = [
      'zoom', 'slide', 'flip3d', 'flip3dX', 'drop', 'launch', 
      'glitch', 'spin', 'cube', 'pulse', 'swing', 'matrix', 'fade'
    ];
    const idx = Math.floor(Math.random() * candidates.length);
    return candidates[idx];
  }, []);

  // Toggle Fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      const doc = document as any;
      const el = document.documentElement as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      if (!isFs) {
        const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (rfs) await rfs.call(el);
      } else {
        const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (efs) await efs.call(doc);
      }
    } catch (e) {
      console.warn('Fullscreen toggle notice:', e);
    }
  }, []);

  // Cleanup & Exit Handler
  const handleExit = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    try {
      const doc = document as any;
      const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      if (isFs) {
        const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (efs) efs.call(doc).catch(() => {});
      }
    } catch (e) {}
    onClose();
  }, [onClose]);

  // Handle Modal Open / Close Lifecycle
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(true);
      setShowHud(true);
      setActiveFx(selectedFx === 'random' ? pickRandomFx() : selectedFx);

      // Auto browser fullscreen
      try {
        const doc = document as any;
        const el = document.documentElement as any;
        const isFs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
        if (!isFs) {
          const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
          if (rfs) rfs.call(el).catch(() => {});
        }
      } catch (e) {
        console.warn('Fullscreen auto-request error:', e);
      }
    } else {
      setIsPlaying(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isOpen, initialIndex, selectedFx, pickRandomFx]);

  // Listen to browser fullscreen change
  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as any;
      const fs = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
      setIsFullscreen(fs);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
    };
  }, []);

  const handlePrev = useCallback(() => {
    if (!monkes.length) return;
    setDirection(-1);
    setActiveFx(selectedFx === 'random' ? pickRandomFx() : selectedFx);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : monkes.length - 1));
  }, [monkes.length, selectedFx, pickRandomFx]);

  const handleNext = useCallback(() => {
    if (!monkes.length) return;
    setDirection(1);
    setActiveFx(selectedFx === 'random' ? pickRandomFx() : selectedFx);
    setCurrentIndex((prev) => (prev < monkes.length - 1 ? prev + 1 : 0));
  }, [monkes.length, selectedFx, pickRandomFx]);

  // Autoplay Screensaver Timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isOpen && isPlaying && monkes.length > 1) {
      timerRef.current = setInterval(() => {
        handleNext();
      }, intervalSpeed);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, isPlaying, monkes.length, intervalSpeed, handleNext]);

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleExit();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleExit, handlePrev, handleNext]);

  // Auto-hide HUD on idle
  useEffect(() => {
    if (!isOpen) return;
    let hideTimer: any;
    const onMouseMove = () => {
      setShowHud(true);
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (isPlaying) setShowHud(false);
      }, 3000);
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      clearTimeout(hideTimer);
    };
  }, [isOpen, isPlaying]);

  if (!isOpen || !monkes.length) return null;

  const currentMonke = monkes[currentIndex] || monkes[0];
  const attrs = currentMonke.attributes;

  // 14 Entrance Animation Variants Generator
  const getVariants = () => {
    switch (activeFx) {
      case 'zoom': // 1. Warp Zoom
        return {
          initial: { scale: 0.15, opacity: 0, filter: 'blur(20px)' },
          animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
          exit: { scale: 1.3, opacity: 0, filter: 'blur(16px)' },
          transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
        };
      case 'slide': // 2. Cinema Slide
        return {
          initial: { x: direction * 380, opacity: 0, filter: 'blur(12px)' },
          animate: { x: 0, opacity: 1, filter: 'blur(0px)' },
          exit: { x: -direction * 380, opacity: 0, filter: 'blur(12px)' },
          transition: { type: 'spring' as const, stiffness: 230, damping: 24 },
        };
      case 'flip3d': // 3. Horizontal 3D Flip (Y)
        return {
          initial: { rotateY: 90, opacity: 0, scale: 0.7 },
          animate: { rotateY: 0, opacity: 1, scale: 1 },
          exit: { rotateY: -90, opacity: 0, scale: 0.7 },
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
        };
      case 'flip3dX': // 4. Vertical 3D Flip (X)
        return {
          initial: { rotateX: 90, opacity: 0, scale: 0.75 },
          animate: { rotateX: 0, opacity: 1, scale: 1 },
          exit: { rotateX: -90, opacity: 0, scale: 0.75 },
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
        };
      case 'drop': // 5. Orbit Drop & Spring Bounce
        return {
          initial: { y: -360, opacity: 0, scale: 0.8 },
          animate: { y: 0, opacity: 1, scale: 1 },
          exit: { y: 220, opacity: 0, scale: 0.8 },
          transition: { type: 'spring' as const, stiffness: 280, damping: 18 },
        };
      case 'launch': // 6. Rocket Launch from bottom
        return {
          initial: { y: 360, opacity: 0, scale: 0.85 },
          animate: { y: 0, opacity: 1, scale: 1 },
          exit: { y: -260, opacity: 0, scale: 0.85 },
          transition: { type: 'spring' as const, stiffness: 270, damping: 22 },
        };
      case 'glitch': // 7. Cyber Matrix Glitch
        return {
          initial: { x: -40, opacity: 0, scale: 1.15, filter: 'hue-rotate(90deg) contrast(1.6) blur(6px)' },
          animate: { x: 0, opacity: 1, scale: 1, filter: 'hue-rotate(0deg) contrast(1) blur(0px)' },
          exit: { x: 40, opacity: 0, scale: 0.9, filter: 'hue-rotate(-90deg) blur(6px)' },
          transition: { duration: 0.35, ease: 'easeOut' as const },
        };
      case 'spin': // 8. Vortex Swirl Spin
        return {
          initial: { rotate: 180, scale: 0.15, opacity: 0, filter: 'blur(16px)' },
          animate: { rotate: 0, scale: 1, opacity: 1, filter: 'blur(0px)' },
          exit: { rotate: -180, scale: 0.15, opacity: 0, filter: 'blur(16px)' },
          transition: { type: 'spring' as const, stiffness: 220, damping: 22 },
        };
      case 'cube': // 9. 3D Cube Isometric Slide
        return {
          initial: { x: direction * 280, rotateY: direction * 45, opacity: 0, scale: 0.75 },
          animate: { x: 0, rotateY: 0, opacity: 1, scale: 1 },
          exit: { x: -direction * 280, rotateY: -direction * 45, opacity: 0, scale: 0.75 },
          transition: { duration: 0.48, ease: 'easeOut' as const },
        };
      case 'pulse': // 10. Energy Pulse Heartbeat
        return {
          initial: { scale: 0.4, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1.4, opacity: 0 },
          transition: { type: 'spring' as const, stiffness: 350, damping: 15 },
        };
      case 'swing': // 11. Pendulum Clock Swing
        return {
          initial: { rotate: -40, opacity: 0, scale: 0.8 },
          animate: { rotate: 0, opacity: 1, scale: 1 },
          exit: { rotate: 40, opacity: 0, scale: 0.8 },
          transition: { type: 'spring' as const, stiffness: 240, damping: 16 },
        };
      case 'matrix': // 12. Matrix Hologram Scan
        return {
          initial: { scaleY: 0.05, opacity: 0, filter: 'brightness(2.2) blur(8px)' },
          animate: { scaleY: 1, opacity: 1, filter: 'brightness(1) blur(0px)' },
          exit: { scaleY: 0.05, opacity: 0, filter: 'brightness(2.2) blur(8px)' },
          transition: { duration: 0.42, ease: [0.16, 1, 0.3, 1] as const },
        };
      case 'fade': // 13. Ambient Breathe Fade
      default:
        return {
          initial: { opacity: 0, scale: 0.94 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 1.06 },
          transition: { duration: 0.45, ease: 'easeInOut' as const },
        };
    }
  };

  const anim = getVariants();

  const getFxLabel = (id: EntranceFx) => {
    switch (id) {
      case 'random': return t.theatreFxRandom;
      case 'zoom': return t.theatreFxZoom;
      case 'slide': return t.theatreFxSlide;
      case 'flip3d': return t.theatreFxFlip3d;
      case 'flip3dX': return t.theatreFxFlip3dX;
      case 'drop': return t.theatreFxDrop;
      case 'launch': return t.theatreFxLaunch;
      case 'glitch': return t.theatreFxGlitch;
      case 'spin': return t.theatreFxSpin;
      case 'cube': return t.theatreFxCube;
      case 'pulse': return t.theatreFxPulse;
      case 'swing': return t.theatreFxSwing;
      case 'matrix': return t.theatreFxMatrix;
      case 'fade': return t.theatreFxFade;
    }
  };

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[999999] w-screen h-screen bg-[#030508] flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden m-0"
      >
        {/* Top Floating HUD (Auto fades when idle) */}
        <motion.div
          animate={{ opacity: showHud ? 1 : 0, y: showHud ? 0 : -20 }}
          transition={{ duration: 0.3 }}
          className={`flex flex-col xl:flex-row items-center justify-between gap-3 z-30 w-full ${!showHud ? 'pointer-events-none' : ''}`}
        >
          {/* Left Title & Status */}
          <div className="flex items-center gap-3 bg-black/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
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
                {isPlaying ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{t.screensaverActive}</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    {t.screensaverPaused}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                Inscription #{currentMonke.inscription} • Block #{currentMonke.block}
              </span>
            </div>
          </div>

          {/* Center: 14 Entrance Animation Effects Selector */}
          <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-xl p-1.5 px-3 rounded-2xl border border-white/10 shadow-2xl overflow-x-auto max-w-full">
            <span className="text-[11px] font-mono font-bold text-amber-400/90 whitespace-nowrap flex items-center gap-1 mr-1">
              <Wand2 className="w-3.5 h-3.5" />
              <span>{t.theatreFxTitle}:</span>
            </span>

            <div className="flex items-center gap-1">
              {FX_LIST.map((fx) => (
                <button
                  key={fx.id}
                  onClick={() => {
                    setSelectedFx(fx.id);
                    setActiveFx(fx.id === 'random' ? pickRandomFx() : fx.id);
                  }}
                  className={clsx(
                    'px-2.5 py-1 rounded-xl text-xs font-mono font-semibold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1',
                    selectedFx === fx.id
                      ? 'bg-amber-500/25 border border-amber-400 text-amber-300 font-bold shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
                  )}
                  title={getFxLabel(fx.id)}
                >
                  <span>{fx.icon}</span>
                  <span className="hidden 2xl:inline text-[11px]">{getFxLabel(fx.id).split(' ')[1] || getFxLabel(fx.id)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Controls with Dedicated Speed Selector */}
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl p-1.5 px-2.5 rounded-2xl border border-white/10 shadow-2xl">
            
            {/* Dedicated Speed Selector Group */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              <Clock className="w-3.5 h-3.5 text-purple-400 ml-1" />
              {SPEED_OPTIONS.map((sp) => (
                <button
                  key={sp.val}
                  onClick={() => setIntervalSpeed(sp.val)}
                  className={clsx(
                    'px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all',
                    intervalSpeed === sp.val
                      ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            <div className="w-[1px] h-4 bg-white/15" />

            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition-all active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-amber-400" />}
              <span className="hidden sm:inline">{isPlaying ? t.screensaverPause : t.screensaverPlay}</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95"
              title="F11"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Exit Screensaver */}
            <button
              onClick={handleExit}
              className="p-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white border border-rose-500/30 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-mono font-bold"
              title="ESC"
            >
              <X className="w-4 h-4" />
              <span>{t.screensaverExit}</span>
            </button>
          </div>
        </motion.div>

        {/* Center Stage: Magnificent Huge Pixel Art Monke with 14 Dynamic Entrance Animations */}
        <div className="relative flex-1 flex items-center justify-center my-auto w-full h-full perspective-[1200px]">
          
          {/* Ambient Pulsing Aura */}
          <div className="absolute w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-purple-500/10 rounded-full blur-[170px] pointer-events-none animate-pulse" />

          {/* Left Arrow Button */}
          <motion.button
            animate={{ opacity: showHud ? 1 : 0 }}
            onClick={handlePrev}
            className={`absolute left-4 sm:left-10 z-30 p-4 rounded-3xl bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-white/10 backdrop-blur-xl transition-all active:scale-90 shadow-2xl ${!showHud ? 'pointer-events-none' : ''}`}
            title={t.theatrePrev}
          >
            <ChevronLeft className="w-8 h-8" />
          </motion.button>

          {/* Monke Image Stage with Rich Dynamic Entrance Animations */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMonke.id}
                initial={anim.initial}
                animate={anim.animate}
                exit={anim.exit}
                transition={anim.transition}
                className="w-[min(90vw,86vh)] h-[min(90vw,86vh)] max-w-[1200px] max-h-[1200px] flex items-center justify-center p-0 select-none transform-gpu origin-center"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <img
                  src={getMonkeImageUrl(currentMonke.id)}
                  alt={`NodeMonke #${currentMonke.id}`}
                  className="w-full h-full object-contain pixelated filter drop-shadow-[0_20px_60px_rgba(0,0,0,0.95)]"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Arrow Button */}
          <motion.button
            animate={{ opacity: showHud ? 1 : 0 }}
            onClick={handleNext}
            className={`absolute right-4 sm:right-10 z-30 p-4 rounded-3xl bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-white/10 backdrop-blur-xl transition-all active:scale-90 shadow-2xl ${!showHud ? 'pointer-events-none' : ''}`}
            title={t.theatreNext}
          >
            <ChevronRight className="w-8 h-8" />
          </motion.button>
        </div>

        {/* Bottom HUD Bar: Traits & Quick Links (Auto fades when idle) */}
        <motion.div
          animate={{ opacity: showHud ? 1 : 0, y: showHud ? 0 : 20 }}
          transition={{ duration: 0.3 }}
          className={`flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-950/85 border border-white/10 backdrop-blur-2xl z-30 w-full shadow-2xl ${!showHud ? 'pointer-events-none' : ''}`}
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

  return createPortal(content, document.body);
};
