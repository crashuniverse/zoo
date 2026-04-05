import * as THREE from 'three';
import { addStaticBox } from '../core/physics.js';
import { gameStore } from '../core/state.js';

/**
 * Build a simple zoo world from primitives.
 * This is a placeholder — real models (glTF) come later.
 */
export function buildZooWorld(scene, world) {
  // --- Ground ---
  const groundGeo = new THREE.PlaneGeometry(80, 80);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4a7c3f }); // grass green
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  addStaticBox(world, 40, 0.1, 40, 0, -0.1, 0);

  // --- Path (lighter strip) ---
  const pathGeo = new THREE.PlaneGeometry(3, 60);
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xc2a66b }); // sandy path
  const path = new THREE.Mesh(pathGeo, pathMat);
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, 0.01, -10);
  scene.add(path);

  // Cross path
  const path2 = path.clone();
  path2.rotation.z = Math.PI / 2;
  path2.position.set(0, 0.01, -10);
  scene.add(path2);

  // --- Zoo enclosures (colored boxes) ---
  const enclosures = [
    { name: 'Lions',     color: 0xd4a44c, pos: [-10, 1, -8],  size: [4, 2, 4] },
    { name: 'Elephants', color: 0x888888, pos: [10, 1.5, -8],  size: [5, 3, 5] },
    { name: 'Monkeys',   color: 0x8B4513, pos: [-10, 1, -20], size: [4, 2, 4] },
    { name: 'Penguins',  color: 0x6eb5d9, pos: [10, 0.8, -20], size: [4, 1.6, 4] },
    { name: 'Giraffes',  color: 0xe8c84a, pos: [0, 2, -30],   size: [5, 4, 5] },
  ];

  enclosures.forEach(({ name, color, pos, size }) => {
    // Visible box
    const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
    const mat = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Fence wireframe
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x5c3a1e })
    );
    wire.position.copy(mesh.position);
    scene.add(wire);

    // Label
    const label = makeLabel(name);
    label.position.set(pos[0], pos[1] + size[1] / 2 + 0.6, pos[2] + size[2] / 2 + 0.3);
    scene.add(label);

    // Physics collider for enclosure walls
    addStaticBox(world, size[0] / 2, size[1] / 2, size[2] / 2, pos[0], pos[1], pos[2]);
  });

  // --- Collectible stars ---
  const starPositions = [
    [-5, 1, -3], [5, 1, -3], [0, 1, -14], [-8, 1, -25], [8, 1, -25],
  ];
  const stars = [];
  starPositions.forEach((p) => {
    const star = makeStar();
    star.position.set(p[0], p[1], p[2]);
    scene.add(star);
    stars.push(star);
  });

  // --- Entrance arch ---
  const archGeo = new THREE.BoxGeometry(6, 3, 0.4);
  const archMat = new THREE.MeshStandardMaterial({ color: 0xc0392b });
  const arch = new THREE.Mesh(archGeo, archMat);
  arch.position.set(0, 1.5, 2);
  arch.castShadow = true;
  scene.add(arch);
  addStaticBox(world, 3, 1.5, 0.2, 0, 1.5, 2);

  const archLabel = makeLabel('ZOO');
  archLabel.position.set(0, 3.3, 2.3);
  scene.add(archLabel);

  // --- A few trees (simple cones + cylinders) ---
  const treePositions = [
    [-6, 0, 0], [6, 0, 0], [-15, 0, -15], [15, 0, -15],
    [-3, 0, -28], [3, 0, -28], [15, 0, -28],
  ];
  treePositions.forEach((p) => {
    const tree = makeTree();
    tree.position.set(p[0], p[1], p[2]);
    scene.add(tree);
  });

  // --- Benches (small boxes) ---
  [[-3, 0.3, -5], [3, 0.3, -5], [-3, 0.3, -15], [3, 0.3, -15]].forEach((p) => {
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.5, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x8B5E3C })
    );
    bench.position.set(p[0], p[1], p[2]);
    bench.castShadow = true;
    scene.add(bench);
  });

  return { stars };
}

/* --- helpers --- */

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(20, 20, 20, 0.75)';
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 112, 16);
  ctx.fill();
  ctx.fillStyle = '#f0f0f0';
  ctx.font = '600 44px "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3, 0.75, 1);
  return sprite;
}

function makeStar() {
  const group = new THREE.Group();
  const geo = new THREE.OctahedronGeometry(0.25, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffa500,
    emissiveIntensity: 0.5,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  group.add(mesh);
  group.userData.isStar = true;
  return group;
}

function makeTree() {
  const group = new THREE.Group();

  // Trunk
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 1.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x5c3a1e })
  );
  trunk.position.y = 0.75;
  trunk.castShadow = true;
  group.add(trunk);

  // Leaves
  const leaves = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, 2.5, 7),
    new THREE.MeshStandardMaterial({ color: 0x2d6b2d })
  );
  leaves.position.y = 2.8;
  leaves.castShadow = true;
  group.add(leaves);

  return group;
}
