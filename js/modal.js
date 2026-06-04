// ── Modal & reader overlays ──────────────────────────────────
// Two overlays share one blocking-dialog primitive (.modal): a small
// confirm dialog (openConfirm) for destructive actions, and a focused
// reading surface (openReader) for purposeful reading of longer copy on
// a calm near-black panel. Both reuse the same scrim, Esc-to-close, and
// focus trap, so only one set of keyboard rules ever exists.

import { escHtml } from './utils.js';

let root = null;
let opener = null;   // element focused before the dialog opened, to restore
let onCloseCb = null; // optional teardown, fired on confirm OR cancel

/**
 * Open a confirm dialog.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {string} [opts.confirmLabel='Confirm']
 * @param {boolean} [opts.danger=false]   style the confirm button as danger
 * @param {() => void} [opts.onClose]     runs whenever the dialog closes
 * @param {() => void} opts.onConfirm
 */
export function openConfirm({ title, body, confirmLabel = 'Confirm', danger = false, onClose, onConfirm }) {
  const html = `
    <div class="modal__backdrop" data-close></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-label="${escHtml(title)}">
      <div class="modal__header"><h2>${escHtml(title)}</h2></div>
      <div class="modal__body">${escHtml(body)}</div>
      <div class="modal__footer">
        <button type="button" class="btn btn--ghost btn--sm" data-close>Cancel</button>
        <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'} btn--sm" data-confirm>
          ${escHtml(confirmLabel)}
        </button>
      </div>
    </div>`;
  mount('modal', html, onClose, (e) => {
    if (e.target.closest('[data-confirm]')) { close(); onConfirm?.(); }
    else if (e.target.closest('[data-close]')) { close(); }
  });
  root.querySelector('[data-confirm]')?.focus();
}

/**
 * Open a focused reading popup: a calm, near-black panel with the azure
 * faceted frame, for reading longer copy away from the busy console.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.kicker]   small label above the title
 * @param {string} [opts.sub]      sub-line under the title
 * @param {'azure'|'gold'|'violet'} [opts.accent='azure']
 * @param {Array<{heading?:string, body:string}>} opts.sections
 * @param {() => void} [opts.onClose]
 */
export function openReader({ title, kicker, sub, accent = 'azure', sections = [], onClose }) {
  const blocks = sections.map(sec => `
    <section class="reader__sec">
      ${sec.heading ? `<h3 class="reader__h">${escHtml(sec.heading)}</h3>` : ''}
      <p class="reader__p">${escHtml(sec.body)}</p>
    </section>`).join('');
  const html = `
    <div class="modal__backdrop" data-close></div>
    <div class="reader reader--${accent} fbevel" role="dialog" aria-modal="true" aria-label="${escHtml(title)}">
      <header class="reader__head">
        ${kicker ? `<span class="reader__kicker">${escHtml(kicker)}</span>` : ''}
        <h2 class="reader__title">${escHtml(title)}</h2>
        ${sub ? `<p class="reader__sub">${escHtml(sub)}</p>` : ''}
        <span class="reader__rule" aria-hidden="true"></span>
      </header>
      <div class="reader__body">${blocks}</div>
      <footer class="reader__foot">
        <button type="button" class="btn btn--ghost btn--sm" data-close>Close</button>
      </footer>
    </div>`;
  mount('modal modal--reader', html, onClose, (e) => {
    if (e.target.closest('[data-close]')) close();
  });
  // Let the rule animate in after the panel settles.
  const r = root.querySelector('.reader');
  requestAnimationFrame(() => r?.classList.add('is-in'));
  root.querySelector('[data-close]')?.focus();
}

/** Shared mount: build the overlay, trap focus, wire Esc + a click handler. */
function mount(className, html, onClose, onClick) {
  close();
  onCloseCb = onClose || null;
  root = document.createElement('div');
  root.className = className;
  root.innerHTML = html;
  opener = document.activeElement;
  document.body.appendChild(root);
  document.body.classList.add('modal-open');
  root.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey, true);
}

function focusable() {
  return root ? [...root.querySelectorAll('button:not([disabled]), a[href]')] : [];
}

function onKey(e) {
  if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); return; }
  if (e.key === 'Tab') {
    // Trap focus inside the dialog so Tab can't reach the page behind it.
    const f = focusable();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
}

function close() {
  document.removeEventListener('keydown', onKey, true);
  document.body.classList.remove('modal-open');
  root?.remove();
  root = null;
  // Fire any teardown (e.g. clear the danger vignette) before restoring focus.
  onCloseCb?.();
  onCloseCb = null;
  // Return focus to whatever opened the dialog.
  opener?.focus?.();
  opener = null;
}

/** Is a modal currently open? (so other Esc handlers can stand down) */
export function isModalOpen() {
  return root !== null;
}
