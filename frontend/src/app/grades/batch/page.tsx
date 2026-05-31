'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
import { useAuthStore } from '@/lib/auth/store';
import { useRegulations } from '@/hooks/useRegulations';
import { useBatchGrades, buildPayloadEntries, validateEntry } from '@/hooks/useBatchGrades';
import { listClasses, getClass } from '@/lib/api/classes';
import { listExams } from '@/lib/api/exams';
import { createGradesBatch } from '@/lib/api/grades';
import { parseGradesCsv } from '@/lib/utils/csv';
import { gradesTemplateXlsx, parseGradesXlsx } from '@/lib/utils/excel';
import { downloadBlob } from '@/lib/utils/download';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import { currentAcademicYear } from '@/lib/utils/academic-year';
import { cn } from '@/lib/utils';

export default function BatchGradesPage(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.vaiTro ?? null);
  const { values: limits } = useRegulations();
  const [maLop, setMaLop] = useState('');
  const [maDeThi, setMaDeThi] = useState(0);
  const [hocKy, setHocKy] = useState(1);
  const [namHoc, setNamHoc] = useState(currentAcademicYear());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classesQuery = useQuery({
    queryKey: ['classes', 'all-for-batch'],
    queryFn: () => listClasses({ page: 1, limit: 500 }),
  });

  const classDetailQuery = useQuery({
    queryKey: ['classes', 'detail', maLop],
    queryFn: () => getClass(maLop),
    enabled: Boolean(maLop),
  });

  const classMaMon = classDetailQuery.data?.maMon ?? '';

  const examsQuery = useQuery({
    queryKey: ['exams', 'all-for-batch', classMaMon],
    queryFn: () => listExams({ page: 1, limit: 500, maMon: classMaMon }),
    enabled: Boolean(classMaMon),
  });

  const students = useMemo(
    () =>
      (classDetailQuery.data?.sinhViens ?? []).map((s) => ({
        maSV: s.maSV,
        hoTen: s.hoTen,
      })),
    [classDetailQuery.data?.sinhViens],
  );

  const { entries, setField, applyImport, summary } = useBatchGrades(students, {
    limits: { diemMin: limits.DiemMin, diemMax: limits.DiemMax },
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      createGradesBatch({
        maLop,
        maDeThi,
        hocKy,
        namHoc,
        danhSachDiem: buildPayloadEntries(entries),
      }),
    onSuccess: async (res) => {
      toast.success(`Đã lưu ${res.count} bản ghi điểm`);
      await queryClient.invalidateQueries({ queryKey: ['grades'] });
      router.push('/grades');
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else toast.error(getApiMessage(err, MSG.CREATE_FAILED));
    },
  });

  if (role && role !== 'giaovien') {
    return (
      <AppShell title="Nhập điểm hàng loạt">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Chỉ giảng viên được phép nhập điểm.
        </div>
      </AppShell>
    );
  }

  function handleDownloadTemplate(): void {
    const blob = gradesTemplateXlsx(students);
    downloadBlob(blob, `template-${maLop || 'class'}.xlsx`);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    let rows;
    if (file.name.endsWith('.xlsx')) {
      const buffer = await file.arrayBuffer();
      rows = parseGradesXlsx(buffer);
    } else {
      const text = await file.text();
      rows = parseGradesCsv(text);
    }
    if (rows.length === 0) {
      toast.error('File không hợp lệ hoặc thiếu cột maSV');
      return;
    }
    const { matched, skipped } = applyImport(rows);
    toast.success(`Đã import ${matched} dòng, bỏ qua ${skipped} dòng không khớp lớp`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const classOptions = (classesQuery.data?.data ?? []).map((c) => ({
    value: c.maLop,
    label: `${c.maLop} — ${c.tenLop}`,
  }));

  const canSubmit =
    maLop !== '' &&
    maDeThi > 0 &&
    /^\d{4}-\d{4}$/.test(namHoc) &&
    summary.invalidCount === 0 &&
    summary.filled > 0 &&
    !submitMutation.isPending;

  return (
    <AppShell title="Nhập điểm hàng loạt">
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-3 text-sm font-medium">Thông tin nhập điểm hàng loạt</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maLop">Lớp *</Label>
              <Select
                value={maLop || undefined}
                onValueChange={(v: unknown) => {
                  setMaLop(typeof v === 'string' ? v : '');
                  setMaDeThi(0);
                }}
              >
                <SelectTrigger id="maLop">
                  <SelectValue placeholder="Chọn lớp" />
                </SelectTrigger>
                <SelectContent>
                  {classOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maDeThi">Đề thi *</Label>
              <Select
                value={maDeThi ? String(maDeThi) : undefined}
                onValueChange={(v: unknown) => setMaDeThi(typeof v === 'string' ? Number(v) : 0)}
                disabled={!maLop}
              >
                <SelectTrigger id="maDeThi">
                  <SelectValue placeholder={maLop ? 'Chọn đề thi' : 'Chọn lớp trước'} />
                </SelectTrigger>
                <SelectContent>
                  {(examsQuery.data?.data ?? []).map((e) => (
                    <SelectItem key={e.maDeThi} value={String(e.maDeThi)}>
                      DT-{e.maDeThi} (HK{e.hocKy} – {e.namHoc})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hocKy">Học kỳ *</Label>
              <Select
                value={String(hocKy)}
                onValueChange={(v: unknown) => setHocKy(typeof v === 'string' ? Number(v) : 1)}
              >
                <SelectTrigger id="hocKy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">HK1</SelectItem>
                  <SelectItem value="2">HK2</SelectItem>
                  <SelectItem value="3">HK3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="namHoc">Năm học *</Label>
              <Input
                id="namHoc"
                placeholder="2024-2025"
                value={namHoc}
                onChange={(e) => setNamHoc(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDownloadTemplate}
              disabled={!maLop || students.length === 0}
            >
              <Download className="h-4 w-4" aria-hidden /> Tải template Excel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={!maLop}
            >
              <Upload className="h-4 w-4" aria-hidden /> Import từ file
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,text/csv"
              hidden
              onChange={handleImport}
              data-testid="batch-import-input"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="flex flex-wrap items-baseline gap-3 border-b px-4 py-2 text-sm">
            <span className="font-medium">
              {maLop ? `${maLop} – ${students.length} SV` : 'Chưa chọn lớp'}
            </span>
            <span data-testid="batch-summary" className="text-xs text-muted-foreground">
              Đã nhập: {summary.filled}/{summary.total}
              {summary.average !== null && (
                <>
                  {' '}
                  · Điểm TB: <span className="font-medium">{summary.average}</span>
                </>
              )}
              {summary.invalidCount > 0 && (
                <span className="text-destructive"> · {summary.invalidCount} dòng sai</span>
              )}
            </span>
          </div>

          {!maLop ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Chọn lớp để hiển thị danh sách sinh viên.
            </div>
          ) : students.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Lớp chưa có sinh viên.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">MSSV</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead className="w-32">
                    Điểm ({limits.DiemMin}–{limits.DiemMax})
                  </TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => {
                  const v = validateEntry(e, {
                    diemMin: limits.DiemMin,
                    diemMax: limits.DiemMax,
                  });
                  const invalid = v.isFilled && !v.isValid;
                  return (
                    <TableRow key={e.maSV}>
                      <TableCell className="font-mono">{e.maSV}</TableCell>
                      <TableCell>{e.hoTen}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.1"
                          inputMode="decimal"
                          aria-label={`Điểm ${e.maSV}`}
                          className={cn('w-24', invalid && 'border-destructive')}
                          value={e.diemSo}
                          onChange={(ev) => setField(e.maSV, 'diemSo', ev.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          aria-label={`Ghi chú ${e.maSV}`}
                          placeholder="Ghi chú…"
                          value={e.ghiChu}
                          onChange={(ev) => setField(e.maSV, 'ghiChu', ev.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-end gap-2 border-t p-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/grades')}
              disabled={submitMutation.isPending}
            >
              Huỷ
            </Button>
            <Button type="button" onClick={() => submitMutation.mutate()} disabled={!canSubmit}>
              {submitMutation.isPending ? 'Đang lưu…' : `Lưu ${summary.filled} dòng`}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
