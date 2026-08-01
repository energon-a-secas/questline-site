/* Component library — renders the catalog into library.html.
   Every specimen is REAL production markup; only the surrounding
   stage/snippet chrome is library-specific (css/parts/library.css). */

import { initTheme } from './theme.js';
import { ICONS } from './data.js';
import { FA } from './icons-fa.js';

/* Local copy of the app's icon() helper (js/console.js) so specimens can
   embed glyphs without importing the view modules. */
function icon(name, size = 22) {
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

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ── Token groups ──────────────────────────────────────────── */

const TOKEN_GROUPS = [
  {
    name: 'Palette', note: 'Brand and semantic colors. Flip the theme to see them re-solve.',
    vars: ['--bg', '--text-primary', '--text-secondary', '--text-muted', '--accent', '--accent-bright', '--gold', '--success', '--violet', '--danger'],
  },
  {
    name: 'Surfaces & borders', note: 'Glass washes and rules — alpha ramps over the page bg.',
    vars: ['--surface-1', '--surface-2', '--surface-3', '--border-subtle', '--border', '--border-strong', '--plate-edge'],
  },
  {
    name: 'Media plates', note: 'Banners, modals and event surfaces stay dark navy in BOTH themes. Interiors must consume these — never the themed text/accent vars.',
    vars: ['--banner-fill', '--banner-fill-deep', '--banner-text', '--banner-text-dim', '--banner-text-faint', '--banner-azure', '--banner-gold', '--banner-violet', '--banner-border', '--banner-surface'],
  },
  {
    name: 'Categorical hues', note: 'Class and atlas categories — not interactive accents.',
    vars: ['--hue-azure', '--hue-teal', '--hue-violet', '--hue-amber', '--hue-rose'],
  },
];

const TYPE_ROWS = [
  { tag: 'Display · title', html: `<span style="font-weight:300;text-transform:uppercase;letter-spacing:.22em;font-size:clamp(1.3rem,2.6vw,1.8rem);color:var(--text-primary)">Questline</span>` },
  { tag: 'Body · base', html: `<span style="font-size:var(--text-base);color:var(--text-primary);line-height:var(--leading-body)">Clear the earlier chapters to unlock this section.</span>` },
  { tag: 'Body · muted', html: `<span style="font-size:var(--text-sm);color:var(--text-muted)">Progress is stored in this browser only.</span>` },
  { tag: 'Mono · micro-label', html: `<span style="font-family:var(--font-mono);font-size:var(--micro-size);letter-spacing:var(--micro-track);text-transform:uppercase;color:var(--accent)">Operator's Log</span>` },
  { tag: 'Mono · numeric', html: `<span style="font-family:var(--font-mono);font-size:var(--text-sm);color:var(--text-secondary)">2D 11H LEFT · 04 / 12 DONE</span>` },
];

const SPACE_VARS = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-8'];
const BEVEL_VARS = ['--bevel-sm', '--bevel', '--bevel-lg'];

/* ── Specimen sections ─────────────────────────────────────── */

const SECTIONS = [
  {
    id: 'tokens', no: '01', title: 'Tokens',
    lede: 'Single source of truth in css/parts/tokens.css. Components consume vars, never hardcoded colors.',
    kind: 'tokens',
  },
  {
    id: 'buttons', no: '02', title: 'Buttons',
    lede: 'One .btn base with modifier classes. Icon buttons are square; --block fills the row.',
    specimens: [
      {
        name: 'Variants', classes: '.btn --primary --secondary --ghost --danger',
        note: 'Primary carries the accent ink; danger only for destructive actions.',
        html: `<button type="button" class="btn btn--primary">Primary</button>
<button type="button" class="btn btn--secondary">Secondary</button>
<button type="button" class="btn btn--ghost">Ghost</button>
<button type="button" class="btn btn--danger">Danger</button>`,
      },
      {
        name: 'Sizes & shapes', classes: '.btn--sm .btn--icon .btn--block',
        note: 'Small for toolbars, icon for glyph-only actions, block for forms.',
        html: `<button type="button" class="btn btn--primary btn--sm">Small</button>
<button type="button" class="btn btn--ghost btn--sm">${icon('plus', 13)} With icon</button>
<button type="button" class="btn btn--icon" aria-label="Edit">${icon('pencil', 15)}</button>`,
      },
    ],
  },
  {
    id: 'cards', no: '03', title: 'Cards & plates',
    lede: 'Rounded glass cards for content, faceted bevel plates for console surfaces. The .cpanel rim is the element background; an inset ::before re-fills the interior.',
    specimens: [
      {
        name: 'Card', classes: '.card',
        note: 'Base glass card — static content.',
        stage: 'column',
        html: `<div class="card" style="margin-bottom:0">
  <h3 style="margin-top:0">Static card</h3>
  <p style="margin-bottom:0;color:var(--text-muted)">Backdrop blur over the page wash, hairline border, hover lift.</p>
</div>`,
      },
      {
        name: 'Interactive card', classes: '.card .card--interactive',
        note: 'Adds enter animation and hover raise — for clickable cards.',
        stage: 'column',
        html: `<div class="card card--interactive" style="margin-bottom:0">
  <h3 style="margin-top:0">Interactive card</h3>
  <p style="margin-bottom:0;color:var(--text-muted)">Hover: translateY(-3px) + card shadow + stronger border.</p>
</div>`,
      },
      {
        name: 'Console panel', classes: '.cpanel',
        note: 'Faceted HUD plate with the accent tick on the cut corner. The workhorse of the console tabs.',
        stage: 'column',
        html: `<div class="cpanel">
  <h3 class="cpanel__h">Panel heading</h3>
  <p style="margin:0;color:var(--text-muted)">Beveled plate — clip-path corner cuts, lit top edge, deep base.</p>
</div>`,
      },
      {
        name: 'Tip card', classes: '.tip__card',
        note: 'Compact inline tip with glyph and cycle button.',
        stage: 'column',
        html: `<div class="tip__card">
  <span class="tip__icon" aria-hidden="true">${icon('star', 18)}</span>
  <div class="tip__main">
    <span class="tip__kicker">Tip · Command palette</span>
    <p class="tip__body">Press / anywhere to search every section, term, and class.</p>
  </div>
  <button type="button" class="tip__next" aria-label="Next tip">↻</button>
</div>`,
      },
      {
        name: 'Class crest', classes: '.cclass__crest',
        note: 'Faceted crest plate — size and accent set via custom properties.',
        html: `<span class="cclass__crest" style="--crest-color:#2aa8ff;--crest-size:56px" aria-hidden="true">
  <span class="cclass__crest-symbol">I</span>
</span>
<span class="cclass__crest" style="--crest-color:#34d399;--crest-size:56px" aria-hidden="true">
  <span class="cclass__crest-symbol">S</span>
</span>
<span class="cclass__crest" style="--crest-color:#b08cff;--crest-size:56px" aria-hidden="true">
  <span class="cclass__crest-symbol">X</span>
</span>
<span class="cclass__crest" style="--crest-color:#ffce4d;--crest-size:56px" aria-hidden="true">
  <span class="cclass__crest-symbol">B</span>
</span>`,
      },
    ],
  },
  {
    id: 'tabs', no: '04', title: 'Tabs & navigation',
    lede: 'Single-row tab rail with icon + label; the active tab fills with a lit gradient. Rail scrolls horizontally on narrow screens.',
    specimens: [
      {
        name: 'Tab rail', classes: '.ctabs .ctab .ctab--active',
        note: 'Static four-tab slice of the console rail.',
        stage: 'column',
        html: `<div class="ctabs-wrap">
  <nav class="ctabs is-at-end" aria-label="Console sections">
    <span class="ctabs__rail" aria-hidden="true">‖</span>
    <a class="ctab ctab--active" href="#" aria-current="page">
      <span class="ctab__icon">${icon('book', 18)}</span>
      <span class="ctab__label">Brief</span>
    </a>
    <a class="ctab" href="#">
      <span class="ctab__icon">${icon('layer-group', 18)}</span>
      <span class="ctab__label">Chapters</span>
    </a>
    <a class="ctab" href="#">
      <span class="ctab__icon">${icon('atlas', 18)}</span>
      <span class="ctab__label">Intel</span>
    </a>
    <a class="ctab" href="#">
      <span class="ctab__icon">${icon('cog', 18)}</span>
      <span class="ctab__label">System</span>
    </a>
  </nav>
  <button type="button" class="search-fab" aria-label="Search everything">${icon('search', 20)}</button>
</div>`,
      },
    ],
  },
  {
    id: 'badges', no: '05', title: 'Badges & status',
    lede: 'Pills, timers, and status glyphs. Timers and banner chips live on media plates — shown on a dark stage.',
    specimens: [
      {
        name: 'Skill tags', classes: '.skill__tag',
        note: 'Small categorical pill used in lists and selectors.',
        html: `<span class="skill__tag">Frontend</span>
<span class="skill__tag">Infra</span>
<span class="skill__tag">On-call</span>`,
      },
      {
        name: 'Event timers', classes: '.banner__timer --soon --over',
        note: 'Azure while open, gold + pulse when closing, dim when over.',
        stage: 'dark',
        html: `<span class="banner__timer">${icon('clock', 13)} <span class="banner__timer-val">12D 4H LEFT</span></span>
<span class="banner__timer banner__timer--soon">${icon('clock', 13)} <span class="banner__timer-val">2D 11H LEFT</span></span>
<span class="banner__timer banner__timer--over">${icon('clock', 13)} <span class="banner__timer-val">ENDED</span></span>`,
      },
      {
        name: 'Dispatch timers', classes: '.daily__timer --open --soon',
        note: 'Filled chips inside daily cards — azure fill, gold fill when closing.',
        stage: 'dark',
        html: `<span class="daily__timer daily__timer--open">${icon('clock', 12)} 6D 2H LEFT</span>
<span class="daily__timer daily__timer--soon">${icon('clock', 12)} 14H LEFT</span>`,
      },
      {
        name: 'Credential status', classes: '.ccert--earned/--in-progress/--expired .ccert__status-glyph',
        note: 'Glyph dot takes its tone from the row modifier class.',
        html: `<span class="ccert ccert--earned" style="display:inline-flex;border:none;background:none;padding:0">
  <span class="ccert__status-glyph">${icon('check', 14)}</span>
</span>
<span class="ccert ccert--in-progress" style="display:inline-flex;border:none;background:none;padding:0">
  <span class="ccert__status-glyph"><svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M3 7h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
</span>
<span class="ccert ccert--expired" style="display:inline-flex;border:none;background:none;padding:0">
  <span class="ccert__status-glyph"><svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
</span>`,
      },
      {
        name: 'Ladder badges', classes: '.crung__badge[data-tier]',
        note: 'Faceted tier initial, colored by data-tier.',
        html: `<span class="crung__badge" data-tier="entry">E</span>
<span class="crung__badge" data-tier="intermediate">I</span>
<span class="crung__badge" data-tier="advanced">A</span>
<span class="crung__badge" data-tier="referent">R</span>`,
      },
    ],
  },
  {
    id: 'banners', no: '06', title: 'Banners & event plates',
    lede: 'Full-width media plates. Always dark navy — the accent triad (azure / gold / violet) comes from the --banner-* token family.',
    specimens: [
      {
        name: 'Event banner · azure', classes: '.banner .banner--azure',
        note: 'Standard event tone.',
        stage: 'column',
        html: `<button type="button" class="banner banner--azure is-active">
  <span class="banner__bg" aria-hidden="true">${icon('rocket', 132)}</span>
  <span class="banner__scrim" aria-hidden="true"></span>
  <span class="banner__body">
    <span class="banner__topline">
      <span class="banner__kicker">Limited event</span>
      <span class="banner__timer">${icon('clock', 13)} <span class="banner__timer-val">12D 4H LEFT</span></span>
    </span>
    <span class="banner__title">Migration gauntlet</span>
    <span class="banner__blurb">Move one legacy service to the new stack and log the runbook.</span>
    <span class="banner__foot">
      <span class="banner__date">Ends Aug 10 · Sprint 16</span>
      <span class="banner__cta">Open chapter ${icon('caret-right', 14)}</span>
    </span>
  </span>
</button>`,
      },
      {
        name: 'Event banner · gold', classes: '.banner .banner--gold',
        note: 'Closing-soon urgency — gold rim, pulsing timer.',
        stage: 'column',
        html: `<button type="button" class="banner banner--gold is-active">
  <span class="banner__bg" aria-hidden="true">${icon('flask', 132)}</span>
  <span class="banner__scrim" aria-hidden="true"></span>
  <span class="banner__body">
    <span class="banner__topline">
      <span class="banner__kicker">Closing soon</span>
      <span class="banner__timer banner__timer--soon">${icon('clock', 13)} <span class="banner__timer-val">2D 11H LEFT</span></span>
    </span>
    <span class="banner__title">On-call drill week</span>
    <span class="banner__blurb">Run the incident checklist end to end before the rotation changes.</span>
    <span class="banner__foot">
      <span class="banner__date">Ends Jul 31 · All teams</span>
      <span class="banner__cta">Start drill ${icon('caret-right', 14)}</span>
    </span>
  </span>
</button>`,
      },
      {
        name: 'Event banner · violet', classes: '.banner .banner--violet',
        note: 'Knowledge / community tone.',
        stage: 'column',
        html: `<button type="button" class="banner banner--violet is-active">
  <span class="banner__bg" aria-hidden="true">${icon('book', 132)}</span>
  <span class="banner__scrim" aria-hidden="true"></span>
  <span class="banner__body">
    <span class="banner__topline">
      <span class="banner__kicker">Field manual</span>
    </span>
    <span class="banner__title">New intel chapter: incident comms</span>
    <span class="banner__blurb">Status-page wording, stakeholder cadence, and the two-sentence update.</span>
    <span class="banner__foot">
      <span class="banner__date">Permanent · Intel</span>
      <span class="banner__cta">Read chapter ${icon('caret-right', 14)}</span>
    </span>
  </span>
</button>`,
      },
      {
        name: 'Focus card', classes: '.focus__card',
        note: 'Today\'s single suggested action — kicker, title, blurb, dismiss.',
        stage: 'column',
        html: `<div class="focus__card">
  <span class="focus__glyph" aria-hidden="true">${icon('compass', 26)}</span>
  <div class="focus__main">
    <div class="focus__head">
      <span class="focus__kicker">Today's Focus</span>
      <span class="focus__streak">4-day streak</span>
    </div>
    <strong class="focus__title">Clear one chapter section</strong>
    <p class="focus__blurb">Small daily progress beats a monthly marathon.</p>
  </div>
  <div class="focus__actions">
    <button type="button" class="focus__dismiss" aria-label="Dismiss today's focus">×</button>
  </div>
</div>`,
      },
    ],
  },
  {
    id: 'forms', no: '07', title: 'Forms & inputs',
    lede: 'Field labels are mono micro-caps above the control. Toggles are switches with a text state.',
    specimens: [
      {
        name: 'Fields', classes: '.ccredform__field input/select/textarea',
        note: 'Shared field chrome across playbook and credential forms.',
        stage: 'column',
        html: `<form class="cpbform" style="width:100%">
  <div class="cpbform__grid">
    <label class="ccredform__field">
      <span>Title</span>
      <input type="text" value="Rollback drill" autocomplete="off">
    </label>
    <label class="ccredform__field">
      <span>Status</span>
      <select><option>In progress</option><option>Earned</option><option>Expired</option></select>
    </label>
    <label class="ccredform__field ccredform__field--wide">
      <span>Notes</span>
      <textarea rows="3" autocomplete="off">Verify the snapshot restore before the freeze window.</textarea>
    </label>
  </div>
</form>`,
      },
      {
        name: 'Toggle', classes: '.ctoggle .is-on',
        note: 'role="switch" with track, thumb, and text state.',
        html: `<button type="button" class="ctoggle is-on" role="switch" aria-checked="true">
  <span class="ctoggle__track"><span class="ctoggle__thumb"></span></span>
  <span class="ctoggle__state">On every visit</span>
</button>
<button type="button" class="ctoggle" role="switch" aria-checked="false">
  <span class="ctoggle__track"><span class="ctoggle__thumb"></span></span>
  <span class="ctoggle__state">Off</span>
</button>`,
      },
    ],
  },
  {
    id: 'overlays', no: '08', title: 'Overlays',
    lede: 'Modals, palette, toast, and the rank-up plate — rendered inline here; in the app they float over a scrim. All are media plates.',
    specimens: [
      {
        name: 'Toast', classes: '.toast .visible / .toast--action',
        note: 'Transient confirmation; the action variant adds one button.',
        stage: 'column',
        html: `<div class="toast visible">Section marked as read.</div>
<div class="toast toast--action visible">
  <span class="toast__msg">Playbook deleted.</span>
  <button type="button" class="toast__action">Undo</button>
</div>`,
      },
      {
        name: 'Command palette', classes: '.cpalette .fbevel',
        note: 'Global search on "/" — input, cursor row, footer hints.',
        stage: 'column',
        html: `<div class="cpalette fbevel" role="dialog" aria-label="Search the console">
  <div class="cpalette__inputwrap">
    <span class="cpalette__icon" aria-hidden="true">${icon('search', 18)}</span>
    <input type="search" class="cpalette__input" placeholder="Search sections, terms, classes…" value="deploy">
    <kbd class="cpalette__esc">Esc</kbd>
  </div>
  <div class="cpalette__results" role="listbox">
    <button type="button" class="cpalette__row is-cursor" role="option">
      <span class="cpalette__rowicon">${icon('rocket', 18)}</span>
      <span class="cpalette__rowtext">
        <span class="cpalette__rowlabel">Deploy checklist</span>
        <span class="cpalette__rowsub">Playbooks · Release</span>
      </span>
      <span class="cpalette__rowkind">Playbook</span>
    </button>
    <button type="button" class="cpalette__row" role="option">
      <span class="cpalette__rowicon">${icon('atlas', 18)}</span>
      <span class="cpalette__rowtext">
        <span class="cpalette__rowlabel">Blue/green deploy</span>
        <span class="cpalette__rowsub">Intel · Glossary</span>
      </span>
      <span class="cpalette__rowkind">Term</span>
    </button>
  </div>
  <div class="cpalette__foot">
    <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
    <span><kbd>↵</kbd> go</span>
    <span><kbd>Esc</kbd> close</span>
  </div>
</div>`,
      },
      {
        name: 'Chapter reader', classes: '.creader .reader .reader--azure',
        note: 'Section-reader modal — kicker, progress, search, article, jump list.',
        stage: 'column',
        html: `<div class="creader reader reader--azure fbevel" role="dialog" aria-label="Chapter reader">
  <header class="creader__head">
    <div class="creader__heading">
      <span class="reader__kicker">${icon('layer-group', 13)} Incident response</span>
      <span class="creader__chprog">2/6 done</span>
    </div>
    <button type="button" class="creader__x" aria-label="Close reader">${icon('plus', 18)}</button>
  </header>
  <div class="creader__body">
    <div class="creader__nav">
      <button type="button" class="creader__step" aria-label="Previous section">${icon('caret-left', 14)}</button>
      <span class="creader__pos">Incident response · 1 / 6
        <span class="creader__posall">3 of 24 overall</span></span>
      <button type="button" class="creader__step" aria-label="Next section">${icon('caret-right', 14)}</button>
    </div>
    <article class="creader__sec">
      <span class="creader__tag">Fundamentals</span>
      <h3 class="creader__title">Declare early, declare loud</h3>
      <p class="creader__p">A vague "looking into it" costs more than a wrong severity call. Open the channel, name the incident commander, and start the clock.</p>
      <div class="creader__control">
        <button type="button" class="creader__toggle">
          <span class="creader__toggle-box">${icon('check', 15)}</span>
          <span>Mark as read</span>
        </button>
      </div>
    </article>
  </div>
</div>`,
      },
      {
        name: 'Rank-up plate', classes: '.rankup__plate',
        note: 'Game-unlock moment — bright gold on the dark plate, in both themes.',
        stage: 'column dark',
        html: `<div class="rankup__plate">
  <span class="rankup__kicker">Rank up</span>
  <span class="rankup__rule" aria-hidden="true"></span>
  <span class="rankup__name">Operator II</span>
  <span class="rankup__blurb">Two certifications logged. The advanced ladder is open.</span>
</div>`,
      },
      {
        name: 'Quick-menu wedge', classes: '.qm__wedge --up/--right/--down/--left',
        note: 'Hold-Esc radial menu — point, release to jump.',
        stage: 'dark',
        html: `<button type="button" class="qm__wedge qm__wedge--up">
  <span class="qm__glyph">${icon('book', 16)}</span>
  <span class="qm__label">Brief</span>
</button>
<button type="button" class="qm__wedge qm__wedge--right">
  <span class="qm__glyph">${icon('map', 16)}</span>
  <span class="qm__label">Flow</span>
</button>
<button type="button" class="qm__wedge qm__wedge--down">
  <span class="qm__glyph">${icon('user', 16)}</span>
  <span class="qm__label">Profile</span>
</button>
<button type="button" class="qm__wedge qm__wedge--left">
  <span class="qm__glyph">${icon('cog', 16)}</span>
  <span class="qm__label">System</span>
</button>`,
      },
    ],
  },
];

/* ── Renderers ─────────────────────────────────────────────── */

function tokenValue(varName) {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

function swatchGrid(group) {
  const chips = group.vars.map(v => {
    const val = tokenValue(v);
    return `<div class="libsw__chip" data-swatch="${v}">
      <div class="libsw__color" style="background:var(${v})"></div>
      <div class="libsw__meta">
        <div class="libsw__name">${v}</div>
        <div class="libsw__val">${esc(val)}</div>
      </div>
    </div>`;
  }).join('');
  return `<div class="spec">
    <div class="spec__head">
      <span class="spec__name">${group.name}</span>
      <span class="spec__note">${group.note}</span>
    </div>
    <div class="libsw">${chips}</div>
  </div>`;
}

function refreshSwatchValues() {
  document.querySelectorAll('[data-swatch]').forEach(chip => {
    chip.querySelector('.libsw__val').textContent = tokenValue(chip.dataset.swatch);
  });
}

function typeBlock() {
  const rows = TYPE_ROWS.map(r => `<div class="libtype__row">
    <span class="libtype__tag">${r.tag}</span>
    <span>${r.html}</span>
  </div>`).join('');
  return `<div class="spec">
    <div class="spec__head">
      <span class="spec__name">Typography</span>
      <span class="spec__note">Three roles: display for titles, body for copy, mono for labels and numerics.</span>
    </div>
    <div class="libtype">${rows}</div>
  </div>`;
}

function spacingBlock() {
  const bars = SPACE_VARS.map(v => `<div class="libspace__row">
    <span class="libspace__name">${v}</span>
    <span class="libspace__bar" style="width:var(${v})"></span>
    <span class="libspace__val" data-space="${v}">${tokenValue(v)}</span>
  </div>`).join('');
  const bevels = BEVEL_VARS.map(v => `<div class="libbevel">
    <div class="libbevel__box" style="--bevel:var(${v})"></div>
    <div class="libbevel__name">${v}</div>
  </div>`).join('');
  return `<div class="spec">
    <div class="spec__head">
      <span class="spec__name">Spacing & bevels</span>
      <span class="spec__note">4px spacing grid; faceted plates use --plate-poly with three bevel sizes.</span>
    </div>
    <div class="libspace">${bars}</div>
    <div style="height:var(--space-4)"></div>
    <div class="libbevels">${bevels}</div>
  </div>`;
}

function specBlock(spec) {
  const stageCls = ['spec__stage'];
  let darkStage = false;
  if (spec.stage) {
    if (spec.stage.includes('column')) stageCls.push('spec__stage--column');
    if (spec.stage.includes('dark')) darkStage = true;
  }
  if (darkStage) stageCls.push('spec__stage--dark');
  return `<div class="spec">
    <div class="spec__head">
      <span class="spec__name">${spec.name}</span>
      <span class="spec__note">${spec.note || ''}</span>
      <span class="spec__classes">${spec.classes || ''}</span>
    </div>
    <div class="${stageCls.join(' ')}">${spec.html}</div>
    <div class="spec__code">
      <pre><code>${esc(spec.html)}</code></pre>
      <button type="button" class="libcopy" data-copy>Copy</button>
    </div>
  </div>`;
}

function render() {
  const content = document.getElementById('libContent');
  const nav = document.getElementById('libNav');

  content.innerHTML = SECTIONS.map(sec => {
    let body = '';
    if (sec.kind === 'tokens') {
      body = TOKEN_GROUPS.map(swatchGrid).join('') + typeBlock() + spacingBlock();
    } else {
      body = sec.specimens.map(specBlock).join('');
    }
    return `<section class="libsec" id="lib-${sec.id}">
      <header class="libsec__head">
        <span class="libsec__no">// ${sec.no}</span>
        <h2 class="libsec__title">${sec.title}</h2>
        <p class="libsec__lede">${sec.lede}</p>
      </header>
      ${body}
    </section>`;
  }).join('');

  nav.innerHTML = SECTIONS.map(sec =>
    `<a href="#lib-${sec.id}" data-nav="${sec.id}"><span class="lib__navno">${sec.no}</span>${sec.title}</a>`
  ).join('');
}

/* Copy buttons — one delegated listener. */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-copy]');
  if (!btn) return;
  const code = btn.closest('.spec__code').querySelector('code').textContent;
  const done = () => {
    btn.textContent = 'Copied';
    btn.classList.add('is-copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-copied'); }, 1200);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(code).then(done).catch(() => {});
  }
});

/* Scroll-spy for the section rail. */
function initSpy() {
  const links = new Map(
    [...document.querySelectorAll('.lib__nav a')].map(a => [a.dataset.nav, a])
  );
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.classList.remove('is-active'));
      links.get(en.target.id.replace(/^lib-/, ''))?.classList.add('is-active');
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  SECTIONS.forEach(sec => {
    const el = document.getElementById(`lib-${sec.id}`);
    if (el) obs.observe(el);
  });
}

/* Swatch values re-solve when the theme flips. */
new MutationObserver(refreshSwatchValues)
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

render();
initSpy();
initTheme();
