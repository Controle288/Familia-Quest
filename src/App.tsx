import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import { isMuted, setMuted } from './lib/sounds';
import { relationshipLabel } from './lib/avatars';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ParentDashboard } from './components/ParentDashboard';
import DashboardFilhoContainer from './components/Dashboard/DashboardFilhoContainer';
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
import { FamilyMembersPanel } from './components/FamilyMembersPanel';
import { PlanPanel } from './components/PlanPanel';
import { ToastContainer } from './components/ToastContainer';
import { InstallPrompt } from './components/InstallPrompt';
import { useEffect } from 'react';
import { initRemoteNavigation } from './utils/remoteNavigation';

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, currentProfile, authUser, isSyncing, isInitialized, profiles, family, isAdminUser, isPremium, premiumExpiresAt, familySettings } = useFamily();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateRewardOpen, setIsCreateRewardOpen] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

  // While the session is still rehydrating we show a neutral splash so the
  // reload/F5 flash of the login screen is avoided.
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg)]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-[var(--brand)] animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Carregando FamiliaQuest…</p>
      </div>
    );
  }

  // Official-only: the app is only usable once a family is loaded from the
  // server. Until then we show the onboarding (create account / join by code).
  // (If logged in but family state is still loading, keep the splash — never
  // the login screen.)
  if (!authUser) {
    return <AuthOnboarding />;
  }
  if (!family?.id || profiles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg)]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-[var(--brand)] animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Carregando sua família…</p>
      </div>
    );
  }

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const isGuardian = currentProfile?.role === 'parent';

  const desktopTabs = [
    { id: 'quest' as const, label: 'Missões' },
    { id: 'shop' as const, label: 'Loja' },
    { id: 'social' as const, label: 'Social' },
    { id: 'stats' as const, label: 'Estatísticas' },
    ...(isGuardian
      ? [
          { id: 'members' as const, label: 'Membros' },
          { id: 'plan' as const, label: 'Plano' },
        ]
      : []),
    { id: 'settings' as const, label: 'Ajustes' },
    { id: 'tutorial' as const, label: 'Tutorial' },
    ...(isAdminUser ? [{ id: 'admin' as const, label: 'Admin' }] : []),
  ];

  return (
      <div className="min-h-screen text-[var(--text)] flex flex-col antialiased overscroll-none">
      <Header />

      <div className="flex-1 w-full mx-auto pt-24 pb-24 md:pb-12 px-4 md:px-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-7xl xl:max-w-375 gap-5 xl:gap-7">
          <aside className="hidden lg:flex w-64 shrink-0 flex-col rounded-3xl border border-[var(--border)] bg-[var(--surface)]/80 p-3 shadow-[0px_10px_30px_rgba(79,70,229,0.08)] backdrop-blur-sm lg:sticky lg:top-24 lg:self-start lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <div className="mb-4 px-2">
              <img
                src="/logo.png"
                alt="FamilyQuest"
                className="h-10 w-auto mb-2"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/icon.svg';
                }}
              />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Menu</p>
              <div className="mt-1.5 flex items-center gap-2">
                <h2 className="font-heading text-lg font-bold text-slate-900">Família</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isPremium
                      ? 'bg-amber-100 text-amber-700'
                      : familySettings?.plan === 'premium'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isPremium
                    ? premiumExpiresAt
                      ? (() => {
                          const d = Math.ceil((new Date(premiumExpiresAt).getTime() - Date.now()) / 86400000);
                          return d > 0 ? `Premium · ${d}d` : 'Premium · hoje';
                        })()
                      : 'Premium'
                    : familySettings?.plan === 'premium'
                    ? 'Expirado'
                    : 'Grátis'}
                </span>
              </div>
            </div>

            <nav className="space-y-1.5">
              {desktopTabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[var(--brand)] text-white shadow-md'
                        : 'text-[var(--text-muted)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            <div className="mt-auto rounded-2xl fq-gradient p-4 text-white shadow-lg shadow-indigo-500/20 relative">
              <button
                onClick={toggleMute}
                title={muted ? 'Ativar sons' : 'Silenciar'}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-all active:scale-95"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">Perfil</p>
              <p className="mt-2 font-heading text-lg font-bold">{currentProfile.full_name}</p>
              <p className="text-xs text-indigo-100">{relationshipLabel(currentProfile.relationship) || (currentProfile.role === 'parent' ? 'Responsável' : 'Filho(a)')}</p>
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
                    <DashboardFilhoContainer onGoToShop={() => setActiveTab('shop')} />
                  )}
                </>
              )}

              {activeTab === 'shop' && <RewardStore />}
              {activeTab === 'social' && <SocialTab />}
              {activeTab === 'stats' && <StatsTab />}
              {activeTab === 'members' && isGuardian && <FamilyMembersPanel />}
              {activeTab === 'plan' && isGuardian && <PlanPanel />}
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
      <InstallPrompt />

      {isSyncing && (
        <div className="fixed bottom-24 right-4 z-40 md:bottom-6 flex items-center gap-2 rounded-full bg-[var(--brand)] text-white text-xs font-semibold px-3 py-2 shadow-lg shadow-indigo-500/30">
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
