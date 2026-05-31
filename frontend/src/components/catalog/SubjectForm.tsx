'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormModal } from '@/components/common';
import { subjectCreateSchema, type SubjectCreateInput } from '@/lib/schemas/catalog';
import type { MonHoc } from '@/types/models';

const FORM_ID = 'subject-form';

interface SubjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: MonHoc | null;
  onSubmit: (data: SubjectCreateInput) => Promise<void>;
  submitting?: boolean;
}

export function SubjectForm({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
  submitting,
}: SubjectFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectCreateInput>({
    resolver: zodResolver(subjectCreateSchema),
    defaultValues: { maMon: '', tenMon: '', soTinChi: 1 },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      maMon: initial?.maMon ?? '',
      tenMon: initial?.tenMon ?? '',
      soTinChi: initial?.soTinChi ?? 1,
    });
  }, [open, initial, reset]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Thêm môn học' : 'Sửa môn học'}
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
          <Label htmlFor="maMon">Mã môn *</Label>
          <Input
            id="maMon"
            type="text"
            disabled={mode === 'edit'}
            aria-invalid={errors.maMon ? 'true' : 'false'}
            {...register('maMon')}
          />
          {errors.maMon && (
            <p role="alert" className="text-xs text-destructive">
              {errors.maMon.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenMon">Tên môn *</Label>
          <Input
            id="tenMon"
            type="text"
            aria-invalid={errors.tenMon ? 'true' : 'false'}
            {...register('tenMon')}
          />
          {errors.tenMon && (
            <p role="alert" className="text-xs text-destructive">
              {errors.tenMon.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="soTinChi">Số tín chỉ *</Label>
          <Input
            id="soTinChi"
            type="number"
            min={1}
            aria-invalid={errors.soTinChi ? 'true' : 'false'}
            {...register('soTinChi', { valueAsNumber: true })}
          />
          {errors.soTinChi && (
            <p role="alert" className="text-xs text-destructive">
              {errors.soTinChi.message}
            </p>
          )}
        </div>
      </form>
    </FormModal>
  );
}
