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
  Flame,
  ShieldCheck,
  Zap,
  Server,
  Cpu
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

export type GameDifficulty = 'standard' | 'overclock' | 'halving';

interface FloatingPopup {
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  vy: number;
  life: number;
}

interface JumpSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

const DIFFICULTY_PRESETS: Record<GameDifficulty, {
  nameZh: string;
  nameEn: string;
  icon: string;
  gap: number;
  speed: number;
  gravity: number;
  jumpForce: number;
  descZh: string;
  descEn: string;
  badgeColor: string;
}> = {
  standard: {
    nameZh: '🟢 经典节点 (推荐)',
    nameEn: '🟢 Standard Node',
    icon: '⚡',
    gap: 162,
    speed: 1.85,
    gravity: 0.25,
    jumpForce: -5.1,
    descZh: '经典节点矿机柱，手感均衡适度挑战',
    descEn: 'Classic node servers with balanced challenge',
    badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40'
  },
  overclock: {
    nameZh: '🟡 超频矿机',
    nameEn: '🟡 Overclocked',
    icon: '🔥',
    gap: 146,
    speed: 2.25,
    gravity: 0.28,
    jumpForce: -5.5,
    descZh: '超频矿机阵列，更紧凑通道与更高移速',
    descEn: 'Faster overclocked server pillars & tighter gaps',
    badgeColor: 'text-orange-300 bg-orange-500/20 border-orange-500/40'
  },
  halving: {
    nameZh: '🔴 减半风暴',
    nameEn: '🔴 Halving Storm',
    icon: '⚡',
    gap: 132,
    speed: 2.75,
    gravity: 0.32,
    jumpForce: -6.0,
    descZh: '极限手速考验，高频区块阻截与密集落点',
    descEn: 'Insane halving storm challenge for elite degens',
    badgeColor: 'text-rose-300 bg-rose-500/20 border-rose-500/40'
  }
};

// Web Audio 8-bit Sound Generator
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
    osc.frequency.setValueAtTime(260, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playCoin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  public playScore() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, this.ctx.currentTime);
    osc.frequency.setValueAtTime(860, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playCrash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }
}

const sounds = new ArcadeSound();

export const ArcadeStudio: React.FC<ArcadeStudioProps> = ({
  initialMonkeId = 209,
  monkes,
  onToast,
}) => {
  const { lang, t } = useLanguage();
  const [selectedId, setSelectedId] = useState<number>(initialMonkeId);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('standard');
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('nodemonkes_arcade_highscore') || '0', 10);
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  // Game Engine Physics & Particle State
  const gameRef = useRef({
    birdY: 220,
    velocity: 0,
    pipes: [] as { x: number; top: number; bottom: number; passed: boolean; hasCoin: boolean; coinTaken: boolean; id: number }[],
    pipeSpawnTimer: 0,
    monkeImg: null as HTMLImageElement | null,
    score: 0,
    popups: [] as FloatingPopup[],
    sparks: [] as JumpSpark[],
    pipeCounter: 0,
  });

  const diffConfig = DIFFICULTY_PRESETS[difficulty];

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
      gameRef.current.velocity = diffConfig.jumpForce;
      sounds.playJump();
    } else if (gameState === 'playing') {
      gameRef.current.velocity = diffConfig.jumpForce;
      sounds.playJump();

      // Emit Pixel Jetpack Sparks
      const birdX = 64;
      const birdY = gameRef.current.birdY;
      for (let i = 0; i < 4; i++) {
        gameRef.current.sparks.push({
          x: birdX + 8 + (Math.random() * 8),
          y: birdY + 30 + (Math.random() * 4),
          vx: -(1.5 + Math.random() * 2),
          vy: 1.5 + Math.random() * 2,
          color: Math.random() > 0.5 ? '#F59E0B' : '#38BDF8',
          size: Math.random() > 0.5 ? 3 : 2,
          life: 18,
        });
      }
    } else if (gameState === 'gameover') {
      // Quick restart on tap/space
      gameRef.current.birdY = 220;
      gameRef.current.velocity = 0;
      gameRef.current.pipes = [];
      gameRef.current.pipeSpawnTimer = 0;
      gameRef.current.score = 0;
      gameRef.current.popups = [];
      gameRef.current.sparks = [];
      setScore(0);
      setGameState('ready');
    }
  }, [gameState, diffConfig]);

  // Restart Game
  const handleRestart = useCallback(() => {
    gameRef.current.birdY = 220;
    gameRef.current.velocity = 0;
    gameRef.current.pipes = [];
    gameRef.current.pipeSpawnTimer = 0;
    gameRef.current.score = 0;
    gameRef.current.popups = [];
    gameRef.current.sparks = [];
    setScore(0);
    setGameState('ready');
  }, []);

  // Global Keyboard Listener (Spacebar / ArrowUp / W)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  // Main 60FPS Game Loop with Cyber Node Server Columns
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina Display scaling
    const width = 420;
    const height = 540;
    canvas.width = width * 2;
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);

    // Pre-create gradient for maximum render efficiency (zero per-frame allocations)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#07090E');
    bgGradient.addColorStop(0.65, '#0E131F');
    bgGradient.addColorStop(1, '#05070B');

    let localRunning = true;

    const loop = () => {
      if (!localRunning) return;

      // 1. Draw Background (Cyber Bitcoin Blockchain Deep Grid)
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Micro Starfield Matrix
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let i = 0; i < 22; i++) {
        const sx = ((i * 43) + (Date.now() * 0.015 * (i % 3 + 1))) % width;
        const sy = (i * 27) % (height - 60);
        ctx.fillRect(sx, sy, (i % 2) + 1, (i % 2) + 1);
      }

      // Distant Grid Lines (Cyber Space)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.04)';
      ctx.lineWidth = 1;
      for (let gy = 0; gy < height; gy += 45) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      if (gameState === 'playing') {
        // Physics: Apply Gravity & Clamp Fall Speed
        gameRef.current.velocity += diffConfig.gravity;
        gameRef.current.velocity = Math.min(6.8, gameRef.current.velocity);
        gameRef.current.birdY += gameRef.current.velocity;

        // Soft Ceiling Bounce (Does not kill the player!)
        if (gameRef.current.birdY < 12) {
          gameRef.current.birdY = 12;
          gameRef.current.velocity = 0.6;
        }

        // Floor Crash
        const groundH = 45;
        if (gameRef.current.birdY > height - groundH - 24) {
          gameRef.current.birdY = height - groundH - 24;
          sounds.playCrash();
          setGameState('gameover');
          if (gameRef.current.score > highScore) {
            setHighScore(gameRef.current.score);
            localStorage.setItem('nodemonkes_arcade_highscore', String(gameRef.current.score));
            confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
          }
        }

        // Spawn Cyber Node Towers
        gameRef.current.pipeSpawnTimer++;
        const spawnThreshold = difficulty === 'standard' ? 135 : (difficulty === 'overclock' ? 120 : 105);
        if (gameRef.current.pipeSpawnTimer > spawnThreshold) {
          gameRef.current.pipeSpawnTimer = 0;
          const gap = diffConfig.gap;
          const minTop = 60;
          const maxTop = height - gap - 110;
          const top = Math.floor(minTop + Math.random() * (maxTop - minTop));
          const bottom = height - top - gap;
          gameRef.current.pipeCounter++;
          gameRef.current.pipes.push({
            x: width,
            top,
            bottom,
            passed: false,
            hasCoin: Math.random() > 0.35,
            coinTaken: false,
            id: gameRef.current.pipeCounter,
          });
        }

        // Move & Collide Pipes with Forgiving Core Hitbox
        const pipeSpeed = diffConfig.speed;
        for (let i = gameRef.current.pipes.length - 1; i >= 0; i--) {
          const p = gameRef.current.pipes[i];
          p.x -= pipeSpeed;

          // Monke Core Hitbox (8px buffer from sprite borders)
          const mx = 64;
          const my = gameRef.current.birdY;
          const towerWidth = 50;

          const hitPaddingX = 8;
          const hitPaddingY = 6;
          const monkeHitLeft = mx + hitPaddingX;
          const monkeHitRight = mx + 36 - hitPaddingX;
          const monkeHitTop = my + hitPaddingY;
          const monkeHitBottom = my + 36 - hitPaddingY;

          const inTowerX = monkeHitRight > p.x && monkeHitLeft < p.x + towerWidth;
          const inTopTowerY = monkeHitTop < p.top;
          const inBottomTowerY = monkeHitBottom > height - p.bottom;

          if (inTowerX && (inTopTowerY || inBottomTowerY)) {
            sounds.playCrash();
            setGameState('gameover');
            if (gameRef.current.score > highScore) {
              setHighScore(gameRef.current.score);
              localStorage.setItem('nodemonkes_arcade_highscore', String(gameRef.current.score));
              confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
            }
          }

          // Check Coin Grab (+5 Satoshi Bonus)
          if (p.hasCoin && !p.coinTaken) {
            const coinX = p.x + towerWidth / 2;
            const coinY = p.top + (height - p.top - p.bottom) / 2;
            const dist = Math.hypot(mx + 18 - coinX, my + 18 - coinY);
            if (dist < 32) {
              p.coinTaken = true;
              gameRef.current.score += 5;
              setScore(gameRef.current.score);
              sounds.playCoin();

              // Add floating +5 popup
              gameRef.current.popups.push({
                x: coinX,
                y: coinY,
                text: '+5 ₿',
                color: '#FDE68A',
                opacity: 1,
                vy: -1.2,
                life: 30,
              });
            }
          }

          // Score Pass
          if (!p.passed && p.x + towerWidth < mx) {
            p.passed = true;
            gameRef.current.score += 1;
            setScore(gameRef.current.score);
            sounds.playScore();

            // Add floating +1 popup
            gameRef.current.popups.push({
              x: mx + 20,
              y: my - 10,
              text: '+1',
              color: '#38BDF8',
              opacity: 0.9,
              vy: -1.4,
              life: 25,
            });
          }

          // Remove Off-Screen Pipes
          if (p.x < -towerWidth - 20) {
            gameRef.current.pipes.splice(i, 1);
          }
        }
      }

      // 2. Render Cyber Node Server Pillars (节点矿机数据机柜)
      gameRef.current.pipes.forEach((p) => {
        const towerWidth = 50;

        // TOP TOWER (Ceiling Down)
        // -------------------------
        // Main Server Chassis Body
        const topGrad = ctx.createLinearGradient(p.x, 0, p.x + towerWidth, 0);
        topGrad.addColorStop(0, '#0F172A');
        topGrad.addColorStop(0.3, '#1E293B');
        topGrad.addColorStop(0.8, '#0F172A');
        topGrad.addColorStop(1, '#080D1A');
        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x, 0, towerWidth, p.top);

        // Server Rack Outer Border & Neon Bevel
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, 0, towerWidth, p.top);

        // Neon Amber Data Traces (Side Accent)
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(p.x + 2, 0, 2, p.top);

        // Server Horizontal Ventilation Slats & LED Blinking Lights
        const slatSpacing = 16;
        for (let sy = 12; sy < p.top - 18; sy += slatSpacing) {
          // Vent Slat
          ctx.fillStyle = '#090D16';
          ctx.fillRect(p.x + 8, sy, towerWidth - 16, 5);
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(p.x + 8, sy + 4, towerWidth - 16, 1);

          // LED Status Lights (Blinking)
          const time = Date.now() * 0.003;
          const isLed1 = Math.sin(time + p.id + sy) > 0;
          const isLed2 = Math.cos(time * 1.5 + sy) > 0;
          ctx.fillStyle = isLed1 ? '#22C55E' : '#14532D'; // Green LED
          ctx.fillRect(p.x + towerWidth - 12, sy + 1, 3, 3);
          ctx.fillStyle = isLed2 ? '#38BDF8' : '#0369A1'; // Cyan LED
          ctx.fillRect(p.x + towerWidth - 7, sy + 1, 3, 3);
        }

        // Top Terminal Emitter Cap (Gold Terminal Bevel)
        const capH = 14;
        const capGrad = ctx.createLinearGradient(p.x - 3, p.top - capH, p.x + towerWidth + 3, p.top);
        capGrad.addColorStop(0, '#D97706');
        capGrad.addColorStop(0.5, '#FDE68A');
        capGrad.addColorStop(1, '#B45309');
        ctx.fillStyle = capGrad;
        ctx.fillRect(p.x - 3, p.top - capH, towerWidth + 6, capH);
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x - 3, p.top - capH, towerWidth + 6, capH);

        // L1 Inscription Chip Badge on Cap
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡NODE', p.x + towerWidth / 2, p.top - 4);


        // BOTTOM TOWER (Ground Up)
        // -------------------------
        const btmY = height - p.bottom;

        // Bottom Main Server Chassis Body
        ctx.fillStyle = topGrad;
        ctx.fillRect(p.x, btmY, towerWidth, p.bottom);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(p.x, btmY, towerWidth, p.bottom);

        // Neon Amber Data Traces (Side Accent)
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(p.x + 2, btmY, 2, p.bottom);

        // Bottom Terminal Emitter Cap
        ctx.fillStyle = capGrad;
        ctx.fillRect(p.x - 3, btmY, towerWidth + 6, capH);
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x - 3, btmY, towerWidth + 6, capH);

        // Bottom Inscription Chip Badge on Cap
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚡BTC', p.x + towerWidth / 2, btmY + 10);

        // Server Horizontal Ventilation Slats & LED Blinking Lights
        for (let sy = btmY + capH + 10; sy < height - 55; sy += slatSpacing) {
          ctx.fillStyle = '#090D16';
          ctx.fillRect(p.x + 8, sy, towerWidth - 16, 5);
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(p.x + 8, sy + 4, towerWidth - 16, 1);

          const time = Date.now() * 0.003;
          const isLed1 = Math.sin(time * 0.8 + p.id + sy) > 0;
          const isLed2 = Math.cos(time * 1.2 + sy) > 0;
          ctx.fillStyle = isLed1 ? '#F59E0B' : '#78350F'; // Amber LED
          ctx.fillRect(p.x + towerWidth - 12, sy + 1, 3, 3);
          ctx.fillStyle = isLed2 ? '#22C55E' : '#14532D'; // Green LED
          ctx.fillRect(p.x + towerWidth - 7, sy + 1, 3, 3);
        }


        // Render Floating Satoshi ₿ Inscription Coin
        if (p.hasCoin && !p.coinTaken) {
          const coinX = p.x + towerWidth / 2;
          const coinY = p.top + (height - p.top - p.bottom) / 2;
          const bob = Math.sin(Date.now() * 0.008 + p.id) * 4;

          ctx.save();
          // Halo Glow
          ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
          ctx.shadowBlur = 10;

          ctx.beginPath();
          ctx.arc(coinX, coinY + bob, 12, 0, Math.PI * 2);
          ctx.fillStyle = '#F59E0B';
          ctx.fill();
          ctx.strokeStyle = '#FDE68A';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.shadowBlur = 0;
          ctx.fillStyle = '#000000';
          ctx.font = 'black 13px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('₿', coinX, coinY + bob);
          ctx.restore();
        }
      });

      // 3. Render Sparks & Jetpack Particles
      for (let i = gameRef.current.sparks.length - 1; i >= 0; i--) {
        const s = gameRef.current.sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life--;
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.size, s.size);
        if (s.life <= 0) {
          gameRef.current.sparks.splice(i, 1);
        }
      }

      // 4. Render Ground (Bitcoin Cyber Platform)
      const groundH = 45;
      const groundGrad = ctx.createLinearGradient(0, height - groundH, 0, height);
      groundGrad.addColorStop(0, '#0E1726');
      groundGrad.addColorStop(1, '#05070B');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, height - groundH, width, groundH);

      // Cyber Neon Ground Rail
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(0, height - groundH, width, 3);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(0, height - groundH + 3, width, 1);

      // Micro Blocks on Ground
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let gx = 0; gx < width; gx += 28) {
        ctx.fillRect(gx, height - groundH + 10, 18, 2);
      }

      // 5. Render Player Sprite (NodeMonke)
      const birdSize = 36;
      const birdX = 64;
      const birdY = gameRef.current.birdY;

      ctx.save();
      ctx.translate(birdX + birdSize / 2, birdY + birdSize / 2);

      // Dynamic tilt based on velocity
      const tilt = Math.max(-0.35, Math.min(0.45, gameRef.current.velocity * 0.06));
      ctx.rotate(tilt);

      if (gameRef.current.monkeImg) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          gameRef.current.monkeImg,
          -birdSize / 2,
          -birdSize / 2,
          birdSize,
          birdSize
        );
      } else {
        // Fallback pixel box
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-birdSize / 2, -birdSize / 2, birdSize, birdSize);
      }
      ctx.restore();

      // 6. Render Floating Score Popups
      for (let i = gameRef.current.popups.length - 1; i >= 0; i--) {
        const pop = gameRef.current.popups[i];
        pop.y += pop.vy;
        pop.life--;
        pop.opacity = Math.max(0, pop.life / 30);

        ctx.save();
        ctx.fillStyle = pop.color;
        ctx.globalAlpha = pop.opacity;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 4;
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();

        if (pop.life <= 0) {
          gameRef.current.popups.splice(i, 1);
        }
      }

      // 7. In-Game Live HUD Score Display
      if (gameState === 'playing') {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'black 40px monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 10;
        ctx.fillText(String(gameRef.current.score), width / 2, 58);
        ctx.shadowBlur = 0;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      localRunning = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [gameState, highScore, diffConfig, difficulty]);

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
      ctx.fillText(lang === 'zh' ? '🕹️ FLAPPY NODEMONKE 战绩' : '🕹️ FLAPPY NODEMONKE SCORE', 60, 80);

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
      onToast(t.arcadeScoreCardSuccess, t.arcadeScoreCardSuccessDesc, 'success');
    };
  }, [score, highScore, currentMonke, lang, t, onToast]);

  return (
    <div className="min-h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-mono text-base font-bold shadow-lg">
              🕹️
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {t.arcadeTitle}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            {lang === 'zh' ? '操控你的 NodeMonke 穿越比特币赛博节点矿机阵列，收集 Satoshi 金币，刷新最高连击纪录！' : t.arcadeSub}
          </p>
        </div>

        {/* Sound & Mode Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/10 text-xs font-mono font-bold transition-all active:scale-95"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>{soundEnabled ? t.arcadeSoundOn : t.arcadeSoundOff}</span>
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
                <h2 className="text-2xl font-black text-white font-mono mb-1">{t.arcadeReadyTitle}</h2>
                <p className="text-xs text-slate-300 font-mono mb-4">
                  {lang === 'zh' ? '点击屏幕 / 按空格键起飞，穿梭比特币节点矿机柱！' : t.arcadeReadySub}
                </p>

                {/* Difficulty Pill on Screen */}
                <div className={clsx('px-3 py-1 rounded-full text-xs font-mono font-bold border mb-5 shadow-md flex items-center gap-1.5', diffConfig.badgeColor)}>
                  <span>{diffConfig.icon}</span>
                  <span>{lang === 'zh' ? diffConfig.nameZh : diffConfig.nameEn}</span>
                </div>

                <button
                  onClick={handleJump}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-mono font-extrabold text-sm transition-all active:scale-95 shadow-lg flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>{t.arcadeStartBtn}</span>
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
                <h2 className="text-2xl font-black text-white font-mono mb-1">{t.arcadeGameOverTitle}</h2>
                
                <div className="flex items-center gap-6 my-4 bg-white/5 p-3 rounded-xl border border-white/10 font-mono">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block">{t.arcadeCurrentScore}</span>
                    <span className="text-2xl font-black text-amber-400">{score}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <div className="text-center">
                    <span className="text-[10px] text-slate-400 block">{t.arcadeBestScore}</span>
                    <span className="text-2xl font-black text-emerald-400">{highScore}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleRestart}
                    className="px-5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-mono font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t.arcadeRetryBtn}</span>
                  </button>

                  <button
                    onClick={handleExportScore}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-mono font-extrabold text-xs transition-all active:scale-95 shadow-lg flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.arcadeExportScoreBtn}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-400 mt-4 text-center">
            {t.arcadeHint} • <span className="text-amber-400 font-bold">{lang === 'zh' ? '支持空格键 / W / ↑ 直接起飞' : 'Press Space / W / ↑ to flap'}</span>
          </span>
        </div>

        {/* Right Arcade Settings & Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5 p-6 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-xl shadow-2xl">
          
          {/* 1. Difficulty Level Selector */}
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-amber-400" />
                <span>{lang === 'zh' ? '节点模式选择 (Difficulty)' : 'Difficulty Setting'}</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">{diffConfig.gap}px 间距</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(Object.keys(DIFFICULTY_PRESETS) as GameDifficulty[]).map((dKey) => {
                const conf = DIFFICULTY_PRESETS[dKey];
                const isActive = difficulty === dKey;
                return (
                  <button
                    key={dKey}
                    type="button"
                    onClick={() => {
                      setDifficulty(dKey);
                      handleRestart();
                    }}
                    className={clsx(
                      'p-2 rounded-xl text-xs font-mono font-bold border transition-all text-center flex flex-col items-center gap-1 active:scale-95',
                      isActive
                        ? `${conf.badgeColor} shadow-md ring-2 ring-amber-400/20`
                        : 'bg-black/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <span className="text-sm">{conf.icon}</span>
                    <span className="truncate text-[11px]">
                      {lang === 'zh' 
                        ? (dKey === 'standard' ? '经典节点' : dKey === 'overclock' ? '超频矿机' : '减半风暴')
                        : (dKey === 'standard' ? 'Standard' : dKey === 'overclock' ? 'Overclock' : 'Halving')}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-1 leading-relaxed">
              💡 {lang === 'zh' ? diffConfig.descZh : diffConfig.descEn}
            </p>
          </div>

          {/* 2. Pick Monke Sprite */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.arcadeChooseMonke}</span>
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

          {/* 3. Arcade Stats Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{t.arcadeHighScoreLabel}</span>
              </span>
              <span className="text-lg font-black text-amber-400">{highScore} PTS</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-2.5">
              <span>{t.arcadeRankLabel}</span>
              <span className="text-emerald-300 font-bold">Rank #{currentMonke.rank || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{t.arcadeInscriptionLabel}</span>
              <span className="text-slate-200">#{currentMonke.inscription}</span>
            </div>
          </div>

          {/* 4. Tips Card */}
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-200 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>{t.arcadeRulesTitle}</span>
            </div>
            <p className="text-[11px] text-purple-200/80 leading-relaxed">
              {lang === 'zh' ? '• 每穿过一组赛博节点矿机柱得 1 分' : t.arcadeRule1}<br />
              {t.arcadeRule2}<br />
              {lang === 'zh' ? '• 触碰矿机机柜或触底将中断连击并结算成绩' : t.arcadeRule3}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
