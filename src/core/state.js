import { createStore } from 'zustand/vanilla';

export const gameStore = createStore((set, get) => ({
  phase: 'menu', // menu | playing | paused
  health: 100,
  stars: 0,       // collectible stars in the zoo
  message: '',    // on-screen message like "Welcome to the Zoo!"

  startGame: () => set({ phase: 'playing', health: 100, stars: 0, message: 'Explore the zoo!' }),
  pause: () => set({ phase: 'paused' }),
  resume: () => set({ phase: 'playing' }),
  addStar: () => set((s) => ({ stars: s.stars + 1, message: 'You found a star!' })),
  setMessage: (msg) => set({ message: msg }),
  clearMessage: () => set({ message: '' }),
}));
