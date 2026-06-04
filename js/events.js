// ── Event handlers ───────────────────────────────────────────
// Hash routing drives the view. A single delegated click listener
// handles skill toggles, branch actions, and reset.

import { render, rerenderActive, drawWires } from './render.js';
import { showToast, showActionToast, debounce } from './utils.js';
import {
  state, viewFromHash, intelFromHash, flowFocusFromHash, toggleNode, setBranchDone,
  resetProgress, restoreProgress, isBranchComplete, branchProgress,
  overallPercent, rankFor, setKeyboardNav, setShiftsRead, setShowFullMap,
} from './state.js';
import { BRANCHES, BRANCH_BY_ID, INTEL, INTEL_BY_ID } from './data.js';
import { openConfirm } from './modal.js';
import { setSplashPref, splashPref } from './splash.js';
import { openShiftsReader } from './banners.js';
import { intelDetail, intelListItems, intelMatches } from './console.js';
import { markGlossary } from './glossary.js';
import { revealKiwi } from './kiwi.js';
import { showGlossPopover, hideGlossPopover } from './glossary.js';
import { celebrateRankUp, animateProgress, intelUnlockedToast } from './celebrate.js';

/** Find which chapter a skill node belongs to. */
function branchOfNode(nodeId) {
  return BRANCHES.find(b => b.nodes.some(n => n.id === nodeId))?.id || null;
}

export function bindEvents(s) {
  // Route on hash change.
  window.addEventListener('hashchange', () => {
    const prev = s.view;
    const prevFocus = s.ui.flowFocus;
    const prevIntel = s.ui.intelSel;
    s.view = viewFromHash();
    s.ui.intelSel = intelFromHash() || s.ui.intelSel;
    s.ui.flowFocus = s.view === 'flow' ? flowFocusFromHash() : null;
    // Staying on the Intel tab and only changing the selected term: patch the
    // detail panel in place rather than re-rendering the whole view (which
    // would scroll the term list back to the top). patchIntel already did the
    // DOM work for in-app clicks; this covers back/forward and external links.
    if (s.view === 'intel' && prev === 'intel' && s.ui.intelSel !== prevIntel) {
      patchIntel(s, s.ui.intelSel, true);
      return;
    }
    // A genuine tab change, or a Flow focus change, resets the in-tab cursor.
    if (s.view !== prev || s.ui.flowFocus !== prevFocus) {
      s.ui.region = 'list';
      s.ui.rowCursor = 0;
      s.ui.skillCursor = 0;
      s.ui.flowCursor = 0;
      if (prev === 'chapters' && s.view !== 'chapters') s.ui.chapterSel = null;
    }
    render(s);
  });

  // Redraw flowchart wires when the layout reflows.
  window.addEventListener('resize', debounce(() => {
    if (s.view === 'flow') drawWires(s);
  }, 120));

  const app = document.getElementById('app');

  // Delegated clicks for all interactive controls.
  app.addEventListener('click', (e) => {
    const skill = e.target.closest('.skill__check');
    if (skill) { onToggleSkill(s, skill.dataset.node); return; }

    const branchBtn = e.target.closest('[data-branch-done]');
    if (branchBtn) { onBranchAction(s, branchBtn); return; }

    const reset = e.target.closest('#resetBtn');
    if (reset) { onReset(s); return; }

    const splashToggle = e.target.closest('#splashToggle');
    if (splashToggle) { onToggleSplash(s); return; }

    const keynavToggle = e.target.closest('#keynavToggle');
    if (keynavToggle) { onToggleKeynav(s); return; }

    // Both the System switch and the inline Flow-banner button flip the same
    // preference; the inline one re-renders Flow in place to reveal/hide nodes.
    const fullMapToggle = e.target.closest('#fullMapToggle, #flowMapToggle');
    if (fullMapToggle) { setShowFullMap(s, !s.prefs.showFullMap); rerenderActive(s); return; }

    // Six key shifts: open the focused reading popup (also marks them read);
    // the read-check toggles the read state on its own.
    if (e.target.closest('#shiftsRead')) { openShiftsReader(); rerenderActive(s); return; }
    const shiftsCheck = e.target.closest('#shiftsCheck');
    if (shiftsCheck) { setShiftsRead(s, !s.prefs.shiftsRead); rerenderActive(s); return; }

    const egg = e.target.closest('#kiwiEgg');
    if (egg) { revealKiwi(); return; }

    // A glossary term: route to its Intel entry (shares the data-intel path).
    const gloss = e.target.closest('.gloss');
    if (gloss) { hideGlossPopover(); location.hash = `#intel/${gloss.dataset.intel}`; return; }

    // Chapters master list: select a chapter in place (locked ones too,
    // to show the "locked" detail). Selection lives in shared ui state.
    const chapterRow = e.target.closest('[data-chapter]');
    if (chapterRow) {
      s.ui.chapterSel = chapterRow.dataset.chapter;
      s.ui.region = 'list';
      rerenderActive(s);
      return;
    }

    // Intel term: select it. When already on the Intel tab, patch just the
    // detail panel and the row highlight in place (no full re-render, so the
    // list does not scroll back to the top). Still update the hash so the back
    // button and sharing work, but suppress the hashchange re-render.
    const intelRow = e.target.closest('[data-intel]');
    if (intelRow) {
      const id = intelRow.dataset.intel;
      if (s.view === 'intel') patchIntel(s, id);
      else location.hash = `#intel/${id}`;
      return;
    }
  });

  // Glossary search: filter the term list live, patching only the list (and,
  // when the current selection drops out, the detail) without a full render.
  app.addEventListener('input', (e) => {
    const box = e.target.closest('#intelSearch');
    if (box) onIntelSearch(s, box.value);
  });

  // Glossary term tooltips: hover and keyboard focus both reveal.
  app.addEventListener('mouseover', (e) => {
    const g = e.target.closest('.gloss');
    if (g) showGlossPopover(g);
  });
  app.addEventListener('mouseout', (e) => {
    if (e.target.closest('.gloss')) hideGlossPopover();
  });
  app.addEventListener('focusin', (e) => {
    const g = e.target.closest('.gloss');
    if (g) showGlossPopover(g);
  });
  app.addEventListener('focusout', (e) => {
    if (e.target.closest('.gloss')) hideGlossPopover();
  });
  window.addEventListener('scroll', hideGlossPopover, { passive: true });
}

/**
 * Toggle one skill with a surgical DOM patch (no full re-render), so the
 * clicked control keeps focus and the CSS transitions actually run. Only
 * when a completion boundary is crossed (unlock states change) do we fall
 * back to a full re-render so the flow/master list reflects new unlocks.
 */
function onToggleSkill(s, nodeId) {
  if (!nodeId) return;
  const branchId = s.ui.chapterSel || branchOfNode(nodeId);
  if (s.view === 'chapters' && branchId) s.ui.chapterSel = branchId;

  const beforePct = overallPercent(s);
  const beforeRank = rankFor(beforePct).name;
  const wasComplete = branchId && isBranchComplete(s, branchId);
  toggleNode(s, nodeId);
  const nowComplete = branchId && isBranchComplete(s, branchId);

  // Crossing a chapter's completion boundary changes unlocks elsewhere, so a
  // full re-render is warranted. Otherwise patch in place.
  if (wasComplete !== nowComplete) {
    rerenderActive(s);
  } else {
    patchSkill(s, nodeId, branchId);
  }
  afterProgress(s, beforePct, beforeRank, branchId, wasComplete, nowComplete);
}

/** In-place DOM update for a single skill toggle. */
function patchSkill(s, nodeId, branchId) {
  const app = document.getElementById('app');
  const btn = app.querySelector(`.skill__check[data-node="${nodeId}"]`);
  if (!btn) return;
  const checked = !!s.done[nodeId];
  btn.setAttribute('aria-pressed', String(checked));
  btn.closest('.skill')?.classList.toggle('skill--done', checked);

  if (!branchId) return;
  const { done, total } = branchProgress(s, branchId);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const fill = app.querySelector('.branch-progress__bar div');
  if (fill) fill.style.transform = `scaleX(${pct / 100})`;
  const count = app.querySelector('.branch-progress__count');
  if (count) count.textContent = `${done}/${total} skills`;
  // Refresh just the master-toggle control (empty/partial/seal) in the head.
  patchCompleteControl(s, branchId, done, total);
}

/** Swap the chapter-complete control to match the new done/total. */
function patchCompleteControl(s, branchId, done, total) {
  const app = document.getElementById('app');
  const ctl = app.querySelector('.cdone[data-branch-done]');
  if (!ctl) return; // a seal is showing; the unlock-boundary path re-rendered
  const partial = done > 0 && done < total;
  ctl.classList.toggle('is-partial', partial);
  ctl.setAttribute('aria-pressed', partial ? 'mixed' : 'false');
  const txt = ctl.querySelector('.cdone__txt');
  if (txt) txt.textContent = partial ? 'Finish' : 'All';
}

function onBranchAction(s, btn) {
  const branchId = btn.dataset.branchDone;
  const clearing = btn.dataset.value === 'clear';

  // Clearing a fully-complete chapter wipes manual progress, so confirm it
  // the same way a reset does, rather than letting it be a same-pixel click.
  if (clearing) {
    const branch = BRANCH_BY_ID[branchId];
    openConfirm({
      title: 'Clear this chapter?',
      body: `This unchecks every skill in ${branch?.title || 'this chapter'}. You can complete it again any time.`,
      confirmLabel: 'Clear chapter',
      danger: true,
      onConfirm: () => { setBranchDone(s, branchId, false); rerenderActive(s); },
    });
    return;
  }

  const beforePct = overallPercent(s);
  const beforeRank = rankFor(beforePct).name;
  const wasComplete = isBranchComplete(s, branchId);
  setBranchDone(s, branchId, true);
  rerenderActive(s);
  afterProgress(s, beforePct, beforeRank, branchId, wasComplete, true);
}

/** Shared post-mutation feedback: unlock toast, intel-unlocked, rank-up, XP. */
function afterProgress(s, beforePct, beforeRank, branchId, wasComplete, nowComplete) {
  const afterPct = overallPercent(s);
  animateProgress(beforePct, afterPct);
  if (branchId && !wasComplete && nowComplete) {
    intelUnlockedToast(s, branchId);
  }
  const afterRank = rankFor(afterPct).name;
  if (afterRank !== beforeRank && afterPct > beforePct) {
    celebrateRankUp(rankFor(afterPct));
  }
}

/** Flip the title-screen (splash) preference and update the toggle in place. */
function onToggleSplash(s) {
  const next = splashPref() === 'always' ? 'off' : 'always';
  setSplashPref(next);
  rerenderActive(s);
}

/** Flip the keyboard-movement preference and re-render (hints follow it). */
function onToggleKeynav(s) {
  setKeyboardNav(s, !s.prefs.keyboardNav);
  rerenderActive(s);
}

/**
 * Select an Intel term by patching only the detail panel and the row
 * highlight, so the term list keeps its scroll position. Updates the hash for
 * deep-linking; `fromHash` skips that write when the hash drove the change.
 */
function patchIntel(s, id, fromHash) {
  if (!INTEL_BY_ID[id]) return;
  s.ui.intelSel = id;
  s.ui.rowCursor = INTEL.findIndex(t => t.id === id);
  const app = document.getElementById('app');
  const panel = app?.querySelector('#intelDetail');
  if (panel) {
    panel.innerHTML = intelDetail(s, INTEL_BY_ID[id]);
    markGlossary(app);
  }
  app?.querySelectorAll('.crow[data-intel]').forEach(row => {
    const on = row.dataset.intel === id;
    row.classList.toggle('crow--active', on);
    row.setAttribute('aria-selected', String(on));
  });
  if (!fromHash) {
    // Update the hash for share/back without triggering the re-render path.
    history.replaceState(null, '', `#intel/${id}`);
  }
}

/**
 * Filter the glossary list live. Patches only the list rows; if the selected
 * term filters out, selects the first remaining match (detail follows).
 */
function onIntelSearch(s, value) {
  s.ui.intelQuery = value;
  const app = document.getElementById('app');
  const rows = app?.querySelector('#intelRows');
  if (rows) rows.innerHTML = intelListItems(s, s.ui.intelSel);
  // Keep the open term valid: if it no longer matches, jump to the first hit.
  const matches = intelMatches(value);
  if (matches.length && !matches.some(t => t.id === s.ui.intelSel)) {
    patchIntel(s, matches[0].id);
  }
}

/**
 * A red danger vignette that creeps in from the screen corners while the
 * reset confirm is open, so wiping the save feels weighty. The element is
 * its own fixed layer (corner-anchored radial gradients), reused across
 * opens and cleared when the dialog closes either way.
 */
function showDangerVignette() {
  let v = document.getElementById('danger-vignette');
  if (!v) {
    v = document.createElement('div');
    v.id = 'danger-vignette';
    v.className = 'danger-vignette';
    v.setAttribute('aria-hidden', 'true');
    document.body.appendChild(v);
  }
  requestAnimationFrame(() => v.classList.add('is-on'));
}
function hideDangerVignette() {
  const v = document.getElementById('danger-vignette');
  if (!v) return;
  v.classList.remove('is-on');
}

function onReset(s) {
  showDangerVignette();
  openConfirm({
    title: 'Reset save data?',
    body: 'This clears every completed skill and your rank on this device. You can undo it right after.',
    confirmLabel: 'Reset save data',
    danger: true,
    onClose: hideDangerVignette,    // fires on confirm OR cancel
    onConfirm: () => {
      // Snapshot before wiping so the undo toast can put it all back.
      const snapshot = { ...s.done };
      resetProgress(s);
      s.ui.chapterSel = null;
      rerenderActive(s);
      showActionToast('Save data reset', 'Undo', () => {
        restoreProgress(s, snapshot);
        rerenderActive(s);
        showToast('Progress restored');
      });
    },
  });
}
