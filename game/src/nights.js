// The seven nights of LUMEN DRIFT: each night's name and what it throws at
// the Beacon. Nights grow a budget of spawn points and unlock new kinds;
// night 7 belongs to the Void Warden alone.
export const NIGHT_NAMES = {
  1: 'FIRST LIGHT',
  2: 'THE WEAVERS WAKE',
  3: 'TEETH IN THE DARK',
  4: 'THE HEAVY HOUR',
  5: 'SPLINTERED SKY',
  6: 'THE LONG SIGHT',
  7: 'THE VOID WARDEN',
};

// How a night is built: spawn budget (points of enemy cost) and which kinds
// are unlocked. The Warden arrives alone on night 7.
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
