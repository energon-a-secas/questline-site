// ── Sites catalog ────────────────────────────────────────────
// A curated list of external pages and tools maintained by teams across
// the company. Each entry carries a group, owning team, and context so
// people know why a page matters and when to reach for it.

/** Groups used to filter the catalog. */
export const SITE_GROUPS = [
  { id: 'all', label: 'All', description: 'Every useful page across teams.' },
  { id: 'product-design', label: 'Product & Design', description: 'Research, specs, design, and planning tools.' },
  { id: 'engineering', label: 'Engineering', description: 'Code, deployments, observability, and references.' },
  { id: 'operations', label: 'Operations', description: 'Communication, docs, on-call, and incident tooling.' },
  { id: 'content', label: 'Content & Media', description: 'Assets, media, and brand-friendly production helpers.' },
  { id: 'references', label: 'References', description: 'Indexes, docs, and curated external catalogs.' },
];

/** Curated sites. `accent` keys the stripe/glow; `icon` is a FA/ICONS name. */
export const SITES = [
  {
    id: 'figma',
    name: 'Figma',
    url: 'https://www.figma.com/',
    description: 'Design and prototype interfaces collaboratively in the browser.',
    group: 'product-design',
    team: 'Design',
    context: 'Use for wireframes, high-fidelity mocks, and design-system handoff before a spec is approved.',
    accent: '#f472b6',
    icon: 'layer-group',
    tags: ['design', 'prototyping', 'handoff'],
  },
  {
    id: 'notion',
    name: 'Notion',
    url: 'https://www.notion.so/',
    description: 'Team wiki, docs, and light databases that anyone can edit.',
    group: 'product-design',
    team: 'Product Ops',
    context: 'Use for product briefs, meeting notes, and team runbooks that need to evolve quickly.',
    accent: '#a78bfa',
    icon: 'book',
    tags: ['wiki', 'docs', 'planning'],
  },
  {
    id: 'excalidraw',
    name: 'Excalidraw',
    url: 'https://excalidraw.com/',
    description: 'Sketch diagrams and flows with a hand-drawn, approachable feel.',
    group: 'product-design',
    team: 'Product / Engineering',
    context: 'Use for architecture sketches, flow diagrams, and incident whiteboards that do not need a formal tool.',
    accent: '#f472b6',
    icon: 'sitemap',
    tags: ['whiteboard', 'diagrams', 'collab'],
  },
  {
    id: 'linear',
    name: 'Linear',
    url: 'https://linear.app/',
    description: 'Issue tracking built for fast-moving product and engineering teams.',
    group: 'product-design',
    team: 'Engineering / Product',
    context: 'Use to plan cycles, track bugs, and keep a clean, ranked backlog.',
    accent: '#818cf8',
    icon: 'kanban',
    tags: ['tracker', 'backlog', 'cycles'],
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/',
    description: 'Code hosting, review, and CI/CD pipelines in one place.',
    group: 'engineering',
    team: 'Platform',
    context: 'Use for repositories, pull requests, automated checks, and release workflows.',
    accent: '#38bdf8',
    icon: 'code',
    tags: ['code', 'repo', 'ci/cd'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    url: 'https://vercel.com/',
    description: 'Frontend deployments and live previews for every change.',
    group: 'engineering',
    team: 'Platform',
    context: 'Use to ship frontend previews for every pull request and host production sites.',
    accent: '#e2e8f0',
    icon: 'rocket',
    tags: ['deploy', 'hosting', 'preview'],
  },
  {
    id: 'datadog',
    name: 'Datadog',
    url: 'https://www.datadoghq.com/',
    description: 'Monitoring, logs, traces, and dashboards for production systems.',
    group: 'engineering',
    team: 'SRE',
    context: 'Use to watch production health, trace requests, and alert on SLOs after a deploy.',
    accent: '#a78bfa',
    icon: 'heart-pulse',
    tags: ['observability', 'metrics', 'alerts'],
  },
  {
    id: 'mdn',
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/',
    description: 'Authoritative reference for the web platform.',
    group: 'engineering',
    team: 'Engineering',
    context: 'Use to look up HTML, CSS, JS, and API behavior during implementation and review.',
    accent: '#4ade80',
    icon: 'book',
    tags: ['reference', 'docs', 'web'],
  },
  {
    id: 'slack',
    name: 'Slack',
    url: 'https://slack.com/',
    description: 'Team chat and real-time coordination.',
    group: 'operations',
    team: 'Operations',
    context: 'Use for async updates, quick questions, and incident war rooms.',
    accent: '#e879f9',
    icon: 'headset',
    tags: ['chat', 'comms', 'incidents'],
  },
  {
    id: 'confluence',
    name: 'Confluence',
    url: 'https://www.atlassian.com/software/confluence',
    description: 'Structured team documentation for decisions and runbooks.',
    group: 'operations',
    team: 'Operations',
    context: 'Use for persistent docs: RFCs, runbooks, postmortems, and decision records.',
    accent: '#38bdf8',
    icon: 'file-lines',
    tags: ['docs', 'runbooks', 'rfc'],
  },
  {
    id: 'pagerduty',
    name: 'PagerDuty',
    url: 'https://www.pagerduty.com/',
    description: 'On-call scheduling and incident paging.',
    group: 'operations',
    team: 'SRE',
    context: 'Use to schedule rotations, page responders, and manage the incident lifecycle.',
    accent: '#34d399',
    icon: 'pager',
    tags: ['on-call', 'incidents', 'paging'],
  },
  {
    id: 'canva',
    name: 'Canva',
    url: 'https://www.canva.com/',
    description: 'Social graphics, slide decks, and quick visual assets.',
    group: 'content',
    team: 'Marketing / Design',
    context: 'Use for slide decks, one-off graphics, and social assets when a designer is not available.',
    accent: '#34d399',
    icon: 'clone',
    tags: ['design', 'slides', 'social'],
  },
  {
    id: 'unsplash',
    name: 'Unsplash',
    url: 'https://unsplash.com/',
    description: 'Free high-resolution stock photos with clear licensing.',
    group: 'content',
    team: 'Content',
    context: 'Use for blog headers, slide backgrounds, and mock imagery.',
    accent: '#fbbf24',
    icon: 'eye',
    tags: ['photos', 'stock', 'assets'],
  },
  {
    id: 'loom',
    name: 'Loom',
    url: 'https://www.loom.com/',
    description: 'Async video messages and walkthroughs.',
    group: 'content',
    team: 'Product / Support',
    context: 'Use to record walkthroughs, bug reports, and demo updates without scheduling a meeting.',
    accent: '#818cf8',
    icon: 'star',
    tags: ['video', 'async', 'demos'],
  },
  {
    id: 'awesome-sites',
    name: 'Neorgon Awesome Sites',
    url: 'https://awesomesites.neorgon.com/',
    description: 'Curated catalog of useful external tools across the company.',
    group: 'references',
    team: 'Internal',
    context: 'Use to discover more tools reviewed and recommended by teams across Neorgon.',
    accent: '#22d3ee',
    icon: 'th-large',
    tags: ['catalog', 'tools', 'index'],
  },
];

/** Flat lookup by site id. */
export const SITES_BY_ID = Object.fromEntries(SITES.map(s => [s.id, s]));

/** Site ids that have a downloaded logo in assets/logos/{id}.svg. */
export const SITE_LOGOS = new Set(['figma','github','vercel','slack','confluence','canva']);

/**
 * Sites matching the active query (name, description, team, or tags) AND group.
 * `group` 'all' or omitted returns every group.
 */
export function siteMatches(query, group) {
  const q = (query || '').trim().toLowerCase();
  const g = group || 'all';
  return SITES.filter(s => {
    if (g !== 'all' && s.group !== g) return false;
    if (!q) return true;
    return s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.team.toLowerCase().includes(q) ||
      (s.tags || []).some(t => t.toLowerCase().includes(q));
  });
}
