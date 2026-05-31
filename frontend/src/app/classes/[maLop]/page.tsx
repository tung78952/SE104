'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  DataTable,
  ConfirmDeleteModal,
  RowActions,
  type DataTableColumn,
} from '@/components/common';
import { ClassStudentForm } from '@/components/catalog/ClassStudentForm';
import { usePermission } from '@/hooks/usePermission';
import { getClass, addStudentToClass, removeStudentFromClass } from '@/lib/api/classes';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import type { SinhVien } from '@/types/models';
import type { ClassStudentInput } from '@/lib/schemas/catalog';

export default function ClassDetailPage(): React.ReactElement {
  const params = useParams<{ maLop: string }>();
  const maLop = params.maLop;
  const router = useRouter();
  const perm = usePermission('classes');
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<SinhVien | null>(null);

  const queryKey = ['classes', 'detail', maLop] as const;
  const detailQuery = useQuery({
    queryKey,
    queryFn: () => getClass(maLop),
    enabled: Boolean(maLop),
  });

  const addMutation = useMutation({
    mutationFn: (data: ClassStudentInput) => addStudentToClass(maLop, data),
    onSuccess: async () => {
      toast.success(MSG.CREATED);
      await qc.invalidateQueries({ queryKey });
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 409) {
        toast.error(getApiMessage(err, MSG.CONFLICT));
      } else if (status === 403) {
        toast.warning(MSG.FORBIDDEN);
      } else {
        toast.error(getApiMessage(err, MSG.CREATE_FAILED));
      }
    },
  });

  const removeMutation = useMutation({
    mutationFn: (sv: SinhVien) => removeStudentFromClass(maLop, sv.maSV),
    onSuccess: async () => {
      toast.success(MSG.DELETED);
      await qc.invalidateQueries({ queryKey });
    },
    onError: (err) => toast.error(getApiMessage(err, MSG.DELETE_FAILED)),
  });

  const cls = detailQuery.data;
  const sinhViens = cls?.sinhViens ?? [];

  const columns: DataTableColumn<SinhVien>[] = [
    { key: 'maSV', header: 'Mã SV', render: (r) => <span className="font-mono">{r.maSV}</span> },
    { key: 'hoTen', header: 'Họ tên', render: (r) => r.hoTen },
    {
      key: '__actions',
      header: '',
      className: 'w-20 text-right',
      render: (r) => <RowActions canDelete={perm.canDelete} onDelete={() => setRemoving(r)} />,
    },
  ];

  async function handleAdd(data: ClassStudentInput): Promise<void> {
    await addMutation.mutateAsync(data);
    setAddOpen(false);
  }

  async function handleRemove(): Promise<void> {
    if (!removing) return;
    await removeMutation.mutateAsync(removing);
    setRemoving(null);
  }

  return (
    <AppShell title="Chi tiết lớp học">
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="self-start"
          onClick={() => router.push('/classes')}
        >
          <ArrowLeft />
          Quay lại danh sách lớp
        </Button>

        {detailQuery.isLoading || !cls ? (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            Đang tải…
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <ReadOnly label="Mã lớp" value={cls.maLop} />
                <ReadOnly label="Tên lớp" value={cls.tenLop} />
                <ReadOnly label="Môn học" value={cls.monHoc?.tenMon ?? cls.maMon} />
                <ReadOnly label="Sĩ số" value={String(sinhViens.length)} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium">Sinh viên trong lớp</h2>
              {perm.canCreate && (
                <Button type="button" onClick={() => setAddOpen(true)}>
                  <Plus />
                  Thêm SV vào lớp
                </Button>
              )}
            </div>
            <DataTable
              columns={columns}
              data={sinhViens}
              rowKey={(r) => r.maSV}
              emptyMessage="Lớp chưa có sinh viên"
            />
          </>
        )}
      </div>

      <ClassStudentForm
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
        submitting={addMutation.isPending}
      />
      <ConfirmDeleteModal
        open={removing !== null}
        onOpenChange={(o) => {
          if (!o) setRemoving(null);
        }}
        title="Xoá sinh viên khỏi lớp"
        itemLabel={removing ? `${removing.maSV} — ${removing.hoTen}` : undefined}
        onConfirm={handleRemove}
        loading={removeMutation.isPending}
      />
    </AppShell>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
