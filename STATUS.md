# LUMEN DRIFT — best-game-01 entry — STATUS

## v2 (2026-11-17, built after v1 ranked 997/7,202, judge 74.4% — NOT paid)

**What changed and why it should score higher.** v1 was a competent twin-stick
arena shooter — the most common genre in a 7,202-entry field, and the top 10
all win on a distinctive core verb (weave, bend, guard, herd, draw, steer)
plus a campaign with a base to defend. v2 rebuilds the core around that
lesson while keeping the title, repo and engine:

- **New core verb: WEAVE.** A dash now paints a burning driftline; foes
  touching it burn, and crossing your own line SEALS a loop that traps
  everything inside, then detonates for double score. Dash is offence and
  defence at once — a real choice the judge can see in one screenshot.
  New module `game/src/drift.js` (weaveDriftline, sealLoop, detonateLoop).
- **Hold the Beacon.** The Beacon stands at the arena's heart with 5 light;
  foes marked ◆ hunt it, and if its light is drunk the run ends a second
  way. Dawn restores one light per night held. A visible goal beyond
  survival, in the HUD and in every frame.
- **Seven named nights** instead of ten anonymous waves (First Light …
  The Void Warden), each with its own mix — a campaign with progression.
- **8 enemy kinds** (new: Charger with a telegraphed rush, Splitter, Sniper)
  and a **3-phase Warden** (bursts → spirals + summons → enraged charge).
- **14 relic cards** (new weave relics: Trailburn, Loopmaster, Longline,
  Wide Weave) with real synergies around the loop.
- **Title attract mode plays itself**: the Lumen weaves circles around the
  Beacon and paints driftlines behind the title panel.
- New sounds (loop seal chime, loop burst, beacon alarm, sniper, charger
  telegraph/rush), hint toasts on nights 1–2, Beacon light pips in the HUD,
  two distinct game-over screens (hull lost / Beacon went dark).

## Verification done for v2 (2026-11-17, all in headless Chrome)

- Syntax: all 17 game .js files parse; main.ts and serve.ts parse.
- `?selftest=1` (90 s soak, autopilot picks relics and plays on): ok, zero
  page errors; the autopilot played through to **night 7** (score 96,450,
  104 kills) and sealed **9 loops**, detonated 8 — the weave works in real
  play, not just in staged scenes. It fell to the Warden on night 7.
- Interactive CDP play-test (`/tmp/lumen2-cdp.mjs`): title loads → Enter
  starts night 1 → WASD moves the ship (640,480 → 309,149) → holding mouse
  fires (6 bullets, 9 shots) → Space dashes and paints a driftline
  (cooldown 1.25 s, 8 trail points) → P pauses (ship and foes frozen) → P
  resumes → **7/7 checks pass, zero page errors**. Two fixes along the way:
  a favicon 404 (added `<link rel="icon" href="data:,">`) and Beacon pips
  drawn off the right edge of the HUD.
- 4 fresh screenshots 1280×720 JPEG ≤256 KiB, viewed by eye: title
  (63,445 B), play (49,631 B — sealed loop trapping 4 foes, Beacon, HUD
  with NIGHT 3 / COMBO ×8 / LOOPS SEALED 1), upgrade (54,831 B), victory
  (59,496 B — full run: 133,550 pts, 96 kills, 2 loops sealed).
- `main.ts` run twice: both outputs byte-identical. dossier.json 414,200
  bytes (cap 1.5 MiB); dossier text 107,185 bytes (cap 160 KiB).
- No network references in game/ (no http/https/fetch/WebSocket/import()).

## v1 (2026-11-17, submitted as 01a1e740, rank 997/7,202, NOT paid)

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

## For the parent (submit) — v2 ready
- DO NOT submit from this build session. Parent flow: repo
  `nabla13/best-game-01` already exists (created after the opening,
  2026-11-15T18:00Z) with `.makefun/owner.json`, README badges, About
  website + topic `makefun`. Commit this v2 work, push, then bundle
  transcripts (this session + usage rows), `check`, and submit with
  `--repo-url` as a NEW submission (last submission before the deadline is
  the final entry; v1's submission 01a1e740 stays as the fallback if v2
  fails a check — do not delete anything).
- Deadline: **2026-11-18T18:00Z = 19 Nov 01:00 WIB**. Submit 18 Nov evening
  WIB for buffer. Title: "LUMEN DRIFT".
- Known notes: audio starts on the first user gesture (browser policy);
  `?shot=` / `?selftest=` are test-only query params in the shipped game,
  harmless in normal play (plain page ignores them). The dev server was on
  port 8091 and is stopped; restart with `node serve.ts --port 8091` from
  this directory to play-test again.
- No spending, no keys, no paid APIs used anywhere in this build.
