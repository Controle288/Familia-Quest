import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { isMuted, setMuted } from './lib/sounds';
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
import { SettingsTab } from './components/SettingsTab';
import { TutorialTab } from './components/TutorialTab';
import { AdminPanel } from './components/AdminPanel';
import { ToastContainer } from './components/ToastContainer';
import { useEffect } from 'react';
import { initRemoteNavigation } from './utils/remoteNavigation';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, currentProfile, authUser, isSyncing, profiles, family, isAdminUser } = useFamily();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateRewardOpen, setIsCreateRewardOpen] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

  // Official-only: the app is only usable once a family is loaded from the
  // server. Until then we show the onboarding (create account / join by code).
  if (!authUser || !family?.id || profiles.length === 0) {
    return <AuthOnboarding />;
  }

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const desktopTabs = [
    { id: 'quest' as const, label: 'Missões' },
    { id: 'shop' as const, label: 'Loja' },
    { id: 'social' as const, label: 'Social' },
    { id: 'stats' as const, label: 'Estatísticas' },
    { id: 'settings' as const, label: 'Ajustes' },
    { id: 'tutorial' as const, label: 'Tutorial' },
    ...(isAdminUser ? [{ id: 'admin' as const, label: 'Admin' }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] dark:bg-slate-950 dark:text-slate-100 flex flex-col antialiased">
      <Header />

      <div className="flex-1 w-full mx-auto pt-24 pb-24 md:pb-12 px-4 md:px-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-7xl xl:max-w-375 gap-5 xl:gap-7">
          <aside className="hidden lg:flex w-72 shrink-0 flex-col rounded-3xl border border-indigo-100 bg-white/80 p-4 shadow-[0px_10px_30px_rgba(79,70,229,0.08)] backdrop-blur-sm dark:bg-slate-900/80 dark:border-indigo-800/60">
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

            <div className="mt-auto rounded-2xl bg-linear-to-br from-[#4f46e5] to-[#8455ef] p-4 text-white shadow-lg shadow-indigo-500/20 relative">
              <button
                onClick={toggleMute}
                title={muted ? 'Ativar sons' : 'Silenciar'}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all active:scale-95"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">Perfil</p>
              <p className="mt-2 font-heading text-lg font-bold">{currentProfile.full_name}</p>
              <p className="text-xs text-indigo-100">{currentProfile.role === 'parent' ? 'Responsável' : 'Filho(a)'}</p>
            </div>
          </aside>

          <main className="flex-1 w-full">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
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
              {activeTab === 'settings' && <SettingsTab />}
              {activeTab === 'tutorial' && <TutorialTab />}
              {activeTab === 'admin' && <AdminPanel />}
            </motion.div>
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
      <ToastContainer />

      {isSyncing && (
        <div className="fixed bottom-24 right-4 z-40 md:bottom-6 flex items-center gap-2 rounded-full bg-[#3525cd] text-white text-xs font-semibold px-3 py-2 shadow-lg shadow-indigo-500/30">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Sincronizando…
        </div>
      )}
    </div>
  );
};

export default function App() {
  useEffect(() => {
    const stop = initRemoteNavigation();
    return () => stop && stop();
  }, []);

  useEffect(() => {
    // Detect TV-like environment: Android TV / large screen
    const ua = navigator.userAgent || '';
    const isAndroidTV = /Android TV|GoogleTV|SmartTV|Smart-TV|TV/i.test(ua);
    const largeScreen = (window.screen && Math.max(window.screen.width, window.screen.height) >= 1000);
    if (isAndroidTV || largeScreen) {
      document.body.classList.add('tv-mode');
    }
  }, []);

  return (
    <FamilyProvider>
      <MainAppContent />
    </FamilyProvider>
  );
}
