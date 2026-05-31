import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function ForbiddenPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/5">
          <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden />
        </div>
        <h1 className="text-lg font-medium">403 — Không đủ quyền</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tài khoản hiện tại không có quyền truy cập trang này.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm transition-colors hover:bg-accent"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
