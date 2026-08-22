// Componente Principal que gerencia o estado do perfil (idade, tema escolhido,
// tarefas e recompensas) e seleciona o dashboard correto por faixa etária.
//
// Os dados são mockados (src/mocks/familiaDataMock) integrados ao estado para
// testes rápidos e validação visual. Para integração real, basta alimentar
// `initialProfile` com os dados do useFamily.

import React, { useMemo, useState } from 'react';
import { Settings, Minus, Plus, Palette, Check, Store } from 'lucide-react';
import { mockChild, ChildProfile, FamiliaTask, FamiliaReward } from '../../mocks/familiaDataMock';
import { dashboardThemes, themeLabels, themeSwatch, ThemeName, ThemeConfig } from './DashboardThemes';
import DashboardKids from './DashboardKids';
import DashboardTeen from './DashboardTeen';
import DashboardClean from './DashboardClean';

type AgeMode = 'kids' | 'teen' | 'clean';

interface DashboardFilhoContainerProps {
  initialProfile?: ChildProfile;
  onGoToShop?: () => void;
}

const ageModeFromAge = (age: number): AgeMode => (age <= 9 ? 'kids' : age <= 14 ? 'teen' : 'clean');
const XP_PER_LEVEL = 2000;

const DashboardFilhoContainer: React.FC<DashboardFilhoContainerProps> = ({ initialProfile, onGoToShop }) => {
  const [profile, setProfile] = useState<ChildProfile>(initialProfile ?? mockChild);
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('cyberpunk');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const themeConfig: ThemeConfig = dashboardThemes[currentTheme];
  const ageMode = ageModeFromAge(profile.age);
  const modeLabel = ageMode === 'kids' ? 'Kids' : ageMode === 'teen' ? 'Teen / Gamer' : 'Young Adult';

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  // Marca uma tarefa como concluída e credita pontos/xp/saldo ao perfil.
  const handleCompleteTask = (id: string) => {
    setProfile((prev) => {
      const task = prev.tasks.find((t) => t.id === id);
      if (!task || task.status === 'concluida') return prev;
      const xp = prev.xp + (task.xp ?? 0);
      const gained = task.monetaryValue ?? task.points / 100;
      return {
        ...prev,
        xp,
        level: Math.floor(xp / XP_PER_LEVEL) + 1,
        points: prev.points + task.points,
        balance: Math.round((prev.balance + gained) * 100) / 100,
        tasks: prev.tasks.map((t): FamiliaTask =>
          t.id === id ? { ...t, status: 'concluida' } : t
        ),
      };
    });
    flash('Missão concluída! ⭐');
  };

  // Resgata uma recompensa (deduz pontos) e a remove da lista disponível.
  const handleRedeem = (reward: FamiliaReward) => {
    if (profile.points < reward.cost) {
      flash('Você ainda não tem pontos suficientes.');
      return;
    }
    setProfile((prev) => ({
      ...prev,
      points: prev.points - reward.cost,
      availableRewards: prev.availableRewards.filter((r) => r.id !== reward.id),
    }));
    flash(`Resgatado: ${reward.emoji} ${reward.name}!`);
  };

  const setAge = (age: number) => {
    const clamped = Math.max(1, Math.min(17, age));
    setProfile((prev) => ({ ...prev, age: clamped }));
  };

  const commonProps = { profile, theme: themeConfig, onCompleteTask: handleCompleteTask, onRedeem: handleRedeem };

  return (
    <div className={`min-h-screen ${themeConfig.bg} p-4 md:p-6 ${themeConfig.text} font-sans relative`}>
      {/* Cabeçalho */}
      <header className={`flex items-center justify-between pb-5 mb-6 ${themeConfig.border} border-b`}>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className={`text-xl md:text-2xl font-extrabold ${themeConfig.primary}`}>FamiliaQuest</h1>
          <span className={`text-xs md:text-sm ${themeConfig.textMuted}`}>
            {profile.name}, {profile.age} anos • Modo {modeLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Seletor de idade (para validação visual dos modos) */}
          <div className={`flex items-center rounded-full ${themeConfig.accent} ${themeConfig.border} border overflow-hidden`}>
            <button onClick={() => setAge(profile.age - 1)} className={`px-2.5 py-1.5 ${themeConfig.text} active:scale-90 transition`} title="Diminuir idade">
              <Minus className="w-4 h-4" />
            </button>
            <span className={`px-1 text-xs font-bold ${themeConfig.textMuted}`}>idade</span>
            <button onClick={() => setAge(profile.age + 1)} className={`px-2.5 py-1.5 ${themeConfig.text} active:scale-90 transition`} title="Aumentar idade">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {onGoToShop && (
            <button
              onClick={onGoToShop}
              className={`p-2 rounded-full ${themeConfig.primaryBg} ${themeConfig.primaryText}`}
              title="Ir para a Loja"
            >
              <Store className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowSettings((s) => !s)}
            className={`p-2 rounded-full ${themeConfig.accent} ${themeConfig.border} border ${themeConfig.primary}`}
            title="Alterar Tema"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Dashboard por faixa etária */}
      {ageMode === 'kids' && <DashboardKids {...commonProps} />}
      {ageMode === 'teen' && <DashboardTeen {...commonProps} />}
      {ageMode === 'clean' && <DashboardClean {...commonProps} />}

      {/* Modal de seleção de tema */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowSettings(false)}>
          <div
            className={`${themeConfig.card} ${themeConfig.border} border rounded-2xl p-6 w-full max-w-sm shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={`text-lg font-extrabold mb-4 flex items-center gap-2 ${themeConfig.primary}`}>
              <Palette className="w-5 h-5" /> Selecione o Tema
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(dashboardThemes) as ThemeName[]).map((name) => (
                <button
                  key={name}
                  onClick={() => setCurrentTheme(name)}
                  className={`relative p-4 rounded-xl border-2 text-left transition ${
                    currentTheme === name ? `${themeConfig.border} ${themeConfig.primary}` : 'border-transparent'
                  } bg-white/5`}
                >
                  <span className={`block h-8 w-full rounded-lg bg-gradient-to-r ${themeSwatch[name]} mb-2`} />
                  <span className={`text-sm font-bold capitalize ${themeConfig.text}`}>{themeLabels[name]}</span>
                  {currentTheme === name && (
                    <span className={`absolute top-2 right-2 ${themeConfig.primary}`}>
                      <Check className="w-4 h-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className={`mt-5 w-full p-2.5 text-sm font-bold rounded-lg ${themeConfig.primaryBg} ${themeConfig.primaryText}`}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Toast de feedback */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full ${themeConfig.primaryBg} ${themeConfig.primaryText} font-bold shadow-lg`}>
          {toast}
        </div>
      )}
    </div>
  );
};

export default DashboardFilhoContainer;
