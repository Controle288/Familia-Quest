import React from 'react';
import { useMode } from '../context/ModeContext';
import { APP_MODES, AppMode } from '../lib/mode';

/** Seletor global ÚNICO de modo (Kids / Teen / Adult).
 *  Vive ao lado do cabeçalho principal e controla o tema de todo o app. */
export const ModeSelector: React.FC = () => {
  const { mode, setMode } = useMode();

  return (
    <div
      role="group"
      aria-label="Modo de exibição"
      className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1"
    >
      {APP_MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id as AppMode)}
            title={`${m.label} — ${m.desc}`}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
              active
                ? 'bg-[var(--brand)] text-white shadow'
                : 'text-[var(--text-muted)] hover:text-[var(--brand)]'
            }`}
          >
            <span className="text-sm leading-none">{m.emoji}</span>
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
};
