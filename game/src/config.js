// LUMEN DRIFT — tuning, palette and night table.
// One place for every number a designer would tweak: ship handling, the
// driftline weave, enemy kinds, night scaling, pickups, relics and the boss.
// Nothing here reads the network or the DOM; it is pure data.
export const VIEW = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const ARENA = { x: 24, y: 84, width: 1232, height: 612 };

// The Beacon stands at the arena's heart. Hold its light for seven nights.
export const BEACON = { x: 640, y: 390, radius: 34, light: 5, maxLight: 5 };

// Three realms the seven nights travel through. Each realm repaints the
// nebula behind the arena; nights 1-2 burn in the Ember Fields, 3-4 glint
// in the Mirror Reefs, 5-7 sink into the Hollow Deep. Endless nights keep
// cycling the realms.
export const REALMS = [
  { name: 'EMBER FIELDS',   roman: 'I',   nebulaA: '#4d2a16', nebulaB: '#5e1c3a', nebulaC: '#4a2a0d' },
  { name: 'MIRROR REEFS',   roman: 'II',  nebulaA: '#0d3a4a', nebulaB: '#123a5e', nebulaC: '#0d4a3a' },
  { name: 'THE HOLLOW DEEP', roman: 'III', nebulaA: '#2a1050', nebulaB: '#3a0d2e', nebulaC: '#160a3a' },
];

// Three difficulties, picked on the title screen. Blaze is the intended
// balance; Kindle is gentler with more Beacon light; Inferno is cruel and
// pays for it in score.
export const DIFFICULTIES = {
  kindle:  { label: 'KINDLE',  desc: 'gentler swarm · 6 Beacon light · ×0.8 score', hpMul: 0.8, speedMul: 0.9, beaconLight: 6, scoreMul: 0.8 },
  blaze:   { label: 'BLAZE',   desc: 'the intended burn · 5 light · ×1 score',      hpMul: 1.0, speedMul: 1.0, beaconLight: 5, scoreMul: 1.0 },
  inferno: { label: 'INFERNO', desc: 'cruel swarm · 4 light · ×1.5 score',          hpMul: 1.3, speedMul: 1.1, beaconLight: 4, scoreMul: 1.5 },
};
export const DIFFICULTY_ORDER = ['kindle', 'blaze', 'inferno'];

// The light the player bends: the Beacon sweeps a rotating beam, mirrors
// bounce it, driftlines conduct it, and sealed loops focus it.
export const LIGHT = {
  beamSpeed: 0.45,      // radians per second the Beacon beam sweeps
  beamWidth: 14,        // px wide the beam burns
  beamDps: 4,           // damage per second to foes touching the beam
  beamRange: 1500,      // how far the beam travels
  beamStep: 8,          // px per ray-cast step
  maxBounces: 3,        // mirrors the beam can bounce off in one sweep
  mirrorCost: 10,       // starshards to place one mirror shard
  mirrorMax: 3,         // mirrors on the field at once
  mirrorRadius: 14,
  mirrorHp: 3,          // hits a mirror takes before it shatters
  mirrorShatterShards: 5, // starshards a shattered mirror drops
  focusBeamDamage: 6,   // damage a loop's focus beam deals along its line
  focusBeamLength: 700,
  focusBeamWidth: 26,
  focusBeamLife: 0.35,  // seconds the focus beam stays visible
  prismLoopMul: 2,      // detonation damage multiplier for a prism loop
};

export const PALETTE = {
  background: '#04060f',
  nebulaA: '#4d2a16',
  nebulaB: '#5e1c3a',
  nebulaC: '#4a2a0d',
  star: '#dfe9ff',
  player: '#5ef2ff',
  playerCore: '#e8feff',
  bullet: '#8ff7ff',
  drift: '#5ef2ff',
  driftHot: '#aefcff',
  loop: '#ffd76a',
  loopSeal: '#ffe9a8',
  shard: '#ffd76a',
  shardCore: '#fff3c4',
  heart: '#ff5d7a',
  nova: '#b78cff',
  mote: '#ff7a59',
  weaver: '#ff9de2',
  spitter: '#a4ff7a',
  charger: '#ff5470',
  brute: '#ffb03a',
  splitter: '#7ae2ff',
  sniper: '#d0ff5e',
  warden: '#c77dff',
  prism: '#ff5df2',
  beam: '#ffe9a8',
  mirror: '#bffaff',
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

// The weave: a dash paints a burning driftline; crossing your own line
// seals a loop that traps everything inside, then detonates.
export const DRIFT = {
  pointSpacing: 14,      // px of travel between stored trail points
  trailLife: 3.5,        // seconds a painted line stays lit
  burnDps: 3,            // damage per second to foes touching the line
  burnRadius: 12,        // how close a foe must be to burn
  lineWidth: 9,
  sealTime: 1.2,         // seconds a sealed loop holds before it bursts
  detonateDamage: 8,
  minLoopArea: 1800,     // px^2: smaller crossings are brushed off as noise
  minLoopPoints: 10,
  crossDistance: 34,     // head within this of an old point to close a loop
  loopScoreBonus: 2,     // kills inside a loop pay this many times more
};

export const COMBO = {
  windowSeconds: 2.5,
  maxMultiplier: 8,
};

// Enemy kinds. hp and speed scale a little with the night; score is base
// points. `target` says what the kind hunts: the ship, the Beacon, or both.
export const ENEMIES = {
  mote:     { hp: 1, speed: 95,  radius: 13, score: 50,   damage: 1, color: PALETTE.mote,     shard: 1, target: 'both' },
  weaver:   { hp: 2, speed: 150, radius: 14, score: 100,  damage: 1, color: PALETTE.weaver,   shard: 2, target: 'both' },
  spitter:  { hp: 2, speed: 80,  radius: 15, score: 150,  damage: 1, color: PALETTE.spitter,  shard: 2, target: 'ship' },
  charger:  { hp: 3, speed: 120, radius: 15, score: 200,  damage: 1, color: PALETTE.charger,  shard: 2, target: 'ship' },
  brute:    { hp: 8, speed: 55,  radius: 26, score: 300,  damage: 1, color: PALETTE.brute,    shard: 4, target: 'ship' },
  splitter: { hp: 4, speed: 110, radius: 16, score: 250,  damage: 1, color: PALETTE.splitter, shard: 3, target: 'ship' },
  sniper:   { hp: 2, speed: 70,  radius: 14, score: 250,  damage: 1, color: PALETTE.sniper,   shard: 3, target: 'ship' },
  prism:    { hp: 140, speed: 50, radius: 44, score: 2500, damage: 1, color: PALETTE.prism,   shard: 15, target: 'ship' },
  warden:   { hp: 260, speed: 42, radius: 64, score: 5000, damage: 2, color: PALETTE.warden,  shard: 25, target: 'ship' },
};

export const BOSS_NIGHT = 7;
export const MID_BOSS_NIGHT = 4;
export const NIGHTS_TO_WIN = 7;

// Relics offered between nights. `max` caps how often one can stack.
export const UPGRADE_POOL = [
  { id: 'rapid',     name: 'Rapid Coils',    desc: '+25% fire rate',              icon: '»', max: 5 },
  { id: 'heavy',     name: 'Heavy Rounds',   desc: '+1 bullet damage',            icon: '◆', max: 5 },
  { id: 'split',     name: 'Split Shot',     desc: '+1 projectile per shot',      icon: '✦', max: 3 },
  { id: 'swift',     name: 'Swift Thrusters', desc: '+12% move speed',            icon: '›', max: 4 },
  { id: 'hull',      name: 'Hull Plating',   desc: '+1 max hull, repair 1',       icon: '♥', max: 3 },
  { id: 'dash',      name: 'Blink Drive',    desc: 'Dash recharges 30% faster',   icon: '↯', max: 3 },
  { id: 'nova',      name: 'Nova Conduit',   desc: 'Nova charges 35% faster',     icon: '✺', max: 3 },
  { id: 'magnet',    name: 'Shard Magnet',   desc: '+60% pickup radius',          icon: '◎', max: 3 },
  { id: 'pierce',    name: 'Piercing Rounds', desc: 'Bullets pierce +1 enemy',    icon: '⟿', max: 3 },
  { id: 'aegis',     name: 'Aegis Shield',   desc: 'Block one hit each night',    icon: '⬡', max: 2 },
  { id: 'trailburn', name: 'Trailburn',      desc: 'Driftlines burn +50%',        icon: '≋', max: 4 },
  { id: 'loopmaster', name: 'Loopmaster',    desc: 'Loops burst +100% damage',    icon: '◍', max: 3 },
  { id: 'longline',  name: 'Longline',       desc: 'Driftlines last +40% longer', icon: '〜', max: 3 },
  { id: 'wideweave', name: 'Wide Weave',     desc: 'Driftlines twice as wide',    icon: '▬', max: 2 },
  { id: 'mirrorplus', name: 'Extra Mirror',  desc: '+1 mirror shard on the field', icon: '◇', max: 2 },
  { id: 'beamfocus', name: 'Focus Lens',     desc: 'Beacon beam +100% damage, +50% wider', icon: '◎', max: 3 },
  { id: 'prismlens', name: 'Prism Lens',     desc: 'Loop bursts +100% damage',    icon: '✧', max: 2 },
  { id: 'cheapglass', name: 'Cheap Glass',   desc: 'Mirrors cost 5 shards, not 10', icon: '◈', max: 1 },
  { id: 'beamburn',  name: 'Beam Burn',      desc: 'The beam ignites foes it touches', icon: '☀', max: 2 },
];

export const SHARD_SCORE = 25;
export const PICKUP_HEART_CHANCE = 0.03;
export const PICKUP_CELL_CHANCE = 0.02;
