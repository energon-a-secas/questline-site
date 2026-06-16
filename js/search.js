// ── Global command palette ───────────────────────────────────
// One search across the whole console: sections, chapters, every chapter
// subsection, glossary terms, playbooks, and profile classes + certifications.
// Opened from the search button beside the System tab or the global "/" key.
// The point is discoverability — a concept like "infrastructure" is not
// obviously in one place, so a hit surfaces every destination that touches it
// (a profile class, a chapter, a glossary term) and routes you straight there.
//
// Each index entry carries `keywords` (extra synonyms beyond its visible text)
// and a `run()` that performs the navigation, so destinations the hash cannot
// express on its own (open a chapter subsection, select a playbook) still work.

import {
  BRANCHES, TABS, INTEL, CLASSES, TEAM_TOPOLOGY, CUSTOMER_NEEDS,
} from './data.js';
import { state, setClass, getPlaybooksVersion } from './state.js';
import { escHtml } from './utils.js';
import { icon } from './console.js';
import { openChapterReader } from './chapterReader.js';

let root = null;
let opener = null;
let cur = 0;          // highlighted result index
let results = [];     // current filtered, ranked results

/** Is the command palette open? (so list keynav + quick menu stand down) */
export function isSearchOpen() {
  return root !== null;
}

// ── Index ──────────────────────────────────────────────────

/** Build the full searchable index once. The content model is static. */
function buildIndex() {
  const items = [];

  // Sections (console tabs).
  for (const t of TABS) {
    items.push({
      kind: 'Section', icon: t.icon, label: t.label, sub: t.hint,
      keywords: [t.id, t.hint],
      run: () => { location.hash = t.id === 'flow' ? '#flow' : `#${t.id}`; },
    });
  }

  // Chapters + their subsections (open straight into the section reader).
  BRANCHES.forEach((b, bi) => {
    const no = String(bi + 1).padStart(2, '0');
    items.push({
      kind: 'Chapter', icon: b.icon, label: b.title, sub: b.tagline,
      keywords: [b.summary, b.tagline, 'chapter', 'onboarding', 'manual'],
      run: () => openChapterReader(state, b.id),
    });
    b.nodes.forEach(n => {
      items.push({
        kind: 'Section · ' + b.title, icon: 'file-lines', label: n.title, sub: n.tag,
        keywords: [n.body, (n.list || []).join(' '), b.title],
        run: () => openChapterReader(state, b.id, n.id),
      });
    });
  });

  // Glossary terms.
  for (const t of INTEL) {
    const scope = t.scope === 'basic' ? 'Basics'
      : t.scope === 'company' ? 'Company'
      : t.scope === 'product' ? 'Product'
      : 'Operating model';
    items.push({
      kind: 'Intel · ' + scope, icon: 'atlas', label: t.term, sub: t.kind,
      keywords: [t.body, (t.aliases || []).join(' '), t.kind],
      run: () => { location.hash = `#intel/${t.id}`; },
    });
  }

  // Playbooks (current set, including any the user added).
  for (const p of state.playbooks) {
    items.push({
      kind: 'Playbook', icon: p.icon || 'route', label: p.title, sub: p.category || 'Workflow',
      keywords: [p.summary, (p.steps || []).map(st => st.title).join(' '), 'workflow', 'process'],
      run: () => { state.ui.playbookSel = p.id; state.ui.playbookEdit = false; location.hash = '#playbooks'; },
    });
  }

  // Atlas: customer needs and topology teams.
  for (const n of CUSTOMER_NEEDS) {
    items.push({
      kind: 'Atlas · Need', icon: 'map', label: n.label, sub: 'Customer need',
      keywords: ['customer need', 'value stream', 'atlas', 'topology'],
      run: () => { state.ui.atlasView = 'matrix'; location.hash = '#atlas'; },
    });
  }
  for (const t of TEAM_TOPOLOGY) {
    items.push({
      kind: 'Atlas · ' + t.topology, icon: 'sitemap', label: t.name, sub: 'Team',
      keywords: [t.topology, 'team topology', 'cross-functional', 'value stream'],
      run: () => { state.ui.atlasView = 'map'; location.hash = '#atlas'; },
    });
  }

  // Profile classes + their certifications.
  for (const c of CLASSES) {
    items.push({
      kind: 'Profile class', icon: c.icon, label: c.title, sub: c.tagline,
      keywords: [c.blurb, c.tagline, 'class', 'role', 'career', 'profile'],
      run: () => { setClass(state, c.id); location.hash = '#profile'; },
    });
    for (const rung of c.rungs) {
      for (const cert of rung.certs) {
        items.push({
          kind: `Cert · ${c.title} · ${rung.tier}`, icon: 'award', label: cert.name, sub: cert.issuer,
          keywords: [cert.issuer, c.title, rung.tier, 'certification', 'credential'],
          run: () => { setClass(state, c.id); state.ui.credEditing = cert.id; location.hash = '#profile'; },
        });
      }
    }
  }

  return items;
}

let INDEX = null;
let _indexVersion = -1;
/** Rebuilt lazily and invalidated only when playbooks change. */
function index() {
  const v = getPlaybooksVersion();
  if (INDEX && _indexVersion === v) return INDEX;
  _indexVersion = v;
  INDEX = buildIndex();
  return INDEX;
}

// ── Ranking ────────────────────────────────────────────────

/** Score an item against a lowercased query. Higher is better; 0 = no match.
 *  Label hits rank above keyword/kind hits, prefix above mid-string. */
function score(item, q) {
  const label = item.label.toLowerCase();
  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if ((item.sub || '').toLowerCase().includes(q)) return 40;
  if (item.kind.toLowerCase().includes(q)) return 30;
  if ((item.keywords || []).some(k => (k || '').toLowerCase().includes(q))) return 20;
  return 0;
}

function search(query) {
  const q = query.trim().toLowerCase();
  const all = index();
  if (!q) {
    // Empty query: a useful default list — sections then chapters.
    return all.filter(it => it.kind === 'Section' || it.kind === 'Chapter').slice(0, 8);
  }
  return all
    .map(it => ({ it, s: score(it, q) }))
    .filter(r => r.s > 0)
    .sort((a, b) => b.s - a.s || a.it.label.length - b.it.label.length)
    .slice(0, 24)
    .map(r => r.it);
}

// ── Open / render ──────────────────────────────────────────

export function openSearch() {
  if (root) return;
  cur = 0;
  results = search('');
  opener = document.activeElement;
  root = document.createElement('div');
  root.className = 'modal modal--search';
  document.body.appendChild(root);
  document.body.classList.add('modal-open');
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  document.addEventListener('keydown', onKey, true);

  render();
  requestAnimationFrame(() => root?.classList.add('is-visible'));
  const box = root.querySelector('#siteSearchInput');
  box?.focus();
}

function render() {
  if (!root) return;
  root.innerHTML = `
    <div class="modal__backdrop" data-close></div>
    <div class="cpalette fbevel" role="dialog" aria-modal="true" aria-label="Search the console">
      <div class="cpalette__inputwrap">
        <span class="cpalette__icon" aria-hidden="true">${icon('search', 18)}</span>
        <input type="search" id="siteSearchInput" class="cpalette__input"
          placeholder="Search sections, chapters, terms, classes…"
          aria-label="Search" autocomplete="off" role="combobox" aria-expanded="true"
          aria-controls="siteSearchResults" aria-activedescendant="">
        <kbd class="cpalette__esc">Esc</kbd>
      </div>
      <div class="cpalette__results" id="siteSearchResults" role="listbox">${resultRows()}</div>
      <div class="cpalette__foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
        <span><kbd>↵</kbd> go</span>
        <span><kbd>Esc</kbd> close</span>
      </div>
    </div>`;
}

function resultRows() {
  if (!results.length) {
    return `<p class="cpalette__empty">No matches. Try a tool, concept, or certification.</p>`;
  }
  return results.map((it, i) => `
    <button type="button" class="cpalette__row ${i === cur ? 'is-cursor' : ''}"
      id="ssr-${i}" data-ss="${i}" role="option" aria-selected="${i === cur}">
      <span class="cpalette__rowicon">${icon(it.icon || 'search', 18)}</span>
      <span class="cpalette__rowtext">
        <span class="cpalette__rowlabel">${escHtml(it.label)}</span>
        ${it.sub ? `<span class="cpalette__rowsub">${escHtml(it.sub)}</span>` : ''}
      </span>
      <span class="cpalette__rowkind">${escHtml(it.kind)}</span>
    </button>`).join('');
}

/** Patch only the results list (keeps input focus during typing). */
function patchResults() {
  const list = root?.querySelector('#siteSearchResults');
  if (list) list.innerHTML = resultRows();
  const input = root?.querySelector('#siteSearchInput');
  input?.setAttribute('aria-activedescendant', results.length ? `ssr-${cur}` : '');
}

function move(dir) {
  if (!results.length) return;
  cur = ((cur + dir) % results.length + results.length) % results.length;
  patchResults();
  root?.querySelector(`#ssr-${cur}`)?.scrollIntoView({ block: 'nearest' });
}

function choose(i) {
  const it = results[i];
  if (!it) return;
  close();
  it.run();
}

// ── Events ─────────────────────────────────────────────────

function onClick(e) {
  if (e.target.closest('[data-close]')) { close(); return; }
  const row = e.target.closest('[data-ss]');
  if (row) choose(Number(row.dataset.ss));
}

function onInput(e) {
  if (!e.target.closest('#siteSearchInput')) return;
  results = search(e.target.value);
  cur = 0;
  patchResults();
}

function focusable() {
  return root ? [...root.querySelectorAll('button:not([disabled]), a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')] : [];
}

function onKey(e) {
  if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); return; }
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1); return; }
  if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); return; }
  if (e.key === 'Enter') { e.preventDefault(); choose(cur); return; }
  if (e.key === 'Tab') {
    // Trap focus inside the palette so Tab can't reach the page behind it.
    const f = focusable();
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
}

function close() {
  if (!root) return;
  document.removeEventListener('keydown', onKey, true);
  root.classList.remove('is-visible');
  const r = root;
  const op = opener;
  root = null;
  opener = null;
  r.addEventListener('transitionend', () => {
    document.body.classList.remove('modal-open');
    r.remove();
    op?.focus?.();
  }, { once: true });
  // Fallback in case transitionend does not fire.
  setTimeout(() => {
    if (r.isConnected) {
      document.body.classList.remove('modal-open');
      r.remove();
      op?.focus?.();
    }
  }, 300);
}
