// ── Scroll progress indicator ────────────────────────────────
// A thin azure line at the top of the viewport that fills as the user scrolls.

let bar = null;

export function initScrollProgress() {
  if (bar) return;
  bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  const onScroll = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${pct}%`;
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
