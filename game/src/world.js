// The world of LUMEN DRIFT: the state machine, the rules and the score.
// Screens: title, play, upgrade (pick a relic), pause, over, victory.
// The world owns the player, the Beacon, the driftlines, enemies, bullets,
// pickups and particles, runs collisions, scores kills with a combo
// multiplier and loop bonuses, and opens the next night.
import { ARENA, BEACON, BOSS_NIGHT, COMBO, DRIFT, NIGHTS_TO_WIN, PALETTE, PLAYER, SHARD_SCORE, PICKUP_HEART_CHANCE, PICKUP_CELL_CHANCE } from './config.js';
import { NIGHT_NAMES } from './nights.js';
import { clamp, distance, range } from './random.js';
import { Player } from './player.js';
import { Enemy, NightDirector } from './enemies.js';
import { Drift } from './drift.js';
import { Bullets } from './bullets.js';
import { Pickups } from './pickups.js';
import { Particles } from './particles.js';
import { AudioSys } from './audio.js';
import { rollUpgrades, applyUpgrade, cardRects } from './upgrades.js';
import { loadBest, saveBest } from './storage.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

// Button layouts for the end screens, shared by the world (clicks) and the
// renderer (drawing). One source of truth so a drawn button is clickable.
export function victoryButtons() {
  return [
    { x: 390, y: 520, width: 220, height: 56, label: 'KEEP FLYING', sub: 'endless mode', action: 'endless' },
    { x: 670, y: 520, width: 220, height: 56, label: 'PLAY AGAIN', sub: 'from night 1', action: 'restart' },
  ];
}

export function overButtons() {
  return [
    { x: 530, y: 520, width: 220, height: 56, label: 'FLY AGAIN', sub: 'press R', action: 'restart' },
  ];
}

export class World {
  constructor(rng) {
    this.rng = rng;
    this.player = new Player();
    this.enemies = [];
    this.bullets = new Bullets();
    this.pickups = new Pickups(rng);
    this.particles = new Particles(rng);
    this.director = new NightDirector(rng);
    this.drift = new Drift();
    this.audio = new AudioSys();
    this.screen = SCREEN_TITLE;
    this.time = 0;
    this.score = 0;
    this.kills = 0;
    this.shards = 0;
    this.wave = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.bestCombo = 1;
    this.hitStop = 0;
    this.banner = '';
    this.bannerTimer = 0;
    this.hint = '';
    this.hintTimer = 0;
    this.beaconLight = BEACON.light;
    this.endReason = '';
    this.offered = [];
    this.owned = {};
    this.best = loadBest();
    this.endless = false;
    this.flashRed = 0;
    this.attract = true;
    this.attractAngle = 0;
    this.attractDashTimer = 1;
    this.stats = { shotsFired: 0, shotsHit: 0, novas: 0, dashes: 0, loopsSealed: 0, loopsDetonated: 0 };
    this.reset();
    this.seedTitleSwarm();
  }

  // A few drifters wandering behind the title so it feels alive. Only the
  // title uses them; a real game starts with a clean field.
  seedTitleSwarm() {
    for (let i = 0; i < 5; i += 1) {
      this.spawnEnemy('mote', range(this.rng, 200, 1080), range(this.rng, 150, 600));
    }
  }

  reset() {
    this.player.reset();
    this.enemies = [];
    this.bullets.reset();
    this.pickups.reset();
    this.drift.reset();
    this.director.reset();
    this.screen = SCREEN_TITLE;
    this.score = 0;
    this.kills = 0;
    this.shards = 0;
    this.wave = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.bestCombo = 1;
    this.hitStop = 0;
    this.banner = '';
    this.bannerTimer = 0;
    this.hint = '';
    this.hintTimer = 0;
    this.beaconLight = BEACON.light;
    this.endReason = '';
    this.offered = [];
    this.owned = {};
    this.endless = false;
    this.flashRed = 0;
    this.attract = true;
    this.attractAngle = 0;
    this.attractDashTimer = 1;
    this.stats = { shotsFired: 0, shotsHit: 0, novas: 0, dashes: 0, loopsSealed: 0, loopsDetonated: 0 };
  }

  startGame() {
    this.reset();
    this.attract = false;
    this.screen = SCREEN_PLAY;
    this.startNight(1);
    this.audio.unlock();
    this.audio.startMusic();
    this.audio.waveHorn();
  }

  nightName(night) {
    return NIGHT_NAMES[night] || 'THE LONG DARK';
  }

  startNight(night) {
    this.wave = night;
    this.banner = night === BOSS_NIGHT ? 'THE VOID WARDEN AWAKENS' : `NIGHT ${night} — ${this.nightName(night)}`;
    this.bannerTimer = 2.2;
    if (night === BOSS_NIGHT) this.audio.bossAlarm();
    else this.audio.waveHorn();
    if (night === 1) {
      this.hint = 'DASH (Space) to paint a driftline — cross your own line to SEAL a loop';
      this.hintTimer = 6;
    } else if (night === 2) {
      this.hint = 'Foes marked ◆ hunt the Beacon — loop them before they drink its light';
      this.hintTimer = 6;
    }
    this.director.startNight(night);
  }

  spawnEnemy(kind, x, y) {
    const enemy = new Enemy(kind, x, y, this.wave, this.rng);
    this.enemies.push(enemy);
    this.particles.ring(x, y, enemy.color, enemy.radius * 2);
    return enemy;
  }

  playerShoot() {
    const p = this.player;
    this.stats.shotsFired += 1;
    const spread = 0.09;
    const n = p.multishot;
    for (let i = 0; i < n; i += 1) {
      const offset = (i - (n - 1) / 2) * spread;
      this.bullets.firePlayer(
        p.x + Math.cos(p.angle) * 20,
        p.y + Math.sin(p.angle) * 20,
        p.angle + offset,
        p.bulletSpeed,
        p.bulletDamage,
        p.pierce,
      );
    }
    this.audio.shoot();
  }

  fireNova() {
    const p = this.player;
    p.nova = 0;
    this.stats.novas += 1;
    this.audio.nova();
    this.particles.ring(p.x, p.y, PALETTE.nova, PLAYER.novaRadius * 1.4);
    this.particles.addShake(12);
    this.bullets.clearEnemyBullets();
    for (const e of this.enemies.slice()) {
      if (distance(e.x, e.y, p.x, p.y) < PLAYER.novaRadius + e.radius) {
        this.damageEnemy(e, PLAYER.novaDamage, true);
      }
    }
  }

  damageEnemy(enemy, amount, silent = false, inLoop = false) {
    enemy.hp -= amount;
    enemy.flash = 0.12;
    if (!silent) this.audio.hit();
    if (enemy.hp <= 0) this.killEnemy(enemy, inLoop);
  }

  killEnemy(enemy, inLoop = false) {
    const index = this.enemies.indexOf(enemy);
    if (index === -1) return;
    this.enemies.splice(index, 1);
    this.kills += 1;
    // Combo: each kill inside the window raises the multiplier.
    this.combo = this.comboTimer > 0 ? Math.min(COMBO.maxMultiplier, this.combo + 1) : 1;
    this.comboTimer = COMBO.windowSeconds;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const gained = enemy.score * this.combo * (inLoop ? DRIFT.loopScoreBonus : 1);
    this.score += gained;
    this.particles.scoreText(enemy.x, enemy.y - enemy.radius, inLoop ? `LOOP +${gained}` : `+${gained}`, inLoop ? PALETTE.loop : enemy.color);
    this.particles.burst(enemy.x, enemy.y, enemy.color, enemy.kind === 'brute' ? 30 : 16, 280, 0.7, 3);
    this.particles.ring(enemy.x, enemy.y, enemy.color, enemy.radius * 2.2);
    this.audio.explode(enemy.kind === 'brute' || enemy.kind === 'warden');
    if (enemy.kind === 'brute' || enemy.kind === 'warden') {
      this.hitStop = 0.09;
      this.particles.addShake(8);
    }
    this.pickups.dropShards(enemy.x, enemy.y, enemy.shard);
    if (enemy.kind === 'brute' || enemy.kind === 'splitter') {
      this.spawnEnemy('mote', enemy.x - 20, enemy.y);
      this.spawnEnemy('mote', enemy.x + 20, enemy.y);
    }
    if (this.rng() < PICKUP_HEART_CHANCE) this.pickups.dropHeart(enemy.x, enemy.y);
    if (this.rng() < PICKUP_CELL_CHANCE) this.pickups.dropCell(enemy.x, enemy.y);
    if (enemy.kind === 'warden') this.onBossDown();
  }

  // A foe reached the Beacon and drank one light before burning out.
  drainBeacon(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index !== -1) this.enemies.splice(index, 1);
    this.particles.burst(BEACON.x, BEACON.y, PALETTE.danger, 24, 260, 0.8, 3);
    this.particles.ring(BEACON.x, BEACON.y, PALETTE.danger, 120);
    // On the title screen the swarm only pretends: no light is lost.
    if (this.screen !== SCREEN_PLAY) return;
    this.beaconLight -= 1;
    this.particles.addShake(7);
    this.audio.beaconHit();
    this.flashRed = 0.3;
    this.hint = this.beaconLight > 0 ? `THE BEACON DIMS — ${this.beaconLight} LIGHT LEFT` : '';
    this.hintTimer = 2.5;
    if (this.beaconLight <= 0) this.onBeaconLost();
  }

  onNightCleared() {
    if (this.screen !== SCREEN_PLAY) return;
    if (this.wave >= NIGHTS_TO_WIN && !this.endless) return; // victory handles it
    // Dawn repairs one light of the Beacon.
    this.beaconLight = Math.min(BEACON.maxLight, this.beaconLight + 1);
    this.offered = rollUpgrades(this.rng, this.owned);
    this.screen = SCREEN_UPGRADE;
    this.audio.victory();
  }

  onBossDown() {
    if (this.endless) return;
    // The Warden's death shatters its swarm: every remaining foe bursts
    // into shards and the field clears for the victory screen.
    for (const e of this.enemies.slice()) {
      this.particles.burst(e.x, e.y, e.color, 14, 240, 0.7, 3);
      this.pickups.dropShards(e.x, e.y, e.shard);
    }
    this.enemies.length = 0;
    this.bullets.clearEnemyBullets();
    this.flashRed = 0;
    this.screen = SCREEN_VICTORY;
    this.best = this._recordBest();
    this.audio.victory();
  }

  onPlayerDeath() {
    this.endReason = 'hull';
    this.screen = SCREEN_OVER;
    this.best = this._recordBest();
    this.audio.gameOver();
    this.particles.burst(this.player.x, this.player.y, PALETTE.player, 60, 380, 1.1, 4);
    this.particles.ring(this.player.x, this.player.y, PALETTE.player, 200);
    this.particles.addShake(14);
  }

  onBeaconLost() {
    this.endReason = 'beacon';
    this.screen = SCREEN_OVER;
    this.best = this._recordBest();
    this.audio.gameOver();
    this.particles.burst(BEACON.x, BEACON.y, PALETTE.gold, 60, 380, 1.1, 4);
    this.particles.ring(BEACON.x, BEACON.y, PALETTE.gold, 240);
    this.particles.addShake(14);
  }

  _recordBest() {
    saveBest(this.score, this.wave);
    return loadBest();
  }

  chooseUpgrade(index) {
    const upgrade = this.offered[index];
    if (!upgrade) return;
    applyUpgrade(this.player, upgrade);
    this.owned[upgrade.id] = (this.owned[upgrade.id] || 0) + 1;
    this.audio.pickup();
    this.offered = [];
    this.startNight(this.wave + 1);
    this.screen = SCREEN_PLAY;
  }

  continueEndless() {
    this.endless = true;
    this.screen = SCREEN_PLAY;
    this.startNight(this.wave + 1);
  }

  update(dt, input) {
    this.time += dt;
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    if (this.hintTimer > 0) {
      this.hintTimer -= dt;
      if (this.hintTimer <= 0) this.hint = '';
    }
    if (this.flashRed > 0) this.flashRed -= dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }
    this.audio.update(dt);
    this.particles.update(dt);

    if (this.screen === SCREEN_TITLE) {
      this._updateAttract(dt);
      if (input.wasPressed('Enter') || input.mousePressed) this.startGame();
      return;
    }
    if (this.screen === SCREEN_UPGRADE) {
      if (input.wasPressed('Digit1')) this.chooseUpgrade(0);
      if (input.wasPressed('Digit2')) this.chooseUpgrade(1);
      if (input.wasPressed('Digit3')) this.chooseUpgrade(2);
      if (input.mousePressed) {
        const rects = cardRects();
        for (let i = 0; i < rects.length; i += 1) {
          const r = rects[i];
          if (input.mouseX >= r.x && input.mouseX <= r.x + r.width && input.mouseY >= r.y && input.mouseY <= r.y + r.height) {
            this.chooseUpgrade(i);
            break;
          }
        }
      }
      return;
    }
    if (this.screen === SCREEN_PAUSE) {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape') || input.wasPressed('Enter')) {
        this.screen = SCREEN_PLAY;
      }
      return;
    }
    if (this.screen === SCREEN_OVER || this.screen === SCREEN_VICTORY) {
      if (input.wasPressed('KeyR') || input.wasPressed('Enter')) this.startGame();
      if (input.mousePressed) this._clickEndScreen(input);
      return;
    }

    // SCREEN_PLAY
    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
      this.screen = SCREEN_PAUSE;
      return;
    }
    if (input.wasPressed('KeyM')) this.audio.toggleMute();

    if (this.hitStop > 0) {
      this.hitStop -= dt;
      return; // freeze the world briefly on big kills
    }
    this.player.update(dt, input, this);
    this.drift.update(dt, this);
    this.director.update(dt, this);
    for (const e of this.enemies.slice()) e.update(dt, this);
    this.bullets.update(dt);
    this.pickups.update(dt, this.player);
    const got = this.pickups.collect(this.player);
    if (got.shards > 0) {
      this.shards += got.shards;
      this.score += got.shards * SHARD_SCORE;
      this.player.nova = Math.min(PLAYER.novaMax, this.player.nova + got.shards * 4 * this.player.novaChargeRate);
      this.audio.pickup();
    }
    if (got.hearts > 0) {
      this.player.heal(got.hearts);
      this.audio.heart();
    }
    if (got.cells > 0) {
      this.player.nova = PLAYER.novaMax;
      this.audio.heart();
    }
    this._collide();
  }

  _clickEndScreen(input) {
    const buttons = this.screen === SCREEN_VICTORY ? victoryButtons() : overButtons();
    for (const b of buttons) {
      if (input.mouseX >= b.x && input.mouseX <= b.x + b.width && input.mouseY >= b.y && input.mouseY <= b.y + b.height) {
        this.audio.click();
        if (b.action === 'endless') this.continueEndless();
        else this.startGame();
        return;
      }
    }
  }

  _updateAttract(dt) {
    // The title screen plays itself: the Lumen weaves slow circles around
    // the Beacon, dashing now and then to paint driftlines, while drifters
    // wander. It shows the game's signature move before a single keypress.
    this.attractAngle += dt * 0.45;
    const cx = BEACON.x + Math.cos(this.attractAngle) * 190;
    const cy = BEACON.y + Math.sin(this.attractAngle) * 150;
    const p = this.player;
    const dx = cx - p.x;
    const dy = cy - p.y;
    const d = Math.hypot(dx, dy) || 1;
    p.vx = (dx / d) * 200;
    p.vy = (dy / d) * 200;
    p.x = clamp(p.x + p.vx * dt, ARENA.x + p.radius, ARENA.x + ARENA.width - p.radius);
    p.y = clamp(p.y + p.vy * dt, ARENA.y + p.radius, ARENA.y + ARENA.height - p.radius);
    p.angle = Math.atan2(dy, dx);
    this.attractDashTimer -= dt;
    if (this.attractDashTimer <= 0) {
      this.attractDashTimer = 2.4;
      p.startDash(this);
    }
    if (p.weaveTimer > 0) {
      p.weaveTimer -= dt;
      this.drift.paint(p.x, p.y, this.time);
    }
    this.drift.update(dt, this);
    for (const e of this.enemies.slice()) {
      e.update(dt, this);
      if (this.rng() < 0.002) {
        this.particles.burst(e.x, e.y, e.color, 8, 120, 0.5, 2);
      }
      // Keep the swarm spread out instead of piling onto the idle ship.
      if (distance(e.x, e.y, this.player.x, this.player.y) < 90) {
        e.x = range(this.rng, 150, 1130);
        e.y = range(this.rng, 150, 600);
      }
    }
    this.bullets.update(dt);
  }

  _collide() {
    const p = this.player;
    // Player bullets vs enemies.
    for (let bi = this.bullets.player.length - 1; bi >= 0; bi -= 1) {
      const b = this.bullets.player[bi];
      let consumed = false;
      for (const e of this.enemies.slice()) {
        if (e.spawnT < 0.25) continue;
        if (distance(b.x, b.y, e.x, e.y) < b.radius + e.radius) {
          this.stats.shotsHit += 1;
          this.damageEnemy(e, b.damage);
          this.particles.burst(b.x, b.y, '#bffaff', 4, 140, 0.3, 2);
          if (b.pierce > 0) {
            b.pierce -= 1;
          } else {
            consumed = true;
          }
          break;
        }
      }
      if (consumed) {
        this.bullets.player[bi] = this.bullets.player[this.bullets.player.length - 1];
        this.bullets.player.pop();
      }
    }
    if (!p.alive) return;
    // Enemy bullets vs player.
    for (let i = this.bullets.enemy.length - 1; i >= 0; i -= 1) {
      const b = this.bullets.enemy[i];
      if (distance(b.x, b.y, p.x, p.y) < b.radius + p.radius - 2) {
        this.bullets.enemy.splice(i, 1);
        p.takeHit(this);
        this.flashRed = 0.35;
      }
    }
    // Enemies vs player (touch damage).
    for (const e of this.enemies) {
      if (e.spawnT < 0.25) continue;
      if (distance(e.x, e.y, p.x, p.y) < e.radius + p.radius - 2) {
        if (p.takeHit(this)) {
          // Shove the enemy back so one touch is one hit.
          const a = Math.atan2(e.y - p.y, e.x - p.x);
          e.x += Math.cos(a) * 30;
          e.y += Math.sin(a) * 30;
          this.flashRed = 0.35;
        }
      }
    }
  }
}
