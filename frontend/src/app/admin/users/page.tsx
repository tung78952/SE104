'use client';

import { useMemo, useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { RoleGuard } from '@/components/layout/role-guard';
import { ResourcePage, RowActions, ConfirmDeleteModal } from '@/components/common';
import type { DataTableColumn } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserForm } from '@/components/catalog/UserForm';
import { useCrudResource } from '@/hooks/useCrudResource';
import { usePermission } from '@/hooks/usePermission';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  type ListUsersParams,
} from '@/lib/api/users';
import { ROLE_LABEL } from '@/lib/constants/roles';
import type { TaiKhoan } from '@/types/models';
import type { UserCreateInput, UserUpdateInput } from '@/lib/schemas/catalog';

const ADAPTER = {
  resource: 'users',
  list: (params: ListUsersParams) => listUsers(params),
  create: (data: UserCreateInput) =>
    createUser({
      tenDangNhap: data.tenDangNhap,
      matKhau: data.matKhau,
      vaiTro: data.vaiTro,
      hoTen: data.hoTen,
      email: data.email,
      khoaBoMon: data.khoaBoMon?.trim() ? data.khoaBoMon : undefined,
    }),
  update: (id: number, data: UserUpdateInput) => updateUser(id, data),
  remove: deleteUser,
};

export default function AdminUsersPage(): React.ReactElement {
  return (
    <AppShell title="Tài khoản">
      <RoleGuard allow={['admin']}>
        <AdminUsersContent />
      </RoleGuard>
    </AppShell>
  );
}

function AdminUsersContent(): React.ReactElement {
  const perm = usePermission('users');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TaiKhoan | null>(null);
  const [deleting, setDeleting] = useState<TaiKhoan | null>(null);

  const params = useMemo<ListUsersParams>(() => ({ page, limit: 10 }), [page]);
  const { query, createMutation, updateMutation, deleteMutation } = useCrudResource(ADAPTER, {
    params,
  });

  async function toggleLock(u: TaiKhoan): Promise<void> {
    await updateMutation.mutateAsync({
      id: u.maTK,
      data: {
        vaiTro: u.vaiTro,
        trangThai: u.trangThai === 1 ? 0 : 1,
        hoTen: u.giangVien?.hoTen ?? '',
        email: u.giangVien?.email ?? '',
      },
    });
  }

  const columns: DataTableColumn<TaiKhoan>[] = [
    { key: 'maTK', header: 'Mã TK', render: (r) => <span className="font-mono">{r.maTK}</span> },
    { key: 'tenDangNhap', header: 'Tên đăng nhập', render: (r) => r.tenDangNhap },
    {
      key: 'vaiTro',
      header: 'Vai trò',
      render: (r) => (
        <Badge variant={r.vaiTro === 'admin' ? 'default' : 'secondary'}>
          {ROLE_LABEL[r.vaiTro]}
        </Badge>
      ),
    },
    { key: 'hoTen', header: 'Họ tên', render: (r) => r.giangVien?.hoTen ?? '—' },
    { key: 'email', header: 'Email', render: (r) => r.giangVien?.email ?? '—' },
    {
      key: 'trangThai',
      header: 'Trạng thái',
      render: (r) => (
        <Badge variant={r.trangThai === 1 ? 'secondary' : 'destructive'}>
          {r.trangThai === 1 ? 'Hoạt động' : 'Đã khoá'}
        </Badge>
      ),
    },
    {
      key: '__actions',
      header: '',
      className: 'w-44 text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          {perm.canEdit && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-label={r.trangThai === 1 ? 'Khoá tài khoản' : 'Mở khoá tài khoản'}
              onClick={(e) => {
                e.stopPropagation();
                void toggleLock(r);
              }}
            >
              {r.trangThai === 1 ? <Lock /> : <Unlock />}
              {r.trangThai === 1 ? 'Khoá' : 'Mở'}
            </Button>
          )}
          <RowActions
            canEdit={perm.canEdit}
            canDelete={perm.canDelete}
            onEdit={() => {
              setEditing(r);
              setFormOpen(true);
            }}
            onDelete={() => setDeleting(r)}
          />
        </div>
      ),
    },
  ];

  async function handleSubmit(data: UserCreateInput | UserUpdateInput): Promise<void> {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.maTK, data: data as UserUpdateInput });
    } else {
      await createMutation.mutateAsync(data as UserCreateInput);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.maTK);
    setDeleting(null);
  }

  return (
    <>
      <ResourcePage<TaiKhoan>
        columns={columns}
        data={query.data?.data ?? []}
        rowKey={(r) => r.maTK}
        isLoading={query.isLoading}
        page={page}
        limit={10}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        canCreate={perm.canCreate}
        createLabel="Thêm tài khoản"
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />
      <UserForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        mode={editing ? 'edit' : 'create'}
        initial={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />
      <ConfirmDeleteModal
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        itemLabel={
          deleting ? `${deleting.tenDangNhap} (${ROLE_LABEL[deleting.vaiTro]})` : undefined
        }
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </>
  );
}
