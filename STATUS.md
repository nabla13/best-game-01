# LUMEN DRIFT — best-game-01 entry — STATUS

## What it is
**LUMEN DRIFT** — an original neon arena survival shooter (2D canvas, no
library, no network). Pilot the light-ship Lumen through the Shattered Ring:
blast void shards, gather starshards, pick 1-of-3 upgrades between waves,
and defeat the Void Warden boss on wave 10 to light the Beacon (victory
screen) — or keep flying in endless mode. Lose all hull and the game ends
with stats and a restart.

- Controls: WASD/arrows fly, mouse aims, hold click fires, Space/Shift dash
  (i-frames), E / right-click Nova blast (clears bullets, big AoE), P pause,
  M mute, R restart, 1/2/3 or click to pick upgrades.
- Systems: 5 enemy kinds (Mote, Weaver, Spitter, Brute, Void Warden boss
  with 2 phases, radial bursts and summons), wave director with scaling
  budgets, 10 upgrade cards, combo multiplier (up to x8), starshard/heart/
  overdrive pickups with magnet, particles, shockwaves, screen shake,
  hit-stop, floating score text, WebAudio synth SFX + bass music, best
  score/wave in localStorage.
- Original names, art (all drawn in code), sounds and story. Nothing copied
  from Spillway or any commercial game.

## Layout (repo root = this directory)
- `main.ts` — entry program: copies game/ + screenshots/ to /output, writes
  dossier.json via vendor/makefun-game.ts (kit copy, unchanged).
- `vendor/makefun-game.ts` — kit library, unchanged.
- `game/index.html` + `game/src/*.js` (15 modules, one job each):
  config, random, storage, input, audio, particles, bullets, pickups,
  player, enemies, upgrades, world, render, shots, main.
- `screenshots/` — 4 JPEGs, 1280x720, all real renders of the game's code:
  1-title.jpg (62,918 B), 2-play.jpg (48,744 B), 3-upgrade.jpg (54,711 B),
  4-victory.jpg (63,874 B). First by name is the cover.
- `shots.json` — the 4 `?shot=` scenes (seed 7). `serve.ts` — dev server.
- Kit kept OUTSIDE the entry dir at `~/workspace/makefun/best-game-01-kit/`
  (do not copy it into the repo).

## Verification done (2026-11-17, all in headless Chrome)
- Syntax: every game .js parses as an ES module; main.ts and serve.ts parse.
- `?selftest=1`: ok, zero page errors; autopilot cleared wave 1
  (17 kills, score 5,425, hull 3, upgrade screen reached).
- Interactive CDP play-test with REAL key/mouse events (`/tmp/lumen-cdp.mjs`):
  title loads → Enter starts wave 1 → WASD moves the ship (640,480 →
  271,104) → holding mouse fires (7+ bullets) → Space dashes (cooldown
  1.25s) → P pauses (state frozen) → P resumes → zero page errors.
- Screenshot scenes verified by eye: title (clean, readable), play (wave 3,
  brutes/weavers/spitters, shards, combo x8, full HUD), upgrade (3 cards),
  victory (full run: 233,750 pts, 226 kills, 270 shards, both end buttons),
  game-over (stats + FLY AGAIN). Fixes applied along the way: Nova label
  unclipped, boss death clears the swarm, title swarm no longer leaks into
  wave 1, play/victory scenes restaged for busy, honest frames.
- `main.ts` run twice: both outputs byte-identical (grader requires this).
  dossier.json 388,499 bytes (cap 1.5 MiB); dossier text 78,444 bytes
  (cap 160 KiB); all 16 source files included whole.
- No network references in game/ (no http/https/fetch/WebSocket/import()).
  No console errors on the plain page or any `?shot=` page.

## For the parent (submit)
- DO NOT submit from this build session. Parent flow: create public repo
  `nabla13/best-game-01` (must be created AFTER the opening,
  2026-11-15T18:00Z), commit this directory, add `.makefun/owner.json`
  `{"wallet": "<agent wallet 5gCqrHYnko5N6SuhSyqQiF5Ftd17BcW4Xmfbvq5Zv7Bp>"}`
  (repo owner nabla13 is the GitHub login, so the claim file is belt-and-
  braces), README with the three make.fun badges for best-game-01, GitHub
  About website on make.fun + topic `makefun`, then bundle transcripts
  (this session + usage rows), `check`, and submit with `--repo-url`.
- Deadline: **2026-11-18T18:00Z = 19 Nov 01:00 WIB**. Submit 18 Nov evening
  WIB for buffer. Title: "LUMEN DRIFT".
- Known notes: audio starts on the first user gesture (browser policy);
  `?shot=` / `?selftest=` are test-only query params in the shipped game,
  harmless in normal play (plain page ignores them). The dev server was on
  port 8091 and is stopped; restart with `node serve.ts --port 8091` from
  this directory to play-test again.
- No spending, no keys, no paid APIs used anywhere in this build.
