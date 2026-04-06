import * as THREE from 'three';
import { isTouchDevice } from '../core/input.js';

/**
 * First-person arms — two simple forearm + hand meshes
 * attached to the camera. Includes idle sway and walk bob.
 */

const skinMat = new THREE.MeshStandardMaterial({ color: 0xe8b89d, roughness: 0.7 });
const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x3a5c3a, roughness: 0.8 });

let armsGroup;
let leftArm, rightArm;
const isMobile = isTouchDevice();

/**
 * Compute arm layout values based on current viewport & device type.
 *
 * iPhone 15 portrait ≈ 390×844 → aspect 0.46 → hFOV ≈ 36°.
 * At camera-z distance d, visible half-width = d × tan(hFOV/2).
 * Arms *must* fit within that narrow cone, so xOff stays very small
 * and we scale the whole group up so they're unmistakably visible.
 */
function getArmLayout() {
  if (isMobile) {
    // xOff 0.06 keeps arms inside the ~36° horizontal FOV.
    // zOff -0.45 ensures fingers (arm-local z≈0.36) clear the 0.1 near clip
    //   after scale: effective z = 2.5 × (−0.45 + 0.36) = −0.225 ✓
    // scale 2.5 makes arms clearly visible — big on purpose.
    return { xOff: 0.06, yOff: -0.18, zOff: -0.45, scale: 2.5 };
  }
  // Desktop — original values
  const aspect = window.innerWidth / window.innerHeight;
  const xOff = aspect < 1 ? 0.14 : 0.32;
  const zOff = aspect < 1 ? -0.35 : -0.55;
  return { xOff, yOff: -0.35, zOff, scale: 1.0 };
}

function applyArmLayout() {
  if (!leftArm || !rightArm) return;
  const { xOff, yOff, zOff, scale } = getArmLayout();

  leftArm.position.set(-xOff, yOff, zOff);
  leftArm.rotation.set(0.3, 0.1, 0.15);

  rightArm.position.set(xOff, yOff, zOff);
  rightArm.rotation.set(0.3, -0.1, -0.15);

  armsGroup.scale.setScalar(scale);
}

export function createArms(camera) {
  armsGroup = new THREE.Group();
  armsGroup.renderOrder = 999;

  leftArm = buildArm();
  rightArm = buildArm();
  armsGroup.add(leftArm, rightArm);

  applyArmLayout();

  camera.add(armsGroup);

  // Re-layout on resize / orientation change so hands stay visible
  window.addEventListener('resize', applyArmLayout);

  return armsGroup;
}

export function updateArms(delta, speed, bobPhase) {
  if (!armsGroup) return;

  // Idle sway
  const t = performance.now() * 0.001;
  const idleX = Math.sin(t * 1.2) * 0.003;
  const idleY = Math.sin(t * 0.9) * 0.004;

  // Walk sway — proportional to speed
  const walkX = Math.sin(bobPhase) * 0.012 * speed;
  const walkY = Math.abs(Math.cos(bobPhase)) * 0.008 * speed;

  armsGroup.position.x = idleX + walkX;
  armsGroup.position.y = idleY - walkY;
  armsGroup.rotation.z = walkX * 0.5;
}

function buildArm() {
  const arm = new THREE.Group();

  // Sleeve (upper forearm)
  const sleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.05, 0.22, 8),
    sleeveMat
  );
  sleeve.rotation.x = Math.PI / 2;
  sleeve.position.z = 0.05;
  arm.add(sleeve);

  // Forearm (skin)
  const forearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.04, 0.20, 8),
    skinMat
  );
  forearm.rotation.x = Math.PI / 2;
  forearm.position.z = 0.18;
  arm.add(forearm);

  // Hand
  const hand = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.03, 0.08),
    skinMat
  );
  hand.position.z = 0.30;
  hand.position.y = -0.01;
  arm.add(hand);

  // Fingers (simple box)
  const fingers = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.02, 0.05),
    skinMat
  );
  fingers.position.z = 0.36;
  fingers.position.y = -0.015;
  arm.add(fingers);

  return arm;
}
