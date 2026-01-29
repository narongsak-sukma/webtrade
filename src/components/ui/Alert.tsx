'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  autoDismiss?: boolean;
  autoDismissDuration?: number;
  onClose?: () => void;
  className?: string;
}

const variantStyles = {
  success: 'bg-success-50 border-success-200 text-success-800 dark:bg-success-950 dark:border-success-900 dark:text-success-400',
  warning: 'bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-950 dark:border-warning-900 dark:text-warning-400',
  error: 'bg-error-50 border-error-200 text-error-800 dark:bg-error-950 dark:border-error-900 dark:text-error-400',
  info: 'bg-info-50 border-info-200 text-info-800 dark:bg-info-950 dark:border-info-900 dark:text-info-400',
};

const icons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

export function Alert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  autoDismiss = false,
  autoDismissDuration = 5000,
  onClose,
  className,
}: AlertProps) {
  const [visible, setVisible] = useState(true);
  const Icon = icons[variant];

  const handleClose = useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    if (autoDismiss && visible) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoDismissDuration);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, autoDismissDuration, visible, handleClose]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'relative rounded-lg border p-4 animate-fade-in',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
