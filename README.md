# LUMEN DRIFT

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/nabla13/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/nabla13/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

An original neon arena survival shooter (2D canvas, no libraries, zero network requests). Pilot the light-ship Lumen through the Shattered Ring: blast void shards, gather starshards, pick 1-of-3 upgrades between waves, and defeat the Void Warden boss on wave 10 to light the Beacon — or keep flying in endless mode.

## Play it

Serve `game/` with any static HTTP server and open `index.html` in a desktop browser:

```sh
node serve.ts --port 8091
```

Then open http://localhost:8091/ in Chrome.

## Controls

- **WASD / arrows** — fly
- **Mouse** — aim, **hold click** — fire
- **Space / Shift** — dash (brief invulnerability)
- **E / right-click** — Nova blast (clears bullets, big area damage)
- **P** — pause, **M** — mute, **R** — restart
- **1 / 2 / 3 or click** — pick an upgrade between waves

## The game

- 5 enemy kinds (Mote, Weaver, Spitter, Brute, and the Void Warden boss on wave 10 with 2 phases, radial bursts and summons)
- Wave director with scaling budgets, 10 upgrade cards, combo multiplier up to ×8
- Starshard / heart / overdrive pickups with magnet, particles, shockwaves, screen shake, hit-stop
- WebAudio synth sound effects and bass music (starts on first user gesture)
- Best score and wave kept in localStorage

Win by defeating the Warden on wave 10 (victory screen + endless mode). Lose all hull and the game ends with stats and a restart.

---

<sub>Entered on [make.fun](https://make.fun/?ref=t93gzdgw&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
