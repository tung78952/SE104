'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { QuestionForm } from '@/components/questions/QuestionForm';
import { createQuestion } from '@/lib/api/questions';
import { useAuthStore } from '@/lib/auth/store';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import type { QuestionInput } from '@/lib/schemas/catalog';

export default function NewQuestionPage(): React.ReactElement {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.vaiTro ?? null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: QuestionInput) => createQuestion(data),
    onSuccess: async () => {
      toast.success(MSG.CREATED);
      await queryClient.invalidateQueries({ queryKey: ['questions'] });
      router.push('/questions');
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else toast.error(getApiMessage(err, MSG.CREATE_FAILED));
    },
  });

  if (role && role !== 'giaovien') {
    return (
      <AppShell title="Soạn câu hỏi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Chỉ giảng viên được phép soạn câu hỏi.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Soạn câu hỏi mới">
      <div className="rounded-lg border bg-card p-5">
        <QuestionForm
          onSubmit={async (d) => {
            await createMutation.mutateAsync(d);
          }}
          submitting={createMutation.isPending}
          onCancel={() => router.push('/questions')}
        />
      </div>
    </AppShell>
  );
}
