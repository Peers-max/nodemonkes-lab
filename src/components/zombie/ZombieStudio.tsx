// src/components/zombie/ZombieStudio.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Plane, 
  Zap, 
  Crosshair, 
  Sparkles,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import type { GameStats } from './types';
import { ZombieEngine } from './ZombieEngine';
import { ZombieAudio } from './ZombieAudio';
import { useLanguage } from '../../utils/i18n';
import { getMonkeImageUrl } from '../../utils/api';
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
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [monkeId, setMonkeId] = useState<number>(initialMonkeId);
  const [monkeInput, setMonkeInput] = useState<string>(String(initialMonkeId));

  // Live HUD metrics
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    zombiesKilled: 0,
    wave: 1,
    hp: 100,
    maxHp: 100,
    shield: 100,
    maxShield: 100,
    bombs: 3,
    powerLevel: 1,
    subWeapon: 'none',
    subWeaponLevel: 1,
    combo: 0,
    isFever: false,
    isPaused: false,
  });

  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('monke_fighter_high_score') || '0', 10);
  });

  // Sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioRef.current.enabled = next;
  };

  // Game control actions
  const handleTogglePause = useCallback(() => {
    if (!engineRef.current || !isPlaying || isGameOver) return;
    const nextPaused = engineRef.current.togglePause();
    setIsPaused(nextPaused);
    if (nextPaused) {
      onToast(isZh ? '⏸️ 巡航已暂停' : '⏸️ Flight Paused', '', 'info');
    } else {
      onToast(isZh ? '▶️ 巡航继续' : '▶️ Flight Resumed', '', 'info');
    }
  }, [isPlaying, isGameOver, isZh, onToast]);

  const handleRestart = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.restartGame();
    setIsPlaying(true);
    setIsGameOver(false);
    setIsPaused(false);
    onToast(isZh ? '🔄 战机已重新出击！' : '🔄 Fighter Redeployed!', '', 'info');
  }, [isZh, onToast]);

  const handleStop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stopGame();
    setIsPlaying(false);
    setIsGameOver(false);
    setIsPaused(false);
    onToast(isZh ? '⏹️ 战斗已中止，返航整备' : '⏹️ Mission Aborted', '', 'info');
  }, [isZh, onToast]);

  const handleLaunchBomb = useCallback(() => {
    if (!engineRef.current || !isPlaying || isPaused) return;
    const fired = engineRef.current.triggerBomb();
    if (fired) {
      onToast(isZh ? '💣 全屏战术核弹已引爆！' : '💣 Tactical Nuke Launched!', '', 'success');
    }
  }, [isPlaying, isPaused, isZh, onToast]);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new ZombieEngine(canvasRef.current, audioRef.current);
    engineRef.current = engine;

    engine.onStatsUpdate = (newStats) => {
      setStats(newStats);
      setIsPaused(newStats.isPaused);
    };

    engine.onGameOver = (finalStats) => {
      setIsPlaying(false);
      setIsGameOver(true);
      setIsPaused(false);
      if (finalStats.score > highScore) {
        setHighScore(finalStats.score);
        localStorage.setItem('monke_fighter_high_score', String(finalStats.score));
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        onToast(isZh ? '🎉 创下王牌新高纪录！' : '🎉 New High Score!', `${finalStats.score} pts`, 'success');
      }
    };

    return () => {
      engine.stop();
    };
  }, []);

  // Keyboard controls: 2D Full Directional Flight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;

      // Pause / Resume: P or Escape
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (isPlaying && !isGameOver) {
          e.preventDefault();
          handleTogglePause();
          return;
        }
      }

      // Restart: R key
      if ((e.key === 'r' || e.key === 'R') && (isPlaying || isGameOver)) {
        e.preventDefault();
        handleRestart();
        return;
      }

      if (!isPlaying || isPaused) return;

      // 2D Movement
      const step = 28;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engineRef.current.movePlayerBy(-step, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engineRef.current.movePlayerBy(step, 0);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        engineRef.current.movePlayerBy(0, -step);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        engineRef.current.movePlayerBy(0, step);
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleLaunchBomb();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver, isPaused, handleTogglePause, handleRestart, handleLaunchBomb]);

  // Pointer / Mouse tracking on Canvas (Smooth 2D flight control)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current || !isPlaying || isPaused) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;
    engineRef.current.setPlayerTarget(clientX, clientY);
  };

  const startGame = () => {
    if (!engineRef.current) return;
    engineRef.current.reset(monkeId);
    engineRef.current.start();
    setIsPlaying(true);
    setIsGameOver(false);
    setIsPaused(false);
  };

  const handleMonkeChange = (id: number) => {
    setMonkeId(id);
    setMonkeInput(String(id));
    if (engineRef.current) {
      engineRef.current.setMonkeId(id);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-2 md:py-4 flex flex-col items-center">
      {/* Top Banner */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-1.5">
          <Zap className="w-3.5 h-3.5" />
          <span>{isZh ? '原创街机 • 经典雷电式飞机大战' : 'Classic Arcade • Sky Thunder Striker'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
          <span>✈️</span>
          <span>{isZh ? '节点猴：雷电空战' : 'NodeMonkes: Sky Striker'}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
            SHMUP
          </span>
        </h1>
        <p className="text-slate-400 text-xs mt-1 max-w-xl mx-auto">
          {isZh 
            ? '由节点猴亲自驾驶的王牌战机！全向滑移机动、拾取[P]增强主炮、挂载[M]追踪导弹与[L]激光副武器，投掷[B]全屏核爆摧毁敌军舰队！'
            : 'Pilot the flagship NodeMonke fighter! Full 2D maneuvers, [P] main gun upgrades, [M] homing missiles, [L] piercing lasers, and [B] screen-clearing bombs!'}
        </p>
      </div>

      {/* Main Game Arena Container */}
      <div className="relative w-full max-w-[460px] flex flex-col items-center bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-2.5 md:p-3 backdrop-blur-xl">
        {/* Top HUD */}
        <div className="w-full flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 mb-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono">
          {/* Status Group: HP, Shield, Main Weapon, Sub Weapon */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* HP */}
            <div 
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-lg border font-bold transition-colors",
                stats.hp > 50 
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" 
                  : stats.hp > 25 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse" 
                  : "bg-rose-500/25 text-rose-300 border-rose-500/50 animate-bounce"
              )}
              title={isZh ? `机体装甲: ${stats.hp}%` : `Hull Integrity: ${stats.hp}%`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/40" />
              <span>{stats.hp}%</span>
            </div>

            {/* Shield */}
            <div 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold"
              title={isZh ? `偏折护盾: ${stats.shield}%` : `Deflector Shield: ${stats.shield}%`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{stats.shield}%</span>
            </div>

            {/* Main Cannon Level */}
            <div 
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-lg font-bold border",
                stats.powerLevel >= 5
                  ? "bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-sm shadow-amber-500/30 animate-pulse"
                  : "bg-amber-500/15 text-amber-200 border-amber-500/30"
              )}
              title={isZh ? `主炮强化等级: Lv.${stats.powerLevel}` : `Main Gun: Lv.${stats.powerLevel}`}
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{stats.powerLevel >= 5 ? 'MAX' : `Lv.${stats.powerLevel}`}</span>
            </div>

            {/* Wing-Pod Sub-Weapon */}
            {stats.subWeapon !== 'none' ? (
              <div 
                className={clsx(
                  "flex items-center gap-1 px-2 py-1 rounded-lg font-bold border animate-pulse",
                  stats.subWeapon === 'missile'
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-sky-500/20 text-sky-300 border-sky-500/40"
                )}
                title={isZh ? `外挂副武: ${stats.subWeapon === 'missile' ? '追踪导弹' : '贯穿激光'} Lv.${stats.subWeaponLevel}` : `Sub-Weapon: ${stats.subWeapon} Lv.${stats.subWeaponLevel}`}
              >
                <span>{stats.subWeapon === 'missile' ? '🚀' : '🔮'}</span>
                <span>{stats.subWeapon === 'missile' ? (isZh ? '追踪弹' : 'MISSILE') : (isZh ? '激光' : 'LASER')} Lv.{stats.subWeaponLevel}</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-800/60 text-slate-500 border border-slate-700/40 font-mono text-[11px]">
                <span>外挂:[空]</span>
              </div>
            )}
          </div>

          {/* Score & Kills & Wave */}
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <span className="text-amber-400">⚡ {stats.score}</span>
            <span className="text-emerald-400">🛸 {stats.zombiesKilled}</span>
            <span className="text-purple-400">W{stats.wave}</span>
            {stats.combo >= 3 && (
              <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] animate-bounce">
                x{stats.combo}
              </span>
            )}
          </div>

          {/* Controls: Bomb Button, Pause/Resume, Restart, Stop, Sound, HighScore */}
          <div className="flex items-center gap-1.5">
            {/* Tactical Bomb Button */}
            <button
              onClick={handleLaunchBomb}
              disabled={stats.bombs <= 0 || !isPlaying || isPaused}
              className={clsx(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg font-black border transition-all text-xs font-mono",
                stats.bombs > 0 && isPlaying && !isPaused
                  ? "bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/30 animate-pulse active:scale-95 cursor-pointer"
                  : "bg-slate-800/60 text-slate-500 border-slate-700/40 cursor-not-allowed opacity-60"
              )}
              title={isZh ? `全屏战术核爆 (按空格 SPACE 释放) 剩余: ${stats.bombs}` : `Screen Bomb [SPACE] (Left: ${stats.bombs})`}
            >
              <span>💣</span>
              <span>x{stats.bombs}</span>
            </button>

            {/* Game In-Progress Controls: Pause/Resume, Restart, Stop */}
            {isPlaying && !isGameOver && (
              <>
                <button
                  onClick={handleTogglePause}
                  className={clsx(
                    "p-1.5 rounded-lg border transition-colors",
                    isPaused 
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse" 
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  )}
                  title={isPaused ? (isZh ? '继续巡航 [P / Esc]' : 'Resume [P / Esc]') : (isZh ? '暂停巡航 [P / Esc]' : 'Pause [P / Esc]')}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handleRestart}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors"
                  title={isZh ? '重新开始游戏 [R]' : 'Restart Game [R]'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleStop}
                  className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-800/50 hover:bg-rose-900/60 text-rose-300 transition-colors"
                  title={isZh ? '停止游戏并返航' : 'Stop Game'}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </>
            )}

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

        {/* Fever Mode Alert Banner */}
        {stats.isFever && (
          <div className="w-full flex items-center justify-center px-3 py-1 mb-2 rounded-lg bg-gradient-to-r from-amber-600/30 via-rose-600/30 to-amber-600/30 border border-amber-500/50 text-amber-300 text-xs font-mono font-black tracking-wide animate-pulse">
            <span>🔥 {isZh ? '超能狂热暴走！全炮火力翻倍！' : 'HYPER OVERDRIVE! DOUBLE FIREPOWER!'} 🔥</span>
          </div>
        )}

        {/* Game Canvas Container */}
        <div className="relative w-full max-h-[66vh] aspect-[480/800] rounded-xl overflow-hidden shadow-inner border border-slate-700/60 bg-slate-950 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={480}
            height={800}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
            className="w-full h-full object-contain cursor-crosshair touch-none select-none"
          />

          {/* Pause Modal Overlay */}
          {isPlaying && isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-500/20">
                ⏸️
              </div>
              <h2 className="text-2xl font-black text-white mb-1">
                {isZh ? '空战暂停 • PAUSED' : 'FLIGHT PAUSED'}
              </h2>
              <p className="text-xs text-slate-400 mb-6 font-mono">
                {isZh 
                  ? `波次: W${stats.wave} | 装甲: ${stats.hp}% | 护盾: ${stats.shield}% | 得分: ${stats.score}` 
                  : `Wave ${stats.wave} | HP: ${stats.hp}% | Shield: ${stats.shield}% | Score: ${stats.score}`}
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs font-bold text-sm">
                <button
                  onClick={handleTogglePause}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isZh ? '继续巡航 [P / Esc]' : 'RESUME FLIGHT'}</span>
                </button>

                <button
                  onClick={handleRestart}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isZh ? '重新出击 [R]' : 'REDEPLOY FIGHTER'}</span>
                </button>

                <button
                  onClick={handleStop}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 active:scale-95 transition-all"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>{isZh ? '返航退出' : 'ABORT & EXIT'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Start Screen Overlay */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-20 h-20 rounded-2xl bg-sky-500/10 border-2 border-sky-500/30 flex items-center justify-center text-4xl mb-4 shadow-lg shadow-sky-500/20">
                ✈️
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                {isZh ? '节点猴：雷电空战' : 'NodeMonkes: Sky Striker'}
              </h2>
              <p className="text-xs text-slate-400 mb-5 max-w-xs leading-relaxed">
                {isZh 
                  ? '经典街机飞机大战！节点猴亲自驾驶旗舰战机，全向滑移规避敌军弹幕，拾取空投胶囊强化主炮、挂载副武器，释放全屏核弹轰杀敌机舰队！'
                  : 'Classic arcade SHMUP! Full 2D flight control, dodge enemy bullet storms, collect powerup capsules for homing missiles and laser beams, and trigger tactical nukes!'}
              </p>

              {/* Powerups Legend */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">[P] 主炮</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[10px] font-bold">[M] 导弹</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono text-[10px] font-bold">[L] 激光</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 border border-orange-500/40 text-orange-300 font-mono text-[10px] font-bold">[B] 核弹</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">[S] 护盾</span>
              </div>

              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>{isZh ? '出击升空！' : 'SCRAMBLE FIGHTER'}</span>
              </button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                  {isZh ? '鼠标/触控拖拽' : 'Mouse / Touch'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">W/A/S/D</span>
                  {isZh ? '全向飞行' : 'Flight'}
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-amber-500/40 font-bold">SPACE</span>
                  {isZh ? '清屏核弹' : 'Nuke'}
                </span>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-rose-500/20">
                💥
              </div>
              <h2 className="text-2xl font-black text-white mb-1">
                {isZh ? '战机被击坠 • MISSION FAILED' : 'MISSION FAILED'}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                {isZh ? '节点猴战机在敌军狂轰滥炸下被击落！' : 'Your flagship fighter was brought down by the enemy armada!'}
              </p>

              {/* Stats Summary Grid */}
              <div className="w-full max-w-xs grid grid-cols-2 gap-2 mb-6 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '本局得分' : 'Final Score'}</div>
                  <div className="text-lg font-black text-amber-400">{stats.score}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '击落敌机' : 'Enemies Downed'}</div>
                  <div className="text-lg font-black text-emerald-400">{stats.zombiesKilled}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '推进波次' : 'Wave Reached'}</div>
                  <div className="text-base font-bold text-purple-400">WAVE {stats.wave}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '主炮等级' : 'Max Power'}</div>
                  <div className="text-base font-bold text-sky-400">⚡ Lv.{stats.powerLevel}</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{isZh ? '重新出击' : 'SCRAMBLE FIGHTER'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Character Commander Selector Bottom Panel */}
        <div className="w-full mt-2.5 p-2 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/60 border border-amber-500/40 flex-shrink-0 shadow-inner flex items-center justify-center">
              <img
                src={getMonkeImageUrl(monkeId)}
                alt={`Monke #${monkeId}`}
                className="w-full h-full object-contain pixelated"
              />
            </div>
            <span className="text-slate-400 font-semibold">{isZh ? '王牌飞行员猴 ID:' : 'Ace Pilot Monke:'}</span>
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
