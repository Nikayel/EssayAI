'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

// Key 2024-2025 Ivy League deadlines
const IVY_DEADLINES = [
  { school: 'Harvard', type: 'REA', date: new Date('2024-11-01') },
  { school: 'Yale', type: 'REA', date: new Date('2024-11-01') },
  { school: 'Princeton', type: 'REA', date: new Date('2024-11-01') },
  { school: 'Columbia', type: 'ED', date: new Date('2024-11-01') },
  { school: 'UPenn', type: 'ED', date: new Date('2024-11-01') },
  { school: 'Brown', type: 'ED', date: new Date('2024-11-01') },
  { school: 'Dartmouth', type: 'ED', date: new Date('2024-11-01') },
  { school: 'Cornell', type: 'ED', date: new Date('2024-11-01') },
  // Regular Decision
  { school: 'All Ivies', type: 'RD', date: new Date('2025-01-01') },
];

function getNextDeadline() {
  const now = new Date();
  const upcoming = IVY_DEADLINES
    .filter(d => d.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  return upcoming[0] || null;
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function DeadlineUrgency() {
  const [deadline, setDeadline] = useState<typeof IVY_DEADLINES[0] | null>(null);
  const [days, setDays] = useState<number>(0);

  useEffect(() => {
    const next = getNextDeadline();
    if (next) {
      setDeadline(next);
      setDays(getDaysUntil(next.date));
    }
  }, []);

  // Don't show if no upcoming deadline or too far away
  if (!deadline || days > 60) return null;

  const isUrgent = days <= 14;
  const isCritical = days <= 7;

  return (
    <div className={`py-2 text-center text-sm font-medium ${
      isCritical
        ? 'bg-red-600 text-white'
        : isUrgent
          ? 'bg-yellow-500 text-yellow-900'
          : 'bg-blue-600 text-white'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-center gap-2">
        {isCritical ? (
          <AlertTriangle className="w-4 h-4" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span>
          {isCritical && 'URGENT: '}
          {deadline.school} {deadline.type} deadline in{' '}
          <strong>{days} {days === 1 ? 'day' : 'days'}</strong>
          {days <= 21 && ' — Get your essay reviewed today'}
        </span>
      </div>
    </div>
  );
}
