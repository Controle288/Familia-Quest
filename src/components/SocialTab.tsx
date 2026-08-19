import React from 'react';
import { Trophy, Flame, Sparkles, Award, Star, UserPlus, Heart } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

export const SocialTab: React.FC = () => {
  const { profiles, family, copyInviteCode, activityLogs } = useFamily();

  // Sort profiles by XP for leaderboard
  const sortedProfiles = [...profiles].sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-6 pb-12">
      {/* Family Banner */}
      <section className="bg-white rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-[#4f46e5] text-white flex items-center justify-center font-heading text-2xl font-bold shadow-md shrink-0">
            FS
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900">{family.name}</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              {profiles.length} membros na guilda • Aventura em andamento
            </p>
          </div>
        </div>

        <button
          onClick={copyInviteCode}
          className="h-10 px-5 rounded-full bg-indigo-50 text-[#3525cd] hover:bg-indigo-100 font-semibold text-xs flex items-center gap-1.5 transition-all"
        >
          <UserPlus className="w-4 h-4" /> Convidar Membro
        </button>
      </section>

      {/* Leaderboard / Ranking */}
      <section className="bg-white rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Ranking da Família
          </h3>
          <span className="text-xs font-semibold text-slate-400">Temporada Atual</span>
        </div>

        <div className="space-y-3">
          {sortedProfiles.map((p, idx) => {
            const medalColors = [
              'bg-amber-100 text-amber-800 border-amber-300',
              'bg-slate-100 text-slate-700 border-slate-300',
              'bg-amber-50 text-amber-700 border-amber-200',
            ];

            return (
              <div
                key={p.id}
                className="p-4 rounded-2xl border border-slate-100 bg-[#f8f9ff]/70 flex items-center justify-between gap-3 hover:bg-indigo-50/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                      medalColors[idx] || 'bg-slate-50 text-slate-500'
                    }`}
                  >
                    {idx + 1}º
                  </div>

                  <img
                    src={p.avatar_url}
                    alt={p.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                  />

                  <div>
                    <h4 className="font-heading font-bold text-slate-900 text-sm md:text-base">
                      {p.full_name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Nível {p.level} • {p.title || (p.role === 'parent' ? 'Pai/Mãe' : 'Aventureiro')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-heading font-bold text-base md:text-lg text-[#3525cd] block">
                    {p.xp} XP
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-orange-600 font-bold justify-end">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    {p.streak_days} dias
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Activity Feed */}
      <section className="bg-white rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 space-y-4">
        <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
          <Star className="w-5 h-5 text-[#8455ef]" />
          Mural de Conquistas
        </h3>

        <div className="space-y-3">
          {activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{log.profile_name}</span> completou{' '}
                  <span className="font-semibold text-[#3525cd]">"{log.title}"</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  +{log.points_change} XP
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              Nenhuma atividade recente registrada hoje.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
