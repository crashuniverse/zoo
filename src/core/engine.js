import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

let renderer, clock;
let initialized = false;

const callbacks = [];

export async function initEngine(canvas) {
  await RAPIER.init();

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  clock = new THREE.Clock();
  initialized = true;

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, RAPIER };
}

export function onUpdate(fn) {
  callbacks.push(fn);
}

export function startLoop(scene, camera) {
  function tick() {
    requestAnimationFrame(tick);
    const delta = Math.min(clock.getDelta(), 0.05);
    for (const fn of callbacks) fn(delta);
    renderer.render(scene, camera);
  }
  tick();
}

export function getRenderer() {
  return renderer;
}
