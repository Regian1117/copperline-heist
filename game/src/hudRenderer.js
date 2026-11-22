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

  const ph = topBarH - 10, py = Math.round((topBarH - ph) * 0.5) - 1, midY = py + ph * 0.5, gap = compact ? 7 : 10;
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
  drawPanelBox(ctx, muteX, py, ph, ph, 5, muted ? '#3A1019' : '#111C33', muted ? PALETTE.guardCone : PALETTE.brass, 1.5);
  drawSpeakerIcon(ctx, muteX + ph * 0.5, midY, ph, muted);
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
  ctx.fillStyle = PALETTE.hudInk; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(alarmText, mx + 10, midY + 0.5);

  const bx = mx + 20 + tw, by = Math.round(midY - 6.5);
  ctx.fillStyle = '#0B1221'; ctx.fillRect(bx, by, barW, 13);
  const fw = Math.round((barW * shownPct) / 100);
  if (fw > 0) { ctx.fillStyle = barCol; ctx.fillRect(bx + 1, by + 1, Math.max(1, fw - 2), 11); }
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
    drawPanelBox(ctx, sx, sy, sw, sh, 5, state.purse >= t.cost ? PALETTE.hudIvory : '#DDD6C5', sel ? PALETTE.brassBright : '#8A7B5B', sel ? 2.4 : 1.4);
    if (sel) { ctx.fillStyle = PALETTE.brassBright; ctx.fillRect(sx + 6, sy, sw - 12, 3); }
    drawToolIcon(ctx, t.id, sx + (compact ? 15 : 18), sy + sh * 0.5, compact ? 7.5 : 8.5);
    const padL = compact ? 25 : 30;
    ctx.fillStyle = PALETTE.hudInk; ctx.font = `900 ${compact ? 13 : 15}px ${UI_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`[${t.key}] ${t.label} ${t.priceTag}`, sx + padL + (sw - padL - 4) * 0.5, sy + sh * 0.5 + 0.5, sw - padL - 6);
    hits.push({ id: `tool-${i}`, type: 'tool', index: i, x: sx, y: sy, w: sw, h: sh });
  }

  const ax = padX + toolsW + 14;
  const aw = Math.floor((actW - gap * 2) / 3);
  const actions = [
    ['hack', 'hack', '[E] HACK', false, PALETTE.brass],
    ['sneak', 'sneak', '[SHIFT] SNEAK', Boolean(state.thief?.sneaking), '#38BDF8'],
    ['routes', 'routes', '[TAB] ROUTES', state.showRoutes, '#2DD4BF'],
  ];
  for (let i = 0; i < actions.length; i++) {
    const [id, type, text, active, accent] = actions[i];
    const x = ax + i * (aw + gap);
    drawPanelBox(ctx, x, sy, aw, sh, 5, active ? accent : '#111C33', active ? '#E0F2FE' : accent, active ? 2.2 : 1.5, text, active ? '#07101F' : '#F8FAFC', compact ? 12 : 13);
    hits.push({ id, type, x, y: sy, w: aw, h: sh });
  }
}

function tracePoly(ctx, pts, ox, oy, r) {
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(ox + r * px, oy + r * py) : ctx.moveTo(ox + r * px, oy + r * py)));
  ctx.closePath();
}

function drawSpeakerIcon(ctx, cx, cy, size, muted) {
  const s = size * 0.28, ox = cx - s * 0.22;
  ctx.save();
  ctx.fillStyle = muted ? '#FECDD3' : PALETTE.brassBright;
  tracePoly(ctx, [[-0.74, -0.34], [-0.24, -0.34], [0.28, -0.78], [0.28, 0.78], [-0.24, 0.34], [-0.74, 0.34]], ox, cy, s);
  ctx.fill();
  ctx.lineCap = 'round';
  if (!muted) {
    ctx.strokeStyle = PALETTE.brassBright; ctx.lineWidth = 2.0;
    for (const [r, a] of [[0.48, 0.68], [0.88, 0.74]]) { ctx.beginPath(); ctx.arc(ox + s * 0.32, cy, s * r, -a, a); ctx.stroke(); }
  } else {
    ctx.strokeStyle = '#FB7185'; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(cx - s * 0.9, cy - s * 0.82); ctx.lineTo(cx + s * 0.9, cy + s * 0.82); ctx.stroke();
  }
  ctx.restore();
}

function drawToolIcon(ctx, id, cx, cy, r) {
  ctx.save();
  if (id === 'coin') {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15'; ctx.fill();
    ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#451A03'; ctx.font = `900 ${Math.round(r * 1.45)}px ${UI_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', cx, cy + 0.5);
  } else if (id === 'jammer') {
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#7E22CE'; ctx.fill();
    ctx.strokeStyle = '#9333EA'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
    for (const rad of [r * 0.6, r * 0.98]) {
      for (const base of [0, Math.PI]) { ctx.beginPath(); ctx.arc(cx, cy, rad, base - 0.72, base + 0.72); ctx.stroke(); }
    }
  } else if (id === 'smoke') {
    const puffs = [[-0.42, 0.18, 0.44], [0, -0.2, 0.52], [0.44, 0.18, 0.42]];
    const traceCloud = (fill) => puffs.forEach(([dx, dy, pr]) => {
      ctx.beginPath(); ctx.arc(cx + r * dx, cy + r * dy, r * pr, 0, Math.PI * 2);
      fill ? ctx.fill() : ctx.stroke();
    });
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.7; traceCloud(false);
    ctx.fillStyle = '#FFFFFF'; traceCloud(true);
  } else {
    tracePoly(ctx, [[0.14, -0.95], [-0.56, 0.08], [-0.02, 0.08], [-0.2, 0.95], [0.58, -0.12], [0.04, -0.12]], cx, cy, r);
    ctx.fillStyle = '#06B6D4'; ctx.fill();
    ctx.strokeStyle = '#083344'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();
}
