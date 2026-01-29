'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <header className="h-16 bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={() => document.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav className="hidden sm:flex items-center gap-2 text-sm">
          {breadcrumbs.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <span className="text-neutral-400">/</span>
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />

        <button className="relative p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <Bell className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-error-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Avatar size="sm" initials="U" />
            <ChevronDown className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          </button>

          {userDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-950 rounded-lg shadow-dropdown border border-neutral-200 dark:border-neutral-800 py-2 z-20">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <hr className="my-2 border-neutral-200 dark:border-neutral-800" />
                <button
                  onClick={() => {
                    localStorage.removeItem('auth_token');
                    router.push('/login');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', href: '/' }];

  segments.forEach((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const label = formatBreadcrumbLabel(segment);
    breadcrumbs.push({
      label,
      href: index === segments.length - 1 ? undefined : href,
    });
  });

  return breadcrumbs;
}

function formatBreadcrumbLabel(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
