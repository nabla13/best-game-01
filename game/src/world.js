// The world of LUMEN DRIFT: the state machine, the rules and the score.
// Screens: title, play, upgrade (pick a card), pause, over, victory.
// The world owns the player, enemies, bullets, pickups and particles, runs
// collisions, scores kills with a combo multiplier, and opens the next wave.
import { ARENA, BOSS_WAVE, COMBO, ENEMIES, PALETTE, PLAYER, SHARD_SCORE, WAVES_TO_WIN, PICKUP_HEART_CHANCE, PICKUP_CELL_CHANCE } from './config.js';
import { clamp, distance, range } from './random.js';
import { Player } from './player.js';
import { Enemy, WaveDirector } from './enemies.js';
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
    { x: 670, y: 520, width: 220, height: 56, label: 'PLAY AGAIN', sub: 'from wave 1', action: 'restart' },
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
    this.director = new WaveDirector(rng);
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
    this.offered = [];
    this.owned = {};
    this.best = loadBest();
    this.endless = false;
    this.flashRed = 0;
    this.attract = true;
    this.stats = { shotsFired: 0, shotsHit: 0, novas: 0, dashes: 0 };
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
    this.offered = [];
    this.owned = {};
    this.endless = false;
    this.flashRed = 0;
    this.attract = true;
    this.stats = { shotsFired: 0, shotsHit: 0, novas: 0, dashes: 0 };
  }

  startGame() {
    this.reset();
    this.attract = false;
    this.screen = SCREEN_PLAY;
    this.startWave(1);
    this.audio.unlock();
    this.audio.startMusic();
    this.audio.waveHorn();
  }

  startWave(wave) {
    this.wave = wave;
    this.banner = wave === BOSS_WAVE ? 'THE VOID WARDEN AWAKENS' : `WAVE ${wave}`;
    this.bannerTimer = 2.2;
    if (wave === BOSS_WAVE) this.audio.bossAlarm();
    else this.audio.waveHorn();
    this.director.startWave(wave);
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

  damageEnemy(enemy, amount, silent = false) {
    enemy.hp -= amount;
    enemy.flash = 0.12;
    if (!silent) this.audio.hit();
    if (enemy.hp <= 0) this.killEnemy(enemy);
  }

  killEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index === -1) return;
    this.enemies.splice(index, 1);
    this.kills += 1;
    // Combo: each kill inside the window raises the multiplier.
    this.combo = this.comboTimer > 0 ? Math.min(COMBO.maxMultiplier, this.combo + 1) : 1;
    this.comboTimer = COMBO.windowSeconds;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const gained = enemy.score * this.combo;
    this.score += gained;
    this.particles.scoreText(enemy.x, enemy.y - enemy.radius, `+${gained}`, enemy.color);
    this.particles.burst(enemy.x, enemy.y, enemy.color, enemy.kind === 'brute' ? 30 : 16, 280, 0.7, 3);
    this.particles.ring(enemy.x, enemy.y, enemy.color, enemy.radius * 2.2);
    this.audio.explode(enemy.kind === 'brute' || enemy.kind === 'warden');
    if (enemy.kind === 'brute' || enemy.kind === 'warden') {
      this.hitStop = 0.09;
      this.particles.addShake(8);
    }
    this.pickups.dropShards(enemy.x, enemy.y, enemy.shard);
    if (enemy.kind === 'brute') {
      this.spawnEnemy('mote', enemy.x - 20, enemy.y);
      this.spawnEnemy('mote', enemy.x + 20, enemy.y);
    }
    if (this.rng() < PICKUP_HEART_CHANCE) this.pickups.dropHeart(enemy.x, enemy.y);
    if (this.rng() < PICKUP_CELL_CHANCE) this.pickups.dropCell(enemy.x, enemy.y);
    if (enemy.kind === 'warden') this.onBossDown();
  }

  onWaveCleared() {
    if (this.screen !== SCREEN_PLAY) return;
    if (this.wave >= WAVES_TO_WIN && !this.endless) return; // victory handles it
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
    this.screen = SCREEN_OVER;
    this.best = this._recordBest();
    this.audio.gameOver();
    this.particles.burst(this.player.x, this.player.y, PALETTE.player, 60, 380, 1.1, 4);
    this.particles.ring(this.player.x, this.player.y, PALETTE.player, 200);
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
    this.startWave(this.wave + 1);
    this.screen = SCREEN_PLAY;
  }

  continueEndless() {
    this.endless = true;
    this.screen = SCREEN_PLAY;
    this.startWave(this.wave + 1);
  }

  update(dt, input) {
    this.time += dt;
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
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
    // The title screen plays itself: drifters wander, the ship idles.
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
