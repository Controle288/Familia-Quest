import confetti from 'canvas-confetti';

export interface ThemeDef {
  id: string;
  label: string;
  emoji: string;
  premium: boolean;
  background: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: 'default', label: 'Padrão', emoji: '✨', premium: false, background: false },
  { id: 'ocean', label: 'Oceano', emoji: '🌊', premium: false, background: true },
  { id: 'sunset', label: 'Pôr do Sol', emoji: '🌅', premium: false, background: true },
  { id: 'forest', label: 'Floresta', emoji: '🌿', premium: false, background: true },
  { id: 'space', label: 'Espaço', emoji: '🚀', premium: true, background: true },
  { id: 'winx', label: 'Winx (Fadas)', emoji: '🧚', premium: true, background: true },
  { id: 'monica', label: 'Turma da Mônica', emoji: '📗', premium: true, background: true },
  { id: 'pokemon', label: 'Pokémon', emoji: '⚡', premium: true, background: true },
];

export const getTheme = (id: string): ThemeDef =>
  THEMES.find((t) => t.id === id) ?? THEMES[0];

/** Apply a theme + light/dark variant to the document root. */
export function applyThemePref(theme: string, variant: 'light' | 'dark') {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-variant', variant);
  if (variant === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  try {
    localStorage.setItem('fq_theme_pref', JSON.stringify({ theme, variant }));
  } catch {
    /* ignore */
  }
}

export function loadThemePref(): { theme: string; variant: 'light' | 'dark' } {
  try {
    const raw = localStorage.getItem('fq_theme_pref');
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { theme: 'default', variant: 'light' };
}

/** Magical "glitter" burst used by themed buttons (e.g. Winx). */
export function fireGlitter() {
  const colors = ['#ffd1f3', '#c4a3ff', '#9be7ff', '#fff3b0', '#ff9ed8'];
  const fire = (particleRatio: number, opts: confetti.Options) => {
    confetti({
      origin: { y: 0.7 },
      colors,
      particleCount: Math.floor(160 * particleRatio),
      ...opts,
    });
  };
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}
