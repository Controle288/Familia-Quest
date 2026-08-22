import React, { useState } from 'react';
import { Copy, Check, X, Trash2, User } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';

// Painel "Membros da Família" — movido para a barra lateral (aba própria).
// Apenas responsáveis podem remover membros.
export const FamilyMembersPanel: React.FC = () => {
  const {
    family,
    profiles,
    currentProfile,
    copyInviteCode,
    removeMember,
    addToast,
  } = useFamily();

  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [busyRemove, setBusyRemove] = useState(false);

  const isGuardian = currentProfile?.role === 'parent';

  const handleRemoveMember = async (profileId: string) => {
    setBusyRemove(true);
    try {
      await removeMember(profileId);
      setPendingRemove(null);
    } catch (err) {
      addToast('Não foi possível remover', (err as Error).message, 'error');
    } finally {
      setBusyRemove(false);
    }
  };

  if (!isGuardian) return null;

  return (
    <div className="space-y-6 pb-12">
      <section className="bg-[#eff4ff] rounded-2xl p-5 md:p-6 shadow-[0px_4px_20px_rgba(79,70,229,0.08)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-indigo-100/60">
        <div>
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-[#0b1c30]">
            Membros da Família
          </h2>
          <p className="text-slate-600 text-sm md:text-base mt-1">
            Apenas responsáveis podem remover membros. Ao remover, o acesso e o e-mail da pessoa são liberados definitivamente.
          </p>
        </div>

        <div className="bg-white rounded-xl p-3 flex items-center justify-between gap-3 border border-indigo-100 shadow-xs w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Código de Convite
            </span>
            <span className="font-heading font-bold text-sm md:text-base text-[#3525cd] tracking-widest">
              {family.invite_code}
            </span>
          </div>
          <button
            onClick={copyInviteCode}
            className="w-10 h-10 rounded-full bg-[#8455ef]/10 text-[#6b38d4] hover:bg-[#8455ef]/20 transition-all flex items-center justify-center shrink-0 active:scale-95"
            title="Copiar código"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-indigo-100 text-[#3525cd] rounded-full">
            <User className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-heading font-bold text-slate-800 text-sm">Quem faz parte</h3>
            <p className="text-xs text-slate-500">
              {profiles.length} pessoa(s) nesta família.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {profiles.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={m.avatar_url || '/icon.svg'}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover bg-indigo-100 shrink-0"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/icon.svg';
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">
                    {m.full_name}
                    {m.id === currentProfile?.id && (
                      <span className="ml-1 text-[11px] font-semibold text-indigo-500">você</span>
                    )}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {m.role === 'parent' ? 'Responsável' : 'Filho(a)'}
                  </p>
                </div>
              </div>

              {pendingRemove === m.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    disabled={busyRemove}
                    className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {busyRemove ? 'Removendo...' : 'Confirmar'}
                  </button>
                  <button
                    onClick={() => setPendingRemove(null)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPendingRemove(m.id)}
                  className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Remover
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
