// Dashboard para Modo Kids (até 9 anos) - Lúdico, Emojis, Estrelas, Aventuras

import React from 'react';
import { CircleAlert } from 'lucide-react';
import { ChildProfile, FamiliaTask, FamiliaReward } from '../../mocks/familiaDataMock';
import { ThemeConfig } from './DashboardThemes';

interface DashboardKidsProps {
  profile: ChildProfile;
  theme: ThemeConfig;
}

const DashboardKids: React.FC<DashboardKidsProps> = ({ profile, theme }) => {
  const nextReward: FamiliaReward = profile.availableRewards[0]; // Pega a primeira como exemplo

  return (
    <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
      {/* Mapa de Aventuras (Placeholder) */}
      <section className="col-span-1 lg:col-span-2">
        <div className={`${theme.card} p-8 rounded-3xl ${theme.border} border-2 shadow-inner relative flex flex-col items-center justify-center min-h-[300px]`}>
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">🗺️ Meu Mapa de Aventuras</h2>
          <div className="flex gap-4">
            <span className="text-3xl">🏞️</span>
            <span className="text-3xl">🏞️</span>
            <span className="text-2xl text-amber-500 font-bold flex items-center gap-2">⭐ {profile.points}</span>
            <span className="text-3xl">🏞️</span>
            <span className="text-3xl">🏡</span>
          </div>
          <div className={`mt-6 p-4 text-sm ${theme.primary} font-bold rounded-2xl ${theme.border} border text-center`}>Nível {profile.level} - Happy Face! 🙂</div>
        </div>
      </section>

      {/* Próxima Recompensa */}
      <section>
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border-2 shadow-lg`}>
          <h3 className={`text-lg font-bold mb-4 ${theme.primary} text-center`}>✨ Próxima Recompensa</h3>
          <div className="flex items-center gap-4 p-4 rounded-xl ${theme.accent}">
            <span className="text-4xl">{nextReward.emoji}</span>
            <div>
              <p className="font-bold">{nextReward.name}</p>
              <p className="text-sm font-semibold flex items-center gap-1">⭐ {nextReward.cost} Estrelas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Tarefas - Modo Kids */}
      <section className="col-span-1 md:col-span-2 lg:col-span-3">
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border-2 shadow-lg`}>
          <h3 className="text-lg font-bold mb-5 flex items-center gap-2">✅ Minhas Aventuras do Dia</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.tasks.map((task: FamiliaTask) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 p-5 rounded-xl border-2 ${task.status === 'concluida' ? 'border-teal-500 bg-teal-950/20' : task.status === 'em_progresso' ? 'border-amber-500 bg-amber-950/20' : 'border-gray-600 bg-gray-900'}`}
              >
                <span className="text-4xl">{task.emoji}</span>
                <div className="flex-1">
                  <p className={`font-bold ${theme.primary}`}>{task.name}</p>
                  <p className={`text-sm ${theme.textMuted}`}>{task.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {task.status === 'concluida' ? (
                    <span className="text-teal-400">✔️ Salva</span>
                  ) : task.status === 'em_progresso' ? (
                    <span className="text-amber-400">🚧 Fazendo</span>
                  ) : (
                    <span className="text-gray-400 flex items-center gap-1"><CircleAlert size={16}/> Pendente</span>
                  )}
                  <span className={`text-sm font-semibold ${theme.secondary} flex items-center gap-1`}>
                    ⭐ {task.points} Pontos
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default DashboardKids;
