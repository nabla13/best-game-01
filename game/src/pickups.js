// Pickups for LUMEN DRIFT: starshards (score + Nova charge), hearts (repair)
// and overdrive cells (instant full Nova). Shards drift toward the player
// once inside the magnet radius, so collecting feels generous.
import { VIEW, PALETTE, SHARD_SCORE } from './config.js';
import { clamp, distance } from './random.js';

export class Pickups {
  constructor(rng) {
    this.rng = rng;
    this.list = [];
  }

  reset() {
    this.list.length = 0;
  }

  dropShards(x, y, count) {
    for (let i = 0; i < count; i += 1) {
      const a = this.rng() * Math.PI * 2;
      const v = 60 + this.rng() * 120;
      this.list.push({
        kind: 'shard',
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        radius: 7,
        life: 12,
        bob: this.rng() * Math.PI * 2,
      });
    }
  }

  dropHeart(x, y) {
    this.list.push({ kind: 'heart', x, y, vx: 0, vy: -30, radius: 10, life: 12, bob: 0 });
  }

  dropCell(x, y) {
    this.list.push({ kind: 'cell', x, y, vx: 0, vy: -30, radius: 10, life: 12, bob: 0 });
  }

  update(dt, player) {
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const p = this.list[i];
      p.life -= dt;
      p.bob += dt * 3;
      if (p.life <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      const d = distance(p.x, p.y, player.x, player.y);
      if (d < player.magnet) {
        const pull = 900 * (1 - d / player.magnet) + 240;
        const a = Math.atan2(player.y - p.y, player.x - p.x);
        p.vx += Math.cos(a) * pull * dt;
        p.vy += Math.sin(a) * pull * dt;
      }
      p.vx *= 1 - 2.5 * dt;
      p.vy *= 1 - 2.5 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.x = clamp(p.x, 12, VIEW.width - 12);
      p.y = clamp(p.y, 12, VIEW.height - 12);
    }
  }

  collect(player) {
    // Returns what the player picked up this frame: { shards, hearts, cells }.
    const got = { shards: 0, hearts: 0, cells: 0 };
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const p = this.list[i];
      if (distance(p.x, p.y, player.x, player.y) < p.radius + player.radius + 4) {
        if (p.kind === 'shard') got.shards += 1;
        if (p.kind === 'heart') got.hearts += 1;
        if (p.kind === 'cell') got.cells += 1;
        this.list.splice(i, 1);
      }
    }
    return got;
  }

  draw(ctx, time) {
    ctx.save();
    ctx.shadowBlur = 10;
    for (const p of this.list) {
      const bobY = Math.sin(p.bob) * 2;
      if (p.kind === 'shard') {
        ctx.shadowColor = PALETTE.shard;
        ctx.fillStyle = PALETTE.shard;
        ctx.save();
        ctx.translate(p.x, p.y + bobY);
        ctx.rotate(time * 2 + p.bob);
        ctx.fillRect(-4, -4, 8, 8);
        ctx.fillStyle = PALETTE.shardCore;
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      } else if (p.kind === 'heart') {
        ctx.shadowColor = PALETTE.heart;
        ctx.fillStyle = PALETTE.heart;
        ctx.font = '18px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', p.x, p.y + bobY);
      } else {
        ctx.shadowColor = PALETTE.nova;
        ctx.strokeStyle = PALETTE.nova;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y + bobY, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = PALETTE.nova;
        ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', p.x, p.y + bobY + 0.5);
      }
    }
    ctx.restore();
  }
}

export { SHARD_SCORE };
