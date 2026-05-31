'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Book, Building, FileText, HelpCircle, type LucideIcon } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { ExamsBarChart } from '@/components/dashboard/ExamsBarChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listSubjects } from '@/lib/api/subjects';
import { listClasses } from '@/lib/api/classes';
import { listQuestions } from '@/lib/api/questions';
import { listExams } from '@/lib/api/exams';
import { reportExamsBySubject, reportsOverview } from '@/lib/api/reports';
import { currentAcademicYear } from '@/lib/utils/academic-year';

const MAIN_CARDS: Array<{
  key: string;
  label: string;
  icon: LucideIcon;
  hint: string;
}> = [
  { key: 'subjects', label: 'Môn học', icon: Book, hint: 'trong hệ thống' },
  { key: 'classes', label: 'Lớp học', icon: Building, hint: 'đang hoạt động' },
  { key: 'questions', label: 'Câu hỏi', icon: HelpCircle, hint: 'trong ngân hàng' },
  { key: 'exams', label: 'Đề thi', icon: FileText, hint: 'đã lập' },
];

export default function DashboardPage(): React.ReactElement {
  const namHoc = currentAcademicYear();

  const subjectsQ = useQuery({
    queryKey: ['dashboard', 'count', 'subjects'],
    queryFn: () => listSubjects({ limit: 1 }),
  });
  const classesQ = useQuery({
    queryKey: ['dashboard', 'count', 'classes'],
    queryFn: () => listClasses({ limit: 1 }),
  });
  const questionsCountQ = useQuery({
    queryKey: ['dashboard', 'count', 'questions'],
    queryFn: () => listQuestions({ limit: 1 }),
  });
  const examsCountQ = useQuery({
    queryKey: ['dashboard', 'count', 'exams'],
    queryFn: () => listExams({ limit: 1 }),
  });

  const recentExamsQ = useQuery({
    queryKey: ['dashboard', 'recent', 'exams'],
    queryFn: () => listExams({ limit: 5 }),
  });
  const recentQuestionsQ = useQuery({
    queryKey: ['dashboard', 'recent', 'questions'],
    queryFn: () => listQuestions({ limit: 5 }),
  });

  const chartQ = useQuery({
    queryKey: ['dashboard', 'chart', 'exams-by-subject', namHoc],
    queryFn: () => reportExamsBySubject({ namHoc }),
    select: (rows) => {
      const agg = new Map<string, { maMon: string; tenMon: string; soLuongDeThi: number }>();
      for (const r of rows) {
        const prev = agg.get(r.maMon);
        if (prev) prev.soLuongDeThi += r.soLuongDeThi;
        else agg.set(r.maMon, { maMon: r.maMon, tenMon: r.tenMon, soLuongDeThi: r.soLuongDeThi });
      }
      return Array.from(agg.values());
    },
  });

  const overviewQ = useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: reportsOverview,
  });

  const counts: Record<string, { value: number | null; loading: boolean }> = {
    subjects: { value: subjectsQ.data?.total ?? null, loading: subjectsQ.isLoading },
    classes: { value: classesQ.data?.total ?? null, loading: classesQ.isLoading },
    questions: {
      value: questionsCountQ.data?.total ?? null,
      loading: questionsCountQ.isLoading,
    },
    exams: { value: examsCountQ.data?.total ?? null, loading: examsCountQ.isLoading },
  };

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-4">
        <div data-testid="dashboard-stats" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {MAIN_CARDS.map((c) => (
            <StatCard
              key={c.key}
              label={c.label}
              icon={c.icon}
              value={counts[c.key].value}
              loading={counts[c.key].loading}
              hint={c.hint}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChartCard
            title="Đề thi gần đây"
            action={
              <Link href="/exams" className="text-xs text-muted-foreground hover:text-foreground">
                Xem tất cả →
              </Link>
            }
          >
            {recentExamsQ.isLoading ? (
              <SkeletonRows rows={4} cols={5} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đề</TableHead>
                    <TableHead>Môn</TableHead>
                    <TableHead>HK</TableHead>
                    <TableHead>Người lập</TableHead>
                    <TableHead>Ngày</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExamsQ.data?.data?.length ? (
                    recentExamsQ.data.data.map((exam) => (
                      <TableRow key={exam.maDeThi}>
                        <TableCell>DT-{exam.maDeThi}</TableCell>
                        <TableCell>{exam.monHoc?.tenMon ?? exam.maMon}</TableCell>
                        <TableCell>HK{exam.hocKy}</TableCell>
                        <TableCell>{exam.giangVien?.hoTen ?? '—'}</TableCell>
                        <TableCell>{formatDate(exam.ngayTao)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
                        Chưa có đề thi
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </ChartCard>

          <ChartCard
            title="Câu hỏi mới tạo"
            action={
              <Link
                href="/questions"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Xem tất cả →
              </Link>
            }
          >
            {recentQuestionsQ.isLoading ? (
              <SkeletonRows rows={4} cols={1} />
            ) : (
              <ol className="flex flex-col gap-2">
                {recentQuestionsQ.data?.data?.length ? (
                  recentQuestionsQ.data.data.map((q, idx) => (
                    <li
                      key={q.maCauHoi}
                      className="flex items-start gap-2 rounded-md border bg-muted/30 p-2"
                    >
                      <div
                        aria-hidden
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-card text-[10px] font-medium"
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs">{q.noiDung}</div>
                        <div className="mt-0.5 text-[10px] text-muted-foreground">
                          {q.giangVien?.hoTen ?? '—'} — {q.doKho?.tenDoKho ?? '—'}
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-center text-xs text-muted-foreground">Chưa có câu hỏi</li>
                )}
              </ol>
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <ChartCard title={`Số đề thi theo môn – ${namHoc}`}>
            {chartQ.isLoading ? (
              <div className="h-[200px] animate-pulse rounded bg-muted" />
            ) : (
              <ExamsBarChart data={chartQ.data ?? []} />
            )}
          </ChartCard>

          <ChartCard title="Tổng quan hệ thống">
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="Sinh viên"
                value={overviewQ.data?.studentCount ?? null}
                loading={overviewQ.isLoading}
              />
              <StatCard
                label={overviewQ.data?.role === 'giaovien' ? 'Bảng điểm liên quan' : 'Bảng điểm'}
                value={overviewQ.data?.gradeCount ?? null}
                loading={overviewQ.isLoading}
              />
              {overviewQ.data?.role === 'giaovien' ? (
                <>
                  <StatCard
                    label="Câu hỏi của tôi"
                    value={overviewQ.data.ownQuestionCount}
                    loading={false}
                    hint="đã soạn"
                  />
                  <StatCard
                    label="Điểm TB đề của tôi"
                    value={
                      overviewQ.data.averageScore !== null
                        ? overviewQ.data.averageScore.toFixed(2)
                        : '—'
                    }
                    loading={false}
                    hint="trung bình"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    label="Giảng viên"
                    value={overviewQ.data?.role === 'admin' ? overviewQ.data.teacherCount : null}
                    loading={overviewQ.isLoading}
                    hint="trong hệ thống"
                  />
                  <StatCard
                    label="Điểm TB"
                    value={
                      overviewQ.data?.role === 'admin' && overviewQ.data.averageScore !== null
                        ? overviewQ.data.averageScore.toFixed(2)
                        : null
                    }
                    loading={overviewQ.isLoading}
                    hint="toàn hệ thống"
                  />
                </>
              )}
            </div>
          </ChartCard>
        </div>
      </div>
    </AppShell>
  );
}

function SkeletonRows({ rows, cols }: { rows: number; cols: number }): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-2">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="h-5 flex-1 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ))}
    </div>
  );
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}
