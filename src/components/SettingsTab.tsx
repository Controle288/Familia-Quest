import React, { useRef, useState, useEffect } from 'react';
import { Camera, Trash2, Sparkles, MapPin, Clock, Crown } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { uploadAvatar, deleteAccount, loadPlans, createCheckout } from '../lib/supabase';
import { ThemePicker } from './ThemePicker';
import { LocationPanel } from './LocationPanel';
import { Plan } from '../types';

export const SettingsTab: React.FC = () => {
  const {
    currentProfile,
    family,
    familySettings,
    isPremium,
    isAdminUser,
    updateProfile,
    updateFamilySettings,
    addToast,
    signOut,
    setActiveTab,
  } = useFamily();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(currentProfile?.full_name || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
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

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !family || !currentProfile) return;
    setBusy(true);
    try {
      const url = await uploadAvatar(file, family.id, currentProfile.id);
      if (url) {
        await updateProfile(currentProfile.id, { avatar_url: url, full_name: name || currentProfile.full_name });
        addToast('Foto atualizada!', 'Sua nova foto de perfil foi salva.', 'success');
      } else {
        addToast('Falha no upload', 'Não foi possível enviar a imagem.', 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  const saveName = async () => {
    if (!currentProfile) return;
    await updateProfile(currentProfile.id, { full_name: name });
    addToast('Nome salvo!', undefined, 'success');
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      await deleteAccount();
      addToast('Conta excluída', 'Tudo foi removido. O e-mail poderá ser usado novamente.', 'info');
      await signOut();
    } catch (err) {
      addToast('Erro ao excluir', (err as Error).message, 'error');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <h2 className="font-heading text-2xl font-bold text-slate-900 dark:text-white">Configurações</h2>

      {/* Perfil */}
      <section className="rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
        <h3 className="mb-4 font-heading text-lg font-bold text-slate-800 dark:text-white">Perfil</h3>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#3525cd] bg-white">
              {currentProfile?.avatar_url ? (
                <img src={currentProfile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-indigo-100" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#3525cd] text-white flex items-center justify-center shadow hover:bg-[#2e1fb5]"
              title="Trocar foto"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
          </div>
          <div className="flex-1 space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="w-full h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={saveName}
              className="w-full h-10 rounded-2xl bg-[#3525cd] text-white font-semibold text-sm hover:bg-[#2e1fb5]"
            >
              Salvar nome
            </button>
          </div>
        </div>
      </section>

      {/* Plano */}
      <section className="rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white">Plano</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isPremium ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            {isPremium ? 'Premium' : 'Grátis'}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {isPremium
            ? 'Você tem acesso a todos os temas, horários e localização.'
            : 'No plano grátis: até 2 responsáveis ou 1 responsável + 2 filhos, sem temas premium.'}
        </p>
        <div className="mt-4 space-y-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/50 p-3"
            >
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{plan.name}</p>
                <p className="text-xs text-slate-500">
                  R$ {plan.price} / {plan.interval === 'month' ? 'mês' : plan.interval === 'year' ? 'ano' : 'único'}
                </p>
              </div>
              {isPremium ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Ativo</span>
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
      </section>

      {/* Temas */}
      <section className="rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70">
        <h3 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-slate-800 dark:text-white">
          <Sparkles className="w-5 h-5 text-[#8455ef]" /> Tema e aparência
        </h3>
        <ThemePicker />
      </section>

      {/* Recursos opcionais */}
      <section className="rounded-3xl border border-indigo-100 bg-white/80 p-5 shadow-sm dark:bg-slate-900/70 space-y-3">
        <h3 className="font-heading text-lg font-bold text-slate-800 dark:text-white">Recursos</h3>
        <Toggle
          icon={<Clock className="w-4 h-4" />}
          label="Horários e lembretes"
          desc="Agende tarefas com hora e receba lembretes."
          checked={familySettings?.schedule_enabled ?? false}
          disabled={!isPremium}
          onChange={(v) => updateFamilySettings({ schedule_enabled: v })}
        />
        <Toggle
          icon={<MapPin className="w-4 h-4" />}
          label="Localização dos filhos"
          desc="Saiba onde as crianças estão (opcional, com consentimento)."
          checked={familySettings?.location_enabled ?? false}
          disabled={!isPremium}
          onChange={(v) => updateFamilySettings({ location_enabled: v })}
        />
        {familySettings?.location_enabled && isPremium && (
          <button
            onClick={() => setShowLocation(true)}
            className="flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-[#3525cd] hover:bg-indigo-100"
          >
            <MapPin className="w-4 h-4" /> Ver localização da família
          </button>
        )}
      </section>

      {showLocation && <LocationPanel onClose={() => setShowLocation(false)} />}

      {/* Conta */}
      <section className="rounded-3xl border border-rose-100 bg-white/80 p-5 shadow-sm">
        <h3 className="font-heading text-lg font-bold text-rose-700">Conta</h3>
        <p className="mt-1 text-sm text-slate-500">
          Ao excluir sua conta, todos os dados e a família são removidos e o e-mail fica livre para novo cadastro.
        </p>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-4 h-4" /> Excluir minha conta
          </button>
        ) : (
          <div className="mt-3 flex gap-2">
            <button onClick={onDelete} disabled={busy} className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60">
              {busy ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
            <button onClick={() => setConfirmDelete(false)} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">
              Cancelar
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

const Toggle: React.FC<{
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}> = ({ icon, label, desc, checked, disabled, onChange }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-[#3525cd]">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-slate-800 dark:text-white">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
    <button
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-all ${checked ? 'bg-[#3525cd]' : 'bg-slate-300'} ${disabled ? 'opacity-50' : ''}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  </div>
);
