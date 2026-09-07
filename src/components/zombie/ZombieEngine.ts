// src/components/zombie/ZombieEngine.ts
import type {
  WeaponType,
  WeaponConfig,
  Gate,
  GateOp,
  Zombie,
  Bullet,
  MonkeUnit,
  Particle,
  FloatingText,
  GameStats,
} from './types';
import { ZombieAudio } from './ZombieAudio';
import { getMonkeImageUrl } from '../../utils/api';
import { getZombieSprite, getFallbackMonkeSprite, createMonkeCanvas } from './ZombieSprites';

export const WEAPON_CONFIGS: Record<WeaponType, WeaponConfig> = {
  pistol: {
    type: 'pistol',
    nameZh: '双枪速射',
    nameEn: 'Dual Blasters',
    icon: '🔫',
    fireInterval: 120,
    bulletSpeed: 16,
    damage: 22,
    bulletColor: '#38bdf8', // sky blue
    bulletRadius: 4,
  },
  shotgun: {
    type: 'shotgun',
    nameZh: '重型散弹',
    nameEn: 'Heavy Shotgun',
    icon: '💥',
    fireInterval: 320,
    bulletSpeed: 13,
    damage: 18,
    bulletColor: '#f97316', // orange
    bulletRadius: 4,
    spreadCount: 5,
    spreadAngle: 0.38,
    durationMs: 12000,
  },
  gatling: {
    type: 'gatling',
    nameZh: '加特林暴风',
    nameEn: 'Gatling Storm',
    icon: '⚡',
    fireInterval: 75,
    bulletSpeed: 18,
    damage: 12,
    bulletColor: '#facc15', // yellow gold
    bulletRadius: 3,
    durationMs: 12000,
  },
  laser: {
    type: 'laser',
    nameZh: '贯穿激光',
    nameEn: 'Piercing Laser',
    icon: '🔮',
    fireInterval: 240,
    bulletSpeed: 22,
    damage: 28,
    bulletColor: '#a855f7', // purple
    bulletRadius: 4.5,
    pierce: 4,
    durationMs: 12000,
  },
  rocket: {
    type: 'rocket',
    nameZh: '高爆火箭筒',
    nameEn: 'RPG Launcher',
    icon: '🚀',
    fireInterval: 450,
    bulletSpeed: 11,
    damage: 60,
    bulletColor: '#ef4444', // red
    bulletRadius: 6,
    splashRadius: 90,
    durationMs: 12000,
  },
};

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

  // Player state
  public playerX: number = 240;
  public playerTargetX: number = 240;
  public playerY: number = 680;
  public crowdCount: number = 3;
  public units: MonkeUnit[] = [];
  public currentWeapon: WeaponType = 'pistol';
  public weaponExpiresAt: number = 0;
  public monkeImage: HTMLImageElement | null = null;
  public monkeCanvas: HTMLCanvasElement | null = null;
  public monkeId: number = 209;

  // Entities
  public bullets: Bullet[] = [];
  public gates: Gate[] = [];
  public zombies: Zombie[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  // Spawner & Timeline
  public distance: number = 0;
  public speed: number = 1.6; // gentle downward scroll speed
  public wave: number = 1;
  public score: number = 0;
  public zombiesKilled: number = 0;
  public gatesPassed: number = 0;
  public maxCrowdReached: number = 5;

  private nextGateDistance: number = 80;
  private nextZombieDistance: number = 260;
  private screenShake: number = 0;
  private redFlashAlpha: number = 0;

  // Callbacks
  public onStatsUpdate?: (stats: GameStats, crowdCount: number, weapon: WeaponType, weaponTimeLeft: number) => void;
  public onGameOver?: (stats: GameStats) => void;

  constructor(canvas: HTMLCanvasElement, audio: ZombieAudio) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Failed to get 2d context');
    this.ctx = context;
    this.audio = audio;
    this.reset();
  }

  public reset(monkeId: number = 209) {
    this.monkeId = monkeId;
    this.isGameOver = false;
    this.isPaused = false;
    this.crowdCount = 5;
    this.currentWeapon = 'pistol';
    this.weaponExpiresAt = 0;
    this.distance = 0;
    this.wave = 1;
    this.score = 0;
    this.zombiesKilled = 0;
    this.gatesPassed = 0;
    this.maxCrowdReached = 5;
    this.bullets = [];
    this.gates = [];
    this.zombies = [];
    this.particles = [];
    this.floatingTexts = [];
    this.playerX = this.canvas.width / 2;
    this.playerTargetX = this.canvas.width / 2;
    this.playerY = this.canvas.height - 110;
    this.nextGateDistance = 80;
    this.nextZombieDistance = 260;
    this.rebuildUnits();
    this.loadMonkeImage(monkeId);
  }

  public setMonkeId(id: number) {
    this.monkeId = id;
    this.loadMonkeImage(id);
    for (const unit of this.units) {
      unit.monkeId = id;
    }
  }

  private loadMonkeImage(id: number) {
    this.monkeCanvas = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      this.monkeImage = img;
      this.monkeCanvas = createMonkeCanvas(img);
    };
    img.src = getMonkeImageUrl(id);
  }

  public setPlayerTargetX(x: number) {
    this.playerTargetX = Math.max(35, Math.min(this.canvas.width - 35, x));
  }

  public movePlayerBy(deltaX: number) {
    this.setPlayerTargetX(this.playerTargetX + deltaX);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
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

  // --- Formation algorithm for dynamic squad ---
  private rebuildUnits() {
    const n = Math.max(1, this.crowdCount);
    if (n > this.maxCrowdReached) {
      this.maxCrowdReached = n;
    }
    const newUnits: MonkeUnit[] = [];

    // Compact hexagonal / phyllotaxis layout (visual representation capped at 65 units for 60 FPS)
    const visualCount = Math.min(65, n);
    for (let i = 0; i < visualCount; i++) {
      let ox = 0;
      let oy = 0;
      if (i > 0) {
        const phi = i * 2.399963; // golden angle
        const r = 16 * Math.sqrt(i); // packing radius
        ox = Math.cos(phi) * r;
        oy = Math.sin(phi) * r * 0.7; // slight vertical compression
      }
      newUnits.push({
        id: i,
        offsetX: ox,
        offsetY: oy,
        x: this.playerX + ox,
        y: this.playerY + oy,
        size: 32,
        shootCooldown: Math.random() * 80,
        monkeId: this.monkeId,
        walkFrame: Math.random() * 10,
      });
    }
    this.units = newUnits;
  }

  public updateCrowd(delta: number, isMultiply: boolean = false) {
    const old = this.crowdCount;
    if (isMultiply) {
      this.crowdCount = Math.floor(this.crowdCount * delta);
    } else {
      this.crowdCount += delta;
    }

    if (this.crowdCount > old) {
      this.audio.playGatePass(true);
      this.addFloatingText(this.playerX, this.playerY - 40, `+${this.crowdCount - old} MONKES!`, '#4ade80', 20);
    } else if (this.crowdCount < old) {
      this.audio.playGatePass(false);
      this.addFloatingText(this.playerX, this.playerY - 40, `${this.crowdCount - old}`, '#ef4444', 22);
      this.redFlashAlpha = 0.35;
    }

    if (this.crowdCount <= 0) {
      this.crowdCount = 0;
      this.triggerGameOver();
    } else {
      this.rebuildUnits();
    }
  }

  public setWeapon(type: WeaponType) {
    this.currentWeapon = type;
    const config = WEAPON_CONFIGS[type];
    this.weaponExpiresAt = performance.now() + (config.durationMs || 12000);
    this.audio.playPowerup();
    this.addFloatingText(this.playerX, this.playerY - 60, `${config.icon} ${config.nameZh}!`, config.bulletColor, 22);
  }

  public triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.audio.playGameOver();
    if (this.onGameOver) {
      this.onGameOver(this.getStats());
    }
  }

  public getStats(): GameStats {
    return {
      score: this.score,
      zombiesKilled: this.zombiesKilled,
      wave: this.wave,
      maxCrowd: this.maxCrowdReached,
      gatesPassed: this.gatesPassed,
    };
  }

  // --- Main Update Loop ---
  private loop = (timestamp: number) => {
    if (!this.isRunning) return;

    const dt = Math.min(40, timestamp - this.lastTime);
    this.lastTime = timestamp;

    if (!this.isPaused && !this.isGameOver) {
      this.update(dt);
    }

    this.render();
    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.distance += this.speed * (dt / 16.66);
    this.wave = 1 + Math.floor(this.distance / 1200);

    // Player position lerp
    this.playerX += (this.playerTargetX - this.playerX) * 0.22;

    // Weapon timer check
    if (this.currentWeapon !== 'pistol' && performance.now() > this.weaponExpiresAt) {
      this.currentWeapon = 'pistol';
      this.addFloatingText(this.playerX, this.playerY - 40, 'Blasters Ready', '#94a3b8', 16);
    }

    // Units position and dynamic firepower scaling
    const weaponCfg = WEAPON_CONFIGS[this.currentWeapon];
    const totalCrowd = Math.max(1, this.crowdCount);
    // When crowd is large, aggregate shooting across front 12 shooters with scaled damage
    const activeShooters = Math.min(this.units.length, 12);
    const damageMult = totalCrowd / activeShooters;

    for (let i = 0; i < this.units.length; i++) {
      const unit = this.units[i];
      const tx = this.playerX + unit.offsetX;
      const ty = this.playerY + unit.offsetY;
      unit.x += (tx - unit.x) * 0.28;
      unit.y += (ty - unit.y) * 0.28;
      unit.walkFrame += dt * 0.015;

      unit.shootCooldown -= dt;
      if (unit.shootCooldown <= 0) {
        if (i < activeShooters || this.units.length <= 12) {
          this.fireBullet(unit, weaponCfg, damageMult);
        }
        unit.shootCooldown = weaponCfg.fireInterval;
      }
    }

    // Bullets update
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * (dt / 16.66);
      b.y += b.vy * (dt / 16.66);

      if (b.y < -30 || b.x < -20 || b.x > this.canvas.width + 20) {
        this.bullets.splice(i, 1);
      }
    }

    // Spawning gates
    if (this.distance >= this.nextGateDistance) {
      this.spawnGatePair();
      this.nextGateDistance = this.distance + 480 + Math.random() * 200;
    }

    // Spawning zombies
    if (this.distance >= this.nextZombieDistance) {
      this.spawnZombieWave();
      this.nextZombieDistance = this.distance + Math.max(70, 160 - this.wave * 12);
    }

    // Update Gates
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      g.y += this.speed * (dt / 16.66);
      if (g.hitFlash > 0) g.hitFlash -= dt * 0.01;

      // Check if squad passed gate
      if (g.y + g.height >= this.playerY - 20 && g.y <= this.playerY + 30) {
        // Check X overlap
        const squadLeft = this.playerX - 25;
        const squadRight = this.playerX + 25;
        if (squadRight >= g.x && squadLeft <= g.x + g.width) {
          // Trigger Gate!
          this.gatesPassed++;
          if (g.op === 'weapon' && g.weaponType) {
            this.setWeapon(g.weaponType);
          } else if (g.op === 'multiply') {
            this.updateCrowd(g.value, true);
          } else if (g.op === 'add') {
            this.updateCrowd(g.value, false);
          } else if (g.op === 'subtract') {
            this.updateCrowd(-g.value, false);
          } else if (g.op === 'divide') {
            const nextVal = Math.max(1, Math.floor(this.crowdCount / g.value));
            this.updateCrowd(nextVal - this.crowdCount, false);
          }
          this.spawnGateParticles(g);
          this.gates.splice(i, 1);
          continue;
        }
      }

      if (g.y > this.canvas.height + 80) {
        this.gates.splice(i, 1);
      }
    }

    // Update Zombies
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.y += (this.speed + z.speed) * (dt / 16.66);
      z.walkFrame += (this.speed + z.speed) * (dt / 16.66) * 0.12;
      if (z.hitFlash > 0) z.hitFlash -= dt * 0.01;

      // Zombie reaches player squad line
      if (z.y + z.radius >= this.playerY - 20) {
        const squadLeft = this.playerX - 35;
        const squadRight = this.playerX + 35;
        if (z.x + z.radius >= squadLeft && z.x - z.radius <= squadRight) {
          // Collision attack!
          this.audio.playHit();
          this.screenShake = 6;
          this.updateCrowd(-1);
          this.spawnBloodParticles(z.x, z.y, '#ef4444');
          this.zombies.splice(i, 1);
          continue;
        }
      }

      // Past bottom
      if (z.y > this.canvas.height + 50) {
        // breach penalty
        this.score = Math.max(0, this.score - 10);
        this.zombies.splice(i, 1);
      }
    }

    // Bullet Collisions
    this.handleBulletCollisions();

    // Particles update
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

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * (dt / 16.66);
      ft.life += dt;
      ft.alpha = Math.max(0, 1 - ft.life / 800);
      if (ft.life >= 800) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Screen effects decay
    if (this.screenShake > 0) this.screenShake *= 0.88;
    if (this.redFlashAlpha > 0) this.redFlashAlpha -= dt * 0.002;

    // Notify stats update
    if (this.onStatsUpdate) {
      const timeLeft = Math.max(0, Math.ceil((this.weaponExpiresAt - performance.now()) / 1000));
      this.onStatsUpdate(this.getStats(), this.crowdCount, this.currentWeapon, timeLeft);
    }
  }

  private fireBullet(unit: MonkeUnit, config: WeaponConfig, damageMult: number = 1) {
    if (this.bullets.length > 130) return; // Prevent bullet runaway count

    this.audio.playShoot(config.type);
    const damage = Math.max(1, Math.round(config.damage * damageMult));
    const radius = damageMult > 2.5 ? Math.min(config.bulletRadius * 1.3, config.bulletRadius + 2) : config.bulletRadius;

    if (config.spreadCount && config.spreadAngle) {
      const count = config.spreadCount;
      const startAngle = -config.spreadAngle / 2;
      const step = config.spreadAngle / (count - 1);
      for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + startAngle + i * step;
        this.bullets.push({
          id: Math.random(),
          x: unit.x,
          y: unit.y - 12,
          vx: Math.cos(angle) * config.bulletSpeed,
          vy: Math.sin(angle) * config.bulletSpeed,
          radius,
          damage,
          color: config.bulletColor,
          pierce: config.pierce || 1,
          weaponType: config.type,
          splashRadius: config.splashRadius,
        });
      }
    } else {
      // Single / dual straight up
      this.bullets.push({
        id: Math.random(),
        x: unit.x,
        y: unit.y - 12,
        vx: 0,
        vy: -config.bulletSpeed,
        radius,
        damage,
        color: config.bulletColor,
        pierce: config.pierce || 1,
        weaponType: config.type,
        splashRadius: config.splashRadius,
      });
    }
  }

  private handleBulletCollisions() {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      let bulletDead = false;

      // 1. Collide with shootable Gates
      for (const g of this.gates) {
        if (b.x >= g.x && b.x <= g.x + g.width && b.y >= g.y && b.y <= g.y + g.height) {
          g.hitFlash = 1;
          this.audio.playGateUpgrade();
          this.spawnSpark(b.x, b.y, g.op === 'subtract' || g.op === 'divide' ? '#f87171' : '#38bdf8');

          // Shoot to UPGRADE positive gate, or MITIGATE negative gate!
          if (g.op === 'add') {
            g.hp -= b.damage;
            if (g.hp <= 0) {
              g.value += 1;
              g.maxHp = Math.round(g.maxHp * 1.3);
              g.hp = g.maxHp;
              this.addFloatingText(g.x + g.width / 2, g.y - 10, `UP! +${g.value}`, '#38bdf8', 15);
            }
          } else if (g.op === 'multiply') {
            g.hp -= b.damage;
            if (g.hp <= 0 && g.value < 4) {
              g.value += 1;
              g.maxHp = Math.round(g.maxHp * 1.6);
              g.hp = g.maxHp;
              this.addFloatingText(g.x + g.width / 2, g.y - 10, `UP! x${g.value}`, '#a855f7', 18);
            }
          } else if (g.op === 'subtract') {
            g.hp -= b.damage;
            if (g.hp <= 0) {
              g.value = Math.max(0, g.value - 2);
              g.hp = g.maxHp;
              this.addFloatingText(g.x + g.width / 2, g.y - 10, `WEAKENED! -${g.value}`, '#fbbf24', 15);
            }
          }

          bulletDead = true;
          break;
        }
      }
      if (bulletDead) {
        this.bullets.splice(bi, 1);
        continue;
      }

      // 2. Collide with Zombies (Fast squared distance check)
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

          // Rocket Splash Damage
          if (b.splashRadius) {
            this.audio.playExplosion();
            this.screenShake = 8;
            this.spawnExplosion(b.x, b.y, b.splashRadius);
            const splashSq = b.splashRadius * b.splashRadius;
            for (const otherZ of this.zombies) {
              const odx = otherZ.x - b.x;
              const ody = otherZ.y - b.y;
              if (odx * odx + ody * ody <= splashSq) {
                otherZ.hp -= b.damage;
                otherZ.hitFlash = 1;
              }
            }
          }

          // Check Zombie Death
          if (z.hp <= 0) {
            this.audio.playZombieDie();
            this.score += z.scoreValue;
            this.zombiesKilled++;
            this.spawnBloodParticles(z.x, z.y, z.color);
            this.addFloatingText(z.x, z.y - 15, `+${z.scoreValue}`, '#fbbf24', 14);

            if (z.type === 'exploder') {
              this.audio.playExplosion();
              this.screenShake = 10;
              this.spawnExplosion(z.x, z.y, 90);
              const exploderSq = 90 * 90;
              for (const otherZ of this.zombies) {
                if (otherZ !== z) {
                  const odx = otherZ.x - z.x;
                  const ody = otherZ.y - z.y;
                  if (odx * odx + ody * ody <= exploderSq) {
                    otherZ.hp -= 80;
                  }
                }
              }
            }
            this.zombies.splice(zi, 1);
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

  // --- Spawners ---
  private spawnGatePair() {
    const W = this.canvas.width;
    const gateW = (W - 40) / 2;
    const isWeaponGate = Math.random() < 0.28;

    if (isWeaponGate) {
      const weapons: WeaponType[] = ['shotgun', 'gatling', 'laser', 'rocket'];
      const pick = weapons[Math.floor(Math.random() * weapons.length)];
      this.gates.push({
        id: Math.random(),
        x: 15,
        y: -90,
        width: gateW,
        height: 60,
        op: 'weapon',
        value: 1,
        weaponType: pick,
        speed: this.speed,
        hp: 20,
        maxHp: 20,
        hitFlash: 0,
      });

      // Other side positive buff
      const bonus = Math.floor(Math.random() * 5) + 3;
      this.gates.push({
        id: Math.random(),
        x: 25 + gateW,
        y: -90,
        width: gateW,
        height: 60,
        op: 'add',
        value: bonus,
        speed: this.speed,
        hp: 15,
        maxHp: 15,
        hitFlash: 0,
      });
    } else {
      // One positive, one negative / challenge gate
      const isLeftGood = Math.random() > 0.5;
      const goodOp: GateOp = Math.random() > 0.6 ? 'multiply' : 'add';
      const goodVal = goodOp === 'multiply' ? 2 : Math.floor(Math.random() * 6) + 3;

      const badOp: GateOp = Math.random() > 0.7 ? 'divide' : 'subtract';
      const badVal = badOp === 'divide' ? 2 : Math.floor(Math.random() * 4) + 2;

      this.gates.push({
        id: Math.random(),
        x: 15,
        y: -90,
        width: gateW,
        height: 60,
        op: isLeftGood ? goodOp : badOp,
        value: isLeftGood ? goodVal : badVal,
        speed: this.speed,
        hp: 15,
        maxHp: 15,
        hitFlash: 0,
      });

      this.gates.push({
        id: Math.random(),
        x: 25 + gateW,
        y: -90,
        width: gateW,
        height: 60,
        op: !isLeftGood ? goodOp : badOp,
        value: !isLeftGood ? goodVal : badVal,
        speed: this.speed,
        hp: 15,
        maxHp: 15,
        hitFlash: 0,
      });
    }
  }

  private spawnZombieWave() {
    const W = this.canvas.width;
    const count = Math.min(8, Math.max(2, Math.floor(1 + this.wave * 0.8 + Math.random() * 1.2)));

    // Boss check every 5 waves
    if (this.wave % 5 === 0 && !this.zombies.some((z) => z.type === 'boss')) {
      this.audio.playBossAlert();
      this.screenShake = 12;
      this.addFloatingText(W / 2, 80, '⚠️ BOSS INCOMING ⚠️', '#ef4444', 28);
      this.zombies.push({
        id: Math.random(),
        type: 'boss',
        x: W / 2,
        y: -80,
        radius: 38,
        hp: 240 + this.wave * 60,
        maxHp: 240 + this.wave * 60,
        speed: 0.35,
        color: '#dc2626',
        skinId: 999,
        hitFlash: 0,
        scoreValue: 500,
        walkFrame: 0,
      });
      return;
    }

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      let type: Zombie['type'] = 'walker';
      let radius = 16;
      let hp = 18 + this.wave * 4;
      let speed = 0.5 + Math.random() * 0.3;
      let color = '#22c55e'; // green
      let scoreVal = 20;

      if (rand < 0.25) {
        type = 'runner';
        radius = 13;
        hp = 14 + this.wave * 2;
        speed = 1.2 + Math.random() * 0.4;
        color = '#a855f7'; // purple
        scoreVal = 35;
      } else if (rand < 0.4) {
        type = 'tank';
        radius = 24;
        hp = 55 + this.wave * 12;
        speed = 0.3 + Math.random() * 0.15;
        color = '#eab308'; // yellow brute
        scoreVal = 60;
      } else if (rand < 0.52) {
        type = 'exploder';
        radius = 16;
        hp = 22 + this.wave * 3;
        speed = 0.7;
        color = '#f97316'; // orange
        scoreVal = 45;
      }

      this.zombies.push({
        id: Math.random(),
        type,
        x: 30 + Math.random() * (W - 60),
        y: -30 - i * 35,
        radius,
        hp,
        maxHp: hp,
        speed,
        color,
        skinId: Math.floor(Math.random() * 10),
        hitFlash: 0,
        scoreValue: scoreVal,
        walkFrame: Math.random() * 10,
      });
    }
  }

  // --- Particles & FX ---
  private spawnSpark(x: number, y: number, color: string) {
    if (this.particles.length > 80) return;
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

  private spawnBloodParticles(x: number, y: number, color: string) {
    if (this.particles.length > 90) return;
    const count = this.particles.length > 50 ? 4 : 8;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color,
        radius: 3 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 300 + Math.random() * 150,
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

  private spawnGateParticles(g: Gate) {
    if (this.particles.length > 80) return;
    const color = g.op === 'weapon' ? '#f59e0b' : g.op === 'subtract' || g.op === 'divide' ? '#ef4444' : '#38bdf8';
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: g.x + Math.random() * g.width,
        y: g.y + Math.random() * g.height,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        color,
        radius: 2.5 + Math.random() * 2,
        alpha: 1,
        life: 0,
        maxLife: 250 + Math.random() * 150,
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
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;

    ctx.save();
    // Screen shake
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Background Grid & Runway
    ctx.fillStyle = '#090d16'; // dark cyberpunk navy
    ctx.fillRect(0, 0, W, H);

    // Dynamic grid lines scrolling down
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const gridOffset = (this.distance * 1.5) % 40;
    for (let y = gridOffset; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Roadside laser border lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 0); ctx.lineTo(10, H);
    ctx.moveTo(W - 10, 0); ctx.lineTo(W - 10, H);
    ctx.stroke();

    // 2. Render Gates
    for (const g of this.gates) {
      this.renderGate(g);
    }

    // 3. Render Zombies
    for (const z of this.zombies) {
      this.renderZombie(z);
    }

    // 4. Render Bullets (High-speed batch neon capsule rendering)
    for (const b of this.bullets) {
      const r = b.radius;
      // Outer bright colored capsule
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x - r, b.y - r * 1.6, r * 2, r * 3.2);
      // Inner glowing white core
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x - r * 0.4, b.y - r * 1.1, r * 0.8, r * 2.2);
    }

    // 5. Render Player Crowd Squad
    this.renderCrowd();

    // 6. Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Render Floating Texts
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

    // 8. Damage red flash overlay
    if (this.redFlashAlpha > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${this.redFlashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  private renderGate(g: Gate) {
    const { ctx } = this;
    const isBad = g.op === 'subtract' || g.op === 'divide';
    const isWeapon = g.op === 'weapon';

    let mainColor = '#38bdf8'; // sky blue
    let glowColor = 'rgba(56, 189, 248, 0.4)';
    let text = `+${g.value}`;

    if (isWeapon) {
      mainColor = '#f59e0b'; // amber gold
      glowColor = 'rgba(245, 158, 11, 0.5)';
      const cfg = g.weaponType ? WEAPON_CONFIGS[g.weaponType] : null;
      text = cfg ? `${cfg.icon} ${cfg.nameZh}` : 'CRATE';
    } else if (isBad) {
      mainColor = '#ef4444'; // red
      glowColor = 'rgba(239, 68, 68, 0.4)';
      text = g.op === 'divide' ? `÷${g.value}` : `-${g.value}`;
    } else if (g.op === 'multiply') {
      mainColor = '#a855f7'; // purple
      glowColor = 'rgba(168, 85, 247, 0.4)';
      text = `×${g.value}`;
    }

    ctx.save();
    if (g.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    }

    // Gate card body with rounded corners
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    this.roundRect(ctx, g.x, g.y, g.width, g.height, 8);
    ctx.fill();
    ctx.stroke();

    // Top gate energy banner
    ctx.fillStyle = mainColor;
    ctx.fillRect(g.x + 4, g.y + 4, g.width - 8, 4);

    // Gate text
    ctx.fillStyle = mainColor;
    ctx.font = '900 20px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText(text, g.x + g.width / 2, g.y + g.height / 2);

    // Gate upgrade health indicator if positive/weapon
    if (!isWeapon && g.maxHp > 0) {
      const barW = g.width * 0.7;
      const barH = 3;
      const bx = g.x + (g.width - barW) / 2;
      const by = g.y + g.height - 8;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(bx, by, barW, barH);
      ctx.fillStyle = mainColor;
      ctx.fillRect(bx, by, barW * (1 - g.hp / g.maxHp), barH);
    }

    ctx.restore();
  }

  private renderZombie(z: Zombie) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(z.x, z.y);

    // Get pixel art sprite from ZombieSprites cache
    const walkCycle = Math.floor(z.walkFrame * 2) % 2;
    const isHit = z.hitFlash > 0;
    const sprite = getZombieSprite(z.type, walkCycle, isHit);

    const sw = sprite.width;
    const sh = sprite.height;
    // Walking slight wobble
    const sway = Math.sin(z.walkFrame * 4) * (z.type === 'runner' ? 2 : 1);
    ctx.drawImage(sprite, -sw / 2 + sway, -sh / 2, sw, sh);

    // Zombie HP Bar
    if (z.hp < z.maxHp || z.type === 'boss' || z.type === 'tank') {
      const barW = Math.max(28, z.radius * 2.2);
      const barH = 4;
      const barY = -sh / 2 - 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(-barW / 2, barY, barW, barH);
      ctx.fillStyle = z.color;
      ctx.fillRect(-barW / 2, barY, barW * Math.max(0, z.hp / z.maxHp), barH);
    }

    ctx.restore();
  }

  private renderCrowd() {
    const { ctx } = this;

    // Squad count badge floating above squad
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#38bdf8';
    // Render individual Monkes using offscreen pixel-sharp canvas
    const sprite = this.monkeCanvas || getFallbackMonkeSprite(this.monkeId);
    const cfg = WEAPON_CONFIGS[this.currentWeapon];
    let minY = this.playerY - 20;

    for (const unit of this.units) {
      if (unit.y < minY) minY = unit.y;

      ctx.save();
      const bob = Math.sin(unit.walkFrame) * 2;
      const stepTilt = Math.sin(unit.walkFrame * 2) * 0.04;
      ctx.translate(unit.x, unit.y + bob);
      ctx.rotate(stepTilt);

      // Subtle shadow under unit
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(-12, 14, 24, 4);

      // Draw pixel-sharp Monke
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, -unit.size / 2, -unit.size / 2, unit.size, unit.size);

      // Small equipped gun in hand
      ctx.fillStyle = cfg.bulletColor;
      ctx.fillRect(unit.size * 0.22, -unit.size * 0.45, 4, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(unit.size * 0.22, -unit.size * 0.45, 4, 2);

      ctx.restore();
    }

    // Squad count badge floating above squad (always rendered on top)
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    const badgeW = 72;
    const badgeH = 22;
    const badgeY = minY - 28;
    this.roundRect(ctx, this.playerX - badgeW / 2, badgeY, badgeW, badgeH, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 13px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`👥 ${this.crowdCount}`, this.playerX, badgeY + badgeH / 2);
    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}
