// Dashboard para Modo Teen / Gamer (10 a 14 anos)
// Visual Dark/Neon estilo Discord/Steam. Foco em XP, nível, sistema de
// conquistas (achievements) e barra de progresso estilo RPG.

import React from 'react';
import { Swords, Zap, Trophy, Goal, Lock, Check, Sparkles } from 'lucide-react';
import { ChildProfile, FamiliaTask, FamiliaReward } from '../../mocks/familiaDataMock';
import { ThemeConfig } from './DashboardThemes';

interface DashboardTeenProps {
  profile: ChildProfile;
  theme: ThemeConfig;
  onCompleteTask: (id: string) => void;
  onRedeem: (reward: FamiliaReward) => void;
}

const XP_PER_LEVEL = 2000;

const ACHIEVEMENTS = [
  { id: 'a1', emoji: '📚', label: 'Leitor Focado', unlocked: true },
  { id: 'a2', emoji: '🪥', label: 'Dente Limpo', unlocked: true },
  { id: 'a3', emoji: '🐕', label: 'Passeador Master', unlocked: false },
  { id: 'a4', emoji: '🧹', label: 'Mestre do Quarto', unlocked: false },
  { id: 'a5', emoji: '➗', label: 'Mestre da Maths', unlocked: true },
  { id: 'a6', emoji: '🎮', label: 'Gamer Supremo', unlocked: false },
];

const DashboardTeen: React.FC<DashboardTeenProps> = ({ profile, theme, onCompleteTask, onRedeem }) => {
  const xpInLevel = profile.xp % XP_PER_LEVEL;
  const xpProgress = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
  const currentGoal: FamiliaReward | undefined = profile.availableRewards[0];
  const canRedeem = !!currentGoal && profile.points >= currentGoal.cost;

  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* PERFIL + BARRA DE XP (RPG) */}
      <section className={`${theme.card} ${theme.border} border rounded-2xl p-6 ${theme.glow}`}>
        <div className="flex items-center gap-4 mb-5">
          <div className={`w-16 h-16 rounded-full ${theme.accent} ${theme.border} border-2 flex items-center justify-center text-3xl overflow-hidden`}>
            {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" /> : '🦸'}
          </div>
          <div>
            <p className={`text-xl font-extrabold flex items-center gap-2 ${theme.text}`}>
              <Swords className={`w-5 h-5 ${theme.primary}`} /> {profile.name}
            </p>
            <p className={`text-sm ${theme.secondary} font-semibold`}>Classe: Estudante Herói</p>
          </div>
        </div>

        {/* Barra de XP estilo RPG */}
        <div className="mb-2 flex items-center justify-between text-sm font-bold">
          <span className={theme.textMuted}>XP {xpInLevel}/{XP_PER_LEVEL}</span>
          <span className={`${theme.primary} flex items-center gap-1`}>
            <Sparkles className="w-4 h-4" /> LVL {profile.level}
          </span>
        </div>
        <div className={`w-full ${theme.accent} rounded-full h-4 overflow-hidden ${theme.border} border`}>
          <div
            className={`h-full ${theme.primaryBg} transition-all duration-700 relative`}
            style={{ width: `${xpProgress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
        <p className={`mt-4 text-center text-sm font-bold flex items-center justify-center gap-2 ${theme.secondary}`}>
          ⭐ {profile.points} Pontos para a Lojinha
        </p>
      </section>

      {/* MISSÕES ATIVAS (QUEST LOG) */}
      <section className="col-span-1 lg:col-span-2">
        <div className={`${theme.card} ${theme.border} border rounded-2xl p-6`}>
          <h3 className={`text-lg font-extrabold mb-5 flex items-center gap-2 ${theme.text}`}>
            <Swords className={`w-5 h-5 ${theme.primary}`} /> Missões do Dia (Quest Log)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.tasks.map((task: FamiliaTask) => (
              <div
                key={task.id}
                className={`group flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                  task.status === 'concluida'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : task.status === 'em_progresso'
                    ? 'border-amber-500 bg-amber-500/10'
                    : `${theme.border} bg-black/20 hover:border-cyan-400`
                }`}
              >
                <div className={`p-3 rounded-lg ${theme.accent} text-2xl`}>{task.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold ${theme.text} truncate`}>{task.name}</p>
                  <p className={`text-xs ${theme.textMuted}`}>{task.description}</p>
                </div>
                <div className={`flex flex-col items-end gap-1 text-xs font-bold ${theme.primary}`}>
                  <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> +{task.points}⭐ / +{task.xp ?? 0} XP</span>
                  {task.status === 'concluida' ? (
                    <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Done</span>
                  ) : (
                    <button
                      onClick={() => onCompleteTask(task.id)}
                      className={`mt-1 px-3 py-1 rounded-lg text-[11px] font-extrabold ${theme.primaryBg} ${theme.primaryText} active:scale-95 transition`}
                    >
                      Concluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONQUISTAS (TROPHY ROOM) */}
      <section className={`${theme.card} ${theme.border} border rounded-2xl p-6`}>
        <h3 className={`text-lg font-extrabold mb-4 flex items-center gap-2 ${theme.text}`}>
          <Trophy className={`w-5 h-5 ${theme.primary}`} /> Conquistas
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.id}
              className={`p-3 rounded-xl flex flex-col items-center text-center gap-1 ${a.unlocked ? theme.accent : 'bg-black/30'} ${
                a.unlocked ? '' : 'opacity-40'
              }`}
            >
              <span className="text-3xl">{a.unlocked ? a.emoji : <Lock className="w-6 h-6" />}</span>
              <span className={`text-[10px] font-bold ${theme.textMuted}`}>{a.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* META / WISHLIST */}
      <section className="col-span-1 lg:col-span-2">
        <div className={`${theme.card} ${theme.border} border rounded-2xl p-6`}>
          <h3 className={`text-lg font-extrabold mb-4 flex items-center gap-2 ${theme.text}`}>
            <Goal className={`w-5 h-5 ${theme.primary}`} /> Minha Meta (Wishlist)
          </h3>
          {currentGoal ? (
            <div className="flex items-center gap-5">
              <div className={`p-4 rounded-xl ${theme.accent} text-4xl`}>{currentGoal.emoji}</div>
              <div className="flex-1">
                <p className={`font-bold ${theme.text}`}>{currentGoal.name}</p>
                <p className={`text-sm ${theme.secondary} font-semibold`}>Custo: ⭐ {currentGoal.cost} Pontos</p>
              </div>
              <button
                disabled={!canRedeem}
                onClick={() => onRedeem(currentGoal)}
                className={`px-5 py-3 rounded-xl font-extrabold text-sm ${theme.primaryBg} ${theme.primaryText} disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition`}
              >
                {canRedeem ? 'Trocar Pontos' : 'Junta Pontos'}
              </button>
            </div>
          ) : (
            <p className={`${theme.textMuted}`}>Nenhuma recompensa na wishlist ainda.</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default DashboardTeen;
