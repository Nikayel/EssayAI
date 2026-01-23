'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, TrendingUp, GraduationCap } from 'lucide-react';

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

  return (
    <div className="flex justify-center gap-8 py-4">
      {stats.essaysAnalyzed > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900">
            {stats.essaysAnalyzed.toLocaleString()}+ essays analyzed
          </span>
        </div>
      )}

      {stats.avgScoreImprovement > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-900">
            {stats.avgScoreImprovement}% avg score improvement
          </span>
        </div>
      )}

      {stats.acceptanceRate > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full">
          <GraduationCap className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-900">
            {stats.acceptanceRate}% Ivy acceptance rate
          </span>
        </div>
      )}
    </div>
  );
}
