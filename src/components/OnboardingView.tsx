import React, { useState } from 'react';
import { Sparkles, PlusCircle, Key, ArrowRight, X } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

export const OnboardingView: React.FC = () => {
  const { profiles, switchProfile, setShowOnboarding, addToast } = useFamily();
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  const parentProfile = profiles.find((p) => p.role === 'parent') || profiles[0];
  const childProfile = profiles.find((p) => p.role === 'child') || profiles[1];

  const handleEnterWithCode = () => {
    if (!inviteCodeInput.trim()) {
      addToast('Digite o código de convite', 'Ex: SILVA-2024', 'warning');
      return;
    }
    addToast('Família conectada!', `Você ingressou na guilda com o código ${inviteCodeInput.toUpperCase()}`, 'success');
    setShowOnboarding(false);
  };

  const handleSelectProfile = (profileId: string) => {
    switchProfile(profileId);
    setShowOnboarding(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9ff] overflow-y-auto flex flex-col items-center justify-between px-5 py-8 md:py-12">
      {/* Close button */}
      <button
        onClick={() => setShowOnboarding(false)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
        title="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
      </div>

      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center text-center space-y-6">
        {/* Brand & Welcome */}
        <header className="flex flex-col items-center">
          <div className="w-20 h-20 bg-[#4f46e5] rounded-3xl flex items-center justify-center text-white mb-4 shadow-[0px_12px_32px_rgba(79,70,229,0.2)]">
            <Sparkles className="w-10 h-10 fill-current text-white" />
          </div>
          <h1 className="font-heading text-4xl font-extrabold text-[#3525cd] tracking-tight">
            FamilyQuest
          </h1>
          <p className="text-slate-600 text-base mt-2 max-w-xs">
            Transforme a rotina em uma aventura épica para toda a família.
          </p>
        </header>

        {/* Actions */}
        <section className="w-full space-y-3 pt-2">
          <button
            onClick={() => {
              addToast('Nova Família criada!', 'Você é o Guardião da Guilda Silva.', 'success');
              setShowOnboarding(false);
            }}
            className="w-full h-12 bg-[#3525cd] text-white font-heading font-bold text-sm rounded-full shadow-[0px_4px_20px_rgba(79,70,229,0.2)] hover:bg-[#2e1fb5] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            Criar Nova Família
          </button>

          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <Key className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              placeholder="Entrar com Código"
              className="w-full h-12 pl-11 pr-24 bg-white rounded-full border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-xs"
            />
            <button
              onClick={handleEnterWithCode}
              className="absolute inset-y-1.5 right-1.5 px-4 bg-[#8455ef] text-white font-heading font-bold text-xs rounded-full hover:bg-[#6b38d4] active:scale-95 transition-all"
            >
              Entrar
            </button>
          </div>

          <div className="flex items-center justify-center gap-3 py-1">
            <span className="h-px w-12 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">ou</span>
            <span className="h-px w-12 bg-slate-200" />
          </div>

          <button
            onClick={() => setShowOnboarding(false)}
            className="w-full h-12 bg-white text-[#3525cd] border border-indigo-200 font-heading font-bold text-sm rounded-full hover:bg-indigo-50 active:scale-95 transition-all flex items-center justify-center"
          >
            Fazer Login
          </button>
        </section>

        {/* Profile Selector */}
        <section className="w-full pt-4">
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">
            Quem está jogando?
          </h2>

          <div className="grid grid-cols-2 gap-3.5">
            {/* Parent Card */}
            <button
              onClick={() => handleSelectProfile(parentProfile.id)}
              className="glass-panel rounded-3xl p-4 md:p-5 flex flex-col items-center justify-center gap-2 shadow-[0px_4px_20px_rgba(79,70,229,0.08)] hover:shadow-xl hover:-translate-y-1 transition-all group bg-white/80"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-indigo-100 bg-white flex items-center justify-center animate-float">
                <img
                  src={parentProfile.avatar_url}
                  alt="Pai / Mãe"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center mt-1">
                <span className="block font-heading font-bold text-sm text-slate-900 group-hover:text-[#3525cd] transition-colors">
                  Pai / Mãe
                </span>
                <span className="block text-[11px] text-slate-500">Gerenciar Missões</span>
              </div>
            </button>

            {/* Child Card */}
            <button
              onClick={() => handleSelectProfile(childProfile.id)}
              className="glass-panel rounded-3xl p-4 md:p-5 flex flex-col items-center justify-center gap-2 shadow-[0px_4px_20px_rgba(79,70,229,0.08)] hover:shadow-xl hover:-translate-y-1 transition-all group bg-white/80"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-200 bg-white flex items-center justify-center animate-float">
                <img
                  src={childProfile.avatar_url}
                  alt="Filho / Filha"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-center mt-1">
                <span className="block font-heading font-bold text-sm text-slate-900 group-hover:text-[#3525cd] transition-colors">
                  Filho / Filha
                </span>
                <span className="block text-[11px] text-slate-500">Completar e Ganhar</span>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
