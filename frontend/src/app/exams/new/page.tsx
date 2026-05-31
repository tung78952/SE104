'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { ExamForm } from '@/components/exams/ExamForm';
import { createExam } from '@/lib/api/exams';
import { useAuthStore } from '@/lib/auth/store';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import { currentAcademicYear } from '@/lib/utils/academic-year';

export default function NewExamPage(): React.ReactElement {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.vaiTro ?? null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createExam,
    onSuccess: async (exam) => {
      toast.success(MSG.CREATED);
      await queryClient.invalidateQueries({ queryKey: ['exams'] });
      router.push(`/exams/${exam.maDeThi}`);
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else toast.error(getApiMessage(err, MSG.CREATE_FAILED));
    },
  });

  if (role && role !== 'giaovien') {
    return (
      <AppShell title="Lập đề thi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Chỉ giảng viên được phép lập đề thi.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Lập đề thi mới">
      <ExamForm
        initial={{ namHoc: currentAcademicYear() }}
        onSubmit={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        submitting={createMutation.isPending}
        onCancel={() => router.push('/exams')}
      />
    </AppShell>
  );
}
