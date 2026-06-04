// ── Boot splash ("press any key to continue") ────────────────
// A game-style title screen: a beat of stillness before the console floods
// in with tabs and data. Press any key, click, or tap to continue.
//
// Behaviour (user choice): shows once on the first visit, then is remembered
// off, so returning visitors land straight on the menu. A toggle in System
// can re-enable it to show on every visit. Three stored states:
//   'always' → show every visit      'off' → never      (unset) → show once
//
// While open, the splash owns the keyboard: keynav, the quick menu, and the
// coach all stand down via isSplashOpen(). On dismiss it calls onContinue so
// the first-run coach can follow it (boot → continue → learn the controls).

const PREF_KEY = 'questline-splash';

let open = false;

/** Is the boot splash showing? (so other key handlers stand down) */
export function isSplashOpen() { return open; }

/** The stored splash preference: 'always' | 'off' | null (never set). */
export function splashPref() {
  try { return localStorage.getItem(PREF_KEY); } catch { return null; }
}

/** Should the splash show this load? Once on first visit, or always if set. */
function shouldShow() {
  const pref = splashPref();
  if (pref === 'always') return true;
  if (pref === 'off') return false;
  return true;          // unset → first visit, show once
}

/** Persist the splash preference (used by the System toggle). */
export function setSplashPref(value) {
  try { localStorage.setItem(PREF_KEY, value); } catch { /* private mode */ }
}

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Show the boot splash if due, then run `onContinue` once it is dismissed.
 * If the splash is not due, `onContinue` runs immediately so the caller can
 * chain the first-run coach without branching.
 */
export function maybeShowSplash(onContinue) {
  if (!shouldShow()) { onContinue?.(); return; }
  // A first visit (unset) shows once, then remembers off. 'always' stays on.
  if (splashPref() === null) setSplashPref('off');

  const root = document.createElement('div');
  root.className = 'splash';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Questline title screen');
  root.innerHTML = `
    <div class="splash__bg" aria-hidden="true"></div>
    <div class="splash__inner">
      <span class="splash__kicker">Neorgon presents</span>
      <h1 class="splash__title">Questline</h1>
      <p class="splash__tag">Operating model, as a game console</p>
      <p class="splash__prompt"><span class="splash__caret">▸</span> Press any key to continue</p>
    </div>`;
  document.body.appendChild(root);
  open = true;

  const close = () => {
    if (!open) return;
    open = false;
    window.removeEventListener('keydown', onKey, true);
    root.classList.remove('is-visible');
    const done = () => { root.remove(); onContinue?.(); };
    if (reduceMotion()) done();
    else setTimeout(done, 260);
  };

  // Any key continues; capture so it wins over keynav/quickmenu, which also
  // stand down via isSplashOpen() while we are up.
  const onKey = (e) => {
    if (e.key === 'Tab') return;          // let focus move if the user tabs
    e.preventDefault(); e.stopPropagation();
    close();
  };
  root.addEventListener('click', close);
  window.addEventListener('keydown', onKey, true);

  requestAnimationFrame(() => {
    root.classList.add('is-visible');
    root.focus?.();
  });
}
