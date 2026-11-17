# LUMEN DRIFT

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/nabla13/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/nabla13/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An original neon arena game about weaving light (2D canvas, no libraries, zero network requests). Pilot the light-ship Lumen through the Shattered Ring: **dash to paint burning driftlines, cross your own line to seal a loop and trap the swarm inside**, **press Q to place mirror shards and bend the Beacon's sweeping beam of light around them**, guard the Beacon at the arena's heart for seven nights across three realms, and bring down two bosses — the Prism Matriarch and the Void Warden — or keep flying in endless mode.

## Play it

Serve `game/` with any static HTTP server and open `index.html` in a desktop browser:

```sh
node serve.ts --port 8091
```

Then open http://localhost:8091/ in Chrome.

## Controls

- **WASD / arrows** — fly
- **Mouse** — aim, **hold click** — fire
- **Space / Shift** — dash: brief invulnerability, and it *paints* a driftline
- **Cross your own driftline** — seal a loop: everything inside is trapped, then it bursts
- **Q** — place a mirror shard (costs 10 starshards): the Beacon's beam bounces off it; a loop closed around a mirror is a PRISM LOOP — double damage and focus beams
- **E / right-click** — Nova blast (clears bullets, big area damage)
- **P** — pause, **M** — mute, **R** — restart
- **1 / 2 / 3 or click** — pick a relic between nights; on the title screen, pick a difficulty (Kindle / Blaze / Inferno)

## The game

- **Weave the light**: driftlines burn foes that touch them; sealed loops hold and detonate for double score
- **Bend the light**: the Beacon sweeps a rotating beam across the arena; mirror shards (Q, 10 starshards each) bounce it, so a well-placed mirror doubles the light hunting the swarm. A loop closed around a mirror is a PRISM LOOP — double burst damage and focus beams
- **Hold the Beacon**: the Beacon stands at the arena's heart; foes marked ◆ hunt it — if its light is drunk, the run ends. Dawn restores one light per night held
- **Seven nights across three realms**, each with its own name, mix and nebula: Ember Fields (nights 1–2), Mirror Reefs (nights 3–4), The Hollow Deep (nights 5–7)
- **Three difficulties** on the title screen (Kindle / Blaze / Inferno — Inferno pays ×1.5 score) and **two bosses**: the Prism Matriarch on night 4 (sweeping hostile beam, summons, teleports) and the Void Warden on night 7 with 3 phases
- **9 enemy kinds** (Mote, Weaver, Spitter, Charger with a telegraphed rush, Brute, Splitter, Sniper, and the two bosses)
- **19 relic cards** between nights, including weave relics (Trailburn, Loopmaster, Longline, Wide Weave) and light relics (Extra Mirror, Focus Lens, Prism Lens, Cheap Glass, Beam Burn) that make the beam and loops hit harder
- Combo multiplier up to ×8, starshard / heart / overdrive pickups with magnet, particles, shockwaves, screen shake, hit-stop, near-miss play
- WebAudio synth sound effects and bass music (starts on first user gesture)
- Best score and night kept in localStorage

Win by holding seven nights and defeating the Warden (victory screen + endless mode, where the nights keep coming, the realms keep cycling, and a boss returns every seventh night). Lose all hull — or let the Beacon go dark — and the game ends with stats and a restart.

---

<sub>Entered on [make.fun](https://make.fun/?ref=t93gzdgw&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
