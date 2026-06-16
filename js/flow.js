// ── Tab: Flow (chapter map) ────────────────────────────────
// A living strategy map. Two modes share the Flow tab:
//
//   Full map:  reveal-as-you-go. Only unlocked chapters are drawn; locked
//              future chapters stay hidden, so the map grows as you clear
//              work (fog of war lifting). Newly revealed nodes animate in.
//   Focus map: click a node to focus it. The map collapses to a local plan:
//                its prerequisites above, the chapter itself, and the chapters
//                it unlocks below (shown even while locked), plus an inline
//                panel of that chapter's skills. A back control returns.
//
// Routed through the hash (#flow / #flow/<id>) so focus is shareable and the
// back button works. Connector wires for the full map are drawn by render.js
// (drawWires); the focus map draws its own short wires inline.

import { BRANCHES, BRANCH_BY_ID } from './data.js';
import {
  branchStatus, branchProgress, overallPercent, rankFor,
  visibleFlowOrder, focusMap, isBranchUnlocked,
} from './state.js';
import { escHtml } from './utils.js';
import { icon, chapterNo, screenTitle, shell } from './console.js';

/** Group an ordered list of branch ids into tier rows (0 = root). */
function tierRows(ids) {
  const set = new Set(ids);
  const map = new Map();
  for (const b of BRANCHES) {
    if (!set.has(b.id)) continue;
    if (!map.has(b.tier)) map.set(b.tier, []);
    map.get(b.tier).push(b);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
}

/** A single angular chapter node. `cursored` draws the keyboard ring. */
function nodeCard(s, branch, { cursored = false, ghost = false } = {}) {
  const status = branchStatus(s, branch.id);
  const { done, total } = branchProgress(s, branch.id);
  const locked = status === 'locked';
  const prereqNames = branch.prereq.map(p => BRANCH_BY_ID[p]?.title).filter(Boolean);
  const meta = locked
    ? `<span class="tnode__lock">${icon('lock', 13)} ${escHtml(prereqNames.join(' + ') || 'Locked')}</span>`
    : `<span class="tnode__count">${done}/${total}</span>`;
  // Every node opens its own focus view (its local map), so clicking any node
  // reveals where it sits and what it leads to, rather than jumping straight
  // into Chapters. Locked nodes are focusable too (on the focus map's ghost
  // rows, and on the full map when the "show full map" preference reveals them)
  // so you can plan ahead; the focus view explains the prerequisites.
  const tag = 'a';
  const href = `href="#flow/${branch.id}"`;
  const label = locked
    ? `${branch.title}, chapter ${chapterNo(branch)}: locked, requires ${prereqNames.join(' and ')}`
    : `${branch.title}, chapter ${chapterNo(branch)}: ${status}, ${done} of ${total} skills`;
  return `
    <${tag} ${href} class="tnode tnode--${status} ${cursored ? 'is-cursor' : ''}"
      data-branch="${branch.id}" role="listitem" aria-label="${escHtml(label)}"
      ${tag === 'div'
        ? 'aria-disabled="true" tabindex="0"'
        : `tabindex="${cursored ? '-1' : '0'}"`}>
      <span class="tnode__inner">
        <span class="tnode__frame">
          <span class="tnode__icon">${icon(branch.icon, 30)}</span>
          <span class="tnode__no">${chapterNo(branch)}</span>
          ${status === 'complete' ? `<span class="tnode__seal">${icon('check', 14)}</span>` : ''}
        </span>
        <span class="tnode__bar">
          <span class="tnode__title">${escHtml(branch.title)}</span>
          <span class="tnode__meta">${meta}</span>
        </span>
      </span>
    </${tag}>`;
}

/** The rank/progress header shared by both Flow modes. */
function rankPanel(s, lead) {
  const pct = overallPercent(s);
  const rank = rankFor(pct);
  return `
    <section class="cpanel cflow__rank">
      <div class="cstat__row">
        <span class="cstat__label">Rank · ${pct}%</span>
        <span class="cstat__value">${escHtml(rank.name)}</span>
      </div>
      <div class="cstat__bar"><div style="--pct:${pct / 100}"></div></div>
      <p class="cstat__blurb">${escHtml(rank.blurb)} ${escHtml(lead)}</p>
    </section>`;
}

// ── Full map (reveal-as-you-go) ────────────────────────────

function renderFullMap(s) {
  const visible = visibleFlowOrder(s);
  const cursorId = visible[s.ui.flowCursor];
  const rows = tierRows(visible).map((row, i) =>
    `<div class="tree__row" data-tier="${i}">
       ${row.map(b => nodeCard(s, b, { cursored: b.id === cursorId })).join('')}
     </div>`
  ).join('');

  // Inline control to flip the full-map preference right where the need is
  // felt, instead of only in System. Mirrors the System "Flow map" toggle.
  const mapBtn = (label) =>
    `<button type="button" class="tree__fogbtn" id="flowMapToggle">${escHtml(label)}</button>`;
  const hidden = BRANCHES.length - visible.length;
  const footnote = hidden > 0
    ? `<p class="tree__fog">${hidden} chapter${hidden === 1 ? '' : 's'} still in the fog. Clear a chapter to reveal what it unlocks, or ${mapBtn('show the full map')}.</p>`
    : (s.prefs.showFullMap
        ? `<p class="tree__fog">Full map shown, locked chapters dimmed until their prerequisites clear. ${mapBtn('Back to reveal-as-you-go')}.</p>`
        : '');

  const lead = s.prefs.showFullMap
    ? 'The whole path is shown; dimmed chapters unlock as you clear their prerequisites.'
    : 'Clear a chapter to reveal the paths that branch from it.';

  const body = `
    ${screenTitle('Flow', 'Unlock Map')}
    ${rankPanel(s, lead)}
    <p class="tree__howto">Tap a chapter to open its local map, or use the arrow keys to move and Enter to focus.</p>
    <div class="tree" role="list">
      <svg class="tree__wires" aria-hidden="true" preserveAspectRatio="none"></svg>
      <div class="tree__rows">${rows}</div>
    </div>
    ${footnote}`;
  return shell('flow', body, 'Tap a chapter to focus it, or arrow keys to move and Enter to focus.',
    [{ k: '↑↓', v: 'Move' }, { k: '↵', v: 'Focus' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

// ── Focus map (local plan around one chapter) ──────────────

function focusRow(s, ids, cursorId, kind) {
  if (!ids.length) return '';
  return `<div class="tree__row tree__row--${kind}">
    ${ids.map(id => nodeCard(s, BRANCH_BY_ID[id], { cursored: id === cursorId, ghost: true })).join('')}
  </div>`;
}

function focusSkills(s, branch) {
  const unlocked = isBranchUnlocked(s, branch.id);
  if (!unlocked) {
    const names = branch.prereq.map(p => BRANCH_BY_ID[p]?.title).filter(Boolean);
    return `
      <div class="cflow__locked">
        <span class="cdetail__lockicon">${icon('lock', 26)}</span>
        <p>Locked. Clear ${escHtml(names.join(' and '))} to begin this chapter.</p>
      </div>`;
  }
  const items = branch.nodes.map(n => {
    const done = !!s.done[n.id];
    return `<li class="cflow__skill ${done ? 'is-done' : ''}">
      <span class="cflow__skill-check">${done ? icon('check', 13) : ''}</span>
      <span class="cflow__skill-name">${escHtml(n.title)}</span>
      <span class="cflow__skill-tag">${escHtml(n.tag)}</span>
    </li>`;
  }).join('');
  return `<ul class="cflow__skills">${items}</ul>`;
}

function renderFocusMap(s, branchId) {
  const branch = BRANCH_BY_ID[branchId];
  const { parents, children } = focusMap(branchId);
  const order = [...parents, branchId, ...children];
  const cursorId = order[Math.min(s.ui.flowCursor, order.length - 1)] || branchId;
  const { done, total } = branchProgress(s, branchId);
  const unlocked = isBranchUnlocked(s, branchId);

  const upstream = parents.length
    ? `<h4 class="cflow__relh">Requires</h4>${focusRow(s, parents, cursorId, 'parents')}
       <div class="cflow__link" aria-hidden="true">${icon('arrow-circle-down', 18)}</div>`
    : '';
  const downstream = children.length
    ? `<div class="cflow__link" aria-hidden="true">${icon('arrow-circle-down', 18)}</div>
       <h4 class="cflow__relh">Unlocks</h4>${focusRow(s, children, cursorId, 'children')}`
    : `<p class="cflow__terminal">No further chapters branch from here.</p>`;

  const body = `
    ${screenTitle(branch.title, `Chapter ${chapterNo(branch)}`)}
    <div class="cflow__focus">
      <div class="toolbar cflow__focusbar">
        <a class="btn btn--ghost btn--sm" href="#flow">${icon('th-large', 14)} Full map</a>
        ${unlocked
          ? `<a class="btn btn--primary btn--sm" href="#${branch.id}">Open in Chapters</a>`
          : ''}
        <span class="cflow__focuscount">${done}/${total} skills</span>
      </div>
      <div class="cflow__plan">
        ${upstream}
        ${focusRow(s, [branchId], cursorId, 'focus')}
        ${downstream}
      </div>
      <section class="cpanel cflow__detail">
        <h3 class="cpanel__h">${escHtml(branch.tagline)}</h3>
        <p class="clead">${escHtml(branch.summary)}</p>
        ${focusSkills(s, branch)}
      </section>
    </div>`;
  return shell('flow', body, 'A local plan: what this needs, and what it opens.',
    [{ k: '↑↓', v: 'Move' }, { k: '↵', v: 'Open' }, { k: '←', v: 'Full map' }, { k: 'Esc', v: 'Menu' }]);
}

// ── Entry ──────────────────────────────────────────────────

export function renderFlow(s) {
  const focusId = s.ui.flowFocus;
  return focusId && BRANCH_BY_ID[focusId]
    ? renderFocusMap(s, focusId)
    : renderFullMap(s);
}
