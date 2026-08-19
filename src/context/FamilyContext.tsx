import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured, syncSupabaseWrite, syncSupabaseUpdate, syncSupabaseDelete, getCurrentAuthUser, loadUserFamilyState, onAuthChange, signOutUser, type AuthUser } from '../lib/supabase';
import { 
  Family, 
  Profile, 
  Task, 
  Reward, 
  Redemption, 
  ActivityLog, 
  ActiveTab, 
  ParentSubTab 
} from '../types';
import { 
  INITIAL_FAMILY, 
  INITIAL_PROFILES, 
  INITIAL_TASKS, 
  INITIAL_REWARDS 
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
  completeTask: (taskId: string) => Promise<void>;
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

  // Sync to local storage only for demo mode. Real Supabase sessions should stay source of truth.
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

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || profiles[0];

  const addToast = (title: string, description?: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
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
      addToast(`Perfil alternado para ${target.full_name}`, `Modo: ${target.role === 'parent' ? 'Pai/Mãe' : 'Filho/Filha'}`, 'info');
    }
  };

  const applyFamilySession = (nextFamily: Family, nextProfiles: Profile[], nextCurrentProfileId?: string) => {
    setFamily(nextFamily);
    setProfiles(nextProfiles);

    const fallbackProfileId = nextCurrentProfileId || nextProfiles.find((p) => p.role === 'parent')?.id || nextProfiles[0]?.id;
    if (fallbackProfileId) {
      setCurrentProfileId(fallbackProfileId);
    }
  };

  const dismissLevelUpModal = () => {
    setLevelUpModal(null);
  };

  const refreshFamilyData = async () => {
    if (!isSupabaseConfigured || !authUser) {
      return;
    }

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
      setCurrentProfileId(nextState.myProfileId);
    } catch (error) {
      console.warn('Failed to refresh family session from Supabase:', error);
    }
  };

  /**
   * Marcar uma tarefa como concluída pelo filho
   * Status muda para 'waiting_approval' (Aguardando Aprovação dos Pais)
   */
  const completeTask = async (taskId: string) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre em sua conta para concluir missões.', 'warning');
      return;
    }
    /* =========================================================================
     * TODO: [SUPABASE INTEGRATION - COMPLETE TASK]
     * const { data, error } = await supabase
     *   .from('tasks')
     *   .update({
     *     status: 'waiting_approval',
     *     submitted_at: new Date().toISOString(),
     *   })
     *   .eq('id', taskId)
     *   .select()
     *   .single();
     * ========================================================================= */

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'waiting_approval',
            submitted_at: 'Agora mesmo',
          };
        }
        return t;
      })
    );

    if (isSupabaseConfigured) {
      await syncSupabaseUpdate('tasks', taskId, {
        status: 'waiting_approval',
        submitted_at: 'Agora mesmo',
      });
    }

    const task = tasks.find((t) => t.id === taskId);
    addToast(
      'Missão enviada!',
      `"${task?.title || 'Tarefa'}" está aguardando aprovação dos pais.`,
      'success'
    );

    if (isSupabaseConfigured) {
      await refreshFamilyData();
    }
  };

  /**
   * Aprovação da tarefa pelo Pai/Mãe
   * Adiciona XP e saldo em dinheiro ao perfil da criança
   * Verifica se atingiu novo nível para disparar o modal Level Up
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

    const currentXp = assignedChild.xp + xpGained;
    let newLevel = assignedChild.level;
    let nextThreshold = assignedChild.xp_to_next_level;
    let xpBase = assignedChild.xp_base;
    let leveledUp = false;

    // Level up: every 500 XP above the current level base advances one level.
    while (currentXp >= nextThreshold) {
      xpBase = nextThreshold;
      newLevel += 1;
      nextThreshold += 500;
      leveledUp = true;
    }

    /* =========================================================================
     * TODO: [SUPABASE INTEGRATION - APPROVE TASK]
     * 1. Atualizar status da tarefa:
     * const { error: taskErr } = await supabase
     *   .from('tasks')
     *   .update({
     *     status: 'completed',
     *     approved_at: new Date().toISOString(),
     *   })
     *   .eq('id', taskId);
     *
     * 2. Atualizar XP, Level e Saldo no perfil:
     * const { error: profErr } = await supabase
     *   .from('profiles')
     *   .update({
     *     xp: currentXp,
     *     level: newLevel,
     *     xp_to_next_level: nextThreshold,
     *     balance: assignedChild.balance + moneyGained,
     *   })
     *   .eq('id', assignedChild.id);
     *
     * 3. Registrar no log de atividades:
     * await supabase.from('activity_logs').insert({
     *   family_id: family.id,
     *   profile_id: assignedChild.id,
     *   type: 'task_approved',
     *   title: targetTask.title,
     *   points_change: xpGained,
     *   money_change: moneyGained,
     * });
     * ========================================================================= */

    // Update Tasks
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: 'completed', approved_at: 'Agora mesmo' }
          : t
      )
    );

    if (isSupabaseConfigured) {
      await syncSupabaseUpdate('tasks', taskId, {
        status: 'completed',
        approved_at: 'Agora mesmo',
      });
    }

    // Update Profiles
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === assignedChild.id
          ? {
              ...p,
              xp: currentXp,
              level: newLevel,
              xp_base: xpBase,
              xp_to_next_level: nextThreshold,
              balance: p.balance + moneyGained,
            }
          : p
      )
    );

    if (isSupabaseConfigured) {
      await syncSupabaseUpdate('profiles', assignedChild.id, {
        xp: currentXp,
        level: newLevel,
        xp_base: xpBase,
        xp_to_next_level: nextThreshold,
        balance: assignedChild.balance + moneyGained,
      });
    }

    // Activity Log
    const logItem = {
      id: Math.random().toString(36).substring(2, 9),
      family_id: family.id,
      profile_id: assignedChild.id,
      profile_name: assignedChild.full_name,
      type: 'task_approved',
      title: targetTask.title,
      points_change: xpGained,
      money_change: moneyGained,
      created_at: new Date().toISOString(),
    } as ActivityLog;

    setActivityLogs((prev) => [logItem, ...prev]);

    if (isSupabaseConfigured) {
      await syncSupabaseWrite('activity_logs', logItem as unknown as Record<string, unknown>);
    }

    addToast(
      'Missão Aprovada! 🌟',
      `+${xpGained} XP ${moneyGained > 0 ? `e +R$ ${moneyGained.toFixed(2)}` : ''} concedidos para ${assignedChild.full_name}.`,
      'success'
    );

    if (leveledUp) {
      setLevelUpModal({
        profileName: assignedChild.full_name,
        newLevel: newLevel,
        unlockedTitle: 'Mestre das Missões',
      });
      // Fire confetti burst
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3525cd', '#6b38d4', '#4edea3', '#ffc107', '#ff6b81'],
      });
    }

    if (isSupabaseConfigured) {
      await refreshFamilyData();
    }
  };

  /**
   * Rejeitar tarefa com retorno ao status 'pending'
   */
  const rejectTask = async (taskId: string, reason?: string) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para rejeitar ou devolver uma tarefa.', 'warning');
      return;
    }

    /* =========================================================================
     * TODO: [SUPABASE INTEGRATION - REJECT TASK]
     * await supabase
     *   .from('tasks')
     *   .update({
     *     status: 'pending',
     *     rejection_reason: reason || 'Precisa refazer alguns detalhes',
     *   })
     *   .eq('id', taskId);
     * ========================================================================= */

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'pending',
              rejection_reason: reason || 'Precisa refazer alguns pontos antes da aprovação.',
            }
          : t
      )
    );

    const rejectedTask = tasks.find((t) => t.id === taskId);

    const rejectLog: ActivityLog = {
      id: `log-${Date.now()}`,
      family_id: family.id,
      profile_id: rejectedTask?.assigned_to ?? currentProfile.id,
      profile_name: (profiles.find((p) => p.id === rejectedTask?.assigned_to)?.full_name) || 'Filho(a)',
      type: 'task_rejected',
      title: rejectedTask?.title ?? 'Tarefa',
      points_change: 0,
      created_at: new Date().toISOString(),
    };

    setActivityLogs((prev) => [rejectLog, ...prev]);

    if (isSupabaseConfigured) {
      await syncSupabaseUpdate('tasks', taskId, {
        status: 'pending',
        rejection_reason: reason || 'Precisa refazer alguns pontos antes da aprovação.',
      });
      await syncSupabaseWrite('activity_logs', rejectLog as unknown as Record<string, unknown>);
    }

    addToast('Missão Rejeitada', 'A tarefa retornou para a lista com status pendente.', 'warning');

    if (isSupabaseConfigured) {
      await refreshFamilyData();
    }
  };

  /**
   * Criar nova missão (Pai/Mãe)
   */
  const createTask = async (
    taskData: Omit<Task, 'id' | 'created_at' | 'status' | 'family_id' | 'created_by'>
  ) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para criar missões para a família.', 'warning');
      return;
    }

    /* =========================================================================
     * TODO: [SUPABASE INTEGRATION - CREATE TASK]
     * const { data, error } = await supabase
     *   .from('tasks')
     *   .insert([{
     *     ...taskData,
     *     family_id: family.id,
     *     created_by: currentProfile.id,
     *     status: 'pending'
     *   }])
     *   .select()
     *   .single();
     * ========================================================================= */

    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      family_id: family.id,
      created_by: currentProfile.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);

    if (isSupabaseConfigured) {
      await syncSupabaseWrite('tasks', newTask as unknown as Record<string, unknown>);
    }

    addToast('Nova Missão Criada!', `"${newTask.title}" adicionada com sucesso.`, 'success');

    if (isSupabaseConfigured) {
      await refreshFamilyData();
    }
  };

  const deleteTask = async (taskId: string) => {
    /* =========================================================================
     * TODO: [SUPABASE INTEGRATION - DELETE TASK]
     * await supabase.from('tasks').delete().eq('id', taskId);
     * ========================================================================= */
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (isSupabaseConfigured) {
      await syncSupabaseDelete('tasks', taskId);
    }

    addToast('Missão removida', undefined, 'info');
  };

  /**
   * Resgatar recompensa na Loja
   */
  const redeemReward = async (rewardId: string): Promise<boolean> => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para resgatar recompensas.', 'warning');
      return false;
    }

    const reward = rewards.find((r) => r.id === rewardId);
    if (!reward) return false;

    const moneyNeeded = reward.money_cost || 0;
    if (currentProfile.xp < reward.points_cost) {
      addToast('Pontos insuficientes', `Você precisa de ${reward.points_cost} XP para este prêmio.`, 'error');
      return false;
    }
    if (moneyNeeded > 0 && currentProfile.balance < moneyNeeded) {
      addToast('Saldo insuficiente', `Você precisa de R$ ${moneyNeeded.toFixed(2)} para este prêmio.`, 'error');
      return false;
    }

    /* =========================================================================
     * TODO: [SUPABASE INTEGRATION - REDEEM REWARD]
     * 1. Deduzir XP e Saldo:
     * await supabase.from('profiles').update({
     *   xp: currentProfile.xp - reward.points_cost,
     *   balance: currentProfile.balance - reward.money_cost,
     * }).eq('id', currentProfile.id);
     * 2. Registrar resgate:
     * await supabase.from('redemptions').insert({
     *   family_id: family.id,
     *   reward_id: reward.id,
     *   profile_id: currentProfile.id,
     *   points_spent: reward.points_cost,
     *   status: 'requested',
     * });
     * ========================================================================= */

    // Deduct points and money
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === currentProfile.id
          ? {
              ...p,
              xp: p.xp - reward.points_cost,
              balance: p.balance - moneyNeeded,
            }
          : p
      )
    );

    if (isSupabaseConfigured) {
      await syncSupabaseUpdate('profiles', currentProfile.id, {
        xp: currentProfile.xp - reward.points_cost,
        balance: currentProfile.balance - moneyNeeded,
      });
    }

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

    if (isSupabaseConfigured) {
      await syncSupabaseWrite('redemptions', newRedemption as unknown as Record<string, unknown>);
      await syncSupabaseWrite('activity_logs', redeemLog as unknown as Record<string, unknown>);
    }

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

    if (isSupabaseConfigured) {
      await refreshFamilyData();
    }

    return true;
  };

  const createReward = async (
    rewardData: Omit<Reward, 'id' | 'created_at' | 'family_id'>
  ) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para criar recompensas da família.', 'warning');
      return;
    }

    /* =========================================================================
     * TODO: [SUPABASE INTEGRATION - CREATE REWARD]
     * const { data, error } = await supabase.from('rewards').insert([{ ...rewardData, family_id: family.id }]);
     * ========================================================================= */
    const newReward: Reward = {
      ...rewardData,
      id: `rew-${Date.now()}`,
      family_id: family.id,
      created_at: new Date().toISOString(),
    };
    setRewards((prev) => [newReward, ...prev]);

    if (isSupabaseConfigured) {
      await syncSupabaseWrite('rewards', newReward as unknown as Record<string, unknown>);
    }

    addToast('Prêmio adicionado à loja!', `"${newReward.title}" agora pode ser resgatado.`, 'success');

    if (isSupabaseConfigured) {
      await refreshFamilyData();
    }
  };

  const toggleRewardAvailability = async (rewardId: string) => {
    if (isSupabaseConfigured && !authUser) {
      setShowOnboarding(true);
      addToast('Autenticação necessária', 'Entre para alterar a disponibilidade da loja.', 'warning');
      return;
    }

    setRewards((prev) =>
      prev.map((r) =>
        r.id === rewardId ? { ...r, is_available: !r.is_available } : r
      )
    );

    if (isSupabaseConfigured) {
      const targetReward = rewards.find((r) => r.id === rewardId);
      if (targetReward) {
        await syncSupabaseUpdate('rewards', rewardId, {
          is_available: !targetReward.is_available,
        });
      }
      await refreshFamilyData();
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(family.invite_code);
    addToast('Código Copiado!', `Código "${family.invite_code}" copiado para a área de transferência.`, 'success');
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
