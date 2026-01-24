'use client';

/**
 * Hero Score Component
 * Apple-style: Big number, count-up animation, clear status
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { SCORE_ANCHORS } from '@/lib/scoring/rubric-config';

// =============================================================================
// TYPES
// =============================================================================

interface HeroScoreProps {
  score: number; // 0-100
  label?: string;
  summary?: string;
  animate?: boolean;
  size?: 'default' | 'large';
  className?: string;
}

// =============================================================================
// SCORE TIER HELPERS
// =============================================================================

function getScoreTier(score: number): {
  color: string;
  bgColor: string;
  ringColor: string;
  label: string;
} {
  if (score >= 85) return {
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    ringColor: 'stroke-green-500',
    label: 'Exceptional',
  };
  if (score >= 70) return {
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    ringColor: 'stroke-blue-500',
    label: 'Strong',
  };
  if (score >= 55) return {
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    ringColor: 'stroke-amber-500',
    label: 'Competitive',
  };
  return {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    ringColor: 'stroke-red-500',
    label: 'Needs Work',
  };
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function HeroScore({
  score,
  label,
  summary,
  animate = true,
  size = 'default',
  className,
}: HeroScoreProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const tier = getScoreTier(score);

  // Count-up animation
  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    const duration = 1000; // 1 second
    const steps = 30;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score, animate]);

  const isLarge = size === 'large';
  const circumference = 2 * Math.PI * 45; // r=45
  const progress = (displayScore / 100) * circumference;

  return (
    <div
      className={cn(
        'flex flex-col items-center p-6 rounded-2xl',
        tier.bgColor,
        className
      )}
    >
      {/* Score Ring */}
      <div className={cn('relative', isLarge ? 'w-36 h-36' : 'w-28 h-28')}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-white/50"
          />
          {/* Progress */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={cn(tier.ringColor, 'transition-all duration-1000 ease-out')}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
          />
        </svg>

        {/* Score Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn(
            'font-bold tabular-nums',
            tier.color,
            isLarge ? 'text-4xl' : 'text-3xl'
          )}>
            {displayScore}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className={cn('mt-4 text-center', isLarge ? 'space-y-2' : 'space-y-1')}>
        <p className={cn(
          'font-semibold',
          tier.color,
          isLarge ? 'text-xl' : 'text-lg'
        )}>
          {label || tier.label}
        </p>
        {summary && (
          <p className="text-neutral-600 text-sm max-w-xs">
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MINI SCORE (for lists)
// =============================================================================

interface MiniScoreProps {
  score: number; // 0-6
  label: string;
  maxScore?: number;
}

export function MiniScore({ score, label, maxScore = 6 }: MiniScoreProps) {
  const percentage = (score / maxScore) * 100;
  const tier = getScoreTier(percentage * (100 / 100)); // Normalize to 0-100 scale

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-neutral-700">{label}</span>
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', tier.ringColor.replace('stroke-', 'bg-'))}
            style={{ width: `${(score / maxScore) * 100}%` }}
          />
        </div>
        <span className={cn('text-sm font-medium tabular-nums w-8', tier.color)}>
          {score}/{maxScore}
        </span>
      </div>
    </div>
  );
}

export default HeroScore;
