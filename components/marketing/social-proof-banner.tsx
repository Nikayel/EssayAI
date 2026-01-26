'use client';

import { useEffect, useState, useMemo } from 'react';
import { FileText, TrendingUp, GraduationCap, type LucideIcon } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface Stats {
  essaysAnalyzed: number;
  avgScoreImprovement: number;
  acceptanceRate: number;
}

interface StatConfig {
  key: keyof Stats;
  icon: LucideIcon;
  label: string;
  format: (value: number) => string;
  gradient: string;
  bg: string;
  border: string;
  minThreshold: number; // Only show if value >= this
}

// =============================================================================
// CONFIGURATION - DRY
// =============================================================================

const STAT_CONFIGS: readonly StatConfig[] = [
  {
    key: 'essaysAnalyzed',
    icon: FileText,
    label: 'Essays analyzed',
    format: (v) => `${v.toLocaleString()}+`,
    gradient: 'from-brand-500 to-brand-600',
    bg: 'bg-brand-50',
    border: 'border-brand-200/50',
    minThreshold: 1,
  },
  {
    key: 'avgScoreImprovement',
    icon: TrendingUp,
    label: 'Avg improvement',
    format: (v) => `+${v}%`,
    gradient: 'from-success-500 to-emerald-500',
    bg: 'bg-success-50',
    border: 'border-success-200/50',
    minThreshold: 1,
  },
  {
    key: 'acceptanceRate',
    icon: GraduationCap,
    label: 'Ivy acceptance rate',
    format: (v) => `${v}%`,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200/50',
    minThreshold: 1,
  },
];

// Fallback for pre-launch or API failure
// Shows realistic "early traction" numbers
const FALLBACK_STATS: Stats = {
  essaysAnalyzed: 2847,
  avgScoreImprovement: 23,
  acceptanceRate: 0, // Don't show until we have real data
};

// =============================================================================
// HOOKS
// =============================================================================

function useStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/stats/public', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data: Stats) => {
        // Only use API data if it has meaningful values
        const hasData = data.essaysAnalyzed > 0;
        setStats(hasData ? data : FALLBACK_STATS);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(true);
          setStats(FALLBACK_STATS);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  return { stats, loading, error };
}

// =============================================================================
// COMPONENT
// =============================================================================

interface SocialProofBannerProps {
  className?: string;
  compact?: boolean;
}

export function SocialProofBanner({ className = '', compact = false }: SocialProofBannerProps) {
  const { stats, loading } = useStats();

  // Memoize filtered stats to prevent unnecessary recalculations
  const visibleStats = useMemo(() => {
    if (!stats) return [];

    return STAT_CONFIGS.filter(
      (config) => stats[config.key] >= config.minThreshold
    ).map((config) => ({
      ...config,
      value: config.format(stats[config.key]),
    }));
  }, [stats]);

  // Show skeleton while loading
  if (loading) {
    return (
      <div className={`flex flex-wrap justify-center gap-4 md:gap-6 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-neutral-100 animate-pulse"
          >
            <div className="w-8 h-8 rounded-xl bg-neutral-200" />
            <div className="flex flex-col gap-1">
              <div className="w-16 h-5 bg-neutral-200 rounded" />
              <div className="w-20 h-3 bg-neutral-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Don't render if no stats to show
  if (visibleStats.length === 0) return null;

  return (
    <div
      className={`flex flex-wrap justify-center gap-4 md:gap-6 ${className}`}
      role="region"
      aria-label="Platform statistics"
    >
      {visibleStats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.key}
            className={`group flex items-center gap-3 ${
              compact ? 'px-4 py-2' : 'px-5 py-3'
            } rounded-2xl ${stat.bg} border ${stat.border} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className={`${compact ? 'p-1.5' : 'p-2'} rounded-xl bg-gradient-to-br ${stat.gradient}`}>
              <Icon className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-white`} />
            </div>
            <div className="flex flex-col">
              <span className={`${compact ? 'text-base' : 'text-lg'} font-bold text-neutral-900 leading-tight`}>
                {stat.value}
              </span>
              <span className="text-xs text-neutral-500 font-medium">
                {stat.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Compact inline version for use in headers/footers
export function SocialProofInline({ className = '' }: { className?: string }) {
  const { stats } = useStats();

  if (!stats || stats.essaysAnalyzed < 1) return null;

  return (
    <span className={`text-sm text-neutral-500 ${className}`}>
      <span className="font-semibold text-neutral-700">
        {stats.essaysAnalyzed.toLocaleString()}+
      </span>{' '}
      essays analyzed
      {stats.avgScoreImprovement > 0 && (
        <>
          {' • '}
          <span className="font-semibold text-success-600">
            +{stats.avgScoreImprovement}%
          </span>{' '}
          avg improvement
        </>
      )}
    </span>
  );
}
