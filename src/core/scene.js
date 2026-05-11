import * as THREE from 'three';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

const EXR_PATH = '/assets/lighting/rooitou_park_4k.exr';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // sky blue (fallback until EXR loads)
  scene.fog = new THREE.Fog(0x87ceeb, 60, 200);

  // Load HDR environment map
  new EXRLoader().load(EXR_PATH, (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
    scene.backgroundIntensity = 0.8;    // bright but comfortable sky
    scene.environmentIntensity = 0.45;  // pleasant 10am ambient fill
    // Tint fog to match the environment
    scene.fog.color.set(0xa8c8d8);
  });

  // Hemisphere light — very low fill now that EXR provides ambient
  const hemi = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.15);
  scene.add(hemi);

  // Sun — primary directional, moderate intensity
  const sun = new THREE.DirectionalLight(0xfff5e6, 0.7);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  scene.add(sun);

  return scene;
}

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
  camera.position.set(0, 1.4, 5); // eye height of a young girl ~1.4m

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return camera;
}
