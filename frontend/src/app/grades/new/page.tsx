'use client';

import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore } from '@/lib/auth/store';
import { useRegulations } from '@/hooks/useRegulations';
import { createGrade } from '@/lib/api/grades';
import { listStudents } from '@/lib/api/students';
import { listClasses } from '@/lib/api/classes';
import { listExams } from '@/lib/api/exams';
import { gradeCreateSchema, type GradeCreateInput } from '@/lib/schemas/catalog';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { MSG } from '@/lib/constants/messages';
import { currentAcademicYear } from '@/lib/utils/academic-year';

export default function NewGradePage(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((s) => s.user?.vaiTro ?? null);
  const { values: limits } = useRegulations();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<GradeCreateInput>({
    resolver: zodResolver(gradeCreateSchema),
    defaultValues: {
      maSV: '',
      maLop: '',
      maDeThi: 0,
      hocKy: 1,
      namHoc: currentAcademicYear(),
      diemSo: 0,
      ghiChu: '',
    },
  });

  const studentsQuery = useQuery({
    queryKey: ['students', 'all-for-grade-form'],
    queryFn: () => listStudents({ page: 1, limit: 1000 }),
  });
  const classesQuery = useQuery({
    queryKey: ['classes', 'all-for-grade-form'],
    queryFn: () => listClasses({ page: 1, limit: 500 }),
  });
  const examsQuery = useQuery({
    queryKey: ['exams', 'all-for-grade-form'],
    queryFn: () => listExams({ page: 1, limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: GradeCreateInput) =>
      createGrade({
        maSV: data.maSV,
        maLop: data.maLop,
        maDeThi: data.maDeThi,
        hocKy: data.hocKy,
        namHoc: data.namHoc,
        diemSo: data.diemSo,
        ghiChu: typeof data.ghiChu === 'string' ? data.ghiChu : undefined,
      }),
    onSuccess: async () => {
      toast.success(MSG.CREATED);
      await queryClient.invalidateQueries({ queryKey: ['grades'] });
      router.push('/grades');
    },
    onError: (err) => {
      const status = getApiStatus(err);
      if (status === 403) toast.warning(MSG.FORBIDDEN);
      else if (status === 409) toast.error(getApiMessage(err, 'Đã có điểm cho đề thi này'));
      else toast.error(getApiMessage(err, MSG.CREATE_FAILED));
    },
  });

  if (role && role !== 'giaovien') {
    return (
      <AppShell title="Nhập điểm">
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Chỉ giảng viên được phép nhập điểm.
        </div>
      </AppShell>
    );
  }

  const allStudents = studentsQuery.data?.data ?? [];

  return (
    <AppShell title="Nhập điểm cho sinh viên">
      <form
        noValidate
        onSubmit={handleSubmit(async (d) => {
          await createMutation.mutateAsync(d);
        })}
        className="rounded-lg border bg-card p-5"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maSV">MSSV *</Label>
            <Input id="maSV" list="student-options" {...register('maSV')} />
            <datalist id="student-options">
              {allStudents.slice(0, 100).map((s) => (
                <option key={s.maSV} value={s.maSV}>
                  {s.hoTen}
                </option>
              ))}
            </datalist>
            {errors.maSV && (
              <p role="alert" className="text-xs text-destructive">
                {errors.maSV.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maLop">Lớp *</Label>
            <Controller
              control={control}
              name="maLop"
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={(v: unknown) => field.onChange(typeof v === 'string' ? v : '')}
                >
                  <SelectTrigger id="maLop">
                    <SelectValue placeholder="Chọn lớp" />
                  </SelectTrigger>
                  <SelectContent>
                    {(classesQuery.data?.data ?? []).map((c) => (
                      <SelectItem key={c.maLop} value={c.maLop}>
                        {c.maLop} — {c.tenLop}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.maLop && (
              <p role="alert" className="text-xs text-destructive">
                {errors.maLop.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maDeThi">Đề thi *</Label>
            <Controller
              control={control}
              name="maDeThi"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : undefined}
                  onValueChange={(v: unknown) =>
                    field.onChange(typeof v === 'string' ? Number(v) : 0)
                  }
                >
                  <SelectTrigger id="maDeThi">
                    <SelectValue placeholder="Chọn đề thi" />
                  </SelectTrigger>
                  <SelectContent>
                    {(examsQuery.data?.data ?? []).map((e) => (
                      <SelectItem key={e.maDeThi} value={String(e.maDeThi)}>
                        DT-{e.maDeThi} ({e.monHoc?.tenMon ?? e.maMon} – HK{e.hocKy})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.maDeThi && (
              <p role="alert" className="text-xs text-destructive">
                {errors.maDeThi.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hocKy">Học kỳ *</Label>
              <Controller
                control={control}
                name="hocKy"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(v: unknown) =>
                      field.onChange(typeof v === 'string' ? Number(v) : 1)
                    }
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
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="namHoc">Năm học *</Label>
              <Input id="namHoc" placeholder="2024-2025" {...register('namHoc')} />
              {errors.namHoc && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.namHoc.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="diemSo">
              Điểm số * ({limits.DiemMin}–{limits.DiemMax})
            </Label>
            <Input
              id="diemSo"
              type="number"
              step="0.1"
              min={limits.DiemMin}
              max={limits.DiemMax}
              {...register('diemSo', { valueAsNumber: true })}
            />
            {errors.diemSo && (
              <p role="alert" className="text-xs text-destructive">
                {errors.diemSo.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="ghiChu">Ghi chú</Label>
            <Textarea id="ghiChu" rows={3} {...register('ghiChu')} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/grades')}
            disabled={createMutation.isPending}
          >
            Huỷ
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Đang lưu…' : 'Lưu điểm'}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
