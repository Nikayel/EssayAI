'use client';

/**
 * Progressive Results View
 * Apple-style: Hero first, details on demand
 * Reduces cognitive load with progressive disclosure
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Download, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { AnalysisResponse } from '@/types/ai';
import { HeroScore, MiniScore } from './hero-score';
import { ExpandableSection, ScoreBadge, KeyInsightsSummary } from './expandable-section';
import { SCORE_DIMENSIONS } from '@/lib/scoring/rubric-config';

// =============================================================================
// TYPES
// =============================================================================

interface ProgressiveResultsProps {
  analysis: AnalysisResponse;
  onExport?: () => void;
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProgressiveResults({
  analysis,
  onExport,
  className,
}: ProgressiveResultsProps) {
  const [showAllScores, setShowAllScores] = useState(false);
  const { scores, overall, suggestions, commons_check } = analysis;

  // Prepare key insights from scores
  const keyInsights = prepareKeyInsights(scores);
  const topIssues = keyInsights.filter(i => i.status !== 'good').slice(0, 3);
  const strengths = keyInsights.filter(i => i.status === 'good').slice(0, 2);

  return (
    <div className={cn('space-y-6', className)}>
      {/* STEP 1: Hero Score */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <HeroScore
          score={overall.score_100}
          summary={overall.summary}
          size="large"
          className="w-full"
        />

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {onExport && (
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </div>
      </section>

      {/* STEP 2: Key Insights (collapsed by default on mobile) */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <ExpandableSection
          title="Key Insights"
          subtitle={`${topIssues.length} areas to improve, ${strengths.length} strengths`}
          defaultOpen={true}
        >
          <div className="space-y-4">
            {/* Top Issues */}
            {topIssues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">Priority Improvements</h4>
                {topIssues.map((insight, i) => (
                  <InsightRow key={i} insight={insight} />
                ))}
              </div>
            )}

            {/* Strengths */}
            {strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-500 mb-2">Your Strengths</h4>
                {strengths.map((insight, i) => (
                  <InsightRow key={i} insight={insight} />
                ))}
              </div>
            )}

            {/* View All */}
            <button
              onClick={() => setShowAllScores(true)}
              className="w-full py-2 text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center justify-center gap-1"
            >
              View all 8 dimensions
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </ExpandableSection>
      </section>

      {/* STEP 3: All Scores (expandable) */}
      {showAllScores && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ExpandableSection title="All Scores" defaultOpen={true}>
            <div className="space-y-1">
              {Object.entries(scores).map(([key, data]) => (
                <MiniScore
                  key={key}
                  label={SCORE_DIMENSIONS[key as keyof typeof SCORE_DIMENSIONS]?.label || key}
                  score={data.score}
                />
              ))}
            </div>
          </ExpandableSection>
        </section>
      )}

      {/* STEP 4: Action Items */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <ExpandableSection
          title="Action Items"
          subtitle={`${overall.next_actions_checklist.length} next steps`}
          badge={<span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">{overall.next_actions_checklist.length}</span>}
          defaultOpen={true}
        >
          <ul className="space-y-3">
            {overall.next_actions_checklist.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-neutral-700">{action}</span>
              </li>
            ))}
          </ul>
        </ExpandableSection>
      </section>

      {/* STEP 5: Top Improvements (collapsed) */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
        <ExpandableSection
          title="Detailed Suggestions"
          subtitle={`${suggestions.top5.length} specific improvements`}
        >
          <div className="space-y-4">
            {suggestions.top5.map((suggestion, i) => (
              <SuggestionCard key={i} suggestion={suggestion} index={i + 1} />
            ))}
          </div>
        </ExpandableSection>
      </section>

      {/* STEP 6: Quick Checks */}
      <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
        <ExpandableSection title="Quick Checks">
          <QuickChecksGrid commons={commons_check} />
        </ExpandableSection>
      </section>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function InsightRow({ insight }: { insight: ReturnType<typeof prepareKeyInsights>[0] }) {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-amber-600',
    critical: 'text-red-600',
  };

  const statusBg = {
    good: 'bg-green-50',
    warning: 'bg-amber-50',
    critical: 'bg-red-50',
  };

  return (
    <div className={cn('flex items-center justify-between p-3 rounded-lg', statusBg[insight.status])}>
      <span className="text-sm font-medium text-neutral-800">{insight.label}</span>
      <span className={cn('text-sm font-semibold', statusColors[insight.status])}>
        {insight.score}/6
      </span>
    </div>
  );
}

function SuggestionCard({ suggestion, index }: { suggestion: AnalysisResponse['suggestions']['top5'][0]; index: number }) {
  return (
    <div className="border-l-2 border-brand-300 pl-4 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded">#{index}</span>
        <h5 className="font-medium text-neutral-900">{suggestion.issue}</h5>
      </div>
      <p className="text-sm text-neutral-600">{suggestion.why_it_matters}</p>
      {suggestion.example_edit && (
        <p className="text-sm text-brand-600 bg-brand-50 p-2 rounded">
          💡 {suggestion.example_edit}
        </p>
      )}
    </div>
  );
}

function QuickChecksGrid({ commons }: { commons: AnalysisResponse['commons_check'] }) {
  const checks = [
    { key: 'about_applicant', label: 'About You', positive: true },
    { key: 'buzzwords_cliches', label: 'Clichés', positive: false },
    { key: 'genericness', label: 'Specific Details', positive: false },
    { key: 'reflection_depth_needed', label: 'Deep Reflection', positive: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {checks.map(({ key, label, positive }) => {
        const check = commons[key as keyof typeof commons];
        const passed = positive ? check?.flag : !check?.flag;

        return (
          <div
            key={key}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg text-sm',
              passed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            )}
          >
            {passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {label}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function prepareKeyInsights(scores: AnalysisResponse['scores']) {
  return Object.entries(scores).map(([key, data]) => ({
    key,
    label: SCORE_DIMENSIONS[key as keyof typeof SCORE_DIMENSIONS]?.label || key,
    score: data.score,
    status: data.score >= 5 ? 'good' as const : data.score >= 3 ? 'warning' as const : 'critical' as const,
  })).sort((a, b) => a.score - b.score); // Worst first
}

export default ProgressiveResults;
