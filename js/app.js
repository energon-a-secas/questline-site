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
import { showToast } from './utils.js';

function init() {
  const loadError = loadSaved(state);
  initGlossary(state);
  render(state);
  bindEvents(state);
  initQuickMenu();
  initKeyNav();
  if (loadError) {
    showToast('Saved progress could not be read — starting fresh.');
    return;
  }
  // Boot splash first (if due), then the first-run coach once it is dismissed,
  // so the order reads boot → continue → learn the controls.
  maybeShowSplash(maybeShowCoach);
}

init();
