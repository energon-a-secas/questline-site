// ── Keyboard navigation ──────────────────────────────────────
// Makes the console fully driveable from the keyboard, so the bottom
// hint bar tells the truth:
//   ↑↓        move the cursor (master list, chapter skills, or flow nodes)
//   ↵         open the cursored row / toggle the cursored skill
//   hold ↵    mark the whole chapter complete (in the detail region)
//   ← / Bksp  step the chapter cursor back from detail to the list
//   Q / E     cycle the console tabs (wrap)
// The cursor index lives in shared `state.ui`, so it survives the
// innerHTML re-render that selection causes. A confirm dialog or the
// hold-Esc quick menu owns the keyboard while open; this stands down.

import { state, TAB_IDS, viewFromHash, wrapIndex, visibleFlowOrder, focusOrder, isBranchUnlocked } from './state.js';
import { BRANCHES, BRANCH_BY_ID, siteMatches } from './data.js';
import { intelMatches } from './console.js';
import { rerenderActive } from './render.js';
import { isModalOpen } from './modal.js';
import { isDailyOpen } from './daily.js';
import { isQuickMenuOpen } from './quickmenu.js';
import { isCoachOpen } from './coach.js';
import { isSplashOpen } from './splash.js';
import { isChapterReaderOpen, openChapterReader } from './chapterReader.js';
import { isSearchOpen, openSearch } from './search.js';

export function initKeyNav() {
  window.addEventListener('keydown', onKeyDown);
}

function active(el) {
  // Ignore keys aimed at real text inputs (none today, but future-proof).
  return el && /^(input|textarea|select)$/i.test(el.tagName);
}

function onKeyDown(e) {
  if (isSplashOpen() || isModalOpen() || isDailyOpen() || isQuickMenuOpen() || isCoachOpen()
    || isChapterReaderOpen() || isSearchOpen() || active(document.activeElement)) return;
  // "/" is the global search shortcut: it opens the command palette, which can
  // route to any section, chapter, term, playbook, or profile class. Works
  // regardless of the keyboard-movement opt-out, since it is an explicit
  // shortcut rather than passive cursor driving.
  if (e.key === '/') { e.preventDefault(); openSearch(); return; }
  // Opt-out: with keyboard movement disabled, all arrow/Q-E/Enter driving is
  // silent. Mouse and the deliberately-summoned hold-Esc quick menu still work.
  if (!state.prefs.keyboardNav) return;
  const s = state;

  // Tab cycling works on every screen — never conflicts with a list.
  if (e.key === 'q' || e.key === 'Q') { cycleTab(s, -1); e.preventDefault(); return; }
  if (e.key === 'e' || e.key === 'E') { cycleTab(s, +1); e.preventDefault(); return; }

  switch (s.view) {
    case 'chapters': return chaptersKey(s, e);
    case 'intel':    return intelKey(s, e);
    case 'sites':    return sitesKey(s, e);
    case 'atlas':    return atlasKey(s, e);
    case 'flow':     return flowKey(s, e);
  }
}

// ── Tab cycling ────────────────────────────────────────────

function cycleTab(s, dir) {
  const here = TAB_IDS.indexOf(s.view) >= 0 ? s.view
    : (BRANCH_BY_ID[s.view] ? 'chapters' : s.view);
  let idx = TAB_IDS.indexOf(here);
  if (idx < 0) idx = 0;
  const next = TAB_IDS[wrapIndex(idx + dir, TAB_IDS.length)];
  location.hash = next === 'flow' ? '#flow' : `#${next}`;
}

// ── Intel master-list arrow nav (over the filtered matches) ─

function intelKey(s, e) {
  // Arrow nav walks the currently-visible (filtered) terms, so it agrees with
  // what the search box + scope chips are showing. Selection deep-links via the
  // hash, which the events layer patches in place (no scroll-to-top).
  const items = intelMatches(s.ui.intelQuery, s.ui.intelScope);
  if (!items.length) return;
  const cur = Math.max(0, items.findIndex(t => t.id === s.ui.intelSel));
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    location.hash = `#intel/${items[wrapIndex(cur + dir, items.length)].id}`;
  } else if (e.key === 'Home') {
    e.preventDefault(); location.hash = `#intel/${items[0].id}`;
  } else if (e.key === 'End') {
    e.preventDefault(); location.hash = `#intel/${items[items.length - 1].id}`;
  }
}

// ── Sites master-list arrow nav (over the filtered catalog) ──

function sitesKey(s, e) {
  const items = siteMatches(s.ui.sitesQuery, s.ui.sitesGroup);
  if (!items.length) return;
  const cur = Math.max(0, items.findIndex(site => site.id === s.ui.sitesSel));
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    s.ui.sitesSel = items[wrapIndex(cur + dir, items.length)].id;
    s.ui.rowCursor = items.findIndex(site => site.id === s.ui.sitesSel);
    rerenderActive(s);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    window.open(items[cur].url, '_blank', 'noopener,noreferrer');
  } else if (e.key === 'Home') {
    e.preventDefault(); s.ui.sitesSel = items[0].id; rerenderActive(s);
  } else if (e.key === 'End') {
    e.preventDefault(); s.ui.sitesSel = items[items.length - 1].id; rerenderActive(s);
  }
}

// ── Chapters: move the card cursor; Enter opens the reader ─

function chaptersKey(s, e) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp'
    || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault();
    const dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1;
    s.ui.rowCursor = wrapIndex(s.ui.rowCursor + dir, BRANCHES.length);
    s.ui.chapterSel = BRANCHES[s.ui.rowCursor].id;
    rerenderActive(s);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const branch = BRANCHES[s.ui.rowCursor];
    // The reader is open (reading is never gated); it just shows the lock note
    // inside for chapters whose prerequisites are not yet cleared.
    if (branch) openChapterReader(s, branch.id);
  } else if (e.key === 'Home') {
    e.preventDefault(); s.ui.rowCursor = 0; s.ui.chapterSel = BRANCHES[0].id; rerenderActive(s);
  } else if (e.key === 'End') {
    e.preventDefault(); s.ui.rowCursor = BRANCHES.length - 1;
    s.ui.chapterSel = BRANCHES[s.ui.rowCursor].id; rerenderActive(s);
  }
}

// ── Atlas: arrow keys cycle the Map / Matrix / Upload views ─

function atlasKey(s, e) {
  const views = ['map', 'matrix', 'upload'];
  let idx = views.indexOf(s.ui.atlasView || 'map');
  if (idx < 0) idx = 0;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    s.ui.atlasView = views[wrapIndex(idx + 1, views.length)];
    rerenderActive(s);
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    s.ui.atlasView = views[wrapIndex(idx - 1, views.length)];
    rerenderActive(s);
  }
}

// ── Flow: arrow nav across the visible map, or a focus plan ─

function flowKey(s, e) {
  // Focus map: arrow across the local plan (parents, focus, children).
  if (s.ui.flowFocus) {
    const order = focusOrder(s.ui.flowFocus);
    if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
      e.preventDefault();
      location.hash = '#flow';                     // back to the full map
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      s.ui.flowCursor = wrapIndex(s.ui.flowCursor + 1, order.length);
      rerenderActive(s);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      s.ui.flowCursor = wrapIndex(s.ui.flowCursor - 1, order.length);
      rerenderActive(s);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const id = order[s.ui.flowCursor];
      if (!id) return;
      if (id === s.ui.flowFocus && isBranchUnlocked(s, id)) location.hash = `#${id}`;
      else location.hash = `#flow/${id}`;          // re-focus a neighbour
    }
    return;
  }

  // Full map: arrow across the revealed nodes; Enter focuses a node.
  const order = visibleFlowOrder(s);
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    e.preventDefault();
    s.ui.flowCursor = wrapIndex(s.ui.flowCursor + 1, order.length);
    rerenderActive(s);
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    e.preventDefault();
    s.ui.flowCursor = wrapIndex(s.ui.flowCursor - 1, order.length);
    rerenderActive(s);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const id = order[s.ui.flowCursor];
    if (id) location.hash = `#flow/${id}`;         // focus the chapter's local map
  }
}
