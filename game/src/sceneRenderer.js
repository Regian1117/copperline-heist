/* NOIR Architectural Blueprint & Brass arena renderer: blueprint grid, vents, cover, cones, tools, actors. */

import { GUARD_LOCK_GRACE_SECONDS } from './guards.js';

export function renderHeistArena(ctx, state, layout) {
  const { vw, vh, topBarH, bottomBarH, worldX, worldY, worldScale, worldW, worldH } = layout;

  ctx.fillStyle = '#111B2E';
  ctx.fillRect(0, topBarH, vw, vh - topBarH - bottomBarH);

  drawBackgroundBlueprintGrid(ctx, vw, vh, topBarH, bottomBarH, worldX, worldY, worldScale);

  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawArchitecturalMarginTicks(ctx, worldW, worldH);
  drawFloorSurface(ctx, worldW, worldH, state);
  drawServiceVents(ctx, state.vents, state.time);
  drawSafeCoverAlcoves(ctx, state.covers);
  drawGetawayExit(ctx, state.exit, state.thief.lootSecured, state.time);
  drawRouteBlueprintOverlay(ctx, state);
  drawArchitecturalWalls(ctx, state.walls);
  drawLasersAndRelays(ctx, state.lasers, state.time);
  drawLootPedestal(ctx, state);

  ctx.restore();
}

export function renderConesAndActors(ctx, state, layout, pointer) {
  const { worldX, worldY, worldScale } = layout;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawGuardPatrolTracks(ctx, state.guards);
  drawCameraCones(ctx, state.cameras, state.time);
  drawGuardCones(ctx, state.guards);
  drawToolEffects(ctx, state);
  drawCameras(ctx, state.cameras, state.time);
  drawGuards(ctx, state.guards);
  drawThief(ctx, state.thief, state.time);
  drawCaughtSightline(ctx, state);
  drawFloatingTags(ctx, state.floatingTags);
  drawAimReticle(ctx, state, pointer);

  ctx.restore();
}

function drawBackgroundBlueprintGrid(ctx, vw, vh, topBarH, bottomBarH, worldX, worldY, scale) {
  const step = 40 * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, topBarH, vw, vh - topBarH - bottomBarH);
  ctx.clip();

  ctx.strokeStyle = 'rgba(29, 45, 77, 0.55)';
  ctx.lineWidth = 1;
  const startX = worldX % step;
  for (let x = startX; x < vw; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, topBarH);
    ctx.lineTo(x, vh - bottomBarH);
    ctx.stroke();
  }
  const startY = topBarH + ((worldY - topBarH) % step);
  for (let y = startY; y < vh - bottomBarH; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(vw, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawArchitecturalMarginTicks(ctx, w, h) {
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

function drawFloorSurface(ctx, w, h, state) {
  ctx.fillStyle = '#111B2E';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#182743';
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

  ctx.strokeStyle = '#1F3256';
  ctx.lineWidth = 1.25;
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
  ctx.fillStyle = 'rgba(224, 184, 106, 0.11)';
  ctx.font = '800 13px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`BLUEPRINT · ${state.name.toUpperCase()}`, 30, h - 28);
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

    const sx = c.x + c.w * 0.5;
    const sy = c.y + c.h * 0.5;
    drawShieldGlyph(ctx, sx, sy, 13, '#7DD3FC', 'rgba(14, 165, 233, 0.25)');
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

function drawGetawayExit(ctx, exit, lootSecured, time) {
  const pulse = 0.75 + 0.25 * Math.sin(time * 4.5);
  ctx.save();
  ctx.shadowColor = 'rgba(16, 185, 129, 0.65)';
  ctx.shadowBlur = lootSecured ? 22 * pulse : 12;
  ctx.fillStyle = '#10B981';
  roundRect(ctx, exit.x, exit.y, exit.w, exit.h, 8);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = '#A7F3D0';
  ctx.lineWidth = 2.5;
  roundRect(ctx, exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4, 6);
  ctx.stroke();

  ctx.fillStyle = '#06281E';
  ctx.font = '900 18px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT ▸', exit.x + exit.w * 0.5, exit.y + exit.h * 0.5 + 1);
  ctx.restore();
}

function drawRouteBlueprintOverlay(ctx, state) {
  if (!state.showRoutes && !state.thief.lootSecured) return;
  ctx.save();
  if (state.showRoutes) {
    for (const hint of state.routeHints) {
      ctx.strokeStyle = 'rgba(224, 184, 106, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      hint.pts.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
      ctx.setLineDash([]);
      const mid = hint.pts[Math.floor(hint.pts.length / 2)];
      if (mid) {
        drawMiniPill(ctx, mid.x, mid.y - 14, hint.label, '#0B1220', '#E0B86A', '#E0B86A');
      }
    }
  }
  if (state.thief.lootSecured && state.screen === 'playing') {
    const ex = state.exit.x + state.exit.w * 0.5;
    const ey = state.exit.y + state.exit.h * 0.5;
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.78)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(state.thief.x, state.thief.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawArchitecturalWalls(ctx, walls) {
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
      drawMiniPill(ctx, mx, my, 'BYPASSED', '#0F172A', '#34D399', '#10B981');
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

    drawMiniPill(
      ctx,
      rx,
      ry - 24,
      l.active ? 'RELAY [E]' : 'RELAY OFF',
      '#090D16',
      l.active ? '#FDE68A' : '#94A3B8',
      l.active ? '#F59E0B' : '#475569',
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

function drawLootPedestal(ctx, state) {
  const { loot, thief, lootValue, time } = state;
  const x = loot.x;
  const y = loot.y;
  ctx.save();

  ctx.fillStyle = '#0D1526';
  ctx.strokeStyle = '#E0B86A';
  ctx.lineWidth = 2;
  drawOctagon(ctx, x, y, 28);
  ctx.fill();
  ctx.stroke();

  if (!thief.lootSecured) {
    const pulse = 0.82 + 0.18 * Math.sin(time * 4.2);
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 46 * pulse);
    glow.addColorStop(0, 'rgba(255, 209, 102, 0.45)');
    glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 46 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.moveTo(x, y - 16);
    ctx.lineTo(x + 15, y);
    ctx.lineTo(x, y + 16);
    ctx.lineTo(x - 15, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.moveTo(x, y - 9);
    ctx.lineTo(x + 7, y);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x - 7, y);
    ctx.closePath();
    ctx.fill();

    const bob = Math.sin(time * 5) * 3;
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 34 + bob);
    ctx.lineTo(x, y - 26 + bob);
    ctx.lineTo(x + 8, y - 34 + bob);
    ctx.stroke();

    drawMiniPill(ctx, x, y + 36, `$${lootValue.toLocaleString()}`, '#FFD166', '#090D16', '#FFFBEB', 13);

    if (thief.crackProgress > 0) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, 33, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * thief.crackProgress);
      ctx.stroke();
    }
  } else {
    drawMiniPill(ctx, x, y + 36, 'SECURED', '#0F172A', '#34D399', '#10B981', 11);
  }
  ctx.restore();
}

function drawGuardPatrolTracks(ctx, guards) {
  ctx.save();
  for (const g of guards) {
    if (g.waypoints.length < 2) continue;
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 7]);
    ctx.beginPath();
    g.waypoints.forEach((wp, i) => (i === 0 ? ctx.moveTo(wp.x, wp.y) : ctx.lineTo(wp.x, wp.y)));
    if (g.waypoints.length > 2) ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    for (const wp of g.waypoints) {
      ctx.fillStyle = '#090D16';
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#F87171';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawCameraCones(ctx, cameras, time) {
  for (const cam of cameras) {
    if (cam.jammedTimer > 0 || !cam.conePoly || cam.conePoly.length < 3) continue;
    ctx.save();
    const grad = ctx.createRadialGradient(cam.x, cam.y, 8, cam.x, cam.y, cam.range);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.34)');
    grad.addColorStop(0.75, 'rgba(6, 182, 212, 0.16)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.05)');

    ctx.beginPath();
    cam.conePoly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const scanOffset = Math.sin(time * 4.5 + cam.blinkPhase) * cam.fov * 0.36;
    const scanA = cam.angle + scanOffset;
    ctx.strokeStyle = 'rgba(165, 243, 252, 0.72)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(scanA) * cam.range * 0.72, cam.y + Math.sin(scanA) * cam.range * 0.72);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 44, cam.minAngle, cam.maxAngle);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function drawGuardCones(ctx, guards) {
  for (const g of guards) {
    if (!g.conePoly || g.conePoly.length < 3) continue;
    ctx.save();
    const hot = g.state === 'SPOTTED';
    const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.range);
    grad.addColorStop(0, hot ? 'rgba(239, 68, 68, 0.48)' : 'rgba(239, 68, 68, 0.36)');
    grad.addColorStop(0.7, hot ? 'rgba(220, 38, 38, 0.25)' : 'rgba(220, 38, 38, 0.16)');
    grad.addColorStop(1, 'rgba(185, 28, 28, 0.05)');

    ctx.beginPath();
    g.conePoly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = hot ? '#FCA5A5' : '#FF6B6B';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
  }
}

function drawToolEffects(ctx, state) {
  for (const r of state.ripples) {
    ctx.save();
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, r.alpha));
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const c of state.coins) {
    ctx.save();
    if (Number.isFinite(c.fromX)) {
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(c.fromX, c.fromY);
      ctx.quadraticCurveTo((c.fromX + c.x) * 0.5, Math.min(c.fromY, c.y) - 34, c.x, c.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (let k = 0; k < 3; k++) {
      const rr = 16 + ((c.ripplePhase * 22 + k * 24) % 72);
      const a = Math.max(0.12, 1 - rr / 84);
      ctx.strokeStyle = `rgba(255, 209, 102, ${a.toFixed(2)})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(c.x, c.y, rr, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#090D16';
    ctx.font = '900 13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', c.x, c.y + 1);
    ctx.restore();
  }

  for (const w of state.empWaves) {
    ctx.save();
    const alpha = Math.max(0.25, w.timer / w.maxTimer);
    ctx.strokeStyle = `rgba(34, 211, 238, ${alpha.toFixed(2)})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(165, 243, 252, ${(alpha * 0.65).toFixed(2)})`;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(w.x, w.y, Math.max(12, w.radius - 18), 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  for (const sm of state.smokes) {
    ctx.save();
    const fade = Math.min(1, sm.timer / 1.2);
    ctx.globalAlpha = 0.92 * fade;
    const puffs = [
      { dx: 0, dy: 0, r: sm.radius * 0.88, fill: '#CBD5E1' },
      { dx: -24, dy: -14, r: sm.radius * 0.62, fill: '#E2E8F0' },
      { dx: 26, dy: -10, r: sm.radius * 0.58, fill: '#94A3B8' },
      { dx: -16, dy: 20, r: sm.radius * 0.56, fill: '#94A3B8' },
      { dx: 20, dy: 18, r: sm.radius * 0.54, fill: '#E2E8F0' },
    ];
    for (const p of puffs) {
      ctx.fillStyle = p.fill;
      ctx.beginPath();
      ctx.arc(sm.x + p.dx, sm.y + p.dy, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawMiniPill(ctx, sm.x, sm.y, 'SMOKE', '#0F172A', '#F8FAFC', '#94A3B8', 11);
    ctx.restore();
  }
}

function drawCameras(ctx, cameras, time) {
  for (const cam of cameras) {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = cam.jammedTimer > 0 ? '#64748B' : '#22D3EE';
    ctx.lineWidth = 2.2;
    roundRect(ctx, -11, -8, 22, 16, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cam.jammedTimer > 0 ? '#475569' : '#22D3EE';
    ctx.fillRect(9, -4, 6, 8);

    const blinkOn = Math.sin(cam.blinkPhase + time * 4) > 0;
    ctx.fillStyle = cam.jammedTimer > 0 ? '#94A3B8' : blinkOn ? '#FF4D4D' : '#22D3EE';
    ctx.beginPath();
    ctx.arc(2, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (cam.jammedTimer > 0) {
      drawMiniPill(ctx, cam.x, cam.y - 22, `${cam.id} JAMMED`, '#090D16', '#22D3EE', '#22D3EE', 11);
    } else {
      drawMiniPill(ctx, cam.x, cam.y - 20, cam.id, '#090D16', '#A5F3FC', '#0891B2', 10);
    }
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    ctx.save();
    ctx.translate(g.x, g.y);

    const dirX = Math.cos(g.angle);
    const dirY = Math.sin(g.angle);
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(dirX * 14, dirY * 14);
    ctx.lineTo(dirX * 30, dirY * 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dirX * 30, dirY * 30);
    ctx.lineTo(dirX * 23 - dirY * 6, dirY * 30 + dirX * 6);
    ctx.moveTo(dirX * 30, dirY * 30);
    ctx.lineTo(dirX * 23 + dirY * 6, dirY * 30 - dirX * 6);
    ctx.stroke();

    ctx.fillStyle = '#7F1D1D';
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    ctx.fillStyle = '#FEF2F2';
    ctx.font = '900 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.id, 0, 1);

    if (g.lockTimer > 0.02) {
      const ratio = Math.min(1, g.lockTimer / GUARD_LOCK_GRACE_SECONDS);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, -29, 15, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -29, 15, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = ratio > 0.65 ? '#EF4444' : '#F59E0B';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.arc(0, -29, 15, Math.PI, Math.PI + Math.PI * ratio);
      ctx.stroke();
    }

    if (g.alertIcon) {
      const badgeColor = g.alertIcon === '!' ? '#EF4444' : '#F59E0B';
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.arc(0, -29, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFBEB';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = '#090D16';
      ctx.font = '900 15px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(g.alertIcon, 0, -28);
    }

    ctx.restore();
  }
}

function drawThief(ctx, thief, time) {
  ctx.save();
  ctx.translate(thief.x, thief.y);

  const halo = ctx.createRadialGradient(0, 0, 6, 0, 0, 34);
  halo.addColorStop(0, 'rgba(248, 250, 252, 0.24)');
  halo.addColorStop(0.6, 'rgba(56, 189, 248, 0.12)');
  halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();

  if (thief.inCover) {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 21 + Math.sin(time * 5) * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.rotate(thief.angle);
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 14, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(-4, -9);
  ctx.lineTo(-9, 0);
  ctx.lineTo(-4, 9);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#E0B86A';
  ctx.beginPath();
  ctx.arc(1, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();

  if (thief.lootSecured) {
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-10, 4);
    ctx.lineTo(-15, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawCaughtSightline(ctx, state) {
  if (state.screen !== 'caught' || !state.caughtSource) return;
  const s = state.caughtSource;
  const t = state.thief;
  ctx.save();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(t.x, t.y);
  ctx.stroke();

  ctx.strokeStyle = '#FF4D4D';
  ctx.lineWidth = 3.5;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(t.x, t.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#FF4D4D';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(t.x, t.y, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawFloatingTags(ctx, tags) {
  for (const tag of tags) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, tag.timer / 0.6));
    drawMiniPill(ctx, tag.x, tag.y, tag.text, '#090D16', tag.color, tag.color, 12);
    ctx.restore();
  }
}

function drawAimReticle(ctx, state, pointer) {
  if (state.screen !== 'playing' || !pointer || !pointer.insideArena) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(224, 184, 106, 0.72)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(pointer.worldX, pointer.worldY, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(pointer.worldX - 15, pointer.worldY);
  ctx.lineTo(pointer.worldX - 6, pointer.worldY);
  ctx.moveTo(pointer.worldX + 6, pointer.worldY);
  ctx.lineTo(pointer.worldX + 15, pointer.worldY);
  ctx.moveTo(pointer.worldX, pointer.worldY - 15);
  ctx.lineTo(pointer.worldX, pointer.worldY - 6);
  ctx.moveTo(pointer.worldX, pointer.worldY + 6);
  ctx.lineTo(pointer.worldX, pointer.worldY + 15);
  ctx.stroke();
  ctx.restore();
}

function drawMiniPill(ctx, cx, cy, text, bg, fg, border, fontSize = 11) {
  ctx.save();
  ctx.font = `900 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  const padX = 8;
  const w = Math.ceil(ctx.measureText(text).width) + padX * 2;
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

function drawOctagon(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 8) + (i * Math.PI) / 4;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
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
