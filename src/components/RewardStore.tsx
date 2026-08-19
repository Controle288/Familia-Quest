import React, { useState } from 'react';
import { 
  Sparkles, 
  Filter, 
  Check, 
  Lock, 
  Gift, 
  Clock, 
  ShoppingBag,
  SlidersHorizontal
} from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { RewardCategory } from '../types';

export const RewardStore: React.FC = () => {
  const { currentProfile, rewards, redeemReward } = useFamily();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'entertainment', label: 'Jogos & Telas' },
    { id: 'food', label: 'Guloseimas' },
    { id: 'activity', label: 'Passeios' },
  ];

  const filteredRewards = rewards.filter((r) => {
    if (selectedCategory === 'all') return true;
    return r.category === selectedCategory;
  });

  const handleRedeem = async (rewardId: string) => {
    setRedeemingId(rewardId);
    try {
      await redeemReward(rewardId);
    } finally {
      setRedeemingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Hero: Points Balance */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#4f46e5] to-[#8455ef] p-6 md:p-8 shadow-[0px_12px_32px_rgba(79,70,229,0.2)] overflow-hidden text-white text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-2">
          <span className="text-xs md:text-sm font-bold text-indigo-100 uppercase tracking-widest">
            Meus Pontos
          </span>
          <div className="flex items-center justify-center gap-2 my-1">
            <span className="p-2 bg-[#6ffbbe]/20 text-[#6ffbbe] rounded-full">
              <Sparkles className="w-8 h-8 fill-current text-[#6ffbbe]" />
            </span>
            <span className="font-heading text-4xl md:text-5xl font-bold tracking-tight">
              {currentProfile.xp.toLocaleString('pt-BR')}
            </span>
          </div>
          <p className="text-sm md:text-base text-indigo-100/90 max-w-sm">
            Você está indo muito bem! Continue completando missões.
          </p>
        </div>
      </section>

      {/* Rewards Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-heading text-xl md:text-2xl font-bold text-slate-900">
            Loja de Recompensas
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs md:text-sm font-bold text-[#3525cd] hover:text-[#2e1fb5] flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Filter Pills */}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#3525cd] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {filteredRewards.map((reward) => {
            const canAfford = currentProfile.xp >= reward.points_cost;
            const pointsDifference = reward.points_cost - currentProfile.xp;
            const progressPercent = Math.min(100, Math.round((currentProfile.xp / reward.points_cost) * 100));
            const isRedeeming = redeemingId === reward.id;

            return (
              <div
                key={reward.id}
                className={`rounded-2xl border bg-white shadow-[0px_4px_20px_rgba(79,70,229,0.06)] overflow-hidden flex flex-col transition-all duration-300 ${
                  canAfford
                    ? 'border-slate-100 hover:-translate-y-1 hover:shadow-md'
                    : 'border-slate-100 opacity-85'
                }`}
              >
                {/* Image & Cost Badge */}
                <div className="h-36 bg-slate-100 relative overflow-hidden">
                  <img
                    src={reward.image_url}
                    alt={reward.title}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      canAfford ? 'group-hover:scale-105' : 'grayscale-[25%]'
                    }`}
                  />
                  <div
                    className={`absolute top-3 right-3 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-md text-xs font-bold ${
                      canAfford
                        ? 'bg-white/90 text-[#006e4b]'
                        : 'bg-slate-900/70 text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>{reward.points_cost.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 md:p-5 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <h3 className="font-heading font-bold text-base md:text-lg text-slate-900">
                      {reward.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-2">
                      {reward.description}
                    </p>
                  </div>

                  <div>
                    {/* Progress indicator */}
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          canAfford ? 'bg-[#006e4b] w-full' : 'bg-[#8455ef]'
                        }`}
                        style={{ width: canAfford ? '100%' : `${progressPercent}%` }}
                      />
                    </div>

                    {!canAfford && (
                      <p className="text-[11px] text-slate-400 text-right font-medium">
                        Faltam {pointsDifference} pontos
                      </p>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => handleRedeem(reward.id)}
                      disabled={!canAfford || isRedeeming}
                      className={`w-full h-11 rounded-full font-heading font-bold text-xs md:text-sm mt-3 flex items-center justify-center gap-1.5 transition-all ${
                        canAfford
                          ? 'bg-[#3525cd] text-white hover:bg-[#2e1fb5] shadow-md shadow-indigo-500/20 active:scale-95'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? (
                        <>
                          <Gift className="w-4 h-4" />
                          {isRedeeming ? 'Resgatando...' : 'Resgatar'}
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Bloqueado
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
