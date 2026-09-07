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
  public crowdCount: number = 10;
  public units: MonkeUnit[] = [];
  public currentWeapon: WeaponType = 'pistol';
  public weaponExpiresAt: number = 0;
  public monkeImage: HTMLImageElement | null = null;
  public monkeCanvas: HTMLCanvasElement | null = null;
  public monkeId: number = 209;

  // Defense Barrier, Armor, Freeze, Nuke, Combo & Mercy state
  public shield: number = 100;
  public maxShield: number = 100;
  public armor: number = 0;
  public maxArmor: number = 5;
  public freezeTimer: number = 0;
  public nukeCharge: number = 0; // 0 to 100%
  public combo: number = 0;
  public lastKillTime: number = 0;
  public feverTimer: number = 0;
  public invulnerableTimer: number = 0;
  public adrenalineTimer: number = 0;
  public adrenalineUsedThisLife: boolean = false;
  private lastShieldHitTime: number = 0;

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
  public maxCrowdReached: number = 10;

  private nextGateDistance: number = 60;
  private nextZombieDistance: number = 240;
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
    this.crowdCount = 10;
    this.shield = 100;
    this.maxShield = 100;
    this.armor = 0;
    this.freezeTimer = 0;
    this.nukeCharge = 0;
    this.combo = 0;
    this.lastKillTime = 0;
    this.feverTimer = 0;
    this.invulnerableTimer = 0;
    this.adrenalineTimer = 0;
    this.adrenalineUsedThisLife = false;
    this.lastShieldHitTime = 0;
    this.currentWeapon = 'pistol';
    this.weaponExpiresAt = 0;
    this.distance = 0;
    this.wave = 1;
    this.score = 0;
    this.zombiesKilled = 0;
    this.gatesPassed = 0;
    this.maxCrowdReached = 10;
    this.bullets = [];
    this.gates = [];
    this.zombies = [];
    this.particles = [];
    this.floatingTexts = [];
    this.playerX = this.canvas.width / 2;
    this.playerTargetX = this.canvas.width / 2;
    this.playerY = this.canvas.height - 110;
    this.nextGateDistance = 60;
    this.nextZombieDistance = 240;
    this.rebuildUnits();
    this.loadMonkeImage(monkeId);
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
    this.playerTargetX = Math.max(45, Math.min(this.canvas.width - 45, x));
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

  public static readonly MAX_CROWD = 300;

  public updateCrowd(delta: number, isMultiply: boolean = false) {
    const old = this.crowdCount;
    if (isMultiply) {
      this.crowdCount = Math.min(ZombieEngine.MAX_CROWD, Math.floor(this.crowdCount * delta));
    } else if (delta > 0) {
      this.crowdCount = Math.min(ZombieEngine.MAX_CROWD, this.crowdCount + delta);
    } else {
      this.crowdCount = Math.max(0, this.crowdCount + delta);
    }

    if (this.crowdCount > old) {
      this.audio.playGatePass(true);
      const gained = this.crowdCount - old;
      if (this.crowdCount >= ZombieEngine.MAX_CROWD) {
        this.addFloatingText(this.playerX, this.playerY - 40, `+${gained} (MAX SQUAD!)`, '#f59e0b', 20);
      } else {
        this.addFloatingText(this.playerX, this.playerY - 40, `+${gained} MONKES!`, '#4ade80', 20);
      }
      if (this.crowdCount > 15) {
        this.adrenalineUsedThisLife = false;
      }
    } else if (this.crowdCount < old) {
      this.audio.playGatePass(false);
      this.addFloatingText(this.playerX, this.playerY - 40, `${this.crowdCount - old}`, '#ef4444', 22);
      this.redFlashAlpha = 0.35;

      // Adrenaline Clutch Mode!
      if (this.crowdCount > 0 && this.crowdCount <= 5 && !this.adrenalineUsedThisLife) {
        this.adrenalineUsedThisLife = true;
        this.adrenalineTimer = 4500;
        this.invulnerableTimer = 2200;
        this.audio.playAdrenaline();
        this.screenShake = 10;
        this.addFloatingText(this.playerX, this.playerY - 60, '⚡ ADRENALINE! 2X FIRE ⚡', '#f59e0b', 22);
      }
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
    this.weaponExpiresAt = performance.now() + (config.durationMs || 15000);
    this.audio.playPowerup();
    this.addFloatingText(this.playerX, this.playerY - 60, `${config.icon} ${config.nameZh}!`, config.bulletColor, 22);
  }

  public triggerNuke(): boolean {
    if (this.nukeCharge < 100 || this.isGameOver || !this.isRunning) return false;
    this.nukeCharge = 0;
    this.audio.playNuke();
    this.screenShake = 22;
    this.redFlashAlpha = 0.5;

    // Drop orbital cruise strikes across the screen
    for (let xi = 60; xi <= this.canvas.width - 60; xi += 100) {
      this.spawnExplosion(xi, 200 + Math.random() * 200, 120);
    }

    // Wipe all standard zombies, heavily damage bosses
    for (let zi = this.zombies.length - 1; zi >= 0; zi--) {
      const z = this.zombies[zi];
      if (z.type === 'boss') {
        z.hp -= 600;
        z.hitFlash = 1;
        if (z.hp <= 0) {
          this.score += z.scoreValue;
          this.zombiesKilled++;
          this.zombies.splice(zi, 1);
        }
      } else {
        this.score += z.scoreValue;
        this.zombiesKilled++;
        this.spawnBloodParticles(z.x, z.y, z.color);
        this.zombies.splice(zi, 1);
      }
    }

    this.addFloatingText(this.canvas.width / 2, 140, '☢️ ORBITAL STRIKE CLEARED! ☢️', '#facc15', 24);
    return true;
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
      shield: Math.round(this.shield),
      maxShield: this.maxShield,
      armor: this.armor,
      maxArmor: this.maxArmor,
      nukeCharge: Math.floor(this.nukeCharge),
      combo: this.combo,
      isFever: this.feverTimer > 0,
      isPaused: this.isPaused,
      freezeTimeLeft: Math.max(0, Math.ceil(this.freezeTimer / 1000)),
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

  public applyGateEffect(g: Gate, isClaimedFromShot: boolean = false) {
    this.gatesPassed++;
    const xPos = isClaimedFromShot ? g.x + g.width / 2 : this.playerX;
    const yPos = isClaimedFromShot ? g.y : this.playerY - 40;

    if (g.op === 'weapon' && g.weaponType) {
      this.setWeapon(g.weaponType);
      if (isClaimedFromShot) {
        this.addFloatingText(xPos, yPos, `🎯 打爆领取!`, '#f59e0b', 18);
      }
    } else if (g.op === 'shield') {
      this.shield = Math.min(this.maxShield, this.shield + g.value);
      this.audio.playShieldRepair();
      this.addFloatingText(xPos, yPos, isClaimedFromShot ? `🎯 击破获得: 护盾+${g.value}!` : `🛡️ 护盾 +${g.value}!`, '#38bdf8', 20);
    } else if (g.op === 'armor') {
      this.armor = Math.min(this.maxArmor, this.armor + g.value);
      this.audio.playArmorHit();
      this.addFloatingText(xPos, yPos, isClaimedFromShot ? `🎯 击破获得: 装甲+${g.value}!` : `🛡️ 纳米装甲 +${g.value}!`, '#38bdf8', 20);
    } else if (g.op === 'freeze') {
      this.freezeTimer = 5000;
      this.audio.playFreeze();
      this.addFloatingText(xPos, yPos, isClaimedFromShot ? `🎯 击破激活: 极寒冰暴!` : `❄️ 极寒冰暴 5s!`, '#06b6d4', 22);
    } else if (g.op === 'multiply') {
      this.updateCrowd(g.value, true);
      if (isClaimedFromShot) {
        this.addFloatingText(xPos, yPos, `🎯 击破翻倍: x${g.value}!`, '#a855f7', 20);
      }
    } else if (g.op === 'add') {
      this.updateCrowd(g.value, false);
      if (isClaimedFromShot) {
        this.addFloatingText(xPos, yPos, `🎯 击破吸收: +${g.value}!`, '#4ade80', 20);
      }
    } else if (g.op === 'subtract') {
      this.updateCrowd(-g.value, false);
    } else if (g.op === 'divide') {
      const nextVal = Math.max(1, Math.floor(this.crowdCount / g.value));
      this.updateCrowd(nextVal - this.crowdCount, false);
    }
    this.spawnGateParticles(g);
  }

  private update(dt: number) {
    this.distance += this.speed * (dt / 16.66);
    this.wave = 1 + Math.floor(this.distance / 1200);

    // Timers
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.adrenalineTimer > 0) this.adrenalineTimer -= dt;
    if (this.feverTimer > 0) this.feverTimer -= dt;
    if (this.freezeTimer > 0) this.freezeTimer -= dt;

    // Combo decay
    if (this.combo > 0 && performance.now() - this.lastKillTime > 1600) {
      this.combo = 0;
    }

    // Shield auto-regen (+1.5/sec if not hit in last 3.5s)
    if (this.shield < this.maxShield && performance.now() - this.lastShieldHitTime > 3500) {
      this.shield = Math.min(this.maxShield, this.shield + (dt / 1000) * 1.5);
    }

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
    // Controlled logarithmic firepower scaling: 1x to 8.5x max
    let crowdDamageMult = 1 + Math.log2(totalCrowd) * 0.92;
    if (this.feverTimer > 0) crowdDamageMult *= 1.5; // Fever mode damage boost!

    // Adrenaline fire rate boost (2x fire rate)
    const fireInterval = this.adrenalineTimer > 0 ? weaponCfg.fireInterval * 0.5 : weaponCfg.fireInterval;
    const activeShooters = Math.min(this.units.length, 16);

    for (let i = 0; i < this.units.length; i++) {
      const unit = this.units[i];
      // Clamped strictly to road bounds to prevent edge smear
      const tx = Math.max(26, Math.min(this.canvas.width - 26, this.playerX + unit.offsetX));
      const ty = this.playerY + unit.offsetY;
      unit.x += (tx - unit.x) * 0.28;
      unit.y += (ty - unit.y) * 0.28;
      unit.walkFrame += dt * 0.015;

      unit.shootCooldown -= dt;
      if (unit.shootCooldown <= 0) {
        if (i < activeShooters || this.units.length <= 16) {
          this.fireBullet(unit, weaponCfg, crowdDamageMult);
        }
        unit.shootCooldown = fireInterval;
      }
    }

    // Bullets update - strictly clamped inside road borders
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * (dt / 16.66);
      b.y += b.vy * (dt / 16.66);

      if (b.y < -30 || b.x < 5 || b.x > this.canvas.width - 5) {
        this.bullets.splice(i, 1);
      }
    }

    // Spawning gates
    if (this.distance >= this.nextGateDistance) {
      this.spawnGatePair();
      this.nextGateDistance = this.distance + 460 + Math.random() * 180;
    }

    // Spawning zombies
    if (this.distance >= this.nextZombieDistance) {
      this.spawnZombieWave();
      this.nextZombieDistance = this.distance + Math.max(75, 170 - this.wave * 10);
    }

    // Update Gates
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      g.y += this.speed * (dt / 16.66);
      if (g.hitFlash > 0) g.hitFlash -= dt * 0.01;

      // Check if squad passed gate
      if (g.y + g.height >= this.playerY - 20 && g.y <= this.playerY + 30) {
        // Check X overlap
        const squadLeft = this.playerX - 35;
        const squadRight = this.playerX + 35;
        if (squadRight >= g.x && squadLeft <= g.x + g.width) {
          this.applyGateEffect(g, false);
          this.gates.splice(i, 1);
          continue;
        }
      }

      if (g.y > this.canvas.height + 80) {
        this.gates.splice(i, 1);
      }
    }

    // Update Zombies
    const squadRadius = Math.min(85, 20 + Math.sqrt(this.units.length) * 8);
    const squadLeft = this.playerX - squadRadius;
    const squadRight = this.playerX + squadRadius;
    const squadTop = this.playerY - 22;
    const squadBottom = this.playerY + 30;
    const isFrozen = this.freezeTimer > 0;
    const zombieSpeedMult = isFrozen ? 0.35 : 1.0;

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      z.y += (this.speed + z.speed * zombieSpeedMult) * (dt / 16.66);
      z.walkFrame += (this.speed + z.speed * zombieSpeedMult) * (dt / 16.66) * 0.12;
      if (z.hitFlash > 0) z.hitFlash -= dt * 0.01;

      // 1. Direct collision with player Monke squad (physical contact)
      if (z.y + z.radius >= squadTop && z.y - z.radius <= squadBottom) {
        if (z.x + z.radius >= squadLeft && z.x - z.radius <= squadRight) {
          if (this.invulnerableTimer <= 0) {
            if (this.armor > 0) {
              // Nano-Armor absorbs full zombie damage!
              this.armor--;
              this.audio.playArmorHit();
              this.screenShake = 5;
              this.invulnerableTimer = 600;
              this.spawnSpark(z.x, z.y, '#38bdf8');
              this.addFloatingText(this.playerX, this.playerY - 45, `🛡️ 护甲抵挡! (余${this.armor})`, '#38bdf8', 18);
            } else {
              this.audio.playHit();
              this.screenShake = 6;
              let penalty = 1; // Walker default -1
              if (z.type === 'runner') penalty = 1;
              else if (z.type === 'tank') penalty = 3;
              else if (z.type === 'exploder') penalty = 4;
              else if (z.type === 'boss') penalty = 8;

              this.updateCrowd(-penalty);
              this.invulnerableTimer = 800; // 0.8s mercy window
              this.spawnBloodParticles(z.x, z.y, '#ef4444');
              this.addFloatingText(z.x, z.y - 12, `-${penalty} 👥`, '#ef4444', 18);
            }
          }
          this.zombies.splice(i, 1);
          continue;
        }
      }

      // 2. Past player line (Defense barrier interception - NO instant death!)
      if (z.y > this.playerY + 45) {
        if (this.shield > 0) {
          // Absorbed by Base Laser Shield!
          this.lastShieldHitTime = performance.now();
          const shieldDmg = z.type === 'boss' ? 25 : z.type === 'tank' ? 12 : z.type === 'exploder' ? 10 : z.type === 'runner' ? 6 : 4;
          this.shield = Math.max(0, this.shield - shieldDmg);
          this.audio.playShieldHit();
          this.screenShake = 4;
          this.spawnSpark(z.x, this.canvas.height - 24, '#38bdf8');
          this.addFloatingText(z.x, this.canvas.height - 35, `🛡️ BARRIER -${shieldDmg}`, '#38bdf8', 14);
        } else {
          // Shield broken / overloaded: leaks inflict small squad damage
          const breachPenalty = z.type === 'boss' ? 6 : z.type === 'tank' ? 3 : 1;
          this.audio.playHit();
          this.screenShake = 5;
          this.updateCrowd(-breachPenalty);
          this.addFloatingText(z.x, this.playerY + 15, `BREACH! -${breachPenalty}`, '#f43f5e', 16);
          this.spawnBloodParticles(z.x, this.playerY + 25, '#ef4444');
        }
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

      // 1. Collide with shootable Gates / Items
      for (let gi = this.gates.length - 1; gi >= 0; gi--) {
        const g = this.gates[gi];
        if (b.x >= g.x && b.x <= g.x + g.width && b.y >= g.y && b.y <= g.y + g.height) {
          g.hitFlash = 1;
          g.hitsReceived++;
          g.hp -= b.damage;
          this.audio.playGateUpgrade();
          this.spawnSpark(b.x, b.y, g.op === 'subtract' || g.op === 'divide' ? '#f87171' : '#38bdf8');

          // Check if durability depleted to 0
          if (g.hp <= 0) {
            const isNegative = g.op === 'subtract' || g.op === 'divide';
            if (isNegative) {
              // Negative gate purified into positive gate!
              // "数值为负的道具可以在打完耐久度之后变成正值，正值要给个限制额度，正值的耐久度打完就算吃到道具"
              let convertedVal = 3;
              if (g.op === 'subtract') {
                convertedVal = Math.min(5, Math.max(2, Math.floor(g.originalValue * 0.4)));
              } else if (g.op === 'divide') {
                convertedVal = 3;
              }
              g.op = 'add';
              g.value = convertedVal;
              g.originalValue = convertedVal;
              g.isConverted = true;
              g.maxHp = this.getGateMaxHp('add', convertedVal);
              g.hp = g.maxHp;
              this.audio.playPurify();
              this.spawnExplosion(g.x + g.width / 2, g.y + g.height / 2, 40);
              this.addFloatingText(g.x + g.width / 2, g.y - 12, `✨ 净化转正: +${convertedVal}!`, '#38bdf8', 18);
            } else {
              // Positive gate claimed directly by shooting!
              // "红框的这个道具应该增加一个耐久度，耐久度打完了就等于直接给我们吃到了"
              // "正值的耐久度打完就算吃到道具"
              this.audio.playPowerup();
              this.spawnExplosion(g.x + g.width / 2, g.y + g.height / 2, 50);
              this.applyGateEffect(g, true);
              this.gates.splice(gi, 1);
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

            // Nuke charge gain
            const nukeGain = z.type === 'boss' ? 35 : z.type === 'tank' ? 7 : z.type === 'exploder' ? 7 : 3;
            this.nukeCharge = Math.min(100, this.nukeCharge + nukeGain);

            // Combo & Fever System
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
              this.addFloatingText(this.playerX, this.playerY - 60, '🔥 FEVER TIME! 🔥', '#ec4899', 24);
            }

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

  // --- Gate Durability & Spawners ---
  public getGateMaxHp(op: GateOp, val: number): number {
    switch (op) {
      case 'add':
        // Value scales durability: +4 => 60hp, +8 => 92hp, +15 => 148hp
        return Math.round(28 + val * 8);
      case 'multiply':
        // x2 => 140hp, x3 => 220hp
        return Math.round(val === 2 ? 140 : 220);
      case 'weapon':
        return 95;
      case 'armor':
        // +2 armor => 90hp, +3 armor => 110hp
        return Math.round(50 + val * 20);
      case 'freeze':
        return 75;
      case 'shield':
        return Math.round(35 + val * 1.2);
      case 'subtract':
        // -3 => 53hp, -6 => 71hp, -10 => 95hp
        return Math.round(35 + val * 6);
      case 'divide':
        return 95;
      default:
        return 65;
    }
  }

  private createGate(op: GateOp, val: number, xPos: number, weaponType?: WeaponType): Gate {
    const W = this.canvas.width;
    const gateW = (W - 40) / 2;
    const maxHp = this.getGateMaxHp(op, val);
    return {
      id: Math.random(),
      x: xPos,
      y: -90,
      width: gateW,
      height: 60,
      op,
      value: val,
      weaponType,
      speed: this.speed,
      hp: maxHp,
      maxHp,
      hitFlash: 0,
      hitsReceived: 0,
      hitsRequired: 18,
      maxUpgrades: 0,
      upgradesDone: 0,
      originalValue: val,
    };
  }

  private spawnGatePair() {
    const W = this.canvas.width;
    const gateW = (W - 40) / 2;
    const leftX = 15;
    const rightX = 25 + gateW;
    const isEarlyWave = this.wave === 1 && this.gatesPassed < 2;

    if (isEarlyWave) {
      // Guaranteed beginner buffet: +10 on left and x2 or Gatling on right
      this.gates.push(this.createGate('add', 10, leftX));
      if (Math.random() > 0.5) {
        this.gates.push(this.createGate('multiply', 2, rightX));
      } else {
        this.gates.push(this.createGate('weapon', 1, rightX, 'gatling'));
      }
      return;
    }

    const randType = Math.random();

    // 1. Special Item: Nano-Armor (18% chance)
    if (randType < 0.18) {
      const isLeft = Math.random() > 0.5;
      const armorVal = this.wave >= 4 ? 3 : 2;
      const bonus = Math.floor(Math.random() * 5) + 5;
      this.gates.push(this.createGate('armor', armorVal, isLeft ? leftX : rightX));
      this.gates.push(this.createGate('add', bonus, isLeft ? rightX : leftX));
      return;
    }

    // 2. Special Item: Cryo Freeze (15% chance)
    if (randType < 0.33) {
      const isLeft = Math.random() > 0.5;
      const bonus = Math.floor(Math.random() * 5) + 4;
      this.gates.push(this.createGate('freeze', 5, isLeft ? leftX : rightX));
      this.gates.push(this.createGate(Math.random() > 0.5 ? 'add' : 'multiply', Math.random() > 0.5 ? bonus : 2, isLeft ? rightX : leftX));
      return;
    }

    // 3. Special Item: Weapon Crate (22% chance)
    if (randType < 0.55) {
      const weapons: WeaponType[] = ['shotgun', 'gatling', 'laser', 'rocket'];
      const pick = weapons[Math.floor(Math.random() * weapons.length)];
      const isLeft = Math.random() > 0.5;
      const bonus = Math.floor(Math.random() * 5) + 5;
      this.gates.push(this.createGate('weapon', 1, isLeft ? leftX : rightX, pick));
      this.gates.push(this.createGate('add', bonus, isLeft ? rightX : leftX));
      return;
    }

    // 4. Defense Shield Repair (if shield < 80 and 15% chance)
    if (this.shield < 80 && randType < 0.70) {
      const isLeft = Math.random() > 0.5;
      const bonus = Math.floor(Math.random() * 5) + 4;
      this.gates.push(this.createGate('shield', 35, isLeft ? leftX : rightX));
      this.gates.push(this.createGate('add', bonus, isLeft ? rightX : leftX));
      return;
    }

    // 5. Classic Choice: 1 Positive Buff vs 1 Negative Hazard (shoot to purify!)
    const isLeftGood = Math.random() > 0.5;
    const goodOp: GateOp = Math.random() > 0.65 ? 'multiply' : 'add';
    const goodVal = goodOp === 'multiply' ? 2 : Math.floor(Math.random() * 6) + 4;

    const badOp: GateOp = Math.random() > 0.8 ? 'divide' : 'subtract';
    const badVal = badOp === 'divide' ? 2 : Math.floor(Math.random() * 5) + 3;

    this.gates.push(this.createGate(isLeftGood ? goodOp : badOp, isLeftGood ? goodVal : badVal, leftX));
    this.gates.push(this.createGate(!isLeftGood ? goodOp : badOp, !isLeftGood ? goodVal : badVal, rightX));
  }

  private spawnZombieWave() {
    const W = this.canvas.width;
    const isEarly = this.wave === 1;
    // Early waves have 3-5 gentle walkers, scaling upwards to max 12
    const count = isEarly ? Math.floor(3 + Math.random() * 2) : Math.min(12, Math.max(3, Math.floor(2 + this.wave * 1.1 + Math.random() * 1.5)));

    // Boss check every 5 waves
    if (this.wave % 5 === 0 && !this.zombies.some((z) => z.type === 'boss')) {
      this.audio.playBossAlert();
      this.screenShake = 14;
      this.addFloatingText(W / 2, 80, '⚠️ BOSS INCOMING ⚠️', '#ef4444', 28);
      const bossHp = 280 + this.wave * 80;
      this.zombies.push({
        id: Math.random(),
        type: 'boss',
        x: W / 2,
        y: -80,
        radius: 38,
        hp: bossHp,
        maxHp: bossHp,
        speed: 0.38,
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
      let hp = isEarly ? 16 : 22 + this.wave * 6;
      let speed = isEarly ? 0.45 + Math.random() * 0.2 : 0.55 + Math.random() * 0.3;
      let color = '#22c55e'; // green
      let scoreVal = 20;

      if (!isEarly && rand < 0.26) {
        type = 'runner';
        radius = 13;
        hp = 16 + this.wave * 4;
        speed = 1.25 + Math.random() * 0.35;
        color = '#a855f7'; // purple
        scoreVal = 35;
      } else if (!isEarly && rand < 0.45) {
        type = 'tank';
        radius = 24;
        hp = 60 + this.wave * 20;
        speed = 0.35 + Math.random() * 0.15;
        color = '#eab308'; // yellow brute
        scoreVal = 60;
      } else if (!isEarly && rand < 0.58) {
        type = 'exploder';
        radius = 16;
        hp = 25 + this.wave * 5;
        speed = 0.75;
        color = '#f97316'; // orange
        scoreVal = 45;
      }

      this.zombies.push({
        id: Math.random(),
        type,
        x: 35 + Math.random() * (W - 70),
        y: -30 - i * 36,
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

    // 1. CLEAR FULL PHYSICAL CANVAS UNCONDITIONALLY (Fixes red box edge smear bug!)
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#090d16'; // dark cyberpunk navy
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    // Screen shake
    if (this.screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }
    // Oversized background to guarantee full coverage even during large shakes
    ctx.fillRect(-50, -50, W + 100, H + 100);

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

    // 2. Render Bottom Laser Defense Barrier
    this.renderDefenseBarrier();

    // 3. Render Gates
    for (const g of this.gates) {
      this.renderGate(g);
    }

    // 4. Render Zombies
    for (const z of this.zombies) {
      this.renderZombie(z);
    }

    // 5. Render Bullets
    for (const b of this.bullets) {
      const r = b.radius;
      ctx.fillStyle = this.feverTimer > 0 ? '#ec4899' : b.color;
      ctx.fillRect(b.x - r, b.y - r * 1.6, r * 2, r * 3.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(b.x - r * 0.4, b.y - r * 1.1, r * 0.8, r * 2.2);
    }

    // 6. Render Player Crowd Squad
    this.renderCrowd();

    // 7. Render Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 8. Render Floating Texts
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

    // 9. Damage red flash overlay
    if (this.redFlashAlpha > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${this.redFlashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 10. Fever Screen Border Glow
    if (this.feverTimer > 0) {
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, W - 8, H - 8);
    }

    ctx.restore();
  }

  private renderDefenseBarrier() {
    const { ctx } = this;
    const W = this.canvas.width;
    const barrierY = this.canvas.height - 24;
    const shieldRatio = Math.max(0, this.shield / this.maxShield);

    ctx.save();
    let barrierColor = '#38bdf8'; // sky blue (healthy)
    if (shieldRatio < 0.3) barrierColor = '#ef4444'; // red (danger)
    else if (shieldRatio < 0.6) barrierColor = '#f59e0b'; // amber

    // Glowing laser beam
    ctx.strokeStyle = barrierColor;
    ctx.lineWidth = shieldRatio > 0 ? 3 : 1;
    ctx.shadowColor = barrierColor;
    ctx.shadowBlur = shieldRatio > 0 ? 8 : 2;
    ctx.setLineDash(shieldRatio > 0 ? [] : [4, 4]);

    ctx.beginPath();
    ctx.moveTo(10, barrierY);
    ctx.lineTo(W - 10, barrierY);
    ctx.stroke();

    // Shield status badge in center
    if (shieldRatio > 0) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = barrierColor;
      ctx.lineWidth = 1;
      const bw = 90;
      const bh = 18;
      this.roundRect(ctx, (W - bw) / 2, barrierY - 9, bw, bh, 9);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = barrierColor;
      ctx.font = '900 10px monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🛡️ SHIELD ${Math.round(shieldRatio * 100)}%`, W / 2, barrierY);
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.font = '900 10px monospace, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠️ BARRIER OFFLINE ⚠️', W / 2, barrierY);
    }
    ctx.restore();
  }

  private renderGate(g: Gate) {
    const { ctx } = this;
    const isBad = g.op === 'subtract' || g.op === 'divide';
    const isWeapon = g.op === 'weapon';
    const isShield = g.op === 'shield';
    const isArmor = g.op === 'armor';
    const isFreeze = g.op === 'freeze';
    const isConverted = !!g.isConverted;

    let mainColor = '#38bdf8'; // sky blue
    let glowColor = 'rgba(56, 189, 248, 0.45)';
    let text = `+${g.value}`;

    if (isArmor) {
      mainColor = '#0284c7'; // vibrant oceanic blue / armor
      glowColor = 'rgba(2, 132, 199, 0.55)';
      text = `🛡️ 护甲 +${g.value}`;
    } else if (isFreeze) {
      mainColor = '#06b6d4'; // bright ice cyan
      glowColor = 'rgba(6, 182, 212, 0.55)';
      text = `❄️ 冰暴 5s`;
    } else if (isShield) {
      mainColor = '#14b8a6'; // teal
      glowColor = 'rgba(20, 184, 166, 0.5)';
      text = `🛡️ 护盾 +${g.value}`;
    } else if (isWeapon) {
      mainColor = '#f59e0b'; // amber gold
      glowColor = 'rgba(245, 158, 11, 0.5)';
      const cfg = g.weaponType ? WEAPON_CONFIGS[g.weaponType] : null;
      text = cfg ? `${cfg.icon} ${cfg.nameZh}` : 'CRATE';
    } else if (isConverted) {
      mainColor = '#10b981'; // emerald green for purified
      glowColor = 'rgba(16, 185, 129, 0.55)';
      text = `✨ +${g.value}`;
    } else if (isBad) {
      mainColor = '#ef4444'; // red
      glowColor = 'rgba(239, 68, 68, 0.4)';
      text = g.op === 'divide' ? `÷${g.value}` : `-${g.value}`;
    } else if (g.op === 'multiply') {
      mainColor = '#a855f7'; // purple
      glowColor = 'rgba(168, 85, 247, 0.45)';
      text = `×${g.value}`;
    }

    ctx.save();
    if (g.hitFlash > 0) {
      ctx.fillStyle = '#ffffff';
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    }

    // Gate card body with rounded corners
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = isConverted ? 3 : 2.2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isConverted ? 14 : 9;
    this.roundRect(ctx, g.x, g.y, g.width, g.height, 8);
    ctx.fill();
    ctx.stroke();

    // Top gate energy banner
    ctx.fillStyle = mainColor;
    ctx.fillRect(g.x + 4, g.y + 4, g.width - 8, 3.5);

    // Gate main text
    ctx.fillStyle = mainColor;
    ctx.font = '900 18px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText(text, g.x + g.width / 2, g.y + g.height / 2 - 4);

    // Durability (HP) Bar at bottom of gate
    const barW = g.width * 0.84;
    const barH = 5;
    const bx = g.x + (g.width - barW) / 2;
    const by = g.y + g.height - 11;
    const hpRatio = Math.max(0, Math.min(1, g.hp / g.maxHp));

    // Durability bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(bx, by, barW, barH);
    // Durability fill
    ctx.fillStyle = mainColor;
    ctx.fillRect(bx, by, barW * hpRatio, barH);

    // HP label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '900 9px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const hpHint = isBad ? `耐久 ${Math.max(0, g.hp)} (净化)` : `耐久 ${Math.max(0, g.hp)} (获取)`;
    ctx.fillText(hpHint, g.x + g.width / 2, by - 1);

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

    // Cryo Freeze visual frost aura
    if (this.freezeTimer > 0) {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, z.radius * 1.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❄️', 0, -sh / 2 - 14);
    }

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

    ctx.save();
    const sprite = this.monkeCanvas || getFallbackMonkeSprite(this.monkeId);
    const cfg = WEAPON_CONFIGS[this.currentWeapon];
    let minY = this.playerY - 20;

    const isInvul = this.invulnerableTimer > 0;
    const isAdrenaline = this.adrenalineTimer > 0;

    // Nano-Armor Forcefield Shield Dome around squad
    if (this.armor > 0) {
      ctx.save();
      const squadRadius = Math.min(80, 26 + Math.sqrt(this.units.length) * 7.5);
      const pulse = Math.sin(performance.now() * 0.006) * 3;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, squadRadius + pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Semi-transparent nano-mesh fill
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fill();
      ctx.restore();
    }

    for (const unit of this.units) {
      if (unit.y < minY) minY = unit.y;

      ctx.save();
      // Invulnerability flicker
      if (isInvul && Math.floor(performance.now() / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      const bob = Math.sin(unit.walkFrame) * 2;
      const stepTilt = Math.sin(unit.walkFrame * 2) * 0.04;
      ctx.translate(unit.x, unit.y + bob);
      ctx.rotate(stepTilt);

      // Adrenaline golden flaming aura under unit
      if (isAdrenaline) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.beginPath();
        ctx.arc(0, 0, unit.size * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

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
    const badgeW = this.armor > 0 ? 104 : 74;
    const badgeH = 22;
    const badgeY = minY - 28;
    this.roundRect(ctx, this.playerX - badgeW / 2, badgeY, badgeW, badgeH, 11);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 12px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const badgeText = this.armor > 0 ? `👥 ${this.crowdCount} | 🛡️ ${this.armor}` : `👥 ${this.crowdCount}`;
    ctx.fillText(badgeText, this.playerX, badgeY + badgeH / 2);
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
