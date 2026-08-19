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
  avatar_url: string;
  title?: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  balance: number;
  streak_days: number;
  created_at: string;
};

export const syncSupabaseWrite = async (table: string, payload: Record<string, unknown>) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase.from(table).insert([payload]).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn(`[Supabase] write failed for ${table}:`, error);
    return null;
  }
};

export const syncSupabaseUpdate = async (table: string, id: string, payload: Record<string, unknown>) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.warn(`[Supabase] update failed for ${table}:`, error);
    return null;
  }
};

export const syncSupabaseDelete = async (table: string, id: string) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.warn(`[Supabase] delete failed for ${table}:`, error);
    return null;
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
    .insert([{ name: familyName, invite_code: inviteCode, created_by: authUserId || 'demo-user' }])
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

  const [familyResult, profileResult, taskResult, rewardResult] = await Promise.all([
    supabase.from('families').select('*').eq('id', familyId).limit(1),
    supabase.from('profiles').select('*').eq('family_id', familyId),
    supabase.from('tasks').select('*').eq('family_id', familyId).limit(100),
    supabase.from('rewards').select('*').eq('family_id', familyId).limit(100),
  ]);

  const family = familyResult.data?.[0] ?? null;
  const profiles = profileResult.data ?? [];
  const tasks = taskResult.data ?? [];
  const rewards = rewardResult.data ?? [];

  return {
    authUser,
    myProfileId: (myProfile as ProfileRecord).id,
    family,
    profiles,
    tasks,
    rewards,
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
