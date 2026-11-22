/* Keyboard and mouse input binding and thief movement through walls, cover alcoves, and vents. */

import { isThiefInSafeCover, resolveVentTraversal } from './routesAndCover.js';

export const CONTROL_BINDINGS={move:'WASD',sneak:'Shift',hack:'E',routes:'Tab',retry:'R'};

export function moveThiefThroughCover(state, input, dt) {
  const { thief, walls, covers, vents } = state;
  const sneaking = Boolean(input.sneaking);
  thief.sneaking = sneaking;
  const speed = sneaking ? THIEF_SNEAK_SPEED : THIEF_WALK_SPEED;
  thief.vx = (input.mx || 0) * speed;
  thief.vy = (input.my || 0) * speed;

  if (Math.hypot(thief.vx, thief.vy) > 4) {
    thief.angle = Math.atan2(thief.vy, thief.vx);
  }

  const stepX = resolveVentTraversal(thief.x + thief.vx * dt, thief.y, thief.radius, walls, vents, true);
  const stepY = resolveVentTraversal(stepX.coord, thief.y + thief.vy * dt, thief.radius, walls, vents, false);

  thief.x = Math.max(26, Math.min(state.width - 26, stepX.coord));
  thief.y = Math.max(26, Math.min(state.height - 26, stepY.coord));
  thief.inCover = isThiefInSafeCover(thief.x, thief.y, covers);
  thief.inVent = stepY.inVent;
}

export const THIEF_WALK_SPEED = 186;
export const THIEF_SNEAK_SPEED = 114;

export function readKeyboardAndMouseControls(canvas, getLayout, callbacks) {
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
    const layout = getLayout();
    const wx = (pointer.screenX - layout.worldX) / layout.worldScale;
    const wy = (pointer.screenY - layout.worldY) / layout.worldScale;
    pointer.worldX = wx;
    pointer.worldY = wy;
    pointer.insideArena = wx >= 0 && wx <= layout.worldW && wy >= 0 && wy <= layout.worldH;
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
