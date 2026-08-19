import React, { useState } from 'react';
import { Sparkles, PlusCircle, Key, Mail, Lock, LogIn, Users } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import {
  createFamilyWithProfiles,
  createProfileInFamily,
  findFamilyByInviteCode,
  isSupabaseConfigured,
  loadUserFamilyState,
  signInWithEmail,
  signUpWithEmail,
  loadFamilySettings,
  getFamilyMemberCounts,
  type ProfileRecord,
} from '../lib/supabase';
import { defaultAvatar } from '../lib/avatars';
import { Profile } from '../types';
import { ForgotPassword } from './ForgotPassword';

type Mode = 'create' | 'login';

export const AuthOnboarding: React.FC = () => {
  const { applyFamilySession, setShowOnboarding, addToast } = useFamily();
  const [mode, setMode] = useState<Mode>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [parentName, setParentName] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinRole, setJoinRole] = useState<'parent' | 'child'>('child');
  const [isBusy, setIsBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleCreateAccount = async () => {
    if (!email.trim() || !password.trim()) {
      addToast('Preencha e-mail e senha', 'Necessário para criar sua conta.', 'warning');
      return;
    }
    if (!familyName.trim() || !parentName.trim()) {
      addToast('Preencha os dados da família', 'Informe o nome da família e do responsável.', 'warning');
      return;
    }
    if (!isSupabaseConfigured) {
      addToast('Servidor indisponível', 'A configuração do banco de dados não foi encontrada.', 'error');
      return;
    }

    setIsBusy(true);
    try {
      const authUser = await signUpWithEmail(email.trim(), password);

      const parentDraft: Omit<ProfileRecord, 'id' | 'family_id' | 'created_at'> = {
        user_id: authUser.id,
        name: parentName.trim(),
        full_name: parentName.trim(),
        role: 'parent',
        avatar_url: defaultAvatar('parent', 0),
        title: 'Guardião da Família',
        level: 1,
        xp: 0,
        xp_base: 0,
        xp_to_next_level: 500,
        balance: 0,
        streak_days: 0,
      };

      const result = await createFamilyWithProfiles(
        familyName.trim(),
        [parentDraft as ProfileRecord],
        authUser.id
      );

      if (!result?.family) {
        throw new Error('Falha ao criar família');
      }

      const nextProfiles = (result.profiles ?? []) as ProfileRecord[];
      const parentId = nextProfiles.find((p) => p.role === 'parent')?.id ?? nextProfiles[0]?.id;

      applyFamilySession(result.family, nextProfiles as unknown as Profile[], parentId);
      addToast(
        'Família criada!',
        `Código de convite: ${result.family.invite_code}. Compartilhe com as crianças para elas entrarem.`,
        'success'
      );
      setShowOnboarding(false);
    } catch (error) {
      const message = (error as Error).message;
      addToast('Não foi possível criar a conta', message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      addToast('Preencha e-mail e senha', 'Necessário para entrar.', 'warning');
      return;
    }
    if (!isSupabaseConfigured) {
      addToast('Servidor indisponível', 'A configuração do banco de dados não foi encontrada.', 'error');
      return;
    }

    setIsBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
      const state = await loadUserFamilyState();

      if (!state?.family || !state.profiles.length) {
        addToast('Nenhum perfil encontrado', 'Crie ou entre em uma família primeiro.', 'warning');
        return;
      }

        applyFamilySession(state.family, state.profiles as unknown as Profile[], state.myProfileId);
      addToast('Bem-vindo de volta!', 'Sua família foi carregada do servidor.', 'success');
      setShowOnboarding(false);
    } catch (error) {
      addToast('Login falhou', (error as Error).message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!email.trim() || !password.trim()) {
      addToast('Preencha e-mail e senha', 'Crie sua conta para entrar na família.', 'warning');
      return;
    }

    const code = inviteCodeInput.trim().toUpperCase();
    if (!code) {
      addToast('Digite o código de convite', 'Ex: SILVA-2024', 'warning');
      return;
    }
    if (!isSupabaseConfigured) {
      addToast('Servidor indisponível', 'A configuração do banco de dados não foi encontrada.', 'error');
      return;
    }

    setIsBusy(true);
    try {
      const authUser = await signUpWithEmail(email.trim(), password);

      const family = await findFamilyByInviteCode(code);
      if (!family) {
        throw new Error('Código não encontrado');
      }

      const settings = await loadFamilySettings(family.id);
      const isPremium = (settings?.plan ?? 'free') === 'premium';
      if (!isPremium) {
        const { parents, children } = await getFamilyMemberCounts(family.id);
        if (joinRole === 'parent') {
          if (parents >= 2 || children > 0) {
            throw new Error(
              'No plano gratuito só é possível 2 responsáveis (sem filhos) ou 1 responsável com até 2 filhos. Assine o Premium para liberar.'
            );
          }
        } else {
          if (parents !== 1 || children >= 2) {
            throw new Error(
              'No plano gratuito é permitido 1 responsável com até 2 filhos. Assine o Premium para adicionar mais.'
            );
          }
        }
      }

      const draft: Omit<ProfileRecord, 'id' | 'family_id' | 'created_at'> = {
        user_id: authUser.id,
        name: joinRole === 'parent' ? 'Responsável' : 'Filho(a)',
        full_name: joinRole === 'parent' ? 'Responsável' : 'Filho(a)',
        role: joinRole,
        avatar_url: defaultAvatar(joinRole, 0),
        title: joinRole === 'parent' ? 'Guardião da Família' : 'Aventureiro',
        level: joinRole === 'parent' ? 1 : 1,
        xp: 0,
        xp_base: 0,
        xp_to_next_level: joinRole === 'parent' ? 3000 : 500,
        balance: 0,
        streak_days: 0,
      };

      await createProfileInFamily(family.id, draft, authUser.id);

      const state = await loadUserFamilyState();
      if (state?.family && state.profiles.length) {
      applyFamilySession(state.family, state.profiles as unknown as Profile[], state.myProfileId);
      }

      addToast('Família conectada!', `Você ingressou na família com o código ${code}`, 'success');
      setShowOnboarding(false);
    } catch (error) {
      const message = (error as Error).message;
      addToast('Não foi possível entrar', message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9ff] overflow-y-auto flex flex-col items-center justify-between px-5 py-8 md:py-12">
      <button
        onClick={() => setShowOnboarding(false)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
        title="Fechar"
      >
        <LogIn className="w-5 h-5 rotate-180" />
      </button>

      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40" />
      </div>

      <div className="w-full max-w-md mx-auto my-auto flex flex-col items-center text-center space-y-6">
        <header className="flex flex-col items-center">
          <div className="w-20 h-20 bg-[#4f46e5] rounded-3xl flex items-center justify-center text-white mb-4 shadow-[0px_12px_32px_rgba(79,70,229,0.2)]">
            <Sparkles className="w-10 h-10 fill-current text-white" />
          </div>
          <h1 className="font-heading text-4xl font-extrabold text-[#3525cd] tracking-tight">
            FamilyQuest
          </h1>
          <p className="text-slate-600 text-base mt-2 max-w-xs">
            Transforme a rotina em uma aventura épica para toda a família.
          </p>
        </header>

        {!isSupabaseConfigured && (
          <div className="w-full rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
            O servidor não está configurado. Entre em contato com o administrador para usar o app.
          </div>
        )}

        {isSupabaseConfigured && (
          <section className="w-full space-y-3">
            <div className="flex rounded-full bg-slate-100 p-1">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 h-9 rounded-full text-sm font-bold transition-all ${mode === 'create' ? 'bg-white text-[#3525cd] shadow' : 'text-slate-500'}`}
              >
                Criar conta
              </button>
              <button
                onClick={() => setMode('login')}
                className={`flex-1 h-9 rounded-full text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-[#3525cd] shadow' : 'text-slate-500'}`}
              >
                Entrar
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="w-full h-12 pl-11 pr-4 bg-white rounded-2xl border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className="w-full h-12 pl-11 pr-4 bg-white rounded-2xl border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {mode === 'create' ? (
              <>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="Nome da família (ex: Família Silva)"
                    className="w-full h-12 pl-11 pr-4 bg-white rounded-2xl border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Seu nome (responsável)"
                    className="w-full h-12 pl-11 pr-4 bg-white rounded-2xl border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                <button
                  onClick={handleCreateAccount}
                  disabled={isBusy}
                  className="w-full h-12 bg-[#3525cd] text-white font-heading font-bold text-sm rounded-full shadow-[0px_4px_20px_rgba(79,70,229,0.2)] hover:bg-[#2e1fb5] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <PlusCircle className="w-5 h-5" />
                  {isBusy ? 'Aguarde...' : 'Criar Conta e Família'}
                </button>

                <p className="text-xs text-slate-500">
                  As crianças entram com o código de convite que você receberá.
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  disabled={isBusy}
                  className="w-full h-12 bg-[#3525cd] text-white font-heading font-bold text-sm rounded-full shadow-[0px_4px_20px_rgba(79,70,229,0.2)] hover:bg-[#2e1fb5] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <LogIn className="w-5 h-5" />
                  {isBusy ? 'Aguarde...' : 'Entrar'}
                </button>

                <button
                  onClick={() => setShowForgot(true)}
                  className="text-sm font-semibold text-[#3525cd] hover:underline"
                >
                  Esqueci a senha
                </button>
              </>
            )}

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder="Entrar com código de convite"
                className="w-full h-12 pl-11 pr-24 bg-white rounded-full border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-xs"
              />
              <button
                onClick={handleJoinWithCode}
                disabled={isBusy}
                className="absolute inset-y-1.5 right-1.5 px-4 bg-[#8455ef] text-white font-heading font-bold text-xs rounded-full hover:bg-[#6b38d4] active:scale-95 transition-all disabled:opacity-60"
              >
                Entrar
              </button>
            </div>
          </section>
        )}
      </div>

      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}
    </div>
  );
};
