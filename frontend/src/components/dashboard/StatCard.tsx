import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  icon?: LucideIcon;
  hint?: string;
  loading?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  loading = false,
  className,
}: StatCardProps): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 rounded-lg border border-l-4 border-l-primary bg-card p-4 shadow-sm',
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />}
        {label}
      </div>
      {loading ? (
        <div className="h-7 w-16 animate-pulse rounded bg-muted" />
      ) : (
        <div className="text-2xl font-semibold leading-tight">{value ?? '—'}</div>
      )}
      {hint && <div className="text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}
