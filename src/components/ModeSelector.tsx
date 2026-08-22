import React from 'react';
import { useMode } from '../context/ModeContext';
import { APP_MODES, AppMode } from '../lib/mode';

interface ModeSelectorProps {
  variant?: 'full' | 'compact';
}

/** Seletor global de modo (Kids / Teen / Adult). Reage instantaneamente. */
export const ModeSelector: React.FC<ModeSelectorProps> = ({ variant = 'full' }) => {
  const { mode, setMode } = useMode();

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1">
        {APP_MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id as AppMode)}
              title={`${m.label} — ${m.desc}`}
              aria-pressed={active}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
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
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {APP_MODES.map((m) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id as AppMode)}
            aria-pressed={active}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-4 text-center transition-all ${
              active
                ? 'border-[var(--brand)] bg-[var(--brand-soft)] shadow'
                : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--brand-soft)]/60'
            }`}
          >
            <span className="text-3xl leading-none">{m.emoji}</span>
            <span
              className={`text-sm font-bold ${
                active ? 'text-[var(--brand)]' : 'text-[var(--text)]'
              }`}
            >
              {m.label}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-muted)] leading-tight">
              {m.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
};
