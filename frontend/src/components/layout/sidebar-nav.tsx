'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Book,
  Building,
  FileText,
  HelpCircle,
  IdCard,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  SlidersHorizontal,
  Table as TableIcon,
  UserCircle,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VaiTro } from '@/types/models';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: VaiTro[];
  readOnlyFor?: VaiTro[];
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'giaovien'] },
  { href: '/profile', label: 'Hồ sơ cá nhân', icon: UserCircle, roles: ['admin', 'giaovien'] },

  {
    href: '/admin/users',
    label: 'Tài khoản',
    icon: Users,
    roles: ['admin'],
    section: 'Quản trị danh mục',
  },
  {
    href: '/subjects',
    label: 'Môn học',
    icon: Book,
    roles: ['admin', 'giaovien'],
    readOnlyFor: ['giaovien'],
    section: 'Quản trị danh mục',
  },
  {
    href: '/classes',
    label: 'Lớp học',
    icon: Building,
    roles: ['admin', 'giaovien'],
    readOnlyFor: ['giaovien'],
    section: 'Quản trị danh mục',
  },
  {
    href: '/students',
    label: 'Sinh viên',
    icon: IdCard,
    roles: ['admin', 'giaovien'],
    readOnlyFor: ['giaovien'],
    section: 'Quản trị danh mục',
  },
  {
    href: '/difficulties',
    label: 'Độ khó',
    icon: SlidersHorizontal,
    roles: ['admin', 'giaovien'],
    readOnlyFor: ['giaovien'],
    section: 'Quản trị danh mục',
  },
  {
    href: '/regulations',
    label: 'Quy định',
    icon: Settings,
    roles: ['admin', 'giaovien'],
    readOnlyFor: ['giaovien'],
    section: 'Quản trị danh mục',
  },

  {
    href: '/questions',
    label: 'Câu hỏi',
    icon: HelpCircle,
    roles: ['admin', 'giaovien'],
    section: 'Nghiệp vụ',
  },
  {
    href: '/exams',
    label: 'Đề thi',
    icon: FileText,
    roles: ['admin', 'giaovien'],
    section: 'Nghiệp vụ',
  },
  {
    href: '/grades',
    label: 'Bảng điểm',
    icon: TableIcon,
    roles: ['admin', 'giaovien'],
    section: 'Nghiệp vụ',
  },

  {
    href: '/reports/exams-by-subject',
    label: 'Theo môn học',
    icon: BarChart3,
    roles: ['admin', 'giaovien'],
    section: 'Báo cáo',
  },
  {
    href: '/reports/results-by-class',
    label: 'Theo lớp học',
    icon: BarChart3,
    roles: ['admin', 'giaovien'],
    section: 'Báo cáo',
  },
];

function visibleNavItems(role: VaiTro): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

interface SidebarNavProps {
  role: VaiTro;
}

export function SidebarNav({ role }: SidebarNavProps): React.ReactElement {
  const pathname = usePathname();
  const items = visibleNavItems(role);

  const grouped = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.section ?? '__top__';
    acc[key] ??= [];
    acc[key].push(item);
    return acc;
  }, {});
  const sections = Object.keys(grouped);

  return (
    <nav aria-label="Sidebar" className="flex flex-col gap-1 py-2">
      {sections.map((section) => (
        <div key={section} className="flex flex-col gap-0.5">
          {section !== '__top__' && (
            <div className="px-4 pb-1 pt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {section}
            </div>
          )}
          {grouped[section].map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isReadOnly = item.readOnlyFor?.includes(role);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'border-l-2 border-foreground bg-accent font-medium text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <span className="flex-1 truncate">{item.label}</span>
                {isReadOnly && (
                  <span
                    data-testid="readonly-tag"
                    className="rounded-full border px-1.5 py-px text-[9px] uppercase text-muted-foreground"
                  >
                    Xem
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
