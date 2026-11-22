/* COPPERLINE entry point: responsive canvas bootstrap, game loop, and lazy preview shot loader. */

import { COPPERLINE_FLOORS, WORLD_H, WORLD_W, buildMultiRouteFloor } from './floors.js';
import { computeFloorRoutes } from './routesAndCover.js';
import { computeOccludedVisionCone } from './visionCones.js';
import { resolveGuardAlertness, stepGuardPatrols } from './guards.js';
import { stepLaserGridsAndRelays, stepSweepingCameras } from './camerasAndLasers.js';
import { deployPaidTool, stepToolEffects } from './toolsAndEconomy.js';
import { updateAlarmAndSuspicion } from './alarmAndGetaway.js';
import { moveThiefThroughCover, readKeyboardAndMouseControls } from './thiefControls.js';
import { renderBlueprintFloor, renderLaserRelaysAndExit, renderWallsVentsAndCover } from './arenaRenderer.js';
import { renderAcousticAndSmokeFields, renderCameraSweepCones, renderGuardVisionCones } from './coneRenderer.js';
import { renderLootPedestal, renderPatrolGuardsAndAlert, renderThiefSilhouette } from './actorRenderer.js';
import { renderHighOcrHud, renderOutcomeOverlay } from './hudRenderer.js';
import { isAudioMuted, playHeistCue, pulseTensionHeartbeat, setAudioMuted } from './heistAudio.js';

let activeState = null;

export async function startCopperlineHeist() {
  const canvas = document.getElementById('heist-canvas');
  const statusEl = document.getElementById('status');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hitBoxes = [];

  const params = new URLSearchParams(window.location.search);
  const shotName = params.get('shot');
  const seed = Number(params.get('seed')) || 7;

  if (shotName) {
    window.__shotReady = false;
    const mod = await import('./previewScenarios.js');
    activeState = mod.stageDeterministicHeistShot(shotName, seed);
    const drawStatic = () => {
      const layout = computeLayout(canvas);
      renderFrame(ctx, activeState, layout, hitBoxes, null);
    };
    drawStatic();
    requestAnimationFrame(() => {
      drawStatic();
      requestAnimationFrame(() => {
        drawStatic();
        window.__shotReady = true;
      });
    });
    window.addEventListener('resize', drawStatic);
    announce(statusEl, `COPPERLINE ${activeState.code} ${activeState.alarmState}`);
    return;
  }

  activeState = buildMultiRouteFloor(0);
  switchHeistScreen(activeState, 'title');
  primeCones(activeState);

  let layout = computeLayout(canvas);
  const controls = readKeyboardAndMouseControls(canvas, () => layout, {
    onToolKey(toolIdx, pointer) {
      if (activeState.screen !== 'playing' || activeState.paused) return;
      const tx = pointer.insideArena ? pointer.worldX : NaN;
      const ty = pointer.insideArena ? pointer.worldY : NaN;
      deployPaidTool(activeState, toolIdx, tx, ty, playHeistCue);
    },
    onToggleRoutes() {
      activeState.showRoutes = !activeState.showRoutes;
      const activeRoutes = computeFloorRoutes(activeState);
      announce(statusEl, activeRoutes.length > 0 ? 'Route blueprint enabled' : 'Route blueprint hidden');
    },
    onTogglePause() {
      if (activeState.screen === 'playing') activeState.paused = !activeState.paused;
    },
    onRetry() {
      if (activeState.screen === 'playing' || activeState.screen === 'caught' || activeState.screen === 'getaway') {
        activeState = buildMultiRouteFloor(activeState.floorIndex);
        primeCones(activeState);
        announce(statusEl, `Retrying ${activeState.code} ${activeState.name}`);
      }
    },
    onToggleMute() {
      const m = setAudioMuted(!isAudioMuted());
      announce(statusEl, m ? 'Audio muted' : 'Audio enabled');
    },
    onPrimaryConfirm() {
      if (activeState.screen === 'title') {
        switchHeistScreen(activeState, 'playing');
      } else if (activeState.screen === 'caught') {
        activeState = buildMultiRouteFloor(activeState.floorIndex);
        primeCones(activeState);
      } else if (activeState.screen === 'getaway') {
        const nextIdx = (activeState.floorIndex + 1) % COPPERLINE_FLOORS.length;
        activeState = buildMultiRouteFloor(nextIdx);
        primeCones(activeState);
      }
    },
    onSpacePress() {
      if (activeState.screen === 'title') switchHeistScreen(activeState, 'playing');
    },
    onCanvasClick(sx, sy, wx, wy, insideArena) {
      const hit = hitBoxes.find((b) => sx >= b.x && sx <= b.x + b.w && sy >= b.y && sy <= b.y + b.h);
      if (hit) {
        handleHitBox(hit, statusEl);
        return;
      }
      if (activeState.screen === 'playing' && !activeState.paused && insideArena) {
        deployPaidTool(activeState, activeState.selectedTool, wx, wy, playHeistCue);
      }
    },
  });

  let lastTs = performance.now();
  const loop = (ts) => {
    const dt = Math.min(0.05, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;
    layout = computeLayout(canvas);

    if (activeState.screen === 'title') {
      activeState.time += dt;
      stepGuardPatrols(activeState, dt);
      stepSweepingCameras(activeState, dt);
    } else if (activeState.screen === 'playing' && !activeState.paused) {
      activeState.time += dt;
      const moveVec = controls.getMoveVector();
      const sneaking = controls.isSneaking();
      const interacting = controls.isInteracting();

      moveThiefThroughCover(activeState, moveVec, sneaking, dt);
      stepGuardPatrols(activeState, dt);
      const guardRes = resolveGuardAlertness(activeState, dt);
      const camRes = stepSweepingCameras(activeState, dt);
      const laserRes = stepLaserGridsAndRelays(activeState, dt, interacting);
      if (laserRes.relayHacked) playHeistCue('bypass');
      stepToolEffects(activeState, dt);

      updateAlarmAndSuspicion(
        activeState,
        dt,
        {
          anySeeing: guardRes.anySeeing,
          caughtBy: guardRes.caughtBy,
          cameraSeeing: camRes.cameraSeeing,
          caughtByCamera: camRes.caughtByCamera,
          laserTripped: laserRes.laserTripped,
        },
        interacting,
        playHeistCue,
      );
      pulseTensionHeartbeat(activeState.alarm, dt);
    }

    renderFrame(ctx, activeState, layout, hitBoxes, controls.pointer);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

export function switchHeistScreen(state, nextScreen) {
  state.screen = nextScreen;
  state.paused = false;
  return state;
}

function handleHitBox(hit, statusEl) {
  if (hit.type === 'start') {
    switchHeistScreen(activeState, 'playing');
    announce(statusEl, `Started ${activeState.code} ${activeState.name}`);
  } else if (hit.type === 'floor') {
    activeState = buildMultiRouteFloor(hit.index);
    switchHeistScreen(activeState, 'title');
    primeCones(activeState);
  } else if (hit.type === 'retry') {
    activeState = buildMultiRouteFloor(activeState.floorIndex);
    primeCones(activeState);
    announce(statusEl, `Retrying ${activeState.code}`);
  } else if (hit.type === 'next') {
    const nextIdx = (activeState.floorIndex + 1) % COPPERLINE_FLOORS.length;
    activeState = buildMultiRouteFloor(nextIdx);
    primeCones(activeState);
    announce(statusEl, `Entered ${activeState.code}`);
  } else if (hit.type === 'resume') {
    activeState.paused = false;
  } else if (hit.type === 'routes') {
    activeState.showRoutes = !activeState.showRoutes;
  } else if (hit.type === 'sneak') {
    activeState.thief.sneaking = !activeState.thief.sneaking;
  } else if (hit.type === 'tool') {
    if (activeState.selectedTool === hit.index && activeState.screen === 'playing' && !activeState.paused) {
      deployPaidTool(activeState, hit.index, NaN, NaN, playHeistCue);
    } else {
      activeState.selectedTool = hit.index;
    }
  }
}

function primeCones(state) {
  for (const g of state.guards) {
    g.conePoly = computeOccludedVisionCone(g.x, g.y, g.angle, g.fov * 0.5, g.range, state.wallSegments, state.smokes);
  }
  for (const c of state.cameras) {
    c.conePoly = computeOccludedVisionCone(c.x, c.y, c.angle, c.fov * 0.5, c.range, state.wallSegments, state.smokes, 38);
  }
}

function computeLayout(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const vw = Math.max(320, window.innerWidth);
  const vh = Math.max(320, window.innerHeight);
  const targetW = Math.round(vw * dpr);
  const targetH = Math.round(vh * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  const topBarH = vh < 740 ? 62 : 70;
  const bottomBarH = vh < 740 ? 68 : 78;
  const padX = 22;
  const padY = 18;
  const availW = Math.max(200, vw - padX * 2);
  const availH = Math.max(200, vh - topBarH - bottomBarH - padY * 2);
  const worldScale = Math.min(availW / WORLD_W, availH / WORLD_H);
  const drawW = WORLD_W * worldScale;
  const drawH = WORLD_H * worldScale;
  const worldX = (vw - drawW) * 0.5;
  const worldY = topBarH + (vh - topBarH - bottomBarH - drawH) * 0.5;
  return { dpr, vw, vh, topBarH, bottomBarH, worldX, worldY, worldScale, worldW: WORLD_W, worldH: WORLD_H };
}

function renderFrame(ctx, state, layout, hitBoxes, pointer) {
  ctx.save();
  ctx.setTransform(layout.dpr, 0, 0, layout.dpr, 0, 0);
  renderBlueprintFloor(ctx, state, layout);
  renderWallsVentsAndCover(ctx, state, layout);
  renderLaserRelaysAndExit(ctx, state, layout);
  renderLootPedestal(ctx, state, layout);
  renderCameraSweepCones(ctx, state, layout);
  renderGuardVisionCones(ctx, state, layout);
  renderAcousticAndSmokeFields(ctx, state, layout);
  renderPatrolGuardsAndAlert(ctx, state, layout);
  renderThiefSilhouette(ctx, state, layout, pointer);
  renderHighOcrHud(ctx, state, layout, hitBoxes);
  renderOutcomeOverlay(ctx, state, layout, hitBoxes);
  ctx.restore();
}

function announce(el, text) {
  if (el) el.textContent = text;
}

startCopperlineHeist();
