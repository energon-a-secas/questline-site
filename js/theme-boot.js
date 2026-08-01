/* Applies the stored theme before first paint (no FOUC). Loaded as a plain
   script in <head> — CSP forbids inline scripts, so this must be a file. */
(function () {
  var theme = 'dark';
  try { theme = localStorage.getItem('questline-theme') || 'dark'; } catch (e) {}
  document.documentElement.setAttribute('data-theme', theme);
})();
