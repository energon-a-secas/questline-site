// ── Easter egg ───────────────────────────────────────────────
// A little kiwi bird hides in the System panel. Click it and the kiwi
// scurries across the bottom of the screen, then leaves a one-time toast.

import { ICONS } from './data.js';
import { showToast } from './utils.js';

let running = false;

export function revealKiwi() {
  if (running) return;
  running = true;

  const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const kiwi = document.createElement('div');
  kiwi.className = still ? 'kiwi-run kiwi-run--still' : 'kiwi-run';
  kiwi.setAttribute('aria-hidden', 'true');
  kiwi.innerHTML = `<svg viewBox="0 0 24 24" width="40" height="40" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
    stroke-linejoin="round">${ICONS.kiwi}</svg>`;
  document.body.appendChild(kiwi);

  const done = () => { kiwi.remove(); running = false; };
  // Remove when the run-across animation ends; for the still (reduced-motion)
  // variant there is no long run, so fall back to a timed removal.
  kiwi.addEventListener('animationend', done);
  if (still) setTimeout(done, 1600);

  showToast('A wild kiwi appeared. 🥝');
}
