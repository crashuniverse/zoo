/** Unified input state for keyboard + touch */

const keys = {};
const pointer = { dx: 0, dy: 0 };
let pointerLocked = false;

export function initInput(canvas) {
  // Keyboard
  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  // Mouse look (pointer lock for desktop)
  canvas.addEventListener('click', () => {
    if (!pointerLocked && !isTouchDevice()) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    pointerLocked = document.pointerLockElement === canvas;
  });

  document.addEventListener('mousemove', (e) => {
    if (pointerLocked) {
      pointer.dx += e.movementX;
      pointer.dy += e.movementY;
    }
  });
}

export function isKeyDown(code) {
  return !!keys[code];
}

export function consumePointerDelta() {
  const dx = pointer.dx;
  const dy = pointer.dy;
  pointer.dx = 0;
  pointer.dy = 0;
  return { dx, dy };
}

export function isPointerLocked() {
  return pointerLocked;
}

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Touch joystick state (set by mobile controls)
const joystickState = { moveX: 0, moveY: 0, lookX: 0, lookY: 0 };

export function setJoystickMove(x, y) {
  joystickState.moveX = x;
  joystickState.moveY = y;
}

export function setJoystickLook(x, y) {
  joystickState.lookX = x;
  joystickState.lookY = y;
}

export function getJoystickState() {
  return joystickState;
}
