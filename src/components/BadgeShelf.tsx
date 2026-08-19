import React from 'react';
import { Lock } from 'lucide-react';
import { BADGES, getEarnedBadges, type BadgeContext } from '../lib/badges';
import type { Profile } from '../types';

interface BadgeShelfProps {
  profile: Profile;
  ctx: BadgeContext;
  /** When true, shows locked badges greyed out. Defaults to true. */
  showLocked?: boolean;
  className?: string;
}

/**
 * Compact row of the badges a single profile has earned. Locked badges are
 * shown faded (unless `showLocked` is false) so kids can see what to aim for.
 */
export const BadgeShelf: React.FC<BadgeShelfProps> = ({
  profile,
  ctx,
  showLocked = true,
  className = '',
}) => {
  const earned = getEarnedBadges(profile, ctx);
  const earnedIds = new Set(earned.map((b) => b.id));

  const badges = showLocked ? BADGES : earned;

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((badge) => {
        const isEarned = earnedIds.has(badge.id);
        return (
          <span
            key={badge.id}
            title={`${badge.label} — ${badge.description}`}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-base shadow-xs border transition-transform hover:scale-110 ${
              isEarned
                ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-300'
                : 'bg-slate-100 border-slate-200 grayscale opacity-50'
            }`}
          >
            {isEarned ? badge.icon : <Lock className="w-3.5 h-3.5 text-slate-400" />}
          </span>
        );
      })}
    </div>
  );
};
