'use client';

import { LogOut, School } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';
import { ROLE_LABEL } from '@/lib/constants/roles';
import type { TaiKhoan } from '@/types/models';

interface SidebarProps {
  user: TaiKhoan;
  onLogout?: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps): React.ReactElement {
  const displayName = user.giangVien?.hoTen ?? user.tenDangNhap;
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium">
        <School className="h-4 w-4 text-primary" aria-hidden />
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-primary">Quản lý Thi SE104</span>
          <span className="text-[10px] font-normal text-muted-foreground">
            {ROLE_LABEL[user.vaiTro]} đang đăng nhập
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav role={user.vaiTro} />
      </div>

      <div className="mt-auto flex items-center gap-2 border-t px-4 py-3">
        <div
          aria-hidden
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-accent text-[10px] font-medium"
        >
          {initials || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium">{displayName}</div>
          <div className="text-[10px] text-muted-foreground">{ROLE_LABEL[user.vaiTro]}</div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Đăng xuất"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
