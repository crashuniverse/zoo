import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { isKeyDown, consumePointerDelta, getJoystickState } from '../core/input.js';
import { createArms, updateArms } from './arms.js';
import { setFootstepVolume } from '../core/audio.js';

const WALK_SPEED = 5;
const SPRINT_SPEED = 8;
const ACCEL = 12;       // acceleration toward target velocity
const FRICTION = 8;     // deceleration when no input
const LOOK_SENSITIVITY = 0.002;
const JOYSTICK_LOOK_SPEED = 2.0;
const PLAYER_HEIGHT = 1.4;
const PLAYER_RADIUS = 0.3;

// Head bob
const BOB_FREQ = 10;
const BOB_AMOUNT_Y = 0.04;
const BOB_AMOUNT_X = 0.02;

let body, yaw = 0, pitch = 0;
let velocity = new THREE.Vector3();
let bobPhase = 0;

export function createPlayer(camera, world, scene) {
  const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
    .setTranslation(0, PLAYER_HEIGHT, 5);
  body = world.createRigidBody(bodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.capsule(PLAYER_HEIGHT / 2, PLAYER_RADIUS);
  world.createCollider(colliderDesc, body);

  camera.position.set(0, PLAYER_HEIGHT, 5);
  camera.rotation.order = 'YXZ';

  // Arms (camera must be in scene graph for camera.add to work)
  scene.add(camera);
  createArms(camera);

  return body;
}

export function updatePlayer(camera, delta) {
  if (!body) return;

  // ---- Look ----
  const { dx, dy } = consumePointerDelta();
  const joystick = getJoystickState();

  yaw -= dx * LOOK_SENSITIVITY;
  pitch -= dy * LOOK_SENSITIVITY;
  yaw -= joystick.lookX * JOYSTICK_LOOK_SPEED * delta;
  pitch -= joystick.lookY * JOYSTICK_LOOK_SPEED * delta;
  pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));

  // ---- Move ----
  const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

  const input = new THREE.Vector3();

  // Keyboard
  if (isKeyDown('KeyW') || isKeyDown('ArrowUp')) input.add(forward);
  if (isKeyDown('KeyS') || isKeyDown('ArrowDown')) input.sub(forward);
  if (isKeyDown('KeyA') || isKeyDown('ArrowLeft')) input.sub(right);
  if (isKeyDown('KeyD') || isKeyDown('ArrowRight')) input.add(right);

  // Touch joystick
  if (Math.abs(joystick.moveX) > 0.05 || Math.abs(joystick.moveY) > 0.05) {
    input.add(right.clone().multiplyScalar(joystick.moveX));
    input.add(forward.clone().multiplyScalar(joystick.moveY));
  }

  const sprinting = isKeyDown('ShiftLeft') || isKeyDown('ShiftRight');
  const maxSpeed = sprinting ? SPRINT_SPEED : WALK_SPEED;

  if (input.length() > 0) {
    input.normalize();
    const target = input.multiplyScalar(maxSpeed);
    velocity.x += (target.x - velocity.x) * Math.min(1, ACCEL * delta);
    velocity.z += (target.z - velocity.z) * Math.min(1, ACCEL * delta);
  } else {
    // Friction / deceleration
    const fric = Math.min(1, FRICTION * delta);
    velocity.x *= (1 - fric);
    velocity.z *= (1 - fric);
    if (Math.abs(velocity.x) < 0.01) velocity.x = 0;
    if (Math.abs(velocity.z) < 0.01) velocity.z = 0;
  }

  const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);

  // ---- Head bob ----
  if (speed > 0.5) {
    const freq = sprinting ? BOB_FREQ * 1.3 : BOB_FREQ;
    bobPhase += delta * freq;
  } else {
    // Settle bob back to 0
    bobPhase += delta * 4;
    if (bobPhase > Math.PI * 2) bobPhase -= Math.PI * 2;
  }

  const bobFactor = Math.min(speed / WALK_SPEED, 1);
  const headBobY = Math.sin(bobPhase) * BOB_AMOUNT_Y * bobFactor;
  const headBobX = Math.cos(bobPhase * 0.5) * BOB_AMOUNT_X * bobFactor;

  // ---- Apply position ----
  const pos = body.translation();
  const newPos = {
    x: pos.x + velocity.x * delta,
    y: PLAYER_HEIGHT,
    z: pos.z + velocity.z * delta,
  };

  body.setNextKinematicTranslation(newPos);

  camera.position.set(newPos.x + headBobX, newPos.y + headBobY, newPos.z);
  camera.rotation.set(pitch, yaw, 0);

  // ---- Update arms ----
  updateArms(delta, bobFactor, bobPhase);

  // ---- Footstep volume ----
  setFootstepVolume(bobFactor);
}
