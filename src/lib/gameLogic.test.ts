import { describe, it, expect } from 'vitest';
import { applyLevelUp, canRedeem, applyRedeem, LEVEL_STEP } from './gameLogic';
import type { Profile, Reward } from '../types';

const baseProfile: Pick<Profile, 'xp' | 'level' | 'xp_base' | 'xp_to_next_level' | 'balance'> = {
  xp: 450,
  level: 1,
  xp_base: 0,
  xp_to_next_level: 500,
  balance: 0,
};

describe('applyLevelUp', () => {
  it('does not level up below threshold', () => {
    const r = applyLevelUp(baseProfile, 20);
    expect(r.leveledUp).toBe(false);
    expect(r.level).toBe(1);
    expect(r.xp).toBe(470);
    expect(r.xp_base).toBe(0);
    expect(r.xp_to_next_level).toBe(500);
  });

  it('levels up exactly at threshold', () => {
    const r = applyLevelUp(baseProfile, 50);
    expect(r.leveledUp).toBe(true);
    expect(r.level).toBe(2);
    expect(r.xp).toBe(500);
    expect(r.xp_base).toBe(500);
    expect(r.xp_to_next_level).toBe(500 + LEVEL_STEP);
  });

  it('handles multiple level-ups in one gain', () => {
    const r = applyLevelUp(baseProfile, 1100);
    // 450 + 1100 = 1550 -> crosses 500, 1000 and 1500
    expect(r.level).toBe(4);
    expect(r.newLevels).toEqual([2, 3, 4]);
    expect(r.xp_base).toBe(1500);
    expect(r.xp_to_next_level).toBe(2000);
  });

  it('never lets the xp bar recede (xp_base carried forward)', () => {
    const started: typeof baseProfile = { ...baseProfile, xp: 490, xp_to_next_level: 500 };
    const r = applyLevelUp(started, 600);
    // xp 490 + 600 = 1090 -> level 2 (500), then 1090 >= 1000 -> level 3 (1000)
    expect(r.xp_base).toBe(1000);
    expect(r.xp).toBe(1090);
    expect(r.xp).toBeGreaterThanOrEqual(r.xp_base);
  });

  it('adds money to balance', () => {
    const r = applyLevelUp(baseProfile, 50, 25);
    expect(r.balance).toBe(25);
  });
});

describe('canRedeem', () => {
  const profile: Pick<Profile, 'xp' | 'balance'> = { xp: 300, balance: 10 };
  const xpOnly: Pick<Reward, 'points_cost' | 'money_cost'> = { points_cost: 200, money_cost: 0 };
  const hybrid: Pick<Reward, 'points_cost' | 'money_cost'> = { points_cost: 200, money_cost: 5 };

  it('allows when XP and R$ are sufficient', () => {
    expect(canRedeem({ xp: 300, balance: 10 }, hybrid).ok).toBe(true);
  });

  it('blocks when XP insufficient', () => {
    const r = canRedeem({ xp: 100, balance: 10 }, xpOnly);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/XP/);
  });

  it('blocks when R$ insufficient', () => {
    const r = canRedeem({ xp: 300, balance: 2 }, hybrid);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/R\$/);
  });
});

describe('applyRedeem', () => {
  it('deducts XP and R$', () => {
    const r = applyRedeem({ xp: 500, balance: 40 }, { points_cost: 200, money_cost: 15 });
    expect(r.xp).toBe(300);
    expect(r.balance).toBe(25);
  });
});
