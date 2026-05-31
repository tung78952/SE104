'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { DataTable, FormModal, type DataTableColumn } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermission } from '@/hooks/usePermission';
import { listRegulations, updateRegulation, createRegulation } from '@/lib/api/regulations';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import { regulationCreateSchema, type RegulationCreateInput } from '@/lib/schemas/catalog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { QuyDinh } from '@/types/models';

const QUERY_KEY = ['regulations'] as const;

export default function RegulationsPage(): React.ReactElement {
  const perm = usePermission('regulations');
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const listQuery = useQuery({ queryKey: QUERY_KEY, queryFn: listRegulations });

  const updateMutation = useMutation({
    mutationFn: ({ tenThamSo, giaTri }: { tenThamSo: string; giaTri: string }) =>
      updateRegulation(tenThamSo, { giaTri }),
    onSuccess: async (_, vars) => {
      toast.success(MSG.UPDATED);
      setEdits((e) => {
        const copy = { ...e };
        delete copy[vars.tenThamSo];
        return copy;
      });
      await qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else toast.error(getApiMessage(err, MSG.UPDATE_FAILED));
    },
  });

  const createMutation = useMutation({
    mutationFn: createRegulation,
    onSuccess: async () => {
      toast.success(MSG.CREATED);
      setCreateOpen(false);
      await qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 409) toast.error(getApiMessage(err, MSG.CONFLICT));
      else if (status === 403) toast.warning(MSG.FORBIDDEN);
      else toast.error(getApiMessage(err, MSG.CREATE_FAILED));
    },
  });

  const data = listQuery.data ?? [];

  const columns: DataTableColumn<QuyDinh>[] = [
    {
      key: 'tenThamSo',
      header: 'Tham số',
      render: (r) => <span className="font-mono">{r.tenThamSo}</span>,
    },
    {
      key: 'giaTri',
      header: 'Giá trị',
      className: 'w-44',
      render: (r) => {
        const current = edits[r.tenThamSo] ?? r.giaTri;
        if (!perm.canEdit) return <span>{r.giaTri}</span>;
        return (
          <Input
            type="text"
            value={current}
            aria-label={`Giá trị của ${r.tenThamSo}`}
            onChange={(e) => setEdits((prev) => ({ ...prev, [r.tenThamSo]: e.target.value }))}
          />
        );
      },
    },
    { key: 'moTa', header: 'Mô tả', render: (r) => r.moTa ?? '—' },
    {
      key: 'ngayCapNhat',
      header: 'Ngày cập nhật',
      render: (r) => new Date(r.ngayCapNhat).toLocaleString('vi-VN'),
    },
    {
      key: '__actions',
      header: '',
      className: 'w-24 text-right',
      render: (r) => {
        if (!perm.canEdit) return null;
        const draft = edits[r.tenThamSo];
        const dirty = draft !== undefined && draft !== r.giaTri;
        return (
          <Button
            type="button"
            size="sm"
            disabled={!dirty || updateMutation.isPending}
            onClick={() => {
              if (!dirty) return;
              updateMutation.mutate({ tenThamSo: r.tenThamSo, giaTri: draft });
            }}
          >
            <Save />
            Lưu
          </Button>
        );
      },
    },
  ];

  return (
    <AppShell title="Quy định hệ thống">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            5 tham số mặc định: SoCauToiDa, ThoiLuongMin, ThoiLuongMax, DiemMin, DiemMax.
          </p>
          {perm.canCreate && (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <Plus />
              Thêm tham số
            </Button>
          )}
        </div>
        <DataTable
          columns={columns}
          data={data}
          rowKey={(r) => r.tenThamSo}
          isLoading={listQuery.isLoading}
        />
      </div>
      <CreateRegulationModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={(d) => createMutation.mutateAsync(d).then(() => undefined)}
        submitting={createMutation.isPending}
      />
    </AppShell>
  );
}

interface CreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RegulationCreateInput) => Promise<void>;
  submitting?: boolean;
}

const CREATE_FORM_ID = 'regulation-create-form';

function CreateRegulationModal({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: CreateModalProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegulationCreateInput>({
    resolver: zodResolver(regulationCreateSchema),
    defaultValues: { tenThamSo: '', giaTri: '', moTa: '' },
  });

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset({ tenThamSo: '', giaTri: '', moTa: '' });
      }}
      title="Thêm tham số quy định"
      formId={CREATE_FORM_ID}
      submitting={submitting}
    >
      <form
        id={CREATE_FORM_ID}
        noValidate
        onSubmit={handleSubmit((d) => onSubmit(d))}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenThamSo">Tên tham số *</Label>
          <Input id="tenThamSo" type="text" {...register('tenThamSo')} />
          {errors.tenThamSo && (
            <p role="alert" className="text-xs text-destructive">
              {errors.tenThamSo.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="giaTri">Giá trị *</Label>
          <Input id="giaTri" type="text" {...register('giaTri')} />
          {errors.giaTri && (
            <p role="alert" className="text-xs text-destructive">
              {errors.giaTri.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="moTa">Mô tả</Label>
          <Input id="moTa" type="text" {...register('moTa')} />
          {errors.moTa && (
            <p role="alert" className="text-xs text-destructive">
              {errors.moTa.message}
            </p>
          )}
        </div>
      </form>
    </FormModal>
  );
}
