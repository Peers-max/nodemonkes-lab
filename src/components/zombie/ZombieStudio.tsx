// src/components/zombie/ZombieStudio.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  RotateCcw, 
  Trophy, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Users, 
  Zap, 
  Flame, 
  Crosshair,
  Search,
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import type { GameStats, WeaponType } from './types';
import { ZombieEngine, WEAPON_CONFIGS } from './ZombieEngine';
import { ZombieAudio } from './ZombieAudio';
import { useLanguage } from '../../utils/i18n';
import confetti from 'canvas-confetti';

interface ZombieStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

export const ZombieStudio: React.FC<ZombieStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  onToast,
}) => {
  const { lang } = useLanguage();
  const isZh = lang === 'zh';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ZombieEngine | null>(null);
  const audioRef = useRef<ZombieAudio>(new ZombieAudio());

  // Game UI state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [monkeId, setMonkeId] = useState<number>(initialMonkeId);
  const [monkeInput, setMonkeInput] = useState<string>(String(initialMonkeId));

  // Live HUD metrics
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    zombiesKilled: 0,
    wave: 1,
    maxCrowd: 3,
    gatesPassed: 0,
  });
  const [crowdCount, setCrowdCount] = useState<number>(3);
  const [weapon, setWeapon] = useState<WeaponType>('pistol');
  const [weaponTimeLeft, setWeaponTimeLeft] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('monke_zombie_high_score') || '0', 10);
  });

  // Sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioRef.current.enabled = next;
  };

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new ZombieEngine(canvasRef.current, audioRef.current);
    engineRef.current = engine;

    engine.onStatsUpdate = (newStats, newCrowd, newWeapon, timeLeft) => {
      setStats(newStats);
      setCrowdCount(newCrowd);
      setWeapon(newWeapon);
      setWeaponTimeLeft(timeLeft);
    };

    engine.onGameOver = (finalStats) => {
      setIsPlaying(false);
      setIsGameOver(true);
      if (finalStats.score > highScore) {
        setHighScore(finalStats.score);
        localStorage.setItem('monke_zombie_high_score', String(finalStats.score));
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        onToast(isZh ? '🎉 创下新高纪录！' : '🎉 New High Score!', `${finalStats.score} pts`, 'success');
      }
    };

    return () => {
      engine.stop();
    };
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current || !isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engineRef.current.movePlayerBy(-28);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engineRef.current.movePlayerBy(28);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Pointer / Mouse tracking on Canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current || !isPlaying) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const clientX = e.clientX - rect.left;
    engineRef.current.setPlayerTargetX(clientX * scaleX);
  };

  const startGame = () => {
    if (!engineRef.current) return;
    engineRef.current.reset(monkeId);
    engineRef.current.start();
    setIsPlaying(true);
    setIsGameOver(false);
  };

  const handleMonkeChange = (id: number) => {
    setMonkeId(id);
    setMonkeInput(String(id));
    if (engineRef.current) {
      engineRef.current.setMonkeId(id);
    }
  };

  const currentWeaponCfg = WEAPON_CONFIGS[weapon];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 flex flex-col items-center">
      {/* Top Banner */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>{isZh ? '全新原创街机 • 算数射击突围' : 'Original Arcade • Crowd Math Shooter'}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
          <span>🧟</span>
          <span>{isZh ? '节点猴：僵尸突围' : 'NodeMonkes: Zombie Horde'}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono">
            DEFENSE
          </span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
          {isZh 
            ? '控制原版大猴小队在下方左右滑移射击，击中蓝色门扩编人数，打爆负面门削弱惩罚，夺取重火力补给粉碎僵尸大潮！'
            : 'Slide your NodeMonke squad to shoot upwards! Hit math gates to multiply crowd, crack weapon crates, and eliminate the zombie swarm!'}
        </p>
      </div>

      {/* Main Game Arena Container */}
      <div className="relative w-full max-w-[500px] flex flex-col items-center bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-3 md:p-4 backdrop-blur-xl">
        {/* Top HUD */}
        <div className="w-full flex items-center justify-between gap-2 px-2 py-2 mb-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono">
          {/* Crowd count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold">
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>{crowdCount}</span>
          </div>

          {/* Score & Kills */}
          <div className="flex items-center gap-3 text-slate-300 font-semibold">
            <span className="text-amber-400">⚡ {stats.score}</span>
            <span className="text-emerald-400">🧟 {stats.zombiesKilled}</span>
            <span className="text-purple-400">WAVE {stats.wave}</span>
          </div>

          {/* Sound & Trophy */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>
            <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
              <Trophy className="w-3 h-3" />
              <span>{highScore}</span>
            </div>
          </div>
        </div>

        {/* Active Weapon Indicator */}
        {weapon !== 'pistol' && (
          <div className="w-full flex items-center justify-between px-3 py-1.5 mb-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono animate-pulse">
            <span className="flex items-center gap-1.5 font-bold">
              <span>{currentWeaponCfg.icon}</span>
              <span>{isZh ? currentWeaponCfg.nameZh : currentWeaponCfg.nameEn}</span>
            </span>
            <span className="font-bold bg-amber-500/30 px-2 py-0.5 rounded text-amber-200">
              {weaponTimeLeft}s
            </span>
          </div>
        )}

        {/* Game Canvas Container */}
        <div className="relative w-full aspect-[480/800] rounded-xl overflow-hidden shadow-inner border border-slate-700/60 bg-slate-950 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={480}
            height={800}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
            className="w-full h-full object-contain cursor-crosshair touch-none select-none"
          />

          {/* Start Screen Overlay */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-amber-500/20">
                🧟
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                {isZh ? '节点猴：僵尸突围' : 'NodeMonkes: Zombie Horde'}
              </h2>
              <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
                {isZh 
                  ? '手指或鼠标左右拖动移动战队，自动全员开火！射击增益门升级倍率，消灭僵尸大潮守住节点！'
                  : 'Drag left/right to position squad. Continuous auto-fire! Shoot gates to multiply units, grab heavy weapons, and wipe out zombies!'}
              </p>

              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-base shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>{isZh ? '开始保卫节点' : 'START DEFENSE'}</span>
              </button>

              <div className="mt-6 flex items-center gap-4 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                  {isZh ? '支持鼠标/触控拖拽' : 'Mouse / Touch Drag'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">A / D</span>
                  {isZh ? '方向键' : 'Arrow Keys'}
                </span>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-rose-500/20">
                💀
              </div>
              <h2 className="text-2xl font-black text-white mb-1">
                {isZh ? '战线失守 • GAME OVER' : 'DEFENSE BREACHED'}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                {isZh ? '节点猴防线被僵尸军团击溃！' : 'Your squad was overwhelmed by the horde!'}
              </p>

              {/* Stats Summary Grid */}
              <div className="w-full max-w-xs grid grid-cols-2 gap-2 mb-6 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '本局得分' : 'Final Score'}</div>
                  <div className="text-lg font-black text-amber-400">{stats.score}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '击杀僵尸' : 'Zombies Killed'}</div>
                  <div className="text-lg font-black text-emerald-400">{stats.zombiesKilled}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '生存波次' : 'Wave Reached'}</div>
                  <div className="text-base font-bold text-purple-400">WAVE {stats.wave}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '战队巅峰' : 'Max Crowd'}</div>
                  <div className="text-base font-bold text-sky-400">👥 {stats.maxCrowd}</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-base shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{isZh ? '重新集结战队' : 'REDEPLOY SQUAD'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Character Commander Selector Bottom Panel */}
        <div className="w-full mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">{isZh ? '指挥官猴 ID:' : 'Commander Monke:'}</span>
            <input
              type="number"
              value={monkeInput}
              onChange={(e) => setMonkeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseInt(monkeInput, 10);
                  if (!isNaN(val) && val >= 0 && val <= 9999) {
                    handleMonkeChange(val);
                  }
                }
              }}
              className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-mono text-center focus:border-amber-500 outline-none"
            />
            <button
              onClick={() => {
                const val = parseInt(monkeInput, 10);
                if (!isNaN(val) && val >= 0 && val <= 9999) {
                  handleMonkeChange(val);
                }
              }}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
            >
              {isZh ? '更换' : 'Set'}
            </button>
            <button
              onClick={() => {
                const randomId = Math.floor(Math.random() * 9999);
                handleMonkeChange(randomId);
              }}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium flex items-center gap-1 border border-amber-500/30"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isZh ? '随机' : 'Random'}</span>
            </button>
          </div>

          {/* Presets Chips */}
          <div className="flex items-center gap-1.5">
            {[209, 2918, 50, 100, 777].map((id) => (
              <button
                key={id}
                onClick={() => handleMonkeChange(id)}
                className={clsx(
                  "px-2 py-0.5 rounded text-[11px] font-mono transition-colors",
                  monkeId === id 
                    ? "bg-amber-500 text-slate-950 font-bold" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                #{id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
