/* Guard vision cones with cast occlusion shadows, single-cone CCTV sweeps, EMP waves, coin, smoke. */

export function renderGuardVisionCones(ctx, state, layout) {
  const { worldX, worldY, worldScale } = layout;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);
  ctx.beginPath();
  ctx.rect(18, 18, state.width - 36, state.height - 36);
  ctx.clip();

  drawArchitecturalPatrolHairlines(ctx, state.guards);
  for (const g of state.guards) {
    if (!g.conePoly || g.conePoly.length < 3) continue;
    drawCastOcclusionShadows(ctx, g.conePoly, g.x, g.y, g.range);

    const hot = g.state === 'SPOTTED';
    const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.range);
    grad.addColorStop(0, hot ? 'rgba(239, 68, 68, 0.54)' : 'rgba(239, 68, 68, 0.38)');
    grad.addColorStop(0.72, hot ? 'rgba(220, 38, 38, 0.28)' : 'rgba(220, 38, 38, 0.17)');
    grad.addColorStop(1, 'rgba(185, 28, 28, 0.05)');

    ctx.beginPath();
    g.conePoly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = hot ? '#FCA5A5' : '#FF6B6B';
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }
  ctx.restore();
}

export function renderCameraSweepCones(ctx, state, layout) {
  const { worldX, worldY, worldScale } = layout;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);
  ctx.beginPath();
  ctx.rect(18, 18, state.width - 36, state.height - 36);
  ctx.clip();

  for (const cam of state.cameras) {
    if (cam.jammedTimer > 0) {
      drawJammedBrokenArc(ctx, cam);
      continue;
    }
    if (!cam.conePoly || cam.conePoly.length < 3) continue;
    drawCastOcclusionShadows(ctx, cam.conePoly, cam.x, cam.y, cam.range);

    const grad = ctx.createRadialGradient(cam.x, cam.y, 8, cam.x, cam.y, cam.range);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.34)');
    grad.addColorStop(0.74, 'rgba(6, 182, 212, 0.15)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.04)');

    ctx.beginPath();
    cam.conePoly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
    ctx.lineWidth = 2.1;
    ctx.stroke();

    drawUnclippedSweepArc(ctx, cam);
  }
  ctx.restore();
}

export function renderAcousticAndSmokeFields(ctx, state, layout) {
  const { worldX, worldY, worldScale } = layout;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

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

export function renderOcclusionCutRims(ctx, state, layout) {
  const { worldX, worldY, worldScale } = layout;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);
  ctx.beginPath();
  ctx.rect(18, 18, state.width - 36, state.height - 36);
  ctx.clip();

  for (const g of state.guards) {
    strokeClippedRim(ctx, g.conePoly, 'rgba(255, 107, 107, 0.45)', '#FFF1F2', 5.6, 3.0);
  }
  for (const cam of state.cameras) {
    if (cam.jammedTimer > 0) continue;
    strokeClippedRim(ctx, cam.conePoly, 'rgba(34, 211, 238, 0.38)', '#ECFEFF', 4.6, 2.4);
  }
  ctx.restore();
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
  const strips = extractClippedStrips(conePoly);
  for (const strip of strips) {
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

function drawUnclippedSweepArc(ctx, cam) {
  const poly = cam.conePoly;
  const r = cam.range + 8;
  ctx.save();
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.34)';
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
    const ang = Math.atan2(pt.y - cam.y, pt.x - cam.x);
    const ax = cam.x + Math.cos(ang) * r;
    const ay = cam.y + Math.sin(ang) * r;
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
  const strips = extractClippedStrips(conePoly);
  for (const strip of strips) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(strip[0].x, strip[0].y);
    for (let i = 1; i < strip.length; i++) ctx.lineTo(strip[i].x, strip[i].y);
    for (let i = strip.length - 1; i >= 0; i--) ctx.lineTo(strip[i].farX, strip[i].farY);
    ctx.closePath();

    const umbra = ctx.createRadialGradient(ox, oy, 18, ox, oy, range);
    umbra.addColorStop(0.15, 'rgba(2, 8, 18, 0.80)');
    umbra.addColorStop(0.72, 'rgba(3, 11, 24, 0.68)');
    umbra.addColorStop(1, 'rgba(3, 11, 24, 0.34)');
    ctx.fillStyle = umbra;
    ctx.fill();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }
}

function drawJammedBrokenArc(ctx, cam) {
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 8]);
  ctx.beginPath();
  ctx.moveTo(cam.x, cam.y);
  ctx.lineTo(cam.x + Math.cos(cam.angle - cam.fov * 0.5) * 105, cam.y + Math.sin(cam.angle - cam.fov * 0.5) * 105);
  ctx.moveTo(cam.x, cam.y);
  ctx.lineTo(cam.x + Math.cos(cam.angle + cam.fov * 0.5) * 105, cam.y + Math.sin(cam.angle + cam.fov * 0.5) * 105);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 105, cam.angle - cam.fov * 0.5, cam.angle + cam.fov * 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawArchitecturalPatrolHairlines(ctx, guards) {
  for (const g of guards) {
    const pts = g.waypoints;
    if (pts.length < 2) continue;
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.36)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    pts.forEach((wp, i) => (i === 0 ? ctx.moveTo(wp.x, wp.y) : ctx.lineTo(wp.x, wp.y)));
    if (pts.length > 2) ctx.closePath();
    ctx.stroke();

    const segCount = pts.length > 2 ? pts.length : pts.length - 1;
    for (let i = 0; i < segCount; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(ang);
      ctx.fillStyle = 'rgba(252, 165, 165, 0.8)';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4.5);
      ctx.lineTo(-4, 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (const wp of pts) {
      ctx.fillStyle = '#0D1522';
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(248, 113, 113, 0.75)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }
}

function drawCoinLure(ctx, c) {
  ctx.save();
  if (Number.isFinite(c.fromX)) {
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(c.fromX, c.fromY);
    ctx.quadraticCurveTo((c.fromX + c.x) * 0.5, Math.min(c.fromY, c.y) - 30, c.x, c.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let k = 0; k < 3; k++) {
    const rr = 20 + k * 22;
    const a = 0.92 - k * 0.24;
    ctx.strokeStyle = `rgba(251, 191, 36, ${a.toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.x, c.y, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#FBBF24';
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

  ctx.font = `900 16px ${UI_FONT}`;
  const tw = Math.ceil(ctx.measureText('COIN').width) + 22;
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(c.x - tw * 0.5, c.y + 19, tw, 27);
  ctx.strokeStyle = '#FFFBEB';
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x - tw * 0.5, c.y + 19, tw, 27);
  ctx.fillStyle = '#1A1002';
  ctx.fillText('COIN', c.x, c.y + 33);
  ctx.restore();
}

function drawEmpWave(ctx, w) {
  ctx.save();
  for (let k = 0; k < 3; k++) {
    const rr = Math.max(22, w.radius - k * 24);
    const alpha = Math.max(0.42, 0.95 - k * 0.22);
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha.toFixed(2)})`;
    ctx.lineWidth = k === 0 ? 3.8 : 2.6;
    if (k === 1) ctx.setLineDash([8, 6]);
    else ctx.setLineDash([]);
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

  const vapor = ctx.createRadialGradient(sm.x, sm.y, 8, sm.x, sm.y, sm.radius);
  vapor.addColorStop(0, 'rgba(207, 250, 254, 0.78)');
  vapor.addColorStop(0.55, 'rgba(103, 232, 249, 0.48)');
  vapor.addColorStop(0.88, 'rgba(56, 189, 248, 0.24)');
  vapor.addColorStop(1, 'rgba(56, 189, 248, 0.08)');
  ctx.fillStyle = vapor;
  ctx.beginPath();
  ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
  ctx.fill();

  const spin = time * 0.45;
  const lobes = [
    { a: spin, dist: sm.radius * 0.34, r: sm.radius * 0.54 },
    { a: spin + 1.57, dist: sm.radius * 0.32, r: sm.radius * 0.48 },
    { a: spin + 3.14, dist: sm.radius * 0.34, r: sm.radius * 0.5 },
    { a: spin + 4.71, dist: sm.radius * 0.3, r: sm.radius * 0.46 },
  ];
  for (const lb of lobes) {
    const lx = sm.x + Math.cos(lb.a) * lb.dist;
    const ly = sm.y + Math.sin(lb.a) * lb.dist;
    const lg = ctx.createRadialGradient(lx, ly, 4, lx, ly, lb.r);
    lg.addColorStop(0, 'rgba(236, 254, 255, 0.55)');
    lg.addColorStop(1, 'rgba(103, 232, 249, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, lb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = '#67E8F9';
  ctx.lineWidth = 2.4;
  for (let k = 0; k < 3; k++) {
    const startA = spin + k * ((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.radius * (0.52 + k * 0.14), startA, startA + 1.25);
    ctx.stroke();
  }

  ctx.strokeStyle = '#CFFAFE';
  ctx.lineWidth = 2.6;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `900 17px ${UI_FONT}`;
  const tw = Math.ceil(ctx.measureText('SMOKE').width) + 24;
  ctx.fillStyle = '#67E8F9';
  ctx.fillRect(sm.x - tw * 0.5, sm.y - 15.5, tw, 31);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  ctx.strokeRect(sm.x - tw * 0.5, sm.y - 15.5, tw, 31);
  ctx.fillStyle = '#062430';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SMOKE', sm.x, sm.y + 0.5);
  ctx.restore();
}

const UI_FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';
