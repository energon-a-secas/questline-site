// ── Rendering ────────────────────────────────────────────────
// View dispatcher. Every view now renders inside the NieR console
// shell (tab bar + dotted divider + ghost title + hint bar). The Flow
// tab hosts the Detroit-style chapter flowchart, whose right-angle
// connector wires are drawn as an SVG overlay after layout.

import { BRANCHES } from './data.js';
import {
  isBranchComplete, isBranchView,
} from './state.js';
import {
  renderBrief, renderChapters, renderPriority, renderIntel,
  renderSites, renderSystem,
} from './console.js';
import { renderProfile } from './profile.js';
import { renderPlaybooks } from './playbooks.js';
import { renderAtlas } from './atlas.js';
import { renderFlow } from './flow.js';
import { markGlossary } from './glossary.js';
import { mountBanners } from './banners.js';

const app = () => document.getElementById('app');
const SVGNS = 'http://www.w3.org/2000/svg';

/** Build the HTML for the current view (no DOM write). */
function viewHtml(s) {
  const view = s.view;
  if (view === 'flow') return renderFlow(s);
  if (isBranchView(view)) {
    // A chapter id in the hash opens Chapters with that chapter selected.
    s.ui.chapterSel = view;
    return renderChapters(s, view);
  }
  switch (view) {
    case 'chapters':  return renderChapters(s, s.ui.chapterSel);
    case 'playbooks': return renderPlaybooks(s, s.ui.playbookSel);
    case 'priority':  return renderPriority(s);
    case 'intel':     return renderIntel(s, s.ui.intelSel);
    case 'sites':     return renderSites(s);
    case 'atlas':     return renderAtlas(s);
    case 'profile':   return renderProfile(s);
    case 'system':    return renderSystem(s);
    case 'brief':
    default:          return renderBrief(s);
  }
}

/** Post-write passes shared by every render path. */
function afterWrite(s) {
  markGlossary(app());
  keepActiveTabInView();
  // The Brief screen hosts the featured banner carousel; bind its controls.
  if (s.view === 'brief') mountBanners(s);
  // Only the full map carries the SVG connector overlay; the focus map lays
  // out its own short links inline, so skip wires when a chapter is focused.
  if (s.view === 'flow' && !s.ui.flowFocus) {
    // Wires need a settled layout pass before they can be measured. A
    // double rAF guarantees the clip-path/grid layout has flushed.
    requestAnimationFrame(() => requestAnimationFrame(() => drawWires(s)));
  }
}

// ── Entry ──────────────────────────────────────────────────

const reduceMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Full render for a navigation (tab/route change): writes, scrolls to top,
 * and plays the soft "strategy-UI move" entrance. The class is re-armed with
 * a forced reflow so it retriggers on every navigation; in-tab re-renders
 * (rerenderActive) strip it so cursor moves and toggles stay perfectly still.
 */
export function render(s) {
  const el = app();
  el.innerHTML = viewHtml(s);
  afterWrite(s);
  window.scrollTo({ top: 0 });
  if (!reduceMotion()) {
    el.classList.remove('qview-enter');
    void el.offsetWidth;            // reflow so the animation restarts
    el.classList.add('qview-enter');
  }
}

/**
 * Re-render the current view in place WITHOUT scrolling to top. Used for
 * in-tab mutations (selection moves, toggles) so the user keeps their place.
 * Strips the entrance class so these frequent updates never animate.
 */
export function rerenderActive(s) {
  const el = app();
  el.classList.remove('qview-enter');
  el.innerHTML = viewHtml(s);
  afterWrite(s);
  restoreCursorFocus();
}

/**
 * On the mobile scroll-rail tab bar, the active tab can sit off-screen after a
 * navigation. Nudge it into view so the user always sees where they are. The
 * tab bar wraps (no horizontal scroll) on wide screens, so this is a no-op
 * there — guard on the rail actually being scrollable.
 */
let railFadeWired = false;

/** The rail's trailing-edge fade means "more to scroll" — drop it at the end. */
function updateRailFade(tabs) {
  const atEnd = tabs.scrollWidth <= tabs.clientWidth + 4 ||
                tabs.scrollLeft + tabs.clientWidth >= tabs.scrollWidth - 8;
  tabs.classList.toggle('is-at-end', atEnd);
}

function wireRailFade(tabs) {
  if (railFadeWired) return;
  railFadeWired = true;
  tabs.addEventListener('scroll', () => updateRailFade(tabs), { passive: true });
  window.addEventListener('resize', () => updateRailFade(tabs));
}

function keepActiveTabInView() {
  const tabs = document.querySelector('.ctabs');
  if (!tabs) return;
  wireRailFade(tabs);
  updateRailFade(tabs);
  const activeTab = tabs.querySelector('.ctab--active');
  if (!activeTab) return;
  if (tabs.scrollWidth <= tabs.clientWidth + 4) return;   // not scrollable
  activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
}

/** After a re-render, move focus to the current keyboard cursor target. */
function restoreCursorFocus() {
  const target = app()?.querySelector('.crow.is-cursor, .cchapter.is-cursor, .tnode.is-cursor');
  if (target) target.focus({ preventScroll: true });
}

// ── Flowchart wires ────────────────────────────────────────

/**
 * Draw right-angle connectors from each branch to its prerequisites.
 * Reads are batched ahead of writes to avoid layout thrash.
 */
export function drawWires(s) {
  const tree = document.querySelector('.tree');
  const svg = tree?.querySelector('.tree__wires');
  if (!tree || !svg) return;

  const box = tree.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  svg.style.width = `${box.width}px`;
  svg.style.height = `${box.height}px`;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // Phase 1: read all node geometry up front (no interleaved writes).
  const rects = {};
  for (const branch of BRANCHES) {
    const el = tree.querySelector(`.tnode[data-branch="${branch.id}"]`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    rects[branch.id] = {
      cx: r.left - box.left + r.width / 2,
      top: r.top - box.top,
      bottom: r.bottom - box.top,
    };
  }

  // Phase 2: build all SVG nodes, then append in one batch.
  const frag = document.createDocumentFragment();
  for (const branch of BRANCHES) {
    const child = rects[branch.id];
    if (!child) continue;
    for (const pid of branch.prereq) {
      const parent = rects[pid];
      if (!parent) continue;
      const lit = isBranchComplete(s, pid);
      const x1 = parent.cx, y1 = parent.bottom;
      const x2 = child.cx, y2 = child.top;
      const midY = y1 + (y2 - y1) / 2;
      const d = `M ${x1} ${y1} V ${midY} H ${x2} V ${y2}`;

      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', `wire ${lit ? 'wire--lit' : 'wire--dim'}`);
      path.setAttribute('data-from', pid);
      path.setAttribute('data-to', branch.id);
      frag.appendChild(path);

      // Junction node at the parent exit, DBH-style.
      const dot = document.createElementNS(SVGNS, 'rect');
      dot.setAttribute('x', x1 - 3);
      dot.setAttribute('y', y1 - 3);
      dot.setAttribute('width', 6);
      dot.setAttribute('height', 6);
      dot.setAttribute('class', `wire-node ${lit ? 'wire--lit' : 'wire--dim'}`);
      dot.setAttribute('transform', `rotate(45 ${x1} ${y1})`);
      frag.appendChild(dot);
    }
  }
  svg.appendChild(frag);
}
