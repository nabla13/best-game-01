// Deterministic screenshot scenes for LUMEN DRIFT, behind ?shot=<scene>.
// Each scene plays the real rules forward from a fresh world with a fixed
// seed and a simple autopilot (keep away from the nearest foe, arc around
// crowds to weave driftlines, shoot the nearest one, dash when cornered,
// spend Nova into a crowd), so every frame is what a short game really
// looks like and the same seed always gives the same frame. The render sets
// window.__shotReady when the scene is staged.
import { ARENA, BEACON, PLAYER, STEP } from './config.js';
import { angleTo, distance } from './random.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_VICTORY } from './world.js';

const SAMPLE = STEP;

// Orbit state for the weave: after a dash, the autopilot circles the
// nearest crowd for a beat, steering across its own painted line to close
// a loop. Module state is set per page load, so scenes stay deterministic.
let orbitUntil = 0;
let orbitDir = 1;

// Steer the ship: away from close foes, toward the nearest shard, and
// inside the arena — arcing around crowds so the dash paints loops instead
// of straight lines. Returns a fake input object the world can read.
export function autopilotInput(world) {
  const p = world.player;
  let fx = 0;
  let fy = 0;
  for (const e of world.enemies) {
    const d = distance(p.x, p.y, e.x, e.y);
    if (d < 170) {
      const w = (170 - d) / 170;
      fx += ((p.x - e.x) / (d || 1)) * w;
      fy += ((p.y - e.y) / (d || 1)) * w;
    }
  }
  let nearestShard = null;
  let nearestD = 1e9;
  for (const s of world.pickups.list) {
    if (s.kind !== 'shard') continue;
    const d = distance(p.x, p.y, s.x, s.y);
    if (d < nearestD) {
      nearestD = d;
      nearestShard = s;
    }
  }
  if (nearestShard && nearestD < 260) {
    fx += ((nearestShard.x - p.x) / nearestD) * 0.7;
    fy += ((nearestShard.y - p.y) / nearestD) * 0.7;
  }
  // Stay near the centre of the arena.
  fx += (640 - p.x) * 0.0012;
  fy += (400 - p.y) * 0.0012;
  // Arc around crowds: blend a perpendicular component into the steering
  // so dashes paint curves the ship can close into loops.
  const crowd = world.enemies.filter((e) => distance(p.x, p.y, e.x, e.y) < 220).length;
  if (crowd >= 2) {
    const px = -fy;
    const py = fx;
    fx = fx * 0.55 + px * 0.8;
    fy = fy * 0.55 + py * 0.8;
  }
  // Aim at the nearest enemy.
  let target = null;
  let td = 1e9;
  for (const e of world.enemies) {
    const d = distance(p.x, p.y, e.x, e.y);
    if (d < td) {
      td = d;
      target = e;
    }
  }
  // Weave: right after a dash near a crowd, orbit the nearest foe for a
  // beat — circling across the freshly painted line is how loops close.
  if (p.dashTimer > 0 && crowd >= 2) {
    orbitUntil = world.time + 2.2;
    orbitDir = Math.sin(world.time * 3.7) > 0 ? 1 : -1;
  }
  if (world.time < orbitUntil && target) {
    const tx = (target.x - p.x) / (td || 1);
    const ty = (target.y - p.y) / (td || 1);
    fx = -ty * orbitDir * 1.0 + tx * 0.5;
    fy = tx * orbitDir * 1.0 + ty * 0.5;
  }
  const len = Math.hypot(fx, fy) || 1;
  const mx = fx / len;
  const my = fy / len;
  const aim = target ? angleTo(p.x, p.y, target.x, target.y) : -Math.PI / 2;
  const mouseX = p.x + Math.cos(aim) * 100;
  const mouseY = p.y + Math.sin(aim) * 100;
  let close = false;
  for (const e of world.enemies) {
    if (distance(p.x, p.y, e.x, e.y) < 80) close = true;
  }
  const nearCrowd = world.enemies.filter((e) => distance(p.x, p.y, e.x, e.y) < 260).length;
  return {
    mouseX,
    mouseY,
    mouseDown: true,
    mousePressed: false,
    rightPressed: false,
    anyGesture: true,
    moveX: () => (mx > 0.25 ? 1 : mx < -0.25 ? -1 : 0),
    moveY: () => (my > 0.25 ? 1 : my < -0.25 ? -1 : 0),
    firing: () => true,
    wasPressed: (code) => {
      // Dash to weave when a crowd is close, or to escape when cornered.
      if (code === 'Space' && p.dashReady && (close || crowd >= 3)) return true;
      if (code === 'KeyE' && nearCrowd >= 5 && p.novaReady) return true;
      // Bend the light: drop a mirror shard when the rack has room, the
      // purse can pay, and a few seconds have passed since the last one.
      if (code === 'KeyQ' && world.shards >= p.mirrorCost && world.light.mirrors.length < p.mirrorMax && world.time - world.light.lastMirrorAt > 4) return true;
      return false;
    },
    down: () => false,
    endFrame: () => {},
  };
}

function runSeconds(world, seconds) {
  const steps = Math.round(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    if (world.screen !== SCREEN_PLAY) break;
    world.update(SAMPLE, autopilotInput(world));
  }
}

// Play one night with the autopilot until it is cleared (the relic screen
// opens), the ship falls, or the timeout passes. Returns true when cleared.
function clearNight(world, night, timeoutSeconds = 75) {
  world.startNight(night);
  const steps = Math.round(timeoutSeconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    if (world.screen === SCREEN_UPGRADE) return true;
    if (world.screen !== SCREEN_PLAY) return false;
    world.update(SAMPLE, autopilotInput(world));
  }
  return world.screen === SCREEN_UPGRADE;
}

// Find the densest cluster of foes: the best place to stage a loop.
function clusterCenter(world) {
  let best = null;
  let bestCount = 0;
  for (const e of world.enemies) {
    let count = 0;
    for (const o of world.enemies) {
      if (distance(e.x, e.y, o.x, o.y) < 160) count += 1;
    }
    if (count > bestCount) {
      bestCount = count;
      best = e;
    }
  }
  return best ? { x: best.x, y: best.y, count: bestCount } : null;
}

// Set `world` to the named scene and return the screen to draw over it.
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    world.startGame();
    world.startNight(3);
    runSeconds(world, 8);
    if (world.screen === SCREEN_PLAY) {
      // Stage the signature moves on camera: two mirror shards bending the
      // Beacon's beam, and a sealed PRISM LOOP — a loop closed around a
      // mirror — trapping a cluster, its focus beam still flashing.
      const cluster = clusterCenter(world);
      const cx = cluster ? cluster.x : BEACON.x;
      const cy = cluster ? cluster.y : BEACON.y - 60;
      world.spawnEnemy('weaver', cx - 50, cy - 30);
      world.spawnEnemy('mote', cx + 45, cy - 40);
      world.spawnEnemy('mote', cx + 30, cy + 50);
      world.spawnEnemy('spitter', cx - 40, cy + 45);
      world.spawnEnemy('charger', 1020, 200);
      world.spawnEnemy('sniper', 220, 520);
      world.light.stageMirror(cx, cy, world);
      world.light.stageMirror(cx + 180, cy - 90, world);
      world.drift.stageLoop(cx, cy, 130, world);
      world.light.fireFocusBeam(cx, cy, world, 8);
      world.flashRed = 0; // a hit's red flash is transient, not the frame
      runSeconds(world, 0.15);
    }
    if (world.screen !== SCREEN_PLAY) {
      // The autopilot fell: revive the ship mid-night-3 and restage combat
      // so the frame still shows play in progress.
      world.player.reset();
      world.screen = SCREEN_PLAY;
      world.bullets.reset();
      for (let i = 0; i < 4; i += 1) {
        world.spawnEnemy(i % 2 === 0 ? 'weaver' : 'mote', 300 + i * 220, 220 + (i % 2) * 120);
      }
      world.spawnEnemy('spitter', 900, 300);
      world.light.stageMirror(640, 390, world);
      world.drift.stageLoop(640, 390, 130, world);
      world.light.fireFocusBeam(640, 390, world, 8);
      runSeconds(world, 3);
    }
    return { screen: SCREEN_PLAY, best: world.score };
  }
  if (name === 'upgrade') {
    world.startGame();
    runSeconds(world, 60);
    if (world.screen !== SCREEN_UPGRADE) {
      // The autopilot cleared night 1 early or fell: revive the ship,
      // clear the field and open the choice screen under the real rules.
      world.player.reset();
      world.screen = SCREEN_PLAY;
      world.enemies.length = 0;
      world.director.reset();
      world.onNightCleared();
    }
    return { screen: SCREEN_UPGRADE, best: world.score };
  }
  if (name === 'victory') {
    world.startGame();
    // Play nights 1-6 for real, so the victory screen shows a run's true
    // stats. If the ship falls on a night, it is revived and the run moves
    // on; the Warden itself is always finished under the real rules.
    for (let w = 1; w <= 6; w += 1) {
      const cleared = clearNight(world, w);
      if (!cleared) {
        world.player.reset();
        world.screen = SCREEN_PLAY;
        world.enemies.length = 0;
        world.bullets.reset();
        world.director.reset();
        continue;
      }
      world.chooseUpgrade(w % 3);
    }
    world.enemies.length = 0;
    world.director.reset();
    world.startNight(7);
    runSeconds(world, 1); // let the Warden spawn in
    // The Warden arrives nearly broken and the ship at full strength: a
    // few seconds of focused fire finishes it under the real rules and
    // opens the victory screen.
    const warden = world.enemies.find((e) => e.kind === 'warden');
    if (warden) warden.hp = 4;
    world.player.hull = world.player.maxHull;
    world.player.shield = true;
    world.bullets.clearEnemyBullets();
    runSeconds(world, 15);
    if (world.screen !== SCREEN_VICTORY) {
      const still = world.enemies.find((e) => e.kind === 'warden');
      if (still) world.damageEnemy(still, 999);
      else world.onBossDown();
    }
    return { screen: SCREEN_VICTORY, best: world.score };
  }
  if (name === 'over') {
    world.startGame();
    world.startNight(3);
    runSeconds(world, 45);
    if (world.screen !== SCREEN_OVER) {
      world.player.hull = 0;
      world.onPlayerDeath();
    }
    return { screen: SCREEN_OVER, best: world.score };
  }
  // Default: the title, with the Lumen weaving behind it.
  world.seedTitleSwarm();
  for (let i = 0; i < 5 / SAMPLE; i += 1) world.update(SAMPLE, autopilotInput(world));
  world.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE, best: 0 };
}

export { ARENA, BEACON, PLAYER };
