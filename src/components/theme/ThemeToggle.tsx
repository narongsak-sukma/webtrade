'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes: Array<{ value: 'light' | 'dark' | 'system'; icon: React.ElementType; label: string }> = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
  ];

  return (
    <div className="relative group">
      {/* Toggle Button */}
      <button
        className={cn(
          'p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
          'text-neutral-600 dark:text-neutral-400'
        )}
        aria-label="Toggle theme"
      >
        {theme === 'light' && <Sun className="h-5 w-5" />}
        {theme === 'dark' && <Moon className="h-5 w-5" />}
        {theme === 'system' && <Monitor className="h-5 w-5" />}
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-neutral-950 rounded-lg shadow-dropdown border border-neutral-200 dark:border-neutral-800 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors',
              theme === value
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-400'
                : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
