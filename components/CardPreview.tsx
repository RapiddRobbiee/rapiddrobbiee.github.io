import React from 'react';
import { motion } from 'framer-motion';
import { PlannedCard } from '../types';

const RARITY_LABELS = ['N', 'R', 'SR', 'SSR', 'UR', 'LR'];
const RARITY_COLORS = ['#9ca3af', '#6b7280', '#eab308', '#a855f7', '#f59e0b', '#ef4444'];
const ELEMENT_LABELS = ['AGL', 'TEQ', 'INT', 'STR', 'PHY'];
const ELEMENT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'];
const ELEMENT_BG = ['bg-blue-600', 'bg-emerald-500', 'bg-violet-500', 'bg-red-500', 'bg-amber-500'];

interface CardPreviewProps {
  card: PlannedCard;
  compact?: boolean;
  onClick?: () => void;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ card, compact = false, onClick }) => {
  const rarityIdx = Math.min(card.rarity, 5);
  const elemIdx = Math.min(card.element, 4);
  const stats = [
    { label: 'HP', base: card.hpBase, max: card.hpMax },
    { label: 'ATK', base: card.atkBase, max: card.atkMax },
    { label: 'DEF', base: card.defBase, max: card.defMax },
  ].filter((s) => s.base != null || s.max != null);

  const hasStats = stats.length > 0;

  const content = (
    <motion.div
      whileHover={!compact && onClick ? { scale: 1.02, y: -2 } : undefined}
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br transition-shadow cursor-default
        ${compact ? 'p-3' : 'p-5'}
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:border-[var(--clr-primary)]/50' : ''}
      `}
      style={{
        borderColor: `color-mix(in srgb, ${ELEMENT_COLORS[elemIdx]} 30%, var(--clr-border))`,
        background: `linear-gradient(135deg, var(--clr-bg-card), color-mix(in srgb, ${ELEMENT_COLORS[elemIdx]} 8%, var(--clr-bg-card)))`,
      }}
      onClick={onClick}
    >
      {/* Rarity badge */}
      <div className="absolute top-2 right-2">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-md"
          style={{ backgroundColor: RARITY_COLORS[rarityIdx] }}
        >
          {RARITY_LABELS[rarityIdx]}
        </span>
      </div>

      {/* Element bar */}
      <div className={`absolute top-0 left-0 h-1 ${ELEMENT_BG[elemIdx]}`} style={{ width: '100%' }} />

      {/* Header */}
      <div className={compact ? 'mb-1' : 'mb-3'}>
        <h4
          className={`font-bold text-[var(--clr-text)] truncate ${compact ? 'text-sm' : 'text-lg'}`}
          style={{ color: ELEMENT_COLORS[elemIdx] }}
        >
          {card.name || 'Unnamed Card'}
        </h4>
        {card.title && (
          <p className={`text-[var(--clr-text-muted)] truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {card.title}
          </p>
        )}
      </div>

      {/* Type badges */}
      <div className={`flex flex-wrap gap-1 mb-2 ${compact ? 'mb-1' : 'mb-3'}`}>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--clr-text-muted)]">
          {ELEMENT_LABELS[elemIdx]}
        </span>
        {card.cost != null && (
          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--clr-text-muted)]">
            Cost {card.cost}
          </span>
        )}
      </div>

      {/* Stats bars */}
      {hasStats && !compact && (
        <div className="space-y-1.5 mb-3">
          {stats.map((stat) => {
            const pct = stat.max ? Math.min((stat.base || 0) / stat.max * 100, 100) : 0;
            return (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="w-8 text-[11px] font-bold text-[var(--clr-text-muted)]">{stat.label}</span>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: ELEMENT_COLORS[elemIdx],
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono text-[var(--clr-text-muted)] w-14 text-right">
                  {stat.base ?? '?'}/{stat.max ?? '?'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {compact && hasStats && (
        <p className="text-[10px] text-[var(--clr-text-muted)] truncate">
          HP {card.hpBase ?? '?'}/{card.hpMax ?? '?'} · ATK {card.atkBase ?? '?'}/{card.atkMax ?? '?'} · DEF {card.defBase ?? '?'}/{card.defMax ?? '?'}
        </p>
      )}

      {/* Leader skill preview */}
      {card.leaderSkillText && (
        <div className={`rounded-md bg-white/5 border border-white/5 px-2 py-1 ${compact ? 'mt-1' : 'mt-2'}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--clr-primary)] mb-0.5">
            Leader Skill
          </p>
          <p className={`text-[var(--clr-text-muted)] leading-snug line-clamp-2 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {card.leaderSkillText}
          </p>
        </div>
      )}

      {/* Tags */}
      {(card.categoryIds && card.categoryIds.length > 0) && (
        <div className={`flex flex-wrap gap-1 ${compact ? 'mt-1' : 'mt-2'}`}>
          {card.categoryIds.slice(0, compact ? 2 : 4).map((id, i) => (
            <span
              key={i}
              className="rounded-full bg-[var(--clr-primary)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--clr-text-accent)]"
            >
              {id}
            </span>
          ))}
          {card.categoryIds.length > (compact ? 2 : 4) && (
            <span className="text-[10px] text-[var(--clr-text-muted)] self-center">
              +{card.categoryIds.length - (compact ? 2 : 4)}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );

  return content;
};
