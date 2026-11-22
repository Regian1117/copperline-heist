export const GUARD_LOCK_GRACE_SECONDS = 0.75;
export function stepGuardPatrols(state, dt) {
  const { guards, wallSegments, solidRects, smokes, thief } = state;
  for (const g of guards) {
    let moveSpeed = g.speed;

    if (g.state === 'SPOTTED') {
      const look = Math.atan2(thief.y - g.y, thief.x - g.x);
      g.angle = turnToward(g.angle, look, 7.4 * dt);
    } else if (g.state === 'LOCKDOWN') {
      const target = g.lockdownTarget || pickLockdownTarget(g, state);
      g.lockdownTarget = target;
      moveSpeed = g.speed * 1.24;
      const dist = Math.hypot(target.x - g.x, target.y - g.y);
      if (dist > 22) {
        advanceGuardToward(g, target.x, target.y, moveSpeed, dt, solidRects);
      } else {
        g.angle = turnToward(g.angle, Math.atan2(thief.y - g.y, thief.x - g.x), 5.6 * dt);
      }
    } else if (g.state === 'INVESTIGATE' && g.investigateTarget) {
      const dest = g.investigateTarget;
      moveSpeed = g.speed * 1.08;
      const dist = Math.hypot(dest.x - g.x, dest.y - g.y);
      if (dist < 18) {
        dest.timer -= dt;
        g.angle = turnToward(g.angle, g.angle + Math.sin(state.time * 2.8) * 1.1, 2.2 * dt);
        if (dest.timer <= 0) {
          g.investigateTarget = null;
          g.state = state.lockdown ? 'LOCKDOWN' : 'PATROL';
          g.alertIcon = state.lockdown ? '!' : '';
        }
      } else {
        advanceGuardToward(g, dest.x, dest.y, moveSpeed, dt, solidRects);
      }
    } else {
      const wp = g.waypoints[g.wpIndex];
      if (g.pauseTimer > 0) {
        g.pauseTimer -= dt;
      } else if (wp) {
        const dist = Math.hypot(wp.x - g.x, wp.y - g.y);
        if (dist < 8) {
          g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
          g.pauseTimer = 0.45;
        } else {
          advanceGuardToward(g, wp.x, wp.y, moveSpeed, dt, solidRects);
        }
      }
    }

    g.conePoly = computeOccludedVisionCone(g.x, g.y, g.angle, g.fov * 0.5, g.range, wallSegments, smokes);
  }
}

/* Guard patrol, lure investigation, lockdown convergence, and 0.75s lock-ring progression. */
import { pushOutOfSolids } from './routesAndCover.js';
import { computeOccludedVisionCone, normalizeAngle, testPointInVisionCone } from './visionCones.js';

export function updateGuardLockRing(guard, seeing, dt) {
  if (seeing) {
    guard.lockTimer = Math.min(GUARD_LOCK_GRACE_SECONDS, guard.lockTimer + dt);
  } else if (guard.lockTimer > 0) {
    guard.lockTimer = Math.max(0, guard.lockTimer - dt * 1.15);
  }
  return Math.min(1, guard.lockTimer / GUARD_LOCK_GRACE_SECONDS);
}

export function resolveGuardAlertness(state, dt) {
  const { guards, thief, wallSegments, smokes } = state;
  let anySeeing = false;
  let caughtBy = null;
  let maxLockRatio = 0;
  let lockSource = null;

  for (const g of guards) {
    const dist = Math.hypot(thief.x - g.x, thief.y - g.y);
    const shieldedByCover = thief.inCover && dist > 68;
    const inCone =
      !thief.inVent &&
      !shieldedByCover &&
      testPointInVisionCone(thief.x, thief.y, g.x, g.y, g.angle, g.fov * 0.5, g.range, wallSegments, smokes);

    const ratio = updateGuardLockRing(g, inCone, dt);
    if (ratio > maxLockRatio) {
      maxLockRatio = ratio;
      lockSource = { x: g.x, y: g.y, label: g.label };
    }

    if (inCone) {
      anySeeing = true;
      g.state = 'SPOTTED';
      g.alertIcon = '!';
      g.statusTag = '! SPOTTED';
      if (ratio >= 1) caughtBy = g;
    } else if (g.state === 'SPOTTED' && ratio <= 0.02) {
      g.statusTag = '';
      if (state.lockdown) {
        g.state = 'LOCKDOWN';
        g.alertIcon = '!';
      } else {
        g.state = 'INVESTIGATE';
        g.alertIcon = '?';
        g.investigateTarget = { x: thief.x, y: thief.y, timer: 2.2 };
      }
    }
  }

  return { anySeeing, caughtBy, maxLockRatio, lockSource };
}

export function alertGuardsToNoise(state, nx, ny, radius, investigateSeconds = 3.8) {
  let luredCount = 0;
  for (const g of state.guards) {
    if (g.state === 'SPOTTED') continue;
    if (Math.hypot(nx - g.x, ny - g.y) <= radius) {
      g.state = 'INVESTIGATE';
      g.alertIcon = '?';
      g.statusTag = '';
      g.investigateTarget = { x: nx, y: ny, timer: investigateSeconds };
      luredCount++;
    }
  }
  return luredCount;
}

function pickLockdownTarget(g, state) {
  if (g.id === 'G1') return { x: state.loot.x + 115, y: 138 };
  if (g.id === 'G2') return { x: 716, y: 288 };
  return { x: state.loot.x - 105, y: 288 };
}

function advanceGuardToward(g, tx, ty, speed, dt, solidRects) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-3) return;
  const desired = Math.atan2(dy, dx);
  g.angle = turnToward(g.angle, desired, 5.4 * dt);
  const step = Math.min(dist, speed * dt);
  const pushed = pushOutOfSolids(g.x + (dx / dist) * step, g.y + (dy / dist) * step, 13, solidRects);
  g.x = pushed.x;
  g.y = pushed.y;
}

function turnToward(current, target, maxDelta) {
  const diff = normalizeAngle(target - current);
  if (Math.abs(diff) <= maxDelta) return target;
  return normalizeAngle(current + Math.sign(diff) * maxDelta);
}
