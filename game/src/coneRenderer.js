export function renderGuardVisionCones(ctx, state, cam) {
  ctx.save();
  applyWorldTransform(ctx, cam);
  clipInteriorArena(ctx, state);

  drawPatrolTrackHairlines(ctx, state.guards);
  for (const g of state.guards) {
    if (!g.conePoly || g.conePoly.length < 3) continue;
    drawCastOcclusionShadows(ctx, g.conePoly, g.x, g.y, g.range);

    const hot = g.state === 'SPOTTED' || state.lockdown;
    const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.range);
    grad.addColorStop(0, hot ? 'rgba(255, 46, 76, 0.58)' : 'rgba(255, 46, 76, 0.44)');
    grad.addColorStop(0.72, hot ? 'rgba(225, 29, 72, 0.30)' : 'rgba(225, 29, 72, 0.20)');
    grad.addColorStop(1, 'rgba(190, 18, 60, 0.06)');

    ctx.beginPath();
    g.conePoly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = hot ? '#FDA4AF' : PALETTE.guardEdge;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
  ctx.restore();
}

export function renderCameraSweepCones(ctx, state, cam) {
  ctx.save();
  applyWorldTransform(ctx, cam);
  clipInteriorArena(ctx, state);

  for (const cc of state.cameras) {
    if (cc.jammedTimer > 0) {
      drawJammedBrokenArc(ctx, cc);
      continue;
    }
    if (!cc.conePoly || cc.conePoly.length < 3) continue;
    drawCastOcclusionShadows(ctx, cc.conePoly, cc.x, cc.y, cc.range);

    const grad = ctx.createRadialGradient(cc.x, cc.y, 8, cc.x, cc.y, cc.range);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.38)');
    grad.addColorStop(0.72, 'rgba(6, 182, 212, 0.16)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.04)');

    ctx.beginPath();
    cc.conePoly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = PALETTE.camEdge;
    ctx.lineWidth = 2.1;
    ctx.stroke();

    drawUnclippedSweepArc(ctx, cc);
  }
  ctx.restore();
}

/* Crimson guard vision cones, ice-cyan CCTV cones, cast shadows, cut rims, smoke, violet EMP, and gold coin fields. */
import { drawWorldBadge } from './arenaRenderer.js';
import { WALL_THICK } from './authoredVaults.js';
import { applyWorldTransform } from './thiefControls.js';
import { PALETTE, UI_FONT } from './toolsAndEconomy.js';

export function renderOcclusionCutRims(ctx, state, cam) {
  ctx.save();
  applyWorldTransform(ctx, cam);
  clipInteriorArena(ctx, state);

  for (const g of state.guards) {
    strokeClippedRim(ctx, g.conePoly, 'rgba(255, 46, 76, 0.52)', '#FFF1F2', 5.6, 2.8);
  }
  for (const cc of state.cameras) {
    if (cc.jammedTimer > 0) continue;
    strokeClippedRim(ctx, cc.conePoly, 'rgba(34, 211, 238, 0.46)', '#ECFEFF', 4.6, 2.4);
  }
  ctx.restore();
}

export function renderAcousticAndSmokeFields(ctx, state, cam) {
  ctx.save();
  applyWorldTransform(ctx, cam);

  for (const r of state.ripples) {
    ctx.save();
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, r.alpha));
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const c of state.coins) drawCoinLure(ctx, c);
  for (const w of state.empWaves) drawEmpWave(ctx, w);
  for (const sm of state.smokes) drawChalkSmokeCloud(ctx, sm, state.time);
  ctx.restore();
}

function clipInteriorArena(ctx, state) {
  ctx.beginPath();
  ctx.rect(WALL_THICK, WALL_THICK, state.width - WALL_THICK * 2, state.height - WALL_THICK * 2);
  ctx.clip();
}

function extractClippedStrips(conePoly) {
  const strips = [];
  if (!conePoly || conePoly.length < 3) return strips;
  let current = [];
  for (let i = 1; i < conePoly.length; i++) {
    const pt = conePoly[i];
    const prev = current.length > 0 ? current[current.length - 1] : null;
    const jump = prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) > 28;
    if (pt.clipped && pt.farX !== undefined && !jump) {
      current.push(pt);
    } else {
      if (current.length >= 2) strips.push(current);
      current = pt.clipped && pt.farX !== undefined ? [pt] : [];
    }
  }
  if (current.length >= 2) strips.push(current);
  return strips;
}

function strokeClippedRim(ctx, conePoly, glowColor, coreColor, glowW, coreW) {
  for (const strip of extractClippedStrips(conePoly)) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(strip[0].x, strip[0].y);
    for (let i = 1; i < strip.length; i++) ctx.lineTo(strip[i].x, strip[i].y);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = glowW;
    ctx.stroke();
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = coreW;
    ctx.stroke();
    ctx.restore();
  }
}

function drawUnclippedSweepArc(ctx, cc) {
  const poly = cc.conePoly;
  const r = cc.range + 8;
  ctx.save();
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.38)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 7]);
  ctx.beginPath();
  let penDown = false;
  for (let i = 1; i < poly.length; i++) {
    const pt = poly[i];
    if (pt.clipped) {
      penDown = false;
      continue;
    }
    const ang = Math.atan2(pt.y - cc.y, pt.x - cc.x);
    const ax = cc.x + Math.cos(ang) * r;
    const ay = cc.y + Math.sin(ang) * r;
    if (!penDown) {
      ctx.moveTo(ax, ay);
      penDown = true;
    } else {
      ctx.lineTo(ax, ay);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawCastOcclusionShadows(ctx, conePoly, ox, oy, range) {
  for (const strip of extractClippedStrips(conePoly)) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(strip[0].x, strip[0].y);
    for (let i = 1; i < strip.length; i++) ctx.lineTo(strip[i].x, strip[i].y);
    for (let i = strip.length - 1; i >= 0; i--) ctx.lineTo(strip[i].farX, strip[i].farY);
    ctx.closePath();

    const umbra = ctx.createRadialGradient(ox, oy, 18, ox, oy, range);
    umbra.addColorStop(0.12, 'rgba(4, 5, 10, 0.86)');
    umbra.addColorStop(0.7, 'rgba(6, 8, 14, 0.72)');
    umbra.addColorStop(1, 'rgba(6, 8, 14, 0.38)');
    ctx.fillStyle = umbra;
    ctx.fill();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }
}

function drawJammedBrokenArc(ctx, cc) {
  ctx.save();
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 8]);
  ctx.beginPath();
  ctx.moveTo(cc.x, cc.y);
  ctx.lineTo(cc.x + Math.cos(cc.angle - cc.fov * 0.5) * 102, cc.y + Math.sin(cc.angle - cc.fov * 0.5) * 102);
  ctx.moveTo(cc.x, cc.y);
  ctx.lineTo(cc.x + Math.cos(cc.angle + cc.fov * 0.5) * 102, cc.y + Math.sin(cc.angle + cc.fov * 0.5) * 102);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cc.x, cc.y, 102, cc.angle - cc.fov * 0.5, cc.angle + cc.fov * 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawPatrolTrackHairlines(ctx, guards) {
  for (const g of guards) {
    const pts = g.waypoints;
    if (pts.length < 2) continue;
    ctx.strokeStyle = 'rgba(255, 46, 76, 0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    pts.forEach((wp, i) => (i === 0 ? ctx.moveTo(wp.x, wp.y) : ctx.lineTo(wp.x, wp.y)));
    if (pts.length > 2) ctx.closePath();
    ctx.stroke();

    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (i === pts.length - 1 && pts.length <= 2) continue;
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(ang);
      ctx.fillStyle = 'rgba(255, 107, 129, 0.88)';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4.5);
      ctx.lineTo(-4, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (const wp of pts) {
      ctx.fillStyle = '#0D1018';
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 107, 129, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

function drawCoinLure(ctx, c) {
  ctx.save();
  if (Number.isFinite(c.fromX)) {
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(c.fromX, c.fromY);
    ctx.quadraticCurveTo((c.fromX + c.x) * 0.5, Math.min(c.fromY, c.y) - 34, c.x, c.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let k = 0; k < 3; k++) {
    ctx.strokeStyle = `rgba(250, 204, 21, ${(0.92 - k * 0.24).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 20 + k * 21, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.coinGold;
  ctx.beginPath();
  ctx.arc(c.x, c.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFBEB';
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ctx.fillStyle = '#1A1002';
  ctx.font = `900 15px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', c.x, c.y + 1);

  drawWorldBadge(ctx, c.x, c.y + 31, 'COIN', PALETTE.coinGold, '#1A1002', '#FFFBEB', 15);
  ctx.restore();
}

function drawEmpWave(ctx, w) {
  ctx.save();
  for (let k = 0; k < 3; k++) {
    const rr = Math.max(18, w.radius - k * 28);
    const alpha = Math.max(0.45, 0.96 - k * 0.22);
    ctx.strokeStyle = `rgba(217, 70, 239, ${alpha.toFixed(2)})`;
    ctx.lineWidth = k === 0 ? 4 : 2.8;
    ctx.setLineDash(k % 2 === 1 ? [9, 6] : []);
    ctx.beginPath();
    ctx.arc(w.x, w.y, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawChalkSmokeCloud(ctx, sm, time) {
  ctx.save();
  const fade = Math.min(1, sm.timer / 1.2);
  ctx.globalAlpha = 0.98 * fade;

  const vapor = ctx.createRadialGradient(sm.x, sm.y, 10, sm.x, sm.y, sm.radius);
  vapor.addColorStop(0, 'rgba(248, 250, 252, 0.95)');
  vapor.addColorStop(0.6, 'rgba(226, 232, 240, 0.78)');
  vapor.addColorStop(0.88, 'rgba(203, 213, 225, 0.42)');
  vapor.addColorStop(1, 'rgba(203, 213, 225, 0.12)');
  ctx.fillStyle = vapor;
  ctx.beginPath();
  ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
  ctx.fill();

  const spin = time * 0.45;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.6;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2.2;
  for (let k = 0; k < 3; k++) {
    const a = spin + k * ((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.radius * (0.48 + k * 0.14), a, a + 1.2);
    ctx.stroke();
  }

  drawWorldBadge(ctx, sm.x, sm.y, 'SMOKE', PALETTE.smokeWhite, PALETTE.hudInk, PALETTE.hudInk, 16);
  ctx.restore();
}
