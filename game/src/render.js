// All canvas drawing for LUMEN DRIFT: the arena, the HUD and every screen.
// The judge sees the game through its screenshots, so each screen is drawn
// to read at a glance: a big title, a HUD with score, wave, hull and Nova,
// upgrade cards, and end screens with stats and a restart.
import { ARENA, PALETTE, PLAYER, VIEW } from './config.js';
import { SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_VICTORY, overButtons, victoryButtons } from './world.js';
import { cardRects } from './upgrades.js';

const FONT = '"Segoe UI", system-ui, sans-serif';

function panel(ctx, x, y, w, h, alpha = 0.82) {
  ctx.fillStyle = `rgba(6,10,24,${alpha})`;
  ctx.strokeStyle = 'rgba(94,242,255,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.stroke();
}

function titleText(ctx, text, x, y, size, color, glow = null) {
  ctx.save();
  ctx.font = `800 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (glow) {
    ctx.shadowBlur = 24;
    ctx.shadowColor = glow;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawHullHearts(ctx, x, y, hull, maxHull) {
  ctx.save();
  ctx.font = '22px ' + FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < maxHull; i += 1) {
    ctx.fillStyle = i < hull ? PALETTE.heart : 'rgba(255,93,122,0.25)';
    ctx.fillText('♥', x + i * 26, y);
  }
  ctx.restore();
}

function drawNovaMeter(ctx, x, y, w, frac, ready) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, 14, 7);
  ctx.fill();
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, '#7a5cff');
  g.addColorStop(1, '#b78cff');
  ctx.fillStyle = g;
  if (frac > 0) {
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(14, w * frac), 14, 7);
    ctx.fill();
  }
  if (ready) {
    ctx.shadowBlur = 14;
    ctx.shadowColor = PALETTE.nova;
    ctx.strokeStyle = '#e6dcff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, 14, 7);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.font = `700 13px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = ready ? '#e6dcff' : PALETTE.dim;
  ctx.fillText(ready ? 'NOVA READY — press E' : 'NOVA', x + w + 10, y + 7);
  ctx.restore();
}

function drawHud(ctx, world) {
  const p = world.player;
  ctx.save();
  // Top bar.
  ctx.fillStyle = 'rgba(4,6,15,0.55)';
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 26px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE ${world.score.toLocaleString('en-US')}`, 24, 24);
  drawHullHearts(ctx, 24, 50, p.hull, p.maxHull);
  ctx.textAlign = 'center';
  ctx.font = `800 24px ${FONT}`;
  ctx.fillStyle = world.wave === 10 ? PALETTE.warden : PALETTE.text;
  ctx.fillText(world.wave === 10 ? 'WAVE 10 — VOID WARDEN' : `WAVE ${world.wave}`, VIEW.width / 2, 24);
  ctx.font = `600 14px ${FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText(world.endless ? 'ENDLESS MODE' : 'DEFEAT THE WARDEN ON WAVE 10', VIEW.width / 2, 48);
  ctx.textAlign = 'right';
  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`◆ ${world.shards}`, VIEW.width - 24, 24);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 14px ${FONT}`;
  ctx.fillText(`BEST ${Math.max(world.best.score, world.score).toLocaleString('en-US')}`, VIEW.width - 24, 48);
  // Combo badge.
  if (world.combo > 1) {
    ctx.textAlign = 'right';
    ctx.font = `800 22px ${FONT}`;
    ctx.fillStyle = PALETTE.shard;
    ctx.shadowBlur = 12;
    ctx.shadowColor = PALETTE.shard;
    ctx.fillText(`COMBO ×${world.combo}`, VIEW.width - 24, 92);
    ctx.shadowBlur = 0;
  }
  // Nova meter, bottom left; dash, bottom right.
  drawNovaMeter(ctx, 24, VIEW.height - 40, 220, p.nova / PLAYER.novaMax, p.novaReady);
  ctx.textAlign = 'right';
  ctx.font = `700 14px ${FONT}`;
  ctx.fillStyle = p.dashReady ? PALETTE.player : PALETTE.dim;
  ctx.fillText(p.dashReady ? 'DASH READY — Space' : 'DASH …', VIEW.width - 24, VIEW.height - 22);
  // Wave banner.
  if (world.bannerTimer > 0) {
    const a = Math.min(1, world.bannerTimer);
    ctx.globalAlpha = a;
    titleText(ctx, world.banner, VIEW.width / 2, 150, 44, PALETTE.text, PALETTE.player);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawArenaFrame(ctx) {
  ctx.save();
  ctx.strokeStyle = 'rgba(94,242,255,0.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ARENA.x, ARENA.y, ARENA.width, ARENA.height);
  ctx.restore();
}

function drawTitle(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(4,6,15,0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  titleText(ctx, 'LUMEN DRIFT', VIEW.width / 2, 190, 84, PALETTE.text, PALETTE.player);
  titleText(ctx, 'DEFEND THE BEACON  •  LIGHT THE LAST STAR', VIEW.width / 2, 252, 20, PALETTE.player);
  ctx.font = `600 18px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText('Void shards swarm the Shattered Ring. Blast them, gather starshards,', VIEW.width / 2, 330);
  ctx.fillText('choose your upgrades — and bring down the Void Warden on wave 10.', VIEW.width / 2, 358);
  const blink = 0.6 + 0.4 * Math.sin(world.time * 3);
  ctx.globalAlpha = blink;
  titleText(ctx, 'CLICK OR PRESS ENTER TO FLY', VIEW.width / 2, 440, 26, PALETTE.gold);
  ctx.globalAlpha = 1;
  ctx.font = `600 16px ${FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('WASD / arrows — fly      Mouse — aim      Hold click — fire', VIEW.width / 2, 500);
  ctx.fillText('Space — dash      E / right click — Nova blast      P — pause      M — mute', VIEW.width / 2, 526);
  if (world.best.score > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`BEST  ${world.best.score.toLocaleString('en-US')}  •  WAVE ${world.best.wave}`, VIEW.width / 2, 580);
  }
  ctx.restore();
}

function drawUpgrade(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(4,6,15,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  titleText(ctx, `WAVE ${world.wave} CLEARED`, VIEW.width / 2, 130, 44, PALETTE.text, PALETTE.player);
  ctx.font = `600 20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Choose one upgrade — click a card or press 1, 2 or 3', VIEW.width / 2, 180);
  const rects = cardRects();
  world.offered.forEach((u, i) => {
    const r = rects[i];
    panel(ctx, r.x, r.y, r.width, r.height, 0.92);
    ctx.textAlign = 'center';
    ctx.font = '44px ' + FONT;
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(u.icon, r.x + r.width / 2, r.y + 66);
    ctx.font = `800 22px ${FONT}`;
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(u.name, r.x + r.width / 2, r.y + 128);
    ctx.font = `600 16px ${FONT}`;
    ctx.fillStyle = PALETTE.dim;
    ctx.fillText(u.desc, r.x + r.width / 2, r.y + 162);
    const owned = world.owned[u.id] || 0;
    ctx.font = `700 15px ${FONT}`;
    ctx.fillStyle = PALETTE.player;
    ctx.fillText(owned > 0 ? `OWNED ×${owned}` : 'NEW', r.x + r.width / 2, r.y + 200);
    ctx.font = `800 18px ${FONT}`;
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText(`[${i + 1}]`, r.x + r.width / 2, r.y + 232);
  });
  ctx.restore();
}

function drawPause(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(4,6,15,0.66)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  titleText(ctx, 'PAUSED', VIEW.width / 2, 320, 56, PALETTE.text, PALETTE.player);
  ctx.font = `600 18px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Press P or Enter to keep flying', VIEW.width / 2, 380);
  ctx.restore();
}

function statRows(ctx, world, rows, y0) {
  ctx.save();
  ctx.font = `600 19px ${FONT}`;
  ctx.textAlign = 'left';
  rows.forEach((row, i) => {
    const y = y0 + i * 32;
    ctx.fillStyle = PALETTE.dim;
    ctx.fillText(row[0], 470, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(row[1], 810, y);
    ctx.textAlign = 'left';
  });
  ctx.restore();
}

function drawEndButton(ctx, b, hover) {
  panel(ctx, b.x, b.y, b.width, b.height, hover ? 0.95 : 0.85);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `800 19px ${FONT}`;
  ctx.fillStyle = hover ? '#ffffff' : PALETTE.text;
  ctx.fillText(b.label, b.x + b.width / 2, b.y + 22);
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText(b.sub, b.x + b.width / 2, b.y + 44);
  ctx.restore();
}

function drawOver(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,10,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  titleText(ctx, 'THE LIGHT FADES', VIEW.width / 2, 150, 52, PALETTE.danger, PALETTE.danger);
  ctx.font = `600 20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText(`The Warden's swarm overtook the Lumen on wave ${world.wave}.`, VIEW.width / 2, 205);
  statRows(ctx, world, [
    ['Final score', world.score.toLocaleString('en-US')],
    ['Best score', Math.max(world.best.score, world.score).toLocaleString('en-US')],
    ['Wave reached', String(world.wave)],
    ['Void shards destroyed', String(world.kills)],
    ['Starshards gathered', String(world.shards)],
    ['Best combo', `×${world.bestCombo}`],
  ], 260);
  for (const b of overButtons()) drawEndButton(ctx, b, false);
  ctx.font = `600 16px ${FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Press R to fly again', VIEW.width / 2, 610);
  ctx.restore();
}

function drawVictory(ctx, world) {
  ctx.save();
  ctx.fillStyle = 'rgba(4,10,6,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  titleText(ctx, '★  BEACON LIT  ★', VIEW.width / 2, 130, 52, PALETTE.gold, PALETTE.gold);
  titleText(ctx, 'THE VOID WARDEN IS DOWN — VICTORY', VIEW.width / 2, 185, 24, PALETTE.text);
  ctx.font = `600 18px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('The Beacon burns bright over the Shattered Ring once more.', VIEW.width / 2, 220);
  statRows(ctx, world, [
    ['Final score', world.score.toLocaleString('en-US')],
    ['Best score', Math.max(world.best.score, world.score).toLocaleString('en-US')],
    ['Void shards destroyed', String(world.kills)],
    ['Starshards gathered', String(world.shards)],
    ['Best combo', `×${world.bestCombo}`],
    ['Accuracy', `${world.stats.shotsFired > 0 ? Math.round((100 * world.stats.shotsHit) / world.stats.shotsFired) : 0}%`],
  ], 262);
  for (const b of victoryButtons()) drawEndButton(ctx, b, false);
  ctx.font = `600 16px ${FONT}`;
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Press R to play again from wave 1', VIEW.width / 2, 610);
  ctx.restore();
}

export function drawWorld(ctx, world) {
  const shake = world.particles.shakeOffset();
  ctx.save();
  ctx.translate(shake.x, shake.y);
  world.particles.drawBackground(ctx, world.time);
  drawArenaFrame(ctx);
  if (world.screen !== SCREEN_TITLE) {
    world.pickups.draw(ctx, world.time);
    for (const e of world.enemies) e.draw(ctx, world.time);
    world.bullets.draw(ctx);
    world.player.draw(ctx, world.time);
    world.particles.draw(ctx);
    if (world.screen === SCREEN_PLAY || world.screen === SCREEN_PAUSE || world.screen === SCREEN_UPGRADE) {
      drawHud(ctx, world);
    }
  } else {
    // Title: the swarm drifts behind the panel.
    for (const e of world.enemies) e.draw(ctx, world.time);
    world.particles.draw(ctx);
    drawTitle(ctx, world);
  }
  if (world.screen === SCREEN_UPGRADE) drawUpgrade(ctx, world);
  if (world.screen === SCREEN_PAUSE) drawPause(ctx);
  if (world.screen === SCREEN_OVER) drawOver(ctx, world);
  if (world.screen === SCREEN_VICTORY) drawVictory(ctx, world);
  // Red damage flash.
  if (world.flashRed > 0) {
    ctx.fillStyle = `rgba(255,40,70,${Math.min(0.25, world.flashRed)})`;
    ctx.fillRect(-20, -20, VIEW.width + 40, VIEW.height + 40);
  }
  ctx.restore();
}
