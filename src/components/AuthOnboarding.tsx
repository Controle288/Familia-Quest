import React, { useState } from 'react';
import { PlusCircle, KeyRound, Mail, LockKeyhole, ArrowRightCircle, UsersRound, UserPlus, ArrowLeft, X, type LucideIcon } from 'lucide-react';
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
  RELATIONSHIP_META,
  GUARDIAN_RELATIONSHIPS,
  ALL_RELATIONSHIPS,
  type RelationshipType,
} from '../lib/avatars';
import { Profile } from '../types';
import { ForgotPassword } from './ForgotPassword';
import RoleSelectionLogin, { type RoleSelectionValue } from './Auth/RoleSelectionLogin';
import { MotionList, MotionItem } from './motion';

type Mode = 'create' | 'login';
type JoinStep = 'code' | 'select';

// Senha forte: mínimo 8 caracteres, com pelo menos uma letra e um número.
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const isStrongPassword = (pw: string) => STRONG_PASSWORD_REGEX.test(pw);

const FieldIcon: React.FC<{ icon: LucideIcon; color: string; className?: string }> = ({
  icon: Icon,
  color,
  className = '',
}) => (
  <span
    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${className}`}
    style={{ background: `${color}1a`, color }}
  >
    <Icon className="w-4 h-4" />
  </span>
);

const AuthField: React.FC<{
  icon: LucideIcon;
  color: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}> = ({ icon, color, type = 'text', value, onChange, placeholder }) => (
  <div className="relative">
    <div className="absolute left-3 top-1/2 -translate-y-1/2">
      <FieldIcon icon={icon} color={color} />
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-12 pl-14 pr-4 bg-white rounded-2xl border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400 transition-all"
    />
  </div>
);

const PrimaryButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  icon: LucideIcon;
  children: React.ReactNode;
}> = ({ onClick, disabled, icon: Icon, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full h-12 bg-[#3525cd] text-white font-heading font-bold text-sm rounded-full shadow-[0px_4px_20px_rgba(79,70,229,0.25)] hover:bg-[#2e1fb5] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
  >
    <Icon className="w-5 h-5" />
    {children}
  </button>
);

export const AuthOnboarding: React.FC = () => {
  const { applyFamilySession, setShowOnboarding, addToast } = useFamily();
  const [mode, setMode] = useState<Mode>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [parentName, setParentName] = useState('');
  const [creatorRel, setCreatorRel] = useState<RelationshipType>('mae');
  const [roleValue, setRoleValue] = useState<RoleSelectionValue>({ main: 'responsavel', parent: 'mae', childId: null });
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
    if (!isStrongPassword(password)) {
      addToast('Senha fraca', 'Use pelo menos 8 caracteres, incluindo letras e números.', 'warning');
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
    <div className="fixed inset-0 z-50 bg-[#f8f9ff] overflow-y-auto">
      <button
        onClick={() => setShowOnboarding(false)}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm flex items-center justify-center transition-colors"
        title="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-12%] right-[-6%] w-[28rem] h-[28rem] bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" />
        <div className="absolute bottom-[-14%] left-[-8%] w-[26rem] h-[26rem] bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" style={{ animationDelay: '1.2s' }} />
        <div className="absolute top-[30%] left-[60%] w-72 h-72 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2.4s' }} />
      </div>

      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10">
        <MotionList className="glass-card w-full max-w-md rounded-[2rem] p-6 md:p-8 shadow-2xl border border-white/60 space-y-5">
          <MotionItem>
            <header className="flex flex-col items-center text-center">
              <img
                src="/logo.png"
                alt="FamilyQuest Logo"
                className="h-20 w-auto mx-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/icon.svg';
                }}
              />
              <p className="text-slate-600 text-base mt-2 max-w-xs">
                Transforme a rotina em uma aventura épica para toda a família.
              </p>
            </header>
          </MotionItem>

          {!isSupabaseConfigured && (
            <MotionItem>
              <div className="w-full rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                O servidor não está configurado. Entre em contato com o administrador para usar o app.
              </div>
            </MotionItem>
          )}

          <MotionItem>
            <div className="flex rounded-full bg-slate-100 p-1">
              <button
                onClick={() => setMode('create')}
                className={`flex-1 h-10 rounded-full text-sm font-bold transition-all ${mode === 'create' ? 'bg-white text-[#3525cd] shadow' : 'text-slate-500'}`}
              >
                Criar conta
              </button>
              <button
                onClick={() => setMode('login')}
                className={`flex-1 h-10 rounded-full text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-[#3525cd] shadow' : 'text-slate-500'}`}
              >
                Entrar
              </button>
            </div>
          </MotionItem>

          <MotionItem>
            <AuthField icon={Mail} color="#3525cd" type="email" value={email} onChange={setEmail} placeholder="E-mail" />
          </MotionItem>

          <MotionItem>
            <AuthField icon={LockKeyhole} color="#8455ef" type="password" value={password} onChange={setPassword} placeholder="Senha" />
            <p className={`mt-1.5 text-[11px] font-medium ${password && !isStrongPassword(password) ? 'text-rose-500' : 'text-slate-400'}`}>
              {password && !isStrongPassword(password)
                ? 'Senha fraca: use ao menos 8 caracteres, com letras e números.'
                : 'Dica de segurança: use ao menos 8 caracteres, com letras e números.'}
            </p>
          </MotionItem>

          {mode === 'create' ? (
            <MotionItem>
              <div className="space-y-3">
                <AuthField icon={UsersRound} color="#10b981" value={familyName} onChange={setFamilyName} placeholder="Nome da família (ex: Família Silva)" />
                <AuthField icon={UserPlus} color="#f59e0b" value={parentName} onChange={setParentName} placeholder="Seu nome (responsável)" />

                <RoleSelectionLogin
                  value={roleValue}
                  onChange={(v) => {
                    setRoleValue(v);
                    if (v.parent) setCreatorRel(v.parent);
                  }}
                  disableChildren
                />

                <PrimaryButton onClick={handleCreateAccount} disabled={isBusy} icon={UserPlus}>
                  {isBusy ? 'Aguarde...' : 'Criar Conta e Família'}
                </PrimaryButton>

                <p className="text-xs text-slate-500 text-center">
                  As crianças entram com o código de convite que você receberá.
                </p>
              </div>
            </MotionItem>
          ) : (
            <MotionItem>
              <div className="space-y-3">
                <PrimaryButton onClick={handleLogin} disabled={isBusy} icon={ArrowRightCircle}>
                  {isBusy ? 'Aguarde...' : 'Entrar'}
                </PrimaryButton>

                <button
                  onClick={() => setShowForgot(true)}
                  className="w-full text-sm font-semibold text-[#3525cd] hover:underline"
                >
                  Esqueci a senha
                </button>
              </div>
            </MotionItem>
          )}

          <MotionItem>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">ou</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <FieldIcon icon={KeyRound} color="#d946ef" />
              </div>
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder="Entrar com código de convite"
                className="w-full h-12 pl-14 pr-24 bg-white rounded-full border border-slate-200 focus:border-[#3525cd] focus:ring-2 focus:ring-indigo-100 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-xs transition-all"
              />
              <button
                onClick={handleLookupFamily}
                disabled={isBusy}
                className="absolute inset-y-1.5 right-1.5 px-4 bg-[#8455ef] text-white font-heading font-bold text-xs rounded-full hover:bg-[#6b38d4] active:scale-95 transition-all disabled:opacity-60"
              >
                Entrar
              </button>
            </div>
          </MotionItem>
        </MotionList>
      </div>

      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}

      {joinStep === 'select' && joinFamily && (
        <div className="fixed inset-0 z-[60] bg-[#f8f9ff]/95 backdrop-blur-sm overflow-y-auto flex flex-col items-center justify-center px-5 py-10">
          <button
            onClick={() => {
              setJoinStep('code');
              setJoinFamily(null);
            }}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/80 text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm flex items-center justify-center transition-colors"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <MotionList className="glass-card w-full max-w-md rounded-[2rem] p-6 md:p-8 shadow-2xl border border-white/60 space-y-6">
            <MotionItem>
              <header className="flex flex-col items-center text-center">
                <h2 className="font-heading text-2xl font-extrabold text-[#3525cd]">
                  Como você entra?
                </h2>
                <p className="text-slate-600 text-sm mt-2 max-w-xs">
                  Escolha seu papel na família <span className="font-semibold">{joinFamily.name}</span>.
                </p>
              </header>
            </MotionItem>

            <MotionItem>
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
            </MotionItem>
          </MotionList>
        </div>
      )}
    </div>
  );
};
