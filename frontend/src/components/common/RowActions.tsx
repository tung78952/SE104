'use client';

import { type ReactNode } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';

interface RowActionsProps {
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  extra?: ReactNode;
}

export function RowActions({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  extra,
}: RowActionsProps): React.ReactElement | null {
  if (!canEdit && !canDelete && !extra) return null;
  return (
    <div className="flex items-center gap-1">
      {extra}
      {canEdit && (
        <IconButton
          type="button"
          size="icon-sm"
          variant="ghost"
          tooltip="Sửa"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
        >
          <Pencil />
        </IconButton>
      )}
      {canDelete && (
        <IconButton
          type="button"
          size="icon-sm"
          variant="ghost"
          tooltip="Xoá"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          <Trash2 className="text-destructive" />
        </IconButton>
      )}
    </div>
  );
}
