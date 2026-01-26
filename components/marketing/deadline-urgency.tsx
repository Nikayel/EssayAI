'use client';

import { useMemo } from 'react';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// =============================================================================
// CONFIGURATION - Single source of truth (update yearly)
// =============================================================================

const CURRENT_YEAR = 2025;
const NEXT_YEAR = 2026;

// Urgency thresholds in days
const URGENCY_CONFIG = {
  CRITICAL: 7,
  URGENT: 14,
  SHOW_CTA: 21,
  HIDE_BANNER: 60,
} as const;

// =============================================================================
// TYPES
// =============================================================================

type DeadlineType = 'REA' | 'EA' | 'ED' | 'ED2' | 'RD';
type UrgencyLevel = 'critical' | 'urgent' | 'normal';

interface Deadline {
  school: string;
  type: DeadlineType;
  date: Date;
}

interface UrgencyStyle {
  bg: string;
  text: string;
  Icon: typeof Clock | typeof AlertTriangle;
  animate: boolean;
}

// =============================================================================
// DATA
// =============================================================================

const IVY_DEADLINES: readonly Deadline[] = [
  // Early deadlines (November)
  { school: 'Harvard', type: 'REA', date: new Date(`${CURRENT_YEAR}-11-01`) },
  { school: 'Yale', type: 'REA', date: new Date(`${CURRENT_YEAR}-11-01`) },
  { school: 'Princeton', type: 'REA', date: new Date(`${CURRENT_YEAR}-11-01`) },
  { school: 'Columbia', type: 'ED', date: new Date(`${CURRENT_YEAR}-11-01`) },
  { school: 'UPenn', type: 'ED', date: new Date(`${CURRENT_YEAR}-11-01`) },
  { school: 'Brown', type: 'ED', date: new Date(`${CURRENT_YEAR}-11-01`) },
  { school: 'Dartmouth', type: 'ED', date: new Date(`${CURRENT_YEAR}-11-01`) },
  { school: 'Cornell', type: 'ED', date: new Date(`${CURRENT_YEAR}-11-01`) },
  // ED2 deadlines (January)
  { school: 'Columbia', type: 'ED2', date: new Date(`${NEXT_YEAR}-01-01`) },
  { school: 'Brown', type: 'ED2', date: new Date(`${NEXT_YEAR}-01-01`) },
  // Regular Decision
  { school: 'All Ivies', type: 'RD', date: new Date(`${NEXT_YEAR}-01-01`) },
];

// Styles mapped by urgency level - DRY
const URGENCY_STYLES: Record<UrgencyLevel, UrgencyStyle> = {
  critical: {
    bg: 'bg-gradient-to-r from-red-600 to-red-700',
    text: 'text-white',
    Icon: AlertTriangle,
    animate: true,
  },
  urgent: {
    bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
    text: 'text-amber-950',
    Icon: AlertTriangle,
    animate: false,
  },
  normal: {
    bg: 'bg-gradient-to-r from-brand-500 to-brand-600',
    text: 'text-white',
    Icon: Clock,
    animate: false,
  },
};

// =============================================================================
// UTILITY FUNCTIONS (pure, testable)
// =============================================================================

function getNextDeadline(deadlines: readonly Deadline[]): Deadline | null {
  const now = new Date();
  return deadlines
    .filter(d => d.date > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getUrgencyLevel(days: number): UrgencyLevel {
  if (days <= URGENCY_CONFIG.CRITICAL) return 'critical';
  if (days <= URGENCY_CONFIG.URGENT) return 'urgent';
  return 'normal';
}

// Loss aversion messaging - psychological trigger (Kahneman research)
function getUrgencyMessage(days: number, school: string, type: DeadlineType): string {
  const dayText = days === 1 ? 'day' : 'days';

  if (days <= 3) {
    return `Last chance: ${school} ${type} due in ${days} ${dayText}`;
  }
  if (days <= 7) {
    return `Only ${days} ${dayText} to perfect your ${school} essay`;
  }
  if (days <= 14) {
    return `${school} ${type} deadline in ${days} ${dayText} — is your essay ready?`;
  }
  return `${school} ${type} deadline in ${days} ${dayText}`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DeadlineUrgency() {
  // Memoize expensive deadline calculation
  const deadlineInfo = useMemo(() => {
    const next = getNextDeadline(IVY_DEADLINES);
    if (!next) return null;

    const days = getDaysUntil(next.date);
    if (days > URGENCY_CONFIG.HIDE_BANNER) return null;

    return {
      deadline: next,
      days,
      urgency: getUrgencyLevel(days),
    };
  }, []);

  // Early return if no deadline to show
  if (!deadlineInfo) return null;

  const { deadline, days, urgency } = deadlineInfo;
  const styles = URGENCY_STYLES[urgency];
  const message = getUrgencyMessage(days, deadline.school, deadline.type);
  const showCTA = days <= URGENCY_CONFIG.SHOW_CTA;

  return (
    <div
      className={`py-3 text-center text-sm font-medium ${styles.bg} ${styles.text}`}
      role="alert"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 flex items-center justify-center gap-3 flex-wrap">
        <styles.Icon
          className={`w-4 h-4 flex-shrink-0 ${styles.animate ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />

        <span className="text-center">
          {urgency === 'critical' && (
            <span className="font-bold mr-1">FINAL CALL:</span>
          )}
          {message}
        </span>

        {showCTA && (
          <Link
            href="/signup"
            className="inline-flex items-center gap-1 ml-2 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold whitespace-nowrap"
          >
            Get feedback now
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}

// Export for testing and reuse
export {
  getNextDeadline,
  getDaysUntil,
  getUrgencyLevel,
  URGENCY_CONFIG,
  IVY_DEADLINES,
  type Deadline,
  type UrgencyLevel,
};
