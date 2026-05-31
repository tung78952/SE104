'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth/store';
import type { VaiTro } from '@/types/models';

interface RoleGuardProps {
  allow: VaiTro[];
  children: React.ReactNode;
}

export function RoleGuard({ allow, children }: RoleGuardProps): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const allowed = user ? allow.includes(user.vaiTro) : null;

  useEffect(() => {
    if (allowed === false) {
      router.replace('/403');
    }
  }, [allowed, router]);

  if (!user || allowed === false) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Đang kiểm tra quyền truy cập…
      </div>
    );
  }
  return <>{children}</>;
}
