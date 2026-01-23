'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Key 2025-2026 Ivy League deadlines
const IVY_DEADLINES = [
  { school: 'Harvard', type: 'REA', date: new Date('2025-11-01') },
  { school: 'Yale', type: 'REA', date: new Date('2025-11-01') },
  { school: 'Princeton', type: 'REA', date: new Date('2025-11-01') },
  { school: 'Columbia', type: 'ED', date: new Date('2025-11-01') },
  { school: 'UPenn', type: 'ED', date: new Date('2025-11-01') },
  { school: 'Brown', type: 'ED', date: new Date('2025-11-01') },
  { school: 'Dartmouth', type: 'ED', date: new Date('2025-11-01') },
  { school: 'Cornell', type: 'ED', date: new Date('2025-11-01') },
  // Regular Decision
  { school: 'All Ivies', type: 'RD', date: new Date('2026-01-01') },
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
    <div
      className={`py-3 text-center text-sm font-medium transition-all ${
        isCritical
          ? 'bg-gradient-to-r from-error-500 to-red-600 text-white'
          : isUrgent
            ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950'
            : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-center gap-3">
        {isCritical ? (
          <AlertTriangle className="w-4 h-4 animate-pulse" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span>
          {isCritical && <span className="font-bold">URGENT: </span>}
          {deadline.school} {deadline.type} deadline in{' '}
          <span className="font-bold">{days} {days === 1 ? 'day' : 'days'}</span>
        </span>
        {days <= 21 && (
          <Link
            href="/signup"
            className="inline-flex items-center gap-1 ml-2 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold"
          >
            Get reviewed today
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
