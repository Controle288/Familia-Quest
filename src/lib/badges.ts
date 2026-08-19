import type { Profile, Task, ActivityLog } from '../types';

export interface BadgeContext {
  tasks: Task[];
  activityLogs: ActivityLog[];
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string; // emoji glyph
  /** Whether the given profile has earned this badge given the live context. */
  earned: (profile: Profile, ctx: BadgeContext) => boolean;
}

const completedCount = (profile: Profile, ctx: BadgeContext) =>
  ctx.tasks.filter((t) => t.assigned_to === profile.id && t.status === 'completed').length;

const redeemedCount = (profile: Profile, ctx: BadgeContext) =>
  ctx.activityLogs.filter((l) => l.profile_id === profile.id && l.type === 'reward_redeemed').length;

export const BADGES: Badge[] = [
  {
    id: 'first-flame',
    label: 'Primeira Chama',
    description: 'Iniciou sua ofensiva diária.',
    icon: '🔥',
    earned: (p) => p.streak_days >= 1,
  },
  {
    id: 'steel-week',
    label: 'Semana de Aço',
    description: 'Manteve a ofensiva por 7 dias.',
    icon: '📅',
    earned: (p) => p.streak_days >= 7,
  },
  {
    id: 'unstoppable',
    label: 'Imparável',
    description: 'Ofensiva de 30 dias seguidos!',
    icon: '⚡',
    earned: (p) => p.streak_days >= 30,
  },
  {
    id: 'veteran',
    label: 'Veterano',
    description: 'Alcançou o nível 5.',
    icon: '🏆',
    earned: (p) => p.level >= 5,
  },
  {
    id: 'legend',
    label: 'Lendário',
    description: 'Alcançou o nível 10.',
    icon: '🌟',
    earned: (p) => p.level >= 10,
  },
  {
    id: 'first-quest',
    label: 'Primeira Missão',
    description: 'Concluiu a primeira tarefa.',
    icon: '🥇',
    earned: (p, ctx) => completedCount(p, ctx) >= 1,
  },
  {
    id: 'warrior',
    label: 'Guerreiro',
    description: 'Concluiu 10 tarefas.',
    icon: '⚔️',
    earned: (p, ctx) => completedCount(p, ctx) >= 10,
  },
  {
    id: 'saver',
    label: 'Poupador',
    description: 'Acumulou R$ 50,00.',
    icon: '💎',
    earned: (p) => p.balance >= 50,
  },
  {
    id: 'treasurer',
    label: 'Tesoureiro',
    description: 'Acumulou R$ 200,00.',
    icon: '🏦',
    earned: (p) => p.balance >= 200,
  },
  {
    id: 'organizer',
    label: 'Organizador',
    description: 'Criou missões para a família.',
    icon: '🤝',
    earned: (p, ctx) => p.role === 'parent' && ctx.tasks.some((t) => t.created_by === p.id),
  },
  {
    id: 'shopper',
    label: 'Consumidor',
    description: 'Resgatou uma recompensa na loja.',
    icon: '🛍️',
    earned: (p, ctx) => redeemedCount(p, ctx) >= 1,
  },
];

/** Return only the badges earned by the profile in the given context. */
export function getEarnedBadges(profile: Profile, ctx: BadgeContext): Badge[] {
  return BADGES.filter((b) => b.earned(profile, ctx));
}

/**
 * For a badge definition, count how many profiles in the family earned it.
 * Used by the collective "Family Achievements" wall.
 */
export function familyEarnedCount(badge: Badge, profiles: Profile[], ctx: BadgeContext): number {
  return profiles.filter((p) => badge.earned(p, ctx)).length;
}
