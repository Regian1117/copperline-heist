export const FLOOR_COUNT = 4;
export function buildAuthoredVault(floor = 0) {
  const idx = ((floor % AUTHORED_VAULTS.length) + AUTHORED_VAULTS.length) % AUTHORED_VAULTS.length;
  const bp = AUTHORED_VAULTS[idx];
  const perimeter = [
    { x: 0, y: 0, w: WORLD_W, h: WALL_THICK },
    { x: 0, y: WORLD_H - WALL_THICK, w: WORLD_W, h: WALL_THICK },
    { x: 0, y: 0, w: WALL_THICK, h: WORLD_H },
    { x: WORLD_W - WALL_THICK, y: 0, w: WALL_THICK, h: WORLD_H },
  ];
  const walls = [...perimeter, ...bp.interiorWalls.map((w) => ({ ...w }))];
  const covers = bp.covers.map((c) => ({ plinth: { ...c.plinth, isPlinth: true }, pad: { ...c.pad } }));
  const solidRects = [...walls, ...covers.map((c) => c.plinth)];
  const wallSegments = extractSolidSegments(walls, covers);

  const guards = bp.guards.map((g) => {
    const wp0 = g.waypoints[0];
    const wp1 = g.waypoints[1] || wp0;
    const angle = Math.atan2(wp1.y - wp0.y, wp1.x - wp0.x);
    return {
      ...g,
      waypoints: g.waypoints.map((p) => ({ ...p })),
      wpIndex: 1 % g.waypoints.length,
      x: wp0.x,
      y: wp0.y,
      angle,
      state: 'PATROL',
      investigateTarget: null,
      lockdownTarget: null,
      lockTimer: 0,
      pauseTimer: 0,
      alertIcon: '',
      statusTag: '',
      conePoly: [],
    };
  });

  const cameras = bp.cameras.map((c, i) => ({
    ...c,
    angle: c.startAngle !== undefined ? c.startAngle : (c.minAngle + c.maxAngle) * 0.5,
    sweepDir: i % 2 === 0 ? 1 : -1,
    pauseTimer: 0,
    jammedTimer: 0,
    lockTimer: 0,
    blinkPhase: i * 1.3,
    conePoly: [],
  }));

  const lasers = bp.lasers.map((l) => ({
    ...l,
    relay: { ...l.relay },
    active: true,
    permanentlyDisabled: false,
    disabledTimer: 0,
    hackProgress: 0,
    pulsePhase: 0,
  }));

  const vents = bp.vents.map((v) => ({
    ...v,
    rect: { ...v.rect },
    grate: { ...v.grate },
    bypassed: !v.locked,
  }));

  return {
    floorIndex: idx,
    code: bp.code,
    name: bp.name,
    lootValue: bp.lootValue,
    width: WORLD_W,
    height: WORLD_H,
    spawn: { ...bp.spawn },
    loot: { ...bp.loot, radius: 22 },
    exit: { ...bp.exit },
    walls,
    covers,
    solidRects,
    wallSegments,
    vents,
    lasers,
    guards,
    cameras,
    routeHints: bp.routeHints,
    zoneLabels: bp.zoneLabels || [],
    thief: {
      x: bp.spawn.x,
      y: bp.spawn.y,
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
    purse: STARTING_PURSE,
    toolsSpent: 0,
    usedTools: [],
    spentParts: [],
    selectedTool: 0,
    alarm: 0,
    peakAlarm: 0,
    wasSpotted: false,
    alarmState: 'CALM',
    screen: 'playing',
    lockdown: false,
    lockdownTimer: 0,
    lockRingRatio: 0,
    lockRingSource: null,
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
    motionTrail: [],
    escapeTrail: [],
    payout: null,
    cam: null,
    playCue: null,
  };
}

/* Hand-authored escalating multi-route vaults and solid wall/plinth segment extractors. */
export const WORLD_W = 1040;
export const WORLD_H = 560;
export const WALL_THICK = 18;
export const STARTING_PURSE = 1200;

export const AUTHORED_VAULTS = [
  {
    index: 0,
    code: 'FL 1/4',
    name: 'Mint Lobby',
    lootValue: 16000,
    spawn: { x: 96, y: 472 },
    loot: { x: 248, y: 152 },
    exit: { x: 882, y: 46, w: 108, h: 56 },
    interiorWalls: [
      { x: 350, y: 18, w: 20, h: 178 },
      { x: 18, y: 268, w: 146, h: 20 },
      { x: 474, y: 218, w: 178, h: 20 },
      { x: 744, y: 150, w: 20, h: 252 },
      { x: 288, y: 396, w: 160, h: 20 },
    ],
    covers: [
      { plinth: { x: 172, y: 392, w: 54, h: 48 }, pad: { x: 112, y: 392, w: 60, h: 64 } },
      { plinth: { x: 526, y: 252, w: 54, h: 48 }, pad: { x: 472, y: 252, w: 54, h: 64 } },
      { plinth: { x: 632, y: 412, w: 54, h: 48 }, pad: { x: 576, y: 412, w: 56, h: 64 } },
      { plinth: { x: 786, y: 266, w: 54, h: 48 }, pad: { x: 786, y: 314, w: 68, h: 56 } },
    ],
    vents: [
      { id: 'V1', rect: { x: 32, y: 54, w: 34, h: 296 }, dir: 'N', grate: { x: 49, y: 278 }, locked: false },
    ],
    lasers: [
      { id: 'L1', x1: 754, y1: 402, x2: 754, y2: 542, relay: { x: 702, y: 362 } },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 448, y: 348 },
          { x: 252, y: 348 },
          { x: 448, y: 348 },
          { x: 448, y: 132 },
          { x: 672, y: 132 },
          { x: 672, y: 348 },
        ],
        speed: 82,
        fov: 0.92,
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
      { id: 'CAM-A', x: 332, y: 44, minAngle: 1.85, maxAngle: 2.55, sweepSpeed: 0.48, fov: 0.68, range: 185 },
    ],
    routeHints: [
      { label: 'VENT ROUTE', pts: [{ x: 96, y: 472 }, { x: 49, y: 350 }, { x: 49, y: 112 }, { x: 248, y: 152 }] },
      { label: 'RELAY HACK', pts: [{ x: 248, y: 152 }, { x: 564, y: 280 }, { x: 702, y: 362 }, { x: 932, y: 74 }] },
    ],
    zoneLabels: [
      { text: 'WEST VAULT', x: 186, y: 58 },
      { text: 'MAIN ATRIUM', x: 546, y: 58 },
      { text: 'EAST EXIT BAY', x: 868, y: 148 },
    ],
  },
  {
    index: 1,
    code: 'FL 2/4',
    name: 'Gallery Vault',
    lootValue: 24000,
    spawn: { x: 90, y: 470 },
    loot: { x: 520, y: 274 },
    exit: { x: 882, y: 46, w: 108, h: 56 },
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
      { plinth: { x: 266, y: 332, w: 56, h: 52 }, pad: { x: 212, y: 314, w: 54, h: 72 } },
      { plinth: { x: 710, y: 122, w: 54, h: 48 }, pad: { x: 764, y: 122, w: 56, h: 64 } },
      { plinth: { x: 704, y: 372, w: 54, h: 48 }, pad: { x: 650, y: 372, w: 54, h: 64 } },
      { plinth: { x: 78, y: 336, w: 54, h: 48 }, pad: { x: 78, y: 274, w: 68, h: 62 } },
    ],
    vents: [
      { id: 'V1', rect: { x: 146, y: 26, w: 604, h: 30 }, dir: 'E', grate: { x: 170, y: 41 }, locked: false },
    ],
    lasers: [
      { id: 'L1', x1: 478, y1: 191, x2: 562, y2: 191, relay: { x: 682, y: 191 } },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 346, y: 468 },
          { x: 556, y: 468 },
          { x: 556, y: 376 },
          { x: 346, y: 376 },
        ],
        speed: 86,
        fov: 0.86,
        range: 235,
      },
      {
        id: 'G2',
        label: 'GUARD 2',
        waypoints: [
          { x: 734, y: 496 },
          { x: 918, y: 496 },
          { x: 918, y: 296 },
          { x: 874, y: 296 },
        ],
        speed: 80,
        fov: 0.86,
        range: 205,
      },
    ],
    cameras: [
      { id: 'CAM-A', x: 196, y: 112, labelOffsetY: 24, minAngle: 2.02, maxAngle: 2.72, sweepSpeed: 0.52, fov: 0.64, range: 178 },
      { id: 'CAM-B', x: 836, y: 164, minAngle: -0.18, maxAngle: 0.62, sweepSpeed: 0.5, fov: 0.62, range: 148 },
    ],
    routeHints: [
      { label: 'VENT ROUTE', pts: [{ x: 90, y: 470 }, { x: 96, y: 182 }, { x: 170, y: 41 }, { x: 726, y: 41 }, { x: 932, y: 74 }] },
      { label: 'VAULT APPROACH', pts: [{ x: 90, y: 470 }, { x: 240, y: 350 }, { x: 520, y: 382 }, { x: 520, y: 274 }] },
    ],
    zoneLabels: [
      { text: 'WEST GALLERY', x: 112, y: 156 },
      { text: 'VAULT CHAMBER', x: 520, y: 222 },
      { text: 'EAST FOYER', x: 896, y: 204 },
    ],
  },
  {
    index: 2,
    code: 'FL 3/4',
    name: 'Laser Archive',
    lootValue: 28000,
    spawn: { x: 88, y: 310 },
    loot: { x: 806, y: 204 },
    exit: { x: 882, y: 454, w: 108, h: 56 },
    interiorWalls: [
      { x: 234, y: 118, w: 20, h: 214 },
      { x: 374, y: 18, w: 20, h: 176 },
      { x: 454, y: 224, w: 122, h: 106 },
      { x: 374, y: 384, w: 20, h: 158 },
      { x: 704, y: 92, w: 20, h: 158 },
      { x: 704, y: 336, w: 20, h: 206 },
    ],
    covers: [
      { plinth: { x: 128, y: 364, w: 54, h: 48 }, pad: { x: 128, y: 412, w: 68, h: 58 } },
      { plinth: { x: 278, y: 148, w: 54, h: 48 }, pad: { x: 278, y: 196, w: 68, h: 54 } },
      { plinth: { x: 604, y: 446, w: 54, h: 48 }, pad: { x: 548, y: 446, w: 56, h: 64 } },
      { plinth: { x: 758, y: 430, w: 54, h: 48 }, pad: { x: 758, y: 478, w: 68, h: 54 } },
    ],
    vents: [
      { id: 'V1', rect: { x: 404, y: 26, w: 468, h: 30 }, dir: 'E', grate: { x: 434, y: 41 }, locked: false },
    ],
    lasers: [
      { id: 'L1', x1: 714, y1: 250, x2: 714, y2: 336, relay: { x: 638, y: 136 } },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 298, y: 444 },
          { x: 298, y: 274 },
          { x: 420, y: 274 },
          { x: 420, y: 444 },
        ],
        speed: 84,
        fov: 0.9,
        range: 240,
      },
      {
        id: 'G2',
        label: 'GUARD 2',
        waypoints: [
          { x: 786, y: 174 },
          { x: 896, y: 174 },
          { x: 896, y: 372 },
          { x: 786, y: 372 },
        ],
        speed: 84,
        fov: 0.9,
        range: 220,
      },
    ],
    cameras: [
      { id: 'CAM-A', x: 256, y: 132, minAngle: 0.25, maxAngle: 1.4, sweepSpeed: 0.54, fov: 0.72, range: 198 },
      { id: 'CAM-B', x: 576, y: 234, minAngle: -0.68, maxAngle: 0.35, sweepSpeed: 0.54, fov: 0.64, range: 118 },
    ],
    routeHints: [
      { label: 'VENT ROUTE', labelPos: { x: 618, y: 82 }, pts: [{ x: 88, y: 310 }, { x: 306, y: 222 }, { x: 434, y: 41 }, { x: 830, y: 41 }, { x: 806, y: 146 }] },
      { label: 'SOUTH FLANK', labelPos: { x: 468, y: 510 }, pts: [{ x: 164, y: 438 }, { x: 468, y: 496 }, { x: 632, y: 470 }, { x: 714, y: 292 }] },
    ],
    zoneLabels: [
      { text: 'WEST INTAKE', x: 132, y: 76 },
      { text: 'ARCHIVE CORE', x: 515, y: 196 },
      { text: 'LASER VAULT', x: 868, y: 108 },
    ],
  },
  {
    index: 3,
    code: 'FL 4/4',
    name: 'Apex Treasury',
    lootValue: 32000,
    spawn: { x: 96, y: 468 },
    loot: { x: 540, y: 288 },
    exit: { x: 830, y: 52, w: 108, h: 56 },
    interiorWalls: [
      { x: 266, y: 132, w: 20, h: 120 },
      { x: 266, y: 326, w: 20, h: 120 },
      { x: 754, y: 132, w: 20, h: 120 },
      { x: 754, y: 326, w: 20, h: 120 },
      { x: 446, y: 196, w: 188, h: 18 },
      { x: 446, y: 362, w: 188, h: 18 },
    ],
    covers: [
      { plinth: { x: 164, y: 256, w: 54, h: 48 }, pad: { x: 112, y: 256, w: 52, h: 64 } },
      { plinth: { x: 318, y: 256, w: 54, h: 48 }, pad: { x: 372, y: 256, w: 54, h: 64 } },
      { plinth: { x: 654, y: 360, w: 54, h: 48 }, pad: { x: 654, y: 408, w: 68, h: 52 } },
      { plinth: { x: 806, y: 334, w: 54, h: 48 }, pad: { x: 860, y: 334, w: 56, h: 64 } },
    ],
    vents: [
      { id: 'V1', rect: { x: 162, y: 496, w: 696, h: 30 }, dir: 'E', grate: { x: 194, y: 511 }, locked: false },
    ],
    lasers: [
      { id: 'L1', x1: 455, y1: 214, x2: 455, y2: 362, relay: { x: 368, y: 152 } },
      { id: 'L2', x1: 625, y1: 214, x2: 625, y2: 362, relay: { x: 696, y: 152 } },
    ],
    guards: [
      {
        id: 'G1',
        label: 'GUARD 1',
        waypoints: [
          { x: 240, y: 88 },
          { x: 540, y: 88 },
        ],
        speed: 82,
        fov: 0.86,
        range: 205,
      },
      {
        id: 'G2',
        label: 'GUARD 2',
        waypoints: [
          { x: 688, y: 448 },
          { x: 896, y: 448 },
          { x: 896, y: 344 },
          { x: 688, y: 344 },
        ],
        speed: 82,
        fov: 0.86,
        range: 205,
      },
      {
        id: 'G3',
        label: 'GUARD 3',
        waypoints: [
          { x: 136, y: 432 },
          { x: 392, y: 432 },
          { x: 392, y: 176 },
          { x: 136, y: 176 },
        ],
        speed: 82,
        fov: 0.86,
        range: 205,
      },
    ],
    cameras: [
      { id: 'CAM-A', x: 312, y: 142, minAngle: 0.3, maxAngle: 1.35, sweepSpeed: 0.54, fov: 0.66, range: 190 },
      { id: 'CAM-B', x: 750, y: 440, minAngle: -2.75, maxAngle: -1.75, sweepSpeed: 0.54, fov: 0.64, range: 126 },
    ],
    routeHints: [
      { label: 'SOUTH VENT', pts: [{ x: 96, y: 468 }, { x: 194, y: 511 }, { x: 830, y: 511 }, { x: 884, y: 80 }] },
      { label: 'TREASURY CORE', pts: [{ x: 140, y: 288 }, { x: 396, y: 288 }, { x: 540, y: 288 }, { x: 696, y: 152 }, { x: 884, y: 80 }] },
    ],
    zoneLabels: [
      { text: 'WEST ANNEX', x: 148, y: 76 },
      { text: 'APEX TREASURY', x: 540, y: 170 },
      { text: 'EAST CONCOURSE', x: 884, y: 224 },
    ],
  },
];

export function extractSolidSegments(walls, covers) {
  const segs = [];
  const pushRect = (r, pad) => {
    const x1 = r.x + pad;
    const y1 = r.y + pad;
    const x2 = r.x + r.w - pad;
    const y2 = r.y + r.h - pad;
    segs.push(
      { x1, y1, x2, y2: y1 },
      { x1: x2, y1, x2, y2 },
      { x1: x2, y1: y2, x2: x1, y2 },
      { x1, y1: y2, x2: x1, y2: y1 },
    );
  };
  for (const w of walls) pushRect(w, 0);
  for (const c of covers) pushRect(c.plinth, 1);
  return segs;
}
