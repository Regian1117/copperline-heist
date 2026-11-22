export function stepLaserGridsAndRelays(state, dt) {
  const { lasers, thief, holdingInteract } = state;
  let laserTripped = null;
  let relayHacked = null;

  for (const laser of lasers) {
    laser.pulsePhase += dt * 5.2;
    if (laser.permanentlyDisabled) {
      laser.active = false;
      continue;
    }
    if (laser.disabledTimer > 0) {
      laser.disabledTimer = Math.max(0, laser.disabledTimer - dt);
      laser.active = laser.disabledTimer <= 0;
    }

    const relayDist = Math.hypot(thief.x - laser.relay.x, thief.y - laser.relay.y);
    if (laser.active && holdingInteract && relayDist < 56) {
      laser.hackProgress = Math.min(1, laser.hackProgress + dt / 0.62);
      if (laser.hackProgress >= 1) {
        laser.permanentlyDisabled = true;
        laser.active = false;
        relayHacked = laser;
      }
    } else {
      laser.hackProgress = Math.max(0, laser.hackProgress - dt * 1.5);
    }

    if (laser.active && !thief.inVent) {
      const beamDist = pointToSegmentDistance(thief.x, thief.y, laser.x1, laser.y1, laser.x2, laser.y2);
      if (beamDist < thief.radius + 3) laserTripped = laser;
    }
  }

  return { laserTripped, relayHacked };
}

export function stepSweepingCameras(state, dt) {
  const { cameras, thief, wallSegments, smokes } = state;
  let cameraSeeing = false;
  let caughtByCamera = null;
  let maxLockRatio = 0;
  let lockSource = null;

  for (const cam of cameras) {
    cam.blinkPhase += dt * 4.5;
    if (cam.jammedTimer > 0) {
      cam.jammedTimer = Math.max(0, cam.jammedTimer - dt);
      cam.lockTimer = 0;
      cam.conePoly = [];
      continue;
    }

    if (cam.pauseTimer > 0) {
      cam.pauseTimer -= dt;
    } else {
      cam.angle += cam.sweepDir * cam.sweepSpeed * dt;
      if (cam.angle >= cam.maxAngle) {
        cam.angle = cam.maxAngle;
        cam.sweepDir = -1;
        cam.pauseTimer = 0.55;
      } else if (cam.angle <= cam.minAngle) {
        cam.angle = cam.minAngle;
        cam.sweepDir = 1;
        cam.pauseTimer = 0.55;
      }
    }

    cam.conePoly = computeOccludedVisionCone(cam.x, cam.y, cam.angle, cam.fov * 0.5, cam.range, wallSegments, smokes);

    const dist = Math.hypot(thief.x - cam.x, thief.y - cam.y);
    const shielded = thief.inCover && dist > 64;
    const seen =
      !thief.inVent &&
      !shielded &&
      testPointInVisionCone(thief.x, thief.y, cam.x, cam.y, cam.angle, cam.fov * 0.5, cam.range, wallSegments, smokes);

    if (seen) {
      cameraSeeing = true;
      cam.lockTimer = Math.min(CAMERA_LOCK_SECONDS, cam.lockTimer + dt);
      if (cam.lockTimer >= CAMERA_LOCK_SECONDS) caughtByCamera = cam;
    } else {
      cam.lockTimer = Math.max(0, cam.lockTimer - dt * 1.4);
    }

    const ratio = cam.lockTimer / CAMERA_LOCK_SECONDS;
    if (ratio > maxLockRatio) {
      maxLockRatio = ratio;
      lockSource = { x: cam.x, y: cam.y, label: cam.id };
    }
  }

  return { cameraSeeing, caughtByCamera, maxLockRatio, lockSource };
}

/* Oscillating CCTV camera sweeps, lock-on tracking, and laser relay grids. */
import { computeOccludedVisionCone, testPointInVisionCone } from './visionCones.js';

const CAMERA_LOCK_SECONDS = 0.75;

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-4) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
