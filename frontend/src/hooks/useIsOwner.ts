'use client';

import { useAuthStore } from '@/lib/auth/store';
import type { VaiTro } from '@/types/models';

export interface OwnerStatus {
  isOwner: boolean;
  isAdmin: boolean;
  role: VaiTro | null;
  currentMaGV: string | null;
}

export function useIsOwner(recordMaGV: string | null | undefined): OwnerStatus {
  const role = useAuthStore((s) => s.user?.vaiTro ?? null);
  const currentMaGV = useAuthStore((s) => s.user?.maGV ?? null);
  const isAdmin = role === 'admin';
  const isOwner =
    role === 'giaovien' &&
    currentMaGV !== null &&
    typeof recordMaGV === 'string' &&
    recordMaGV === currentMaGV;
  return { isOwner, isAdmin, role, currentMaGV };
}
