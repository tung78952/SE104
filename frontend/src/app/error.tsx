'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { OctagonX } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps): React.ReactElement {
  useEffect(() => {
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/5">
          <OctagonX className="h-5 w-5 text-destructive" aria-hidden />
        </div>
        <h1 className="text-lg font-medium">Đã xảy ra lỗi không mong muốn</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Hệ thống gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">Mã lỗi: {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button type="button" onClick={() => reset()}>
            Thử lại
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
