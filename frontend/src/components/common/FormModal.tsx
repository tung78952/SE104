'use client';

import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  formId: string;
  submitting?: boolean;
  submitDisabled?: boolean;
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  submitLabel = 'Lưu',
  cancelLabel = 'Huỷ',
  formId,
  submitting,
  submitDisabled,
}: FormModalProps): React.ReactElement {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </DialogHeader>
        <div>{children}</div>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button type="submit" form={formId} disabled={submitting || submitDisabled}>
            {submitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            {submitting ? 'Đang lưu…' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
