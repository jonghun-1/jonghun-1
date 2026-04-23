/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector2, ShipType, SHIP_CONFIGS } from '../types';

export class Bullet {
  id: string = Math.random().toString(36).substr(2, 9);
  radius: number = 3;
  
  constructor(
    public pos: Vector2,
    public vel: Vector2,
    public color: string,
    public isPlayer: boolean = true,
    public damage: number = 10
  ) {}

  update(dt: number) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

export class Entity {
  id: string = Math.random().toString(36).substr(2, 9);
  health: number;
  maxHealth: number;

  constructor(
    public pos: Vector2,
    public vel: Vector2,
    public radius: number,
    health: number
  ) {
    this.health = health;
    this.maxHealth = health;
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Override in subclasses
  }

  update(dt: number) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
  }
}

export class Player extends Entity {
  shipType: ShipType;
  fireCooldown: number = 0;
  powerLevel: number = 1;
  speedLevel: number = 0;

  constructor(shipType: ShipType, x: number, y: number) {
    const config = SHIP_CONFIGS[shipType];
    super({ x, y }, { x: 0, y: 0 }, 20, config.health);
    this.shipType = shipType;
  }

  get stats() {
    const base = SHIP_CONFIGS[this.shipType];
    const speedBonus = this.speedLevel * 20;
    return {
      ...base,
      speed: Math.min(base.maxSpeed, base.speed + speedBonus),
    };
  }

  update(dt: number) {
    super.update(dt);
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const stats = this.stats;
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    
    // Draw sophisticated ship (SVG path-like)
    ctx.strokeStyle = stats.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = stats.color;
    
    const s = 0.6;
    ctx.scale(s, s);
    ctx.translate(-32, -32); // Offset to center

    if (this.shipType === ShipType.VANGUARD) {
      // Balanced Fighter
      ctx.beginPath();
      ctx.moveTo(32, 4);
      ctx.lineTo(12, 56);
      ctx.lineTo(32, 48);
      ctx.lineTo(52, 56);
      ctx.closePath();
      ctx.stroke();
    } else if (this.shipType === ShipType.STEER) {
      // Sleek Interceptor
      ctx.beginPath();
      ctx.moveTo(32, 4);
      ctx.lineTo(24, 60);
      ctx.lineTo(32, 52);
      ctx.lineTo(40, 60);
      ctx.closePath();
      ctx.stroke();
      // Side wings
      ctx.beginPath();
      ctx.moveTo(24, 50); ctx.lineTo(8, 62); ctx.lineTo(16, 62); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(40, 50); ctx.lineTo(56, 62); ctx.lineTo(48, 62); ctx.stroke();
    } else if (this.shipType === ShipType.BEHEMOTH) {
      // Tanky Heavy
      ctx.strokeRect(16, 20, 32, 40);
      ctx.beginPath();
      ctx.moveTo(16, 20); ctx.lineTo(4, 50); ctx.lineTo(16, 50); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(48, 20); ctx.lineTo(60, 50); ctx.lineTo(48, 50); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(32, 4); ctx.lineTo(32, 20); ctx.stroke();
    }
    
    // Fill with secondary theme color
    ctx.fillStyle = stats.color + '33';
    ctx.fill();

    // Small engine core
    ctx.fillStyle = this.shipType === ShipType.BEHEMOTH ? '#FF8800' : '#ec4899';
    ctx.fillRect(28, 40, 8, 12);
    
    // Thruster effect
    const thrustPulse = 0.4 + Math.sin(Date.now() * 0.02) * 0.2;
    ctx.globalAlpha = thrustPulse;
    const gradient = ctx.createLinearGradient(32, 56, 32, 80);
    gradient.addColorStop(0, stats.color);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(28, 56, 8, 20);
    
    ctx.restore();
  }
}

export enum EnemyType {
  DRONE = 'drone',
  INTERCEPTOR = 'interceptor',
  BOSS = 'boss',
}

export class Enemy extends Entity {
  type: EnemyType;
  color: string;
  scoreValue: number;

  constructor(type: EnemyType, pos: Vector2, vel: Vector2, health: number, color: string, score: number) {
    let radius = 15;
    if (type === EnemyType.BOSS) radius = 60;
    super(pos, vel, radius, health);
    this.type = type;
    this.color = color;
    this.scoreValue = score;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    if (this.type === EnemyType.BOSS) {
      // Mega Demon Boss
      ctx.beginPath();
      // Main head
      ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
      // Horns
      ctx.moveTo(-20, -30); ctx.lineTo(-40, -60); ctx.lineTo(-10, -30);
      ctx.moveTo(20, -30); ctx.lineTo(40, -60); ctx.lineTo(10, -30);
      // Wings
      ctx.moveTo(-30, 0); ctx.bezierCurveTo(-80, -40, -80, 40, -30, 20);
      ctx.moveTo(30, 0); ctx.bezierCurveTo(80, -40, 80, 40, 30, 20);
      ctx.stroke();
      
      // Eyes
      ctx.fillStyle = '#FF0000';
      ctx.beginPath(); ctx.arc(-10, -5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(10, -5, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 5, 2, 0, Math.PI * 2); ctx.fill();
      
      // Health bar above boss handled in Engine.ts
    } else if (this.type === EnemyType.DRONE) {
      // Spider Drone
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2); // Body
      // 8 Legs
      for(let i=0; i<8; i++) {
        const ang = (i * Math.PI * 2) / 8 + Math.sin(Date.now() * 0.01) * 0.2;
        ctx.moveTo(Math.cos(ang)*8, Math.sin(ang)*8);
        ctx.lineTo(Math.cos(ang)*18, Math.sin(ang)*18);
      }
      ctx.stroke();
    } else {
      // Demon Interceptor
      ctx.beginPath();
      // V-Shape body
      ctx.moveTo(0, -15); ctx.lineTo(12, 10); ctx.lineTo(0, 5); ctx.lineTo(-12, 10); ctx.closePath();
      // Horns
      ctx.moveTo(-5, -10); ctx.lineTo(-8, -18);
      ctx.moveTo(5, -10); ctx.lineTo(8, -18);
      ctx.stroke();
    }
    
    ctx.restore();
  }
}

export enum ItemType {
  POWER = 'P',
  SPEED = 'S',
}

export class Item {
  id: string = Math.random().toString(36).substr(2, 9);
  radius: number = 12;

  constructor(public pos: Vector2, public type: ItemType) {}

  update(dt: number) {
    this.pos.y += 50 * dt; // Slow drop
  }

  draw(ctx: CanvasRenderingContext2D) {
    const color = this.type === ItemType.POWER ? '#FF00FF' : '#FFFF00';
    ctx.fillStyle = color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type, this.pos.x, this.pos.y);
    ctx.shadowBlur = 0;
  }
}
