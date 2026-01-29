import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
}

const sizeStyles = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  busy: 'bg-error-500',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, initials, size = 'md', status, ...props }, ref) => {
    const hasImage = src && src.length > 0;

    return (
      <div ref={ref} className="relative inline-block" {...props}>
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 overflow-hidden',
            sizeStyles[size],
            className
          )}
        >
          {hasImage ? (
            <img src={src} alt={alt || 'Avatar'} className="h-full w-full object-cover" />
          ) : (
            <span>{initials || '?'}</span>
          )}
        </div>
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-neutral-900',
              size === 'xs' && 'h-1.5 w-1.5',
              size === 'xl' && 'h-3 w-3',
              statusColors[status]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
