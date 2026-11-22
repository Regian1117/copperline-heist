export function computeGetawayPayout(state) {
  const loot = state.lootValue;
  const tools = state.toolsSpent;
  const cleanZero = !state.wasSpotted;
  const ghostBonus = cleanZero ? GHOST_BONUS_CLEAN : 2000;
  const bonusLabel = cleanZero ? 'ZERO-CAUGHT' : 'ESCAPE BONUS';
  const toolsLabel = formatUsedToolsLabel(state);
  const netTake = loot + ghostBonus - tools;
  return { loot, tools, ghostBonus, bonusLabel, toolsLabel, netTake };
}

export function updateAlarmAndSuspicion(s, dt, d, a, c) {
  const { thief, loot, exit } = s;

  if (d.caughtBy || d.caughtByCamera) {
    const culprit = d.caughtBy ? d.caughtBy.label : d.caughtByCamera.id;
    const src = d.caughtBy || d.caughtByCamera;
    triggerCaughtState(s, culprit, { x: src.x, y: src.y }, c);
    return { vaultCracked: false, escaped: false, caught: true };
  }

  if (d.laserTripped) {
    s.alarm = Math.min(100, s.alarm + 52);
    s.peakAlarm = Math.max(s.peakAlarm, s.alarm);
    s.wasSpotted = true;
    alertGuardsToNoise(s, thief.x, thief.y, 420, 4.5);
    pushFloatingTag(s, thief.x, thief.y - 26, 'LASER TRIPPED!', '#FF1E6E');
    if (s.alarm >= 100) {
      triggerCaughtState(s, 'LASER GRID', { x: d.laserTripped.x1, y: d.laserTripped.y1 }, c);
      return { vaultCracked: false, escaped: false, caught: true };
    }
    if (c) c('caught');
  }

  if (d.anySeeing || d.cameraSeeing) {
    s.alarm = Math.min(99, s.alarm + dt * 62);
  } else {
    const investigating = s.guards.some((g) => g.state === 'INVESTIGATE');
    const floorCap = s.lockdown ? 62 : investigating ? 26 : 0;
    if (s.alarm > floorCap) {
      s.alarm = Math.max(floorCap, s.alarm - dt * 11.5);
    }
  }

  s.peakAlarm = Math.max(s.peakAlarm, s.alarm);
  s.alarmState = resolveAlarmWord(s);

  const speed = Math.hypot(thief.vx, thief.vy);
  if (speed > 25 && !thief.sneaking && !thief.inVent) {
    thief.stepTimer += dt;
    if (thief.stepTimer >= 0.36) {
      thief.stepTimer = 0;
      s.ripples.push({ x: thief.x, y: thief.y, radius: 10, maxRadius: 88, alpha: 0.48, color: '#60A5FA' });
      alertGuardsToNoise(s, thief.x, thief.y, 92, 2.2);
      if (c) c('step');
    }
  } else {
    thief.stepTimer = Math.min(thief.stepTimer, 0.2);
  }

  let vaultCracked = false;
  let escaped = false;
  if (!thief.lootSecured) {
    const distLoot = Math.hypot(thief.x - loot.x, thief.y - loot.y);
    if (distLoot <= 54 && a) {
      thief.crackProgress = Math.min(1, thief.crackProgress + dt / VAULT_CRACK_SECONDS);
      if (thief.crackProgress >= 1) {
        thief.lootSecured = true;
        thief.crackProgress = 1;
        vaultCracked = true;
        s.ripples.push({ x: loot.x, y: loot.y, radius: 12, maxRadius: 120, alpha: 0.92, color: '#FFD43B' });
        pushFloatingTag(s, loot.x, loot.y - 32, `LOOT +$${s.lootValue.toLocaleString()}`, '#FFD43B');
        if (c) c('vault');
      }
    } else {
      thief.crackProgress = Math.max(0, thief.crackProgress - dt * 1.4);
    }
  } else if (pointInRect(thief.x, thief.y, exit)) {
    s.screen = 'getaway';
    s.alarmState = s.lockdown ? 'LOCKDOWN' : s.alarm < 30 ? 'CLEAN' : 'ESCAPED';
    s.payout = computeGetawayPayout(s);
    escaped = true;
    if (c) c('getaway');
  }

  return { vaultCracked, escaped, caught: false };
}

/* Suspicion meter dynamics, caught state transitions, vault cracking, and getaway payout math. */
import { alertGuardsToNoise } from './guards.js';
import { formatUsedToolsLabel, pushFloatingTag } from './toolsAndEconomy.js';

const VAULT_CRACK_SECONDS = 0.65;
const GHOST_BONUS_CLEAN = 4500;

export function resolveAlarmWord(state) {
  if (state.screen === 'caught') return 'CAUGHT';
  if (state.lockdown) return 'LOCKDOWN';
  if (state.screen === 'getaway') return state.alarm < 30 ? 'CLEAN' : 'ESCAPED';
  if (state.alarm >= 60) return 'ALERT';
  if (state.alarm >= 25) return 'SUSPICIOUS';
  return 'CALM';
}

export function triggerCaughtState(state, culpritLabel, sourcePoint, playCue) {
  state.alarm = 100;
  state.peakAlarm = 100;
  state.wasSpotted = true;
  state.lockRingRatio = 1;
  state.lockRingSource = sourcePoint;
  state.alarmState = 'CAUGHT';
  state.screen = 'caught';
  state.caughtBy = culpritLabel;
  state.caughtSource = sourcePoint;
  if (playCue) playCue('caught');
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
