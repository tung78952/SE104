'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { ExamForm } from '@/components/exams/ExamForm';
import { getExam, updateExam } from '@/lib/api/exams';
import { useIsOwner } from '@/hooks/useIsOwner';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';

export default function EditExamPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['exams', 'detail', id],
    queryFn: () => getExam(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const { isOwner, role } = useIsOwner(query.data?.maGV);

  const updateMutation = useMutation({
    mutationFn: (data: {
      hocKy: number;
      namHoc: string;
      thoiLuong: number;
      danhSachMaCauHoi: number[];
    }) =>
      updateExam(id, {
        hocKy: data.hocKy,
        namHoc: data.namHoc,
        thoiLuong: data.thoiLuong,
        danhSachMaCauHoi: data.danhSachMaCauHoi,
      }),
    onSuccess: async () => {
      toast.success(MSG.UPDATED);
      await queryClient.invalidateQueries({ queryKey: ['exams'] });
      router.push(`/exams/${id}`);
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else toast.error(getApiMessage(err, MSG.UPDATE_FAILED));
    },
  });

  if (query.isLoading) {
    return (
      <AppShell title="Sửa đề thi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Đang tải…
        </div>
      </AppShell>
    );
  }

  if (!query.data) {
    return (
      <AppShell title="Sửa đề thi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Không tìm thấy đề thi.
        </div>
      </AppShell>
    );
  }

  if (role !== null && !isOwner) {
    return (
      <AppShell title="Sửa đề thi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Chỉ giảng viên đã lập đề mới có thể chỉnh sửa.
        </div>
      </AppShell>
    );
  }

  const initialChosen = (query.data.chiTietDeThis ?? [])
    .slice()
    .sort((a, b) => a.soCau - b.soCau)
    .map((d) => d.maCauHoi);

  return (
    <AppShell title={`Sửa đề thi DT-${query.data.maDeThi}`}>
      <ExamForm
        lockSubject
        initial={{
          maMon: query.data.maMon,
          hocKy: query.data.hocKy,
          namHoc: query.data.namHoc,
          thoiLuong: query.data.thoiLuong,
          chosenIds: initialChosen,
        }}
        submitLabel="Cập nhật"
        onSubmit={async (data) => {
          await updateMutation.mutateAsync(data);
        }}
        submitting={updateMutation.isPending}
        onCancel={() => router.push(`/exams/${id}`)}
      />
    </AppShell>
  );
}
