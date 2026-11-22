export function renderStealthActors(ctx, state, cam) {
  ctx.save();
  applyWorldTransform(ctx, cam);
  drawTurretCameras(ctx, state.cameras, state.time);
  drawCaughtLockBeam(ctx, state);
  drawArmoredGuards(ctx, state.guards);
  drawThiefAndLockRing(ctx, state);
  for (const tag of state.floatingTags) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, tag.timer / 0.6));
    drawWorldBadge(ctx, tag.x, tag.y, tag.text, '#0D1018', tag.color, tag.color, 12);
    ctx.restore();
  }
  if (state.screen === 'playing' && state.pointer && state.pointer.insideArena) {
    drawToolAimReticle(ctx, state.selectedTool, state.pointer.worldX, state.pointer.worldY);
  }
  ctx.restore();
}

export function renderLootPedestal(ctx, state, cam) {
  const { loot, thief, lootValue, time } = state;
  const x = loot.x;
  const y = loot.y;
  ctx.save();
  applyWorldTransform(ctx, cam);

  if (!thief.lootSecured) {
    const pulse = 0.9 + 0.1 * Math.sin(time * 4.2);
    const spot = ctx.createRadialGradient(x, y, 8, x, y, 80 * pulse);
    spot.addColorStop(0, 'rgba(255, 212, 59, 0.56)');
    spot.addColorStop(0.55, 'rgba(255, 212, 59, 0.16)');
    spot.addColorStop(1, 'rgba(255, 212, 59, 0)');
    ctx.fillStyle = spot;
    ctx.beginPath();
    ctx.arc(x, y, 80 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  drawOctagon(ctx, x, y, 32, '#151822', PALETTE.brass, 2.6);
  if (!thief.lootSecured) {
    ctx.fillStyle = '#B45309'; ctx.fillRect(x - 17, y + 3, 13, 7);
    ctx.fillStyle = '#F59E0B'; ctx.fillRect(x + 4, y + 3, 13, 7);
    ctx.fillStyle = PALETTE.lootGold;
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x + 17, y - 2); ctx.lineTo(x, y + 16); ctx.lineTo(x - 17, y - 2); ctx.closePath();
    ctx.fill(); ctx.stroke();
    drawWorldBadge(ctx, x, y + 44, `$${lootValue.toLocaleString()}`, PALETTE.lootGold, PALETTE.hudInk, '#FFFBEB', 16);
    if (thief.crackProgress > 0) {
      ctx.strokeStyle = PALETTE.exitGreen; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(x, y, 38, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * thief.crackProgress); ctx.stroke();
    }
  } else {
    drawOctagon(ctx, x, y, 21, '#090C14', '#64748B', 1.6);
    drawWorldBadge(ctx, x, y + 40, 'LOOTED', PALETTE.lootGold, PALETTE.hudInk, '#FFFBEB', 13);
  }
  ctx.restore();
}

/* Stealth thief silhouette, visible 0.75s on-floor lock-on ring, guards, CCTV turrets, and vault pedestal. */
import { chamferRect, drawOctagon, drawWorldBadge } from './arenaRenderer.js';
import { GUARD_LOCK_GRACE_SECONDS } from './guards.js';
import { applyWorldTransform } from './thiefControls.js';
import { PALETTE, TOOL_CATALOG, UI_FONT } from './toolsAndEconomy.js';

function drawCaughtLockBeam(ctx, state) {
  if (state.screen !== 'caught' || !state.caughtSource) return;
  const { x: sx, y: sy } = state.caughtSource;
  const { x: tx, y: ty } = state.thief;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty);
  ctx.strokeStyle = 'rgba(255, 46, 76, 0.48)'; ctx.lineWidth = 11; ctx.stroke();
  ctx.strokeStyle = PALETTE.guardCone; ctx.lineWidth = 3.8; ctx.setLineDash([10, 6]); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawThiefAndLockRing(ctx, state) {
  const { thief, time, lockRingRatio, screen } = state;
  ctx.save();
  ctx.translate(thief.x, thief.y);

  const ratio = screen === 'caught' ? 1 : lockRingRatio || 0;
  if (ratio > 0.02) {
    const r = 38;
    ctx.fillStyle = screen === 'caught' ? 'rgba(255, 46, 76, 0.18)' : 'rgba(255, 159, 28, 0.14)';
    ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 8.5;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = screen === 'caught' || ratio > 0.65 ? PALETTE.guardCone : PALETTE.coinGold;
    ctx.lineWidth = 6.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio); ctx.stroke();
    ctx.strokeStyle = '#FFFBEB'; ctx.lineWidth = 2.2;
    for (let k = 0; k < 4; k++) {
      const a = k * (Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8)); ctx.lineTo(Math.cos(a) * (r + 8), Math.sin(a) * (r + 8)); ctx.stroke();
    }
  }

  if (thief.inCover && screen !== 'caught') {
    ctx.strokeStyle = PALETTE.safeBracket; ctx.lineWidth = 2.6; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.arc(0, 0, 26 + Math.sin(time * 4) * 1.1, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.save();
  ctx.rotate(thief.angle);
  ctx.scale(1.36, 1.36);
  ctx.fillStyle = '#0D111B';
  ctx.strokeStyle = '#FFFDF7';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(8, -12); ctx.quadraticCurveTo(-5, -18, -14, -9); ctx.lineTo(-16, 0); ctx.lineTo(-14, 9);
  ctx.quadraticCurveTo(-5, 18, 8, 12); ctx.quadraticCurveTo(13, 0, 8, -12);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#FFFDF7';
  ctx.strokeStyle = PALETTE.brassBright;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(15, 0); ctx.lineTo(2, -9.5); ctx.lineTo(-11, -5.5); ctx.lineTo(-13, 0); ctx.lineTo(-11, 5.5); ctx.lineTo(2, 9.5);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  ctx.fillStyle = PALETTE.brassBright;
  ctx.beginPath(); ctx.arc(4, 0, 3, 0, Math.PI * 2); ctx.fill();
  if (thief.lootSecured) {
    ctx.fillStyle = PALETTE.lootGold; ctx.strokeStyle = '#FFFBEB'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-8, -7); ctx.lineTo(-1, 0); ctx.lineTo(-8, 7); ctx.lineTo(-16, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
}

function drawTurretCameras(ctx, cameras, time) {
  for (const cam of cameras) {
    const jammed = cam.jammedTimer > 0;
    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = '#0D1018';
    ctx.strokeStyle = jammed ? PALETTE.jammerViolet : PALETTE.camCone;
    ctx.lineWidth = 2.1;
    ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(14, -4); ctx.lineTo(14, 4); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = jammed ? PALETTE.jammerViolet : Math.sin(cam.blinkPhase + time * 4) > 0 ? '#A5F3FC' : PALETTE.camCone;
    ctx.beginPath(); ctx.arc(13, 0, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    const ox = cam.labelOffsetX ?? 0;
    const oy = cam.labelOffsetY ?? -22;
    if (jammed) drawWorldBadge(ctx, cam.x + ox, cam.y + oy, 'JAMMED', PALETTE.jammerViolet, '#FFFFFF', '#FDF4FF', 15);
    else drawWorldBadge(ctx, cam.x + ox, cam.y + oy, cam.id, '#081421', '#A5F3FC', PALETTE.camCone, 11);
  }
}

function drawArmoredGuards(ctx, guards) {
  for (const g of guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.save();
    ctx.rotate(g.angle);
    chamferRect(ctx, -11, -17, 16, 34, 6);
    ctx.fillStyle = '#1D1824'; ctx.fill();
    ctx.strokeStyle = PALETTE.guardEdge; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.fillStyle = PALETTE.brass; ctx.fillRect(6, -2.5, 14, 5);
    ctx.fillStyle = '#FEF08A'; ctx.beginPath(); ctx.arc(21, 0, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#991B1B'; ctx.beginPath(); ctx.arc(1, 0, 12.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FDA4AF'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#FFF1F2';
    ctx.font = `900 13px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.id, 0, 1);

    if (g.lockTimer > 0.02) {
      const ratio = Math.min(1, g.lockTimer / GUARD_LOCK_GRACE_SECONDS);
      ctx.strokeStyle = ratio > 0.65 ? PALETTE.guardCone : PALETTE.coinGold;
      ctx.lineWidth = 4.4;
      ctx.beginPath(); ctx.arc(0, -30, 14, Math.PI, Math.PI + Math.PI * ratio); ctx.stroke();
    }
    if (g.statusTag) {
      const hot = g.statusTag.includes('!') || g.statusTag === 'LOCKDOWN';
      drawWorldBadge(ctx, 0, -34, g.statusTag, hot ? PALETTE.guardCone : PALETTE.coinGold, hot ? '#FFFFFF' : PALETTE.hudInk, '#FFFBEB', 12);
    } else if (g.alertIcon) {
      ctx.fillStyle = g.alertIcon === '!' ? PALETTE.guardCone : PALETTE.coinGold;
      ctx.beginPath(); ctx.arc(0, -30, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#FFFBEB'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = g.alertIcon === '!' ? '#FFFFFF' : PALETTE.hudInk;
      ctx.font = `900 16px ${UI_FONT}`;
      ctx.fillText(g.alertIcon, 0, -29);
    }
    ctx.restore();
  }
}

function drawToolAimReticle(ctx, toolIndex, wx, wy) {
  const tool = TOOL_CATALOG[toolIndex] || TOOL_CATALOG[0];
  ctx.save();
  ctx.strokeStyle = tool.color;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.arc(wx, wy, tool.id === 'coin' ? 54 : tool.id === 'jammer' ? 72 : 52, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(wx, wy, 9, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
