/* COPPERLINE architectural floor definitions and multi-route blueprint builder. */

export const FLOOR_COUNT = 4;

export function buildMultiRouteFloor(floorIdx = 0) {
  const idx = ((floorIdx % COPPERLINE_FLOORS.length) + COPPERLINE_FLOORS.length) % COPPERLINE_FLOORS.length;
  const blueprint = COPPERLINE_FLOORS[idx];
  const perimeter = [
    { x: 0, y: 0, w: WORLD_W, h: WALL_THICK },
    { x: 0, y: WORLD_H - WALL_THICK, w: WORLD_W, h: WALL_THICK },
    { x: 0, y: 0, w: WALL_THICK, h: WORLD_H },
    { x: WORLD_W - WALL_THICK, y: 0, w: WALL_THICK, h: WORLD_H },
  ];
  const walls = [...perimeter, ...blueprint.interiorWalls.map((w) => ({ ...w }))];
  const covers = blueprint.covers.map((c) => ({ ...c }));
  const wallSegments = [...extractRectSegments(walls), ...extractCoverCoreSegments(covers)];

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
      statusTag: '',
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
    covers,
    vents,
    lasers,
    guards,
    cameras,
    routeHints: blueprint.routeHints,
    zoneLabels: blueprint.zoneLabels || [],
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
    escapeTrail: [],
    payout: null,
  };
}

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
    loot: { x: 248, y: 146 },
    exit: { x: 878, y: 50, w: 108, h: 56 },
    zoneLabels: [
      { text: 'VAULT CHAMBER', x: 248, y: 54 },
      { text: 'CENTRAL ATRIUM', x: 562, y: 52 },
      { text: 'EAST CORRIDOR', x: 912, y: 520 },
    ],
    interiorWalls: [
      { x: 350, y: 18, w: 20, h: 178 },
      { x: 18, y: 268, w: 146, h: 20 },
      { x: 474, y: 218, w: 178, h: 20 },
      { x: 744, y: 150, w: 20, h: 252 },
      { x: 288, y: 396, w: 160, h: 20 },
    ],
    covers: [
      { x: 158, y: 424, w: 72, h: 66 },
      { x: 526, y: 252, w: 76, h: 64 },
      { x: 632, y: 412, w: 74, h: 64 },
      { x: 786, y: 266, w: 68, h: 66 },
    ],
    vents: [
      {
        id: 'V1',
        rect: { x: 30, y: 46, w: 48, h: 316 },
        dir: 'N',
        grate: { x: 54, y: 278 },
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
          { x: 862, y: 196 },
          { x: 954, y: 196 },
          { x: 954, y: 472 },
          { x: 862, y: 472 },
        ],
        speed: 74,
        fov: 0.9,
        range: 215,
      },
    ],
    cameras: [
      {
        id: 'CAM-A',
        x: 332,
        y: 44,
        minAngle: 1.85,
        maxAngle: 2.55,
        sweepSpeed: 0.48,
        fov: 0.68,
        range: 188,
      },
    ],
    routeHints: [
      {
        label: 'VENT ROUTE',
        pts: [
          { x: 96, y: 472 },
          { x: 54, y: 350 },
          { x: 54, y: 112 },
          { x: 248, y: 146 },
        ],
      },
      {
        label: 'RELAY HACK',
        pts: [
          { x: 248, y: 146 },
          { x: 564, y: 280 },
          { x: 702, y: 362 },
          { x: 932, y: 78 },
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
    exit: { x: 878, y: 50, w: 108, h: 56 },
    zoneLabels: [
      { text: 'WEST WING', x: 108, y: 520 },
      { text: 'VAULT CHAMBER', x: 520, y: 158 },
      { text: 'EAST CORRIDOR', x: 916, y: 522 },
    ],
    interiorWalls: [
      { x: 168, y: 86, w: 230, h: 18 },
      { x: 468, y: 86, w: 258, h: 18 },
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
      { x: 248, y: 318, w: 72, h: 66 },
      { x: 710, y: 122, w: 72, h: 62 },
      { x: 704, y: 372, w: 74, h: 62 },
      { x: 62, y: 336, w: 72, h: 66 },
    ],
    vents: [
      {
        id: 'V1',
        rect: { x: 128, y: 30, w: 632, h: 46 },
        dir: 'E',
        grate: { x: 154, y: 53 },
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
        relay: { x: 676, y: 191 },
      },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 274, y: 472 },
          { x: 526, y: 472 },
          { x: 526, y: 408 },
          { x: 274, y: 408 },
        ],
        speed: 82,
        fov: 0.86,
        range: 225,
      },
      {
        id: 'G2',
        label: 'GUARD 2',
        waypoints: [
          { x: 724, y: 496 },
          { x: 916, y: 496 },
          { x: 916, y: 304 },
          { x: 868, y: 304 },
        ],
        speed: 80,
        fov: 0.86,
        range: 205,
      },
    ],
    cameras: [
      {
        id: 'CAM-A',
        x: 204,
        y: 116,
        labelOffsetY: 24,
        minAngle: 2.02,
        maxAngle: 2.72,
        sweepSpeed: 0.52,
        fov: 0.64,
        range: 186,
      },
      {
        id: 'CAM-B',
        x: 830,
        y: 162,
        minAngle: -0.18,
        maxAngle: 0.62,
        sweepSpeed: 0.5,
        fov: 0.62,
        range: 168,
      },
    ],
    routeHints: [
      {
        label: 'VENT ROUTE',
        pts: [
          { x: 88, y: 474 },
          { x: 98, y: 182 },
          { x: 154, y: 53 },
          { x: 742, y: 53 },
          { x: 932, y: 78 },
        ],
      },
      {
        label: 'VAULT APPROACH',
        pts: [
          { x: 88, y: 474 },
          { x: 284, y: 350 },
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
    loot: { x: 834, y: 192 },
    exit: { x: 878, y: 454, w: 108, h: 56 },
    zoneLabels: [
      { text: 'WEST WING', x: 112, y: 522 },
      { text: 'CENTRAL HUB', x: 515, y: 196 },
      { text: 'VAULT CHAMBER', x: 834, y: 104 },
    ],
    interiorWalls: [
      { x: 234, y: 118, w: 20, h: 214 },
      { x: 374, y: 18, w: 20, h: 176 },
      { x: 454, y: 224, w: 122, h: 106 },
      { x: 374, y: 384, w: 20, h: 158 },
      { x: 720, y: 92, w: 20, h: 168 },
      { x: 720, y: 346, w: 20, h: 196 },
    ],
    covers: [
      { x: 128, y: 364, w: 72, h: 66 },
      { x: 278, y: 148, w: 72, h: 62 },
      { x: 604, y: 446, w: 74, h: 64 },
      { x: 758, y: 430, w: 72, h: 62 },
    ],
    vents: [
      {
        id: 'V1',
        rect: { x: 416, y: 30, w: 530, h: 46 },
        dir: 'E',
        grate: { x: 446, y: 53 },
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
        relay: { x: 664, y: 128 },
      },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 296, y: 458 },
          { x: 296, y: 258 },
          { x: 424, y: 258 },
          { x: 424, y: 458 },
        ],
        speed: 84,
        fov: 0.9,
        range: 235,
      },
      {
        id: 'G2',
        label: 'GUARD 2',
        waypoints: [
          { x: 792, y: 168 },
          { x: 966, y: 168 },
          { x: 966, y: 388 },
          { x: 792, y: 388 },
        ],
        speed: 86,
        fov: 0.92,
        range: 245,
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
        maxAngle: 0.35,
        sweepSpeed: 0.54,
        fov: 0.64,
        range: 192,
      },
    ],
    routeHints: [
      {
        label: 'VENT ROUTE',
        labelPos: { x: 618, y: 94 },
        pts: [
          { x: 84, y: 280 },
          { x: 314, y: 178 },
          { x: 446, y: 53 },
          { x: 834, y: 53 },
          { x: 834, y: 146 },
        ],
      },
      {
        label: 'RELAY HACK',
        labelPos: { x: 528, y: 144 },
        pts: [
          { x: 422, y: 224 },
          { x: 526, y: 146 },
          { x: 664, y: 128 },
          { x: 730, y: 302 },
          { x: 834, y: 192 },
        ],
      },
      {
        label: 'SOUTH FLANK',
        labelPos: { x: 468, y: 516 },
        pts: [
          { x: 164, y: 396 },
          { x: 468, y: 496 },
          { x: 640, y: 478 },
          { x: 730, y: 302 },
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
    exit: { x: 878, y: 50, w: 108, h: 56 },
    zoneLabels: [
      { text: 'WEST WING', x: 112, y: 522 },
      { text: 'VAULT CHAMBER', x: 520, y: 166 },
      { text: 'EAST CORRIDOR', x: 916, y: 522 },
    ],
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
        fov: 0.88,
        range: 225,
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
        fov: 0.88,
        range: 215,
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
        fov: 0.88,
        range: 215,
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
        fov: 0.66,
        range: 195,
      },
      {
        id: 'CAM-B',
        x: 752,
        y: 442,
        minAngle: -2.8,
        maxAngle: -1.75,
        sweepSpeed: 0.56,
        fov: 0.66,
        range: 195,
      },
    ],
    routeHints: [
      {
        label: 'VENT ROUTE',
        pts: [
          { x: 92, y: 472 },
          { x: 194, y: 509 },
          { x: 846, y: 509 },
          { x: 932, y: 78 },
        ],
      },
      {
        label: 'SANCTUM CORE',
        pts: [
          { x: 200, y: 288 },
          { x: 354, y: 288 },
          { x: 520, y: 282 },
          { x: 686, y: 288 },
          { x: 932, y: 78 },
        ],
      },
    ],
  },
];

function extractRectSegments(rects) {
  const segs = [];
  for (const w of rects) {
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

function extractCoverCoreSegments(covers) {
  const segs = [];
  for (const c of covers) {
    const pad = 2;
    const x1 = c.x + pad;
    const y1 = c.y + pad;
    const x2 = c.x + c.w - pad;
    const y2 = c.y + c.h - pad;
    segs.push(
      { x1, y1, x2, y2: y1 },
      { x1: x2, y1, x2, y2 },
      { x1: x2, y1: y2, x2: x1, y2 },
      { x1, y1: y2, x2: x1, y2: y1 },
    );
  }
  return segs;
}
