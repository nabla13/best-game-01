// Enemies and the night director for LUMEN DRIFT.
// Nine kinds, each with its own movement, look and threat: the drifting
// Mote, the sine-weaving Weaver, the ranged Spitter, the telegraphing
// Charger that rushes in a straight line, the splitting Brute, the
// Splitter that bursts into motes, the long-range Sniper, the Prism
// Matriarch, the night-4 boss who sweeps a hostile beam and teleports, and
// the Void Warden, the night-7 boss with three phases. Some kinds hunt the
// ship; some hunt the Beacon — and the swarm's mix is what the player reads.
import { ARENA, BEACON, ENEMIES, PALETTE, VIEW } from './config.js';
import { bossForNight, nightPlan } from './nights.js';
import { angleTo, clamp, distance, pick, range } from './random.js';

let nextId = 1;

export class Enemy {
  constructor(kind, x, y, night, rng, difficulty) {
    const def = ENEMIES[kind];
    this.id = nextId;
    nextId += 1;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = def.radius;
    this.hp = Math.max(1, Math.round((def.hp + Math.floor(night / 3) * (kind === 'brute' ? 2 : 1)) * (difficulty?.hpMul ?? 1)));
    this.maxHp = this.hp;
    this.speed = def.speed * (1 + night * 0.02) * (difficulty?.speedMul ?? 1);
    this.score = def.score;
    this.damage = def.damage;
    this.color = def.color;
    this.shard = def.shard;
    // Kinds that hunt "both" roll their prey per enemy: some chase the
    // ship, some drift for the Beacon's light.
    this.target = def.target === 'both' ? (rng() < 0.4 ? 'beacon' : 'ship') : def.target;
    this.phase = rng() * Math.PI * 2;
    this.fireTimer = range(rng, 1, 2.5);
    this.flash = 0;
    this.spawnT = 0;
    this.burnAcc = 0;
    this.beamAcc = 0;
    this.trappedBy = false;
    this.burstTimer = 3;
    this.summonTimer = 5;
    this.spiralTimer = 1;
    this.enraged = false;
    this.chargeState = 'roam';
    this.chargeTimer = 0;
    this.chargeAngle = 0;
    this.beamAngle = 0;
    this.teleportTimer = 9;
  }

  update(dt, world) {
    const player = world.player;
    // A trapped foe is held by the loop: it does not move or shoot.
    if (this.trappedBy) {
      this.flash = Math.max(0, this.flash - dt);
      this.spawnT += dt;
      return;
    }
    const tx = this.target === 'beacon' ? BEACON.x : player.x;
    const ty = this.target === 'beacon' ? BEACON.y : player.y;
    const d = distance(this.x, this.y, tx, ty);
    const a = angleTo(this.x, this.y, tx, ty);
    this.flash = Math.max(0, this.flash - dt);
    this.spawnT += dt;
    if (this.kind === 'mote' || this.kind === 'weaver') {
      if (this.kind === 'mote') {
        this.vx += Math.cos(a) * 260 * dt;
        this.vy += Math.sin(a) * 260 * dt;
      } else {
        const wobble = Math.sin(world.time * 3 + this.phase) * 140;
        const px = Math.cos(a);
        const py = Math.sin(a);
        this.vx += (px * this.speed + -py * wobble * 0.4) * dt * 3;
        this.vy += (py * this.speed + px * wobble * 0.4) * dt * 3;
      }
      // A foe that reaches the Beacon drinks its light and burns out.
      if (this.target === 'beacon' && d < BEACON.radius + this.radius) {
        world.drainBeacon(this);
      }
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
    } else if (this.kind === 'charger') {
      this.updateCharger(dt, world, d, a);
    } else if (this.kind === 'brute') {
      this.vx += Math.cos(a) * 160 * dt;
      this.vy += Math.sin(a) * 160 * dt;
    } else if (this.kind === 'splitter') {
      const wobble = Math.sin(world.time * 4 + this.phase) * 90;
      const px = Math.cos(a);
      const py = Math.sin(a);
      this.vx += (px * this.speed + -py * wobble * 0.3) * dt * 3;
      this.vy += (py * this.speed + px * wobble * 0.3) * dt * 3;
    } else if (this.kind === 'sniper') {
      const want = 430;
      const dir = d > want + 40 ? 1 : d < want - 40 ? -1 : 0;
      this.vx += Math.cos(a) * 140 * dir * dt;
      this.vy += Math.sin(a) * 140 * dir * dt;
      this.fireTimer -= dt;
      if (this.fireTimer <= 0 && d < 640) {
        this.fireTimer = range(world.rng, 2.4, 3.2);
        world.bullets.fireEnemy(this.x, this.y, a, 420, 1, 5);
        world.audio.snipe();
      }
    } else if (this.kind === 'prism') {
      this.updatePrism(dt, world, d, a);
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

  // The Charger telegraphs, then rushes in one straight line: dodge it,
  // or better, dash across its path and let it run into your driftline.
  updateCharger(dt, world, d, a) {
    if (this.chargeState === 'roam') {
      this.vx += Math.cos(a) * 200 * dt;
      this.vy += Math.sin(a) * 200 * dt;
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0 && d < 380) {
        this.chargeState = 'aim';
        this.chargeTimer = 0.7;
        this.chargeAngle = a;
        world.audio.chargeAim();
      }
    } else if (this.chargeState === 'aim') {
      this.vx *= 0.9;
      this.vy *= 0.9;
      this.chargeAngle = a;
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.chargeState = 'rush';
        this.chargeTimer = 0.5;
        this.vx = Math.cos(this.chargeAngle) * 540;
        this.vy = Math.sin(this.chargeAngle) * 540;
        world.audio.chargeRush();
      }
    } else {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.chargeState = 'roam';
        this.chargeTimer = range(world.rng, 1.2, 2.2);
      }
    }
  }

  // The Prism Matriarch: she orbits the Beacon at range, sweeps a hostile
  // beam that cuts anything it touches, summons weavers, and teleports when
  // the ship closes in. Below half health her beam sweeps faster and she
  // summons more. The beam is the tell — stay out of its line, or bend
  // your own light back at her.
  updatePrism(dt, world, d, a) {
    const frac = this.hp / this.maxHp;
    if (!this.enraged && frac < 0.5) {
      this.enraged = true;
      world.particles.ring(this.x, this.y, PALETTE.prism, 240);
      world.audio.bossAlarm();
      world.banner = 'THE MATRIARCH SHATTERS — FASTER BEAM';
      world.bannerTimer = 2.0;
    }
    // Orbit the Beacon at range, drifting slowly around it.
    const orbitA = world.time * 0.25 + this.phase;
    const tx = BEACON.x + Math.cos(orbitA) * 260;
    const ty = BEACON.y + Math.sin(orbitA) * 200;
    this.vx += (tx - this.x) * 1.2 * dt;
    this.vy += (ty - this.y) * 1.2 * dt;
    // Her hostile beam sweeps around her.
    this.beamAngle = world.time * (this.enraged ? 1.5 : 0.9) + this.phase;
    const bx = this.x + Math.cos(this.beamAngle) * 420;
    const by = this.y + Math.sin(this.beamAngle) * 420;
    const p = world.player;
    if (p.alive) {
      const dx = bx - this.x;
      const dy = by - this.y;
      const len2 = dx * dx + dy * dy;
      let t = 0;
      if (len2 > 0) t = Math.max(0, Math.min(1, ((p.x - this.x) * dx + (p.y - this.y) * dy) / len2));
      const cx = this.x + t * dx;
      const cy = this.y + t * dy;
      if (distance(p.x, p.y, cx, cy) < 14 + p.radius) {
        p.takeHit(world);
      }
    }
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) {
      this.summonTimer = this.enraged ? 4 : 6;
      for (let i = 0; i < (this.enraged ? 3 : 2); i += 1) {
        const ang = world.rng() * Math.PI * 2;
        world.spawnEnemy('weaver', this.x + Math.cos(ang) * 80, this.y + Math.sin(ang) * 80);
      }
    }
    this.teleportTimer -= dt;
    if (this.teleportTimer <= 0) {
      this.teleportTimer = 9;
      world.particles.burst(this.x, this.y, PALETTE.prism, 30, 320, 0.7, 3);
      this.x = range(world.rng, ARENA.x + 120, ARENA.x + ARENA.width - 120);
      this.y = range(world.rng, ARENA.y + 120, ARENA.y + ARENA.height - 120);
      world.particles.burst(this.x, this.y, PALETTE.prism, 30, 320, 0.7, 3);
      world.audio.bossAlarm();
    }
  }

  updateWarden(dt, world, d, a) {
    // Three phases: bursts, then spirals and summons, then an enraged
    // charge. Each phase change is announced with a ring and an alarm.
    const frac = this.hp / this.maxHp;
    if (!this.enraged && frac < 0.66) {
      this.enraged = true;
      world.particles.ring(this.x, this.y, PALETTE.warden, 260);
      world.audio.bossAlarm();
      world.banner = 'THE WARDEN UNRAVELS — SPIRALS';
      world.bannerTimer = 2.0;
    }
    if (frac < 0.33 && this.chargeState !== 'enraged') {
      this.chargeState = 'enraged';
      world.particles.ring(this.x, this.y, PALETTE.warden, 320);
      world.audio.bossAlarm();
      world.banner = 'THE WARDEN RAGES';
      world.bannerTimer = 2.0;
    }
    const phase = frac < 0.33 ? 3 : frac < 0.66 ? 2 : 1;
    const speedMul = phase === 3 ? 1.6 : phase === 2 ? 1.2 : 1;
    this.vx += Math.cos(a) * 120 * speedMul * dt;
    this.vy += Math.sin(a) * 120 * speedMul * dt;
    this.burstTimer -= dt;
    if (this.burstTimer <= 0) {
      this.burstTimer = phase === 3 ? 2.0 : phase === 2 ? 2.6 : 3.2;
      const count = phase === 3 ? 16 : phase === 2 ? 12 : 10;
      for (let i = 0; i < count; i += 1) {
        const ang = (i / count) * Math.PI * 2 + this.phase;
        world.bullets.fireEnemy(this.x, this.y, ang, 190, 1, 7);
      }
      world.audio.bossAlarm();
    }
    if (phase >= 2) {
      this.spiralTimer -= dt;
      if (this.spiralTimer <= 0) {
        this.spiralTimer = 0.35;
        this.phase += 0.55;
        world.bullets.fireEnemy(this.x, this.y, this.phase, 230, 1, 6);
        world.bullets.fireEnemy(this.x, this.y, this.phase + Math.PI, 230, 1, 6);
      }
    }
    this.summonTimer -= dt;
    if (this.summonTimer <= 0) {
      this.summonTimer = phase === 3 ? 4 : 6;
      for (let i = 0; i < (phase === 3 ? 4 : 3); i += 1) {
        const ang = world.rng() * Math.PI * 2;
        world.spawnEnemy(phase >= 2 ? 'weaver' : 'mote', this.x + Math.cos(ang) * 90, this.y + Math.sin(ang) * 90);
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
    } else if (this.kind === 'charger') {
      // A diamond that flashes white while it aims its rush.
      if (this.chargeState === 'aim') {
        ctx.fillStyle = Math.floor(time * 12) % 2 === 0 ? '#ffffff' : this.color;
        ctx.rotate(this.chargeAngle);
      }
      ctx.beginPath();
      ctx.moveTo(this.radius, 0);
      ctx.lineTo(0, this.radius * 0.7);
      ctx.lineTo(-this.radius, 0);
      ctx.lineTo(0, -this.radius * 0.7);
      ctx.closePath();
      ctx.fill();
      if (this.chargeState === 'aim') {
        ctx.rotate(-this.chargeAngle);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,84,112,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(this.chargeAngle) * (this.radius + 6), Math.sin(this.chargeAngle) * (this.radius + 6));
        ctx.lineTo(Math.cos(this.chargeAngle) * (this.radius + 70), Math.sin(this.chargeAngle) * (this.radius + 70));
        ctx.stroke();
      }
    } else if (this.kind === 'brute') {
      ctx.rotate(time * 0.6);
      ctx.fillRect(-this.radius * 0.8, -this.radius * 0.8, this.radius * 1.6, this.radius * 1.6);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(-this.radius * 0.4, -this.radius * 0.4, this.radius * 0.8, this.radius * 0.8);
    } else if (this.kind === 'splitter') {
      ctx.rotate(time * 1.2 + this.phase);
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
      ctx.fillStyle = 'rgba(4,6,15,0.6)';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.kind === 'sniper') {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#0a2010';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-this.radius, 0);
      ctx.lineTo(this.radius, 0);
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(0, this.radius);
      ctx.stroke();
    } else if (this.kind === 'prism') {
      // The Prism Matriarch: a rotating diamond with a sweeping hostile
      // beam drawn from her heart, and a bright shard core.
      ctx.save();
      ctx.strokeStyle = 'rgba(255,93,242,0.35)';
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(this.beamAngle) * 420, Math.sin(this.beamAngle) * 420);
      ctx.stroke();
      ctx.restore();
      ctx.rotate(time * 0.8 + this.phase);
      ctx.beginPath();
      ctx.moveTo(0, -this.radius);
      ctx.lineTo(this.radius * 0.7, 0);
      ctx.lineTo(0, this.radius);
      ctx.lineTo(-this.radius * 0.7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -this.radius * 0.4);
      ctx.lineTo(this.radius * 0.28, 0);
      ctx.lineTo(0, this.radius * 0.4);
      ctx.lineTo(-this.radius * 0.28, 0);
      ctx.closePath();
      ctx.fill();
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
    // A small beacon marker over foes hunting the Beacon's light.
    if (this.target === 'beacon' && this.kind !== 'warden') {
      ctx.save();
      ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,215,106,0.9)';
      ctx.fillText('◆', this.x, this.y - this.radius - 16);
      ctx.restore();
    }
  }
}

// Picks where a night's enemies enter: just outside the arena edge.
export function spawnPoint(rng) {
  const side = Math.floor(rng() * 4);
  if (side === 0) return { x: range(rng, ARENA.x, ARENA.x + ARENA.width), y: ARENA.y + 10 };
  if (side === 1) return { x: range(rng, ARENA.x, ARENA.x + ARENA.width), y: ARENA.y + ARENA.height - 10 };
  if (side === 2) return { x: ARENA.x + 10, y: range(rng, ARENA.y, ARENA.y + ARENA.height) };
  return { x: ARENA.x + ARENA.width - 10, y: range(rng, ARENA.y, ARENA.y + ARENA.height) };
}

export class NightDirector {
  constructor(rng) {
    this.rng = rng;
    this.reset();
  }

  reset() {
    this.queue = [];
    this.spawnTimer = 0;
    this.active = false;
  }

  startNight(night) {
    this.queue = [];
    const boss = bossForNight(night);
    if (boss) {
      this.queue.push(boss);
      this.active = true;
      this.spawnTimer = 0.5;
      return;
    }
    const plan = nightPlan(night);
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
        // Spawn in small groups so nights arrive as squads, not a trickle.
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
      world.onNightCleared();
    }
  }
}
