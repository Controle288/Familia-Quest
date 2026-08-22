import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppMode, applyMode, getStoredMode } from '../lib/mode';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>(() => getStoredMode());

  // Garante que o atributo no <html> reflita o estado inicial (caso o valor
  // tenha sido lido antes do provider montar).
  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  const setMode = (next: AppMode) => {
    applyMode(next);
    setModeState(next);
  };

  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
};

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode deve ser usado dentro de <ModeProvider>');
  return ctx;
}
