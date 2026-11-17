// Mirror shards and the Beacon's beam for LUMEN DRIFT — v3's second verb:
// BEND THE LIGHT.
//
// The Beacon sweeps a rotating beam of light across the arena. Press Q to
// place a Mirror Shard (costs starshards, at most a few on the field): the
// beam bounces off it, so a well-placed mirror doubles the light hunting
// the swarm. A sealed loop that encloses a mirror is a PRISM LOOP: it
// bursts twice as hard and fires focus beams at the swarm. Mirrors are
// fragile — a foe that touches one chips it, and a shattered mirror drops
// its starshards back.
import { ARENA, BEACON, LIGHT, PALETTE, VIEW } from './config.js';
import { distance } from './random.js';
import { pointInPolygon } from './drift.js';

// Distance from a point to a segment, for testing foes against the beam.
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

export class Light {
  constructor() {
    this.mirrors = [];
    this.beamSegments = [];
    this.beamAngle = -Math.PI / 2;
    this.focusBeams = [];
    this.beamKills = 0;
    this.lastMirrorAt = -99;
    this._mirrorIndex = 0;
  }

  reset() {
    this.mirrors.length = 0;
    this.beamSegments.length = 0;
    this.focusBeams.length = 0;
    this.beamKills = 0;
    this.beamAngle = -Math.PI / 2;
    this.lastMirrorAt = -99;
    this._mirrorIndex = 0;
  }

  // Place a mirror shard at (x, y) if the rack has room and the player can
  // pay. Mirrors alternate their angle, so the field ends up bending light
  // in both directions.
  placeMirror(x, y, world) {
    const p = world.player;
    if (this.mirrors.length >= p.mirrorMax) {
      world.hint = 'MIRROR RACK FULL — shatter one first';
      world.hintTimer = 2;
      return false;
    }
    if (world.shards < p.mirrorCost) {
      world.hint = `NEED ${p.mirrorCost} ◆ FOR A MIRROR SHARD`;
      world.hintTimer = 2;
      return false;
    }
    world.shards -= p.mirrorCost;
    const angle = this._mirrorIndex % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
    this._mirrorIndex += 1;
    this.mirrors.push({
      x: Math.max(ARENA.x + 20, Math.min(ARENA.x + ARENA.width - 20, x)),
      y: Math.max(ARENA.y + 20, Math.min(ARENA.y + ARENA.height - 20, y)),
      angle,
      hp: LIGHT.mirrorHp,
      hitTimer: 0,
    });
    this.lastMirrorAt = world.time;
    world.stats.mirrorsPlaced = (world.stats.mirrorsPlaced || 0) + 1;
    world.audio.mirrorPlace();
    world.particles.ring(x, y, PALETTE.mirror, 70);
    world.particles.scoreText(x, y - 24, `MIRROR −${p.mirrorCost} ◆`, PALETTE.mirror);
    return true;
  }

  // The ship's own placement: a mirror where the Lumen is standing.
  tryPlaceMirror(world) {
    return this.placeMirror(world.player.x, world.player.y, world);
  }

  // Staging helper for the screenshot scenes: a free mirror, no cost.
  stageMirror(x, y, world) {
    const angle = this._mirrorIndex % 2 === 0 ? Math.PI / 4 : -Math.PI / 4;
    this._mirrorIndex += 1;
    this.mirrors.push({ x, y, angle, hp: LIGHT.mirrorHp, hitTimer: 0 });
    world.stats.mirrorsPlaced = (world.stats.mirrorsPlaced || 0) + 1;
  }

  // Does a sealed loop enclose a mirror? Then it is a prism loop.
  loopHasMirror(points) {
    for (const m of this.mirrors) {
      if (pointInPolygon(m.x, m.y, points)) return true;
    }
    return false;
  }

  update(dt, world) {
    this.beamAngle += LIGHT.beamSpeed * dt;
    this._castBeam();
    // The beam only hunts on a live night: on the title screen it sweeps
    // for show and leaves the decorative swarm alone.
    if (world.screen === 'play') {
      this._burnFoes(dt, world);
      this._grindMirrors(dt, world);
    }
    for (let i = this.focusBeams.length - 1; i >= 0; i -= 1) {
      this.focusBeams[i].t -= dt;
      if (this.focusBeams[i].t <= 0) this.focusBeams.splice(i, 1);
    }
  }

  // Ray-cast the Beacon's beam from the Beacon, bouncing off mirrors.
  _castBeam() {
    const segs = [];
    let x = BEACON.x;
    let y = BEACON.y;
    let dx = Math.cos(this.beamAngle);
    let dy = Math.sin(this.beamAngle);
    let remaining = LIGHT.beamRange;
    let lastMirror = null;
    let bounces = 0;
    while (remaining > 0) {
      let hit = null;
      let hitDist = Infinity;
      for (const m of this.mirrors) {
        if (m === lastMirror) continue;
        const rx = m.x - x;
        const ry = m.y - y;
        const along = rx * dx + ry * dy;
        if (along <= 0 || along > remaining) continue;
        const perp = Math.abs(-ry * dx + rx * dy);
        if (perp < LIGHT.mirrorRadius && along < hitDist) {
          hit = m;
          hitDist = along;
        }
      }
      if (!hit) {
        const ex = Math.max(0, Math.min(VIEW.width, x + dx * remaining));
        const ey = Math.max(0, Math.min(VIEW.height, y + dy * remaining));
        segs.push({ x1: x, y1: y, x2: ex, y2: ey });
        break;
      }
      const hx = x + dx * hitDist;
      const hy = y + dy * hitDist;
      segs.push({ x1: x, y1: y, x2: hx, y2: hy });
      // Reflect the direction across the mirror's line.
      const ux = Math.cos(hit.angle);
      const uy = Math.sin(hit.angle);
      const dot = dx * ux + dy * uy;
      dx = 2 * dot * ux - dx;
      dy = 2 * dot * uy - dy;
      x = hx + dx * 2;
      y = hy + dy * 2;
      remaining -= hitDist;
      lastMirror = hit;
      bounces += 1;
      if (bounces > LIGHT.maxBounces) break;
    }
    this.beamSegments = segs;
  }

  // Foes touching any beam segment smoulder under the light.
  _burnFoes(dt, world) {
    if (this.beamSegments.length === 0) return;
    const width = (LIGHT.beamWidth * world.player.beamWidthMul) / 2;
    const dps = LIGHT.beamDps * world.player.beamMul;
    for (const e of world.enemies) {
      if (e.hp <= 0 || e.trappedBy) continue;
      let touching = false;
      for (const s of this.beamSegments) {
        if (pointSegmentDistance(e.x, e.y, s.x1, s.y1, s.x2, s.y2) < width + e.radius * 0.5) {
          touching = true;
          break;
        }
      }
      if (!touching) continue;
      e.beamAcc = (e.beamAcc || 0) + dps * dt;
      if (world.player.beamBurn) {
        e.burnAcc = (e.burnAcc || 0) + dps * dt * 0.5;
        if (e.burnAcc >= 1) {
          e.burnAcc -= 1;
          const wasThere = world.enemies.includes(e);
          world.damageEnemy(e, 1, true);
          if (wasThere && !world.enemies.includes(e)) this.beamKills += 1;
        }
      }
      if (e.beamAcc >= 1) {
        e.beamAcc -= 1;
        const wasThere = world.enemies.includes(e);
        world.damageEnemy(e, 1, true);
        if (wasThere && !world.enemies.includes(e)) this.beamKills += 1;
      }
    }
  }

  // Foes that reach a mirror chip it — and get shoved back. A mirror at
  // zero health shatters and drops its starshards back on the field.
  _grindMirrors(dt, world) {
    for (let i = this.mirrors.length - 1; i >= 0; i -= 1) {
      const m = this.mirrors[i];
      if (m.hitTimer > 0) m.hitTimer -= dt;
      for (const e of world.enemies) {
        if (e.hp <= 0 || e.trappedBy) continue;
        if (distance(e.x, e.y, m.x, m.y) >= LIGHT.mirrorRadius + e.radius) continue;
        if (m.hitTimer > 0) break;
        m.hitTimer = 0.5;
        m.hp -= 1;
        const a = Math.atan2(e.y - m.y, e.x - m.x);
        e.vx += Math.cos(a) * 320;
        e.vy += Math.sin(a) * 320;
        world.damageEnemy(e, 1, true);
        world.particles.burst(m.x, m.y, PALETTE.mirror, 6, 160, 0.4, 2);
        if (m.hp <= 0) {
          this.mirrors.splice(i, 1);
          world.audio.prismShatter();
          world.particles.burst(m.x, m.y, PALETTE.mirror, 26, 300, 0.8, 3);
          world.particles.ring(m.x, m.y, PALETTE.mirror, 110);
          world.pickups.dropShards(m.x, m.y, LIGHT.mirrorShatterShards);
          world.particles.scoreText(m.x, m.y - 24, 'MIRROR SHATTERED', PALETTE.mirror);
        }
        break;
      }
    }
  }

  // Fire one focus beam from (x, y) toward the nearest foe, piercing
  // everything along its line. Called when a loop detonates.
  fireFocusBeam(x, y, world, damage) {
    let target = null;
    let td = Infinity;
    for (const e of world.enemies) {
      if (e.hp <= 0) continue;
      const d = distance(x, y, e.x, e.y);
      if (d < td) {
        td = d;
        target = e;
      }
    }
    const angle = target ? Math.atan2(target.y - y, target.x - x) : -Math.PI / 2;
    this._fireBeamAt(x, y, angle, world, damage);
  }

  // Fire focus beams in the four cardinal directions from (x, y): the
  // prism loop's cross-burst.
  firePrismCross(x, y, world, damage) {
    for (let i = 0; i < 4; i += 1) {
      this._fireBeamAt(x, y, (i * Math.PI) / 2 + Math.PI / 4, world, damage);
    }
  }

  _fireBeamAt(x, y, angle, world, damage) {
    const x2 = x + Math.cos(angle) * LIGHT.focusBeamLength;
    const y2 = y + Math.sin(angle) * LIGHT.focusBeamLength;
    this.focusBeams.push({ x1: x, y1: y, x2, y2, t: LIGHT.focusBeamLife, max: LIGHT.focusBeamLife });
    world.stats.focusBeams = (world.stats.focusBeams || 0) + 1;
    world.audio.focusBeam();
    const width = LIGHT.focusBeamWidth / 2;
    for (const e of world.enemies.slice()) {
      if (e.hp <= 0) continue;
      if (pointSegmentDistance(e.x, e.y, x, y, x2, y2) < width + e.radius * 0.5) {
        world.damageEnemy(e, damage, false, true);
      }
    }
  }

  draw(ctx, time) {
    // The Beacon's sweeping beam: a wide faint wash, a bright core.
    ctx.save();
    ctx.lineCap = 'round';
    for (const s of this.beamSegments) {
      ctx.shadowBlur = 18;
      ctx.shadowColor = PALETTE.beam;
      ctx.strokeStyle = 'rgba(255,233,168,0.10)';
      ctx.lineWidth = LIGHT.beamWidth * 2.4;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,233,168,0.30)';
      ctx.lineWidth = LIGHT.beamWidth;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,251,232,0.85)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    }
    ctx.restore();
    // Focus beams: thick gold flashes fading fast.
    for (const f of this.focusBeams) {
      const a = Math.max(0, f.t / f.max);
      ctx.save();
      ctx.lineCap = 'round';
      ctx.shadowBlur = 22;
      ctx.shadowColor = PALETTE.loop;
      ctx.strokeStyle = `rgba(255,233,168,${0.85 * a})`;
      ctx.lineWidth = LIGHT.focusBeamWidth * a + 4;
      ctx.beginPath();
      ctx.moveTo(f.x1, f.y1);
      ctx.lineTo(f.x2, f.y2);
      ctx.stroke();
      ctx.restore();
    }
    // Mirror shards: small diamonds, the angled face drawn bright, health
    // as dots underneath.
    for (const m of this.mirrors) {
      const glint = 0.6 + 0.4 * Math.sin(time * 5 + m.x);
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.shadowBlur = 16;
      ctx.shadowColor = PALETTE.mirror;
      ctx.fillStyle = '#dffaff';
      ctx.rotate(m.angle);
      ctx.fillRect(-9, -9, 18, 18);
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(94,242,255,${0.5 + 0.4 * glint})`;
      ctx.fillRect(-9, -2, 18, 4);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = PALETTE.mirror;
      for (let i = 0; i < LIGHT.mirrorHp; i += 1) {
        ctx.globalAlpha = i < m.hp ? 0.9 : 0.2;
        ctx.beginPath();
        ctx.arc(m.x - 8 + i * 8, m.y + LIGHT.mirrorRadius + 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
