export function renderVaultDiorama(ctx, state, cam) {
  const { vw, vh, topBarH, bottomBarH, worldW, worldH } = cam;
  ctx.fillStyle = PALETTE.voidBg;
  ctx.fillRect(0, topBarH, vw, vh - topBarH - bottomBarH);
  ctx.save();
  applyWorldTransform(ctx, cam);
  ctx.fillStyle = PALETTE.stoneA;
  ctx.fillRect(0, 0, worldW, worldH);
  drawStoneFloorAndVault(ctx, worldW, worldH, state.loot, state.thief.lootSecured, state.zoneLabels);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
  for (const w of state.walls) ctx.fillRect(w.x + 5, w.y + 6, w.w, w.h);
  for (const c of state.covers) ctx.fillRect(c.plinth.x + 5, c.plinth.y + 6, c.plinth.w, c.plinth.h);
  if (state.lockdown) {
    ctx.strokeStyle = `rgba(255, 46, 76, ${(0.25 + 0.2 * Math.sin(state.time * 7.5)).toFixed(2)})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(WALL_THICK + 5, WALL_THICK + 5, worldW - WALL_THICK * 2 - 10, worldH - WALL_THICK * 2 - 10);
  }
  ctx.restore();
}

export function renderWallsAndCover(ctx, state, cam) {
  ctx.save();
  applyWorldTransform(ctx, cam);
  drawBlueprintRoutes(ctx, state);
  drawMotionTrail(ctx, state.motionTrail);
  drawEscapeTrail(ctx, state.escapeTrail);
  drawRecessedVents(ctx, state.vents, state.time);
  drawRoyalCoverStations(ctx, state.covers, state.thief);
  drawBasaltWalls(ctx, state.walls);
  ctx.restore();
}

/* Midnight blueprint vault diorama, cobalt cover stations, hatched basalt walls, lasers, exit, and shared UI shapes. */
import { WALL_THICK } from './authoredVaults.js';
import { computeFloorRoutes } from './routesAndCover.js';
import { applyWorldTransform } from './thiefControls.js';
import { PALETTE, UI_FONT } from './toolsAndEconomy.js';

export function renderLaserRelaysAndExit(ctx, state, cam) {
  ctx.save();
  applyWorldTransform(ctx, cam);
  drawExtractionExit(ctx, state.exit, state.thief.lootSecured, state.time);
  drawLasersAndRelays(ctx, state.lasers, state.time);
  ctx.restore();
}

function drawStoneFloorAndVault(ctx, w, h, loot, secured, zoneLabels = []) {
  const fine = 20;
  const major = 80;
  ctx.fillStyle = PALETTE.stoneB;
  ctx.fillRect(100, 84, w - 200, h - 168);

  ctx.strokeStyle = 'rgba(30, 58, 108, 0.24)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let x = WALL_THICK + fine; x < w - WALL_THICK; x += fine) { ctx.moveTo(x, WALL_THICK); ctx.lineTo(x, h - WALL_THICK); }
  for (let y = WALL_THICK + fine; y < h - WALL_THICK; y += fine) { ctx.moveTo(WALL_THICK, y); ctx.lineTo(w - WALL_THICK, y); }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(59, 130, 246, 0.22)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  for (let x = major; x < w - WALL_THICK; x += major) { ctx.moveTo(x, WALL_THICK); ctx.lineTo(x, h - WALL_THICK); }
  for (let y = major; y < h - WALL_THICK; y += major) { ctx.moveTo(WALL_THICK, y); ctx.lineTo(w - WALL_THICK, y); }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(224, 184, 90, 0.20)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  ctx.fillStyle = 'rgba(147, 197, 253, 0.42)';
  ctx.font = `700 9px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cols = 'ABCDEFGHIJ';
  for (let i = 0; i < cols.length; i++) {
    ctx.fillText(cols[i], 68 + i * 100, 32);
  }
  for (let r = 0; r < 5; r++) {
    ctx.fillText(String(r + 1), 32, 74 + r * 104);
  }

  for (const zl of zoneLabels) {
    ctx.fillStyle = 'rgba(147, 197, 253, 0.34)';
    ctx.font = `900 10px ${UI_FONT}`;
    ctx.fillText(zl.text, zl.x, zl.y);
  }

  const cx = loot.x;
  const cy = loot.y;
  drawOctagon(ctx, cx, cy, 86, PALETTE.vaultStoneA, secured ? 'rgba(16, 185, 129, 0.58)' : 'rgba(224, 184, 90, 0.62)', 2.2);
  drawOctagon(ctx, cx, cy, 66, PALETTE.vaultStoneB, secured ? 'rgba(16, 185, 129, 0.30)' : 'rgba(224, 184, 90, 0.30)', 1.3);
  ctx.beginPath();
  ctx.arc(cx, cy, 50, 0, Math.PI * 2);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.moveTo(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32);
    ctx.lineTo(cx + Math.cos(a) * 76, cy + Math.sin(a) * 76);
  }
  ctx.stroke();
}

function drawRecessedVents(ctx, vents, time) {
  for (const v of vents) {
    const { x, y, w, h } = v.rect;
    ctx.fillStyle = PALETTE.ventMetal;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = PALETTE.ventTrim;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const pulse = (time * 22) % 44;
    if (v.dir === 'E') {
      drawVentGrate(ctx, x + 4, y + 4, 22, h - 8);
      drawVentGrate(ctx, x + w - 26, y + 4, 22, h - 8);
      const cy = y + h * 0.5;
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let cx = x + 98 + pulse; cx < x + w - 98; cx += 54) {
        ctx.moveTo(cx - 5, cy - 5); ctx.lineTo(cx + 3, cy); ctx.lineTo(cx - 5, cy + 5);
      }
      ctx.stroke();
      drawWorldBadge(ctx, x + 64, cy, 'VENT IN', '#0B1628', '#E2E8F0', '#94A3B8', 9);
      drawWorldBadge(ctx, x + w - 68, cy, 'VENT OUT', '#0B1628', '#E2E8F0', '#94A3B8', 9);
    } else {
      drawVentGrate(ctx, x + 4, y + 4, w - 8, 20);
      drawVentGrate(ctx, x + 4, y + h - 24, w - 8, 20);
      drawWorldBadge(ctx, x + w * 0.5, y + h - 34, 'VENT IN', '#0B1628', '#E2E8F0', '#94A3B8', 8);
      drawWorldBadge(ctx, x + w * 0.5, y + 34, 'VENT OUT', '#0B1628', '#E2E8F0', '#94A3B8', 8);
    }
  }
}

function drawVentGrate(ctx, x, y, w, h) {
  ctx.fillStyle = '#0F141E';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  if (w > h) for (let gx = x + 5; gx < x + w - 2; gx += 5) { ctx.moveTo(gx, y + 2); ctx.lineTo(gx, y + h - 2); }
  else for (let gy = y + 5; gy < y + h - 2; gy += 5) { ctx.moveTo(x + 2, gy); ctx.lineTo(x + w - 2, gy); }
  ctx.stroke();
}

function drawRoyalCoverStations(ctx, covers, thief) {
  for (const c of covers) {
    const p = c.pad;
    const pl = c.plinth;
    const active = thief.x >= p.x && thief.x <= p.x + p.w && thief.y >= p.y && thief.y <= p.y + p.h;
    drawPanelBox(ctx, p.x, p.y, p.w, p.h, 5, active ? 'rgba(37, 99, 235, 0.34)' : 'rgba(37, 99, 235, 0.16)', active ? '#93C5FD' : PALETTE.safeBracket, active ? 2.4 : 1.6);
    drawShieldGlyph(ctx, p.x + p.w * 0.5, p.y + p.h * 0.5, 9.5, active ? '#DBEAFE' : '#60A5FA');
    drawPanelBox(ctx, pl.x + 2, pl.y + 2, pl.w - 4, pl.h - 4, 5, PALETTE.plinthFill, PALETTE.safeBracket, 2);
    drawPanelBox(ctx, pl.x + 8, pl.y + 8, pl.w - 16, pl.h - 16, 3, '#0F1522', 'rgba(96, 165, 250, 0.5)', 1.2);
  }
}

function drawBasaltWalls(ctx, walls) {
  for (const w of walls) {
    ctx.fillStyle = PALETTE.wallBase;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(w.x, w.y, w.w, w.h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(147, 197, 253, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let d = -w.h; d < w.w + w.h; d += 12) {
      ctx.moveTo(w.x + d, w.y + w.h);
      ctx.lineTo(w.x + d + w.h, w.y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = PALETTE.wallBevel;
    ctx.fillRect(w.x + 2, w.y + 2, Math.max(0, w.w - 4), Math.max(0, Math.min(6, w.h - 4)));
    ctx.strokeStyle = PALETTE.brass;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    if (w.w >= 18 && w.h >= 18) {
      ctx.fillStyle = PALETTE.brassBright;
      for (const [rx, ry] of [[w.x + 4, w.y + 4], [w.x + w.w - 7, w.y + 4], [w.x + 4, w.y + w.h - 7], [w.x + w.w - 7, w.y + w.h - 7]]) {
        ctx.fillRect(rx, ry, 3, 3);
      }
    }
  }
}

function drawExtractionExit(ctx, exit, lootSecured, time) {
  const pulse = 0.85 + 0.15 * Math.sin(time * 4.5);
  drawPanelBox(ctx, exit.x - 5, exit.y - 5, exit.w + 10, exit.h + 10, 8, '#07241A', lootSecured ? '#34D399' : PALETTE.brass, lootSecured ? 2.8 * pulse : 2);
  drawPanelBox(ctx, exit.x + 1, exit.y + 1, exit.w - 2, exit.h - 2, 6, PALETTE.exitGreen, PALETTE.exitGreen, 1);
  ctx.fillStyle = 'rgba(4, 34, 25, 0.28)';
  for (let s = 0; s < 4; s++) ctx.fillRect(exit.x + 7 + s * 7, exit.y + 7, 3.5, exit.h - 14);
  ctx.fillStyle = '#042219';
  ctx.font = `900 19px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT →', exit.x + exit.w * 0.56, exit.y + exit.h * 0.5 + 1);
}

function drawLasersAndRelays(ctx, lasers, time) {
  for (const l of lasers) {
    const mx = (l.x1 + l.x2) * 0.5;
    const my = (l.y1 + l.y2) * 0.5;
    const len = Math.max(1, Math.hypot(l.x2 - l.x1, l.y2 - l.y1));
    const nx = (-(l.y2 - l.y1) / len) * 3.2;
    const ny = ((l.x2 - l.x1) / len) * 3.2;
    ctx.save();
    ctx.strokeStyle = l.active ? PALETTE.relayWire : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = l.active ? 2.6 : 1.6;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(l.x2, l.y2);
    ctx.lineTo(l.relay.x, l.relay.y);
    ctx.stroke();
    ctx.setLineDash([]);
    if (l.active) {
      const glow = 0.82 + 0.18 * Math.sin(l.pulsePhase + time * 4);
      ctx.strokeStyle = `rgba(255, 30, 110, ${(0.42 * glow).toFixed(2)})`;
      ctx.lineWidth = 12;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      for (const s of [-1, 1]) {
        ctx.strokeStyle = PALETTE.laser; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.moveTo(l.x1 + nx * s, l.y1 + ny * s); ctx.lineTo(l.x2 + nx * s, l.y2 + ny * s); ctx.stroke();
      }
    } else {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      drawWorldBadge(ctx, mx, my, 'BYPASSED', '#0A261C', '#34D399', '#10B981', 10);
    }
    const rx = l.relay.x;
    const ry = l.relay.y;
    drawPanelBox(ctx, rx - 41, ry - 15, 82, 30, 6, l.active ? '#111C33' : '#141820', l.active ? PALETTE.brassBright : '#475569', 2, l.active ? 'RELAY [E]' : 'RELAY OFF', l.active ? '#FEF3C7' : '#94A3B8', 12);
    if (l.hackProgress > 0 && l.active) {
      ctx.strokeStyle = PALETTE.brassBright;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * l.hackProgress);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawBlueprintRoutes(ctx, state) {
  const routes = computeFloorRoutes(state);
  if (routes.length === 0) return;
  ctx.save();
  for (const r of routes) {
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3.2;
    ctx.setLineDash([10, 7]);
    ctx.beginPath();
    r.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);
    const mid = r.labelPos || r.pts[Math.floor(r.pts.length / 2)];
    if (mid && r.label !== 'GETAWAY') {
      const b = r.color.includes('34, 211');
      drawWorldBadge(ctx, mid.x, mid.y, r.label, '#080D1A', b ? '#A5F3FC' : '#FDE68A', b ? '#22D3EE' : '#FACC15', 11);
    }
  }
  ctx.restore();
}

function drawMotionTrail(ctx, trail) {
  if (!trail || trail.length < 2) return;
  ctx.save();
  for (let i = 0; i < trail.length - 1; i++) {
    const p = trail[i];
    const life = Math.max(0, 1 - p.age / 1.05);
    if (life <= 0.05) continue;
    ctx.fillStyle = `rgba(96, 165, 250, ${(life * 0.48).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.8 + life * 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawEscapeTrail(ctx, trail) {
  if (!trail || trail.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  trail.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.strokeStyle = 'rgba(255, 212, 59, 0.36)';
  ctx.lineWidth = 11;
  ctx.stroke();
  ctx.strokeStyle = PALETTE.lootGold;
  ctx.lineWidth = 4.2;
  ctx.setLineDash([11, 7]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawShieldGlyph(ctx, cx, cy, r, stroke) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.85, cy - r * 0.55);
  ctx.lineTo(cx + r * 0.72, cy + r * 0.22);
  ctx.quadraticCurveTo(cx + r * 0.45, cy + r * 0.8, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.45, cy + r * 0.8, cx - r * 0.72, cy + r * 0.22);
  ctx.lineTo(cx - r * 0.85, cy - r * 0.55);
  ctx.closePath();
  ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

export function drawWorldBadge(ctx, cx, cy, text, bg, fg, border, fs) {
  ctx.save();
  ctx.font = `900 ${fs}px ${UI_FONT}`;
  const w = Math.ceil(ctx.measureText(text).width) + 16;
  const h = fs + 10;
  drawPanelBox(ctx, cx - w * 0.5, cy - h * 0.5, w, h, 5, bg, border, 1.6, text, fg, fs);
  ctx.restore();
}

export function drawOctagon(ctx, cx, cy, r, fill, stroke, lw) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.stroke(); }
}

export function chamferRect(ctx, x, y, w, h, cut) {
  const c = Math.min(cut, w * 0.4, h * 0.4);
  ctx.beginPath();
  ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c);
  ctx.closePath();
}

export function drawPanelBox(ctx, x, y, w, h, cut, fill, stroke, lw, label, fg, fs) {
  chamferRect(ctx, x, y, w, h, cut);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
  if (label) {
    ctx.fillStyle = fg;
    ctx.font = `900 ${fs}px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w * 0.5, y + h * 0.5 + 0.5);
  }
}
