// ── Console views ────────────────────────────────────────────
// The NieR: Automata style game interface. A shared chrome (tab bar
// + dotted divider + ghost title + bottom hint bar) wraps each tab's
// body. Tabs: Brief, Chapters, Priority, Intel, System.

import {
  TABS, BRANCHES, BRANCH_BY_ID, BANDS, INITIATIVES,
  CEREMONIES, INTEL, ICONS, RANKS, INTEL_SCOPES,
  SITE_GROUPS, SITES, SITES_BY_ID, SITE_LOGOS, siteMatches,
} from './data.js';
import {
  state, branchProgress, branchStatus, isBranchUnlocked,
  overallPercent, rankFor,
} from './state.js';
import { escHtml, domainFromUrl } from './utils.js';
import { splashPref } from './splash.js';
import { bannerStrip, shiftsControl } from './banners.js';
import { FA } from './icons-fa.js';
import { focusWidgetHtml, tipWidgetHtml } from './engagement.js';

// Shared chrome helpers, also used by the Flow tab (flow.js).
// Two icon families: the hand-drawn 24x24 stroke set (ICONS) and the supplied
// FontAwesome-style filled set (FA). FA glyphs are solid single paths on their
// own viewBox, so they render with fill="currentColor" and inherit the theme
// color from whatever holds them. FA is checked first; a stroke icon of the
// same name (or a missing name) falls through to the stroke renderer.
export function icon(name, size = 22) {
  const fa = FA[name];
  if (fa) {
    return `<svg viewBox="${fa.vb}" width="${size}" height="${size}"
      fill="currentColor" aria-hidden="true">${fa.d
        .split('|')
        .map(d => `<path d="${d}"/>`)
        .join('')}</svg>`;
  }
  const path = ICONS[name] || '';
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export function chapterNo(branch) {
  return String(BRANCHES.indexOf(branch) + 1).padStart(2, '0');
}

// ── Shared chrome ──────────────────────────────────────────

/** Top tab bar with the active-tab pointer, like NieR. */
function tabBar(active) {
  const items = TABS.map(t => {
    const href = t.id === 'flow' ? '#flow' : `#${t.id}`;
    const isActive = t.id === active;
    // The tooltip + aria-label gloss the game label with plain language
    // ("Intel — Field glossary") so the section's purpose is discoverable.
    const aria = t.hint ? `${t.label}: ${t.hint}` : t.label;
    return `
      <a class="ctab ${isActive ? 'ctab--active' : ''}" href="${href}" data-tab="${t.id}"
        title="${escHtml(aria)}" aria-label="${escHtml(aria)}"
        ${isActive ? 'aria-current="page"' : ''}>
        <span class="ctab__icon">${icon(t.icon, 18)}</span>
        <span class="ctab__label">${escHtml(t.label)}</span>
      </a>`;
  }).join('');
  // Search lives just below the tab boxes as a compact icon-only trigger. It
  // opens the global command palette (also on "/") and is always reachable.
  const searchBtn = `
    <button type="button" class="search-fab" id="openSearch"
      title="Search everything (press /)" aria-label="Search everything">
      ${icon('search', 20)}
    </button>`;
  return `
    <div class="ctabs-wrap">
      <nav class="ctabs" aria-label="Console sections">
        <span class="ctabs__rail" aria-hidden="true">‖</span>
        ${items}
      </nav>
      ${searchBtn}
    </div>
    <div class="cdots" aria-hidden="true"></div>`;
}

/** Bottom status / key-hint bar. */
function hintBar(text, hints) {
  // With keyboard movement off, drop the hints that promise disabled keys
  // (arrows, Q/E, Enter, Backspace) and keep only the hold-Esc quick menu,
  // which is summoned deliberately and still works.
  let shown = state.prefs.keyboardNav
    ? hints
    : hints.filter(h => /esc/i.test(h.k));

  // On touch/narrow viewports, swap keyboard glyphs for tap labels.
  const isTouch = window.matchMedia?.('(pointer: coarse)').matches;
  const isNarrow = window.matchMedia?.('(max-width: 760px)').matches;
  if (isTouch || isNarrow) {
    shown = [
      { k: 'Tap', v: 'to open' },
      { k: 'Tabs', v: 'to switch' },
      { k: '◆', v: 'for menu' },
    ];
  }

  const keys = shown.map(h =>
    `<span class="chint"><kbd>${escHtml(h.k)}</kbd> ${escHtml(h.v)}</span>`
  ).join('');
  return `
    <div class="cbar">
      <span class="cbar__rail" aria-hidden="true">‖</span>
      <span class="cbar__msg">${escHtml(text)}</span>
      <span class="cbar__hints">${keys}</span>
    </div>`;
}

/** Big ghosted screen title, like the NieR headers. */
export function screenTitle(title, sub) {
  return `
    <header class="cscreen-title">
      <h2 class="ctitle">${escHtml(title)}</h2>
      ${sub ? `<span class="ctitle__sub">${escHtml(sub)}</span>` : ''}
      <span class="ctitle__ghost" aria-hidden="true">${escHtml(title)}</span>
    </header>`;
}

/** Wrap a tab body in the full console shell. */
export function shell(active, body, hintText, hints) {
  return `
    <div class="console">
      ${tabBar(active)}
      <div class="cstage">${body}</div>
      ${hintBar(hintText, hints || [
        { k: '↑↓', v: 'Select' }, { k: '↵', v: 'Open' }, { k: 'Esc', v: 'Menu' },
      ])}
    </div>`;
}

// ── Tab: Brief ─────────────────────────────────────────────

function statBlock(s) {
  const pct = overallPercent(s);
  const rank = rankFor(pct);
  return `
    <div class="cstat">
      <div class="cstat__row">
        <span class="cstat__label">Rank</span>
        <span class="cstat__value">${escHtml(rank.name)}</span>
      </div>
      <div class="cstat__bar"><div style="--pct:${pct / 100}"></div></div>
      <div class="cstat__row">
        <span class="cstat__pct">${pct}% onboarded</span>
        <span class="cstat__blurb">${escHtml(rank.blurb)}</span>
      </div>
    </div>`;
}

export function renderBrief(s) {
  const ceremonies = CEREMONIES.map(c => `
    <li class="cmini"><span class="cmini__t">${escHtml(c.title)}</span>
      <span class="cmini__b">${escHtml(c.body)}</span></li>`).join('');

  const body = `
    ${screenTitle('Brief', 'Operating Model')}
    ${focusWidgetHtml(s)}
    ${bannerStrip(s)}
    <div class="cbrief">
      <section class="cpanel cbrief__lead">
        <p class="clead">A shared way of working: specs for features, one ranked
        backlog, continuous delivery, and a steady cadence of reviews. Read the
        six shifts, then open the Chapters to onboard.</p>
        ${statBlock(s)}
        <div class="cbrief__cta">
          <a class="btn btn--primary btn--sm" href="#chapters">Open chapters</a>
          <a class="btn btn--ghost btn--sm" href="#flow">View flowchart</a>
        </div>
      </section>
      <section class="cpanel">
        <h3 class="cpanel__h">Six key shifts</h3>
        ${shiftsControl(s)}
      </section>
      <section class="cpanel">
        <h3 class="cpanel__h">Ceremonies</h3>
        <ul class="cminis">${ceremonies}</ul>
      </section>
    </div>
    ${tipWidgetHtml()}`;
  return shell('brief', body, 'Read the brief, then onboard through the chapters.',
    [{ k: '↵', v: 'Open chapters' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

// ── Tab: Chapters (big cards → section reader) ─────────────
// Chapters are big items. Each renders as a card with its progress; clicking
// one opens the navigable section-reader popup (chapterReader.js) where the
// subsections read one at a time, jump-list and search included. The grid
// replaces the old inline master/detail checklist.

export function renderChapters(s, selectedId) {
  // Track a "current" chapter (deep links / Q-E cursor target) but the card
  // grid is the surface now; selection just rings the matching card.
  const sel = BRANCHES.find(b => b.id === selectedId)
    || BRANCHES.find(b => isBranchUnlocked(s, b.id))
    || BRANCHES[0];
  s.ui.chapterSel = sel.id;
  s.ui.rowCursor = BRANCHES.findIndex(b => b.id === sel.id);

  const cards = BRANCHES.map((b, i) => {
    const status = branchStatus(s, b.id);
    const { done, total } = branchProgress(s, b.id);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const locked = status === 'locked';
    const cursored = i === s.ui.rowCursor;
    const lockNote = locked
      ? `Clear ${escHtml(b.prereq.map(p => BRANCH_BY_ID[p]?.title).filter(Boolean).join(' and '))} first`
      : '';
    return `
      <button type="button" class="cchapter cchapter--${status} ${cursored ? 'is-cursor' : ''}"
        data-chapter-open="${b.id}" aria-label="Open ${escHtml(b.title)}"
        tabindex="${cursored ? '-1' : '0'}">
        <span class="cchapter__top">
          <span class="cchapter__icon">${icon(b.icon, 26)}</span>
          <span class="cchapter__no">${chapterNo(b)}</span>
          ${status === 'complete'
            ? `<span class="cchapter__seal" aria-label="complete">${icon('check', 13)}</span>`
            : locked ? `<span class="cchapter__lock">${icon('lock', 14)}</span>` : ''}
        </span>
        <span class="cchapter__title">${escHtml(b.title)}</span>
        <span class="cchapter__tagline">${escHtml(b.tagline)}</span>
        <span class="cchapter__bar"><span style="--pct:${pct / 100}"></span></span>
        <span class="cchapter__foot">
          <span class="cchapter__count">${locked ? lockNote : `${done}/${total} sections`}</span>
          <span class="cchapter__go">${locked ? '' : `Read ${icon('caret-right', 13)}`}</span>
        </span>
      </button>`;
  }).join('');

  const body = `
    ${screenTitle('Chapters', 'Field Manual')}
    <p class="cchapters__lead clead">A short, generic onboarding manual. Open a chapter to
    read its sections one at a time — step through with ◀ ▶, jump to any section, or
    search across the whole manual. Mark a section complete to track your progress.</p>
    <div class="cchapters">${cards}</div>`;
  return shell('chapters', body, 'Open a chapter to read its sections in a focused view.',
    [{ k: '↑↓', v: 'Card' }, { k: '↵', v: 'Open' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

// ── Tab: Priority ──────────────────────────────────────────

export function renderPriority(s) {
  const bands = BANDS.map(b => `
    <div class="cband cband--${b.tone}">
      <div class="cband__range">${escHtml(b.range)}</div>
      <div class="cband__label">${escHtml(b.label)}</div>
      <p class="cband__blurb">${escHtml(b.blurb)}</p>
    </div>`).join('');

  const inits = INITIATIVES.map(i => `
    <div class="cinit">
      <span class="cinit__rank">${i.rank}</span>
      <div>
        <div class="cinit__title">${escHtml(i.title)}</div>
        <div class="cinit__note">${escHtml(i.note)}</div>
      </div>
    </div>`).join('');

  const ladder = RANKS.map(r => {
    const pct = overallPercent(s);
    const reached = pct >= r.at;
    const current = rankFor(pct).name === r.name;
    return `
      <li class="cladder__row ${reached ? 'is-reached' : ''} ${current ? 'is-current' : ''}">
        <span class="cladder__at">${r.at}%</span>
        <span class="cladder__name">${escHtml(r.name)}</span>
        <span class="cladder__blurb">${escHtml(r.blurb)}</span>
      </li>`;
  }).join('');

  const body = `
    ${screenTitle('Priority', 'Ranked Backlog')}
    <div class="cpriority">
      <section class="cpanel">
        <h3 class="cpanel__h">Priority bands</h3>
        <div class="cbands">${bands}</div>
      </section>
      <section class="cpanel">
        <h3 class="cpanel__h">${icon('boxes', 14)} Initiatives, stack ranked 1:N</h3>
        <div class="cinits">${inits}</div>
      </section>
      <section class="cpanel">
        <h3 class="cpanel__h">Your rank ladder</h3>
        <ul class="cladder">${ladder}</ul>
      </section>
    </div>`;
  return shell('priority', body, 'Org-wide rank is primary. Active bands ship this cycle.',
    [{ k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

// ── Tab: Intel (master / detail) ───────────────────────────

export function renderIntel(s, selectedId) {
  // Keep selection consistent with the active scope+query: if the open term
  // falls outside the current filter, land on the first match instead.
  const matches = intelMatches(s.ui.intelQuery, s.ui.intelScope);
  const sel = matches.find(t => t.id === selectedId)
    || INTEL.find(t => t.id === selectedId) || matches[0] || INTEL[0];
  s.ui.intelSel = sel.id;
  s.ui.rowCursor = matches.findIndex(t => t.id === sel.id);

  const scopes = INTEL_SCOPES.map(sc => `
    <button type="button" class="cscope ${(s.ui.intelScope || 'all') === sc.id ? 'is-active' : ''}"
      data-intel-scope="${sc.id}" aria-pressed="${(s.ui.intelScope || 'all') === sc.id}">
      ${escHtml(sc.label)}</button>`).join('');

  const body = `
    ${screenTitle('Intel', 'Field Glossary')}
    <div class="cmaster">
      <div class="cpanel clist" role="listbox" aria-label="Intel terms">
        <div class="cintel__search">
          <span class="cintel__search-icon" aria-hidden="true">${icon('search', 16)}</span>
          <input type="search" id="intelSearch" class="cintel__search-input"
            placeholder="Search terms — press /" aria-label="Search glossary terms"
            autocomplete="off" value="${escHtml(s.ui.intelQuery || '')}">
        </div>
        <div class="cscopes" role="group" aria-label="Filter glossary by scope">${scopes}</div>
        <div class="clist__rows" id="intelRows">${intelListItems(s, sel.id)}</div>
      </div>
      <div class="cpanel cdetail cintel" id="intelDetail">${intelDetail(s, sel)}</div>
    </div>`;
  return shell('intel', body, 'Search, pick a scope, or select a term. Press / to search from anywhere.',
    [{ k: '/', v: 'Search' }, { k: '↑↓', v: 'Select' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

/** Terms matching the active query (term, kind, or aliases) AND scope. Empty
 *  query → all in scope; scope 'all' or omitted → every scope. */
export function intelMatches(query, scope) {
  const q = (query || '').trim().toLowerCase();
  const sc = scope || 'all';
  return INTEL.filter(t => {
    if (sc !== 'all' && t.scope !== sc) return false;
    if (!q) return true;
    return t.term.toLowerCase().includes(q) ||
      t.kind.toLowerCase().includes(q) ||
      (t.aliases || []).some(a => a.toLowerCase().includes(q));
  });
}

/** The Intel master-list rows (filtered by the live query + scope), for swaps. */
export function intelListItems(s, selectedId) {
  const matches = intelMatches(s.ui.intelQuery, s.ui.intelScope);
  if (!matches.length) {
    return `<p class="clist__empty">No term matches that.</p>`;
  }
  return matches.map((t) => {
    const active = t.id === selectedId;
    const cursored = s.ui.region === 'list' && t.id === selectedId;
    return `
    <button type="button" class="crow ${active ? 'crow--active' : ''} ${cursored ? 'is-cursor' : ''}"
      data-intel="${t.id}" role="option" aria-selected="${active}"
      tabindex="${cursored ? '-1' : '0'}">
      <span class="crow__name">${escHtml(t.term)}</span>
      <span class="crow__meta"><span class="crow__kind">${escHtml(t.kind)}</span></span>
    </button>`;
  }).join('');
}

/** The Intel detail panel for one term (every term is readable). */
export function intelDetail(s, sel) {
  const chapter = sel.chapter ? BRANCH_BY_ID[sel.chapter] : null;
  // Related terms become in-place selectors.
  const related = (sel.see || [])
    .map(id => INTEL.find(t => t.id === id))
    .filter(Boolean)
    .map(t => `<button type="button" class="ctag" data-intel="${t.id}">${escHtml(t.term)}</button>`)
    .join('');

  return `
    <div class="cdetail__head cdetail__head--intel">
      <h3 class="cdetail__title">${escHtml(sel.term)}</h3>
      <span class="skill__tag">${escHtml(sel.kind)}</span>
    </div>
    <p class="cintel__body" data-self="${sel.id}">${escHtml(sel.body)}</p>
    <div class="cintel__rails">
      ${related ? `
        <div class="cintel__rail">
          <h4 class="cintel__rail-h">Related</h4>
          <div class="ctags">${related}</div>
        </div>` : ''}
      ${chapter ? `
        <div class="cintel__rail">
          <h4 class="cintel__rail-h">Learned in</h4>
          <a class="ctag ctag--chapter" href="#${chapter.id}">${icon('code-branch', 14)} ${escHtml(chapter.title)}</a>
        </div>` : ''}
    </div>`;
}

// ── Tab: System ────────────────────────────────────────────

export function renderSystem(s) {
  const pct = overallPercent(s);
  const splashOn = splashPref() === 'always';
  const keyOn = s.prefs.keyboardNav;
  const mapOn = s.prefs.showFullMap;
  const sheetsOn = s.prefs.showClassSheets;
  const body = `
    ${screenTitle('System', 'Save & About')}
    <div class="csystem">
      <section class="cpanel">
        <h3 class="cpanel__h">Save data</h3>
        <p class="clead">Progress is stored in this browser only. ${pct}% onboarded.</p>
        <ul class="cabout csettings">
          <li>
            <span id="splashToggleLabel">Title screen</span>
            <button type="button" class="ctoggle ${splashOn ? 'is-on' : ''}" id="splashToggle"
              role="switch" aria-checked="${splashOn}" aria-labelledby="splashToggleLabel">
              <span class="ctoggle__track"><span class="ctoggle__thumb"></span></span>
              <span class="ctoggle__state">${splashOn ? 'On every visit' : 'Off'}</span>
            </button>
          </li>
          <li>
            <span id="keynavToggleLabel">Keyboard controls</span>
            <button type="button" class="ctoggle ${keyOn ? 'is-on' : ''}" id="keynavToggle"
              role="switch" aria-checked="${keyOn}" aria-labelledby="keynavToggleLabel">
              <span class="ctoggle__track"><span class="ctoggle__thumb"></span></span>
              <span class="ctoggle__state">${keyOn ? 'Arrows move' : 'Off'}</span>
            </button>
          </li>
          <li>
            <span id="fullMapToggleLabel">Flow map</span>
            <button type="button" class="ctoggle ${mapOn ? 'is-on' : ''}" id="fullMapToggle"
              role="switch" aria-checked="${mapOn}" aria-labelledby="fullMapToggleLabel">
              <span class="ctoggle__track"><span class="ctoggle__thumb"></span></span>
              <span class="ctoggle__state">${mapOn ? 'Show full map' : 'Reveal as you go'}</span>
            </button>
          </li>
          <li>
            <span id="classSheetsToggleLabel">Certification ladders</span>
            <button type="button" class="ctoggle ${sheetsOn ? 'is-on' : ''}" id="classSheetsToggle"
              role="switch" aria-checked="${sheetsOn}" aria-labelledby="classSheetsToggleLabel">
              <span class="ctoggle__track"><span class="ctoggle__thumb"></span></span>
              <span class="ctoggle__state">${sheetsOn ? 'Visible' : 'Hidden'}</span>
            </button>
          </li>
        </ul>
        <p class="csys__danger">
          <button type="button" class="clink-danger" id="resetClassBtn">Reset class choices</button>
          <span class="csys__sep" aria-hidden="true">·</span>
          <button type="button" class="clink-danger" id="resetBtn">Reset save data</button>
        </p>
        <div class="mt-4">
          <button type="button" class="btn btn--ghost btn--sm" id="shareBtn">Share progress</button>
        </div>
      </section>
      <section class="cpanel">
        <h3 class="cpanel__h">About</h3>
        <p class="clead">Questline turns a roadmap and prioritization operating model
        into a game console you explore. Switch the tabs above, or open
        <a href="#flow">Flow</a> for the chapter unlock map.</p>
        <ul class="cabout">
          <li><span>Sections</span><span>${TABS.length} tabs</span></li>
          <li><span>Search</span><span>Press / or the rail button</span></li>
          <li><span>Quick menu</span><span>Hold Esc, point, release</span></li>
          <li><span>Theme</span><span>Night console · Day clinical</span></li>
        </ul>
        <button type="button" class="cegg" id="kiwiEgg" aria-label="A hidden friend" title="?">
          ${icon('kiwi', 18)}
        </button>
      </section>
    </div>`;
  return shell('system', body, 'Manage your save and learn how the console works.',
    [{ k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

// ── Tab: Sites (master / detail) ─────────────────────────────
// A catalog of external pages and tools owned by other teams. Reuses the
// Intel master/detail pattern: group chips filter the list, search narrows
// it, and the detail panel explains the team, context, and link.

function siteLogo(site, size = 32) {
  if (SITE_LOGOS.has(site.id)) {
    return `<img src="assets/logos/${escHtml(site.id)}.svg" alt="" class="csite__logo" width="${size}" height="${size}" loading="lazy">`;
  }
  return `<span class="csite__logo csite__logo--fallback" aria-hidden="true">${icon(site.icon, size * 0.6)}</span>`;
}

function siteCard(site, active) {
  const domain = domainFromUrl(site.url);
  return `
    <button type="button" class="csite-card ${active ? 'csite-card--active' : ''}"
      data-site="${escHtml(site.id)}" aria-expanded="${active}">
      <span class="csite-card__accent" aria-hidden="true"></span>
      <span class="csite-card__icon">${siteLogo(site, 40)}</span>
      <span class="csite-card__main">
        <span class="csite-card__name">${escHtml(site.name)}</span>
        <span class="csite-card__domain">${escHtml(domain)}</span>
        <span class="csite-card__desc">${escHtml(site.description)}</span>
        <span class="csite-card__team">${escHtml(site.team)}</span>
      </span>
    </button>`;
}

function siteDetailAccordion(s, sel) {
  const domain = domainFromUrl(sel.url);
  const tags = (sel.tags || [])
    .map(t => `<span class="csite__tag">${escHtml(t)}</span>`)
    .join('');
  const group = SITE_GROUPS.find(g => g.id === sel.group);

  return `
    <div class="csite-detail" data-site="${escHtml(sel.id)}">
      <div class="csite-detail__head">
        ${siteLogo(sel, 44)}
        <div>
          <h3 class="csite-detail__title">${escHtml(sel.name)}</h3>
          <span class="csite-detail__domain">${escHtml(domain)}</span>
        </div>
      </div>
      <p class="csite-detail__body">${escHtml(sel.description)}</p>
      <div class="csite-detail__context">
        <h4>When to use it</h4>
        <p>${escHtml(sel.context)}</p>
      </div>
      <div class="csite-detail__rails">
        <div class="csite-detail__rail">
          <h4>Owner</h4>
          <span>${escHtml(sel.team)}</span>
        </div>
        ${group ? `
          <div class="csite-detail__rail">
            <h4>Group</h4>
            <span>${escHtml(group.label)}</span>
          </div>` : ''}
        ${tags ? `
          <div class="csite-detail__rail">
            <h4>Tags</h4>
            <div class="csite-detail__tags">${tags}</div>
          </div>` : ''}
      </div>
      <div class="csite-detail__actions">
        <a class="btn btn--primary" href="${escHtml(sel.url)}" target="_blank" rel="noopener noreferrer">
          ${icon('external', 14)} Open site
        </a>
        <button type="button" class="btn btn--ghost" id="copySiteLink" data-copy-url="${escHtml(sel.url)}">
          ${icon('clone', 14)} Copy link
        </button>
      </div>
    </div>`;
}

export function renderSites(s) {
  const matches = siteMatches(s.ui.sitesQuery, s.ui.sitesGroup);
  const sel = SITES_BY_ID[s.ui.sitesSel];
  const selInMatches = sel && matches.some(site => site.id === sel.id);

  const groups = SITE_GROUPS.map(g => `
    <button type="button" class="cscope ${(s.ui.sitesGroup || 'all') === g.id ? 'is-active' : ''}"
      data-site-group="${escHtml(g.id)}" aria-pressed="${(s.ui.sitesGroup || 'all') === g.id}">
      ${escHtml(g.label)}</button>`).join('');

  const groupsHtml = SITE_GROUPS
    .filter(g => g.id !== 'all')
    .map(g => {
      const sites = matches.filter(site => site.group === g.id);
      if (!sites.length) return '';
      const cards = sites.map(site => {
        const active = sel && sel.id === site.id;
        return siteCard(site, active) + (active ? siteDetailAccordion(s, site) : '');
      }).join('');
      return `
        <section class="csite-group">
          <h3 class="csite-group__h">${escHtml(g.label)}</h3>
          <p class="csite-group__desc">${escHtml(g.description)}</p>
          <div class="csite-grid" role="list">${cards}</div>
        </section>`;
    })
    .join('');

  const detailTop = (sel && !selInMatches) ? siteDetailAccordion(s, sel) : '';

  const body = `
    ${screenTitle('Sites', 'Useful Pages')}
    <p class="csites__lead clead">A curated list of external pages and tools maintained by teams across
    the company. Pick a group, search, or tap a card to see its context.</p>
    <div class="csite-toolbar">
      <div class="cintel__search csite-toolbar__search">
        <span class="cintel__search-icon" aria-hidden="true">${icon('search', 16)}</span>
        <input type="search" id="sitesSearch" class="cintel__search-input"
          placeholder="Search sites" aria-label="Search sites"
          autocomplete="off" value="${escHtml(s.ui.sitesQuery || '')}">
      </div>
      <div class="cscopes" role="group" aria-label="Filter sites by group">${groups}</div>
    </div>
    ${detailTop}
    <div class="csite-groups">${groupsHtml || `<p class="clist__empty">No site matches that.</p>`}</div>`;
  return shell('sites', body, 'Tap a card to expand its team, context, and link.',
    [{ k: '/', v: 'Search' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}
