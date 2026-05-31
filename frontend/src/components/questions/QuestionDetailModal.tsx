'use client';

import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsOwner } from '@/hooks/useIsOwner';
import type { CauHoi } from '@/types/models';

interface QuestionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: CauHoi | null;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN');
}

export function QuestionDetailModal({
  open,
  onOpenChange,
  question,
}: QuestionDetailModalProps): React.ReactElement {
  const router = useRouter();
  const { isOwner } = useIsOwner(question?.maGV);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết câu hỏi {question ? `– CH${question.maCauHoi}` : ''}</DialogTitle>
        </DialogHeader>
        {question && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-4 text-xs">
              <div>
                <div className="text-muted-foreground">Môn học</div>
                <div className="font-medium">
                  {question.monHoc?.tenMon ?? question.maMon}
                  {question.monHoc && (
                    <span className="ml-1 text-muted-foreground">({question.maMon})</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Độ khó</div>
                <Badge variant="secondary">
                  {question.doKho?.tenDoKho ?? `#${question.maDoKho}`}
                </Badge>
              </div>
              <div>
                <div className="text-muted-foreground">Người soạn</div>
                <div className="font-medium">{question.giangVien?.hoTen ?? question.maGV}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Ngày tạo</div>
                <div className="font-medium">{formatDate(question.ngayTao)}</div>
              </div>
            </div>
            <div className="rounded-md border bg-muted/30 p-3 text-sm leading-relaxed whitespace-pre-wrap">
              {question.noiDung}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {question && isOwner && (
            <Button
              onClick={() => {
                onOpenChange(false);
                router.push(`/questions/${question.maCauHoi}/edit`);
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Sửa câu hỏi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
