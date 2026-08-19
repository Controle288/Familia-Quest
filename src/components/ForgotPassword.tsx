import React, { useState } from 'react';
import { Mail, KeyRound, ShieldCheck } from 'lucide-react';
import { requestPasswordReset, verifyResetCode, setNewPassword } from '../lib/supabase';

export const ForgotPassword: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async () => {
    setError('');
    if (!email.trim()) return setError('Informe seu e-mail.');
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setStep('code');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setError('');
    if (!code.trim() || password.length < 6) return setError('Código e nova senha (mín. 6) obrigatórios.');
    setBusy(true);
    try {
      await verifyResetCode(email.trim(), code.trim());
      await setNewPassword(password);
      onClose();
      alert('Senha redefinida! Faça login com a nova senha.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">Recuperar senha</h3>
        {step === 'email' ? (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                className="w-full h-12 rounded-2xl border border-slate-200 pl-10 pr-4 text-sm focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button onClick={sendCode} disabled={busy} className="w-full h-11 rounded-2xl bg-[#3525cd] text-white font-semibold hover:bg-[#2e1fb5] disabled:opacity-60">
              {busy ? 'Enviando...' : 'Enviar código'}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 rounded-2xl bg-indigo-50 p-3 text-sm text-indigo-700">
              <KeyRound className="w-4 h-4" /> Enviamos um código de 6 dígitos para {email}.
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Código de 6 dígitos"
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 text-sm tracking-widest focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:text-white"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova senha"
              className="w-full h-12 rounded-2xl border border-slate-200 px-4 text-sm focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 dark:bg-slate-800 dark:text-white"
            />
            <button onClick={reset} disabled={busy} className="flex w-full items-center justify-center gap-2 h-11 rounded-2xl bg-[#3525cd] text-white font-semibold hover:bg-[#2e1fb5] disabled:opacity-60">
              <ShieldCheck className="w-4 h-4" /> Redefinir senha
            </button>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        <button onClick={onClose} className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600">
          Cancelar
        </button>
      </div>
    </div>
  );
};
