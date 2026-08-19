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
  const { activeTab, setActiveTab, currentProfile, showOnboarding } = useFamily();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateRewardOpen, setIsCreateRewardOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col antialiased">
      {/* Top Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 md:px-6 pt-24 pb-24 md:pb-12">
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

      {/* Bottom PWA Navigation for Mobile */}
      <BottomNav />

      {/* Global Modals & Toasts */}
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
