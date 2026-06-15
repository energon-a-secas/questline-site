// ── Jargon glossary tooltips ─────────────────────────────────
// After each render, scan body copy for known Intel terms and wrap them
// in a button that shows the definition on hover/focus (a "read more"
// popover) and deep-links to the full Intel entry on click. The click
// route reuses the existing data-intel handler, so no new wiring is
// needed there. Definitions come straight from the INTEL glossary, so
// there is no duplicated copy.

import { INTEL, INTEL_BY_ID } from './data.js';
import { isIntelUnlocked } from './state.js';
import { escHtml } from './utils.js';

// Build an alias → term-id map once. Longer phrases first so "priority
// band" wins over "band" when both could match.
const ALIASES = INTEL.flatMap(t =>
  [t.term, ...(t.aliases || [])].map(label => ({ label, id: t.id }))
).sort((a, b) => b.label.length - a.label.length);

const MATCH = new RegExp(
  '\\b(' + ALIASES.map(a => escapeRe(a.label)).join('|') + ')\\b',
  'gi'
);
const LABEL_TO_ID = new Map(ALIASES.map(a => [a.label.toLowerCase(), a.id]));

function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Only mark terms inside long-form copy, never inside the master lists,
// the Intel panel itself, headings, or interactive chrome.
const SCAN_SELECTOR = '.cshift__body, .cmini__b, .clead, .cdetail__summary, .skill__body, .cintel__body';

let popover = null;
// The state object, captured at init, so the marker can tell which terms
// are decrypted yet. Only unlocked terms get tooltips, so hovering jargon
// never spoils a definition the player hasn't earned.
let appState = null;

/** Give the glossary access to live state (called once at startup). */
export function initGlossary(s) { appState = s; }

/** Wrap known glossary terms in the given root with tooltip buttons. */
export function markGlossary(root) {
  if (!root) return;
  root.querySelectorAll(SCAN_SELECTOR).forEach(markEl);
}

function markEl(el) {
  if (el.dataset.glossed) return;
  el.dataset.glossed = '1';
  // An Intel entry must not link to itself: the body of "Spec" should not turn
  // the word "spec" into a tooltip back to the page you are already reading.
  const selfId = el.dataset.self || null;

  // Collect text nodes first; mutating during a live TreeWalker is unsafe.
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement.closest('.gloss')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  const texts = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n);

  for (const node of texts) {
    const text = node.nodeValue;
    MATCH.lastIndex = 0;
    if (!MATCH.test(text)) continue;
    MATCH.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0, m;
    const seen = new Set(); // one mark per term per paragraph keeps it calm
    while ((m = MATCH.exec(text)) !== null) {
      const id = LABEL_TO_ID.get(m[0].toLowerCase());
      if (!id || seen.has(id) || id === selfId) continue;
      // Don't tooltip a term that is still encrypted; it would leak the
      // definition before the player clears the chapter that teaches it.
      if (appState && !isIntelUnlocked(appState, id)) continue;
      seen.add(id);
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gloss';
      btn.dataset.intel = id;
      btn.setAttribute('aria-label', `${m[0]}: show definition`);
      btn.textContent = m[0];
      frag.appendChild(btn);
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
}

/** Show the definition popover anchored to a .gloss button. */
export function showGlossPopover(btn) {
  const term = INTEL_BY_ID[btn.dataset.intel];
  if (!term) return;
  hideGlossPopover();
  popover = document.createElement('div');
  popover.className = 'gloss-pop';
  popover.setAttribute('role', 'tooltip');
  popover.innerHTML = `
    <div class="gloss-pop__head">
      <span class="gloss-pop__term">${escHtml(term.term)}</span>
      <span class="gloss-pop__kind">${escHtml(term.kind)}</span>
    </div>
    <p class="gloss-pop__body">${escHtml(term.body)}</p>
    <span class="gloss-pop__hint">Click to open in Intel</span>`;
  document.body.appendChild(popover);

  const r = btn.getBoundingClientRect();
  const pr = popover.getBoundingClientRect();
  let left = r.left + r.width / 2 - pr.width / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - pr.width - 8));
  let top = r.top - pr.height - 10;
  if (top < 8) top = r.bottom + 10; // flip below if no room above
  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  requestAnimationFrame(() => popover && popover.classList.add('is-visible'));
}

export function hideGlossPopover() {
  popover?.remove();
  popover = null;
}
