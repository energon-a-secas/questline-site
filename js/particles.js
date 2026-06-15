// ── Ambient background particles ─────────────────────────────
// Subtle floating particles that rise slowly behind the console, giving the
// page a "living" feel without distracting from the content. Respects
// prefers-reduced-motion and is removed on touch devices to save battery.

const PARTICLE_COUNT = 18;
let container = null;

export function initParticles() {
  // Respect reduced motion
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  // Skip on coarse-pointer (touch) devices to preserve battery
  if (window.matchMedia?.('(pointer: coarse)').matches) return;

  container = document.createElement('div');
  container.className = 'particles';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    spawnParticle(true);
  }
}

function spawnParticle(randomY = false) {
  if (!container) return;
  const p = document.createElement('div');
  p.className = 'particle';

  const size = Math.random() * 3 + 1; // 1–4px
  const left = Math.random() * 100;
  const duration = Math.random() * 20 + 15; // 15–35s
  const delay = randomY ? Math.random() * -duration : 0;

  p.style.width = `${size}px`;
  p.style.height = `${size}px`;
  p.style.left = `${left}%`;
  p.style.animationDuration = `${duration}s`;
  p.style.animationDelay = `${delay}s`;

  // Vary color between accent and gold subtly
  const isGold = Math.random() > 0.8;
  p.style.background = isGold ? 'var(--gold)' : 'var(--accent)';
  p.style.boxShadow = isGold
    ? '0 0 6px rgba(255,206,77,.4)'
    : '0 0 6px var(--accent-glow)';

  container.appendChild(p);

  // Remove and respawn after animation ends to keep DOM light
  const totalMs = (duration + (delay < 0 ? -delay : 0)) * 1000;
  setTimeout(() => {
    p.remove();
    spawnParticle();
  }, totalMs + 500);
}
