import React, { useEffect, useState } from 'react';
import {
  supabase,
  loadPlans,
  adminSavePlan,
  adminDeletePlan,
  loadPaymentSettings,
  adminSavePaymentSettings,
  loadAllTickets,
  adminReplyTicket,
  loadAdminFamilies,
  adminSetFamilyPremium,
  type AdminFamily,
} from '../lib/supabase';
import { Plan, PaymentSettings, PaymentProvider, SupportTicket } from '../types';
import { useFamily } from '../context/FamilyContext';

type AdminSection = 'overview' | 'families' | 'plans' | 'payments' | 'tickets';

const emptyPlan: Omit<Plan, 'id' | 'created_at'> = {
  name: '',
  price: 0,
  interval: 'month',
  limits: {},
  is_active: true,
};

export const AdminPanel: React.FC = () => {
  const { addToast } = useFamily();
  const [section, setSection] = useState<AdminSection>('overview');
  const [stats, setStats] = useState<{ families: number; members: number; premium: number } | null>(null);

  // Plans
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planDraft, setPlanDraft] = useState<Omit<Plan, 'id' | 'created_at'> | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  // Payments
  const [payment, setPayment] = useState<PaymentSettings | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Tickets
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketReply, setTicketReply] = useState<string>('');
  const [openTicketId, setOpenTicketId] = useState<string | null>(null);

  // Families
  const [families, setFamilies] = useState<AdminFamily[]>([]);
  const [familyBusy, setFamilyBusy] = useState<string | null>(null);

  const refreshPlans = async () => {
    const list = await loadPlans();
    setPlans(list);
  };

  const refreshTickets = async () => {
    const list = await loadAllTickets();
    setTickets(list);
  };

  const refreshPayment = async () => {
    const p = await loadPaymentSettings();
    setPayment(p);
  };

  const refreshFamilies = async () => {
    const list = await loadAdminFamilies();
    setFamilies(list);
  };

  const refreshStats = async () => {
    const [{ count: families }, { count: members }, { count: premium }] = await Promise.all([
      supabase.from('families').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('family_settings').select('*', { count: 'exact', head: true }).eq('plan', 'premium'),
    ]);
    setStats({ families: families ?? 0, members: members ?? 0, premium: premium ?? 0 });
  };

  useEffect(() => {
    if (section === 'overview') refreshStats();
    if (section === 'plans') refreshPlans();
    if (section === 'payments') refreshPayment();
    if (section === 'families') refreshFamilies();
    if (section === 'tickets') refreshTickets();
  }, [section]);

  const toggleFamilyPremium = async (fam: AdminFamily) => {
    setFamilyBusy(fam.id);
    try {
      await adminSetFamilyPremium(fam.id, !fam.admin_managed);
      addToast(
        fam.admin_managed ? 'Premium revogado' : 'Premium concedido',
        `A família "${fam.name}" foi atualizada.`,
        'success'
      );
      refreshFamilies();
    } catch {
      addToast('Erro ao atualizar a família.', 'error');
    } finally {
      setFamilyBusy(null);
    }
  };

  const handleSavePlan = async () => {
    if (!planDraft || !planDraft.name.trim()) {
      addToast('Dê um nome ao plano.', 'error');
      return;
    }
    setPlanLoading(true);
    try {
      await adminSavePlan(planDraft);
      addToast('Plano salvo!', 'success');
      setPlanDraft(null);
      refreshPlans();
    } catch {
      addToast('Erro ao salvar plano.', 'error');
    } finally {
      setPlanLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Excluir este plano?')) return;
    try {
      await adminDeletePlan(id);
      refreshPlans();
    } catch {
      addToast('Erro ao excluir.', 'error');
    }
  };

  const handleSavePayment = async () => {
    if (!payment) return;
    setPaymentLoading(true);
    try {
      await adminSavePaymentSettings(payment);
      addToast('Configuração de pagamento salva!', 'success');
    } catch {
      addToast('Erro ao salvar pagamento.', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleReplyTicket = async (id: string) => {
    if (!ticketReply.trim()) return;
    try {
      await adminReplyTicket(id, ticketReply.trim(), 'answered');
      addToast('Resposta enviada!', 'success');
      setTicketReply('');
      setOpenTicketId(null);
      refreshTickets();
    } catch {
      addToast('Erro ao responder.', 'error');
    }
  };

  const tabs: { id: AdminSection; label: string }[] = [
    { id: 'overview', label: 'Visão geral' },
    { id: 'families', label: 'Famílias' },
    { id: 'plans', label: 'Planos' },
    { id: 'payments', label: 'Pagamentos' },
    { id: 'tickets', label: 'Tickets' },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="font-heading text-2xl font-bold text-slate-900 dark:text-slate-100">Painel do Admin</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Gestão global do FamiliaQuest.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSection(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              section === t.id
                ? 'bg-[#3525cd] text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-[#3525cd] dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/80 dark:border-indigo-800/60">
        {section === 'overview' && (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Famílias" value={stats?.families ?? '—'} />
            <StatCard label="Membros" value={stats?.members ?? '—'} />
            <StatCard label="Premium" value={stats?.premium ?? '—'} />
          </div>
        )}

        {section === 'families' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Famílias gerenciadas. Apenas nomes e o responsável são exibidos — nenhum dado sensível (e-mail, senha) é mostrado.
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {families.map((fam) => (
                <div key={fam.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{fam.name}</p>
                    <p className="text-xs text-slate-500">
                      Responsável: {fam.responsible ?? '—'} · {fam.member_count} membros · código {fam.invite_code}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        fam.admin_managed || fam.plan === 'premium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {fam.admin_managed || fam.plan === 'premium' ? 'Premium' : 'Grátis'}
                    </span>
                    <button
                      onClick={() => toggleFamilyPremium(fam)}
                      disabled={familyBusy === fam.id}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                        fam.admin_managed
                          ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          : 'bg-[#3525cd] text-white hover:bg-[#2e1fb5]'
                      }`}
                    >
                      {familyBusy === fam.id ? '…' : fam.admin_managed ? 'Revogar' : 'Tornar Premium'}
                    </button>
                  </div>
                </div>
              ))}
              {families.length === 0 && <p className="text-sm text-slate-400 py-3">Nenhuma família encontrada.</p>}
            </div>
          </div>
        )}

        {section === 'plans' && (
          <div className="space-y-4">
            {planDraft ? (
              <div className="rounded-2xl border border-indigo-200 p-4 space-y-3 dark:border-indigo-800">
                <input
                  className="fq-input"
                  placeholder="Nome do plano (ex: Premium)"
                  value={planDraft.name}
                  onChange={(e) => setPlanDraft({ ...planDraft, name: e.target.value })}
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    className="fq-input w-32"
                    placeholder="Preço"
                    value={planDraft.price}
                    onChange={(e) => setPlanDraft({ ...planDraft, price: Number(e.target.value) })}
                  />
                  <select
                    className="fq-input"
                    value={planDraft.interval}
                    onChange={(e) => setPlanDraft({ ...planDraft, interval: e.target.value as Plan['interval'] })}
                  >
                    <option value="month">Mensal</option>
                    <option value="year">Anual</option>
                    <option value="once">Único</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={planDraft.is_active}
                    onChange={(e) => setPlanDraft({ ...planDraft, is_active: e.target.checked })}
                  />
                  Ativo
                </label>
                <div className="flex gap-2">
                  <button onClick={handleSavePlan} disabled={planLoading} className="fq-btn-primary">
                    {planLoading ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button onClick={() => setPlanDraft(null)} className="fq-btn-ghost">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setPlanDraft({ ...emptyPlan })} className="fq-btn-primary">
                + Novo plano
              </button>
            )}

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {plans.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                    <p className="text-xs text-slate-500">
                      R$ {p.price} / {p.interval} {!p.is_active && '· inativo'}
                    </p>
                  </div>
                  <button onClick={() => handleDeletePlan(p.id)} className="text-rose-500 text-sm font-semibold">
                    Excluir
                  </button>
                </div>
              ))}
              {plans.length === 0 && <p className="text-sm text-slate-400 py-3">Nenhum plano cadastrado.</p>}
            </div>
          </div>
        )}

        {section === 'payments' && (
          <div className="space-y-3">
            {payment ? (
              <>
                <div className="flex gap-3">
                  {(['stripe', 'mercadopago'] as PaymentProvider[]).map((prov) => (
                    <button
                      key={prov}
                      onClick={() => setPayment({ ...payment, provider: prov })}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
                        payment.provider === prov
                          ? 'border-[#3525cd] bg-indigo-50 text-[#3525cd] dark:bg-indigo-950/40'
                          : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {prov === 'stripe' ? 'Stripe' : 'Mercado Pago'}
                    </button>
                  ))}
                </div>
                <input
                  className="fq-input"
                  placeholder="Chave pública"
                  value={payment.public_key ?? ''}
                  onChange={(e) => setPayment({ ...payment, public_key: e.target.value })}
                />
                <input
                  className="fq-input"
                  placeholder="Chave secreta"
                  type="password"
                  value={payment.secret_key ?? ''}
                  onChange={(e) => setPayment({ ...payment, secret_key: e.target.value })}
                />
                <input
                  className="fq-input"
                  placeholder="Webhook secret"
                  value={payment.webhook_secret ?? ''}
                  onChange={(e) => setPayment({ ...payment, webhook_secret: e.target.value })}
                />
                <button onClick={handleSavePayment} disabled={paymentLoading} className="fq-btn-primary">
                  {paymentLoading ? 'Salvando…' : 'Salvar'}
                </button>

                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">Webhook (configure no painel do provedor)</p>
                  <p className="mt-1 break-all font-mono">
                    {`${import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')}/functions/v1/payment-webhook`}
                  </p>
                  <p className="mt-2 text-slate-500">
                    Stripe: eventos de checkout, fatura e assinatura. Mercado Pago: assinaturas (Preapproval) e pagamentos.
                    Renovações recorrentes atualizam o plano automaticamente.
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Carregando…</p>
            )}
          </div>
        )}

        {section === 'tickets' && (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-100 p-3 dark:border-slate-800">
                <p className="text-sm text-slate-700 dark:text-slate-200">{t.message}</p>
                {t.admin_reply && (
                  <p className="mt-2 text-sm text-[#3525cd] bg-indigo-50 rounded-xl p-2 dark:bg-indigo-950/40">
                    Resposta: {t.admin_reply}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {t.status}
                  </span>
                  {openTicketId === t.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        className="fq-input flex-1"
                        placeholder="Responder…"
                        value={ticketReply}
                        onChange={(e) => setTicketReply(e.target.value)}
                      />
                      <button onClick={() => handleReplyTicket(t.id)} className="fq-btn-primary">
                        Enviar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setOpenTicketId(t.id)}
                      className="text-xs font-semibold text-[#3525cd]"
                    >
                      Responder
                    </button>
                  )}
                </div>
              </div>
            ))}
            {tickets.length === 0 && <p className="text-sm text-slate-400">Nenhum ticket.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="rounded-2xl bg-indigo-50 p-4 text-center dark:bg-indigo-950/40">
    <p className="text-3xl font-bold text-[#3525cd]">{value}</p>
    <p className="text-sm text-slate-500">{label}</p>
  </div>
);
