import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { toggleTheme, getStoredTheme } from '../lib/theme';
import { useMode } from '../context/ModeContext';

/** Compact light/dark mode switch. Reflects the current theme on mount.
 *  No modo Teen/Gamer o app é sempre escuro, então o toggle fica travado. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { mode } = useMode();
  const [isDark, setIsDark] = useState(() => getStoredTheme() === 'dark');
  const lockedDark = mode === 'teen';

  const handleToggle = () => {
    if (lockedDark) return;
    const next = toggleTheme();
    setIsDark(next === 'dark');
  };

  const dark = lockedDark || isDark;

  return (
    <button
      onClick={handleToggle}
      disabled={lockedDark}
      title={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-label="Alternar tema"
      className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--brand-soft)] text-[var(--brand)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
