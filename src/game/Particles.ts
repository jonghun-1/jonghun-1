/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector2 } from '../types';

export class Particle {
  id: string = Math.random().toString(36).substr(2, 9);
  life: number = 1.0;
  decay: number;
  color: string;
  size: number;

  constructor(
    public pos: Vector2,
    public vel: Vector2,
    color: string,
    size?: number
  ) {
    this.decay = 0.02 + Math.random() * 0.05;
    this.color = color;
    this.size = size || 2 + Math.random() * 3;
  }

  update(dt: number) {
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.life -= this.decay;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;
    ctx.fillRect(this.pos.x, this.pos.y, this.size, this.size);
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }
}

export class ParticleSystem {
  particles: Particle[] = [];

  emit(pos: Vector2, color: string, count: number = 10, speed: number = 100) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const mag = Math.random() * speed;
      this.particles.push(
        new Particle(
          { x: pos.x, y: pos.y },
          { x: Math.cos(angle) * mag, y: Math.sin(angle) * mag },
          color
        )
      );
    }
  }

  update(dt: number) {
    this.particles = this.particles.filter((p) => {
      p.update(dt);
      return p.life > 0;
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => p.draw(ctx));
  }
}
