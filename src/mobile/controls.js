import nipplejs from 'nipplejs';
import { setJoystickMove, setJoystickLook, isTouchDevice } from '../core/input.js';

let moveManager, lookArea;
let lookTouchId = null;
let lastLookX = 0, lastLookY = 0;

export function initMobileControls() {
  if (!isTouchDevice()) return;

  // --- Left joystick for movement ---
  const moveZone = document.getElementById('joystick-zone');
  if (!moveZone) return;

  moveManager = nipplejs.create({
    zone: moveZone,
    mode: 'static',
    position: { left: '60px', bottom: '60px' },
    size: 100,
    color: 'rgba(255,255,255,0.4)',
  });

  moveManager.on('move', (_e, data) => {
    if (data.vector) {
      setJoystickMove(data.vector.x, data.vector.y);
    }
  });
  moveManager.on('end', () => {
    setJoystickMove(0, 0);
  });

  // --- Right side: touch-drag for camera look ---
  lookArea = document.getElementById('look-zone');
  if (!lookArea) return;

  lookArea.addEventListener('touchstart', (e) => {
    if (lookTouchId !== null) return;
    const touch = e.changedTouches[0];
    lookTouchId = touch.identifier;
    lastLookX = touch.clientX;
    lastLookY = touch.clientY;
  }, { passive: true });

  lookArea.addEventListener('touchmove', (e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier === lookTouchId) {
        const dx = touch.clientX - lastLookX;
        const dy = touch.clientY - lastLookY;
        setJoystickLook(dx * 0.08, dy * 0.08);
        lastLookX = touch.clientX;
        lastLookY = touch.clientY;
      }
    }
  }, { passive: true });

  const endLook = (e) => {
    for (const touch of e.changedTouches) {
      if (touch.identifier === lookTouchId) {
        lookTouchId = null;
        setJoystickLook(0, 0);
      }
    }
  };
  lookArea.addEventListener('touchend', endLook, { passive: true });
  lookArea.addEventListener('touchcancel', endLook, { passive: true });
}
