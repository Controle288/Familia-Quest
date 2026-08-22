import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type FamilyRecord = {
  id: string;
  name: string;
  invite_code: string;
  created_by?: string;
  created_at?: string;
};

export type ProfileRecord = {
  id: string;
  family_id: string;
  user_id?: string;
  name: string;
  full_name: string;
  role: 'parent' | 'child';
  relationship?: 'mae' | 'pai' | 'avo' | 'outro' | 'filho';
  avatar_url: string;
  title?: string;
  level: number;
  xp: number;
  xp_base: number;
  xp_to_next_level: number;
  balance: number;
  streak_days: number;
  created_at: string;
};

export interface SyncResult {
  data: Record<string, unknown> | null;
  error: Error | null;
}

export const syncSupabaseWrite = async (
  table: string,
  payload: Record<string, unknown>
): Promise<SyncResult> => {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase.from(table).insert([payload]).select().single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as Record<string, unknown>, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const syncSupabaseUpdate = async (
  table: string,
  id: string,
  payload: Record<string, unknown>
): Promise<SyncResult> => {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }

  try {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
    if (error) return { data: null, error: new Error(error.message) };
    return { data: data as Record<string, unknown>, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const syncSupabaseDelete = async (table: string, id: string): Promise<SyncResult> => {
  if (!isSupabaseConfigured) {
    return { data: null, error: null };
  }

  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return { data: null, error: new Error(error.message) };
    return { data: { id }, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
};

export const loadFamilyState = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const [familyResult, profileResult, taskResult, rewardResult] = await Promise.all([
      supabase.from('families').select('*').limit(1),
      supabase.from('profiles').select('*').limit(50),
      supabase.from('tasks').select('*').limit(100),
      supabase.from('rewards').select('*').limit(100),
    ]);

    const family = familyResult.data?.[0] ?? null;
    const profiles = profileResult.data ?? [];
    const tasks = taskResult.data ?? [];
    const rewards = rewardResult.data ?? [];

    return { family, profiles, tasks, rewards };
  } catch (error) {
    console.warn('Failed to load Supabase family state:', error);
    return null;
  }
};

export const findFamilyByInviteCode = async (inviteCode: string) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from('families')
    .select('*')
    .eq('invite_code', inviteCode)
    .maybeSingle();

  if (error) {
    console.warn('findFamilyByInviteCode error:', error);
    return null;
  }

  return data;
};

const generateRecordId = (prefix: string) => {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${randomPart}`;
};

export const createFamilyWithProfiles = async (
  familyName: string,
  profiles: ProfileRecord[],
  authUserId?: string
) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const inviteCode = `FAM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert([{ name: familyName, invite_code: inviteCode, created_by: authUserId }])
    .select()
    .single();

  if (familyError || !family) {
    throw familyError || new Error('Falha ao criar a família');
  }

  const preparedProfiles = profiles.map((profile) => ({
    ...profile,
    id: profile.id || generateRecordId(profile.role === 'parent' ? 'profile-parent' : 'profile-child'),
    family_id: family.id,
    user_id: profile.role === 'parent' && authUserId ? authUserId : profile.user_id || undefined,
    created_at: profile.created_at || new Date().toISOString(),
  }));

  const { data: createdProfiles, error: profilesError } = await supabase
    .from('profiles')
    .insert(preparedProfiles)
    .select();

  if (profilesError) {
    throw profilesError;
  }

  return { family, profiles: createdProfiles ?? [] };
};

// ---------------------------------------------------------------------------
// Authentication helpers (Supabase Auth)
// ---------------------------------------------------------------------------

export type AuthUser = {
  id: string;
  email: string | null;
};

export const signUpWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Falha ao criar usuário');

  if (data.session && data.user) {
    return { id: data.user.id, email: data.user.email ?? null };
  }

  try {
    const loginResult = await supabase.auth.signInWithPassword({ email, password });
    if (loginResult.error) {
      throw new Error('Conta criada, mas o e-mail precisa ser confirmado antes de entrar. Verifique sua caixa de entrada e tente novamente.');
    }

    if (!loginResult.data.user) {
      throw new Error('Falha ao autenticar após a criação da conta.');
    }

    return { id: loginResult.data.user.id, email: loginResult.data.user.email ?? null };
  } catch (loginError) {
    if (loginError instanceof Error && loginError.message.includes('confirm')) {
      throw loginError;
    }

    throw new Error('Conta criada, mas a autenticação automática falhou. Confirme o e-mail e tente entrar novamente.');
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<AuthUser> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Falha ao autenticar');
  return { id: data.user.id, email: data.user.email ?? null };
};

export const signOutUser = async (): Promise<void> => {
  if (!isSupabaseConfigured) {
    return;
  }
  await supabase.auth.signOut();
};

export const getCurrentAuthUser = async (): Promise<AuthUser | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
};

export const getCurrentUserProfileMembership = async () => {
  if (!isSupabaseConfigured) {
    return [] as Array<{ id: string; family_id: string; role: 'parent' | 'child' }>;
  }

  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return [] as Array<{ id: string; family_id: string; role: 'parent' | 'child' }>;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, family_id, role')
    .eq('user_id', authUser.id);

  if (error) {
    console.warn('Error loading user profile membership:', error);
    return [] as Array<{ id: string; family_id: string; role: 'parent' | 'child' }>;
  }

  return (data ?? []) as Array<{ id: string; family_id: string; role: 'parent' | 'child' }>;
};

export const hasFamilyMembership = async (familyId: string): Promise<boolean> => {
  if (!isSupabaseConfigured) {
    return false;
  }

  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return false;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('family_id', familyId)
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (error) {
    console.warn('Family membership check failed:', error);
    return false;
  }

  return Boolean(data);
};

export const onAuthChange = (
  callback: (user: AuthUser | null) => void
): (() => void) => {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;
    callback(user ? { id: user.id, email: user.email ?? null } : null);
  });

  return () => data.subscription.unsubscribe();
};

/**
 * Load the full family state for the currently authenticated user.
 * Returns null when there is no authenticated user or no linked profile.
 */
export const loadUserFamilyState = async () => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const authUser = await getCurrentAuthUser();
  if (!authUser) {
    return null;
  }

  const { data: myProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .limit(1)
    .maybeSingle();

  if (profileError || !myProfile) {
    return null;
  }

  const familyId = (myProfile as ProfileRecord).family_id;

  const [familyResult, profileResult, taskResult, rewardResult, redemptionResult, logResult] = await Promise.all([
    supabase.from('families').select('*').eq('id', familyId).limit(1),
    supabase.from('profiles').select('*').eq('family_id', familyId),
    supabase.from('tasks').select('*').eq('family_id', familyId).limit(100),
    supabase.from('rewards').select('*').eq('family_id', familyId).limit(100),
    supabase.from('redemptions').select('*').eq('family_id', familyId).limit(100),
    supabase.from('activity_logs').select('*').eq('family_id', familyId).limit(100),
  ]);

  const family = familyResult.data?.[0] ?? null;
  const profiles = profileResult.data ?? [];
  const tasks = taskResult.data ?? [];
  const rewards = rewardResult.data ?? [];
  const redemptions = redemptionResult.data ?? [];
  const activityLogs = logResult.data ?? [];

  return {
    authUser,
    myProfileId: (myProfile as ProfileRecord).id,
    family,
    profiles,
    tasks,
    rewards,
    redemptions,
    activityLogs,
  };
};

export const createProfileInFamily = async (
  familyId: string,
  profile: Omit<ProfileRecord, 'id' | 'family_id' | 'created_at'>,
  authUserId?: string
) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        ...profile,
        id: generateRecordId(profile.role === 'parent' ? 'profile-parent' : 'profile-child'),
        family_id: familyId,
        user_id: profile.role === 'parent' && authUserId ? authUserId : profile.user_id || authUserId || undefined,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Upload a task completion proof photo to the `task-proofs` bucket.
 * Path convention: `<family_id>/<profile_id>/<timestamp>-<filename>`.
 * Returns the public URL, or null when Storage is unavailable / on error.
 */
export const uploadTaskProof = async (
  file: File,
  familyId: string,
  profileId: string
): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${familyId}/${profileId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const { data, error } = await supabase.storage
      .from('task-proofs')
      .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
    if (error) {
      console.warn('uploadTaskProof failed:', error.message);
      return null;
    }
    const { data: urlData } = supabase.storage.from('task-proofs').getPublicUrl(data.path);
    return urlData.publicUrl;
  } catch (err) {
    console.warn('uploadTaskProof error:', err);
    return null;
  }
};

// ---------------------------------------------------------------------------
// v2 helpers — admin, planos, pagamentos, temas, tickets, localização, OTP.
// ---------------------------------------------------------------------------

export const getCurrentIsAdmin = async (): Promise<boolean> => {
  if (!isSupabaseConfigured) return false;
  const { data } = await supabase.from('admins').select('user_id').limit(1).maybeSingle();
  return Boolean(data);
};

// Family settings
export const loadFamilySettings = async (familyId: string) => {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase
    .from('family_settings')
    .select('*')
    .eq('family_id', familyId)
    .maybeSingle();
  return data;
};

export const upsertFamilySettings = async (settings: Record<string, unknown>) => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('family_settings')
    .upsert(settings as never)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Plans (admin)
export const loadPlans = async () => {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
  return (data ?? []) as import('../types').Plan[];
};

export const adminSavePlan = async (plan: import('../types').Plan | Omit<import('../types').Plan, 'id' | 'created_at'>) => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('plans').upsert(plan as never).select().single();
  if (error) throw error;
  return data;
};

export const adminDeletePlan = async (id: string) => {
  if (!isSupabaseConfigured) return;
  await supabase.from('plans').delete().eq('id', id);
};

// Payment settings (admin)
export const loadPaymentSettings = async () => {
  if (!isSupabaseConfigured) return { provider: 'stripe' } as import('../types').PaymentSettings;
  const { data } = await supabase.from('payment_settings').select('*').maybeSingle();
  return (data as import('../types').PaymentSettings) ?? ({ provider: 'stripe' } as import('../types').PaymentSettings);
};

export const adminSavePaymentSettings = async (settings: import('../types').PaymentSettings) => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('payment_settings')
    .upsert(settings as never)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Support tickets
export const createTicket = async (ticket: Record<string, unknown>) => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('support_tickets').insert([ticket]).select().single();
  if (error) throw error;
  return data;
};

export const loadMyTickets = async (familyId: string) => {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  return (data ?? []) as import('../types').SupportTicket[];
};

export const loadAllTickets = async () => {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  return (data ?? []) as import('../types').SupportTicket[];
};

export const adminReplyTicket = async (id: string, reply: string, status: string) => {
  if (!isSupabaseConfigured) return;
  await supabase.from('support_tickets').update({ admin_reply: reply, status }).eq('id', id);
};

// Locations
export const upsertLocation = async (loc: Record<string, unknown>) => {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('profile_locations').upsert(loc as never).select().single();
  if (error) throw error;
  return data;
};

export const loadFamilyLocations = async (familyId: string) => {
  if (!isSupabaseConfigured) return [];
  const { data } = await supabase.from('profile_locations').select('*').eq('family_id', familyId);
  return (data ?? []) as import('../types').ProfileLocation[];
};

// Password reset via email OTP (short code)
export const requestPasswordReset = async (email: string): Promise<void> => {
  if (!isSupabaseConfigured) throw new Error('Servidor indisponível');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, data: { reset_flow: true } },
  });
  if (error) throw error;
};

export const verifyResetCode = async (email: string, code: string) => {
  if (!isSupabaseConfigured) throw new Error('Servidor indisponível');
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
};

export const setNewPassword = async (password: string) => {
  if (!isSupabaseConfigured) throw new Error('Servidor indisponível');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
};

// Avatar upload
export const uploadAvatar = async (file: File, familyId: string, profileId: string): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const path = `${familyId}/${profileId}/avatar-${Date.now()}.${ext}`;
  try {
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' });
    if (error) {
      console.warn('uploadAvatar failed:', error.message);
      return null;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn('uploadAvatar error:', err);
    return null;
  }
};

// Account deletion (hard delete via Postgres RPC with admin privileges).
// A RPC `delete_user_account` roda com SECURITY DEFINER e remove os dados do
// usuário e o próprio auth.users, liberando o e-mail para reuso.
export const deleteAccount = async (): Promise<void> => {
  if (!isSupabaseConfigured) throw new Error('Servidor indisponível');
  const { error } = await supabase.rpc('delete_user_account');
  if (error) throw error;
};

// Member count for free-plan limits
export const countFamilyMembers = async (familyId: string): Promise<number> => {
  if (!isSupabaseConfigured) return 0;
  const { data } = await supabase.rpc('family_member_count', { check_family_id: familyId });
  return Number(data ?? 0);
};

export const getFamilyMemberCounts = async (
  familyId: string
): Promise<{ parents: number; children: number }> => {
  if (!isSupabaseConfigured) return { parents: 0, children: 0 };
  const { data } = await supabase.from('profiles').select('role').eq('family_id', familyId);
  const rows = (data ?? []) as { role?: string }[];
  return {
    parents: rows.filter((r) => r.role === 'parent').length,
    children: rows.filter((r) => r.role === 'child').length,
  };
};

export const createCheckout = async (planId: string) => {
  if (!isSupabaseConfigured) throw new Error('Servidor não configurado');
  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { plan_id: planId },
  });
  if (error) throw error;
  return data as { url?: string } | null;
};
