'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { signout } from '@/lib/api/auth';
import { getMe } from '@/lib/api/users';
import { useAuthStore } from '@/lib/auth/store';

interface AppShellProps {
  title?: string;
  children: React.ReactNode;
}

export function AppShell({ title = '', children }: AppShellProps): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();
  const inflightMeRef = useRef(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (user || inflightMeRef.current) {
      return;
    }
    inflightMeRef.current = true;
    getMe()
      .then((u) => setUser(u))
      .catch(() => {
        clearAuth();
        router.replace('/login');
      })
      .finally(() => {
        inflightMeRef.current = false;
      });
  }, [accessToken, user, setUser, clearAuth, router]);

  // Close mobile drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') setMobileOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handleLogout = async (): Promise<void> => {
    try {
      await signout();
    } catch {
      // ignore — clear local state regardless
    }
    clearAuth();
    router.replace('/login');
  };

  if (!accessToken || !user) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Đang tải…
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-[700px] overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar user={user} onLogout={handleLogout} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            data-print-hide
          />
          <div
            className="fixed inset-y-0 left-0 z-50 flex md:hidden"
            data-print-hide
            role="dialog"
            aria-label="Menu điều hướng"
          >
            <Sidebar
              user={user}
              onLogout={() => {
                setMobileOpen(false);
                void handleLogout();
              }}
            />
          </div>
        </>
      )}

      <main className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} onMenuClick={() => setMobileOpen((v) => !v)} />
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </main>
    </div>
  );
}
