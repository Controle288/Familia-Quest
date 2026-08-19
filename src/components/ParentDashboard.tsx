import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  X, 
  Plus, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Filter, 
  PlusCircle, 
  Gift, 
  Layers,
  Award,
  AlertCircle,
  Coins
} from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { TaskIcon } from './TaskIcon';
import { ParentSubTab } from '../types';

interface ParentDashboardProps {
  onOpenCreateTask: () => void;
  onOpenCreateReward: () => void;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  onOpenCreateTask,
  onOpenCreateReward,
}) => {
  const {
    family,
    tasks,
    profiles,
    rewards,
    redemptions,
    parentSubTab,
    setParentSubTab,
    approveTask,
    rejectTask,
    deleteTask,
    copyInviteCode,
    grantAllowance,
  } = useFamily();

  const [filterChildId, setFilterChildId] = useState<string>('all');
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  // Stats calculations
  const totalPoints = profiles
    .filter((p) => p.role === 'child')
    .reduce((acc, curr) => acc + curr.xp, 0);

  const pendingApprovalTasks = tasks.filter((t) => t.status === 'waiting_approval');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const totalTasksCount = tasks.length;
  const completionRate = totalTasksCount > 0 
    ? Math.round((completedTasks.length / totalTasksCount) * 100) 
    : 85;

  const handleApprove = async (taskId: string) => {
    setLoadingTaskId(taskId);
    try {
      await approveTask(taskId);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleRejectConfirm = async (taskId: string) => {
    await rejectTask(taskId, rejectReason);
    setRejectingTaskId(null);
    setRejectReason('');
  };

  const getChildName = (assignedToId: string) => {
    const profile = profiles.find((p) => p.id === assignedToId);
    return profile ? profile.full_name : 'Filho(a)';
  };

  const filteredManageTasks = tasks.filter((t) => {
    if (filterChildId === 'all') return true;
    return t.assigned_to === filterChildId;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Code Section */}
      <section className="bg-[#eff4ff] rounded-2xl p-5 md:p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.08)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-100/60">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#0b1c30]">
            Painel dos Pais
          </h2>
          <p className="text-slate-600 text-sm md:text-base mt-1">
            Gerencie tarefas, recompensas e acompanhe o progresso.
          </p>
        </div>

        <div className="bg-white rounded-xl p-3 flex items-center justify-between gap-3 border border-indigo-100 shadow-xs w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Código de Convite
            </span>
            <span className="font-heading font-bold text-sm md:text-base text-[#3525cd] tracking-widest">
              {family.invite_code}
            </span>
          </div>
          <button
            onClick={copyInviteCode}
            className="w-10 h-10 rounded-full bg-[#8455ef]/10 text-[#6b38d4] hover:bg-[#8455ef]/20 transition-all flex items-center justify-center shrink-0 active:scale-95"
            title="Copiar código"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Quick Stats Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de Pontos */}
        <div className="bg-white rounded-2xl p-5 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#3525cd]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-600">Total de Pontos</span>
            <span className="p-2 bg-indigo-50 text-[#3525cd] rounded-full">
              <Sparkles className="w-4 h-4 fill-current" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl md:text-4xl font-bold text-[#0b1c30]">
              {totalPoints.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold text-[#6b38d4] bg-violet-50 px-2 py-0.5 rounded-full">
              +150 esta semana
            </span>
          </div>
        </div>

        {/* Tarefas para Avaliar */}
        <div className="bg-white rounded-2xl p-5 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#6b38d4]/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-600">Tarefas para Avaliar</span>
            <span className="p-2 bg-violet-50 text-[#6b38d4] rounded-full">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-heading text-3xl md:text-4xl font-bold text-[#0b1c30]">
              {pendingApprovalTasks.length}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Aguardando aprovação
            </span>
          </div>
        </div>

        {/* Taxa de Conclusão */}
        <div className="bg-white rounded-2xl p-5 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-600">Taxa de Conclusão</span>
            <span className="p-2 bg-emerald-50 text-[#006e4b] rounded-full">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="font-heading text-3xl md:text-4xl font-bold text-[#0b1c30]">
              {completionRate}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#3525cd] to-[#6b38d4] h-full rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="bg-white rounded-2xl shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => setParentSubTab('pendentes')}
            className={`flex-1 py-3.5 px-4 text-center text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              parentSubTab === 'pendentes'
                ? 'border-[#3525cd] text-[#3525cd] bg-indigo-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pendentes</span>
            {pendingApprovalTasks.length > 0 && (
              <span className="bg-[#3525cd] text-white text-[11px] px-2 py-0.2 rounded-full font-bold">
                {pendingApprovalTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setParentSubTab('gerenciar')}
            className={`flex-1 py-3.5 px-4 text-center text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              parentSubTab === 'gerenciar'
                ? 'border-[#3525cd] text-[#3525cd] bg-indigo-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Gerenciar</span>
          </button>

          <button
            onClick={() => setParentSubTab('loja')}
            className={`flex-1 py-3.5 px-4 text-center text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              parentSubTab === 'loja'
                ? 'border-[#3525cd] text-[#3525cd] bg-indigo-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Loja</span>
          </button>
        </div>

        {/* Tab 1: PENDENTES (Tasks Waiting for Approval) */}
        {parentSubTab === 'pendentes' && (
          <div className="p-4 md:p-6 space-y-4">
            {pendingApprovalTasks.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-slate-800 text-lg">
                  Nenhuma tarefa aguardando aprovação!
                </h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
                  Quando seus filhos marcarem uma missão como concluída, ela aparecerá aqui para você aprovar ou pedir ajustes.
                </p>
              </div>
            ) : (
              pendingApprovalTasks.map((task) => {
                const childName = getChildName(task.assigned_to);
                const isLoading = loadingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className="bg-[#f8f9ff] border border-slate-200/80 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3.5 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100/70 text-[#3525cd] flex items-center justify-center shrink-0 shadow-xs">
                        <TaskIcon name={task.icon_name} className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-heading font-bold text-slate-900 text-base md:text-lg">
                            {task.title}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full border border-violet-200 bg-violet-50 text-[#6b38d4] text-xs font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 fill-current" />
                            {task.reward_value} XP
                          </span>
                          {task.reward_money && task.reward_money > 0 && (
                            <span className="px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-[#006e4b] text-xs font-bold">
                              R$ {task.reward_money.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-slate-500 font-medium">
                          Feito por: <span className="text-slate-800 font-semibold">{childName}</span> • {task.submitted_at || 'Hoje'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 w-full md:w-auto">
                      <button
                        onClick={() => setRejectingTaskId(task.id)}
                        disabled={isLoading}
                        className="flex-1 md:flex-none h-11 px-5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all border border-rose-200 active:scale-95"
                      >
                        <X className="w-4 h-4" />
                        Rejeitar
                      </button>
                      <button
                        onClick={() => handleApprove(task.id)}
                        disabled={isLoading}
                        data-testid={`approve-task-${task.id}`}
                        className="flex-1 md:flex-none h-11 px-6 rounded-full bg-[#3525cd] text-white hover:bg-[#2e1fb5] font-semibold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
                      >
                        <Check className="w-4 h-4 stroke-[3px]" />
                        {isLoading ? 'Aprovando...' : 'Aprovar'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Reject Modal */}
            {rejectingTaskId && (
              <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                  <div className="flex items-center gap-2 text-rose-600 font-heading font-bold text-lg">
                    <AlertCircle className="w-5 h-5" />
                    Solicitar Ajuste na Tarefa
                  </div>
                  <p className="text-sm text-slate-600">
                    Explique brevemente para o seu filho o que ainda precisa ser finalizado.
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ex: Por favor guarde os sapatos dentro do armário antes de concluir."
                    className="w-full h-24 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setRejectingTaskId(null)}
                      className="px-4 py-2 rounded-full text-slate-600 hover:bg-slate-100 font-semibold text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleRejectConfirm(rejectingTaskId)}
                      className="px-5 py-2 rounded-full bg-rose-600 text-white font-semibold text-sm hover:bg-rose-700 shadow-md"
                    >
                      Confirmar Devolução
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: GERENCIAR (All Tasks & Creation) */}
        {parentSubTab === 'gerenciar' && (
          <div className="p-4 md:p-6 space-y-4">
            {/* Mesada dos filhos */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-[#006e4b] rounded-full">
                  <Coins className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-[#006e4b] text-sm">Mesada dos Filhos</h3>
                  <p className="text-xs text-emerald-700/80">
                    Adicione saldo (R$) para que possam resgatar prêmios na loja.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {profiles
                  .filter((p) => p.role === 'child')
                  .map((child) => (
                    <div
                      key={child.id}
                      className="bg-white rounded-xl border border-emerald-100 p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-heading font-bold text-slate-800 text-sm">{child.full_name}</p>
                        <p className="text-xs text-emerald-700 font-semibold">
                          R$ {child.balance.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[5, 10, 20].map((value) => (
                          <button
                            key={value}
                            onClick={() => grantAllowance(child.id, value)}
                            className="h-8 px-2.5 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                          >
                            +{value}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Filtrar por:</span>
                <select
                  value={filterChildId}
                  onChange={(e) => setFilterChildId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-lg px-2.5 py-1.5 text-slate-700"
                >
                  <option value="all">Todos os Filhos</option>
                  {profiles
                    .filter((p) => p.role === 'child')
                    .map((child) => (
                      <option key={child.id} value={child.id}>
                        {child.full_name}
                      </option>
                    ))}
                </select>
              </div>

              <button
                onClick={onOpenCreateTask}
                className="h-10 px-5 rounded-full bg-[#3525cd] text-white hover:bg-[#2e1fb5] font-semibold text-xs md:text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                Nova Missão
              </button>
            </div>

            <div className="space-y-3">
              {filteredManageTasks.map((task) => {
                const child = profiles.find((p) => p.id === task.assigned_to);
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#3525cd] flex items-center justify-center shrink-0">
                        <TaskIcon name={task.icon_name} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-heading font-bold text-slate-800 text-sm">{task.title}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              task.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : task.status === 'waiting_approval'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.status === 'completed'
                              ? 'Concluída'
                              : task.status === 'waiting_approval'
                              ? 'Aguardando Aprovação'
                              : 'Pendente'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Atribuído a: <span className="font-semibold text-slate-700">{child?.full_name}</span> • {task.reward_value} XP
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-slate-400 hover:text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Excluir Missão"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: LOJA (Manage Rewards & Redemption Requests) */}
        {parentSubTab === 'loja' && (
          <div className="p-4 md:p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-slate-800 text-base">Recompensas da Família</h3>
                <p className="text-xs text-slate-500">Defina os prêmios que seus filhos podem resgatar com os pontos.</p>
              </div>
              <button
                onClick={onOpenCreateReward}
                className="h-10 px-5 rounded-full bg-[#3525cd] text-white hover:bg-[#2e1fb5] font-semibold text-xs md:text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                Novo Prêmio
              </button>
            </div>

            {/* Redemptions queue */}
            {redemptions.length > 0 && (
              <div className="bg-violet-50/70 rounded-2xl p-4 border border-violet-100 space-y-3">
                <h4 className="font-heading font-bold text-[#6b38d4] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Prêmios Resgatados Recentemente
                </h4>
                <div className="space-y-2">
                  {redemptions.map((r) => (
                    <div key={r.id} className="bg-white p-3 rounded-xl flex items-center justify-between text-xs border border-violet-100">
                      <div>
                        <span className="font-bold text-slate-800">{r.profile_name}</span> resgatou <span className="font-semibold text-[#3525cd]">{r.reward_title}</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                        {r.points_spent} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reward list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-xs flex flex-col"
                >
                  <div className="h-28 bg-slate-100 relative">
                    <img
                      src={reward.image_url}
                      alt={reward.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-bold text-[#006e4b] flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3 h-3 fill-current" />
                      {reward.points_cost} pts
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-slate-800 text-sm">{reward.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{reward.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
