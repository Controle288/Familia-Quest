import React, { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { loadPlans, createCheckout } from '../lib/supabase';
import { Plan } from '../types';

export const PlanPanel: React.FC = () => {
  const {
    familySettings,
    isPremium,
    premiumExpiresAt,
    addToast,
  } = useFamily();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);

  useEffect(() => {
    loadPlans().then(setPlans);
  }, []);

  const startCheckout = async (planId: string) => {
    setCheckoutBusy(planId);
    try {
      const res = await createCheckout(planId);
      if (res?.url) window.location.href = res.url;
      else addToast('Pagamento indisponível', 'O administrador ainda não configurou o gateway.', 'error');
    } catch (err) {
      addToast('Erro ao iniciar pagamento', (err as Error).message, 'error');
    } finally {
      setCheckoutBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-slate-800 text-sm">Plano</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isPremium
              ? 'bg-amber-100 text-amber-700'
              : familySettings?.plan === 'premium'
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isPremium ? 'Premium' : familySettings?.plan === 'premium' ? 'Expirado' : 'Grátis'}
        </span>
      </div>
      <p className="text-sm text-slate-500">
        {(() => {
          if (!isPremium) {
            return familySettings?.plan === 'premium'
              ? 'Sua assinatura expirou. Renove para voltar a ter acesso premium.'
              : 'No plano grátis: até 2 responsáveis ou 1 responsável + 2 filhos, sem temas premium.';
          }
          if (!premiumExpiresAt) return 'Premium vitalício (pagamento único) para toda a família.';
          const days = Math.ceil((new Date(premiumExpiresAt).getTime() - Date.now()) / 86400000);
          const date = new Date(premiumExpiresAt).toLocaleDateString('pt-BR');
          return days > 0
            ? `Premium da família válido até ${date} (faltam ${days} ${days === 1 ? 'dia' : 'dias'}).`
            : `Premium da família expira hoje (${date}).`;
        })()}
      </p>
      {isPremium && premiumExpiresAt && (
        <p className="text-[11px] text-amber-600">
          Assinatura unificada da família — todos os membros têm o mesmo acesso e validade.
        </p>
      )}
      <div className="space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/50 p-3"
          >
            <div>
              <p className="font-semibold text-slate-800">{plan.name}</p>
              <p className="text-xs text-slate-500">
                R$ {plan.price} / {plan.interval === 'month' ? 'mês' : plan.interval === 'year' ? 'ano' : 'único'}
              </p>
            </div>
            {isPremium ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Ativo</span>
                <button
                  onClick={() => startCheckout(plan.id)}
                  disabled={checkoutBusy === plan.id}
                  className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2 text-sm font-bold text-white shadow hover:opacity-90 disabled:opacity-60"
                >
                  <Crown className="w-4 h-4" /> {checkoutBusy === plan.id ? 'Aguarde…' : 'Renovar'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => startCheckout(plan.id)}
                disabled={checkoutBusy === plan.id}
                className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2 text-sm font-bold text-white shadow hover:opacity-90 disabled:opacity-60"
              >
                <Crown className="w-4 h-4" /> {checkoutBusy === plan.id ? 'Aguarde…' : 'Assinar'}
              </button>
            )}
          </div>
        ))}
        {plans.length === 0 && (
          <p className="text-sm text-slate-400">Nenhum plano disponível no momento.</p>
        )}
      </div>
    </div>
  );
};
