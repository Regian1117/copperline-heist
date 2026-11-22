export function renderGetawayOverlay(ctx, state, hits) {
  const cam = state.cam;
  if (state.screen === 'title') drawTitleOverlay(ctx, state, cam, hits);
  else if (state.screen === 'caught') drawCaughtRibbon(ctx, state, cam, hits);
  else if (state.screen === 'getaway') drawSideGetawayCard(ctx, state, cam, hits);
  else if (state.paused) drawPauseModal(ctx, cam, hits);
}

/* Title briefing modal, slim bottom caught ribbon, compact side Art-Deco payout card, and pause dialog. */
import { drawPanelBox } from './arenaRenderer.js';
import { AUTHORED_VAULTS, FLOOR_COUNT } from './authoredVaults.js';
import { PALETTE, UI_FONT } from './toolsAndEconomy.js';

function drawTitleOverlay(ctx, state, cam, hits) {
  const { vw, vh, topBarH, bottomBarH } = cam;
  const cx = vw * 0.5;
  const cy = topBarH + (vh - topBarH - bottomBarH) * 0.5;
  const cw = Math.min(560, vw - 60);
  const x = cx - cw * 0.5;
  const y = cy - 148;

  ctx.save();
  ctx.fillStyle = 'rgba(10, 12, 18, 0.68)';
  ctx.fillRect(0, topBarH, vw, vh - topBarH - bottomBarH);
  drawPanelBox(ctx, x, y, cw, 296, 12, PALETTE.hudObsidian, PALETTE.brass, 2.4);
  drawText(ctx, 'COPPERLINE', cx, y + 50, 42, '#F8FAFC', 'center');
  drawText(ctx, 'BLUEPRINT ARCHITECTURAL STEALTH HEIST', cx, y + 84, 13, PALETTE.brass, 'center');

  const pw = Math.floor((cw - 86) / 4);
  for (let i = 0; i < AUTHORED_VAULTS.length; i++) {
    const px = x + 28 + i * (pw + 10);
    const act = state.floorIndex === i;
    drawPanelBox(ctx, px, y + 110, pw, 42, 6, act ? PALETTE.hudIvory : '#171B26', act ? PALETTE.brassBright : '#334155', 1.8, AUTHORED_VAULTS[i].code, act ? PALETTE.hudInk : '#CBD5E1', 15);
    hits.push({ id: `floor-${i}`, type: 'floor', index: i, x: px, y: y + 110, w: pw, h: 42 });
  }

  drawPanelBox(ctx, x + 28, y + 174, cw - 56, 52, 8, PALETTE.exitGreen, '#A7F3D0', 2, 'START HEIST  [ENTER]', '#042219', 21);
  hits.push({ id: 'start', type: 'start', x: x + 28, y: y + 174, w: cw - 56, h: 52 });
  drawText(ctx, 'WASD Move · SHIFT Sneak · E Hack · Z Zoom · 1-4 Tools · TAB Routes', cx, y + 258, 13, '#CBD5E1', 'center');
  ctx.restore();
}

function drawCaughtRibbon(ctx, state, cam, hits) {
  const { vw, vh, topBarH } = cam;
  const rh = Math.round(vh * 0.14);
  const ry = vh - rh - 12;
  const rw = vw - 36;

  ctx.save();
  ctx.strokeStyle = 'rgba(255, 46, 76, 0.45)';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, topBarH + 5, vw - 10, vh - topBarH - 10);
  drawPanelBox(ctx, 18, ry, rw, rh, 10, PALETTE.hudObsidian, PALETTE.guardCone, 2.6);

  const msg = `CAUGHT BY ${state.caughtBy || 'GUARD 1'}`;
  drawText(ctx, msg, 44, ry + rh * 0.5, 28, '#FFFFFF', 'left');
  const bx = 64 + ctx.measureText(msg).width;
  ctx.font = `900 16px ${UI_FONT}`;
  const bw = Math.ceil(ctx.measureText('0.75s GRACE WINDOW EXCEEDED').width) + 24;
  drawPanelBox(ctx, bx, ry + rh * 0.5 - 19, bw, 38, 6, PALETTE.coinGold, '#FFFBEB', 1.6, '0.75s GRACE WINDOW EXCEEDED', PALETTE.hudInk, 16);

  const btnX = 18 + rw - 270;
  const btnY = ry + (rh - 52) * 0.5;
  drawPanelBox(ctx, btnX, btnY, 248, 52, 8, PALETTE.exitGreen, '#A7F3D0', 2, '[R] RETRY FLOOR', '#042219', 20);
  hits.push({ id: 'retry', type: 'retry', x: btnX, y: btnY, w: 248, h: 52 });
  ctx.restore();
}

function drawSideGetawayCard(ctx, state, cam, hits) {
  const { vw, vh, topBarH } = cam;
  const p = state.payout || { loot: state.lootValue, tools: state.toolsSpent, ghostBonus: 4500, bonusLabel: 'ZERO-CAUGHT', toolsLabel: 'TOOLS USED', netTake: state.lootValue + 4500 - state.toolsSpent };
  const cw = Math.min(378, Math.round(vw * 0.36));
  const ch = 412;
  const x = vw - cw - 14;
  const cx = x + cw * 0.5;
  const y = topBarH + Math.max(24, (vh - topBarH - ch) * 0.5);

  ctx.save();
  drawPanelBox(ctx, x, y, cw, ch, 12, 'rgba(11, 18, 33, 0.97)', PALETTE.brass, 2.8);
  const hdr = `${state.code} · ESCAPED`;
  ctx.font = `900 17px ${UI_FONT}`;
  const hw = Math.ceil(ctx.measureText(hdr).width) + 32;
  drawPanelBox(ctx, cx - hw * 0.5, y + 20, hw, 34, 6, '#34D399', '#A7F3D0', 1.6, hdr, '#042219', 17);

  const lx = x + 22;
  const rx = x + cw - 22;
  let ry = y + 98;
  for (const [label, val, col] of [
    ['VAULT LOOT', `+$${p.loot.toLocaleString()}`, '#F6EFE0'],
    [p.toolsLabel || 'TOOLS USED', `-$${p.tools.toLocaleString()}`, '#FDE047'],
    [p.bonusLabel || 'ZERO-CAUGHT', `+$${p.ghostBonus.toLocaleString()}`, '#60A5FA'],
  ]) {
    drawText(ctx, label, lx, ry, 18, '#E2E8F0', 'left');
    drawTrackedRightText(ctx, val, rx, ry, 28, col, 1.2);
    ry += 50;
  }

  ctx.fillStyle = PALETTE.brass;
  ctx.fillRect(lx, ry - 14, cw - 44, 2);
  drawPanelBox(ctx, lx - 6, ry + 2, cw - 32, 58, 7, '#09241B', PALETTE.brass, 1.8);
  drawText(ctx, 'NET HAUL', lx + 6, ry + 32, 20, '#D1FAE5', 'left');
  drawTrackedRightText(ctx, `+$${p.netTake.toLocaleString()}`, rx - 4, ry + 32, 32, '#FFFFFF', 1.3);

  const cta = state.floorIndex === FLOOR_COUNT - 1 ? '[ENTER] REPLAY' : '[ENTER] NEXT FLOOR';
  drawPanelBox(ctx, x + 22, y + ch - 74, cw - 44, 52, 8, PALETTE.exitGreen, '#A7F3D0', 2, cta, '#042219', 21);
  hits.push({ id: 'next', type: 'next', x: x + 22, y: y + ch - 74, w: cw - 44, h: 52 });
  ctx.restore();
}

function drawPauseModal(ctx, cam, hits) {
  const { vw, vh, topBarH } = cam;
  const cx = vw * 0.5;
  const cy = topBarH + (vh - topBarH) * 0.5;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 12, 18, 0.62)';
  ctx.fillRect(0, topBarH, vw, vh - topBarH);
  drawPanelBox(ctx, cx - 160, cy - 82, 320, 164, 10, PALETTE.hudObsidian, PALETTE.brass, 2.4);
  drawText(ctx, 'PAUSED', cx, cy - 30, 26, '#F8FAFC', 'center');
  drawPanelBox(ctx, cx - 110, cy + 8, 220, 46, 7, PALETTE.exitGreen, '#A7F3D0', 1.8, '[P] RESUME', '#042219', 18);
  hits.push({ id: 'resume', type: 'resume', x: cx - 110, y: cy + 8, w: 220, h: 46 });
  ctx.restore();
}

function drawText(ctx, text, x, y, fs, color, align) {
  ctx.fillStyle = color;
  ctx.font = `900 ${fs}px ${UI_FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

function drawTrackedRightText(ctx, text, rightX, y, fs, color, tracking) {
  ctx.font = `900 ${fs}px ${UI_FONT}`;
  const chars = [...text];
  let x = rightX - chars.reduce((acc, ch, i) => acc + ctx.measureText(ch).width + (i < chars.length - 1 ? tracking : 0), 0);
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#05070B';
  ctx.lineWidth = 2.6;
  for (const ch of chars) {
    ctx.strokeText(ch, x, y);
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + tracking;
  }
  ctx.restore();
}
