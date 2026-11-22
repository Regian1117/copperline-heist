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
    Object.assign(s.thief, { x: 320, y: 342, angle: -0.26, inCover: false, sneaking: true });
    Object.assign(s.guards[0], { x: 486, y: 472, angle: -1.96, fov: 0.66, range: 212, lockTimer: 0.16 });
    Object.assign(s.guards[1], { x: 892, y: 486, angle: -1.66, fov: 0.8, range: 192 });
    Object.assign(s.cameras[0], { x: 204, y: 116, labelOffsetY: 24, angle: 2.44, fov: 0.58, range: 178 });
    Object.assign(s.cameras[1], { labelOffsetX: -12, labelOffsetY: 24, angle: 0.22, fov: 0.56, range: 166 });
    return recomputeCones(s);
  }

  if (key === 'tools') {
    Object.assign(s, { screen: 'playing', purse: 450, toolsSpent: 750, alarm: 14, peakAlarm: 14, alarmState: 'CALM', selectedTool: 2 });
    Object.assign(s.thief, { x: 856, y: 274, angle: -2.35, inCover: false, sneaking: true });
    s.coins.push({ x: 330, y: 466, fromX: 172, fromY: 390, timer: 4.5, ripplePhase: 1.4 });
    Object.assign(s.guards[0], { x: 306, y: 342, angle: 1.38, state: 'INVESTIGATE', statusTag: '? LURED' });
    Object.assign(s.guards[1], { x: 962, y: 388, angle: -2.26, fov: 1.04, range: 276 });
    s.cameras[0].jammedTimer = 5.4;
    s.empWaves.push({ x: 258, y: 132, radius: 92, maxRadius: 140, timer: 0.9, maxTimer: 1.4 });
    Object.assign(s.cameras[1], { angle: -0.34, fov: 0.56, range: 162 });
    s.smokes.push({ x: 902, y: 314, radius: 38, timer: 5.2, maxTimer: 6.0 });
    Object.assign(s.lasers[0], { permanentlyDisabled: true, active: false });
    return recomputeCones(s);
  }

  if (key === 'caught') {
    Object.assign(s, { screen: 'caught', purse: 1050, toolsSpent: 150, alarm: 100, peakAlarm: 100, wasSpotted: true, alarmState: 'CAUGHT', caughtBy: 'GUARD 1' });
    Object.assign(s.thief, { x: 434, y: 166, angle: 2.6, inCover: false });
    const g1 = s.guards[0];
    Object.assign(g1, { x: 594, y: 122, angle: Math.atan2(166 - 122, 434 - 594), state: 'SPOTTED', alertIcon: '!', lockTimer: 0.45 });
    s.caughtSource = { x: g1.x, y: g1.y };
    Object.assign(s.guards[1], { x: 892, y: 220, angle: 1.57 });
    Object.assign(s.cameras[0], { x: 332, y: 44, angle: 2.68, fov: 0.54, range: 150 });
    return recomputeCones(s);
  }

  Object.assign(s, { screen: 'getaway', purse: 650, toolsSpent: 550, alarm: 18, peakAlarm: 18, wasSpotted: false, alarmState: 'CLEAN' });
  Object.assign(s.thief, { x: s.exit.x - 28, y: s.exit.y + s.exit.h * 0.5, angle: 0, lootSecured: true });
  s.escapeTrail = [
    { x: 520, y: 282 },
    { x: 676, y: 282 },
    { x: 786, y: 188 },
    { x: 826, y: 78 },
    { x: s.exit.x, y: s.exit.y + s.exit.h * 0.5 },
  ];
  Object.assign(s.lasers[0], { permanentlyDisabled: true, active: false });
  Object.assign(s.guards[0], { x: 220, y: 84, angle: 0 });
  Object.assign(s.guards[1], { x: 186, y: 434, angle: -0.4 });
  Object.assign(s.guards[2], { x: 924, y: 422, angle: -1.32, fov: 0.68, range: 155 });
  s.payout = computeGetawayPayout(s);
  return recomputeCones(s);
}

function recomputeCones(state) {
  for (const g of state.guards) {
    g.conePoly = computeOccludedVisionCone(g.x, g.y, g.angle, g.fov * 0.5, g.range, state.wallSegments, state.smokes, 56);
  }
  for (const c of state.cameras) {
    c.conePoly = c.jammedTimer > 0 ? [] : computeOccludedVisionCone(c.x, c.y, c.angle, c.fov * 0.5, c.range, state.wallSegments, state.smokes, 44);
  }
  return state;
}
