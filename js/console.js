// ── Console views ────────────────────────────────────────────
// The NieR: Automata style game interface. A shared chrome (tab bar
// + dotted divider + ghost title + bottom hint bar) wraps each tab's
// body. Tabs: Brief, Chapters, Priority, Intel, System.

import {
  TABS, BRANCHES, BRANCH_BY_ID, BANDS, INITIATIVES,
  CEREMONIES, INTEL, ICONS, RANKS,
} from './data.js';
import {
  state, branchProgress, branchStatus, isBranchUnlocked,
  overallPercent, rankFor,
} from './state.js';
import { escHtml } from './utils.js';
import { splashPref } from './splash.js';
import { bannerStrip, shiftsControl } from './banners.js';
import { FA } from './icons-fa.js';

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
  return `
    <nav class="ctabs" aria-label="Console sections">
      <span class="ctabs__rail" aria-hidden="true">‖</span>
      ${items}
    </nav>
    <div class="cdots" aria-hidden="true"></div>`;
}

/** Bottom status / key-hint bar. */
function hintBar(text, hints) {
  // With keyboard movement off, drop the hints that promise disabled keys
  // (arrows, Q/E, Enter, Backspace) and keep only the hold-Esc quick menu,
  // which is summoned deliberately and still works.
  const shown = state.prefs.keyboardNav
    ? hints
    : hints.filter(h => /esc/i.test(h.k));
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
      <div class="cstat__bar"><div style="transform:scaleX(${pct / 100})"></div></div>
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
    </div>`;
  return shell('brief', body, 'Read the brief, then onboard through the chapters.',
    [{ k: '↵', v: 'Open chapters' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

// ── Tab: Chapters (master / detail) ────────────────────────

export function renderChapters(s, selectedId) {
  // Pick a sensible default: the selected branch, else first unlocked.
  const sel = BRANCHES.find(b => b.id === selectedId)
    || BRANCHES.find(b => isBranchUnlocked(s, b.id))
    || BRANCHES[0];
  // Keep shared cursor state in sync so keyboard nav lands on the open row.
  s.ui.chapterSel = sel.id;
  s.ui.rowCursor = BRANCHES.findIndex(b => b.id === sel.id);

  const list = BRANCHES.map((b, i) => {
    const status = branchStatus(s, b.id);
    const { done, total } = branchProgress(s, b.id);
    const locked = status === 'locked';
    const active = b.id === sel.id;
    const cursored = s.ui.region === 'list' && i === s.ui.rowCursor;
    const meta = locked
      ? icon('lock', 13)
      : `${done}/${total}${status === 'complete' ? ` <span class="crow__seal" aria-label="complete">${icon('check', 12)}</span>` : ''}`;
    return `
      <button type="button" class="crow ${active ? 'crow--active' : ''} ${cursored ? 'is-cursor' : ''} crow--${status}"
        data-chapter="${b.id}" ${locked ? 'data-locked="1"' : ''}
        role="option" aria-selected="${active}">
        <span class="crow__no">${chapterNo(b)}</span>
        <span class="crow__name">${escHtml(b.title)}</span>
        <span class="crow__meta">${meta}</span>
      </button>`;
  }).join('');

  const detail = chapterDetail(s, sel);

  const body = `
    ${screenTitle('Chapters', 'Onboarding Path')}
    <div class="cmaster">
      <div class="cpanel clist" role="listbox" aria-label="Chapters">
        <div class="clist__head">Standard Path</div>
        ${list}
      </div>
      <div class="cpanel cdetail">${detail}</div>
    </div>`;
  return shell('chapters', body, chapterHint(s), chapterKeys(s));
}

/** Region-aware hint copy + keys for the Chapters tab (no dead keys). */
function chapterHint(s) {
  return s.ui.region === 'detail'
    ? 'Toggle skills, or clear the whole chapter.'
    : 'Select a chapter to read and clear its skills.';
}
function chapterKeys(s) {
  return s.ui.region === 'detail'
    ? [{ k: '↑↓', v: 'Skill' }, { k: '↵', v: 'Toggle' }, { k: 'Hold ↵', v: 'Complete' }, { k: '←', v: 'Back' }]
    : [{ k: '↑↓', v: 'Select' }, { k: '↵', v: 'Open' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }];
}

function chapterDetail(s, branch) {
  const locked = !isBranchUnlocked(s, branch.id);
  if (locked) {
    const names = branch.prereq.map(p => BRANCHES.find(b => b.id === p)?.title).filter(Boolean);
    return `
      <div class="cdetail__locked">
        <span class="cdetail__lockicon">${icon('lock', 30)}</span>
        <h3>${escHtml(branch.title)}</h3>
        <p>Locked. Clear ${escHtml(names.join(' and '))} to unlock this chapter.</p>
      </div>`;
  }
  const { done, total } = branchProgress(s, branch.id);
  const pct = total ? Math.round((done / total) * 100) : 0;
  const allDone = done === total;
  const inDetail = s.ui.region === 'detail';
  const skills = branch.nodes.map((n, i) => {
    const checked = !!s.done[n.id];
    const cursored = inDetail && i === s.ui.skillCursor;
    const detail = n.list
      ? `<ul class="skill__list">${n.list.map(li => `<li>${escHtml(li)}</li>`).join('')}</ul>`
      : `<p class="skill__body">${escHtml(n.body)}</p>`;
    return `
      <div class="skill ${checked ? 'skill--done' : ''} ${cursored ? 'is-cursor' : ''}">
        <button type="button" class="skill__check" data-node="${n.id}"
          aria-pressed="${checked}" aria-label="Toggle ${escHtml(n.title)}">${icon('check', 16)}</button>
        <div class="skill__main">
          <div class="skill__head">
            <span class="skill__title">${escHtml(n.title)}</span>
            <span class="skill__tag">${escHtml(n.tag)}</span>
          </div>
          ${detail}
        </div>
      </div>`;
  }).join('');

  return `
    <div class="cdetail__head">
      <span class="cdetail__no">${chapterNo(branch)}</span>
      <div class="cdetail__heading">
        <h3 class="cdetail__title">${escHtml(branch.title)}</h3>
        <p class="cdetail__summary">${escHtml(branch.summary)}</p>
      </div>
      ${completeControl(branch, done, total)}
    </div>
    <div class="branch-progress">
      <div class="branch-progress__bar"><div style="transform:scaleX(${pct / 100})"></div></div>
      <span class="branch-progress__count">${done}/${total} skills</span>
    </div>
    <div class="skills">${skills}</div>`;
}

/**
 * The chapter-completion control, in the detail head next to the title.
 * Three states map to branchProgress: empty (none done), partial
 * (indeterminate), and cleared (a stamped seal). State IS the control, so
 * there is no verb-toggle ambiguity, and clearing a full chapter routes
 * through a confirm rather than being a same-pixel click.
 */
function completeControl(branch, done, total) {
  if (total > 0 && done === total) {
    return `
      <button type="button" class="cseal" data-branch-done="${branch.id}" data-value="clear"
        aria-pressed="true" aria-label="Chapter cleared — click to undo">
        <span class="cseal__mark">${icon('check', 16)}</span>
        <span class="cseal__txt">Cleared</span>
      </button>`;
  }
  const partial = done > 0;
  // Both glyphs are always present; the state class shows the right one, so
  // a surgical patch only has to toggle a class (no innerHTML swap).
  return `
    <button type="button" class="cdone ${partial ? 'is-partial' : ''}" data-branch-done="${branch.id}"
      data-value="all" aria-pressed="${partial ? 'mixed' : 'false'}"
      aria-label="Mark all skills in this chapter complete">
      <span class="cdone__box">
        <span class="cdone__dash" aria-hidden="true"></span>
        <span class="cdone__check" aria-hidden="true">${icon('check', 14)}</span>
      </span>
      <span class="cdone__txt">${partial ? 'Finish' : 'All'}</span>
    </button>`;
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
  const sel = INTEL.find(t => t.id === selectedId) || INTEL[0];
  s.ui.intelSel = sel.id;
  s.ui.rowCursor = INTEL.findIndex(t => t.id === sel.id);

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
        <div class="clist__rows" id="intelRows">${intelListItems(s, sel.id)}</div>
      </div>
      <div class="cpanel cdetail cintel" id="intelDetail">${intelDetail(s, sel)}</div>
    </div>`;
  return shell('intel', body, 'Search or select a term. Press / to search from anywhere.',
    [{ k: '/', v: 'Search' }, { k: '↑↓', v: 'Select' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

/** Terms matching the active query (term, kind, or aliases). Empty → all. */
export function intelMatches(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return INTEL.slice();
  return INTEL.filter(t =>
    t.term.toLowerCase().includes(q) ||
    t.kind.toLowerCase().includes(q) ||
    (t.aliases || []).some(a => a.toLowerCase().includes(q)));
}

/** The Intel master-list rows (filtered by the live query), for surgical swaps. */
export function intelListItems(s, selectedId) {
  const matches = intelMatches(s.ui.intelQuery);
  if (!matches.length) {
    return `<p class="clist__empty">No term matches that.</p>`;
  }
  return matches.map((t) => {
    const active = t.id === selectedId;
    const cursored = s.ui.region === 'list' && t.id === selectedId;
    return `
    <button type="button" class="crow ${active ? 'crow--active' : ''} ${cursored ? 'is-cursor' : ''}"
      data-intel="${t.id}" role="option" aria-selected="${active}">
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
        </ul>
        <p class="csys__danger">
          <button type="button" class="clink-danger" id="resetBtn">Reset save data</button>
        </p>
      </section>
      <section class="cpanel">
        <h3 class="cpanel__h">About</h3>
        <p class="clead">Questline turns a roadmap and prioritization operating model
        into a game console you explore. Switch the tabs above, or open
        <a href="#flow">Flow</a> for the chapter unlock map.</p>
        <ul class="cabout">
          <li><span>Sections</span><span>${TABS.length} tabs</span></li>
          <li><span>Quick menu</span><span>Hold Esc, point, release</span></li>
          <li><span>Theme</span><span>Modern Disney console</span></li>
        </ul>
        <button type="button" class="cegg" id="kiwiEgg" aria-label="A hidden friend" title="?">
          ${icon('kiwi', 18)}
        </button>
      </section>
    </div>`;
  return shell('system', body, 'Manage your save and learn how the console works.',
    [{ k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}
