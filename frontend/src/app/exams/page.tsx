'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, FileText, FileType2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { Pagination } from '@/components/common/Pagination';
import { RowActions, ConfirmDeleteModal } from '@/components/common';
import { useIsOwner } from '@/hooks/useIsOwner';
import { useAuthStore } from '@/lib/auth/store';
import { listExams, deleteExam, type ListExamsParams } from '@/lib/api/exams';
import { listSubjects } from '@/lib/api/subjects';
import { exportExamDocx, exportExamPdf } from '@/lib/api/exports';
import { downloadBlob } from '@/lib/utils/download';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import type { DeThi } from '@/types/models';

function ExamRowActions({
  exam,
  onView,
  onEdit,
  onDelete,
  onExportPdf,
  onExportDocx,
}: {
  exam: DeThi;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
}): React.ReactElement {
  const { isOwner } = useIsOwner(exam.maGV);
  return (
    <RowActions
      canEdit={isOwner}
      canDelete={isOwner}
      onEdit={onEdit}
      onDelete={onDelete}
      extra={
        <>
          <IconButton type="button" size="icon-sm" variant="ghost" tooltip="Xem" onClick={onView}>
            <Eye />
          </IconButton>
          <IconButton
            type="button"
            size="icon-sm"
            variant="ghost"
            tooltip="Xuất PDF"
            onClick={onExportPdf}
          >
            <FileText />
          </IconButton>
          <IconButton
            type="button"
            size="icon-sm"
            variant="ghost"
            tooltip="Xuất DOCX"
            onClick={onExportDocx}
          >
            <FileType2 />
          </IconButton>
        </>
      }
    />
  );
}

export default function ExamsPage(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.vaiTro ?? null);
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    maMon: '',
    hocKy: '',
    namHoc: '',
  });
  const [deleting, setDeleting] = useState<DeThi | null>(null);

  const params = useMemo<ListExamsParams>(
    () => ({
      page,
      limit: 10,
      maMon: filterValues.maMon || undefined,
      hocKy: filterValues.hocKy ? Number(filterValues.hocKy) : undefined,
      namHoc: filterValues.namHoc || undefined,
    }),
    [page, filterValues.maMon, filterValues.hocKy, filterValues.namHoc],
  );

  const query = useQuery({
    queryKey: ['exams', params],
    queryFn: () => listExams(params),
  });

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'all-for-exam-filter'],
    queryFn: () => listSubjects({ page: 1, limit: 500 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExam(id),
    onSuccess: async () => {
      toast.success(MSG.DELETED);
      await queryClient.invalidateQueries({ queryKey: ['exams'] });
      setDeleting(null);
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else if (status === 409) toast.error(getApiMessage(err, 'Không thể xoá'));
      else toast.error(getApiMessage(err, MSG.DELETE_FAILED));
    },
  });

  async function handleExportPdf(exam: DeThi): Promise<void> {
    try {
      const blob = await exportExamPdf(exam.maDeThi);
      downloadBlob(blob, `de-thi-${exam.maDeThi}.pdf`);
    } catch (err) {
      toast.error(getApiMessage(err, 'Xuất PDF thất bại'));
    }
  }

  async function handleExportDocx(exam: DeThi): Promise<void> {
    try {
      const blob = await exportExamDocx(exam.maDeThi);
      downloadBlob(blob, `de-thi-${exam.maDeThi}.docx`);
    } catch (err) {
      toast.error(getApiMessage(err, 'Xuất DOCX thất bại'));
    }
  }

  const columns: DataTableColumn<DeThi>[] = [
    {
      key: 'maDeThi',
      header: 'Mã đề',
      className: 'w-28',
      render: (r) => <span className="font-mono">DT-{r.maDeThi}</span>,
    },
    {
      key: 'monHoc',
      header: 'Môn',
      render: (r) => r.monHoc?.tenMon ?? r.maMon,
    },
    { key: 'hocKy', header: 'HK', className: 'w-16', render: (r) => `HK${r.hocKy}` },
    { key: 'namHoc', header: 'Năm học', className: 'w-28', render: (r) => r.namHoc },
    {
      key: 'thoiLuong',
      header: 'Thời lượng',
      className: 'w-28',
      render: (r) => `${r.thoiLuong} phút`,
    },
    {
      key: 'soCau',
      header: 'Số câu',
      className: 'w-20',
      render: (r) => r.chiTietDeThis?.length ?? 0,
    },
    {
      key: 'nguoiLap',
      header: 'Người lập',
      className: 'w-40',
      render: (r) => r.giangVien?.hoTen ?? r.maGV,
    },
    {
      key: '__actions',
      header: '',
      className: 'w-56 text-right',
      render: (r) => (
        <ExamRowActions
          exam={r}
          onView={() => router.push(`/exams/${r.maDeThi}`)}
          onEdit={() => router.push(`/exams/${r.maDeThi}/edit`)}
          onDelete={() => setDeleting(r)}
          onExportPdf={() => handleExportPdf(r)}
          onExportDocx={() => handleExportDocx(r)}
        />
      ),
    },
  ];

  const subjectOptions = (subjectsQuery.data?.data ?? []).map((s) => ({
    value: s.maMon,
    label: `${s.maMon} — ${s.tenMon}`,
  }));

  return (
    <AppShell title="Quản lý đề thi">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <FilterBar
            filters={[
              { type: 'select', key: 'maMon', placeholder: 'Tất cả môn', options: subjectOptions },
              {
                type: 'select',
                key: 'hocKy',
                placeholder: 'Tất cả HK',
                options: [
                  { value: '1', label: 'HK1' },
                  { value: '2', label: 'HK2' },
                  { value: '3', label: 'HK3' },
                ],
              },
              { type: 'input', key: 'namHoc', placeholder: 'Năm học (2024-2025)' },
            ]}
            values={filterValues}
            onChange={(v) => {
              setFilterValues(v);
              setPage(1);
            }}
          />
          {role === 'giaovien' && (
            <Button onClick={() => router.push('/exams/new')}>
              <Plus className="h-4 w-4" aria-hidden />
              Lập đề thi mới
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={query.data?.data ?? []}
          rowKey={(r) => r.maDeThi}
          isLoading={query.isLoading}
          emptyMessage="Chưa có đề thi nào"
        />
        <Pagination page={page} limit={10} total={query.data?.total ?? 0} onChange={setPage} />
      </div>

      <ConfirmDeleteModal
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        itemLabel={
          deleting
            ? `DT-${deleting.maDeThi} — ${deleting.monHoc?.tenMon ?? deleting.maMon}`
            : undefined
        }
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.maDeThi);
        }}
        loading={deleteMutation.isPending}
      />
    </AppShell>
  );
}
