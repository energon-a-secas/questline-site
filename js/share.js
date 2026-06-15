// ── Progress sharing ─────────────────────────────────────────
// Let users copy a short progress summary to clipboard or share via the
// native Web Share API where available.

import { showToast } from './utils.js';
import { shareSnippet } from './engagement.js';

/**
 * Share progress. Uses the native Web Share API on mobile when available,
 * otherwise copies a formatted snippet to the clipboard.
 */
export function shareProgress(s) {
  const text = shareSnippet(s);

  if (navigator.share && navigator.canShare?.({ text })) {
    navigator.share({ title: 'Questline Progress', text }).catch(() => {});
    return;
  }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => showToast('Progress copied to clipboard'))
      .catch(() => showToast('Could not copy'));
    return;
  }

  // Fallback for older browsers
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast('Progress copied to clipboard');
  } catch {
    showToast('Could not copy');
  }
  document.body.removeChild(ta);
}
