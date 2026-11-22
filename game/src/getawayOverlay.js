export function renderGetawayOverlay(ctx, state, hits) {
  const cam = state.cam;
  if (state.screen === 'title') drawTitleOverlay(ctx, state, cam, hits);
  else if (state.screen === 'caught') drawCaughtRibbon(ctx, state, cam, hits);
  else if (state.screen === 'getaway' || state.screen === 'won') drawSideGetawayCard(ctx, state, cam, hits);
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
  const mw = Math.min(568, vw - 48), mh = 186, mx = Math.round((vw - mw) * 0.5), my = vh - mh - 18, cx = vw * 0.5;
  ctx.save();
  ctx.strokeStyle = 'rgba(251, 113, 133, 0.45)'; ctx.lineWidth = 8;
  ctx.strokeRect(4, topBarH + 4, vw - 8, vh - topBarH - 8);
  drawPanelBox(ctx, mx, my, mw, mh, 12, 'rgba(9, 19, 34, 0.97)', '#FB7185', 3);
  drawText(ctx, `SPOTTED BY ${state.caughtBy || 'GUARD 1'}`, cx, my + 34, 28, '#FFFFFF', 'center');

  const pillText = '0.75s GRACE WINDOW EXCEEDED';
  const pw = Math.min(mw - 44, Math.ceil(measureTrackedWidth(ctx, pillText, 17, 1.6)) + 34);
  drawPanelBox(ctx, cx - pw * 0.5, my + 60, pw, 38, 7, '#FBBF24', '#FEF08A', 1.8);
  drawTrackedText(ctx, pillText, cx, my + 79.5, 17, '#07101F', 1.6, 'center', null);

  const btnW = mw - 64;
  drawPanelBox(ctx, cx - btnW * 0.5, my + 114, btnW, 52, 8, '#10B981', '#A7F3D0', 2.2, '[R] RETRY FLOOR', '#07101F', 22);
  hits.push({ id: 'retry', type: 'retry', x: cx - btnW * 0.5, y: my + 114, w: btnW, h: 52 });
  ctx.restore();
}

function drawSideGetawayCard(ctx, state, cam, hits) {
  const { vw, vh, topBarH } = cam;
  const p = state.payout || { loot: state.lootValue, tools: state.toolsSpent, ghostBonus: 4500 };
  const loot = p.loot || 0, spent = p.tools || 0, bonus = p.ghostBonus || 0, net = loot - spent + bonus;
  const fmt = (n) => Math.abs(Math.round(n)).toLocaleString(), floorNum = (state.floorIndex || 0) + 1;
  const rows = [['VAULT LOOT', `+$${fmt(loot)}`, '#FFFFFF'], ['TOOLS USED', `-$${fmt(spent)}`, '#FBBF24']];
  if (bonus > 0) rows.push(['GHOST BONUS', `+$${fmt(bonus)}`, '#60A5FA']);

  const cw = vw < 1140 ? 436 : 448, ch = 294 + rows.length * 46, x = vw - cw - 14, cx = x + cw * 0.5;
  const sx = (wx) => cam.anchorX + (wx - cam.focusX) * cam.scale, sy = (wy) => cam.anchorY + (wy - cam.focusY) * cam.scale;
  const exRight = Math.max(sx(state.exit.x + state.exit.w), sx(state.thief.x) + 26);
  const exTop = Math.min(sy(state.exit.y), sy(state.thief.y) - 26), exBot = Math.max(sy(state.exit.y + state.exit.h), sy(state.thief.y) + 26);
  let y = topBarH + Math.max(16, (vh - topBarH - ch) * 0.5);
  if (exRight > x - 12) y = (exTop + exBot) * 0.5 < vh * 0.5 ? Math.min(vh - ch - 16, Math.max(y, exBot + 22)) : Math.max(topBarH + 14, Math.min(y, exTop - ch - 22));

  ctx.save();
  drawPanelBox(ctx, x, y, cw, ch, 12, 'rgba(9, 19, 34, 0.97)', PALETTE.brass, 2.8);
  const hdr = `FLOOR ${floorNum}/${FLOOR_COUNT} · VAULT CLEARED`;
  ctx.font = `900 16px ${UI_FONT}`;
  const hw = Math.min(cw - 36, Math.ceil(ctx.measureText(hdr).width) + 34);
  drawPanelBox(ctx, cx - hw * 0.5, y + 18, hw, 34, 6, '#10B981', '#A7F3D0', 1.6, hdr, '#07101F', 16);
  drawText(ctx, 'GETAWAY PAYOUT LEDGER', cx, y + 78, 22, '#FFFFFF', 'center');
  ctx.fillStyle = 'rgba(212, 175, 55, 0.45)'; ctx.fillRect(x + 22, y + 98, cw - 44, 1.5);

  const lx = x + 22, rx = x + cw - 22;
  let ry = y + 130;
  for (const [label, val, col] of rows) {
    drawText(ctx, label, lx, ry, 18, '#E2E8F0', 'left');
    drawTrackedText(ctx, val, rx, ry, 26, col, 1.2, 'right', '#05070B');
    ry += 46;
  }

  ctx.fillStyle = PALETTE.brass; ctx.fillRect(lx, ry - 14, cw - 44, 2.5);
  drawPanelBox(ctx, lx - 4, ry - 2, cw - 36, 62, 8, '#082F23', '#34D399', 2);
  drawText(ctx, 'NET PAYOUT', lx + 10, ry + 29, 20, '#A7F3D0', 'left');
  drawTrackedText(ctx, `${net < 0 ? '-' : '+'}$${fmt(net)}`, rx - 8, ry + 29, 30, '#FFFFFF', 1.3, 'right', '#041A12');

  const cta = state.floorIndex === FLOOR_COUNT - 1 ? 'PLAY AGAIN →' : 'NEXT FLOOR →';
  drawPanelBox(ctx, x + 22, y + ch - 74, cw - 44, 54, 8, '#10B981', '#A7F3D0', 2.2, cta, '#07101F', 22);
  hits.push({ id: 'next', type: 'next', x: x + 22, y: y + ch - 74, w: cw - 44, h: 54 });
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

function measureTrackedWidth(ctx, text, fs, tracking) {
  ctx.font = `900 ${fs}px ${UI_FONT}`;
  const chars = [...text];
  return chars.reduce((acc, ch, i) => acc + ctx.measureText(ch).width + (i < chars.length - 1 ? tracking : 0), 0);
}

function drawTrackedText(ctx, text, x, y, fs, color, tracking, align, strokeCol) {
  const w = measureTrackedWidth(ctx, text, fs, tracking);
  let cx = align === 'right' ? x - w : align === 'center' ? x - w * 0.5 : x;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if (strokeCol) { ctx.lineJoin = 'round'; ctx.strokeStyle = strokeCol; ctx.lineWidth = 2.6; }
  for (const ch of text) {
    if (strokeCol) ctx.strokeText(ch, cx, y);
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  ctx.restore();
}
