'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { IconButton } from '@/components/ui/icon-button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { listQuestions } from '@/lib/api/questions';
import { listDifficulties } from '@/lib/api/difficulties';
import type { CauHoi } from '@/types/models';

interface QuestionPickerProps {
  maMon: string;
  chosenIds: number[];
  maxQuestions: number;
  onChange: (next: number[]) => void;
  disabled?: boolean;
}

export function QuestionPicker({
  maMon,
  chosenIds,
  maxQuestions,
  onChange,
  disabled,
}: QuestionPickerProps): React.ReactElement {
  const [search, setSearch] = useState('');
  const [maDoKho, setMaDoKho] = useState('');

  const bankQuery = useQuery({
    queryKey: ['questions', 'bank', { maMon, search, maDoKho }],
    queryFn: () =>
      listQuestions({
        maMon: maMon || undefined,
        keyword: search || undefined,
        maDoKho: maDoKho ? Number(maDoKho) : undefined,
        page: 1,
        limit: 200,
      }),
    enabled: Boolean(maMon),
  });

  const diffsQuery = useQuery({ queryKey: ['difficulties'], queryFn: listDifficulties });

  const chosenSet = useMemo(() => new Set(chosenIds), [chosenIds]);
  const chosenQuestions = useMemo(() => {
    const byId = new Map<number, CauHoi>();
    for (const q of bankQuery.data?.data ?? []) byId.set(q.maCauHoi, q);
    return chosenIds.map((id) => byId.get(id)).filter(Boolean) as CauHoi[];
  }, [bankQuery.data, chosenIds]);

  const limitReached = chosenIds.length >= maxQuestions;

  function toggle(id: number): void {
    if (chosenSet.has(id)) {
      onChange(chosenIds.filter((x) => x !== id));
    } else {
      if (limitReached) return;
      onChange([...chosenIds, id]);
    }
  }

  function move(from: number, dir: -1 | 1): void {
    const to = from + dir;
    if (to < 0 || to >= chosenIds.length) return;
    const next = [...chosenIds];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  }

  function remove(id: number): void {
    onChange(chosenIds.filter((x) => x !== id));
  }

  if (!maMon) {
    return (
      <div
        data-testid="question-picker-no-subject"
        className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground"
      >
        Vui lòng chọn môn học trước khi chọn câu hỏi.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="flex flex-col rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium">
          <span>Ngân hàng câu hỏi</span>
          <span className="text-xs text-muted-foreground">{bankQuery.data?.total ?? 0} câu</span>
        </div>
        <div className="flex flex-col gap-2 border-b px-3 py-2">
          <Input
            placeholder="Tìm theo nội dung…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            value={maDoKho || 'all'}
            onValueChange={(v: unknown) => {
              const raw = typeof v === 'string' ? v : '';
              setMaDoKho(raw === 'all' ? '' : raw);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tất cả độ khó">
                {(value: string) => {
                  if (value === 'all' || !value) return 'Tất cả độ khó';
                  const d = (diffsQuery.data ?? []).find((x) => String(x.maDoKho) === value);
                  return d?.tenDoKho ?? value;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả độ khó</SelectItem>
              {(diffsQuery.data ?? []).map((d) => (
                <SelectItem key={d.maDoKho} value={String(d.maDoKho)}>
                  {d.tenDoKho}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div data-testid="question-bank-list" className="flex max-h-80 flex-col overflow-y-auto">
          {bankQuery.isLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Đang tải…</div>
          ) : (bankQuery.data?.data ?? []).length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Không có câu hỏi cho môn này.
            </div>
          ) : (
            (bankQuery.data?.data ?? []).map((q) => {
              const checked = chosenSet.has(q.maCauHoi);
              const canCheck = checked || !limitReached;
              return (
                <label
                  key={q.maCauHoi}
                  className="flex cursor-pointer items-start gap-2 border-b px-3 py-2 text-sm hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={checked}
                    disabled={disabled || !canCheck}
                    onChange={() => toggle(q.maCauHoi)}
                    aria-label={`Câu hỏi ${q.maCauHoi}`}
                  />
                  <span className="flex-1 leading-snug">
                    <span className="text-[10px] text-muted-foreground">CH{q.maCauHoi}</span>{' '}
                    {q.noiDung}
                  </span>
                  <Badge variant="secondary" className="shrink-0">
                    {q.doKho?.tenDoKho ?? `#${q.maDoKho}`}
                  </Badge>
                </label>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-col rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-3 py-2 text-sm font-medium">
          <span>Câu đã chọn</span>
          <span
            data-testid="chosen-count"
            className={`text-xs ${limitReached ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {chosenIds.length} / {maxQuestions}
          </span>
        </div>
        {limitReached && (
          <div
            data-testid="picker-limit-warning"
            className="border-b bg-destructive/10 px-3 py-1.5 text-xs text-destructive"
          >
            Đã đạt giới hạn {maxQuestions} câu. Bỏ chọn một câu để thêm câu khác.
          </div>
        )}
        <div className="flex max-h-80 flex-col overflow-y-auto">
          {chosenQuestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Chưa chọn câu hỏi nào.
            </div>
          ) : (
            chosenQuestions.map((q, idx) => (
              <div key={q.maCauHoi} className="flex items-start gap-2 border-b px-3 py-2 text-sm">
                <span className="min-w-6 text-xs text-muted-foreground">{idx + 1}.</span>
                <span className="flex-1 leading-snug">{q.noiDung}</span>
                <div className="flex shrink-0 gap-1">
                  <IconButton
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    tooltip="Di chuyển lên"
                    disabled={disabled || idx === 0}
                    onClick={() => move(idx, -1)}
                  >
                    <ArrowUp />
                  </IconButton>
                  <IconButton
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    tooltip="Di chuyển xuống"
                    disabled={disabled || idx === chosenQuestions.length - 1}
                    onClick={() => move(idx, 1)}
                  >
                    <ArrowDown />
                  </IconButton>
                  <IconButton
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    tooltip="Xoá khỏi đề"
                    disabled={disabled}
                    onClick={() => remove(q.maCauHoi)}
                  >
                    <X className="text-destructive" />
                  </IconButton>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
