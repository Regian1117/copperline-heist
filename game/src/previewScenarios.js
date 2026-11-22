/* Compact deterministic shot staging for ?shot=hero|tools|caught|getaway captures. */

import { evaluateGetawayPayoff } from './alarmAndGetaway.js';
import { buildMultiRouteFloor } from './floors.js';
import { computeOccludedVisionCone } from './visionCones.js';

export function stageDeterministicHeistShot(shotName, seed = 7) {
  const key = String(shotName || 'hero').toLowerCase();
  const s = buildMultiRouteFloor(key === 'hero' ? 1 : key === 'tools' ? 2 : key === 'caught' ? 0 : 3);
  s.time = 2.6 + (seed % 5) * 0.1;

  if (key === 'hero') {
    Object.assign(s, { screen: 'playing', purse: 1200, alarm: 36, peakAlarm: 36, alarmState: 'SUSPICIOUS', selectedTool: 0 });
    Object.assign(s.thief, { x: 326, y: 344, angle: -0.28, inCover: false, sneaking: true });
    Object.assign(s.guards[0], { x: 482, y: 468, angle: -2.24, fov: 0.84, range: 224, lockTimer: 0.16 });
    Object.assign(s.guards[1], { x: 892, y: 488, angle: -1.68, range: 192 });
    Object.assign(s.cameras[0], { x: 196, y: 114, labelOffsetY: 22, angle: 2.16, fov: 0.68, range: 204 });
    Object.assign(s.cameras[1], { angle: 0.04, range: 174 });
    return recomputeCones(s);
  }

  if (key === 'tools') {
    Object.assign(s, { screen: 'playing', purse: 450, toolsSpent: 750, alarm: 14, peakAlarm: 14, alarmState: 'CALM', selectedTool: 2 });
    Object.assign(s.thief, { x: 176, y: 388, angle: 0.28, inCover: true, sneaking: true });
    s.coins.push({ x: 332, y: 468, fromX: 176, fromY: 388, timer: 4.5, ripplePhase: 1.4 });
    Object.assign(s.guards[0], { x: 304, y: 342, angle: 1.35, state: 'INVESTIGATE', alertIcon: '?' });
    Object.assign(s.guards[1], { x: 966, y: 208, angle: 1.44, fov: 0.78, range: 196 });
    s.cameras[0].jammedTimer = 5.4;
    s.empWaves.push({ x: 258, y: 132, radius: 92, maxRadius: 140, timer: 0.9, maxTimer: 1.4 });
    Object.assign(s.cameras[1], { angle: 0.0, fov: 0.68, range: 240 });
    s.smokes.push({ x: 654, y: 230, radius: 54, timer: 5.2, maxTimer: 6.0 });
    Object.assign(s.lasers[0], { permanentlyDisabled: true, active: false });
    return recomputeCones(s);
  }

  if (key === 'caught') {
    Object.assign(s, { screen: 'caught', purse: 1050, toolsSpent: 150, alarm: 100, peakAlarm: 100, wasSpotted: true, alarmState: 'CAUGHT', caughtBy: 'GUARD 1' });
    Object.assign(s.thief, { x: 434, y: 166, angle: 2.6, inCover: false });
    const g1 = s.guards[0];
    Object.assign(g1, { x: 594, y: 122, angle: Math.atan2(166 - 122, 434 - 594), state: 'SPOTTED', alertIcon: '!', lockTimer: 0.45 });
    s.caughtSource = { x: g1.x, y: g1.y };
    Object.assign(s.guards[1], { x: 890, y: 220, angle: 1.57 });
    Object.assign(s.cameras[0], { x: 294, y: 42, angle: 2.02, range: 175 });
    return recomputeCones(s);
  }

  Object.assign(s, { screen: 'getaway', purse: 650, toolsSpent: 550, alarm: 18, peakAlarm: 18, wasSpotted: false, alarmState: 'CLEAN' });
  Object.assign(s.thief, { x: s.exit.x - 26, y: s.exit.y + s.exit.h * 0.5, angle: 0, lootSecured: true });
  Object.assign(s.lasers[0], { permanentlyDisabled: true, active: false });
  Object.assign(s.guards[0], { x: 220, y: 84, angle: 0 });
  Object.assign(s.guards[1], { x: 186, y: 434, angle: -0.4 });
  Object.assign(s.guards[2], { x: 870, y: 415, angle: -1.7 });
  s.payout = evaluateGetawayPayoff(s);
  return recomputeCones(s);
}

function recomputeCones(state) {
  for (const g of state.guards) {
    g.conePoly = computeOccludedVisionCone(g.x, g.y, g.angle, g.fov * 0.5, g.range, state.wallSegments, state.smokes);
  }
  for (const c of state.cameras) {
    c.conePoly = c.jammedTimer > 0 ? [] : computeOccludedVisionCone(c.x, c.y, c.angle, c.fov * 0.5, c.range, state.wallSegments, state.smokes, 38);
  }
  return state;
}
