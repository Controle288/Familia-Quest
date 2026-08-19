import React, { useState } from 'react';
import { PlayCircle, Check, Star, Gift, UserCheck, Baby } from 'lucide-react';

interface MockTask {
  id: string;
  title: string;
  xp: number;
  status: 'pending' | 'waiting_approval' | 'completed';
}

const SEED: MockTask[] = [
  { id: 't1', title: 'Arrumar o quarto', xp: 50, status: 'pending' },
  { id: 't2', title: 'Lavar a louça', xp: 40, status: 'waiting_approval' },
  { id: 't3', title: 'Ler 15 páginas', xp: 100, status: 'completed' },
];

export const TutorialTab: React.FC = () => {
  const [view, setView] = useState<'parent' | 'child'>('parent');
  const [tasks, setTasks] = useState<MockTask[]>(SEED);
  const [xp, setXp] = useState(450);

  const childComplete = (id: string) =>
    setTasks((t) => t.map((x) => (x.id === id && x.status === 'pending' ? { ...x, status: 'waiting_approval' } : x)));

  const parentApprove = (id: string) => {
    setTasks((t) => t.map((x) => (x.id === id && x.status === 'waiting_approval' ? { ...x, status: 'completed' } : x)));
    const task = tasks.find((x) => x.id === id);
    if (task) setXp((v) => v + task.xp);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <PlayCircle className="w-7 h-7 text-[#3525cd]" />
        <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Tutorial interativo</h2>
      </div>
      <p className="text-sm text-slate-500">
        Simulador seguro — nada aqui afeta sua família real. Alterne entre os painéis e pratique.
      </p>

      <div className="flex rounded-full bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setView('parent')}
          className={`flex flex-1 items-center justify-center gap-2 h-10 rounded-full text-sm font-bold transition-all ${view === 'parent' ? 'bg-white text-[#3525cd] shadow dark:bg-slate-700' : 'text-slate-500'}`}
        >
          <UserCheck className="w-4 h-4" /> Painel do Responsável
        </button>
        <button
          onClick={() => setView('child')}
          className={`flex flex-1 items-center justify-center gap-2 h-10 rounded-full text-sm font-bold transition-all ${view === 'child' ? 'bg-white text-[#3525cd] shadow dark:bg-slate-700' : 'text-slate-500'}`}
        >
          <Baby className="w-4 h-4" /> Painel da Criança
        </button>
      </div>

      {view === 'parent' ? (
        <div className="space-y-3">
          <div className="rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
            <h3 className="font-heading font-bold text-slate-800 dark:text-white">Como o responsável age:</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1">
              <li>Cria missões e define XP e recompensa (R$).</li>
              <li>Aprova as missões que os filhos concluem.</li>
              <li>Concede mesada e gerencia a loja de prêmios.</li>
            </ul>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Missões enviadas pelos filhos (aprove para liberar XP):</p>
          {tasks.filter((t) => t.status !== 'completed').map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:bg-slate-800">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{t.title}</p>
                <p className="text-xs text-slate-500">{t.status === 'waiting_approval' ? 'Aguardando sua aprovação' : 'Pendente'}</p>
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
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            <div>
              <p className="font-heading font-bold text-slate-800 dark:text-white">Seu XP: {xp}</p>
              <p className="text-xs text-slate-500">Conclua missões para ganhar XP e resgatar prêmios!</p>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Suas missões:</p>
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:bg-slate-800">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{t.title}</p>
                <p className="text-xs text-slate-500">{t.xp} XP</p>
              </div>
              {t.status === 'completed' ? (
                <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><Check className="w-4 h-4" /> Feito</span>
              ) : t.status === 'waiting_approval' ? (
                <span className="text-xs font-semibold text-amber-600">Enviado ✓</span>
              ) : (
                <button onClick={() => childComplete(t.id)} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white">
                  Concluir
                </button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
            <Gift className="w-4 h-4" /> Na loja real, você resgata prêmios com o XP acumulado.
          </div>
        </div>
      )}
    </div>
  );
};
