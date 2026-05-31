'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage, RowActions, ConfirmDeleteModal } from '@/components/common';
import type { DataTableColumn } from '@/components/common';
import { StudentForm } from '@/components/catalog/StudentForm';
import { useCrudResource } from '@/hooks/useCrudResource';
import { usePermission } from '@/hooks/usePermission';
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  type ListStudentsParams,
} from '@/lib/api/students';
import { listClasses } from '@/lib/api/classes';
import type { SinhVien } from '@/types/models';
import type { StudentCreateInput } from '@/lib/schemas/catalog';

const ADAPTER = {
  resource: 'students',
  list: (params: ListStudentsParams) => listStudents(params),
  create: (data: StudentCreateInput) => createStudent(data),
  update: (id: string, data: { hoTen?: string; maLop?: string }) => updateStudent(id, data),
  remove: deleteStudent,
};

export default function StudentsPage(): React.ReactElement {
  const perm = usePermission('students');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    search: '',
    maLop: '',
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SinhVien | null>(null);
  const [deleting, setDeleting] = useState<SinhVien | null>(null);

  const classesQuery = useQuery({
    queryKey: ['classes', 'all-for-student-filter'],
    queryFn: () => listClasses({ page: 1, limit: 500 }),
  });

  const params = useMemo<ListStudentsParams>(
    () => ({
      page,
      limit: 10,
      search: filterValues.search || undefined,
      maLop: filterValues.maLop || undefined,
    }),
    [page, filterValues.search, filterValues.maLop],
  );

  const { query, createMutation, updateMutation, deleteMutation } = useCrudResource(ADAPTER, {
    params,
  });

  const columns: DataTableColumn<SinhVien>[] = [
    { key: 'maSV', header: 'Mã SV', render: (r) => <span className="font-mono">{r.maSV}</span> },
    { key: 'hoTen', header: 'Họ tên', render: (r) => r.hoTen },
    { key: 'maLop', header: 'Mã lớp', render: (r) => r.maLop },
    { key: 'tenLop', header: 'Tên lớp', render: (r) => r.lopHoc?.tenLop ?? '—' },
    {
      key: '__actions',
      header: '',
      className: 'w-24 text-right',
      render: (r) => (
        <RowActions
          canEdit={perm.canEdit}
          canDelete={perm.canDelete}
          onEdit={() => {
            setEditing(r);
            setFormOpen(true);
          }}
          onDelete={() => setDeleting(r)}
        />
      ),
    },
  ];

  async function handleSubmit(data: StudentCreateInput): Promise<void> {
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.maSV,
        data: { hoTen: data.hoTen, maLop: data.maLop },
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.maSV);
    setDeleting(null);
  }

  const classOptions = (classesQuery.data?.data ?? []).map((c) => ({
    value: c.maLop,
    label: `${c.maLop} — ${c.tenLop}`,
  }));

  return (
    <AppShell title="Sinh viên">
      <ResourcePage<SinhVien>
        filters={[
          { type: 'input', key: 'search', placeholder: 'Tìm kiếm sinh viên…' },
          { type: 'select', key: 'maLop', placeholder: 'Tất cả lớp', options: classOptions },
        ]}
        filterValues={filterValues}
        onFilterChange={(v) => {
          setFilterValues(v);
          setPage(1);
        }}
        columns={columns}
        data={query.data?.data ?? []}
        rowKey={(r) => r.maSV}
        isLoading={query.isLoading}
        page={page}
        limit={10}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        canCreate={perm.canCreate}
        createLabel="Thêm sinh viên"
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />
      <StudentForm
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
        itemLabel={deleting ? `${deleting.maSV} — ${deleting.hoTen}` : undefined}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </AppShell>
  );
}
