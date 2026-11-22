/* Guard patrol state machine: PATROL -> INVESTIGATE (?) -> SPOTTED (!) with 0.45s fair detection lock. */

import { computeOccludedVisionCone, normalizeAngle, testPointInVisionCone } from './visionCones.js';

export const GUARD_LOCK_GRACE_SECONDS = 0.45;

export function stepGuardPatrols(s, dt) {
  const { guards, wallSegments, smokes } = s;
  for (const g of guards) {
    let dest = null;
    let moveSpeed = g.speed;

    if (g.state === 'SPOTTED') {
      const look = Math.atan2(s.thief.y - g.y, s.thief.x - g.x);
      g.angle = turnToward(g.angle, look, 7.2 * dt);
    } else if (g.state === 'INVESTIGATE' && g.investigateTarget) {
      dest = g.investigateTarget;
      moveSpeed = g.speed * 1.08;
      const dist = Math.hypot(dest.x - g.x, dest.y - g.y);
      if (dist < 18) {
        dest.timer -= dt;
        g.angle = turnToward(g.angle, g.angle + Math.sin(s.time * 2.8) * 1.1, 2.2 * dt);
        if (dest.timer <= 0) {
          g.investigateTarget = null;
          g.state = 'PATROL';
          g.alertIcon = '';
        }
      } else {
        advanceGuardToward(g, dest.x, dest.y, moveSpeed, dt);
      }
    } else {
      const wp = g.waypoints[g.wpIndex];
      if (g.pauseTimer > 0) {
        g.pauseTimer -= dt;
      } else if (wp) {
        const dist = Math.hypot(wp.x - g.x, wp.y - g.y);
        if (dist < 8) {
          g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
          g.pauseTimer = 0.55;
        } else {
          advanceGuardToward(g, wp.x, wp.y, moveSpeed, dt);
        }
      }
    }

    g.conePoly = computeOccludedVisionCone(g.x, g.y, g.angle, g.fov * 0.5, g.range, wallSegments, smokes);
  }
}

export function resolveGuardAlertness(state, dt) {
  const { guards, thief, wallSegments, smokes } = state;
  let anySeeing = false;
  let caughtBy = null;

  for (const g of guards) {
    const dist = Math.hypot(thief.x - g.x, thief.y - g.y);
    const shieldedByCover = thief.inCover && dist > 78;
    const inCone =
      !thief.inVent &&
      !shieldedByCover &&
      testPointInVisionCone(thief.x, thief.y, g.x, g.y, g.angle, g.fov * 0.5, g.range, wallSegments, smokes);

    if (inCone) {
      anySeeing = true;
      g.state = 'SPOTTED';
      g.alertIcon = '!';
      g.lockTimer = Math.min(GUARD_LOCK_GRACE_SECONDS, g.lockTimer + dt);
      if (g.lockTimer >= GUARD_LOCK_GRACE_SECONDS) {
        caughtBy = g;
      }
    } else {
      if (g.lockTimer > 0) {
        g.lockTimer = Math.max(0, g.lockTimer - dt * 1.15);
      }
      if (g.state === 'SPOTTED' && g.lockTimer <= 0.02) {
        g.state = 'INVESTIGATE';
        g.alertIcon = '?';
        g.investigateTarget = { x: thief.x, y: thief.y, timer: 2.2 };
      }
    }
  }

  return { anySeeing, caughtBy };
}

export function alertGuardsToNoise(state, nx, ny, radius, investigateSeconds = 3.6) {
  let luredCount = 0;
  for (const g of state.guards) {
    if (g.state === 'SPOTTED') continue;
    const dist = Math.hypot(nx - g.x, ny - g.y);
    if (dist <= radius) {
      g.state = 'INVESTIGATE';
      g.alertIcon = '?';
      g.investigateTarget = { x: nx, y: ny, timer: investigateSeconds };
      luredCount++;
    }
  }
  return luredCount;
}

function advanceGuardToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-3) return;
  const desired = Math.atan2(dy, dx);
  g.angle = turnToward(g.angle, desired, 5.2 * dt);
  const step = Math.min(dist, speed * dt);
  g.x += (dx / dist) * step;
  g.y += (dy / dist) * step;
}

function turnToward(current, target, maxDelta) {
  const diff = normalizeAngle(target - current);
  if (Math.abs(diff) <= maxDelta) return target;
  return normalizeAngle(current + Math.sign(diff) * maxDelta);
}
