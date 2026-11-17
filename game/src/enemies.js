// Enemies and the wave director for LUMEN DRIFT.
// Five kinds, each with its own movement, look and threat: the drifting
// Mote, the sine-weaving Weaver, the ranged Spitter, the splitting Brute,
// and the Void Warden, the wave-10 boss with phases and radial bursts.
import { ARENA, ENEMIES, PALETTE, VIEW, BOSS_WAVE, wavePlan } from './config.js';
import { angleTo, clamp, distance, pick, range } from './random.js';

let nextId = 1;

export class Enemy {
  constructor(kind, x, y, wave, rng) {
    const def = ENEMIES[kind];
    this.id = nextId;
    nextId += 1;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = def.radius;
    this.hp = def.hp + Math.floor(wave / 4) * (kind === 'brute' ? 2 : 1);
    this.maxHp = this.hp;
    this.speed = def.speed * (1 + wave * 0.02);
    this.score = def.score;
    this.damage = def.damage;
    this.color = def.color;
    this.shard = def.shard;
    this.phase = rng() * Math.PI * 2;
    this.fireTimer = range(rng, 1, 2.5);
    this.flash = 0;
    this.spawnT = 0;
    this.burstTimer = 3;
    this.summonTimer = 5;
    this.enraged = false;
  }

  update(dt, world) {
    const player = world.player;
    const d = distance(this.x, this.y, player.x, player.y);
    const a = angleTo(this.x, this.y, player.x, player.y);
    this.flash = Math.max(0, this.flash - dt);
    this.spawnT += dt;
    if (this.kind === 'mote') {
      this.vx += Math.cos(a) * 260 * dt;
      this.vy += Math.sin(a) * 260 * dt;
    } else if (this.kind === 'weaver') {
      const wobble = Math.sin(world.time * 3 + this.phase) * 140;
      const px = Math.cos(a);
      const py = Math.sin(a);
      this.vx += (px * this.speed + -py * wobble * 0.4) * dt * 3;
      this.vy += (py * this.speed + px * wobble * 0.4) * dt * 3;
    } else if (this.kind === 'spitter') {
      const want = 260;
      const dir = d > want + 30 ? 1 : d < want - 30 ? -1 : 0;
      this.vx += Math.cos(a) * 200 * dir * dt;
      this.vy += Math.sin(a) * 200 * dir * dt;
      this.vx += Math.cos(a + Math.PI / 2) * 60 * Math.sin(world.time + this.phase) * dt;
      this.vy += Math.sin(a + Math.PI / 2) * 60 * Math.sin(world.time + this.phase) * dt;
      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && d < 520) {
        this.fireTimer = range(world.rng, 1.6, 2.4);
        world.bullets.fireEnemy(this.x, this.y, a, 240, 1, 6);
        world.audio.hit();
      }
    } else if (this.kind === 'brute') {
      this.vx += Math.cos(a) * 160 * dt;
      this.vy += Math.sin(a) * 160 * dt;
    } else if (this.kind === 'warden') {
      this.updateWarden(dt, world, d, a);
    }
    const drag = Math.exp(-2.2 * dt);
    this.vx *= drag;
    this.vy *= drag;
    const speed = Math.hypot(this.vx, this.vy);
    const cap = this.kind === 'warden' ? this.speed * 1.4 : this.speed * 1.8;
    if (speed > cap) {
      this.vx = (this.vx / speed) * cap;
      this.vy = (this.vy / speed) * cap;
    }
    this.x = clamp(this.x + this.vx * dt, ARENA.x + this.radius, ARENA.x + ARENA.width - this.radius);
    this.y = clamp(this.y + this.vy * dt, ARENA.y + this.radius, ARENA.y + ARENA.height - this.radius);
  }

  updateWarden(dt, world, d, a) {
    // Phase 2 below half health: faster, denser bursts.
    if (!this.enraged && this.hp < this.maxHp / 2) {
      this.enraged = true;
      world.particles.ring(this.x, this.y, PALETTE.warden, 260);
      world.audio.bossAlarm();
    }
    const speedMul = this.enraged ? 1.5 : 1;
    this.vx += Math.cos(a) * 120 * speedMul * dt;
    this.vy += Math.sin(a) * 120 * speedMul * dt;
    this.burstTimer -= dt;
    if (this.burstTimer <= 0) {
      this.burstTimer = this.enraged ? 2.2 : 3.2;
      const count = this.enraged ? 14 : 10;
      for (let i = 0; i < count; i += 1) {
        const ang = (i / count) * Math.PI * 2 + this.phase;
        world.bullets.fireEnemy(this.x, this.y, ang, 190, 1, 7);
      }
      world.audio.bossAlarm();
    }
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) {
      this.summonTimer = 6;
      for (let i = 0; i < 3; i += 1) {
        const ang = world.rng() * Math.PI * 2;
        world.spawnEnemy('mote', this.x + Math.cos(ang) * 90, this.y + Math.sin(ang) * 90);
      }
    }
  }

  draw(ctx, time) {
    const flash = this.flash > 0;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowBlur = 14;
    ctx.shadowColor = this.color;
    ctx.fillStyle = flash ? '#ffffff' : this.color;
    if (this.kind === 'mote') {
      ctx.rotate(time * 1.5 + this.phase);
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius * 0.8, this.radius * 0.7);
      ctx.lineTo(-this.radius * 0.8, this.radius * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (this.kind === 'weaver') {
      ctx.rotate(Math.sin(time * 2 + this.phase) * 0.6);
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const ang = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? this.radius : this.radius * 0.45;
        const px = Math.cos(ang) * r;
        const py = Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    } else if (this.kind === 'spitter') {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#0a2010';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === 'brute') {
      ctx.rotate(time * 0.6);
      ctx.fillRect(-this.radius * 0.8, -this.radius * 0.8, this.radius * 1.6, this.radius * 1.6);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(-this.radius * 0.4, -this.radius * 0.4, this.radius * 0.8, this.radius * 0.8);
    } else {
      // The Void Warden: a huge rotating hex with a pulsing core.
      ctx.rotate(time * 0.4);
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const ang = (i / 6) * Math.PI * 2;
        const px = Math.cos(ang) * this.radius;
        const py = Math.sin(ang) * this.radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      const pulse = 0.6 + 0.4 * Math.sin(time * 5);
      ctx.fillStyle = `rgba(255,255,255,${0.5 * pulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.35 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Health bar for tough foes.
    if (this.maxHp > 2 && this.hp < this.maxHp) {
      const w = this.radius * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(this.x - w / 2, this.y - this.radius - 12, w, 5);
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x - w / 2, this.y - this.radius - 12, w * (this.hp / this.maxHp), 5);
    }
  }
}

// Picks where a wave's enemies enter: just outside the arena edge.
export function spawnPoint(rng) {
  const side = Math.floor(rng() * 4);
  if (side === 0) return { x: range(rng, ARENA.x, ARENA.x + ARENA.width), y: ARENA.y + 10 };
  if (side === 1) return { x: range(rng, ARENA.x, ARENA.x + ARENA.width), y: ARENA.y + ARENA.height - 10 };
  if (side === 2) return { x: ARENA.x + 10, y: range(rng, ARENA.y, ARENA.y + ARENA.height) };
  return { x: ARENA.x + ARENA.width - 10, y: range(rng, ARENA.y, ARENA.y + ARENA.height) };
}

export class WaveDirector {
  constructor(rng) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.queue = [];
    this.spawnTimer = 0;
    this.betweenTimer = 0;
    this.active = false;
  }

  startWave(wave) {
    this.queue = [];
    if (wave === BOSS_WAVE) {
      this.queue.push('warden');
      this.active = true;
      this.spawnTimer = 0.5;
      return;
    }
    const plan = wavePlan(wave);
    let budget = plan.budget;
    while (budget > 0) {
      const kind = pick(this.rng, plan.kinds);
      const cost = plan.cost[kind];
      if (cost > budget && kind !== 'mote') continue;
      this.queue.push(kind);
      budget -= cost;
    }
    this.active = true;
    this.spawnTimer = 0.4;
  }

  update(dt, world) {
    if (!this.active) return;
    if (this.queue.length > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        // Spawn in small groups so waves arrive as squads, not a trickle.
        const group = Math.min(this.queue.length, 1 + Math.floor(world.wave / 3));
        for (let i = 0; i < group; i += 1) {
          const kind = this.queue.shift();
          const p = spawnPoint(this.rng);
          world.spawnEnemy(kind, p.x, p.y);
        }
        this.spawnTimer = Math.max(0.25, 0.9 - world.wave * 0.05);
      }
    } else if (world.enemies.length === 0) {
      this.active = false;
      world.onWaveCleared();
    }
  }
}
