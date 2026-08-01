// ── Entry point ──────────────────────────────────────────────
// Import modules and initialize the app.
// Keep this file under 50 lines — it only wires things together.

import { state, loadSaved } from './state.js';
import { render } from './render.js';
import { bindEvents } from './events.js';
import { initQuickMenu } from './quickmenu.js';
import { initKeyNav } from './keynav.js';
import { initGlossary } from './glossary.js';
import { maybeShowCoach } from './coach.js';
import { maybeShowSplash } from './splash.js';
import { maybeShowDaily, openDaily, updateBellDot } from './daily.js';
import { showToast } from './utils.js';
import { recordVisit, setEngagementState } from './engagement.js';
import { initParticles } from './particles.js';
import { initScrollProgress } from './scrollProgress.js';
import { initTheme } from './theme.js';

function init() {
  const loadError = loadSaved(state);
  initTheme();
  initGlossary(state);
  render(state);
  bindEvents(state);
  document.getElementById('openDaily')?.addEventListener('click', () => openDaily());
  initQuickMenu();
  initKeyNav();
  initParticles();
  initScrollProgress();
  setEngagementState(state);
  updateBellDot();

  // Welcome returning users after the first paint
  const welcome = recordVisit();
  if (welcome?.msg) showToast(welcome.msg);

  if (loadError) {
    showToast('Saved progress could not be read. Starting fresh.');
    return;
  }
  // Boot splash first (if due), then the first-run coach, then the daily
  // dispatch, so the order reads boot → continue → learn controls → today's news.
  maybeShowSplash(() => maybeShowCoach(maybeShowDaily));
}

init();
