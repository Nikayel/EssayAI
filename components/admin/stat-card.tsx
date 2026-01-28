import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

/**
 * Reusable stat card for admin dashboards
 * DRY: Single component used across all admin stats displays
 */

export interface StatCardProps {
  label: string;
  value: number | string;
  color?: 'default' | 'blue' | 'purple' | 'warning' | 'success' | 'error';
  highlight?: boolean; // Add border highlight when value > 0
  highlightColor?: 'warning' | 'error';
  className?: string;
}

const colorMap = {
  default: 'text-neutral-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  warning: 'text-warning-600',
  success: 'text-success-600',
  error: 'text-error-600',
} as const;

const highlightMap = {
  warning: 'border-2 border-warning-500',
  error: 'border-2 border-error-500',
} as const;

export function StatCard({
  label,
  value,
  color = 'default',
  highlight = false,
  highlightColor = 'warning',
  className,
}: StatCardProps) {
  const shouldHighlight = highlight && Number(value) > 0;

  return (
    <Card
      className={cn(
        'p-1.5 sm:p-0',
        shouldHighlight && highlightMap[highlightColor],
        className
      )}
    >
      <CardHeader className="p-1.5 sm:p-4 pb-0.5 sm:pb-2">
        <CardDescription className="text-[9px] sm:text-sm truncate">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-1.5 sm:p-4 pt-0">
        <div className={cn('text-base sm:text-2xl font-bold', colorMap[color])}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid container for stat cards with responsive columns
 */
export function StatGrid({
  children,
  cols = 6,
  className,
}: {
  children: React.ReactNode;
  cols?: 3 | 5 | 6;
  className?: string;
}) {
  const colsMap = {
    3: 'grid-cols-3',
    5: 'grid-cols-5',
    6: 'grid-cols-3 md:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-1.5 sm:gap-4', colsMap[cols], className)}>
      {children}
    </div>
  );
}

/**
 * Render multiple stat cards from config array
 * DRY: Data-driven rendering
 */
export interface StatConfig {
  label: string;
  value: number | string;
  color?: StatCardProps['color'];
  highlight?: boolean;
  highlightColor?: StatCardProps['highlightColor'];
}

export function StatCardGroup({
  stats,
  cols = 6,
}: {
  stats: StatConfig[];
  cols?: 3 | 5 | 6;
}) {
  return (
    <StatGrid cols={cols}>
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </StatGrid>
  );
}
