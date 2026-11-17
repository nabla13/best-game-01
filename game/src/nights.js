// The seven nights of LUMEN DRIFT: each night's name and what it throws at
// the Beacon. Nights grow a budget of spawn points and unlock new kinds;
// night 4 belongs to the Prism Matriarch, night 7 to the Void Warden.
// After the victory, endless nights keep coming: the budget keeps growing,
// the realms keep cycling, and a boss returns every seventh night.
import { REALMS } from './config.js';

export const NIGHT_NAMES = {
  1: 'FIRST LIGHT',
  2: 'THE WEAVERS WAKE',
  3: 'TEETH IN THE DARK',
  4: 'THE PRISM MATRIARCH',
  5: 'SPLINTERED SKY',
  6: 'THE LONG SIGHT',
  7: 'THE VOID WARDEN',
};

// Which realm a night burns in. Campaign nights 1-2, 3-4, 5-7; endless
// nights keep cycling the three realms.
export function realmFor(night) {
  return REALMS[Math.floor((night - 1) / 2) % REALMS.length];
}

// The boss of a night, if it is a boss night: the Prism Matriarch every
// 4th night of a cycle, the Void Warden every 7th. Null otherwise.
export function bossForNight(night) {
  if (night % 7 === 0) return 'warden';
  if (night % 7 === 4) return 'prism';
  return null;
}

export function isBossNight(night) {
  return bossForNight(night) !== null;
}

// How a night is built: spawn budget (points of enemy cost) and which kinds
// are unlocked. Boss nights belong to their boss alone.
export function nightPlan(night) {
  const budget = 8 + night * 6;
  const kinds = ['mote'];
  if (night >= 2) kinds.push('weaver');
  if (night >= 3) kinds.push('spitter', 'charger');
  if (night >= 4) kinds.push('brute');
  if (night >= 5) kinds.push('splitter');
  if (night >= 6) kinds.push('sniper');
  const cost = { mote: 1, weaver: 2, spitter: 3, charger: 3, brute: 5, splitter: 4, sniper: 4 };
  return { budget, kinds, cost };
}
