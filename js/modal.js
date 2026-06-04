// ── Confirm modal ────────────────────────────────────────────
// A small blocking confirm dialog, built on the .modal CSS primitive.
// Used to guard destructive actions like resetting progress.

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
  close();
  onCloseCb = onClose || null;
  root = document.createElement('div');
  root.className = 'modal';
  root.innerHTML = `
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
  opener = document.activeElement;
  document.body.appendChild(root);
  document.body.classList.add('modal-open');

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-confirm]')) { close(); onConfirm?.(); }
    else if (e.target.closest('[data-close]')) { close(); }
  });
  document.addEventListener('keydown', onKey, true);
  // Focus the confirm button for keyboard users.
  root.querySelector('[data-confirm]')?.focus();
}

function focusable() {
  return root ? [...root.querySelectorAll('button:not([disabled])')] : [];
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
