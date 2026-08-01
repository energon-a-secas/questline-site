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
let countdownTimer = null;    // 1s tick refreshing the live countdowns
let index = 0;                // active hero, kept across re-renders
let paused = false;           // session-level pause state for the carousel

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Gacha-style countdown to an event deadline. Returns a short, human label
 * ("4d 06h left", "Closes today", "Window closed") and a tone the frame uses
 * to warm the badge as the deadline nears. Deadlines are date-only (end of
 * that day, local time), so a same-day event still reads as open.
 */
export function countdownFor(deadline) {
  if (!deadline) return null;
  const end = new Date(`${deadline}T23:59:59`).getTime();
  const ms = end - Date.now();
  if (ms <= 0) return { text: 'Window closed', tone: 'over', urgent: false };
  const mins = Math.floor(ms / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rem = mins % 60;
  let text;
  if (days >= 1) text = `${days}d ${String(hours).padStart(2, '0')}h left`;
  else if (hours >= 1) text = `${hours}h ${String(rem).padStart(2, '0')}m left`;
  else text = `${rem}m left`;
  return { text, tone: days <= 1 ? 'soon' : 'open', urgent: days < 1 };
}

// ── Markup ─────────────────────────────────────────────────

/** One hero slide: gacha-event framing with a live countdown badge. */
function slide(b, i) {
  const cd = countdownFor(b.deadline);
  return `
    <button type="button" class="banner banner--${b.accent} ${i === index ? 'is-active' : ''}"
      data-banner="${b.id}" role="tabpanel" aria-hidden="${i === index ? 'false' : 'true'}"
      ${i === index ? '' : 'tabindex="-1"'}>
      <span class="banner__bg" aria-hidden="true">${icon(b.icon, 132)}</span>
      <span class="banner__scrim" aria-hidden="true"></span>
      <span class="banner__body">
        <span class="banner__topline">
          <span class="banner__kicker">${escHtml(b.kicker)}</span>
          ${cd ? `<span class="banner__timer banner__timer--${cd.tone}" data-deadline="${escHtml(b.deadline)}">
            ${icon('clock', 13)} <span class="banner__timer-val">${escHtml(cd.text)}</span></span>` : ''}
        </span>
        <span class="banner__title">${escHtml(b.title)}</span>
        <span class="banner__blurb">${escHtml(b.blurb)}</span>
        <span class="banner__foot">
          ${b.deadlineLabel ? `<span class="banner__date">${escHtml(b.deadlineLabel)}${b.period ? ` · ${escHtml(b.period)}` : ''}</span>` : ''}
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
  const dots = BANNERS.map((b, i) => {
    const cls = i === index ? 'is-active' : (i < index ? 'is-past' : '');
    return `<button type="button" class="banner__dot ${cls}"
       data-banner-dot="${i}" aria-label="Show: ${escHtml(b.title)}"
       aria-current="${i === index ? 'true' : 'false'}"></button>`;
  }).join('');
  const pauseBtn = `
    <button type="button" class="banner__pause" id="bannerPause"
      aria-label="${paused ? 'Play auto-advance' : 'Pause auto-advance'}"
      aria-pressed="${paused}">
      ${paused ? '▶' : '⏸'}
    </button>`;
  return `
    <div class="bannerstrip" aria-label="Featured news" aria-roledescription="carousel">
      <div class="bannerstrip__stage">${slides}</div>
      <div class="banner__dots" role="tablist" aria-label="Choose a banner">
        ${dots}${BANNERS.length > 1 ? pauseBtn : ''}
      </div>
    </div>`;
}

// ── Controller ─────────────────────────────────────────────

/** Bind carousel controls. Safe to call on every Brief (re)render. */
export function mountBanners(s) {
  const strip = document.querySelector('.bannerstrip');
  if (!strip) { stopAuto(); stopCountdowns(); return; }

  strip.addEventListener('click', (e) => {
    const dot = e.target.closest('[data-banner-dot]');
    if (dot) { go(Number(dot.dataset.bannerDot), true); return; }
    const pause = e.target.closest('#bannerPause');
    if (pause) { togglePause(); return; }
    const card = e.target.closest('[data-banner]');
    if (card) openBanner(card.dataset.banner);
  });

  // Pause auto-advance while the pointer or keyboard focus rests on the strip.
  strip.addEventListener('mouseenter', stopAuto);
  strip.addEventListener('mouseleave', startAuto);
  strip.addEventListener('focusin', stopAuto);
  strip.addEventListener('focusout', startAuto);

  startAuto();
  startCountdowns();
}

/** Tick the live countdown badges once a second, patching text in place. */
function startCountdowns() {
  stopCountdowns();
  const tick = () => {
    const badges = document.querySelectorAll('.banner__timer[data-deadline]');
    if (!badges.length) { stopCountdowns(); return; }
    badges.forEach(badge => {
      const cd = countdownFor(badge.dataset.deadline);
      if (!cd) return;
      const val = badge.querySelector('.banner__timer-val');
      if (val) val.textContent = cd.text;
      badge.classList.remove('banner__timer--open', 'banner__timer--soon', 'banner__timer--over');
      badge.classList.add(`banner__timer--${cd.tone}`);
    });
  };
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function stopCountdowns() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
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
    d.classList.toggle('is-past', i < index);
    d.setAttribute('aria-current', String(on));
  });
  // A manual pick should restart the dwell timer so it does not jump instantly.
  if (restart) startAuto();
}

function startAuto() {
  stopAuto();
  if (paused || reduceMotion() || BANNERS.length < 2) return;
  timer = setInterval(() => go(index + 1), AUTO_MS);
}

function togglePause() {
  paused = !paused;
  const btn = document.getElementById('bannerPause');
  if (btn) {
    btn.setAttribute('aria-label', paused ? 'Play auto-advance' : 'Pause auto-advance');
    btn.setAttribute('aria-pressed', String(paused));
    btn.textContent = paused ? '▶' : '⏸';
  }
  if (paused) stopAuto();
  else startAuto();
}

function stopAuto() {
  if (timer) { clearInterval(timer); timer = null; }
}

/** Open a banner's full story in the focused reading popup. A banner with an
 *  `href` is a shortcut (e.g. cert season → Profile) and routes there instead. */
export function openBanner(id) {
  const b = BANNERS_BY_ID[id];
  if (!b) return;
  if (b.reader === 'shifts') { openShiftsReader(); return; }
  if (b.href) { location.hash = b.href; return; }
  const cd = countdownFor(b.deadline);
  const sub = [b.deadlineLabel, cd ? cd.text : null, b.period]
    .filter(Boolean).join(' · ');
  openReader({
    kicker: b.kicker,
    title: b.title,
    sub: sub || undefined,
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
