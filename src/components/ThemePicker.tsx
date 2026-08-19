import React from 'react';
import { useFamily } from '../context/FamilyContext';
import { THEMES, fireGlitter } from '../lib/themes';

export const ThemePicker: React.FC = () => {
  const { familySettings, isPremium, updateFamilySettings } = useFamily();
  const current = familySettings?.theme || 'default';
  const variant = familySettings?.theme_variant || 'light';

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Claro / Escuro</p>
        <div className="flex gap-2">
          {(['light', 'dark'] as const).map((v) => (
            <button
              key={v}
              onClick={() => updateFamilySettings({ theme_variant: v })}
              className={`flex-1 rounded-2xl border px-3 py-2.5 text-sm font-semibold capitalize transition-all ${
                variant === v
                  ? 'border-[#3525cd] bg-[#3525cd] text-white shadow'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v === 'light' ? 'Claro' : 'Escuro'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Temas</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEMES.map((t) => {
            const locked = t.premium && !isPremium;
            return (
              <button
                key={t.id}
                disabled={locked}
                onClick={() => {
                  updateFamilySettings({ theme: t.id });
                  if (t.id === 'winx') fireGlitter();
                }}
                className={`relative flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition-all ${
                  current === t.id
                    ? 'border-[#3525cd] bg-indigo-50 shadow'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                } ${locked ? 'opacity-50' : ''}`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <span className="text-[11px] font-semibold text-slate-700 leading-tight">{t.label}</span>
                {locked && <span className="text-[9px] font-bold text-amber-600">PREMIUM</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
