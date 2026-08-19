import React, { useState } from 'react';
import { Bell, Flame, ChevronDown, Check, UserCheck, Sparkles, RefreshCw, Compass, LogOut } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

export const Header: React.FC = () => {
  const { 
    family, 
    currentProfile, 
    profiles, 
    switchProfile, 
    tasks, 
    setShowOnboarding, 
    resetDemoData,
    signOut,
    isAuthenticated,
    addToast 
  } = useFamily();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingApprovalsCount = tasks.filter((t) => t.status === 'waiting_approval').length;

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-[68px] bg-[#f8f9ff]/90 backdrop-blur-md z-40 border-b border-indigo-100/60 transition-all">
      <div className="max-w-[1600px] mx-auto h-full px-4 md:px-6 xl:px-8 flex justify-between items-center">
        {/* Left: Avatar & Family Name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-indigo-50/80 transition-all focus:outline-none"
            title="Alternar Perfil"
          >
            <div className="relative">
              {currentProfile.role === 'parent' ? (
                <div className="w-10 h-10 rounded-full bg-[#4f46e5] text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-indigo-200">
                  FS
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#3525cd] shadow-md bg-white">
                  <img
                    src={currentProfile.avatar_url}
                    alt={currentProfile.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {currentProfile.role === 'child' && (
                <span className="absolute -bottom-1 -right-1 bg-[#006e4b] text-[#67f4b7] text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-white">
                  L{currentProfile.level}
                </span>
              )}
            </div>

            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1">
                <span className="font-heading font-bold text-[#3525cd] text-base leading-tight">
                  {family.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                {currentProfile.full_name} ({currentProfile.role === 'parent' ? 'Pai/Mãe' : 'Filho'})
              </span>
            </div>
          </button>
        </div>

        {/* Center / Quick Role Toggle for Testing */}
        <div className="hidden xl:flex items-center bg-indigo-50/90 p-1 rounded-full border border-indigo-100/80 shadow-xs">
          {profiles.map((p) => {
            const isSelected = p.id === currentProfile.id;
            return (
              <button
                key={p.id}
                onClick={() => switchProfile(p.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#3525cd] text-white shadow-sm'
                    : 'text-indigo-900 hover:text-[#3525cd] hover:bg-white/60'
                }`}
              >
                {p.role === 'parent' ? '🛡️ Pai' : `⭐ ${p.full_name}`}
              </button>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-full border border-indigo-100 bg-white/70 px-3 py-1.5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Status</span>
          <span className="text-xs font-semibold text-slate-700">{currentProfile.role === 'parent' ? 'Aprovação' : 'Progressão'}</span>
        </div>

        {/* Right: Streak & Notifications */}
        <div className="flex items-center gap-2">
          {currentProfile.role === 'child' && (
            <div className="bg-[#6b38d4]/10 text-[#6b38d4] px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold text-xs border border-violet-200/50">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
              <span>{currentProfile.streak_days} dias</span>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-50 text-[#3525cd] transition-colors relative"
              aria-label="Notificações"
            >
              <Bell className="w-5 h-5" />
              {pendingApprovalsCount > 0 && currentProfile.role === 'parent' && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-ping" />
              )}
              {pendingApprovalsCount > 0 && currentProfile.role === 'parent' && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-indigo-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="font-heading font-bold text-slate-800 text-sm">Notificações</h4>
                  <span className="text-xs bg-indigo-50 text-[#3525cd] px-2 py-0.5 rounded-full font-semibold">
                    {pendingApprovalsCount} pendente{pendingApprovalsCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                  {pendingApprovalsCount > 0 ? (
                    tasks
                      .filter((t) => t.status === 'waiting_approval')
                      .map((t) => (
                        <div key={t.id} className="p-2.5 bg-indigo-50/60 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">{t.title}</p>
                            <p className="text-slate-500">Aguardando sua avaliação</p>
                          </div>
                          <span className="text-indigo-600 font-bold">+{t.reward_value} XP</span>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Tudo limpo! Nenhuma notificação pendente.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowOnboarding(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-50 text-indigo-700 transition-colors"
            title="Ver Boas-vindas / Onboarding"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Switcher Modal / Dropdown */}
      {showProfileMenu && (
        <div 
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
          onClick={() => setShowProfileMenu(false)}
        >
          <div 
            className="bg-white rounded-3xl p-5 shadow-2xl border border-indigo-100 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-slate-900 text-base">Trocar Perfil</h3>
              <button 
                onClick={resetDemoData}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" /> Resetar Dados
              </button>
            </div>

            {isAuthenticated && (
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  signOut();
                }}
                className="w-full mb-3 p-2.5 rounded-2xl flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm transition-all"
              >
                <LogOut className="w-4 h-4" /> Sair da Conta
              </button>
            )}

            <div className="space-y-2">
              {profiles.map((p) => {
                const isActive = p.id === currentProfile.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchProfile(p.id);
                      setShowProfileMenu(false);
                    }}
                    className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all ${
                      isActive
                        ? 'bg-[#3525cd] text-white shadow-md'
                        : 'bg-slate-50 hover:bg-indigo-50/70 text-slate-800'
                    }`}
                  >
                    <img
                      src={p.avatar_url}
                      alt={p.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white"
                    />
                    <div className="text-left flex-1">
                      <p className="font-heading font-bold text-sm">{p.full_name}</p>
                      <p className={`text-xs ${isActive ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {p.role === 'parent' ? 'Painel dos Pais' : `Nível ${p.level} • ${p.xp} XP`}
                      </p>
                    </div>
                    {isActive && <Check className="w-5 h-5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
