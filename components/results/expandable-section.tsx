'use client';

/**
 * Expandable Section Component
 * Apple-style: Clean expand/collapse with smooth animation
 */

import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ExpandableSectionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ExpandableSection({
  title,
  subtitle,
  defaultOpen = false,
  badge,
  children,
  className,
}: ExpandableSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn('border border-neutral-200 rounded-xl overflow-hidden', className)}>
      {/* Header (always visible) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-left">
            <h3 className="font-semibold text-neutral-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-neutral-500">{subtitle}</p>
            )}
          </div>
          {badge}
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-neutral-400 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Content (expandable) */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 border-t border-neutral-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SCORE BADGE (for expandable sections)
// =============================================================================

interface ScoreBadgeProps {
  score: number;
  maxScore?: number;
}

export function ScoreBadge({ score, maxScore = 6 }: ScoreBadgeProps) {
  const percentage = (score / maxScore) * 100;

  const bgColor = percentage >= 83 ? 'bg-green-100 text-green-700' :
                  percentage >= 66 ? 'bg-blue-100 text-blue-700' :
                  percentage >= 50 ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700';

  return (
    <span className={cn('px-2.5 py-1 rounded-full text-sm font-medium', bgColor)}>
      {score}/{maxScore}
    </span>
  );
}

// =============================================================================
// KEY INSIGHTS SUMMARY (compact view before expand)
// =============================================================================

interface KeyInsight {
  label: string;
  score: number;
  maxScore?: number;
  status: 'good' | 'warning' | 'critical';
}

interface KeyInsightsSummaryProps {
  insights: KeyInsight[];
  onViewAll?: () => void;
}

export function KeyInsightsSummary({ insights, onViewAll }: KeyInsightsSummaryProps) {
  const statusIcons = {
    good: '✓',
    warning: '!',
    critical: '✗',
  };

  const statusColors = {
    good: 'text-green-600 bg-green-50',
    warning: 'text-amber-600 bg-amber-50',
    critical: 'text-red-600 bg-red-50',
  };

  return (
    <div className="space-y-2">
      {insights.slice(0, 3).map((insight, i) => (
        <div key={i} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
              statusColors[insight.status]
            )}>
              {statusIcons[insight.status]}
            </span>
            <span className="text-sm text-neutral-700">{insight.label}</span>
          </div>
          <span className="text-sm font-medium text-neutral-500">
            {insight.score}/{insight.maxScore || 6}
          </span>
        </div>
      ))}
      {onViewAll && insights.length > 3 && (
        <button
          onClick={onViewAll}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          View all {insights.length} dimensions →
        </button>
      )}
    </div>
  );
}

export default ExpandableSection;
