// ── Issuer logos (stylized monograms / badges) ─────────────────
// Simple inline SVG glyphs for certification issuers. These are deliberately
// abstract, letter-based badges in the site's color palette so we avoid exact
// trademark reproduction while still giving each issuer a recognizable mark.
// All logos render at a small size (24–28 px), use currentColor, and sit on a
// transparent background so they can be tinted by CSS.

const AZURE = 'currentColor';
const GOLD = '#ffce4d';
const WHITE = '#f0f5ff';
const MUTED = '#8ca6c2';

/** Brand logos from @lobehub/icons-static-svg (proper brand marks). */
const LOBEHUB_LOGOS = {
  'amazon web services': 'assets/icons/lobehub/aws.svg',
  'microsoft': 'assets/icons/lobehub/microsoft.svg',
  'google cloud': 'assets/icons/lobehub/googlecloud.svg',
  'github': 'assets/icons/lobehub/github.svg',
};

/** Logo library keyed by issuer short code. */
export const LOGOS = {
  aws: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M5 18c3.5 2.5 10.5 2.5 18-1"/>
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M6 14c4 2.5 10 2.5 16-1"/>
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M7 10c4 2 9 2 14-1"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.5" d="M11 20l3 5 3-5"/>
  </svg>`,
  azure: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M4 20l10-16 10 16H4z"/>
    <path fill="${AZURE}" d="M13 14h3l-5 4 2-4z"/>
  </svg>`,
  gcp: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M14 2l12 7v10l-12 7L2 19V9l12-7z"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.4" d="M14 8v12M8 11l12 6"/>
  </svg>`,
  hashicorp: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="${AZURE}" stroke-width="1.5"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.6" d="M10 9v10M18 9v10M10 14h8"/>
  </svg>`,
  kubernetes: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="14" cy="14" r="6" fill="none" stroke="${AZURE}" stroke-width="1.4"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.3" d="M14 4v4M14 20v4M4 14h4M20 14h4M7 7l3 3M18 18l3 3M7 21l3-3M18 10l3-3"/>
  </svg>`,
  mongodb: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M14 3c2 4 4 9 4 13a4 4 0 0 1-8 0c0-4 2-9 4-13z"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.3" d="M14 7v11"/>
  </svg>`,
  oracle: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <ellipse cx="14" cy="14" rx="10" ry="6" fill="none" stroke="${AZURE}" stroke-width="1.5"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.4" d="M8 14h12"/>
  </svg>`,
  comptia: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M6 6h16v16H6z"/>
    <path fill="${WHITE}" d="M10 14h3v3h-3z"/>
    <path fill="none" stroke="${AZURE}" stroke-width="1.4" d="M15 11v6M18 11v6"/>
  </svg>`,
  offsec: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="14" cy="14" r="10" fill="none" stroke="${AZURE}" stroke-width="1.4"/>
    <circle cx="14" cy="14" r="3" fill="none" stroke="${WHITE}" stroke-width="1.4"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.3" d="M14 7v4M14 17v4M7 14h4M17 14h4"/>
  </svg>`,
  isc2: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M14 3l11 5v10l-11 5L3 18V8z"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.6" d="M10 11h2.5a2 2 0 0 1 0 4H10v-4zM15.5 11h3"/>
  </svg>`,
  github: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M14 3c6 0 9 4.5 9 9.5 0 4-2.5 7-6 8.5-.5.2-.5-.2-.5-.5v-2c0-.8-.3-1.3-.8-1.7 2.3-.3 4.3-.9 4.3-4.5 0-.9-.3-1.7-.8-2.3.1-.5.3-1.5-.1-2.4 0 0-.7-.2-2.1.8-.6-.2-1.3-.3-1.9-.3-.6 0-1.3.1-1.9.3-1.4-1-2.1-.8-2.1-.8-.4.9-.2 1.9-.1 2.4-.5.6-.8 1.4-.8 2.3 0 3.5 2 4.2 4.3 4.5-.3.3-.5.7-.6 1.4-.5.2-1.8.5-2.6-.6 0 0-.5-.8-1.4-.9 0 0-.9 0-.1.5 0 0 .6.3 1 1.4 0 0 .5 1.7 3 1.1v2c0 .3 0 .7-.5.5-3.5-1.5-6-4.5-6-8.5C5 7.5 8 3 14 3z"/>
  </svg>`,
  gitlab: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M14 4l3 8h7l-5.5 4 2 8L14 17l-6.5 7 2-8L4 12h7z"/>
  </svg>`,
  datadog: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <rect x="5" y="6" width="18" height="16" rx="2" fill="none" stroke="${AZURE}" stroke-width="1.5"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.4" d="M9 14h4M9 18h10"/>
    <circle cx="19" cy="10" r="1.5" fill="${GOLD}"/>
  </svg>`,
  databricks: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M14 3l11 6v10l-11 6L3 19V9z"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.3" d="M14 9l5.5 3v4L14 19l-5.5-3v-4z"/>
  </svg>`,
  dbt: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M8 6l6 4 6-4v12l-6 4-6-4z"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.4" d="M14 10v12"/>
  </svg>`,
  docker: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <rect x="5" y="11" width="18" height="9" rx="1.5" fill="none" stroke="${AZURE}" stroke-width="1.5"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.4" d="M7 15h3M12 15h3M17 15h3"/>
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M8 11V8h3v3M13 11V7h3v4"/>
  </svg>`,
  confluent: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M6 10h16M6 14h12M6 18h16"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.4" d="M20 7l3 3-3 3M8 21l-3-3 3-3"/>
  </svg>`,
  prometheus: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="14" cy="15" r="8" fill="none" stroke="${AZURE}" stroke-width="1.4"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.4" d="M14 7v5M11 18c.8-1.5 2.2-2 3-2s2.2.5 3 2"/>
  </svg>`,
  gremlin: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M14 3l5 5-5 5-5-5z"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.4" d="M14 13v10M10 19l4-3 4 3"/>
  </svg>`,
  enterprisedb: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${AZURE}" stroke-width="1.5" d="M8 6h12v16H8z"/>
    <path fill="none" stroke="${WHITE}" stroke-width="1.5" d="M11 11h6M11 15h6M11 19h4"/>
  </svg>`,
  recognition: `<svg viewBox="0 0 28 28" aria-hidden="true">
    <circle cx="14" cy="10" r="5" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
    <path fill="none" stroke="${GOLD}" stroke-width="1.4" d="M10 16l-2 8 6-3 6 3-2-8"/>
  </svg>`,
};

/** Issuer-name → short code normalization map (lower-cased lookup). */
const ISSUER_CODES = {
  'amazon web services': 'aws',
  'microsoft': 'azure',
  'google cloud': 'gcp',
  'hashicorp': 'hashicorp',
  'the linux foundation / cncf': 'kubernetes',
  'linux foundation / cncf': 'kubernetes',
  'cncf': 'kubernetes',
  'mongodb': 'mongodb',
  'oracle': 'oracle',
  'comptia': 'comptia',
  'offsec': 'offsec',
  'offensive security': 'offsec',
  'isc2': 'isc2',
  '(isc)²': 'isc2',
  'github': 'github',
  'gitlab': 'gitlab',
  'datadog': 'datadog',
  'databricks': 'databricks',
  'dbt labs': 'dbt',
  'dbt': 'dbt',
  'confluent': 'confluent',
  'docker': 'docker',
  'prometheus': 'prometheus',
  'gremlin': 'gremlin',
  'enterprisedb': 'enterprisedb',
  'enterprise db': 'enterprisedb',
  'recognition': 'recognition',
};

/**
 * Return a short issuer code like "aws" from a full issuer name.
 * Falls back to a slug derived from the name.
 */
export function issuerCode(issuer) {
  const key = (issuer || '').toLowerCase().trim();
  return ISSUER_CODES[key] || key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

/**
 * Return the inline SVG logo for an issuer, or a fallback shield/award glyph
 * when no match exists. Brand logos from @lobehub/icons-static-svg are used
 * when available; otherwise the stylized monogram set takes over.
 */
export function issuerLogo(issuer) {
  const key = (issuer || '').toLowerCase().trim();
  const lobehub = LOBEHUB_LOGOS[key];
  if (lobehub) {
    return `<img src="${lobehub}" alt="" class="ccert__logo" loading="lazy">`;
  }
  const code = issuerCode(issuer);
  return LOGOS[code] || `<svg viewBox="0 0 28 28" aria-hidden="true">
    <path fill="none" stroke="${MUTED}" stroke-width="1.5" d="M14 3l10 4v8c0 6-4.5 10-10 11-5.5-1-10-5-10-11V7z"/>
  </svg>`;
}
