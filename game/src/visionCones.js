export function computeOccludedVisionCone(ox,oy,a,fov,rng,w,s){
  const segs = w || [];
  const clouds = s || [];
  const rays = 68;
  const offsets = [];

  for (let i = 0; i <= rays; i++) {
    offsets.push(-fov + (fov * 2 * i) / rays);
  }

  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    addCornerOffsets(ox, oy, a, fov, rng, seg.x1, seg.y1, offsets);
    addCornerOffsets(ox, oy, a, fov, rng, seg.x2, seg.y2, offsets);
  }

  for (let i = 0; i < clouds.length; i++) {
    const sm = clouds[i];
    if (sm.timer <= 0) continue;
    const dist = Math.hypot(sm.x - ox, sm.y - oy);
    if (dist > sm.radius + 1 && dist - sm.radius <= rng) {
      const centerAng = Math.atan2(sm.y - oy, sm.x - ox);
      const tangentSpread = Math.asin(Math.min(0.999, sm.radius / dist));
      addAngleIfInside(centerAng - tangentSpread - 0.002, a, fov, offsets);
      addAngleIfInside(centerAng - tangentSpread + 0.002, a, fov, offsets);
      addAngleIfInside(centerAng + tangentSpread - 0.002, a, fov, offsets);
      addAngleIfInside(centerAng + tangentSpread + 0.002, a, fov, offsets);
    }
  }

  offsets.sort((p, q) => p - q);

  const points = [{ x: ox, y: oy, clipped: false, farX: ox, farY: oy }];
  let prev = -Infinity;
  for (let i = 0; i < offsets.length; i++) {
    const off = offsets[i];
    if (off - prev < 1e-4) continue;
    prev = off;
    const ang = a + off;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    const hitDist = castRayDistance(ox, oy, dx, dy, rng, segs, clouds);
    points.push({
      x: ox + dx * hitDist,
      y: oy + dy * hitDist,
      clipped: hitDist < rng - 3,
      farX: ox + dx * rng,
      farY: oy + dy * rng,
    });
  }
  return points;
}

export function testPointInVisionCone(px,py,ox,oy,a,fov,rng,w,s){
  const clouds = s || [];
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > rng || dist < 1) return false;
  const targetAngle = Math.atan2(dy, dx);
  const diff = normalizeAngle(targetAngle - a);
  if (Math.abs(diff) > fov) return false;
  const ux = dx / dist;
  const uy = dy / dist;
  const visibleDist = castRayDistance(ox, oy, ux, uy, dist, w || [], clouds);
  return visibleDist >= dist - 4;
}

/* Exact corner-raycasted occlusion helpers against solid walls, cover plinths, and smoke clouds. */
export function normalizeAngle(a) {
  let r = a;
  while (r > Math.PI) r -= Math.PI * 2;
  while (r < -Math.PI) r += Math.PI * 2;
  return r;
}

function addCornerOffsets(ox, oy, angle, halfFov, range, vx, vy, offsets) {
  const dist = Math.hypot(vx - ox, vy - oy);
  if (dist < 2 || dist > range + 2) return;
  const base = Math.atan2(vy - oy, vx - ox);
  addAngleIfInside(base - 0.0009, angle, halfFov, offsets);
  addAngleIfInside(base, angle, halfFov, offsets);
  addAngleIfInside(base + 0.0009, angle, halfFov, offsets);
}

function addAngleIfInside(worldAng, centerAng, halfFov, offsets) {
  const diff = normalizeAngle(worldAng - centerAng);
  if (diff >= -halfFov && diff <= halfFov) offsets.push(diff);
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
  if (Math.abs(denom) < 1e-7) return null;
  const qx = x1 - ox;
  const qy = y1 - oy;
  const t = (qx * sy - qy * sx) / denom;
  const u = (qx * dy - qy * dx) / denom;
  if (t >= 0 && u >= -1e-4 && u <= 1 + 1e-4) return t;
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
