import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, 
  Play, 
  RotateCcw, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Download, 
  Search, 
  Sparkles, 
  Coins,
  Crown,
  Flame
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Monke } from '../../types';
import { getMonkeImageUrl } from '../../utils/api';
import { useLanguage } from '../../utils/i18n';
import confetti from 'canvas-confetti';

interface ArcadeStudioProps {
  initialMonkeId?: number;
  monkes: Monke[];
  onToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
}

// Simple Web Audio 8-bit Sound Generator
class ArcadeSound {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playJump() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(280, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(540, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playCoin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  public playScore() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  public playCrash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
}

const sounds = new ArcadeSound();

export const ArcadeStudio: React.FC<ArcadeStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  onToast,
}) => {
  const { lang } = useLanguage();
  const [selectedId, setSelectedId] = useState<number>(initialMonkeId);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('nodemonkes_arcade_highscore') || '0', 10);
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Game Engine Physics State
  const gameRef = useRef({
    birdY: 200,
    velocity: 0,
    gravity: 0.38,
    jumpForce: -6.8,
    pipes: [] as { x: number; top: number; bottom: number; passed: boolean; hasCoin: boolean; coinTaken: boolean }[],
    pipeSpeed: 2.6,
    pipeSpawnTimer: 0,
    monkeImg: null as HTMLImageElement | null,
    score: 0,
  });

  const currentMonke = useMemo(() => {
    return monkes.find((m) => m.id === selectedId) || monkes[0] || {
      id: 209,
      rank: 1,
      inscription: 83985,
      block: 776487,
      attributes: { Body: 'Alien', Head: 'None', Eyes: 'None', Earring: 'None', Count: 1 },
      scriptPubkey: ''
    };
  }, [monkes, selectedId]);

  // Load Monke Avatar for Sprite
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = getMonkeImageUrl(currentMonke.id);
    img.onload = () => {
      gameRef.current.monkeImg = img;
    };
  }, [currentMonke.id]);

  // Sound Toggle
  const toggleSound = () => {
    setSoundEnabled((prev) => {
      sounds.enabled = !prev;
      return !prev;
    });
  };

  // Jump / Flap Handler
  const handleJump = useCallback(() => {
    if (gameState === 'ready') {
      setGameState('playing');
      gameRef.current.velocity = gameRef.current.jumpForce;
      sounds.playJump();
    } else if (gameState === 'playing') {
      gameRef.current.velocity = gameRef.current.jumpForce;
      sounds.playJump();
    }
  }, [gameState]);

  // Restart Game
  const handleRestart = useCallback(() => {
    gameRef.current.birdY = 220;
    gameRef.current.velocity = 0;
    gameRef.current.pipes = [];
    gameRef.current.pipeSpawnTimer = 0;
    gameRef.current.score = 0;
    setScore(0);
    setGameState('ready');
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = 440;
    const height = canvas.height = 580;

    const loop = () => {
      const g = gameRef.current;

      // 1. Draw Background Sky & Grid
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#060B19');
      bgGrad.addColorStop(0.7, '#0F172A');
      bgGrad.addColorStop(1, '#1E1B4B');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 20; i++) {
        ctx.fillRect((i * 47) % width, (i * 31) % height, 2, 2);
      }

      // City / Bitcoin Skyline
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let b = 0; b < 10; b++) {
        ctx.fillRect(b * 50, height - 100 - (b % 4) * 20, 42, 100 + (b % 4) * 20);
      }

      if (gameState === 'playing') {
        // 2. Physics Update
        g.velocity += g.gravity;
        g.birdY += g.velocity;

        // Floor / Ceiling Collision
        if (g.birdY > height - 60 || g.birdY < 0) {
          sounds.playCrash();
          setGameState('gameover');
          if (g.score > highScore) {
            setHighScore(g.score);
            localStorage.setItem('nodemonkes_arcade_highscore', String(g.score));
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          }
        }

        // 3. Pipe Generation
        g.pipeSpawnTimer++;
        if (g.pipeSpawnTimer > 95) {
          g.pipeSpawnTimer = 0;
          const gap = 145;
          const minPipe = 60;
          const top = Math.floor(Math.random() * (height - gap - minPipe * 2)) + minPipe;
          const bottom = height - top - gap;
          g.pipes.push({
            x: width,
            top,
            bottom,
            passed: false,
            hasCoin: Math.random() > 0.5,
            coinTaken: false,
          });
        }

        // 4. Update & Draw Obstacles (Bitcoin Candlestick Pillars)
        for (let i = g.pipes.length - 1; i >= 0; i--) {
          const p = g.pipes[i];
          p.x -= g.pipeSpeed;

          // Green Bullish Candle (Top)
          const topGrad = ctx.createLinearGradient(p.x, 0, p.x + 52, 0);
          topGrad.addColorStop(0, '#15803D');
          topGrad.addColorStop(0.5, '#22C55E');
          topGrad.addColorStop(1, '#166534');
          ctx.fillStyle = topGrad;
          ctx.fillRect(p.x, 0, 52, p.top);
          ctx.fillStyle = '#4ADE80';
          ctx.fillRect(p.x - 3, p.top - 14, 58, 14); // Pipe Cap

          // Red Bearish Candle (Bottom)
          const btmY = height - p.bottom;
          const btmGrad = ctx.createLinearGradient(p.x, 0, p.x + 52, 0);
          btmGrad.addColorStop(0, '#B91C1C');
          btmGrad.addColorStop(0.5, '#EF4444');
          btmGrad.addColorStop(1, '#991B1B');
          ctx.fillStyle = btmGrad;
          ctx.fillRect(p.x, btmY, 52, p.bottom);
          ctx.fillStyle = '#F87171';
          ctx.fillRect(p.x - 3, btmY, 58, 14); // Pipe Cap

          // Golden Satoshi Coin
          if (p.hasCoin && !p.coinTaken) {
            const coinY = p.top + (height - p.bottom - p.top) / 2;
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(p.x + 26, coinY, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FEF3C7';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#78350F';
            ctx.font = 'bold 11px monospace';
            ctx.fillText('₿', p.x + 22, coinY + 4);

            // Coin Collision
            if (
              80 + 38 > p.x + 15 &&
              80 < p.x + 37 &&
              g.birdY + 38 > coinY - 11 &&
              g.birdY < coinY + 11
            ) {
              p.coinTaken = true;
              g.score += 5;
              setScore(g.score);
              sounds.playCoin();
            }
          }

          // Pipe Collision
          if (
            80 + 34 > p.x &&
            80 + 4 < p.x + 52 &&
            (g.birdY + 4 < p.top || g.birdY + 34 > btmY)
          ) {
            sounds.playCrash();
            setGameState('gameover');
            if (g.score > highScore) {
              setHighScore(g.score);
              localStorage.setItem('nodemonkes_arcade_highscore', String(g.score));
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            }
          }

          // Score passing
          if (!p.passed && p.x + 52 < 80) {
            p.passed = true;
            g.score += 1;
            setScore(g.score);
            sounds.playScore();
          }

          // Remove off-screen pipes
          if (p.x < -60) {
            g.pipes.splice(i, 1);
          }
        }
      }

      // 5. Draw Ground Floor
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, height - 45, width, 45);
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, height - 45, width, 3); // Neon Orange Border

      // 6. Draw Player Monke Sprite
      const birdX = 80;
      const birdY = g.birdY;
      const tilt = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (g.velocity * 0.08)));

      ctx.save();
      ctx.translate(birdX + 20, birdY + 20);
      ctx.rotate(tilt);
      if (g.monkeImg) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(g.monkeImg, -20, -20, 40, 40);
      } else {
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(-18, -18, 36, 36);
      }
      ctx.restore();

      // 7. HUD Score on Canvas
      if (gameState === 'playing') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(g.score), width / 2, 70);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [gameState, highScore]);

  // Export Score Share Card
  const handleExportScore = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 1000;
    canvas.height = 600;

    // Grad Background
    const grad = ctx.createLinearGradient(0, 0, 1000, 600);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1000, 600);

    // Border
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, 980, 580);

    // Draw Monke
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = getMonkeImageUrl(currentMonke.id);
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 60, 120, 360, 360);

      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 44px monospace';
      ctx.fillText('🕹️ FLAPPY NODEMONKE 战绩', 60, 80);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(`NodeMonke #${currentMonke.id}`, 460, 180);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 64px monospace';
      ctx.fillText(`SCORE: ${score}`, 460, 260);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '28px monospace';
      ctx.fillText(`BEST HIGH SCORE: ${highScore}`, 460, 330);
      ctx.fillText(`Inscription: #${currentMonke.inscription}`, 460, 380);

      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 32px monospace';
      ctx.fillText('⚡ BITCOIN ORDINALS ARCADE', 460, 460);

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `FlappyMonke_${currentMonke.id}_Score_${score}.png`;
      link.href = url;
      link.click();
      onToast('战绩海报已保存！', `得分 ${score} 高清战报已导出`, 'success');
    };
  }, [score, highScore, currentMonke, onToast]);

  return (
    <div className="min-h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-mono text-base font-bold shadow-lg">
              🕹️
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              Flappy Monke <span className="text-purple-400 text-lg font-sans">像素跳跃街机</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            操控你的 NodeMonke 穿越比特币链上 K 线柱子与减半区块，收集 Satoshi 金币，刷新最高连击纪录！
          </p>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>{soundEnabled ? '音效开启' : '静音'}</span>
          </button>
        </div>
      </div>

      {/* Main Game Stage Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Game Canvas Screen (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-2xl relative">
          
          <div 
            onClick={handleJump}
            className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.8)] cursor-pointer select-none"
          >
            <canvas
              ref={canvasRef}
              className="block bg-slate-950"
            />

            {/* Ready State Overlay */}
            {gameState === 'ready' && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 text-3xl mb-3 shadow-lg animate-bounce">
                  🕹️
                </div>
                <h2 className="text-2xl font-black text-white font-mono mb-1">READY TO FLY?</h2>
                <p className="text-xs text-slate-300 font-mono mb-5">
                  点击屏幕 / 按空格键起飞，躲避比特币 K 线柱！
                </p>
                <button
                  onClick={handleJump}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-mono font-extrabold text-sm transition-all active:scale-95 shadow-lg flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  <span>START GAME</span>
                </button>
              </div>
            )}

            {/* Game Over State Overlay */}
            {gameState === 'gameover' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 text-2xl mb-2 shadow-lg">
                  💥
                </div>
                <h2 className="text-2xl font-black text-white font-mono mb-1">GAME OVER</h2>
                
                <div className="flex items-center gap-6 my-4 bg-white/5 p-3 rounded-xl border border-white/10 font-mono">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block">本局得分</span>
                    <span className="text-2xl font-black text-amber-400">{score}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block">历史最高</span>
                    <span className="text-2xl font-black text-emerald-400">{highScore}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleRestart}
                    className="px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-mono font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>再玩一次</span>
                  </button>

                  <button
                    onClick={handleExportScore}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-mono font-extrabold text-xs transition-all active:scale-95 shadow-lg flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>导出战绩</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-500 mt-4">
            💡 点击游戏窗口或按空格键跳跃 • 吃到 ₿ 金币额外 +5 分
          </span>
        </div>

        {/* Right Arcade Settings & Monke Picker (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 p-6 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-2xl">
          
          {/* Pick Monke Sprite */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>更换参赛神兽主角 (Choose Monke)</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={10000}
                value={selectedId}
                onChange={(e) => setSelectedId(parseInt(e.target.value, 10) || 1)}
                className="w-28 px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-amber-400 transition-all"
                placeholder="ID (1-10000)"
              />
              <div className="flex items-center gap-2">
                <img
                  src={getMonkeImageUrl(currentMonke.id)}
                  alt={`Monke #${currentMonke.id}`}
                  className="w-10 h-10 rounded-xl bg-black border border-white/10 object-contain pixelated"
                />
                <span className="text-xs font-mono text-slate-300 font-bold">
                  NodeMonke #{currentMonke.id}
                </span>
              </div>
            </div>
          </div>

          {/* Arcade Stats Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>最高分纪录 (Best High Score)</span>
              </span>
              <span className="text-lg font-black text-amber-400">{highScore} PTS</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-2.5">
              <span>当前选手评级</span>
              <span className="text-emerald-300 font-bold">Rank #{currentMonke.rank || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>铭文序号</span>
              <span className="text-slate-200">#{currentMonke.inscription}</span>
            </div>
          </div>

          {/* Tips Card */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-200 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>街机挑战规则</span>
            </div>
            <p className="text-[11px] text-purple-200/80 leading-relaxed">
              • 每穿过一组 K 线柱得 1 分<br />
              • 收集空中的金色 ₿ 符文金币单次额外获得 +5 分<br />
              • 触碰顶部天花板、底部地板或柱身立即结束游戏
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
