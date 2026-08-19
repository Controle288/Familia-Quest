import React from 'react';
import { BarChart3, TrendingUp, CheckCircle2, Award, Clock, DollarSign } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

export const StatsTab: React.FC = () => {
  const { currentProfile, tasks, profiles } = useFamily();

  const myTasks = tasks.filter((t) => 
    currentProfile.role === 'parent' ? true : t.assigned_to === currentProfile.id
  );
  const completedCount = myTasks.filter((t) => t.status === 'completed').length;
  const pendingCount = myTasks.filter((t) => t.status === 'pending').length;
  const waitingCount = myTasks.filter((t) => t.status === 'waiting_approval').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <section className="bg-white rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100">
        <h2 className="font-heading text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#3525cd]" />
          Estatísticas & Desempenho
        </h2>
        <p className="text-slate-500 text-xs md:text-sm mt-1">
          Acompanhe métricas de pontuação, constância e tarefas finalizadas.
        </p>
      </section>

      {/* Grid of Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-400">Total Concluído</p>
          <p className="font-heading text-2xl md:text-3xl font-bold text-emerald-600 mt-1">
            {completedCount}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-400">Em Andamento</p>
          <p className="font-heading text-2xl md:text-3xl font-bold text-indigo-600 mt-1">
            {pendingCount}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-400">Em Avaliação</p>
          <p className="font-heading text-2xl md:text-3xl font-bold text-amber-500 mt-1">
            {waitingCount}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-400">Dias de Ofensiva</p>
          <p className="font-heading text-2xl md:text-3xl font-bold text-orange-500 mt-1">
            {currentProfile.streak_days} 🔥
          </p>
        </div>
      </section>

      {/* Breakdown per Child (for Parents) */}
      {currentProfile.role === 'parent' && (
        <section className="bg-white rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 space-y-4">
          <h3 className="font-heading text-lg font-bold text-slate-900">
            Desempenho por Criança
          </h3>

          <div className="space-y-4">
            {profiles
              .filter((p) => p.role === 'child')
              .map((child) => {
                const childTasks = tasks.filter((t) => t.assigned_to === child.id);
                const childCompleted = childTasks.filter((t) => t.status === 'completed').length;
                const rate = childTasks.length > 0 ? Math.round((childCompleted / childTasks.length) * 100) : 100;

                return (
                  <div key={child.id} className="p-4 rounded-2xl bg-[#f8f9ff] border border-slate-200/60">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={child.avatar_url}
                          alt={child.full_name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200"
                        />
                        <div>
                          <p className="font-heading font-bold text-slate-900 text-sm">
                            {child.full_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Nível {child.level} • {child.xp} XP • Saldo: R$ {child.balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <span className="font-heading font-bold text-indigo-700 text-sm">{rate}%</span>
                    </div>

                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#3525cd] to-[#8455ef] rounded-full"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
};
