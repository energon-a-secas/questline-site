/* Theme toggle — flips <html data-theme> and persists the choice. */

const ICON_SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"/></svg>';
const ICON_MOON = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.4 14.2A8.5 8.5 0 0 1 9.8 3.6a8.5 8.5 0 1 0 10.6 10.6z"/></svg>';

export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('questline-theme', theme); } catch (e) {}
  syncToggle(theme);
}

export function toggleTheme() {
  setTheme(currentTheme() === 'light' ? 'dark' : 'light');
}

function syncToggle(theme) {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = theme === 'light' ? ICON_MOON : ICON_SUN;
  const label = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';
  btn.setAttribute('aria-label', label);
  btn.title = label;
}

export function initTheme() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  syncToggle(currentTheme());
  btn.addEventListener('click', toggleTheme);
}
