/* Thief silhouette, patrolling guards with alert gauges, CCTV housings, loot pedestal, and floating cues. */

import { GUARD_LOCK_GRACE_SECONDS } from './guards.js';

export function renderLootPedestal(ctx, state, layout) {
  const { worldX, worldY, worldScale } = layout;
  const { loot, thief, lootValue, time } = state;
  const x = loot.x;
  const y = loot.y;

  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  ctx.fillStyle = '#0D1526';
  ctx.strokeStyle = '#E0B86A';
  ctx.lineWidth = 2.4;
  drawOctagon(ctx, x, y, 32);
  ctx.fill();
  ctx.stroke();

  if (!thief.lootSecured) {
    const pulse = 0.86 + 0.14 * Math.sin(time * 4.2);
    const halo = ctx.createRadialGradient(x, y, 6, x, y, 68 * pulse);
    halo.addColorStop(0, 'rgba(255, 209, 102, 0.62)');
    halo.addColorStop(0.55, 'rgba(255, 209, 102, 0.22)');
    halo.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, 68 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.moveTo(x, y - 19);
    ctx.lineTo(x + 18, y);
    ctx.lineTo(x, y + 19);
    ctx.lineTo(x - 18, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x - 8, y);
    ctx.closePath();
    ctx.fill();

    const bob = Math.sin(time * 5) * 3;
    ctx.strokeStyle = '#FFD166';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 40 + bob);
    ctx.lineTo(x, y - 31 + bob);
    ctx.lineTo(x + 9, y - 40 + bob);
    ctx.stroke();

    drawPill(ctx, x, y + 40, `$${lootValue.toLocaleString()}`, '#FFD166', '#090D16', '#FFFBEB', 15);

    if (thief.crackProgress > 0) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * thief.crackProgress);
      ctx.stroke();
    }
  } else {
    drawPill(ctx, x, y + 38, 'SECURED', '#0F172A', '#34D399', '#10B981', 11);
  }

  ctx.restore();
}

export function renderPatrolGuardsAndAlert(ctx, state, layout) {
  const { worldX, worldY, worldScale } = layout;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawCameras(ctx, state.cameras, state.time);
  drawGuards(ctx, state.guards);
  drawFloatingTags(ctx, state.floatingTags);

  ctx.restore();
}

export function renderThiefSilhouette(ctx, state, layout, pointer) {
  const { worldX, worldY, worldScale } = layout;
  const { thief, time } = state;

  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  ctx.save();
  ctx.translate(thief.x, thief.y);

  const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 44);
  halo.addColorStop(0, 'rgba(248, 250, 252, 0.32)');
  halo.addColorStop(0.55, 'rgba(56, 189, 248, 0.16)');
  halo.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();

  if (thief.inCover) {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 26 + Math.sin(time * 5) * 1.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.rotate(thief.angle);
  ctx.scale(1.26, 1.26);

  ctx.fillStyle = '#0B1220';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 14, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.ellipse(-3, -10, 5, 4, 0.3, 0, Math.PI * 2);
  ctx.ellipse(-3, 10, 5, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(-4, -9.5);
  ctx.lineTo(-9.5, 0);
  ctx.lineTo(-4, 9.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#7DD3FC';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#E0B86A';
  ctx.beginPath();
  ctx.arc(1.5, 0, 3.6, 0, Math.PI * 2);
  ctx.fill();

  if (thief.lootSecured) {
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.moveTo(-10, -4.5);
    ctx.lineTo(-4.5, 0);
    ctx.lineTo(-10, 4.5);
    ctx.lineTo(-15.5, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (state.screen === 'playing' && pointer && pointer.insideArena) {
    drawAimReticle(ctx, pointer.worldX, pointer.worldY);
  }
  ctx.restore();
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

    const labelOffset = cam.labelOffsetY ?? -21;
    if (cam.jammedTimer > 0) {
      drawPill(ctx, cam.x, cam.y + labelOffset, `${cam.id} JAMMED`, '#090D16', '#22D3EE', '#22D3EE', 11);
    } else {
      drawPill(ctx, cam.x, cam.y + labelOffset, cam.id, '#090D16', '#A5F3FC', '#0891B2', 10);
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
      ctx.fillStyle = g.alertIcon === '!' ? '#EF4444' : '#F59E0B';
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

function drawFloatingTags(ctx, tags) {
  for (const tag of tags) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, tag.timer / 0.6));
    drawPill(ctx, tag.x, tag.y, tag.text, '#090D16', tag.color, tag.color, 12);
    ctx.restore();
  }
}

function drawAimReticle(ctx, wx, wy) {
  ctx.save();
  ctx.strokeStyle = 'rgba(224, 184, 106, 0.72)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(wx, wy, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wx - 15, wy);
  ctx.lineTo(wx - 6, wy);
  ctx.moveTo(wx + 6, wy);
  ctx.lineTo(wx + 15, wy);
  ctx.moveTo(wx, wy - 15);
  ctx.lineTo(wx, wy - 6);
  ctx.moveTo(wx, wy + 6);
  ctx.lineTo(wx, wy + 15);
  ctx.stroke();
  ctx.restore();
}

function drawPill(ctx, cx, cy, text, bg, fg, border, fontSize) {
  ctx.save();
  ctx.font = `900 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 18;
  const h = fontSize + 10;
  ctx.fillStyle = bg;
  roundRect(ctx, cx - w * 0.5, cy - h * 0.5, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.8;
  roundRect(ctx, cx - w * 0.5, cy - h * 0.5, w, h, 6);
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
