'use client';

import { useMemo, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage, RowActions, ConfirmDeleteModal } from '@/components/common';
import type { DataTableColumn } from '@/components/common';
import { SubjectForm } from '@/components/catalog/SubjectForm';
import { useCrudResource } from '@/hooks/useCrudResource';
import { usePermission } from '@/hooks/usePermission';
import {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  type ListSubjectsParams,
} from '@/lib/api/subjects';
import type { MonHoc } from '@/types/models';
import type { SubjectCreateInput } from '@/lib/schemas/catalog';

const ADAPTER = {
  resource: 'subjects',
  list: (params: ListSubjectsParams) => listSubjects(params),
  create: createSubject,
  update: (id: string, data: { tenMon?: string; soTinChi?: number }) => updateSubject(id, data),
  remove: deleteSubject,
};

export default function SubjectsPage(): React.ReactElement {
  const perm = usePermission('subjects');
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({ search: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MonHoc | null>(null);
  const [deleting, setDeleting] = useState<MonHoc | null>(null);

  const params = useMemo<ListSubjectsParams>(
    () => ({ page, limit: 10, search: filterValues.search || undefined }),
    [page, filterValues.search],
  );

  const { query, createMutation, updateMutation, deleteMutation } = useCrudResource(ADAPTER, {
    params,
  });

  const columns: DataTableColumn<MonHoc>[] = [
    { key: 'maMon', header: 'Mã môn', render: (r) => <span className="font-mono">{r.maMon}</span> },
    { key: 'tenMon', header: 'Tên môn', render: (r) => r.tenMon },
    { key: 'soTinChi', header: 'Số tín chỉ', render: (r) => r.soTinChi },
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

  async function handleSubmit(data: SubjectCreateInput): Promise<void> {
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.maMon,
        data: { tenMon: data.tenMon, soTinChi: data.soTinChi },
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.maMon);
    setDeleting(null);
  }

  return (
    <AppShell title="Môn học">
      <ResourcePage<MonHoc>
        filters={[{ type: 'input', key: 'search', placeholder: 'Tìm kiếm môn học…' }]}
        filterValues={filterValues}
        onFilterChange={(v) => {
          setFilterValues(v);
          setPage(1);
        }}
        columns={columns}
        data={query.data?.data ?? []}
        rowKey={(r) => r.maMon}
        isLoading={query.isLoading}
        page={page}
        limit={10}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        canCreate={perm.canCreate}
        createLabel="Thêm môn"
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />
      <SubjectForm
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
        itemLabel={deleting ? `${deleting.maMon} — ${deleting.tenMon}` : undefined}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </AppShell>
  );
}
