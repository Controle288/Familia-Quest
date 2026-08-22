// Dashboard para Modo Young Adult / Clean (15+ anos)
// Layout minimalista e moderno estilo Fintech / Banco Digital. Exibição de
// extrato de tarefas, saldo acumulado, meta financeira e gráfico simples de
// rendimento semanal.

import React, { useState } from 'react';
import { TrendingUp, FileText, PiggyBank, Target, Banknote, ArrowDownRight, Pencil } from 'lucide-react';
import { ChildProfile, FamiliaTask, FinancialGoal, FamiliaReward } from '../../mocks/familiaDataMock';
import { ThemeConfig } from './DashboardThemes';

interface DashboardCleanProps {
  profile: ChildProfile;
  theme: ThemeConfig;
  onCompleteTask: (id: string) => void;
  onRedeem: (reward: FamiliaReward) => void;
  onSetGoal?: (goal: { name: string; target: number; current: number }) => void;
}

// Rendimento semanal simulado (R$) para o gráfico de barras simples.
const WEEKLY_EARNINGS = [8, 12, 5, 15, 9, 14, 11];

const DashboardClean: React.FC<DashboardCleanProps> = ({ profile, theme, onCompleteTask, onSetGoal }) => {
  const goal: FinancialGoal = profile.financialGoal ?? { name: 'Meta', target: 1, current: 0 };
  const goalProgress = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const maxWeek = Math.max(...WEEKLY_EARNINGS);

  const completed = profile.tasks.filter((t) => t.status === 'concluida').length;
  const weekTotal = WEEKLY_EARNINGS.reduce((a, b) => a + b, 0);

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalName, setGoalName] = useState(goal.name);
  const [goalTarget, setGoalTarget] = useState(String(goal.target));
  const [goalCurrent, setGoalCurrent] = useState(String(goal.current));

  const saveGoal = () => {
    const target = Math.max(0, Number(goalTarget) || 0);
    const current = Math.max(0, Number(goalCurrent) || 0);
    onSetGoal?.({ name: goalName.trim() || 'Minha Meta', target, current });
    setEditingGoal(false);
  };

  return (
    <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* SALDO + GRÁFICO SEMANAL */}
      <section className="col-span-1 lg:col-span-3">
        <div className={`${theme.card} ${theme.border} border rounded-2xl p-6 ${theme.glow}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-extrabold flex items-center gap-2 ${theme.text}`}>
              <Banknote className={`w-5 h-5 ${theme.primary}`} /> Visão Geral do Saldo
            </h3>
            <span className={`text-xs font-semibold flex items-center gap-1 ${theme.secondary}`}>
              <TrendingUp className="w-3.5 h-3.5" /> +{((weekTotal / 50) * 100).toFixed(1)}% vs. semana passada
            </span>
          </div>
          <p className={`text-4xl font-extrabold mb-1 ${theme.text}`}>R$ {profile.balance.toFixed(2)}</p>
          <p className={`text-xs ${theme.textMuted} mb-6`}>
            Acumulado na semana: R$ {weekTotal.toFixed(2)} • {completed} tarefas concluídas
          </p>

          {/* Gráfico de barras simples de rendimento semanal */}
          <div className={`w-full h-28 ${theme.accent} rounded-xl border ${theme.border} flex items-end gap-2 p-3`}>
            {WEEKLY_EARNINGS.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                <span className={`text-[10px] font-bold ${theme.textMuted} opacity-0 group-hover:opacity-100`}>R${v}</span>
                <div
                  className={`w-full ${theme.primaryBg} rounded-t-md transition-all`}
                  style={{ height: `${(v / maxWeek) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className={`flex justify-between mt-2 text-[10px] ${theme.textMuted}`}>
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
              <span key={d} className="flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>
      </section>

      {/* SALDO DE PONTOS */}
      <section>
        <div className={`${theme.card} ${theme.border} border rounded-2xl p-6 text-center`}>
          <PiggyBank className={`w-8 h-8 ${theme.primary} mx-auto mb-3`} />
          <p className={`text-2xl font-extrabold ${theme.text}`}>{profile.points}</p>
          <p className={`text-sm ${theme.textMuted}`}>Pontos de Fidelidade</p>
        </div>
      </section>

      {/* EXTRATO DE ATIVIDADES */}
      <section className="col-span-1 lg:col-span-3">
        <div className={`${theme.card} ${theme.border} border rounded-2xl p-6`}>
          <h3 className={`text-lg font-extrabold mb-4 flex items-center gap-2 ${theme.text}`}>
            <FileText className={`w-5 h-5 ${theme.primary}`} /> Extrato de Atividades Recentes
          </h3>
          <div className="space-y-3">
            {profile.tasks.slice(0, 5).map((task: FamiliaTask) => {
              const earning = task.monetaryValue ?? task.points / 100;
              return (
                <div key={task.id} className={`flex items-center gap-4 p-3 ${theme.accent} rounded-xl border ${theme.border}`}>
                  <div className={`p-2 rounded-lg ${theme.card} text-xl`}>{task.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${theme.text}`}>{task.name}</p>
                    <p className={`text-xs ${theme.textMuted}`}>
                      {task.status === 'concluida' ? 'Concluída • hoje' : 'Em progresso'}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-1 font-semibold text-sm">
                    {task.status === 'concluida' ? (
                      <>
                        <ArrowDownRight className={`w-4 h-4 ${theme.primary}`} />
                        <span className={theme.primary}>+ R$ {earning.toFixed(2)}</span>
                      </>
                    ) : (
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold ${theme.primaryBg} ${theme.primaryText} active:scale-95 transition`}
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* META FINANCEIRA */}
      <section>
        <div className={`${theme.card} ${theme.border} border rounded-2xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-extrabold flex items-center gap-2 ${theme.text}`}>
              <Target className={`w-5 h-5 ${theme.primary}`} /> Meta de Economia
            </h3>
            {onSetGoal && !editingGoal && (
              <button
                onClick={() => {
                  setGoalName(goal.name);
                  setGoalTarget(String(goal.target));
                  setGoalCurrent(String(goal.current));
                  setEditingGoal(true);
                }}
                className={`flex items-center gap-1 text-xs font-bold ${theme.primary} ${theme.accent} px-3 py-1.5 rounded-full`}
              >
                <Pencil className="w-3.5 h-3.5" /> Editar
              </button>
            )}
          </div>

          {editingGoal ? (
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${theme.textMuted}`}>Nome da meta</label>
                <input
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded-lg ${theme.bg} ${theme.border} border ${theme.text} text-sm outline-none`}
                  placeholder="Ex: Economizar para o celular"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-semibold ${theme.textMuted}`}>Atual (R$)</label>
                  <input
                    type="number"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
                    className={`w-full mt-1 px-3 py-2 rounded-lg ${theme.bg} ${theme.border} border ${theme.text} text-sm outline-none`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${theme.textMuted}`}>Objetivo (R$)</label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className={`w-full mt-1 px-3 py-2 rounded-lg ${theme.bg} ${theme.border} border ${theme.text} text-sm outline-none`}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveGoal}
                  className={`flex-1 py-2.5 rounded-xl font-extrabold text-sm ${theme.primaryBg} ${theme.primaryText} active:scale-95 transition`}
                >
                  Salvar Meta
                </button>
                <button
                  onClick={() => setEditingGoal(false)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm ${theme.accent} ${theme.text}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className={`font-bold ${theme.text}`}>{goal.name}</p>
              <p className={`text-sm ${theme.textMuted} mb-3`}>
                R$ {goal.current.toFixed(2)} de R$ {goal.target.toFixed(2)}
              </p>
              <div className={`w-full ${theme.accent} rounded-full h-3 overflow-hidden border ${theme.border}`}>
                <div className={`h-full ${theme.primaryBg} transition-all duration-500`} style={{ width: `${goalProgress}%` }} />
              </div>
              <p className={`text-xs mt-2 ${theme.textMuted}`}>{goalProgress}% alcançado</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default DashboardClean;
