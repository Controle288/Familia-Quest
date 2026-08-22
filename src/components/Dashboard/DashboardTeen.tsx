// Dashboard para Modo Teen/Gamer (10-14 anos) - Dark/Neon, XP, Nível, Achievements, RPG

import React from 'react';
import { Swords, Zap, Trophy, Goal } from 'lucide-react';
import { ChildProfile, FamiliaTask, FamiliaReward } from '../../mocks/familiaDataMock';
import { ThemeConfig } from './DashboardThemes';

interface DashboardTeenProps {
  profile: ChildProfile;
  theme: ThemeConfig;
}

const DashboardTeen: React.FC<DashboardTeenProps> = ({ profile, theme }) => {
  // Meta do Teen: usa a primeira recompensa disponível como "Wishlist"
  const currentGoal: FamiliaReward = profile.availableRewards[0];

  return (
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Perfil e Barra de XP */}
      <section>
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border-2`}>
          <div className="flex items-center gap-4 mb-4">
            <img src={profile.avatarUrl} alt="Avatar" className={`w-16 h-16 rounded-full ${theme.border} border-2 p-1`} />
            <div>
              <p className="text-xl font-bold flex items-center gap-2"><Swords className={`w-5 h-5 ${theme.primary}`} /> {profile.name} </p>
              <p className={`text-sm ${theme.secondary}`}>Classe: Estudante Herói</p>
            </div>
          </div>
          <div className='mb-3'>
            <div className='flex items-center justify-between mb-1 text-sm font-semibold'>
              <span>XP Atual ({profile.xp}/2000)</span>
              <span className={`${theme.primary}`}>LVL {profile.level}</span>
            </div>
            <div className={`w-full ${theme.accent} rounded-full h-3 overflow-hidden`}>
              <div
                className={`h-full ${theme.primary} transition-all duration-500`}
                style={{ width: `${(profile.xp / 2000) * 100}%` }}
              ></div>
            </div>
          </div>
          <p className="text-sm font-semibold text-center flex items-center justify-center gap-2">⭐ {profile.points} Pontos para Lojinha</p>
        </div>
      </section>

      {/* Missões Ativas - Modo Gamer */}
      <section className="col-span-1 lg:col-span-2">
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border-2 shadow-lg`}>
          <h3 className="text-lg font-bold mb-5 flex items-center gap-2"><Swords className={`w-5 h-5 ${theme.primary}`} /> Missões do Dia (Quest Log)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.tasks.map((task: FamiliaTask) => (
              <div
                key={task.id}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 ${task.status === 'concluida' ? 'border-teal-500 bg-teal-950/20' : task.status === 'em_progresso' ? 'border-amber-500 bg-amber-950/20' : 'border-gray-600 bg-gray-900'} hover:border-cyan-400 transition`}
              >
                <div className='p-3 bg-gray-800 rounded-lg'>{task.emoji}</div>
                <div className="flex-1">
                  <p className={`font-bold ${theme.primary}`}>{task.name}</p>
                  <p className={`text-xs ${theme.textMuted}`}>{task.description}</p>
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold ${theme.primary}`}>
                  <Zap size={14}/> +{task.points} ⭐ / +{task.xp ?? 0} XP
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conquistas (Achievements) */}
      <section>
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border-2`}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Trophy className={`w-5 h-5 ${theme.primary}`} /> Minhas Conquistas (Trophy Room)</h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className='p-2 bg-gray-800 rounded-lg flex flex-col items-center'><span className='text-3xl'>📚</span><span className='text-xs'>Leitor Focado</span></div>
            <div className='p-2 bg-gray-800 rounded-lg flex flex-col items-center'><span className='text-3xl'>🪥</span><span className='text-xs'>Dente Limpo</span></div>
            <div className='p-2 bg-gray-800 rounded-lg flex flex-col items-center opacity-40'><span className='text-3xl'>🐕</span><span className='text-xs'>Passeador Master</span></div>
            <div className='p-2 bg-gray-800 rounded-lg flex flex-col items-center opacity-40'><span className='text-3xl'>🧹</span><span className='text-xs'>Mestre do Quarto</span></div>
          </div>
        </div>
      </section>

      {/* Meta do Teen */}
      <section className="col-span-1 lg:col-span-2">
        <div className={`${theme.card} p-6 rounded-2xl ${theme.border} border-2`}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Goal className={`w-5 h-5 ${theme.primary}`} /> Minha Meta (Wishlist)</h3>
          <div className='flex items-center gap-5'>
            <div className='p-4 bg-gray-800 rounded-lg'><span className='text-4xl'>{currentGoal.emoji}</span></div>
            <div className='flex-1'>
              <p className='font-bold'>{currentGoal.name}</p>
              <p className='text-sm text-cyan-400'>Custo: ⭐ {currentGoal.cost} Pontos</p>
            </div>
            <button className={`${theme.primary} ${theme.border} border p-3 rounded-xl hover:bg-gray-700 transition`}>Trocar Pontos</button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default DashboardTeen;
