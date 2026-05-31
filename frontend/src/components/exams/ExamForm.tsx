'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listSubjects } from '@/lib/api/subjects';
import { useExamForm, type ExamFormState } from '@/hooks/useExamForm';
import { useRegulations } from '@/hooks/useRegulations';
import { QuestionPicker } from './QuestionPicker';

interface ExamFormProps {
  initial?: Partial<ExamFormState>;
  lockSubject?: boolean;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (data: {
    maMon: string;
    hocKy: number;
    namHoc: string;
    thoiLuong: number;
    danhSachMaCauHoi: number[];
  }) => Promise<void> | void;
  onCancel?: () => void;
}

export function ExamForm({
  initial,
  lockSubject,
  submitting,
  submitLabel = 'Lưu đề',
  onSubmit,
  onCancel,
}: ExamFormProps): React.ReactElement {
  const { values: limits } = useRegulations();
  const { state, setField, setChosenIds, reset, validation } = useExamForm({
    initial,
    limits: {
      soCauToiDa: limits.SoCauToiDa,
      thoiLuongMin: limits.ThoiLuongMin,
      thoiLuongMax: limits.ThoiLuongMax,
    },
  });

  useEffect(() => {
    if (initial) {
      reset(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subjectsQuery = useQuery({
    queryKey: ['subjects', 'all-for-exam-form'],
    queryFn: () => listSubjects({ page: 1, limit: 500 }),
  });

  const subjectLocked = lockSubject || state.chosenIds.length > 0;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validation.ready) return;
    await onSubmit({
      maMon: state.maMon,
      hocKy: state.hocKy,
      namHoc: state.namHoc,
      thoiLuong: state.thoiLuong,
      danhSachMaCauHoi: state.chosenIds,
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 text-sm font-medium">Thông tin chung đề thi</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="maMon">Môn học *</Label>
            <Select
              value={state.maMon || undefined}
              onValueChange={(v: unknown) => setField('maMon', typeof v === 'string' ? v : '')}
              disabled={subjectLocked}
            >
              <SelectTrigger id="maMon">
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
            {subjectLocked && (
              <p className="text-[10px] text-muted-foreground">Bỏ chọn tất cả câu để đổi môn.</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hocKy">Học kỳ *</Label>
            <Select
              value={String(state.hocKy)}
              onValueChange={(v: unknown) =>
                setField('hocKy', typeof v === 'string' ? Number(v) : 1)
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="namHoc">Năm học *</Label>
            <Input
              id="namHoc"
              placeholder="2024-2025"
              value={state.namHoc}
              onChange={(e) => setField('namHoc', e.target.value)}
              aria-invalid={!validation.namHocValid}
            />
            {!validation.namHocValid && state.namHoc.length > 0 && (
              <p className="text-xs text-destructive">Năm học phải dạng YYYY-YYYY</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="thoiLuong">Thời lượng (phút) *</Label>
            <Input
              id="thoiLuong"
              type="number"
              min={1}
              value={state.thoiLuong}
              onChange={(e) => setField('thoiLuong', Number(e.target.value))}
              aria-invalid={!validation.thoiLuongValid}
            />
            <p
              className={`text-[10px] ${
                validation.thoiLuongValid ? 'text-muted-foreground' : 'text-destructive'
              }`}
            >
              {validation.thoiLuongValid
                ? `Quy định: ${limits.ThoiLuongMin}–${limits.ThoiLuongMax} phút`
                : validation.thoiLuongMessage}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-medium">
            Chọn câu hỏi{' '}
            <span className="text-xs text-muted-foreground">(tối đa {limits.SoCauToiDa} câu)</span>
          </h3>
          {!validation.countValid && state.chosenIds.length > 0 && (
            <span className="text-xs text-destructive">{validation.countMessage}</span>
          )}
        </div>
        <QuestionPicker
          maMon={state.maMon}
          chosenIds={state.chosenIds}
          maxQuestions={limits.SoCauToiDa}
          onChange={setChosenIds}
          disabled={submitting}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            Huỷ
          </Button>
        )}
        <Button type="submit" disabled={submitting || !validation.ready}>
          {submitting ? 'Đang lưu…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
