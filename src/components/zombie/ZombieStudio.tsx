// src/components/zombie/ZombieStudio.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause,
  RotateCcw, 
  Square,
  Trophy, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Users, 
  Plane,
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
    maxCrowd: 10,
    gatesPassed: 0,
    shield: 100,
    maxShield: 100,
    armor: 0,
    maxArmor: 5,
    nukeCharge: 0,
    combo: 0,
    isFever: false,
    isPaused: false,
    freezeTimeLeft: 0,
  });
  const [crowdCount, setCrowdCount] = useState<number>(10);
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
    onToast(isZh ? '🔄 战机编队已重新集结！' : '🔄 Squadron Redeployed!', '', 'info');
  }, [isZh, onToast]);

  const handleStop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stopGame();
    setIsPlaying(false);
    setIsGameOver(false);
    setIsPaused(false);
    onToast(isZh ? '⏹️ 巡航已停止，返航整备' : '⏹️ Mission Aborted', '', 'info');
  }, [isZh, onToast]);

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
      setIsPaused(newStats.isPaused);
    };

    engine.onGameOver = (finalStats) => {
      setIsPlaying(false);
      setIsGameOver(true);
      setIsPaused(false);
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

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        engineRef.current.movePlayerBy(-28);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        engineRef.current.movePlayerBy(28);
      } else if (e.code === 'Space') {
        e.preventDefault();
        const fired = engineRef.current.triggerNuke();
        if (fired) {
          onToast(isZh ? '☢️ 战术空袭已引爆！' : '☢️ Orbital Strike Launched!', '', 'success');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver, isPaused, isZh, handleTogglePause, handleRestart]);

  // Pointer / Mouse tracking on Canvas
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !canvasRef.current || !isPlaying || isPaused) return;
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
    setIsPaused(false);
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5" />
          <span>{isZh ? '原创街机 • 战机编队突围' : 'Original Arcade • Flight Squadron Combat'}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
          <span>✈️</span>
          <span>{isZh ? '节点猴：空战突围' : 'NodeMonkes: Sky Squadron'}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono">
            AIR COMBAT
          </span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
          {isZh 
            ? '驾驶节点猴战机编队，在苍穹中左右滑移拦截，射击补给门扩编战机战队，打爆负面门削弱惩罚，消灭敌机舰队群！'
            : 'Pilot your NodeMonke fighter squadron! Slide left and right to intercept, blast supply gates to expand your air wing, and eliminate enemy armadas!'}
        </p>
      </div>

      {/* Main Game Arena Container */}
      <div className="relative w-full max-w-[500px] flex flex-col items-center bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-3 md:p-4 backdrop-blur-xl">
        {/* Top HUD */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 px-2.5 py-2 mb-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono">
          {/* Crowd count & Armor & Base Defense Shield */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold" title={isZh ? '战机编队数量' : 'Squadron Flight Count'}>
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span>{crowdCount}</span>
            </div>

            {/* Armor Badge if > 0 */}
            {stats.armor > 0 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/40 font-bold animate-pulse shadow-sm shadow-blue-500/20"
                title={isZh ? `纳米偏折护甲: 可抵挡 ${stats.armor} 次敌机致命撞击` : `Deflector Armor: absorbs ${stats.armor} hits`}
              >
                <span>🛡️</span>
                <span>{stats.armor}/{stats.maxArmor || 5}</span>
              </div>
            )}

            {/* Base Defense Shield */}
            <div 
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-lg border font-bold transition-colors",
                stats.shield > 50 
                  ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" 
                  : stats.shield > 20 
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30" 
                  : "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
              )}
              title={isZh ? '空天防空网耐久度（拦截突防敌机）' : 'Air Defense Barrier'}
            >
              <span>🏰</span>
              <span>{stats.shield}%</span>
            </div>

            {/* Freeze active countdown */}
            {stats.freezeTimeLeft > 0 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold animate-pulse"
                title={isZh ? '极寒减速生效中' : 'Cryo Freeze Active'}
              >
                <span>❄️</span>
                <span>{stats.freezeTimeLeft}s</span>
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

          {/* Controls: Pause / Resume, Restart, Stop, Nuke, Sound, Trophy */}
          <div className="flex items-center gap-1.5">
            {/* Tactical Nuke Button */}
            {stats.nukeCharge >= 100 ? (
              <button
                onClick={() => {
                  if (engineRef.current && isPlaying && !isPaused) {
                    const fired = engineRef.current.triggerNuke();
                    if (fired) {
                      onToast(isZh ? '☢️ 战术空袭已引爆！' : '☢️ Orbital Strike Launched!', '', 'success');
                    }
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 font-black border border-amber-300 shadow-md shadow-amber-500/30 animate-pulse active:scale-95 transition-all"
                title={isZh ? '点击或按空格键引爆战术核弹！' : 'Click or press Spacebar to Launch!'}
              >
                <span>💣</span>
                <span>{isZh ? '核弹' : 'NUKE'}</span>
              </button>
            ) : (
              <div 
                className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700/60 font-mono text-[11px]"
                title={isZh ? `击杀僵尸积攒核能: ${stats.nukeCharge}%` : `Nuke Energy: ${stats.nukeCharge}%`}
              >
                <span>💣</span>
                <span>{stats.nukeCharge}%</span>
              </div>
            )}

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
                  title={isPaused ? (isZh ? '继续游戏 [P / Esc]' : 'Resume [P / Esc]') : (isZh ? '暂停游戏 [P / Esc]' : 'Pause [P / Esc]')}
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
                  title={isZh ? '停止游戏并返回' : 'Stop Game'}
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
          <div className="w-full flex items-center justify-center px-3 py-1 mb-2 rounded-lg bg-gradient-to-r from-pink-600/30 via-purple-600/30 to-pink-600/30 border border-pink-500/50 text-pink-300 text-xs font-mono font-black tracking-wide animate-pulse">
            <span>🔥 {isZh ? '狂热状态！火力与穿透大幅提升！' : 'FEVER MODE! +50% DAMAGE & PIERCE!'} 🔥</span>
          </div>
        )}

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
                {isZh ? `当前波次: Wave ${stats.wave} | 战机数: ${crowdCount} | 得分: ${stats.score}` : `Wave ${stats.wave} | Squadron: ${crowdCount} | Score: ${stats.score}`}
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
                  <span>{isZh ? '重整编队 [R]' : 'REDEPLOY SQUADRON'}</span>
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
                {isZh ? '节点猴：空战突围' : 'NodeMonkes: Sky Squadron'}
              </h2>
              <p className="text-xs text-slate-400 mb-6 max-w-xs leading-relaxed">
                {isZh 
                  ? '滑动或按键控制战机左右翱翔，节点猴飞行员全员自动开火！射击航路补给门扩充战机编队，夺取重型机炮粉碎敌军空天舰队！'
                  : 'Slide to pilot fighter formation. Continuous aerial auto-fire! Blast math gates to expand your air wing and eliminate enemy armadas!'}
              </p>

              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>{isZh ? '升空起飞巡航' : 'LAUNCH SQUADRON'}</span>
              </button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                  {isZh ? '支持鼠标/触控拖拽' : 'Mouse / Touch Drag'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">A / D</span>
                  {isZh ? '机动移位' : 'Maneuver'}
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-amber-500/40 font-bold">SPACE</span>
                  {isZh ? '轨道轰炸' : 'Strike'}
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
                {isZh ? '编队失守 • MISSION FAILED' : 'MISSION FAILED'}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                {isZh ? '节点猴战机编队在敌军舰队围攻下陨落！' : 'Your fighter squadron was shot down by the armada!'}
              </p>

              {/* Stats Summary Grid */}
              <div className="w-full max-w-xs grid grid-cols-2 gap-2 mb-6 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '本局得分' : 'Final Score'}</div>
                  <div className="text-lg font-black text-amber-400">{stats.score}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '击落敌机' : 'Armada Downed'}</div>
                  <div className="text-lg font-black text-emerald-400">{stats.zombiesKilled}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '生存波次' : 'Wave Reached'}</div>
                  <div className="text-base font-bold text-purple-400">WAVE {stats.wave}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '巅峰战机数' : 'Peak Squadron'}</div>
                  <div className="text-base font-bold text-sky-400">✈️ {stats.maxCrowd}</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{isZh ? '重新升空起飞' : 'SCRAMBLE SQUADRON'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Character Commander Selector Bottom Panel */}
        <div className="w-full mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
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
