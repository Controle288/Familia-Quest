import React from 'react';
import { Trophy, Flame, Sparkles, Award, Star, UserPlus, Heart, Users } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { BadgeShelf } from './BadgeShelf';
import { MotionList, MotionItem } from './motion';
import { BADGES, familyEarnedCount } from '../lib/badges';

export const SocialTab: React.FC = () => {
  const { profiles, family, copyInviteCode, activityLogs, tasks } = useFamily();

  const ctx = { tasks, activityLogs };

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

        <MotionList className="space-y-3">
          {sortedProfiles.map((p, idx) => {
            const medalColors = [
              'bg-amber-100 text-amber-800 border-amber-300',
              'bg-slate-100 text-slate-700 border-slate-300',
              'bg-amber-50 text-amber-700 border-amber-200',
            ];

            return (
              <MotionItem
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
                      Nível {p.level} • {p.title || (p.role === 'parent' ? 'Responsável' : 'Aventureiro')}
                    </p>
                    <BadgeShelf profile={p} ctx={ctx} className="mt-1.5" />
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
              </MotionItem>
            );
          })}
        </MotionList>
      </section>

      {/* Family Achievements Wall */}
      <section className="bg-white rounded-3xl p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.06)] border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8455ef]" />
            Conquistas da Família
          </h3>
          <span className="text-xs font-semibold text-slate-400">
            {BADGES.filter((b) => familyEarnedCount(b, profiles, ctx) > 0).length}/{BADGES.length} desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {BADGES.map((badge) => {
            const count = familyEarnedCount(badge, profiles, ctx);
            const unlocked = count > 0;
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-2xl border flex items-center gap-3 ${
                  unlocked
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-slate-50 border-slate-100'
                }`}
              >
                <span className={`text-2xl ${unlocked ? '' : 'grayscale opacity-50'}`}>{badge.icon}</span>
                <div className="min-w-0">
                  <p className="font-heading font-bold text-slate-900 text-xs truncate">{badge.label}</p>
                  <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{badge.description}</p>
                  <span
                    className={`text-[10px] font-bold mt-0.5 inline-block ${
                      unlocked ? 'text-amber-700' : 'text-slate-400'
                    }`}
                  >
                    {unlocked ? `${count} membro${count > 1 ? 's' : ''}` : 'Ninguém ainda'}
                  </span>
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
