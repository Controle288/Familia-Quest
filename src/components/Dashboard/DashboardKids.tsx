// Dashboard para Modo Kids (até 9 anos)
// Visual colorido, lúdico e em formato de mapa de aventura/jogo.
// Botões grandes, emojis de tarefas e barra de recompensas com foco em estrelas/pontos.

import React from 'react';
import { Star, Gift, PartyPopper, Check, Lock } from 'lucide-react';
import { ChildProfile, FamiliaTask, FamiliaReward } from '../../mocks/familiaDataMock';
import { ThemeConfig } from './DashboardThemes';

interface DashboardKidsProps {
  profile: ChildProfile;
  theme: ThemeConfig;
  onCompleteTask: (id: string) => void;
  onRedeem: (reward: FamiliaReward) => void;
  onSetGoal?: (goal: { name: string; target: number; current: number }) => void;
}

const taskNodeStyles: Record<FamiliaTask['status'], string> = {
  concluida: 'bg-emerald-400 border-emerald-500 scale-100',
  em_progresso: 'bg-amber-300 border-amber-400 animate-pulse',
  pendente: 'bg-white border-dashed border-2 border-slate-300 hover:scale-105',
};

const DashboardKids: React.FC<DashboardKidsProps> = ({ profile, theme, onCompleteTask, onRedeem }) => {
  const nextReward: FamiliaReward | undefined = profile.availableRewards.find((r) => profile.points < r.cost);
  const progress = nextReward ? Math.min(100, Math.round((profile.points / nextReward.cost) * 100)) : 100;
  const canRedeem = !!nextReward && profile.points >= nextReward.cost;

  return (
    <main className="space-y-6">
      {/* HERÓI / CABEÇALHO LÚDICO */}
      <section className={`${theme.card} ${theme.border} border-2 rounded-3xl p-6 flex items-center justify-between ${theme.glow}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/70 flex items-center justify-center text-4xl shadow-inner">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              '🧒'
            )}
          </div>
          <div>
            <h2 className={`text-2xl font-extrabold ${theme.text}`}>{profile.name}</h2>
            <p className={`${theme.secondary} font-bold text-sm`}>Nível {profile.level} • Aventureiro(a)! 🎒</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${theme.accent} ${theme.primary} font-extrabold text-lg`}>
          <Star className="w-5 h-5 fill-current" /> {profile.points}
        </div>
      </section>

      {/* MAPA DE AVENTURA */}
      <section className={`${theme.card} ${theme.border} border-2 rounded-3xl p-6`}>
        <h3 className={`font-extrabold text-lg mb-5 flex items-center gap-2 ${theme.text}`}>
          🗺️ Meu Mapa de Aventuras
        </h3>
        <div className="relative flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {/* trilha */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200/70 rounded-full" />
          {profile.tasks.map((task, i) => (
            <button
              key={task.id}
              onClick={() => task.status !== 'concluida' && onCompleteTask(task.id)}
              title={task.name}
              className={`relative z-10 shrink-0 w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-transform ${taskNodeStyles[task.status]} ${theme.text}`}
            >
              <span className="text-3xl leading-none">{task.status === 'concluida' ? '✅' : task.emoji}</span>
              {task.status === 'concluida' ? (
                <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Pronto
                </span>
              ) : (
                <span className="text-[10px] font-bold text-slate-500">Passo {i + 1}</span>
              )}
            </button>
          ))}
        </div>
        <p className={`text-center text-xs mt-4 ${theme.textMuted}`}>
          Toque nas paradas para concluir as missões e ganhar ⭐ estrelas!
        </p>
      </section>

      {/* PRÓXIMA RECOMPENSA + BARRA */}
      <section className={`${theme.card} ${theme.border} border-2 rounded-3xl p-6`}>
        <h3 className={`font-extrabold text-lg mb-4 flex items-center gap-2 ${theme.text}`}>
          <Gift className="w-5 h-5" /> Próxima Recompensa
        </h3>
        {nextReward ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/70 flex items-center justify-center text-4xl shrink-0">
              {nextReward.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold ${theme.text} truncate`}>{nextReward.name}</p>
              <p className={`text-sm ${theme.secondary} font-semibold flex items-center gap-1`}>
                <Star className="w-4 h-4 fill-current" /> {nextReward.cost} estrelas
              </p>
              <div className={`mt-2 w-full h-4 rounded-full ${theme.accent} ${theme.border} border overflow-hidden`}>
                <div className={`h-full ${theme.primaryBg} transition-all duration-500`} style={{ width: `${progress}%` }} />
              </div>
              <p className={`text-[11px] mt-1 ${theme.textMuted}`}>{progress}% conquistado</p>
            </div>
            <button
              disabled={!canRedeem}
              onClick={() => onRedeem(nextReward)}
              className={`shrink-0 px-4 py-3 rounded-2xl font-extrabold text-sm ${theme.primaryBg} ${theme.primaryText} disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition`}
            >
              {canRedeem ? 'Resgatar!' : 'Junta + ⭐'}
            </button>
          </div>
        ) : (
          <div className={`flex items-center gap-3 ${theme.accent} rounded-2xl p-4 ${theme.text}`}>
            <PartyPopper className="w-6 h-6" />
            <p className="font-bold">Uau! Você resgatou tudo! 🎉</p>
          </div>
        )}
      </section>

      {/* LISTA DE TAREFAS (CARTÕES GRANDES) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {profile.tasks.map((task) => (
          <div
            key={task.id}
            className={`rounded-3xl border-2 p-5 flex flex-col items-center text-center gap-2 ${theme.card} ${theme.border} ${
              task.status === 'concluida' ? 'opacity-80' : ''
            }`}
          >
            <span className="text-5xl">{task.status === 'concluida' ? '✅' : task.emoji}</span>
            <p className={`font-extrabold ${theme.text}`}>{task.name}</p>
            <p className={`text-xs ${theme.textMuted}`}>{task.description}</p>
            <span className={`mt-1 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${theme.accent} ${theme.secondary}`}>
              <Star className="w-3.5 h-3.5 fill-current" /> {task.points}
            </span>
            {task.status !== 'concluida' && (
              <button
                onClick={() => onCompleteTask(task.id)}
                className={`mt-1 w-full py-2.5 rounded-2xl font-extrabold ${theme.primaryBg} ${theme.primaryText} active:scale-95 transition`}
              >
                Concluir ✅
              </button>
            )}
            {task.status === 'concluida' && (
              <span className={`mt-1 w-full py-2.5 rounded-2xl font-extrabold flex items-center justify-center gap-1 ${theme.accent} ${theme.secondary}`}>
                <Check className="w-4 h-4" /> Feito!
              </span>
            )}
          </div>
        ))}
      </section>
    </main>
  );
};

export default DashboardKids;
