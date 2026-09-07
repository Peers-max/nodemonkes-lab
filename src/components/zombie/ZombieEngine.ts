// src/components/zombie/ZombieEngine.ts
import type {
  PlayerShip,
  Zombie,
  Bullet,
  EnemyBullet,
  DroppedItem,
  PowerupType,
  Particle,
  FloatingText,
  GameStats,
  SubWeaponType,
} from './types';
import { ZombieAudio } from './ZombieAudio';
import { getMonkeImageUrl } from '../../utils/api';
import {
  getZombieSprite,
  getFallbackMonkeSprite,
  createMonkeCanvas,
  renderFighterJet,
  renderPowerupItem,
  renderEnemyBullet,
  renderHomingMissile,
} from './ZombieSprites';

export class ZombieEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public audio: ZombieAudio;

  // Game loop state
  public isRunning = false;
  public isPaused = false;
  public isGameOver = false;
  private animId: number = 0;
  private lastTime: number = 0;

  // Player state: Single Ace Fighter
  public player: PlayerShip;
  public monkeImage: HTMLImageElement | null = null;
  public monkeCanvas: HTMLCanvasElement | null = null;
  public monkeId: number = 209;

  // Projectiles & Drops
  public bullets: Bullet[] = [];
  public enemyBullets: EnemyBullet[] = [];
  public droppedItems: DroppedItem[] = [];
  public zombies: Zombie[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  private stars: Array<{ x: number; y: number; size: number; speed: number; alpha: number; color: string }> = [];

  // Spawner & Metrics
  public distance: number = 0;
  public speed: number = 1.8;
  public wave: number = 1;
  public score: number = 0;
  public zombiesKilled: number = 0;
  public combo: number = 0;
  public lastKillTime: number = 0;
  public feverTimer: number = 0;

  private nextZombieDistance: number = 80;
  private screenShake: number = 0;
  private flashAlpha: number = 0;

  // Laser beam active render state
  public isFiringLaser: boolean = false;

  // Callbacks
  public onStatsUpdate?: (stats: GameStats, crowdCount: number, weapon: string, weaponTimeLeft: number) => void;
  public onGameOver?: (stats: GameStats) => void;

  constructor(canvas: HTMLCanvasElement, audio: ZombieAudio) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Failed to get 2d context');
    this.ctx = context;
    this.audio = audio;

    this.player = {
      x: canvas.width / 2,
      y: canvas.height - 120,
      targetX: canvas.width / 2,
      targetY: canvas.height - 120,
      hp: 100,
      maxHp: 100,
      shield: 100,
      maxShield: 100,
      bombs: 3,
      maxBombs: 5,
      mainWeaponLevel: 1,
      subWeapon: 'none',
      subWeaponLevel: 1,
      shootCooldown: 0,
      subWeaponCooldown: 0,
      invulnerableTimer: 0,
      bankAngle: 0,
      thrusterFrame: 0,
      size: 44,
      monkeId: 209,
    };

    this.initStars();
    this.reset();
  }

  private initStars() {
    this.stars = [];
    for (let i = 0; i < 85; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() < 0.2 ? 2.5 : 1.2,
        speed: 0.5 + Math.random() * 1.6,
        alpha: 0.3 + Math.random() * 0.7,
        color: Math.random() < 0.3 ? '#38bdf8' : Math.random() < 0.6 ? '#e0f2fe' : '#ffffff',
      });
    }
  }

  public reset(monkeId: number = 209) {
    this.monkeId = monkeId;
    this.isGameOver = false;
    this.isPaused = false;

    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 120,
      targetX: this.canvas.width / 2,
      targetY: this.canvas.height - 120,
      hp: 100,
      maxHp: 100,
      shield: 100,
      maxShield: 100,
      bombs: 3,
      maxBombs: 5,
      mainWeaponLevel: 1,
      subWeapon: 'none',
      subWeaponLevel: 1,
      shootCooldown: 0,
      subWeaponCooldown: 0,
      invulnerableTimer: 1000,
      bankAngle: 0,
      thrusterFrame: 0,
      size: 44,
      monkeId,
    };

    this.bullets = [];
    this.enemyBullets = [];
    this.droppedItems = [];
    this.zombies = [];
    this.particles = [];
    this.floatingTexts = [];
    this.distance = 0;
    this.wave = 1;
    this.score = 0;
    this.zombiesKilled = 0;
    this.combo = 0;
    this.lastKillTime = 0;
    this.feverTimer = 0;
    this.nextZombieDistance = 80;
    this.isFiringLaser = false;

    this.loadMonkeImage(monkeId);
  }

  public setMonkeId(id: number) {
    this.monkeId = id;
    this.player.monkeId = id;
    this.loadMonkeImage(id);
  }

  private loadMonkeImage(id: number) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.monkeImage = img;
      this.monkeCanvas = createMonkeCanvas(img);
    };
    img.src = getMonkeImageUrl(id);
  }

  public movePlayerBy(dx: number, dy: number = 0) {
    this.player.targetX = Math.max(26, Math.min(this.canvas.width - 26, this.player.targetX + dx));
    this.player.targetY = Math.max(70, Math.min(this.canvas.height - 50, this.player.targetY + dy));
  }

  public setPlayerTarget(x: number, y?: number) {
    this.player.targetX = Math.max(26, Math.min(this.canvas.width - 26, x));
    if (y !== undefined) {
      this.player.targetY = Math.max(70, Math.min(this.canvas.height - 50, y));
    }
  }

  public setPlayerTargetX(x: number) {
    this.setPlayerTarget(x);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = 0;
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (!this.isPaused) {
      this.lastTime = performance.now();
    }
    return this.isPaused;
  }

  public stopGame() {
    this.stop();
    this.isGameOver = false;
    this.isPaused = false;
  }

  public restartGame() {
    this.reset(this.monkeId);
    this.start();
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;

    const dt = Math.min(32, time - this.lastTime);
    this.lastTime = time;

    if (!this.isPaused && !this.isGameOver) {
      this.update(dt);
    }
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  /**
   * Tactical Screen-Clearing Bomb / Nuke
   */
  public triggerNuke(): boolean {
    if (this.player.bombs <= 0 || this.isGameOver || !this.isRunning) return false;
    this.player.bombs--;
    this.audio.playNuke();
    this.screenShake = 24;
    this.flashAlpha = 0.65;

    // 1. Convert ALL enemy bullets on screen into score and flak sparks!
    for (const eb of this.enemyBullets) {
      this.spawnSpark(eb.x, eb.y, '#38bdf8');
      this.score += 15;
    }
    this.enemyBullets = [];

    // 2. Drop orbital barrage explosions across battlefield
    for (let xi = 40; xi <= this.canvas.width - 40; xi += 80) {
      this.spawnExplosion(xi, 180 + Math.random() * 250, 110);
    }

    // 3. Deal massive 650 damage to all active enemy aircraft
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.hp -= 650;
      z.hitFlash = 1;
      if (z.hp <= 0) {
        this.score += z.scoreValue;
        this.zombiesKilled++;
        this.spawnFlakParticles(z.x, z.y, z.color);
        this.spawnExplosion(z.x, z.y, z.radius * 2);
        this.zombies.splice(i, 1);
      }
    }

    this.addFloatingText(this.player.x, this.player.y - 60, '☢️ TACTICAL NUKE! ☢️', '#f59e0b', 24);
    return true;
  }

  public triggerBomb(): boolean {
    return this.triggerNuke();
  }

  private update(dt: number) {
    this.distance += this.speed * (dt / 16.66);
    this.wave = 1 + Math.floor(this.distance / 1400);

    // Timers
    if (this.player.invulnerableTimer > 0) this.player.invulnerableTimer -= dt;
    if (this.feverTimer > 0) this.feverTimer -= dt;

    // Shield auto-regen (+1/s if > 0 and not hit recently)
    if (this.player.shield > 0 && this.player.shield < this.player.maxShield) {
      this.player.shield = Math.min(this.player.maxShield, this.player.shield + (dt / 1000) * 1.5);
    }

    // Combo decay
    if (this.combo > 0 && performance.now() - this.lastKillTime > 1800) {
      this.combo = 0;
    }

    // Starfield parallax
    for (const s of this.stars) {
      s.y += (this.speed * s.speed + 1.2) * (dt / 16.66);
      if (s.y > this.canvas.height) {
        s.y = 0;
        s.x = Math.random() * this.canvas.width;
      }
    }

    // Player position lerp and banking angle
    const targetBank = Math.max(-0.4, Math.min(0.4, (this.player.targetX - this.player.x) * 0.018));
    this.player.bankAngle += (targetBank - this.player.bankAngle) * 0.22;
    this.player.x += (this.player.targetX - this.player.x) * 0.26;
    this.player.y += (this.player.targetY - this.player.y) * 0.26;
    this.player.thrusterFrame = (this.player.thrusterFrame + dt * 0.04) % 10;

    // Player weapon firing
    this.updatePlayerWeapons(dt);

    // Update Player Bullets & Homing Missiles
    this.updatePlayerBullets(dt);

    // Spawn Enemy Aircraft waves
    if (this.distance >= this.nextZombieDistance) {
      this.spawnEnemyWave();
      this.nextZombieDistance = this.distance + Math.max(80, 190 - this.wave * 8);
    }

    // Update Enemies & Enemy Shooting
    this.updateEnemies(dt);

    // Update Enemy Bullets & Collisions with Player
    this.updateEnemyBullets(dt);

    // Update Dropped Items & Magnet Pickup
    this.updateDroppedItems(dt);

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * (dt / 16.66);
      p.y += p.vy * (dt / 16.66);
      p.life += dt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * (dt / 16.66);
      ft.life += dt;
      ft.alpha = Math.max(0, 1 - ft.life / 800);
      if (ft.life >= 800) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Screen Shake & Flash decay
    if (this.screenShake > 0) this.screenShake *= 0.88;
    if (this.flashAlpha > 0) this.flashAlpha -= dt * 0.002;

    // Broadcast stats to UI
    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.getStats(), 1, this.player.subWeapon, 0);
    }
  }

  /**
   * Player Continuous Auto-Fire (Main Cannon + Sub-Weapons)
   */
  private updatePlayerWeapons(dt: number) {
    this.player.shootCooldown -= dt;
    this.player.subWeaponCooldown -= dt;

    const fireInterval = this.feverTimer > 0 ? 80 : 110;

    // 1. Main Cannon
    if (this.player.shootCooldown <= 0) {
      this.player.shootCooldown = fireInterval;
      this.fireMainCannon();
    }

    // 2. Sub-Weapon: Homing Missiles
    if (this.player.subWeapon === 'missile') {
      const missileInterval = 380 - this.player.subWeaponLevel * 40;
      if (this.player.subWeaponCooldown <= 0) {
        this.player.subWeaponCooldown = missileInterval;
        this.fireHomingMissiles();
      }
    }

    // 3. Sub-Weapon: Continuous Piercing Laser
    this.isFiringLaser = this.player.subWeapon === 'laser';
    if (this.isFiringLaser) {
      this.fireLaserBeam(dt);
    }
  }

  private fireMainCannon() {
    this.audio.playShoot('pistol');
    const { x, y, mainWeaponLevel } = this.player;
    const bulletSpeed = 18;
    const baseDamage = 24 + mainWeaponLevel * 6;
    const isGold = mainWeaponLevel >= 5 || this.feverTimer > 0;
    const color = isGold ? '#f59e0b' : '#38bdf8';

    if (mainWeaponLevel === 1) {
      // Twin straight shot
      this.bullets.push(
        { id: Math.random(), x: x - 9, y: y - 16, vx: 0, vy: -bulletSpeed, radius: 4, damage: baseDamage, color, pierce: 1, isPlayer: true },
        { id: Math.random(), x: x + 9, y: y - 16, vx: 0, vy: -bulletSpeed, radius: 4, damage: baseDamage, color, pierce: 1, isPlayer: true }
      );
    } else if (mainWeaponLevel === 2) {
      // 3-way spread
      this.bullets.push(
        { id: Math.random(), x: x, y: y - 20, vx: 0, vy: -bulletSpeed, radius: 4.5, damage: baseDamage, color, pierce: 1, isPlayer: true },
        { id: Math.random(), x: x - 12, y: y - 14, vx: -2.2, vy: -bulletSpeed * 0.98, radius: 4, damage: baseDamage, color, pierce: 1, isPlayer: true },
        { id: Math.random(), x: x + 12, y: y - 14, vx: 2.2, vy: -bulletSpeed * 0.98, radius: 4, damage: baseDamage, color, pierce: 1, isPlayer: true }
      );
    } else if (mainWeaponLevel === 3) {
      // 5-way spread
      const angles = [-0.22, -0.11, 0, 0.11, 0.22];
      for (const a of angles) {
        this.bullets.push({
          id: Math.random(),
          x: x + Math.sin(a) * 14,
          y: y - 18,
          vx: Math.sin(a) * bulletSpeed,
          vy: -Math.cos(a) * bulletSpeed,
          radius: a === 0 ? 5 : 4,
          damage: baseDamage,
          color,
          pierce: 1,
          isPlayer: true,
        });
      }
    } else if (mainWeaponLevel === 4) {
      // 7-way spread
      const angles = [-0.32, -0.20, -0.09, 0, 0.09, 0.20, 0.32];
      for (const a of angles) {
        this.bullets.push({
          id: Math.random(),
          x: x + Math.sin(a) * 16,
          y: y - 18,
          vx: Math.sin(a) * bulletSpeed,
          vy: -Math.cos(a) * bulletSpeed,
          radius: a === 0 ? 5.5 : 4,
          damage: baseDamage,
          color,
          pierce: a === 0 ? 2 : 1,
          isPlayer: true,
        });
      }
    } else {
      // Level 5 (MAX OVERDRIVE): 9-way barrage + dual heavy core
      const angles = [-0.42, -0.30, -0.18, -0.08, 0, 0.08, 0.18, 0.30, 0.42];
      for (const a of angles) {
        this.bullets.push({
          id: Math.random(),
          x: x + Math.sin(a) * 18,
          y: y - 18,
          vx: Math.sin(a) * bulletSpeed,
          vy: -Math.cos(a) * bulletSpeed,
          radius: Math.abs(a) < 0.1 ? 6 : 4.5,
          damage: baseDamage,
          color: '#f59e0b',
          pierce: Math.abs(a) < 0.1 ? 3 : 1,
          isPlayer: true,
        });
      }
    }
  }

  private fireHomingMissiles() {
    this.audio.playShoot('rocket');
    const { x, y } = this.player;

    // Launch 2 micro-missiles from left and right wing pods
    this.bullets.push(
      {
        id: Math.random(),
        x: x - 18,
        y: y - 6,
        vx: -2.5,
        vy: -7,
        radius: 5,
        damage: 55 + this.player.subWeaponLevel * 15,
        color: '#ef4444',
        pierce: 1,
        isPlayer: true,
        isMissile: true,
        life: 0,
      },
      {
        id: Math.random(),
        x: x + 18,
        y: y - 6,
        vx: 2.5,
        vy: -7,
        radius: 5,
        damage: 55 + this.player.subWeaponLevel * 15,
        color: '#ef4444',
        pierce: 1,
        isPlayer: true,
        isMissile: true,
        life: 0,
      }
    );
  }

  private fireLaserBeam(dt: number) {
    const { x, y, subWeaponLevel } = this.player;
    const beamDmg = (14 + subWeaponLevel * 6) * (dt / 16.66);
    const leftBeamX = x - 16;
    const rightBeamX = x + 16;

    // Check all enemy aircraft in path of the two parallel laser columns
    for (const z of this.zombies) {
      if (z.y < y - 10) {
        const hitLeft = Math.abs(z.x - leftBeamX) <= z.radius + 6;
        const hitRight = Math.abs(z.x - rightBeamX) <= z.radius + 6;
        if (hitLeft || hitRight) {
          z.hp -= beamDmg;
          z.hitFlash = 0.6;
          this.spawnSpark(z.x, z.y, '#38bdf8');
        }
      }
    }
  }

  /**
   * Update Player Bullets & Homing Missiles Movement & Collision
   */
  private updatePlayerBullets(dt: number) {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];

      // Homing missile target tracking
      if (b.isMissile) {
        b.life = (b.life || 0) + dt;

        // Find closest active enemy
        let closestZ: Zombie | null = null;
        let minDistSq = 450 * 450;
        for (const z of this.zombies) {
          if (z.y < b.y + 40) {
            const dx = z.x - b.x;
            const dy = z.y - b.y;
            const dSq = dx * dx + dy * dy;
            if (dSq < minDistSq) {
              minDistSq = dSq;
              closestZ = z;
            }
          }
        }

        if (closestZ) {
          const targetAngle = Math.atan2(closestZ.y - b.y, closestZ.x - b.x);
          const currentAngle = Math.atan2(b.vy, b.vx);
          let diff = targetAngle - currentAngle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const turn = Math.max(-0.16, Math.min(0.16, diff));
          const newAngle = currentAngle + turn;
          const speed = 12;
          b.vx = Math.cos(newAngle) * speed;
          b.vy = Math.sin(newAngle) * speed;
        }

        // Smoke particles behind missile
        if (Math.random() < 0.5) {
          this.particles.push({
            x: b.x,
            y: b.y + 4,
            vx: (Math.random() - 0.5) * 1.5,
            vy: 2 + Math.random() * 2,
            color: '#94a3b8',
            radius: 2 + Math.random() * 2,
            alpha: 0.7,
            life: 0,
            maxLife: 180,
          });
        }
      }

      b.x += b.vx * (dt / 16.66);
      b.y += b.vy * (dt / 16.66);

      // Boundary check
      if (b.y < -30 || b.y > this.canvas.height + 40 || b.x < -20 || b.x > this.canvas.width + 20) {
        this.bullets.splice(bi, 1);
        continue;
      }

      // Collision with Enemy Aircraft
      let bulletDead = false;
      for (let zi = this.zombies.length - 1; zi >= 0; zi--) {
        const z = this.zombies[zi];
        const dx = b.x - z.x;
        const dy = b.y - z.y;
        const hitRadius = b.radius + z.radius;

        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          z.hitFlash = 1;
          z.hp -= b.damage;
          this.audio.playHit();
          this.spawnSpark(b.x, b.y, b.color);

          if (b.isMissile) {
            this.audio.playExplosion();
            this.screenShake = 6;
            this.spawnExplosion(b.x, b.y, 45);
          }

          // Check Enemy Death
          if (z.hp <= 0) {
            this.destroyEnemy(zi);
          }

          b.pierce--;
          if (b.pierce <= 0) {
            bulletDead = true;
            break;
          }
        }
      }

      if (bulletDead) {
        this.bullets.splice(bi, 1);
      }
    }
  }

  private destroyEnemy(zi: number) {
    const z = this.zombies[zi];
    this.audio.playZombieDie();
    this.score += z.scoreValue;
    this.zombiesKilled++;
    this.spawnFlakParticles(z.x, z.y, z.color);
    this.spawnExplosion(z.x, z.y, z.radius * 2);
    this.addFloatingText(z.x, z.y - 12, `+${z.scoreValue}`, '#fbbf24', 14);

    // Combo system
    const now = performance.now();
    if (now - this.lastKillTime < 1400) {
      this.combo++;
    } else {
      this.combo = 1;
    }
    this.lastKillTime = now;

    if (this.combo === 15 || this.combo === 30) {
      this.feverTimer = 6000;
      this.audio.playFever();
      this.addFloatingText(this.player.x, this.player.y - 60, '🔥 FEVER TIME! 🔥', '#ec4899', 24);
    }

    // Dropped Powerup Item chance
    let dropChance = 0.22;
    if (z.type === 'gunship' || z.type === 'tank') dropChance = 0.95;
    if (z.type === 'boss' || z.type === 'mothership') dropChance = 1.0;

    if (Math.random() < dropChance) {
      this.spawnDroppedItem(z.x, z.y, z.type === 'boss');
    }

    this.zombies.splice(zi, 1);
  }

  /**
   * Spawn Dropped Powerup Item Capsule ([ P ], [ M ], [ L ], [ B ], [ S ])
   */
  private spawnDroppedItem(x: number, y: number, isBoss: boolean = false) {
    const types: PowerupType[] = isBoss
      ? ['bomb', 'power', 'shield']
      : ['power', 'power', 'missile', 'laser', 'shield', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];

    let label = 'P';
    let color = '#ef4444'; // Red for Power Up
    let bgGlow = 'rgba(239, 68, 68, 0.6)';

    if (type === 'missile') {
      label = 'M';
      color = '#10b981'; // Green for Missiles
      bgGlow = 'rgba(16, 185, 129, 0.6)';
    } else if (type === 'laser') {
      label = 'L';
      color = '#38bdf8'; // Cyan for Laser
      bgGlow = 'rgba(56, 189, 248, 0.6)';
    } else if (type === 'bomb') {
      label = 'B';
      color = '#f59e0b'; // Amber for Bomb
      bgGlow = 'rgba(245, 158, 11, 0.6)';
    } else if (type === 'shield') {
      label = 'S';
      color = '#06b6d4'; // Ice cyan for Shield
      bgGlow = 'rgba(6, 182, 212, 0.6)';
    }

    this.droppedItems.push({
      id: Math.random(),
      type,
      x: Math.max(20, Math.min(this.canvas.width - 20, x)),
      y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1.2 + Math.random() * 0.8,
      label,
      color,
      bgGlow,
      life: 0,
      radius: 14,
    });
  }

  private updateDroppedItems(dt: number) {
    const { player } = this;
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const item = this.droppedItems[i];
      item.life += dt;
      item.x += item.vx * (dt / 16.66);
      item.y += item.vy * (dt / 16.66);

      // Bounce off side walls
      if (item.x < 18 || item.x > this.canvas.width - 18) {
        item.vx *= -1;
      }

      // Magnet pull towards player if within 75px
      const dx = player.x - item.x;
      const dy = player.y - item.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < 75 * 75) {
        const dist = Math.sqrt(distSq) || 1;
        item.vx += (dx / dist) * 0.9;
        item.vy += (dy / dist) * 0.9;
      }

      // Collect item on collision (< 26px)
      if (distSq < 26 * 26) {
        this.collectPowerup(item);
        this.droppedItems.splice(i, 1);
        continue;
      }

      // Despawn if fallen off bottom
      if (item.y > this.canvas.height + 30) {
        this.droppedItems.splice(i, 1);
      }
    }
  }

  private collectPowerup(item: DroppedItem) {
    this.audio.playPowerup();
    this.spawnExplosion(item.x, item.y, 28);

    switch (item.type) {
      case 'power':
        if (this.player.mainWeaponLevel < 5) {
          this.player.mainWeaponLevel++;
          this.addFloatingText(this.player.x, this.player.y - 45, `[P] 火力提升 Lv.${this.player.mainWeaponLevel}!`, '#f59e0b', 20);
        } else {
          this.score += 500;
          this.addFloatingText(this.player.x, this.player.y - 45, `[P] MAX OVERDRIVE +500!`, '#f59e0b', 20);
        }
        break;

      case 'missile':
        this.player.subWeapon = 'missile';
        this.player.subWeaponLevel = Math.min(3, this.player.subWeaponLevel + 1);
        this.addFloatingText(this.player.x, this.player.y - 45, `[M] 外挂追踪飞弹 Lv.${this.player.subWeaponLevel}!`, '#10b981', 20);
        break;

      case 'laser':
        this.player.subWeapon = 'laser';
        this.player.subWeaponLevel = Math.min(3, this.player.subWeaponLevel + 1);
        this.addFloatingText(this.player.x, this.player.y - 45, `[L] 外挂高能激光 Lv.${this.player.subWeaponLevel}!`, '#38bdf8', 20);
        break;

      case 'bomb':
        this.player.bombs = Math.min(this.player.maxBombs, this.player.bombs + 1);
        this.addFloatingText(this.player.x, this.player.y - 45, `[B] 战术清屏炸弹 +1!`, '#f59e0b', 22);
        break;

      case 'shield':
        this.player.shield = Math.min(this.player.maxShield, this.player.shield + 45);
        this.addFloatingText(this.player.x, this.player.y - 45, `[S] 偏折护盾充能!`, '#06b6d4', 20);
        break;
    }
  }

  /**
   * Spawn Enemy Aircraft
   */
  private spawnEnemyWave() {
    const W = this.canvas.width;
    const isEarly = this.wave === 1;

    // Boss Titan Mothership spawn every 5 waves
    if (this.wave % 5 === 0 && !this.zombies.some((z) => z.type === 'boss' || z.type === 'mothership')) {
      this.audio.playBossAlert();
      this.screenShake = 14;
      this.addFloatingText(W / 2, 90, '⚠️ 敌军泰坦母舰降临 ⚠️', '#ef4444', 28);
      const bossHp = 420 + this.wave * 120;
      this.zombies.push({
        id: Math.random(),
        type: 'mothership',
        x: W / 2,
        y: -90,
        radius: 40,
        hp: bossHp,
        maxHp: bossHp,
        speed: 0.35,
        color: '#dc2626',
        skinId: 999,
        hitFlash: 0,
        scoreValue: 800,
        walkFrame: 0,
        shootCooldown: 60,
        shootInterval: 750,
      });
      return;
    }

    // Standard squadron wave (3 to 8 craft)
    const count = isEarly ? 3 : Math.min(8, 3 + Math.floor(this.wave * 0.8));
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let type: Zombie['type'] = 'scout';
      let radius = 16;
      let hp = 18 + this.wave * 5;
      let speed = 0.65 + Math.random() * 0.35;
      let color = '#22c55e';
      let scoreVal = 30;
      let interval = 1200;

      if (!isEarly && rand < 0.28) {
        type = 'interceptor';
        radius = 15;
        hp = 22 + this.wave * 5;
        speed = 1.25 + Math.random() * 0.4;
        color = '#a855f7';
        scoreVal = 45;
        interval = 900;
      } else if (!isEarly && rand < 0.52) {
        type = 'gunship';
        radius = 24;
        hp = 80 + this.wave * 25;
        speed = 0.4 + Math.random() * 0.2;
        color = '#eab308';
        scoreVal = 80;
        interval = 1400;
      } else if (!isEarly && rand < 0.68) {
        type = 'kamikaze';
        radius = 16;
        hp = 25 + this.wave * 6;
        speed = 0.95;
        color = '#f97316';
        scoreVal = 50;
        interval = 1100;
      }

      this.zombies.push({
        id: Math.random(),
        type,
        x: 35 + Math.random() * (W - 70),
        y: -35 - i * 40,
        radius,
        hp,
        maxHp: hp,
        speed,
        color,
        skinId: Math.floor(Math.random() * 10),
        hitFlash: 0,
        scoreValue: scoreVal,
        walkFrame: Math.random() * 10,
        shootCooldown: 400 + Math.random() * 600,
        shootInterval: interval,
      });
    }
  }

  /**
   * Update Enemies Movement & Enemy Shooting (Danmaku)
   */
  private updateEnemies(dt: number) {
    const { player } = this;
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.y += z.speed * (dt / 16.66);
      z.walkFrame += z.speed * (dt / 16.66) * 0.12;
      if (z.hitFlash > 0) z.hitFlash -= dt * 0.01;

      // Enemy Shooting logic
      z.shootCooldown -= dt;
      if (z.shootCooldown <= 0 && z.y > 20 && z.y < this.canvas.height - 120) {
        z.shootCooldown = z.shootInterval;
        this.enemyFire(z);
      }

      // Physical contact collision with Player
      const dx = z.x - player.x;
      const dy = z.y - player.y;
      const contactDist = z.radius + 18;
      if (dx * dx + dy * dy <= contactDist * contactDist) {
        if (player.invulnerableTimer <= 0) {
          this.damagePlayer(25);
          this.spawnExplosion(z.x, z.y, 40);
        }
        z.hp -= 80;
        if (z.hp <= 0) {
          this.destroyEnemy(i);
          continue;
        }
      }

      // Despawn off bottom screen
      if (z.y > this.canvas.height + 60) {
        this.zombies.splice(i, 1);
      }
    }
  }

  /**
   * Enemy Firing System (Aimed shots, 3-way/5-way spread, Heavy plasma)
   */
  private enemyFire(z: Zombie) {
    if (this.enemyBullets.length > 120) return;
    const { player } = this;

    if (z.type === 'mothership' || z.type === 'boss') {
      // Titan Boss: Radial 8-bullet burst or heavy plasma twin orbs
      const isBurst = Math.random() > 0.45;
      if (isBurst) {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          this.enemyBullets.push({
            id: Math.random(),
            x: z.x,
            y: z.y,
            vx: Math.cos(a) * 3.8,
            vy: Math.sin(a) * 3.8,
            radius: 5,
            damage: 18,
            color: '#ef4444',
            type: 'spread',
          });
        }
      } else {
        // Twin Heavy Plasma Cannons
        this.enemyBullets.push(
          { id: Math.random(), x: z.x - 22, y: z.y + 20, vx: -0.8, vy: 4.8, radius: 9, damage: 32, color: '#f97316', type: 'heavy' },
          { id: Math.random(), x: z.x + 22, y: z.y + 20, vx: 0.8, vy: 4.8, radius: 9, damage: 32, color: '#f97316', type: 'heavy' }
        );
      }
    } else if (z.type === 'gunship' || z.type === 'tank') {
      // 3-way spread downwards
      const baseAngle = Math.atan2(player.y - z.y, player.x - z.x);
      const spreads = [-0.25, 0, 0.25];
      for (const sp of spreads) {
        const a = baseAngle + sp;
        this.enemyBullets.push({
          id: Math.random(),
          x: z.x,
          y: z.y + 12,
          vx: Math.cos(a) * 4.2,
          vy: Math.sin(a) * 4.2,
          radius: 5,
          damage: 15,
          color: '#eab308',
          type: 'spread',
        });
      }
    } else if (z.type === 'interceptor') {
      // Fast aimed twin bullet
      const angle = Math.atan2(player.y - z.y, player.x - z.x);
      this.enemyBullets.push({
        id: Math.random(),
        x: z.x,
        y: z.y + 10,
        vx: Math.cos(angle) * 5.2,
        vy: Math.sin(angle) * 5.2,
        radius: 4.5,
        damage: 14,
        color: '#a855f7',
        type: 'aimed',
      });
    } else {
      // Standard scout aimed single bullet
      const angle = Math.atan2(player.y - z.y, player.x - z.x);
      this.enemyBullets.push({
        id: Math.random(),
        x: z.x,
        y: z.y + 8,
        vx: Math.cos(angle) * 4.2,
        vy: Math.sin(angle) * 4.2,
        radius: 4,
        damage: 12,
        color: '#ef4444',
        type: 'normal',
      });
    }
  }

  /**
   * Update Enemy Bullets & Collisions with Player
   */
  private updateEnemyBullets(dt: number) {
    const { player } = this;
    const hitBoxRadius = 14; // Tight, authentic arcade core hitbox

    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * (dt / 16.66);
      b.y += b.vy * (dt / 16.66);

      // Despawn off screen bounds
      if (b.y > this.canvas.height + 30 || b.y < -30 || b.x < -20 || b.x > this.canvas.width + 20) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      // Check collision with Player
      const dx = b.x - player.x;
      const dy = b.y - player.y;
      const distSq = dx * dx + dy * dy;
      const targetRadius = b.radius + hitBoxRadius;

      if (distSq <= targetRadius * targetRadius) {
        if (player.invulnerableTimer <= 0) {
          this.damagePlayer(b.damage);
        }
        this.spawnSpark(b.x, b.y, b.color);
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  private damagePlayer(amount: number) {
    const { player } = this;
    this.audio.playHit();
    this.screenShake = 8;
    this.flashAlpha = 0.35;

    if (player.shield > 0) {
      player.shield = Math.max(0, player.shield - amount);
      this.spawnSpark(player.x, player.y, '#38bdf8');
      this.addFloatingText(player.x, player.y - 30, `🛡️ 护盾 -${amount}`, '#38bdf8', 15);
      player.invulnerableTimer = 600; // 0.6s grace
    } else {
      player.hp = Math.max(0, player.hp - amount);
      this.addFloatingText(player.x, player.y - 30, `-${amount} HP`, '#ef4444', 18);
      player.invulnerableTimer = 1200; // 1.2s grace
      if (player.hp <= 0) {
        this.triggerGameOver();
      }
    }
  }

  private triggerGameOver() {
    this.isGameOver = true;
    this.isRunning = false;
    this.audio.playGameOver();
    this.screenShake = 18;
    this.spawnExplosion(this.player.x, this.player.y, 80);
    if (this.onGameOver) {
      this.onGameOver(this.getStats());
    }
  }

  // --- Particles & FX ---
  private spawnSpark(x: number, y: number, color: string) {
    if (this.particles.length > 90) return;
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color,
        radius: 2 + Math.random() * 2,
        alpha: 1,
        life: 0,
        maxLife: 200 + Math.random() * 150,
      });
    }
  }

  private spawnFlakParticles(x: number, y: number, color: string) {
    if (this.particles.length > 90) return;
    const count = this.particles.length > 50 ? 5 : 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 1,
        color: Math.random() < 0.4 ? '#f59e0b' : Math.random() < 0.7 ? color : '#94a3b8',
        radius: 2 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 250 + Math.random() * 200,
      });
    }
  }

  private spawnExplosion(x: number, y: number, radius: number) {
    if (this.particles.length > 90) return;
    const count = this.particles.length > 40 ? 8 : 14;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * (radius * 0.1);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
        radius: 3 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 300 + Math.random() * 150,
      });
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string, size: number = 16) {
    if (this.floatingTexts.length > 12) {
      this.floatingTexts.shift();
    }
    this.floatingTexts.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      size,
      alpha: 1,
      vy: -1.5,
      life: 0,
    });
  }

  // --- Rendering Pipeline ---
  private render() {
    const { ctx, canvas, player } = this;
    const W = canvas.width;
    const H = canvas.height;

    // 1. Clear physical canvas with Deep Space gradient
    ctx.clearRect(0, 0, W, H);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, '#030712');
    skyGrad.addColorStop(0.5, '#070e24');
    skyGrad.addColorStop(1, '#0b1638');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    // Screen shake
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }
    ctx.fillRect(-50, -50, W + 100, H + 100);

    // Parallax Starfield & Speed streaks
    for (const s of this.stars) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      const streakLen = s.size * (1.8 + s.speed * 1.5);
      ctx.fillRect(s.x, s.y, s.size, streakLen);
      ctx.restore();
    }

    // Dynamic cyber flight grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.07)';
    ctx.lineWidth = 1;
    const gridOffset = (this.distance * 1.6) % 50;
    for (let y = gridOffset; y < H; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x < W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // High-altitude flight corridor boundary laser guides
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(10, H);
    ctx.moveTo(W - 10, 0); ctx.lineTo(W - 10, H);
    ctx.stroke();

    // Side chevron marks
    const chevronOffset = (this.distance * 2) % 60;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.lineWidth = 1.5;
    for (let y = chevronOffset; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(12, y); ctx.lineTo(18, y + 8); ctx.lineTo(12, y + 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(W - 12, y); ctx.lineTo(W - 18, y + 8); ctx.lineTo(W - 12, y + 16);
      ctx.stroke();
    }

    // 2. Render Continuous Laser Beams (if laser sub-weapon active)
    if (this.isFiringLaser) {
      this.renderLaserBeams();
    }

    // 3. Render Dropped Items
    for (const item of this.droppedItems) {
      renderPowerupItem(ctx, item);
    }

    // 4. Render Enemy Aircraft
    for (const z of this.zombies) {
      this.renderEnemyAircraft(z);
    }

    // 5. Render Enemy Bullets (Danmaku)
    for (const eb of this.enemyBullets) {
      renderEnemyBullet(ctx, eb);
    }

    // 6. Render Player Bullets & Homing Missiles
    for (const b of this.bullets) {
      if (b.isMissile) {
        renderHomingMissile(ctx, b);
      } else {
        const r = b.radius;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x - r, b.y - r * 1.6, r * 2, r * 3.2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(b.x - r * 0.4, b.y - r * 1.1, r * 0.8, r * 2.2);
      }
    }

    // 7. Render Player Fighter Ship
    this.renderPlayerShip();

    // 8. Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Render Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `900 ${ft.size}px monospace, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }

    // 10. Damage / Nuke Flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 11. Fever Border Glow
    if (this.feverTimer > 0) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, W - 8, H - 8);
    }

    ctx.restore();
  }

  private renderLaserBeams() {
    const { ctx, player } = this;
    const leftX = player.x - 16;
    const rightX = player.x + 16;
    const beamW = 4 + player.subWeaponLevel * 2;

    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 14;

    for (const bx of [leftX, rightX]) {
      // Outer beam
      ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.fillRect(bx - beamW / 2, 0, beamW, player.y - 8);
      // Inner hot core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx - beamW * 0.25, 0, beamW * 0.5, player.y - 8);
    }
    ctx.restore();
  }

  private renderEnemyAircraft(z: Zombie) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(z.x, z.y);

    const walkCycle = Math.floor(z.walkFrame * 2) % 2;
    const isHit = z.hitFlash > 0;
    const sprite = getZombieSprite(z.type, walkCycle, isHit);

    const sw = sprite.width;
    const sh = sprite.height;
    ctx.drawImage(sprite, -sw / 2, -sh / 2, sw, sh);

    // HP bar if injured or boss
    if (z.hp < z.maxHp || z.type === 'mothership' || z.type === 'boss') {
      const barW = Math.max(30, z.radius * 2.2);
      const barH = 4;
      const barY = -sh / 2 - 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, barY, barW, barH);
      ctx.fillStyle = z.color;
      ctx.fillRect(-barW / 2, barY, barW * Math.max(0, z.hp / z.maxHp), barH);
    }
    ctx.restore();
  }

  private renderPlayerShip() {
    const { ctx, player } = this;
    ctx.save();

    const isInvul = player.invulnerableTimer > 0;
    if (isInvul && Math.floor(performance.now() / 70) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    // Forcefield Shield Dome around player if shield > 0
    if (player.shield > 0) {
      ctx.save();
      const pulse = Math.sin(performance.now() * 0.008) * 2;
      const r = player.size * 0.65 + pulse;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fill();
      ctx.restore();
    }

    ctx.translate(player.x, player.y);
    ctx.rotate(player.bankAngle);

    // Subtle aircraft shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-player.size * 0.35, player.size * 0.4, player.size * 0.7, 4);

    // Draw single ace fighter with NodeMonke in the transparent cockpit & wing pods
    const sprite = this.monkeCanvas || getFallbackMonkeSprite(this.monkeId);
    ctx.translate(-player.size / 2, -player.size / 2);
    renderFighterJet(
      ctx,
      sprite,
      player.mainWeaponLevel,
      player.subWeapon,
      player.subWeaponLevel,
      player.thrusterFrame,
      this.feverTimer > 0,
      player.size
    );

    ctx.restore();
  }

  public getStats(): GameStats {
    return {
      score: this.score,
      zombiesKilled: this.zombiesKilled,
      wave: this.wave,
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      shield: Math.round(this.player.shield),
      maxShield: this.player.maxShield,
      bombs: this.player.bombs,
      powerLevel: this.player.mainWeaponLevel,
      subWeapon: this.player.subWeapon,
      subWeaponLevel: this.player.subWeaponLevel,
      combo: this.combo,
      isFever: this.feverTimer > 0,
      isPaused: this.isPaused,
      maxCrowd: 1,
      gatesPassed: 0,
      armor: 0,
      maxArmor: 0,
      nukeCharge: Math.min(100, Math.round((this.player.bombs / this.player.maxBombs) * 100)),
      freezeTimeLeft: 0,
    };
  }
}
