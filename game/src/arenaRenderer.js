/* Architectural blueprint floor grid, brass walls, cover alcoves, service vents, laser relays, and exit. */

import { computeFloorRoutes } from './routesAndCover.js';

export function renderBlueprintFloor(ctx, state, layout) {
  const { vw, vh, topBarH, bottomBarH, worldX, worldY, worldScale, worldW, worldH } = layout;

  ctx.fillStyle = '#111B2E';
  ctx.fillRect(0, topBarH, vw, vh - topBarH - bottomBarH);
  drawViewportGrid(ctx, vw, vh, topBarH, bottomBarH, worldX, worldY, worldScale);

  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawCoordinateTicks(ctx, worldW, worldH);
  ctx.fillStyle = '#111B2E';
  ctx.fillRect(0, 0, worldW, worldH);

  ctx.strokeStyle = '#182743';
  ctx.lineWidth = 1;
  for (let x = 20; x < worldW; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, worldH);
    ctx.stroke();
  }
  for (let y = 20; y < worldH; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(worldW, y);
    ctx.stroke();
  }

  ctx.strokeStyle = '#1F3256';
  ctx.lineWidth = 1.25;
  for (let x = 80; x < worldW; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, worldH);
    ctx.stroke();
  }
  for (let y = 80; y < worldH; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(worldW, y);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(224, 184, 106, 0.13)';
  ctx.font = '800 13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`BLUEPRINT · ${state.name.toUpperCase()}`, 30, worldH - 28);
  ctx.restore();
}

export function renderWallsVentsAndCover(ctx, state, layout) {
  const { worldX, worldY, worldScale } = layout;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawServiceVents(ctx, state.vents, state.time);
  drawSafeCoverAlcoves(ctx, state.covers);
  drawBlueprintRoutes(ctx, state);
  drawBrassWalls(ctx, state.walls);

  ctx.restore();
}

export function renderLaserRelaysAndExit(ctx, state, layout) {
  const { worldX, worldY, worldScale } = layout;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawGetawayExit(ctx, state.exit, state.thief.lootSecured, state.time);
  drawLasersAndRelays(ctx, state.lasers, state.time);

  ctx.restore();
}

function drawViewportGrid(ctx, vw, vh, topBarH, bottomBarH, worldX, worldY, scale) {
  const step = 40 * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topBarH, vw, vh - topBarH - bottomBarH);
  ctx.clip();
  ctx.strokeStyle = 'rgba(29, 45, 77, 0.55)';
  ctx.lineWidth = 1;
  for (let x = worldX % step; x < vw; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, topBarH);
    ctx.lineTo(x, vh - bottomBarH);
    ctx.stroke();
  }
  for (let y = topBarH + ((worldY - topBarH) % step); y < vh - bottomBarH; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(vw, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCoordinateTicks(ctx, w, h) {
  ctx.save();
  ctx.font = '700 11px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(224, 184, 106, 0.65)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  for (let i = 0; i < cols.length; i++) {
    const x = 52 + i * 104;
    ctx.fillText(cols[i], x, -10);
    ctx.fillRect(x - 0.5, -3, 1, 4);
  }
  for (let r = 1; r <= 5; r++) {
    const y = r * 104 - 24;
    ctx.fillText(String(r), -12, y);
    ctx.fillRect(-4, y - 0.5, 4, 1);
  }
  ctx.strokeStyle = 'rgba(224, 184, 106, 0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-2, -2, w + 4, h + 4);
  ctx.restore();
}

function drawServiceVents(ctx, vents, time) {
  for (const v of vents) {
    const { x, y, w, h } = v.rect;
    ctx.save();
    ctx.fillStyle = '#172C4B';
    ctx.fillRect(x, y, w, h);

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.22)';
    ctx.lineWidth = 1.5;
    for (let d = -h; d < w + h; d += 14) {
      ctx.beginPath();
      ctx.moveTo(x + d, y);
      ctx.lineTo(x + d - h, y + h);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.setLineDash([]);

    const pulse = (time * 28) % 36;
    ctx.strokeStyle = '#93C5FD';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (v.dir === 'E') {
      const cy = y + h * 0.5;
      for (let cx = x + 36 + pulse; cx < x + w - 26; cx += 52) {
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - 8);
        ctx.lineTo(cx + 3, cy);
        ctx.lineTo(cx - 7, cy + 8);
        ctx.stroke();
      }
      ctx.fillStyle = '#0F1B30';
      ctx.fillRect(x + w - 92, y + h - 18, 84, 15);
      ctx.fillStyle = '#93C5FD';
      ctx.font = '800 10px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('VENT BYPASS', x + w - 50, y + h - 10);
    } else {
      const cx = x + w * 0.5;
      for (let cy = y + h - 30 - pulse; cy > y + 26; cy -= 48) {
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy + 7);
        ctx.lineTo(cx, cy - 3);
        ctx.lineTo(cx + 8, cy + 7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawSafeCoverAlcoves(ctx, covers) {
  for (const c of covers) {
    ctx.save();
    ctx.fillStyle = '#14353C';
    ctx.fillRect(c.x, c.y, c.w, c.h);

    ctx.beginPath();
    ctx.rect(c.x, c.y, c.w, c.h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.16)';
    ctx.lineWidth = 1.5;
    for (let i = -c.h; i < c.w + c.h; i += 12) {
      ctx.beginPath();
      ctx.moveTo(c.x + i, c.y);
      ctx.lineTo(c.x + i + c.h, c.y + c.h);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
    ctx.setLineDash([]);
    drawShieldGlyph(ctx, c.x + c.w * 0.5, c.y + c.h * 0.5, 13, '#7DD3FC', 'rgba(14, 165, 233, 0.25)');
    ctx.restore();
  }
}

function drawShieldGlyph(ctx, cx, cy, r, stroke, fill) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r * 0.85, cy - r * 0.55);
  ctx.lineTo(cx + r * 0.72, cy + r * 0.22);
  ctx.quadraticCurveTo(cx + r * 0.45, cy + r * 0.8, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.45, cy + r * 0.8, cx - r * 0.72, cy + r * 0.22);
  ctx.lineTo(cx - r * 0.85, cy - r * 0.55);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBlueprintRoutes(ctx, state) {
  const routes = computeFloorRoutes(state);
  if (routes.length === 0) return;
  ctx.save();
  for (const r of routes) {
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2.8;
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    r.pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.setLineDash([]);
    const mid = r.pts[Math.floor(r.pts.length / 2)];
    if (mid && r.label !== 'GETAWAY') {
      drawTag(ctx, mid.x, mid.y - 14, r.label, '#0B1220', '#E0B86A', '#E0B86A', 11);
    }
  }
  ctx.restore();
}

function drawBrassWalls(ctx, walls) {
  ctx.save();
  for (const w of walls) {
    ctx.fillStyle = 'rgba(3, 6, 12, 0.55)';
    ctx.fillRect(w.x + 5, w.y + 6, w.w, w.h);
  }
  for (const w of walls) {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = '#E0B86A';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    ctx.strokeStyle = 'rgba(224, 184, 106, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 4, w.y + 4, Math.max(0, w.w - 8), Math.max(0, w.h - 8));
  }
  ctx.restore();
}

function drawGetawayExit(ctx, exit, lootSecured, time) {
  const pulse = 0.8 + 0.2 * Math.sin(time * 4.2);
  ctx.save();
  ctx.shadowColor = 'rgba(16, 185, 129, 0.42)';
  ctx.shadowBlur = lootSecured ? 14 * pulse : 5;
  ctx.fillStyle = '#10B981';
  roundRect(ctx, exit.x, exit.y, exit.w, exit.h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.2;
  roundRect(ctx, exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4, 6);
  ctx.stroke();

  ctx.fillStyle = '#06281E';
  ctx.font = '900 18px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT ▸', exit.x + exit.w * 0.5, exit.y + exit.h * 0.5 + 1);
  ctx.restore();
}

function drawLasersAndRelays(ctx, lasers, time) {
  for (const l of lasers) {
    const mx = (l.x1 + l.x2) * 0.5;
    const my = (l.y1 + l.y2) * 0.5;
    ctx.save();
    ctx.strokeStyle = l.active ? 'rgba(245, 158, 11, 0.78)' : 'rgba(148, 163, 184, 0.42)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(l.x2, l.y2);
    ctx.lineTo(l.relay.x, l.relay.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (l.active) {
      const glow = 0.8 + 0.2 * Math.sin(l.pulsePhase + time * 4);
      ctx.strokeStyle = `rgba(251, 113, 133, ${0.38 * glow})`;
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();

      ctx.strokeStyle = '#FB7185';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();

      ctx.strokeStyle = '#FFE4E6';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      drawTag(ctx, mx, my, 'BYPASSED', '#0F172A', '#34D399', '#10B981', 11);
    }

    for (const pt of [
      { x: l.x1, y: l.y1 },
      { x: l.x2, y: l.y2 },
    ]) {
      ctx.fillStyle = '#090D16';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = l.active ? '#FB7185' : '#64748B';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    const rx = l.relay.x;
    const ry = l.relay.y;
    ctx.fillStyle = l.active ? '#F59E0B' : '#334155';
    roundRect(ctx, rx - 14, ry - 14, 28, 28, 6);
    ctx.fill();
    ctx.strokeStyle = l.active ? '#FEF08A' : '#94A3B8';
    ctx.lineWidth = 2;
    roundRect(ctx, rx - 14, ry - 14, 28, 28, 6);
    ctx.stroke();

    ctx.fillStyle = l.active ? '#090D16' : '#CBD5E1';
    ctx.font = '900 13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(l.active ? '⚡' : '✓', rx, ry + 1);

    drawTag(
      ctx,
      rx,
      ry - 24,
      l.active ? 'RELAY [E]' : 'RELAY OFF',
      '#090D16',
      l.active ? '#FDE68A' : '#94A3B8',
      l.active ? '#F59E0B' : '#475569',
      11,
    );

    if (l.hackProgress > 0 && l.active) {
      ctx.strokeStyle = '#FFD166';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry, 21, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * l.hackProgress);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawTag(ctx, cx, cy, text, bg, fg, border, fontSize) {
  ctx.save();
  ctx.font = `900 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 16;
  const h = fontSize + 9;
  ctx.fillStyle = bg;
  roundRect(ctx, cx - w * 0.5, cy - h * 0.5, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.6;
  roundRect(ctx, cx - w * 0.5, cy - h * 0.5, w, h, 5);
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 0.5);
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
