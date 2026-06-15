// ── Event handlers ───────────────────────────────────────────
// Hash routing drives the view. A single delegated click listener
// handles skill toggles, branch actions, and reset.

import { render, rerenderActive, drawWires } from './render.js';
import { showToast, showActionToast, debounce } from './utils.js';
import {
  state, viewFromHash, intelFromHash, flowFocusFromHash, isBranchView,
  resetProgress, resetAll, restoreProgress,
  setKeyboardNav, setShiftsRead, setShowFullMap,
  setClass, setCredential, clearCredential,
  addPlaybook, updatePlaybook, deletePlaybook, addStep, updateStep, deleteStep, moveStep,
  setAtlasTeams,
  visibleFlowOrder, focusOrder, isBranchUnlocked, wrapIndex,
} from './state.js';
import { INTEL, INTEL_BY_ID, SITES, SITES_BY_ID, siteMatches } from './data.js';
import { openConfirm } from './modal.js';
import { openChapterReader } from './chapterReader.js';
import { openSearch } from './search.js';
import { setSplashPref, splashPref } from './splash.js';
import { openShiftsReader } from './banners.js';
import { openDaily, updateBellDot } from './daily.js';
import { intelDetail, intelListItems, intelMatches } from './console.js';
import { bindAtlasEvents } from './atlas.js';
import { markGlossary } from './glossary.js';
import { revealKiwi } from './kiwi.js';
import { showGlossPopover, hideGlossPopover } from './glossary.js';
import { dismissFocus, nextTip, setFocusBranchId } from './engagement.js';
import { shareProgress } from './share.js';

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
    // A bare chapter-id hash (#foundations, e.g. Flow's "Open in Chapters")
    // renders the grid, then opens that chapter in the section reader on top.
    if (isBranchView(s.view)) openChapterReader(s, s.view);
  });

  // Redraw flowchart wires when the layout reflows.
  window.addEventListener('resize', debounce(() => {
    if (s.view === 'flow') drawWires(s);
  }, 120));

  const app = document.getElementById('app');

  // Atlas has its own file input / drag-drop / download handlers.
  bindAtlasEvents(s, app);

  // Flow map hover: highlight the focused node and its connected wires.
  app.addEventListener('mouseenter', (e) => {
    const node = e.target.closest('.tnode[data-branch]');
    if (!node) return;
    const tree = node.closest('.tree');
    if (!tree) return;
    const id = node.dataset.branch;
    tree.dataset.focusBranch = id;
    node.classList.add('is-focus');
    tree.querySelectorAll('.wire').forEach(w => {
      if (w.dataset.from === id || w.dataset.to === id) {
        w.classList.add('is-focus');
        const otherId = w.dataset.from === id ? w.dataset.to : w.dataset.from;
        const other = tree.querySelector(`.tnode[data-branch="${otherId}"]`);
        if (other) other.classList.add('is-focus');
      }
    });
  }, true);
  app.addEventListener('mouseleave', (e) => {
    const node = e.target.closest('.tnode[data-branch]');
    if (!node) return;
    const tree = node.closest('.tree');
    if (!tree) return;
    delete tree.dataset.focusBranch;
    tree.querySelectorAll('.tnode.is-focus, .wire.is-focus').forEach(el => el.classList.remove('is-focus'));
  }, true);

  // Delegated clicks for all interactive controls.
  app.addEventListener('click', (e) => {
    if (e.target.closest('#openSearch')) { openSearch(); return; }

    if (e.target.closest('#openDaily')) { openDaily(); return; }
    // Note: #openDaily lives outside #app, so this branch is a fallback; the
    // real listener is wired directly in app.js.

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

    // Today's Focus dismiss
    if (e.target.closest('#dismissFocus')) { dismissFocus(); rerenderActive(s); return; }

    // Daily tip next
    if (e.target.closest('#nextTip')) { nextTip(); rerenderActive(s); return; }

    // Today's Focus CTA: remember which branch the user picked up.
    const focusCta = e.target.closest('[data-focus-cta]');
    if (focusCta) { setFocusBranchId(focusCta.dataset.focusCta); }

    // Share progress
    if (e.target.closest('#shareBtn')) { shareProgress(s); return; }

    // A glossary term: route to its Intel entry (shares the data-intel path).
    const gloss = e.target.closest('.gloss');
    if (gloss) { hideGlossPopover(); location.hash = `#intel/${gloss.dataset.intel}`; return; }

    // Intel scope filter chip: re-render the list/detail for the new scope.
    const scopeBtn = e.target.closest('[data-intel-scope]');
    if (scopeBtn) { s.ui.intelScope = scopeBtn.dataset.intelScope; rerenderActive(s); return; }

    // Atlas view switcher.
    const atlasViewBtn = e.target.closest('[data-atlas-view]');
    if (atlasViewBtn) { s.ui.atlasView = atlasViewBtn.dataset.atlasView; rerenderActive(s); return; }

    // Atlas: restore the shipped sample topology.
    const atlasReset = e.target.closest('#atlasResetSample');
    if (atlasReset) { setAtlasTeams(s, null); rerenderActive(s); showToast('Restored sample topology'); return; }

    // Profile: class selection, credential edit/cancel/clear.
    if (handleProfileClick(s, e)) return;

    // Playbooks: add/edit/delete playbooks and steps.
    if (handlePlaybookClick(s, e)) return;

    // Chapters: a card opens the navigable section-reader popup.
    const chapterCard = e.target.closest('[data-chapter-open]');
    if (chapterCard) {
      s.ui.chapterSel = chapterCard.dataset.chapterOpen;
      openChapterReader(s, chapterCard.dataset.chapterOpen);
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

    // Sites group filter chip: re-render the grid for the new group.
    const siteGroupBtn = e.target.closest('[data-site-group]');
    if (siteGroupBtn) { s.ui.sitesGroup = siteGroupBtn.dataset.siteGroup; s.ui.sitesSel = null; rerenderActive(s); return; }

    // Site card: toggle its expanded detail.
    const siteCard = e.target.closest('[data-site]');
    if (siteCard) {
      const id = siteCard.dataset.site;
      if (s.view === 'sites') {
        s.ui.sitesSel = s.ui.sitesSel === id ? null : id;
        rerenderActive(s);
      } else {
        location.hash = `#sites`;
      }
      return;
    }

    // Copy site link button.
    const copySite = e.target.closest('#copySiteLink');
    if (copySite) {
      const url = copySite.dataset.copyUrl;
      if (url) {
        navigator.clipboard?.writeText(url).then(() => showToast('Link copied'))
          .catch(() => showToast('Could not copy link'));
      }
      return;
    }

    // Flow map D-pad: move cursor or focus the selected chapter.
    const flowDir = e.target.closest('[data-flow-dir]');
    if (flowDir) {
      e.preventDefault();
      onFlowMove(s, flowDir.dataset.flowDir);
      return;
    }
    const flowAction = e.target.closest('[data-flow-action="focus"]');
    if (flowAction) {
      e.preventDefault();
      onFlowActivate(s);
      return;
    }
  });

  // Glossary search: filter the term list live, patching only the list (and,
  // when the current selection drops out, the detail) without a full render.
  app.addEventListener('input', (e) => {
    const box = e.target.closest('#intelSearch');
    if (box) onIntelSearch(s, box.value);
  });

  // Sites search: filter the site grid live.
  app.addEventListener('input', (e) => {
    const box = e.target.closest('#sitesSearch');
    if (box) { s.ui.sitesQuery = box.value; rerenderActive(s); }
  });

  // Cert row keyboard support (now a focusable div so the issuer link can nest).
  app.addEventListener('keydown', (e) => {
    const certMain = e.target.closest('[data-cred-edit]');
    if (!certMain) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const id = certMain.dataset.credEdit;
      s.ui.credEditing = s.ui.credEditing === id ? null : id;
      rerenderActive(s);
    }
  });

  // Form submits: credential records (Profile), playbook + step edits.
  app.addEventListener('submit', (e) => {
    const credForm = e.target.closest('[data-cred-form]');
    if (credForm) { e.preventDefault(); onSaveCredential(s, credForm); return; }
    const stepForm = e.target.closest('[data-step-form]');
    if (stepForm) { e.preventDefault(); onSaveStep(s, stepForm); return; }
    // The playbook meta form has no submit button; ignore stray submits.
    if (e.target.closest('[data-pb-form]')) e.preventDefault();
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
  const matches = intelMatches(value, s.ui.intelScope);
  if (matches.length && !matches.some(t => t.id === s.ui.intelSel)) {
    patchIntel(s, matches[0].id);
  }
}

// ── Flow map D-pad helpers ───────────────────────────────────

function onFlowMove(s, dir) {
  if (s.ui.flowFocus) {
    const order = focusOrder(s.ui.flowFocus);
    if (!order.length) return;
    const delta = (dir === 'up' || dir === 'left') ? -1 : 1;
    s.ui.flowCursor = wrapIndex(s.ui.flowCursor + delta, order.length);
    rerenderActive(s);
    scrollFlowCursorIntoView();
    return;
  }
  const order = visibleFlowOrder(s);
  if (!order.length) return;
  const delta = (dir === 'up' || dir === 'left') ? -1 : 1;
  s.ui.flowCursor = wrapIndex(s.ui.flowCursor + delta, order.length);
  rerenderActive(s);
  scrollFlowCursorIntoView();
}

function scrollFlowCursorIntoView() {
  const cursor = document.querySelector('.tnode.is-cursor');
  if (!cursor) return;
  cursor.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}

function onFlowActivate(s) {
  if (s.ui.flowFocus) {
    const order = focusOrder(s.ui.flowFocus);
    const id = order[s.ui.flowCursor];
    if (!id) return;
    if (id === s.ui.flowFocus && isBranchUnlocked(s, id)) location.hash = `#${id}`;
    else location.hash = `#flow/${id}`;
    return;
  }
  const order = visibleFlowOrder(s);
  const id = order[s.ui.flowCursor];
  if (id) location.hash = `#flow/${id}`;
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

// ── Profile handlers ───────────────────────────────────────

/** Class pick + credential open/cancel/clear. Returns true if handled. */
function handleProfileClick(s, e) {
  const classBtn = e.target.closest('[data-class]');
  if (classBtn) {
    setClass(s, classBtn.dataset.class);
    s.ui.credEditing = null;
    rerenderActive(s);
    return true;
  }
  // Let the cert issuer external link open in a new tab without flipping edit.
  if (e.target.closest('.ccert__issuer--link')) return false;
  const editBtn = e.target.closest('[data-cred-edit]');
  if (editBtn) {
    const id = editBtn.dataset.credEdit;
    s.ui.credEditing = s.ui.credEditing === id ? null : id;
    rerenderActive(s);
    return true;
  }
  const cancelBtn = e.target.closest('[data-cred-cancel]');
  if (cancelBtn) { s.ui.credEditing = null; rerenderActive(s); return true; }
  const clearBtn = e.target.closest('[data-cred-clear]');
  if (clearBtn) {
    clearCredential(s, clearBtn.dataset.credClear);
    s.ui.credEditing = null;
    rerenderActive(s);
    showToast('Credential removed');
    return true;
  }
  return false;
}

/** Persist a credential form's fields against its cert. */
function onSaveCredential(s, form) {
  const certId = form.dataset.credForm;
  const data = new FormData(form);
  setCredential(s, certId, {
    id: (data.get('id') || '').trim(),
    issuer: (data.get('issuer') || '').trim(),
    issued: data.get('issued') || '',
    expires: data.get('expires') || '',
    status: data.get('status') || 'in-progress',
  });
  s.ui.credEditing = null;
  rerenderActive(s);
  showToast('Credential saved');
}

// ── Playbook handlers ──────────────────────────────────────

/** Add/select/edit playbooks and their steps. Returns true if handled. */
function handlePlaybookClick(s, e) {
  // Add a new playbook and open it in edit mode.
  if (e.target.closest('#addPlaybook')) {
    const pb = addPlaybook(s);
    s.ui.playbookSel = pb.id;
    s.ui.playbookEdit = true;
    s.ui.stepEditing = null;
    rerenderActive(s);
    return true;
  }
  // Select a playbook from the master list.
  const row = e.target.closest('[data-playbook]');
  if (row) {
    s.ui.playbookSel = row.dataset.playbook;
    s.ui.playbookEdit = false;
    s.ui.stepEditing = null;
    s.ui.region = 'list';
    rerenderActive(s);
    return true;
  }
  // Enter edit mode.
  if (e.target.closest('#editPlaybook')) { s.ui.playbookEdit = true; rerenderActive(s); return true; }
  // Leave edit mode (persisting the meta form first).
  if (e.target.closest('#donePlaybook')) {
    commitPlaybookMeta(s);
    s.ui.playbookEdit = false;
    s.ui.stepEditing = null;
    rerenderActive(s);
    return true;
  }
  // Delete the open playbook (with confirm).
  if (e.target.closest('#deletePlaybook')) {
    const pb = s.playbooks.find(p => p.id === s.ui.playbookSel);
    openConfirm({
      title: 'Delete this playbook?',
      body: `This permanently removes "${pb?.title || 'this playbook'}" and its steps from this device.`,
      confirmLabel: 'Delete playbook',
      danger: true,
      onConfirm: () => {
        deletePlaybook(s, s.ui.playbookSel);
        s.ui.playbookEdit = false;
        rerenderActive(s);
        showToast('Playbook deleted');
      },
    });
    return true;
  }
  // Add a step to the open playbook and open its editor.
  if (e.target.closest('#addStep')) {
    commitPlaybookMeta(s);
    const step = addStep(s, s.ui.playbookSel);
    s.ui.stepEditing = step?.id || null;
    rerenderActive(s);
    return true;
  }
  // Step controls: edit, cancel, delete, move.
  const stepEdit = e.target.closest('[data-step-edit]');
  if (stepEdit) { commitPlaybookMeta(s); s.ui.stepEditing = stepEdit.dataset.stepEdit; rerenderActive(s); return true; }
  const stepCancel = e.target.closest('[data-step-cancel]');
  if (stepCancel) { s.ui.stepEditing = null; rerenderActive(s); return true; }
  const stepDelete = e.target.closest('[data-step-delete]');
  if (stepDelete) {
    deleteStep(s, s.ui.playbookSel, stepDelete.dataset.stepDelete);
    s.ui.stepEditing = null;
    rerenderActive(s);
    return true;
  }
  const stepMove = e.target.closest('[data-step-move]');
  if (stepMove) {
    moveStep(s, s.ui.playbookSel, stepMove.dataset.stepMove, Number(stepMove.dataset.dir));
    rerenderActive(s);
    return true;
  }
  return false;
}

/** Read the playbook meta form (if present) into state, without re-rendering. */
function commitPlaybookMeta(s) {
  const form = document.querySelector('[data-pb-form]');
  if (!form) return;
  const data = new FormData(form);
  const est = (data.get('estMinutes') || '').toString().trim();
  updatePlaybook(s, form.dataset.pbForm, {
    title: (data.get('title') || '').trim() || 'Untitled playbook',
    category: (data.get('category') || '').trim() || 'Process',
    summary: (data.get('summary') || '').trim(),
    estMinutes: est ? Number(est) : null,
  });
}

/** Persist a step form's fields. */
function onSaveStep(s, form) {
  const stepId = form.dataset.stepForm;
  const playbookId = form.dataset.pb;
  const data = new FormData(form);
  const linkUrl = (data.get('linkUrl') || '').trim();
  const linkLabel = (data.get('linkLabel') || '').trim();
  updateStep(s, playbookId, stepId, {
    title: (data.get('title') || '').trim() || 'Untitled step',
    body: (data.get('body') || '').trim(),
    link: linkUrl ? { url: linkUrl, label: linkLabel || 'Read more' } : undefined,
  });
  s.ui.stepEditing = null;
  rerenderActive(s);
  showToast('Step saved');
}

function onReset(s) {
  showDangerVignette();
  openConfirm({
    title: 'Reset all save data?',
    body: 'This clears all progress, profile, playbooks, preferences, and engagement data on this device. You can undo the skill progress right after.',
    confirmLabel: 'Reset all save data',
    danger: true,
    onClose: hideDangerVignette,    // fires on confirm OR cancel
    onConfirm: () => {
      // Snapshot before wiping so the undo toast can put skill progress back.
      const snapshot = { ...s.done };
      resetAll(s);
      s.ui.chapterSel = null;
      s.ui.playbookSel = null;
      s.ui.credEditing = null;
      rerenderActive(s);
      showActionToast('All save data reset', 'Undo', () => {
        restoreProgress(s, snapshot);
        rerenderActive(s);
        showToast('Progress restored');
      });
    },
  });
}
