// ── Quick menu ───────────────────────────────────────────────
// NieR-style radial shortcut. Hold Esc; after a short delay a cross
// of four wedges fades in. Point with the arrow keys or by moving the
// mouse away from center, then release Esc to jump to that section.
// A quick tap of Esc (released before the cross appears) goes back.

import { isModalOpen } from './modal.js';
import { isDailyOpen } from './daily.js';
import { isCoachOpen } from './coach.js';
import { isSplashOpen } from './splash.js';
import { isChapterReaderOpen } from './chapterReader.js';
import { isSearchOpen } from './search.js';

const HOLD_MS = 240;          // how long Esc must be held before the cross shows
const DEAD_ZONE = 26;         // px from center before a mouse direction registers

/** The four wedges, clockwise from top — the four primary sections. */
const WEDGES = [
  { dir: 'up',    label: 'Brief',    hash: '#brief',    glyph: '▲' },
  { dir: 'right', label: 'Chapters', hash: '#chapters', glyph: '▶' },
  { dir: 'down',  label: 'Priority', hash: '#priority', glyph: '▼' },
  { dir: 'left',  label: 'Flow',     hash: '#flow',     glyph: '◀' },
];

let armed = false;            // Esc is currently held down
let open = false;             // the cross is visible
let holdTimer = null;
let dir = null;               // current highlighted direction
let center = { x: 0, y: 0 };

/** Is the radial quick menu showing? (so the list keynav stands down) */
export function isQuickMenuOpen() {
  return open || armed;
}

export function initQuickMenu() {
  const root = document.getElementById('quickmenu');
  const cross = document.getElementById('quickmenuCross');
  if (!root || !cross) return;

  // Visible menu trigger for touch/narrow viewports.
  document.getElementById('openQuickMenu')?.addEventListener('click', () => {
    if (isSplashOpen() || isModalOpen() || isDailyOpen() || isCoachOpen()
      || isChapterReaderOpen() || isSearchOpen()) return;
    showCross();
  });

  cross.innerHTML = WEDGES.map(w => `
    <button type="button" class="qm__wedge qm__wedge--${w.dir}" data-dir="${w.dir}" data-hash="${w.hash}">
      <span class="qm__glyph">${w.glyph}</span>
      <span class="qm__label">${w.label}</span>
    </button>`).join('') + '<span class="qm__core" aria-hidden="true">◆</span>';

  // ── Keyboard ──
  window.addEventListener('keydown', (e) => {
    // A confirm dialog, the daily dispatch, the boot splash, the first-run coach,
    // the chapter section reader, or the search palette owns Escape while open.
    if (isSplashOpen() || isModalOpen() || isDailyOpen() || isCoachOpen()
      || isChapterReaderOpen() || isSearchOpen()) return;
    if (e.key !== 'Escape') {
      if (open) handleArrow(e);
      return;
    }
    if (e.repeat) { e.preventDefault(); return; }
    // Begin arming the hold.
    e.preventDefault();
    armed = true;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { if (armed) showCross(); }, HOLD_MS);
  });

  window.addEventListener('keyup', (e) => {
    if (e.key !== 'Escape' || !armed) return;
    clearTimeout(holdTimer);
    if (open) {
      // Release with the cross open → activate the pointed wedge.
      activate();
    } else {
      // Quick tap → go back one level.
      goBack();
    }
    armed = false;
  });

  // ── Mouse direction while open ──
  window.addEventListener('mousemove', (e) => {
    if (!open) return;
    const dx = e.clientX - center.x;
    const dy = e.clientY - center.y;
    if (Math.hypot(dx, dy) < DEAD_ZONE) { setDir(null); return; }
    setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });

  // Click a wedge directly (mouse users without the hold).
  cross.addEventListener('click', (e) => {
    const wedge = e.target.closest('.qm__wedge');
    if (!wedge) return;
    location.hash = wedge.dataset.hash;
    hideCross();
    armed = false;
  });

  // Clicking the scrim closes without navigating.
  root.querySelector('.qm__scrim')?.addEventListener('click', () => {
    hideCross(); armed = false;
  });

  // Losing focus cancels an in-progress hold.
  window.addEventListener('blur', () => {
    clearTimeout(holdTimer); armed = false; if (open) hideCross();
  });
}

function showCross() {
  const root = document.getElementById('quickmenu');
  if (!root) return;
  open = true;
  center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  setDir(null);
  root.hidden = false;
  root.setAttribute('aria-hidden', 'false');
  // Force reflow so the fade-in transition runs.
  void root.offsetWidth;
  root.classList.add('qm--open');
}

function hideCross() {
  const root = document.getElementById('quickmenu');
  if (!root) return;
  open = false;
  dir = null;
  root.classList.remove('qm--open');
  root.setAttribute('aria-hidden', 'true');
  // Hide after the fade-out.
  setTimeout(() => { if (!open) root.hidden = true; }, 180);
}

function setDir(next) {
  dir = next;
  const cross = document.getElementById('quickmenuCross');
  if (!cross) return;
  cross.querySelectorAll('.qm__wedge').forEach(w => {
    w.classList.toggle('is-active', w.dataset.dir === next);
  });
  // Announce the highlighted wedge for screen-reader users.
  const live = document.getElementById('quickmenuLive');
  if (live) {
    const w = WEDGES.find(x => x.dir === next);
    live.textContent = w ? `${w.label}: release to jump` : 'Quick menu open';
  }
}

function handleArrow(e) {
  const map = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' };
  const d = map[e.key];
  if (!d) return;
  e.preventDefault();
  setDir(d);
}

function activate() {
  const wedge = WEDGES.find(w => w.dir === dir);
  hideCross();
  if (wedge) location.hash = wedge.hash;
}

/** Quick tap: step back toward the console home. */
function goBack() {
  const h = (location.hash || '').replace(/^#/, '');
  // From a chapter/flow/sub-tab, go to Brief. From Brief, stay.
  if (h && h !== 'brief') location.hash = '#brief';
}
