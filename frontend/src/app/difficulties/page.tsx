'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ResourcePage, RowActions, ConfirmDeleteModal } from '@/components/common';
import type { DataTableColumn } from '@/components/common';
import { DifficultyForm } from '@/components/catalog/DifficultyForm';
import { useCrudResource } from '@/hooks/useCrudResource';
import { usePermission } from '@/hooks/usePermission';
import {
  listDifficulties,
  createDifficulty,
  updateDifficulty,
  deleteDifficulty,
} from '@/lib/api/difficulties';
import type { DoKho } from '@/types/models';
import type { DifficultyInput } from '@/lib/schemas/catalog';

// Difficulty API returns plain array → wrap into CrudListResult shape
const ADAPTER = {
  resource: 'difficulties',
  list: async () => {
    const data = await listDifficulties();
    return { data, total: data.length, page: 1, limit: data.length };
  },
  create: (data: DifficultyInput) => createDifficulty(data),
  update: (id: number, data: { tenDoKho?: string }) => updateDifficulty(id, data),
  remove: deleteDifficulty,
};

export default function DifficultiesPage(): React.ReactElement {
  const perm = usePermission('difficulties');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DoKho | null>(null);
  const [deleting, setDeleting] = useState<DoKho | null>(null);

  const { query, createMutation, updateMutation, deleteMutation } = useCrudResource(ADAPTER, {});

  const columns: DataTableColumn<DoKho>[] = [
    { key: 'maDoKho', header: 'Mã', render: (r) => <span className="font-mono">{r.maDoKho}</span> },
    { key: 'tenDoKho', header: 'Tên độ khó', render: (r) => r.tenDoKho },
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

  async function handleSubmit(data: DifficultyInput): Promise<void> {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.maDoKho, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting.maDoKho);
    setDeleting(null);
  }

  return (
    <AppShell title="Độ khó">
      <ResourcePage<DoKho>
        columns={columns}
        data={query.data?.data ?? []}
        rowKey={(r) => r.maDoKho}
        isLoading={query.isLoading}
        page={1}
        limit={query.data?.limit ?? 10}
        total={query.data?.total ?? 0}
        onPageChange={() => undefined}
        canCreate={perm.canCreate}
        createLabel="Thêm độ khó"
        onCreate={() => {
          setEditing(null);
          setFormOpen(true);
        }}
      />
      <DifficultyForm
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
        itemLabel={deleting ? `${deleting.maDoKho} — ${deleting.tenDoKho}` : undefined}
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
      />
    </AppShell>
  );
}
