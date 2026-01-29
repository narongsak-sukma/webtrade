'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isRedirecting = useRef(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (loading || isRedirecting.current) {
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store in localStorage (cookie is already set by API)
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Mark as redirecting to prevent double-submit
      isRedirecting.current = true;

      // Use multiple redirect methods for maximum compatibility
      console.log('Redirecting to dashboard...');

      // Method 1: Try Next.js router
      setTimeout(() => {
        console.log('Attempting router.push...');
        router.push('/dashboard');

        // Method 2: Fallback to window.location if router doesn't work within 500ms
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname === '/login') {
            console.log('Router push failed, using window.location...');
            window.location.href = '/dashboard';
          }
        }, 500);
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
      isRedirecting.current = false;
    }
  };

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Sign in to your account to continue
        </p>
      </div>

      {error && (
        <Alert variant="error" dismissible onClose={() => setError('')} className="mb-4">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          name="email"
          label="Email Address"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          required
        />

        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Password"
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[2.3rem] text-neutral-500"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              name="remember"
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600 dark:text-neutral-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
