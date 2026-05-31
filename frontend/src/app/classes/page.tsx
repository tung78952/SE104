'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage, RowActions, ConfirmDeleteModal } from '@/components/common';
import type { DataTableColumn } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ClassForm } from '@/components/catalog/ClassForm';
import { useCrudResource } from '@/hooks/useCrudResource';
import { usePermission } from '@/hooks/usePermission';
import {
  listClasses,
  createClass,
  updateClass,
  deleteClass,
  type ListClassesParams,
} from '@/lib/api/classes';
import { listSubjects } from '@/lib/api/subjects';
import type { LopHoc } from '@/types/models';
import type { ClassCreateInput } from '@/lib/schemas/catalog';

const ADAPTER = {
  resource: 'classes',
  list: (params: ListClassesParams) => listClasses(params),
  create: (data: ClassCreateInput) => createClass(data),
  update: (id: string, data: { tenLop?: string; maMon?: string }) => updateClass(id, data),
  remove: deleteClass,
};

export default function ClassesPage(): React.ReactElement {
  const perm = usePermission('classes');
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    search: '',
    maMon: '',
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LopHoc | null>(null);
  const [deleting, setDeleting] = useState<LopHoc | null>(null);

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'all-filter'],
    queryFn: () => listSubjects({ page: 1, limit: 200 }),
  });

  const params = useMemo<ListClassesParams>(
    () => ({
      page,
      limit: 10,
      search: filterValues.search || undefined,
      maMon: filterValues.maMon || undefined,
    }),
    [page, filterValues.search, filterValues.maMon],
  );

  const { query, createMutation, updateMutation, deleteMutation } = useCrudResource(ADAPTER, {
    params,
  });

  const columns: DataTableColumn<LopHoc>[] = [
    { key: 'maLop', header: 'Mã lớp', render: (r) => <span className="font-mono">{r.maLop}</span> },
    { key: 'tenLop', header: 'Tên lớp', render: (r) => r.tenLop },
    {
      key: 'monHoc',
      header: 'Môn học',
      render: (r) => (r.monHoc ? `${r.maMon} — ${r.monHoc.tenMon}` : r.maMon),
    },
    {
      key: '__actions',
      header: '',
      className: 'w-40 text-right',
      render: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            aria-label="Chi tiết"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/classes/${r.maLop}`);
            }}
          >
            <ExternalLink />
            Chi tiết
          </Button>
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

  async function handleSubmit(data: ClassCreateInput): Promise<void> {
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.maLop,
        data: { tenLop: data.tenLop, maMon: data.maMon },
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.maLop);
    setDeleting(null);
  }

  const subjectOptions = (subjectsQuery.data?.data ?? []).map((s) => ({
    value: s.maMon,
    label: `${s.maMon} — ${s.tenMon}`,
  }));

  return (
    <AppShell title="Lớp học">
      <ResourcePage<LopHoc>
        filters={[
          { type: 'input', key: 'search', placeholder: 'Tìm kiếm lớp…' },
          { type: 'select', key: 'maMon', placeholder: 'Tất cả môn', options: subjectOptions },
        ]}
        filterValues={filterValues}
        onFilterChange={(v) => {
          setFilterValues(v);
          setPage(1);
        }}
        columns={columns}
        data={query.data?.data ?? []}
        rowKey={(r) => r.maLop}
        isLoading={query.isLoading}
        page={page}
        limit={10}
        total={query.data?.total ?? 0}
        onPageChange={setPage}
        canCreate={perm.canCreate}
        createLabel="Thêm lớp"
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />
      <ClassForm
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
        itemLabel={deleting ? `${deleting.maLop} — ${deleting.tenLop}` : undefined}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </AppShell>
  );
}
