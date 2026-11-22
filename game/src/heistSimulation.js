export function stepHeistSimulation(state, input, dt) {
  state.time += dt;
  if (state.lockdown) state.lockdownTimer += dt;

  const moveInput = input.move || { mx: 0, my: 0, sneaking: false };
  const interacting = Boolean(input.interacting);
  state.holdingInteract = interacting;

  moveThiefThroughCover(state, moveInput, dt);

  if (state.motionTrail) {
    for (let i = state.motionTrail.length - 1; i >= 0; i--) {
      state.motionTrail[i].age += dt;
      if (state.motionTrail[i].age > 1.05) state.motionTrail.splice(i, 1);
    }
    if (Math.hypot(state.thief.vx, state.thief.vy) > 12) {
      const prev = state.motionTrail[state.motionTrail.length - 1];
      if (!prev || Math.hypot(state.thief.x - prev.x, state.thief.y - prev.y) >= 13) {
        state.motionTrail.push({ x: state.thief.x, y: state.thief.y, age: 0 });
        if (state.motionTrail.length > 18) state.motionTrail.shift();
      }
    }
  }

  if (state.thief.lootSecured) {
    const trail = state.escapeTrail;
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(state.thief.x - last.x, state.thief.y - last.y) >= 16) {
      trail.push({ x: state.thief.x, y: state.thief.y });
    }
  }

  stepGuardPatrols(state, dt);
  const guardRes = resolveGuardAlertness(state, dt);
  const camRes = stepSweepingCameras(state, dt);
  const laserRes = stepLaserGridsAndRelays(state, dt);
  if (laserRes.relayHacked && state.playCue) state.playCue('bypass');
  stepDeployedTools(state, dt);

  if (guardRes.maxLockRatio >= camRes.maxLockRatio) {
    state.lockRingRatio = guardRes.maxLockRatio;
    state.lockRingSource = guardRes.lockSource;
  } else {
    state.lockRingRatio = camRes.maxLockRatio;
    state.lockRingSource = camRes.lockSource;
  }

  const prevAlarm = state.alarm;
  const outcome = updateAlarmAndSuspicion(
    state,
    dt,
    {
      anySeeing: guardRes.anySeeing,
      caughtBy: guardRes.caughtBy,
      cameraSeeing: camRes.cameraSeeing,
      caughtByCamera: camRes.caughtByCamera,
      laserTripped: laserRes.laserTripped,
    },
    interacting,
    state.playCue,
  );

  if (outcome.vaultCracked) triggerLockdownEscape(state);
  if (outcome.caught) triggerCameraShake(state.cam, 11, 0.45);
  else if (state.alarm - prevAlarm >= 20) triggerCameraShake(state.cam, 8, 0.3);

  const minGuardDist = computeNearestDangerDist(state);
  updateTensionHeartbeat(state.alarm, minGuardDist, state.lockRingRatio, state.lockdown, dt);
  return outcome;
}

export function triggerLockdownEscape(state) {
  state.lockdown = true;
  state.lockdownTimer = 0;
  state.alarmState = 'LOCKDOWN';
  state.alarm = Math.max(state.alarm, 62);
  state.peakAlarm = Math.max(state.peakAlarm, state.alarm);
  state.escapeTrail = [{ x: state.loot.x, y: state.loot.y }];

  for (const g of state.guards) {
    if (g.state !== 'SPOTTED') {
      g.state = 'LOCKDOWN';
      g.alertIcon = '!';
      g.statusTag = 'LOCKDOWN';
      g.lockdownTarget = null;
    }
  }

  triggerCameraShake(state.cam, 7, 0.4);
  pushFloatingTag(state, state.loot.x, state.loot.y - 54, 'LOCKDOWN! EXIT →', '#FF2E4C');
  if (state.playCue) state.playCue('lockdown');
}

/* Core live simulation step and lockdown escape trigger (zero scripted showcase branches). */
import { updateAlarmAndSuspicion } from './alarmAndGetaway.js';
import { stepLaserGridsAndRelays, stepSweepingCameras } from './camerasAndLasers.js';
import { resolveGuardAlertness, stepGuardPatrols } from './guards.js';
import { updateTensionHeartbeat } from './heistAudio.js';
import { moveThiefThroughCover, triggerCameraShake } from './thiefControls.js';
import { pushFloatingTag, stepDeployedTools } from './toolsAndEconomy.js';

function computeNearestDangerDist(state) {
  let minD = Infinity;
  const { thief } = state;
  for (const g of state.guards) {
    const d = Math.hypot(thief.x - g.x, thief.y - g.y);
    if (d < minD) minD = d;
  }
  for (const c of state.cameras) {
    if (c.jammedTimer > 0) continue;
    const d = Math.hypot(thief.x - c.x, thief.y - c.y);
    if (d < minD) minD = d;
  }
  return minD;
}
