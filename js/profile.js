// ── Profile tab ──────────────────────────────────────────────
// An RPG-style character sheet for an engineer. Pick a class (Infra/Platform,
// SRE/DevOps, Security/Data, Backend/Fullstack), then walk its certification
// ladder — Entry, Intermediate, Advanced, Referent — logging credential IDs,
// issuers, and dates against each cert. State persists locally (state.js) in a
// shape that maps 1:1 to a future Convex `profiles` row.

import { CLASSES, CLASS_BY_ID, CRED_STATUSES } from './data.js';
import { state } from './state.js';
import { escHtml } from './utils.js';
import { icon, screenTitle, shell } from './console.js';
import { issuerLogo } from './logos.js';

/** Tier initial lookup, used for the small rung badge. */
const TIER_INITIAL = { Entry: 'E', Intermediate: 'I', Advanced: 'A', Referent: 'R' };

/** Count earned credentials across a class's ladder, for the progress stat. */
function classProgress(s, cls) {
  let total = 0, earned = 0;
  cls.rungs.forEach(r => r.certs.forEach(c => {
    total += 1;
    if (s.profile.creds[c.id]?.status === 'earned') earned += 1;
  }));
  return { earned, total };
}

export function renderProfile(s) {
  const cls = CLASS_BY_ID[s.profile.classId];
  const body = `
    ${screenTitle('Profile', 'Class & Certifications')}
    <div class="cprofile">
      ${classPicker(s)}
      ${cls ? classSheet(s, cls) : classPrompt()}
    </div>`;
  const hints = cls
    ? [{ k: 'Tab', v: 'Fields' }, { k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }]
    : [{ k: 'Q/E', v: 'Tabs' }, { k: 'Esc', v: 'Menu' }];
  return shell('profile', body,
    cls ? 'Log your credential IDs against each certification.' : 'Choose a class to see its certification ladder.',
    hints);
}

/** Render a 48–56 px faceted class crest plate with symbol and accent color. */
function classCrest(cls, size = 56) {
  const { symbol, color } = cls.crest || { symbol: '?', color: '#8ca6c2' };
  return `
    <span class="cclass__crest" style="--crest-color:${escHtml(color)};--crest-size:${size}px" aria-hidden="true">
      <span class="cclass__crest-symbol">${escHtml(symbol)}</span>
    </span>`;
}

/** The class selector: a row of faceted cards, one per engineer class. */
function classPicker(s) {
  const cards = CLASSES.map(c => {
    const active = c.id === s.profile.classId;
    const { earned, total } = classProgress(s, c);
    return `
      <button type="button" class="cclass ${active ? 'is-active' : ''}" data-class="${c.id}"
        aria-pressed="${active}">
        ${classCrest(c, 52)}
        <span class="cclass__main">
          <span class="cclass__title">${escHtml(c.title)}</span>
          <span class="cclass__tagline">${escHtml(c.tagline)}</span>
        </span>
        <span class="cclass__count">${earned}/${total}</span>
      </button>`;
  }).join('');
  return `
    <section class="cpanel">
      <h3 class="cpanel__h">Choose your class</h3>
      <div class="cclasses">${cards}</div>
    </section>`;
}

/** Shown before a class is chosen. */
function classPrompt() {
  return `
    <section class="cpanel cprofile__empty">
      <span class="cprofile__crest" aria-hidden="true">
        <span class="cprofile__crest-symbol">?</span>
      </span>
      <p class="clead"><strong>Choose an engineer class</strong> to reveal its certification
      ladder. Each ladder runs Entry → Intermediate → Advanced → Referent, and
      you can log a credential ID against any certification you hold.</p>
      <p class="cprofile__emptycta">Select a class card above to begin.</p>
    </section>`;
}

/** The full character sheet for the chosen class: blurb + the cert ladder. */
function classSheet(s, cls) {
  const { earned, total } = classProgress(s, cls);
  const pct = total ? Math.round((earned / total) * 100) : 0;
  const rungs = cls.rungs.map((r, i) => rungBlock(s, cls, r, i)).join('');
  return `
    <section class="cpanel">
      <div class="cprofile__head">
        ${classCrest(cls, 64)}
        <div class="cprofile__heading">
          <h3 class="cdetail__title">${escHtml(cls.title)}</h3>
          <p class="cdetail__summary">${escHtml(cls.blurb)}</p>
        </div>
      </div>
      <div class="branch-progress">
        <div class="branch-progress__bar"><div style="transform:scaleX(${pct / 100})"></div></div>
        <span class="branch-progress__count">${earned}/${total} earned</span>
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
  const certs = rung.certs.map(c => certRow(s, c)).join('');
  return `
    <div class="crung crung--${rung.tier.toLowerCase()}">
      <div class="crung__head">
        <span class="crung__no">${tierNo}</span>
        ${tierBadge(rung)}
        <span class="crung__tier">${escHtml(rung.tier)}</span>
        <span class="crung__blurb">${escHtml(rung.blurb)}</span>
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

/** Issuer name, optionally linked to the cert's official page. */
function certIssuer(cert) {
  if (!cert.url) return `<span class="ccert__issuer">${escHtml(cert.issuer)}</span>`;
  return `
    <a class="ccert__issuer ccert__issuer--link" href="${escHtml(cert.url)}" target="_blank" rel="noopener noreferrer"
      title="Open ${escHtml(cert.name)} exam page">
      ${escHtml(cert.issuer)} ${icon('external', 10)}
    </a>`;
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
