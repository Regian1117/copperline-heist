/* Keyboard and mouse input binding, smooth wall sliding, cover detection, and vent traversal. */

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

  const onKeyUp = (e) => {
    keys.delete(e.code);
  };

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

  const onPointerMove = (e) => {
    updatePointer(e);
  };

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
    getMoveVector() {
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
      return { mx, my };
    },
    isSneaking() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight');
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

export function moveThiefThroughCover(state, moveVec, sneaking, dt) {
  const { thief, walls, covers, vents } = state;
  thief.sneaking = sneaking;
  const speed = sneaking ? THIEF_SNEAK_SPEED : THIEF_WALK_SPEED;
  thief.vx = moveVec.mx * speed;
  thief.vy = moveVec.my * speed;

  if (Math.hypot(thief.vx, thief.vy) > 4) {
    thief.angle = Math.atan2(thief.vy, thief.vx);
  }

  let nextX = thief.x + thief.vx * dt;
  let nextY = thief.y + thief.vy * dt;

  const insideVentNow = vents.some((v) => v.bypassed && pointNearRect(nextX, nextY, v.rect, 10));

  nextX = resolveAxis(nextX, thief.y, thief.radius, walls, vents, insideVentNow, true);
  nextY = resolveAxis(nextX, nextY, thief.radius, walls, vents, insideVentNow, false);

  thief.x = Math.max(26, Math.min(state.width - 26, nextX));
  thief.y = Math.max(26, Math.min(state.height - 26, nextY));

  thief.inCover = covers.some((c) => pointInRect(thief.x, thief.y, c));
  thief.inVent = vents.some((v) => v.bypassed && pointInRect(thief.x, thief.y, v.rect));
}

function resolveAxis(cx, cy, radius, walls, vents, inVent, isX) {
  let x = cx;
  let y = cy;
  for (const w of walls) {
    if (inVent && isVentPassableWall(w, vents)) continue;
    const closestX = Math.max(w.x, Math.min(x, w.x + w.w));
    const closestY = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - closestX;
    const dy = y - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      if (dist > 1e-4) {
        const push = radius - dist;
        x += (dx / dist) * push;
        y += (dy / dist) * push;
      } else if (isX) {
        x = x < w.x + w.w * 0.5 ? w.x - radius : w.x + w.w + radius;
      } else {
        y = y < w.y + w.h * 0.5 ? w.y - radius : w.y + w.h + radius;
      }
    }
  }
  return isX ? x : y;
}

function isVentPassableWall(wall, vents) {
  if (wall.x === 0 || wall.y === 0 || wall.x + wall.w >= 1040 || wall.y + wall.h >= 560) return false;
  for (const v of vents) {
    if (!v.bypassed) continue;
    const r = v.rect;
    const overlap = wall.x < r.x + r.w + 4 && wall.x + wall.w > r.x - 4 && wall.y < r.y + r.h + 4 && wall.y + wall.h > r.y - 4;
    if (overlap) return true;
  }
  return false;
}

function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

function pointNearRect(x, y, r, pad) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}
