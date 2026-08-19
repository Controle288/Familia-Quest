import type { Profile, Reward } from '../types';

export const LEVEL_STEP = 500;

export interface ApplyLevelUpInput {
  xp: number;
  level: number;
  xp_base: number;
  xp_to_next_level: number;
  balance: number;
}

export interface ApplyLevelUpResult {
  xp: number;
  level: number;
  xp_base: number;
  xp_to_next_level: number;
  balance: number;
  leveledUp: boolean;
  newLevels: number[];
}

/**
 * Pure level-up computation.
 * Every LEVEL_STEP XP above the current threshold advances one level and the
 * base is pushed forward so progress bars never recede.
 */
export function applyLevelUp(
  profile: ApplyLevelUpInput,
  xpGained: number,
  moneyGained = 0
): ApplyLevelUpResult {
  let xp = profile.xp + xpGained;
  let level = profile.level;
  let xpBase = profile.xp_base;
  let threshold = profile.xp_to_next_level;
  const newLevels: number[] = [];

  while (xp >= threshold) {
    xpBase = threshold;
    level += 1;
    threshold += LEVEL_STEP;
    newLevels.push(level);
  }

  return {
    xp,
    level,
    xp_base: xpBase,
    xp_to_next_level: threshold,
    balance: profile.balance + moneyGained,
    leveledUp: newLevels.length > 0,
    newLevels,
  };
}

export interface RedeemCheck {
  ok: boolean;
  reason?: string;
}

/** Validate whether a profile can redeem a reward (XP and/or R$). */
export function canRedeem(
  profile: Pick<Profile, 'xp' | 'balance'>,
  reward: Pick<Reward, 'points_cost' | 'money_cost'>
): RedeemCheck {
  const moneyNeeded = reward.money_cost || 0;

  if (profile.xp < reward.points_cost) {
    return { ok: false, reason: `Você precisa de ${reward.points_cost} XP para este prêmio.` };
  }
  if (moneyNeeded > 0 && profile.balance < moneyNeeded) {
    return { ok: false, reason: `Você precisa de R$ ${moneyNeeded.toFixed(2)} para este prêmio.` };
  }
  return { ok: true };
}

/** Compute the profile fields after redeeming a reward. */
export function applyRedeem(
  profile: Pick<Profile, 'xp' | 'balance'>,
  reward: Pick<Reward, 'points_cost' | 'money_cost'>
): { xp: number; balance: number } {
  const moneyNeeded = reward.money_cost || 0;
  return {
    xp: profile.xp - reward.points_cost,
    balance: profile.balance - moneyNeeded,
  };
}
