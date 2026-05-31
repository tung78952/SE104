'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Pencil, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { Pagination } from '@/components/common/Pagination';
import { EditGradeModal } from '@/components/grades/EditGradeModal';
import { listGrades, updateGrade, type ListGradesParams } from '@/lib/api/grades';
import { listClasses } from '@/lib/api/classes';
import { listExams } from '@/lib/api/exams';
import { exportGradesPdf } from '@/lib/api/exports';
import { downloadBlob } from '@/lib/utils/download';
import { useAuthStore } from '@/lib/auth/store';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import type { BangDiem } from '@/types/models';

export default function GradesPage(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.vaiTro ?? null);
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    maLop: '',
    maDeThi: '',
    hocKy: '',
    namHoc: '',
  });
  const [editing, setEditing] = useState<BangDiem | null>(null);

  const params = useMemo<ListGradesParams>(
    () => ({
      page,
      limit: 10,
      maLop: filterValues.maLop || undefined,
      maDeThi: filterValues.maDeThi ? Number(filterValues.maDeThi) : undefined,
      hocKy: filterValues.hocKy ? Number(filterValues.hocKy) : undefined,
      namHoc: filterValues.namHoc || undefined,
    }),
    [page, filterValues.maLop, filterValues.maDeThi, filterValues.hocKy, filterValues.namHoc],
  );

  const query = useQuery({
    queryKey: ['grades', params],
    queryFn: () => listGrades(params),
  });

  const classesQuery = useQuery({
    queryKey: ['classes', 'all-for-grade-filter'],
    queryFn: () => listClasses({ page: 1, limit: 500 }),
  });
  const examsQuery = useQuery({
    queryKey: ['exams', 'all-for-grade-filter'],
    queryFn: () => listExams({ page: 1, limit: 500 }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; diemSo: number; ghiChu?: string; hocKy: number }) =>
      updateGrade(data.id, { diemSo: data.diemSo, ghiChu: data.ghiChu }),
    onSuccess: async () => {
      toast.success(MSG.UPDATED);
      await queryClient.invalidateQueries({ queryKey: ['grades'] });
      setEditing(null);
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else toast.error(getApiMessage(err, MSG.UPDATE_FAILED));
    },
  });

  async function handleExportPdf(): Promise<void> {
    if (!filterValues.maLop || !filterValues.maDeThi) {
      toast.error('Cần chọn lớp và đề thi để xuất bảng điểm');
      return;
    }
    try {
      const blob = await exportGradesPdf({
        maLop: filterValues.maLop,
        maDeThi: Number(filterValues.maDeThi),
      });
      downloadBlob(blob, `bang-diem-${filterValues.maLop}-${filterValues.maDeThi}.pdf`);
    } catch (err) {
      toast.error(getApiMessage(err, 'Xuất PDF thất bại'));
    }
  }

  const columns: DataTableColumn<BangDiem>[] = [
    {
      key: 'maSV',
      header: 'MSSV',
      className: 'w-28',
      render: (r) => <span className="font-mono">{r.maSV}</span>,
    },
    { key: 'hoTen', header: 'Họ tên', render: (r) => r.sinhVien?.hoTen ?? '—' },
    { key: 'maLop', header: 'Lớp', className: 'w-24', render: (r) => r.maLop },
    { key: 'maDeThi', header: 'Mã đề', className: 'w-24', render: (r) => `DT-${r.maDeThi}` },
    {
      key: 'tenMon',
      header: 'Môn',
      className: 'w-24',
      render: (r) => r.deThi?.monHoc?.tenMon ?? r.deThi?.maMon ?? '—',
    },
    { key: 'hocKy', header: 'HK', className: 'w-16', render: (r) => `HK${r.hocKy}` },
    {
      key: 'diemSo',
      header: 'Điểm',
      className: 'w-20',
      render: (r) => <span className="font-medium">{String(r.diemSo)}</span>,
    },
    { key: 'ghiChu', header: 'Ghi chú', render: (r) => r.ghiChu ?? '' },
    {
      key: '__actions',
      header: '',
      className: 'w-24 text-right',
      render: (r) =>
        role === 'giaovien' ? (
          <IconButton
            type="button"
            size="icon-sm"
            variant="ghost"
            tooltip="Sửa điểm"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(r);
            }}
          >
            <Pencil />
          </IconButton>
        ) : null,
    },
  ];

  const classOptions = (classesQuery.data?.data ?? []).map((c) => ({
    value: c.maLop,
    label: `${c.maLop} — ${c.tenLop}`,
  }));
  const examOptions = (examsQuery.data?.data ?? []).map((e) => ({
    value: String(e.maDeThi),
    label: `DT-${e.maDeThi} (${e.monHoc?.tenMon ?? e.maMon})`,
  }));

  return (
    <AppShell title="Tra cứu bảng điểm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <FilterBar
            filters={[
              { type: 'select', key: 'maLop', placeholder: 'Tất cả lớp', options: classOptions },
              {
                type: 'select',
                key: 'maDeThi',
                placeholder: 'Tất cả đề thi',
                options: examOptions,
              },
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
              { type: 'input', key: 'namHoc', placeholder: 'Năm học' },
            ]}
            values={filterValues}
            onChange={(v) => {
              setFilterValues(v);
              setPage(1);
            }}
          />
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleExportPdf}>
              <FileText className="h-4 w-4" aria-hidden /> Xuất PDF
            </Button>
            {role === 'giaovien' && (
              <>
                <Button onClick={() => router.push('/grades/new')}>
                  <Plus className="h-4 w-4" aria-hidden /> Nhập 1 SV
                </Button>
                <Button onClick={() => router.push('/grades/batch')}>
                  <Upload className="h-4 w-4" aria-hidden /> Nhập loạt
                </Button>
              </>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={query.data?.data ?? []}
          rowKey={(r) => r.maBangDiem}
          isLoading={query.isLoading}
          emptyMessage="Chưa có bản ghi điểm nào"
        />
        <Pagination page={page} limit={10} total={query.data?.total ?? 0} onChange={setPage} />
      </div>

      <EditGradeModal
        open={editing !== null}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        grade={editing}
        submitting={updateMutation.isPending}
        onSubmit={async (d) => {
          if (!editing) return;
          await updateMutation.mutateAsync({
            id: editing.maBangDiem,
            diemSo: d.diemSo,
            ghiChu: typeof d.ghiChu === 'string' ? d.ghiChu : undefined,
            hocKy: d.hocKy,
          });
        }}
      />
    </AppShell>
  );
}
