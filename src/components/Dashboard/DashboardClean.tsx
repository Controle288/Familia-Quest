// Dashboard para Modo Young Adult (15+ anos) - Minimalista, Finanças, Banco Digital, Metas

import React from 'react';
import { TrendingUp, FileText, PiggyBank, Target, Banknote } from 'lucide-react';
import { ChildProfile, FamiliaTask, FinancialGoal } from '../../mocks/familiaDataMock';
import { ThemeConfig } from './DashboardThemes';

interface DashboardCleanProps {
  profile: ChildProfile;
  theme: ThemeConfig;
}

const DashboardClean: React.FC<DashboardCleanProps> = ({ profile, theme }) => {
  // Meta financeira integrada ao perfil (com fallback caso não exista)
  const goal: FinancialGoal = profile.financialGoal ?? { name: 'Meta', target: 1, current: 0 };

  return (
    <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Saldo e Gráfico Semanal (Placeholder) */}
      <section className="col-span-1 lg:col-span-3">
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border shadow-sm`}>
          <div className='flex items-center justify-between mb-4'>
            <h3 className="text-lg font-bold flex items-center gap-2"><Banknote className={`w-5 h-5 ${theme.primary}`} /> Visão Geral do Saldo</h3>
            <p className='text-xs text-teal-400'>(+2.5% vs. semana passada)</p>
          </div>
          <p className="text-3xl font-extrabold mb-1">R$ {profile.balance.toFixed(2)}</p>
          <p className={`text-xs ${theme.textMuted} mb-5`}>Acumulado Semanal: R$ 12.00 (7 tarefas concluídas)</p>
          {/* Gráfico Semanal - Placeholder */}
          <div className={`w-full h-24 ${theme.accent} rounded-xl border ${theme.border} flex items-end p-2 gap-2`}>
            <div className='h-3 flex-1 bg-teal-400/50 rounded-t-sm'></div>
            <div className='h-5 flex-1 bg-teal-400/50 rounded-t-sm'></div>
            <div className='h-2 flex-1 bg-teal-400/50 rounded-t-sm'></div>
            <div className='h-8 flex-1 bg-teal-400/50 rounded-t-sm'></div>
            <div className='h-4 flex-1 bg-teal-400/50 rounded-t-sm'></div>
            <div className='h-6 flex-1 bg-teal-400 rounded-t-sm'></div>
            <div className='h-3 flex-1 bg-teal-400 rounded-t-sm'></div>
          </div>
        </div>
      </section>

      {/* Saldo de Pontos */}
      <section>
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border shadow-sm text-center`}>
          <PiggyBank className={`w-8 h-8 ${theme.primary} mx-auto mb-3`} />
          <p className="text-xl font-bold">{profile.points}</p>
          <p className={`text-sm ${theme.textMuted}`}>Pontos de Fidelidade</p>
        </div>
      </section>

      {/* Histórico de Tarefas (Extrato) */}
      <section className="col-span-1 lg:col-span-3">
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border shadow-sm`}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><FileText className={`w-5 h-5 ${theme.primary}`} /> Extrato de Atividades Recentes</h3>
          <div className="space-y-3">
            {profile.tasks.slice(0, 4).map((task: FamiliaTask) => (
              <div key={task.id} className={`flex items-center gap-4 p-3 ${theme.bg} rounded-lg border ${theme.border}`}>
                <div className='p-2 bg-gray-800 rounded'>{task.emoji}</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{task.name}</p>
                  <p className={`text-xs ${theme.textMuted}`}>{task.status === 'concluida' ? '05/06/2026' : 'Em progresso'}</p>
                </div>
                <div className="text-right flex items-center gap-1 text-teal-400 font-semibold text-sm">
                  {task.status === 'concluida' ? <TrendingUp size={16}/> : '+ '}
                  {task.xp ? `${task.xp} XP /` : ''} R$ {(task.points / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meta Financeira */}
      <section>
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border shadow-sm`}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Target className={`w-5 h-5 ${theme.primary}`} /> Meta de Economia</h3>
          <div className="mb-3">
            <p className="font-bold text-teal-300">{goal.name}</p>
            <p className={`text-sm ${theme.textMuted}`}>R$ {goal.current} de R$ {goal.target} economizados</p>
          </div>
          <div className={`w-full ${theme.accent} rounded-full h-3 overflow-hidden border ${theme.border}`}>
            <div
              className={`h-full bg-teal-400 transition-all duration-500`}
              style={{ width: `${(goal.current / goal.target) * 100}%` }}
            ></div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default DashboardClean;
