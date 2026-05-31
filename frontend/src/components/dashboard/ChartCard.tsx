import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  action,
  children,
  className,
}: ChartCardProps): React.ReactElement {
  return (
    <div className={cn('flex flex-col rounded-lg border bg-card shadow-sm', className)}>
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
