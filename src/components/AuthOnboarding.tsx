import React, { useState } from 'react';
import { X } from 'lucide-react';
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
  type RelationshipType,
} from '../lib/avatars';
import { Profile } from '../types';
import { ForgotPassword } from './ForgotPassword';
import RoleSelectionLogin from './Auth/RoleSelectionLogin';

// Senha forte: mínimo 8 caracteres, com pelo menos uma letra e um número.
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const isStrongPassword = (pw: string) => STRONG_PASSWORD_REGEX.test(pw);

export const AuthOnboarding: React.FC = () => {
  const { applyFamilySession, setShowOnboarding, addToast } = useFamily();
  const creatorRel: RelationshipType = 'mae'; // Criador sempre é um responsável
  const [isBusy, setIsBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async (data: { email: string; password: string }) => {
    const email = data.email.trim();
    const password = data.password;
    if (!email || !password) {
      addToast('Preencha e-mail e senha', 'Necessário para entrar.', 'warning');
      return;
    }
    if (!isSupabaseConfigured) {
      addToast('Servidor indisponível', 'A configuração do banco de dados não foi encontrada.', 'error');
      return;
    }

    setIsBusy(true);
    try {
      await signInWithEmail(email, password);
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

  const handleCreateAccount = async (data: {
    familyName: string;
    respName: string;
    email: string;
    password: string;
  }) => {
    const email = data.email.trim();
    const password = data.password;
    const familyName = data.familyName.trim();
    const parentName = data.respName.trim();

    if (!email || !password) {
      addToast('Preencha e-mail e senha', 'Necessário para criar sua conta.', 'warning');
      return;
    }
    if (!isStrongPassword(password)) {
      addToast('Senha fraca', 'Use pelo menos 8 caracteres, incluindo letras e números.', 'warning');
      return;
    }
    if (!familyName || !parentName) {
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
      const authUser = await signUpWithEmail(email, password);

      const parentDraft: Omit<ProfileRecord, 'id' | 'family_id' | 'created_at'> = {
        user_id: authUser.id,
        name: parentName,
        full_name: parentName,
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
        familyName,
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
      addToast('Não foi possível criar a conta', (error as Error).message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  // Criança entra na família via código de convite + escolha de gênero.
  const handleJoinAsChild = async (data: {
    email: string;
    password: string;
    code: string;
    gender: 'menino' | 'menina';
  }) => {
    const email = data.email.trim();
    const password = data.password;
    const code = data.code.trim().toUpperCase();

    if (!email || !password || !code) {
      addToast('Dados incompletos', 'Informe e-mail, senha e o código de convite.', 'warning');
      return;
    }
    if (!isStrongPassword(password)) {
      addToast('Senha fraca', 'Use pelo menos 8 caracteres, incluindo letras e números.', 'warning');
      return;
    }
    if (!isSupabaseConfigured) {
      addToast('Servidor indisponível', 'A configuração do banco de dados não foi encontrada.', 'error');
      return;
    }

    const rel: RelationshipType = 'filho';
    const meta = RELATIONSHIP_META[rel];
    const avatarIndex = data.gender === 'menina' ? 1 : 0;

    setIsBusy(true);
    try {
      const family: FamilyRecord | null = await findFamilyByInviteCode(code);
      if (!family) throw new Error('Código não encontrado');

      const settings = await loadFamilySettings(family.id);
      const isPremium = (settings?.plan ?? 'free') === 'premium';
      if (!isPremium) {
        const { parents, children } = await getFamilyMemberCounts(family.id);
        if (parents !== 1 || children >= 2) {
          throw new Error(
            'No plano gratuito é permitido 1 responsável com até 2 filhos. Assine o Premium para adicionar mais.'
          );
        }
      }

      const authUser = await signUpWithEmail(email, password);
      const draft: Omit<ProfileRecord, 'id' | 'family_id' | 'created_at'> = {
        user_id: authUser.id,
        name: data.gender === 'menina' ? 'Filha' : 'Filho',
        full_name: data.gender === 'menina' ? 'Filha' : 'Filho',
        role: 'child',
        relationship: rel,
        avatar_url: avatarForRelationship(rel, avatarIndex),
        title: meta.title,
        level: 1,
        xp: 0,
        xp_base: 0,
        xp_to_next_level: 500,
        balance: 0,
        streak_days: 0,
      };

      await createProfileInFamily(family.id, draft, authUser.id);

      const state = await loadUserFamilyState();
      if (state?.family && state.profiles.length) {
        applyFamilySession(state.family, state.profiles as unknown as Profile[], state.myProfileId);
      }

      addToast(
        'Família conectada!',
        `Você entrou como ${data.gender === 'menina' ? 'filha' : 'filho'} na família.`,
        'success'
      );
      setShowOnboarding(false);
    } catch (error) {
      addToast('Não foi possível entrar', (error as Error).message, 'error');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowOnboarding(false)}
        className="fixed top-4 right-4 z-[70] w-10 h-10 rounded-full bg-white/10 text-slate-300 hover:bg-white/20 shadow-sm flex items-center justify-center transition-colors"
        title="Fechar"
      >
        <X className="w-5 h-5" />
      </button>

      <RoleSelectionLogin
        loading={isBusy}
        onEntrar={handleLogin}
        onCadastrar={handleCreateAccount}
        onConvite={handleJoinAsChild}
        onEsqueciSenha={() => setShowForgot(true)}
      />

      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}
    </>
  );
};
