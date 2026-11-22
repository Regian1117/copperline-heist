/* Compact deterministic floor staging for showcase preview URLs (?shot=hero|tools|caught|getaway). */

import { computeGetawayPayout } from './alarmAndGetaway.js';
import { buildMultiRouteFloor } from './floors.js';
import { computeOccludedVisionCone } from './visionCones.js';

export function setupShowcaseFloorState(shotName, seed = 7) {
  const key = String(shotName || 'hero').toLowerCase();
  const s = buildMultiRouteFloor(key === 'hero' ? 1 : key === 'tools' ? 2 : key === 'caught' ? 0 : 3);
  s.time = 2.6 + (seed % 5) * 0.1;
  s.isShowcase = true;

  if (key === 'hero') {
    Object.assign(s, { screen: 'playing', purse: 1200, alarm: 36, peakAlarm: 36, alarmState: 'SUSPICIOUS', selectedTool: 0 });
    Object.assign(s.thief, { x: 272, y: 336, angle: -0.26, inCover: true, sneaking: true });
    Object.assign(s.guards[0], { x: 442, y: 466, angle: -2.22, fov: 0.78, range: 248, lockTimer: 0.16, alertIcon: '?' });
    Object.assign(s.guards[1], { x: 892, y: 486, angle: -1.48, fov: 0.72, range: 192 });
    Object.assign(s.cameras[0], { x: 204, y: 116, labelOffsetY: 24, angle: 2.44, fov: 0.58, range: 178 });
    Object.assign(s.cameras[1], { labelOffsetX: -12, labelOffsetY: 24, angle: 0.22, fov: 0.56, range: 166 });
    return recomputeCones(s);
  }

  if (key === 'tools') {
    Object.assign(s, { screen: 'playing', purse: 350, toolsSpent: 850, alarm: 14, peakAlarm: 14, alarmState: 'CALM', selectedTool: 2, showRoutes: true });
    Object.assign(s.thief, { x: 626, y: 312, angle: -0.22, inCover: false, sneaking: true });
    Object.assign(s.guards[0], { x: 422, y: 466, angle: -0.68, fov: 0.98, range: 268 });
    s.smokes.push({ x: 526, y: 384, radius: 48, timer: 5.2, maxTimer: 6.0 });
    s.cameras[0].jammedTimer = 5.4;
    s.cameras[0].angle = 0.85;
    s.empWaves.push({ x: 258, y: 132, radius: 94, maxRadius: 140, timer: 0.9, maxTimer: 1.4 });
    s.coins.push({ x: 904, y: 364, fromX: 626, fromY: 312, timer: 4.5, ripplePhase: 1.4 });
    Object.assign(s.guards[1], { x: 956, y: 236, angle: 1.88, fov: 0.84, range: 174, state: 'INVESTIGATE', statusTag: '? LURED' });
    Object.assign(s.cameras[1], { angle: -0.36, fov: 0.54, range: 128 });
    Object.assign(s.lasers[0], { permanentlyDisabled: true, active: false });
    return recomputeCones(s);
  }

  if (key === 'caught') {
    Object.assign(s, { screen: 'caught', purse: 1050, toolsSpent: 150, alarm: 100, peakAlarm: 100, wasSpotted: true, alarmState: 'CAUGHT', caughtBy: 'GUARD 1' });
    Object.assign(s.thief, { x: 452, y: 148, angle: 2.85, inCover: false });
    const g1 = s.guards[0];
    Object.assign(g1, { x: 618, y: 122, angle: Math.atan2(148 - 122, 452 - 618), state: 'SPOTTED', statusTag: '! SPOT', lockTimer: 0.45 });
    s.caughtSource = { x: g1.x, y: g1.y };
    Object.assign(s.guards[1], { x: 892, y: 220, angle: 1.57 });
    Object.assign(s.cameras[0], { x: 332, y: 44, angle: 2.68, fov: 0.54, range: 150 });
    return recomputeCones(s);
  }

  Object.assign(s, { screen: 'getaway', purse: 650, toolsSpent: 550, spentParts: [400, 150], alarm: 18, peakAlarm: 18, wasSpotted: false, alarmState: 'CLEAN' });
  Object.assign(s.thief, { x: 848, y: 78, angle: 0, lootSecured: true });
  s.escapeTrail = [
    { x: 520, y: 282 },
    { x: 696, y: 282 },
    { x: 788, y: 188 },
    { x: 824, y: 78 },
    { x: s.exit.x, y: s.exit.y + s.exit.h * 0.5 },
  ];
  Object.assign(s.lasers[0], { permanentlyDisabled: true, active: false });
  Object.assign(s.guards[0], { x: 220, y: 84, angle: 0 });
  Object.assign(s.guards[1], { x: 186, y: 434, angle: -0.4 });
  Object.assign(s.guards[2], { x: 924, y: 422, angle: -1.32, fov: 0.68, range: 155 });
  Object.assign(s.cameras[1], { angle: -2.44, fov: 0.54, range: 126 });
  s.payout = computeGetawayPayout(s);
  return recomputeCones(s);
}

function recomputeCones(state) {
  for (const g of state.guards) {
    g.conePoly = computeOccludedVisionCone(g.x, g.y, g.angle, g.fov * 0.5, g.range, state.wallSegments, state.smokes);
  }
  for (const c of state.cameras) {
    c.conePoly = c.jammedTimer > 0 ? [] : computeOccludedVisionCone(c.x, c.y, c.angle, c.fov * 0.5, c.range, state.wallSegments, state.smokes);
  }
  return state;
}
