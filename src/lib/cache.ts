import type { ActivityLog, Family, Profile, Redemption, Reward, Task } from '../types';

const CACHE_KEY = 'fqc_state_v1';

export interface CachedFamilyState {
  family: Family | null;
  profiles: Profile[];
  tasks: Task[];
  rewards: Reward[];
  redemptions: Redemption[];
  activityLogs: ActivityLog[];
  myProfileId?: string;
  savedAt: number;
}

export const loadCache = (): CachedFamilyState | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedFamilyState;
    if (!parsed || !parsed.family || !Array.isArray(parsed.profiles)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveCache = (state: Omit<CachedFamilyState, 'savedAt'>): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {
    /* ignore quota / privacy-mode errors */
  }
};

export const clearCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
};
