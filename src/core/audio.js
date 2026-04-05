import { Howl, Howler } from 'howler';

const sounds = {};

export function initAudio() {
  // Unlock audio on mobile — howler does this automatically with autoUnlock
  Howler.autoUnlock = true;
  Howler.volume(0.6);
}

/** Register a sound with a key name — call later with playSound(key) */
export function registerSound(key, src, options = {}) {
  sounds[key] = new Howl({
    src: Array.isArray(src) ? src : [src],
    volume: options.volume ?? 1.0,
    loop: options.loop ?? false,
  });
}

export function playSound(key) {
  if (sounds[key]) {
    sounds[key].play();
  }
}

export function stopSound(key) {
  if (sounds[key]) {
    sounds[key].stop();
  }
}
