import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { isKeyDown, consumePointerDelta, getJoystickState } from '../core/input.js';

const MOVE_SPEED = 5;
const LOOK_SENSITIVITY = 0.002;
const JOYSTICK_LOOK_SPEED = 2.0;
const PLAYER_HEIGHT = 1.4;
const PLAYER_RADIUS = 0.3;

let body, yaw = 0, pitch = 0;

export function createPlayer(camera, world) {
  // Kinematic rigid body for player — we control position manually
  const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
    .setTranslation(0, PLAYER_HEIGHT, 5);
  body = world.createRigidBody(bodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.capsule(PLAYER_HEIGHT / 2, PLAYER_RADIUS);
  world.createCollider(colliderDesc, body);

  camera.position.set(0, PLAYER_HEIGHT, 5);
  camera.rotation.order = 'YXZ';

  return body;
}

export function updatePlayer(camera, delta) {
  if (!body) return;

  // ---- Look ----
  const { dx, dy } = consumePointerDelta();
  const joystick = getJoystickState();

  yaw -= dx * LOOK_SENSITIVITY;
  pitch -= dy * LOOK_SENSITIVITY;

  // Touch look
  yaw -= joystick.lookX * JOYSTICK_LOOK_SPEED * delta;
  pitch -= joystick.lookY * JOYSTICK_LOOK_SPEED * delta;

  pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, pitch));

  camera.rotation.set(pitch, yaw, 0);

  // ---- Move ----
  const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

  const move = new THREE.Vector3();

  // Keyboard
  if (isKeyDown('KeyW') || isKeyDown('ArrowUp')) move.add(forward);
  if (isKeyDown('KeyS') || isKeyDown('ArrowDown')) move.sub(forward);
  if (isKeyDown('KeyA') || isKeyDown('ArrowLeft')) move.sub(right);
  if (isKeyDown('KeyD') || isKeyDown('ArrowRight')) move.add(right);

  // Touch joystick (left stick)
  if (Math.abs(joystick.moveX) > 0.05 || Math.abs(joystick.moveY) > 0.05) {
    move.add(right.clone().multiplyScalar(joystick.moveX));
    move.add(forward.clone().multiplyScalar(-joystick.moveY));
  }

  if (move.length() > 0) move.normalize();

  const pos = body.translation();
  const newPos = {
    x: pos.x + move.x * MOVE_SPEED * delta,
    y: PLAYER_HEIGHT, // keep on ground for now
    z: pos.z + move.z * MOVE_SPEED * delta,
  };

  body.setNextKinematicTranslation(newPos);
  camera.position.set(newPos.x, newPos.y, newPos.z);
}
