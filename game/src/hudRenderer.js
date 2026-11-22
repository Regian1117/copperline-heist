/* Hybrid obsidian-and-brass instrument bezel with 244px-legible warm-ivory plates and Art-Deco modals. */

import { COPPERLINE_FLOORS } from './floors.js';
import { isAudioMuted } from './heistAudio.js';
import { TOOL_CATALOG } from './toolsAndEconomy.js';

export function renderInstrumentHud(ctx, state, layout, hits) {
  hits.length = 0;
  const { vw, vh, topBarH, bottomBarH } = layout;
  const compact = vw < 1140;

  ctx.save();
  drawTopInstrumentBezel(ctx, state, vw, topBarH, compact, hits);
  drawBottomEquipmentDock(ctx, state, vw, vh, bottomBarH, compact, hits);
  ctx.restore();
}

export function renderOutcomeOverlay(ctx, state, layout, hits) {
  if (state.screen === 'title') {
    drawTitleBriefingOverlay(ctx, state, layout, hits);
  } else if (state.screen === 'caught') {
    drawCaughtDossierModal(ctx, state, layout, hits);
  } else if (state.screen === 'getaway') {
    drawGetawayManifestModal(ctx, state, layout, hits);
  } else if (state.paused) {
    drawPauseOverlay(ctx, layout, hits);
  }
}

function drawTopInstrumentBezel(ctx, state, vw, topBarH, compact, hits) {
  ctx.fillStyle = '#080F1D';
  ctx.fillRect(0, 0, vw, topBarH);
  ctx.fillStyle = '#D4AF5A';
  ctx.fillRect(0, topBarH - 1.5, vw, 1.5);

  const plateH = topBarH - 14;
  const plateY = Math.round((topBarH - plateH) * 0.5) - 1;
  const midY = plateY + plateH * 0.5;
  const gap = compact ? 7 : 10;
  let x = compact ? 10 : 14;

  const brandText = compact ? '◆ COPPERLINE' : '◆ COPPERLINE';
  ctx.font = `900 ${compact ? 15 : 17}px ${UI_FONT}`;
  const brandW = Math.ceil(ctx.measureText(brandText).width) + (compact ? 18 : 24);
  ctx.fillStyle = '#0E1A2E';
  chamferRect(ctx, x, plateY, brandW, plateH, 6);
  ctx.fill();
  ctx.strokeStyle = '#D4AF5A';
  ctx.lineWidth = 1.6;
  chamferRect(ctx, x, plateY, brandW, plateH, 6);
  ctx.stroke();
  ctx.fillStyle = '#F5C451';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(brandText, x + brandW * 0.5, midY + 1);
  x += brandW + gap;

  const flFs = compact ? 19 : 21;
  x = drawIvoryPlate(ctx, x, plateY, plateH, state.code, flFs, compact ? 12 : 16, '#D4AF5A') + gap;

  const valFs = compact ? 18 : 20;
  x = drawIvoryPlate(ctx, x, plateY, plateH, `TAKE $${state.lootValue.toLocaleString()}`, valFs, compact ? 11 : 14, '#D4AF5A') + gap;
  drawIvoryPlate(ctx, x, plateY, plateH, `PURSE $${state.purse.toLocaleString()}`, valFs, compact ? 11 : 14, '#94A3B8');

  let rightEdge = vw - (compact ? 10 : 14);
  if (!state.isShowcase) {
    const muteSize = plateH;
    const mx = rightEdge - muteSize;
    const muted = isAudioMuted();
    ctx.fillStyle = muted ? '#330D12' : '#0E1A2E';
    chamferRect(ctx, mx, plateY, muteSize, muteSize, 6);
    ctx.fill();
    ctx.strokeStyle = muted ? '#EF4444' : '#D4AF5A';
    ctx.lineWidth = 1.6;
    chamferRect(ctx, mx, plateY, muteSize, muteSize, 6);
    ctx.stroke();
    ctx.fillStyle = muted ? '#FECDD3' : '#F5C451';
    ctx.font = `900 13px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(muted ? 'M×' : 'M♪', mx + muteSize * 0.5, midY + 1);
    hits.push({ id: 'mute', type: 'mute', x: mx, y: plateY, w: muteSize, h: muteSize });
    rightEdge = mx - 8;
  }

  drawAlarmInstrumentModule(ctx, state, rightEdge, plateY, plateH, compact);
}

function drawIvoryPlate(ctx, x, y, h, text, fontSize, padX, borderColor) {
  ctx.font = `900 ${fontSize}px ${UI_FONT}`;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
  ctx.fillStyle = '#F6EFE0';
  chamferRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.8;
  chamferRect(ctx, x, y, w, h, 6);
  ctx.stroke();
  ctx.fillStyle = '#080D1A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w * 0.5, y + h * 0.5 + 1);
  return x + w;
}

function drawAlarmInstrumentModule(ctx, state, rightEdge, plateY, plateH, compact) {
  const pct = Math.max(0, Math.min(100, Math.round(state.alarm)));
  const word = state.alarmState;
  const theme =
    word === 'CAUGHT' || word === 'ALERT'
      ? { fg: '#FFFFFF', bg: '#EF4444', border: '#FCA5A5', fill: '#EF4444', glow: true }
      : word === 'SUSPICIOUS'
        ? { fg: '#1A1002', bg: '#FBBF24', border: '#FDE68A', fill: '#F59E0B', glow: false }
        : { fg: '#062418', bg: '#34D399', border: '#A7F3D0', fill: '#10B981', glow: false };

  const midY = plateY + plateH * 0.5;
  const badgeFs = compact ? 16 : 17;
  ctx.font = `900 ${badgeFs}px ${UI_FONT}`;
  const badgeW = Math.max(compact ? 104 : 116, Math.ceil(ctx.measureText(word).width) + 22);
  const badgeX = rightEdge - badgeW;

  ctx.save();
  if (theme.glow) {
    ctx.shadowColor = 'rgba(239, 68, 68, 0.85)';
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = theme.bg;
  chamferRect(ctx, badgeX, plateY, badgeW, plateH, 6);
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  chamferRect(ctx, badgeX, plateY, badgeW, plateH, 6);
  ctx.stroke();
  ctx.fillStyle = theme.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word, badgeX + badgeW * 0.5, midY + 1);
  ctx.restore();

  const barW = compact ? 102 : 148;
  const alarmText = `ALARM ${pct}%`;
  const alarmFs = compact ? 18 : 20;
  ctx.font = `900 ${alarmFs}px ${UI_FONT}`;
  const textW = Math.ceil(ctx.measureText(alarmText).width);
  const modW = textW + barW + 34;
  const modX = badgeX - 8 - modW;

  ctx.fillStyle = '#F6EFE0';
  chamferRect(ctx, modX, plateY, modW, plateH, 6);
  ctx.fill();
  ctx.strokeStyle = theme.fill;
  ctx.lineWidth = 2;
  chamferRect(ctx, modX, plateY, modW, plateH, 6);
  ctx.stroke();

  ctx.fillStyle = '#080D1A';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(alarmText, modX + 12, midY + 1);

  const barX = modX + 12 + textW + 10;
  const barH = 16;
  const barY = Math.round(midY - barH * 0.5);
  ctx.fillStyle = '#132036';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = '#334E73';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(barX, barY, barW, barH);

  const fillW = Math.round((barW * pct) / 100);
  if (fillW > 0) {
    ctx.fillStyle = theme.fill;
    ctx.fillRect(barX + 1, barY + 1, Math.max(1, fillW - 2), barH - 2);
  }
  ctx.fillStyle = 'rgba(8, 15, 29, 0.72)';
  for (const frac of [0.25, 0.5, 0.75]) {
    ctx.fillRect(Math.round(barX + barW * frac), barY + 1, 2, barH - 2);
  }
}

function drawBottomEquipmentDock(ctx, state, vw, vh, bottomBarH, compact, hits) {
  const bottomY = vh - bottomBarH;
  ctx.fillStyle = '#080F1D';
  ctx.fillRect(0, bottomY, vw, bottomBarH);
  ctx.fillStyle = '#D4AF5A';
  ctx.fillRect(0, bottomY, vw, 1.5);

  const padX = compact ? 10 : 14;
  const slotGap = compact ? 7 : 10;
  const slotH = bottomBarH - 14;
  const slotY = bottomY + Math.round((bottomBarH - slotH) * 0.5) + 1;
  const actionW = compact ? 286 : 338;
  const toolsW = vw - padX * 2 - actionW - 18;
  const slotW = Math.floor((toolsW - slotGap * 3) / 4);

  for (let i = 0; i < TOOL_CATALOG.length; i++) {
    const tool = TOOL_CATALOG[i];
    const sx = padX + i * (slotW + slotGap);
    const selected = state.selectedTool === i;
    const affordable = state.purse >= tool.cost;
    drawIvoryToolKeycap(ctx, sx, slotY, slotW, slotH, tool, selected, affordable, compact);
    hits.push({ id: `tool-${i}`, type: 'tool', index: i, x: sx, y: slotY, w: slotW, h: slotH });
  }

  const divX = padX + toolsW + 8;
  ctx.fillStyle = 'rgba(212, 175, 90, 0.36)';
  ctx.fillRect(divX, bottomY + 12, 1.5, bottomBarH - 24);

  const actX = divX + 10;
  const aGap = compact ? 6 : 8;
  const aW = Math.floor((actionW - aGap * 2) / 3);
  drawTacticalControlSlot(ctx, actX, slotY, aW, slotH, '[E]', 'HACK', false, '#D4AF5A', '#F6EFE0', compact);
  hits.push({ id: 'hack', type: 'hack', x: actX, y: slotY, w: aW, h: slotH });

  const sneakX = actX + aW + aGap;
  drawTacticalControlSlot(ctx, sneakX, slotY, aW, slotH, '[SHIFT]', 'SNEAK', state.thief.sneaking, '#38BDF8', '#38BDF8', compact);
  hits.push({ id: 'sneak', type: 'sneak', x: sneakX, y: slotY, w: aW, h: slotH });

  const routeX = sneakX + aW + aGap;
  drawTacticalControlSlot(ctx, routeX, slotY, aW, slotH, '[TAB]', 'ROUTES', state.showRoutes, '#2DD4BF', '#2DD4BF', compact);
  hits.push({ id: 'routes', type: 'routes', x: routeX, y: slotY, w: aW, h: slotH });
}

function drawIvoryToolKeycap(ctx, x, y, w, h, tool, selected, affordable, compact) {
  ctx.save();
  ctx.fillStyle = affordable ? '#F6EFE0' : '#E7E0D0';
  chamferRect(ctx, x, y, w, h, 6);
  ctx.fill();

  ctx.strokeStyle = selected ? '#F5C451' : '#8A7B5B';
  ctx.lineWidth = selected ? 2.6 : 1.5;
  chamferRect(ctx, x, y, w, h, 6);
  ctx.stroke();

  if (selected) {
    ctx.fillStyle = '#F5C451';
    ctx.fillRect(x + 8, y, w - 16, 3.5);
  }

  const iconX = x + (compact ? 16 : 20);
  const iconY = y + h * 0.5;
  drawToolVectorIcon(ctx, tool.icon, iconX, iconY, compact ? 9.5 : 11);

  const textStart = iconX + (compact ? 14 : 18);
  const label = `[${tool.key}] ${tool.label} ${tool.priceTag}`;
  let fs = compact ? 15 : 17;
  ctx.font = `900 ${fs}px ${UI_FONT}`;
  const maxTextW = w - (textStart - x) - 8;
  while (ctx.measureText(label).width > maxTextW && fs > 11) {
    fs -= 1;
    ctx.font = `900 ${fs}px ${UI_FONT}`;
  }

  ctx.fillStyle = '#080D1A';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, textStart, y + h * 0.5 + 1);
  ctx.restore();
}

function drawTacticalControlSlot(ctx, x, y, w, h, keyText, label, active, borderAccent, activeFill, compact) {
  ctx.save();
  ctx.fillStyle = active ? activeFill : '#111C2E';
  chamferRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = active ? '#FFFBEB' : borderAccent;
  ctx.lineWidth = active ? 2.2 : 1.5;
  chamferRect(ctx, x, y, w, h, 6);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = active ? '#06131F' : '#CBD5E1';
  ctx.font = `800 ${compact ? 11 : 12}px ${UI_FONT}`;
  ctx.fillText(keyText, x + w * 0.5, y + h * 0.34);

  ctx.fillStyle = active ? '#06131F' : '#F8FAFC';
  ctx.font = `900 ${compact ? 14 : 15}px ${UI_FONT}`;
  ctx.fillText(label, x + w * 0.5, y + h * 0.68);
  ctx.restore();
}

function drawToolVectorIcon(ctx, icon, cx, cy, r) {
  ctx.save();
  if (icon === 'coin') {
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#080D1A';
    ctx.font = `900 ${r + 2}px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy + 1);
  } else if (icon === 'emp') {
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === 'smoke') {
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(cx - 4, cy + 2, r * 0.54, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy + 2, r * 0.52, 0, Math.PI * 2);
    ctx.arc(cx, cy - 3, r * 0.58, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === 'wrench') {
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, cy + r * 0.7);
    ctx.lineTo(cx + r * 0.42, cy - r * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 0.52, cy - r * 0.52, r * 0.44, 0.6, 5.1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTitleBriefingOverlay(ctx, state, layout, hits) {
  const { vw, vh, topBarH, bottomBarH } = layout;
  const cx = vw * 0.5;
  const cy = topBarH + (vh - topBarH - bottomBarH) * 0.5;

  ctx.save();
  ctx.fillStyle = 'rgba(5, 9, 17, 0.66)';
  ctx.fillRect(0, topBarH, vw, vh - topBarH - bottomBarH);

  const cardW = Math.min(580, vw - 60);
  const cardH = 316;
  const x = cx - cardW * 0.5;
  const y = cy - cardH * 0.5;

  ctx.fillStyle = '#080F1D';
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#D4AF5A';
  ctx.lineWidth = 2.6;
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.stroke();
  ctx.fillStyle = '#F5C451';
  ctx.fillRect(x + 24, y, cardW - 48, 3);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = `900 44px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('COPPERLINE', cx, y + 54);

  ctx.fillStyle = '#D4AF5A';
  ctx.font = `800 14px ${UI_FONT}`;
  ctx.fillText('ARCHITECTURAL BLUEPRINT STEALTH HEIST', cx, y + 90);

  const pillGap = 10;
  const pillW = Math.floor((cardW - 56 - pillGap * 3) / 4);
  const pillY = y + 118;
  const pillH = 44;
  for (let i = 0; i < COPPERLINE_FLOORS.length; i++) {
    const fl = COPPERLINE_FLOORS[i];
    const px = x + 28 + i * (pillW + pillGap);
    const active = state.floorIndex === i;
    ctx.fillStyle = active ? '#F6EFE0' : '#111C2E';
    chamferRect(ctx, px, pillY, pillW, pillH, 6);
    ctx.fill();
    ctx.strokeStyle = active ? '#F5C451' : '#2A3E5C';
    ctx.lineWidth = active ? 2.2 : 1.4;
    chamferRect(ctx, px, pillY, pillW, pillH, 6);
    ctx.stroke();
    ctx.fillStyle = active ? '#080D1A' : '#CBD5E1';
    ctx.font = `900 15px ${UI_FONT}`;
    ctx.fillText(fl.code, px + pillW * 0.5, pillY + pillH * 0.5 + 1);
    hits.push({ id: `floor-${i}`, type: 'floor', index: i, x: px, y: pillY, w: pillW, h: pillH });
  }

  const btnW = cardW - 56;
  const btnH = 56;
  const btnX = x + 28;
  const btnY = y + 184;
  ctx.fillStyle = '#10B981';
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.fill();
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.4;
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.stroke();
  ctx.fillStyle = '#042219';
  ctx.font = `900 22px ${UI_FONT}`;
  ctx.fillText('START HEIST  [ENTER]', cx, btnY + btnH * 0.5 + 1);
  hits.push({ id: 'start', type: 'start', x: btnX, y: btnY, w: btnW, h: btnH });

  ctx.fillStyle = '#CBD5E1';
  ctx.font = `700 14px ${UI_FONT}`;
  ctx.fillText('WASD Move · SHIFT Sneak · E Hack · 1-4 Tools · TAB Routes · M Audio', cx, y + 276);
  ctx.restore();
}

function drawCaughtDossierModal(ctx, state, layout, hits) {
  const { vw, vh, topBarH, bottomBarH, worldX, worldY, worldScale } = layout;
  const midH = vh - topBarH - bottomBarH;
  const cx = vw * 0.5;
  const cardW = Math.min(540, vw - 64);
  const cardH = 204;
  const x = cx - cardW * 0.5;
  const y = topBarH + midH - cardH - 16;

  ctx.save();
  ctx.fillStyle = 'rgba(5, 9, 17, 0.34)';
  ctx.fillRect(0, topBarH, vw, midH);

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.42)';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, topBarH + 7, vw - 14, midH - 14);

  if (state.caughtSource) {
    const sx = worldX + state.caughtSource.x * worldScale;
    const sy = worldY + state.caughtSource.y * worldScale;
    const tx = worldX + state.thief.x * worldScale;
    const ty = worldY + state.thief.y * worldScale;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.48)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.strokeStyle = '#FF4D4D';
    ctx.lineWidth = 4;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);

    const r = 24 * worldScale;
    ctx.strokeStyle = '#FF4D4D';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(tx, ty, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx - r - 8, ty);
    ctx.lineTo(tx - r + 4, ty);
    ctx.moveTo(tx + r - 4, ty);
    ctx.lineTo(tx + r + 8, ty);
    ctx.moveTo(tx, ty - r - 8);
    ctx.lineTo(tx, ty - r + 4);
    ctx.moveTo(tx, ty + r - 4);
    ctx.lineTo(tx, ty + r + 8);
    ctx.stroke();
  }

  ctx.fillStyle = '#080F1D';
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 3.2;
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.stroke();
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(x + 22, y, cardW - 44, 4);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 36px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SPOTTED BY ${state.caughtBy || 'GUARD 1'}`, cx, y + 42);

  const lockText = '0.45s GRACE WINDOW EXCEEDED';
  ctx.font = `900 20px ${UI_FONT}`;
  const pillW = Math.ceil(ctx.measureText(lockText).width) + 34;
  const pillH = 36;
  ctx.fillStyle = '#FBBF24';
  chamferRect(ctx, cx - pillW * 0.5, y + 72, pillW, pillH, 6);
  ctx.fill();
  ctx.strokeStyle = '#FFFBEB';
  ctx.lineWidth = 1.8;
  chamferRect(ctx, cx - pillW * 0.5, y + 72, pillW, pillH, 6);
  ctx.stroke();
  ctx.fillStyle = '#080D1A';
  ctx.fillText(lockText, cx, y + 72 + pillH * 0.5 + 1);

  const btnW = cardW - 52;
  const btnH = 54;
  const btnX = x + 26;
  const btnY = y + 128;
  ctx.fillStyle = '#10B981';
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.fill();
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.4;
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.stroke();

  ctx.fillStyle = '#06130E';
  ctx.font = `900 23px ${UI_FONT}`;
  ctx.fillText('[R] RETRY FLOOR', cx, btnY + btnH * 0.5 + 1);
  hits.push({ id: 'retry', type: 'retry', x: btnX, y: btnY, w: btnW, h: btnH });
  ctx.restore();
}

function drawGetawayManifestModal(ctx, state, layout, hits) {
  const { vw, vh, topBarH, bottomBarH } = layout;
  const midH = vh - topBarH - bottomBarH;
  const payout = state.payout || {
    loot: state.lootValue,
    tools: state.toolsSpent,
    ghostBonus: 4500,
    netTake: state.lootValue + 4500 - state.toolsSpent,
  };

  const cardW = Math.min(464, vw - 110);
  const cardH = 446;
  const x = 22;
  const cx = x + cardW * 0.5;
  const cy = topBarH + midH * 0.51;
  const y = cy - cardH * 0.5;

  ctx.save();
  ctx.fillStyle = 'rgba(5, 9, 17, 0.28)';
  ctx.fillRect(0, topBarH, vw, midH);

  ctx.fillStyle = 'rgba(8, 15, 29, 0.97)';
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#D4AF5A';
  ctx.lineWidth = 3;
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.stroke();

  const floorNum = state.floorIndex + 1;
  const hdrText = `FLOOR ${floorNum}/${COPPERLINE_FLOORS.length} · VAULT CLEARED`;
  ctx.font = `900 17px ${UI_FONT}`;
  const hdrW = Math.ceil(ctx.measureText(hdrText).width) + 32;
  const hdrH = 32;
  ctx.fillStyle = '#34D399';
  chamferRect(ctx, cx - hdrW * 0.5, y + 18, hdrW, hdrH, 6);
  ctx.fill();
  ctx.fillStyle = '#062418';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(hdrText, cx, y + 18 + hdrH * 0.5 + 1);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 28px ${UI_FONT}`;
  ctx.fillText('GETAWAY PAYOUT LEDGER', cx, y + 76);

  const parts =
    Array.isArray(state.spentParts) && state.spentParts.length > 0 && state.spentParts.length <= 3
      ? ` (${state.spentParts.map((v) => `$${v}`).join(' + ')})`
      : '';
  const rows = [
    { label: 'LOOT HAUL', sub: '', value: `+$${payout.loot.toLocaleString()}`, valColor: '#FFF7E6' },
    { label: 'TOOLS USED', sub: parts, value: `-$${payout.tools.toLocaleString()}`, valColor: '#FDE047' },
    { label: 'GHOST BONUS', sub: '', value: `+$${payout.ghostBonus.toLocaleString()}`, valColor: '#38BDF8' },
  ];

  const rowX = x + 26;
  const rowRight = x + cardW - 26;
  let ry = y + 132;
  for (const row of rows) {
    ctx.fillStyle = '#E2E8F0';
    ctx.font = `800 20px ${UI_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(row.label, rowX, ry);
    if (row.sub) {
      const baseW = ctx.measureText(row.label).width;
      ctx.fillStyle = '#FDE68A';
      ctx.font = `800 16px ${UI_FONT}`;
      ctx.fillText(row.sub, rowX + baseW + 2, ry + 1);
    }

    ctx.fillStyle = row.valColor;
    ctx.font = `900 29px ${UI_FONT}`;
    drawTrackedRightText(ctx, row.value, rowRight, ry, 1.4);
    ry += 47;
  }

  ctx.strokeStyle = '#D4AF5A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rowX, ry - 14);
  ctx.lineTo(rowRight, ry - 14);
  ctx.stroke();

  const totalY = ry - 2;
  const totalH = 56;
  ctx.fillStyle = '#0A221A';
  chamferRect(ctx, rowX - 8, totalY, cardW - 36, totalH, 7);
  ctx.fill();
  ctx.strokeStyle = '#D4AF5A';
  ctx.lineWidth = 1.8;
  chamferRect(ctx, rowX - 8, totalY, cardW - 36, totalH, 7);
  ctx.stroke();

  const totalMid = totalY + totalH * 0.5 + 1;
  ctx.fillStyle = '#D1FAE5';
  ctx.font = `900 22px ${UI_FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('NET PAYOUT', rowX + 4, totalMid);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 33px ${UI_FONT}`;
  drawTrackedRightText(ctx, `+$${payout.netTake.toLocaleString()}`, rowRight - 4, totalMid, 1.4);

  const btnW = cardW - 48;
  const btnH = 56;
  const btnX = x + 24;
  const btnY = y + cardH - btnH - 22;
  const isFinal = state.floorIndex === COPPERLINE_FLOORS.length - 1;
  ctx.fillStyle = '#10B981';
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.fill();
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.4;
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.stroke();

  ctx.fillStyle = '#06130E';
  ctx.font = `900 24px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(isFinal ? 'PLAY AGAIN  →' : 'NEXT FLOOR  →', cx, btnY + btnH * 0.5 + 1);
  hits.push({ id: 'next', type: 'next', x: btnX, y: btnY, w: btnW, h: btnH });
  ctx.restore();
}

function drawPauseOverlay(ctx, layout, hits) {
  const { vw, vh, topBarH, bottomBarH } = layout;
  const midH = vh - topBarH - bottomBarH;
  const cx = vw * 0.5;
  const cy = topBarH + midH * 0.5;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 9, 17, 0.62)';
  ctx.fillRect(0, topBarH, vw, midH);
  ctx.fillStyle = '#080F1D';
  chamferRect(ctx, cx - 170, cy - 86, 340, 172, 12);
  ctx.fill();
  ctx.strokeStyle = '#D4AF5A';
  ctx.lineWidth = 2.6;
  chamferRect(ctx, cx - 170, cy - 86, 340, 172, 12);
  ctx.stroke();
  ctx.fillStyle = '#F8FAFC';
  ctx.font = `900 28px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', cx, cy - 34);

  ctx.fillStyle = '#10B981';
  chamferRect(ctx, cx - 120, cy + 8, 240, 48, 8);
  ctx.fill();
  ctx.fillStyle = '#06130E';
  ctx.font = `900 18px ${UI_FONT}`;
  ctx.fillText('[P] RESUME', cx, cy + 33);
  hits.push({ id: 'resume', type: 'resume', x: cx - 120, y: cy + 8, w: 240, h: 48 });
  ctx.restore();
}

function chamferRect(ctx, x, y, w, h, cut) {
  const c = Math.min(cut, w * 0.4, h * 0.4);
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.lineTo(x, y + c);
  ctx.closePath();
}

function drawTrackedRightText(ctx, text, rightX, y, tracking) {
  const chars = [...text];
  let totalW = 0;
  for (let i = 0; i < chars.length; i++) {
    totalW += ctx.measureText(chars[i]).width + (i < chars.length - 1 ? tracking : 0);
  }
  let x = rightX - totalW;
  ctx.save();
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#050A14';
  ctx.lineWidth = 2.6;
  for (let i = 0; i < chars.length; i++) {
    ctx.strokeText(chars[i], x, y);
    ctx.fillText(chars[i], x, y);
    x += ctx.measureText(chars[i]).width + tracking;
  }
  ctx.restore();
}

const UI_FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';
