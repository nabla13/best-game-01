// Particles, shockwaves, floating score text, screen shake and the
// animated starfield for LUMEN DRIFT. Everything here is cosmetic: it never
// changes the rules, only how they feel. The nebula background is painted
// once onto an offscreen canvas and reused every frame.
import { VIEW, PALETTE, BEACON } from './config.js';
import { range } from './random.js';

export class Particles {
  constructor(rng) {
    this.rng = rng;
    this.list = [];
    this.rings = [];
    this.texts = [];
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.stars = [];
    for (let i = 0; i < 140; i += 1) {
      this.stars.push({
        x: rng() * VIEW.width,
        y: rng() * VIEW.height,
        z: 0.25 + rng() * 0.75,
        size: 0.6 + rng() * 1.8,
        twinkle: rng() * Math.PI * 2,
      });
    }
    this.nebula = this._paintNebula();
  }

  _paintNebula() {
    const off = document.createElement('canvas');
    off.width = VIEW.width;
    off.height = VIEW.height;
    const c = off.getContext('2d');
    c.fillStyle = PALETTE.background;
    c.fillRect(0, 0, VIEW.width, VIEW.height);
    const blobs = [
      { x: 220, y: 160, r: 330, color: PALETTE.nebulaA },
      { x: 1050, y: 120, r: 300, color: PALETTE.nebulaB },
      { x: 640, y: 620, r: 380, color: PALETTE.nebulaC },
      { x: 1150, y: 600, r: 260, color: PALETTE.nebulaA },
    ];
    for (const b of blobs) {
      const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, b.color);
      g.addColorStop(1, 'rgba(4,6,15,0)');
      c.globalAlpha = 0.55;
      c.fillStyle = g;
      c.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    c.globalAlpha = 1;
    return off;
  }

  burst(x, y, color, count, speed, life = 0.7, size = 3) {
    for (let i = 0; i < count; i += 1) {
      const a = this.rng() * Math.PI * 2;
      const v = speed * (0.3 + this.rng() * 0.7);
      this.list.push({
        x, y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: life * (0.5 + this.rng() * 0.5),
        maxLife: life,
        size: size * (0.6 + this.rng() * 0.8),
        color,
      });
    }
    if (this.list.length > 500) this.list.splice(0, this.list.length - 500);
  }

  trail(x, y, color) {
    this.list.push({
      x: x + range(this.rng, -3, 3),
      y: y + range(this.rng, -3, 3),
      vx: range(this.rng, -20, 20),
      vy: range(this.rng, -20, 20),
      life: 0.35,
      maxLife: 0.35,
      size: 2.5,
      color,
    });
  }

  ring(x, y, color, maxRadius = 120) {
    this.rings.push({ x, y, radius: 8, maxRadius, life: 0.45, maxLife: 0.45, color });
  }

  scoreText(x, y, text, color = PALETTE.text) {
    this.texts.push({ x, y, text, life: 0.9, maxLife: 0.9, color });
    if (this.texts.length > 24) this.texts.shift();
  }

  addShake(mag) {
    this.shakeMag = Math.min(16, this.shakeMag + mag);
    this.shakeTime = 0.3;
  }

  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i -= 1) {
      const p = this.list[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.list.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 2.2 * dt;
      p.vy *= 1 - 2.2 * dt;
    }
    for (let i = this.rings.length - 1; i >= 0; i -= 1) {
      const r = this.rings[i];
      r.life -= dt;
      r.radius += (r.maxRadius - r.radius) * 8 * dt;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      const t = this.texts[i];
      t.life -= dt;
      t.y -= 42 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeMag = 0;
    }
    for (const s of this.stars) s.twinkle += dt * 2;
  }

  shakeOffset() {
    if (this.shakeMag <= 0) return { x: 0, y: 0 };
    return {
      x: range(this.rng, -this.shakeMag, this.shakeMag),
      y: range(this.rng, -this.shakeMag, this.shakeMag),
    };
  }

  drawBackground(ctx, time) {
    ctx.drawImage(this.nebula, 0, 0);
    for (const s of this.stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(s.twinkle));
      ctx.globalAlpha = a * s.z;
      ctx.fillStyle = PALETTE.star;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
    // A slow drifting glow around the Beacon, at the arena's heart.
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.8);
    const g = ctx.createRadialGradient(BEACON.x, BEACON.y, 0, BEACON.x, BEACON.y, 150 + pulse * 40);
    g.addColorStop(0, 'rgba(255,215,106,0.07)');
    g.addColorStop(1, 'rgba(255,215,106,0)');
    ctx.fillStyle = g;
    ctx.fillRect(BEACON.x - 190, BEACON.y - 190, 380, 380);
  }

  draw(ctx) {
    for (const p of this.list) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const r of this.rings) {
      ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
