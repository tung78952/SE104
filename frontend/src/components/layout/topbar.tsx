'use client';

import Link from 'next/link';
import { Menu, UserCircle } from 'lucide-react';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

export function Topbar({ title, onMenuClick }: TopbarProps): React.ReactElement {
  return (
    <header className="flex h-11 shrink-0 items-center gap-3 border-b-2 border-primary/30 bg-background px-4">
      {onMenuClick && (
        <button
          type="button"
          aria-label="Mở menu điều hướng"
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent md:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden />
        </button>
      )}
      <h1 className="flex-1 text-sm font-semibold text-primary">{title}</h1>
      <Link
        href="/profile"
        className="flex items-center gap-1 rounded-md border border-primary/30 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-accent"
      >
        <UserCircle className="h-3.5 w-3.5" aria-hidden /> Hồ sơ
      </Link>
    </header>
  );
}
