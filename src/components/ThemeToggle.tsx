import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { toggleTheme, getStoredTheme } from '../lib/theme';

/** Compact light/dark mode switch. Reflects the current theme on mount. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState(() => getStoredTheme() === 'dark');

  const handleToggle = () => {
    const next = toggleTheme();
    setIsDark(next === 'dark');
  };

  return (
    <button
      onClick={handleToggle}
      title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-label="Alternar tema"
      className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-50 text-[#3525cd] transition-colors ${className}`}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};
