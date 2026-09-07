// src/components/zombie/MoonWarriorsEngine.ts
// Faithful recreation of classic MoonWarriors with NodeMonke Ace Fighter Jet

import { MOON_WARRIORS_FRAMES, AtlasFrame } from './MoonWarriorsAtlas';
import { MoonWarriorsAudio } from './MoonWarriorsAudio';
import { getMonkeImageUrl } from '../../utils/api';
import type { GameStats } from './types';

export interface MoonWarriorsEngineOptions {
  canvas: HTMLCanvasElement;
  audio: MoonWarriorsAudio;
  initialMonkeId?: number;
  onStatsUpdate: (stats: GameStats) => void;
  onGameOver: (stats: GameStats) => void;
}

interface PlayerShip {
  x: number; // 0..320, 160 is center
  y: number; // 0..480, 60 is bottom spawn
  speed: number;
  hp: number; // 5 per life
  maxHp: number;
  lives: number; // 4 lives
  active: boolean;
  canBeAttack: boolean;
  invulnerableTimer: number; // seconds
  bornScale: number; // for ship03 revival ring
  hurtFlashTimer: number;
  shootTimer: number;
  shootInterval: number; // 1/6 s = 0.1667
  bankAngle: number;
  monkeId: number;
}

interface Enemy {
  id: number;
  type: number; // 0..5
  textureName: string;
  bulletType: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  hp: number;
  maxHp: number;
  scoreValue: number;
  moveType: number; // 0: ATTACK, 1: VERTICAL, 2: HORIZONTAL, 3: OVERLAP
  attackMode: number; // 1: NORMAL, 2: TSUIHIKIDAN
  speed: number;
  vx: number;
  vy: number;
  active: boolean;
  hurtFlashTimer: number;
  shootTimer: number;
  shootInterval: number;
  // Move action state
  moveElapsed: number;
  horizontalPhase: number;
  horizontalDir: number;
  horizontalTimer: number;
  horizontalOffset: number;
  horizontalWidth: number;
}

interface Bullet {
  id: number;
  isPlayer: boolean;
  textureName: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  damage: number;
}

interface TileMap {
  textureName: string;
  x: number;
  y: number;
  speed: number;
  active: boolean;
}

interface ExplosionEffect {
  x: number;
  y: number;
  frameIndex: number;
  frameTimer: number;
  active: boolean;
}

interface SparkEffect {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  alpha: number;
  duration: number;
  elapsed: number;
  active: boolean;
}

interface HitEffect {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  alpha: number;
  elapsed: number;
  duration: number;
  active: boolean;
}

export class MoonWarriorsEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio: MoonWarriorsAudio;
  private onStatsUpdate: (stats: GameStats) => void;
  private onGameOver: (stats: GameStats) => void;

  // Virtual resolution
  public readonly VIRTUAL_WIDTH = 320;
  public readonly VIRTUAL_HEIGHT = 480;

  // Images
  private images: Map<string, HTMLImageElement> = new Map();
  private monkeAvatarImg: HTMLImageElement | null = null;
  private isLoaded: boolean = false;

  // Game Loop
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  public isPlaying: boolean = false;
  public isPaused: boolean = false;
  private isGameOverState: boolean = false;

  // Game State
  private score: number = 0;
  private displayedScore: number = 0;
  private enemiesKilled: number = 0;
  private gameTimeSeconds: number = 0;
  private gameTimeAcc: number = 0;

  // Entities
  private ship: PlayerShip;
  private enemies: Enemy[] = [];
  private playerBullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private explosions: ExplosionEffect[] = [];
  private sparks: SparkEffect[] = [];
  private hits: HitEffect[] = [];
  private tileMaps: TileMap[] = [];

  // Parallax background
  private skyScrollY: number = 0;
  private tileMapSpawnTimer: number = 0;

  // Spawner / Level Timeline
  private nextEnemyId: number = 1;
  private nextBulletId: number = 1;
  private enemyMax: number = 6;
  private wave2sCounter: number = 0;
  private wave5sCounter: number = 0;

  // Controls
  private keys: Record<string, boolean> = {};
  private isPointerDown: boolean = false;
  private pointerPos: { x: number; y: number } = { x: 160, y: 60 };

  // Enemy Types configuration according to MoonWarriors EnemyType.js
  private readonly enemyConfigs = [
    { type: 0, textureName: 'E0.png', HP: 1, moveType: 0, attackMode: 1, scoreValue: 15 },
    { type: 1, textureName: 'E1.png', HP: 2, moveType: 0, attackMode: 1, scoreValue: 40 },
    { type: 2, textureName: 'E2.png', HP: 4, moveType: 2, attackMode: 2, scoreValue: 60 },
    { type: 3, textureName: 'E3.png', HP: 6, moveType: 3, attackMode: 1, scoreValue: 80 },
    { type: 4, textureName: 'E4.png', HP: 10, moveType: 2, attackMode: 2, scoreValue: 150 },
    { type: 5, textureName: 'E5.png', HP: 15, moveType: 2, attackMode: 1, scoreValue: 200 },
  ];

  constructor(options: MoonWarriorsEngineOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;
    this.audio = options.audio;
    this.onStatsUpdate = options.onStatsUpdate;
    this.onGameOver = options.onGameOver;

    const initialId = options.initialMonkeId || 209;
    this.ship = {
      x: 160,
      y: 60,
      speed: 220,
      hp: 5,
      maxHp: 5,
      lives: 4,
      active: true,
      canBeAttack: false,
      invulnerableTimer: 3.5,
      bornScale: 8.0,
      hurtFlashTimer: 0,
      shootTimer: 0,
      shootInterval: 1 / 6,
      bankAngle: 0,
      monkeId: initialId,
    };

    this.bindEvents();
    this.loadAssets().then(() => {
      this.isLoaded = true;
      this.updateMonkeId(initialId);
      this.render(); // initial frame
    });
  }

  // Load all MoonWarriors texture sheets
  private async loadAssets(): Promise<void> {
    const assetList = [
      { key: 'textureTransparentPack.png', src: '/games/moonwarriors/images/textureTransparentPack.png' },
      { key: 'textureOpaquePack.png', src: '/games/moonwarriors/images/textureOpaquePack.png' },
      { key: 'b01.png', src: '/games/moonwarriors/images/b01.png' },
      { key: 'explosion.png', src: '/games/moonwarriors/images/explosion.png' },
      { key: 'gameOver.png', src: '/games/moonwarriors/images/gameOver.png' },
      { key: 'logo.png', src: '/games/moonwarriors/images/logo.png' },
      { key: 'flare.jpg', src: '/games/moonwarriors/images/flare.jpg' },
    ];

    const promises = assetList.map((item) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = item.src;
        img.onload = () => {
          this.images.set(item.key, img);
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to load asset: ${item.src}`);
          resolve();
        };
      });
    });

    await Promise.all(promises);
  }

  public updateMonkeId(id: number) {
    this.ship.monkeId = id;
    const url = getMonkeImageUrl(id);
    const img = new Image();
    img.src = url;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.monkeAvatarImg = img;
    };
  }

  // Controls & listeners
  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
  }

  public unbindEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  private getCanvasRelativeCoords(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const scaleX = this.VIRTUAL_WIDTH / rect.width;
    const scaleY = this.VIRTUAL_HEIGHT / rect.height;

    // Canvas Y = 0 at top, 480 at bottom.
    // In MoonWarriors coordinates: y = 0 at bottom, 480 at top.
    const virtX = clientX * scaleX;
    const virtY = 480 - clientY * scaleY;
    return {
      x: Math.max(20, Math.min(300, virtX)),
      y: Math.max(30, Math.min(450, virtY)),
    };
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (!this.isPlaying || this.isPaused || this.isGameOverState) return;
    this.isPointerDown = true;
    this.pointerPos = this.getCanvasRelativeCoords(e);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isPointerDown || !this.isPlaying || this.isPaused || this.isGameOverState) return;
    this.pointerPos = this.getCanvasRelativeCoords(e);
  };

  private handlePointerUp = () => {
    this.isPointerDown = false;
  };

  // Game Control Lifecycle
  public start() {
    this.restart();
  }

  public stop() {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.audio.stopBGM();
  }

  public togglePause(): boolean {
    if (this.isGameOverState) return false;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.audio.stopBGM();
    } else {
      this.audio.playBGM('bgMusic');
      this.lastTime = performance.now();
      this.loop(performance.now());
    }
    this.emitStats();
    return this.isPaused;
  }

  public restart() {
    this.score = 0;
    this.displayedScore = 0;
    this.enemiesKilled = 0;
    this.gameTimeSeconds = 0;
    this.gameTimeAcc = 0;
    this.wave2sCounter = 0;
    this.wave5sCounter = 0;
    this.tileMapSpawnTimer = 2.0;

    this.enemies = [];
    this.playerBullets = [];
    this.enemyBullets = [];
    this.explosions = [];
    this.sparks = [];
    this.hits = [];
    this.tileMaps = [];

    this.ship = {
      x: 160,
      y: 60,
      speed: 220,
      hp: 5,
      maxHp: 5,
      lives: 4,
      active: true,
      canBeAttack: false,
      invulnerableTimer: 3.5,
      bornScale: 8.0,
      hurtFlashTimer: 0,
      shootTimer: 0,
      shootInterval: 1 / 6,
      bankAngle: 0,
      monkeId: this.ship.monkeId,
    };

    this.isPlaying = true;
    this.isPaused = false;
    this.isGameOverState = false;

    this.audio.playBGM('bgMusic');
    this.lastTime = performance.now();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame(this.loop);
    this.emitStats();
  }

  private loop = (time: number) => {
    if (!this.isPlaying || this.isPaused) return;

    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  // Update logic
  private update(dt: number) {
    if (this.isGameOverState) return;

    // Time counters
    this.gameTimeAcc += dt;
    if (this.gameTimeAcc >= 1.0) {
      this.gameTimeAcc -= 1.0;
      this.gameTimeSeconds += 1;
      this.onSecondTick();
    }

    // Parallax background update (16 px/sec downward)
    this.skyScrollY = (this.skyScrollY + 16 * dt) % 575;

    // Floating tilemaps update
    this.tileMapSpawnTimer -= dt;
    if (this.tileMapSpawnTimer <= 0) {
      this.tileMapSpawnTimer = 5.0; // Every 5s matching MoonWarriors
      this.spawnTileMap();
    }
    for (let i = this.tileMaps.length - 1; i >= 0; i--) {
      const tm = this.tileMaps[i];
      tm.y -= tm.speed * dt;
      if (tm.y < -240) {
        this.tileMaps.splice(i, 1);
      }
    }

    // Player Update
    this.updatePlayer(dt);

    // Enemy AI Update
    this.updateEnemies(dt);

    // Bullets Update
    this.updateBullets(dt);

    // Visual Effects Update
    this.updateEffects(dt);

    // Collision Detection
    this.checkCollisions();

    // Reborn / Game Over check
    this.checkReborn(dt);

    // Smooth UI score counter
    if (this.displayedScore < this.score) {
      const diff = this.score - this.displayedScore;
      this.displayedScore += Math.max(1, Math.ceil(diff * 0.1));
    }

    this.emitStats();
  }

  private onSecondTick() {
    // Exact MoonWarriors Level1 Timeline:
    // Repeate "00:02" -> Types: [0, 1, 2] (E0, E1, E2)
    // Repeate "00:05" -> Types: [3, 4, 5] (E3, E4, E5)
    this.wave2sCounter++;
    this.wave5sCounter++;

    if (this.wave2sCounter >= 2) {
      this.wave2sCounter = 0;
      if (this.enemies.length < this.enemyMax) {
        const types = [0, 1, 2];
        const pick = types[Math.floor(Math.random() * types.length)];
        this.spawnEnemy(pick);
      }
    }

    if (this.wave5sCounter >= 5) {
      this.wave5sCounter = 0;
      if (this.enemies.length < this.enemyMax) {
        const types = [3, 4, 5];
        const pick = types[Math.floor(Math.random() * types.length)];
        this.spawnEnemy(pick);
      }
    }
  }

  private spawnTileMap() {
    const maps = ['lvl1_map1.png', 'lvl1_map2.png', 'lvl1_map3.png', 'lvl1_map4.png'];
    const chosen = maps[Math.floor(Math.random() * maps.length)];
    const rand = Math.random();
    // In MoonWarriors: MoveBy.create(rand * 2 + 10, cc.p(0, -display.height-240))
    const duration = rand * 2 + 10;
    const distance = 480 + 240;
    const speed = distance / duration;

    this.tileMaps.push({
      textureName: chosen,
      x: rand * 320,
      y: 480,
      speed,
      active: true,
    });
  }

  private spawnEnemy(typeIndex: number) {
    if (this.enemies.length >= this.enemyMax) return;
    const cfg = this.enemyConfigs[typeIndex];
    const spawnX = 80 + (320 - 160) * Math.random();
    const spawnY = 480;

    // Movement setup
    let vx = 0;
    let vy = -120;
    let targetX = this.ship.x;
    let targetY = this.ship.y;

    if (cfg.moveType === 0) {
      // ATTACK mode: dives towards player ship in 1s
      const dx = targetX - spawnX;
      const dy = targetY - spawnY;
      vx = dx; // travels dx per 1.0s
      vy = dy; // travels dy per 1.0s
    } else if (cfg.moveType === 1) {
      // VERTICAL mode: down 480 in 4s
      vy = -480 / 4;
    } else if (cfg.moveType === 2) {
      // HORIZONTAL mode: drops down, then hovers left/right
      vy = -160;
    } else if (cfg.moveType === 3) {
      // OVERLAP mode: diagonal cross (+320,-240 then -320,-320)
      const dirX = spawnX <= 160 ? 320 : -320;
      vx = dirX / 4;
      vy = -240 / 4;
    }

    const enemy: Enemy = {
      id: this.nextEnemyId++,
      type: cfg.type,
      textureName: cfg.textureName,
      bulletType: 'W2.png',
      x: spawnX,
      y: spawnY,
      startX: spawnX,
      startY: spawnY,
      targetX,
      targetY,
      hp: cfg.HP,
      maxHp: cfg.HP,
      scoreValue: cfg.scoreValue,
      moveType: cfg.moveType,
      attackMode: cfg.attackMode,
      speed: 200,
      vx,
      vy,
      active: true,
      hurtFlashTimer: 0,
      shootTimer: 1.0 + 1.2 * Math.random(),
      shootInterval: 1.0 + 1.2 * Math.random(),
      moveElapsed: 0,
      horizontalPhase: 0,
      horizontalDir: Math.random() < 0.5 ? -1 : 1,
      horizontalTimer: 0,
      horizontalOffset: -100 - 200 * Math.random(),
      horizontalWidth: 100 + 100 * Math.random(),
    };

    this.enemies.push(enemy);
  }

  private updatePlayer(dt: number) {
    if (!this.ship.active) return;

    let targetX = this.ship.x;
    let targetY = this.ship.y;

    // Keyboard control (speed = 220)
    if (this.keys['w'] || this.keys['arrowup']) {
      targetY += this.ship.speed * dt;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      targetY -= this.ship.speed * dt;
    }
    if (this.keys['a'] || this.keys['arrowleft']) {
      targetX -= this.ship.speed * dt;
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      targetX += this.ship.speed * dt;
    }

    // Touch / Pointer dragging
    if (this.isPointerDown) {
      targetX = this.pointerPos.x;
      targetY = this.pointerPos.y;
    }

    // Banking angle calculation for jet feel
    const dx = targetX - this.ship.x;
    const targetBank = Math.max(-0.35, Math.min(0.35, dx * 0.08));
    this.ship.bankAngle += (targetBank - this.ship.bankAngle) * 0.25;

    // Apply clamped position
    this.ship.x = Math.max(20, Math.min(300, targetX));
    this.ship.y = Math.max(25, Math.min(455, targetY));

    // Invulnerability & Revival Ring
    if (!this.ship.canBeAttack) {
      this.ship.invulnerableTimer -= dt;
      if (this.ship.bornScale > 1.0) {
        this.ship.bornScale = Math.max(1.0, this.ship.bornScale - dt * 14.0);
      }
      if (this.ship.invulnerableTimer <= 0) {
        this.ship.canBeAttack = true;
      }
    }

    // Hurt Flash
    if (this.ship.hurtFlashTimer > 0) {
      this.ship.hurtFlashTimer -= dt;
    }

    // Automatic dual shooting (offset ±13px, interval 1/6s, speed +900)
    this.ship.shootTimer += dt;
    if (this.ship.shootTimer >= this.ship.shootInterval) {
      this.ship.shootTimer = 0;
      this.firePlayerDualBullets();
    }
  }

  private firePlayerDualBullets() {
    const offset = 13;
    const bulletSpeed = 900;

    // Left cannon
    this.playerBullets.push({
      id: this.nextBulletId++,
      isPlayer: true,
      textureName: 'W1.png',
      x: this.ship.x - offset,
      y: this.ship.y + 18,
      vx: 0,
      vy: bulletSpeed,
      active: true,
      damage: 1,
    });

    // Right cannon
    this.playerBullets.push({
      id: this.nextBulletId++,
      isPlayer: true,
      textureName: 'W1.png',
      x: this.ship.x + offset,
      y: this.ship.y + 18,
      vx: 0,
      vy: bulletSpeed,
      active: true,
      damage: 1,
    });

    this.audio.playFire();
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.moveElapsed += dt;

      // Hurt timer
      if (e.hurtFlashTimer > 0) {
        e.hurtFlashTimer -= dt;
      }

      // Movement execution
      if (e.moveType === 0) {
        // ATTACK: dive toward original player pos, continue downwards
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else if (e.moveType === 1) {
        // VERTICAL: down
        e.y += e.vy * dt;
      } else if (e.moveType === 2) {
        // HORIZONTAL:
        if (e.horizontalPhase === 0) {
          // Drop down by offset in 0.5s
          e.y += e.vy * dt;
          if (e.y <= e.startY + e.horizontalOffset) {
            e.horizontalPhase = 1;
            e.vy = 0;
            e.vx = e.horizontalDir * 90;
          }
        } else if (e.horizontalPhase === 1) {
          // Drift sideways
          e.x += e.vx * dt;
          if (e.x < 50 || e.x > 270) {
            e.vx *= -1;
            e.horizontalPhase = 2;
          }
        } else {
          // Hover sweep indefinitely
          e.x += e.vx * dt;
          if (e.x < 40) {
            e.x = 40;
            e.vx = Math.abs(e.vx);
          } else if (e.x > 280) {
            e.x = 280;
            e.vx = -Math.abs(e.vx);
          }
        }
      } else if (e.moveType === 3) {
        // OVERLAP: diagonal zig-zag
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (e.moveElapsed >= 4.0 && e.moveElapsed < 4.1) {
          e.vx = -e.vx; // reverse X
          e.vy = -320 / 4; // continue down
        }
      }

      // Shoot logic
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.shootInterval;
        this.fireEnemyBullet(e);
      }

      // Check off-screen
      if (e.y < -50 || e.x < -60 || e.x > 380) {
        this.enemies.splice(i, 1);
      }
    }
  }

  private fireEnemyBullet(e: Enemy) {
    const bulletSpeed = 200;
    let vx = 0;
    let vy = -bulletSpeed;

    // TSUIHIKIDAN attack mode (aimed bullet at player)
    if (e.attackMode === 2) {
      const dx = this.ship.x - e.x;
      const dy = this.ship.y - (e.y - 10);
      const dist = Math.hypot(dx, dy) || 1;
      vx = (dx / dist) * bulletSpeed;
      vy = (dy / dist) * bulletSpeed;
    }

    this.enemyBullets.push({
      id: this.nextBulletId++,
      isPlayer: false,
      textureName: 'W2.png',
      x: e.x,
      y: e.y - 12,
      vx,
      vy,
      active: true,
      damage: 1,
    });
  }

  private updateBullets(dt: number) {
    // Player bullets
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y > 500 || b.y < -20 || b.x < -20 || b.x > 340) {
        this.playerBullets.splice(i, 1);
      }
    }

    // Enemy bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y < -30 || b.y > 510 || b.x < -30 || b.x > 350) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  private updateEffects(dt: number) {
    // 35-frame explosion
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.frameTimer += dt;
      if (exp.frameTimer >= 0.04) {
        exp.frameTimer -= 0.04;
        exp.frameIndex++;
        if (exp.frameIndex > 35) {
          this.explosions.splice(i, 1);
        }
      }
    }

    // Sparks (explode2 / explode3)
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.elapsed += dt;
      const progress = sp.elapsed / sp.duration;
      sp.alpha = Math.max(0, 1 - progress);
      sp.scale = 0.5 + progress * 0.9;
      sp.rotation += dt * 3.5;
      if (sp.elapsed >= sp.duration) {
        this.sparks.splice(i, 1);
      }
    }

    // Hits
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const h = this.hits[i];
      h.elapsed += dt;
      const progress = h.elapsed / h.duration;
      h.alpha = Math.max(0, 1 - progress);
      h.scale = 0.75 + progress * 0.75;
      if (h.elapsed >= h.duration) {
        this.hits.splice(i, 1);
      }
    }
  }

  // Collisions
  private checkCollisions() {
    // 1. Player Bullet vs Enemy
    for (let bIdx = this.playerBullets.length - 1; bIdx >= 0; bIdx--) {
      const b = this.playerBullets[bIdx];
      for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = this.enemies[eIdx];
        // Distance check
        if (Math.abs(b.x - e.x) < 26 && Math.abs(b.y - e.y) < 22) {
          // Bullet hit
          this.spawnHit(b.x, b.y);
          this.playerBullets.splice(bIdx, 1);

          e.hp -= b.damage;
          e.hurtFlashTimer = 0.15;

          if (e.hp <= 0) {
            this.destroyEnemy(e, eIdx);
          }
          break;
        }
      }
    }

    // 2. Enemy Bullet vs Player Ship
    if (this.ship.active && this.ship.canBeAttack) {
      for (let bIdx = this.enemyBullets.length - 1; bIdx >= 0; bIdx--) {
        const b = this.enemyBullets[bIdx];
        if (Math.abs(b.x - this.ship.x) < 18 && Math.abs(b.y - this.ship.y) < 18) {
          this.spawnHit(b.x, b.y);
          this.enemyBullets.splice(bIdx, 1);

          this.damagePlayer();
          break;
        }
      }
    }

    // 3. Enemy Ship vs Player Ship
    if (this.ship.active && this.ship.canBeAttack) {
      for (let eIdx = this.enemies.length - 1; eIdx >= 0; eIdx--) {
        const e = this.enemies[eIdx];
        if (Math.abs(e.x - this.ship.x) < 32 && Math.abs(e.y - this.ship.y) < 28) {
          this.spawnHit(this.ship.x, this.ship.y);
          e.hp -= 3;
          e.hurtFlashTimer = 0.15;
          if (e.hp <= 0) {
            this.destroyEnemy(e, eIdx);
          }
          this.damagePlayer();
          break;
        }
      }
    }
  }

  private destroyEnemy(e: Enemy, index: number) {
    this.score += e.scoreValue;
    this.enemiesKilled++;

    // Life-up thresholds in MoonWarriors (50000, 100000, 150000...)
    const prevThreshold = Math.floor((this.score - e.scoreValue) / 50000);
    const currThreshold = Math.floor(this.score / 50000);
    if (currThreshold > prevThreshold) {
      this.ship.lives++;
    }

    this.spawnExplosion(e.x, e.y);
    this.spawnSparks(e.x, e.y);
    this.audio.playExplode();
    this.enemies.splice(index, 1);
  }

  private damagePlayer() {
    this.ship.hp--;
    this.ship.hurtFlashTimer = 0.2;

    if (this.ship.hp <= 0) {
      this.destroyPlayer();
    }
  }

  private destroyPlayer() {
    this.ship.lives--;
    this.ship.active = false;
    this.spawnExplosion(this.ship.x, this.ship.y);
    this.spawnSparks(this.ship.x, this.ship.y);
    this.audio.playShipDestroy();
  }

  private checkReborn(dt: number) {
    if (!this.ship.active) {
      if (this.ship.lives > 0) {
        // Respawn
        this.ship.x = 160;
        this.ship.y = 60;
        this.ship.hp = 5;
        this.ship.active = true;
        this.ship.canBeAttack = false;
        this.ship.invulnerableTimer = 3.5;
        this.ship.bornScale = 8.0;
        this.ship.hurtFlashTimer = 0;
      } else {
        // Game Over
        this.isGameOverState = true;
        this.audio.stopBGM();
        this.audio.playBGM('mainMenu');
        this.onGameOver(this.getStatsSnapshot());
      }
    }
  }

  private spawnExplosion(x: number, y: number) {
    this.explosions.push({
      x,
      y,
      frameIndex: 1,
      frameTimer: 0,
      active: true,
    });
  }

  private spawnSparks(x: number, y: number) {
    this.sparks.push({
      x,
      y,
      rotation: Math.random() * Math.PI * 2,
      scale: 0.8,
      alpha: 1.0,
      duration: 0.6,
      elapsed: 0,
      active: true,
    });
  }

  private spawnHit(x: number, y: number) {
    this.hits.push({
      x,
      y,
      rotation: Math.random() * Math.PI * 2,
      scale: 0.75,
      alpha: 1.0,
      elapsed: 0,
      duration: 0.25,
      active: true,
    });
  }

  // Rendering
  private render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Scale canvas context to 320 x 480 virtual resolution
    const scaleX = width / this.VIRTUAL_WIDTH;
    const scaleY = height / this.VIRTUAL_HEIGHT;
    ctx.scale(scaleX, scaleY);

    // 1. Draw Parallax Scrolling Sky (bg01.png)
    this.renderSky(ctx);

    // 2. Draw Floating Space Island Tilemaps (lvl1_map1..4)
    this.renderTileMaps(ctx);

    // 3. Draw Enemy Bullets (W2.png)
    this.renderEnemyBullets(ctx);

    // 4. Draw Enemies (E0..E5)
    this.renderEnemies(ctx);

    // 5. Draw Player Bullets (W1.png)
    this.renderPlayerBullets(ctx);

    // 6. Draw NodeMonke Ace Fighter Jet
    if (this.ship.active) {
      this.renderPlayerShip(ctx);
    }

    // 7. Draw Visual Effects (Explosions, Sparks, Hits)
    this.renderEffects(ctx);

    // 8. Draw In-Game HUD overlay
    this.renderHUD(ctx);

    ctx.restore();
  }

  // Draw sprite from atlas
  private drawAtlasFrame(
    ctx: CanvasRenderingContext2D,
    frameName: string,
    destCenterX: number,
    destCenterY: number, // In Canvas coordinates (0 is top)
    scale: number = 1.0,
    rotation: number = 0,
    alpha: number = 1.0
  ) {
    const frame = MOON_WARRIORS_FRAMES[frameName];
    if (!frame) return;

    const img = this.images.get(frame.image);
    if (!img) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(destCenterX, destCenterY);

    if (rotation !== 0) {
      ctx.rotate(rotation);
    }

    if (frame.rotated) {
      // Rotate 90 counter-clockwise
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(
        img,
        frame.x,
        frame.y,
        frame.h,
        frame.w,
        (-frame.w / 2) * scale,
        (-frame.h / 2) * scale,
        frame.w * scale,
        frame.h * scale
      );
    } else {
      ctx.drawImage(
        img,
        frame.x,
        frame.y,
        frame.w,
        frame.h,
        (-frame.w / 2) * scale,
        (-frame.h / 2) * scale,
        frame.w * scale,
        frame.h * scale
      );
    }

    ctx.restore();
  }

  private renderSky(ctx: CanvasRenderingContext2D) {
    const bgFrame = MOON_WARRIORS_FRAMES['bg01.png'];
    const img = bgFrame ? this.images.get(bgFrame.image) : null;

    if (img && bgFrame) {
      // Seamless downward scrolling
      const offset = this.skyScrollY;
      ctx.drawImage(
        img,
        bgFrame.x,
        bgFrame.y,
        bgFrame.w,
        bgFrame.h,
        0,
        offset - 575,
        this.VIRTUAL_WIDTH,
        575
      );
      ctx.drawImage(
        img,
        bgFrame.x,
        bgFrame.y,
        bgFrame.w,
        bgFrame.h,
        0,
        offset,
        this.VIRTUAL_WIDTH,
        575
      );
    } else {
      // Deep space fallback gradient
      const grad = ctx.createLinearGradient(0, 0, 0, 480);
      grad.addColorStop(0, '#040b19');
      grad.addColorStop(1, '#0c1a30');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 320, 480);
    }
  }

  private renderTileMaps(ctx: CanvasRenderingContext2D) {
    for (const tm of this.tileMaps) {
      // tm.y is in MoonWarriors coordinates (0 at bottom, 480 at top)
      const canvasY = 480 - tm.y;
      this.drawAtlasFrame(ctx, tm.textureName, tm.x, canvasY, 1.0, 0, 0.85);
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      const canvasY = 480 - e.y;
      const isHurt = e.hurtFlashTimer > 0;

      if (isHurt) {
        ctx.save();
        ctx.filter = 'brightness(2.2) contrast(1.5)';
        this.drawAtlasFrame(ctx, e.textureName, e.x, canvasY);
        ctx.restore();
      } else {
        this.drawAtlasFrame(ctx, e.textureName, e.x, canvasY);
      }
    }
  }

  private renderPlayerBullets(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of this.playerBullets) {
      const canvasY = 480 - b.y;
      this.drawAtlasFrame(ctx, b.textureName, b.x, canvasY);
    }
    ctx.restore();
  }

  private renderEnemyBullets(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const b of this.enemyBullets) {
      const canvasY = 480 - b.y;
      this.drawAtlasFrame(ctx, b.textureName, b.x, canvasY);
    }
    ctx.restore();
  }

  // Draw NodeMonke Ace Fighter Jet
  private renderPlayerShip(ctx: CanvasRenderingContext2D) {
    const canvasY = 480 - this.ship.y;
    const isInvulnerable = !this.ship.canBeAttack;
    const isHurt = this.ship.hurtFlashTimer > 0;

    // Soft blinking alpha instead of total disappearance
    const shipAlpha = isInvulnerable 
      ? (Math.floor(this.ship.invulnerableTimer * 8) % 2 === 0 ? 0.5 : 0.95)
      : 1.0;

    ctx.save();
    ctx.globalAlpha = shipAlpha;
    ctx.translate(this.ship.x, canvasY);
    ctx.rotate(this.ship.bankAngle);

    // 1. Animated Twin Jet Engine Thruster Plumes
    const plumeLength = 14 + Math.random() * 8;
    const thrusterGlow = ctx.createLinearGradient(0, 16, 0, 16 + plumeLength);
    thrusterGlow.addColorStop(0, '#38bdf8');
    thrusterGlow.addColorStop(0.3, '#f59e0b');
    thrusterGlow.addColorStop(0.8, '#ef4444');
    thrusterGlow.addColorStop(1, 'transparent');

    ctx.fillStyle = thrusterGlow;
    // Left thruster
    ctx.beginPath();
    ctx.ellipse(-9, 17, 3.5, plumeLength / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right thruster
    ctx.beginPath();
    ctx.ellipse(9, 17, 3.5, plumeLength / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. High-Tech Fighter Jet Fuselage
    if (isHurt) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = isInvulnerable ? 12 : 6;
    }
    ctx.lineWidth = 1.8;

    // Swept wings and fuselage
    ctx.beginPath();
    ctx.moveTo(0, -24); // Sharp nose
    ctx.lineTo(7, -8);
    ctx.lineTo(26, 6); // Right wing tip
    ctx.lineTo(27, 12);
    ctx.lineTo(13, 14); // Right wing cannon mount
    ctx.lineTo(11, 20); // Right vertical stabilizer
    ctx.lineTo(0, 16); // Engine mount
    ctx.lineTo(-11, 20); // Left vertical stabilizer
    ctx.lineTo(-13, 14); // Left wing cannon mount
    ctx.lineTo(-27, 12);
    ctx.lineTo(-26, 6); // Left wing tip
    ctx.lineTo(-7, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wing armor panelling
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-18, 7);
    ctx.lineTo(-13, 13);
    ctx.lineTo(-6, 8);
    ctx.lineTo(-6, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(18, 7);
    ctx.lineTo(13, 13);
    ctx.lineTo(6, 8);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();

    // Twin laser cannons at ±13px
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-14.5, -2, 3, 16);
    ctx.fillRect(11.5, -2, 3, 16);
    // Cannon tips
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(-14.5, -4, 3, 3);
    ctx.fillRect(11.5, -4, 3, 3);

    // 3. Cockpit Canopy & NodeMonke Pilot
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(0, -3, 10, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.clip(); // clip to inside canopy

    // Draw NodeMonke Pilot Face
    if (this.monkeAvatarImg && this.monkeAvatarImg.complete && this.monkeAvatarImg.naturalWidth > 0) {
      ctx.drawImage(this.monkeAvatarImg, -13, -15, 26, 26);
    } else {
      // Stylized pilot monkey
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -1, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-4, -3, 2.5, 2.5);
      ctx.fillRect(1.5, -3, 2.5, 2.5);
      // Pilot headset
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -1, 8.5, Math.PI, 0);
      ctx.stroke();
    }

    // Canopy Glass Highlights
    const glassGlare = ctx.createLinearGradient(-8, -14, 6, 8);
    glassGlare.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    glassGlare.addColorStop(0.4, 'rgba(56, 189, 248, 0.25)');
    glassGlare.addColorStop(1, 'transparent');
    ctx.fillStyle = glassGlare;
    ctx.fillRect(-12, -18, 24, 30);

    ctx.restore();

    ctx.restore();

    // 4. Revival / Spawn Protection Ring (ship03.png from MoonWarriors)
    if (isInvulnerable) {
      const scale = this.ship.bornScale;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      this.drawAtlasFrame(ctx, 'ship03.png', this.ship.x, canvasY, scale, performance.now() * 0.005, 0.9);
      ctx.restore();
    }
  }

  private renderEffects(ctx: CanvasRenderingContext2D) {
    // 1. Explosions (35-frame sequence)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const exp of this.explosions) {
      const idxStr = exp.frameIndex < 10 ? `0${exp.frameIndex}` : `${exp.frameIndex}`;
      const frameName = `explosion_${idxStr}.png`;
      const canvasY = 480 - exp.y;
      this.drawAtlasFrame(ctx, frameName, exp.x, canvasY, 1.0);
    }
    ctx.restore();

    // 2. Sparks (explode2 / explode3)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const sp of this.sparks) {
      const canvasY = 480 - sp.y;
      this.drawAtlasFrame(ctx, 'explode2.png', sp.x, canvasY, sp.scale, sp.rotation, sp.alpha);
      this.drawAtlasFrame(ctx, 'explode3.png', sp.x, canvasY, sp.scale, -sp.rotation, sp.alpha);
    }
    ctx.restore();

    // 3. Hits (hit.png)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const h of this.hits) {
      const canvasY = 480 - h.y;
      this.drawAtlasFrame(ctx, 'hit.png', h.x, canvasY, h.scale, h.rotation, h.alpha);
    }
    ctx.restore();
  }

  private renderHUD(ctx: CanvasRenderingContext2D) {
    // Top HUD in classic MoonWarriors arcade font
    ctx.save();

    // Left: Monke Ace Pilot & Lives
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText(`PILOT #${this.ship.monkeId}`, 10, 20);

    // Life icons (mini fighter jets)
    for (let i = 0; i < this.ship.lives; i++) {
      ctx.fillStyle = '#f59e0b';
      const lx = 14 + i * 16;
      const ly = 32;
      ctx.beginPath();
      ctx.moveTo(lx, ly - 6);
      ctx.lineTo(lx + 5, ly + 4);
      ctx.lineTo(lx - 5, ly + 4);
      ctx.closePath();
      ctx.fill();
    }

    // Right: Score
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillText(`SCORE: ${this.displayedScore}`, 310, 20);

    // HP Bar
    const hpWidth = 60;
    const hpHeight = 5;
    const hpPercent = Math.max(0, this.ship.hp / this.ship.maxHp);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(310 - hpWidth, 27, hpWidth, hpHeight);
    ctx.fillStyle = hpPercent > 0.4 ? '#22c55e' : '#ef4444';
    ctx.fillRect(310 - hpWidth, 27, hpWidth * hpPercent, hpHeight);

    // Game Over Overlay
    if (this.isGameOverState) {
      const goImg = this.images.get('gameOver.png');
      if (goImg) {
        ctx.drawImage(goImg, (320 - goImg.width) / 2, 120);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.textAlign = 'center';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText('GAME OVER', 160, 180);
      }

      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`FINAL SCORE: ${this.score}`, 160, 280);
    }

    ctx.restore();
  }

  private emitStats() {
    this.onStatsUpdate(this.getStatsSnapshot());
  }

  public getStatsSnapshot(): GameStats {
    return {
      score: this.score,
      zombiesKilled: this.enemiesKilled,
      wave: Math.floor(this.gameTimeSeconds / 10) + 1,
      currentStage: 1,
      stageState: this.isGameOverState ? 'all_clear' : 'playing',
      stageProgress: Math.min(100, (this.gameTimeSeconds % 60) * 1.66),
      stageNameZh: '月亮前哨站 • 平流层',
      stageNameEn: 'Moon Outpost • Stratosphere',
      hp: this.ship.hp,
      maxHp: this.ship.maxHp,
      shield: Math.max(0, Math.floor(this.ship.invulnerableTimer * 28.5)),
      maxShield: 100,
      bombs: 0,
      powerLevel: 1,
      subWeapon: 'none',
      subWeaponLevel: 1,
      combo: 0,
      isFever: false,
      isPaused: this.isPaused,
    };
  }

  public getLives(): number {
    return this.ship.lives;
  }
}
