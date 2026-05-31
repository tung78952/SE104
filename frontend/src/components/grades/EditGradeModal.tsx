'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormModal } from '@/components/common/FormModal';
import { gradeUpdateSchema, type GradeUpdateInput } from '@/lib/schemas/catalog';
import { useRegulations } from '@/hooks/useRegulations';
import type { BangDiem } from '@/types/models';

const FORM_ID = 'edit-grade-form';

interface EditGradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: BangDiem | null;
  submitting?: boolean;
  onSubmit: (data: GradeUpdateInput) => Promise<void>;
}

export function EditGradeModal({
  open,
  onOpenChange,
  grade,
  submitting,
  onSubmit,
}: EditGradeModalProps): React.ReactElement {
  const { values: limits } = useRegulations();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<GradeUpdateInput>({
    resolver: zodResolver(gradeUpdateSchema),
    defaultValues: { diemSo: 0, hocKy: 1, ghiChu: '' },
  });

  useEffect(() => {
    if (!open || !grade) return;
    reset({
      diemSo: typeof grade.diemSo === 'string' ? Number(grade.diemSo) : grade.diemSo,
      hocKy: grade.hocKy,
      ghiChu: grade.ghiChu ?? '',
    });
  }, [open, grade, reset]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={grade ? `Sửa điểm – ${grade.sinhVien?.hoTen ?? grade.maSV}` : 'Sửa điểm'}
      formId={FORM_ID}
      submitting={submitting}
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={handleSubmit(async (d) => onSubmit(d))}
        className="flex flex-col gap-3"
      >
        {grade && (
          <div className="grid grid-cols-3 gap-2 rounded-md border bg-muted/30 p-2 text-xs">
            <div>
              <div className="text-muted-foreground">Sinh viên</div>
              <div className="font-medium">{grade.sinhVien?.hoTen ?? grade.maSV}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Lớp</div>
              <div className="font-medium">{grade.maLop}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Đề thi</div>
              <div className="font-medium">DT-{grade.maDeThi}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
              aria-invalid={errors.diemSo ? 'true' : 'false'}
            />
            {errors.diemSo && (
              <p role="alert" className="text-xs text-destructive">
                {errors.diemSo.message}
              </p>
            )}
          </div>

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
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ghiChu">Ghi chú</Label>
          <Textarea id="ghiChu" rows={3} {...register('ghiChu')} />
        </div>
      </form>
    </FormModal>
  );
}
