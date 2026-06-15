// ── Shared utilities ─────────────────────────────────────────
// Small, pure helper functions used across multiple modules.

/** Cached element lookup by ID. */
const _els = {};
export function $(id) {
  return _els[id] || (_els[id] = document.getElementById(id));
}

/** Escape HTML special characters. */
export function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Show a temporary toast notification. */
let _toastTimer = null;
function toastEl() {
  let el = document.getElementById('app-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'app-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  return el;
}
export function showToast(msg) {
  const el = toastEl();
  el.classList.remove('toast--action');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), 2000);
}

/**
 * A toast with one action button (e.g. "Undo"). Stays up longer so the
 * action is reachable. `onAction` fires once when the button is clicked;
 * the toast then dismisses. Returns nothing.
 */
export function showActionToast(msg, actionLabel, onAction, ms = 8000) {
  const el = toastEl();
  el.classList.add('toast--action');
  el.textContent = '';
  const text = document.createElement('span');
  text.className = 'toast__msg';
  text.textContent = msg;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'toast__action';
  btn.textContent = actionLabel;
  let used = false;
  const dismiss = () => { el.classList.remove('visible'); };
  btn.addEventListener('click', () => {
    if (used) return;
    used = true;
    clearTimeout(_toastTimer);
    dismiss();
    onAction();
  });
  el.append(text, btn);
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(dismiss, ms);
}

/** Extract a clean hostname from a URL string. */
export function domainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url || '';
  }
}

/** Simple debounce. */
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
