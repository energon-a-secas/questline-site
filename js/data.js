// ── Content model ────────────────────────────────────────────
// The operating model expressed as a skill tree. Each BRANCH is a
// node in the tree (a trunk skill). Each branch holds NODES — the
// small "skills" you complete to clear the branch. Branches unlock
// when all their `prereq` branches are complete.
//
// Content is intentionally generic: any team can map its own
// roadmap and prioritization operating model onto this shape.

import { SITE_GROUPS, SITES, SITES_BY_ID, SITE_LOGOS, siteMatches } from './sites.js';
export { SITE_GROUPS, SITES, SITES_BY_ID, SITE_LOGOS, siteMatches };

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
  // Profile / class glyphs
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2.3"/><path d="M4.6 17c.6-1.9 1.9-3 3.4-3s2.8 1.1 3.4 3"/><path d="M14 9.5h5M14 13h5M14 16h3"/>',
  'heart-pulse': '<path d="M20.8 6.6a4.6 4.6 0 0 0-7.8-2.3L12 5.3l-1-1a4.6 4.6 0 0 0-7.8 4.3"/><path d="M2 13h5l1.5-3 2.5 6 2-4 1.2 2.4H22"/>',
  'shield-halved': '<path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/><path d="M12 3v20"/>',
  server: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><path d="M7 7.5h.01M7 16.5h.01"/>',
  // Playbook / banner glyphs
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.5"/>',
  sitemap: '<path d="M3 18h6v-5H6V9h12v4h-3v5h6"/><path d="M12 3v6"/>',
  map: '<path d="M3 7l6-2 6 3 6-2v13l-6 2-6-3-6 2z"/><path d="M9 5v13M15 8v13"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  'compass-drafting': '<path d="M12 3v6"/><path d="M10 8.5l-5 11M14 8.5l5 11"/><circle cx="12" cy="6" r="2"/>',
  'flag-checkered': '<path d="M5 21V4c4-2 8 2 14 0v9c-6 2-10-2-14 0"/><path d="M5 8.5h14M9 4.4v9M13 5v9"/>',
  award: '<circle cx="12" cy="9" r="5"/><path d="M9 13.5L7.5 21l4.5-2.5L16.5 21 15 13.5"/>',
  'file-lines': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
  'triangle-exclamation': '<path d="M12 3l9.5 16.5H2.5z"/><path d="M12 9v5M12 17h.01"/>',
  pager: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 14h6"/><path d="M16.5 10.5h.01"/>',
  // Editor controls
  plus: '<path d="M12 5v14M5 12h14"/>',
  pencil: '<path d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17z"/><path d="M14.5 7.5l2 2"/>',
  trash: '<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
  external: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/>',
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
 *
 * This is the engineering-onboarding "field manual": a generic, educational
 * walk through how a new engineer gets productive — foundations, planning,
 * prioritization, building, shipping, tracking, and growth. It is deliberately
 * company-neutral (no internal names or sensitive process), so it reads as a
 * universal primer any team can hand a newcomer.
 */
export const BRANCHES = [
  {
    id: 'foundations',
    title: 'Foundations',
    icon: 'atlas',
    tier: 0,
    prereq: [],
    tagline: 'Get your bearings',
    summary: 'What good looks like for a new engineer, and the habits the rest of the manual builds on.',
    nodes: [
      { id: 'f-mindset', title: 'Default to learning', tag: 'Mindset',
        body: 'Your first weeks are for reading code, asking questions, and writing things down. Curiosity beats output early, nobody expects a new hire to ship on day one.' },
      { id: 'f-setup', title: 'Set up your environment', tag: 'Practice',
        body: 'Clone the repos, run the bootstrap script, and get the project building and the tests passing locally before anything else. A green local build is your foundation.' },
      { id: 'f-map', title: 'Map the system', tag: 'Context',
        list: ['Which services exist and what they own', 'How requests flow end to end', 'Where the data lives', 'Who owns what', 'Where the docs and runbooks are'] },
      { id: 'f-help', title: 'Ask well', tag: 'Habit',
        body: 'Ask in the open, share what you already tried, and timebox solo struggle to ~30 minutes before reaching out. Good questions make you faster and teach the team where the docs fall short.' },
    ],
  },
  {
    id: 'plan',
    title: 'How We Plan Work',
    icon: 'clipboard-check',
    tier: 1,
    prereq: ['foundations'],
    tagline: 'From idea to a clear spec',
    summary: 'Work starts as a written intent: a short spec with a goal, an owner, and the inputs that make it real.',
    nodes: [
      { id: 'pl-spec', title: 'Write it down first', tag: 'Spec',
        body: 'Before building, capture why the work matters, what success looks like, and what is explicitly out of scope. A short written spec aligns people far cheaper than a half-built feature does.' },
      { id: 'pl-owner', title: 'Name an owner', tag: 'Ownership',
        body: 'Every piece of work has one person accountable for driving it from idea to done. Owning something does not mean doing it all alone. It means making sure it lands.' },
      { id: 'pl-inputs', title: 'Gather planning inputs', tag: 'Inputs',
        list: ['Impact and success criteria', 'Rough estimate', 'Dependencies', 'Sequencing', 'Tradeoffs', 'Risks and open questions'] },
      { id: 'pl-review', title: 'Review before you commit', tag: 'Gate',
        body: 'Share the draft with a senior engineer for a gut-check. Reviews early catch flawed assumptions while they are still cheap to change.' },
    ],
  },
  {
    id: 'prioritize',
    title: 'Prioritize & Scope',
    icon: 'layer-group',
    tier: 1,
    prereq: ['foundations'],
    tagline: 'Decide what matters most',
    summary: 'One ranked list, scoped to a realistic capacity, with the courage to say what you are not doing.',
    nodes: [
      { id: 'pr-onelist', title: 'One ranked list', tag: 'Rule',
        body: 'Keep a single, ordered backlog rather than many parallel "urgent" piles. If everything is a priority, nothing is. The order is the decision.' },
      { id: 'pr-impact', title: 'Rank by impact vs effort', tag: 'Method',
        body: 'Weigh the value a piece of work delivers against the effort it takes. High-impact, low-effort work rises to the top; large bets need a clearer case.' },
      { id: 'pr-bands', title: 'Active vs backlog', tag: 'Scheme',
        list: ['Active: being worked or due this cycle', 'Backlog: important, but not pulled forward yet'] },
      { id: 'pr-cut', title: 'Name what to cut', tag: 'Discipline',
        body: 'Scoping is mostly subtraction. State out loud what you are delaying or dropping so the top of the list stays honest and capacity stays real.' },
    ],
  },
  {
    id: 'build',
    title: 'Build & Review',
    icon: 'code-branch',
    tier: 2,
    prereq: ['plan'],
    tagline: 'Write code others can trust',
    summary: 'Small changes, behind branches and pull requests, reviewed by peers and guarded by tests.',
    nodes: [
      { id: 'b-small', title: 'Keep changes small', tag: 'Practice',
        body: 'Small, focused pull requests are easier to review, safer to ship, and quicker to revert. Break big work into a sequence of shippable steps.' },
      { id: 'b-pr', title: 'Open a clear PR', tag: 'Workflow',
        body: 'Branch, commit with intent, and open a pull request that explains what changed and why. Fill in the template and tag the right reviewers.' },
      { id: 'b-review', title: 'Review with care', tag: 'Culture',
        body: 'Code review spreads knowledge and catches bugs. Feedback is about the code, not the person, give it kindly and receive it openly.' },
      { id: 'b-tests', title: 'Let tests do the guarding', tag: 'Quality',
        body: 'Automated tests are how a team moves fast without breaking things. Add tests with your change so the next person can refactor it without fear.' },
    ],
  },
  {
    id: 'operate',
    title: 'Ship & Operate',
    icon: 'rocket',
    tier: 2,
    prereq: ['prioritize'],
    tagline: 'Get it live, keep it healthy',
    summary: 'Deploy often through a pipeline, watch what you ship, and know how to respond when it breaks.',
    nodes: [
      { id: 'op-cicd', title: 'Ship through the pipeline', tag: 'Delivery',
        body: 'CI/CD builds, tests, and promotes your change automatically. Deploy small and often, frequent, boring releases are far safer than rare, dramatic ones.' },
      { id: 'op-observe', title: 'Watch what you ship', tag: 'Operate',
        body: 'After a deploy, check dashboards, logs, and error rates. Software is not done when it merges. It is done when it behaves in production.' },
      { id: 'op-oncall', title: 'Be ready to respond', tag: 'Reliability',
        body: 'Know how to roll back, where the runbooks are, and how to declare an incident. Stabilize first, diagnose second, and write a blameless postmortem after.' },
    ],
  },
  {
    id: 'track',
    title: 'Track & Estimate',
    icon: 'columns',
    tier: 3,
    prereq: ['build', 'operate'],
    tagline: 'Make progress visible',
    summary: 'Track work where the team can see it, estimate honestly, and reprioritize as you learn.',
    nodes: [
      { id: 't-tracker', title: 'Track work in the open', tag: 'Visibility',
        body: 'Keep work items in the shared tracker with clear status. Visible progress builds trust and surfaces blockers before they become surprises.' },
      { id: 't-estimate', title: 'Estimate to compare, not to promise', tag: 'Estimation',
        body: 'Relative estimates (like story points) make capacity and forecasts comparable without pretending to be exact hours. Estimates are a planning tool, not a contract.' },
      { id: 't-reprioritize', title: 'Reprioritize as you learn', tag: 'Cadence',
        body: 'Plans are guesses that improve with evidence. Review the backlog regularly and adjust. The goal is always working on the most important thing right now.' },
    ],
  },
  {
    id: 'grow',
    title: 'Grow & Level Up',
    icon: 'flag',
    tier: 4,
    prereq: ['track'],
    tagline: 'Where you go from here',
    summary: 'Turn from someone who is onboarded into someone who multiplies the team, pick a direction and invest.',
    nodes: [
      { id: 'g-feedback', title: 'Seek feedback early', tag: 'Growth',
        body: 'Do not wait for review season. Ask your lead and peers what to keep doing and what to change, frequent, specific feedback compounds faster than annual scores.' },
      { id: 'g-direction', title: 'Choose a direction', tag: 'Path',
        body: 'Engineers grow along tracks: infrastructure, reliability, security, backend, and more. Open the Profile tab to see classes and the certification ladders that map each path.' },
      { id: 'g-certs', title: 'Back it with credentials', tag: 'Investment',
        body: 'Certifications are a structured way to deepen and prove a skill. Pick ones that match your chosen direction and log them in your Profile to track the climb.' },
      { id: 'g-multiply', title: 'Multiply the team', tag: 'Impact',
        body: 'The highest-leverage work is rarely just your own code: write the doc, review the PR, mentor the next new hire, and leave the system better than you found it.' },
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
  { id: 'brief',     label: 'Brief',     icon: 'book',        hint: 'Overview' },
  { id: 'chapters',  label: 'Chapters',  icon: 'layer-group', hint: 'Onboarding path' },
  { id: 'playbooks', label: 'Playbooks', icon: 'route',       hint: 'Step-by-step workflows' },
  { id: 'priority',  label: 'Priority',  icon: 'chart-bar',   hint: 'Ranked backlog' },
  { id: 'intel',     label: 'Intel',     icon: 'atlas',       hint: 'Field glossary' },
  { id: 'sites',     label: 'Sites',     icon: 'th-large',    hint: 'Useful pages from other teams' },
  { id: 'atlas',     label: 'Atlas',     icon: 'map',         hint: 'Team topology map' },
  { id: 'profile',   label: 'Profile',   icon: 'idcard',      hint: 'Class and certifications' },
  { id: 'flow',      label: 'Flow',      icon: 'code-branch', hint: 'Chapter map' },
  { id: 'system',    label: 'System',    icon: 'cog',         hint: 'Save and settings' },
];

/** Glossary scopes for the Intel tab filter (All + term scopes). */
export const INTEL_SCOPES = [
  { id: 'all',       label: 'All' },
  { id: 'basic',     label: 'Basics' },
  { id: 'company',   label: 'Company' },
  { id: 'operating', label: 'Operating Model' },
  { id: 'product',   label: 'Product' },
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

/** Operating-model glossary terms (scope 'operating'). `see` cross-links
 *  by id; `chapter` points to the branch where the term is learned. These are
 *  merged with the basic dictionary and company jargon below into INTEL. */
const OPERATING_TERMS = [
  { id: 'spec', term: 'Spec', kind: 'Artifact', chapter: 'plan',
    body: 'The document that opens every feature. States why the work matters, what success looks like, how it sequences, what it depends on, and the tradeoffs taken. No spec, no feature work.',
    aliases: ['specs'], see: ['owner', 'deliverable'] },
  { id: 'owner', term: 'Owner (DRI)', kind: 'Role', chapter: 'plan',
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
  { id: 'cadence', term: 'Cadence', kind: 'Rhythm', chapter: 'operate',
    body: 'The regular beat of demos and reviews. Work is shown and inspected on a fixed interval so progress stays visible and feedback lands early.',
    see: ['ceremony'] },
  { id: 'points', term: 'Story points', kind: 'Estimation', chapter: 'track',
    body: 'A relative estimate on a Fibonacci scale. Keeps capacity and forecasts comparable across teams without pretending to be exact hours.',
    aliases: ['Fibonacci'], see: ['deliverable'] },
  { id: 'ceremony', term: 'Ceremony', kind: 'Forum', chapter: 'track',
    body: 'A recurring forum that creates visibility and keeps priorities moving: roadmap demos, intake and prioritization, dependency tracing, and spec review.',
    aliases: ['ceremonies'], see: ['cadence'] },
].map(t => ({ ...t, scope: 'operating' }));

/** Basic dictionary — universal industry terms for newcomers (scope 'basic'). */
const BASIC_TERMS = [
  { id: 'quarter', term: 'Quarter', kind: 'Time', scope: 'basic',
    body: 'A three-month block of the business calendar, written Q1 through Q4. Companies plan goals, budgets, and deadlines around quarters because a year is too long to track and a month is too short to ship anything meaningful. When someone says "let us tackle that next quarter," they mean the next 3-month window.',
    aliases: ['Q1', 'Q2', 'Q3', 'Q4'], see: ['fiscal-year', 'okr', 'roadmap'] },
  { id: 'fiscal-year', term: 'Fiscal Year', kind: 'Time', scope: 'basic',
    body: 'The 12-month period a company uses for accounting and budgeting, often abbreviated FY. It does not have to match the calendar year, many companies run a fiscal year that starts in February or July. Knowing the fiscal year matters because budgets reset and targets are measured against it.',
    aliases: ['FY'], see: ['quarter', 'kpi'] },
  { id: 'sprint', term: 'Sprint', kind: 'Time', scope: 'basic',
    body: 'A short, fixed time box: usually one or two weeks, during which a team commits to finishing a set chunk of work. At the start the team picks items from the backlog; at the end they review what shipped. Sprints create a steady, predictable rhythm instead of one giant open-ended push.',
    aliases: ['sprints', 'iteration'], see: ['backlog', 'project'] },
  { id: 'project', term: 'Project', kind: 'Concept', scope: 'basic',
    body: 'A temporary effort with a clear goal, a start, and an end, for example "launch the new checkout page." Projects are how larger goals get broken into something a team can actually plan and deliver. Once the goal is met, the project closes; ongoing upkeep becomes regular operations.',
    aliases: ['projects'], see: ['product', 'roadmap', 'stakeholder'] },
  { id: 'product', term: 'Product', kind: 'Concept', scope: 'basic',
    body: 'Something a company builds and offers to users or customers on an ongoing basis, like an app, a website, or a platform. Unlike a project, a product is never truly "done". It keeps evolving with new features and fixes. Teams are often organized around the products they own.',
    aliases: ['products'], see: ['service', 'mvp', 'roadmap'] },
  { id: 'service', term: 'Service', kind: 'Concept', scope: 'basic',
    body: 'A running program that does a specific job and answers requests from other programs, usually over a network. For example, a "payments service" handles charging cards so the rest of the system does not have to. In engineering it most often means a deployed, always-on piece of software.',
    aliases: ['services'], see: ['microservice', 'api', 'sla'] },
  { id: 'component', term: 'Component', kind: 'Concept', scope: 'basic',
    body: 'A self-contained, reusable building block of a larger system, think of it like a Lego brick. A button on a website, a login form, or a small module of code can all be components. Breaking software into components makes it easier to build, test, and reuse without rewriting the same thing twice.',
    aliases: ['components'], see: ['microservice', 'monolith', 'repository'] },
  { id: 'microservice', term: 'Microservice', kind: 'Concept', scope: 'basic',
    body: 'A small, independent service that does one focused job and talks to other services over a network. Instead of one giant program, a system is split into many small ones that can be built, deployed, and scaled separately. The trade-off is more moving parts to coordinate and monitor.',
    aliases: ['microservices'], see: ['monolith', 'service', 'api'] },
  { id: 'monolith', term: 'Monolith', kind: 'Concept', scope: 'basic',
    body: 'An application built as one single, large codebase where all the features live and deploy together. Monoliths are simpler to start with and easy to reason about early on, but they can get harder to change as they grow. The opposite approach is splitting things into microservices.',
    aliases: ['monolithic'], see: ['microservice', 'component', 'deployment'] },
  { id: 'api', term: 'API', kind: 'Concept', scope: 'basic',
    body: 'Short for Application Programming Interface: a defined set of rules that lets two pieces of software talk to each other. Think of it as a menu in a restaurant. You ask for what is listed and get back a predictable result, without needing to know how the kitchen works. Almost every app you use is quietly calling APIs behind the scenes.',
    aliases: ['APIs', 'endpoint'], see: ['service', 'microservice', 'repository'] },
  { id: 'repository', term: 'Repository', kind: 'Tool', scope: 'basic',
    body: 'A storage location for a project’s code, usually managed with a version-control tool like Git. It keeps the full history of every change so you can see who changed what and roll back if needed. People shorten it to "repo," as in "push your code to the repo."',
    aliases: ['repo', 'repos'], see: ['pull-request', 'code-review', 'cicd'] },
  { id: 'environment', term: 'Environment', kind: 'Concept', scope: 'basic',
    body: 'A separate copy of the system where code runs, each with a purpose: dev (where developers experiment), staging (a production-like rehearsal space for testing), and prod/production (the live version real users touch). Keeping them separate means you can break things safely before they reach customers. "It works in staging but not prod" is a classic engineering headache.',
    aliases: ['env', 'dev', 'staging', 'prod', 'production'], see: ['deployment', 'release', 'rollback'] },
  { id: 'deployment', term: 'Deployment', kind: 'Concept', scope: 'basic',
    body: 'The act of taking code and putting it onto an environment so it actually runs there. "Deploying to production" means pushing your changes out to where real users will see them. Modern teams deploy frequently and automatically rather than in rare, risky big-bang events.',
    aliases: ['deploy', 'deploys'], see: ['release', 'rollback', 'cicd'] },
  { id: 'release', term: 'Release', kind: 'Concept', scope: 'basic',
    body: 'A specific, packaged version of software made available to users, often given a version number like v2.1. A release bundles up a set of changes into one labeled milestone. It is related to deployment but more about the "what" (this version, these features) than the "how" (the act of shipping it).',
    aliases: ['releases', 'version'], see: ['deployment', 'rollback', 'mvp'] },
  { id: 'rollback', term: 'Rollback', kind: 'Concept', scope: 'basic',
    body: 'Reverting a system back to a previous working version after a new change causes problems. If a deployment breaks something, rolling back quickly restores the last good state while the team investigates. It is the software equivalent of hitting "undo" in an emergency.',
    aliases: ['roll back', 'revert'], see: ['deployment', 'release', 'incident'] },
  { id: 'incident', term: 'Incident', kind: 'Concept', scope: 'basic',
    body: 'An unplanned event that disrupts a service or degrades it for users, like an outage or a feature suddenly failing. Teams declare an incident to coordinate a fast, focused response, often with assigned roles. Afterward they usually write a postmortem to learn what happened and prevent a repeat.',
    aliases: ['incidents', 'outage'], see: ['rollback', 'sla', 'slo'] },
  { id: 'sla', term: 'SLA', kind: 'Metric', scope: 'basic',
    body: 'Service Level Agreement: a formal promise to customers about how reliable or fast a service will be, such as "99.9% uptime." SLAs often carry consequences (like refunds) if they are missed, which is why they are taken seriously. It is the external, contractual cousin of the internal SLO.',
    aliases: ['SLAs'], see: ['slo', 'incident', 'kpi'] },
  { id: 'slo', term: 'SLO', kind: 'Metric', scope: 'basic',
    body: 'Service Level Objective: an internal target a team sets for how well a service should perform, like "requests should respond in under 300ms 99% of the time." SLOs are the goals teams steer by day to day, usually set a bit stricter than the customer-facing SLA. Missing them is a signal to invest in reliability before it becomes a customer problem.',
    aliases: ['SLOs'], see: ['sla', 'kpi', 'incident'] },
  { id: 'kpi', term: 'KPI', kind: 'Metric', scope: 'basic',
    body: 'Key Performance Indicator: a measurable number a team watches to judge how well something is doing, like signups per week or error rate. Good KPIs are specific and tied to a goal so progress is obvious. They answer the question "are we actually winning?"',
    aliases: ['KPIs', 'metric'], see: ['okr', 'slo', 'roadmap'] },
  { id: 'okr', term: 'OKR', kind: 'Concept', scope: 'basic',
    body: 'Objectives and Key Results: a goal-setting framework where you state an ambitious Objective ("delight new users") plus a few measurable Key Results that prove you got there ("cut signup time to under 30 seconds"). It keeps teams aligned on what matters and how success will be measured. OKRs are usually set each quarter.',
    aliases: ['OKRs'], see: ['kpi', 'quarter', 'roadmap'] },
  { id: 'stakeholder', term: 'Stakeholder', kind: 'Role', scope: 'basic',
    body: 'Anyone who has an interest in or is affected by a project. A manager, a customer, another team, or leadership. Stakeholders care about the outcome even if they are not writing the code. Identifying them early helps you gather the right input and avoid surprises later.',
    aliases: ['stakeholders'], see: ['project', 'roadmap'] },
  { id: 'roadmap', term: 'Roadmap', kind: 'Artifact', scope: 'basic',
    body: 'A high-level plan showing what a team intends to build and roughly when, usually spanning several quarters. It communicates priorities and direction without committing to exact dates for everything. Think of it as a route, not a guarantee. It changes as you learn.',
    aliases: ['roadmaps'], see: ['backlog', 'okr', 'quarter'] },
  { id: 'backlog', term: 'Backlog', kind: 'Artifact', scope: 'basic',
    body: 'A prioritized list of work that has not been done yet, features, bugs, and tasks waiting their turn. The most important items sit at the top and get pulled into upcoming sprints. A healthy backlog is regularly groomed so it reflects current priorities rather than an endless dumping ground.',
    aliases: ['backlogs'], see: ['sprint', 'roadmap', 'mvp'] },
  { id: 'mvp', term: 'MVP', kind: 'Concept', scope: 'basic',
    body: 'Minimum Viable Product: the smallest version of an idea that still delivers real value and can be put in front of users. The goal is to learn fast and validate the idea before investing heavily in the full thing. "Let us ship an MVP first" means start lean, then improve based on feedback.',
    aliases: ['MVPs'], see: ['product', 'release', 'technical-debt'] },
  { id: 'technical-debt', term: 'Technical Debt', kind: 'Concept', scope: 'basic',
    body: 'The future cost of choosing a quick or easy solution now instead of a better one that takes longer. Like financial debt, it accrues "interest", shortcuts make the code harder to change until someone pays it down by cleaning up. Some debt is a smart trade-off to ship fast; too much grinds a team to a halt.',
    aliases: ['tech debt'], see: ['code-review', 'mvp', 'monolith'] },
  { id: 'code-review', term: 'Code Review', kind: 'Concept', scope: 'basic',
    body: 'The practice of having other engineers read your code changes before they merge in. Reviewers catch bugs, suggest improvements, and spread knowledge across the team. It is a normal, expected part of the workflow, feedback is about the code, not about you.',
    aliases: ['review', 'CR'], see: ['pull-request', 'repository', 'cicd'] },
  { id: 'pull-request', term: 'Pull Request', kind: 'Artifact', scope: 'basic',
    body: 'A proposal to merge your code changes into the main codebase, abbreviated PR (or MR, "merge request," on some platforms). It bundles your changes for others to review, comment on, and approve before they go in. PRs are where code review and automated checks happen.',
    aliases: ['PR', 'PRs', 'MR', 'merge request'], see: ['code-review', 'repository', 'cicd'] },
  { id: 'cicd', term: 'CI/CD', kind: 'Tool', scope: 'basic',
    body: 'Continuous Integration and Continuous Delivery/Deployment: automation that builds, tests, and ships code every time changes are pushed. CI runs your tests automatically so problems are caught early; CD takes passing code and moves it toward production with little manual effort. Together they let teams release small changes safely and often.',
    aliases: ['CI', 'CD', 'pipeline'], see: ['deployment', 'pull-request', 'code-review'] },
];

/** Company jargon — fictional internal terms for the demo (scope 'company'). */
const COMPANY_TERMS = [
  { id: 'launchpad', term: 'LaunchPad', kind: 'Tool', scope: 'company',
    body: 'Our fictional internal deployment platform. The one-button console engineers use to ship a service to any environment. It wraps the CI/CD pipeline, environment config, and rollback controls behind a single dashboard. "Just push it through LaunchPad" is how most deploys start here. (Dummy term for this demo.)',
    aliases: ['LP', 'the Pad'], see: ['deployment', 'cicd', 'rollback'] },
  { id: 'glyph', term: 'GLYPH', kind: 'Artifact', scope: 'company',
    body: 'Our made-up ticketing convention: every work item gets a GLYPH tag (e.g. GLYPH-4821) that threads it from backlog to release. The acronym jokingly stands for "Get Logged, Yield Progress Here." If a change is not tied to a GLYPH, it did not officially happen. (Dummy term for this demo.)',
    aliases: ['glyphs', 'GLYPH ticket'], see: ['backlog', 'pull-request', 'sprint'] },
  { id: 'tide-table', term: 'Tide Table', kind: 'Time', scope: 'company',
    body: 'Our fictional quarterly planning ritual where every team surfaces its roadmap and dependencies in one room (or one very long call). The name comes from aligning everyone to the same "tide" before the quarter sets sail. Outputs feed directly into team OKRs. (Dummy term for this demo.)',
    aliases: ['Tides', 'the Table'], see: ['roadmap', 'okr', 'quarter'] },
  { id: 'beacon-tier', term: 'Beacon Tier', kind: 'Concept', scope: 'company',
    body: 'Our invented service-tier classification ranking how critical a service is: Beacon-1 (the lights stay on no matter what) down to Beacon-4 (nice to have). A service’s Beacon Tier sets its SLO targets, on-call expectations, and review rigor. New services get tiered during the Tide Table. (Dummy term for this demo.)',
    aliases: ['Beacon', 'tier', 'B1', 'B4'], see: ['slo', 'sla', 'service'] },
  { id: 'warden', term: 'Warden', kind: 'Role', scope: 'company',
    body: 'Our fictional rotating role for whoever owns a service’s health that week, part on-call responder, part gatekeeper for risky changes. The Warden has the final say on whether a deploy goes out near a freeze. The title rotates so no single person burns out holding the keys. (Dummy term for this demo.)',
    aliases: ['wardens', 'service warden'], see: ['incident', 'deployment', 'beacon-tier'] },
  { id: 'lumen-level', term: 'Lumen Level', kind: 'Role', scope: 'company',
    body: 'Our made-up internal leveling term for engineer seniority, measured in "Lumens" (L1 through L7) instead of traditional titles. Higher Lumen means broader scope and impact, not just more years. People reference it casually, as in "that is an L5 kind of decision." (Dummy term for this demo.)',
    aliases: ['Lumens', 'L1', 'L5', 'L7'], see: ['stakeholder', 'warden'] },
  { id: 'forge-squad', term: 'FORGE Squad', kind: 'Role', scope: 'company',
    body: 'Our invented acronym for a cross-functional strike team, Focused On Resolving Gnarly Engineering, spun up to tackle a thorny project or fire. A FORGE Squad borrows people from several teams for a fixed window, then disbands. It is how we attack work too big for one team but too urgent to wait. (Dummy term for this demo.)',
    aliases: ['FORGE', 'forge squads', 'strike team'], see: ['project', 'incident', 'sprint'] },
  { id: 'sandbar', term: 'Sandbar', kind: 'Concept', scope: 'company',
    body: 'Our fictional name for the shared pre-production sandbox where teams safely test integrations against fake data. It sits between an engineer’s laptop and staging, mirroring production wiring without the risk. "Try it in the Sandbar first" is standard advice before touching staging. (Dummy term for this demo.)',
    aliases: ['the Sandbar'], see: ['environment', 'deployment', 'launchpad'] },
  { id: 'driftwatch', term: 'DriftWatch', kind: 'Tool', scope: 'company',
    body: 'Our made-up internal monitoring system that flags "drift", when a service’s real behavior strays from its declared SLOs or config. It pings the Warden before small slips snowball into incidents. The name nods to catching things as they quietly drift off course. (Dummy term for this demo.)',
    aliases: ['Drift', 'DW'], see: ['slo', 'incident', 'warden'] },
  { id: 'north-star-doc', term: 'North Star Doc', kind: 'Artifact', scope: 'company',
    body: 'Our fictional one-page document every project must write before kickoff, capturing the goal, the stakeholders, and the single metric that defines success. It is the source of truth a FORGE Squad rallies around and what the Tide Table reviews. No North Star Doc, no green light. (Dummy term for this demo.)',
    aliases: ['NSD', 'north star'], see: ['project', 'roadmap', 'stakeholder'] },
];

/** Product operating-model terms — product types, team topologies, interaction
 *  modes, and deliverable formats (scope 'product'). */
const PRODUCT_TERMS = [
  { id: 'customer-need', term: 'Customer need', kind: 'Concept', scope: 'product',
    body: 'The job a customer is trying to do, the problem they need solved, or the outcome they want. Product work starts here, not with a feature list. A clear customer need keeps teams aligned on value instead of output.',
    aliases: ['customer needs', 'jobs to be done'], see: ['product-outcome', 'problem-statement'] },
  { id: 'problem-statement', term: 'Problem statement', kind: 'Artifact', scope: 'product',
    body: 'A concise description of who has a problem, what the problem is, why it matters, and what success looks like. It frames the work before solutions are proposed.',
    see: ['customer-need', 'product-outcome'] },
  { id: 'product-outcome', term: 'Product outcome', kind: 'Concept', scope: 'product',
    body: 'A measurable change in customer behavior or business result that a product aims to produce. Outcomes describe impact; outputs describe deliverables.',
    aliases: ['outcome'], see: ['customer-need', 'north-star-metric'] },
  { id: 'north-star-metric', term: 'North Star metric', kind: 'Metric', scope: 'product',
    body: 'The single most important measure of product value, representing the core value customers get. Teams use it to stay focused and weigh tradeoffs.',
    see: ['product-outcome', 'kpi'] },
  { id: 'product-brief', term: 'Product brief', kind: 'Artifact', scope: 'product',
    body: 'A short document that captures customer need, proposed outcome, scope, non-goals, dependencies, and success criteria. It is the standard starting point for product commitments.',
    aliases: ['brief'], see: ['product-spec', 'prd', 'rfc'] },
  { id: 'product-spec', term: 'Product spec', kind: 'Artifact', scope: 'product',
    body: 'The detailed description of what a product team will build and why. It links customer need to acceptance criteria, design, dependencies, and rollout.',
    see: ['spec', 'product-brief', 'prd'] },
  { id: 'prd', term: 'PRD', kind: 'Artifact', scope: 'product',
    body: 'Product Requirements Document. A structured spec that defines the problem, target users, requirements, acceptance criteria, and success metrics for a feature or product.',
    aliases: ['product requirements document'], see: ['product-spec', 'product-brief'] },
  { id: 'rfc', term: 'RFC', kind: 'Artifact', scope: 'product',
    body: 'Request for Comments. A document used to propose a decision, architecture, or approach and gather feedback before committing. Common for cross-team or high-stakes choices.',
    aliases: ['request for comments'], see: ['product-brief', 'product-spec'] },
  { id: 'stream-aligned-team', term: 'Stream-aligned team', kind: 'Topology', scope: 'product',
    body: 'A team organized around a single, valuable stream of work, often a product, customer segment, or user journey. It has end-to-end ownership of outcomes for that stream.',
    see: ['platform-team', 'enabling-team', 'complicated-subsystem-team'] },
  { id: 'platform-team', term: 'Platform team', kind: 'Topology', scope: 'product',
    body: 'A team that builds internal platforms, APIs, or tooling that other teams consume as a service. It reduces cognitive load and redundant work across stream-aligned teams.',
    see: ['stream-aligned-team', 'x-as-a-service'] },
  { id: 'enabling-team', term: 'Enabling team', kind: 'Topology', scope: 'product',
    body: 'A team that temporarily helps another team adopt a new capability, technology, or practice. It coaches and then steps back so the stream-aligned team can own the work.',
    see: ['stream-aligned-team', 'facilitating'] },
  { id: 'complicated-subsystem-team', term: 'Complicated-subsystem team', kind: 'Topology', scope: 'product',
    body: 'A team formed around a deep, specialized domain that multiple stream-aligned teams depend on, for example, a machine-learning model, graphics engine, or compliance engine.',
    see: ['stream-aligned-team', 'platform-team'] },
  { id: 'collaboration-mode', term: 'Collaboration', kind: 'Interaction', scope: 'product',
    body: 'Two teams work closely together for a bounded time to discover or build something. High bandwidth, temporary, and best for uncertain or high-stakes work.',
    aliases: ['collaborating'], see: ['x-as-a-service', 'facilitating'] },
  { id: 'x-as-a-service', term: 'X-as-a-Service', kind: 'Interaction', scope: 'product',
    body: 'One team consumes a capability from another team through a defined interface, documentation, and SLO. Low bandwidth, durable, and ideal for well-understood dependencies.',
    aliases: ['xaas', 'as a service'], see: ['collaboration-mode', 'platform-team'] },
  { id: 'facilitating', term: 'Facilitating', kind: 'Interaction', scope: 'product',
    body: 'One team helps another team overcome a barrier or learn a skill, then withdraws. Common for enabling teams, security reviews, or architecture coaching.',
    see: ['collaboration-mode', 'enabling-team'] },
  { id: 'cross-capability-team', term: 'Cross-capability team', kind: 'Concept', scope: 'product',
    body: 'A team that brings together different skills, product, engineering, design, data, to own an outcome end to end. It is the default shape for stream-aligned product work.',
    aliases: ['cross-functional team'], see: ['stream-aligned-team', 'product-trio'] },
  { id: 'product-trio', term: 'Product trio', kind: 'Role', scope: 'product',
    body: 'A small leadership cell of product, engineering, and design that jointly discovers and validates what to build. It keeps decisions balanced across viability, feasibility, and usability.',
    see: ['cross-capability-team', 'product-manager'] },
  { id: 'product-manager', term: 'Product manager', kind: 'Role', scope: 'product',
    body: 'The role accountable for what problems the team solves, for whom, and why. They frame customer needs, define outcomes, and prioritize the backlog with engineering and design.',
    see: ['product-trio', 'product-owner'] },
  { id: 'product-owner', term: 'Product owner', kind: 'Role', scope: 'product',
    body: 'A role that owns the backlog and prioritization for a team, often in more delivery-focused contexts. They turn strategy into actionable work and keep the team unblocked.',
    see: ['product-manager', 'owner'] },
  { id: 'value-stream', term: 'Value stream', kind: 'Concept', scope: 'product',
    body: 'The sequence of activities that delivers value to a customer. Organizing teams around value streams aligns them with customer outcomes and reduces handoffs.',
    see: ['stream-aligned-team', 'customer-need'] },
];

/** The full glossary: operating-model terms first, then basics, company jargon,
 *  and product terms. The Intel tab filters this by scope and searches across all. */
export const INTEL = [...OPERATING_TERMS, ...BASIC_TERMS, ...COMPANY_TERMS, ...PRODUCT_TERMS];

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
    id: 'q3-planning',
    accent: 'azure',
    icon: 'compass-drafting',
    kicker: 'Event · Now live',
    title: 'Q3 Planning Window',
    blurb: 'The planning gates are open. Stake your claims before the specs lock.',
    deadline: '2026-07-15',
    deadlineLabel: 'Specs due',
    period: 'Jun 15 – Jul 15',
    cta: 'Read the brief',
    sections: [
      { heading: 'What is happening',
        body: 'The quarterly planning window is open across all teams. Candidate projects are being gathered, sized, and ranked against company objectives. Final specs are due before the window closes.' },
      { heading: 'Your move this week',
        body: 'Draft specs for any project you want to land in Q3 and tie each one to an objective. Get an early gut-check from a senior engineer so review week goes smoothly. Open the Chapters tab to onboard step by step.' },
    ],
  },
  {
    id: 'roadmap-lock',
    accent: 'gold',
    icon: 'flag-checkered',
    kicker: 'Event · Milestone',
    title: 'Roadmap Review & Plan Lock',
    blurb: 'One last review pass before the quarter is sealed. Speak now or carry it over.',
    deadline: '2026-07-31',
    deadlineLabel: 'Plan locks',
    period: 'Jul 20 – Jul 31',
    cta: 'View the roadmap',
    sections: [
      { heading: 'What is happening',
        body: 'Leadership and team leads do a final review of the proposed roadmap before commitments are locked. Dependencies and cross-team conflicts get surfaced and resolved here.' },
      { heading: 'Your move this week',
        body: 'Flag any dependency your work has on another team and confirm the capacity line is realistic. After lock, new scope means dropping something else.' },
    ],
  },
  {
    id: 'cert-season',
    accent: 'gold',
    icon: 'award',
    kicker: 'Event · Limited time',
    title: 'Certification Season',
    blurb: 'Log your credentials and claim your spot. The learning budget refreshes once.',
    deadline: '2026-07-10',
    deadlineLabel: 'Submissions close',
    period: 'Jun 15 – Jul 10',
    cta: 'Open your profile',
    href: '#profile',
    sections: [
      { heading: 'What is happening',
        body: 'The annual certification and learning budget is open for the cycle. Cloud, security, and platform certs are all eligible, and approved exams are reimbursed in full.' },
      { heading: 'Your move this week',
        body: 'Pick a cert that maps to your growth plan and submit it for approval before the window closes. Already certified? Log existing credentials in your Profile so the skills directory stays current.' },
    ],
  },
  {
    id: 'whats-changing',
    accent: 'violet',
    icon: 'rss-square',
    kicker: 'Event · Orientation',
    title: 'What is changing, in brief',
    blurb: 'Six shifts move us to one ranked backlog and continuous delivery.',
    deadline: '2026-06-26',
    deadlineLabel: 'Rollout begins',
    period: 'Read in two minutes',
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

// ── Profile: engineer classes & certification ladders ──────
/**
 * Engineer "classes," like RPG specializations. Each class carries a
 * certification ladder of four rungs — Entry, Intermediate, Advanced,
 * Referent — where Referent is the recognized go-to expert others consult.
 *
 * Every rung has a `required` count: earn that many of its certs to complete
 * the tier. Groups (Cloud, Kubernetes, Security, Automation, ...) show which
 * kind of credential each one is, so you can mix-and-match — for example,
 * any two cloud certs at Intermediate, or a CKA instead of a second cloud cert.
 */
export const CLASSES = [
  {
    id: 'infra',
    title: 'Infrastructure / Platform',
    icon: 'layer-group',
    tagline: 'Forge the foundations others build on',
    blurb: 'The architect-engineer who shapes cloud terrain, provisions worlds as code, and keeps the platform humming under any load.',
    crest: { symbol: 'I', color: '#2aa8ff' },
    rungs: [
      { tier: 'Entry', required: 2, blurb: 'You can navigate a cloud console, read infrastructure code, and stand up basic resources under supervision.', certs: [
        { id: 'aws-ccp', name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', group: 'Cloud', url: 'https://aws.amazon.com/certification/' },
        { id: 'terraform-associate', name: 'HashiCorp Certified: Terraform Associate', issuer: 'HashiCorp', group: 'Automation', url: 'https://www.hashicorp.com/certification' },
        { id: 'kcna', name: 'Kubernetes and Cloud Native Associate (KCNA)', issuer: 'The Linux Foundation / CNCF', group: 'Kubernetes', url: 'https://www.cncf.io/certification/' },
        { id: 'docker-infra', name: 'Docker Certified Associate', issuer: 'Docker', group: 'DevOps', url: 'https://www.docker.com/certification/' },
      ]},
      { tier: 'Intermediate', required: 2, blurb: 'You design and operate production-grade infrastructure independently, automate provisioning, and run real clusters.', certs: [
        { id: 'aws-saa', name: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services', group: 'Cloud', url: 'https://aws.amazon.com/certification/' },
        { id: 'az-104', name: 'Microsoft Certified: Azure Administrator Associate (AZ-104)', issuer: 'Microsoft', group: 'Cloud', url: 'https://learn.microsoft.com/en-us/credentials/certifications/' },
        { id: 'gcp-ace', name: 'Google Cloud Associate Cloud Engineer', issuer: 'Google Cloud', group: 'Cloud', url: 'https://cloud.google.com/learn/certification' },
        { id: 'terraform-authoring', name: 'HashiCorp Certified: Terraform Authoring and Operations Professional', issuer: 'HashiCorp', group: 'Automation', url: 'https://www.hashicorp.com/certification' },
        { id: 'github-actions-infra', name: 'GitHub Actions Certification', issuer: 'GitHub', group: 'DevOps', url: 'https://resources.github.com/learn/certifications/' },
      ]},
      { tier: 'Advanced', required: 2, blurb: 'You own multi-account, multi-region architecture, harden clusters, and design platforms others depend on.', certs: [
        { id: 'aws-sap', name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', group: 'Cloud', url: 'https://aws.amazon.com/certification/' },
        { id: 'aws-devops-pro', name: 'AWS Certified DevOps Engineer – Professional', issuer: 'Amazon Web Services', group: 'Cloud', url: 'https://aws.amazon.com/certification/' },
        { id: 'cka', name: 'Certified Kubernetes Administrator (CKA)', issuer: 'The Linux Foundation / CNCF', group: 'Kubernetes', url: 'https://www.cncf.io/certification/' },
        { id: 'gcp-pca', name: 'Google Cloud Professional Cloud Architect', issuer: 'Google Cloud', group: 'Cloud', url: 'https://cloud.google.com/learn/certification' },
      ]},
      { tier: 'Referent', required: 1, blurb: 'The recognized platform authority: the SME teams consult on architecture and a contributor to the wider ecosystem.', certs: [
        { id: 'cks', name: 'Certified Kubernetes Security Specialist (CKS)', issuer: 'The Linux Foundation / CNCF', group: 'Security', url: 'https://www.cncf.io/certification/' },
        { id: 'cncf-maintainer', name: 'Open-source maintainer (Terraform module / Kubernetes operator)', issuer: 'Recognition', group: 'Recognition', url: '' },
        { id: 'platform-arb', name: 'Internal Platform Architecture Review Board', issuer: 'Recognition', group: 'Recognition', url: '' },
      ]},
    ],
  },
  {
    id: 'sre',
    title: 'SRE / DevOps',
    icon: 'heart-pulse',
    tagline: 'Keep the realm alive at scale',
    blurb: 'The guardian who watches every signal, answers the page at 3am, and trades toil for automation so the system never goes dark.',
    crest: { symbol: 'S', color: '#34d399' },
    rungs: [
      { tier: 'Entry', required: 2, blurb: 'You understand reliability fundamentals, can read dashboards, and follow runbooks during an incident.', certs: [
        { id: 'pca-prometheus', name: 'Prometheus Certified Associate (PCA)', issuer: 'The Linux Foundation / CNCF', group: 'Observability', url: 'https://www.cncf.io/certification/' },
        { id: 'kcna-sre', name: 'Kubernetes and Cloud Native Associate (KCNA)', issuer: 'The Linux Foundation / CNCF', group: 'Kubernetes', url: 'https://www.cncf.io/certification/' },
        { id: 'datadog-fundamentals', name: 'Datadog Fundamentals', issuer: 'Datadog', group: 'Observability', url: 'https://www.datadoghq.com/training/' },
        { id: 'docker-sre', name: 'Docker Certified Associate', issuer: 'Docker', group: 'DevOps', url: 'https://www.docker.com/certification/' },
      ]},
      { tier: 'Intermediate', required: 2, blurb: 'You build CI/CD pipelines, instrument services with metrics and traces, and take primary on-call rotations.', certs: [
        { id: 'gitlab-cicd', name: 'GitLab Certified CI/CD Associate', issuer: 'GitLab', group: 'DevOps', url: 'https://about.gitlab.com/services/education/' },
        { id: 'aws-sysops', name: 'AWS Certified SysOps Administrator – Associate', issuer: 'Amazon Web Services', group: 'Cloud', url: 'https://aws.amazon.com/certification/' },
        { id: 'github-actions', name: 'GitHub Actions Certification', issuer: 'GitHub', group: 'DevOps', url: 'https://resources.github.com/learn/certifications/' },
        { id: 'docker-sre-intermediate', name: 'Docker Certified Associate', issuer: 'Docker', group: 'DevOps', url: 'https://www.docker.com/certification/' },
      ]},
      { tier: 'Advanced', required: 2, blurb: 'You define SLOs and error budgets, lead incident command, and engineer resilience through chaos testing.', certs: [
        { id: 'aws-devops-pro-sre', name: 'AWS Certified DevOps Engineer – Professional', issuer: 'Amazon Web Services', group: 'Cloud', url: 'https://aws.amazon.com/certification/' },
        { id: 'gremlin-cep', name: 'Gremlin Certified Chaos Engineering Practitioner', issuer: 'Gremlin', group: 'Reliability', url: 'https://www.gremlin.com/certification' },
        { id: 'cka-sre', name: 'Certified Kubernetes Administrator (CKA)', issuer: 'The Linux Foundation / CNCF', group: 'Kubernetes', url: 'https://www.cncf.io/certification/' },
      ]},
      { tier: 'Referent', required: 1, blurb: 'The reliability authority who sets org-wide observability strategy, mentors incident commanders, and shares hard-won lessons.', certs: [
        { id: 'sre-conference-speaker', name: 'Conference speaker (SREcon / Monitorama)', issuer: 'Recognition', group: 'Recognition', url: '' },
        { id: 'incident-command-lead', name: 'Org-wide Incident Command program lead', issuer: 'Recognition', group: 'Recognition', url: '' },
        { id: 'reliability-arb', name: 'Internal Reliability Review Board', issuer: 'Recognition', group: 'Recognition', url: '' },
      ]},
    ],
  },
  {
    id: 'security',
    title: 'Security / Data',
    icon: 'shield-halved',
    tagline: 'Guard the gates, govern the data',
    blurb: 'The sentinel who breaks systems to harden them and shepherds data through pipelines, balancing offense, defense, and governance.',
    crest: { symbol: 'X', color: '#b08cff' },
    rungs: [
      { tier: 'Entry', required: 2, blurb: 'You grasp security and data fundamentals, recognize common threats, and handle data responsibly.', certs: [
        { id: 'comptia-security-plus', name: 'CompTIA Security+', issuer: 'CompTIA', group: 'Security', url: 'https://www.comptia.org/certifications/' },
        { id: 'kcsa', name: 'Kubernetes and Cloud Native Security Associate (KCSA)', issuer: 'The Linux Foundation / CNCF', group: 'Security', url: 'https://www.cncf.io/certification/' },
        { id: 'databricks-de-associate', name: 'Databricks Certified Data Engineer Associate', issuer: 'Databricks', group: 'Data', url: 'https://www.databricks.com/learn/certification' },
      ]},
      { tier: 'Intermediate', required: 2, blurb: 'You secure cloud workloads, run guided penetration tests, and build reliable data pipelines and warehouses.', certs: [
        { id: 'aws-security-specialty', name: 'AWS Certified Security – Specialty', issuer: 'Amazon Web Services', group: 'Security', url: 'https://aws.amazon.com/certification/' },
        { id: 'dbt-analytics-engineer', name: 'dbt Analytics Engineering Certification', issuer: 'dbt Labs', group: 'Data', url: 'https://www.getdbt.com/dbt-certification' },
        { id: 'databricks-de-pro', name: 'Databricks Certified Data Engineer Professional', issuer: 'Databricks', group: 'Data', url: 'https://www.databricks.com/learn/certification' },
        { id: 'comptia-pentest-plus', name: 'CompTIA PenTest+', issuer: 'CompTIA', group: 'Security', url: 'https://www.comptia.org/certifications/' },
      ]},
      { tier: 'Advanced', required: 2, blurb: 'You perform exploit-driven offensive testing, architect governed ML/data platforms, and lead security reviews.', certs: [
        { id: 'oscp', name: 'Offensive Security Certified Professional (OSCP)', issuer: 'OffSec', group: 'Security', url: 'https://www.offsec.com/courses/' },
        { id: 'aws-ml-specialty', name: 'AWS Certified Machine Learning – Specialty', issuer: 'Amazon Web Services', group: 'Cloud', url: 'https://aws.amazon.com/certification/' },
        { id: 'cks-security', name: 'Certified Kubernetes Security Specialist (CKS)', issuer: 'The Linux Foundation / CNCF', group: 'Security', url: 'https://www.cncf.io/certification/' },
      ]},
      { tier: 'Referent', required: 1, blurb: 'The trusted security and data authority: the org’s top advisor on governance, threat modeling, and offensive capability.', certs: [
        { id: 'cissp', name: 'Certified Information Systems Security Professional (CISSP)', issuer: 'ISC2', group: 'Security', url: 'https://www.isc2.org/certifications/' },
        { id: 'osep', name: 'Offensive Security Experienced Penetrator (OSEP)', issuer: 'OffSec', group: 'Security', url: 'https://www.offsec.com/courses/' },
        { id: 'security-governance-board', name: 'Data Governance & Security Council lead', issuer: 'Recognition', group: 'Recognition', url: '' },
      ]},
    ],
  },
  {
    id: 'backend',
    title: 'Backend / Fullstack',
    icon: 'server',
    tagline: 'Engineer the systems behind the screen',
    blurb: 'The craftsperson who wields languages and frameworks to build resilient APIs, model data, and design distributed systems that scale.',
    crest: { symbol: 'B', color: '#ffce4d' },
    rungs: [
      { tier: 'Entry', required: 2, blurb: 'You ship features in a primary language, write clean APIs, and work confidently with a relational database.', certs: [
        { id: 'oracle-java-foundations', name: 'Oracle Certified Foundations Associate, Java', issuer: 'Oracle', group: 'Language', url: 'https://education.oracle.com/oracle-certification' },
        { id: 'mongodb-associate-developer', name: 'MongoDB Associate Developer', issuer: 'MongoDB', group: 'Database', url: 'https://www.mongodb.com/university/certification' },
        { id: 'az-900', name: 'Microsoft Certified: Azure Fundamentals (AZ-900)', issuer: 'Microsoft', group: 'Cloud', url: 'https://learn.microsoft.com/en-us/credentials/certifications/' },
      ]},
      { tier: 'Intermediate', required: 2, blurb: 'You design robust APIs, optimize databases, and build cloud-native services that handle real production traffic.', certs: [
        { id: 'aws-developer-associate', name: 'AWS Certified Developer – Associate', issuer: 'Amazon Web Services', group: 'Cloud', url: 'https://aws.amazon.com/certification/' },
        { id: 'oracle-java-se-pro', name: 'Oracle Certified Professional: Java SE Developer', issuer: 'Oracle', group: 'Language', url: 'https://education.oracle.com/oracle-certification' },
        { id: 'postgresql-associate', name: 'PostgreSQL Associate Certification', issuer: 'EnterpriseDB', group: 'Database', url: 'https://www.enterprisedb.com/training/certification' },
        { id: 'gcp-professional-developer', name: 'Google Cloud Professional Cloud Developer', issuer: 'Google Cloud', group: 'Cloud', url: 'https://cloud.google.com/learn/certification' },
        { id: 'docker-backend', name: 'Docker Certified Associate', issuer: 'Docker', group: 'DevOps', url: 'https://www.docker.com/certification/' },
        { id: 'github-actions-backend', name: 'GitHub Actions Certification', issuer: 'GitHub', group: 'DevOps', url: 'https://resources.github.com/learn/certifications/' },
      ]},
      { tier: 'Advanced', required: 2, blurb: 'You architect distributed systems, lead system-design decisions, and own the reliability and data model of major services.', certs: [
        { id: 'aws-sap-backend', name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', group: 'Cloud', url: 'https://aws.amazon.com/certification/' },
        { id: 'confluent-ccdak', name: 'Confluent Certified Developer for Apache Kafka (CCDAK)', issuer: 'Confluent', group: 'Data', url: 'https://www.confluent.io/certification/' },
        { id: 'mongodb-associate-dba', name: 'MongoDB Associate Database Administrator', issuer: 'MongoDB', group: 'Database', url: 'https://www.mongodb.com/university/certification' },
        { id: 'gcp-pca-backend', name: 'Google Cloud Professional Cloud Architect', issuer: 'Google Cloud', group: 'Cloud', url: 'https://cloud.google.com/learn/certification' },
      ]},
      { tier: 'Referent', required: 1, blurb: 'The go-to system-design authority who sets backend standards, reviews critical architecture, and shapes the engineering community.', certs: [
        { id: 'oss-framework-maintainer', name: 'Open-source maintainer (framework / library)', issuer: 'Recognition', group: 'Recognition', url: '' },
        { id: 'backend-arb', name: 'Internal Architecture Review Board', issuer: 'Recognition', group: 'Recognition', url: '' },
      ]},
    ],
  },
];

/** Flat lookup by class id. */
export const CLASS_BY_ID = Object.fromEntries(CLASSES.map(c => [c.id, c]));

/** Credential status values, in lifecycle order. */
export const CRED_STATUSES = [
  { id: 'in-progress', label: 'In progress' },
  { id: 'earned',      label: 'Earned' },
  { id: 'expired',     label: 'Expired' },
];

// ── Playbooks: editable onboarding workflows ───────────────
/**
 * Dummy onboarding/process workflows, authored as step lists in the spirit of
 * the skill tree. These seed the Playbooks tab; users can add, edit, and delete
 * their own (persisted in localStorage). Steps stay short — "dig deeper" links
 * point to a wiki. `seed: true` marks the shipped examples.
 */
export const PLAYBOOKS = [
  {
    id: 'first-deploy', title: 'Ship your first change', icon: 'rocket', category: 'Onboarding', seed: true,
    summary: 'Take a tiny change from local clone all the way to production.', estMinutes: 45,
    steps: [
      { id: 's1', title: 'Clone the repo', body: 'Grab the service repo and run the bootstrap script to install dependencies and local tooling.', link: { label: 'Dev setup guide', url: 'https://confluence.example.com/dev/setup' } },
      { id: 's2', title: 'Pick a starter ticket', body: 'Find a ticket tagged "good-first-change" on the board. Small copy fixes and config tweaks are ideal.' },
      { id: 's3', title: 'Branch and code', body: 'Cut a branch named feat/your-change, make the edit, and run the test suite locally before pushing.' },
      { id: 's4', title: 'Open a pull request', body: 'Push your branch and open a PR. Fill in the template and tag your onboarding buddy as reviewer.', link: { label: 'PR conventions', url: 'https://wiki.example.com/eng/pull-requests' } },
      { id: 's5', title: 'Address review feedback', body: 'Respond to comments, push fixes, and re-request review. Two approvals unblock the merge.' },
      { id: 's6', title: 'Merge and watch the deploy', body: 'Merge to main and follow the pipeline. CI promotes to staging automatically, then prod on green.', link: { label: 'Deploy pipeline', url: 'https://confluence.example.com/dev/cd-pipeline' } },
      { id: 's7', title: 'Verify in production', body: 'Check the live change and the deploy dashboard. Confirm metrics and error rates stay flat.' },
    ],
  },
  {
    id: 'spec-review', title: 'Run a spec review', icon: 'file-lines', category: 'Process', seed: true,
    summary: 'Drive a technical spec from draft to team sign-off without surprises.', estMinutes: 60,
    steps: [
      { id: 's1', title: 'Start from the template', body: 'Copy the spec template and fill in problem, goals, and non-goals before touching any design.', link: { label: 'Spec template', url: 'https://confluence.example.com/eng/spec-template' } },
      { id: 's2', title: 'Outline two approaches', body: 'Sketch at least two viable designs and a short trade-off table. Reviewers want options, not a single path.' },
      { id: 's3', title: 'Pre-share with one reviewer', body: 'Send the draft to a senior engineer for a quick gut-check before the wider review.' },
      { id: 's4', title: 'Book the review slot', body: 'Schedule a 45-minute review and share the doc at least 24 hours ahead so people can read async.' },
      { id: 's5', title: 'Capture decisions', body: 'During the meeting, log every decision and open question directly in the doc as you go.' },
      { id: 's6', title: 'Resolve and lock', body: 'Close out open questions, mark the spec "Approved", and link it from the tracking ticket.', link: { label: 'Decision log format', url: 'https://wiki.example.com/eng/decision-records' } },
    ],
  },
  {
    id: 'incident-response', title: 'Handle an incident', icon: 'triangle-exclamation', category: 'Incident', seed: true,
    summary: 'The basic moves for the first 30 minutes of a production incident.', estMinutes: 30,
    steps: [
      { id: 's1', title: 'Declare the incident', body: 'Open an incident in the tooling and set a severity. When unsure, start higher and downgrade later.', link: { label: 'Severity matrix', url: 'https://confluence.example.com/ops/severity-levels' } },
      { id: 's2', title: 'Take a role', body: 'Claim Incident Commander or Comms. One person coordinates; everyone else investigates.' },
      { id: 's3', title: 'Open the war room', body: 'Spin up the incident channel and bridge. Keep all updates in one place for the timeline.' },
      { id: 's4', title: 'Stabilize first', body: 'Mitigate before you diagnose. Roll back the last deploy or flip the feature flag to stop the bleeding.', link: { label: 'Rollback runbook', url: 'https://wiki.example.com/ops/rollback' } },
      { id: 's5', title: 'Communicate status', body: 'Post a customer-facing update and refresh it on a steady cadence until resolved.' },
      { id: 's6', title: 'Resolve and schedule the postmortem', body: 'Confirm recovery, close the incident, and book a blameless postmortem within 48 hours.', link: { label: 'Postmortem template', url: 'https://confluence.example.com/ops/postmortem' } },
    ],
  },
  {
    id: 'oncall-onboard', title: 'Onboard to the on-call rotation', icon: 'pager', category: 'Onboarding', seed: true,
    summary: 'Get set up and confident before your first on-call shift.', estMinutes: 50,
    steps: [
      { id: 's1', title: 'Join the schedule', body: 'Get added to the rotation and confirm your contact details in the paging tool.', link: { label: 'On-call schedule', url: 'https://confluence.example.com/ops/oncall-schedule' } },
      { id: 's2', title: 'Test your alerts', body: 'Send yourself a test page on both phone and laptop. Make sure alerts break through Do Not Disturb.' },
      { id: 's3', title: 'Read the runbooks', body: 'Skim the top runbooks for the services you own so the steps feel familiar under pressure.', link: { label: 'Runbook index', url: 'https://wiki.example.com/ops/runbooks' } },
      { id: 's4', title: 'Shadow a shift', body: 'Pair with the current on-call for a few days. Watch how they triage real pages.' },
      { id: 's5', title: 'Know the escalation path', body: 'Memorize who to escalate to and when. You are never expected to solve everything alone.' },
      { id: 's6', title: 'Take the handoff', body: 'At shift start, review open issues and ongoing risks with the previous on-call before they sign off.', link: { label: 'Handoff checklist', url: 'https://confluence.example.com/ops/oncall-handoff' } },
    ],
  },
  {
    id: 'quarter-planning', title: 'Plan a quarter', icon: 'compass-drafting', category: 'Planning', seed: true,
    summary: 'Turn fuzzy goals into a committed, scoped quarterly plan.', estMinutes: 90,
    steps: [
      { id: 's1', title: 'Review last quarter', body: 'Read the previous retro and carryover list. Start from what actually shipped, not what was promised.', link: { label: 'Last quarter retro', url: 'https://confluence.example.com/planning/q2-retro' } },
      { id: 's2', title: 'Gather candidate work', body: 'Collect proposed projects from the team and stakeholders into one prioritization doc.' },
      { id: 's3', title: 'Tie work to objectives', body: 'Map each candidate to a company objective. Anything that maps to nothing gets parked.', link: { label: 'Company OKRs', url: 'https://wiki.example.com/strategy/okrs' } },
      { id: 's4', title: 'Rough-size and rank', body: 'Give each project a t-shirt size and stack-rank by impact versus effort.' },
      { id: 's5', title: 'Draw the capacity line', body: 'Sum your team capacity and draw the line. Everything below it is explicitly out of scope.' },
      { id: 's6', title: 'Socialize the draft', body: 'Share the plan with adjacent teams to catch dependencies and conflicts early.' },
      { id: 's7', title: 'Lock and publish', body: 'Finalize commitments, publish the plan, and create the tracking epics.', link: { label: 'Planning hub', url: 'https://confluence.example.com/planning/q3' } },
    ],
  },
  {
    id: 'product-brief', title: 'Write a product brief', icon: 'file-lines', category: 'Product', seed: true,
    summary: 'Turn a customer need into a shareable, decision-ready product brief.', estMinutes: 40,
    steps: [
      { id: 's1', title: 'Name the customer and need', body: 'Describe who you are solving for and the job they are trying to do. Keep it to one or two sentences.' },
      { id: 's2', title: 'Frame the problem', body: 'Explain why the need matters today, what happens if it stays unsolved, and what a good outcome looks like.' },
      { id: 's3', title: 'Scope and non-goals', body: 'State what is in scope for this brief and, just as importantly, what is out of scope.' },
      { id: 's4', title: 'List open questions', body: 'Capture what you still need to learn before committing to a solution. This is where discovery begins.' },
      { id: 's5', title: 'Define success metrics', body: 'Pick one North Star metric and one or two supporting signals that prove value.' },
      { id: 's6', title: 'Share for feedback', body: 'Send the brief to the product trio and key stakeholders before it becomes a full spec.', link: { label: 'Brief template', url: 'https://confluence.example.com/product/brief-template' } },
    ],
  },
  {
    id: 'team-topology', title: 'Choose a team topology', icon: 'sitemap', category: 'Product', seed: true,
    summary: 'Map teams to value streams, platforms, and deep subsystems using Team Topologies.', estMinutes: 50,
    steps: [
      { id: 's1', title: 'Identify value streams', body: 'List the customer journeys or product areas that deliver value end to end. Each stream is a candidate for a stream-aligned team.' },
      { id: 's2', title: 'Spot repeated work', body: 'Find infrastructure, APIs, or tooling that multiple streams rebuild. These are candidates for platform teams.' },
      { id: 's3', title: 'Find deep specialties', body: 'Look for complex domains: like compliance, ML, or rendering. That several teams depend on but cannot own fully.' },
      { id: 's4', title: 'Map dependencies', body: 'Draw the lines between teams and classify each relationship as collaboration, X-as-a-Service, or facilitation.' },
      { id: 's5', title: 'Reduce cognitive load', body: 'Adjust boundaries so stream-aligned teams can deliver value without owning every detail. Platform and enabling teams exist to absorb that load.' },
      { id: 's6', title: 'Publish the topology', body: 'Share the map, update it quarterly, and use it in planning to keep dependencies visible.' },
    ],
  },
  {
    id: 'cross-team-dependency', title: 'Manage a cross-team dependency', icon: 'route', category: 'Product', seed: true,
    summary: 'Get what you need from another team without slowing either side down.', estMinutes: 35,
    steps: [
      { id: 's1', title: 'Name the dependency clearly', body: 'State exactly what you need, by when, and why it blocks your outcome.' },
      { id: 's2', title: 'Choose the interaction mode', body: 'Collaborate for uncertain work, consume X-as-a-Service for stable APIs, or ask for facilitation if you need to learn a skill.' },
      { id: 's3', title: 'Agree on the interface', body: 'Define the contract: API, SLO, deliverable, or checkpoint, so both teams can work in parallel.' },
      { id: 's4', title: 'Link it to both backlogs', body: 'Create a tracking item on both sides and set a checkpoint date before the hard deadline.' },
      { id: 's5', title: 'Escalate early if slipping', body: 'If the dependency is at risk, flag it in the dependency tracing ceremony before it becomes a surprise.' },
    ],
  },
];

/** Distinct playbook categories, for grouping/filtering. */
export const PLAYBOOK_CATEGORIES = [...new Set(PLAYBOOKS.map(p => p.category))];

// ── Atlas: team topology and product-deliverable format ─────

/**
 * Sample team topology nodes for the Atlas tab. Each node represents a team
 * grouped by the customer need it serves, with topology kind and interaction
 * edges to other teams. This seeds the topology map; users can upload their own
 * format via the Atlas validator.
 */
export const TEAM_TOPOLOGY = [
  { id: 'cx-core', name: 'Customer Experience', topology: 'stream-aligned', needs: ['onboarding', 'support', 'retention'],
    edges: [
      { to: 'platform-foundation', mode: 'x-as-a-service', label: 'cloud / deployment' },
      { to: 'data-insights', mode: 'x-as-a-service', label: 'event data' },
      { to: 'design-enablement', mode: 'facilitating', label: 'design system' },
    ] },
  { id: 'merchant-solutions', name: 'Merchant Solutions', topology: 'stream-aligned', needs: ['checkout', 'payments', 'reporting'],
    edges: [
      { to: 'platform-payments', mode: 'x-as-a-service', label: 'payments API' },
      { to: 'data-insights', mode: 'collaboration', label: 'reporting' },
      { to: 'security-governance', mode: 'facilitating', label: 'compliance review' },
    ] },
  { id: 'platform-foundation', name: 'Platform Foundation', topology: 'platform', needs: ['developer velocity', 'reliability'],
    edges: [
      { to: 'security-governance', mode: 'x-as-a-service', label: 'policy checks' },
    ] },
  { id: 'platform-payments', name: 'Payments Platform', topology: 'platform', needs: ['transaction integrity', 'compliance'],
    edges: [
      { to: 'platform-foundation', mode: 'x-as-a-service', label: 'compute' },
      { to: 'security-governance', mode: 'collaboration', label: 'PCI scope' },
    ] },
  { id: 'data-insights', name: 'Data & Insights', topology: 'platform', needs: ['analytics', 'experimentation'],
    edges: [
      { to: 'platform-foundation', mode: 'x-as-a-service', label: 'warehouse' },
    ] },
  { id: 'ml-recommendations', name: 'Recommendations Engine', topology: 'complicated-subsystem', needs: ['personalization'],
    edges: [
      { to: 'cx-core', mode: 'x-as-a-service', label: 'recommendations' },
      { to: 'data-insights', mode: 'collaboration', label: 'features / training' },
      { to: 'platform-foundation', mode: 'x-as-a-service', label: 'GPU fleet' },
    ] },
  { id: 'design-enablement', name: 'Design Enablement', topology: 'enabling', needs: ['design quality', 'accessibility'],
    edges: [] },
  { id: 'security-governance', name: 'Security & Governance', topology: 'enabling', needs: ['risk reduction', 'compliance'],
    edges: [] },
];

/** Customer-need domains used to color and group teams in the Atlas matrix. */
export const CUSTOMER_NEEDS = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'support', label: 'Support' },
  { id: 'retention', label: 'Retention' },
  { id: 'checkout', label: 'Checkout' },
  { id: 'payments', label: 'Payments' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'developer-velocity', label: 'Developer velocity' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'experimentation', label: 'Experimentation' },
  { id: 'personalization', label: 'Personalization' },
  { id: 'design-quality', label: 'Design quality' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'risk-reduction', label: 'Risk reduction' },
  { id: 'compliance', label: 'Compliance' },
];

/** Expected shape of a product-deliverable / team-topology upload.
 *  Used by the Atlas validator before persisting in localStorage. */
export const FORMAT_SCHEMA = {
  required: ['teams'],
  types: {
    teams: 'array',
    'teams[].id': 'string',
    'teams[].name': 'string',
    'teams[].topology': 'string',
    'teams[].needs': 'array',
    'teams[].edges': 'array',
    'teams[].edges[].to': 'string',
    'teams[].edges[].mode': 'string',
    'teams[].edges[].label': 'string',
  },
  enums: {
    'teams[].topology': ['stream-aligned', 'platform', 'enabling', 'complicated-subsystem'],
    'teams[].edges[].mode': ['collaboration', 'x-as-a-service', 'facilitating'],
  },
};
