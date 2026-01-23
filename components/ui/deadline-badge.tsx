'use client';

import { Calendar } from 'lucide-react';
import { getDaysUntil, formatDeadline, getDeadlineColor } from '@/lib/utils/dates';

interface DeadlineBadgeProps {
  deadline: Date | string;
  showIcon?: boolean;
  showDays?: boolean;
}

export function DeadlineBadge({ deadline, showIcon = true, showDays = true }: DeadlineBadgeProps) {
  const days = getDaysUntil(deadline);
  const colorClass = getDeadlineColor(days);

  return (
    <div className={`px-3 py-2 rounded-lg inline-flex items-center gap-2 ${colorClass}`}>
      {showIcon && <Calendar className="w-4 h-4" />}
      <span className="font-semibold">{formatDeadline(deadline)}</span>
      {showDays && (
        <span className="text-sm opacity-75">
          ({days <= 0 ? 'passed' : `${days}d`})
        </span>
      )}
    </div>
  );
}
