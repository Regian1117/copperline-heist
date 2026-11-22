/* Continuous alarm progression, acoustic footsteps, vault cracking, and getaway payout math. */

import { alertGuardsToNoise } from './guards.js';
import { pushFloatingTag } from './toolsAndEconomy.js';

export const VAULT_CRACK_SECONDS = 0.72;

export function updateAlarmAndSuspicion(state, dt, detection, holdingInteract, playCue) {
  const { thief, loot, exit } = state;

  if (detection.caughtBy || detection.caughtByCamera) {
    const culprit = detection.caughtBy ? detection.caughtBy.label : detection.caughtByCamera.id;
    const src = detection.caughtBy || detection.caughtByCamera;
    triggerCaughtState(state, culprit, { x: src.x, y: src.y }, playCue);
    return;
  }

  if (detection.laserTripped) {
    state.alarm = Math.min(100, state.alarm + 52);
    state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
    state.wasSpotted = true;
    alertGuardsToNoise(state, thief.x, thief.y, 420, 4.5);
    pushFloatingTag(state, thief.x, thief.y - 26, 'LASER TRIPPED!', '#FB7185');
    if (state.alarm >= 100) {
      triggerCaughtState(state, 'LASER GRID', { x: detection.laserTripped.x1, y: detection.laserTripped.y1 }, playCue);
      return;
    }
    if (playCue) playCue('caught');
  }

  if (detection.anySeeing || detection.cameraSeeing) {
    state.alarm = Math.min(99, state.alarm + dt * 62);
  } else {
    const investigating = state.guards.some((g) => g.state === 'INVESTIGATE');
    const floorCap = investigating ? 26 : 0;
    if (state.alarm > floorCap) {
      state.alarm = Math.max(floorCap, state.alarm - dt * 11.5);
    }
  }

  state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
  state.alarmState = resolveAlarmWord(state.alarm, state.screen);

  const speed = Math.hypot(thief.vx, thief.vy);
  if (speed > 25 && !thief.sneaking && !thief.inVent) {
    thief.stepTimer += dt;
    if (thief.stepTimer >= 0.36) {
      thief.stepTimer = 0;
      state.ripples.push({ x: thief.x, y: thief.y, radius: 10, maxRadius: 88, alpha: 0.52, color: '#7DD3FC' });
      alertGuardsToNoise(state, thief.x, thief.y, 92, 2.2);
      if (playCue) playCue('step');
    }
  } else {
    thief.stepTimer = Math.min(thief.stepTimer, 0.2);
  }

  if (!thief.lootSecured) {
    const distLoot = Math.hypot(thief.x - loot.x, thief.y - loot.y);
    if (distLoot <= 52 && holdingInteract) {
      thief.crackProgress = Math.min(1, thief.crackProgress + dt / VAULT_CRACK_SECONDS);
      if (thief.crackProgress >= 1) {
        thief.lootSecured = true;
        thief.crackProgress = 1;
        state.ripples.push({ x: loot.x, y: loot.y, radius: 12, maxRadius: 115, alpha: 0.9, color: '#FFD166' });
        pushFloatingTag(state, loot.x, loot.y - 32, `LOOT +$${state.lootValue.toLocaleString()}`, '#FFD166');
        if (playCue) playCue('vault');
      }
    } else {
      thief.crackProgress = Math.max(0, thief.crackProgress - dt * 1.4);
    }
  } else if (pointInRect(thief.x, thief.y, exit)) {
    state.screen = 'getaway';
    state.alarmState = state.alarm < 30 ? 'CLEAN' : 'ESCAPED';
    state.payout = evaluateGetawayPayoff(state);
    if (playCue) playCue('getaway');
  }
}

export function evaluateGetawayPayoff(state) {
  const loot = state.lootValue;
  const tools = state.toolsSpent;
  const ghostBonus = !state.wasSpotted && state.peakAlarm < 35 ? 4500 : state.peakAlarm < 65 ? 2000 : 0;
  const netTake = loot + ghostBonus - tools;
  return { loot, tools, ghostBonus, netTake };
}

export function resolveAlarmWord(alarm, screen) {
  if (screen === 'caught') return 'CAUGHT';
  if (screen === 'getaway') return alarm < 30 ? 'CLEAN' : 'ESCAPED';
  if (alarm >= 60) return 'ALERT';
  if (alarm >= 25) return 'SUSPICIOUS';
  return 'CALM';
}

export function triggerCaughtState(state, culpritLabel, sourcePoint, playCue) {
  state.alarm = 100;
  state.peakAlarm = 100;
  state.wasSpotted = true;
  state.alarmState = 'CAUGHT';
  state.screen = 'caught';
  state.caughtBy = culpritLabel;
  state.caughtSource = sourcePoint;
  if (playCue) playCue('caught');
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
