import React from 'react';
import { Sparkles, Trophy, Star } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

export const LevelUpModal: React.FC = () => {
  const { levelUpModal, dismissLevelUpModal } = useFamily();

  if (!levelUpModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 flex flex-col items-center text-center shadow-2xl border border-white/60">
        {/* Animated Glow Star Icon */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-4">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse-subtle" />
          <div className="w-24 h-24 rounded-full bg-linear-to-tr from-[#3525cd] via-[#4f46e5] to-[#8455ef] flex items-center justify-center text-white shadow-xl animate-float">
            <Star className="w-12 h-12 fill-[#ffc107] text-[#ffc107]" />
          </div>
        </div>

        {/* Celebration Text */}
        <div className="space-y-1 mb-3">
          <h2 className="text-3xl font-heading font-extrabold text-[#3525cd] tracking-wider uppercase">
            SUBIU DE NÍVEL!
          </h2>
          <p className="text-lg font-heading font-bold text-slate-800">
            {levelUpModal.profileName} atingiu o{' '}
            <span className="text-[#6b38d4] font-extrabold">Nível {levelUpModal.newLevel}</span>
          </p>
        </div>

        <p className="text-slate-600 text-xs md:text-sm mb-6 leading-relaxed">
          Continue assim, aventureiro! Novas missões e recompensas épicas esperam por você.
        </p>

        {/* Action Button */}
        <button
          onClick={dismissLevelUpModal}
          className="w-full h-12 rounded-full bg-[#3525cd] text-white font-heading font-bold text-base hover:bg-[#2e1fb5] transition-all shadow-lg shadow-indigo-500/25 active:scale-95 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 fill-current" />
          Uau!
        </button>
      </div>
    </div>
  );
};
