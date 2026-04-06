import { gameStore } from '../core/state.js';
import { unlockAudio, playStartSound, startFootsteps } from '../core/audio.js';

let hudEl, messageEl, starsEl, startScreen;

export function createHUD() {
  // --- Start screen ---
  startScreen = document.getElementById('start-screen');
  const playBtn = document.getElementById('play-btn');

  const startGame = () => {
    unlockAudio();          // must be first — unlocks iOS Safari audio in gesture
    gameStore.getState().startGame();
    playStartSound();
    startFootsteps();
  };
  playBtn?.addEventListener('click', startGame);
  playBtn?.addEventListener('touchend', (e) => {
    e.preventDefault();
    startGame();
  });

  // --- In-game HUD ---
  hudEl = document.getElementById('hud');
  starsEl = document.getElementById('stars-count');
  messageEl = document.getElementById('game-message');

  // --- Fullscreen button ---
  const fsBtn = document.getElementById('fullscreen-btn');
  const iosToast = document.getElementById('ios-fullscreen-toast');

  // Detect iOS Safari: no Fullscreen API available
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const hasFullscreenAPI = !!(document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen);
  // Already launched as PWA — hide the button entirely
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  if (fsBtn) {
    if (isStandalone) {
      // Already fullscreen via PWA
      fsBtn.style.display = 'none';
    } else if (isIOS && !hasFullscreenAPI) {
      // iOS Safari: show instructional toast on tap
      const showIOSHint = () => {
        if (!iosToast) return;
        iosToast.style.display = 'block';
        clearTimeout(iosToast._timer);
        iosToast._timer = setTimeout(() => { iosToast.style.display = 'none'; }, 5000);
      };
      fsBtn.addEventListener('click', showIOSHint);
      fsBtn.addEventListener('touchend', (e) => { e.preventDefault(); showIOSHint(); });
    } else {
      // Standard Fullscreen API (Android Chrome, desktop)
      const toggleFullscreen = () => {
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
          const el = document.documentElement;
          (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        } else {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        }
      };
      fsBtn.addEventListener('click', toggleFullscreen);
      fsBtn.addEventListener('touchend', (e) => { e.preventDefault(); toggleFullscreen(); });
    }
  }

  // React to state changes
  gameStore.subscribe((state) => {
    if (state.phase === 'playing') {
      if (startScreen) startScreen.style.display = 'none';
      if (hudEl) hudEl.style.display = 'block';
    } else if (state.phase === 'menu') {
      if (startScreen) startScreen.style.display = 'flex';
      if (hudEl) hudEl.style.display = 'none';
    }

    if (starsEl) starsEl.textContent = state.stars;

    if (messageEl && state.message) {
      messageEl.textContent = state.message;
      messageEl.style.opacity = '1';
      clearTimeout(messageEl._timer);
      messageEl._timer = setTimeout(() => {
        messageEl.style.opacity = '0';
      }, 2500);
    }
  });
}
