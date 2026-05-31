'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormModal } from '@/components/common';
import { difficultySchema, type DifficultyInput } from '@/lib/schemas/catalog';
import type { DoKho } from '@/types/models';

const FORM_ID = 'difficulty-form';

interface DifficultyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: DoKho | null;
  onSubmit: (data: DifficultyInput) => Promise<void>;
  submitting?: boolean;
}

export function DifficultyForm({
  open,
  onOpenChange,
  mode,
  initial,
  onSubmit,
  submitting,
}: DifficultyFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DifficultyInput>({
    resolver: zodResolver(difficultySchema),
    defaultValues: { tenDoKho: '' },
  });

  useEffect(() => {
    if (open) reset({ tenDoKho: initial?.tenDoKho ?? '' });
  }, [open, initial, reset]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Thêm độ khó' : 'Sửa độ khó'}
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
          <Label htmlFor="tenDoKho">Tên độ khó *</Label>
          <Input id="tenDoKho" type="text" {...register('tenDoKho')} />
          {errors.tenDoKho && (
            <p role="alert" className="text-xs text-destructive">
              {errors.tenDoKho.message}
            </p>
          )}
        </div>
      </form>
    </FormModal>
  );
}
