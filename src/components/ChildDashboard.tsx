import React, { useState } from 'react';
import { 
  Sparkles, 
  Coins, 
  Hourglass, 
  Check, 
  CheckCircle, 
  Flame, 
  Gift, 
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { TaskIcon } from './TaskIcon';

interface ChildDashboardProps {
  onGoToShop: () => void;
}

export const ChildDashboard: React.FC<ChildDashboardProps> = ({ onGoToShop }) => {
  const { currentProfile, tasks, completeTask, rewards } = useFamily();
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);

  // Filter tasks assigned to current child
  const childTasks = tasks.filter((t) => t.assigned_to === currentProfile.id);
  const pendingTasks = childTasks.filter((t) => t.status === 'pending');
  const waitingApprovalTasks = childTasks.filter((t) => t.status === 'waiting_approval');
  const completedTasks = childTasks.filter((t) => t.status === 'completed');

  // XP calculation (progress within the current level using xp_base)
  const xpCurrent = currentProfile.xp;
  const xpBase = currentProfile.xp_base || 0;
  const xpTarget = currentProfile.xp_to_next_level || 500;
  const xpSpan = Math.max(1, xpTarget - xpBase);
  const xpPercent = Math.min(100, Math.round(((xpCurrent - xpBase) / xpSpan) * 100));

  // Next reward goal (first reward in list or customized)
  const nextReward = rewards[1] || rewards[0] || {
    title: 'Novo Jogo',
    points_cost: 1000,
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9NudBvVDy9vrfO0u2RRChQemtR2M1BBtusLf9WKh8ApA6KlXoKP62BllMrpFU7Vrw8Y4L5BDCWsFYhJtkG4Zue3dpNbiNf0BWZK3lB0iAHUI1s6XlxudTv-pRzPvp9ZGuDRwqUIWo0PRXw-chh70E9E-4bds1OscRJ8Krg1jjHE6VnWYXLwL2DkiutKmlctQqfYiy-LvSvowugow2m7ZibVKXpilRX-527mhHD8Pcc8DXu23s7rYN'
  };
  const rewardGoalCost = nextReward.points_cost || 1000;
  const rewardProgressPercent = Math.min(100, Math.round((xpCurrent / rewardGoalCost) * 100));
  const pointsRemaining = Math.max(0, rewardGoalCost - xpCurrent);

  const handleComplete = async (taskId: string) => {
    setSubmittingTaskId(taskId);
    try {
      await completeTask(taskId);
    } finally {
      setSubmittingTaskId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Gamified Status Board */}
      <section className="glass-panel rounded-3xl p-5 md:p-6 shadow-[0px_12px_32px_rgba(79,70,229,0.12)] relative overflow-hidden border border-white/80">
        <div className="absolute -right-10 -top-10 w-36 h-36 bg-[#3525cd]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-[#8455ef]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#8455ef] text-white flex items-center justify-center font-heading text-2xl font-bold shadow-lg shadow-indigo-500/20 shrink-0">
              L{currentProfile.level}
            </div>

            <div>
              <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-900">
                Nível {currentProfile.level} - {currentProfile.title || 'Aventureiro'}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-xs font-bold text-[#6b38d4] bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100">
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  {currentProfile.xp} XP
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  / {xpTarget - xpBase} XP para o Nível {currentProfile.level + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Balance Widget */}
          <div className="bg-white rounded-2xl p-3.5 shadow-xs flex items-center gap-3 border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006e4b] flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Saldo
              </p>
              <p className="font-heading text-lg md:text-xl font-bold text-[#005338]">
                R$ {currentProfile.balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-5 relative z-10">
          <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-1.5">
            <span>Progresso de Experiência</span>
            <span className="text-[#3525cd]">{xpPercent}%</span>
          </div>
          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-[#3525cd] via-[#4f46e5] to-[#8455ef] progress-bar-stripes rounded-full transition-all duration-700"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Reward Goal */}
      <section>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-heading text-lg md:text-xl font-bold text-slate-900">
            Próximo Prêmio
          </h3>
          <button
            onClick={onGoToShop}
            className="text-xs font-bold text-[#3525cd] hover:text-[#2e1fb5] flex items-center gap-1"
          >
            Ver Loja <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 overflow-hidden shrink-0 shadow-xs">
            <img
              src={nextReward.image_url}
              alt={nextReward.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-end mb-1.5">
              <h4 className="font-heading text-sm md:text-base font-bold text-slate-900 truncate">
                {nextReward.title}
              </h4>
              <span className="text-xs font-bold text-[#3525cd] shrink-0">
                {xpCurrent} / {rewardGoalCost} pts
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#3525cd] rounded-full transition-all duration-500"
                style={{ width: `${rewardProgressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 font-medium mt-1 text-right">
              {pointsRemaining === 0 ? '🎉 Pronto para resgatar!' : `Faltam ${pointsRemaining} pts!`}
            </p>
          </div>
        </div>
      </section>

      {/* Tarefas de Hoje */}
      <section className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-heading text-lg md:text-xl font-bold text-slate-900">
            Tarefas de Hoje
          </h3>
          <span className="bg-indigo-50 text-[#3525cd] px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
            {pendingTasks.length} Restante{pendingTasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3">
          {/* Active / Pending Tasks */}
          {pendingTasks.map((task) => {
            const isSubmitting = submittingTaskId === task.id;

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl p-4 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 flex items-center justify-between gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#3525cd] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <TaskIcon name={task.icon_name} className="w-6 h-6" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-heading text-sm md:text-base font-bold text-slate-900 truncate">
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="bg-violet-50 text-[#6b38d4] px-2.5 py-0.5 rounded-full text-xs font-bold border border-violet-100 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-current" />
                        +{task.reward_value} XP
                      </span>
                      {task.reward_money && task.reward_money > 0 && (
                        <span className="bg-emerald-50 text-[#006e4b] px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-100">
                          R$ {task.reward_money.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mark as Done Button */}
                <button
                  onClick={() => handleComplete(task.id)}
                  disabled={isSubmitting}
                  data-testid={`complete-task-${task.id}`}
                  className="w-12 h-12 rounded-full border-2 border-slate-200 text-slate-400 hover:border-[#3525cd] hover:text-[#3525cd] hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-xs"
                  title="Concluir Tarefa"
                >
                  <Check className="w-5 h-5 stroke-[2.5px]" />
                </button>
              </div>
            );
          })}

          {/* Waiting for Approval Tasks */}
          {waitingApprovalTasks.map((task) => (
            <div
              key={task.id}
              className="bg-[#eff4ff] rounded-2xl p-4 border border-indigo-100 flex items-center justify-between gap-3 opacity-90"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-indigo-700 flex items-center justify-center shrink-0">
                  <TaskIcon name={task.icon_name} className="w-6 h-6" />
                </div>

                <div className="min-w-0">
                  <h4 className="font-heading text-sm md:text-base font-bold text-slate-600 line-through truncate">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-[#3525cd]">
                    <Hourglass className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs font-bold">Aguardando Aprovação</span>
                  </div>
                </div>
              </div>

              <div className="w-12 h-12 rounded-full bg-[#3525cd] text-white flex items-center justify-center shrink-0 shadow-sm cursor-default">
                <Check className="w-5 h-5 stroke-[3px]" />
              </div>
            </div>
          ))}

          {/* Completed Tasks of Today */}
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between gap-3 opacity-80"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#006e4b] flex items-center justify-center shrink-0">
                  <TaskIcon name={task.icon_name} className="w-6 h-6" />
                </div>

                <div className="min-w-0">
                  <h4 className="font-heading text-sm md:text-base font-bold text-slate-700 truncate">
                    {task.title}
                  </h4>
                  <p className="text-xs font-bold text-[#006e4b]">
                    Aprovada! (+{task.reward_value} XP)
                  </p>
                </div>
              </div>

              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          ))}

          {childTasks.length === 0 && (
            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100">
              <Award className="w-12 h-12 text-indigo-400 mx-auto mb-2" />
              <p className="font-heading font-bold text-slate-800">Nenhuma missão atribuída no momento!</p>
              <p className="text-xs text-slate-500 mt-1">Peça aos seus pais para adicionar novas missões para ganhar XP.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
