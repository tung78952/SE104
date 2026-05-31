'use client';

import { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from './DataTable';
import { FilterBar, type FilterDef, type FilterValue } from './FilterBar';
import { Pagination } from './Pagination';

interface ResourcePageProps<T> {
  header?: ReactNode;
  filters?: FilterDef[];
  filterValues?: Record<string, FilterValue>;
  onFilterChange?: (values: Record<string, FilterValue>) => void;
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  canCreate?: boolean;
  createLabel?: string;
  onCreate?: () => void;
  toolbarExtra?: ReactNode;
}

export function ResourcePage<T>({
  header,
  filters,
  filterValues,
  onFilterChange,
  columns,
  data,
  rowKey,
  isLoading,
  emptyMessage,
  onRowClick,
  page,
  limit,
  total,
  onPageChange,
  canCreate,
  createLabel = 'Thêm mới',
  onCreate,
  toolbarExtra,
}: ResourcePageProps<T>): React.ReactElement {
  return (
    <div className="flex flex-col gap-3">
      {header}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {filters && filterValues && onFilterChange ? (
          <FilterBar filters={filters} values={filterValues} onChange={onFilterChange} />
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {toolbarExtra}
          {canCreate && onCreate && (
            <Button type="button" onClick={onCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              {createLabel}
            </Button>
          )}
        </div>
      </div>
      <DataTable
        columns={columns}
        data={data}
        rowKey={rowKey}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        emptyAction={
          canCreate && onCreate ? (
            <Button type="button" size="sm" variant="outline" onClick={onCreate}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {createLabel}
            </Button>
          ) : undefined
        }
        onRowClick={onRowClick}
      />
      <Pagination page={page} limit={limit} total={total} onChange={onPageChange} />
    </div>
  );
}
