// ── Chapter section-reader ───────────────────────────────────
// Chapters are big items; their subsections (the skill nodes) read one at a
// time inside this focused, navigable popup. Step ◀ ▶ through every section in
// the manual, jump to any of them from a searchable list, and toggle a
// section's completion in place. The overlay owns the keyboard while open
// (its own Esc + focus trap + arrow stepping), so keynav/quickmenu stand down
// via isChapterReaderOpen(). On close it refreshes the Chapters grid so newly
// crossed completion boundaries (and unlocks) show immediately.

import { BRANCHES, BRANCH_BY_ID } from './data.js';
import {
  state, toggleNode, isBranchUnlocked, isBranchComplete, branchProgress,
} from './state.js';
import { overallPercent, rankFor } from './state.js';
import { escHtml } from './utils.js';
import { icon } from './console.js';
import { rerenderActive } from './render.js';
import { celebrateRankUp, intelUnlockedToast } from './celebrate.js';

let root = null;       // the overlay element, or null when closed
let opener = null;     // element focused before opening, to restore on close
let cur = null;        // id of the section (node) currently shown
let query = '';        // live filter for the jump list
let dirty = false;     // did anything change that the grid behind should reflect

/** One flat, ordered entry per subsection across every chapter. Built once;
 *  the content model is static, so this never needs rebuilding. */
const ITEMS = BRANCHES.flatMap((b, bi) =>
  b.nodes.map((node, ni) => ({
    branchId: b.id,
    branchTitle: b.title,
    branchIcon: b.icon,
    chapterNo: String(bi + 1).padStart(2, '0'),
    nodeIndex: ni,
    nodeCount: b.nodes.length,
    node,
  })));

const indexOfCur = () => Math.max(0, ITEMS.findIndex(it => it.node.id === cur));

/** Is the chapter reader open? (so list keynav + quick menu stand down) */
export function isChapterReaderOpen() {
  return root !== null;
}

/**
 * Open the reader on a chapter, optionally at a specific subsection.
 * @param {object} s        app state
 * @param {string} branchId chapter to open
 * @param {string} [nodeId] subsection to land on; defaults to the chapter's first
 */
export function openChapterReader(s, branchId, nodeId) {
  const branch = BRANCH_BY_ID[branchId];
  if (!branch) return;
  cur = nodeId && branch.nodes.some(n => n.id === nodeId)
    ? nodeId
    : branch.nodes[0]?.id || ITEMS[0]?.node.id;
  query = '';
  dirty = false;

  close(true);
  opener = document.activeElement;
  root = document.createElement('div');
  root.className = 'modal modal--reader';
  document.body.appendChild(root);
  document.body.classList.add('modal-open');
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  document.addEventListener('keydown', onKey, true);

  render();
  const r = root.querySelector('.creader');
  requestAnimationFrame(() => r?.classList.add('is-in'));
  // Land focus on the panel so arrow-stepping works without a click first.
  root.querySelector('[data-cr-step="1"]')?.focus();
}

// ── Markup ─────────────────────────────────────────────────

function render() {
  if (!root) return;
  const it = ITEMS[indexOfCur()];
  if (!it) return;
  const { node, branchTitle, branchId, nodeIndex, nodeCount } = it;
  const unlocked = isBranchUnlocked(state, branchId);
  const done = !!state.done[node.id];
  const { done: cdone, total: ctotal } = branchProgress(state, branchId);

  const detail = node.list
    ? `<ul class="creader__list">${node.list.map(li => `<li>${escHtml(li)}</li>`).join('')}</ul>`
    : `<p class="creader__p">${escHtml(node.body)}</p>`;

  const control = unlocked
    ? `<button type="button" class="creader__toggle ${done ? 'is-done' : ''}" data-cr-toggle="${node.id}"
         aria-pressed="${done}">
         <span class="creader__toggle-box">${icon('check', 15)}</span>
         <span>${done ? 'Completed' : 'Mark complete'}</span>
       </button>`
    : `<span class="creader__locked">${icon('lock', 13)} Reading is open — clear earlier chapters to track this one.</span>`;

  root.innerHTML = `
    <div class="modal__backdrop" data-close></div>
    <div class="creader reader reader--azure fbevel" role="dialog" aria-modal="true"
      aria-label="${escHtml(branchTitle)} sections">
      <header class="creader__head">
        <div class="creader__heading">
          <span class="reader__kicker">${icon('layer-group', 13)} ${escHtml(branchTitle)}</span>
          <span class="creader__chprog">${cdone}/${ctotal} done</span>
        </div>
        <button type="button" class="creader__x" data-close aria-label="Close reader">${icon('plus', 18)}</button>
        <div class="creader__search">
          <span class="creader__search-icon" aria-hidden="true">${icon('search', 15)}</span>
          <input type="search" id="chapterReaderSearch" class="creader__search-input"
            placeholder="Search all sections" aria-label="Search sections"
            autocomplete="off" value="${escHtml(query)}">
        </div>
      </header>
      <div class="creader__body">
        <div class="creader__nav">
          <button type="button" class="creader__step" data-cr-step="-1" aria-label="Previous section">
            ${icon('caret-left', 18)}</button>
          <span class="creader__pos">${escHtml(branchTitle)} · ${nodeIndex + 1} / ${nodeCount}
            <span class="creader__posall">${indexOfCur() + 1} of ${ITEMS.length} overall</span></span>
          <button type="button" class="creader__step" data-cr-step="1" aria-label="Next section">
            ${icon('caret-right', 18)}</button>
        </div>
        <article class="creader__sec">
          <span class="creader__tag">${escHtml(node.tag)}</span>
          <h3 class="creader__title">${escHtml(node.title)}</h3>
          ${detail}
          <div class="creader__control">${control}</div>
        </article>
      </div>
      <div class="creader__jumpwrap">
        <h4 class="creader__jumph">Jump to a section</h4>
        <div class="creader__jump" id="chapterReaderJump">${jumpList()}</div>
      </div>
    </div>`;
}

/** The searchable jump list, grouped by chapter. Patched alone on search so
 *  the search box keeps focus (the rest of the dialog stays put). */
function jumpList() {
  const q = query.trim().toLowerCase();
  const matches = ITEMS.filter(it => {
    if (!q) return true;
    const hay = [it.node.title, it.node.tag, it.node.body,
      (it.node.list || []).join(' '), it.branchTitle].join(' ').toLowerCase();
    return hay.includes(q);
  });
  if (!matches.length) return `<p class="creader__empty">No section matches that.</p>`;

  // Group consecutive matches by chapter so the list reads as the manual does.
  let html = '';
  let lastBranch = null;
  for (const it of matches) {
    if (it.branchId !== lastBranch) {
      html += `<div class="creader__jumpchap">${it.chapterNo} · ${escHtml(it.branchTitle)}</div>`;
      lastBranch = it.branchId;
    }
    const active = it.node.id === cur;
    const done = !!state.done[it.node.id];
    html += `
      <button type="button" class="creader__jumpitem ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}"
        data-cr-jump="${it.node.id}">
        <span class="creader__jumpdot" aria-hidden="true"></span>
        <span class="creader__jumptitle">${escHtml(it.node.title)}</span>
        <span class="creader__jumptag">${escHtml(it.node.tag)}</span>
      </button>`;
  }
  return html;
}

/** Patch only the jump list (keeps search-box focus during typing). */
function patchJump() {
  const wrap = root?.querySelector('#chapterReaderJump');
  if (wrap) wrap.innerHTML = jumpList();
}

// ── Navigation ─────────────────────────────────────────────

function step(dir) {
  const n = ITEMS.length;
  cur = ITEMS[((indexOfCur() + dir) % n + n) % n].node.id;
  render();
  root?.querySelector(`[data-cr-step="${dir}"]`)?.focus();
}

function jumpTo(id) {
  if (!ITEMS.some(it => it.node.id === id)) return;
  cur = id;
  render();
}

function toggle(id) {
  const it = ITEMS.find(x => x.node.id === id);
  const branchId = it?.branchId;
  const beforeRank = rankFor(overallPercent(state)).name;
  const wasComplete = branchId && isBranchComplete(state, branchId);

  toggleNode(state, id);
  dirty = true;
  render();
  root?.querySelector(`[data-cr-toggle="${id}"]`)?.focus();

  // Same game-feel beats the old inline checklist gave: name the terms a
  // freshly-cleared chapter teaches, and stamp a rank-up plate on a threshold.
  const afterPct = overallPercent(state);
  const nowComplete = branchId && isBranchComplete(state, branchId);
  if (branchId && !wasComplete && nowComplete) intelUnlockedToast(state, branchId);
  const afterRank = rankFor(afterPct).name;
  if (afterRank !== beforeRank) celebrateRankUp(rankFor(afterPct));
}

// ── Events ─────────────────────────────────────────────────

function onClick(e) {
  if (e.target.closest('[data-close]')) { close(); return; }
  const step1 = e.target.closest('[data-cr-step]');
  if (step1) { step(Number(step1.dataset.crStep)); return; }
  const jump = e.target.closest('[data-cr-jump]');
  if (jump) { jumpTo(jump.dataset.crJump); return; }
  const tog = e.target.closest('[data-cr-toggle]');
  if (tog) { toggle(tog.dataset.crToggle); return; }
}

function onInput(e) {
  if (!e.target.closest('#chapterReaderSearch')) return;
  query = e.target.value;
  patchJump();
}

function onKey(e) {
  if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); return; }
  const inSearch = e.target.closest('#chapterReaderSearch');
  if (e.key === 'Enter' && inSearch) {
    // Enter in the search box jumps to the first matching section.
    e.preventDefault();
    const first = root?.querySelector('[data-cr-jump]');
    if (first) jumpTo(first.dataset.crJump);
    return;
  }
  // Arrow stepping, but never while typing in the search box (caret moves).
  if (!inSearch && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    e.preventDefault();
    step(e.key === 'ArrowRight' ? 1 : -1);
    return;
  }
  if (e.key === 'Tab') {
    const f = [...root.querySelectorAll('button:not([disabled]), a[href], input')];
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
}

function close(silent) {
  if (!root) return;
  document.removeEventListener('keydown', onKey, true);
  document.body.classList.remove('modal-open');
  root.remove();
  root = null;
  // A completion change behind the reader should show on the Chapters grid.
  if (dirty && !silent) rerenderActive(state);
  dirty = false;
  opener?.focus?.();
  opener = null;
}
