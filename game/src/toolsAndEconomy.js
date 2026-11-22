export const TOOL_COSTS={coin:150,jammer:400,smoke:300,bypass:250};
export function deployPaidTool(state, id, tx, ty) {
  const playCue = state.playCue;
  const toolIndex = typeof id === 'number' ? id : TOOL_CATALOG.findIndex((t) => t.id === id);
  const tool = TOOL_CATALOG[toolIndex];
  if (!tool || state.screen !== 'playing') return { ok: false, reason: 'inactive' };
  if (state.purse < tool.cost) {
    pushFloatingTag(state, state.thief.x, state.thief.y - 26, 'LOW PURSE', '#FF2E4C');
    return { ok: false, reason: 'funds' };
  }

  state.selectedTool = toolIndex;
  const aim = resolveToolTarget(state, tool.id, tx, ty);

  if (tool.id === 'coin') {
    deductPurse(state, tool);
    state.coins.push({
      x: aim.x,
      y: aim.y,
      fromX: state.thief.x,
      fromY: state.thief.y,
      timer: 6.5,
      ripplePhase: 0,
    });
    state.ripples.push({ x: aim.x, y: aim.y, radius: 14, maxRadius: 230, alpha: 0.96, color: '#FACC15' });
    alertGuardsToNoise(state, aim.x, aim.y, 310, 5.4);
    if (playCue) playCue('coin');
    return { ok: true, tool: tool.id };
  }

  if (tool.id === 'jammer') {
    deductPurse(state, tool);
    const radius = 155;
    state.empWaves.push({ x: aim.x, y: aim.y, radius: 22, maxRadius: radius, timer: 2.6, maxTimer: 2.6 });
    let jammed = 0;
    for (const cam of state.cameras) {
      if (Math.hypot(cam.x - aim.x, cam.y - aim.y) <= radius + 20) {
        cam.jammedTimer = 8.0;
        cam.lockTimer = 0;
        jammed++;
      }
    }
    if (playCue) playCue('jammer');
    return { ok: true, tool: tool.id, jammed };
  }

  if (tool.id === 'smoke') {
    deductPurse(state, tool);
    state.smokes.push({ x: aim.x, y: aim.y, radius: 62, timer: 7.5, maxTimer: 7.5 });
    if (playCue) playCue('smoke');
    return { ok: true, tool: tool.id };
  }

  if (tool.id === 'bypass') {
    const laser = findNearestActiveLaser(state, state.thief.x, state.thief.y, 350);
    const lockedVent = state.vents.find((v) => !v.bypassed && Math.hypot(v.grate.x - state.thief.x, v.grate.y - state.thief.y) <= 280);
    if (!laser && !lockedVent) {
      pushFloatingTag(state, state.thief.x, state.thief.y - 26, 'NO RELAY IN RANGE', '#FF9F1C');
      return { ok: false, reason: 'no_target' };
    }
    deductPurse(state, tool);
    if (laser) {
      laser.permanentlyDisabled = true;
      laser.active = false;
      laser.hackProgress = 1;
      state.ripples.push({ x: laser.relay.x, y: laser.relay.y, radius: 10, maxRadius: 85, alpha: 0.9, color: '#FF9F1C' });
      pushFloatingTag(state, laser.relay.x, laser.relay.y - 22, `BYPASSED ${tool.priceTag}`, '#FF9F1C');
    } else if (lockedVent) {
      lockedVent.bypassed = true;
      pushFloatingTag(state, lockedVent.grate.x, lockedVent.grate.y - 22, `VENT OPEN ${tool.priceTag}`, '#60A5FA');
    }
    if (playCue) playCue('bypass');
    return { ok: true, tool: tool.id };
  }

  return { ok: false, reason: 'unknown' };
}

/* Tool deployment economy, purse deductions, named tool ledger formatting, palette, and timed fields. */
import { alertGuardsToNoise } from './guards.js';

export const UI_FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

export const PALETTE = {
  voidBg: '#060A12',
  stoneA: '#0B1628',
  stoneB: '#0E1D36',
  grout: '#172E52',
  vaultStoneA: '#13213B',
  vaultStoneB: '#182A4A',
  wallBase: '#1E2B42',
  wallBevel: '#3B5278',
  brass: '#E0B85A',
  brassBright: '#F5C451',
  ventMetal: '#17243B',
  ventTrim: '#94A3B8',
  safePad: '#172A4E',
  safeBracket: '#60A5FA',
  plinthFill: '#172A4E',
  guardCone: '#FF2E4C',
  guardEdge: '#FF6B81',
  camCone: '#22D3EE',
  camEdge: '#A5F3FC',
  relayWire: '#F59E0B',
  laser: '#FF1E6E',
  lootGold: '#FFD43B',
  exitGreen: '#10B981',
  smokeWhite: '#F8FAFC',
  jammerViolet: '#D946EF',
  coinGold: '#FACC15',
  hudObsidian: '#0B1221',
  hudIvory: '#F6EFE0',
  hudInk: '#080D1A',
};

export const TOOL_CATALOG = [
  { id: 'coin', key: '1', label: 'COIN', cost: TOOL_COSTS.coin, priceTag: '-$150', color: '#FACC15', icon: 'coin' },
  { id: 'jammer', key: '2', label: 'JAMMER', cost: TOOL_COSTS.jammer, priceTag: '-$400', color: '#D946EF', icon: 'emp' },
  { id: 'smoke', key: '3', label: 'SMOKE', cost: TOOL_COSTS.smoke, priceTag: '-$300', color: '#F8FAFC', icon: 'smoke' },
  { id: 'bypass', key: '4', label: 'BYPASS', cost: TOOL_COSTS.bypass, priceTag: '-$250', color: '#F59E0B', icon: 'wrench' },
];

export function stepDeployedTools(state, dt) {
  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const r = state.ripples[i];
    r.radius += (r.maxRadius - r.radius) * Math.min(1, dt * 4.2) + 40 * dt;
    r.alpha -= dt * 0.9;
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
    w.radius = 22 + (w.maxRadius - 22) * Math.min(1, progress * 1.15);
    if (w.timer <= 0) state.empWaves.splice(i, 1);
  }
  for (let i = state.floatingTags.length - 1; i >= 0; i--) {
    const tag = state.floatingTags[i];
    tag.y -= 16 * dt;
    tag.timer -= dt;
    if (tag.timer <= 0) state.floatingTags.splice(i, 1);
  }
}

export function pushFloatingTag(state, x, y, text, color) {
  state.floatingTags.push({ x, y, text, color, timer: 1.5, maxTimer: 1.5 });
}

export function formatUsedToolsLabel(state) {
  const list = state.usedTools || [];
  if (list.length === 0) return 'TOOLS USED';
  if (list.length <= 2) return list.join('+');
  return `${list.slice(0, 2).join('+')}+${list.length - 2}`;
}

function deductPurse(state, tool) {
  state.purse = Math.max(0, state.purse - tool.cost);
  state.toolsSpent += tool.cost;
  if (!state.spentParts) state.spentParts = [];
  if (!state.usedTools) state.usedTools = [];
  state.spentParts.push(tool.cost);
  state.usedTools.push(tool.label);
}

function resolveToolTarget(state, toolId, tx, ty) {
  const { thief } = state;
  if (Number.isFinite(tx) && Number.isFinite(ty)) {
    const dx = tx - thief.x;
    const dy = ty - thief.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = toolId === 'coin' ? 270 : toolId === 'jammer' ? 290 : 220;
    if (dist <= maxDist) return clampToWorld(tx, ty);
    return clampToWorld(thief.x + (dx / dist) * maxDist, thief.y + (dy / dist) * maxDist);
  }
  if (toolId === 'jammer') {
    const nearestCam = state.cameras
      .slice()
      .sort((a, b) => Math.hypot(a.x - thief.x, a.y - thief.y) - Math.hypot(b.x - thief.x, b.y - thief.y))[0];
    if (nearestCam && Math.hypot(nearestCam.x - thief.x, nearestCam.y - thief.y) < 340) {
      return { x: nearestCam.x, y: nearestCam.y + 18 };
    }
    return { x: thief.x, y: thief.y };
  }
  const throwDist = toolId === 'coin' ? 175 : 110;
  return clampToWorld(thief.x + Math.cos(thief.angle) * throwDist, thief.y + Math.sin(thief.angle) * throwDist);
}

function clampToWorld(x, y) {
  return { x: Math.max(34, Math.min(1006, x)), y: Math.max(34, Math.min(526, y)) };
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
