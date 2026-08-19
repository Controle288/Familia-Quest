import React, { useState } from 'react';
import { Sparkles, PlusCircle, Key, X, Mail, Lock, LogIn } from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import {
  createFamilyWithProfiles,
  createProfileInFamily,
  findFamilyByInviteCode,
  isSupabaseConfigured,
  loadUserFamilyState,
  signInWithEmail,
  signUpWithEmail,
  type ProfileRecord,
} from '../lib/supabase';

type Mode = 'create' | 'login';

export const AuthOnboarding: React.FC = () => {
  const { profiles, switchProfile, applyFamilySession, setShowOnboarding, addToast } = useFamily();
  const [mode, setMode] = useState<Mode>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinRole, setJoinRole] = useState<'parent' | 'child'>('child');
  const [isBusy, setIsBusy] = useState(false);

  const parentProfile = profiles.find((p) => p.role === 'parent') || profiles[0];
  const childProfile = profiles.find((p) => p.role === 'child') || profiles[1];

  const resetLocalDemo = (message: string) => {
    addToast('Demo local', message, 'success');
    setShowOnboarding(false);
  };

  const handleCreateAccount = async () => {
    if (!email.trim() || !password.trim()) {
      addToast('Preencha e-mail e senha', 'Necessário para criar sua conta.', 'warning');
      return;
    }

    if (!isSupabaseConfigured) {
      resetLocalDemo('Você é o Guardião da Guilda (modo demo, sem Supabase).');
      return;
    }

    setIsBusy(true);
    try {
      const authUser = await signUpWithEmail(email.trim(), password);

      const parentDraft: Omit<ProfileRecord, 'id' | 'family_id' | 'created_at'> = {
        user_id: authUser.id,
        name: 'Pai Carlos',
        full_name: 'Pai Carlos',
        role: 'parent',
        avatar_url: parentProfile.avatar_url,
        title: 'Guardião da Família',
        level: 10,
        xp: 2500,
        xp_to_next_level: 3000,
        balance: 0,
        streak_days: 14,
      };

      const childDraft: Omit<ProfileRecord, 'id' | 'family_id' | 'created_at'> = {
        user_id: '',
        name: 'Lucas',
        full_name: 'Lucas',
        role: 'child',
        avatar_url: childProfile.avatar_url,
        title: 'Aventureiro',
        level: 5,
        xp: 450,
        xp_to_next_level: 500,
        balance: 45,
        streak_days: 7,
      };

      const result = await createFamilyWithProfiles(
        'Família Silva',
        [
          parentDraft as ProfileRecord,
          childDraft as ProfileRecord,
        ],
        authUser.id
      );

      if (!result?.family) {
        throw new Error('Falha ao criar família');
      }

      const nextProfiles = (result.profiles ?? []) as typeof profiles;
      const parentId = (result.profiles ?? []).find((p) => p.role === 'parent')?.id
        ?? nextProfiles[0]?.id;

      applyFamilySession(result.family, nextProfiles, parentId);
      addToast('Conta e Família criadas!', `Código de convite: ${result.family.invite_code}`, 'success');
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
      resetLocalDemo('Bem-vindo de volta (modo demo, sem Supabase).');
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

      applyFamilySession(state.family, state.profiles as typeof profiles, state.myProfileId);
      addToast('Bem-vindo de volta!', 'Sua família foi carregada do Supabase.', 'success');
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
      resetLocalDemo(`Você ingressou na guilda com o código ${code} (modo demo).`);
      return;
    }

    setIsBusy(true);
    try {
      const authUser = await signUpWithEmail(email.trim(), password);

      const family = await findFamilyByInviteCode(code);
      if (!family) {
        throw new Error('Código não encontrado');
      }

      const draft: Omit<ProfileRecord, 'id' | 'family_id' | 'created_at'> = {
        user_id: authUser.id,
        name: joinRole === 'parent' ? 'Pai/Mãe' : 'Filho/Filha',
        full_name: joinRole === 'parent' ? 'Pai/Mãe' : 'Filho/Filha',
        role: joinRole,
        avatar_url: joinRole === 'parent' ? parentProfile.avatar_url : childProfile.avatar_url,
        title: joinRole === 'parent' ? 'Guardião da Família' : 'Aventureiro',
        level: joinRole === 'parent' ? 10 : 1,
        xp: joinRole === 'parent' ? 2500 : 0,
        xp_to_next_level: joinRole === 'parent' ? 3000 : 500,
        balance: 0,
        streak_days: 0,
      };

      await createProfileInFamily(family.id, draft, authUser.id);

      const state = await loadUserFamilyState();
      if (state?.family && state.profiles.length) {
        applyFamilySession(state.family, state.profiles as typeof profiles, state.myProfileId);
      }

      addToast('Família conectada!', `Você ingressou na guilda com o código ${code}`, 'success');
      setShowOnboarding(false);
    } catch (error) {
      const message = (error as Error).message;
      addToast('Não foi possível entrar', message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectProfile = (profileId: string) => {
    switchProfile(profileId);
    setShowOnboarding(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f9ff] overflow-y-auto flex flex-col items-center justify-between px-5 py-8 md:py-12">
      <button
        onClick={() => setShowOnboarding(false)}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
        title="Fechar"
      >
        <X className="w-5 h-5" />
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
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={inviteCodeInput}
                    onChange={(e) => setInviteCodeInput(e.target.value)}
                    placeholder="Código de convite (opcional)"
                    className="w-full h-12 pl-11 pr-4 bg-white rounded-2xl border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400"
                  />
                </div>

                {inviteCodeInput.trim() ? (
                  <div className="flex rounded-2xl bg-slate-100 p-1">
                    <button
                      onClick={() => setJoinRole('parent')}
                      className={`flex-1 h-9 rounded-xl text-sm font-bold transition-all ${joinRole === 'parent' ? 'bg-white text-[#3525cd] shadow' : 'text-slate-500'}`}
                    >
                      Como Pai/Mãe
                    </button>
                    <button
                      onClick={() => setJoinRole('child')}
                      className={`flex-1 h-9 rounded-xl text-sm font-bold transition-all ${joinRole === 'child' ? 'bg-white text-[#3525cd] shadow' : 'text-slate-500'}`}
                    >
                      Como Filho/Filha
                    </button>
                  </div>
                ) : null}

                <button
                  onClick={inviteCodeInput.trim() ? handleJoinWithCode : handleCreateAccount}
                  disabled={isBusy}
                  className="w-full h-12 bg-[#3525cd] text-white font-heading font-bold text-sm rounded-full shadow-[0px_4px_20px_rgba(79,70,229,0.2)] hover:bg-[#2e1fb5] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {inviteCodeInput.trim() ? <LogIn className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                  {isBusy ? 'Aguarde...' : inviteCodeInput.trim() ? 'Entrar na Família' : 'Criar Conta e Família'}
                </button>
              </>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isBusy}
                className="w-full h-12 bg-[#3525cd] text-white font-heading font-bold text-sm rounded-full shadow-[0px_4px_20px_rgba(79,70,229,0.2)] hover:bg-[#2e1fb5] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <LogIn className="w-5 h-5" />
                {isBusy ? 'Aguarde...' : 'Entrar'}
              </button>
            )}
          </section>
        )}

        {!isSupabaseConfigured && (
          <section className="w-full space-y-3 pt-2">
            <button
              onClick={handleCreateAccount}
              className="w-full h-12 bg-[#3525cd] text-white font-heading font-bold text-sm rounded-full shadow-[0px_4px_20px_rgba(79,70,229,0.2)] hover:bg-[#2e1fb5] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Criar Nova Família
            </button>

            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder="Entrar com Código"
                className="w-full h-12 pl-11 pr-24 bg-white rounded-full border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-xs"
              />
              <button
                onClick={handleJoinWithCode}
                className="absolute inset-y-1.5 right-1.5 px-4 bg-[#8455ef] text-white font-heading font-bold text-xs rounded-full hover:bg-[#6b38d4] active:scale-95 transition-all"
              >
                Entrar
              </button>
            </div>
          </section>
        )}

        <section className="w-full pt-4">
          <h2 className="font-heading text-lg font-bold text-slate-900 mb-4">
            Quem está jogando?
          </h2>

          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => handleSelectProfile(parentProfile.id)}
              className="glass-panel rounded-3xl p-4 md:p-5 flex flex-col items-center justify-center gap-2 shadow-[0px_4px_20px_rgba(79,70,229,0.08)] hover:shadow-xl hover:-translate-y-1 transition-all group bg-white/80"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-indigo-100 bg-white flex items-center justify-center animate-float">
                <img src={parentProfile.avatar_url} alt="Pai / Mãe" className="w-full h-full object-cover" />
              </div>
              <div className="text-center mt-1">
                <span className="block font-heading font-bold text-sm text-slate-900 group-hover:text-[#3525cd] transition-colors">
                  Pai / Mãe
                </span>
                <span className="block text-[11px] text-slate-500">Gerenciar Missões</span>
              </div>
            </button>

            <button
              onClick={() => handleSelectProfile(childProfile.id)}
              className="glass-panel rounded-3xl p-4 md:p-5 flex flex-col items-center justify-center gap-2 shadow-[0px_4px_20px_rgba(79,70,229,0.08)] hover:shadow-xl hover:-translate-y-1 transition-all group bg-white/80"
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-200 bg-white flex items-center justify-center animate-float">
                <img src={childProfile.avatar_url} alt="Filho / Filha" className="w-full h-full object-cover" />
              </div>
              <div className="text-center mt-1">
                <span className="block font-heading font-bold text-sm text-slate-900 group-hover:text-[#3525cd] transition-colors">
                  Filho / Filha
                </span>
                <span className="block text-[11px] text-slate-500">Completar e Ganhar</span>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
