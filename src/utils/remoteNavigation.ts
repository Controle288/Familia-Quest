// Remote-control navigation helper with 2D (grid-aware) focus movement
// - Arrow keys move focus to the nearest element in the pressed direction
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

    // If nothing focused, focus first
    if (!active || focusables.indexOf(active) === -1) {
      focusables[0].focus();
      e.preventDefault();
      return;
    }

    const dir = key;
    if (dir === 'Enter' || dir === 'Return') {
      try { (active as HTMLElement).click(); } catch (err) {}
      e.preventDefault();
      return;
    }

    const currentRect = active.getBoundingClientRect();
    const currentCenter = { x: currentRect.left + currentRect.width / 2, y: currentRect.top + currentRect.height / 2 };

    // Candidates in the intended direction
    const candidates = focusables
      .filter((el) => el !== active)
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .filter(({ rect }) => isVisibleRect(rect));

    let best = null as { el: HTMLElement; score: number } | null;

    for (const { el, rect } of candidates) {
      const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const dx = center.x - currentCenter.x;
      const dy = center.y - currentCenter.y;
      // For each direction, we require candidates to be mostly in that direction
      let valid = false;
      let score = Infinity;
      if (dir === 'ArrowRight') {
        valid = dx > 10;
        score = Math.hypot(dx, dy * 1.2);
      } else if (dir === 'ArrowLeft') {
        valid = dx < -10;
        score = Math.hypot(dx, dy * 1.2);
      } else if (dir === 'ArrowDown') {
        valid = dy > 10;
        score = Math.hypot(dy, dx * 1.2);
      } else if (dir === 'ArrowUp') {
        valid = dy < -10;
        score = Math.hypot(dy, dx * 1.2);
      }

      if (!valid) continue;

      if (!best || score < best.score) best = { el, score };
    }

    if (best) {
      best.el.focus();
      e.preventDefault();
      return;
    }

    // Fallback: linear navigation
    const idx = focusables.indexOf(active);
    if (dir === 'ArrowRight' || dir === 'ArrowDown') {
      const next = focusables[(idx + 1) % focusables.length];
      next.focus();
      e.preventDefault();
      return;
    }
    if (dir === 'ArrowLeft' || dir === 'ArrowUp') {
      const prev = focusables[(idx - 1 + focusables.length) % focusables.length];
      prev.focus();
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

function isVisibleRect(rect: DOMRect) {
  return rect.width > 0 && rect.height > 0 && (rect.bottom > 0 && rect.right > 0);
}
