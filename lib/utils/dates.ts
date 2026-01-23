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
    critical: 'text-red-600 bg-red-50',
    urgent: 'text-yellow-600 bg-yellow-50',
    soon: 'text-blue-600 bg-blue-50',
    normal: 'text-gray-600 bg-gray-50',
  };
  return colors[urgency];
}
