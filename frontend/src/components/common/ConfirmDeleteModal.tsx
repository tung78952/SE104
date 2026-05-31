'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MSG } from '@/lib/constants/messages';

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  itemLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  title = MSG.CONFIRM_DELETE_TITLE,
  description = MSG.CONFIRM_DELETE_DESC,
  itemLabel,
  onConfirm,
  loading,
}: ConfirmDeleteModalProps): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden /> {title}
          </DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          <p>{description}</p>
          {itemLabel && <p className="mt-2 font-medium text-foreground">{itemLabel}</p>}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Huỷ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void onConfirm()}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            {loading ? 'Đang xoá…' : 'Xoá'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
