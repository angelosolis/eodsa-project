'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export type AdminSessionUser = {
  id: string;
  email?: string;
  name?: string;
  isAdmin: true;
};

/**
 * Client-side Admin cookie check (middleware is the real gate).
 * Use on Admin-only pages that previously relied only on localStorage.
 */
export function useRequireAdminSession() {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState<AdminSessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/admin-session', {
          method: 'GET',
          cache: 'no-store'
        });
        if (!res.ok) {
          const next = encodeURIComponent(pathname || '/admin');
          router.replace(`/portal/admin?next=${next}`);
          if (!cancelled) setChecking(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setAdmin(data.admin ?? null);
          setAuthorized(true);
          setChecking(false);
        }
      } catch {
        const next = encodeURIComponent(pathname || '/admin');
        router.replace(`/portal/admin?next=${next}`);
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  return { authorized, checking, admin };
}

export function AdminAccessSplash({ message = 'Verifying admin access…' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <p className="text-gray-300 text-sm">{message}</p>
    </div>
  );
}
