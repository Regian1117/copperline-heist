/* 244px High-OCR top/bottom HUD bars, clickable tool cards, caught modal, and getaway payout ledger. */

import { COPPERLINE_FLOORS } from './floors.js';
import { TOOL_CATALOG } from './toolsAndEconomy.js';

export function renderHighOcrHud(ctx, state, layout, hitBoxes) {
  hitBoxes.length = 0;
  const { vw, vh, topBarH, bottomBarH } = layout;
  const compact = vw < 1140;
  const fontSize = compact ? 15 : 17;

  ctx.save();
  ctx.fillStyle = '#0B1220';
  ctx.fillRect(0, 0, vw, topBarH);
  ctx.fillStyle = '#E0B86A';
  ctx.fillRect(0, topBarH - 2, vw, 2);

  const pillH = topBarH - 18;
  const pillY = Math.round((topBarH - pillH) * 0.5) - 1;
  const gap = compact ? 8 : 12;
  let curX = compact ? 12 : 18;

  curX = drawTopCreamPill(ctx, curX, pillY, pillH, `COPPERLINE · ${state.code}`, '#E0B86A', fontSize) + gap;
  curX = drawTopCreamPill(ctx, curX, pillY, pillH, `TAKE $${state.lootValue.toLocaleString()}`, '#FFD166', fontSize) + gap;
  drawTopCreamPill(ctx, curX, pillY, pillH, `PURSE $${state.purse.toLocaleString()}`, '#94A3B8', fontSize);

  drawAlarmPill(ctx, state, vw - (compact ? 12 : 18), pillY, pillH, compact ? 356 : 420, fontSize);

  const bottomY = vh - bottomBarH;
  ctx.fillStyle = '#0B1220';
  ctx.fillRect(0, bottomY, vw, bottomBarH);
  ctx.fillStyle = '#E0B86A';
  ctx.fillRect(0, bottomY, vw, 2);

  const cardH = bottomBarH - 18;
  const cardY = bottomY + Math.round((bottomBarH - cardH) * 0.5) + 1;
  const cardGap = compact ? 8 : 12;
  const utilityW = compact ? 228 : 268;
  const beltPad = compact ? 12 : 18;
  const availW = vw - beltPad * 2 - utilityW - cardGap;
  const cardW = Math.floor((availW - cardGap * 3) / 4);

  for (let i = 0; i < TOOL_CATALOG.length; i++) {
    const tool = TOOL_CATALOG[i];
    const cx = beltPad + i * (cardW + cardGap);
    const selected = state.selectedTool === i;
    const affordable = state.purse >= tool.cost;
    drawToolCard(ctx, cx, cardY, cardW, cardH, tool, selected, affordable, compact);
    hitBoxes.push({ id: `tool-${i}`, type: 'tool', index: i, x: cx, y: cardY, w: cardW, h: cardH });
  }

  const utilX = beltPad + 4 * (cardW + cardGap);
  const halfU = Math.floor((utilityW - cardGap) * 0.5);
  drawUtilityPill(ctx, utilX, cardY, halfU, cardH, '[TAB] ROUTES', state.showRoutes, '#E0B86A', compact);
  hitBoxes.push({ id: 'routes', type: 'routes', x: utilX, y: cardY, w: halfU, h: cardH });

  const sneakX = utilX + halfU + cardGap;
  drawUtilityPill(ctx, sneakX, cardY, halfU, cardH, '[SHIFT] SNEAK', state.thief.sneaking, '#38BDF8', compact);
  hitBoxes.push({ id: 'sneak', type: 'sneak', x: sneakX, y: cardY, w: halfU, h: cardH });

  ctx.restore();
}

export function renderOutcomeOverlay(ctx, state, layout, hitBoxes) {
  if (state.screen === 'title') {
    drawTitleOverlay(ctx, state, layout, hitBoxes);
  } else if (state.screen === 'caught') {
    drawCaughtModal(ctx, state, layout, hitBoxes);
  } else if (state.screen === 'getaway') {
    drawGetawayLedgerModal(ctx, state, layout, hitBoxes);
  } else if (state.paused) {
    drawPauseOverlay(ctx, layout, hitBoxes);
  }
}

function drawTopCreamPill(ctx, x, y, h, text, borderColor, fontSize) {
  ctx.save();
  ctx.font = `900 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  const tw = Math.ceil(ctx.measureText(text).width);
  const padX = 14;
  const w = tw + padX * 2;
  ctx.fillStyle = '#F6F2E8';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2.4;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();

  ctx.fillStyle = '#080C18';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w * 0.5, y + h * 0.5 + 1);
  ctx.restore();
  return x + w;
}

function drawAlarmPill(ctx, state, rightEdge, y, h, width, fontSize) {
  const pct = Math.round(state.alarm);
  const word = state.alarmState;
  const accent =
    word === 'CAUGHT' || word === 'ALERT' ? '#EF4444' : word === 'SUSPICIOUS' ? '#F59E0B' : '#10B981';

  const x = rightEdge - width;
  ctx.save();
  ctx.fillStyle = '#F6F2E8';
  roundRect(ctx, x, y, width, h, 8);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.8;
  roundRect(ctx, x, y, width, h, 8);
  ctx.stroke();

  const innerPad = 12;
  ctx.font = `900 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  const leftLabel = `ALARM ${pct}%`;
  const leftW = Math.ceil(ctx.measureText(leftLabel).width);
  const rightW = Math.ceil(ctx.measureText(word).width);

  ctx.fillStyle = '#080C18';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(leftLabel, x + innerPad, y + h * 0.5 + 1);

  ctx.fillStyle = accent === '#10B981' ? '#047857' : accent === '#F59E0B' ? '#B45309' : '#B91C1C';
  ctx.textAlign = 'right';
  ctx.fillText(word, x + width - innerPad, y + h * 0.5 + 1);

  const barX = x + innerPad + leftW + 10;
  const barRight = x + width - innerPad - rightW - 10;
  const barW = Math.max(48, barRight - barX);
  const barH = 14;
  const barY = y + Math.round((h - barH) * 0.5);

  ctx.fillStyle = '#D6D0C4';
  roundRect(ctx, barX, barY, barW, barH, 5);
  ctx.fill();
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 1.2;
  roundRect(ctx, barX, barY, barW, barH, 5);
  ctx.stroke();

  const fillW = Math.max(pct > 0 ? 8 : 0, Math.round((barW * pct) / 100));
  if (fillW > 0) {
    ctx.fillStyle = accent;
    roundRect(ctx, barX, barY, fillW, barH, 5);
    ctx.fill();
  }
  ctx.restore();
}

function drawToolCard(ctx, x, y, w, h, tool, selected, affordable, compact) {
  ctx.save();
  ctx.globalAlpha = affordable ? 1 : 0.84;
  ctx.fillStyle = selected ? '#FFFDF7' : affordable ? '#F6F2E8' : '#E7E2D6';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = selected ? '#E0B86A' : affordable ? '#64748B' : '#94A3B8';
  ctx.lineWidth = selected ? 3.2 : 1.8;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();

  const iconX = x + (compact ? 18 : 22);
  const iconY = y + h * 0.5;
  drawToolIcon(ctx, tool.icon, iconX, iconY, compact ? 10 : 12);

  const label = `[${tool.key}] ${tool.label} ${tool.priceTag}`;
  let fs = compact ? 13 : 16;
  ctx.font = `900 ${fs}px "Segoe UI", system-ui, sans-serif`;
  const maxTextW = w - (compact ? 36 : 46);
  while (ctx.measureText(label).width > maxTextW && fs > 11) {
    fs -= 1;
    ctx.font = `900 ${fs}px "Segoe UI", system-ui, sans-serif`;
  }

  ctx.fillStyle = '#080C18';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, iconX + (compact ? 15 : 19), y + h * 0.5 + 1);
  ctx.restore();
}

function drawToolIcon(ctx, icon, cx, cy, r) {
  ctx.save();
  if (icon === 'coin') {
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = '#080C18';
    ctx.font = `900 ${r + 1}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', cx, cy + 1);
  } else if (icon === 'emp') {
    ctx.strokeStyle = '#0891B2';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#0891B2';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === 'smoke') {
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.arc(cx - 4, cy + 2, r * 0.58, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy + 2, r * 0.54, 0, Math.PI * 2);
    ctx.arc(cx, cy - 3, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
  } else if (icon === 'wrench') {
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.7, cy + r * 0.7);
    ctx.lineTo(cx + r * 0.45, cy - r * 0.45);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + r * 0.55, cy - r * 0.55, r * 0.45, 0.6, 5.1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawUtilityPill(ctx, x, y, w, h, label, active, activeColor, compact) {
  ctx.save();
  ctx.fillStyle = active ? activeColor : '#162238';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = active ? '#FFFBEB' : '#475569';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();

  let fs = compact ? 12 : 14;
  ctx.font = `900 ${fs}px "Segoe UI", system-ui, sans-serif`;
  while (ctx.measureText(label).width > w - 12 && fs > 10) {
    fs -= 1;
    ctx.font = `900 ${fs}px "Segoe UI", system-ui, sans-serif`;
  }
  ctx.fillStyle = active ? '#080C18' : '#E2E8F0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w * 0.5, y + h * 0.5 + 1);
  ctx.restore();
}

function drawTitleOverlay(ctx, state, layout, hitBoxes) {
  const { vw, vh, topBarH, bottomBarH } = layout;
  const cx = vw * 0.5;
  const cy = topBarH + (vh - topBarH - bottomBarH) * 0.5;

  ctx.save();
  ctx.fillStyle = 'rgba(6, 10, 18, 0.62)';
  ctx.fillRect(0, topBarH, vw, vh - topBarH - bottomBarH);

  const cardW = Math.min(560, vw - 60);
  const cardH = 310;
  const x = cx - cardW * 0.5;
  const y = cy - cardH * 0.5;

  ctx.fillStyle = '#0D1526';
  roundRect(ctx, x, y, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#E0B86A';
  ctx.lineWidth = 3;
  roundRect(ctx, x, y, cardW, cardH, 14);
  ctx.stroke();

  ctx.fillStyle = '#F6F2E8';
  ctx.font = '900 40px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('COPPERLINE', cx, y + 54);

  ctx.fillStyle = '#E0B86A';
  ctx.font = '800 14px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('ARCHITECTURAL BLUEPRINT STEALTH HEIST', cx, y + 90);

  const pillGap = 10;
  const pillW = Math.floor((cardW - 56 - pillGap * 3) / 4);
  const pillY = y + 118;
  const pillH = 44;
  for (let i = 0; i < COPPERLINE_FLOORS.length; i++) {
    const fl = COPPERLINE_FLOORS[i];
    const px = x + 28 + i * (pillW + pillGap);
    const active = state.floorIndex === i;
    ctx.fillStyle = active ? '#F6F2E8' : '#16233C';
    roundRect(ctx, px, pillY, pillW, pillH, 8);
    ctx.fill();
    ctx.strokeStyle = active ? '#E0B86A' : '#334155';
    ctx.lineWidth = 2;
    roundRect(ctx, px, pillY, pillW, pillH, 8);
    ctx.stroke();
    ctx.fillStyle = active ? '#080C18' : '#CBD5E1';
    ctx.font = '900 13px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(fl.code, px + pillW * 0.5, pillY + pillH * 0.5 + 1);
    hitBoxes.push({ id: `floor-${i}`, type: 'floor', index: i, x: px, y: pillY, w: pillW, h: pillH });
  }

  const btnW = cardW - 56;
  const btnH = 54;
  const btnX = x + 28;
  const btnY = y + 182;
  ctx.fillStyle = '#10B981';
  roundRect(ctx, btnX, btnY, btnW, btnH, 10);
  ctx.fill();
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.5;
  roundRect(ctx, btnX, btnY, btnW, btnH, 10);
  ctx.stroke();
  ctx.fillStyle = '#06281E';
  ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('START HEIST  ▸', cx, btnY + btnH * 0.5 + 1);
  hitBoxes.push({ id: 'start', type: 'start', x: btnX, y: btnY, w: btnW, h: btnH });

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '700 13px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('WASD Move · SHIFT Sneak · E Hold Vault/Relay · 1-4 Tools · TAB Routes · M Audio', cx, y + 272);
  ctx.restore();
}

function drawCaughtModal(ctx, state, layout, hitBoxes) {
  const { vw, vh, topBarH, bottomBarH, worldX, worldY, worldScale } = layout;
  const midH = vh - topBarH - bottomBarH;
  const cx = vw * 0.5;
  const cardW = Math.min(500, vw - 70);
  const cardH = 216;
  const x = cx - cardW * 0.5;
  const y = topBarH + midH - cardH - 36;

  ctx.save();
  ctx.fillStyle = 'rgba(6, 10, 18, 0.44)';
  ctx.fillRect(0, topBarH, vw, midH);

  if (state.caughtSource) {
    const sx = worldX + state.caughtSource.x * worldScale;
    const sy = worldY + state.caughtSource.y * worldScale;
    const tx = worldX + state.thief.x * worldScale;
    const ty = worldY + state.thief.y * worldScale;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.strokeStyle = '#FF4D4D';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([10, 6]);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#FF4D4D';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tx, ty, 22 * worldScale, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#0B1220';
  roundRect(ctx, x, y, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 3.5;
  roundRect(ctx, x, y, cardW, cardH, 14);
  ctx.stroke();

  const title = `SPOTTED BY ${state.caughtBy || 'GUARD 1'}`;
  ctx.fillStyle = '#FEF2F2';
  ctx.font = '900 32px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, cx, y + 54);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '700 16px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('0.45s detection window — use cover or tools', cx, y + 98);

  const btnW = cardW - 64;
  const btnH = 54;
  const btnX = x + 32;
  const btnY = y + 132;
  ctx.fillStyle = '#10B981';
  roundRect(ctx, btnX, btnY, btnW, btnH, 10);
  ctx.fill();
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.5;
  roundRect(ctx, btnX, btnY, btnW, btnH, 10);
  ctx.stroke();

  ctx.fillStyle = '#06281E';
  ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('[R] RETRY FLOOR', cx, btnY + btnH * 0.5 + 1);
  hitBoxes.push({ id: 'retry', type: 'retry', x: btnX, y: btnY, w: btnW, h: btnH });
  ctx.restore();
}

function drawGetawayLedgerModal(ctx, state, layout, hitBoxes) {
  const { vw, vh, topBarH, bottomBarH } = layout;
  const midH = vh - topBarH - bottomBarH;
  const cx = vw * 0.5;
  const cy = topBarH + midH * 0.5;
  const payout = state.payout || { loot: state.lootValue, tools: state.toolsSpent, ghostBonus: 4500, netTake: state.lootValue + 4500 - state.toolsSpent };

  const cardW = Math.min(540, vw - 64);
  const cardH = 356;
  const x = cx - cardW * 0.5;
  const y = cy - cardH * 0.5;

  ctx.save();
  ctx.fillStyle = 'rgba(6, 10, 18, 0.62)';
  ctx.fillRect(0, topBarH, vw, midH);

  ctx.fillStyle = '#0B1220';
  roundRect(ctx, x, y, cardW, cardH, 14);
  ctx.fill();
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 3.5;
  roundRect(ctx, x, y, cardW, cardH, 14);
  ctx.stroke();

  const floorNum = state.floorIndex + 1;
  ctx.fillStyle = '#10B981';
  ctx.font = '900 14px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`COPPERLINE · FL ${floorNum} GETAWAY COMPLETE`, cx, y + 34);

  ctx.fillStyle = '#F6F2E8';
  ctx.font = '900 28px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('GETAWAY PAYOUT LEDGER', cx, y + 68);

  const rows = [
    { icon: '◆', iconColor: '#FFD166', label: 'LOOT', value: `+$${payout.loot.toLocaleString()}`, valColor: '#FFD166' },
    { icon: '⚙', iconColor: '#F59E0B', label: 'TOOLS', value: `-$${payout.tools.toLocaleString()}`, valColor: '#FCA5A5' },
    { icon: '★', iconColor: '#38BDF8', label: 'GHOST BONUS', value: `+$${payout.ghostBonus.toLocaleString()}`, valColor: '#7DD3FC' },
  ];

  const rowX = x + 36;
  const rowRight = x + cardW - 36;
  let ry = y + 118;
  for (const row of rows) {
    ctx.fillStyle = row.iconColor;
    ctx.font = '900 18px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(row.icon, rowX, ry);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '800 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(row.label, rowX + 28, ry);

    ctx.fillStyle = row.valColor;
    ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(row.value, rowRight, ry);
    ry += 38;
  }

  ctx.strokeStyle = 'rgba(224, 184, 106, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rowX, ry - 12);
  ctx.lineTo(rowRight, ry - 12);
  ctx.stroke();

  ry += 16;
  ctx.fillStyle = '#F6F2E8';
  ctx.font = '900 21px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NET TAKE', rowX, ry);

  ctx.fillStyle = '#34D399';
  ctx.font = '900 26px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`+$${payout.netTake.toLocaleString()}`, rowRight, ry);

  const btnW = cardW - 64;
  const btnH = 54;
  const btnX = x + 32;
  const btnY = y + cardH - btnH - 24;
  const isFinal = state.floorIndex === COPPERLINE_FLOORS.length - 1;
  ctx.fillStyle = '#10B981';
  roundRect(ctx, btnX, btnY, btnW, btnH, 10);
  ctx.fill();
  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.5;
  roundRect(ctx, btnX, btnY, btnW, btnH, 10);
  ctx.stroke();

  ctx.fillStyle = '#06281E';
  ctx.font = '900 20px "Segoe UI", system-ui, sans-serif';
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
  ctx.fillStyle = 'rgba(6, 10, 18, 0.62)';
  ctx.fillRect(0, topBarH, vw, midH);
  ctx.fillStyle = '#0B1220';
  roundRect(ctx, cx - 170, cy - 86, 340, 172, 12);
  ctx.fill();
  ctx.strokeStyle = '#E0B86A';
  ctx.lineWidth = 2.6;
  roundRect(ctx, cx - 170, cy - 86, 340, 172, 12);
  ctx.stroke();
  ctx.fillStyle = '#F6F2E8';
  ctx.font = '900 28px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAUSED', cx, cy - 34);

  ctx.fillStyle = '#10B981';
  roundRect(ctx, cx - 120, cy + 8, 240, 48, 8);
  ctx.fill();
  ctx.fillStyle = '#06281E';
  ctx.font = '900 18px "Segoe UI", system-ui, sans-serif';
  ctx.fillText('[P] RESUME', cx, cy + 33);
  hitBoxes.push({ id: 'resume', type: 'resume', x: cx - 120, y: cy + 8, w: 240, h: 48 });
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
