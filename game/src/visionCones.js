/* Exact raycasted vision cone clipping against interior walls and deployed smoke clouds. */

export function computeOccludedVisionCone(ox, oy, a, f, r, w, sm) {
  const smokes = sm || [];
  const rays = 48;
  const points = [{ x: ox, y: oy }];
  const start = a - f;
  const span = f * 2;
  for (let i = 0; i <= rays; i++) {
    const ang = start + (span * i) / rays;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const hitDist = castRayDistance(ox, oy, dx, dy, r, w, smokes);
    points.push({ x: ox + dx * hitDist, y: oy + dy * hitDist });
  }
  return points;
}

export function testPointInVisionCone(px, py, ox, oy, a, f, r, w, sm) {
  const smokes = sm || [];
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > r || dist < 1) return false;
  const targetAngle = Math.atan2(dy, dx);
  const diff = normalizeAngle(targetAngle - a);
  if (Math.abs(diff) > f) return false;
  const ux = dx / dist;
  const uy = dy / dist;
  const visibleDist = castRayDistance(ox, oy, ux, uy, dist, w, smokes);
  return visibleDist >= dist - 4;
}

export function normalizeAngle(a) {
  let r = a;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

function castRayDistance(ox, oy, dx, dy, maxDist, wallSegments, smokes) {
  let closest = maxDist;
  for (let i = 0; i < wallSegments.length; i++) {
    const s = wallSegments[i];
    const t = raySegmentIntersect(ox, oy, dx, dy, s.x1, s.y1, s.x2, s.y2);
    if (t !== null && t < closest) closest = t;
  }
  for (let i = 0; i < smokes.length; i++) {
    const sm = smokes[i];
    if (sm.timer <= 0) continue;
    const t = rayCircleIntersect(ox, oy, dx, dy, sm.x, sm.y, sm.radius);
    if (t !== null && t < closest) closest = t;
  }
  return closest;
}

function raySegmentIntersect(ox, oy, dx, dy, x1, y1, x2, y2) {
  const sx = x2 - x1;
  const sy = y2 - y1;
  const denom = dx * sy - dy * sx;
  if (Math.abs(denom) < 1e-6) return null;
  const qx = x1 - ox;
  const qy = y1 - oy;
  const t = (qx * sy - qy * sx) / denom;
  const u = (qx * dy - qy * dx) / denom;
  if (t >= 0 && u >= 0 && u <= 1) return t;
  return null;
}

function rayCircleIntersect(ox, oy, dx, dy, cx, cy, r) {
  const fx = ox - cx;
  const fy = oy - cy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  if (c <= 0) return 0;
  const disc = b * b - 4 * c;
  if (disc < 0) return null;
  const root = Math.sqrt(disc);
  const t1 = (-b - root) * 0.5;
  if (t1 >= 0) return t1;
  return null;
}
