// LUMEN DRIFT — boot and main loop.
// A fixed 60 Hz simulation step with an accumulator, so the game plays the
// same on any display; rendering follows each animation frame. The canvas
// is a fixed 1280x720, scaled by CSS to the window.
//
// Query modes (for testing and screenshots, never for play):
//   ?shot=title|play|upgrade|victory|over&seed=N — stage one deterministic
//       scene, draw it once and set window.__shotReady.
//   ?selftest=1 — run 30 scripted seconds, then write the result as JSON
//       into #status and document.title (read it with --dump-dom).
import { STEP, VIEW } from './config.js';
import { makeRng } from './random.js';
import { Input } from './input.js';
import { World } from './world.js';
import { drawWorld } from './render.js';
import { autopilotInput, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const statusNode = document.getElementById('status');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? seedParam : 1337;
const rng = makeRng(seed);
const world = new World(rng);
const input = new Input(canvas);
window.__world = world;

function announce(text) {
  if (statusNode) statusNode.textContent = text;
}

function render() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawWorld(ctx, world);
}

function selfTest() {
  const errors = [];
  window.addEventListener('error', (event) => errors.push(String(event.message)));
  try {
    world.startGame();
    // Scripted play: 40 seconds through the shots' autopilot, the same
    // driver the screenshot scenes use, so the test exercises real play.
    for (let i = 0; i < 40 / STEP; i += 1) {
      if (world.screen !== 'play') break;
      world.update(STEP, autopilotInput(world));
    }
    render();
    const result = {
      ok: errors.length === 0,
      errors,
      screen: world.screen,
      wave: world.wave,
      score: world.score,
      kills: world.kills,
      enemies: world.enemies.length,
      bullets: world.bullets.player.length,
      playerHull: world.player.hull,
    };
    const text = JSON.stringify(result);
    announce(text);
    document.title = text;
    window.__shotReady = true;
  } catch (err) {
    const text = JSON.stringify({ ok: false, errors: [String(err && err.message)] });
    announce(text);
    document.title = text;
    window.__shotReady = true;
  }
}

if (params.get('selftest') === '1') {
  selfTest();
} else if (params.has('shot')) {
  const scene = stageShot(params.get('shot') || 'title', world);
  void scene;
  render();
  announce(`LUMEN DRIFT — ${params.get('shot')} scene staged`);
  window.__shotReady = true;
} else {
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += elapsed;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      if (input.anyGesture) world.audio.unlock();
      world.update(STEP, input);
      input.endFrame();
      acc -= STEP;
      steps += 1;
    }
    if (steps === 5) acc = 0;
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
