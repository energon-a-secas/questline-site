// ── Profile tab ──────────────────────────────────────────────
// An RPG-style character sheet for an engineer. Pick a class (Infra/Platform,
// SRE/DevOps, Security/Data, Backend/Fullstack), then walk its certification
// ladder — Entry, Intermediate, Advanced, Referent — logging credential IDs,
// issuers, and dates against each cert. State persists locally (state.js) in a
// shape that maps 1:1 to a future Convex `profiles` row.

import { CLASSES, CLASS_BY_ID, CRED_STATUSES } from './data.js';
import { state, overallPercent, rankFor, profileSelectFromHash } from './state.js';
import { escHtml } from './utils.js';
import { icon, screenTitle, shell } from './console.js';
import { issuerLogo } from './logos.js';

/** Max classes a player can run at once. */
const MAX_CLASSES = 2;

/** Tier initial lookup, used for the small rung badge. */
const TIER_INITIAL = { Entry: 'E', Intermediate: 'I', Advanced: 'A', Referent: 'R' };

/** Count earned and required certs for one rung. */
function rungProgress(s, rung) {
  const required = rung.required || rung.certs.length;
  const earned = rung.certs.filter(c => s.profile.creds[c.id]?.status === 'earned').length;
  return { earned, required, complete: earned >= required };
}

/** Class progress based on completed rungs (each tier has a required count). */
function classProgress(s, cls) {
  const rungs = cls.rungs.map(r => rungProgress(s, r));
  const earned = rungs.reduce((a, r) => a + r.earned, 0);
  const required = rungs.reduce((a, r) => a + r.required, 0);
  const completedRungs = rungs.filter(r => r.complete).length;
  return { earned, required, completedRungs, totalRungs: rungs.length };
}

export function renderProfile(s) {
  const ids = s.profile.classIds || [];
  // s.ui.classSelecting is the render source of truth; it is synced from the
  // hash (#profile/select) on load and navigation, and toggled by the
  // Confirm/Change controls. A player with no class is always in select mode.
  const selecting = s.ui.classSelecting || ids.length === 0;
  return selecting ? renderClassSelect(s) : renderClassSheets(s);
}

/** The dedicated class-select screen: character-creation style crest grid. */
function renderClassSelect(s) {
  const ids = s.profile.classIds || [];
  const hasClasses = ids.length > 0;
  const n = ids.length;
  const cards = CLASSES.map(c => classCrestCard(s, c, ids.includes(c.id))).join('');
  const confirmDisabled = n === 0;
  const body = `
    ${screenTitle('Profile', 'Choose your class')}
    <div class="cprofile cprofile--select">
      <section class="cpanel cclass-select">
        <h3 class="cpanel__h">Select your class</h3>
        <p class="cclass-select__lead">Pick up to two engineer classes. Each opens a certification
          ladder: Entry → Intermediate → Advanced → Referent. You can change this anytime.</p>
        <div class="cclass-grid">${cards}</div>
        <div class="cclass-actions">
          <span class="cclass-actions__count" aria-live="polite">${n} / ${MAX_CLASSES} selected</span>
          <div class="cclass-actions__btns">
            ${hasClasses ? `<a class="btn btn--ghost btn--sm" href="#profile" data-class-cancel>Cancel</a>` : ''}
            <a class="btn btn--primary btn--sm ${confirmDisabled ? 'is-disabled' : ''}"
               href="#profile" data-class-confirm
               ${confirmDisabled ? 'aria-disabled="true" tabindex="-1"' : ''}>
              Confirm ${n === 1 ? 'class' : 'classes'}
            </a>
          </div>
        </div>
      </section>
    </div>`;
  return shell('profile', body,
    confirmDisabled ? 'Select at least one class to continue.' : 'Confirm to open your certification ladder.',
    [{ k: '↵', v: 'Confirm' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]);
}

/** The confirmed view: candidate level + chosen class sheet(s) + Change control. */
function renderClassSheets(s) {
  const ids = s.profile.classIds || [];
  const rank = rankFor(overallPercent(s));
  const showSheets = s.prefs.showClassSheets !== false;
  const body = `
    ${screenTitle('Profile', 'Class & Certifications')}
    <div class="cprofile">
      ${candidateLevel(rank)}
      <div class="cprofile__changebar">
        <span class="cprofile__changelabel">${ids.length === 1 ? 'Your class' : 'Your classes'}</span>
        <a class="btn btn--ghost btn--sm" href="#profile/select" data-class-change>${icon('cog', 14)} Change classes</a>
      </div>
      ${showSheets ? ids.map(id => classSheet(s, CLASS_BY_ID[id])).join('') : classPrompt(true, showSheets)}
    </div>`;
  const hints = showSheets
    ? [{ k: 'Tab', v: 'Fields' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]
    : [{ k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }];
  const foot = showSheets
    ? 'Log your credential IDs against each certification.'
    : 'Certification ladders are hidden. Enable them in System.';
  return shell('profile', body, foot, hints);
}

/** Candidate level banner derived from overall quest completion. */
function candidateLevel(rank) {
  return `
    <div class="cprofile__level">
      <span class="cprofile__level-label">Candidate Level</span>
      <span class="cprofile__level-name">${escHtml(rank.name)}</span>
      <span class="cprofile__level-pips" aria-hidden="true">${'●'.repeat(rank.level)}${'○'.repeat(5 - rank.level)}</span>
    </div>`;
}

/** Render a 48–56 px faceted class crest plate with symbol and accent color. */
function classCrest(cls, size = 56) {
  const { symbol, color } = cls.crest || { symbol: '?', color: '#8ca6c2' };
  return `
    <span class="cclass__crest" style="--crest-color:${escHtml(color)};--crest-size:${size}px" aria-hidden="true">
      <span class="cclass__crest-symbol">${escHtml(symbol)}</span>
    </span>`;
}

/**
 * One large faceted crest plate for the class-select grid. Toggles selection
 * via the existing data-class handler (which enforces the max-2 cap and
 * persists live). When the cap is reached, unselected cards are marked full so
 * the picker can announce the block instead of silently ignoring the tap.
 */
function classCrestCard(s, c, active) {
  const ids = s.profile.classIds || [];
  const atCap = ids.length >= MAX_CLASSES && !active;
  const { completedRungs, totalRungs } = classProgress(s, c);
  const crestColor = (c.crest && c.crest.color) || '#8ca6c2';
  return `
    <button type="button" class="cclass-card ${active ? 'is-active' : ''} ${atCap ? 'is-full' : ''}"
      data-class="${c.id}" style="--crest-color:${escHtml(crestColor)}"
      aria-pressed="${active}">
      <span class="cclass-card__pick" aria-hidden="true">${active ? icon('check', 14) : ''}</span>
      ${classCrest(c, 72)}
      <span class="cclass-card__title">${escHtml(c.title)}</span>
      <span class="cclass-card__tagline">${escHtml(c.tagline)}</span>
      <span class="cclass-card__count">${completedRungs}/${totalRungs} tiers</span>
    </button>`;
}

/** Shown before a class is chosen, or when ladders are hidden via System. */
function classPrompt(hasClasses, showSheets) {
  if (hasClasses && !showSheets) {
    return `
      <section class="cpanel cprofile__empty">
        <span class="cprofile__crest" aria-hidden="true">
          <span class="cprofile__crest-symbol cprofile__crest-icon">${icon('eye-slash', 40)}</span>
        </span>
        <p class="clead"><strong>Certification ladders are hidden.</strong> Your class
        choices are still saved; turn on <em>Certification ladders</em> in
        System to reveal them again.</p>
        <p class="cprofile__emptycta">Enable them in System to continue logging certs.</p>
      </section>`;
  }
  return `
    <section class="cpanel cprofile__empty">
      <span class="cprofile__crest" aria-hidden="true">
        <span class="cprofile__crest-symbol cprofile__crest-icon">${icon('layer-group', 40)}</span>
      </span>
      <p class="clead"><strong>Choose an engineer class</strong> to reveal its certification
      ladder. You can pick up to two classes, and each ladder runs
      Entry → Intermediate → Advanced → Referent.</p>
      <p class="cprofile__emptycta">Select a class card above to begin.</p>
    </section>`;
}

/** The full character sheet for one chosen class: blurb + the cert ladder. */
function classSheet(s, cls) {
  const { completedRungs, totalRungs } = classProgress(s, cls);
  const pct = totalRungs ? Math.round((completedRungs / totalRungs) * 100) : 0;
  const rungs = cls.rungs.map((r, i) => rungBlock(s, cls, r, i)).join('');
  return `
    <section class="cpanel">
      <div class="cprofile__head">
        ${classCrest(cls, 64)}
        <div class="cprofile__heading">
          <h3 class="cdetail__title">${escHtml(cls.title)}</h3>
          <p class="cdetail__summary">${escHtml(cls.blurb)}</p>
        </div>
        <button type="button" class="crules-btn" data-ladder-rules="${escHtml(cls.id)}"
          title="How the ladder works" aria-label="How the ${escHtml(cls.title)} ladder works">
          ${icon('circle-info', 18)}
        </button>
      </div>
      <div class="branch-progress">
        <div class="branch-progress__bar"><div style="--pct:${pct / 100}"></div></div>
        <span class="branch-progress__count">${completedRungs}/${totalRungs} tiers</span>
      </div>
      <div class="cladder-rungs">${rungs}</div>
    </section>`;
}

/** A small faceted badge with the tier initial, colored by the tier accent. */
function tierBadge(rung) {
  const initial = TIER_INITIAL[rung.tier] || rung.tier[0];
  return `
    <span class="crung__badge" aria-hidden="true" data-tier="${rung.tier.toLowerCase()}">
      ${escHtml(initial)}
    </span>`;
}

/** One ladder rung: the tier label, a blurb, and its certifications. */
function rungBlock(s, cls, rung, i) {
  const tierNo = String(i + 1).padStart(2, '0');
  const { earned, required, complete } = rungProgress(s, rung);
  const certs = rung.certs.map(c => certRow(s, c)).join('');
  return `
    <div class="crung crung--${rung.tier.toLowerCase()} ${complete ? 'is-complete' : ''}">
      <div class="crung__head">
        <span class="crung__no">${tierNo}</span>
        ${tierBadge(rung)}
        <span class="crung__tier">${escHtml(rung.tier)}</span>
        <span class="crung__blurb">${escHtml(rung.blurb)}</span>
        <span class="crung__meta">${earned}/${required} earned${complete ? ' · tier complete' : ''}</span>
      </div>
      <div class="ccerts">${certs}</div>
    </div>`;
}

/** A 28 px faceted issuer badge for the left of a cert row. */
function certBadge(cert) {
  return `
    <span class="ccert__badge" aria-hidden="true" title="${escHtml(cert.issuer)}">
      ${issuerLogo(cert.issuer)}
    </span>`;
}

/** Faceted checkbox-style status glyph: check / dash / X / empty. */
function statusGlyph(status) {
  if (status === 'earned') return icon('check', 14);
  if (status === 'in-progress') return `<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M3 7h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  if (status === 'expired') return `<svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><path d="M4 4l6 6M10 4l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  return '';
}

/** Issuer name, optionally linked to the cert's official page, plus its group chip. */
function certIssuer(cert) {
  const issuer = !cert.url
    ? `<span class="ccert__issuer">${escHtml(cert.issuer)}</span>`
    : `<a class="ccert__issuer ccert__issuer--link" href="${escHtml(cert.url)}" target="_blank" rel="noopener noreferrer"
        title="Open ${escHtml(cert.name)} exam page">
        ${escHtml(cert.issuer)} ${icon('external', 10)}
      </a>`;
  return `
    <span class="ccert__issuerline">
      ${issuer}
      <span class="ccert__group">${escHtml(cert.group || '')}</span>
    </span>`;
}

/** A single certification row: badge, name, issuer, status glyph, and edit toggle
 *  that expands the credential form (id + issuer + dates + status). */
function certRow(s, cert) {
  const rec = s.profile.creds[cert.id];
  const status = rec?.status || null;
  const statusLabel = CRED_STATUSES.find(st => st.id === status)?.label || 'Not logged';
  const open = s.ui.credEditing === cert.id;
  return `
    <div class="ccert ccert--${status || 'none'} ${open ? 'is-editing' : ''}" data-cert-row="${cert.id}">
      <div class="ccert__info">
        ${certBadge(cert)}
        <span class="ccert__status-glyph" aria-hidden="true">${statusGlyph(status)}</span>
        <span class="ccert__text">
          <span class="ccert__name">${escHtml(cert.name)}</span>
          ${certIssuer(cert)}
        </span>
        <span class="ccert__status">${escHtml(statusLabel)}</span>
        ${rec?.id ? `<span class="ccert__credid" title="Credential ID">${escHtml(rec.id)}</span>` : ''}
      </div>
      <button type="button" class="ccert__edit" data-cred-edit="${cert.id}"
        aria-expanded="${open}" aria-label="Edit credential for ${escHtml(cert.name)}">
        ${icon('pencil', 14)}
      </button>
      ${open ? credForm(cert, rec) : ''}
    </div>`;
}

/** The inline credential form for one cert (id, issuer, dates, status). */
function credForm(cert, rec) {
  const r = rec || {};
  const statusOpts = CRED_STATUSES.map(st =>
    `<option value="${st.id}" ${r.status === st.id ? 'selected' : ''}>${escHtml(st.label)}</option>`).join('');
  return `
    <form class="ccredform" data-cred-form="${cert.id}">
      <div class="ccredform__grid">
        <label class="ccredform__field ccredform__field--wide">
          <span>Credential ID</span>
          <input type="text" name="id" value="${escHtml(r.id || '')}"
            placeholder="e.g. ABCD-1234-EFGH" autocomplete="off">
        </label>
        <label class="ccredform__field">
          <span>Issuer</span>
          <input type="text" name="issuer" value="${escHtml(r.issuer || cert.issuer)}"
            placeholder="Issuing body" autocomplete="off">
        </label>
        <label class="ccredform__field">
          <span>Status</span>
          <select name="status">${statusOpts}</select>
        </label>
        <label class="ccredform__field">
          <span>Issued</span>
          <input type="date" name="issued" value="${escHtml(r.issued || '')}">
        </label>
        <label class="ccredform__field">
          <span>Expires</span>
          <input type="date" name="expires" value="${escHtml(r.expires || '')}">
        </label>
      </div>
      <div class="ccredform__actions">
        ${rec ? `<button type="button" class="clink-danger" data-cred-clear="${cert.id}">Remove</button>` : '<span></span>'}
        <div class="ccredform__btns">
          <button type="button" class="btn btn--ghost btn--sm" data-cred-cancel="${cert.id}">Cancel</button>
          <button type="submit" class="btn btn--primary btn--sm">Save credential</button>
        </div>
      </div>
    </form>`;
}
