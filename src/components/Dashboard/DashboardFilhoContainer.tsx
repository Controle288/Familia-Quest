// Componente Principal que integra os dados reais do useFamily e seleciona o
// dashboard correto por faixa etária. Os dashboards recebem um `ChildProfile`
// (formato esperado) montado a partir de Profile / Task / Reward reais.

import React, { useMemo, useState } from 'react';
import { Settings, Palette, Check, Store, Smile, Gamepad2, Wallet } from 'lucide-react';
import { useFamily } from '../../context/FamilyContext';
import { ChildProfile, FamiliaTask, FamiliaReward } from '../../mocks/familiaDataMock';
import { dashboardThemes, themeLabels, themeSwatch, ThemeName, ThemeConfig } from './DashboardThemes';
import DashboardKids from './DashboardKids';
import DashboardTeen from './DashboardTeen';
import DashboardClean from './DashboardClean';

type AgeMode = 'kids' | 'teen' | 'clean';

interface DashboardFilhoContainerProps {
  onGoToShop?: () => void;
}

const ageModeFromAge = (age: number): AgeMode => (age <= 9 ? 'kids' : age <= 14 ? 'teen' : 'clean');

// Mapa de icon_name (Material) -> emoji para os dashboards lúdicos.
const EMOJI_MAP: Record<string, string> = {
  cleaning_services: '🧹',
  bed: '🛏️',
  menu_book: '📖',
  pets: '🐕',
  local_dining: '🍽️',
  trash: '🗑️',
  sparkles: '✨',
  study: '📚',
  clothes: '👕',
  game: '🎮',
  shopping: '🛍️',
  heart: '❤️',
  smile: '😊',
};

const statusToMock = (s: string): FamiliaTask['status'] =>
  s === 'completed' ? 'concluida' : s === 'waiting_approval' ? 'em_progresso' : 'pendente';

const DashboardFilhoContainer: React.FC<DashboardFilhoContainerProps> = ({ onGoToShop }) => {
  const { currentProfile, tasks, rewards, completeTask, redeemReward } = useFamily();

  const [currentTheme, setCurrentTheme] = useState<ThemeName>('ocean');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [ageMode, setAgeMode] = useState<AgeMode>(ageModeFromAge(currentProfile?.age ?? 0));
  const [busyId, setBusyId] = useState<string | null>(null);

  const themeConfig: ThemeConfig = dashboardThemes[currentTheme];

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  // Monta o perfil no formato esperado pelos dashboards, a partir dos dados reais.
  const profile: ChildProfile | null = useMemo(() => {
    if (!currentProfile) return null;
    const childTasks: FamiliaTask[] = tasks
      .filter((t) => t.assigned_to === currentProfile.id)
      .map((t) => ({
        id: t.id,
        name: t.title,
        points: t.points,
        xp: t.points,
        monetaryValue: t.reward_money ?? t.points / 100,
        emoji: EMOJI_MAP[t.icon_name] ?? '📌',
        description: t.description ?? '',
        status: statusToMock(t.status),
      }));
    const availableRewards: FamiliaReward[] = rewards
      .filter((r) => r.is_available)
      .map((r) => ({
        id: r.id,
        name: r.title,
        cost: r.points_cost,
        monetaryCost: r.money_cost,
        emoji: '🎁',
      }));

    return {
      id: currentProfile.id,
      name: currentProfile.full_name || currentProfile.name,
      age: currentProfile.age ?? 0,
      avatarUrl: currentProfile.avatar_url || undefined,
      points: currentProfile.xp,
      xp: currentProfile.xp,
      level: currentProfile.level,
      balance: currentProfile.balance,
      financialGoal: null,
      tasks: childTasks,
      availableRewards,
    };
  }, [currentProfile, tasks, rewards]);

  const handleCompleteTask = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await completeTask(id);
      flash('Missão concluída! ⭐');
    } catch {
      flash('Não foi possível concluir a missão.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRedeem = async (reward: FamiliaReward) => {
    try {
      const ok = await redeemReward(reward.id);
      flash(ok ? `Resgatado: ${reward.emoji} ${reward.name}!` : 'Você não tem pontos suficientes.');
    } catch {
      flash('Não foi possível resgatar.');
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Carregando seu painel…
      </div>
    );
  }

  const commonProps = { profile, theme: themeConfig, onCompleteTask: handleCompleteTask, onRedeem: handleRedeem };

  return (
    <div className={`min-h-screen ${themeConfig.bg} p-4 md:p-6 ${themeConfig.text} font-sans relative`}>
      {/* Barra de controles: modo por idade + tema */}
      <header className={`flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 ${themeConfig.border} border-b`}>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className={`text-xl md:text-2xl font-extrabold ${themeConfig.primary}`}>FamiliaQuest</h1>
          <span className={`text-xs md:text-sm ${themeConfig.textMuted}`}>
            {profile.name}{profile.age ? `, ${profile.age} anos` : ''} • Modo {ageMode === 'kids' ? 'Kids' : ageMode === 'teen' ? 'Teen / Gamer' : 'Young Adult'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de modo por idade (preview) */}
          <div className={`flex items-center rounded-full ${themeConfig.accent} ${themeConfig.border} border p-1`}>
            <button onClick={() => setAgeMode('kids')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${ageMode === 'kids' ? themeConfig.primaryBg + ' ' + themeConfig.primaryText : themeConfig.text}`}>
              <Smile className="w-3.5 h-3.5" /> Kids
            </button>
            <button onClick={() => setAgeMode('teen')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${ageMode === 'teen' ? themeConfig.primaryBg + ' ' + themeConfig.primaryText : themeConfig.text}`}>
              <Gamepad2 className="w-3.5 h-3.5" /> Teen
            </button>
            <button onClick={() => setAgeMode('clean')} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${ageMode === 'clean' ? themeConfig.primaryBg + ' ' + themeConfig.primaryText : themeConfig.text}`}>
              <Wallet className="w-3.5 h-3.5" /> Adult
            </button>
          </div>

          {onGoToShop && (
            <button onClick={onGoToShop} className={`p-2 rounded-full ${themeConfig.primaryBg} ${themeConfig.primaryText}`} title="Ir para a Loja">
              <Store className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => setShowSettings((s) => !s)} className={`p-2 rounded-full ${themeConfig.accent} ${themeConfig.border} border ${themeConfig.primary}`} title="Alterar Tema">
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
          <div className={`${themeConfig.card} ${themeConfig.border} border rounded-2xl p-6 w-full max-w-sm shadow-2xl`} onClick={(e) => e.stopPropagation()}>
            <h2 className={`text-lg font-extrabold mb-4 flex items-center gap-2 ${themeConfig.primary}`}>
              <Palette className="w-5 h-5" /> Selecione o Tema
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(dashboardThemes) as ThemeName[]).map((name) => (
                <button
                  key={name}
                  onClick={() => setCurrentTheme(name)}
                  className={`relative p-4 rounded-xl border-2 text-left transition ${currentTheme === name ? `${themeConfig.border} ${themeConfig.primary}` : 'border-transparent'} bg-white/5`}
                >
                  <span className={`block h-8 w-full rounded-lg bg-gradient-to-r ${themeSwatch[name]} mb-2`} />
                  <span className={`text-sm font-bold capitalize ${themeConfig.text}`}>{themeLabels[name]}</span>
                  {currentTheme === name && (
                    <span className={`absolute top-2 right-2 ${themeConfig.primary}`}><Check className="w-4 h-4" /></span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setShowSettings(false)} className={`mt-5 w-full p-2.5 text-sm font-bold rounded-lg ${themeConfig.primaryBg} ${themeConfig.primaryText}`}>
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
