import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { addStaticBox } from '../core/physics.js';

const ZOO_HALF = 100;   // expanded from 36 → 100 (200×200 world)

/* ── GLB model loader helper ── */
const loader = new GLTFLoader();
const MODEL_BASE = '/assets/kenney_nature_kit_models/GLTF format/';
const modelCache = {};

function loadModel(name) {
  if (modelCache[name]) return modelCache[name];
  const p = new Promise((resolve) => {
    loader.load(MODEL_BASE + name, (gltf) => {
      const m = gltf.scene;
      m.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
      modelCache[name] = m;
      resolve(m);
    });
  });
  modelCache[name] = p;
  return p;
}

async function placeModel(scene, name, x, y, z, scale = 1, rotY = 0) {
  let m = modelCache[name];
  if (!m || m instanceof Promise) m = await loadModel(name);
  const clone = m.clone();
  clone.position.set(x, y, z);
  if (scale !== 1) clone.scale.setScalar(scale);
  if (rotY !== 0) clone.rotation.y = rotY;
  scene.add(clone);
  return clone;
}

/* seeded-ish random for reproducible layouts */
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

export async function buildZooWorld(scene, world) {
  scene.add(makeStripedGround());
  addStaticBox(world, ZOO_HALF, 0.1, ZOO_HALF, 0, -0.1, 0);

  buildBoundaryWalls(scene, world);
  buildPaths(scene);

  /* ── Enclosures (more of them, spread out) ── */
  const enclosures = [
    { name: 'Lions',       color: 0xd4a44c, pos: [-20, 0, -12],  size: [7, 2, 7] },
    { name: 'Elephants',   color: 0x7a7a7a, pos: [20, 0, -12],   size: [8, 3, 8] },
    { name: 'Monkeys',     color: 0x7B3F00, pos: [-20, 0, -35],  size: [6, 2, 6] },
    { name: 'Penguins',    color: 0x5ba3c9, pos: [20, 0, -35],   size: [6, 1.6, 6] },
    { name: 'Giraffes',    color: 0xd4b347, pos: [0, 0, -55],    size: [8, 4, 8] },
    { name: 'Bears',       color: 0x5c3a1e, pos: [-40, 0, -55],  size: [7, 2.5, 7] },
    { name: 'Zebras',      color: 0xcccccc, pos: [40, 0, -55],   size: [8, 2, 8] },
    { name: 'Tigers',      color: 0xd47a20, pos: [-40, 0, -12],  size: [7, 2.5, 7] },
    { name: 'Hippos',      color: 0x7a6a8a, pos: [40, 0, -12],   size: [7, 2, 7] },
    { name: 'Flamingos',   color: 0xf0a0b0, pos: [-60, 0, -35],  size: [6, 1.8, 6] },
    { name: 'Wolves',      color: 0x666666, pos: [60, 0, -35],   size: [6, 2.2, 6] },
    { name: 'Deer',        color: 0xa08050, pos: [0, 0, -80],     size: [8, 2, 8] },
  ];
  enclosures.forEach((e) => buildEnclosure(scene, world, e));

  /* ── Stars (more hidden around bigger map) ── */
  const starPositions = [
    [-5, 1.2, -3], [5, 1.2, -3], [0, 1.2, -20],
    [-15, 1.2, -45], [15, 1.2, -45], [-35, 1.2, -20], [35, 1.2, -20],
    [-55, 1.2, -50], [55, 1.2, -50], [0, 1.2, -70],
    [-70, 1.2, -10], [70, 1.2, -10], [-30, 1.2, -75], [30, 1.2, -75],
    [0, 1.2, -92],
  ];
  const stars = [];
  starPositions.forEach((p) => {
    const s = makeStar();
    s.position.set(p[0], p[1], p[2]);
    scene.add(s);
    stars.push(s);
  });

  buildEntrance(scene, world);

  /* ── Procedural decorations (primitive fallbacks, placed immediately) ── */
  const treePositions = [
    [-8,0,2],[8,0,2],[-25,0,-5],[25,0,-5],[-25,0,-25],[25,0,-25],
    [-8,0,-45],[8,0,-45],[-50,0,-10],[50,0,-10],[-50,0,-45],[50,0,-45],
    [-70,0,-5],[70,0,-5],[0,0,-15],[-35,0,-70],[35,0,-70],
    [-80,0,-20],[80,0,-20],[-80,0,-50],[80,0,-50],[-15,0,-90],[15,0,-90],
    [-65,0,-65],[65,0,-65],[0,0,-42],[-45,0,-80],[45,0,-80],
  ];
  treePositions.forEach((p) => {
    const t = makeTree(); t.position.set(p[0],p[1],p[2]); scene.add(t);
    addStaticBox(world, 0.2, 0.7, 0.2, p[0], 0.7, p[2]); // trunk collider
  });

  /* Benches along main path */
  for (let z = -5; z > -90; z -= 10) {
    const bL = makeBench(); bL.position.set(-2.8, 0.3, z); scene.add(bL);
    addStaticBox(world, 0.7, 0.35, 0.25, -2.8, 0.35, z);
    const bR = makeBench(); bR.position.set(2.8, 0.3, z); scene.add(bR);
    addStaticBox(world, 0.7, 0.35, 0.25, 2.8, 0.35, z);
  }

  /* Lamp posts */
  for (let z = -2; z > -95; z -= 8) {
    for (const x of [-1.8, 1.8]) {
      const l = makeLampPost(); l.position.set(x, 0, z); scene.add(l);
      addStaticBox(world, 0.07, 1.75, 0.07, x, 1.75, z); // pole collider
    }
  }

  /* Rocks scattered around */
  const rng = seededRandom(42);
  for (let i = 0; i < 25; i++) {
    const rx = (rng() - 0.5) * 180, rz = -rng() * 90 - 5;
    const r = makeRock();
    r.position.set(rx, 0, rz);
    scene.add(r);
    addStaticBox(world, 0.4, 0.35, 0.4, rx, 0.35, rz);
  }

  const fountain = makeFountain();
  fountain.position.set(0, 0, -15);
  scene.add(fountain);
  addStaticBox(world, 2.2, 0.3, 2.2, 0, 0.3, -15); // basin collider
  addStaticBox(world, 0.25, 0.75, 0.25, 0, 0.75, -15); // pillar collider

  /* Direction signs */
  const s1 = makeDirSign('\u2190 Lions, Tigers & Flamingos');
  s1.position.set(-3, 0, -8); scene.add(s1);
  const s2 = makeDirSign('Elephants, Hippos & Wolves \u2192');
  s2.position.set(3, 0, -8); scene.add(s2);
  const s3 = makeDirSign('\u2191 Giraffes, Bears & Deer');
  s3.position.set(0, 0, -18); scene.add(s3);

  /* ═══════════════════════════════════════════
     KENNEY NATURE KIT — GLB MODEL PLACEMENT
     (loaded async, world is playable immediately)
     ═══════════════════════════════════════════ */
  placeNatureModels(scene, world);

  return { stars };
}

/* ── Async model placement (non-blocking) ── */
async function placeNatureModels(scene, world) {
  const rng = seededRandom(1337);
  const R = () => rng();
  const RI = (min, max) => min + Math.floor(R() * (max - min + 1));
  const RF = (min, max) => min + R() * (max - min);

  /* ─── Dense forest borders ─── */
  const treeModels = [
    'tree_default.glb', 'tree_detailed.glb', 'tree_oak.glb', 'tree_fat.glb',
    'tree_pineRoundA.glb', 'tree_pineRoundB.glb', 'tree_pineRoundC.glb',
    'tree_pineTallA.glb', 'tree_pineTallB.glb',
    'tree_tall.glb', 'tree_thin.glb', 'tree_simple.glb',
    'tree_cone.glb', 'tree_blocks.glb', 'tree_plateau.glb',
  ];
  const fallTreeModels = [
    'tree_default_fall.glb', 'tree_detailed_fall.glb', 'tree_oak_fall.glb',
    'tree_fat_fall.glb', 'tree_cone_fall.glb', 'tree_simple_fall.glb',
  ];
  const darkTreeModels = [
    'tree_default_dark.glb', 'tree_detailed_dark.glb', 'tree_oak_dark.glb',
    'tree_cone_dark.glb', 'tree_simple_dark.glb',
  ];

  // Outer forest belt (ring around the boundary)
  for (let i = 0; i < 350; i++) {
    const side = RI(0, 3);
    let x, z;
    if (side === 0) { x = RF(-95, 95); z = RF(-95, -80); }       // far back
    else if (side === 1) { x = RF(-95, 95); z = RF(10, 25); }      // near entrance (behind walls)
    else if (side === 2) { x = RF(-95, -70); z = RF(-95, 25); }   // left
    else { x = RF(70, 95); z = RF(-95, 25); }                      // right

    const allTrees = [...treeModels, ...fallTreeModels, ...darkTreeModels];
    const model = allTrees[RI(0, allTrees.length - 1)];
    const scale = RF(1.2, 2.5);
    const rot = RF(0, Math.PI * 2);
    placeModel(scene, model, x, 0, z, scale, rot);
  }

  // Interior scattered trees (between paths and enclosures)
  const interiorTreeZones = [
    { xMin: -65, xMax: -10, zMin: -70, zMax: -2, count: 30 },  // left interior
    { xMin: 10, xMax: 65, zMin: -70, zMax: -2, count: 30 },    // right interior
    { xMin: -65, xMax: 65, zMin: -95, zMax: -65, count: 20 },  // deep back
  ];
  for (const zone of interiorTreeZones) {
    for (let i = 0; i < zone.count; i++) {
      const x = RF(zone.xMin, zone.xMax);
      const z = RF(zone.zMin, zone.zMax);
      // Skip if too close to paths (x ∈ [-3,3]) or enclosures
      if (Math.abs(x) < 5 && z > -95 && z < 5) continue;
      const model = treeModels[RI(0, treeModels.length - 1)];
      placeModel(scene, model, x, 0, z, RF(1.0, 2.0), RF(0, Math.PI * 2));
    }
  }

  /* ─── Bushes & plants along paths ─── */
  const bushModels = [
    'plant_bush.glb', 'plant_bushDetailed.glb', 'plant_bushLarge.glb',
    'plant_bushSmall.glb', 'plant_bushTriangle.glb', 'plant_bushLargeTriangle.glb',
  ];
  for (let z = -4; z > -92; z -= 3) {
    for (const xOff of [-4.5, 4.5]) {
      if (R() < 0.55) continue; // skip some for variety
      const model = bushModels[RI(0, bushModels.length - 1)];
      placeModel(scene, model, xOff + RF(-0.5, 0.5), 0, z + RF(-0.5, 0.5), RF(1.0, 2.0), RF(0, Math.PI * 2));
    }
  }

  /* ─── Flower gardens ─── */
  const flowerModels = [
    'flower_purpleA.glb', 'flower_purpleB.glb', 'flower_purpleC.glb',
    'flower_redA.glb', 'flower_redB.glb', 'flower_redC.glb',
    'flower_yellowA.glb', 'flower_yellowB.glb', 'flower_yellowC.glb',
  ];
  // Flower beds near enclosures
  const flowerBedCenters = [
    [-20, -5], [20, -5], [-20, -28], [20, -28], [0, -48],
    [-40, -5], [40, -5], [-60, -28], [60, -28], [0, -73],
    [-40, -73], [40, -73],
  ];
  for (const [cx, cz] of flowerBedCenters) {
    const count = RI(6, 14);
    for (let i = 0; i < count; i++) {
      const fx = cx + RF(-3, 3);
      const fz = cz + RF(-2, 2);
      const model = flowerModels[RI(0, flowerModels.length - 1)];
      placeModel(scene, model, fx, 0, fz, RF(1.0, 2.0), RF(0, Math.PI * 2));
    }
  }

  /* ─── Grass tufts scattered widely ─── */
  const grassModels = ['grass.glb', 'grass_large.glb', 'grass_leafs.glb', 'grass_leafsLarge.glb'];
  for (let i = 0; i < 200; i++) {
    const x = RF(-90, 90);
    const z = RF(-95, 5);
    const model = grassModels[RI(0, grassModels.length - 1)];
    placeModel(scene, model, x, 0, z, RF(1.0, 2.5), RF(0, Math.PI * 2));
  }

  /* ─── Rocks & stones ─── */
  const rockModels = [
    'rock_largeA.glb', 'rock_largeB.glb', 'rock_largeC.glb',
    'rock_smallA.glb', 'rock_smallB.glb', 'rock_smallC.glb', 'rock_smallD.glb',
    'rock_tallA.glb', 'rock_tallB.glb',
    'stone_largeA.glb', 'stone_largeB.glb',
    'stone_smallA.glb', 'stone_smallB.glb',
  ];
  for (let i = 0; i < 60; i++) {
    const x = RF(-90, 90);
    const z = RF(-95, 5);
    if (Math.abs(x) < 4 && z > -95) continue;
    const model = rockModels[RI(0, rockModels.length - 1)];
    placeModel(scene, model, x, 0, z, RF(0.8, 2.5), RF(0, Math.PI * 2));
  }

  /* ─── Mushroom clusters ─── */
  const mushroomModels = [
    'mushroom_red.glb', 'mushroom_redGroup.glb', 'mushroom_redTall.glb',
    'mushroom_tan.glb', 'mushroom_tanGroup.glb', 'mushroom_tanTall.glb',
  ];
  const mushroomCenters = [[-30, -15], [30, -40], [-55, -60], [55, -70], [-10, -85], [10, -60]];
  for (const [cx, cz] of mushroomCenters) {
    for (let i = 0; i < RI(3, 7); i++) {
      const model = mushroomModels[RI(0, mushroomModels.length - 1)];
      placeModel(scene, model, cx + RF(-2, 2), 0, cz + RF(-2, 2), RF(1.0, 2.0), RF(0, Math.PI * 2));
    }
  }

  /* ─── Log piles & stumps (woodland feel) ─── */
  const woodModels = [
    'log.glb', 'log_large.glb', 'log_stack.glb', 'log_stackLarge.glb',
    'stump_old.glb', 'stump_round.glb', 'stump_roundDetailed.glb',
    'stump_square.glb', 'stump_squareDetailed.glb',
  ];
  for (let i = 0; i < 30; i++) {
    const x = RF(-85, 85);
    const z = RF(-90, 0);
    if (Math.abs(x) < 6) continue;
    const model = woodModels[RI(0, woodModels.length - 1)];
    placeModel(scene, model, x, 0, z, RF(1.0, 2.0), RF(0, Math.PI * 2));
  }

  /* ─── Campfire rest areas ─── */
  const campfireModels = ['campfire_stones.glb', 'campfire_logs.glb'];
  const campfireSpots = [[-30, -25], [30, -50], [-55, -45], [55, -20], [0, -65]];
  for (const [cx, cz] of campfireSpots) {
    const cfModel = campfireModels[RI(0, campfireModels.length - 1)];
    await placeModel(scene, cfModel, cx, 0, cz, 1.5);
    // Surrounding logs
    for (let a = 0; a < 3; a++) {
      const angle = (a / 3) * Math.PI * 2 + RF(-0.3, 0.3);
      const dist = RF(1.5, 2.5);
      placeModel(scene, 'log.glb', cx + Math.cos(angle) * dist, 0, cz + Math.sin(angle) * dist, 1.0, angle);
    }
  }

  /* ─── Fences along some outer areas ─── */
  const fenceModels = ['fence_simple.glb', 'fence_planks.glb', 'fence_planksDouble.glb'];
  // Left boundary fence
  for (let z = 0; z > -90; z -= 2) {
    const model = fenceModels[RI(0, fenceModels.length - 1)];
    placeModel(scene, model, -68, 0, z, 1.2, 0);
  }
  // Right boundary fence
  for (let z = 0; z > -90; z -= 2) {
    const model = fenceModels[RI(0, fenceModels.length - 1)];
    placeModel(scene, model, 68, 0, z, 1.2, 0);
  }

  /* ─── Tents / rest stops ─── */
  const tentSpots = [[-45, -30], [45, -65], [-65, -75], [65, -15]];
  const tentModels = ['tent_detailedOpen.glb', 'tent_smallOpen.glb'];
  for (const [tx, tz] of tentSpots) {
    const model = tentModels[RI(0, tentModels.length - 1)];
    placeModel(scene, model, tx, 0, tz, 1.5, RF(0, Math.PI * 2));
  }

  /* ─── Bridges over decorative streams ─── */
  // Bridge crossing 1 (left area)
  placeModel(scene, 'bridge_wood.glb', -30, 0, -45, 1.5, Math.PI / 2);
  placeModel(scene, 'bridge_wood.glb', 30, 0, -60, 1.5, Math.PI / 2);
  // Stone bridge near giraffes
  placeModel(scene, 'bridge_stone.glb', 0, 0, -62, 1.5, 0);

  /* ─── Decorative river segments ─── */
  // Use ground_river tiles to create a winding stream
  const riverTiles = [
    { model: 'ground_riverStraight.glb', x: -30, z: -40, rot: 0 },
    { model: 'ground_riverStraight.glb', x: -30, z: -42, rot: 0 },
    { model: 'ground_riverBend.glb', x: -30, z: -44, rot: 0 },
    { model: 'ground_riverStraight.glb', x: -28, z: -44, rot: Math.PI / 2 },
    { model: 'ground_riverStraight.glb', x: -26, z: -44, rot: Math.PI / 2 },
    { model: 'ground_riverEnd.glb', x: -24, z: -44, rot: Math.PI / 2 },
    // Second stream near right side
    { model: 'ground_riverStraight.glb', x: 30, z: -55, rot: 0 },
    { model: 'ground_riverStraight.glb', x: 30, z: -57, rot: 0 },
    { model: 'ground_riverStraight.glb', x: 30, z: -59, rot: 0 },
    { model: 'ground_riverBend.glb', x: 30, z: -61, rot: Math.PI },
    { model: 'ground_riverEnd.glb', x: 32, z: -61, rot: Math.PI / 2 },
  ];
  for (const rt of riverTiles) {
    placeModel(scene, rt.model, rt.x, 0.01, rt.z, 2.0, rt.rot);
  }

  /* ─── Lily pads on water areas ─── */
  const lilyPositions = [[-30, -41], [-29, -43], [-28, -44], [30, -56], [31, -58]];
  for (const [lx, lz] of lilyPositions) {
    const lilyModel = R() > 0.5 ? 'lily_large.glb' : 'lily_small.glb';
    placeModel(scene, lilyModel, lx + RF(-0.3, 0.3), 0.02, lz + RF(-0.3, 0.3), RF(1.0, 1.5), RF(0, Math.PI * 2));
  }

  /* ─── Statues & obelisks (points of interest) ─── */
  placeModel(scene, 'statue_obelisk.glb', 0, 0, -15, 2.0);
  placeModel(scene, 'statue_column.glb', -8, 0, -48, 1.5);
  placeModel(scene, 'statue_column.glb', 8, 0, -48, 1.5);
  placeModel(scene, 'statue_head.glb', 0, 0, -88, 2.5);
  placeModel(scene, 'statue_ring.glb', -55, 0, -10, 2.0);
  placeModel(scene, 'statue_block.glb', 55, 0, -85, 2.0);

  /* ─── Canoe near water ─── */
  placeModel(scene, 'canoe.glb', -32, 0.05, -40, 1.5, 0.3);
  placeModel(scene, 'canoe_paddle.glb', -31.5, 0.1, -39.5, 1.5, 0.5);
  placeModel(scene, 'canoe.glb', 32, 0.05, -56, 1.5, -0.4);

  /* ─── Signs around the park ─── */
  const signPositions = [
    [-30, -10], [30, -10], [-50, -35], [50, -35],
    [-20, -65], [20, -65], [0, -40],
  ];
  for (const [sx, sz] of signPositions) {
    placeModel(scene, 'sign.glb', sx, 0, sz, 1.5, RF(0, Math.PI * 2));
  }

  /* ─── Stone & wood paths connecting areas ─── */
  // Stone path to left enclosures
  for (let i = 0; i < 12; i++) {
    const model = R() > 0.5 ? 'path_stone.glb' : 'path_stoneCircle.glb';
    placeModel(scene, model, -8 - i * 2.5 + RF(-0.3, 0.3), 0.01, -12 + RF(-0.3, 0.3), RF(1.0, 1.3), RF(0, Math.PI * 2));
  }
  // Wood path to right areas
  for (let i = 0; i < 12; i++) {
    const model = 'path_wood.glb';
    placeModel(scene, model, 8 + i * 2.5 + RF(-0.3, 0.3), 0.01, -12 + RF(-0.3, 0.3), RF(1.0, 1.3), RF(0, Math.PI * 2));
  }
  // Stone path to deep enclosures
  for (let i = 0; i < 15; i++) {
    placeModel(scene, 'path_stone.glb', RF(-1, 1), 0.01, -30 - i * 3 + RF(-0.3, 0.3), RF(1.0, 1.3), RF(0, Math.PI * 2));
  }

  /* ─── Hanging moss on trees near water ─── */
  const mossPositions = [[-32, 2.5, -38], [-28, 2.5, -46], [28, 2.5, -53], [32, 2.5, -63]];
  for (const [mx, my, mz] of mossPositions) {
    placeModel(scene, 'hanging_moss.glb', mx, my, mz, 1.5);
  }

  /* ─── Crops / garden area (educational farm zone) ─── */
  const farmCenter = [55, -45];
  const cropModels = [
    'crop_carrot.glb', 'crop_melon.glb', 'crop_pumpkin.glb', 'crop_turnip.glb',
    'crops_cornStageD.glb', 'crops_wheatStageB.glb', 'crops_bambooStageB.glb',
  ];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const model = cropModels[RI(0, cropModels.length - 1)];
      placeModel(scene, model,
        farmCenter[0] - 5 + col * 2, 0,
        farmCenter[1] - 3 + row * 2, 1.5);
    }
    // Dirt row
    placeModel(scene, 'crops_dirtRow.glb',
      farmCenter[0], 0.01, farmCenter[1] - 3 + row * 2, 2.0, Math.PI / 2);
  }

  /* ─── Pots scattered near buildings ─── */
  const potSpots = [[-3, 2], [3, 2], [-20, -18], [20, -18], [-40, -18], [40, -18]];
  for (const [px, pz] of potSpots) {
    const model = R() > 0.5 ? 'pot_large.glb' : 'pot_small.glb';
    placeModel(scene, model, px, 0, pz, RF(1.0, 1.5));
  }

  /* ─── Cliff features (dramatic backdrop) ─── */
  // Back wall cliff face
  for (let x = -80; x <= 80; x += 8) {
    const cliffModel = R() > 0.5 ? 'cliff_rock.glb' : 'cliff_stone.glb';
    placeModel(scene, cliffModel, x + RF(-2, 2), 0, -97 + RF(0, 2), RF(2.0, 3.0), RF(-0.2, 0.2));
  }
  // Side cliff accents
  for (let z = -90; z < -20; z += 12) {
    placeModel(scene, 'cliff_half_rock.glb', -96 + RF(0, 2), 0, z, RF(1.5, 2.5), Math.PI / 2);
    placeModel(scene, 'cliff_half_stone.glb', 96 + RF(-2, 0), 0, z, RF(1.5, 2.5), -Math.PI / 2);
  }

  /* ─── Cactus garden (desert corner) ─── */
  const cactusCenter = [-55, -80];
  for (let i = 0; i < 12; i++) {
    const model = R() > 0.5 ? 'cactus_short.glb' : 'cactus_tall.glb';
    placeModel(scene, model,
      cactusCenter[0] + RF(-6, 6), 0,
      cactusCenter[1] + RF(-4, 4), RF(1.0, 2.0), RF(0, Math.PI * 2));
  }
  // Sandy platform for cactus area
  placeModel(scene, 'platform_beach.glb', cactusCenter[0], 0, cactusCenter[1], 4.0);

  /* ─── Palm tree area (tropical zone) ─── */
  const palmCenter = [55, -80];
  const palmModels = ['tree_palm.glb', 'tree_palmBend.glb', 'tree_palmShort.glb', 'tree_palmTall.glb',
    'tree_palmDetailedShort.glb', 'tree_palmDetailedTall.glb'];
  for (let i = 0; i < 15; i++) {
    const model = palmModels[RI(0, palmModels.length - 1)];
    placeModel(scene, model,
      palmCenter[0] + RF(-8, 8), 0,
      palmCenter[1] + RF(-6, 6), RF(1.2, 2.5), RF(0, Math.PI * 2));
  }
  // Grass platform for tropical zone
  placeModel(scene, 'platform_grass.glb', palmCenter[0], 0, palmCenter[1], 4.0);

  /* ─── Picnic area with flat plants ─── */
  const picnicCenter = [0, -30];
  const flatPlants = ['plant_flatShort.glb', 'plant_flatTall.glb'];
  for (let i = 0; i < 8; i++) {
    const model = flatPlants[RI(0, flatPlants.length - 1)];
    placeModel(scene, model,
      picnicCenter[0] + RF(-4, 4), 0,
      picnicCenter[1] + RF(-3, 3), RF(1.0, 1.5));
  }
}

/* ============ GROUND ============ */

function makeStripedGround() {
  const size = ZOO_HALF * 2;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4a7c3f';
  ctx.fillRect(0, 0, 512, 512);
  const stripeH = 512 / 16;
  ctx.fillStyle = 'rgba(90,145,70,0.35)';
  for (let i = 0; i < 16; i += 2) ctx.fillRect(0, i * stripeH, 512, stripeH);
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = `rgba(${40+Math.random()*30},${80+Math.random()*50},${30+Math.random()*30},0.15)`;
    ctx.fillRect(Math.random()*512, Math.random()*512, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(size / 8, size / 8);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({ map: tex })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  return mesh;
}

/* ============ WALLS ============ */

function buildBoundaryWalls(scene, world) {
  const H = 4, T = 0.6, half = ZOO_HALF;
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a8278, roughness: 0.9 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x6b635b });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6b635b });

  [{px:0,pz:-half,sx:half*2,sz:T},{px:0,pz:half,sx:half*2,sz:T},
   {px:-half,pz:0,sx:T,sz:half*2},{px:half,pz:0,sx:T,sz:half*2}].forEach(({px,pz,sx,sz})=>{
    const w = new THREE.Mesh(new THREE.BoxGeometry(sx,H,sz), wallMat);
    w.position.set(px,H/2,pz); w.castShadow=true; w.receiveShadow=true; scene.add(w);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(sx+0.2,0.25,sz+0.2), trimMat);
    tr.position.set(px,H+0.125,pz); tr.castShadow=true; scene.add(tr);
    addStaticBox(world, sx/2, H/2, sz/2, px, H/2, pz);
  });

  /* Pillars along walls every ~20 units for visual interest */
  const pGeo = new THREE.BoxGeometry(1.2, H+0.6, 1.2);
  // Corners
  [[-half,-half],[-half,half],[half,-half],[half,half]].forEach(([x,z])=>{
    const p = new THREE.Mesh(pGeo, pillarMat);
    p.position.set(x,(H+0.6)/2,z); p.castShadow=true; scene.add(p);
  });
  // Intermediate pillars along each wall
  for (let t = -half + 20; t < half; t += 20) {
    for (const [x, z] of [[t, -half], [t, half], [-half, t], [half, t]]) {
      const p = new THREE.Mesh(pGeo, pillarMat);
      p.position.set(x, (H + 0.6) / 2, z); p.castShadow = true; scene.add(p);
    }
  }
}

/* ============ PATHS ============ */

function buildPaths(scene) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xb8a07a, roughness: 0.85 });
  const add = (w,h,x,y,z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), mat);
    m.rotation.x=-Math.PI/2; m.position.set(x,y,z); m.receiveShadow=true; scene.add(m);
  };
  // Main central path (entrance to back)
  add(3.5, 190, 0, 0.015, -2);
  // East-west cross path near front
  add(190, 3.5, 0, 0.015, -12);
  // East-west cross path mid
  add(190, 3.5, 0, 0.014, -35);
  // East-west cross path deep
  add(130, 3.2, 0, 0.013, -55);
  // East-west cross path very deep
  add(90, 3.2, 0, 0.012, -80);
  // Left side path (connects enclosures vertically)
  add(3.2, 50, -20, 0.012, -35);
  add(3.2, 50, -40, 0.012, -35);
  // Right side path
  add(3.2, 50, 20, 0.012, -35);
  add(3.2, 50, 40, 0.012, -35);
  // Deep left/right paths
  add(3.2, 30, -60, 0.011, -35);
  add(3.2, 30, 60, 0.011, -35);
}

/* ============ ENCLOSURES ============ */

function buildEnclosure(scene, world, {name, color, pos, size}) {
  const [sx,sy,sz] = size;
  const hx = sx/2, hz = sz/2;

  // Ground pad
  const pad = new THREE.Mesh(
    new THREE.PlaneGeometry(sx+1, sz+1),
    new THREE.MeshStandardMaterial({color:0x5a4a3a,roughness:0.95})
  );
  pad.rotation.x=-Math.PI/2; pad.position.set(pos[0],0.005,pos[2]);
  pad.receiveShadow=true; scene.add(pad);

  // Fence posts
  const postMat = new THREE.MeshStandardMaterial({color:0x3a3a3a,metalness:0.6,roughness:0.4});
  const postGeo = new THREE.CylinderGeometry(0.04,0.04,sy+0.5,6);
  const spacing = 0.6;
  for (let side=0; side<4; side++) {
    const isX = side<2, sign = side%2===0?-1:1;
    const count = Math.floor((isX?sz:sx)/spacing);
    for (let i=0; i<=count; i++) {
      const t = -0.5 + i/count;
      const p = new THREE.Mesh(postGeo, postMat);
      if (isX) p.position.set(pos[0]+sign*hx, (sy+0.5)/2, pos[2]+t*sz);
      else     p.position.set(pos[0]+t*sx, (sy+0.5)/2, pos[2]+sign*hz);
      p.castShadow=true; scene.add(p);
    }
    // Top rail
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(isX?0.06:sx, 0.06, isX?sz:0.06), postMat
    );
    rail.position.set(pos[0]+(isX?sign*hx:0), sy+0.4, pos[2]+(isX?0:sign*hz));
    scene.add(rail);
  }

  // Subtle coloured interior
  const inner = new THREE.Mesh(
    new THREE.BoxGeometry(sx*0.9, sy*0.3, sz*0.9),
    new THREE.MeshStandardMaterial({color, transparent:true, opacity:0.15})
  );
  inner.position.set(pos[0], sy*0.15, pos[2]); scene.add(inner);

  // Label sign
  const sg = new THREE.Group();
  const signPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05,0.05,2,6),
    new THREE.MeshStandardMaterial({color:0x4a4a4a})
  );
  signPost.position.set(0,1,0);
  sg.add(signPost);
  const label = makeLabel(name); label.position.y=2.2; sg.add(label);
  sg.position.set(pos[0], 0, pos[2]+hz+0.8); scene.add(sg);

  addStaticBox(world, hx, sy/2, hz, pos[0], sy/2, pos[2]);
}

/* ============ ENTRANCE ============ */

function buildEntrance(scene, world) {
  const mat = new THREE.MeshStandardMaterial({color:0x8a3324, roughness:0.7});
  const lp = new THREE.Mesh(new THREE.BoxGeometry(0.8,4,0.8), mat);
  lp.position.set(-3,2,3); lp.castShadow=true; scene.add(lp);
  addStaticBox(world,0.4,2,0.4,-3,2,3);
  const rp = lp.clone(); rp.position.set(3,2,3); scene.add(rp);
  addStaticBox(world,0.4,2,0.4,3,2,3);
  const beam = new THREE.Mesh(
    new THREE.BoxGeometry(7,0.6,0.8),
    new THREE.MeshStandardMaterial({color:0x6b2318})
  );
  beam.position.set(0,4.1,3); beam.castShadow=true; scene.add(beam);
  const al = makeLabel('ZOO');
  al.position.set(0,4.8,3.5); al.scale.set(3.5,0.9,1); scene.add(al);
}

/* ============ OBJECTS ============ */

function makeLabel(text) {
  const c = document.createElement('canvas');
  c.width=512; c.height=128;
  const ctx = c.getContext('2d');
  ctx.fillStyle='rgba(20,20,20,0.8)';
  ctx.beginPath(); ctx.roundRect(8,8,496,112,14); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.roundRect(8,8,496,112,14); ctx.stroke();
  ctx.fillStyle='#e8e8e8';
  ctx.font='600 42px "SF Pro Display","Segoe UI",Roboto,"Helvetica Neue",sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text,256,64);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex}));
  s.scale.set(2.8,0.7,1);
  return s;
}

function makeStar() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.25,0),
    new THREE.MeshStandardMaterial({color:0xffd700,emissive:0xffa500,emissiveIntensity:0.5,metalness:0.3})
  );
  m.castShadow=true; g.add(m);
  g.userData.isStar=true;
  return g;
}

function makeTree() {
  const g = new THREE.Group();
  const th = 1.2+Math.random()*0.8, lr = 0.9+Math.random()*0.5, lh = 2+Math.random();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12,0.18,th,7),
    new THREE.MeshStandardMaterial({color:0x5c3a1e,roughness:0.9})
  );
  trunk.position.y=th/2; trunk.castShadow=true; g.add(trunk);
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(lr,lh,8),
    new THREE.MeshStandardMaterial({color:0x2d6b2d})
  );
  leaves.position.y=th+lh/2-0.2; leaves.castShadow=true; g.add(leaves);
  const top = new THREE.Mesh(
    new THREE.ConeGeometry(lr*0.6,lh*0.6,7),
    new THREE.MeshStandardMaterial({color:0x358535})
  );
  top.position.y=th+lh*0.8; top.castShadow=true; g.add(top);
  return g;
}

function makeBench() {
  const g = new THREE.Group();
  const w = new THREE.MeshStandardMaterial({color:0x6b4226,roughness:0.85});
  const mt = new THREE.MeshStandardMaterial({color:0x3a3a3a,metalness:0.5});
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.08,0.45),w);
  seat.position.y=0.45; seat.castShadow=true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.4,0.5,0.06),w);
  back.position.set(0,0.7,-0.2); back.castShadow=true; g.add(back);
  [[-0.55,0],[0.55,0]].forEach(([x,z])=>{
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.45,0.4),mt);
    leg.position.set(x,0.225,z); g.add(leg);
  });
  return g;
}

function makeLampPost() {
  const g = new THREE.Group();
  const mt = new THREE.MeshStandardMaterial({color:0x2a2a2a,metalness:0.7,roughness:0.3});
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.06,3.5,8),mt);
  pole.position.y=1.75; pole.castShadow=true; g.add(pole);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.18,8,6,0,Math.PI*2,0,Math.PI/2),
    new THREE.MeshStandardMaterial({color:0xfff8e0,emissive:0xfff0b0,emissiveIntensity:0.3})
  );
  head.position.y=3.5; g.add(head);
  return g;
}

function makeRock() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({color:0x7a756e,roughness:0.95});
  const n = 1+Math.floor(Math.random()*3);
  for (let i=0; i<n; i++) {
    const r = 0.3+Math.random()*0.5;
    const geo = new THREE.SphereGeometry(r,5,4);
    const pa = geo.attributes.position;
    for (let j=0; j<pa.count; j++)
      pa.setXYZ(j,pa.getX(j)*(0.8+Math.random()*0.4),pa.getY(j)*(0.6+Math.random()*0.4),pa.getZ(j)*(0.8+Math.random()*0.4));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo,mat);
    m.position.set(Math.random()*0.6-0.3,r*0.4,Math.random()*0.6-0.3);
    m.castShadow=true; g.add(m);
  }
  return g;
}

function makeFountain() {
  const g = new THREE.Group();
  const st = new THREE.MeshStandardMaterial({color:0x9a9590,roughness:0.8});
  const wt = new THREE.MeshStandardMaterial({color:0x3a8abf,transparent:true,opacity:0.6,metalness:0.1});
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(2,2.2,0.6,16),st);
  basin.position.y=0.3; basin.castShadow=true; g.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.8,16),wt);
  water.rotation.x=-Math.PI/2; water.position.y=0.58; g.add(water);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.25,1.5,8),st);
  pillar.position.y=1.05; pillar.castShadow=true; g.add(pillar);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.4,0.3,10),st);
  bowl.position.y=1.8; g.add(bowl);
  return g;
}

function makeDirSign(text) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04,0.05,1.8,6),
    new THREE.MeshStandardMaterial({color:0x5c3a1e,roughness:0.85})
  );
  post.position.y=0.9; g.add(post);
  const c = document.createElement('canvas');
  c.width=512; c.height=96;
  const ctx = c.getContext('2d');
  ctx.fillStyle='rgba(60,40,20,0.9)';
  ctx.beginPath(); ctx.roundRect(4,4,504,88,10); ctx.fill();
  ctx.fillStyle='#e8dcc8';
  ctx.font='500 32px "SF Pro Display","Segoe UI",Roboto,"Helvetica Neue",sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text,256,48);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({map:tex}));
  s.scale.set(2.2,0.42,1); s.position.y=1.7; g.add(s);
  return g;
}
