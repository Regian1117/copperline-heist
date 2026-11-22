/* Unified obsidian-and-brass architectural telemetry HUD, chamfered equipment dock, and Art-Deco modals. */

import { COPPERLINE_FLOORS } from './floors.js';
import { isAudioMuted } from './heistAudio.js';
import { TOOL_CATALOG } from './toolsAndEconomy.js';

export function renderInstrumentHud(ctx, s, lay, hits) {
  hits.length = 0;
  const { vw, vh, topBarH, bottomBarH } = lay;
  const compact = vw < 1140;

  ctx.save();
  drawTopTelemetryRail(ctx, s, vw, topBarH, compact, hits);
  drawBottomEquipmentDock(ctx, s, vw, vh, bottomBarH, compact, hits);
  ctx.restore();
}

export function renderOutcomeOverlay(ctx, s, lay, hits) {
  if (s.screen === 'title') {
    drawTitleBriefingOverlay(ctx, s, lay, hits);
  } else if (s.screen === 'caught') {
    drawCaughtDossierModal(ctx, s, lay, hits);
  } else if (s.screen === 'getaway') {
    drawGetawayManifestModal(ctx, s, lay, hits);
  } else if (s.paused) {
    drawPauseOverlay(ctx, lay, hits);
  }
}

function drawTopTelemetryRail(ctx, state, vw, topBarH, compact, hitBoxes) {
  ctx.fillStyle = '#0A1220';
  ctx.fillRect(0, 0, vw, topBarH);
  ctx.fillStyle = '#C8A45C';
  ctx.fillRect(0, topBarH - 1.5, vw, 1.5);

  const midY = topBarH * 0.5;
  let x = compact ? 14 : 20;

  ctx.fillStyle = '#F5C451';
  ctx.beginPath();
  ctx.moveTo(x + 9, midY - 10);
  ctx.lineTo(x + 18, midY);
  ctx.lineTo(x + 9, midY + 10);
  ctx.lineTo(x, midY);
  ctx.closePath();
  ctx.fill();
  x += 26;

  ctx.fillStyle = '#F8FAFC';
  ctx.font = `900 ${compact ? 21 : 24}px ${UI_FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('COPPERLINE', x, midY + 1);
  x += Math.ceil(ctx.measureText('COPPERLINE').width) + 12;

  const flW = compact ? 64 : 72;
  const flH = 30;
  ctx.fillStyle = '#241D11';
  chamferRect(ctx, x, midY - flH * 0.5, flW, flH, 6);
  ctx.fill();
  ctx.strokeStyle = '#C8A45C';
  ctx.lineWidth = 1.6;
  chamferRect(ctx, x, midY - flH * 0.5, flW, flH, 6);
  ctx.stroke();
  ctx.fillStyle = '#F5C451';
  ctx.font = `900 ${compact ? 15 : 17}px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(state.code, x + flW * 0.5, midY + 1);
  x += flW + (compact ? 14 : 20);

  drawVerticalDivider(ctx, x, 14, topBarH - 28);
  x += compact ? 14 : 20;

  x = drawMetricCluster(ctx, x, midY, 'TAKE', `$${state.lootValue.toLocaleString()}`, '#C8A45C', '#F5C451', compact, 0);
  x += compact ? 14 : 20;
  drawVerticalDivider(ctx, x, 14, topBarH - 28);
  x += compact ? 14 : 20;

  drawMetricCluster(ctx, x, midY, 'PURSE', `$${state.purse.toLocaleString()}`, '#94A3B8', '#F8FAFC', compact, 2);

  let rightEdge = vw - (compact ? 12 : 18);
  if (!state.isShowcase) {
    const muteSize = 34;
    const mx = rightEdge - muteSize;
    const my = Math.round(midY - muteSize * 0.5);
    const muted = isAudioMuted();
    ctx.fillStyle = muted ? '#26141A' : '#111C2E';
    chamferRect(ctx, mx, my, muteSize, muteSize, 6);
    ctx.fill();
    ctx.strokeStyle = muted ? '#FB7185' : '#334155';
    ctx.lineWidth = 1.4;
    chamferRect(ctx, mx, my, muteSize, muteSize, 6);
    ctx.stroke();
    ctx.fillStyle = muted ? '#FB7185' : '#CBD5E1';
    ctx.font = `800 13px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(muted ? 'M×' : 'M♪', mx + muteSize * 0.5, my + muteSize * 0.5 + 1);
    hitBoxes.push({ id: 'mute', type: 'mute', x: mx, y: my, w: muteSize, h: muteSize });
    rightEdge = mx - 12;
  }

  drawAlarmTelemetry(ctx, state, rightEdge, midY, compact);
}

function drawMetricCluster(ctx, x, midY, label, value, labelColor, valueColor, compact, sizeBoost = 0) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = labelColor;
  ctx.font = `800 ${compact ? 11 : 12}px ${UI_FONT}`;
  ctx.fillText(label, x, midY - 13);

  ctx.fillStyle = valueColor;
  ctx.font = `900 ${(compact ? 22 : 25) + sizeBoost}px ${UI_FONT}`;
  ctx.fillText(value, x, midY + 9);
  return x + Math.max(Math.ceil(ctx.measureText(value).width), 62);
}

function drawAlarmTelemetry(ctx, state, rightEdge, midY, compact) {
  const pct = Math.max(0, Math.min(100, Math.round(state.alarm)));
  const word = state.alarmState;
  const theme =
    word === 'CAUGHT' || word === 'ALERT'
      ? { fg: '#FB7185', bg: '#330D12', border: '#EF4444', fill: '#EF4444' }
      : word === 'SUSPICIOUS'
        ? { fg: '#F5C451', bg: '#2A1D08', border: '#F59E0B', fill: '#F59E0B' }
        : { fg: '#34D399', bg: '#0A261C', border: '#10B981', fill: '#10B981' };

  const badgeFont = compact ? 15 : 17;
  ctx.font = `900 ${badgeFont}px ${UI_FONT}`;
  const badgeW = Math.max(compact ? 104 : 118, Math.ceil(ctx.measureText(word).width) + 24);
  const badgeH = 34;
  const badgeX = rightEdge - badgeW;
  const badgeY = Math.round(midY - badgeH * 0.5);

  ctx.fillStyle = theme.bg;
  chamferRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
  ctx.fill();
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  chamferRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
  ctx.stroke();

  ctx.fillStyle = theme.fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(word, badgeX + badgeW * 0.5, midY + 1);

  const barW = compact ? 136 : 186;
  const barH = 16;
  const barX = badgeX - 14 - barW;
  const barY = Math.round(midY - barH * 0.5);

  ctx.fillStyle = '#152236';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.strokeStyle = '#334E73';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(barX, barY, barW, barH);

  const fillW = Math.round((barW * pct) / 100);
  if (fillW > 0) {
    ctx.fillStyle = theme.fill;
    ctx.fillRect(barX + 1, barY + 1, Math.max(1, fillW - 2), barH - 2);
  }

  ctx.fillStyle = 'rgba(10, 18, 32, 0.72)';
  for (const frac of [0.25, 0.5, 0.75]) {
    const tx = Math.round(barX + barW * frac);
    ctx.fillRect(tx, barY + 1, 2, barH - 2);
  }

  ctx.fillStyle = '#F8FAFC';
  ctx.font = `900 ${compact ? 18 : 20}px ${UI_FONT}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`ALARM ${pct}%`, barX - 12, midY + 1);
}

function drawBottomEquipmentDock(ctx, state, vw, vh, bottomBarH, compact, hitBoxes) {
  const bottomY = vh - bottomBarH;
  ctx.fillStyle = '#0A1220';
  ctx.fillRect(0, bottomY, vw, bottomBarH);
  ctx.fillStyle = '#C8A45C';
  ctx.fillRect(0, bottomY, vw, 1.5);

  const padX = compact ? 12 : 18;
  const slotGap = compact ? 8 : 11;
  const slotH = bottomBarH - 18;
  const slotY = bottomY + Math.round((bottomBarH - slotH) * 0.5) + 1;
  const actionBlockW = compact ? 294 : 352;
  const toolsW = vw - padX * 2 - actionBlockW - 22;
  const slotW = Math.floor((toolsW - slotGap * 3) / 4);

  for (let i = 0; i < TOOL_CATALOG.length; i++) {
    const tool = TOOL_CATALOG[i];
    const sx = padX + i * (slotW + slotGap);
    const selected = state.selectedTool === i;
    const affordable = state.purse >= tool.cost;
    drawChamferToolSlot(ctx, sx, slotY, slotW, slotH, tool, selected, affordable, compact);
    hitBoxes.push({ id: `tool-${i}`, type: 'tool', index: i, x: sx, y: slotY, w: slotW, h: slotH });
  }

  const divX = padX + toolsW + 10;
  drawVerticalDivider(ctx, divX, bottomY + 14, bottomBarH - 28);

  const actX = divX + 12;
  const aGap = compact ? 7 : 9;
  const aW = Math.floor((actionBlockW - aGap * 2) / 3);
  drawActionSlot(ctx, actX, slotY, aW, slotH, '[E]', 'HACK', false, '#F5C451', '#261C0A', compact);
  hitBoxes.push({ id: 'hack', type: 'hack', x: actX, y: slotY, w: aW, h: slotH });

  const sneakX = actX + aW + aGap;
  drawActionSlot(ctx, sneakX, slotY, aW, slotH, '[SHIFT]', 'SNEAK', state.thief.sneaking, '#38BDF8', '#0C2438', compact);
  hitBoxes.push({ id: 'sneak', type: 'sneak', x: sneakX, y: slotY, w: aW, h: slotH });

  const routeX = sneakX + aW + aGap;
  drawActionSlot(ctx, routeX, slotY, aW, slotH, '[TAB]', 'ROUTES', state.showRoutes, '#F5C451', '#261C0A', compact);
  hitBoxes.push({ id: 'routes', type: 'routes', x: routeX, y: slotY, w: aW, h: slotH });
}

function drawChamferToolSlot(ctx, x, y, w, h, tool, selected, affordable, compact) {
  ctx.save();
  ctx.globalAlpha = affordable ? 1 : 0.62;
  ctx.fillStyle = selected ? '#182A45' : '#111C2E';
  chamferRect(ctx, x, y, w, h, 7);
  ctx.fill();

  ctx.strokeStyle = selected ? '#F5C451' : '#2A3E5C';
  ctx.lineWidth = selected ? 2.2 : 1.3;
  chamferRect(ctx, x, y, w, h, 7);
  ctx.stroke();

  if (selected) {
    ctx.fillStyle = '#F5C451';
    ctx.fillRect(x + 9, y, w - 18, 3);
  }

  const iconX = x + (compact ? 18 : 22);
  const iconY = y + h * 0.5;
  drawToolVectorIcon(ctx, tool.icon, iconX, iconY, compact ? 10 : 12);

  const textX = iconX + (compact ? 16 : 20);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = selected ? '#F5C451' : '#94A3B8';
  ctx.font = `900 ${compact ? 13 : 15}px ${UI_FONT}`;
  const keyTag = `[${tool.key}]`;
  ctx.fillText(keyTag, textX, y + h * 0.5 + 1);
  const keyW = Math.ceil(ctx.measureText(keyTag).width) + 6;

  ctx.fillStyle = '#F8FAFC';
  ctx.font = `900 ${compact ? 14 : 16}px ${UI_FONT}`;
  ctx.fillText(tool.label, textX + keyW, y + h * 0.5 + 1);

  ctx.fillStyle = '#F5C451';
  ctx.font = `900 ${compact ? 16 : 19}px ${UI_FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(tool.priceTag, x + w - (compact ? 10 : 13), y + h * 0.5 + 1);
  ctx.restore();
}

function drawActionSlot(ctx, x, y, w, h, keyText, label, active, accent, activeBg, compact) {
  ctx.save();
  ctx.fillStyle = active ? activeBg : '#111C2E';
  chamferRect(ctx, x, y, w, h, 7);
  ctx.fill();
  ctx.strokeStyle = active ? accent : '#2A3E5C';
  ctx.lineWidth = active ? 2.2 : 1.3;
  chamferRect(ctx, x, y, w, h, 7);
  ctx.stroke();

  if (active) {
    ctx.fillStyle = accent;
    ctx.fillRect(x + 8, y, w - 16, 3);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = active ? accent : '#94A3B8';
  ctx.font = `800 ${compact ? 11 : 12}px ${UI_FONT}`;
  ctx.fillText(keyText, x + w * 0.5, y + h * 0.34);

  ctx.fillStyle = active ? '#F8FAFC' : '#E2E8F0';
  ctx.font = `900 ${compact ? 14 : 15}px ${UI_FONT}`;
  ctx.fillText(label, x + w * 0.5, y + h * 0.68);
  ctx.restore();
}

function drawToolVectorIcon(ctx, icon, cx, cy, r) {
  ctx.save();
  if (icon === 'coin') {
    ctx.strokeStyle = '#F5C451';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#F5C451';
    ctx.font = `900 ${r + 2}px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy + 1);
  } else if (icon === 'emp') {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#67E8F9';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === 'smoke') {
    ctx.fillStyle = '#67E8F9';
    ctx.beginPath();
    ctx.arc(cx - 4, cy + 2, r * 0.52, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy + 2, r * 0.5, 0, Math.PI * 2);
    ctx.arc(cx, cy - 3, r * 0.56, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === 'wrench') {
    ctx.strokeStyle = '#F59E0B';
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

function drawTitleBriefingOverlay(ctx, state, layout, hitBoxes) {
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

  ctx.fillStyle = '#0A1220';
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#C8A45C';
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

  ctx.fillStyle = '#C8A45C';
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
    ctx.fillStyle = active ? '#241D11' : '#111C2E';
    chamferRect(ctx, px, pillY, pillW, pillH, 6);
    ctx.fill();
    ctx.strokeStyle = active ? '#F5C451' : '#2A3E5C';
    ctx.lineWidth = active ? 2.2 : 1.4;
    chamferRect(ctx, px, pillY, pillW, pillH, 6);
    ctx.stroke();
    ctx.fillStyle = active ? '#F5C451' : '#CBD5E1';
    ctx.font = `900 15px ${UI_FONT}`;
    ctx.fillText(fl.code, px + pillW * 0.5, pillY + pillH * 0.5 + 1);
    hitBoxes.push({ id: `floor-${i}`, type: 'floor', index: i, x: px, y: pillY, w: pillW, h: pillH });
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
  hitBoxes.push({ id: 'start', type: 'start', x: btnX, y: btnY, w: btnW, h: btnH });

  ctx.fillStyle = '#CBD5E1';
  ctx.font = `700 14px ${UI_FONT}`;
  ctx.fillText('WASD Move · SHIFT Sneak · E Hack · 1-4 Tools · TAB Routes', cx, y + 276);
  ctx.restore();
}

function drawCaughtDossierModal(ctx, state, layout, hitBoxes) {
  const { vw, vh, topBarH, bottomBarH, worldX, worldY, worldScale } = layout;
  const midH = vh - topBarH - bottomBarH;
  const cx = vw * 0.5;
  const cardW = Math.min(520, vw - 64);
  const cardH = 224;
  const x = cx - cardW * 0.5;
  const y = topBarH + midH - cardH - 22;

  ctx.save();
  ctx.fillStyle = 'rgba(5, 9, 17, 0.42)';
  ctx.fillRect(0, topBarH, vw, midH);

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.34)';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, topBarH + 7, vw - 14, midH - 14);

  if (state.caughtSource) {
    const sx = worldX + state.caughtSource.x * worldScale;
    const sy = worldY + state.caughtSource.y * worldScale;
    const tx = worldX + state.thief.x * worldScale;
    const ty = worldY + state.thief.y * worldScale;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.strokeStyle = '#FF4D4D';
    ctx.lineWidth = 3.8;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#FF4D4D';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(tx, ty, 24 * worldScale, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#0A1220';
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 3.2;
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.stroke();
  ctx.fillStyle = '#EF4444';
  ctx.fillRect(x + 22, y, cardW - 44, 4);

  ctx.fillStyle = '#FEF2F2';
  ctx.font = `900 38px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SPOTTED BY ${state.caughtBy || 'GUARD 1'}`, cx, y + 48);

  const lockText = '0.45s GRACE WINDOW EXCEEDED';
  ctx.font = `900 21px ${UI_FONT}`;
  const pillW = Math.ceil(ctx.measureText(lockText).width) + 34;
  const pillH = 38;
  ctx.fillStyle = '#330D12';
  chamferRect(ctx, cx - pillW * 0.5, y + 82, pillW, pillH, 6);
  ctx.fill();
  ctx.strokeStyle = '#FB7185';
  ctx.lineWidth = 2;
  chamferRect(ctx, cx - pillW * 0.5, y + 82, pillW, pillH, 6);
  ctx.stroke();
  ctx.fillStyle = '#FFE4E6';
  ctx.fillText(lockText, cx, y + 82 + pillH * 0.5 + 1);

  const btnW = cardW - 52;
  const btnH = 56;
  const btnX = x + 26;
  const btnY = y + 142;
  ctx.fillStyle = '#10B981';
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.fill();
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.4;
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.stroke();

  ctx.fillStyle = '#042219';
  ctx.font = `900 24px ${UI_FONT}`;
  ctx.fillText('[R] RETRY FLOOR', cx, btnY + btnH * 0.5 + 1);
  hitBoxes.push({ id: 'retry', type: 'retry', x: btnX, y: btnY, w: btnW, h: btnH });
  ctx.restore();
}

function drawGetawayManifestModal(ctx, state, layout, hitBoxes) {
  const { vw, vh, topBarH, bottomBarH } = layout;
  const midH = vh - topBarH - bottomBarH;
  const payout = state.payout || {
    loot: state.lootValue,
    tools: state.toolsSpent,
    ghostBonus: 4500,
    netTake: state.lootValue + 4500 - state.toolsSpent,
  };

  const cardW = Math.min(586, vw - 110);
  const cardH = 434;
  const cx = vw * 0.41;
  const cy = topBarH + midH * 0.52;
  const x = cx - cardW * 0.5;
  const y = cy - cardH * 0.5;

  ctx.save();
  ctx.fillStyle = 'rgba(5, 9, 17, 0.44)';
  ctx.fillRect(0, topBarH, vw, midH);

  ctx.fillStyle = 'rgba(10, 18, 32, 0.97)';
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#C8A45C';
  ctx.lineWidth = 3.2;
  chamferRect(ctx, x, y, cardW, cardH, 14);
  ctx.stroke();
  ctx.fillStyle = '#10B981';
  ctx.fillRect(x + 22, y, cardW - 44, 4);

  const floorNum = state.floorIndex + 1;
  ctx.fillStyle = '#34D399';
  ctx.font = `900 21px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`FLOOR ${floorNum}/${COPPERLINE_FLOORS.length} · VAULT CLEARED`, cx, y + 38);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = `900 38px ${UI_FONT}`;
  ctx.fillText('GETAWAY PAYOUT LEDGER', cx, y + 82);

  const rows = [
    { icon: '◆', iconColor: '#F5C451', label: 'LOOT', value: `+$${payout.loot.toLocaleString()}`, valColor: '#F5C451' },
    { icon: '⚙', iconColor: '#F59E0B', label: 'TOOLS', value: `-$${payout.tools.toLocaleString()}`, valColor: '#FCA5A5' },
    { icon: '★', iconColor: '#38BDF8', label: 'GHOST BONUS', value: `+$${payout.ghostBonus.toLocaleString()}`, valColor: '#7DD3FC' },
  ];

  const rowX = x + 36;
  const rowRight = x + cardW - 36;
  let ry = y + 144;
  for (const row of rows) {
    ctx.fillStyle = row.iconColor;
    ctx.font = `900 24px ${UI_FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(row.icon, rowX, ry);

    ctx.fillStyle = '#F1F5F9';
    ctx.font = `900 25px ${UI_FONT}`;
    ctx.fillText(row.label, rowX + 34, ry);

    ctx.fillStyle = row.valColor;
    ctx.font = `900 29px ${UI_FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(row.value, rowRight, ry);
    ry += 46;
  }

  ctx.strokeStyle = '#C8A45C';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rowX, ry - 16);
  ctx.lineTo(rowRight, ry - 16);
  ctx.moveTo(rowX, ry - 11);
  ctx.lineTo(rowRight, ry - 11);
  ctx.stroke();

  ry += 20;
  ctx.fillStyle = '#F8FAFC';
  ctx.font = `900 30px ${UI_FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('NET TAKE', rowX, ry);

  ctx.fillStyle = '#34D399';
  ctx.font = `900 36px ${UI_FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`+$${payout.netTake.toLocaleString()}`, rowRight, ry);

  const btnW = cardW - 56;
  const btnH = 60;
  const btnX = x + 28;
  const btnY = y + cardH - btnH - 22;
  const isFinal = state.floorIndex === COPPERLINE_FLOORS.length - 1;
  ctx.fillStyle = '#10B981';
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.fill();
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.4;
  chamferRect(ctx, btnX, btnY, btnW, btnH, 9);
  ctx.stroke();

  ctx.fillStyle = '#042219';
  ctx.font = `900 26px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(isFinal ? 'PLAY AGAIN  →' : 'NEXT FLOOR  →', cx, btnY + btnH * 0.5 + 1);
  hitBoxes.push({ id: 'next', type: 'next', x: btnX, y: btnY, w: btnW, h: btnH });
  ctx.restore();
}

function drawPauseOverlay(ctx, layout, hitBoxes) {
  const { vw, vh, topBarH, bottomBarH } = layout;
  const midH = vh - topBarH - bottomBarH;
  const cx = vw * 0.5;
  const cy = topBarH + midH * 0.5;
  ctx.save();
  ctx.fillStyle = 'rgba(5, 9, 17, 0.62)';
  ctx.fillRect(0, topBarH, vw, midH);
  ctx.fillStyle = '#0A1220';
  chamferRect(ctx, cx - 170, cy - 86, 340, 172, 12);
  ctx.fill();
  ctx.strokeStyle = '#C8A45C';
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
  ctx.fillStyle = '#042219';
  ctx.font = `900 18px ${UI_FONT}`;
  ctx.fillText('[P] RESUME', cx, cy + 33);
  hitBoxes.push({ id: 'resume', type: 'resume', x: cx - 120, y: cy + 8, w: 240, h: 48 });
  ctx.restore();
}

function drawVerticalDivider(ctx, x, y, h) {
  ctx.fillStyle = 'rgba(200, 164, 92, 0.32)';
  ctx.fillRect(x, y, 1.5, h);
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

const UI_FONT = '"Bahnschrift", "DIN Alternate", "Segoe UI", system-ui, sans-serif';
