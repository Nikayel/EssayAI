// Date utility functions - reusable across components

export function getDaysUntil(date: Date | string): number {
  const target = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = target.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function formatDeadline(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatFullDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDeadlineUrgency(days: number): 'critical' | 'urgent' | 'soon' | 'normal' {
  if (days <= 0) return 'critical';
  if (days <= 7) return 'critical';
  if (days <= 14) return 'urgent';
  if (days <= 30) return 'soon';
  return 'normal';
}

export function getDeadlineColor(days: number): string {
  const urgency = getDeadlineUrgency(days);
  const colors = {
    critical: 'text-error-600 bg-error-50',
    urgent: 'text-warning-600 bg-warning-50',
    soon: 'text-brand-600 bg-brand-50',
    normal: 'text-neutral-600 bg-neutral-50',
  };
  return colors[urgency];
}
