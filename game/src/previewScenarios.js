/* Deterministic heist state staging for automated ?shot=hero|tools|caught|getaway captures. */

import { evaluateGetawayPayoff } from './alarmAndGetaway.js';
import { buildMultiRouteFloor } from './floors.js';
import { computeOccludedVisionCone } from './visionCones.js';

export function stageDeterministicHeistShot(shotName, seed = 7) {
  const key = String(shotName || 'hero').toLowerCase();

  if (key === 'hero') {
    const state = buildMultiRouteFloor(1);
    state.screen = 'playing';
    state.time = 2.4 + (seed % 5) * 0.1;
    state.purse = 1200;
    state.alarm = 36;
    state.peakAlarm = 36;
    state.alarmState = 'SUSPICIOUS';
    state.selectedTool = 0;

    state.thief.x = 326;
    state.thief.y = 352;
    state.thief.angle = -0.32;
    state.thief.inCover = false;
    state.thief.sneaking = true;

    const g1 = state.guards[0];
    g1.x = 466;
    g1.y = 468;
    g1.angle = -2.54;
    g1.state = 'PATROL';
    g1.lockTimer = 0.16;

    const g2 = state.guards[1];
    g2.x = 892;
    g2.y = 492;
    g2.angle = -1.64;
    g2.range = 196;
    g2.state = 'PATROL';

    state.cameras[0].angle = 2.08;
    state.cameras[1].angle = 0.04;
    state.cameras[1].range = 178;

    recomputeAllCones(state);
    return state;
  }

  if (key === 'tools') {
    const state = buildMultiRouteFloor(2);
    state.screen = 'playing';
    state.time = 4.2 + (seed % 5) * 0.1;
    state.purse = 450;
    state.toolsSpent = 750;
    state.alarm = 14;
    state.peakAlarm = 14;
    state.alarmState = 'CALM';
    state.selectedTool = 2;

    state.thief.x = 176;
    state.thief.y = 388;
    state.thief.angle = 0.28;
    state.thief.inCover = true;
    state.thief.sneaking = true;

    state.coins.push({ x: 332, y: 468, fromX: 176, fromY: 388, timer: 4.5, ripplePhase: 1.4 });

    const g1 = state.guards[0];
    g1.x = 304;
    g1.y = 342;
    g1.angle = 1.35;
    g1.state = 'INVESTIGATE';
    g1.alertIcon = '?';
    g1.investigateTarget = { x: 332, y: 468, timer: 3.4 };

    const g2 = state.guards[1];
    g2.x = 962;
    g2.y = 208;
    g2.angle = 1.62;
    g2.range = 198;
    g2.state = 'PATROL';

    state.cameras[0].jammedTimer = 5.4;
    state.empWaves.push({ x: 258, y: 132, radius: 92, maxRadius: 140, timer: 0.9, maxTimer: 1.4 });

    state.cameras[1].angle = -0.06;
    state.cameras[1].fov = 0.78;
    state.cameras[1].range = 242;
    state.smokes.push({ x: 676, y: 214, radius: 46, timer: 5.2, maxTimer: 6.0 });

    state.lasers[0].permanentlyDisabled = true;
    state.lasers[0].active = false;

    recomputeAllCones(state);
    return state;
  }

  if (key === 'caught') {
    const state = buildMultiRouteFloor(0);
    state.screen = 'caught';
    state.time = 3.1;
    state.purse = 1050;
    state.toolsSpent = 150;
    state.alarm = 100;
    state.peakAlarm = 100;
    state.wasSpotted = true;
    state.alarmState = 'CAUGHT';
    state.caughtBy = 'GUARD 1';

    state.thief.x = 434;
    state.thief.y = 166;
    state.thief.angle = 2.6;
    state.thief.inCover = false;

    const g1 = state.guards[0];
    g1.x = 594;
    g1.y = 122;
    g1.angle = Math.atan2(state.thief.y - g1.y, state.thief.x - g1.x);
    g1.state = 'SPOTTED';
    g1.alertIcon = '!';
    g1.lockTimer = 0.45;
    state.caughtSource = { x: g1.x, y: g1.y };

    const g2 = state.guards[1];
    g2.x = 890;
    g2.y = 220;
    g2.angle = 1.57;

    state.cameras[0].x = 294;
    state.cameras[0].y = 42;
    state.cameras[0].angle = 2.02;
    state.cameras[0].range = 175;

    recomputeAllCones(state);
    return state;
  }

  const state = buildMultiRouteFloor(3);
  state.screen = 'getaway';
  state.time = 6.8;
  state.purse = 650;
  state.toolsSpent = 550;
  state.alarm = 18;
  state.peakAlarm = 18;
  state.wasSpotted = false;
  state.alarmState = 'CLEAN';

  state.thief.x = state.exit.x - 22;
  state.thief.y = state.exit.y + state.exit.h * 0.5;
  state.thief.angle = 0;
  state.thief.lootSecured = true;

  state.lasers[0].permanentlyDisabled = true;
  state.lasers[0].active = false;
  state.guards[0].x = 220;
  state.guards[0].y = 84;
  state.guards[0].angle = 0;
  state.guards[1].x = 186;
  state.guards[1].y = 434;
  state.guards[1].angle = -0.4;
  state.guards[2].x = 870;
  state.guards[2].y = 415;
  state.guards[2].angle = -1.7;

  state.payout = evaluateGetawayPayoff(state);
  recomputeAllCones(state);
  return state;
}

function recomputeAllCones(state) {
  for (const g of state.guards) {
    g.conePoly = computeOccludedVisionCone(g.x, g.y, g.angle, g.fov * 0.5, g.range, state.wallSegments, state.smokes);
  }
  for (const c of state.cameras) {
    c.conePoly =
      c.jammedTimer > 0
        ? []
        : computeOccludedVisionCone(c.x, c.y, c.angle, c.fov * 0.5, c.range, state.wallSegments, state.smokes, 38);
  }
}
