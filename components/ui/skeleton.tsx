'use client';

/**
 * Skeleton Loading Components
 * Apple-style: Subtle shimmer, reduces perceived wait time
 */

import { cn } from '@/lib/utils';

// =============================================================================
// BASE SKELETON
// =============================================================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-neutral-200 rounded-md animate-pulse',
        className
      )}
    />
  );
}

// =============================================================================
// SCORE CARD SKELETON
// =============================================================================

export function ScoreCardSkeleton() {
  return (
    <div className="p-4 border border-neutral-200 rounded-xl space-y-3">
      {/* Header: Title + Score */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      {/* Progress bar */}
      <Skeleton className="h-2 w-full rounded-full" />
      {/* Rationale lines */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

// =============================================================================
// RESULTS PAGE SKELETON
// =============================================================================

export function ResultsPageSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hero Score */}
      <div className="flex flex-col items-center p-8 bg-neutral-50 rounded-2xl">
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Score Cards Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ScoreCardSkeleton key={i} />
        ))}
      </div>

      {/* Action Items */}
      <div className="p-4 border border-neutral-200 rounded-xl space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded-full flex-shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HERO SCORE SKELETON
// =============================================================================

export function HeroScoreSkeleton() {
  return (
    <div className="flex flex-col items-center p-8 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl">
      {/* Score circle */}
      <div className="relative mb-4">
        <Skeleton className="w-28 h-28 rounded-full" />
      </div>
      {/* Label */}
      <Skeleton className="h-5 w-36 mb-2" />
      {/* Summary */}
      <Skeleton className="h-4 w-56" />
    </div>
  );
}

// =============================================================================
// TEXT SKELETON
// =============================================================================

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')}
        />
      ))}
    </div>
  );
}

// =============================================================================
// CARD SKELETON
// =============================================================================

export function CardSkeleton() {
  return (
    <div className="p-4 border border-neutral-200 rounded-xl space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <TextSkeleton lines={2} />
    </div>
  );
}
