/* Costed heist tool catalog, purse accounting, and tactical tool deployment effects. */

import { alertGuardsToNoise } from './guards.js';

export const STARTING_PURSE = 1200;

export const TOOL_CATALOG = [
  { id: 'coin', key: '1', label: 'COIN', cost: 150, priceTag: '-$150', color: '#FFD166', icon: 'coin' },
  { id: 'jammer', key: '2', label: 'JAMMER', cost: 400, priceTag: '-$400', color: '#22D3EE', icon: 'emp' },
  { id: 'smoke', key: '3', label: 'SMOKE', cost: 300, priceTag: '-$300', color: '#CBD5E1', icon: 'smoke' },
  { id: 'bypass', key: '4', label: 'BYPASS', cost: 250, priceTag: '-$250', color: '#F59E0B', icon: 'wrench' },
];

export function deployPaidTool(state, toolIndex, targetX, targetY, playCue) {
  const tool = TOOL_CATALOG[toolIndex];
  if (!tool || state.screen !== 'playing') return { ok: false, reason: 'inactive' };
  if (state.purse < tool.cost) {
    pushFloatingTag(state, state.thief.x, state.thief.y - 26, 'LOW PURSE', '#EF4444');
    return { ok: false, reason: 'funds' };
  }

  state.selectedTool = toolIndex;
  const aim = resolveToolTarget(state, tool.id, targetX, targetY);

  if (tool.id === 'coin') {
    deductPurse(state, tool.cost);
    state.coins.push({
      x: aim.x,
      y: aim.y,
      fromX: state.thief.x,
      fromY: state.thief.y,
      timer: 5.5,
      ripplePhase: 0,
    });
    state.ripples.push({ x: aim.x, y: aim.y, radius: 14, maxRadius: 215, alpha: 0.95, color: '#FFD166' });
    alertGuardsToNoise(state, aim.x, aim.y, 290, 4.4);
    pushFloatingTag(state, aim.x, aim.y - 20, `COIN ${tool.priceTag}`, '#FFD166');
    if (playCue) playCue('coin');
    return { ok: true, tool: tool.id };
  }

  if (tool.id === 'jammer') {
    deductPurse(state, tool.cost);
    const radius = 260;
    state.empWaves.push({ x: aim.x, y: aim.y, radius: 18, maxRadius: radius, timer: 1.4, maxTimer: 1.4 });
    let jammed = 0;
    for (const cam of state.cameras) {
      if (Math.hypot(cam.x - aim.x, cam.y - aim.y) <= radius + 40) {
        cam.jammedTimer = 7.0;
        cam.lockTimer = 0;
        jammed++;
      }
    }
    pushFloatingTag(state, aim.x, aim.y - 24, jammed > 0 ? `EMP ${tool.priceTag}` : `JAMMER ${tool.priceTag}`, '#22D3EE');
    if (playCue) playCue('jammer');
    return { ok: true, tool: tool.id, jammed };
  }

  if (tool.id === 'smoke') {
    deductPurse(state, tool.cost);
    state.smokes.push({
      x: aim.x,
      y: aim.y,
      radius: 64,
      timer: 6.0,
      maxTimer: 6.0,
    });
    pushFloatingTag(state, aim.x, aim.y - 30, `SMOKE ${tool.priceTag}`, '#E2E8F0');
    if (playCue) playCue('smoke');
    return { ok: true, tool: tool.id };
  }

  if (tool.id === 'bypass') {
    const laser = findNearestActiveLaser(state, state.thief.x, state.thief.y, 340);
    const lockedVent = state.vents.find((v) => !v.bypassed && Math.hypot(v.grate.x - state.thief.x, v.grate.y - state.thief.y) <= 280);
    if (!laser && !lockedVent) {
      pushFloatingTag(state, state.thief.x, state.thief.y - 26, 'NO RELAY IN RANGE', '#F59E0B');
      return { ok: false, reason: 'no_target' };
    }
    deductPurse(state, tool.cost);
    if (laser) {
      laser.permanentlyDisabled = true;
      laser.active = false;
      laser.hackProgress = 1;
      state.ripples.push({ x: laser.relay.x, y: laser.relay.y, radius: 10, maxRadius: 85, alpha: 0.9, color: '#F59E0B' });
      pushFloatingTag(state, laser.relay.x, laser.relay.y - 22, `BYPASSED ${tool.priceTag}`, '#F59E0B');
    } else if (lockedVent) {
      lockedVent.bypassed = true;
      pushFloatingTag(state, lockedVent.grate.x, lockedVent.grate.y - 22, `VENT OPEN ${tool.priceTag}`, '#60A5FA');
    }
    if (playCue) playCue('bypass');
    return { ok: true, tool: tool.id };
  }

  return { ok: false, reason: 'unknown' };
}

export function stepToolEffects(state, dt) {
  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const r = state.ripples[i];
    r.radius += (r.maxRadius - r.radius) * Math.min(1, dt * 4.5) + 42 * dt;
    r.alpha -= dt * 0.95;
    if (r.alpha <= 0.02 || r.radius >= r.maxRadius) state.ripples.splice(i, 1);
  }
  for (let i = state.coins.length - 1; i >= 0; i--) {
    const c = state.coins[i];
    c.timer -= dt;
    c.ripplePhase += dt * 3.4;
    if (c.timer <= 0) state.coins.splice(i, 1);
  }
  for (let i = state.smokes.length - 1; i >= 0; i--) {
    const s = state.smokes[i];
    s.timer -= dt;
    if (s.timer <= 0) state.smokes.splice(i, 1);
  }
  for (let i = state.empWaves.length - 1; i >= 0; i--) {
    const w = state.empWaves[i];
    w.timer -= dt;
    const progress = 1 - Math.max(0, w.timer / w.maxTimer);
    w.radius = 18 + (w.maxRadius - 18) * Math.min(1, progress * 1.45);
    if (w.timer <= 0) state.empWaves.splice(i, 1);
  }
  for (let i = state.floatingTags.length - 1; i >= 0; i--) {
    const tag = state.floatingTags[i];
    tag.y -= 18 * dt;
    tag.timer -= dt;
    if (tag.timer <= 0) state.floatingTags.splice(i, 1);
  }
}

export function pushFloatingTag(state, x, y, text, color) {
  state.floatingTags.push({ x, y, text, color, timer: 1.5, maxTimer: 1.5 });
}

function deductPurse(state, cost) {
  state.purse = Math.max(0, state.purse - cost);
  state.toolsSpent += cost;
}

function resolveToolTarget(state, toolId, tx, ty) {
  const { thief } = state;
  if (Number.isFinite(tx) && Number.isFinite(ty)) {
    const dx = tx - thief.x;
    const dy = ty - thief.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = toolId === 'coin' ? 230 : toolId === 'smoke' ? 190 : 180;
    if (dist <= maxDist) return clampToWorld(tx, ty);
    return clampToWorld(thief.x + (dx / dist) * maxDist, thief.y + (dy / dist) * maxDist);
  }
  if (toolId === 'jammer') {
    const nearestCam = state.cameras
      .slice()
      .sort((a, b) => Math.hypot(a.x - thief.x, a.y - thief.y) - Math.hypot(b.x - thief.x, b.y - thief.y))[0];
    if (nearestCam && Math.hypot(nearestCam.x - thief.x, nearestCam.y - thief.y) < 320) {
      return { x: (thief.x + nearestCam.x) * 0.5, y: (thief.y + nearestCam.y) * 0.5 };
    }
    return { x: thief.x, y: thief.y };
  }
  const throwDist = toolId === 'coin' ? 165 : 105;
  return clampToWorld(thief.x + Math.cos(thief.angle) * throwDist, thief.y + Math.sin(thief.angle) * throwDist);
}

function clampToWorld(x, y) {
  return {
    x: Math.max(34, Math.min(1006, x)),
    y: Math.max(34, Math.min(526, y)),
  };
}

function findNearestActiveLaser(state, x, y, maxRange) {
  let best = null;
  let bestDist = maxRange;
  for (const l of state.lasers) {
    if (!l.active) continue;
    const d = Math.hypot(l.relay.x - x, l.relay.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = l;
    }
  }
  return best;
}
