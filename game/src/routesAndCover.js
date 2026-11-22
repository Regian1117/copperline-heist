export function computeFloorRoutes(st){
  const routes = [];
  if (st.showRoutes) {
    for (let i = 0; i < st.routeHints.length; i++) {
      const hint = st.routeHints[i];
      routes.push({
        label: hint.label,
        labelPos: hint.labelPos || null,
        color: i === 0 ? 'rgba(34, 211, 238, 0.92)' : 'rgba(250, 204, 21, 0.92)',
        pts: hint.pts,
      });
    }
  }
  if (st.thief.lootSecured && st.screen === 'playing') {
    routes.push({
      label: 'GETAWAY',
      labelPos: null,
      color: 'rgba(16, 185, 129, 0.92)',
      pts: [
        { x: st.thief.x, y: st.thief.y },
        { x: st.exit.x + st.exit.w * 0.5, y: st.exit.y + st.exit.h * 0.5 },
      ],
    });
  }
  return routes;
}

export function isThiefInSafeCover(x,y,c,sm=[]){
  for (let i = 0; i < c.length; i++) {
    const p = c[i].pad;
    if (p && x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return true;
  }
  for (let i = 0; i < sm.length; i++) {
    const cloud = sm[i];
    if (cloud.timer > 0 && Math.hypot(x - cloud.x, y - cloud.y) <= cloud.radius - 4) return true;
  }
  return false;
}

/* Multi-route floor planning, cover pocket detection, vent traversal, and solid-rect collision push-out. */
import { WORLD_H, WORLD_W } from './authoredVaults.js';

export function resolveVentTraversal(x, y, radius, solidRects, vents, isX) {
  const insideVent = vents.some((v) => v.bypassed && pointNearRect(x, y, v.rect, 10));
  let nx = x;
  let ny = y;
  for (let i = 0; i < solidRects.length; i++) {
    const w = solidRects[i];
    if (insideVent && isVentPassableWall(w, vents)) continue;
    const closestX = Math.max(w.x, Math.min(nx, w.x + w.w));
    const closestY = Math.max(w.y, Math.min(ny, w.y + w.h));
    const dx = nx - closestX;
    const dy = ny - closestY;
    const distSq = dx * dx + dy * dy;
    if (distSq < radius * radius) {
      const dist = Math.sqrt(distSq);
      if (dist > 1e-4) {
        const push = radius - dist;
        nx += (dx / dist) * push;
        ny += (dy / dist) * push;
      } else if (isX) {
        nx = nx < w.x + w.w * 0.5 ? w.x - radius : w.x + w.w + radius;
      } else {
        ny = ny < w.y + w.h * 0.5 ? w.y - radius : w.y + w.h + radius;
      }
    }
  }
  return {
    coord: isX ? nx : ny,
    inVent: vents.some((v) => v.bypassed && pointInRect(nx, ny, v.rect)),
  };
}

export function pushOutOfSolids(x, y, radius, solidRects) {
  let nx = x;
  let ny = y;
  for (let i = 0; i < solidRects.length; i++) {
    const w = solidRects[i];
    const cx = Math.max(w.x, Math.min(nx, w.x + w.w));
    const cy = Math.max(w.y, Math.min(ny, w.y + w.h));
    const dx = nx - cx;
    const dy = ny - cy;
    const dSq = dx * dx + dy * dy;
    if (dSq < radius * radius) {
      const d = Math.sqrt(dSq);
      if (d > 1e-4) {
        nx += (dx / d) * (radius - d);
        ny += (dy / d) * (radius - d);
      }
    }
  }
  return { x: nx, y: ny };
}

function isVentPassableWall(wall, vents) {
  if (wall.isPlinth) return false;
  if (wall.x === 0 || wall.y === 0 || wall.x + wall.w >= WORLD_W || wall.y + wall.h >= WORLD_H) return false;
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
