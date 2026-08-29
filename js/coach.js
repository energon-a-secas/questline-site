// ── First-run coach-mark ─────────────────────────────────────
// The console's strongest feature — full keyboard control + the hold-Esc
// quick menu — is invisible to a mouse-only first-timer. On the very first
// visit we surface a single dismissible card that teaches the three moves,
// then never show it again (gated by a localStorage flag). It honors
// prefers-reduced-motion and can be dismissed by button, Escape, or the
// scrim. Keyboard focus is trapped lightly: focus lands on Dismiss.

const SEEN_KEY = 'questline-coached-v1';

let open = false;

/** Is the first-run coach card showing? (so keynav / quick menu stand down) */
export function isCoachOpen() { return open; }

/**
 * Show the coach-mark once, on first visit only.
 * @param {() => void} [onComplete] runs after the coach is dismissed, or
 * immediately if the coach does not show.
 */
export function maybeShowCoach(onComplete) {
  let seen = false;
  try { seen = localStorage.getItem(SEEN_KEY) === '1'; } catch { /* private mode */ }
  if (seen) { onComplete?.(); return; }

  const root = document.createElement('div');
  root.className = 'coach';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'coachTitle');
  root.innerHTML = `
    <div class="coach__scrim" data-coach-close></div>
    <div class="coach__card">
      <span class="coach__kicker">New game</span>
      <h2 class="coach__title" id="coachTitle">Drive it like a console</h2>
      <ul class="coach__keys">
        <li><kbd>↑</kbd><kbd>↓</kbd><span>Move the cursor; <kbd>↵</kbd> opens</span></li>
        <li><kbd>Q</kbd><kbd>E</kbd><span>Cycle the tabs</span></li>
        <li><kbd>/</kbd><span>Search everything: sections, terms, classes</span></li>
        <li><kbd>Hold Esc</kbd><span>Quick menu: point, release to jump</span></li>
      </ul>
      <p class="coach__note">Mouse works everywhere too. This shows once.</p>
      <button type="button" class="btn btn--primary btn--sm" data-coach-close>Got it</button>
    </div>`;
  document.body.appendChild(root);
  open = true;

  const close = () => {
    if (!open) return;
    open = false;
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    window.removeEventListener('keydown', onKey, true);
    root.classList.remove('is-visible');
    setTimeout(() => { root.remove(); onComplete?.(); }, 200);
  };
  // keynav and the quick menu stand down via isCoachOpen(); we only need to
  // catch Escape ourselves to dismiss. Capture so it wins over any sibling.
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
  };

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-coach-close]')) close();
  });
  window.addEventListener('keydown', onKey, true);

  requestAnimationFrame(() => {
    root.classList.add('is-visible');
    root.querySelector('.btn')?.focus();
  });
}
