// Between-wave upgrade cards for LUMEN DRIFT.
// Each wave cleared, the player picks one of three cards. A card's effect
// applies at once and stacks up to its max; the choice screen is the game's
// main strategic decision.
import { UPGRADE_POOL, PLAYER } from './config.js';
import { shuffle } from './random.js';

export function rollUpgrades(rng, owned) {
  const available = UPGRADE_POOL.filter((u) => (owned[u.id] || 0) < u.max);
  const rolled = shuffle(rng, available).slice(0, 3);
  return rolled;
}

export function applyUpgrade(player, upgrade) {
  if (upgrade.id === 'rapid') player.fireInterval *= 0.8;
  if (upgrade.id === 'heavy') player.bulletDamage += 1;
  if (upgrade.id === 'split') player.multishot += 1;
  if (upgrade.id === 'swift') player.speed *= 1.12;
  if (upgrade.id === 'hull') {
    player.maxHull = Math.min(PLAYER.maxHull, player.maxHull + 1);
    player.heal(1);
  }
  if (upgrade.id === 'dash') player.dashCooldownMax *= 0.7;
  if (upgrade.id === 'nova') player.novaChargeRate *= 1.35;
  if (upgrade.id === 'magnet') player.magnet *= 1.6;
  if (upgrade.id === 'pierce') player.pierce += 1;
  if (upgrade.id === 'aegis') player.shield = true;
}

// Card layout for the choice screen, shared by world and render.
export function cardRects() {
  const w = 300;
  const h = 260;
  const gap = 40;
  const total = w * 3 + gap * 2;
  const x0 = (1280 - total) / 2;
  const y0 = 250;
  return [0, 1, 2].map((i) => ({ x: x0 + i * (w + gap), y: y0, width: w, height: h }));
}
