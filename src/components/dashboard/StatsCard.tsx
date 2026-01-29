import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatsCard({ title, value, trend, trendValue, icon, className }: StatsCardProps) {
  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const trendColors = {
    up: 'text-success-600 bg-success-50 dark:bg-success-950 dark:text-success-400',
    down: 'text-error-600 bg-error-50 dark:bg-error-950 dark:text-error-400',
    neutral: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-400',
  };

  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <div className={cn('bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 p-6', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
          {icon}
        </div>
        {trend && trendValue && (
          <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', trendColors[trend])}>
            {TrendIcon && <TrendIcon className="h-3 w-3" />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  );
}
