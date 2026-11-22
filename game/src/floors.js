/* COPPERLINE architectural floor definitions and multi-route blueprint builder. */

export const WORLD_W = 1040;
export const WORLD_H = 560;
export const WALL_THICK = 18;

export const COPPERLINE_FLOORS = [
  {
    index: 0,
    code: 'FL 1/4',
    name: 'Drafting Hall',
    lootValue: 16000,
    spawn: { x: 96, y: 472 },
    loot: { x: 248, y: 132 },
    exit: { x: 896, y: 42, w: 98, h: 56 },
    interiorWalls: [
      { x: 350, y: 18, w: 20, h: 178 },
      { x: 18, y: 268, w: 146, h: 20 },
      { x: 474, y: 218, w: 178, h: 20 },
      { x: 744, y: 150, w: 20, h: 252 },
      { x: 288, y: 396, w: 160, h: 20 },
    ],
    covers: [
      { x: 158, y: 424, w: 72, h: 66 },
      { x: 526, y: 248, w: 76, h: 64 },
      { x: 632, y: 412, w: 74, h: 64 },
      { x: 786, y: 266, w: 68, h: 66 },
    ],
    vents: [
      {
        id: 'V1',
        rect: { x: 28, y: 44, w: 48, h: 318 },
        dir: 'N',
        grate: { x: 52, y: 278 },
        locked: false,
      },
    ],
    lasers: [
      {
        id: 'L1',
        x1: 754,
        y1: 402,
        x2: 754,
        y2: 542,
        relay: { x: 702, y: 362 },
      },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 446, y: 120 },
          { x: 676, y: 120 },
          { x: 676, y: 344 },
          { x: 446, y: 344 },
        ],
        speed: 78,
        fov: 0.94,
        range: 235,
      },
      {
        id: 'G2',
        label: 'GUARD 2',
        waypoints: [
          { x: 856, y: 196 },
          { x: 964, y: 196 },
          { x: 964, y: 472 },
          { x: 856, y: 472 },
        ],
        speed: 74,
        fov: 0.9,
        range: 215,
      },
    ],
    cameras: [
      {
        id: 'CAM-A',
        x: 372,
        y: 44,
        minAngle: 0.25,
        maxAngle: 1.25,
        sweepSpeed: 0.48,
        fov: 0.72,
        range: 215,
      },
    ],
    routeHints: [
      {
        label: 'VENT FLANK',
        pts: [
          { x: 96, y: 472 },
          { x: 52, y: 350 },
          { x: 52, y: 112 },
          { x: 248, y: 132 },
        ],
      },
      {
        label: 'RELAY LINE',
        pts: [
          { x: 248, y: 132 },
          { x: 564, y: 280 },
          { x: 702, y: 362 },
          { x: 944, y: 70 },
        ],
      },
    ],
  },
  {
    index: 1,
    code: 'FL 2/4',
    name: 'Mint Archive',
    lootValue: 24000,
    spawn: { x: 88, y: 474 },
    loot: { x: 520, y: 274 },
    exit: { x: 902, y: 42, w: 98, h: 56 },
    interiorWalls: [
      { x: 168, y: 84, w: 230, h: 18 },
      { x: 468, y: 84, w: 258, h: 18 },
      { x: 392, y: 182, w: 20, h: 185 },
      { x: 628, y: 182, w: 20, h: 185 },
      { x: 392, y: 182, w: 86, h: 18 },
      { x: 562, y: 182, w: 86, h: 18 },
      { x: 392, y: 349, w: 86, h: 18 },
      { x: 562, y: 349, w: 86, h: 18 },
      { x: 186, y: 244, w: 22, h: 156 },
      { x: 808, y: 244, w: 22, h: 156 },
      { x: 650, y: 454, w: 118, h: 18 },
    ],
    covers: [
      { x: 230, y: 314, w: 72, h: 66 },
      { x: 710, y: 120, w: 72, h: 62 },
      { x: 704, y: 372, w: 74, h: 62 },
      { x: 72, y: 150, w: 68, h: 64 },
    ],
    vents: [
      {
        id: 'V1',
        rect: { x: 126, y: 28, w: 636, h: 46 },
        dir: 'E',
        grate: { x: 154, y: 52 },
        locked: false,
      },
    ],
    lasers: [
      {
        id: 'L1',
        x1: 478,
        y1: 191,
        x2: 562,
        y2: 191,
        relay: { x: 672, y: 191 },
      },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 264, y: 468 },
          { x: 522, y: 468 },
          { x: 522, y: 406 },
          { x: 264, y: 406 },
        ],
        speed: 82,
        fov: 0.92,
        range: 235,
      },
      {
        id: 'G2',
        label: 'GUARD 2',
        waypoints: [
          { x: 722, y: 500 },
          { x: 928, y: 500 },
          { x: 928, y: 298 },
          { x: 874, y: 298 },
        ],
        speed: 80,
        fov: 0.9,
        range: 220,
      },
    ],
    cameras: [
      {
        id: 'CAM-A',
        x: 196,
        y: 114,
        labelOffsetY: 22,
        minAngle: 1.65,
        maxAngle: 2.48,
        sweepSpeed: 0.52,
        fov: 0.68,
        range: 205,
      },
      {
        id: 'CAM-B',
        x: 830,
        y: 154,
        minAngle: -0.25,
        maxAngle: 0.92,
        sweepSpeed: 0.5,
        fov: 0.68,
        range: 198,
      },
    ],
    routeHints: [
      {
        label: 'VENT BYPASS',
        pts: [
          { x: 88, y: 474 },
          { x: 106, y: 182 },
          { x: 154, y: 52 },
          { x: 742, y: 52 },
          { x: 950, y: 70 },
        ],
      },
      {
        label: 'VAULT APPROACH',
        pts: [
          { x: 88, y: 474 },
          { x: 266, y: 348 },
          { x: 520, y: 382 },
          { x: 520, y: 274 },
        ],
      },
    ],
  },
  {
    index: 2,
    code: 'FL 3/4',
    name: 'Clockwork Vault',
    lootValue: 28000,
    spawn: { x: 84, y: 280 },
    loot: { x: 878, y: 286 },
    exit: { x: 900, y: 468, w: 98, h: 56 },
    interiorWalls: [
      { x: 234, y: 118, w: 20, h: 214 },
      { x: 374, y: 18, w: 20, h: 176 },
      { x: 454, y: 224, w: 122, h: 106 },
      { x: 374, y: 384, w: 20, h: 158 },
      { x: 720, y: 92, w: 20, h: 168 },
      { x: 720, y: 346, w: 20, h: 196 },
    ],
    covers: [
      { x: 140, y: 356, w: 72, h: 66 },
      { x: 278, y: 146, w: 72, h: 62 },
      { x: 610, y: 254, w: 74, h: 64 },
      { x: 774, y: 404, w: 72, h: 62 },
    ],
    vents: [
      {
        id: 'V1',
        rect: { x: 416, y: 28, w: 530, h: 46 },
        dir: 'E',
        grate: { x: 446, y: 52 },
        locked: false,
      },
    ],
    lasers: [
      {
        id: 'L1',
        x1: 730,
        y1: 260,
        x2: 730,
        y2: 346,
        relay: { x: 668, y: 124 },
      },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 296, y: 458 },
          { x: 296, y: 258 },
          { x: 418, y: 258 },
          { x: 418, y: 458 },
        ],
        speed: 84,
        fov: 0.92,
        range: 230,
      },
      {
        id: 'G2',
        label: 'GUARD 2',
        waypoints: [
          { x: 792, y: 166 },
          { x: 960, y: 166 },
          { x: 960, y: 388 },
          { x: 792, y: 388 },
        ],
        speed: 86,
        fov: 0.92,
        range: 225,
      },
    ],
    cameras: [
      {
        id: 'CAM-A',
        x: 258,
        y: 132,
        minAngle: 0.25,
        maxAngle: 1.4,
        sweepSpeed: 0.56,
        fov: 0.72,
        range: 215,
      },
      {
        id: 'CAM-B',
        x: 578,
        y: 230,
        minAngle: -0.68,
        maxAngle: 0.56,
        sweepSpeed: 0.54,
        fov: 0.74,
        range: 240,
      },
    ],
    routeHints: [
      {
        label: 'NORTH DUCT',
        pts: [
          { x: 84, y: 280 },
          { x: 312, y: 178 },
          { x: 446, y: 52 },
          { x: 924, y: 52 },
          { x: 878, y: 286 },
        ],
      },
      {
        label: 'TOOLS BREACH',
        pts: [
          { x: 176, y: 388 },
          { x: 646, y: 286 },
          { x: 878, y: 286 },
          { x: 948, y: 496 },
        ],
      },
    ],
  },
  {
    index: 3,
    code: 'FL 4/4',
    name: 'Sovereign Mint',
    lootValue: 32000,
    spawn: { x: 92, y: 472 },
    loot: { x: 520, y: 282 },
    exit: { x: 900, y: 42, w: 98, h: 56 },
    interiorWalls: [
      { x: 266, y: 132, w: 20, h: 120 },
      { x: 266, y: 326, w: 20, h: 120 },
      { x: 754, y: 132, w: 20, h: 120 },
      { x: 754, y: 326, w: 20, h: 120 },
      { x: 432, y: 192, w: 176, h: 18 },
      { x: 432, y: 356, w: 176, h: 18 },
    ],
    covers: [
      { x: 164, y: 256, w: 72, h: 64 },
      { x: 318, y: 256, w: 72, h: 64 },
      { x: 650, y: 256, w: 72, h: 64 },
      { x: 806, y: 256, w: 72, h: 64 },
    ],
    vents: [
      {
        id: 'V1',
        rect: { x: 162, y: 486, w: 716, h: 46 },
        dir: 'E',
        grate: { x: 194, y: 509 },
        locked: false,
      },
    ],
    lasers: [
      {
        id: 'L1',
        x1: 432,
        y1: 210,
        x2: 432,
        y2: 356,
        relay: { x: 344, y: 146 },
      },
      {
        id: 'L2',
        x1: 608,
        y1: 210,
        x2: 608,
        y2: 356,
        relay: { x: 696, y: 146 },
      },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 142, y: 84 },
          { x: 714, y: 84 },
        ],
        speed: 88,
        fov: 0.92,
        range: 235,
      },
      {
        id: 'G2',
        label: 'GUARD 2',
        waypoints: [
          { x: 132, y: 434 },
          { x: 380, y: 434 },
          { x: 380, y: 176 },
          { x: 132, y: 176 },
        ],
        speed: 82,
        fov: 0.9,
        range: 220,
      },
      {
        id: 'G3',
        label: 'GUARD 3',
        waypoints: [
          { x: 910, y: 446 },
          { x: 910, y: 184 },
          { x: 668, y: 184 },
          { x: 668, y: 446 },
        ],
        speed: 86,
        fov: 0.9,
        range: 225,
      },
    ],
    cameras: [
      {
        id: 'CAM-A',
        x: 288,
        y: 142,
        minAngle: 0.3,
        maxAngle: 1.35,
        sweepSpeed: 0.56,
        fov: 0.7,
        range: 210,
      },
      {
        id: 'CAM-B',
        x: 752,
        y: 442,
        minAngle: -2.8,
        maxAngle: -1.75,
        sweepSpeed: 0.56,
        fov: 0.7,
        range: 210,
      },
    ],
    routeHints: [
      {
        label: 'SOUTH DUCT',
        pts: [
          { x: 92, y: 472 },
          { x: 194, y: 509 },
          { x: 846, y: 509 },
          { x: 948, y: 70 },
        ],
      },
      {
        label: 'SANCTUM CORE',
        pts: [
          { x: 200, y: 288 },
          { x: 354, y: 288 },
          { x: 520, y: 282 },
          { x: 686, y: 288 },
          { x: 948, y: 70 },
        ],
      },
    ],
  },
];

export function buildMultiRouteFloor(floorIndex = 0) {
  const idx = ((floorIndex % COPPERLINE_FLOORS.length) + COPPERLINE_FLOORS.length) % COPPERLINE_FLOORS.length;
  const blueprint = COPPERLINE_FLOORS[idx];
  const perimeter = [
    { x: 0, y: 0, w: WORLD_W, h: WALL_THICK },
    { x: 0, y: WORLD_H - WALL_THICK, w: WORLD_W, h: WALL_THICK },
    { x: 0, y: 0, w: WALL_THICK, h: WORLD_H },
    { x: WORLD_W - WALL_THICK, y: 0, w: WALL_THICK, h: WORLD_H },
  ];
  const walls = [...perimeter, ...blueprint.interiorWalls.map((w) => ({ ...w }))];
  const wallSegments = extractWallSegments(walls);

  const guards = blueprint.guards.map((g) => {
    const wp0 = g.waypoints[0];
    const wp1 = g.waypoints[1] ?? wp0;
    const angle = Math.atan2(wp1.y - wp0.y, wp1.x - wp0.x);
    return {
      ...g,
      waypoints: g.waypoints.map((p) => ({ ...p })),
      wpIndex: 1 % g.waypoints.length,
      x: wp0.x,
      y: wp0.y,
      angle,
      targetAngle: angle,
      state: 'PATROL',
      investigateTarget: null,
      lockTimer: 0,
      pauseTimer: 0,
      alertIcon: '',
      conePoly: [],
    };
  });

  const cameras = blueprint.cameras.map((c, i) => ({
    ...c,
    angle: (c.minAngle + c.maxAngle) * 0.5,
    sweepDir: i % 2 === 0 ? 1 : -1,
    pauseTimer: 0,
    jammedTimer: 0,
    lockTimer: 0,
    blinkPhase: i * 1.3,
    conePoly: [],
  }));

  const lasers = blueprint.lasers.map((l) => ({
    ...l,
    relay: { ...l.relay },
    active: true,
    permanentlyDisabled: false,
    disabledTimer: 0,
    hackProgress: 0,
    pulsePhase: 0,
  }));

  const vents = blueprint.vents.map((v) => ({
    ...v,
    rect: { ...v.rect },
    grate: { ...v.grate },
    bypassed: !v.locked,
  }));

  return {
    floorIndex: idx,
    code: blueprint.code,
    name: blueprint.name,
    lootValue: blueprint.lootValue,
    width: WORLD_W,
    height: WORLD_H,
    spawn: { ...blueprint.spawn },
    loot: { ...blueprint.loot, radius: 22 },
    exit: { ...blueprint.exit },
    walls,
    wallSegments,
    covers: blueprint.covers.map((c) => ({ ...c })),
    vents,
    lasers,
    guards,
    cameras,
    routeHints: blueprint.routeHints,
    thief: {
      x: blueprint.spawn.x,
      y: blueprint.spawn.y,
      vx: 0,
      vy: 0,
      radius: 14,
      angle: -Math.PI / 4,
      sneaking: false,
      inCover: false,
      inVent: false,
      crackProgress: 0,
      stepTimer: 0,
      lootSecured: false,
    },
    purse: 1200,
    toolsSpent: 0,
    selectedTool: 0,
    alarm: 0,
    peakAlarm: 0,
    wasSpotted: false,
    alarmState: 'CALM',
    screen: 'playing',
    caughtBy: '',
    caughtSource: null,
    showRoutes: false,
    paused: false,
    time: 0,
    ripples: [],
    coins: [],
    smokes: [],
    empWaves: [],
    floatingTags: [],
    payout: null,
  };
}

function extractWallSegments(walls) {
  const segs = [];
  for (const w of walls) {
    const x1 = w.x;
    const y1 = w.y;
    const x2 = w.x + w.w;
    const y2 = w.y + w.h;
    segs.push(
      { x1, y1, x2, y2: y1 },
      { x1: x2, y1, x2, y2 },
      { x1: x2, y1: y2, x2: x1, y2 },
      { x1, y1: y2, x2: x1, y2: y1 },
    );
  }
  return segs;
}
