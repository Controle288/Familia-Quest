import React, { useState } from 'react';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ParentDashboard } from './components/ParentDashboard';
import { ChildDashboard } from './components/ChildDashboard';
import { RewardStore } from './components/RewardStore';
import { SocialTab } from './components/SocialTab';
import { StatsTab } from './components/StatsTab';
import { LevelUpModal } from './components/LevelUpModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CreateRewardModal } from './components/CreateRewardModal';
import { AuthOnboarding } from './components/AuthOnboarding';
import { ToastContainer } from './components/ToastContainer';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, currentProfile, showOnboarding, authUser } = useFamily();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateRewardOpen, setIsCreateRewardOpen] = useState(false);

  const desktopTabs = [
    { id: 'quest' as const, label: 'Missões' },
    { id: 'shop' as const, label: 'Loja' },
    { id: 'social' as const, label: 'Social' },
    { id: 'stats' as const, label: 'Estatísticas' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col antialiased">
      <Header />

      {!authUser && !showOnboarding && (
        <div className="fixed top-20.5 left-1/2 -translate-x-1/2 z-30 hidden md:block">
          <div className="rounded-full border border-indigo-200 bg-white/80 px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-sm">
            Sessão ativa: modo web em tela ampla
          </div>
        </div>
      )}

      <div className="flex-1 w-full mx-auto pt-24 pb-24 md:pb-12 px-4 md:px-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-7xl xl:max-w-375 gap-5 xl:gap-7">
          <aside className="hidden lg:flex w-72 shrink-0 flex-col rounded-3xl border border-indigo-100 bg-white/80 p-4 shadow-[0px_10px_30px_rgba(79,70,229,0.08)] backdrop-blur-sm">
            <div className="mb-5 px-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Menu</p>
              <h2 className="mt-2 font-heading text-xl font-bold text-slate-900">Família</h2>
            </div>

            <nav className="space-y-2">
              {desktopTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#3525cd] text-white shadow-md shadow-indigo-500/20'
                        : 'text-slate-600 hover:bg-indigo-50 hover:text-[#3525cd]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-2xl bg-linear-to-br from-[#4f46e5] to-[#8455ef] p-4 text-white shadow-lg shadow-indigo-500/20">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">Perfil</p>
              <p className="mt-2 font-heading text-lg font-bold">{currentProfile.full_name}</p>
              <p className="text-xs text-indigo-100">{currentProfile.role === 'parent' ? 'Pai/Mãe' : 'Filho/Filha'}</p>
            </div>
          </aside>

          <main className="flex-1 w-full">
            {activeTab === 'quest' && (
              <>
                {currentProfile.role === 'parent' ? (
                  <ParentDashboard
                    onOpenCreateTask={() => setIsCreateTaskOpen(true)}
                    onOpenCreateReward={() => setIsCreateRewardOpen(true)}
                  />
                ) : (
                  <ChildDashboard onGoToShop={() => setActiveTab('shop')} />
                )}
              </>
            )}

            {activeTab === 'shop' && <RewardStore />}
            {activeTab === 'social' && <SocialTab />}
            {activeTab === 'stats' && <StatsTab />}
          </main>
        </div>
      </div>

      <BottomNav />

      <LevelUpModal />
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
      />
      <CreateRewardModal
        isOpen={isCreateRewardOpen}
        onClose={() => setIsCreateRewardOpen(false)}
      />
      {showOnboarding && <AuthOnboarding />}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <FamilyProvider>
      <MainAppContent />
    </FamilyProvider>
  );
}
