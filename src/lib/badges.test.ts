import { describe, it, expect } from 'vitest';
import { BADGES, getEarnedBadges, familyEarnedCount } from './badges';
import type { Profile, Task, ActivityLog } from '../types';

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: 'p1',
  family_id: 'fam',
  name: 'Test',
  full_name: 'Test User',
  role: 'child',
  avatar_url: '',
  level: 1,
  xp: 0,
  xp_base: 0,
  xp_to_next_level: 500,
  balance: 0,
  streak_days: 0,
  created_at: '',
  ...overrides,
});

const emptyCtx = { tasks: [], activityLogs: [] };

describe('getEarnedBadges', () => {
  it('awards first-flame for any streak', () => {
    const p = makeProfile({ streak_days: 3 });
    expect(getEarnedBadges(p, emptyCtx).some((b) => b.id === 'first-flame')).toBe(true);
  });

  it('awards steel-week at 7 days and not before', () => {
    const low = makeProfile({ streak_days: 6 });
    const high = makeProfile({ streak_days: 7 });
    expect(getEarnedBadges(low, emptyCtx).some((b) => b.id === 'steel-week')).toBe(false);
    expect(getEarnedBadges(high, emptyCtx).some((b) => b.id === 'steel-week')).toBe(true);
  });

  it('awards veteran at level 5 and legend at level 10', () => {
    const v = makeProfile({ level: 5 });
    const l = makeProfile({ level: 10 });
    expect(getEarnedBadges(v, emptyCtx).some((b) => b.id === 'veteran')).toBe(true);
    expect(getEarnedBadges(l, emptyCtx).some((b) => b.id === 'legend')).toBe(true);
  });

  it('awards first-quest when a completed task is assigned', () => {
    const tasks: Task[] = [
      { id: 't1', family_id: 'fam', title: 'x', category: 'cleaning', icon_name: 'brush', assigned_to: 'p1', points: 10, reward_value: 10, reward_type: 'xp_only', status: 'completed', created_at: '' } as Task,
    ];
    const p = makeProfile();
    expect(getEarnedBadges(p, { tasks, activityLogs: [] }).some((b) => b.id === 'first-quest')).toBe(true);
  });

  it('awards saver at R$ 50', () => {
    const p = makeProfile({ balance: 50 });
    expect(getEarnedBadges(p, emptyCtx).some((b) => b.id === 'saver')).toBe(true);
  });

  it('awards organizer only to parents who created tasks', () => {
    const parentTasks: Task[] = [
      { id: 't2', family_id: 'fam', title: 'y', category: 'cleaning', icon_name: 'brush', assigned_to: 'p2', created_by: 'parent1', points: 10, reward_value: 10, reward_type: 'xp_only', status: 'pending', created_at: '' } as Task,
    ];
    const organizerParent = makeProfile({ id: 'parent1', role: 'parent' });
    expect(getEarnedBadges(organizerParent, { tasks: parentTasks, activityLogs: [] }).some((b) => b.id === 'organizer')).toBe(true);
  });

  it('awards shopper when a reward was redeemed', () => {
    const logs: ActivityLog[] = [
      { id: 'l1', family_id: 'fam', profile_id: 'p1', profile_name: 'Test', type: 'reward_redeemed', title: 'Toy', points_change: -100, created_at: '' },
    ];
    const p = makeProfile();
    expect(getEarnedBadges(p, { tasks: [], activityLogs: logs }).some((b) => b.id === 'shopper')).toBe(true);
  });
});

describe('familyEarnedCount', () => {
  it('counts how many profiles earned a badge', () => {
    const profiles = [makeProfile({ level: 5 }), makeProfile({ level: 1 })];
    const badge = BADGES.find((b) => b.id === 'veteran')!;
    expect(familyEarnedCount(badge, profiles, emptyCtx)).toBe(1);
  });
});
