import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              TradingWeb
            </span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-neutral-950 rounded-xl shadow-card border border-neutral-200 dark:border-neutral-800 p-8">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center mt-6 text-sm text-neutral-600 dark:text-neutral-400">
          © 2025 TradingWeb. All rights reserved.
        </p>
      </div>
    </div>
  );
}
