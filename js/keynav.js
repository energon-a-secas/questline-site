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

import { state, TAB_IDS, viewFromHash, wrapIndex, visibleFlowOrder, focusOrder, isBranchUnlocked, toggleNode, isBranchComplete } from './state.js';
import { BRANCHES, BRANCH_BY_ID } from './data.js';
import { intelMatches } from './console.js';
import { rerenderActive } from './render.js';
import { isModalOpen } from './modal.js';
import { isQuickMenuOpen } from './quickmenu.js';
import { isCoachOpen } from './coach.js';
import { isSplashOpen } from './splash.js';
import { showToast } from './utils.js';

const HOLD_MS = 420;        // hold-Enter to mark a chapter complete
let holdTimer = null;
let holdFired = false;
let pendingTap = null;      // { branchId, nodeId } captured on Enter keydown

export function initKeyNav() {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
}

function active(el) {
  // Ignore keys aimed at real text inputs (none today, but future-proof).
  return el && /^(input|textarea|select)$/i.test(el.tagName);
}

function onKeyDown(e) {
  if (isSplashOpen() || isModalOpen() || isQuickMenuOpen() || isCoachOpen() || active(document.activeElement)) return;
  // "/" is a global search shortcut: jump to Intel and focus its search box.
  // It works regardless of the keyboard-movement opt-out, since it is an
  // explicit shortcut rather than passive cursor driving.
  if (e.key === '/') { e.preventDefault(); focusGlossarySearch(); return; }
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
    case 'flow':     return flowKey(s, e);
  }
}

function onKeyUp(e) {
  if (e.key !== 'Enter') return;
  clearTimeout(holdTimer);
  holdTimer = null;
  // Released before the hold elapsed → it was a tap: toggle one skill.
  if (pendingTap && !holdFired) {
    const branch = BRANCH_BY_ID[pendingTap.branchId];
    const node = branch?.nodes.find(n => n.id === pendingTap.nodeId);
    if (branch && node) toggleSkillAt(state, branch, node);
  }
  pendingTap = null;
  holdFired = false;
}

/**
 * Global "/" shortcut: go to Intel (if not already there) and focus the
 * glossary search box. When a route change is needed the input only exists
 * after the next render, so focus is deferred a frame.
 */
function focusGlossarySearch() {
  const focusBox = () => {
    const box = document.getElementById('intelSearch');
    if (box) { box.focus(); box.select(); }
  };
  if (state.view !== 'intel') {
    location.hash = '#intel';
    requestAnimationFrame(() => requestAnimationFrame(focusBox));
  } else {
    focusBox();
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
  // what the search box is showing. Selection deep-links via the hash, which
  // the events layer patches in place (no scroll-to-top).
  const items = intelMatches(s.ui.intelQuery);
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

// ── Chapters: list region + detail (skills) region ─────────

function chaptersKey(s, e) {
  if (s.ui.region === 'detail') return chapterDetailKey(s, e);

  // List region.
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    s.ui.rowCursor = wrapIndex(s.ui.rowCursor + dir, BRANCHES.length);
    s.ui.chapterSel = BRANCHES[s.ui.rowCursor].id;
    rerenderActive(s);
  } else if (e.key === 'Enter' || e.key === 'ArrowRight') {
    e.preventDefault();
    const branch = BRANCHES[s.ui.rowCursor];
    if (branch && isBranchUnlocked(s, branch.id)) {
      s.ui.region = 'detail';
      s.ui.skillCursor = 0;
      rerenderActive(s);
    }
  } else if (e.key === 'Home') {
    e.preventDefault(); s.ui.rowCursor = 0; s.ui.chapterSel = BRANCHES[0].id; rerenderActive(s);
  } else if (e.key === 'End') {
    e.preventDefault(); s.ui.rowCursor = BRANCHES.length - 1;
    s.ui.chapterSel = BRANCHES[s.ui.rowCursor].id; rerenderActive(s);
  }
}

function chapterDetailKey(s, e) {
  const branch = BRANCH_BY_ID[s.ui.chapterSel];
  if (!branch) { s.ui.region = 'list'; return; }
  const nodes = branch.nodes;

  if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
    e.preventDefault();
    s.ui.region = 'list';
    rerenderActive(s);
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    const dir = e.key === 'ArrowDown' ? 1 : -1;
    s.ui.skillCursor = wrapIndex(s.ui.skillCursor + dir, nodes.length);
    rerenderActive(s);
  } else if (e.key === 'Enter') {
    // A held Enter marks the whole chapter; a tap (release < HOLD_MS) toggles
    // one skill. Key-repeat is ignored so the hold timer runs cleanly.
    if (e.repeat) { e.preventDefault(); return; }
    e.preventDefault();
    holdFired = false;
    pendingTap = { branchId: branch.id, nodeId: nodes[s.ui.skillCursor]?.id };
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      holdFired = true;
      pendingTap = null;
      completeChapterFromKey(s, branch.id);
    }, HOLD_MS);
  } else if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    toggleSkillAt(s, branch, nodes[s.ui.skillCursor]);
  }
}

function toggleSkillAt(s, branch, node) {
  if (!node) return;
  const wasComplete = isBranchComplete(s, branch.id);
  toggleNode(s, node.id);
  rerenderActive(s);
  if (!wasComplete && isBranchComplete(s, branch.id)) {
    showToast('Chapter cleared — new path unlocked');
  }
}

function completeChapterFromKey(s, branchId) {
  const ctl = document.querySelector(`[data-branch-done="${branchId}"]`);
  // Reuse the click path (handles confirm-on-clear + celebration).
  ctl?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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
