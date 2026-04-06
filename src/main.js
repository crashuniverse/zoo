import './style.css';
import { initEngine, onUpdate, startLoop } from './core/engine.js';
import { createScene, createCamera } from './core/scene.js';
import { createPhysicsWorld, stepPhysics } from './core/physics.js';
import { initInput, isTouchDevice } from './core/input.js';
import { initAudio, playStartSound, playStarSound, startFootsteps } from './core/audio.js';
import { gameStore } from './core/state.js';
import { createPlayer, updatePlayer } from './player/controller.js';
import { buildZooWorld } from './world/zoo-map.js';
import { initMobileControls } from './mobile/controls.js';
import { createHUD } from './ui/hud.js';

async function main() {
  const canvas = document.getElementById('game-canvas');

  // Initialise engine (Three.js renderer + Rapier WASM)
  await initEngine(canvas);

  // Scene & camera
  const scene = createScene();
  const camera = createCamera();

  // Physics world
  const world = createPhysicsWorld();

  // Build zoo
  const { stars } = buildZooWorld(scene, world);

  // Player (pass scene so camera can be added to scene graph for arms)
  const playerBody = createPlayer(camera, world, scene);

  // Input
  initInput(canvas);
  initMobileControls();

  // Audio
  initAudio();

  // HUD
  createHUD();

  // Controls hint
  const hintEl = document.getElementById('controls-hint');
  if (hintEl) {
    hintEl.textContent = isTouchDevice()
      ? 'Use the joystick to move, drag the right side to look around'
      : 'WASD to move, mouse to look around — click to start';
  }

  // --- Game loop ---
  onUpdate((delta) => {
    const { phase } = gameStore.getState();
    if (phase !== 'playing') return;

    stepPhysics(delta);
    updatePlayer(camera, delta);

    // Spin stars & simple collect check
    const playerPos = camera.position;
    for (let i = stars.length - 1; i >= 0; i--) {
      const star = stars[i];
      if (!star.visible) continue;
      star.rotation.y += delta * 2;
      star.children[0].position.y = Math.sin(Date.now() * 0.003) * 0.15;

      const dist = playerPos.distanceTo(star.position);
      if (dist < 1.2) {
        star.visible = false;
        gameStore.getState().addStar();
        playStarSound();
      }
    }
  });

  startLoop(scene, camera);
}

main().catch(console.error);
