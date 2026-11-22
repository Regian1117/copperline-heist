/* Guard vision cones, CCTV sweep cones with ray-clipped scan beams, acoustic ripples, EMP, and chalk smoke. */

export function renderGuardVisionCones(ctx, state, layout) {
  const { worldX, worldY, worldScale } = layout;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawPatrolTracks(ctx, state.guards);
  for (const g of state.guards) {
    if (!g.conePoly || g.conePoly.length < 3) continue;
    const hot = g.state === 'SPOTTED';
    const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.range);
    grad.addColorStop(0, hot ? 'rgba(239, 68, 68, 0.48)' : 'rgba(239, 68, 68, 0.36)');
    grad.addColorStop(0.72, hot ? 'rgba(220, 38, 38, 0.25)' : 'rgba(220, 38, 38, 0.16)');
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

  for (const cam of state.cameras) {
    if (cam.jammedTimer > 0 || !cam.conePoly || cam.conePoly.length < 3) continue;
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

    const rays = cam.conePoly.length - 1;
    const norm = 0.5 + 0.34 * Math.sin(state.time * 4.5 + cam.blinkPhase);
    const rayIdx = Math.max(1, Math.min(rays, Math.round(1 + norm * (rays - 1))));
    const tip = cam.conePoly[rayIdx];
    if (tip) {
      ctx.strokeStyle = 'rgba(165, 243, 252, 0.78)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(cam.x, cam.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 42, cam.minAngle, cam.maxAngle);
    ctx.stroke();
    ctx.setLineDash([]);
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
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const c of state.coins) {
    drawCoinLure(ctx, c);
  }
  for (const w of state.empWaves) {
    drawEmpWave(ctx, w);
  }
  for (const sm of state.smokes) {
    drawChalkSmokeCloud(ctx, sm, state.time);
  }
  ctx.restore();
}

function drawPatrolTracks(ctx, guards) {
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
}

function drawCoinLure(ctx, c) {
  ctx.save();
  if (Number.isFinite(c.fromX)) {
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.58)';
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
    const a = Math.max(0.14, 1 - rr / 84);
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

function drawEmpWave(ctx, w) {
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

function drawChalkSmokeCloud(ctx, sm, time) {
  ctx.save();
  const fade = Math.min(1, sm.timer / 1.2);
  ctx.globalAlpha = 0.94 * fade;

  const vapor = ctx.createRadialGradient(sm.x, sm.y, 6, sm.x, sm.y, sm.radius);
  vapor.addColorStop(0, 'rgba(226, 246, 250, 0.56)');
  vapor.addColorStop(0.58, 'rgba(148, 210, 224, 0.34)');
  vapor.addColorStop(0.88, 'rgba(56, 189, 248, 0.16)');
  vapor.addColorStop(1, 'rgba(56, 189, 248, 0.04)');
  ctx.fillStyle = vapor;
  ctx.beginPath();
  ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
  ctx.fill();

  const spin = time * 0.45;
  const lobes = [
    { a: spin, dist: sm.radius * 0.36, r: sm.radius * 0.48 },
    { a: spin + 2.1, dist: sm.radius * 0.34, r: sm.radius * 0.44 },
    { a: spin + 4.2, dist: sm.radius * 0.35, r: sm.radius * 0.42 },
  ];
  for (const lb of lobes) {
    const lx = sm.x + Math.cos(lb.a) * lb.dist;
    const ly = sm.y + Math.sin(lb.a) * lb.dist;
    const lg = ctx.createRadialGradient(lx, ly, 4, lx, ly, lb.r);
    lg.addColorStop(0, 'rgba(240, 249, 255, 0.38)');
    lg.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, lb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(207, 250, 254, 0.72)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const startA = spin + k * ((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.radius * (0.58 + k * 0.12), startA, startA + 1.15);
    ctx.stroke();
  }

  ctx.strokeStyle = '#7DD3FC';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = '900 11px "Segoe UI", system-ui, sans-serif';
  const tw = Math.ceil(ctx.measureText('SMOKE').width) + 16;
  ctx.fillStyle = '#090D16';
  ctx.fillRect(sm.x - tw * 0.5, sm.y - 10, tw, 20);
  ctx.strokeStyle = '#7DD3FC';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(sm.x - tw * 0.5, sm.y - 10, tw, 20);
  ctx.fillStyle = '#E0F2FE';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SMOKE', sm.x, sm.y + 0.5);
  ctx.restore();
}
