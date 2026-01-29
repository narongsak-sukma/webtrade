'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function MainLayout({ children, showSidebar = true }: MainLayoutProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Load sidebar state
    const collapsed = localStorage.getItem('sidebar-collapsed');
    if (collapsed) {
      setSidebarCollapsed(collapsed === 'true');
    }

    // Listen for mobile sidebar toggle
    const handleMobileToggle = () => {
      // Mobile sidebar is handled by the Sidebar component
    };
    document.addEventListener('toggle-mobile-sidebar', handleMobileToggle);

    return () => {
      document.removeEventListener('toggle-mobile-sidebar', handleMobileToggle);
    };
  }, [router]);

  // Listen for sidebar collapse changes
  useEffect(() => {
    const handleStorageChange = () => {
      const collapsed = localStorage.getItem('sidebar-collapsed');
      if (collapsed) {
        setSidebarCollapsed(collapsed === 'true');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {showSidebar && <Sidebar />}

      <div
        className={cn(
          'transition-all duration-300',
          showSidebar ? 'lg:ml-64' : '',
          sidebarCollapsed && showSidebar && 'lg:ml-20'
        )}
      >
        <Header />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
