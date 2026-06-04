// ── Home banners (gacha-style news board) ────────────────────
// A featured carousel at the top of the Brief screen, in the spirit of a
// game's news/event board. Each slide is a glance; opening it routes the
// full story into the focused reading popup (modal.js openReader). The
// six-shifts briefing reuses the same reader, driven by one compact control.
//
// markup:     bannerStrip(s)   → the carousel HTML (one render)
// controller: mountBanners(s)  → binds dots, chevrons, gentle auto-advance,
//                                and click/Enter → openReader (called from
//                                render.js afterWrite, on every Brief render)
// reader:     shiftsControl(s) → the "Six key shifts" read-check + button
//             openShiftsReader → the combined six-shifts reading popup

import { BANNERS, BANNERS_BY_ID, SHIFTS } from './data.js';
import { escHtml } from './utils.js';
import { openReader } from './modal.js';
import { setShiftsRead, state } from './state.js';
import { icon } from './console.js';

const AUTO_MS = 10000;        // slow, ~10s auto-rotate
let timer = null;
let index = 0;                // active hero, kept across re-renders

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ── Markup ─────────────────────────────────────────────────

/** One hero slide: a big optional image (gradient fallback) under the copy. */
function slide(b, i) {
  const bg = b.image
    ? `<span class="banner__img" style="background-image:url('${encodeURI(b.image)}')" aria-hidden="true"></span>`
    : `<span class="banner__bg" aria-hidden="true">${icon(b.icon, 132)}</span>`;
  return `
    <button type="button" class="banner banner--${b.accent} fbevel ${b.image ? 'has-img' : ''} ${i === index ? 'is-active' : ''}"
      data-banner="${b.id}" role="tabpanel" aria-hidden="${i === index ? 'false' : 'true'}"
      ${i === index ? '' : 'tabindex="-1"'}>
      ${bg}
      <span class="banner__scrim" aria-hidden="true"></span>
      <span class="banner__body">
        <span class="banner__kicker">${escHtml(b.kicker)}</span>
        <span class="banner__title">${escHtml(b.title)}</span>
        <span class="banner__blurb">${escHtml(b.blurb)}</span>
        <span class="banner__foot">
          ${b.date ? `<span class="banner__date">${escHtml(b.date)}</span>` : ''}
          <span class="banner__cta">${escHtml(b.cta)} ${icon('caret-right', 14)}</span>
        </span>
      </span>
    </button>`;
}

/** The hero carousel: stacked slides + dot pagination (one big banner shown). */
export function bannerStrip(s) {
  if (!BANNERS.length) return '';
  if (index >= BANNERS.length) index = 0;
  const slides = BANNERS.map(slide).join('');
  const dots = BANNERS.map((b, i) =>
    `<button type="button" class="banner__dot ${i === index ? 'is-active' : ''}"
       data-banner-dot="${i}" aria-label="Show: ${escHtml(b.title)}"
       aria-current="${i === index ? 'true' : 'false'}"></button>`).join('');
  return `
    <div class="bannerstrip" aria-label="Featured news" aria-roledescription="carousel">
      <div class="bannerstrip__stage">${slides}</div>
      <div class="banner__dots" role="tablist" aria-label="Choose a banner">${dots}</div>
    </div>`;
}

// ── Controller ─────────────────────────────────────────────

/** Bind carousel controls. Safe to call on every Brief (re)render. */
export function mountBanners(s) {
  const strip = document.querySelector('.bannerstrip');
  if (!strip) { stopAuto(); return; }

  strip.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-banner-dot]');
    if (dot) { go(Number(dot.dataset.bannerDot), true); return; }
    const card = e.target.closest('[data-banner]');
    if (card) openBanner(card.dataset.banner);
  });

  // Pause auto-advance while the pointer or keyboard focus rests on the strip.
  strip.addEventListener('mouseenter', stopAuto);
  strip.addEventListener('mouseleave', startAuto);
  strip.addEventListener('focusin', stopAuto);
  strip.addEventListener('focusout', startAuto);

  startAuto();
}

function go(next, restart) {
  const n = BANNERS.length;
  if (!n) return;
  index = ((next % n) + n) % n;
  // Swap which slide is active in place (cross-fade via CSS) and sync the
  // dots, without re-rendering the whole strip, so nothing reflows or scrolls.
  const strip = document.querySelector('.bannerstrip');
  if (!strip) return;
  strip.querySelectorAll('.banner').forEach((el, i) => {
    const on = i === index;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-hidden', String(!on));
    if (on) el.removeAttribute('tabindex'); else el.setAttribute('tabindex', '-1');
  });
  strip.querySelectorAll('.banner__dot').forEach((d, i) => {
    const on = i === index;
    d.classList.toggle('is-active', on);
    d.setAttribute('aria-current', String(on));
  });
  // A manual pick should restart the dwell timer so it does not jump instantly.
  if (restart) startAuto();
}

function startAuto() {
  stopAuto();
  if (reduceMotion() || BANNERS.length < 2) return;
  timer = setInterval(() => go(index + 1), AUTO_MS);
}

function stopAuto() {
  if (timer) { clearInterval(timer); timer = null; }
}

/** Open a banner's full story in the focused reading popup. */
export function openBanner(id) {
  const b = BANNERS_BY_ID[id];
  if (!b) return;
  if (b.reader === 'shifts') { openShiftsReader(); return; }
  openReader({
    kicker: b.kicker,
    title: b.title,
    sub: b.date,
    accent: b.accent,
    sections: b.sections,
  });
}

// ── Six key shifts: one control, one reading popup ─────────

/** The compact "Six key shifts" control: a read-check plus a Read button. */
export function shiftsControl(s) {
  const read = s.prefs.shiftsRead;
  return `
    <div class="cshiftbox">
      <button type="button" class="cshiftbox__check ${read ? 'is-read' : ''}" id="shiftsCheck"
        aria-pressed="${read}" aria-label="Mark the six shifts as read">${icon('check', 14)}</button>
      <div class="cshiftbox__main">
        <p class="cshiftbox__lead">Six shifts move the team to one ranked backlog and
        continuous delivery. Read them in a focused view.</p>
        <button type="button" class="btn btn--primary btn--sm" id="shiftsRead">
          ${icon('book', 14)} Read the shifts
        </button>
      </div>
      <span class="cshiftbox__state">${read ? 'Read' : `${SHIFTS.length} shifts`}</span>
    </div>`;
}

/** Open the combined six-shifts briefing and mark it read. */
export function openShiftsReader() {
  setShiftsRead(state, true);
  // Reflect the read state on the Brief control if it is mounted.
  document.getElementById('shiftsCheck')?.classList.add('is-read');
  openReader({
    kicker: 'Orientation',
    title: 'The six key shifts',
    sub: 'What is changing for the team, in brief',
    accent: 'azure',
    sections: SHIFTS.map(sh => ({ heading: `${sh.no}  ${sh.title}`, body: sh.body })),
  });
}
