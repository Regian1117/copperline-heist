/* Lit blueprint vault interior, grounded drop-shadows, hatched walls, steel vents, plinth cover, relay, exit. */

import { computeFloorRoutes } from './routesAndCover.js';

export function renderBlueprintFloor(ctx, s, lay) {
  const { vw, vh, topBarH, bottomBarH, worldX, worldY, worldScale, worldW, worldH } = lay;

  ctx.fillStyle = '#070B13';
  ctx.fillRect(0, topBarH, vw, vh - topBarH - bottomBarH);

  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawCoordinateTicks(ctx, worldW, worldH);

  ctx.fillStyle = '#132138';
  ctx.fillRect(0, 0, worldW, worldH);

  drawArchitecturalTileGrid(ctx, worldW, worldH);
  drawVaultChamberInlay(ctx, s.loot, s.thief.lootSecured);

  ctx.restore();
}

export function renderWallsVentsAndCover(ctx, s, lay) {
  const { worldX, worldY, worldScale } = lay;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawRivetedServiceVents(ctx, s.vents, s.time);
  drawTactileCoverPlinths(ctx, s.covers);
  drawBlueprintRoutes(ctx, s);
  drawEscapeTrail(ctx, s.escapeTrail);
  drawHatchedBrassWalls(ctx, s.walls);

  ctx.restore();
}

export function renderLaserRelaysAndExit(ctx, s, lay) {
  const { worldX, worldY, worldScale } = lay;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawRecessedExitStairwell(ctx, s.exit, s.thief.lootSecured, s.time);
  drawLaserBarriersAndConsole(ctx, s.lasers, s.time);

  ctx.restore();
}

function drawCoordinateTicks(ctx, w, h) {
  ctx.save();
  ctx.font = `700 11px ${UI_FONT}`;
  ctx.fillStyle = 'rgba(200, 164, 92, 0.72)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  for (let i = 0; i < cols.length; i++) {
    const x = 52 + i * 104;
    ctx.fillText(cols[i], x, -10);
    ctx.fillRect(x - 0.5, -3, 1.5, 4);
  }
  for (let r = 1; r <= 5; r++) {
    const y = r * 104 - 24;
    ctx.fillText(String(r), -12, y);
    ctx.fillRect(-4, y - 0.5, 4, 1.5);
  }
  ctx.strokeStyle = 'rgba(200, 164, 92, 0.45)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-2, -2, w + 4, h + 4);
  ctx.restore();
}

function drawArchitecturalTileGrid(ctx, w, h) {
  ctx.strokeStyle = 'rgba(32, 52, 84, 0.75)';
  ctx.lineWidth = 1;
  for (let x = 20; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 20; y < h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(54, 84, 128, 0.58)';
  ctx.lineWidth = 1.2;
  for (let x = 80; x < w; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 80; y < h; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.save();
  ctx.fillStyle = 'rgba(6, 10, 18, 0.24)';
  ctx.fillRect(18, 18, w - 36, 14);
  ctx.fillRect(18, h - 32, w - 36, 14);
  ctx.fillRect(18, 32, 14, h - 64);
  ctx.fillRect(w - 32, 32, 14, h - 64);

  ctx.strokeStyle = 'rgba(200, 164, 92, 0.2)';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(28, 28, w - 56, h - 56);
  ctx.restore();
}

function drawVaultChamberInlay(ctx, loot, lootSecured) {
  const cx = loot.x;
  const cy = loot.y;
  ctx.save();

  ctx.fillStyle = '#0D1728';
  drawOctagon(ctx, cx, cy, 86);
  ctx.fill();

  ctx.strokeStyle = lootSecured ? 'rgba(16, 185, 129, 0.42)' : 'rgba(200, 164, 92, 0.52)';
  ctx.lineWidth = 2;
  drawOctagon(ctx, cx, cy, 86);
  ctx.stroke();

  ctx.strokeStyle = lootSecured ? 'rgba(16, 185, 129, 0.22)' : 'rgba(200, 164, 92, 0.26)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 66, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 48, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32);
    ctx.lineTo(cx + Math.cos(a) * 76, cy + Math.sin(a) * 76);
    ctx.stroke();
  }

  ctx.strokeStyle = lootSecured ? 'rgba(52, 211, 153, 0.26)' : 'rgba(245, 196, 81, 0.3)';
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 2; k++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((k * Math.PI) / 4);
    ctx.strokeRect(-42, -42, 84, 84);
    ctx.restore();
  }
  ctx.restore();
}

function drawRivetedServiceVents(ctx, vents, time) {
  for (const v of vents) {
    const { x, y, w, h } = v.rect;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#162840';
    ctx.fillRect(x, y, w, h);
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#1E3554';
    if (v.dir === 'E') ctx.fillRect(x, y + Math.round(h * 0.24), w, Math.round(h * 0.52));
    else ctx.fillRect(x + Math.round(w * 0.24), y, Math.round(w * 0.52), h);

    ctx.strokeStyle = '#60A5FA';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

    ctx.strokeStyle = 'rgba(147, 197, 253, 0.28)';
    ctx.lineWidth = 1.8;
    const pulse = (time * 24) % 44;

    if (v.dir === 'E') {
      for (let fx = x + 54; fx < x + w - 24; fx += 54) {
        ctx.beginPath();
        ctx.moveTo(fx, y + 2);
        ctx.lineTo(fx, y + h - 2);
        ctx.stroke();
        ctx.fillStyle = '#93C5FD';
        ctx.beginPath();
        ctx.arc(fx, y + 7, 2, 0, Math.PI * 2);
        ctx.arc(fx, y + h - 7, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      drawVentGrate(ctx, x + 6, y + 6, 18, h - 12);
      drawVentGrate(ctx, x + w - 24, y + 6, 18, h - 12);

      const cy = y + h * 0.5;
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let cx = x + 42 + pulse; cx < x + w - 112; cx += 52) {
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy - 7);
        ctx.lineTo(cx + 3, cy);
        ctx.lineTo(cx - 7, cy + 7);
        ctx.stroke();
      }
      drawChamferBadge(ctx, x + w - 76, y + h * 0.5, 'VENT BYPASS', '#0A1220', '#BAE6FD', '#60A5FA', 10);
    } else {
      for (let fy = y + 54; fy < y + h - 24; fy += 54) {
        ctx.beginPath();
        ctx.moveTo(x + 2, fy);
        ctx.lineTo(x + w - 2, fy);
        ctx.stroke();
        ctx.fillStyle = '#93C5FD';
        ctx.beginPath();
        ctx.arc(x + 7, fy, 2, 0, Math.PI * 2);
        ctx.arc(x + w - 7, fy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      drawVentGrate(ctx, x + 6, y + 6, w - 12, 18);
      drawVentGrate(ctx, x + 6, y + h - 24, w - 12, 18);

      const cx = x + w * 0.5;
      ctx.strokeStyle = '#BAE6FD';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let cy = y + h - 38 - pulse; cy > y + 32; cy -= 48) {
        ctx.beginPath();
        ctx.moveTo(cx - 7, cy + 7);
        ctx.lineTo(cx, cy - 3);
        ctx.lineTo(cx + 7, cy + 7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

function drawVentGrate(ctx, x, y, w, h) {
  ctx.save();
  ctx.fillStyle = '#09111E';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#60A5FA';
  ctx.lineWidth = 1.3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(147, 197, 253, 0.52)';
  if (w > h) {
    for (let gx = x + 5; gx < x + w - 2; gx += 5) {
      ctx.beginPath();
      ctx.moveTo(gx, y + 2);
      ctx.lineTo(gx, y + h - 2);
      ctx.stroke();
    }
  } else {
    for (let gy = y + 5; gy < y + h - 2; gy += 5) {
      ctx.beginPath();
      ctx.moveTo(x + 2, gy);
      ctx.lineTo(x + w - 2, gy);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawTactileCoverPlinths(ctx, covers) {
  for (const c of covers) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.48)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#112233';
    chamferRect(ctx, c.x + 5, c.y + 5, c.w - 10, c.h - 10, 6);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.6;
    chamferRect(ctx, c.x + 5, c.y + 5, c.w - 10, c.h - 10, 6);
    ctx.stroke();

    ctx.fillStyle = '#0D1928';
    chamferRect(ctx, c.x + 11, c.y + 11, c.w - 22, c.h - 22, 4);
    ctx.fill();

    ctx.strokeStyle = '#2DD4BF';
    ctx.lineWidth = 2.2;
    drawCornerBrackets(ctx, c.x, c.y, c.w, c.h, 12);

    drawShieldGlyph(ctx, c.x + c.w * 0.5, c.y + c.h * 0.5, 12, '#5EEAD4', 'rgba(45, 212, 191, 0.16)');
    ctx.restore();
  }
}

function drawCornerBrackets(ctx, x, y, w, h, len) {
  ctx.beginPath();
  ctx.moveTo(x, y + len);
  ctx.lineTo(x, y);
  ctx.lineTo(x + len, y);
  ctx.moveTo(x + w - len, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + len);
  ctx.moveTo(x + w, y + h - len);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w - len, y + h);
  ctx.moveTo(x + len, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + h - len);
  ctx.stroke();
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
  ctx.lineWidth = 1.9;
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
      drawChamferBadge(ctx, mid.x, mid.y - 14, r.label, '#0A1220', '#F5C451', '#C8A45C', 11);
    }
  }
  ctx.restore();
}

function drawEscapeTrail(ctx, trail) {
  if (!trail || trail.length < 2) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.34)';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  trail.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  ctx.strokeStyle = '#34D399';
  ctx.lineWidth = 3.6;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  trail.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawHatchedBrassWalls(ctx, walls) {
  ctx.save();
  for (const w of walls) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.48)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 7;
    ctx.fillStyle = '#0D1522';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.restore();
  }
  for (const w of walls) {
    ctx.save();
    ctx.fillStyle = '#0D1522';
    ctx.fillRect(w.x, w.y, w.w, w.h);

    ctx.beginPath();
    ctx.rect(w.x + 2, w.y + 2, Math.max(0, w.w - 4), Math.max(0, w.h - 4));
    ctx.clip();
    ctx.strokeStyle = 'rgba(200, 164, 92, 0.14)';
    ctx.lineWidth = 1.2;
    const span = w.w + w.h;
    for (let d = -w.h; d < span; d += 12) {
      ctx.beginPath();
      ctx.moveTo(w.x + d, w.y);
      ctx.lineTo(w.x + d + w.h, w.y + w.h);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = '#C8A45C';
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);

    if (w.w >= 18 && w.h >= 18) {
      ctx.fillStyle = '#E0B86A';
      const pts = [
        [w.x + 5, w.y + 5],
        [w.x + w.w - 5, w.y + 5],
        [w.x + 5, w.y + w.h - 5],
        [w.x + w.w - 5, w.y + w.h - 5],
      ];
      for (const [rx, ry] of pts) {
        ctx.beginPath();
        ctx.arc(rx, ry, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawRecessedExitStairwell(ctx, exit, lootSecured, time) {
  const pulse = 0.85 + 0.15 * Math.sin(time * 4.2);
  ctx.save();

  ctx.shadowColor = 'rgba(16, 185, 129, 0.3)';
  ctx.shadowBlur = lootSecured ? 18 * pulse : 8;
  ctx.fillStyle = '#07241A';
  chamferRect(ctx, exit.x - 5, exit.y - 5, exit.w + 10, exit.h + 10, 8);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#C8A45C';
  ctx.lineWidth = 2;
  chamferRect(ctx, exit.x - 5, exit.y - 5, exit.w + 10, exit.h + 10, 8);
  ctx.stroke();

  ctx.fillStyle = '#0F766E';
  chamferRect(ctx, exit.x, exit.y, exit.w, exit.h, 6);
  ctx.fill();
  ctx.fillStyle = '#10B981';
  chamferRect(ctx, exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4, 5);
  ctx.fill();

  ctx.fillStyle = 'rgba(6, 40, 30, 0.22)';
  for (let s = 0; s < 4; s++) {
    ctx.fillRect(exit.x + 7 + s * 7, exit.y + 7, 3.5, exit.h - 14);
  }

  ctx.fillStyle = '#042219';
  ctx.font = `900 19px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT →', exit.x + exit.w * 0.56, exit.y + exit.h * 0.5 + 1);
  ctx.restore();
}

function drawLaserBarriersAndConsole(ctx, lasers, time) {
  for (const l of lasers) {
    const mx = (l.x1 + l.x2) * 0.5;
    const my = (l.y1 + l.y2) * 0.5;
    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const len = Math.max(1, Math.hypot(dx, dy));
    const nx = (-dy / len) * 3.2;
    const ny = (dx / len) * 3.2;

    ctx.save();
    ctx.strokeStyle = l.active ? 'rgba(245, 158, 11, 0.92)' : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = l.active ? 3.2 : 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(l.x2, l.y2);
    ctx.lineTo(l.relay.x, l.relay.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (l.active) {
      const glow = 0.8 + 0.2 * Math.sin(l.pulsePhase + time * 4);
      ctx.strokeStyle = `rgba(251, 113, 133, ${0.4 * glow})`;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();

      for (const sign of [-1, 1]) {
        ctx.strokeStyle = '#FB7185';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(l.x1 + nx * sign, l.y1 + ny * sign);
        ctx.lineTo(l.x2 + nx * sign, l.y2 + ny * sign);
        ctx.stroke();

        ctx.strokeStyle = '#FFF1F2';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(l.x1 + nx * sign, l.y1 + ny * sign);
        ctx.lineTo(l.x2 + nx * sign, l.y2 + ny * sign);
        ctx.stroke();
      }
      ctx.fillStyle = '#FFE4E6';
      ctx.beginPath();
      ctx.arc(mx, my, 3.6 * glow, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      drawChamferBadge(ctx, mx, my, 'BYPASSED', '#0A261C', '#34D399', '#10B981', 11);
    }

    for (const pt of [
      { x: l.x1, y: l.y1 },
      { x: l.x2, y: l.y2 },
    ]) {
      ctx.fillStyle = '#0D1322';
      chamferRect(ctx, pt.x - 8, pt.y - 8, 16, 16, 3);
      ctx.fill();
      ctx.strokeStyle = l.active ? '#FB7185' : '#64748B';
      ctx.lineWidth = 2;
      chamferRect(ctx, pt.x - 8, pt.y - 8, 16, 16, 3);
      ctx.stroke();
      ctx.fillStyle = l.active ? '#FFE4E6' : '#475569';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    const rx = l.relay.x;
    const ry = l.relay.y;
    const cw = 82;
    const ch = 30;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = l.active ? '#161C2B' : '#101826';
    chamferRect(ctx, rx - cw * 0.5, ry - ch * 0.5, cw, ch, 6);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = l.active ? '#F5C451' : '#475569';
    ctx.lineWidth = 2.2;
    chamferRect(ctx, rx - cw * 0.5, ry - ch * 0.5, cw, ch, 6);
    ctx.stroke();

    ctx.fillStyle = l.active ? '#F59E0B' : '#475569';
    ctx.fillRect(rx - cw * 0.5 + 7, ry - 4, 7, 8);

    ctx.fillStyle = l.active ? '#FEF3C7' : '#94A3B8';
    ctx.font = `900 12px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(l.active ? 'RELAY [E]' : 'RELAY OFF', rx + 5, ry + 1);

    if (l.hackProgress > 0 && l.active) {
      ctx.strokeStyle = '#F5C451';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * l.hackProgress);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawChamferBadge(ctx, cx, cy, text, bg, fg, border, fontSize) {
  ctx.save();
  ctx.font = `800 ${fontSize}px ${UI_FONT}`;
  const w = Math.ceil(ctx.measureText(text).width) + 18;
  const h = fontSize + 10;
  ctx.fillStyle = bg;
  chamferRect(ctx, cx - w * 0.5, cy - h * 0.5, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.6;
  chamferRect(ctx, cx - w * 0.5, cy - h * 0.5, w, h, 5);
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 0.5);
  ctx.restore();
}

function drawOctagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
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
