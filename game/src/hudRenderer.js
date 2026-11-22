export function renderTacticalHud(ctx, state, hits) {
  hits.length = 0;
  const cam = state.cam;
  const { vw, vh, topBarH, bottomBarH } = cam;
  const compact = vw < 1140;

  ctx.save();
  drawTopTelemetryRail(ctx, state, vw, topBarH, compact, hits);
  if (bottomBarH > 0) drawBottomToolDock(ctx, state, vw, vh, bottomBarH, compact, hits);
  ctx.restore();
}

/* Slim top High-OCR telemetry rail and conditional bottom tool dock (hidden when zoomed or modal active). */
import { drawPanelBox } from './arenaRenderer.js';
import { isAudioMuted } from './heistAudio.js';
import { PALETTE, TOOL_CATALOG, UI_FONT } from './toolsAndEconomy.js';

function drawTopTelemetryRail(ctx, state, vw, topBarH, compact, hits) {
  ctx.fillStyle = PALETTE.hudObsidian;
  ctx.fillRect(0, 0, vw, topBarH);
  ctx.fillStyle = PALETTE.brass;
  ctx.fillRect(0, topBarH - 1.5, vw, 1.5);

  const ph = topBarH - 10;
  const py = Math.round((topBarH - ph) * 0.5) - 1;
  const midY = py + ph * 0.5;
  const gap = compact ? 7 : 10;
  let x = compact ? 10 : 14;

  const brandFs = compact ? 14 : 15;
  ctx.font = `900 ${brandFs}px ${UI_FONT}`;
  const brandW = Math.ceil(ctx.measureText('◆ COPPERLINE').width) + 20;
  drawPanelBox(ctx, x, py, brandW, ph, 5, '#111C33', PALETTE.brass, 1.4, '◆ COPPERLINE', PALETTE.brassBright, brandFs);
  x += brandW + gap;

  const fs = compact ? 17 : 19;
  for (const [label, border] of [[state.code, PALETTE.brass], [`TAKE $${state.lootValue.toLocaleString()}`, PALETTE.brass], [`PURSE $${state.purse.toLocaleString()}`, '#94A3B8']]) {
    ctx.font = `900 ${fs}px ${UI_FONT}`;
    const w = Math.ceil(ctx.measureText(label).width) + 24;
    drawPanelBox(ctx, x, py, w, ph, 5, PALETTE.hudIvory, border, 1.6, label, PALETTE.hudInk, fs);
    x += w + gap;
  }

  let rx = vw - (compact ? 10 : 14);
  const muteX = rx - ph;
  const muted = isAudioMuted();
  drawPanelBox(ctx, muteX, py, ph, ph, 5, muted ? '#3A1019' : '#111C33', muted ? PALETTE.guardCone : PALETTE.brass, 1.4, muted ? 'M×' : 'M♪', muted ? '#FECDD3' : PALETTE.brassBright, 12);
  hits.push({ id: 'mute', type: 'mute', x: muteX, y: py, w: ph, h: ph });
  drawUnifiedAlarmModule(ctx, state, muteX - 8, py, ph, midY, compact, fs);
}

function drawUnifiedAlarmModule(ctx, state, rx, py, ph, midY, compact, fs) {
  const pct = Math.max(0, Math.min(100, Math.round(state.alarm)));
  const shownPct = state.screen === 'caught' ? 100 : pct;
  const tag = state.screen === 'caught' ? 'CAUGHT' : state.lockdown ? 'LOCKDOWN' : shownPct >= 60 ? 'ALERT' : shownPct >= 25 ? 'SUSPICIOUS' : 'CALM';
  const badgeBg = tag === 'SUSPICIOUS' ? '#FBBF24' : tag === 'CALM' ? '#34D399' : '#EF4444';
  const badgeFg = tag === 'SUSPICIOUS' || tag === 'CALM' ? PALETTE.hudInk : '#FFFFFF';
  const badgeBorder = tag === 'SUSPICIOUS' ? '#FEF08A' : tag === 'CALM' ? '#A7F3D0' : '#FCA5A5';
  const tagFs = compact ? 15 : 16;
  ctx.font = `900 ${tagFs}px ${UI_FONT}`;
  const bw = Math.ceil(ctx.measureText(tag).width) + 22;
  drawPanelBox(ctx, rx - bw, py, bw, ph, 5, badgeBg, badgeBorder, 1.7, tag, badgeFg, tagFs);
  rx -= bw + 8;

  const barCol = shownPct >= 60 ? PALETTE.guardCone : shownPct >= 25 ? '#FBBF24' : PALETTE.exitGreen;
  const barW = compact ? 90 : 118;
  const alarmText = `ALARM ${shownPct}%`;
  ctx.font = `900 ${fs}px ${UI_FONT}`;
  const tw = Math.ceil(ctx.measureText(alarmText).width);
  const mw = tw + barW + 30;
  const mx = rx - mw;

  drawPanelBox(ctx, mx, py, mw, ph, 5, PALETTE.hudIvory, barCol, 1.8);
  ctx.fillStyle = PALETTE.hudInk;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(alarmText, mx + 10, midY + 0.5);

  const bx = mx + 20 + tw;
  const by = Math.round(midY - 6.5);
  ctx.fillStyle = '#0B1221';
  ctx.fillRect(bx, by, barW, 13);
  const fw = Math.round((barW * shownPct) / 100);
  if (fw > 0) {
    ctx.fillStyle = barCol;
    ctx.fillRect(bx + 1, by + 1, Math.max(1, fw - 2), 11);
  }
}

function drawBottomToolDock(ctx, state, vw, vh, bottomBarH, compact, hits) {
  const by = vh - bottomBarH;
  ctx.fillStyle = PALETTE.hudObsidian;
  ctx.fillRect(0, by, vw, bottomBarH);
  ctx.fillStyle = PALETTE.brass;
  ctx.fillRect(0, by, vw, 1.5);

  const padX = compact ? 10 : 14;
  const gap = compact ? 7 : 9;
  const sh = bottomBarH - 10;
  const sy = by + Math.round((bottomBarH - sh) * 0.5) + 1;
  const actW = compact ? 290 : 332;
  const toolsW = vw - padX * 2 - actW - 14;
  const sw = Math.floor((toolsW - gap * 3) / 4);

  for (let i = 0; i < TOOL_CATALOG.length; i++) {
    const t = TOOL_CATALOG[i];
    const sx = padX + i * (sw + gap);
    const sel = state.selectedTool === i;
    drawPanelBox(ctx, sx, sy, sw, sh, 5, state.purse >= t.cost ? PALETTE.hudIvory : '#DDD6C5', sel ? PALETTE.brassBright : '#8A7B5B', sel ? 2.4 : 1.4, `[${t.key}] ${t.label} ${t.priceTag}`, PALETTE.hudInk, compact ? 14 : 16);
    if (sel) { ctx.fillStyle = PALETTE.brassBright; ctx.fillRect(sx + 6, sy, sw - 12, 3); }
    hits.push({ id: `tool-${i}`, type: 'tool', index: i, x: sx, y: sy, w: sw, h: sh });
  }

  const ax = padX + toolsW + 14;
  const aw = Math.floor((actW - gap * 2) / 3);
  const actions = [
    ['hack', 'hack', '[E] HACK', false, PALETTE.brass],
    ['sneak', 'sneak', '[SHIFT] SNEAK', state.thief.sneaking, PALETTE.safeBracket],
    ['routes', 'routes', '[TAB] ROUTES', state.showRoutes, '#2DD4BF'],
  ];
  for (let i = 0; i < actions.length; i++) {
    const [id, type, text, active, accent] = actions[i];
    const x = ax + i * (aw + gap);
    drawPanelBox(ctx, x, sy, aw, sh, 5, active ? accent : '#111C33', active ? '#ECFEFF' : accent, 1.5, text, active ? PALETTE.hudInk : '#F8FAFC', compact ? 12 : 13);
    hits.push({ id, type, x, y: sy, w: aw, h: sh });
  }
}
