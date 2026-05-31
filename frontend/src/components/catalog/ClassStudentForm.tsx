'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormModal } from '@/components/common';
import { classStudentSchema, type ClassStudentInput } from '@/lib/schemas/catalog';

const FORM_ID = 'class-student-form';

interface ClassStudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClassStudentInput) => Promise<void>;
  submitting?: boolean;
}

export function ClassStudentForm({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: ClassStudentFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassStudentInput>({
    resolver: zodResolver(classStudentSchema),
    defaultValues: { maSV: '', hoTen: '' },
  });

  useEffect(() => {
    if (open) reset({ maSV: '', hoTen: '' });
  }, [open, reset]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm sinh viên vào lớp"
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
          <Input id="maSV" type="text" {...register('maSV')} />
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
      </form>
    </FormModal>
  );
}
