'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Signal, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
    },
    {
      label: 'Screening',
      href: '/screening',
      icon: BarChart3,
    },
    {
      label: 'Signals',
      href: '/signals',
      icon: Signal,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white">TradingWeb</h1>
              <p className="text-xs text-text-secondary">AI-Powered Trading</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-lg'
                      : 'text-text-secondary hover:text-white hover:bg-bg-hover'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side - Theme toggle or other controls */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-text-secondary">S&P 500</p>
              <p className="text-sm font-semibold text-white">14 Filters</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
