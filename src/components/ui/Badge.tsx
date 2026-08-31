import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  label: string;
  value?: string | number;
  percentage?: number;
  className?: string;
}

export const TraitBadge: React.FC<BadgeProps> = ({ label, value, percentage, className }) => {
  // Determine color scheme based on rarity percentage
  let rarityStyle = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  let dotColor = 'bg-slate-400';

  if (percentage !== undefined) {
    if (percentage < 1.0) {
      // Legendary / Ultra Rare (< 1%)
      rarityStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_10px_-2px_rgba(245,158,11,0.3)]';
      dotColor = 'bg-amber-400 animate-pulse';
    } else if (percentage < 5.0) {
      // Rare (1% - 5%)
      rarityStyle = 'bg-purple-500/15 text-purple-300 border-purple-500/40 shadow-[0_0_10px_-2px_rgba(168,85,247,0.25)]';
      dotColor = 'bg-purple-400';
    } else if (percentage < 15.0) {
      // Uncommon (5% - 15%)
      rarityStyle = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      dotColor = 'bg-cyan-400';
    }
  }

  return (
    <div
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border backdrop-blur-md transition-all',
        rarityStyle,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full', dotColor)} />
      <span className="text-slate-400 font-sans text-[11px]">{label}:</span>
      <span className="font-semibold text-slate-100">{value}</span>
      {percentage !== undefined && (
        <span className="text-[10px] opacity-75 font-normal">({percentage.toFixed(2)}%)</span>
      )}
    </div>
  );
};
