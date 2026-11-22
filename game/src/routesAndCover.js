/* Multi-route floor planning, TAB blueprint overlay paths, safe cover detection, and vent traversal. */

export function computeFloorRoutes(state) {
  const routes = [];
  if (state.showRoutes) {
    for (const hint of state.routeHints) {
      routes.push({
        label: hint.label,
        color: 'rgba(224, 184, 106, 0.82)',
        pts: hint.pts,
      });
    }
  }
  if (state.thief.lootSecured && state.screen === 'playing') {
    routes.push({
      label: 'GETAWAY',
      color: 'rgba(16, 185, 129, 0.85)',
      pts: [
        { x: state.thief.x, y: state.thief.y },
        { x: state.exit.x + state.exit.w * 0.5, y: state.exit.y + state.exit.h * 0.5 },
      ],
    });
  }
  return routes;
}

export function isThiefInSafeCover(x, y, covers) {
  for (let i = 0; i < covers.length; i++) {
    const c = covers[i];
    if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return true;
  }
  return false;
}

export function resolveVentTraversal(x, y, radius, walls, vents, isX) {
  const insideVent = vents.some((v) => v.bypassed && pointNearRect(x, y, v.rect, 10));
  let nx = x;
  let ny = y;
  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
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
