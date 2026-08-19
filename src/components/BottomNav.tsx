import React from 'react';
import { ClipboardList, Gift, Users, BarChart3 } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { ActiveTab } from '../types';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, tasks, currentProfile } = useFamily();

  const pendingCount = tasks.filter((t) => t.status === 'waiting_approval').length;

  const navItems: { id: ActiveTab; label: string; icon: typeof ClipboardList; badge?: number }[] = [
    { 
      id: 'quest', 
      label: 'Quest', 
      icon: ClipboardList,
      badge: currentProfile.role === 'parent' && pendingCount > 0 ? pendingCount : undefined 
    },
    { id: 'shop', label: 'Shop', icon: Gift },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full h-[72px] bg-[#f8f9ff]/90 backdrop-blur-lg border-t border-indigo-100/80 z-40 shadow-[0px_-4px_20px_rgba(79,70,229,0.06)] rounded-t-2xl md:hidden">
      <div className="max-w-md mx-auto h-full flex justify-around items-center px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center relative w-16 h-14 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-[#3525cd] font-bold scale-105'
                  : 'text-slate-500 hover:text-[#3525cd]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-[#3525cd] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
