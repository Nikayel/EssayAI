'use client';

import { useEffect, useState } from 'react';
import { FileText, TrendingUp, GraduationCap, Sparkles } from 'lucide-react';

interface Stats {
  essaysAnalyzed: number;
  avgScoreImprovement: number;
  acceptanceRate: number;
}

export function SocialProofBanner() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats/public')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {
        // Fallback to reasonable defaults if API fails
        setStats({
          essaysAnalyzed: 0,
          avgScoreImprovement: 0,
          acceptanceRate: 0,
        });
      });
  }, []);

  // Don't show if no stats
  if (!stats || stats.essaysAnalyzed === 0) return null;

  const statItems = [
    stats.essaysAnalyzed > 0 && {
      icon: FileText,
      value: `${stats.essaysAnalyzed.toLocaleString()}+`,
      label: 'Essays analyzed',
      gradient: 'from-brand-500 to-brand-600',
      bg: 'bg-brand-50',
      border: 'border-brand-200/50',
    },
    stats.avgScoreImprovement > 0 && {
      icon: TrendingUp,
      value: `${stats.avgScoreImprovement}%`,
      label: 'Avg score improvement',
      gradient: 'from-success-500 to-emerald-500',
      bg: 'bg-success-50',
      border: 'border-success-200/50',
    },
    stats.acceptanceRate > 0 && {
      icon: GraduationCap,
      value: `${stats.acceptanceRate}%`,
      label: 'Ivy acceptance rate',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      border: 'border-amber-200/50',
    },
  ].filter(Boolean);

  if (statItems.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-6">
      {statItems.map((stat, i) => {
        if (!stat) return null;
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className={`group flex items-center gap-3 px-5 py-3 rounded-2xl ${stat.bg} border ${stat.border} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-neutral-900 leading-tight">
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
