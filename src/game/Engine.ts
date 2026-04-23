/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Player, Enemy, EnemyType, Bullet, Item, ItemType } from './Entities';
import { ParticleSystem } from './Particles';
import { ShipType, GAME_CONSTANTS, SHIP_CONFIGS } from '../types';

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  player: Player | null = null;
  player2: Player | null = null;
  enemies: Enemy[] = [];
  bullets: Bullet[] = [];
  items: Item[] = [];
  particleSystem: ParticleSystem = new ParticleSystem();
  stars: { x: number; y: number; size: number; speed: number }[] = [];
  
  score: number = 0;
  kills: number = 0;
  level: number = 1;
  isGameOver: boolean = false;
  isPaused: boolean = false;
  isTwoPlayer: boolean = false;
  
  keys: Record<string, boolean> = {};
  spawnTimer: number = 0;
  
  // Screen shake
  shakeTime: number = 0;
  shakeIntensity: number = 0;

  // Adaptive Difficulty State
  difficultyScale: number = 1.0;
  bossSpawning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.setupControls();
  }

  shake(time: number, intensity: number) {
    this.shakeTime = time;
    this.shakeIntensity = intensity;
  }

  setupControls() {
    window.addEventListener('keydown', (e) => (this.keys[e.code] = true));
    window.addEventListener('keyup', (e) => (this.keys[e.code] = false));
  }

  start(shipType: ShipType, ship2Type: ShipType | null = null) {
    this.isTwoPlayer = ship2Type !== null;
    this.player = new Player(shipType, this.isTwoPlayer ? this.canvas.width / 3 : this.canvas.width / 2, this.canvas.height - 100);
    this.player2 = ship2Type ? new Player(ship2Type, (this.canvas.width / 3) * 2, this.canvas.height - 100) : null;
    
    this.enemies = [];
    this.bullets = [];
    this.items = [];
    this.stars = Array.from({ length: 100 }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      size: Math.random() * 2,
      speed: 20 + Math.random() * 100,
    }));
    this.score = 0;
    this.kills = 0;
    this.level = 1;
    this.difficultyScale = 1.0;
    this.isGameOver = false;
    this.isPaused = false;
    this.spawnTimer = 0;
    this.bossSpawning = false;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
  }

  update(dt: number) {
    if (this.isGameOver || this.isPaused || (!this.player && !this.player2)) return;

    if (this.shakeTime > 0) this.shakeTime -= dt;

    this.updatePlayers(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateItems(dt);
    this.particleSystem.update(dt);
    
    // Update stars
    this.stars.forEach((star) => {
      star.y += star.speed * dt;
      if (star.y > this.canvas.height) {
        star.y = 0;
        star.x = Math.random() * this.canvas.width;
      }
    });

    this.checkCollisions();
    this.handleSpawning(dt);
    this.updateDifficulty();
  }

  updatePlayers(dt: number) {
    // Player 1 Controls (WASD + Space)
    // In solo mode, also allow Arrow keys
    if (this.player && this.player.health > 0) {
      const stats = this.player.stats;
      const moveLeft = this.keys['KeyA'] || (!this.isTwoPlayer && this.keys['ArrowLeft']);
      const moveRight = this.keys['KeyD'] || (!this.isTwoPlayer && this.keys['ArrowRight']);
      const moveUp = this.keys['KeyW'] || (!this.isTwoPlayer && this.keys['ArrowUp']);
      const moveDown = this.keys['KeyS'] || (!this.isTwoPlayer && this.keys['ArrowDown']);

      if (moveLeft) this.player.pos.x -= stats.speed * dt;
      if (moveRight) this.player.pos.x += stats.speed * dt;
      if (moveUp) this.player.pos.y -= stats.speed * dt;
      if (moveDown) this.player.pos.y += stats.speed * dt;

      // Constrain player to canvas
      this.player.pos.x = Math.max(this.player.radius, Math.min(this.canvas.width - this.player.radius, this.player.pos.x));
      this.player.pos.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.player.pos.y));

      if (this.keys['Space'] && this.player.fireCooldown <= 0) {
        this.fireBullet(this.player);
        this.player.fireCooldown = stats.fireRate;
      }
      this.player.update(dt);
    }

    // Player 2 Controls (Arrows + ShiftRight or Enter)
    if (this.player2 && this.player2.health > 0) {
      const stats = this.player2.stats;
      if (this.keys['ArrowLeft']) this.player2.pos.x -= stats.speed * dt;
      if (this.keys['ArrowRight']) this.player2.pos.x += stats.speed * dt;
      if (this.keys['ArrowUp']) this.player2.pos.y -= stats.speed * dt;
      if (this.keys['ArrowDown']) this.player2.pos.y += stats.speed * dt;

      // Constrain player to canvas
      this.player2.pos.x = Math.max(this.player2.radius, Math.min(this.canvas.width - this.player2.radius, this.player2.pos.x));
      this.player2.pos.y = Math.max(this.player2.radius, Math.min(this.canvas.height - this.player2.radius, this.player2.pos.y));

      if ((this.keys['ShiftRight'] || this.keys['Enter']) && this.player2.fireCooldown <= 0) {
        this.fireBullet(this.player2);
        this.player2.fireCooldown = stats.fireRate;
      }
      this.player2.update(dt);
    }
  }

  fireBullet(p: Player) {
    const stats = p.stats;
    
    if (p.powerLevel === 1) {
      this.bullets.push(new Bullet({ x: p.pos.x, y: p.pos.y - 20 }, { x: 0, y: -600 }, stats.color));
    } else if (p.powerLevel === 2) {
      this.bullets.push(new Bullet({ x: p.pos.x - 10, y: p.pos.y - 20 }, { x: 0, y: -600 }, stats.color));
      this.bullets.push(new Bullet({ x: p.pos.x + 10, y: p.pos.y - 20 }, { x: 0, y: -600 }, stats.color));
    } else {
      this.bullets.push(new Bullet({ x: p.pos.x, y: p.pos.y - 20 }, { x: 0, y: -600 }, stats.color));
      this.bullets.push(new Bullet({ x: p.pos.x - 15, y: p.pos.y - 10 }, { x: -100, y: -600 }, stats.color));
      this.bullets.push(new Bullet({ x: p.pos.x + 15, y: p.pos.y - 10 }, { x: 100, y: -600 }, stats.color));
    }
  }

  updateEnemies(dt: number) {
    this.enemies.forEach((enemy) => {
      if (enemy.type === EnemyType.BOSS) {
        // Boss AI: Move side to side and follow player slightly
        const isRage = enemy.health < enemy.maxHealth * 0.4;
        const currentSpeed = enemy.vel.x * (isRage ? 1.5 : 1.0);
        enemy.pos.x += currentSpeed * dt;
        
        if (enemy.pos.x < 100 || enemy.pos.x > this.canvas.width - 100) {
          enemy.vel.x *= -1;
        }
        
        // Homing bullets if boss
        const fireChance = isRage ? 0.05 : 0.02;
        if (Math.random() < fireChance) {
          const alivePlayers = [this.player, this.player2].filter(pl => pl && pl.health > 0);
          if (alivePlayers.length > 0) {
            const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]!;
            const dx = target.pos.x - enemy.pos.x;
            const dy = target.pos.y - enemy.pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.bullets.push(new Bullet(
              { x: enemy.pos.x, y: enemy.pos.y },
              { x: (dx / dist) * (isRage ? 300 : 200), y: (dy / dist) * (isRage ? 300 : 200) },
              isRage ? enemy.color : '#FFFFFF',
              false
            ));
          }
        }
      } else {
        enemy.update(dt);
      }
    });

    // Remove off-screen enemies
    this.enemies = this.enemies.filter((e) => e.pos.y < this.canvas.height + 100);
  }

  updateBullets(dt: number) {
    this.bullets.forEach((b) => b.update(dt));
    this.bullets = this.bullets.filter((b) => b.pos.y > -50 && b.pos.y < this.canvas.height + 50);
  }

  updateItems(dt: number) {
    this.items.forEach((item) => item.update(dt));
    this.items = this.items.filter((item) => item.pos.y < this.canvas.height + 50);
  }

  checkCollisions() {
    const players = [this.player, this.player2].filter(p => p !== null);

    // Bullet vs Enemy/Players
    this.bullets = this.bullets.filter((bullet) => {
      if (!bullet.isPlayer) {
        // Enemy bullet vs Players
        for (const p of players) {
          if (p!.health <= 0) continue;
          const dx = bullet.pos.x - p!.pos.x;
          const dy = bullet.pos.y - p!.pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bullet.radius + p!.radius) {
            p!.health -= bullet.damage;
            this.particleSystem.emit(p!.pos, '#FFF', 5, 50);
            this.shake(0.2, 5);
            if (players.every(pl => pl!.health <= 0)) this.gameOver();
            return false;
          }
        }
        return true;
      }

      // Player bullet vs Enemy
      let hit = false;
      this.enemies.forEach((enemy) => {
        if (hit) return;
        const dx = bullet.pos.x - enemy.pos.x;
        const dy = bullet.pos.y - enemy.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bullet.radius + enemy.radius) {
          enemy.health -= bullet.damage;
          hit = true;
          this.particleSystem.emit(bullet.pos, enemy.color, 3, 30);
          if (enemy.health <= 0) {
            this.killEnemy(enemy);
          }
        }
      });
      return !hit;
    });

    // Players vs Enemy
    this.enemies.forEach((enemy) => {
      for (const p of players) {
        if (p!.health <= 0) continue;
        const dx = enemy.pos.x - p!.pos.x;
        const dy = enemy.pos.y - p!.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < enemy.radius + p!.radius) {
          p!.health -= 20;
          enemy.health = 0;
          this.killEnemy(enemy);
          this.shake(0.3, 10);
          if (players.every(pl => pl!.health <= 0)) this.gameOver();
        }
      }
    });

    // Players vs Item
    this.items = this.items.filter((item) => {
      for (const p of players) {
        if (p!.health <= 0) continue;
        const dx = item.pos.x - p!.pos.x;
        const dy = item.pos.y - p!.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < item.radius + p!.radius) {
          if (item.type === ItemType.POWER) p!.powerLevel = Math.min(3, p!.powerLevel + 1);
          if (item.type === ItemType.SPEED) p!.speedLevel = Math.min(5, p!.speedLevel + 1);
          return false;
        }
      }
      return true;
    });
  }

  killEnemy(enemy: Enemy) {
    this.kills++;
    this.score += enemy.scoreValue;
    this.particleSystem.emit(enemy.pos, enemy.color, enemy.type === EnemyType.BOSS ? 50 : 15, 150);
    this.enemies = this.enemies.filter((e) => e !== enemy);

    if (enemy.type === EnemyType.BOSS) {
      this.bossSpawning = false;
      this.level++;
      // Drop guaranteed items
      this.items.push(new Item({ x: enemy.pos.x, y: enemy.pos.y }, Math.random() > 0.5 ? ItemType.POWER : ItemType.SPEED));
    } else if (Math.random() < 0.1) {
      this.items.push(new Item({ x: enemy.pos.x, y: enemy.pos.y }, Math.random() > 0.5 ? ItemType.POWER : ItemType.SPEED));
    }
  }

  handleSpawning(dt: number) {
    if (this.bossSpawning) return;

    this.spawnTimer -= dt * 1000;
    if (this.spawnTimer <= 0) {
      if (this.kills > 0 && this.kills % GAME_CONSTANTS.BOSS_LEVEL_INCREMENT === 0 && !this.bossSpawning) {
        this.spawnBoss();
      } else {
        this.spawnEnemy();
      }
      
      const spawnRate = Math.max(GAME_CONSTANTS.MIN_SPAWN_RATE, GAME_CONSTANTS.BASE_SPAWN_RATE - (this.kills * GAME_CONSTANTS.SPAWN_RATE_REDUCTION_PER_KILL * 1000));
      this.spawnTimer = spawnRate;
    }
  }

  spawnEnemy() {
    const x = Math.random() * (this.canvas.width - 40) + 20;
    const speed = GAME_CONSTANTS.BASE_ENEMY_SPEED * (1 + this.kills * GAME_CONSTANTS.VELOCITY_MULTIPLIER_PER_KILL);
    const type = Math.random() > 0.8 ? EnemyType.INTERCEPTOR : EnemyType.DRONE;
    const color = type === EnemyType.INTERCEPTOR ? '#FF8800' : '#8800FF';
    const hp = type === EnemyType.INTERCEPTOR ? 30 : 10;
    
    this.enemies.push(new Enemy(type, { x, y: -50 }, { x: 0, y: speed }, hp, color, type === EnemyType.INTERCEPTOR ? 200 : 100));
  }

  spawnBoss() {
    this.bossSpawning = true;
    const x = this.canvas.width / 2;
    const hp = 500 + this.level * 200;
    this.enemies.push(new Enemy(EnemyType.BOSS, { x, y: 100 }, { x: 100, y: 0 }, hp, '#FF0055', 2000));
  }

  updateDifficulty() {
    this.difficultyScale = 1.0 + (this.kills * 0.05);
  }

  gameOver() {
    this.isGameOver = true;
  }

  draw() {
    this.ctx.save();
    if (this.shakeTime > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(sx, sy);
    }

    this.ctx.fillStyle = '#050505';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw stars
    this.ctx.fillStyle = '#FFF';
    this.stars.forEach((star) => {
      this.ctx.globalAlpha = star.speed / 120;
      this.ctx.fillRect(star.x, star.y, star.size, star.size);
    });
    this.ctx.globalAlpha = 1.0;

    // Draw grid - Sophisticated Dark radial grid
    this.ctx.save();
    this.ctx.globalAlpha = 0.05;
    this.ctx.fillStyle = '#22d3ee';
    for (let x = 0; x < this.canvas.width; x += 60) {
      for (let y = 0; y < this.canvas.height; y += 60) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.restore();

    this.items.forEach((item) => item.draw(this.ctx));
    this.enemies.forEach((enemy) => {
      enemy.draw(this.ctx);
      if (enemy.type === EnemyType.BOSS) {
        // Special Boss HUD in Sophisticated Dark style
        this.ctx.save();
        const bossBarW = Math.min(600, this.canvas.width * 0.8);
        const bossBarX = (this.canvas.width - bossBarW) / 2;
        const bossBarY = 100;

        // Pulse text
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 10px Orbitron';
        this.ctx.fillStyle = '#ef4444';
        const pulse = 0.7 + Math.sin(Date.now() * 0.005) * 0.3;
        this.ctx.globalAlpha = pulse;
        this.ctx.fillText('BOSS APPROACHING: MEGA SENTINEL', this.canvas.width / 2, bossBarY - 10);
        
        // Bar background
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = '#18181b';
        this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.fillRect(bossBarX, bossBarY, bossBarW, 4);
        this.ctx.strokeRect(bossBarX, bossBarY, bossBarW, 4);

        // Bar fill
        this.ctx.fillStyle = '#dc2626';
        this.ctx.fillRect(bossBarX, bossBarY, bossBarW * (enemy.health / enemy.maxHealth), 4);
        this.ctx.restore();
      }
    });
    this.bullets.forEach((bullet) => bullet.draw(this.ctx));
    if (this.player && this.player.health > 0) this.player.draw(this.ctx);
    if (this.player2 && this.player2.health > 0) this.player2.draw(this.ctx);
    this.particleSystem.draw(this.ctx);
    this.ctx.restore();
  }
}
