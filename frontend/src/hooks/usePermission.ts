'use client';

import { useAuthStore } from '@/lib/auth/store';
import type { VaiTro } from '@/types/models';

export type ResourceName =
  | 'users'
  | 'subjects'
  | 'classes'
  | 'students'
  | 'difficulties'
  | 'regulations'
  | 'questions'
  | 'exams'
  | 'grades';

interface PermissionMatrix {
  canList: VaiTro[];
  canCreate: VaiTro[];
  canEdit: VaiTro[];
  canDelete: VaiTro[];
}

const PERMISSIONS: Record<ResourceName, PermissionMatrix> = {
  users: {
    canList: ['admin'],
    canCreate: ['admin'],
    canEdit: ['admin'],
    canDelete: ['admin'],
  },
  subjects: {
    canList: ['admin', 'giaovien'],
    canCreate: ['admin'],
    canEdit: ['admin'],
    canDelete: ['admin'],
  },
  classes: {
    canList: ['admin', 'giaovien'],
    canCreate: ['admin'],
    canEdit: ['admin'],
    canDelete: ['admin'],
  },
  students: {
    canList: ['admin', 'giaovien'],
    canCreate: ['admin'],
    canEdit: ['admin'],
    canDelete: ['admin'],
  },
  difficulties: {
    canList: ['admin', 'giaovien'],
    canCreate: ['admin'],
    canEdit: ['admin'],
    canDelete: ['admin'],
  },
  regulations: {
    canList: ['admin', 'giaovien'],
    canCreate: ['admin'],
    canEdit: ['admin'],
    canDelete: ['admin'],
  },
  questions: {
    canList: ['admin', 'giaovien'],
    canCreate: ['giaovien'],
    canEdit: ['giaovien'],
    canDelete: ['giaovien'],
  },
  exams: {
    canList: ['admin', 'giaovien'],
    canCreate: ['giaovien'],
    canEdit: ['giaovien'],
    canDelete: ['giaovien'],
  },
  grades: {
    canList: ['admin', 'giaovien'],
    canCreate: ['giaovien'],
    canEdit: ['giaovien'],
    canDelete: [],
  },
};

export interface Permission {
  canList: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function getPermission(resource: ResourceName, role: VaiTro | null): Permission {
  const matrix = PERMISSIONS[resource];
  return {
    canList: role !== null && matrix.canList.includes(role),
    canCreate: role !== null && matrix.canCreate.includes(role),
    canEdit: role !== null && matrix.canEdit.includes(role),
    canDelete: role !== null && matrix.canDelete.includes(role),
  };
}

export function usePermission(resource: ResourceName): Permission {
  const role = useAuthStore((s) => s.user?.vaiTro ?? null);
  return getPermission(resource, role);
}
