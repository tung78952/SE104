'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reportExamsBySubject, type ExamsBySubjectRow } from '@/lib/api/reports';
import { currentAcademicYear } from '@/lib/utils/academic-year';

interface AggregatedRow {
  maMon: string;
  tenMon: string;
  hk1: number;
  hk2: number;
  tong: number;
}

function aggregate(rows: ExamsBySubjectRow[]): AggregatedRow[] {
  const map = new Map<string, AggregatedRow>();
  for (const r of rows) {
    const cur = map.get(r.maMon) ?? {
      maMon: r.maMon,
      tenMon: r.tenMon,
      hk1: 0,
      hk2: 0,
      tong: 0,
    };
    if (r.hocKy === 1) cur.hk1 += r.soLuongDeThi;
    else if (r.hocKy === 2) cur.hk2 += r.soLuongDeThi;
    cur.tong += r.soLuongDeThi;
    map.set(r.maMon, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.tong - a.tong);
}

export default function ExamsBySubjectReportPage(): React.ReactElement {
  const [namHoc, setNamHoc] = useState(currentAcademicYear());
  const [hocKyRaw, setHocKyRaw] = useState<string>('');
  const namHocValid = /^\d{4}-\d{4}$/.test(namHoc);

  const hocKy = hocKyRaw ? Number(hocKyRaw) : undefined;
  const query = useQuery({
    queryKey: ['report', 'exams-by-subject', namHoc, hocKy],
    queryFn: () => reportExamsBySubject({ namHoc, hocKy }),
    enabled: namHocValid,
  });

  const aggregated = useMemo(() => aggregate(query.data ?? []), [query.data]);
  const totalExams = aggregated.reduce((s, r) => s + r.tong, 0);

  return (
    <AppShell title="Báo cáo Đề thi theo Môn">
      <div className="flex flex-col gap-4 print-area">
        <div data-print-hide className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="filter-namHoc">
                Năm học <span className="text-destructive">*</span>
              </Label>
              <Input
                id="filter-namHoc"
                type="text"
                placeholder="2025-2026"
                value={namHoc}
                onChange={(e) => setNamHoc(e.target.value)}
                aria-invalid={!namHocValid}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="filter-hocKy">Học kỳ</Label>
              <Select
                value={hocKyRaw || 'all'}
                onValueChange={(v: unknown) => {
                  const s = typeof v === 'string' ? v : '';
                  setHocKyRaw(s === 'all' ? '' : s);
                }}
              >
                <SelectTrigger className="w-40" id="filter-hocKy">
                  <SelectValue placeholder="Tất cả học kỳ">
                    {(value: string) => {
                      if (value === 'all' || !value) return 'Tất cả học kỳ';
                      if (value === '1') return 'Học kỳ 1';
                      if (value === '2') return 'Học kỳ 2';
                      return value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả học kỳ</SelectItem>
                  <SelectItem value="1">Học kỳ 1</SelectItem>
                  <SelectItem value="2">Học kỳ 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            disabled={!query.data || aggregated.length === 0}
          >
            <Printer />
            In báo cáo
          </Button>
        </div>

        <header className="rounded-lg border bg-card p-4">
          <h1 className="text-base font-medium">Số lượng đề thi theo môn — Năm học {namHoc}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {hocKy ? `Học kỳ ${hocKy}` : 'Cả 2 học kỳ'} · Tổng {totalExams} đề thi trên{' '}
            {aggregated.length} môn
          </p>
        </header>

        {!namHocValid && (
          <p role="alert" className="text-sm text-destructive">
            Năm học phải có dạng YYYY-YYYY (ví dụ 2025-2026).
          </p>
        )}

        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium">Biểu đồ</h2>
          {query.isLoading ? (
            <div
              data-testid="report-chart-loading"
              className="h-[260px] animate-pulse rounded bg-muted"
            />
          ) : aggregated.length === 0 ? (
            <div
              data-testid="report-chart-empty"
              className="flex h-[260px] items-center justify-center text-sm text-muted-foreground"
            >
              Không có đề thi nào trong khoảng thời gian này.
            </div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={aggregated} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="maMon"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(14,165,233,0.06)' }}
                    contentStyle={{
                      borderRadius: 6,
                      fontSize: 12,
                      border: '1px solid #cbd5e1',
                      boxShadow: 'none',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="hk1" name="HK1" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="hk2" name="HK2" fill="#0369a1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card">
          <h2 className="border-b p-3 text-sm font-medium">Bảng số liệu</h2>
          {query.isLoading ? (
            <div className="p-4">
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-5 animate-pulse rounded bg-muted" />
                ))}
              </div>
            </div>
          ) : aggregated.length === 0 ? (
            <div
              data-testid="report-table-empty"
              className="p-8 text-center text-sm text-muted-foreground"
            >
              Không có dữ liệu để hiển thị.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Mã môn</TableHead>
                  <TableHead>Tên môn</TableHead>
                  <TableHead className="w-20 text-right">HK1</TableHead>
                  <TableHead className="w-20 text-right">HK2</TableHead>
                  <TableHead className="w-24 text-right">Tổng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aggregated.map((r) => (
                  <TableRow key={r.maMon}>
                    <TableCell className="font-mono">{r.maMon}</TableCell>
                    <TableCell>{r.tenMon}</TableCell>
                    <TableCell className="text-right">{r.hk1}</TableCell>
                    <TableCell className="text-right">{r.hk2}</TableCell>
                    <TableCell className="text-right font-semibold">{r.tong}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </AppShell>
  );
}
