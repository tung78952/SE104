'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Eye, Plus } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { DataTable, type DataTableColumn } from '@/components/common/DataTable';
import { FilterBar } from '@/components/common/FilterBar';
import { Pagination } from '@/components/common/Pagination';
import { RowActions, ConfirmDeleteModal } from '@/components/common';
import { QuestionDetailModal } from '@/components/questions/QuestionDetailModal';
import { useIsOwner } from '@/hooks/useIsOwner';
import { useAuthStore } from '@/lib/auth/store';
import { listQuestions, deleteQuestion, type ListQuestionsParams } from '@/lib/api/questions';
import { listSubjects } from '@/lib/api/subjects';
import { listDifficulties } from '@/lib/api/difficulties';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import type { CauHoi } from '@/types/models';

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function QuestionRowActions({
  question,
  onView,
  onEdit,
  onDelete,
}: {
  question: CauHoi;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}): React.ReactElement {
  const { isOwner } = useIsOwner(question.maGV);
  return (
    <RowActions
      canEdit={isOwner}
      canDelete={isOwner}
      onEdit={onEdit}
      onDelete={onDelete}
      extra={
        <IconButton
          type="button"
          size="icon-sm"
          variant="ghost"
          tooltip="Xem"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          <Eye />
        </IconButton>
      }
    />
  );
}

export default function QuestionsPage(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.vaiTro ?? null);
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    keyword: '',
    maMon: '',
    maDoKho: '',
  });
  const [viewing, setViewing] = useState<CauHoi | null>(null);
  const [deleting, setDeleting] = useState<CauHoi | null>(null);

  const params = useMemo<ListQuestionsParams>(
    () => ({
      page,
      limit: 10,
      keyword: filterValues.keyword || undefined,
      maMon: filterValues.maMon || undefined,
      maDoKho: filterValues.maDoKho ? Number(filterValues.maDoKho) : undefined,
    }),
    [page, filterValues.keyword, filterValues.maMon, filterValues.maDoKho],
  );

  const query = useQuery({
    queryKey: ['questions', params],
    queryFn: () => listQuestions(params),
  });

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'all-for-question-filter'],
    queryFn: () => listSubjects({ page: 1, limit: 500 }),
  });
  const diffsQuery = useQuery({ queryKey: ['difficulties'], queryFn: listDifficulties });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteQuestion(id),
    onSuccess: async () => {
      toast.success(MSG.DELETED);
      await queryClient.invalidateQueries({ queryKey: ['questions'] });
      setDeleting(null);
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) {
        toast.warning(MSG.FORBIDDEN);
      } else if (status === 409) {
        toast.error(getApiMessage(err, 'Câu hỏi đang được sử dụng'));
      } else {
        toast.error(getApiMessage(err, MSG.DELETE_FAILED));
      }
    },
  });

  const columns: DataTableColumn<CauHoi>[] = [
    {
      key: 'maCauHoi',
      header: 'Mã',
      className: 'w-20',
      render: (r) => <span className="font-mono">CH{r.maCauHoi}</span>,
    },
    {
      key: 'noiDung',
      header: 'Nội dung',
      render: (r) => <span title={r.noiDung}>{truncate(r.noiDung, 80)}</span>,
    },
    {
      key: 'monHoc',
      header: 'Môn',
      className: 'w-24',
      render: (r) => r.monHoc?.tenMon ?? r.maMon,
    },
    {
      key: 'doKho',
      header: 'Độ khó',
      className: 'w-28',
      render: (r) => <Badge variant="secondary">{r.doKho?.tenDoKho ?? `#${r.maDoKho}`}</Badge>,
    },
    {
      key: 'nguoiSoan',
      header: 'Người soạn',
      className: 'w-40',
      render: (r) => r.giangVien?.hoTen ?? r.maGV,
    },
    {
      key: 'ngayTao',
      header: 'Ngày tạo',
      className: 'w-28',
      render: (r) => formatDate(r.ngayTao),
    },
    {
      key: '__actions',
      header: '',
      className: 'w-32 text-right',
      render: (r) => (
        <QuestionRowActions
          question={r}
          onView={() => setViewing(r)}
          onEdit={() => router.push(`/questions/${r.maCauHoi}/edit`)}
          onDelete={() => setDeleting(r)}
        />
      ),
    },
  ];

  const subjectOptions = (subjectsQuery.data?.data ?? []).map((s) => ({
    value: s.maMon,
    label: `${s.maMon} — ${s.tenMon}`,
  }));
  const diffOptions = (diffsQuery.data ?? []).map((d) => ({
    value: String(d.maDoKho),
    label: d.tenDoKho,
  }));

  return (
    <AppShell title="Ngân hàng câu hỏi">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <FilterBar
            filters={[
              { type: 'input', key: 'keyword', placeholder: 'Tìm theo nội dung…' },
              { type: 'select', key: 'maMon', placeholder: 'Tất cả môn', options: subjectOptions },
              {
                type: 'select',
                key: 'maDoKho',
                placeholder: 'Tất cả độ khó',
                options: diffOptions,
              },
            ]}
            values={filterValues}
            onChange={(v) => {
              setFilterValues(v);
              setPage(1);
            }}
          />
          {role === 'giaovien' && (
            <Button onClick={() => router.push('/questions/new')}>
              <Plus className="h-4 w-4" aria-hidden />
              Soạn câu hỏi
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={query.data?.data ?? []}
          rowKey={(r) => r.maCauHoi}
          isLoading={query.isLoading}
        />
        <Pagination page={page} limit={10} total={query.data?.total ?? 0} onChange={setPage} />
      </div>

      <QuestionDetailModal
        open={viewing !== null}
        onOpenChange={(o) => {
          if (!o) setViewing(null);
        }}
        question={viewing}
      />

      <ConfirmDeleteModal
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
        itemLabel={
          deleting ? `CH${deleting.maCauHoi} — ${truncate(deleting.noiDung, 60)}` : undefined
        }
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.maCauHoi);
        }}
        loading={deleteMutation.isPending}
      />
    </AppShell>
  );
}
