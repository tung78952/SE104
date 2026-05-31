import { describe, expect, it } from 'vitest';
import { getPermission, type ResourceName } from './usePermission';

describe('usePermission / getPermission', () => {
  const resources: ResourceName[] = [
    'users',
    'subjects',
    'classes',
    'students',
    'difficulties',
    'regulations',
    'questions',
    'exams',
    'grades',
  ];

  it('returns no permissions when role is null', () => {
    for (const r of resources) {
      const p = getPermission(r, null);
      expect(p).toEqual({ canList: false, canCreate: false, canEdit: false, canDelete: false });
    }
  });

  it('admin has full CRUD for catalog resources (except regulations.canDelete)', () => {
    expect(getPermission('subjects', 'admin')).toEqual({
      canList: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    });
    expect(getPermission('users', 'admin').canCreate).toBe(true);
    expect(getPermission('regulations', 'admin').canDelete).toBe(false);
    expect(getPermission('regulations', 'admin').canEdit).toBe(true);
  });

  it('giaovien is read-only for catalog resources in phase 3', () => {
    for (const r of ['subjects', 'classes', 'students', 'difficulties', 'regulations'] as const) {
      const p = getPermission(r, 'giaovien');
      expect(p.canList).toBe(true);
      expect(p.canCreate).toBe(false);
      expect(p.canEdit).toBe(false);
      expect(p.canDelete).toBe(false);
    }
  });

  it('giaovien cannot list users at all', () => {
    expect(getPermission('users', 'giaovien').canList).toBe(false);
  });

  it('grades.canDelete is false for every role (KHÔNG có xoá theo §1.5.2)', () => {
    expect(getPermission('grades', 'admin').canDelete).toBe(false);
    expect(getPermission('grades', 'giaovien').canDelete).toBe(false);
  });
});
