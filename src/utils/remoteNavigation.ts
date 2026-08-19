// Simple remote-control navigation helper
// - Arrow keys move focus forward/backward through focusable elements
// - Enter triggers click on focused element

export function initRemoteNavigation() {
  const handler = (e: KeyboardEvent) => {
    const key = e.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Return', 'Escape', 'Backspace'].includes(key)) return;

    const focusables = Array.from(document.querySelectorAll<HTMLElement>(
      'button,a,input,select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])'
    )).filter((el) => isVisible(el));

    if (focusables.length === 0) return;

    const active = document.activeElement as HTMLElement | null;
    let idx = focusables.indexOf(active as HTMLElement);

    // If nothing focused, focus first
    if (idx === -1) {
      focusables[0].focus();
      e.preventDefault();
      return;
    }

    if (key === 'Enter' || key === 'Return') {
      try { (focusables[idx] as HTMLElement).click(); } catch (err) {}
      e.preventDefault();
      return;
    }

    // Map arrow keys to linear movement
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      idx = (idx + 1) % focusables.length;
      focusables[idx].focus();
      e.preventDefault();
      return;
    }

    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      idx = (idx - 1 + focusables.length) % focusables.length;
      focusables[idx].focus();
      e.preventDefault();
      return;
    }
  };

  window.addEventListener('keydown', handler);

  return () => window.removeEventListener('keydown', handler);
}

function isVisible(el: HTMLElement) {
  if (!el) return false;
  const style = getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}
