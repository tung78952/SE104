'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({
  page,
  limit,
  total,
  onChange,
}: PaginationProps): React.ReactElement | null {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit + 1;
  const end = Math.min(safePage * limit, total);

  const pages: number[] = [];
  const window = 5;
  let from = Math.max(1, safePage - 2);
  const to = Math.min(totalPages, from + window - 1);
  from = Math.max(1, to - window + 1);
  for (let i = from; i <= to; i++) pages.push(i);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-1 py-2 text-sm"
      data-testid="pagination"
    >
      <div className="text-muted-foreground">
        {start}-{end} / {total} kết quả
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Trang trước"
          disabled={safePage <= 1}
          onClick={() => onChange(safePage - 1)}
        >
          <ChevronLeft />
        </Button>
        {pages.map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            aria-current={p === safePage ? 'page' : undefined}
            variant={p === safePage ? 'default' : 'outline'}
            onClick={() => onChange(p)}
          >
            {p}
          </Button>
        ))}
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label="Trang sau"
          disabled={safePage >= totalPages}
          onClick={() => onChange(safePage + 1)}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
