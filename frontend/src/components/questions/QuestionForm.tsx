'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
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
import { listSubjects } from '@/lib/api/subjects';
import { listDifficulties } from '@/lib/api/difficulties';
import { questionSchema, type QuestionInput } from '@/lib/schemas/catalog';

interface QuestionFormProps {
  initial?: Partial<QuestionInput> | null;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (data: QuestionInput) => Promise<void> | void;
  onCancel?: () => void;
}

export function QuestionForm({
  initial,
  submitting,
  submitLabel = 'Lưu câu hỏi',
  onSubmit,
  onCancel,
}: QuestionFormProps): React.ReactElement {
  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'all-for-question-form'],
    queryFn: () => listSubjects({ page: 1, limit: 500 }),
  });
  const diffsQuery = useQuery({
    queryKey: ['difficulties'],
    queryFn: listDifficulties,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      maMon: initial?.maMon ?? '',
      maDoKho: initial?.maDoKho ?? 0,
      noiDung: initial?.noiDung ?? '',
    },
  });

  useEffect(() => {
    reset({
      maMon: initial?.maMon ?? '',
      maDoKho: initial?.maDoKho ?? 0,
      noiDung: initial?.noiDung ?? '',
    });
  }, [initial, reset]);

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (d) => onSubmit(d))}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <SelectValue placeholder="Chọn môn" />
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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="maDoKho">Độ khó *</Label>
          <Controller
            control={control}
            name="maDoKho"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : undefined}
                onValueChange={(v: unknown) =>
                  field.onChange(typeof v === 'string' ? Number(v) : 0)
                }
              >
                <SelectTrigger id="maDoKho" className="w-full">
                  <SelectValue placeholder="Chọn độ khó">
                    {diffsQuery.data?.find((d) => d.maDoKho === field.value)?.tenDoKho}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(diffsQuery.data ?? []).map((d) => (
                    <SelectItem key={d.maDoKho} value={String(d.maDoKho)}>
                      {d.tenDoKho}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.maDoKho && (
            <p role="alert" className="text-xs text-destructive">
              {errors.maDoKho.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="noiDung">Nội dung câu hỏi *</Label>
        <Textarea
          id="noiDung"
          rows={8}
          aria-invalid={errors.noiDung ? 'true' : 'false'}
          {...register('noiDung')}
        />
        {errors.noiDung && (
          <p role="alert" className="text-xs text-destructive">
            {errors.noiDung.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Huỷ
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Đang lưu…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
