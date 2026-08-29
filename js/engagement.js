// ── Engagement & retention ───────────────────────────────────
// Tracks daily visits, streaks, and surfaces a "Today's Focus" recommendation
// to make returning feel rewarding. All data is local; nothing leaves the device.

import { showToast } from './utils.js';
import { BRANCHES, BRANCH_BY_ID } from './data.js';
import { branchStatus, branchProgress, overallPercent, rankFor } from './state.js';

const ENGAGEMENT_KEY = 'questline-engagement';

/** Engagement state shape. */
function defaultEngagement() {
  return {
    lastVisit: null,      // ISO date string YYYY-MM-DD
    streak: 0,            // consecutive days
    longestStreak: 0,
    visits: 0,            // total sessions
    tipsSeen: [],         // tip indices already shown
    todayTipIndex: null,  // tip pinned for the current day
    lastTipDate: null,    // ISO date of the pinned tip
    focusDismissed: null, // date when today's focus was dismissed
    lastFocusBranchId: null, // chapter the user last opened from Today's Focus
    dispatchShownDate: null, // date the daily dispatch was last auto-shown
    dispatchDismissed: [],   // banner ids the user has hidden permanently
    dispatchSnooze: null,    // date the daily dispatch was snoozed until
  };
}

/** Read engagement state from localStorage. */
function loadEngagement() {
  try {
    const raw = localStorage.getItem(ENGAGEMENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...defaultEngagement(), ...parsed };
    }
  } catch { /* corrupted */ }
  return defaultEngagement();
}

/** Write engagement state. */
function saveEngagement(e) {
  try { localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(e)); } catch { /* quota */ }
}

/** Today's date as YYYY-MM-DD in local time. */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Yesterday's date as YYYY-MM-DD. */
function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── Daily visit tracking ────────────────────────────────────

/**
 * Call once per app boot. Updates streaks, visit count, and returns a greeting
 * string + streak info for the welcome toast.
 */
export function recordVisit() {
  const e = loadEngagement();
  const today = todayStr();
  const yesterday = yesterdayStr();

  if (e.lastVisit === today) {
    // Same day: just increment visits silently
    e.visits += 1;
    saveEngagement(e);
    return null; // no welcome toast on same-day refresh
  }

  // New day
  e.visits += 1;
  if (e.lastVisit === yesterday) {
    e.streak += 1;
  } else {
    e.streak = 1; // broken streak or first visit
  }
  e.lastVisit = today;
  if (e.streak > e.longestStreak) e.longestStreak = e.streak;
  saveEngagement(e);

  const pct = overallPercent(stateRef);
  const rank = rankFor(pct);
  const greeting = greetingForHour();

  let msg = `${greeting} You're ${rank.name.toLowerCase()} · ${pct}% complete`;
  if (e.streak > 1) {
    msg += ` · ${e.streak}-day streak`;
  }
  return { msg, streak: e.streak, rank: rank.name, pct };
}

/** Pick a greeting based on local hour. */
function greetingForHour() {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil?';
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

// ── Today's Focus ────────────────────────────────────────────

/**
 * Recommend the next best action based on current progress.
 * Returns an object with title, blurb, cta, and href — or null if nothing
 * urgent (everything complete, or focus already dismissed today).
 */
export function todaysFocus(s) {
  const e = loadEngagement();
  const today = todayStr();
  if (e.focusDismissed === today) return null;

  // Build candidate list: unlocked and not complete.
  const candidates = BRANCHES.filter(b => {
    const status = branchStatus(s, b.id);
    return status !== 'locked' && status !== 'complete';
  });

  let chosen = null;

  if (candidates.length) {
    // Prefer the branch with the highest partial progress.
    const scored = candidates.map(b => {
      const { done, total } = branchProgress(s, b.id);
      const pct = total ? done / total : 0;
      return { b, done, total, pct };
    }).sort((a, b) => b.pct - a.pct);

    const topPct = scored[0].pct;
    const ties = scored.filter(x => x.pct === topPct);

    // If there is a tie for top progress, prefer the branch the user last
    // opened from Today's Focus so returning users pick up where they left off.
    const lastTie = ties.find(x => x.b.id === e.lastFocusBranchId);
    chosen = lastTie || ties[0];
  }

  if (!chosen) {
    // No partial progress anywhere: fall back to tree order, but prefer the
    // last focused branch if it is still available.
    const fallback = e.lastFocusBranchId
      && BRANCH_BY_ID[e.lastFocusBranchId]
      && branchStatus(s, e.lastFocusBranchId) !== 'locked'
      && branchStatus(s, e.lastFocusBranchId) !== 'complete'
      ? BRANCH_BY_ID[e.lastFocusBranchId]
      : BRANCHES.find(b => {
          const status = branchStatus(s, b.id);
          return status !== 'locked' && status !== 'complete';
        });
    if (fallback) {
      const { done, total } = branchProgress(s, fallback.id);
      chosen = { b: fallback, done, total, pct: total ? done / total : 0 };
    }
  }

  if (chosen) {
    const { b, done, total } = chosen;
    const remaining = total - done;
    const nodes = b.nodes.filter(n => !s.done[n.id]);
    const nextNode = nodes[0];

    return {
      title: b.title,
      blurb: nextNode
        ? `${nextNode.title}: ${nextNode.body || nextNode.list?.[0] || 'Next skill to unlock'}`
        : `${remaining} skill${remaining === 1 ? '' : 's'} left in this chapter`,
      cta: 'Continue',
      href: `#${b.id}`,
      chapterId: b.id,
      nodeId: nextNode?.id || null,
    };
  }

  // Everything complete — celebrate and nudge toward profile
  const pct = overallPercent(s);
  if (pct >= 100) {
    return {
      title: 'Full clear',
      blurb: 'Every chapter is complete. Add certifications to your Profile or explore Playbooks.',
      cta: 'Open Profile',
      href: '#profile',
    };
  }

  return null;
}

/** Dismiss today's focus until tomorrow. */
export function dismissFocus() {
  const e = loadEngagement();
  e.focusDismissed = todayStr();
  saveEngagement(e);
}

const FOCUS_GLYPH = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>`;

/** Render HTML for the Today's Focus widget. */
export function focusWidgetHtml(s) {
  const focus = todaysFocus(s);
  if (!focus) return '';
  const e = loadEngagement();
  const streakBadge = e.streak > 1
    ? `<span class="focus__streak">${e.streak}-day streak</span>`
    : '';
  return `
    <div class="focus__card" id="todaysFocus">
      <span class="focus__glyph" aria-hidden="true">${FOCUS_GLYPH}</span>
      <div class="focus__main">
        <div class="focus__head">
          <span class="focus__kicker">Today's Focus</span>
          ${streakBadge}
        </div>
        <strong class="focus__title">${focus.title}</strong>
        <p class="focus__blurb">${focus.blurb}</p>
      </div>
      <div class="focus__actions">
        <button type="button" class="focus__dismiss" id="dismissFocus" aria-label="Dismiss today's focus">×</button>
        <a class="btn btn--primary btn--sm" href="${focus.href}" data-focus-cta="${focus.chapterId || ''}">${focus.cta}</a>
      </div>
    </div>`;
}

// ── Daily Tip ────────────────────────────────────────────────

const TIP_GLYPH = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

const TIPS = [
  { title: 'Keyboard shortcut', body: 'Press / from anywhere to open the global search.' },
  { title: 'Quick menu', body: 'Hold Esc and point with arrows to jump between tabs instantly.' },
  { title: 'Chapter reader', body: 'Open a chapter with Enter to read and mark sections complete.' },
  { title: 'Deep links', body: 'Share any Intel term by copying its URL: every term has its own hash.' },
  { title: 'Flow map', body: 'The Flow tab reveals chapters as you progress. Toggle the full map in System.' },
  { title: 'Profile classes', body: 'Pick an engineer class in Profile to see a certification ladder for your path.' },
  { title: 'Playbooks', body: 'Add your own workflows in Playbooks: they persist and are fully editable.' },
  { title: 'Glossary hover', body: 'Hover underlined terms in any panel for an instant definition popover.' },
];

/** Return a tip the user has not seen recently, or a random one. */
export function nextTip() {
  const e = loadEngagement();
  // Find tips not in the recent seen list
  const unseen = TIPS.map((t, i) => i).filter(i => !e.tipsSeen.includes(i));
  const pool = unseen.length ? unseen : [0, 1, 2, 3, 4, 5, 6, 7];
  const idx = pool[Math.floor(Math.random() * pool.length)];
  // Rotate seen list: keep last 4, add current
  e.tipsSeen = [...e.tipsSeen.filter(i => i !== idx).slice(-3), idx];
  // Pin the freshly rotated tip as today's tip so the refresh button works.
  e.todayTipIndex = idx;
  e.lastTipDate = todayStr();
  saveEngagement(e);
  return { ...TIPS[idx], index: idx };
}

/** Pin today's tip: rotate only when the day changes or the user asks for it. */
function todayTip() {
  const e = loadEngagement();
  const today = todayStr();
  if (e.lastTipDate !== today || e.todayTipIndex == null) {
    const tip = nextTip();
    e.lastTipDate = today;
    e.todayTipIndex = tip.index;
    saveEngagement(e);
    return tip;
  }
  return { ...TIPS[e.todayTipIndex], index: e.todayTipIndex };
}

/** Render HTML for a compact daily tip. */
export function tipWidgetHtml() {
  const tip = todayTip();
  return `
    <div class="tip__card" id="dailyTip">
      <span class="tip__icon" aria-hidden="true">${TIP_GLYPH}</span>
      <div class="tip__main">
        <span class="tip__kicker">Tip · ${tip.title}</span>
        <p class="tip__body">${tip.body}</p>
      </div>
      <button type="button" class="tip__next" id="nextTip" aria-label="Next tip">↻</button>
    </div>`;
}

/** Persist the chapter a user opened from Today's Focus. */
export function setFocusBranchId(branchId) {
  const e = loadEngagement();
  e.lastFocusBranchId = branchId || null;
  saveEngagement(e);
}

// ── Progress Share Snippet ───────────────────────────────────

/** Build a short, human-readable progress summary for sharing. */
export function shareSnippet(s) {
  const pct = overallPercent(s);
  const rank = rankFor(pct);
  const e = loadEngagement();
  const lines = [
    `Questline: ${rank.name}`,
    `${pct}% complete · ${e.streak > 1 ? e.streak + '-day streak' : 'onboarding'}`,
    'https://questline.neorgon.com/',
  ];
  return lines.join('\n');
}

// ── Daily Dispatch helpers ──────────────────────────────────

/** Load engagement and return the current dispatch state. */
export function loadDispatchState() {
  const e = loadEngagement();
  return {
    shownDate: e.dispatchShownDate || null,
    dismissed: e.dispatchDismissed || [],
    snooze: e.dispatchSnooze || null,
  };
}

/** Mark the daily dispatch as shown today. */
export function markDispatchShown() {
  const e = loadEngagement();
  e.dispatchShownDate = todayStr();
  e.dispatchSnooze = null;
  saveEngagement(e);
}

/** Permanently dismiss a banner from the daily dispatch. */
export function dismissDispatchBanner(id) {
  const e = loadEngagement();
  if (!e.dispatchDismissed) e.dispatchDismissed = [];
  if (!e.dispatchDismissed.includes(id)) e.dispatchDismissed.push(id);
  saveEngagement(e);
}

/** Snooze the daily dispatch until tomorrow. */
export function snoozeDispatch() {
  const e = loadEngagement();
  e.dispatchSnooze = todayStr();
  saveEngagement(e);
}

/** Reset dispatch snooze so the user can reopen it today. */
export function clearDispatchSnooze() {
  const e = loadEngagement();
  e.dispatchSnooze = null;
  saveEngagement(e);
}

// ── Internal: hold a reference to state for recordVisit ─────
let stateRef = null;
export function setEngagementState(s) { stateRef = s; }
