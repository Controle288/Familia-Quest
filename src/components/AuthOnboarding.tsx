import React, { useState } from 'react';
import { Sparkles, PlusCircle, Key, Mail, Lock, LogIn, Users, ArrowLeft } from 'lucide-react';
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
  type FamilyRecord,
} from '../lib/supabase';
import {
  avatarForRelationship,
  relationshipLabel,
  RELATIONSHIP_META,
  GUARDIAN_RELATIONSHIPS,
  ALL_RELATIONSHIPS,
  type RelationshipType,
} from '../lib/avatars';
import { Profile } from '../types';
import { ForgotPassword } from './ForgotPassword';

type Mode = 'create' | 'login';
type JoinStep = 'code' | 'select';

export const AuthOnboarding: React.FC = () => {
  const { applyFamilySession, setShowOnboarding, addToast } = useFamily();
  const [mode, setMode] = useState<Mode>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [parentName, setParentName] = useState('');
  const [creatorRel, setCreatorRel] = useState<RelationshipType>('mae');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinStep, setJoinStep] = useState<JoinStep>('code');
  const [joinFamily, setJoinFamily] = useState<FamilyRecord | null>(null);
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

    const meta = RELATIONSHIP_META[creatorRel];

    setIsBusy(true);
    try {
      const authUser = await signUpWithEmail(email.trim(), password);

      const parentDraft: Omit<ProfileRecord, 'id' | 'family_id' | 'created_at'> = {
        user_id: authUser.id,
        name: parentName.trim(),
        full_name: parentName.trim(),
        role: 'parent',
        relationship: creatorRel,
        avatar_url: avatarForRelationship(creatorRel, 0),
        title: meta.title,
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

  const handleLookupFamily = async () => {
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
      const family = await findFamilyByInviteCode(code);
      if (!family) {
        throw new Error('Código não encontrado');
      }
      setJoinFamily(family);
      setJoinStep('select');
    } catch (error) {
      addToast('Código inválido', (error as Error).message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSelectRelationship = async (rel: RelationshipType) => {
    if (!joinFamily) return;
    if (!email.trim() || !password.trim()) {
      addToast('Preencha e-mail e senha', 'Crie sua conta para entrar na família.', 'warning');
      return;
    }
    if (!isSupabaseConfigured) {
      addToast('Servidor indisponível', 'A configuração do banco de dados não foi encontrada.', 'error');
      return;
    }

    const meta = RELATIONSHIP_META[rel];

    setIsBusy(true);
    try {
      const authUser = await signUpWithEmail(email.trim(), password);

      const settings = await loadFamilySettings(joinFamily.id);
      const isPremium = (settings?.plan ?? 'free') === 'premium';
      if (!isPremium) {
        const { parents, children } = await getFamilyMemberCounts(joinFamily.id);
        if (meta.role === 'parent') {
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
        name: meta.label,
        full_name: meta.label,
        role: meta.role,
        relationship: rel,
        avatar_url: avatarForRelationship(rel, 0),
        title: meta.title,
        level: 1,
        xp: 0,
        xp_base: 0,
        xp_to_next_level: meta.role === 'parent' ? 3000 : 500,
        balance: 0,
        streak_days: 0,
      };

      await createProfileInFamily(joinFamily.id, draft, authUser.id);

      const state = await loadUserFamilyState();
      if (state?.family && state.profiles.length) {
      applyFamilySession(state.family, state.profiles as unknown as Profile[], state.myProfileId);
      }

      addToast('Família conectada!', `Você entrou como ${meta.label} na família.`, 'success');
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

                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-3 text-left">
                    Você entra como:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {GUARDIAN_RELATIONSHIPS.map((rel) => {
                      const meta = RELATIONSHIP_META[rel];
                      const selected = creatorRel === rel;
                      return (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => setCreatorRel(rel)}
                          className={`flex flex-col items-center gap-1 rounded-2xl p-2 border-2 transition-all ${
                            selected ? 'border-transparent shadow-md' : 'border-slate-100 hover:border-slate-200'
                          }`}
                          style={selected ? { borderColor: meta.color, background: `${meta.color}10` } : undefined}
                        >
                          <span
                            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-slate-50"
                            style={selected ? { boxShadow: `0 0 0 3px ${meta.color}55` } : undefined}
                          >
                            <img src={avatarForRelationship(rel, 0)} alt={meta.label} className="w-full h-full object-cover" />
                          </span>
                          <span className="text-lg leading-none">{meta.emoji}</span>
                          <span className="text-[11px] font-bold text-slate-700">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
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
                onClick={handleLookupFamily}
                disabled={isBusy}
                className="absolute inset-y-1.5 right-1.5 px-4 bg-[#8455ef] text-white font-heading font-bold text-xs rounded-full hover:bg-[#6b38d4] active:scale-95 transition-all disabled:opacity-60"
              >
                Entrar
              </button>
            </div>
          </section>
      </div>

      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}

      {joinStep === 'select' && joinFamily && (
        <div className="fixed inset-0 z-[60] bg-[#f8f9ff] overflow-y-auto flex flex-col items-center justify-center px-5 py-8">
          <button
            onClick={() => {
              setJoinStep('code');
              setJoinFamily(null);
            }}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6">
            <header className="flex flex-col items-center">
              <h2 className="font-heading text-2xl font-extrabold text-[#3525cd]">
                Como você entra?
              </h2>
              <p className="text-slate-600 text-sm mt-2 max-w-xs">
                Escolha seu papel na família <span className="font-semibold">{joinFamily.name}</span>.
              </p>
            </header>

            <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_RELATIONSHIPS.map((rel) => {
                const meta = RELATIONSHIP_META[rel];
                return (
                  <button
                    key={rel}
                    type="button"
                    onClick={() => handleSelectRelationship(rel)}
                    disabled={isBusy}
                    className="flex flex-col items-center gap-2 rounded-3xl bg-white border-2 border-slate-100 p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-60"
                  >
                    <span
                      className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-slate-50"
                      style={{ boxShadow: `0 0 0 3px ${meta.color}55` }}
                    >
                      <img src={avatarForRelationship(rel, 0)} alt={meta.label} className="w-full h-full object-cover" />
                    </span>
                    <span className="text-2xl leading-none">{meta.emoji}</span>
                    <span className="text-sm font-bold text-slate-800">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
