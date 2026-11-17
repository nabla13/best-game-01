// Driftlines and loops for LUMEN DRIFT — the game's signature move.
// A dash paints a burning line of light behind the ship. Foes that touch
// the line burn. When the ship crosses a line it painted earlier, the
// stretch between the crossing and the ship SEALS into a loop: everything
// inside is trapped, held still, and then the loop detonates for heavy
// damage and bonus shards. Dash to weave, not just to escape.
import { DRIFT, LIGHT, PALETTE } from './config.js';
import { distance } from './random.js';

// Distance from a point to a segment, for testing foes against the line.
function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = 0;
  if (len2 > 0) t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return distance(px, py, cx, cy);
}

function polygonArea(points) {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const xi = points[i].x;
    const yi = points[i].y;
    const xj = points[j].x;
    const yj = points[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export class Drift {
  constructor() {
    this.points = [];
    this.loops = [];
    this.loopsSealed = 0;
    this.loopsDetonated = 0;
  }

  reset() {
    this.points.length = 0;
    this.loops.length = 0;
    this.loopsSealed = 0;
    this.loopsDetonated = 0;
  }

  // Lay one painted point where the ship is, if it has travelled far
  // enough from the last one. Called while the ship is weaving (dashing).
  paint(x, y, time) {
    const last = this.points[this.points.length - 1];
    if (last && distance(last.x, last.y, x, y) < DRIFT.pointSpacing) return;
    this.points.push({ x, y, t: time });
    if (this.points.length > 260) this.points.shift();
  }

  // Expire old paint, burn foes touching the line, close loops, and run
  // sealed loops to their detonation.
  update(dt, world) {
    const now = world.time;
    const life = DRIFT.trailLife * world.player.lineLifeMul;
    while (this.points.length > 0 && now - this.points[0].t > life) {
      this.points.shift();
    }
    this._burnFoes(dt, world);
    this._closeLoop(world);
    for (let i = this.loops.length - 1; i >= 0; i -= 1) {
      const loop = this.loops[i];
      loop.timer -= dt;
      // Trapped foes are held still and keep burning.
      for (const e of loop.trapped) {
        if (e.hp > 0) {
          e.vx = 0;
          e.vy = 0;
          e.burnAcc = (e.burnAcc || 0) + DRIFT.burnDps * dt * 2;
          if (e.burnAcc >= 1) {
            e.burnAcc -= 1;
            world.damageEnemy(e, 1, false, true);
          }
        }
      }
      if (loop.timer <= 0) {
        this.loops.splice(i, 1);
        this._detonate(loop, world);
      }
    }
  }

  // Foes touching any painted segment smoulder and take burn damage.
  _burnFoes(dt, world) {
    if (this.points.length < 2) return;
    const radius = DRIFT.burnRadius * world.player.lineWidthMul;
    for (const e of world.enemies) {
      if (e.hp <= 0 || e.trappedBy) continue;
      let touching = false;
      for (let i = 0; i < this.points.length - 1; i += 1) {
        const a = this.points[i];
        const b = this.points[i + 1];
        if (pointSegmentDistance(e.x, e.y, a.x, a.y, b.x, b.y) < radius + e.radius * 0.5) {
          touching = true;
          break;
        }
      }
      if (touching) {
        e.burnAcc = (e.burnAcc || 0) + DRIFT.burnDps * dt * world.player.burnMul;
        if (e.burnAcc >= 1) {
          e.burnAcc -= 1;
          world.damageEnemy(e, 1, true);
        }
      }
    }
  }

  // The ship's head crossed its own painted line: seal the stretch from
  // the crossing to the head into a loop, if it is big enough to matter.
  _closeLoop(world) {
    const pts = this.points;
    if (pts.length < DRIFT.minLoopPoints + 2) return;
    const head = world.player;
    const now = world.time;
    let cross = -1;
    const lastSearchable = pts.length - DRIFT.minLoopPoints;
    for (let i = 0; i < lastSearchable; i += 1) {
      if (now - pts[i].t < 0.6) continue;
      if (distance(head.x, head.y, pts[i].x, pts[i].y) < DRIFT.crossDistance) {
        cross = i;
        break;
      }
    }
    if (cross < 0) return;
    const polygon = pts.slice(cross).concat([{ x: head.x, y: head.y, t: now }]);
    if (polygon.length < DRIFT.minLoopPoints) return;
    if (polygonArea(polygon) < DRIFT.minLoopArea) return;
    this.sealLoop(polygon, world);
    // The line is spent when it seals: the ship starts a fresh trail.
    this.points.length = 0;
  }

  sealLoop(polygon, world) {
    const trapped = world.enemies.filter((e) => e.hp > 0 && pointInPolygon(e.x, e.y, polygon));
    for (const e of trapped) e.trappedBy = true;
    this.loops.push({ points: polygon, timer: DRIFT.sealTime, trapped });
    this.loopsSealed += 1;
    world.stats.loopsSealed = this.loopsSealed;
    world.audio.loopSeal();
    world.particles.ring(world.player.x, world.player.y, PALETTE.loop, 90);
    if (trapped.length > 0) {
      world.particles.scoreText(
        world.player.x,
        world.player.y - 30,
        `LOOP SEALED ×${trapped.length}`,
        PALETTE.loop,
      );
    }
  }

  _detonate(loop, world) {
    this.loopsDetonated += 1;
    world.stats.loopsDetonated = this.loopsDetonated;
    // A loop that encloses a mirror is a prism loop: it bursts twice as
    // hard and fires focus beams. Every loop fires one focus beam at the
    // swarm from its heart.
    const isPrism = world.light.loopHasMirror(loop.points);
    const damage = DRIFT.detonateDamage * world.player.loopMul * (isPrism ? LIGHT.prismLoopMul : 1);
    if (isPrism) {
      world.stats.prismLoops = (world.stats.prismLoops || 0) + 1;
    }
    // Every foe inside the ring when it bursts takes the hit.
    for (const e of world.enemies.slice()) {
      if (e.hp > 0 && pointInPolygon(e.x, e.y, loop.points)) {
        world.damageEnemy(e, damage, false, true);
      }
    }
    for (const e of loop.trapped) e.trappedBy = false;
    const cx = loop.points.reduce((s, p) => s + p.x, 0) / loop.points.length;
    const cy = loop.points.reduce((s, p) => s + p.y, 0) / loop.points.length;
    world.particles.burst(cx, cy, PALETTE.loop, 40, 340, 0.9, 4);
    world.particles.ring(cx, cy, PALETTE.loopSeal, 220);
    world.particles.addShake(10);
    world.audio.loopBurst();
    world.hitStop = Math.max(world.hitStop, 0.07);
    if (isPrism) {
      world.particles.scoreText(cx, cy - 30, 'PRISM LOOP', PALETTE.loopSeal);
      world.light.firePrismCross(cx, cy, world, damage);
    } else {
      world.light.fireFocusBeam(cx, cy, world, damage);
    }
  }

  // Staging helper for the screenshot scenes: paint a ring around a point
  // and seal it at once, so a frame can show a loop trapping its foes.
  stageLoop(cx, cy, radius, world) {
    const polygon = [];
    const count = 28;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      polygon.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius, t: world.time });
    }
    this.sealLoop(polygon, world);
  }

  draw(ctx, time) {
    // The painted line: bright where fresh, fading where old.
    if (this.points.length > 1) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 1; i < this.points.length; i += 1) {
        const a = this.points[i - 1];
        const b = this.points[i];
        const age = (time - a.t) / 3.5;
        const alpha = Math.max(0.08, 1 - age);
        ctx.strokeStyle = `rgba(174,252,255,${alpha * 0.9})`;
        ctx.lineWidth = DRIFT.lineWidth * (1 - age * 0.5);
        ctx.shadowBlur = 14;
        ctx.shadowColor = PALETTE.drift;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }
    // Sealed loops: a filled golden ring, pulsing as it counts down.
    for (const loop of this.loops) {
      const frac = Math.max(0, loop.timer / DRIFT.sealTime);
      const pulse = 0.5 + 0.5 * Math.sin(time * 10);
      ctx.save();
      ctx.beginPath();
      loop.points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fillStyle = `rgba(255,215,106,${0.10 + 0.10 * pulse})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255,233,168,${0.45 + 0.45 * frac})`;
      ctx.lineWidth = 3 + 2 * pulse;
      ctx.shadowBlur = 18;
      ctx.shadowColor = PALETTE.loop;
      ctx.stroke();
      ctx.restore();
    }
  }
}
