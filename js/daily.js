// ── Daily Dispatch ───────────────────────────────────────────
// A once-per-day modal that surfaces upcoming event banners, auto-rotates
// through them, and lets the user dismiss individual items permanently or
// snooze the whole dispatch until tomorrow. Accessible from a header bell.

import { BANNERS, BANNERS_BY_ID } from './data.js';
import { escHtml } from './utils.js';
import { icon } from './console.js';
import { countdownFor, openBanner } from './banners.js';
import {
  loadDispatchState, markDispatchShown, dismissDispatchBanner,
  snoozeDispatch, clearDispatchSnooze,
} from './engagement.js';

const AUTO_MS = 8000; // 8s auto-rotate
const STORAGE_KEY = 'questline-dispatch';
let root = null;
let opener = null;
let timer = null;
let index = 0;
let banners = [];
let onCloseCb = null;

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Today's YYYY-MM-DD in local time. */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Active banners that are not past deadline and not permanently dismissed. */
export function eligibleBanners() {
  const { dismissed } = loadDispatchState();
  const dismissedSet = new Set(dismissed);
  return BANNERS.filter(b => {
    if (dismissedSet.has(b.id)) return false;
    const cd = countdownFor(b.deadline);
    return cd?.tone !== 'over';
  });
}

/** True if there are upcoming banners the user has not hidden. */
export function hasUnreadBanners() {
  return eligibleBanners().length > 0;
}

/** Update the header bell unread dot. */
export function updateBellDot() {
  const dot = document.getElementById('dailyBellDot');
  if (!dot) return;
  dot.classList.toggle('is-visible', hasUnreadBanners());
}

/**
 * Auto-open the dispatch once per day. Returns true if it opened.
 * Safe to call on every boot; it checks the shown date first.
 */
export function maybeShowDaily() {
  const { shownDate, snooze } = loadDispatchState();
  const today = todayStr();
  if (shownDate === today || snooze === today) return false;
  const list = eligibleBanners();
  if (!list.length) return false;
  openDaily(list);
  markDispatchShown();
  return true;
}

/** Open the daily dispatch modal, optionally with a specific banner list. */
export function openDaily(list = null) {
  banners = Array.isArray(list) ? list : eligibleBanners();
  if (!banners.length) return;
  index = 0;
  clearDispatchSnooze();
  mount();
}

function mount() {
  close();
  const html = `
    <div class="modal__backdrop" data-daily-close></div>
    <div class="daily fbevel" role="dialog" aria-modal="true" aria-label="Daily dispatch">
      <header class="daily__head">
        <span class="daily__kicker">Operator's Log</span>
        <h2 class="daily__title">Today's dispatch</h2>
        <button type="button" class="daily__close" data-daily-close aria-label="Close dispatch">${icon('x', 16)}</button>
      </header>
      <div class="daily__stage" aria-live="polite" aria-atomic="true">
        ${banners.map(slide).join('')}
      </div>
      ${banners.length > 1 ? `
      <div class="daily__pager">
        <div class="daily__dots" role="tablist" aria-label="Choose an event">
          ${banners.map((b, i) => `
            <button type="button" class="daily__dot ${i === index ? 'is-active' : ''}"
              data-daily-dot="${i}" aria-label="Show: ${escHtml(b.title)}"
              aria-current="${i === index ? 'true' : 'false'}"></button>
          `).join('')}
        </div>
        <span class="daily__count">${index + 1} / ${banners.length}</span>
      </div>` : ''}
      <footer class="daily__foot">
        <button type="button" class="btn btn--ghost btn--sm" data-daily-dismiss>Hide this event</button>
        <div class="daily__foot-right">
          <button type="button" class="btn btn--ghost btn--sm" data-daily-snooze>Remind me tomorrow</button>
          <button type="button" class="btn btn--primary btn--sm" data-daily-close>Got it</button>
        </div>
      </footer>
    </div>`;

  root = document.createElement('div');
  root.className = 'modal modal--daily';
  root.innerHTML = html;
  opener = document.activeElement;
  document.body.appendChild(root);
  document.body.classList.add('modal-open');

  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey, true);
  requestAnimationFrame(() => root?.classList.add('is-visible'));
  updateBellDot();
  sync();
  startAuto();

  // Land focus on the close button — stable header chrome that never becomes
  // aria-hidden. Focusing the active card instead would retain focus on a slide
  // that auto-rotation marks aria-hidden, which AT flags. The card stays
  // reachable by Tab.
  root.querySelector('[data-daily-close]')?.focus();
}

function slide(b, i) {
  const cd = countdownFor(b.deadline);
  const sub = [b.deadlineLabel, cd?.text, b.period].filter(Boolean).join(' · ');
  return `
    <article class="daily__slide ${i === index ? 'is-active' : ''}" data-daily-slide="${i}"
      aria-hidden="${i === index ? 'false' : 'true'}">
      <button type="button" class="daily__card daily__card--${b.accent}" data-daily-open="${b.id}">
        <span class="daily__bg" aria-hidden="true">${icon(b.icon, 120)}</span>
        <span class="daily__scrim" aria-hidden="true"></span>
        <span class="daily__body">
          <span class="daily__topline">
            <span class="daily__kicker-inline">${escHtml(b.kicker)}</span>
            ${cd ? `<span class="daily__timer daily__timer--${cd.tone}">${icon('clock', 12)} ${escHtml(cd.text)}</span>` : ''}
          </span>
          <span class="daily__card-title">${escHtml(b.title)}</span>
          <span class="daily__blurb">${escHtml(b.blurb)}</span>
          ${sub ? `<span class="daily__meta">${escHtml(sub)}</span>` : ''}
          <span class="daily__cta">${escHtml(b.cta)} ${icon('caret-right', 12)}</span>
        </span>
      </button>
    </article>`;
}

function onClick(e) {
  const openBtn = e.target.closest('[data-daily-open]');
  if (openBtn) { close(); openBanner(openBtn.dataset.dailyOpen); return; }

  const dot = e.target.closest('[data-daily-dot]');
  if (dot) { go(Number(dot.dataset.dailyDot), true); return; }

  if (e.target.closest('[data-daily-dismiss]')) {
    const id = banners[index]?.id;
    if (id) dismissDispatchBanner(id);
    banners = eligibleBanners();
    updateBellDot();
    if (!banners.length) { close(); return; }
    if (index >= banners.length) index = banners.length - 1;
    refresh();
    return;
  }

  if (e.target.closest('[data-daily-snooze]')) {
    snoozeDispatch();
    close();
    return;
  }

  if (e.target.closest('[data-daily-close]')) {
    close();
  }
}

function onKey(e) {
  if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); return; }
  if (e.key === 'ArrowLeft') { go(index - 1, true); return; }
  if (e.key === 'ArrowRight') { go(index + 1, true); return; }
  if (e.key === 'Tab') {
    const f = focusable();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
}

function focusable() {
  return root ? [...root.querySelectorAll('button:not([disabled]), a[href]')] : [];
}

function go(next, restart) {
  const n = banners.length;
  if (!n) return;
  index = ((next % n) + n) % n;
  sync();
  if (restart) startAuto();
}

function sync() {
  if (!root) return;
  root.querySelectorAll('[data-daily-slide]').forEach((el, i) => {
    const on = i === index;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-hidden', String(!on));
  });
  root.querySelectorAll('[data-daily-dot]').forEach((d, i) => {
    const on = i === index;
    d.classList.toggle('is-active', on);
    d.setAttribute('aria-current', String(on));
  });
  const count = root.querySelector('.daily__count');
  if (count) count.textContent = `${index + 1} / ${banners.length}`;
}

function refresh() {
  if (!root) return;
  const stage = root.querySelector('.daily__stage');
  if (stage) stage.innerHTML = banners.map(slide).join('');
  const pager = root.querySelector('.daily__pager');
  if (pager) {
    if (banners.length < 2) {
      pager.remove();
    } else {
      const dots = pager.querySelector('.daily__dots');
      if (dots) {
        dots.innerHTML = banners.map((b, i) => `
          <button type="button" class="daily__dot ${i === index ? 'is-active' : ''}"
            data-daily-dot="${i}" aria-label="Show: ${escHtml(b.title)}"
            aria-current="${i === index ? 'true' : 'false'}"></button>
        `).join('');
      }
    }
  }
  sync();
}

function startAuto() {
  stopAuto();
  if (reduceMotion() || banners.length < 2) return;
  timer = setInterval(() => go(index + 1), AUTO_MS);
}

function stopAuto() {
  if (timer) { clearInterval(timer); timer = null; }
}

function close() {
  if (!root) return;
  stopAuto();
  document.removeEventListener('keydown', onKey, true);
  const r = root;
  const op = opener;
  const cb = onCloseCb;
  root = null;
  opener = null;
  onCloseCb = null;
  r.classList.add('is-out');
  const finish = () => {
    document.body.classList.remove('modal-open');
    r.remove();
    cb?.();
    op?.focus?.();
    updateBellDot();
  };
  r.addEventListener('transitionend', finish, { once: true });
  setTimeout(() => { if (r.isConnected) finish(); }, 300);
}

/** Is the daily dispatch currently open? */
export function isDailyOpen() {
  return root !== null;
}
