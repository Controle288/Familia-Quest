// Modo global de estilização por faixa etária: Kids, Teen/Gamer e Adult/Clean.
// O modo é aplicado como atributo `data-mode` no <html> e persiste em
// localStorage, sendo carregado antes do primeiro render (sem flash).

export type AppMode = 'kids' | 'teen' | 'adult';

export interface ModeDef {
  id: AppMode;
  label: string;
  emoji: string;
  desc: string;
}

export const APP_MODES: ModeDef[] = [
  { id: 'kids', label: 'Kids', emoji: '🧸', desc: 'Lúdico, colorido e arredondado' },
  { id: 'teen', label: 'Teen / Gamer', emoji: '🎮', desc: 'Dark Neon estilo RPG' },
  { id: 'adult', label: 'Adult / Clean', emoji: '💼', desc: 'Minimalista fintech' },
];

export const DEFAULT_MODE: AppMode = 'adult';

const MODE_STORAGE_KEY = 'fq_mode';

export function isAppMode(value: unknown): value is AppMode {
  return value === 'kids' || value === 'teen' || value === 'adult';
}

/** Lê o modo salvo (ou o padrão) sem lançar erro se o storage estiver indisponível. */
export function getStoredMode(): AppMode {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (isAppMode(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_MODE;
}

/** Aplica o modo no documento (data-mode + dark para o modo teen) e persiste. */
export function applyMode(mode: AppMode): void {
  const root = document.documentElement;
  root.setAttribute('data-mode', mode);
  // O modo Teen/Gamer é escuro por definição; Kids e Adult são claros.
  if (mode === 'teen') root.classList.add('dark');
  else root.classList.remove('dark');
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}
