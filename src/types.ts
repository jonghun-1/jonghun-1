/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ShipType {
  VANGUARD = 'vanguard',
  STEER = 'steer',
  BEHEMOTH = 'behemoth',
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  vel: Vector2;
  radius: number;
  health: number;
  maxHealth: number;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

export interface ShipStats {
  speed: number;
  maxSpeed: number;
  fireRate: number;
  health: number;
  color: string;
  name: string;
  description: string;
}

export const SHIP_CONFIGS: Record<ShipType, ShipStats> = {
  [ShipType.VANGUARD]: {
    name: '뱅가드 X-1',
    description: '모든 미션에 적합한 균형 잡힌 성능을 제공합니다.',
    speed: 300,
    maxSpeed: 500,
    fireRate: 0.25,
    health: 100,
    color: '#00F0FF', // Cyan
  },
  [ShipType.STEER]: {
    name: '스티어 S-7',
    description: '높은 속도와 연사력을 가졌지만 내구도가 낮습니다.',
    speed: 450,
    maxSpeed: 700,
    fireRate: 0.15,
    health: 60,
    color: '#00FF41', // Green
  },
  [ShipType.BEHEMOTH]: {
    name: '베히모스 B-9',
    description: '느리지만 거의 파괴 불가능한 중갑갑을 갖췄습니다.',
    speed: 200,
    maxSpeed: 350,
    fireRate: 0.4,
    health: 250,
    color: '#FF0055', // Red/Pink
  },
};

export const GAME_CONSTANTS = {
  BOSS_LEVEL_INCREMENT: 15,
  BASE_ENEMY_SPEED: 100,
  VELOCITY_MULTIPLIER_PER_KILL: 0.02,
  SPAWN_RATE_REDUCTION_PER_KILL: 0.005,
  BASE_SPAWN_RATE: 2000, // ms
  MIN_SPAWN_RATE: 500, // ms
};
