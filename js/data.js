// ── Content model ────────────────────────────────────────────
// The operating model expressed as a skill tree. Each BRANCH is a
// node in the tree (a trunk skill). Each branch holds NODES — the
// small "skills" you complete to clear the branch. Branches unlock
// when all their `prereq` branches are complete.
//
// Content is intentionally generic: any team can map its own
// roadmap and prioritization operating model onto this shape.

/** Inline icon paths (24x24, stroke). Keyed by name. */
export const ICONS = {
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  rocket: '<path d="M5 15c-1 1-1.5 3.5-1.5 5.5 2 0 4.5-.5 5.5-1.5"/><path d="M9 11a8 8 0 0 1 8-8c1 0 2 .2 2 .2s.2 1 .2 2a8 8 0 0 1-8 8l-3 1-1-1z"/><circle cx="14.5" cy="8.5" r="1.5"/>',
  cycle: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>',
  kanban: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v12M15 3v8"/>',
  flag: '<path d="M5 21V4M5 4c3-2 7 2 14 0v9c-7 2-11-2-14 0"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  // Tab-bar glyphs
  brief: '<path d="M4 5h16M4 10h16M4 15h10"/><circle cx="19" cy="16" r="3"/>',
  tree: '<circle cx="12" cy="5" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M12 7.5v4M12 11.5l-5 4M12 11.5l5 4"/>',
  rank: '<path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.5L12 21l-5-2.9 1-5.5-4-3.9 5.5-.8z"/>',
  intel: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  bag: '<path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/>',
  // Stacked boxes — the ranked backlog as crates of work (lucide "boxes").
  boxes: '<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85M7 16.5l5-3M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3M17 16.5l4.74-2.85M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0Z"/><path d="M12 8 7.26 5.15M12 8l4.74-2.85M12 13.5V8"/>',
  // Easter egg — a little kiwi bird tucked away in System.
  kiwi: '<path d="M13.5 6.5a6.5 6.5 0 1 0 2.4 12.54"/><path d="M13.5 6.5c2.5 0 4.5 1.7 4.5 4 0 1.9-1.4 3.2-3.2 3.7"/><path d="M7.2 11 2 8.8"/><circle cx="15" cy="10.2" r=".9" fill="currentColor" stroke="none"/><path d="M10.5 19.3V21M14.5 18.8v2.4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
};

/** Rank ladder, mapped to overall completion percentage. */
export const RANKS = [
  { at: 0,   name: 'Recruit',   blurb: 'Just arrived. Start at Foundations.' },
  { at: 20,  name: 'Initiate',  blurb: 'You know why the model exists.' },
  { at: 45,  name: 'Operator',  blurb: 'You can define and prioritize work.' },
  { at: 70,  name: 'Strategist', blurb: 'You run the cadence and the backlog.' },
  { at: 100, name: 'Architect', blurb: 'Full clear. You can onboard others.' },
];

/**
 * Branches form the tree. `tier` is the row (0 = root). `prereq`
 * lists branch ids that must be complete before this one unlocks.
 */
export const BRANCHES = [
  {
    id: 'foundations',
    title: 'Foundations',
    icon: 'atlas',
    tier: 0,
    prereq: [],
    tagline: 'Why the model exists',
    summary: 'The shift in how work is chosen, shaped, and shipped. Start here.',
    nodes: [
      { id: 'f-problem', title: 'The problem', tag: 'Context',
        body: 'Most teams have no consistent way to show what work matters most or how it connects to outcomes.' },
      { id: 'f-change', title: 'What changes', tag: 'Direction',
        body: 'A shared way of working: specs for features, one ranked backlog, continuous delivery, and a steady cadence of reviews.' },
      { id: 'f-primer', title: 'This is a primer', tag: 'Scope',
        body: 'A map of the model, not the full manual. Detailed workflows and field definitions layer in over time.' },
    ],
  },
  {
    id: 'define',
    title: 'Define the Work',
    icon: 'clipboard-check',
    tier: 1,
    prereq: ['foundations'],
    tagline: 'Specs, owners, inputs',
    summary: 'Every feature starts with a clear spec, a named owner, and strong planning inputs.',
    nodes: [
      { id: 'd-spec', title: 'Spec first', tag: 'Shift 01',
        body: 'Every new feature starts with a spec: why it matters, what success looks like, sequencing, dependencies, tradeoffs.' },
      { id: 'd-dri', title: 'Name a DRI', tag: 'Ownership',
        body: 'A directly responsible individual drives each spec from inception through launch, and proves the value delivered.' },
      { id: 'd-inputs', title: 'Planning inputs', tag: 'Shift 03',
        list: ['Impact', 'Estimation', 'Resourcing', 'Dependencies', 'Success criteria', 'Sequencing', 'Tradeoffs', 'Risks', 'Decision points'] },
      { id: 'd-quality', title: 'Quality bar', tag: 'Gate',
        body: 'Specs must be well written and outcome oriented, and clear the quality bar before feature work starts.' },
    ],
  },
  {
    id: 'prioritize',
    title: 'Prioritize',
    icon: 'layer-group',
    tier: 1,
    prereq: ['foundations'],
    tagline: 'One ranked backlog',
    summary: 'Initiatives ranked 1:N, deliverables mapped to specs and grouped into priority bands.',
    nodes: [
      { id: 'p-levels', title: 'Two levels', tag: 'Shift 04',
        body: 'Initiatives are the big buckets, ranked 1:N across the org. Deliverables map 1:1 to specs for all feature work.' },
      { id: 'p-rank', title: 'Org rank is primary', tag: 'Rule',
        body: 'The org-wide rank wins. Fleet and squad stack ranks are secondary views of the same list.' },
      { id: 'p-bands', title: 'Priority bands', tag: 'Scheme',
        list: ['Active — progress or due dates this cycle', 'Backlog — important, not yet pulled forward'] },
      { id: 'p-stop', title: 'Stop and delay', tag: 'Discipline',
        body: 'Keep ranks current. Name the work to stop, delay, or deprioritize so the top of the list stays honest.' },
    ],
  },
  {
    id: 'deliver',
    title: 'Ship & Inspect',
    icon: 'code-branch',
    tier: 2,
    prereq: ['define'],
    tagline: 'Continuous delivery',
    summary: 'Demo on a regular cadence and ship value incrementally, not in one end-of-cycle launch.',
    nodes: [
      { id: 's-cadence', title: 'Demo cadence', tag: 'Shift 02',
        body: 'Teams demo work on a regular cadence so progress is visible and feedback lands early.' },
      { id: 's-incremental', title: 'Ship continuously', tag: 'Practice',
        body: 'Deliver value across the cycle instead of holding it for a single launch. This keeps work transparent and lowers risk.' },
      { id: 's-visible', title: 'Stay against priorities', tag: 'Outcome',
        body: 'Continuous shipping keeps the team delivering against the most important priorities, week over week.' },
    ],
  },
  {
    id: 'ceremonies',
    title: 'Ceremonies',
    icon: 'clock',
    tier: 2,
    prereq: ['prioritize'],
    tagline: 'The recurring forums',
    summary: 'A consistent set of recurring forums that create visibility and keep priorities moving.',
    nodes: [
      { id: 'c-demos', title: 'Roadmap demos', tag: 'Forum',
        body: 'Progress and work-in-flight visibility for everyone tracking the roadmap.' },
      { id: 'c-intake', title: 'Intake & prioritization', tag: 'Forum',
        body: 'What moves forward and what does not. The decision point for the backlog.' },
      { id: 'c-deps', title: 'Dependency tracing', tag: 'Forum',
        body: 'Blockers, cross-team needs, and decisions surfaced before they stall delivery.' },
      { id: 'c-review', title: 'Spec review', tag: 'Forum',
        body: 'Alignment and approval before a spec is slotted into the plan.' },
    ],
  },
  {
    id: 'execute',
    title: 'Track & Estimate',
    icon: 'columns',
    tier: 3,
    prereq: ['deliver', 'ceremonies'],
    tagline: 'Tracker, points, traceability',
    summary: 'Track execution in your tracker with estimates and clear links between specs and delivery.',
    nodes: [
      { id: 'e-tracker', title: 'Track in the tracker', tag: 'Shift 05',
        body: 'Teams that build software track work in the tracker with clear epics and traceability between deliverables, specs, and execution.' },
      { id: 'e-points', title: 'Estimate in points', tag: 'Estimation',
        body: 'Use story points on a Fibonacci scale so capacity and forecasts stay comparable across teams.' },
      { id: 'e-continuous', title: 'Prioritize continuously', tag: 'Shift 06',
        body: 'Regular backlog reviews are the north star, building on quarterly planning. Make conscious trade-offs every cycle.' },
    ],
  },
  {
    id: 'milestones',
    title: 'Milestones',
    icon: 'flag',
    tier: 4,
    prereq: ['execute'],
    tagline: 'What to do, and when',
    summary: 'The key dates that anchor a planning cycle, and the move to make right now.',
    nodes: [
      { id: 'm-specs', title: 'Specs ready', tag: 'Gate 1',
        body: 'All specs for the cycle are submitted and clear the quality bar, ready for leadership review.' },
      { id: 'm-roadmap', title: 'Roadmap priorities ready', tag: 'Gate 2',
        body: 'Initiatives and deliverables your team commits to, with due dates, estimates, milestones, and a clear top-priorities view.' },
      { id: 'm-lock', title: 'Plan locked', tag: 'Gate 3',
        body: 'Everything finalized and locked in the system of record for the cycle.' },
      { id: 'm-now', title: 'Start now', tag: 'Action',
        body: 'Surface candidate deliverables that may move forward, and flag dependencies or resourcing needs early.' },
    ],
  },
];

/** Flat lookup by branch id. */
export const BRANCH_BY_ID = Object.fromEntries(BRANCHES.map(b => [b.id, b]));

/** Total node count across all branches (the XP pool). */
export const TOTAL_NODES = BRANCHES.reduce((n, b) => n + b.nodes.length, 0);

// ── Console (NieR-style game interface) ────────────────────

/** Top tab bar. `view` is the hash route; 'flow' jumps to the flowchart.
 *  `hint` is a plain-language gloss for the game-styled label, surfaced as the
 *  tab's tooltip and screen-reader name so "Intel" reads as "the glossary". */
export const TABS = [
  { id: 'brief',    label: 'Brief',    icon: 'book',        hint: 'Overview' },
  { id: 'chapters', label: 'Chapters', icon: 'layer-group', hint: 'Onboarding path' },
  { id: 'priority', label: 'Priority', icon: 'chart-bar',   hint: 'Ranked backlog' },
  { id: 'intel',    label: 'Intel',    icon: 'atlas',       hint: 'Field glossary' },
  { id: 'flow',     label: 'Flow',     icon: 'code-branch', hint: 'Chapter map' },
  { id: 'system',   label: 'System',   icon: 'cog',         hint: 'Save and settings' },
];

/** The six key shifts, shown on the Brief tab. */
export const SHIFTS = [
  { no: '01', title: 'Specs for feature work',
    body: 'Every new feature starts with a spec: why it matters, what success looks like, sequencing, dependencies, and tradeoffs. A named owner drives it from inception to launch.' },
  { no: '02', title: 'Ship continuously',
    body: 'Demo on a regular cadence and deliver value across the cycle, instead of holding everything for one end-of-cycle launch.' },
  { no: '03', title: 'Stronger planning inputs',
    body: 'Each body of work carries impact, estimation, resourcing, dependencies, success criteria, sequencing, tradeoffs, risks, and decision points.' },
  { no: '04', title: 'One ranked backlog',
    body: 'Initiatives are stack ranked 1:N across the org. Deliverables map 1:1 to specs. The org-wide rank is primary; team ranks are secondary.' },
  { no: '05', title: 'Track and estimate',
    body: 'Teams that build software track execution in the tracker with story points and clear traceability between deliverables, specs, and work.' },
  { no: '06', title: 'Prioritize continuously',
    body: 'Regular backlog reviews are the north star. Make conscious trade-offs every cycle so the team always works on the most important things.' },
];

/** Priority bands for the Priority tab. */
export const BANDS = [
  { id: 'active',  label: 'Active',  range: 'P1 – P10',
    blurb: 'Expected progress or due dates this cycle.', tone: 'active' },
  { id: 'backlog', label: 'Backlog', range: 'P20 – P40+',
    blurb: 'Important, but not yet pulled forward.', tone: 'backlog' },
];

/** Illustrative initiative stack rank. */
export const INITIATIVES = [
  { rank: 1, title: 'Critical user journeys', note: 'Define and validate the journeys that matter most across all surfaces.' },
  { rank: 2, title: 'Peak-event readiness', note: 'Capacity, resilience, and forecast-to-service for the highest-traffic moment.' },
  { rank: 3, title: 'One-click rollback', note: 'A fast, safe revert path operators can trigger during incidents.' },
  { rank: 4, title: '…', note: 'Continues 1:N across the whole org.' },
];

/** Ceremonies, reused on Brief + Intel. */
export const CEREMONIES = [
  { title: 'Roadmap demos', body: 'Progress and work-in-flight visibility.' },
  { title: 'Intake & prioritization', body: 'What moves forward and what does not.' },
  { title: 'Dependency tracing', body: 'Blockers, cross-team needs, and decisions.' },
  { title: 'Spec review', body: 'Alignment and approval before a spec is slotted.' },
];

/** Glossary terms for the Intel tab (master/detail). `see` cross-links
 *  by id; `chapter` points to the branch where the term is learned. */
export const INTEL = [
  { id: 'spec', term: 'Spec', kind: 'Artifact', chapter: 'define',
    body: 'The document that opens every feature. States why the work matters, what success looks like, how it sequences, what it depends on, and the tradeoffs taken. No spec, no feature work.',
    aliases: ['specs'], see: ['owner', 'deliverable'] },
  { id: 'owner', term: 'Owner (DRI)', kind: 'Role', chapter: 'define',
    body: 'The directly responsible individual for a body of work. Drives the spec from inception through launch and proves the value delivered. One owner per spec.',
    aliases: ['DRI', 'directly responsible individual'], see: ['spec'] },
  { id: 'initiative', term: 'Initiative', kind: 'Level', chapter: 'prioritize',
    body: 'A large bucket of work, stack ranked 1:N across the org. Initiatives are the primary unit of prioritization. Deliverables roll up to them.',
    aliases: ['initiatives'], see: ['deliverable', 'band'] },
  { id: 'deliverable', term: 'Deliverable', kind: 'Level', chapter: 'prioritize',
    body: 'A shippable unit that maps 1:1 to a spec. Deliverables are grouped into priority bands and tracked through to execution.',
    aliases: ['deliverables'], see: ['spec', 'initiative', 'band'] },
  { id: 'band', term: 'Priority band', kind: 'Concept', chapter: 'prioritize',
    body: 'A grouping of deliverables by urgency. Active bands carry progress or due dates this cycle. Backlog bands are important but not yet pulled forward.',
    aliases: ['priority bands'], see: ['deliverable', 'initiative'] },
  { id: 'cadence', term: 'Cadence', kind: 'Rhythm', chapter: 'deliver',
    body: 'The regular beat of demos and reviews. Work is shown and inspected on a fixed interval so progress stays visible and feedback lands early.',
    see: ['ceremony'] },
  { id: 'points', term: 'Story points', kind: 'Estimation', chapter: 'execute',
    body: 'A relative estimate on a Fibonacci scale. Keeps capacity and forecasts comparable across teams without pretending to be exact hours.',
    aliases: ['Fibonacci'], see: ['deliverable'] },
  { id: 'ceremony', term: 'Ceremony', kind: 'Forum', chapter: 'ceremonies',
    body: 'A recurring forum that creates visibility and keeps priorities moving: roadmap demos, intake and prioritization, dependency tracing, and spec review.',
    aliases: ['ceremonies'], see: ['cadence'] },
];

/** Flat lookup by intel term id. */
export const INTEL_BY_ID = Object.fromEntries(INTEL.map(t => [t.id, t]));

/**
 * Featured banners for the home (Brief) screen news board, in the spirit of a
 * game's event banners. One large hero shows at a time and rotates slowly;
 * clicking it opens the full detail in the focused reading popup. `accent`
 * keys the frame and glow color (azure | gold | violet). `image` is an
 * optional hero background (a path under assets/); when absent, a layered
 * gradient stands in. `sections` are the reading-popup body blocks.
 */
export const BANNERS = [
  {
    id: 'q4-planning',
    accent: 'azure',
    icon: 'rss-square',
    image: 'assets/banner-q4-planning.svg',
    kicker: 'Now live',
    title: 'Q4 planning starts now',
    blurb: 'Specs due, roadmap priorities next. Here is what to do this week.',
    date: 'Specs due Jun 12',
    cta: 'Read the brief',
    sections: [
      { heading: 'What is happening',
        body: 'Quarterly planning is open. Surface candidate deliverables now and shape the specs that will carry feature work, so the top of the backlog reflects what matters most.' },
      { heading: 'Two dates that anchor the cycle',
        body: 'Specs ready by Jun 12: every spec is submitted and clears the quality bar, ready for leadership review. Roadmap priorities ready by Jun 26: the initiatives and deliverables your team commits to, with due dates, estimates, and a clear top-priorities view.' },
      { heading: 'Your move this week',
        body: 'Identify the deliverables that may move forward, name a directly responsible individual for each spec, and flag dependencies or resourcing needs early. Open the Chapters tab to onboard step by step.' },
    ],
  },
  {
    id: 'roadmap-review',
    accent: 'gold',
    icon: 'flag',
    image: 'assets/banner-roadmap-review.svg',
    kicker: 'Milestone',
    title: 'Fleet roadmap review',
    blurb: 'Commit your initiatives and deliverables, with dates and estimates.',
    date: 'Ready Jun 26',
    cta: 'See what is needed',
    sections: [
      { heading: 'The milestone',
        body: 'By Jun 26 your fleet roadmap lists the initiatives and deliverables your team commits to for the cycle, each with due dates, estimates, milestones, and a clear view of the top priorities for the next eight to twelve weeks.' },
      { heading: 'What reviewers look for',
        body: 'A backlog that is honestly ranked, deliverables mapped one to one with specs, and conscious calls on what to stop, delay, or deprioritize. The org-wide rank is primary; fleet and squad ranks are secondary views of the same list.' },
      { heading: 'Before the review',
        body: 'Keep ranks current, trace dependencies across teams, and make sure every committed deliverable has an estimate and a clear owner. Then the review is a confirmation, not a scramble.' },
    ],
  },
  {
    id: 'whats-changing',
    accent: 'violet',
    icon: 'atlas',
    image: 'assets/banner-whats-changing.svg',
    kicker: 'Orientation',
    title: 'What is changing, in brief',
    blurb: 'Six shifts move us to one ranked backlog and continuous delivery.',
    date: 'Read in two minutes',
    cta: 'Read the six shifts',
    reader: 'shifts',
    sections: [],
  },
];

/** Flat lookup by banner id. */
export const BANNERS_BY_ID = Object.fromEntries(BANNERS.map(b => [b.id, b]));

/** Intel terms taught by a given chapter (branch) id. */
export function intelForChapter(branchId) {
  return INTEL.filter(t => t.chapter === branchId);
}
