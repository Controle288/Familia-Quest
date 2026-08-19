import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  supabase,
  isSupabaseConfigured,
  syncSupabaseWrite,
  syncSupabaseUpdate,
  syncSupabaseDelete,
  getCurrentAuthUser,
  loadUserFamilyState,
  onAuthChange,
  signOutUser,
  type AuthUser,
} from '../lib/supabase';
import { applyLevelUp, canRedeem, applyRedeem } from '../lib/gameLogic';
import { playComplete, playReward, playLevelUp, playError } from '../lib/sounds';
import {
  Family,
  Profile,
  Task,
  Reward,
  Redemption,
  ActivityLog,
  ActiveTab,
  ParentSubTab,
} from '../types';
import {
  INITIAL_FAMILY,
  INITIAL_PROFILES,
  INITIAL_TASKS,
  INITIAL_REWARDS,
} from '../data/mockData';

interface LevelUpInfo {
  profileName: string;
  newLevel: number;
  unlockedTitle?: string;
}

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'info' | 'error' | 'warning';
}

interface FamilyContextType {
  family: Family;
  profiles: Profile[];
  currentProfile: Profile;
  tasks: Task[];
  rewards: Reward[];
  redemptions: Redemption[];
  activityLogs: ActivityLog[];
  activeTab: ActiveTab;
  parentSubTab: ParentSubTab;
  levelUpModal: LevelUpInfo | null;
  toasts: ToastMessage[];
  showOnboarding: boolean;
  authUser: AuthUser | null;
  isAuthenticated: boolean;
  isSyncing: boolean;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setParentSubTab: (subTab: ParentSubTab) => void;
  switchProfile: (profileId: string) => void;
  applyFamilySession: (nextFamily: Family, nextProfiles: Profile[], nextCurrentProfileId?: string) => void;
  setShowOnboarding: (show: boolean) => void;
  dismissLevelUpModal: () => void;
  dismissToast: (id: string) => void;
  addToast: (title: string, description?: string, type?: 'success' | 'info' | 'error' | 'warning') => void;

  // Chore Actions
  completeTask: (taskId: string, proofUrl?: string) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
  rejectTask: (taskId: string, reason?: string) => Promise<void>;
  createTask: (taskData: Omit<Task, 'id' | 'created_at' | 'status' | 'family_id' | 'created_by'>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Reward Actions
  redeemReward: (rewardId: string) => Promise<boolean>;
  createReward: (rewardData: Omit<Reward, 'id' | 'created_at' | 'family_id'>) => Promise<void>;
  toggleRewardAvailability: (rewardId: string) => Promise<void>;

  // Family Actions
  copyInviteCode: () => void;
  resetDemoData: () => void;
  signOut: () => Promise<void>;
  grantAllowance: (profileId: string, amount: number) => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [family, setFamily] = useState<Family>(() => {
    const saved = localStorage.getItem('fq_family');
    return saved ? JSON.parse(saved) : INITIAL_FAMILY;
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('fq_profiles');
    return saved ? JSON.parse(saved) : INITIAL_PROFILES;
  });

  const [currentProfileId, setCurrentProfileId] = useState<string>(() => {
    const saved = localStorage.getItem('fq_current_profile_id');
    return saved || 'prof-child-01'; // Default to Lucas (Child) for instant excitement
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('fq_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [rewards, setRewards] = useState<Reward[]>(() => {
    const saved = localStorage.getItem('fq_rewards');
    return saved ? JSON.parse(saved) : INITIAL_REWARDS;
  });

  const [redemptions, setRedemptions] = useState<Redemption[]>(() => {
    const saved = localStorage.getItem('fq_redemptions');
    return saved ? JSON.parse(saved) : [];
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('fq_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('quest');
  const [parentSubTab, setParentSubTab] = useState<ParentSubTab>('pendentes');
  const [levelUpModal, setLevelUpModal] = useState<LevelUpInfo | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setShowOnboarding(false);
      return;
    }

    const bootstrapAuthState = async () => {
      const user = await getCurrentAuthUser();
      setAuthUser(user);
      setShowOnboarding(!user);
    };

    bootstrapAuthState().catch(() => {
      setShowOnboarding(true);
    });
  }, []);

  const isSupabaseSessionActive = isSupabaseConfigured && Boolean(authUser);

  // Sync to local storage only for demo mode. Real Supabase sessions stay source of truth.
  useEffect(() => {
    if (isSupabaseSessionActive) {
      localStorage.setItem('fq_session_mode', 'supabase');
      return;
    }

    localStorage.setItem('fq_session_mode', 'demo');
    localStorage.setItem('fq_family', JSON.stringify(family));
    localStorage.setItem('fq_profiles', JSON.stringify(profiles));
    localStorage.setItem('fq_current_profile_id', currentProfileId);
    localStorage.setItem('fq_tasks', JSON.stringify(tasks));
    localStorage.setItem('fq_rewards', JSON.stringify(rewards));
    localStorage.setItem('fq_redemptions', JSON.stringify(redemptions));
    localStorage.setItem('fq_logs', JSON.stringify(activityLogs));
  }, [family, profiles, currentProfileId, tasks, rewards, redemptions, activityLogs, isSupabaseSessionActive]);

  // Re-fetch the family state from Supabase. Preserves the current profile selection
  // so a live update never yanks the user back to their own profile.
  const refreshFamilyData = useCallback(async () => {
    if (!isSupabaseConfigured || !authUser) {
      return;
    }

    setIsSyncing(true);
    try {
      const nextState = await loadUserFamilyState();
      if (!nextState?.family || !nextState.profiles.length) {
        return;
      }

      setFamily(nextState.family);
      setProfiles(nextState.profiles as Profile[]);
      setTasks(nextState.tasks as Task[]);
      setRewards(nextState.rewards as Reward[]);
      setRedemptions((nextState.redemptions as Redemption[]) ?? []);
      setActivityLogs((nextState.activityLogs as ActivityLog[]) ?? []);
    } catch (error) {
      console.warn('Failed to refresh family session from Supabase:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [authUser]);

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || profiles[0];

  const addToast = (
    title: string,
    description?: string,
    type: 'success' | 'info' | 'error' | 'warning' = 'info'
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const switchProfile = (profileId: string) => {
    const target = profiles.find((p) => p.id === profileId);
    if (target) {
      setCurrentProfileId(profileId);
      addToast(
        `Perfil alternado para ${target.full_name}`,
        `Modo: ${target.role === 'parent' ? 'Pai/Mãe' : 'Filho/Filha'}`,
        'info'
      );
    }
  };

  const applyFamilySession = (
    nextFamily: Family,
    nextProfiles: Profile[],
    nextCurrentProfileId?: string
  ) => {
    setFamily(nextFamily);
    setProfiles(nextProfiles);

    const fallbackProfileId =
      nextCurrentProfileId || nextProfiles.find((p) => p.role === 'parent')?.id || nextProfiles[0]?.id;
    if (fallbackProfileId) {
      setCurrentProfileId(fallbackProfileId);
    }
  };

  const dismissLevelUpModal = () => {
    setLevelUpModal(null);
  };

  // Initial load + auth state handling
  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isCancelled = false;

    const loadForUser = async (user: AuthUser | null) => {
      setAuthUser(user);
      setShowOnboarding(!user);

      if (!user) return;

      try {
        const state = await loadUserFamilyState();
        if (isCancelled) return;

        if (!state?.family || !state.profiles.length) {
          setShowOnboarding(true);
          return;
        }

        setFamily(state.family);
        setProfiles(state.profiles as Profile[]);
        setTasks(state.tasks as Task[]);
        setRewards(state.rewards as Reward[]);
        setCurrentProfileId(state.myProfileId);
        setShowOnboarding(false);
      } catch (error) {
        console.warn('Supabase sync skipped because tables are not ready yet:', error);
        setShowOnboarding(true);
      }
    };

    const init = async () => {
      const user = await getCurrentAuthUser();
      if (isCancelled) return;
      await loadForUser(user);
    };
    init().catch(() => {});

    const unsubscribe = onAuthChange((user) => {
      loadForUser(user);
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, []);

  // Real-time sync: keep every device in the family in lock-step. External
  // changes (e.g. a parent approving a task) instantly reflect on the child's screen.
  useEffect(() => {
    if (!isSupabaseConfigured || !authUser || !family?.id) return;

    const familyId = family.id;
    const channel = supabase
      .channel(`family:${familyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` },
        () => refreshFamilyData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `family_id=eq.${familyId}` },
        () => refreshFamilyData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rewards', filter: `family_id=eq.${familyId}` },
        () => refreshFamilyData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'redemptions', filter: `family_id=eq.${familyId}` },
        () => refreshFamilyData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authUser, family?.id, refreshFamilyData]);

  /**
   * Persist a set of writes to Supabase and, on failure, roll the UI back to
   * the server truth via a refresh. Returns true when every write succeeded.
   */
  const persistWrites = async (writes: Promise<{ data: Record<string, unknown> | null; error: Error | null }>[]) => {
    if (!isSupabaseConfigured) return true;
    const results = await Promise.all(writes);
    const failed = results.some((r) => r.error);
    if (failed) {
      addToast('Erro ao salvar', 'Não foi possível sincronizar com o servidor. Tente novamente.', 'error');
      playError();
      await refreshFamilyData();
      return false;
    }
    return true;
  };

  const completeTask = async (taskId: string, proofUrl?: string) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre em sua conta para concluir missões.', 'warning');
      return;
    }

    const task = tasks.find((t) => t.id === taskId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'waiting_approval', submitted_at: 'Agora mesmo', proof_url: proofUrl }
          : t
      )
    );

    const ok = await persistWrites([
      syncSupabaseUpdate('tasks', taskId, {
        status: 'waiting_approval',
        submitted_at: 'Agora mesmo',
        ...(proofUrl ? { proof_url: proofUrl } : {}),
      }),
    ]);

    if (!ok) return;

    playComplete();
    addToast(
      'Missão enviada!',
      `"${task?.title || 'Tarefa'}" está aguardando aprovação dos pais.`,
      'success'
    );
  };

  /**
   * Approvação da tarefa pelo Pai/Mãe: aplica XP + saldo (R$) e dispara level-up.
   */
  const approveTask = async (taskId: string) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para aprovar tarefas da família.', 'warning');
      return;
    }

    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const assignedChild = profiles.find((p) => p.id === targetTask.assigned_to);
    if (!assignedChild) return;

    const xpGained = targetTask.reward_value || 0;
    const moneyGained = targetTask.reward_money || 0;

    const result = applyLevelUp(assignedChild, xpGained, moneyGained);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'completed', approved_at: 'Agora mesmo' } : t
      )
    );

    setProfiles((prev) =>
      prev.map((p) =>
        p.id === assignedChild.id
          ? {
              ...p,
              xp: result.xp,
              level: result.level,
              xp_base: result.xp_base,
              xp_to_next_level: result.xp_to_next_level,
              balance: result.balance,
            }
          : p
      )
    );

    const logItem: ActivityLog = {
      id: Math.random().toString(36).substring(2, 9),
      family_id: family.id,
      profile_id: assignedChild.id,
      profile_name: assignedChild.full_name,
      type: 'task_approved',
      title: targetTask.title,
      points_change: xpGained,
      money_change: moneyGained,
      created_at: new Date().toISOString(),
    };

    setActivityLogs((prev) => [logItem, ...prev]);

    const writes = [
      syncSupabaseUpdate('tasks', taskId, { status: 'completed', approved_at: 'Agora mesmo' }),
      syncSupabaseUpdate('profiles', assignedChild.id, {
        xp: result.xp,
        level: result.level,
        xp_base: result.xp_base,
        xp_to_next_level: result.xp_to_next_level,
        balance: result.balance,
      }),
      syncSupabaseWrite('activity_logs', logItem as unknown as Record<string, unknown>),
    ];

    if (result.leveledUp) {
      const levelUpLog: ActivityLog = {
        id: Math.random().toString(36).substring(2, 9),
        family_id: family.id,
        profile_id: assignedChild.id,
        profile_name: assignedChild.full_name,
        type: 'level_up',
        title: `Subiu para o nível ${result.level}!`,
        points_change: 0,
        created_at: new Date().toISOString(),
      };
      setActivityLogs((prev) => [levelUpLog, ...prev]);
      writes.push(syncSupabaseWrite('activity_logs', levelUpLog as unknown as Record<string, unknown>));
    }

    const ok = await persistWrites(writes);

    if (!ok) return;

    addToast(
      'Missão Aprovada! 🌟',
      `+${xpGained} XP ${moneyGained > 0 ? `e +R$ ${moneyGained.toFixed(2)}` : ''} concedidos para ${assignedChild.full_name}.`,
      'success'
    );

    if (result.leveledUp) {
      playLevelUp();
      setLevelUpModal({
        profileName: assignedChild.full_name,
        newLevel: result.level,
        unlockedTitle: 'Mestre das Missões',
      });
      // Fire confetti burst
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3525cd', '#6b38d4', '#4edea3', '#ffc107', '#ff6b81'],
      });
    } else {
      playComplete();
    }
  };

  const rejectTask = async (taskId: string, reason?: string) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para rejeitar ou devolver uma tarefa.', 'warning');
      return;
    }

    const rejectedTask = tasks.find((t) => t.id === taskId);
    const rejectReason = reason || 'Precisa refazer alguns pontos antes da aprovação.';

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: 'pending', rejection_reason: rejectReason } : t
      )
    );

    const rejectLog: ActivityLog = {
      id: `log-${Date.now()}`,
      family_id: family.id,
      profile_id: rejectedTask?.assigned_to ?? currentProfile.id,
      profile_name:
        (profiles.find((p) => p.id === rejectedTask?.assigned_to)?.full_name) || 'Filho(a)',
      type: 'task_rejected',
      title: rejectedTask?.title ?? 'Tarefa',
      points_change: 0,
      created_at: new Date().toISOString(),
    };

    setActivityLogs((prev) => [rejectLog, ...prev]);

    const ok = await persistWrites([
      syncSupabaseUpdate('tasks', taskId, { status: 'pending', rejection_reason: rejectReason }),
      syncSupabaseWrite('activity_logs', rejectLog as unknown as Record<string, unknown>),
    ]);

    if (!ok) return;

    addToast('Missão Rejeitada', 'A tarefa retornou para a lista com status pendente.', 'warning');
  };

  const createTask = async (
    taskData: Omit<Task, 'id' | 'created_at' | 'status' | 'family_id' | 'created_by'>
  ) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para criar missões para a família.', 'warning');
      return;
    }

    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      family_id: family.id,
      created_by: currentProfile.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    const ok = await persistWrites([
      syncSupabaseWrite('tasks', newTask as unknown as Record<string, unknown>),
    ]);

    if (!ok) return;

    addToast('Nova Missão Criada!', `"${newTask.title}" adicionada com sucesso.`, 'success');
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    const ok = await persistWrites([syncSupabaseDelete('tasks', taskId)]);

    if (!ok) return;

    addToast('Missão removida', undefined, 'info');
  };

  /**
   * Resgatar recompensa na Loja (economia híbrida XP + R$).
   */
  const redeemReward = async (rewardId: string): Promise<boolean> => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para resgatar recompensas.', 'warning');
      return false;
    }

    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return false;

    const check = canRedeem(currentProfile, reward);
    if (!check.ok) {
      addToast('Não foi possível resgatar', check.reason, 'error');
      return false;
    }

    const next = applyRedeem(currentProfile, reward);

    setProfiles((prev) =>
      prev.map((p) =>
        p.id === currentProfile.id
          ? { ...p, xp: next.xp, balance: next.balance }
          : p
      )
    );

    const newRedemption: Redemption = {
      id: `red-${Date.now()}`,
      family_id: family.id,
      reward_id: reward.id,
      reward_title: reward.title,
      profile_id: currentProfile.id,
      profile_name: currentProfile.full_name,
      points_spent: reward.points_cost,
      status: 'requested',
      created_at: new Date().toISOString(),
    };

    setRedemptions((prev) => [newRedemption, ...prev]);

    const redeemLog: ActivityLog = {
      id: `log-${Date.now()}`,
      family_id: family.id,
      profile_id: currentProfile.id,
      profile_name: currentProfile.full_name,
      type: 'reward_redeemed',
      title: reward.title,
      points_change: -reward.points_cost,
      money_change: -reward.money_cost,
      created_at: new Date().toISOString(),
    };

    setActivityLogs((prev) => [redeemLog, ...prev]);

    const ok = await persistWrites([
      syncSupabaseUpdate('profiles', currentProfile.id, { xp: next.xp, balance: next.balance }),
      syncSupabaseWrite('redemptions', newRedemption as unknown as Record<string, unknown>),
      syncSupabaseWrite('activity_logs', redeemLog as unknown as Record<string, unknown>),
    ]);

    if (!ok) return false;

    playReward();
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#4f46e5', '#8455ef', '#6ffbbe'],
    });

    addToast(
      'Recompensa Resgatada! 🎉',
      `Você resgatou "${reward.title}" por ${reward.points_cost} pontos.`,
      'success'
    );

    return true;
  };

  const createReward = async (rewardData: Omit<Reward, 'id' | 'created_at' | 'family_id'>) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para criar recompensas da família.', 'warning');
      return;
    }

    const newReward: Reward = {
      ...rewardData,
      id: `rew-${Date.now()}`,
      family_id: family.id,
      created_at: new Date().toISOString(),
    };

    setRewards((prev) => [newReward, ...prev]);

    const ok = await persistWrites([
      syncSupabaseWrite('rewards', newReward as unknown as Record<string, unknown>),
    ]);

    if (!ok) return;

    addToast('Prêmio adicionado à loja!', `"${newReward.title}" agora pode ser resgatado.`, 'success');
  };

  const toggleRewardAvailability = async (rewardId: string) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para alterar a disponibilidade da loja.', 'warning');
      return;
    }

    const targetReward = rewards.find((r) => r.id === rewardId);
    if (!targetReward) return;

    const nextAvailable = !targetReward.is_available;

    setRewards((prev) =>
      prev.map((r) => (r.id === rewardId ? { ...r, is_available: nextAvailable } : r))
    );

    const ok = await persistWrites([
      syncSupabaseUpdate('rewards', rewardId, { is_available: nextAvailable }),
    ]);

    if (!ok) return;

    addToast(
      nextAvailable ? 'Prêmio disponível!' : 'Prêmio ocultado',
      `"${targetReward.title}" ${nextAvailable ? 'já pode ser resgatado.' : 'foi retirado da loja.'}`,
      'info'
    );
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(family.invite_code);
    addToast(
      'Código Copiado!',
      `Código "${family.invite_code}" copiado para a área de transferência.`,
      'success'
    );
  };

  const resetDemoData = () => {
    setFamily(INITIAL_FAMILY);
    setProfiles(INITIAL_PROFILES);
    setCurrentProfileId('prof-child-01');
    setTasks(INITIAL_TASKS);
    setRewards(INITIAL_REWARDS);
    setRedemptions([]);
    setActivityLogs([]);
    localStorage.setItem('fq_session_mode', 'demo');
    localStorage.setItem('fq_family', JSON.stringify(INITIAL_FAMILY));
    localStorage.setItem('fq_profiles', JSON.stringify(INITIAL_PROFILES));
    localStorage.setItem('fq_current_profile_id', 'prof-child-01');
    localStorage.setItem('fq_tasks', JSON.stringify(INITIAL_TASKS));
    localStorage.setItem('fq_rewards', JSON.stringify(INITIAL_REWARDS));
    localStorage.setItem('fq_redemptions', JSON.stringify([]));
    localStorage.setItem('fq_logs', JSON.stringify([]));
    addToast('Dados restaurados para o padrão de demonstração.', undefined, 'info');
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setShowOnboarding(false);
      return;
    }

    try {
      await signOutUser();
    } catch (error) {
      console.warn('Sign out failed:', error);
    }

    setAuthUser(null);
    setShowOnboarding(true);
    addToast('Você saiu da sua conta.', undefined, 'info');
  };

  /**
   * Pais concedem mesada (R$) para um filho — alimenta o saldo usado na loja.
   */
  const grantAllowance = async (profileId: string, amount: number) => {
    if (!Number.isFinite(amount) || amount <= 0) return;

    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para conceder mesada.', 'warning');
      return;
    }

    const target = profiles.find((p) => p.id === profileId);
    if (!target) return;

    const newBalance = Number((target.balance + amount).toFixed(2));

    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, balance: newBalance } : p))
    );

    const allowanceLog: ActivityLog = {
      id: `log-${Date.now()}`,
      family_id: family.id,
      profile_id: target.id,
      profile_name: target.full_name,
      type: 'allowance',
      title: `Mesada de R$ ${amount.toFixed(2)}`,
      points_change: 0,
      money_change: amount,
      created_at: new Date().toISOString(),
    };

    setActivityLogs((prev) => [allowanceLog, ...prev]);

    const ok = await persistWrites([
      syncSupabaseUpdate('profiles', profileId, { balance: newBalance }),
      syncSupabaseWrite('activity_logs', allowanceLog as unknown as Record<string, unknown>),
    ]);

    if (!ok) return;

    addToast('Mesada concedida! 💰', `R$ ${amount.toFixed(2)} adicionados para ${target.full_name}.`, 'success');
  };

  return (
    <FamilyContext.Provider
      value={{
        family,
        profiles,
        currentProfile,
        tasks,
        rewards,
        redemptions,
        activityLogs,
        activeTab,
        parentSubTab,
        levelUpModal,
        toasts,
        showOnboarding,
        authUser,
        isAuthenticated: Boolean(authUser),
        isSyncing,
        setActiveTab,
        setParentSubTab,
        switchProfile,
        applyFamilySession,
        setShowOnboarding,
        dismissLevelUpModal,
        dismissToast,
        addToast,
        completeTask,
        approveTask,
        rejectTask,
        createTask,
        deleteTask,
        redeemReward,
        createReward,
        toggleRewardAvailability,
        copyInviteCode,
        resetDemoData,
        signOut,
        grantAllowance,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
