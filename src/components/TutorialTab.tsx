import React, { useState } from 'react';
import { PlayCircle, Check, Star, Gift, UserCheck, Baby, Plus, Sparkles, Coins } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

interface MockTask {
  id: string;
  title: string;
  xp: number;
  status: 'pending' | 'waiting_approval' | 'completed';
}

interface MockReward {
  id: string;
  name: string;
  cost: number;
  emoji: string;
}

const SEED_TASKS: MockTask[] = [
  { id: 't1', title: 'Arrumar o quarto', xp: 50, status: 'pending' },
  { id: 't2', title: 'Lavar a louça', xp: 40, status: 'waiting_approval' },
  { id: 't3', title: 'Ler 15 páginas', xp: 100, status: 'completed' },
];

const REWARDS: MockReward[] = [
  { id: 'r1', name: 'Sorvete', cost: 120, emoji: '🍦' },
  { id: 'r2', name: 'Brinquedo', cost: 300, emoji: '🧸' },
  { id: 'r3', name: 'Cinema', cost: 200, emoji: '🎬' },
];

export const TutorialTab: React.FC = () => {
  const { currentProfile } = useFamily();
  const isParent = currentProfile?.role === 'parent';

  const [tasks, setTasks] = useState<MockTask[]>(SEED_TASKS);
  const [xp, setXp] = useState(450);
  const [flash, setFlash] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newXp, setNewXp] = useState('50');

  const notify = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 2600);
  };

  // Ações do filho
  const childComplete = (id: string) =>
    setTasks((t) =>
      t.map((x) => (x.id === id && x.status === 'pending' ? { ...x, status: 'waiting_approval' } : x)),
    );

  const childRedeem = (reward: MockReward) => {
    if (xp < reward.cost) {
      notify('Você ainda não tem XP suficiente para este prêmio.');
      return;
    }
    setXp((v) => v - reward.cost);
    notify(`Resgatado: ${reward.emoji} ${reward.name}!`);
  };

  // Ações do responsável
  const parentApprove = (id: string) => {
    const task = tasks.find((x) => x.id === id);
    setTasks((t) => t.map((x) => (x.id === id && x.status === 'waiting_approval' ? { ...x, status: 'completed' } : x)));
    if (task) {
      setXp((v) => v + task.xp);
      notify(`Aprovado! +${task.xp} XP para a criança.`);
    }
  };

  const parentCreate = () => {
    const title = newTitle.trim();
    const value = Math.max(0, Number(newXp) || 0);
    if (!title) return;
    setTasks((t) => [...t, { id: `n${Date.now()}`, title, xp: value, status: 'pending' }]);
    setNewTitle('');
    setNewXp('50');
    notify('Missão criada! Aparecerá para o filho concluir.');
  };

  const pendingApproval = tasks.filter((t) => t.status === 'waiting_approval').length;

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <PlayCircle className="w-7 h-7 text-[#3525cd]" />
        <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Tutorial interativo</h2>
      </div>
      <p className="text-sm text-slate-500">
        Simulador prático e seguro — aprenda mexendo na interface. Nada aqui afeta sua família real.
      </p>

      {flash && (
        <div className="rounded-2xl bg-[#3525cd] px-4 py-3 text-sm font-bold text-white shadow">
          {flash}
        </div>
      )}

      {/* RENDERIZAÇÃO CONDICIONAL POR PERFIL */}
      {isParent ? (
        /* ===== SIMULADOR DO RESPONSÁVEL ===== */
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
            <UserCheck className="w-7 h-7 text-[#3525cd]" />
            <div>
              <p className="font-heading font-bold text-slate-800 dark:text-white">Modo Responsável</p>
              <p className="text-xs text-slate-500">
                Pratique criar missões, aprovar tarefas e ver o XP da criança aumentar.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:bg-slate-800">
            Missões aguardando sua aprovação: <span className="font-bold text-[#3525cd]">{pendingApproval}</span>
          </div>

          {/* Passo 1: criar missão */}
          <section className="rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
            <h3 className="font-heading font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#3525cd]" /> 1. Crie uma missão
            </h3>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nome da missão (ex: Passear com o cachorro)"
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900"
              />
              <input
                value={newXp}
                onChange={(e) => setNewXp(e.target.value)}
                type="number"
                className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:bg-slate-900"
              />
              <button
                onClick={parentCreate}
                className="rounded-xl bg-[#3525cd] px-4 py-2 text-sm font-bold text-white active:scale-95 transition"
              >
                Adicionar
              </button>
            </div>
          </section>

          {/* Passo 2: aprovar */}
          <section className="rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
            <h3 className="font-heading font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Check className="w-4 h-4 text-[#3525cd]" /> 2. Aprove as missões
            </h3>
            <p className="mt-1 text-xs text-slate-500">Quando o filho conclui, a missão aparece aqui para você liberar o XP.</p>
            <div className="mt-3 space-y-2">
              {tasks
                .filter((t) => t.status !== 'completed')
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:bg-slate-800">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.status === 'waiting_approval' ? 'Aguardando sua aprovação' : 'Pendente (ainda não foi concluída)'}
                      </p>
                    </div>
                    <button
                      disabled={t.status !== 'waiting_approval'}
                      onClick={() => parentApprove(t.id)}
                      className="rounded-xl bg-[#3525cd] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                    >
                      Aprovar (+{t.xp} XP)
                    </button>
                  </div>
                ))}
            </div>
          </section>

          {/* Passo 3: gerenciar */}
          <section className="rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
            <h3 className="font-heading font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3525cd]" /> 3. Gerencie a família
            </h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1">
              <li>Conceda mesada e gerencie a loja de prêmios.</li>
              <li>Convide membros e remova quem não faz mais parte da família.</li>
              <li>Acompanhe o progresso de cada filho no painel.</li>
            </ul>
          </section>
        </div>
      ) : (
        /* ===== SIMULADOR DO FILHO ===== */
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
            <Baby className="w-7 h-7 text-emerald-500" />
            <div>
              <p className="font-heading font-bold text-slate-800 dark:text-white">Modo Criança</p>
              <p className="text-xs text-slate-500">
                Pratique concluir missões, acompanhar seu XP e resgatar prêmios.
              </p>
            </div>
          </div>

          {/* XP ao vivo */}
          <div className="flex items-center gap-3 rounded-3xl border border-amber-100 bg-amber-50 p-5 dark:bg-slate-900/70">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            <div>
              <p className="font-heading font-bold text-slate-800 dark:text-white">Seu XP: {xp}</p>
              <p className="text-xs text-slate-500">Ao concluir e o responsável aprovar, o XP entra aqui.</p>
            </div>
          </div>

          {/* Passo 1: concluir */}
          <section className="rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
            <h3 className="font-heading font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" /> 1. Conclua suas missões
            </h3>
            <div className="mt-3 space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:bg-slate-800">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">{t.title}</p>
                    <p className="text-xs text-slate-500">{t.xp} XP</p>
                  </div>
                  {t.status === 'completed' ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                      <Check className="w-4 h-4" /> Feito
                    </span>
                  ) : t.status === 'waiting_approval' ? (
                    <span className="text-xs font-semibold text-amber-600">Enviado ✓ (aguardando)</span>
                  ) : (
                    <button
                      onClick={() => {
                        childComplete(t.id);
                        notify('Missão enviada! Seu responsável vai aprovar e liberar o XP.');
                      }}
                      className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white active:scale-95 transition"
                    >
                      Concluir
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Passo 2: resgatar */}
          <section className="rounded-3xl border border-amber-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
            <h3 className="font-heading font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500" /> 2. Resgate recompensas
            </h3>
            <p className="mt-1 text-xs text-slate-500">Use o XP acumulado para resgatar prêmios na loja.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {REWARDS.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-3 text-center dark:bg-slate-800">
                  <div className="text-3xl">{r.emoji}</div>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-white">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.cost} XP</p>
                  <button
                    disabled={xp < r.cost}
                    onClick={() => childRedeem(r)}
                    className="mt-2 w-full rounded-xl bg-amber-400 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                  >
                    Resgatar
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <Coins className="w-4 h-4" /> Dica: quanto mais missões você conclui, mais XP acumula para resgatar prêmios!
          </div>
        </div>
      )}
    </div>
  );
};
