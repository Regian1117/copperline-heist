export async function startCopperlineHeist() {
  const canvas = document.getElementById('heist-canvas');
  const statusEl = document.getElementById('status');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hitBoxes = [];
  const cam = createTacticalCamera();

  activeState = initFloor(0, 'title', cam);
  resizeCameraCanvas(cam, canvas);
  updateTacticalCamera(cam, activeState, 0);

  let virtualHackTimer = 0;
  let statusClock = 0;
  const syncPlayStatus = () => {
    announce(statusEl, `${activeState.code} ${activeState.lockdown ? 'LOCKDOWN' : 'PLAYING'} PURSE $${activeState.purse} ALARM ${Math.round(activeState.alarm)}%`);
  };

  const controls = readKeyboardAndMouseControls(canvas, () => cam, {
    onToolKey(toolIdx, pointer) {
      if (activeState.screen !== 'playing' || activeState.paused) return;
      const tx = pointer.insideArena ? pointer.worldX : NaN;
      const ty = pointer.insideArena ? pointer.worldY : NaN;
      deployPaidTool(activeState, toolIdx, tx, ty);
      syncPlayStatus();
    },
    onToggleRoutes() {
      if (activeState.screen !== 'playing') return;
      activeState.showRoutes = !activeState.showRoutes;
      const activeRoutes = computeFloorRoutes(activeState);
      announce(statusEl, activeRoutes.length > 0 ? 'Route blueprint enabled' : 'Route blueprint hidden');
    },
    onToggleZoom() {
      if (activeState.screen !== 'playing') return;
      const z = toggleTacticalZoom(cam);
      playHeistCue('zoom');
      announce(statusEl, z ? `${activeState.code} ZOOM 1.20x PURSE $${activeState.purse} ALARM ${Math.round(activeState.alarm)}%` : 'Full diorama view');
    },
    onTogglePause() {
      if (activeState.screen === 'playing') activeState.paused = !activeState.paused;
    },
    onRetry() {
      if (activeState.screen === 'playing' || activeState.screen === 'caught' || activeState.screen === 'getaway') {
        cam.zoomed = false;
        activeState = initFloor(activeState.floorIndex, 'playing', cam);
        syncPlayStatus();
      }
    },
    onToggleMute() {
      const m = setAudioMuted(!isAudioMuted());
      announce(statusEl, m ? 'Audio muted' : 'Audio enabled');
    },
    onPrimaryConfirm() {
      if (activeState.screen === 'title') {
        switchHeistScreen(activeState, 'playing');
        syncPlayStatus();
      } else if (activeState.screen === 'caught') {
        cam.zoomed = false;
        activeState = initFloor(activeState.floorIndex, 'playing', cam);
        syncPlayStatus();
      } else if (activeState.screen === 'getaway') {
        cam.zoomed = false;
        activeState = initFloor((activeState.floorIndex + 1) % FLOOR_COUNT, 'playing', cam);
        syncPlayStatus();
      }
    },
    onSpacePress() {
      if (activeState.screen === 'title') {
        switchHeistScreen(activeState, 'playing');
        syncPlayStatus();
      }
    },
    onCanvasClick(sx, sy, wx, wy, insideArena) {
      const hit = hitBoxes.find((b) => sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h);
      if (hit) {
        if (hit.type === 'hack') virtualHackTimer = 0.8;
        else handleHitBox(hit, cam, statusEl);
        return;
      }
      if (activeState.screen === 'playing' && !activeState.paused && insideArena) {
        deployPaidTool(activeState, activeState.selectedTool, wx, wy);
        syncPlayStatus();
      }
    },
  });

  let lastTs = performance.now();
  const loop = (ts) => {
    const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;
    resizeCameraCanvas(cam, canvas);

    if (activeState.screen === 'title') {
      activeState.time += dt;
      stepGuardPatrols(activeState, dt);
      stepSweepingCameras(activeState, dt);
    } else if (activeState.screen === 'playing' && !activeState.paused) {
      if (virtualHackTimer > 0) virtualHackTimer = Math.max(0, virtualHackTimer - dt);
      const prevScreen = activeState.screen;
      const outcome = stepHeistSimulation(
        activeState,
        { move: controls.getMoveInput(), interacting: controls.isInteracting() || virtualHackTimer > 0 },
        dt,
      );
      statusClock += dt;
      if (outcome.vaultCracked) {
        statusClock = 0;
        announce(statusEl, `${activeState.code} LOCKDOWN PURSE $${activeState.purse} ALARM ${Math.round(activeState.alarm)}%`);
      } else if (activeState.screen !== prevScreen) {
        statusClock = 0;
        announce(statusEl, `${activeState.code} ${activeState.screen.toUpperCase()} ${activeState.alarmState} PURSE $${activeState.purse} ALARM ${Math.round(activeState.alarm)}%`);
      } else if (statusClock >= 0.25) {
        statusClock = 0;
        syncPlayStatus();
      }
    } else {
      activeState.time += dt * 0.35;
    }

    updateTacticalCamera(cam, activeState, dt);
    renderFrame(ctx, activeState, cam, hitBoxes, controls.pointer);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

export function switchHeistScreen(s, next) {
  s.screen = next;
  s.paused = false;
  return s;
}

/* COPPERLINE bootstrap: imports 10 core simulation modules first, then 5 lean renderers. */
import { FLOOR_COUNT, buildAuthoredVault } from './authoredVaults.js';
import { computeFloorRoutes } from './routesAndCover.js';
import { computeOccludedVisionCone } from './visionCones.js';
import { stepGuardPatrols } from './guards.js';
import { stepSweepingCameras } from './camerasAndLasers.js';
import { deployPaidTool } from './toolsAndEconomy.js';
import {
  createTacticalCamera,
  readKeyboardAndMouseControls,
  resizeCameraCanvas,
  toggleTacticalZoom,
  updateTacticalCamera,
} from './thiefControls.js';
import { isAudioMuted, playHeistCue, setAudioMuted } from './heistAudio.js';
import { stepHeistSimulation } from './heistSimulation.js';
import { renderLaserRelaysAndExit, renderVaultDiorama, renderWallsAndCover } from './arenaRenderer.js';
import {
  renderAcousticAndSmokeFields,
  renderCameraSweepCones,
  renderGuardVisionCones,
  renderOcclusionCutRims,
} from './coneRenderer.js';
import { renderLootPedestal, renderStealthActors } from './actorRenderer.js';
import { renderTacticalHud } from './hudRenderer.js';
import { renderGetawayOverlay } from './getawayOverlay.js';

function initFloor(index, screen, cam) {
  const s = buildAuthoredVault(index);
  s.playCue = playHeistCue;
  s.cam = cam;
  switchHeistScreen(s, screen);
  for (const g of s.guards) {
    g.conePoly = computeOccludedVisionCone(g.x, g.y, g.angle, g.fov * 0.5, g.range, s.wallSegments, s.smokes);
  }
  for (const c of s.cameras) {
    c.conePoly = computeOccludedVisionCone(c.x, c.y, c.angle, c.fov * 0.5, c.range, s.wallSegments, s.smokes);
  }
  return s;
}

function handleHitBox(hit, cam, statusEl) {
  if (hit.type === 'start') {
    switchHeistScreen(activeState, 'playing');
    announce(statusEl, `${activeState.code} PLAYING PURSE $${activeState.purse} ALARM 0%`);
  } else if (hit.type === 'floor') {
    cam.zoomed = false;
    activeState = initFloor(hit.index, 'title', cam);
  } else if (hit.type === 'retry') {
    cam.zoomed = false;
    activeState = initFloor(activeState.floorIndex, 'playing', cam);
    announce(statusEl, `${activeState.code} PLAYING PURSE $${activeState.purse} ALARM 0%`);
  } else if (hit.type === 'next') {
    cam.zoomed = false;
    activeState = initFloor((activeState.floorIndex + 1) % FLOOR_COUNT, 'playing', cam);
    announce(statusEl, `${activeState.code} PLAYING PURSE $${activeState.purse} ALARM 0%`);
  } else if (hit.type === 'resume') {
    activeState.paused = false;
  } else if (hit.type === 'routes') {
    activeState.showRoutes = !activeState.showRoutes;
  } else if (hit.type === 'sneak') {
    activeState.thief.sneaking = !activeState.thief.sneaking;
  } else if (hit.type === 'zoom') {
    if (activeState.screen === 'playing') {
      toggleTacticalZoom(cam);
      playHeistCue('zoom');
    }
  } else if (hit.type === 'mute') {
    const m = setAudioMuted(!isAudioMuted());
    announce(statusEl, m ? 'Audio muted' : 'Audio enabled');
  } else if (hit.type === 'tool') {
    if (activeState.selectedTool === hit.index && activeState.screen === 'playing' && !activeState.paused) {
      deployPaidTool(activeState, hit.index, NaN, NaN);
    } else {
      activeState.selectedTool = hit.index;
    }
  }
}

function renderFrame(ctx, state, cam, hitBoxes, pointer) {
  state.pointer = pointer;
  state.cam = cam;
  ctx.save();
  ctx.setTransform(cam.dpr, 0, 0, cam.dpr, 0, 0);
  renderVaultDiorama(ctx, state, cam);
  renderCameraSweepCones(ctx, state, cam);
  renderGuardVisionCones(ctx, state, cam);
  renderWallsAndCover(ctx, state, cam);
  renderOcclusionCutRims(ctx, state, cam);
  renderLaserRelaysAndExit(ctx, state, cam);
  renderLootPedestal(ctx, state, cam);
  renderAcousticAndSmokeFields(ctx, state, cam);
  renderStealthActors(ctx, state, cam);
  renderTacticalHud(ctx, state, hitBoxes);
  renderGetawayOverlay(ctx, state, hitBoxes);
  ctx.restore();
}

function announce(el, text) {
  if (el) el.textContent = text;
}

let activeState = null;
startCopperlineHeist();
