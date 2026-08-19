import React from 'react';
import { BarChart3, TrendingUp, CheckCircle2, PieChart, Activity } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { BarChart, RingChart, SparkBars } from './charts';

export const StatsTab: React.FC = () => {
  const { currentProfile, tasks, profiles, activityLogs } = useFamily();

  const scopeTasks =
    currentProfile.role === 'parent'
      ? tasks
      : tasks.filter((t) => t.assigned_to === currentProfile.id);

  const completedCount = scopeTasks.filter((t) => t.status === 'completed').length;
  const pendingCount = scopeTasks.filter((t) => t.status === 'pending').length;
  const waitingCount = scopeTasks.filter((t) => t.status === 'waiting_approval').length;
  const total = scopeTasks.length || 1;
  const completionRate = Math.round((completedCount / total) * 100);

  const ringSegments = [
    { value: completedCount, color: '#10b981', label: 'Concluídas' },
    { value: waitingCount, color: '#f59e0b', label: 'Avaliação' },
    { value: pendingCount, color: '#94a3b8', label: 'Pendentes' },
  ];

  // XP ranking: children for parents, whole family for a child.
  const xpProfiles =
    currentProfile.role === 'parent'
      ? profiles.filter((p) => p.role === 'child')
      : profiles;
  const xpItems = xpProfiles
    .slice()
    .sort((a, b) => b.xp - a.xp)
    .map((p) => ({ label: p.full_name, value: p.xp }));

  // Activity over the last 7 days.
  const now = new Date();
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(d);
  }
  const activityLabels = days.map((d) =>
    d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)
  );
  const activityValues = days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    return activityLogs.filter((l) => (l.created_at || '').slice(0, 10) === key).length;
  });

  // Per-child completion rate (parents only).
  const childRates = profiles
    .filter((p) => p.role === 'child')
    .map((child) => {
      const ct = tasks.filter((t) => t.assigned_to === child.id);
      const rate = ct.length
        ? Math.round((ct.filter((t) => t.status === 'completed').length / ct.length) * 100)
        : 100;
      return { label: child.full_name, value: rate, color: 'linear-gradient(90deg,#3525cd,#8455ef)' };
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 dark:border-slate-700">
        <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#3525cd]" />
          Estatísticas & Desempenho
        </h2>
        <p className="text-slate-500 text-xs md:text-sm mt-1">
          Acompanhe métricas de pontuação, constância e tarefas finalizadas.
        </p>
      </section>

      {/* Grid of Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-400">Total Concluído</p>
          <p className="font-heading text-2xl md:text-3xl font-bold text-emerald-600 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-400">Em Andamento</p>
          <p className="font-heading text-2xl md:text-3xl font-bold text-indigo-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-400">Em Avaliação</p>
          <p className="font-heading text-2xl md:text-3xl font-bold text-amber-500 mt-1">{waitingCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-xs text-center">
          <p className="text-xs font-semibold text-slate-400">Dias de Ofensiva</p>
          <p className="font-heading text-2xl md:text-3xl font-bold text-orange-500 mt-1">
            {currentProfile.streak_days} 🔥
          </p>
        </div>
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 dark:border-slate-700 space-y-3">
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#3525cd]" />
            Distribuição de Conclusão
          </h3>
          <RingChart segments={ringSegments} centerLabel={`${completionRate}%`} />
          <div className="flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-emerald-500" /> Concluídas
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-amber-500" /> Avaliação
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 rounded-full bg-slate-400" /> Pendentes
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 dark:border-slate-700 space-y-3">
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#8455ef]" />
            Atividade (últimos 7 dias)
          </h3>
          <SparkBars values={activityValues} labels={activityLabels} />
          <p className="text-xs text-slate-500 text-center">
            {activityValues.reduce((a, b) => a + b, 0)} eventos registrados nesta semana
          </p>
        </div>
      </section>

      {/* XP ranking */}
      <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 dark:border-slate-700 space-y-4">
        <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#3525cd]" />
          {currentProfile.role === 'parent' ? 'XP por Criança' : 'Ranking de XP'}
        </h3>
        <BarChart items={xpItems} unit=" XP" />
      </section>

      {/* Per-child completion (parents) */}
      {currentProfile.role === 'parent' && childRates.length > 0 && (
        <section className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 dark:border-slate-700 space-y-4">
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Taxa de Conclusão por Criança
          </h3>
          <BarChart items={childRates} unit="%" />
        </section>
      )}
    </div>
  );
};
