'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ForgotPasswordLink from '@/app/components/ForgotPasswordLink';

function AdminPortalLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [error, setError] = useState('');

  const nextParam = searchParams.get('next');
  const nextPath =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : '/admin';

  // Mint httpOnly cookie from legacy localStorage session when possible
  useEffect(() => {
    let cancelled = false;

    const syncExistingSession = async () => {
      try {
        const cookieCheck = await fetch('/api/auth/admin-session', { method: 'GET' });
        if (cookieCheck.ok) {
          if (!cancelled) router.replace(nextPath);
          return;
        }

        const raw = localStorage.getItem('adminSession');
        if (!raw) {
          if (!cancelled) setIsSyncing(false);
          return;
        }

        const parsed = JSON.parse(raw);
        if (!parsed?.isAdmin || !parsed?.id) {
          localStorage.removeItem('adminSession');
          if (!cancelled) setIsSyncing(false);
          return;
        }

        const res = await fetch('/api/auth/admin-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminSession: raw })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('adminSession', JSON.stringify(data.admin));
          if (!cancelled) router.replace(nextPath);
          return;
        }

        localStorage.removeItem('adminSession');
      } catch {
        // show login form
      }
      if (!cancelled) setIsSyncing(false);
    };

    syncExistingSession();
    return () => {
      cancelled = true;
    };
  }, [router, nextPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (response.ok && result.success && result.judge?.isAdmin) {
        localStorage.setItem('adminSession', JSON.stringify(result.judge));
        router.push(nextPath);
      } else if (result.success && result.judge && !result.judge.isAdmin) {
        setError('Admin access required. Judges should use the Judge Portal.');
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
        <p className="text-emerald-100 text-sm">Checking admin session…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-48 h-48 sm:w-64 sm:h-64 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl mb-4 sm:mb-6 shadow-2xl shadow-emerald-500/20">
              <span className="text-white text-2xl">👑</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Admin Control</h1>
            <p className="text-emerald-300 text-sm sm:text-base px-4">System Administration Portal</p>
            {nextParam && (
              <p className="text-amber-200 text-xs mt-2 px-4">
                Admin login required to access internal tools
              </p>
            )}
          </div>

          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/20 border border-red-400/40 text-red-100 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-emerald-100 mb-1.5">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-100 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-200 text-xs"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <ForgotPasswordLink userType="admin" />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-60 transition-all"
              >
                {isLoading ? 'Signing in…' : 'Sign in as Admin'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex items-center justify-center">
          <p className="text-emerald-100 text-sm">Loading…</p>
        </div>
      }
    >
      <AdminPortalLogin />
    </Suspense>
  );
}
