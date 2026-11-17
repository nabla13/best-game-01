# LUMEN DRIFT — best-game-01 entry — STATUS

## v3 (2026-11-17, built after v2 ranked 382 prize / 79.9% judge, then slipped to 522 / 519 of 10,759 — NOT paid)

**What changed and why it should score higher.** v2's weave was real but the
game still lacked what every top-10 entry has: a second system that changes
how every night plays, a campaign that travels, difficulties, and a second
boss. The top 10 all sit at 19–20 wins, judge ~92–94%, and they all pair a
distinctive verb with a base to defend and named progression. v3 keeps the
WEAVE and adds BEND THE LIGHT, plus the missing structure:

- **New second verb: BEND THE LIGHT.** The Beacon now sweeps a rotating
  beam across the arena that burns foes it touches. Press **Q** to place a
  **Mirror Shard** (10 starshards, max 3 on the field): the beam bounces
  off it, so a well-placed mirror doubles the light hunting the swarm.
  Mirrors are fragile — foes that reach one chip it, and a shattered mirror
  drops its shards back. New module `game/src/light.js` (placeMirror,
  ray-cast beam with up to 3 bounces, beam burn, focus beams, prism-loop
  detection).
- **Prism Loops.** A sealed loop that encloses a mirror bursts twice as
  hard and fires focus beams in four directions; every loop detonation now
  also fires one focus beam at the nearest foe. The weave and the beam are
  one system: loops focus the light.
- **Second boss: The Prism Matriarch (night 4).** She orbits the Beacon,
  sweeps a hostile beam that cuts the ship, summons weavers, and teleports;
  below half health her beam sweeps faster. Her death clears the night for
  the dawn. The Void Warden stays the night-7 final.
- **Three realms.** Nights 1–2 burn in the Ember Fields, 3–4 glint in the
  Mirror Reefs, 5–7 sink into the Hollow Deep — each realm repaints the
  nebula and gets a banner when the nights move on. Endless nights keep
  cycling the realms, and a boss returns every seventh night (Matriarch on
  4th nights, Warden on 7th).
- **Three difficulties on the title screen** (click a card or press 1/2/3):
  Kindle (gentler, 6 Beacon light, ×0.8 score), Blaze (the intended burn),
  Inferno (cruel, 4 light, ×1.5 score).
- **5 new light relics** (19 total): Extra Mirror, Focus Lens, Prism Lens,
  Cheap Glass, Beam Burn.
- Small robustness fix found by the play-test: a click now carries its own
  position, so a click without a prior mousemove (e.g. an automated
  play-through) lands where the pointer is — the KEEP FLYING button did not
  respond to such a click before.

## Verification done for v3 (2026-11-17, all in headless Chrome)

- Syntax: all 18 game .js files parse as ES modules; main.ts and serve.ts
  parse (`node --experimental-strip-types --check`).
- `?selftest=1` (90 s soak, autopilot plays on): **ok, zero page errors**;
  the autopilot reached **night 7** (score 75,975, 93 kills), sealed **3
  loops**, detonated 3, placed **3 mirrors**, scored **2 beam kills** and
  fired **3 focus beams** — the new system is used in real play, not just
  in staged scenes. It fell to the Warden on night 7 (hull 0, Beacon 4).
  The same run is byte-identical when repeated (deterministic).
- Interactive CDP play-test (`~/workspace/makefun/lumen3-driver.mjs`,
  REAL key/mouse events): title loads → difficulty select (3 = INFERNO,
  2 = BLAZE) → Enter starts night 1 → WASD moves the ship (640,480 →
  882,480) → holding mouse fires (4 shots) → Space dashes and weaves a
  driftline (4 trail points) → Q places a mirror shard (1 mirror, beam
  segments live) → P pauses (world frozen) → P resumes → **10/10 checks
  pass, zero page errors**. Two fixes along the way: the first run's
  difficulty/movement checks failed only because the test read state
  before the next frame (swiftshader runs the sim at ~0.28× wall speed in
  this environment — the game itself runs at full speed); the KEEP FLYING
  button needed the click-position fix above.
- Endless probe (`~/workspace/makefun/lumen3-endless-probe.mjs`): night-7
  Warden spawns → killed under the real rules → victory screen → clicking
  KEEP FLYING starts **night 8, endless=true**; night 11 spawns the Prism
  Matriarch again (realm THE HOLLOW DEEP); night 14 spawns the Warden
  again. No page errors.
- 4 fresh screenshots 1280×720 JPEG ≤256 KiB, viewed by eye: title
  (96,693 B — difficulty cards, beam sweeping, mirror behind the panel),
  play (80,407 B — night 3, Realm II Mirror Reefs, sealed loop trapping 5
  foes, beam bouncing off a mirror, MIRRORS 3/3, COMBO ×8), upgrade
  (63,293 B — NIGHT 1 HELD, 3 relic cards), victory (87,837 B — full run:
  101,100 pts, 78 kills, 92% accuracy, Difficulty BLAZE, Mirrors placed 3).
- `main.ts` run twice: both outputs **byte-identical**. dossier.json
  576,869 bytes (cap 1.5 MiB); dossier text 134,710 bytes (cap 160 KiB);
  19 source files, 4 images.
- No network references in game/ (no http/https/fetch/WebSocket/import()).

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

## For the parent (submit) — v3 ready
- DO NOT submit from this build session. Parent flow: repo
  `nabla13/best-game-01` already exists (created after the opening,
  2026-11-15T18:00Z) with `.makefun/owner.json`, README badges, About
  website + topic `makefun`. Commit this v3 work, push, then bundle
  transcripts (this session + usage rows), `check`, and submit with
  `--repo-url` as a NEW submission (last submission before the deadline is
  the final entry; v2's submission 01a1e79c stays as the fallback if v3
  fails a check — do not delete anything).
- Deadline: **2026-11-18T18:00Z = 19 Nov 01:00 WIB**. Submit 18 Nov evening
  WIB for buffer. Title: "LUMEN DRIFT".
- Known notes: audio starts on the first user gesture (browser policy);
  `?shot=` / `?selftest=` are test-only query params in the shipped game,
  harmless in normal play (plain page ignores them). The dev server was on
  port 8091 and is stopped; restart with `node serve.ts --port 8091` from
  this directory to play-test again. Verification driver:
  `~/workspace/makefun/lumen3-driver.mjs` (selftest | playtest | shots |
  all); endless probe: `~/workspace/makefun/lumen3-endless-probe.mjs`.
  Headless Chrome in this environment renders at ~0.28× wall speed
  (swiftshader) — the game logic runs at full speed; the selftest and the
  screenshot scenes run the sim directly and are unaffected.
- No spending, no keys, no paid APIs used anywhere in this build.
