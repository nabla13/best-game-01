// Best-score persistence for LUMEN DRIFT.
// localStorage only, guarded: a browser that refuses storage still plays.
const BEST_SCORE_KEY = 'lumen-drift-best-score';
const BEST_WAVE_KEY = 'lumen-drift-best-wave';

export function loadBest() {
  try {
    return {
      score: Number(window.localStorage.getItem(BEST_SCORE_KEY)) || 0,
      wave: Number(window.localStorage.getItem(BEST_WAVE_KEY)) || 0,
    };
  } catch {
    return { score: 0, wave: 0 };
  }
}

export function saveBest(score, wave) {
  try {
    const best = loadBest();
    if (score > best.score) window.localStorage.setItem(BEST_SCORE_KEY, String(score));
    if (wave > best.wave) window.localStorage.setItem(BEST_WAVE_KEY, String(wave));
  } catch {
    // Storage unavailable: the game goes on without a saved best.
  }
}
