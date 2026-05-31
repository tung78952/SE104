'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type FilterValue = string;

export type FilterDef =
  | {
      type: 'input';
      key: string;
      placeholder?: string;
      label?: string;
    }
  | {
      type: 'select';
      key: string;
      placeholder?: string;
      label?: string;
      options: { value: string; label: string }[];
    };

interface FilterBarProps {
  filters: FilterDef[];
  values: Record<string, FilterValue>;
  onChange: (values: Record<string, FilterValue>) => void;
  debounceMs?: number;
}

export function FilterBar({
  filters,
  values,
  onChange,
  debounceMs = 300,
}: FilterBarProps): React.ReactElement {
  const [local, setLocal] = useState<Record<string, FilterValue>>(values);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmittedRef = useRef<string>(JSON.stringify(values));

  useEffect(() => {
    const serialized = JSON.stringify(values);
    if (serialized !== lastEmittedRef.current) {
      lastEmittedRef.current = serialized;
      setLocal(values);
    }
  }, [values]);

  function emit(next: Record<string, FilterValue>): void {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastEmittedRef.current = JSON.stringify(next);
      onChange(next);
    }, debounceMs);
  }

  function emitImmediate(next: Record<string, FilterValue>): void {
    if (timer.current) clearTimeout(timer.current);
    lastEmittedRef.current = JSON.stringify(next);
    onChange(next);
  }

  return (
    <div className="flex flex-wrap items-end gap-3" data-testid="filter-bar">
      {filters.map((f) => {
        const id = `filter-${f.key}`;
        if (f.type === 'input') {
          return (
            <div key={f.key} className="flex flex-col gap-1">
              {f.label && <Label htmlFor={id}>{f.label}</Label>}
              <Input
                id={id}
                type="text"
                placeholder={f.placeholder}
                value={local[f.key] ?? ''}
                onChange={(e) => {
                  const next = { ...local, [f.key]: e.target.value };
                  setLocal(next);
                  emit(next);
                }}
                className="w-56"
              />
            </div>
          );
        }
        const current = local[f.key] ?? '';
        return (
          <div key={f.key} className="flex flex-col gap-1">
            {f.label && <Label htmlFor={id}>{f.label}</Label>}
            <Select
              value={current || 'all'}
              onValueChange={(raw: unknown) => {
                const v = typeof raw === 'string' ? raw : '';
                const v2 = v === 'all' ? '' : v;
                const next = { ...local, [f.key]: v2 };
                setLocal(next);
                emitImmediate(next);
              }}
            >
              <SelectTrigger className="w-56" id={id}>
                <SelectValue placeholder={f.placeholder ?? 'Tất cả'}>
                  {(value: string) => {
                    const fallback = f.placeholder ?? 'Tất cả';
                    if (value === 'all' || !value) return fallback;
                    return f.options.find((o) => o.value === value)?.label ?? value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{f.placeholder ?? 'Tất cả'}</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      })}
    </div>
  );
}
