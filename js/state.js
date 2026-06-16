// ── State management ─────────────────────────────────────────
// Tracks which skill nodes the player has completed and which
// view is open. Progress persists in localStorage.

import { BRANCHES, BRANCH_BY_ID, TOTAL_NODES, RANKS, TABS, INTEL, INTEL_BY_ID, PLAYBOOKS, CLASS_BY_ID } from './data.js';

const STORAGE_KEY = 'questline-v1';
// Preferences live under their own key so toggling a setting never rewrites
// (or risks corrupting) the progress save. Both are plain JSON in localStorage.
const PREFS_KEY = 'questline-prefs';
// Profile (class + credential records) and playbooks (editable workflows) each
// get their own key, so one feature's save never risks corrupting another.
// The profile shape is deliberately Convex-ready: a flat doc that maps 1:1 to a
// future `profiles` table row (classId + a creds map keyed by certId).
const PROFILE_KEY = 'questline-profile';
const PLAYBOOKS_KEY = 'questline-playbooks';
const ENGAGEMENT_KEY = 'questline-engagement';
const ATLAS_KEY = 'questline-atlas';

/** Console tab ids that render inside the game shell (in tab-bar order). */
export const TAB_IDS = TABS.map(t => t.id);

export const state = {
  done: {},          // { [nodeId]: true } — completed skills
  view: 'brief',     // 'flow' (flowchart) | tab id | branchId
  // Persisted preferences (questline-prefs). keyboardNav drives the System
  // opt-out; shiftsRead marks the six-shifts briefing as read.
  prefs: {
    keyboardNav: true,     // arrow/Q-E/Enter movement; users can switch it off
    shiftsRead: false,     // has the six-shifts reading popup been acknowledged
    showFullMap: true,     // Flow: reveal all chapters (locked dimmed) vs fog-of-war
    showClassSheets: true, // Profile: render certification ladders for selected classes
  },
  // Profile: the engineer class chosen and credential records. `creds` maps a
  // certId → { id, issuer, issued, expires, status }. `classIds` holds up to
  // two selected classes; if empty, no class sheet is shown. The object is
  // persisted verbatim under PROFILE_KEY and mirrors a future Convex `profiles`
  // row.
  profile: {
    classIds: [],      // selected engineer class ids (max 2)
    classId: null,     // legacy single-class field (migrated to classIds)
    creds: {},         // { [certId]: { id, issuer, issued, expires, status } }
  },
  // Playbooks: editable onboarding workflows. Seeded from data.js on first run,
  // then owned by the user (add/edit/delete). Persisted under PLAYBOOKS_KEY.
  playbooks: [],
  // Atlas: uploaded team topology / product-deliverable formats, persisted under
  // ATLAS_KEY. If null, the shipped sample topology is displayed.
  atlas: {
    teams: null,       // uploaded topology array, or null to use sample data
  },
  // Transient cursor/selection — never persisted. Survives the innerHTML
  // re-render because it lives here, not in the live DOM. Keyboard and mouse
  // share one cursor per surface so the two input modes never disagree.
  ui: {
    chapterSel: null,  // chapter id open in the Chapters detail panel
    intelSel: null,    // term id open in the Intel detail panel
    intelQuery: '',    // live glossary search filter (Intel tab)
    intelScope: 'all', // glossary scope filter (all | basic | company | operating | product)
    playbookSel: null, // playbook id open in the Playbooks detail panel
    playbookEdit: false, // whether the open playbook is in edit mode
    stepEditing: null, // step id whose inline editor is open (Playbooks)
    credEditing: null, // cert id whose credential form is open (Profile)
    classSelecting: false, // Profile class-select screen open (vs the sheet view)
    atlasView: 'map',  // 'map' | 'matrix' | 'upload'
    sitesSel: null,    // site id open in the Sites detail panel
    sitesQuery: '',    // live sites search filter
    sitesGroup: 'all', // sites group filter
    region: 'list',    // 'list' | 'detail' — which side owns the cursor
    rowCursor: 0,      // index into the active master list
    skillCursor: 0,    // index into the open chapter's nodes (detail region)
    flowCursor: 0,     // index into the current flow node order (visible | focus)
    flowFocus: null,   // branch id focused in the Flow local map, or null (full map)
  },
};

/**
 * Load saved progress from localStorage.
 * @returns {boolean} true if a stored save was found but could not be read
 *   (corrupted JSON), so the caller can surface it to the user.
 */
export function loadSaved(s) {
  let loadError = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.done === 'object') s.done = parsed.done;
    }
  } catch {
    loadError = true;   // corrupted data — start fresh, but tell the user
  }
  loadPrefs(s);
  loadProfile(s);
  loadPlaybooks(s);
  loadAtlas(s);
  // View always derives from the URL hash, not storage.
  s.view = viewFromHash();
  s.ui.intelSel = intelFromHash();
  s.ui.flowFocus = s.view === 'flow' ? flowFocusFromHash() : null;
  s.ui.classSelecting = profileSelectFromHash();
  return loadError;
}

// ── Profile (class + credentials) ──────────────────────────

/** Merge a stored profile over the defaults (missing keys keep defaults). */
export function loadProfile(s) {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Migrate legacy single-class saves into the new classIds array.
        const ids = Array.isArray(parsed.classIds) ? parsed.classIds : [];
        if (CLASS_BY_ID[parsed.classId] && !ids.includes(parsed.classId)) {
          ids.unshift(parsed.classId);
        }
        s.profile.classIds = ids.slice(0, 2).filter(id => CLASS_BY_ID[id]);
        if (parsed.creds && typeof parsed.creds === 'object') s.profile.creds = parsed.creds;
      }
    }
  } catch { /* corrupted profile — keep the defaults */ }
}

/** Persist the profile. Shape matches a future Convex `profiles` row. */
export function saveProfile(s) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(s.profile));
  } catch { /* quota exceeded or private browsing */ }
}

/** Toggle a class in the profile. Up to two classes can be active. */
export function setClass(s, classId) {
  if (!CLASS_BY_ID[classId]) return;
  const ids = s.profile.classIds || [];
  const idx = ids.indexOf(classId);
  if (idx > -1) {
    ids.splice(idx, 1);
  } else if (ids.length < 2) {
    ids.push(classId);
  }
  s.profile.classIds = ids;
  s.profile.classId = ids[0] || null;
  saveProfile(s);
}

/** Clear all selected classes and persist. */
export function clearClasses(s) {
  s.profile.classIds = [];
  s.profile.classId = null;
  saveProfile(s);
}

/**
 * Upsert a credential record for a cert. `record` carries the credential id,
 * issuer, issue/expiry dates, and status. An empty record (no id, status reset
 * to in-progress, no dates) is treated as "cleared" and removed.
 */
export function setCredential(s, certId, record) {
  if (!certId) return;
  const empty = !record || (!record.id && !record.issued && !record.expires
    && (!record.status || record.status === 'in-progress'));
  if (empty) delete s.profile.creds[certId];
  else s.profile.creds[certId] = { ...record };
  saveProfile(s);
}

/** Remove a credential record entirely. */
export function clearCredential(s, certId) {
  delete s.profile.creds[certId];
  saveProfile(s);
}

// ── Playbooks (editable workflows) ─────────────────────────

/** Load saved playbooks, or seed from the shipped examples on first run. */
export function loadPlaybooks(s) {
  try {
    const raw = localStorage.getItem(PLAYBOOKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) { s.playbooks = parsed; return; }
    }
  } catch { /* corrupted — fall through to seed */ }
  // First run (or corrupted): deep-clone the seeds so edits never mutate data.
  s.playbooks = PLAYBOOKS.map(p => ({ ...p, steps: p.steps.map(st => ({ ...st })) }));
  bumpPlaybooksVersion();
  savePlaybooks(s);
}

/** Persist the playbooks list. */
export function savePlaybooks(s) {
  bumpPlaybooksVersion();
  try {
    localStorage.setItem(PLAYBOOKS_KEY, JSON.stringify(s.playbooks));
  } catch { /* quota exceeded or private browsing */ }
}

// ── Atlas (uploaded team topology) ───────────────────────────

/** Load uploaded atlas topology, or keep the shipped sample on first run. */
export function loadAtlas(s) {
  try {
    const raw = localStorage.getItem(ATLAS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.teams)) {
        s.atlas.teams = parsed.teams;
        return;
      }
    }
  } catch { /* corrupted — keep the sample */ }
  s.atlas.teams = null;
}

/** Persist the uploaded atlas topology. */
export function saveAtlas(s) {
  try {
    localStorage.setItem(ATLAS_KEY, JSON.stringify({ teams: s.atlas.teams }));
  } catch { /* quota exceeded or private browsing */ }
}

/** Replace the atlas topology with an uploaded set. */
export function setAtlasTeams(s, teams) {
  s.atlas.teams = teams;
  saveAtlas(s);
}

/** A short unique id for a new playbook or step (no Date/Math.random reliance). */
let _idSeq = 0;
let _playbooksVersion = 0;
function uid(prefix) {
  _idSeq += 1;
  return `${prefix}-${Date.now().toString(36)}-${_idSeq}`;
}

/** Monotonic version for the editable playbooks list. Anything that mutates
 *  playbooks bumps this so consumers (e.g. the search index) know to rebuild. */
export function getPlaybooksVersion() { return _playbooksVersion; }
function bumpPlaybooksVersion() { _playbooksVersion += 1; }

/** Add a new (empty) playbook and return it. */
export function addPlaybook(s, fields = {}) {
  const pb = {
    id: uid('pb'),
    title: fields.title || 'New playbook',
    icon: fields.icon || 'route',
    category: fields.category || 'Process',
    summary: fields.summary || '',
    estMinutes: fields.estMinutes || null,
    steps: [],
  };
  s.playbooks.push(pb);
  savePlaybooks(s);
  return pb;
}

/** Patch fields on a playbook by id. */
export function updatePlaybook(s, id, patch) {
  const pb = s.playbooks.find(p => p.id === id);
  if (!pb) return;
  Object.assign(pb, patch);
  savePlaybooks(s);
}

/** Delete a playbook by id. */
export function deletePlaybook(s, id) {
  s.playbooks = s.playbooks.filter(p => p.id !== id);
  if (s.ui.playbookSel === id) s.ui.playbookSel = null;
  savePlaybooks(s);
}

/** Append a step to a playbook and return it. */
export function addStep(s, playbookId, fields = {}) {
  const pb = s.playbooks.find(p => p.id === playbookId);
  if (!pb) return null;
  const step = { id: uid('st'), title: fields.title || 'New step', body: fields.body || '' };
  if (fields.link) step.link = fields.link;
  pb.steps.push(step);
  savePlaybooks(s);
  return step;
}

/** Patch a step within a playbook. */
export function updateStep(s, playbookId, stepId, patch) {
  const pb = s.playbooks.find(p => p.id === playbookId);
  const step = pb?.steps.find(st => st.id === stepId);
  if (!step) return;
  Object.assign(step, patch);
  savePlaybooks(s);
}

/** Delete a step from a playbook. */
export function deleteStep(s, playbookId, stepId) {
  const pb = s.playbooks.find(p => p.id === playbookId);
  if (!pb) return;
  pb.steps = pb.steps.filter(st => st.id !== stepId);
  savePlaybooks(s);
}

/** Move a step up or down within its playbook (dir −1 up, +1 down). */
export function moveStep(s, playbookId, stepId, dir) {
  const pb = s.playbooks.find(p => p.id === playbookId);
  if (!pb) return;
  const i = pb.steps.findIndex(st => st.id === stepId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= pb.steps.length) return;
  [pb.steps[i], pb.steps[j]] = [pb.steps[j], pb.steps[i]];
  savePlaybooks(s);
}

/** Persist progress (not the transient view). */
export function save(s) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ done: s.done }));
  } catch { /* quota exceeded or private browsing */ }
}

/** Merge stored preferences over the defaults (missing keys keep defaults). */
export function loadPrefs(s) {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') Object.assign(s.prefs, parsed);
    }
  } catch { /* corrupted prefs — keep the defaults */ }
}

/** Persist preferences. */
export function savePrefs(s) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(s.prefs));
  } catch { /* quota exceeded or private browsing */ }
}

/** Toggle keyboard movement on/off and persist. */
export function setKeyboardNav(s, on) {
  s.prefs.keyboardNav = !!on;
  savePrefs(s);
}

/** Mark the six-shifts briefing read (or unread) and persist. */
export function setShiftsRead(s, read) {
  s.prefs.shiftsRead = !!read;
  savePrefs(s);
}

/** Toggle the Flow full-map reveal (vs fog-of-war) and persist. */
export function setShowFullMap(s, on) {
  s.prefs.showFullMap = !!on;
  savePrefs(s);
}

/** Toggle certification ladder visibility in the Profile tab. */
export function setShowClassSheets(s, on) {
  s.prefs.showClassSheets = !!on;
  savePrefs(s);
}

/** Wipe all progress. */
export function resetProgress(s) {
  s.done = {};
  save(s);
}

/**
 * Wipe every persisted save slot: progress, preferences, profile, playbooks,
 * and engagement. Used by the System reset confirmation.
 */
export function resetAll(s) {
  s.done = {};
  s.prefs = { keyboardNav: true, shiftsRead: false, showFullMap: true, showClassSheets: true };
  s.profile = { classId: null, classIds: [], creds: {} };
  s.playbooks = [];
  bumpPlaybooksVersion();
  s.atlas = { teams: null };
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFS_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(PLAYBOOKS_KEY);
    localStorage.removeItem(ENGAGEMENT_KEY);
    localStorage.removeItem(ATLAS_KEY);
  } catch { /* private mode / no storage */ }
}

/** Put back a snapshot of `done` (used by the post-reset Undo). */
export function restoreProgress(s, snapshot) {
  s.done = { ...snapshot };
  save(s);
}

/**
 * Resolve the URL hash to a view:
 *   'flow'          → the chapter flowchart
 *   'intel/<id>'    → the Intel tab with a term selected (deep-linkable)
 *   <tab id>        → a console tab (brief, chapters, priority, intel, system)
 *   <branch id>     → a chapter detail page (Chapters tab, that chapter open)
 * Anything else defaults to the Brief tab (the console home).
 */
export function viewFromHash() {
  const id = (location.hash || '').replace(/^#/, '');
  if (id === 'flow' || id === 'home' || id.startsWith('flow/')) return 'flow';
  if (id.startsWith('intel/')) return 'intel';
  if (id === 'profile/select') return 'profile';
  if (TAB_IDS.includes(id)) return id;
  if (BRANCH_BY_ID[id]) return id;
  return 'brief';
}

/** True when the hash requests the dedicated class-select screen. */
export function profileSelectFromHash() {
  return (location.hash || '').replace(/^#/, '') === 'profile/select';
}

/** The focused branch id encoded in the Flow hash (#flow/<id>), or null. */
export function flowFocusFromHash() {
  const id = (location.hash || '').replace(/^#/, '');
  if (!id.startsWith('flow/')) return null;
  const branchId = id.slice('flow/'.length);
  return BRANCH_BY_ID[branchId] ? branchId : null;
}

/** The selected Intel term id encoded in the hash (#intel/<id>), or null. */
export function intelFromHash() {
  const id = (location.hash || '').replace(/^#/, '');
  if (!id.startsWith('intel/')) return null;
  const termId = id.slice('intel/'.length);
  return INTEL_BY_ID[termId] ? termId : null;
}

/** Is this view one of the console shell tabs? */
export function isTab(view) {
  return TAB_IDS.includes(view);
}

/** Is this view a chapter detail page? */
export function isBranchView(view) {
  return !!BRANCH_BY_ID[view];
}

/** Toggle a single skill node's completion. */
export function toggleNode(s, nodeId) {
  if (s.done[nodeId]) delete s.done[nodeId];
  else s.done[nodeId] = true;
  save(s);
}

/** Mark every node in a branch complete (or clear them all). */
export function setBranchDone(s, branchId, value) {
  const branch = BRANCH_BY_ID[branchId];
  if (!branch) return;
  branch.nodes.forEach(n => {
    if (value) s.done[n.id] = true;
    else delete s.done[n.id];
  });
  save(s);
}

// ── Derived selectors ──────────────────────────────────────

/** How many nodes in a branch are complete. */
export function branchProgress(s, branchId) {
  const branch = BRANCH_BY_ID[branchId];
  if (!branch) return { done: 0, total: 0 };
  const done = branch.nodes.filter(n => s.done[n.id]).length;
  return { done, total: branch.nodes.length };
}

/** A branch is complete when all its nodes are done. */
export function isBranchComplete(s, branchId) {
  const p = branchProgress(s, branchId);
  return p.total > 0 && p.done === p.total;
}

/** A branch is unlocked when every prerequisite branch is complete. */
export function isBranchUnlocked(s, branchId) {
  const branch = BRANCH_BY_ID[branchId];
  if (!branch) return false;
  return branch.prereq.every(pid => isBranchComplete(s, pid));
}

/** Branch status: 'locked' | 'available' | 'in-progress' | 'complete'. */
export function branchStatus(s, branchId) {
  if (!isBranchUnlocked(s, branchId)) return 'locked';
  if (isBranchComplete(s, branchId)) return 'complete';
  const p = branchProgress(s, branchId);
  return p.done > 0 ? 'in-progress' : 'available';
}

/** Overall completion as a 0–100 integer. */
export function overallPercent(s) {
  const done = Object.keys(s.done).filter(id => isLiveNode(id)).length;
  return TOTAL_NODES ? Math.round((done / TOTAL_NODES) * 100) : 0;
}

/** Guard against stale node ids left in storage after content edits. */
function isLiveNode(nodeId) {
  return BRANCHES.some(b => b.nodes.some(n => n.id === nodeId));
}

/** Current rank for a completion percentage. */
export function rankFor(percent) {
  let current = RANKS[0];
  for (const r of RANKS) if (percent >= r.at) current = r;
  return current;
}

/**
 * Is an Intel term available? The glossary is open: every term is readable
 * from the start so people can navigate straight to a definition. (Earlier the
 * codex was gated behind chapter completion; that gate is gone by request.)
 */
export function isIntelUnlocked(s, termId) {
  return !!INTEL_BY_ID[termId];
}

/** Intel terms a chapter teaches that just became unlocked by clearing it. */
export function intelUnlockedBy(s, branchId) {
  return INTEL.filter(t => t.chapter === branchId && isBranchComplete(s, branchId));
}

/** Flat flow-node order (tier rows, top to bottom), for grid arrow nav. */
export function flowOrder() {
  return [...BRANCHES].sort((a, b) => a.tier - b.tier || 0).map(b => b.id);
}

/**
 * Reveal-as-you-go: a chapter is visible on the full Flow map once it is
 * unlocked (all prerequisites complete). Locked future chapters stay hidden,
 * so the map literally grows as you clear chapters, like fog lifting.
 */
export function isFlowVisible(s, branchId) {
  return isBranchUnlocked(s, branchId);
}

/** Branch ids currently revealed on the full map, in flow order. With the
 *  showFullMap preference on, every chapter is shown (locked ones dimmed);
 *  otherwise it is fog-of-war: only unlocked chapters appear. */
export function visibleFlowOrder(s) {
  if (s.prefs.showFullMap) return flowOrder();
  return flowOrder().filter(id => isFlowVisible(s, id));
}

/** Branch ids that list `branchId` as a prerequisite (its downstream paths). */
export function childrenOf(branchId) {
  return BRANCHES.filter(b => b.prereq.includes(branchId)).map(b => b.id);
}

/**
 * The local map around a focused chapter: its prerequisites (upstream),
 * the chapter itself, and the chapters it unlocks (downstream) — shown even
 * when still locked, so the focus view reads as a plan of where this leads.
 * Returned grouped by relation for a clean three-row mini-map.
 */
export function focusMap(branchId) {
  const branch = BRANCH_BY_ID[branchId];
  if (!branch) return { parents: [], focus: null, children: [] };
  return {
    parents: branch.prereq.slice(),
    focus: branchId,
    children: childrenOf(branchId),
  };
}

/** Flat node order within a focus map (parents, focus, children), for arrows. */
export function focusOrder(branchId) {
  const { parents, focus, children } = focusMap(branchId);
  return [...parents, focus, ...children].filter(Boolean);
}

/** Clamp an index into [0, len) with wrap-around. */
export function wrapIndex(i, len) {
  if (len <= 0) return 0;
  return ((i % len) + len) % len;
}
