/* Gold-trimmed ivory thief silhouette, bullion vault pedestal, armored guards, and turret cameras. */

import { GUARD_LOCK_GRACE_SECONDS } from './guards.js';

export function renderThiefSilhouette(ctx, s, lay) {
  const { worldX, worldY, worldScale } = lay;
  const { thief, time, pointer } = s;

  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  ctx.save();
  ctx.translate(thief.x, thief.y);

  const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 44);
  halo.addColorStop(0, 'rgba(248, 250, 252, 0.28)');
  halo.addColorStop(0.5, 'rgba(245, 196, 81, 0.14)');
  halo.addColorStop(1, 'rgba(245, 196, 81, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();

  if (thief.inCover) {
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.8)';
    ctx.lineWidth = 2;
    const br = 24 + Math.sin(time * 4) * 1;
    drawMiniBrackets(ctx, -br, -br, br * 2, br * 2, 7);
  }

  ctx.rotate(thief.angle);
  ctx.scale(1.34, 1.34);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 9;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 5;

  ctx.fillStyle = '#0B1220';
  ctx.beginPath();
  ctx.moveTo(8, -12);
  ctx.quadraticCurveTo(-5, -18, -14, -9);
  ctx.lineTo(-16, 0);
  ctx.lineTo(-14, 9);
  ctx.quadraticCurveTo(-5, 18, 8, 12);
  ctx.quadraticCurveTo(13, 0, 8, -12);
  ctx.closePath();
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#F5C451';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  ctx.fillStyle = '#1E293B';
  ctx.fillRect(-11, 8, 9, 5);
  ctx.strokeStyle = '#C8A45C';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-11, 8, 9, 5);

  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(2, -9.5);
  ctx.lineTo(-11, -5.5);
  ctx.lineTo(-13, 0);
  ctx.lineTo(-11, 5.5);
  ctx.lineTo(2, 9.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#F5C451';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  ctx.fillStyle = '#0A1220';
  ctx.beginPath();
  ctx.arc(3, 0, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#FDE68A';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(17, -4);
  ctx.lineTo(22, 0);
  ctx.lineTo(17, 4);
  ctx.stroke();

  if (thief.lootSecured) {
    ctx.fillStyle = '#F5C451';
    ctx.beginPath();
    ctx.moveTo(-9, -4.5);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-9, 4.5);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  if (s.screen === 'playing' && pointer && pointer.insideArena) {
    drawToolAimReticle(ctx, s.selectedTool, pointer.worldX, pointer.worldY);
  }
  ctx.restore();
}

export function renderLootPedestal(ctx, s, lay) {
  const { worldX, worldY, worldScale } = lay;
  const { loot, thief, lootValue, time } = s;
  const x = loot.x;
  const y = loot.y;

  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  const pulse = 0.88 + 0.12 * Math.sin(time * 4.2);
  if (!thief.lootSecured) {
    const spot = ctx.createRadialGradient(x, y, 8, x, y, 82 * pulse);
    spot.addColorStop(0, 'rgba(245, 196, 81, 0.56)');
    spot.addColorStop(0.5, 'rgba(245, 196, 81, 0.18)');
    spot.addColorStop(1, 'rgba(245, 196, 81, 0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(x, y, 82 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.52)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#0F1829';
  drawOctagon(ctx, x, y, 33);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = '#C8A45C';
  ctx.lineWidth = 2.6;
  drawOctagon(ctx, x, y, 33);
  ctx.stroke();

  if (!thief.lootSecured) {
    ctx.fillStyle = '#B45309';
    ctx.fillRect(x - 18, y + 3, 14, 7);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(x + 4, y + 3, 14, 7);

    ctx.fillStyle = '#F5C451';
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.lineTo(x + 18, y - 2);
    ctx.lineTo(x, y + 16);
    ctx.lineTo(x - 18, y - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.fillStyle = '#FFFBEB';
    ctx.beginPath();
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x + 8, y - 2);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x - 8, y - 2);
    ctx.closePath();
    ctx.fill();

    const bob = Math.sin(time * 5) * 3;
    ctx.strokeStyle = '#F5C451';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 9, y - 42 + bob);
    ctx.lineTo(x, y - 33 + bob);
    ctx.lineTo(x + 9, y - 42 + bob);
    ctx.stroke();

    drawBadge(ctx, x, y + 44, `$${lootValue.toLocaleString()}`, '#F5C451', '#0A1220', '#FFFBEB', 16);

    if (thief.crackProgress > 0) {
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(x, y, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * thief.crackProgress);
      ctx.stroke();
    }
  } else {
    drawBadge(ctx, x, y + 40, 'CLEARED', '#0A261C', '#34D399', '#10B981', 12);
  }
  ctx.restore();
}

export function renderPatrolGuardsAndAlert(ctx, s, lay) {
  const { worldX, worldY, worldScale } = lay;
  ctx.save();
  ctx.translate(worldX, worldY);
  ctx.scale(worldScale, worldScale);

  drawTurretCameras(ctx, s.cameras, s.time);
  drawArmoredGuards(ctx, s.guards);
  drawFloatingTags(ctx, s.floatingTags);

  ctx.restore();
}

function drawTurretCameras(ctx, cameras, time) {
  for (const cam of cameras) {
    const jammed = cam.jammedTimer > 0;
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);

    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(-5, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0B1220';
    ctx.strokeStyle = jammed ? '#64748B' : '#22D3EE';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(11, -6);
    ctx.lineTo(14, -4);
    ctx.lineTo(14, 4);
    ctx.lineTo(11, 6);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const blinkOn = Math.sin(cam.blinkPhase + time * 4) > 0;
    ctx.fillStyle = jammed ? '#475569' : blinkOn ? '#67E8F9' : '#22D3EE';
    ctx.beginPath();
    ctx.arc(13, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const ox = cam.labelOffsetX ?? 0;
    const oy = cam.labelOffsetY ?? -22;
    if (jammed) {
      drawBadge(ctx, cam.x + ox, cam.y + oy, 'JAMMED', '#082F49', '#67E8F9', '#22D3EE', 12);
    } else {
      drawBadge(ctx, cam.x + ox, cam.y + oy, cam.id, '#0A1220', '#A5F3FC', '#0891B2', 11);
    }
  }
}

function drawArmoredGuards(ctx, guards) {
  for (const g of guards) {
    ctx.save();
    ctx.translate(g.x, g.y);

    ctx.save();
    ctx.rotate(g.angle);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 5;

    ctx.fillStyle = '#1E1B2E';
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2.2;
    chamferRect(ctx, -11, -17, 16, 34, 6);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.stroke();

    ctx.fillStyle = '#C8A45C';
    ctx.fillRect(6, 7, 13, 5);
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(20, 9.5, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.arc(1, 0, 12.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0A1220';
    ctx.beginPath();
    ctx.arc(7, 0, 8, -0.85, 0.85);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#FEF2F2';
    ctx.font = `900 12px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.id, 0, 1);

    if (g.lockTimer > 0.02) {
      const ratio = Math.min(1, g.lockTimer / GUARD_LOCK_GRACE_SECONDS);
      ctx.strokeStyle = 'rgba(10, 18, 32, 0.92)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(0, -30, 15, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, -30, 15, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = ratio > 0.65 ? '#EF4444' : '#F59E0B';
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.arc(0, -30, 15, Math.PI, Math.PI + Math.PI * ratio);
      ctx.stroke();
    }

    if (g.statusTag) {
      drawBadge(ctx, 0, -32, g.statusTag, '#F5C451', '#0A1220', '#FFFBEB', 12);
    } else if (g.alertIcon) {
      ctx.fillStyle = g.alertIcon === '!' ? '#EF4444' : '#F59E0B';
      ctx.beginPath();
      ctx.arc(0, -30, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFBEB';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0A1220';
      ctx.font = `900 16px ${UI_FONT}`;
      ctx.fillText(g.alertIcon, 0, -29);
    }
    ctx.restore();
  }
}

function drawFloatingTags(ctx, tags) {
  for (const tag of tags) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, tag.timer / 0.6));
    drawBadge(ctx, tag.x, tag.y, tag.text, '#0A1220', tag.color, tag.color, 12);
    ctx.restore();
  }
}

function drawToolAimReticle(ctx, toolIndex, wx, wy) {
  const colors = ['#F5C451', '#22D3EE', '#67E8F9', '#F59E0B'];
  const radii = [56, 72, 54, 30];
  const color = colors[toolIndex] || '#C8A45C';
  const r = radii[toolIndex] || 42;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(wx, wy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(wx, wy, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(wx - 14, wy);
  ctx.lineTo(wx - 5, wy);
  ctx.moveTo(wx + 5, wy);
  ctx.lineTo(wx + 14, wy);
  ctx.moveTo(wx, wy - 14);
  ctx.lineTo(wx, wy - 5);
  ctx.moveTo(wx, wy + 5);
  ctx.lineTo(wx, wy + 14);
  ctx.stroke();
  ctx.restore();
}

function drawMiniBrackets(ctx, x, y, w, h, len) {
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

function drawBadge(ctx, cx, cy, text, bg, fg, border, fontSize) {
  ctx.save();
  ctx.font = `900 ${fontSize}px ${UI_FONT}`;
  const w = Math.ceil(ctx.measureText(text).width) + 18;
  const h = fontSize + 10;
  ctx.fillStyle = bg;
  chamferRect(ctx, cx - w * 0.5, cy - h * 0.5, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.8;
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
