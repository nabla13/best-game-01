// Projectiles for LUMEN DRIFT: the player's bolts and the enemies' orbs.
// Two plain arrays, no allocation in the hot path beyond spawns; dead
// bullets are swapped out. Collision tests live in world.js.
import { VIEW } from './config.js';

export class Bullets {
  constructor() {
    this.player = [];
    this.enemy = [];
  }

  reset() {
    this.player.length = 0;
    this.enemy.length = 0;
  }

  firePlayer(x, y, angle, speed, damage, pierce, radius = 5) {
    this.player.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage, pierce, radius, life: 1.6 });
  }

  fireEnemy(x, y, angle, speed, damage = 1, radius = 6) {
    this.enemy.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage, radius, life: 6 });
  }

  clearEnemyBullets() {
    this.enemy.length = 0;
  }

  update(dt) {
    for (let i = this.player.length - 1; i >= 0; i -= 1) {
      const b = this.player[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0 || b.x < -20 || b.x > VIEW.width + 20 || b.y < -20 || b.y > VIEW.height + 20) {
        this.player[i] = this.player[this.player.length - 1];
        this.player.pop();
      }
    }
    for (let i = this.enemy.length - 1; i >= 0; i -= 1) {
      const b = this.enemy[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0 || b.x < -20 || b.x > VIEW.width + 20 || b.y < -20 || b.y > VIEW.height + 20) {
        this.enemy[i] = this.enemy[this.enemy.length - 1];
        this.enemy.pop();
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 12;
    for (const b of this.player) {
      ctx.shadowColor = '#8ff7ff';
      ctx.fillStyle = '#bffaff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5ef2ff';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of this.enemy) {
      ctx.shadowColor = '#ff5470';
      ctx.fillStyle = '#ff8ba0';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5470';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
