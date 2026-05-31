'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Percent, Printer, TrendingUp, Users } from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
import { StatCard } from '@/components/dashboard/StatCard';
import { reportResultsByClass } from '@/lib/api/reports';
import { listSubjects } from '@/lib/api/subjects';
import { currentAcademicYear } from '@/lib/utils/academic-year';

export default function ResultsByClassReportPage(): React.ReactElement {
  const [namHoc, setNamHoc] = useState(currentAcademicYear());
  const [hocKyRaw, setHocKyRaw] = useState<string>('');
  const [maMon, setMaMon] = useState<string>('');
  const namHocValid = /^\d{4}-\d{4}$/.test(namHoc);
  const hocKy = hocKyRaw ? Number(hocKyRaw) : undefined;

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'all-for-report'],
    queryFn: () => listSubjects({ limit: 200 }),
  });

  const query = useQuery({
    queryKey: ['report', 'results-by-class', namHoc, hocKy, maMon],
    queryFn: () =>
      reportResultsByClass({
        namHoc,
        hocKy,
        maMon: maMon || undefined,
      }),
    enabled: namHocValid,
  });

  const rows = useMemo(() => query.data ?? [], [query.data]);

  const stats = useMemo(() => {
    if (rows.length === 0) {
      return { totalStudents: 0, averageScore: 0, passRate: 0, totalClasses: 0 };
    }
    const totalStudents = rows.reduce((s, r) => s + r.soSVDiThi, 0);
    const totalSiSo = rows.reduce((s, r) => s + r.siSo, 0);
    const weightedScore = rows.reduce((s, r) => s + r.diemTrungBinh * r.soSVDiThi, 0);
    const weightedPass = rows.reduce((s, r) => s + r.tiLeDat * r.soSVDiThi, 0);
    return {
      totalStudents,
      totalSiSo,
      averageScore: totalStudents ? weightedScore / totalStudents : 0,
      passRate: totalStudents ? weightedPass / totalStudents : 0,
      totalClasses: rows.length,
    };
  }, [rows]);

  // Gom theo mã lớp — nếu lớp có nhiều học kỳ thì weighted average theo số SV dự thi
  const chartData = useMemo(() => {
    const buckets = new Map<
      string,
      { maLop: string; sumScore: number; sumPass: number; sumSV: number }
    >();
    for (const r of rows) {
      const b = buckets.get(r.maLop) ?? { maLop: r.maLop, sumScore: 0, sumPass: 0, sumSV: 0 };
      b.sumScore += r.diemTrungBinh * r.soSVDiThi;
      b.sumPass += r.tiLeDat * r.soSVDiThi;
      b.sumSV += r.soSVDiThi;
      buckets.set(r.maLop, b);
    }
    return Array.from(buckets.values())
      .map((b) => ({
        maLop: b.maLop,
        diemTB: b.sumSV ? +(b.sumScore / b.sumSV).toFixed(2) : 0,
        tiLeDatPct: b.sumSV ? +((b.sumPass / b.sumSV) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => a.maLop.localeCompare(b.maLop));
  }, [rows]);

  return (
    <AppShell title="Báo cáo Kết quả theo Lớp">
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
            <div className="flex flex-col gap-1">
              <Label htmlFor="filter-maMon">Môn học</Label>
              <Select
                value={maMon || 'all'}
                onValueChange={(v: unknown) => {
                  const s = typeof v === 'string' ? v : '';
                  setMaMon(s === 'all' ? '' : s);
                }}
              >
                <SelectTrigger className="w-56" id="filter-maMon">
                  <SelectValue placeholder="Tất cả môn">
                    {(value: string) => {
                      if (value === 'all' || !value) return 'Tất cả môn';
                      const s = (subjectsQuery.data?.data ?? []).find((x) => x.maMon === value);
                      return s ? `${s.maMon} — ${s.tenMon}` : value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả môn</SelectItem>
                  {(subjectsQuery.data?.data ?? []).map((s) => (
                    <SelectItem key={s.maMon} value={s.maMon}>
                      {s.maMon} — {s.tenMon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            disabled={!query.data || rows.length === 0}
          >
            <Printer />
            In báo cáo
          </Button>
        </div>

        <header className="rounded-lg border bg-card p-4">
          <h1 className="text-base font-medium">Kết quả thi theo lớp — Năm học {namHoc}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {hocKy ? `Học kỳ ${hocKy}` : 'Cả 2 học kỳ'}
            {maMon ? ` · Môn ${maMon}` : ' · Tất cả môn'}
          </p>
        </header>

        {!namHocValid && (
          <p role="alert" className="text-sm text-destructive">
            Năm học phải có dạng YYYY-YYYY (ví dụ 2025-2026).
          </p>
        )}

        <div data-testid="report-stats" className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard
            label="Tổng SV dự thi"
            icon={Users}
            value={stats.totalStudents}
            loading={query.isLoading}
            hint="trên các lớp đã chọn"
          />
          <StatCard
            label="Điểm TB"
            icon={TrendingUp}
            value={
              query.isLoading || stats.totalStudents === 0 ? null : stats.averageScore.toFixed(2)
            }
            loading={query.isLoading}
            hint="trọng số theo số SV"
          />
          <StatCard
            label="Tỉ lệ đạt"
            icon={Percent}
            value={
              query.isLoading || stats.totalStudents === 0
                ? null
                : `${(stats.passRate * 100).toFixed(1)}%`
            }
            loading={query.isLoading}
            hint="trung bình có trọng số"
          />
          <StatCard
            label="Tổng lớp"
            icon={GraduationCap}
            value={stats.totalClasses}
            loading={query.isLoading}
            hint="đã có kết quả"
          />
        </div>

        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium">Điểm TB và Tỉ lệ đạt theo lớp</h2>
          {query.isLoading ? (
            <div
              data-testid="report-chart-loading"
              className="h-[280px] animate-pulse rounded bg-muted"
            />
          ) : chartData.length === 0 ? (
            <div
              data-testid="report-chart-empty"
              className="flex h-[280px] items-center justify-center text-sm text-muted-foreground"
            >
              Không có lớp nào có kết quả trong khoảng thời gian này.
            </div>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <ComposedChart data={chartData} margin={{ top: 8, right: 20, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="maLop"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 10]}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    width={42}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(14,165,233,0.06)' }}
                    contentStyle={{
                      borderRadius: 6,
                      fontSize: 12,
                      border: '1px solid #cbd5e1',
                      boxShadow: 'none',
                    }}
                    formatter={(value, name) => {
                      const v = typeof value === 'number' ? value : Number(value ?? 0);
                      return name === 'Tỉ lệ đạt' ? `${v.toFixed(1)}%` : v.toFixed(2);
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    yAxisId="left"
                    dataKey="diemTB"
                    name="Điểm TB"
                    fill="#38bdf8"
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="tiLeDatPct"
                    name="Tỉ lệ đạt"
                    stroke="#0369a1"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#0369a1' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-card">
          <h2 className="border-b p-3 text-sm font-medium">Chi tiết theo lớp</h2>
          {query.isLoading ? (
            <div className="p-4">
              <div className="flex flex-col gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-5 animate-pulse rounded bg-muted" />
                ))}
              </div>
            </div>
          ) : rows.length === 0 ? (
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
                  <TableHead>Mã lớp</TableHead>
                  <TableHead>Tên lớp</TableHead>
                  <TableHead>Môn</TableHead>
                  <TableHead className="w-14 text-center">HK</TableHead>
                  <TableHead className="text-right">Sĩ số</TableHead>
                  <TableHead className="text-right">Dự thi</TableHead>
                  <TableHead className="text-right">Điểm TB</TableHead>
                  <TableHead className="text-right">Tỉ lệ đạt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.maLop}-${r.hocKy}`}>
                    <TableCell className="font-mono">{r.maLop}</TableCell>
                    <TableCell>{r.tenLop}</TableCell>
                    <TableCell>{r.tenMon}</TableCell>
                    <TableCell className="text-center">{r.hocKy}</TableCell>
                    <TableCell className="text-right">{r.siSo}</TableCell>
                    <TableCell className="text-right">{r.soSVDiThi}</TableCell>
                    <TableCell className="text-right">{r.diemTrungBinh.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{(r.tiLeDat * 100).toFixed(1)}%</TableCell>
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
