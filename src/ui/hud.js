import { gameStore } from '../core/state.js';

let hudEl, messageEl, starsEl, startScreen;

export function createHUD() {
  // --- Start screen ---
  startScreen = document.getElementById('start-screen');
  const playBtn = document.getElementById('play-btn');

  playBtn?.addEventListener('click', () => {
    gameStore.getState().startGame();
  });

  // --- In-game HUD ---
  hudEl = document.getElementById('hud');
  starsEl = document.getElementById('stars-count');
  messageEl = document.getElementById('game-message');

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
