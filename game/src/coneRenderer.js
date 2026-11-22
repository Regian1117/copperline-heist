/* Guard vision cones, architectural patrol tracks, single-cone CCTV fans, acoustic ripples, EMP, smoke. */

export function renderGuardVisionCones(ctx, s, lay) {
  const { worldX, worldY, worldScale } = lay;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawArchitecturalPatrolHairlines(ctx, s.guards);
  for (const g of s.guards) {
    if (!g.conePoly || g.conePoly.length < 3) continue;
    const hot = g.state === 'SPOTTED';
    const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, g.range);
    grad.addColorStop(0, hot ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.36)');
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

export function renderCameraSweepCones(ctx, s, lay) {
  const { worldX, worldY, worldScale } = lay;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  for (const cam of s.cameras) {
    if (cam.jammedTimer > 0 || !cam.conePoly || cam.conePoly.length < 3) continue;
    const grad = ctx.createRadialGradient(cam.x, cam.y, 8, cam.x, cam.y, cam.range);
    grad.addColorStop(0, 'rgba(34, 211, 238, 0.34)');
    grad.addColorStop(0.74, 'rgba(6, 182, 212, 0.15)');
    grad.addColorStop(1, 'rgba(6, 182, 212, 0.04)');

    ctx.beginPath();
    cam.conePoly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.88)';
    ctx.lineWidth = 2.1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(103, 232, 249, 0.28)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, cam.range + 10, cam.angle - cam.fov * 0.5, cam.angle + cam.fov * 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

export function renderAcousticAndSmokeFields(ctx, s, lay) {
  const { worldX, worldY, worldScale } = lay;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  for (const r of s.ripples) {
    ctx.save();
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, r.alpha));
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const c of s.coins) drawCoinLure(ctx, c);
  for (const w of s.empWaves) drawEmpWave(ctx, w);
  for (const sm of s.smokes) drawChalkSmokeCloud(ctx, sm, s.time);
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
    ctx.strokeStyle = 'rgba(245, 196, 81, 0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(c.fromX, c.fromY);
    ctx.quadraticCurveTo((c.fromX + c.x) * 0.5, Math.min(c.fromY, c.y) - 34, c.x, c.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  for (let k = 0; k < 3; k++) {
    const rr = 18 + ((c.ripplePhase * 22 + k * 24) % 74);
    const a = Math.max(0.2, 1 - rr / 88);
    ctx.strokeStyle = `rgba(245, 196, 81, ${a.toFixed(2)})`;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(c.x, c.y, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#F5C451';
  ctx.beginPath();
  ctx.arc(c.x, c.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFBEB';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#0A1220';
  ctx.font = `900 14px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', c.x, c.y + 1);
  ctx.restore();
}

function drawEmpWave(ctx, w) {
  ctx.save();
  const alpha = Math.max(0.32, w.timer / w.maxTimer);
  ctx.strokeStyle = `rgba(34, 211, 238, ${alpha.toFixed(2)})`;
  ctx.lineWidth = 3.6;
  ctx.beginPath();
  ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = `rgba(165, 243, 252, ${(alpha * 0.72).toFixed(2)})`;
  ctx.lineWidth = 1.8;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(w.x, w.y, Math.max(12, w.radius - 20), 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawChalkSmokeCloud(ctx, sm, time) {
  ctx.save();
  const fade = Math.min(1, sm.timer / 1.2);
  ctx.globalAlpha = 0.96 * fade;

  const vapor = ctx.createRadialGradient(sm.x, sm.y, 6, sm.x, sm.y, sm.radius);
  vapor.addColorStop(0, 'rgba(226, 250, 252, 0.62)');
  vapor.addColorStop(0.56, 'rgba(103, 232, 249, 0.34)');
  vapor.addColorStop(0.86, 'rgba(56, 189, 248, 0.16)');
  vapor.addColorStop(1, 'rgba(56, 189, 248, 0.04)');
  ctx.fillStyle = vapor;
  ctx.beginPath();
  ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
  ctx.fill();

  const spin = time * 0.45;
  const lobes = [
    { a: spin, dist: sm.radius * 0.34, r: sm.radius * 0.52 },
    { a: spin + 1.57, dist: sm.radius * 0.32, r: sm.radius * 0.46 },
    { a: spin + 3.14, dist: sm.radius * 0.34, r: sm.radius * 0.48 },
    { a: spin + 4.71, dist: sm.radius * 0.3, r: sm.radius * 0.44 },
  ];
  for (const lb of lobes) {
    const lx = sm.x + Math.cos(lb.a) * lb.dist;
    const ly = sm.y + Math.sin(lb.a) * lb.dist;
    const lg = ctx.createRadialGradient(lx, ly, 4, lx, ly, lb.r);
    lg.addColorStop(0, 'rgba(240, 253, 255, 0.42)');
    lg.addColorStop(1, 'rgba(165, 243, 252, 0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, lb.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = 'rgba(207, 250, 254, 0.78)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    const startA = spin + k * ((Math.PI * 2) / 3);
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.radius * (0.52 + k * 0.14), startA, startA + 1.2);
    ctx.stroke();
  }

  ctx.strokeStyle = '#67E8F9';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.arc(sm.x, sm.y, sm.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.font = `900 12px ${UI_FONT}`;
  const tw = Math.ceil(ctx.measureText('SMOKE').width) + 16;
  ctx.fillStyle = '#0A1220';
  ctx.fillRect(sm.x - tw * 0.5, sm.y - 11, tw, 22);
  ctx.strokeStyle = '#67E8F9';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(sm.x - tw * 0.5, sm.y - 11, tw, 22);
  ctx.fillStyle = '#ECFEFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SMOKE', sm.x, sm.y + 0.5);
  ctx.restore();
}

const UI_FONT = '"Bahnschrift", "DIN Alternate", "Segoe UI", system-ui, sans-serif';
