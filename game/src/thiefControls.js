export function updateTacticalCamera(cam,state,dt){
  const { vw, vh, worldW, worldH } = cam;
  cam.topBarH = vw < 1140 ? 40 : 44;
  cam.bottomBarH = state.screen === 'playing' && !cam.zoomed && !state.paused ? (vw < 1140 ? 46 : 48) : 0;

  const availW = Math.max(200, vw - 44);
  const availH = Math.max(200, vh - cam.topBarH - cam.bottomBarH - 32);
  const baseScale = Math.min(availW / worldW, availH / worldH);

  let targetZoom = 1.0;
  let targetFocusX = worldW * 0.5;
  let targetFocusY = worldH * 0.5;
  let targetAnchorX = vw * 0.5;
  let targetAnchorY = cam.topBarH + (vh - cam.topBarH - cam.bottomBarH) * 0.5;

  if (state.screen === 'caught') {
    targetZoom = 1.5;
    const ribbonH = Math.round(vh * 0.14);
    targetAnchorY = cam.topBarH + (vh - cam.topBarH - ribbonH) * 0.5;
    const src = state.caughtSource || state.thief;
    targetFocusX = state.thief.x * 0.65 + src.x * 0.35;
    targetFocusY = state.thief.y * 0.65 + src.y * 0.35;
    const sc = baseScale * targetZoom;
    targetFocusX = clampFocus(targetFocusX, vw / sc, worldW);
    targetFocusY = clampFocus(targetFocusY, (vh - cam.topBarH - ribbonH) / sc, worldH);
  } else if (state.screen === 'getaway') {
    targetZoom = 1.35;
    const cardW = Math.min(378, Math.round(vw * 0.36));
    const leftPaneW = Math.max(240, vw - cardW - 14);
    targetAnchorX = leftPaneW * 0.5;
    targetAnchorY = cam.topBarH + (vh - cam.topBarH) * 0.5;
    const exCx = state.exit.x + state.exit.w * 0.5;
    const exCy = state.exit.y + state.exit.h * 0.5;
    targetFocusX = (state.loot.x + exCx) * 0.5;
    targetFocusY = (state.loot.y + exCy) * 0.5;
    const sc = baseScale * targetZoom;
    targetFocusY = clampFocus(targetFocusY, (vh - cam.topBarH) / sc, worldH);
  } else if (state.screen === 'playing' && cam.zoomed) {
    targetZoom = 1.20;
    targetAnchorY = cam.topBarH + (vh - cam.topBarH) * 0.5;
    const sc = baseScale * targetZoom;
    targetFocusX = clampFocus(state.thief.x, vw / sc, worldW);
    targetFocusY = clampFocus(state.thief.y, (vh - cam.topBarH) / sc, worldH);
  }

  const blend = dt > 0 ? 1 - Math.exp(-9.5 * dt) : 1;
  cam.zoom += (targetZoom - cam.zoom) * blend;
  cam.focusX += (targetFocusX - cam.focusX) * blend;
  cam.focusY += (targetFocusY - cam.focusY) * blend;
  cam.anchorX += (targetAnchorX - cam.anchorX) * blend;
  cam.anchorY += (targetAnchorY - cam.anchorY) * blend;
  cam.scale = baseScale * cam.zoom;

  if (cam.shakeTimer > 0) {
    cam.shakeTimer = Math.max(0, cam.shakeTimer - dt);
    const decay = cam.shakeDuration > 0 ? cam.shakeTimer / cam.shakeDuration : 0;
    const mag = cam.shakeMag * decay;
    cam.shakeX = Math.sin(state.time * 58) * mag;
    cam.shakeY = Math.cos(state.time * 47) * mag * 0.75;
  } else {
    cam.shakeX = 0;
    cam.shakeY = 0;
  }
}

export function moveThiefThroughCover(state,input,dt){
  const { thief, solidRects, covers, vents, smokes } = state;
  const sneaking = Boolean(input.sneaking);
  thief.sneaking = sneaking;
  const speed = sneaking ? THIEF_SNEAK_SPEED : THIEF_WALK_SPEED;
  thief.vx = (input.mx || 0) * speed;
  thief.vy = (input.my || 0) * speed;

  if (Math.hypot(thief.vx, thief.vy) > 4) {
    thief.angle = Math.atan2(thief.vy, thief.vx);
  }

  const stepX = resolveVentTraversal(thief.x + thief.vx * dt, thief.y, thief.radius, solidRects, vents, true);
  const stepY = resolveVentTraversal(stepX.coord, thief.y + thief.vy * dt, thief.radius, solidRects, vents, false);

  thief.x = Math.max(26, Math.min(state.width - 26, stepX.coord));
  thief.y = Math.max(26, Math.min(state.height - 26, stepY.coord));
  thief.inCover = isThiefInSafeCover(thief.x, thief.y, covers, smokes);
  thief.inVent = stepY.inVent;
}

/* Keyboard/mouse controls, smooth tactical camera follow, [Z] zoom toggle, and getaway framing. */
import { WORLD_H, WORLD_W } from './authoredVaults.js';
import { isThiefInSafeCover, resolveVentTraversal } from './routesAndCover.js';

export const CONTROL_BINDINGS = { move: 'WASD', sneak: 'Shift', hack: 'E', zoom: 'Z', retry: 'R' };
export const THIEF_WALK_SPEED = 192;
export const THIEF_SNEAK_SPEED = 114;

export function screenToWorldPoint(cam, sx, sy) {
  return {
    x: cam.focusX + (sx - cam.anchorX - cam.shakeX) / cam.scale,
    y: cam.focusY + (sy - cam.anchorY - cam.shakeY) / cam.scale,
  };
}

export function createTacticalCamera() {
  return {
    dpr: 1, vw: 1280, vh: 800, topBarH: 44, bottomBarH: 48,
    worldW: WORLD_W, worldH: WORLD_H, zoom: 1.0, zoomed: false, scale: 1.0,
    focusX: WORLD_W * 0.5, focusY: WORLD_H * 0.5, anchorX: 640, anchorY: 400,
    shakeMag: 0, shakeTimer: 0, shakeDuration: 0, shakeX: 0, shakeY: 0,
  };
}

export function resizeCameraCanvas(cam, canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const vw = Math.max(320, window.innerWidth);
  const vh = Math.max(320, window.innerHeight);
  const targetW = Math.round(vw * dpr);
  const targetH = Math.round(vh * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  cam.dpr = dpr;
  cam.vw = vw;
  cam.vh = vh;
}

export function toggleTacticalZoom(cam) {
  cam.zoomed = !cam.zoomed;
  return cam.zoomed;
}

export function triggerCameraShake(cam, mag, duration) {
  if (!cam) return;
  cam.shakeMag = Math.max(cam.shakeMag, mag);
  cam.shakeTimer = Math.max(cam.shakeTimer, duration);
  cam.shakeDuration = Math.max(cam.shakeDuration, duration);
}

export function applyWorldTransform(ctx, cam) {
  ctx.translate(cam.anchorX + cam.shakeX, cam.anchorY + cam.shakeY);
  ctx.scale(cam.scale, cam.scale);
  ctx.translate(-cam.focusX, -cam.focusY);
}

export function readKeyboardAndMouseControls(canvas, getCam, callbacks) {
  const keys = new Set();
  const pointer = { screenX: 0, screenY: 0, worldX: 520, worldY: 280, insideArena: false };

  const onKeyDown = (e) => {
    const code = e.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(code)) {
      e.preventDefault();
    }
    const alreadyDown = keys.has(code);
    keys.add(code);
    if (alreadyDown) return;

    if (code === 'Digit1') callbacks.onToolKey(0, pointer);
    else if (code === 'Digit2') callbacks.onToolKey(1, pointer);
    else if (code === 'Digit3') callbacks.onToolKey(2, pointer);
    else if (code === 'Digit4') callbacks.onToolKey(3, pointer);
    else if (code === 'Tab') callbacks.onToggleRoutes();
    else if (code === 'KeyZ') callbacks.onToggleZoom();
    else if (code === 'KeyP') callbacks.onTogglePause();
    else if (code === 'KeyR') callbacks.onRetry();
    else if (code === 'KeyM') callbacks.onToggleMute();
    else if (code === 'Enter') callbacks.onPrimaryConfirm();
    else if (code === 'Space') callbacks.onSpacePress();
  };

  const onKeyUp = (e) => keys.delete(e.code);

  const updatePointer = (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.screenX = e.clientX - rect.left;
    pointer.screenY = e.clientY - rect.top;
    const cam = getCam();
    const wp = screenToWorldPoint(cam, pointer.screenX, pointer.screenY);
    pointer.worldX = wp.x;
    pointer.worldY = wp.y;
    pointer.insideArena = wp.x >= 0 && wp.x <= cam.worldW && wp.y >= 0 && wp.y <= cam.worldH;
  };

  const onPointerMove = (e) => updatePointer(e);
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    updatePointer(e);
    callbacks.onCanvasClick(pointer.screenX, pointer.screenY, pointer.worldX, pointer.worldY, pointer.insideArena);
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    keys,
    pointer,
    getMoveInput() {
      let mx = 0;
      let my = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) my -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) my += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
      const len = Math.hypot(mx, my);
      if (len > 1) {
        mx /= len;
        my /= len;
      }
      return { mx, my, sneaking: keys.has('ShiftLeft') || keys.has('ShiftRight') };
    },
    isInteracting() {
      return keys.has('KeyE') || keys.has('Space');
    },
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
    },
  };
}

function clampFocus(val, visSpan, worldSpan) {
  if (visSpan >= worldSpan) return worldSpan * 0.5;
  const half = visSpan * 0.5;
  return Math.max(half, Math.min(worldSpan - half, val));
}
