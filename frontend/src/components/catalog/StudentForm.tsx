'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormModal } from '@/components/common';
import { studentCreateSchema, type StudentCreateInput } from '@/lib/schemas/catalog';
import { listClasses } from '@/lib/api/classes';
import type { SinhVien } from '@/types/models';

const FORM_ID = 'student-form';

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: SinhVien | null;
  onSubmit: (data: StudentCreateInput) => Promise<void>;
  submitting?: boolean;
}

export function StudentForm({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
  submitting,
}: StudentFormProps): React.ReactElement {
  const classesQuery = useQuery({
    queryKey: ['classes', 'all-for-student-form'],
    queryFn: () => listClasses({ page: 1, limit: 500 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<StudentCreateInput>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: { maSV: '', hoTen: '', maLop: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      maSV: initial?.maSV ?? '',
      hoTen: initial?.hoTen ?? '',
      maLop: initial?.maLop ?? '',
    });
  }, [open, initial, reset]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Thêm sinh viên' : 'Sửa sinh viên'}
      formId={FORM_ID}
      submitting={submitting}
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={handleSubmit((d) => onSubmit(d))}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maSV">Mã sinh viên *</Label>
          <Input id="maSV" type="text" disabled={mode === 'edit'} {...register('maSV')} />
          {errors.maSV && (
            <p role="alert" className="text-xs text-destructive">
              {errors.maSV.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hoTen">Họ tên *</Label>
          <Input id="hoTen" type="text" {...register('hoTen')} />
          {errors.hoTen && (
            <p role="alert" className="text-xs text-destructive">
              {errors.hoTen.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maLop">Lớp học *</Label>
          <Controller
            control={control}
            name="maLop"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(v: unknown) => field.onChange(typeof v === 'string' ? v : '')}
              >
                <SelectTrigger id="maLop" className="w-full">
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
      </form>
    </FormModal>
  );
}
