// ── Game-feel feedback ───────────────────────────────────────
// Celebration beats that make progress legible: a rank-up plate when a
// threshold is crossed, an XP count-up on the visible progress numbers,
// and a codex-style "intel unlocked" toast naming the terms a cleared
// chapter just taught. All respect prefers-reduced-motion.

import { intelUnlockedBy } from './state.js';
import { showToast, escHtml } from './utils.js';

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

let plate = null;

/** A NieR-style PROMOTION plate, shown briefly on a rank threshold cross. */
export function celebrateRankUp(rank) {
  plate?.remove();
  plate = document.createElement('div');
  plate.className = 'rankup';
  plate.setAttribute('role', 'status');
  plate.setAttribute('aria-live', 'polite');
  plate.innerHTML = `
    <div class="rankup__plate">
      <span class="rankup__kicker">Rank up</span>
      <span class="rankup__rule" aria-hidden="true"></span>
      <span class="rankup__name">${escHtml(rank.name)}</span>
      <span class="rankup__blurb">${escHtml(rank.blurb)}</span>
    </div>`;
  document.body.appendChild(plate);
  requestAnimationFrame(() => plate && plate.classList.add('is-visible'));

  const hold = reduceMotion() ? 1400 : 1900;
  setTimeout(() => {
    plate?.classList.remove('is-visible');
    setTimeout(() => { plate?.remove(); plate = null; }, 280);
  }, hold);
}

/** Count the visible "% onboarded" numbers up from old to new, and pulse bars. */
export function animateProgress(from, to) {
  const app = document.getElementById('app');
  if (!app) return;
  app.querySelectorAll('.branch-progress__bar div, .cstat__bar div')
    .forEach(bar => {
      bar.classList.remove('is-gaining');
      void bar.offsetWidth; // restart the pulse
      if (to > from) bar.classList.add('is-gaining');
    });

  const pctEl = app.querySelector('.cstat__pct');
  if (!pctEl || from === to) return;
  if (reduceMotion()) { pctEl.textContent = `${to}% onboarded`; return; }

  const start = performance.now();
  const dur = 480;
  const step = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const val = Math.round(from + (to - from) * eased);
    pctEl.textContent = `${val}% onboarded`;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/**
 * Chapter-cleared toast. Names the Intel terms this chapter covers as a quick
 * pointer into the (now fully open) glossary; chapters that map to no terms
 * fall back to the plain path-unlock message.
 */
export function intelUnlockedToast(s, branchId) {
  const terms = intelUnlockedBy(s, branchId);
  if (!terms.length) {
    showToast('Chapter cleared. New path unlocked');
    return;
  }
  const names = terms.map(t => t.term).join(', ');
  showToast(`Chapter cleared. See Intel: ${names}`);
}
