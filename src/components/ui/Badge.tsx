import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const variantStyles = {
  success: 'bg-success-100 text-success-800 border-success-200 dark:bg-success-950 dark:text-success-400 dark:border-success-900',
  warning: 'bg-warning-100 text-warning-800 border-warning-200 dark:bg-warning-950 dark:text-warning-400 dark:border-warning-900',
  error: 'bg-error-100 text-error-800 border-error-200 dark:bg-error-950 dark:text-error-400 dark:border-error-900',
  info: 'bg-info-100 text-info-800 border-info-200 dark:bg-info-950 dark:text-info-400 dark:border-info-900',
  neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'neutral', size = 'md', dot = false, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border font-medium',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              variant === 'success' && 'bg-success-500 dark:bg-success-400',
              variant === 'warning' && 'bg-warning-500 dark:bg-warning-400',
              variant === 'error' && 'bg-error-500 dark:bg-error-400',
              variant === 'info' && 'bg-info-500 dark:bg-info-400',
              variant === 'neutral' && 'bg-neutral-500 dark:bg-neutral-400'
            )}
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
