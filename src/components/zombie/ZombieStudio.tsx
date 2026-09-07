// src/components/zombie/ZombieStudio.tsx
// MoonWarriors (月亮战士) 经典射击游戏 - 节点猴王牌战机定制版

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Zap, 
  Crosshair, 
  Sparkles,
  Heart,
  Plane
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import type { GameStats } from './types';
import { MoonWarriorsEngine } from './MoonWarriorsEngine';
import { MoonWarriorsAudio } from './MoonWarriorsAudio';
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
  const engineRef = useRef<MoonWarriorsEngine | null>(null);
  const audioRef = useRef<MoonWarriorsAudio>(new MoonWarriorsAudio());

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
    hp: 5,
    maxHp: 5,
    shield: 100,
    maxShield: 100,
    bombs: 0,
    powerLevel: 1,
    subWeapon: 'none',
    subWeaponLevel: 1,
    combo: 0,
    isFever: false,
    isPaused: false,
    currentStage: 1,
    stageState: 'playing',
    stageProgress: 0,
    stageNameZh: '月亮前哨站 • 平流层',
    stageNameEn: 'Moon Outpost • Stratosphere',
  });

  const [lives, setLives] = useState<number>(4);

  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('moonwarriors_monke_high_score') || '0', 10);
  });

  // Sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioRef.current.setEnabled(next);
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
    engineRef.current.restart();
    setIsPlaying(true);
    setIsGameOver(false);
    setIsPaused(false);
    onToast(isZh ? '🔄 节点猴战机重新出击！' : '🔄 Fighter Redeployed!', '', 'info');
  }, [isZh, onToast]);

  const handleStop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stop();
    setIsPlaying(false);
    setIsGameOver(false);
    setIsPaused(false);
    onToast(isZh ? '⏹️ 战斗已中止，返航整备' : '⏹️ Mission Aborted', '', 'info');
  }, [isZh, onToast]);

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new MoonWarriorsEngine({
      canvas: canvasRef.current,
      audio: audioRef.current,
      initialMonkeId: monkeId,
      onStatsUpdate: (newStats) => {
        setStats(newStats);
        setIsPaused(newStats.isPaused);
        if (engineRef.current) {
          setLives(engineRef.current.getLives());
        }
      },
      onGameOver: (finalStats) => {
        setIsPlaying(false);
        setIsGameOver(true);
        setIsPaused(false);
        if (finalStats.score > highScore) {
          setHighScore(finalStats.score);
          localStorage.setItem('moonwarriors_monke_high_score', String(finalStats.score));
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          onToast(isZh ? '🎉 创下月亮战士新高纪录！' : '🎉 New High Score!', `${finalStats.score} pts`, 'success');
        }
      },
    });

    engineRef.current = engine;

    return () => {
      engine.stop();
      engine.unbindEvents();
    };
  }, []);

  // Keyboard controls: Pause/Resume, Restart
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver, isPaused, handleTogglePause, handleRestart]);

  const startGame = () => {
    if (!engineRef.current) return;
    engineRef.current.updateMonkeId(monkeId);
    engineRef.current.start();
    setIsPlaying(true);
    setIsGameOver(false);
    setIsPaused(false);
    setLives(4);
  };

  const handleMonkeChange = (id: number) => {
    setMonkeId(id);
    setMonkeInput(String(id));
    if (engineRef.current) {
      engineRef.current.updateMonkeId(id);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-2 md:py-4 flex flex-col items-center">
      {/* Top Banner */}
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-1.5">
          <Zap className="w-3.5 h-3.5" />
          <span>{isZh ? '经典重现 • MoonWarriors 完整移植' : 'Classic Reborn • MoonWarriors Full Port'}</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
          <span>🌙</span>
          <span>{isZh ? '月亮战士：节点猴王牌空战' : 'MoonWarriors: NodeMonke Ace'}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono">
            COCOS2D • SHMUP
          </span>
        </h1>
        <p className="text-slate-400 text-xs mt-1 max-w-xl mx-auto">
          {isZh 
            ? '100% 忠实植入经典 MoonWarriors 原版敌机 E0-E5、双层视差星空、原声音乐与爆炸！主角座驾升级为专属节点猴战斗机，掌控双发重激光横扫太空！'
            : 'Faithful port of MoonWarriors: authentic E0-E5 enemies, parallax starfields, original OST & explosions! Piloted by your customized NodeMonke Ace Fighter!'}
        </p>
      </div>

      {/* Main Game Arena Container */}
      <div className="relative w-full max-w-[460px] flex flex-col items-center bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl p-2.5 md:p-3 backdrop-blur-xl">
        {/* Top HUD */}
        <div className="w-full flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 mb-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs font-mono">
          {/* Status Group: HP, Lives, Pilot */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Lives Icons */}
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 font-bold text-amber-300">
              <Plane className="w-3.5 h-3.5 text-amber-400" />
              <span>x{lives}</span>
            </div>

            {/* HP Bar */}
            <div 
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-lg border font-bold transition-colors",
                stats.hp >= 4 
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" 
                  : stats.hp >= 2 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse" 
                  : "bg-rose-500/25 text-rose-300 border-rose-500/50 animate-bounce"
              )}
              title={isZh ? `机体耐久: ${stats.hp}/5` : `Hull: ${stats.hp}/5`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/40" />
              <span>{stats.hp}/5 HP</span>
            </div>

            {/* Score & Enemies Downed */}
            <div className="flex items-center gap-2 text-slate-300 font-semibold ml-1">
              <span className="text-amber-400">⚡ {stats.score}</span>
              <span className="text-emerald-400">🛸 {stats.zombiesKilled}</span>
            </div>
          </div>

          {/* Controls Group */}
          <div className="flex items-center gap-1.5">
            {/* Pause / Resume */}
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
                  title={isZh ? '停止并返航' : 'Stop Game'}
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>

            {/* High Score */}
            <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
              <Trophy className="w-3 h-3" />
              <span>{highScore}</span>
            </div>
          </div>
        </div>

        {/* Game Canvas Container (Classic 320x480 aspect 2:3) */}
        <div className="relative w-full max-h-[68vh] aspect-[320/480] rounded-xl overflow-hidden shadow-inner border border-slate-700/60 bg-slate-950 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={640}
            height={960}
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
                  ? `得分: ${stats.score} | 战机生命: x${lives} | 耐久: ${stats.hp}/5` 
                  : `Score: ${stats.score} | Lives: x${lives} | Hull: ${stats.hp}/5`}
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs font-bold text-sm">
                <button
                  onClick={handleTogglePause}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isZh ? '继续出击 [P / Esc]' : 'RESUME FLIGHT'}</span>
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
              <div className="w-20 h-20 rounded-2xl bg-sky-500/10 border-2 border-sky-500/30 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-sky-500/20 overflow-hidden">
                <img
                  src="/games/moonwarriors/images/logo.png"
                  alt="MoonWarriors"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <h2 className="text-2xl font-black text-white mb-2">
                {isZh ? '月亮战士：节点猴空战' : 'MoonWarriors: NodeMonke'}
              </h2>
              <p className="text-xs text-slate-400 mb-5 max-w-xs leading-relaxed">
                {isZh 
                  ? '经典 Cocos2d-html5 游戏 MoonWarriors 完整移植！由节点猴亲自驾驶王牌战机，双发激光炮自动轰击，抵挡敌军各路精锐编队！'
                  : 'Authentic MoonWarriors shmup! Pilot your custom NodeMonke fighter jet through parallax space fields, dodge enemy attack waves, and conquer the leaderboard!'}
              </p>

              {/* Enemy Squad Showcase */}
              <div className="flex items-center justify-center gap-2 mb-6 text-[10px] font-mono text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
                <span className="text-sky-400">E0/E1 俯冲突袭</span>
                <span>•</span>
                <span className="text-amber-400">E2/E4 追踪瞄准弹</span>
                <span>•</span>
                <span className="text-rose-400">E3/E5 巡航重炮</span>
              </div>

              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>{isZh ? '即刻出击！' : 'START MISSION'}</span>
              </button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                  {isZh ? '鼠标/触屏滑移控制' : 'Mouse / Touch Drag'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">W/A/S/D</span>
                  {isZh ? '键盘飞行' : 'WASD Flight'}
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
                {isZh ? '全部战机坠毁 • GAME OVER' : 'GAME OVER'}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                {isZh ? '节点猴战机在月球前哨站壮烈牺牲！' : 'Your fighter squadron was wiped out!'}
              </p>

              {/* Stats Summary Grid */}
              <div className="w-full max-w-xs grid grid-cols-2 gap-2 mb-6 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '最终得分' : 'Final Score'}</div>
                  <div className="text-lg font-black text-amber-400">{stats.score}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{isZh ? '击落敌机' : 'Enemies Downed'}</div>
                  <div className="text-lg font-black text-emerald-400">{stats.zombiesKilled}</div>
                </div>
              </div>

              <button
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                <span>{isZh ? '再次出击' : 'PLAY AGAIN'}</span>
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
            <span className="text-slate-400 font-semibold">{isZh ? '战机驾驶员猴 ID:' : 'Pilot Monke ID:'}</span>
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
