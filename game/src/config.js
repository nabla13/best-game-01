// LUMEN DRIFT — tuning, palette and wave table.
// One place for every number a designer would tweak: ship handling, weapons,
// enemy kinds, wave scaling, pickups, upgrades and the boss. Nothing here
// reads the network or the DOM; it is pure data.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const ARENA = { x: 24, y: 84, width: 1232, height: 612 };

export const PALETTE = {
  background: '#04060f',
  nebulaA: '#16224d',
  nebulaB: '#3a1c5e',
  nebulaC: '#0d3a4a',
  star: '#dfe9ff',
  player: '#5ef2ff',
  playerCore: '#e8feff',
  bullet: '#8ff7ff',
  shard: '#ffd76a',
  shardCore: '#fff3c4',
  heart: '#ff5d7a',
  nova: '#b78cff',
  mote: '#ff7a59',
  weaver: '#ff9de2',
  spitter: '#a4ff7a',
  brute: '#ffb03a',
  warden: '#c77dff',
  text: '#eaf2ff',
  dim: '#8fa3c8',
  danger: '#ff5470',
  gold: '#ffd76a',
};

export const PLAYER = {
  radius: 14,
  speed: 330,
  accel: 2600,
  friction: 6.5,
  hull: 3,
  maxHull: 5,
  fireInterval: 0.16,
  bulletSpeed: 640,
  bulletDamage: 1,
  bulletRadius: 5,
  dashSpeed: 980,
  dashTime: 0.16,
  dashCooldown: 1.6,
  dashInvuln: 0.35,
  magnet: 110,
  novaMax: 100,
  novaCost: 100,
  novaRadius: 300,
  novaDamage: 6,
  invulnAfterHit: 1.0,
};

export const COMBO = {
  windowSeconds: 2.5,
  maxMultiplier: 8,
};

// Enemy kinds. hp and speed scale a little with the wave; score is base points.
export const ENEMIES = {
  mote:    { hp: 1, speed: 95,  radius: 13, score: 50,  damage: 1, color: PALETTE.mote,    shard: 1 },
  weaver:  { hp: 2, speed: 150, radius: 14, score: 100, damage: 1, color: PALETTE.weaver,  shard: 2 },
  spitter: { hp: 2, speed: 80,  radius: 15, score: 150, damage: 1, color: PALETTE.spitter, shard: 2 },
  brute:   { hp: 8, speed: 55,  radius: 26, score: 300, damage: 1, color: PALETTE.brute,   shard: 4 },
  warden:  { hp: 220, speed: 42, radius: 64, score: 5000, damage: 2, color: PALETTE.warden, shard: 25 },
};

// How a wave is built: spawn budget (points of enemy cost) and which kinds
// are unlocked. The Warden arrives alone on wave 10.
export function wavePlan(wave) {
  const budget = 10 + wave * 7;
  const kinds = ['mote'];
  if (wave >= 2) kinds.push('weaver');
  if (wave >= 3) kinds.push('spitter');
  if (wave >= 4) kinds.push('brute');
  const cost = { mote: 1, weaver: 2, spitter: 3, brute: 5 };
  return { budget, kinds, cost };
}

export const BOSS_WAVE = 10;
export const WAVES_TO_WIN = 10;

// Upgrade cards offered between waves. `max` caps how often one can stack.
export const UPGRADE_POOL = [
  { id: 'rapid',   name: 'Rapid Coils',   desc: '+25% fire rate',            icon: '»', max: 5 },
  { id: 'heavy',   name: 'Heavy Rounds',  desc: '+1 bullet damage',          icon: '◆', max: 5 },
  { id: 'split',   name: 'Split Shot',    desc: '+1 projectile per shot',    icon: '✦', max: 3 },
  { id: 'swift',   name: 'Swift Thrusters', desc: '+12% move speed',         icon: '›', max: 4 },
  { id: 'hull',    name: 'Hull Plating',  desc: '+1 max hull, repair 1',     icon: '♥', max: 3 },
  { id: 'dash',    name: 'Blink Drive',   desc: 'Dash recharges 30% faster', icon: '↯', max: 3 },
  { id: 'nova',    name: 'Nova Conduit',  desc: 'Nova charges 35% faster',   icon: '✺', max: 3 },
  { id: 'magnet',  name: 'Shard Magnet',  desc: '+60% pickup radius',        icon: '◎', max: 3 },
  { id: 'pierce',  name: 'Piercing Rounds', desc: 'Bullets pierce +1 enemy', icon: '⟿', max: 3 },
  { id: 'aegis',   name: 'Aegis Shield',  desc: 'Block one hit each wave',   icon: '⬡', max: 2 },
];

export const SHARD_SCORE = 25;
export const PICKUP_HEART_CHANCE = 0.03;
export const PICKUP_CELL_CHANCE = 0.02;
