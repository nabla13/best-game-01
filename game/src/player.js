// The player's light-ship, the Lumen, for LUMEN DRIFT.
// WASD/arrows steer with acceleration, the mouse aims, holding fire shoots,
// Space/Shift dashes through danger, and E (or right click) spends a full
// Nova meter on a blast that clears bullets and wounds everything near.
import { ARENA, PALETTE, PLAYER } from './config.js';
import { angleTo, clamp } from './random.js';

export class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 640;
    this.y = 480;
    this.vx = 0;
    this.vy = 0;
    this.angle = -Math.PI / 2;
    this.radius = PLAYER.radius;
    this.hull = PLAYER.hull;
    this.maxHull = PLAYER.maxHull;
    this.speed = PLAYER.speed;
    this.fireInterval = PLAYER.fireInterval;
    this.bulletSpeed = PLAYER.bulletSpeed;
    this.bulletDamage = PLAYER.bulletDamage;
    this.multishot = 1;
    this.pierce = 0;
    this.magnet = PLAYER.magnet;
    this.nova = 0;
    this.novaChargeRate = 1;
    this.fireTimer = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashCooldownMax = PLAYER.dashCooldown;
    this.invulnTimer = 0;
    this.shield = false;
    this.alive = true;
    this.trailTimer = 0;
  }

  get dashReady() {
    return this.dashCooldown <= 0;
  }

  get novaReady() {
    return this.nova >= PLAYER.novaMax;
  }

  update(dt, input, world) {
    if (!this.alive) return;
    const mx = input.moveX();
    const my = input.moveY();
    const len = Math.hypot(mx, my) || 1;
    this.vx += (mx / len) * PLAYER.accel * dt;
    this.vy += (my / len) * PLAYER.accel * dt;
    const drag = Math.exp(-PLAYER.friction * dt);
    this.vx *= drag;
    this.vy *= drag;
    const speed = Math.hypot(this.vx, this.vy);
    const maxSpeed = this.dashTimer > 0 ? PLAYER.dashSpeed : this.speed;
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed;
      this.vy = (this.vy / speed) * maxSpeed;
    }
    this.x = clamp(this.x + this.vx * dt, ARENA.x + this.radius, ARENA.x + ARENA.width - this.radius);
    this.y = clamp(this.y + this.vy * dt, ARENA.y + this.radius, ARENA.y + ARENA.height - this.radius);
    this.angle = angleTo(this.x, this.y, input.mouseX, input.mouseY);

    if (this.dashTimer > 0) this.dashTimer -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    if ((input.wasPressed('Space') || input.wasPressed('ShiftLeft') || input.wasPressed('ShiftRight')) && this.dashReady) {
      this.startDash(world);
    }
    if ((input.wasPressed('KeyE') || input.rightPressed) && this.novaReady) {
      world.fireNova();
    }

    this.fireTimer -= dt;
    if (input.firing() && this.fireTimer <= 0) {
      this.fireTimer = this.fireInterval;
      world.playerShoot();
    }

    this.trailTimer -= dt;
    if (this.trailTimer <= 0) {
      this.trailTimer = 0.03;
      world.particles.trail(this.x - Math.cos(this.angle) * 14, this.y - Math.sin(this.angle) * 14, PALETTE.player);
    }
  }

  startDash(world) {
    this.dashTimer = PLAYER.dashTime;
    this.dashCooldown = this.dashCooldownMax;
    this.invulnTimer = Math.max(this.invulnTimer, PLAYER.dashInvuln);
    const dx = this.vx;
    const dy = this.vy;
    const len = Math.hypot(dx, dy) || 1;
    this.vx = (dx / len) * PLAYER.dashSpeed;
    this.vy = (dy / len) * PLAYER.dashSpeed;
    world.audio.dash();
    world.particles.ring(this.x, this.y, PALETTE.player, 60);
  }

  takeHit(world) {
    if (!this.alive || this.invulnTimer > 0 || this.dashTimer > 0) return false;
    if (this.shield) {
      this.shield = false;
      this.invulnTimer = PLAYER.invulnAfterHit;
      world.particles.ring(this.x, this.y, '#b78cff', 90);
      world.audio.hit();
      return true;
    }
    this.hull -= 1;
    this.invulnTimer = PLAYER.invulnAfterHit;
    world.audio.hurt();
    world.particles.addShake(9);
    world.particles.burst(this.x, this.y, PALETTE.danger, 22, 260, 0.6, 3);
    if (this.hull <= 0) {
      this.alive = false;
      world.onPlayerDeath();
    }
    return true;
  }

  heal(amount) {
    this.hull = Math.min(this.maxHull, this.hull + amount);
  }

  draw(ctx, time) {
    if (!this.alive) return;
    const blink = this.invulnTimer > 0 && Math.floor(time * 14) % 2 === 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    if (blink) ctx.globalAlpha = 0.35;
    ctx.shadowBlur = 18;
    ctx.shadowColor = PALETTE.player;
    // Hull: a sleek arrow-ship.
    ctx.fillStyle = PALETTE.player;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -11);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-12, 11);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = PALETTE.playerCore;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();
    // Engine flame.
    const flame = 8 + Math.sin(time * 30) * 3;
    ctx.fillStyle = '#ffb03a';
    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(-12 - flame, 0);
    ctx.lineTo(-12, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Aegis shield ring.
    if (this.shield) {
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(time * 4);
      ctx.strokeStyle = '#b78cff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
