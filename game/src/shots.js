// Deterministic screenshot scenes for LUMEN DRIFT, behind ?shot=<scene>.
// Each scene plays the real rules forward from a fresh world with a fixed
// seed and a simple autopilot (keep away from the nearest foe, shoot the
// nearest one, dash when cornered, spend Nova into a crowd), so every frame
// is what a short game really looks like and the same seed always gives the
// same frame. The render sets window.__shotReady when the scene is staged.
import { ARENA, PLAYER, STEP } from './config.js';
import { angleTo, distance } from './random.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_VICTORY } from './world.js';

const SAMPLE = STEP;

// Steer the ship: away from close foes, toward the nearest shard, and
// inside the arena. Returns a fake input object the world can read.
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
  const len = Math.hypot(fx, fy) || 1;
  const mx = fx / len;
  const my = fy / len;
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
  const aim = target ? angleTo(p.x, p.y, target.x, target.y) : -Math.PI / 2;
  const mouseX = p.x + Math.cos(aim) * 100;
  const mouseY = p.y + Math.sin(aim) * 100;
  let close = false;
  for (const e of world.enemies) {
    if (distance(p.x, p.y, e.x, e.y) < 80) close = true;
  }
  const crowd = world.enemies.filter((e) => distance(p.x, p.y, e.x, e.y) < 260).length;
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
      if (code === 'Space' && close && p.dashReady) return true;
      if (code === 'KeyE' && crowd >= 5 && p.novaReady) return true;
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

// Set `world` to the named scene and return the screen to draw over it.
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    world.startGame();
    world.startWave(3);
    runSeconds(world, 8);
    // Top the wave up so the frame shows combat in progress: tough foes
    // mid-field, then a blink of real play so bolts are flying while the
    // new arrivals are still alive.
    if (world.screen === SCREEN_PLAY && world.enemies.length < 5) {
      world.spawnEnemy('brute', 420, 260);
      world.spawnEnemy('brute', 860, 300);
      world.spawnEnemy('weaver', 760, 220);
      world.spawnEnemy('weaver', 540, 420);
      world.spawnEnemy('spitter', 950, 420);
      runSeconds(world, 0.15);
    }
    if (world.screen !== SCREEN_PLAY) {
      // The autopilot fell: revive the ship mid-wave-3 and restage combat
      // so the frame still shows play in progress.
      world.player.reset();
      world.screen = SCREEN_PLAY;
      world.bullets.reset();
      for (let i = 0; i < 4; i += 1) {
        world.spawnEnemy(i % 2 === 0 ? 'weaver' : 'mote', 300 + i * 220, 220 + (i % 2) * 120);
      }
      world.spawnEnemy('spitter', 900, 300);
      runSeconds(world, 3);
    }
    return { screen: SCREEN_PLAY, best: world.score };
  }
  if (name === 'upgrade') {
    world.startGame();
    runSeconds(world, 60);
    if (world.screen !== SCREEN_UPGRADE) {
      // The autopilot cleared wave 1 early or fell: revive the ship, clear
      // the field and open the choice screen under the real rules.
      world.player.reset();
      world.screen = SCREEN_PLAY;
      world.enemies.length = 0;
      world.director.reset();
      world.onWaveCleared();
    }
    return { screen: SCREEN_UPGRADE, best: world.score };
  }
// Play one wave with the autopilot until it is cleared (the upgrade screen
// opens), the ship falls, or the timeout passes. Returns true when cleared.
function clearWave(world, wave, timeoutSeconds = 75) {
  world.startWave(wave);
  const steps = Math.round(timeoutSeconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    if (world.screen === SCREEN_UPGRADE) return true;
    if (world.screen !== SCREEN_PLAY) return false;
    world.update(SAMPLE, autopilotInput(world));
  }
  return world.screen === SCREEN_UPGRADE;
}

  if (name === 'victory') {
    world.startGame();
    // Play waves 1-9 for real, so the victory screen shows a run's true
    // stats. If the ship falls on a wave, it is revived and the run moves
    // on; the Warden itself is always finished under the real rules.
    for (let w = 1; w <= 9; w += 1) {
      const cleared = clearWave(world, w);
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
    world.startWave(10);
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
    world.startWave(3);
    runSeconds(world, 45);
    if (world.screen !== SCREEN_OVER) {
      world.player.hull = 0;
      world.onPlayerDeath();
    }
    return { screen: SCREEN_OVER, best: world.score };
  }
  // Default: the title, with the swarm drifting behind it.
  world.seedTitleSwarm();
  for (let i = 0; i < 5 / SAMPLE; i += 1) world.update(SAMPLE, autopilotInput(world));
  world.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE, best: 0 };
}

export { ARENA, PLAYER };
