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
import { classCreateSchema, type ClassCreateInput } from '@/lib/schemas/catalog';
import { listSubjects } from '@/lib/api/subjects';
import type { LopHoc } from '@/types/models';

const FORM_ID = 'class-form';

interface ClassFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: LopHoc | null;
  onSubmit: (data: ClassCreateInput) => Promise<void>;
  submitting?: boolean;
}

export function ClassForm({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
  submitting,
}: ClassFormProps): React.ReactElement {
  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'all'],
    queryFn: () => listSubjects({ page: 1, limit: 200 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ClassCreateInput>({
    resolver: zodResolver(classCreateSchema),
    defaultValues: { maLop: '', tenLop: '', maMon: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      maLop: initial?.maLop ?? '',
      tenLop: initial?.tenLop ?? '',
      maMon: initial?.maMon ?? '',
    });
  }, [open, initial, reset]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Thêm lớp học' : 'Sửa lớp học'}
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
          <Label htmlFor="maLop">Mã lớp *</Label>
          <Input id="maLop" type="text" disabled={mode === 'edit'} {...register('maLop')} />
          {errors.maLop && (
            <p role="alert" className="text-xs text-destructive">
              {errors.maLop.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenLop">Tên lớp *</Label>
          <Input id="tenLop" type="text" {...register('tenLop')} />
          {errors.tenLop && (
            <p role="alert" className="text-xs text-destructive">
              {errors.tenLop.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maMon">Môn học *</Label>
          <Controller
            control={control}
            name="maMon"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(v: unknown) => field.onChange(typeof v === 'string' ? v : '')}
              >
                <SelectTrigger id="maMon" className="w-full">
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  {(subjectsQuery.data?.data ?? []).map((s) => (
                    <SelectItem key={s.maMon} value={s.maMon}>
                      {s.maMon} — {s.tenMon}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.maMon && (
            <p role="alert" className="text-xs text-destructive">
              {errors.maMon.message}
            </p>
          )}
        </div>
      </form>
    </FormModal>
  );
}
