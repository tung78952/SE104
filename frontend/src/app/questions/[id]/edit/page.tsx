'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AppShell } from '@/components/layout/app-shell';
import { QuestionForm } from '@/components/questions/QuestionForm';
import { getQuestion, updateQuestion } from '@/lib/api/questions';
import { useIsOwner } from '@/hooks/useIsOwner';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import type { QuestionInput } from '@/lib/schemas/catalog';

export default function EditQuestionPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['questions', 'detail', id],
    queryFn: () => getQuestion(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const { isOwner, role } = useIsOwner(query.data?.maGV);

  const updateMutation = useMutation({
    mutationFn: (data: QuestionInput) => updateQuestion(id, data),
    onSuccess: async () => {
      toast.success(MSG.UPDATED);
      await queryClient.invalidateQueries({ queryKey: ['questions'] });
      router.push('/questions');
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else toast.error(getApiMessage(err, MSG.UPDATE_FAILED));
    },
  });

  if (query.isLoading) {
    return (
      <AppShell title="Sửa câu hỏi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Đang tải…
        </div>
      </AppShell>
    );
  }

  if (!query.data) {
    return (
      <AppShell title="Sửa câu hỏi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Không tìm thấy câu hỏi.
        </div>
      </AppShell>
    );
  }

  if (role !== null && !isOwner) {
    return (
      <AppShell title="Sửa câu hỏi">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Chỉ giảng viên đã soạn câu hỏi mới có thể chỉnh sửa.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Sửa câu hỏi CH${query.data.maCauHoi}`}>
      <div className="rounded-lg border bg-card p-5">
        <QuestionForm
          initial={{
            maMon: query.data.maMon,
            maDoKho: query.data.maDoKho,
            noiDung: query.data.noiDung,
          }}
          submitLabel="Cập nhật"
          onSubmit={async (d) => {
            await updateMutation.mutateAsync(d);
          }}
          submitting={updateMutation.isPending}
          onCancel={() => router.push('/questions')}
        />
      </div>
    </AppShell>
  );
}
