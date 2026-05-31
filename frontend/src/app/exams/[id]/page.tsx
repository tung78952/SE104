'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, FileType2, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDeleteModal } from '@/components/common';
import { getExam, deleteExam } from '@/lib/api/exams';
import { exportExamDocx, exportExamPdf } from '@/lib/api/exports';
import { downloadBlob } from '@/lib/utils/download';
import { useIsOwner } from '@/hooks/useIsOwner';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';

export default function ExamDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const query = useQuery({
    queryKey: ['exams', 'detail', id],
    queryFn: () => getExam(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const exam = query.data;
  const { isOwner } = useIsOwner(exam?.maGV);

  const deleteMutation = useMutation({
    mutationFn: () => deleteExam(id),
    onSuccess: async () => {
      toast.success(MSG.DELETED);
      await queryClient.invalidateQueries({ queryKey: ['exams'] });
      router.push('/exams');
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else if (status === 409) toast.error(getApiMessage(err, 'Không thể xoá'));
      else toast.error(getApiMessage(err, MSG.DELETE_FAILED));
    },
  });

  async function handleExportPdf(): Promise<void> {
    if (!exam) return;
    try {
      const blob = await exportExamPdf(exam.maDeThi);
      downloadBlob(blob, `de-thi-${exam.maDeThi}.pdf`);
    } catch (err) {
      toast.error(getApiMessage(err, 'Xuất PDF thất bại'));
    }
  }

  async function handleExportDocx(): Promise<void> {
    if (!exam) return;
    try {
      const blob = await exportExamDocx(exam.maDeThi);
      downloadBlob(blob, `de-thi-${exam.maDeThi}.docx`);
    } catch (err) {
      toast.error(getApiMessage(err, 'Xuất DOCX thất bại'));
    }
  }

  if (query.isLoading) {
    return (
      <AppShell title="Chi tiết đề thi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Đang tải…
        </div>
      </AppShell>
    );
  }

  if (!exam) {
    return (
      <AppShell title="Chi tiết đề thi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Không tìm thấy đề thi.
        </div>
      </AppShell>
    );
  }

  const chiTiet = (exam.chiTietDeThis ?? []).slice().sort((a, b) => a.soCau - b.soCau);

  return (
    <AppShell title={`Chi tiết đề thi DT-${exam.maDeThi}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap gap-5 text-xs">
            <Field label="Mã đề thi" value={`DT-${exam.maDeThi}`} />
            <Field label="Môn học" value={exam.monHoc?.tenMon ?? exam.maMon} />
            <Field label="Học kỳ / Năm học" value={`HK${exam.hocKy} / ${exam.namHoc}`} />
            <Field label="Thời lượng" value={`${exam.thoiLuong} phút`} />
            <Field label="Số câu" value={String(chiTiet.length)} />
            <Field label="Người lập" value={exam.giangVien?.hoTen ?? exam.maGV} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => router.push('/exams')}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Quay lại
            </Button>
            <Button variant="secondary" onClick={handleExportPdf}>
              <FileText className="h-4 w-4" aria-hidden /> PDF
            </Button>
            <Button variant="secondary" onClick={handleExportDocx}>
              <FileType2 className="h-4 w-4" aria-hidden /> DOCX
            </Button>
            {isOwner && (
              <>
                <Button onClick={() => router.push(`/exams/${exam.maDeThi}/edit`)}>
                  <Pencil className="h-4 w-4" aria-hidden /> Sửa
                </Button>
                <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" aria-hidden /> Xoá
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-2 text-sm font-medium">Danh sách câu hỏi trong đề</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">STT</TableHead>
                <TableHead>Nội dung câu hỏi</TableHead>
                <TableHead className="w-32">Độ khó</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chiTiet.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-xs text-muted-foreground">
                    Chưa có câu hỏi
                  </TableCell>
                </TableRow>
              ) : (
                chiTiet.map((d) => (
                  <TableRow key={d.maCauHoi}>
                    <TableCell className="text-center font-medium">{d.soCau}</TableCell>
                    <TableCell>{d.cauHoi?.noiDung ?? `CH${d.maCauHoi}`}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {d.cauHoi?.doKho?.tenDoKho ?? `#${d.cauHoi?.maDoKho ?? '?'}`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        itemLabel={`DT-${exam.maDeThi} — ${exam.monHoc?.tenMon ?? exam.maMon}`}
        onConfirm={() => deleteMutation.mutate()}
        loading={deleteMutation.isPending}
      />
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
