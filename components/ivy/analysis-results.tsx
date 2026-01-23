'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IvySchoolBadge } from './school-selector';
import { cn } from '@/lib/utils/cn';
import type { IvyAnalysisResponse } from '@/lib/ai/ivy-analyzer';

// ============================================================================
// TYPES
// ============================================================================

interface AnalysisResultsProps {
  analysis: IvyAnalysisResponse;
  schoolId: string;
  toneComparison?: {
    similarity: number;
    driftDetected: boolean;
    assessment: string;
    notes: string;
  } | null;
  onRequestRewrite?: (goals: string[]) => void;
}

// ============================================================================
// SCORE DISPLAY HELPERS
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 5) return 'text-green-600';
  if (score >= 4) return 'text-emerald-600';
  if (score >= 3) return 'text-yellow-600';
  if (score >= 2) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBg(score: number): string {
  if (score >= 5) return 'bg-green-100';
  if (score >= 4) return 'bg-emerald-100';
  if (score >= 3) return 'bg-yellow-100';
  if (score >= 2) return 'bg-orange-100';
  return 'bg-red-100';
}

function getGradeFromScore(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 50) return 'C';
  return 'D';
}

// ============================================================================
// COMPONENTS
// ============================================================================

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const grade = getGradeFromScore(score);
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="flex flex-col items-center">
      <div className={cn(
        'w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center',
        score >= 80 ? 'border-green-500' : score >= 60 ? 'border-yellow-500' : 'border-red-500'
      )}>
        <span className={cn('text-3xl font-bold', color)}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <span className="mt-2 text-sm font-medium">{label}</span>
      <span className={cn('text-lg font-bold', color)}>{grade}</span>
    </div>
  );
}

function DimensionScore({
  name,
  score,
  rationale,
  evidence,
}: {
  name: string;
  score: number;
  rationale: string;
  evidence?: string[];
}) {
  return (
    <div className="border-b border-border pb-3 last:border-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium capitalize">{name.replace('_', ' ')}</span>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={cn(
                  'w-3 h-3 rounded-sm',
                  i <= score ? getScoreBg(score) : 'bg-gray-200'
                )}
              />
            ))}
          </div>
          <span className={cn('font-bold', getScoreColor(score))}>{score}/6</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{rationale}</p>
      {evidence && evidence.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-muted-foreground">Evidence:</p>
          <ul className="text-xs text-muted-foreground list-disc list-inside">
            {evidence.slice(0, 3).map((e, i) => (
              <li key={i} className="truncate">"{e}"</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function FitAnalysisCard({
  fitAnalysis,
}: {
  fitAnalysis: IvyAnalysisResponse['school_fit_analysis'];
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">School Fit Analysis</h3>
        <div className={cn(
          'px-3 py-1 rounded-full text-sm font-bold',
          fitAnalysis.fit_score >= 70 ? 'bg-green-100 text-green-700' :
          fitAnalysis.fit_score >= 50 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        )}>
          {fitAnalysis.fit_score}% Fit
        </div>
      </div>

      {fitAnalysis.demonstrated_research.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-green-700 mb-1">School Research Found</p>
          <ul className="text-sm space-y-1">
            {fitAnalysis.demonstrated_research.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-green-500">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fitAnalysis.value_alignment.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-blue-700 mb-1">Value Alignment</p>
          <ul className="text-sm space-y-1">
            {fitAnalysis.value_alignment.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-500">~</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fitAnalysis.missing_opportunities.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-yellow-700 mb-1">Missing Opportunities</p>
          <ul className="text-sm space-y-1">
            {fitAnalysis.missing_opportunities.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-yellow-500">!</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fitAnalysis.red_flags.length > 0 && (
        <div>
          <p className="text-sm font-medium text-red-700 mb-1">Red Flags</p>
          <ul className="text-sm space-y-1">
            {fitAnalysis.red_flags.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-red-500">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function SuggestionsCard({
  suggestions,
  onRequestRewrite,
}: {
  suggestions: IvyAnalysisResponse['suggestions'];
  onRequestRewrite?: (goals: string[]) => void;
}) {
  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Top Priorities</h3>

      <div className="space-y-4">
        {suggestions.top_priorities.slice(0, 5).map((priority, i) => (
          <div key={i} className="border-l-4 border-primary pl-3">
            <p className="font-medium">{i + 1}. {priority.issue}</p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Why it matters:</strong> {priority.why_matters}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>How to fix:</strong> {priority.how_to_fix}
            </p>
            {priority.example && (
              <p className="text-sm text-muted-foreground italic mt-1">
                Example: "{priority.example}"
              </p>
            )}
          </div>
        ))}
      </div>

      {suggestions.school_fit_improvements.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium mb-2">School Fit Improvements</h4>
          <ul className="text-sm space-y-1">
            {suggestions.school_fit_improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onRequestRewrite && (
        <div className="mt-6 flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRequestRewrite(['school_fit'])}
          >
            Improve School Fit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRequestRewrite(['specificity'])}
          >
            Add Specificity
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRequestRewrite(['voice'])}
          >
            Strengthen Voice
          </Button>
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function IvyAnalysisResults({
  analysis,
  schoolId,
  toneComparison,
  onRequestRewrite,
}: AnalysisResultsProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IvySchoolBadge schoolId={schoolId} size="lg" />
          <div>
            <h2 className="text-xl font-bold">Essay Analysis</h2>
            <p className="text-sm text-muted-foreground">
              {analysis.meta.word_count} words • {analysis.meta.essay_type}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <Card className="p-6">
        <div className="flex items-center gap-8">
          <ScoreCircle
            score={analysis.overall.score_100}
            label="Overall Score"
          />
          <ScoreCircle
            score={analysis.school_fit_analysis.fit_score}
            label="School Fit"
          />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Summary</h3>
            <p className="text-muted-foreground">{analysis.overall.summary}</p>
            <div className="mt-4">
              <p className="text-sm font-medium text-green-700">Strengths:</p>
              <ul className="text-sm">
                {analysis.overall.strengths.map((s, i) => (
                  <li key={i}>+ {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Tone Comparison */}
      {toneComparison && (
        <Card className={cn(
          'p-4',
          toneComparison.driftDetected ? 'border-yellow-400' : 'border-green-400'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Voice Authenticity</h3>
              <p className="text-sm text-muted-foreground">{toneComparison.notes}</p>
            </div>
            <div className={cn(
              'px-3 py-1 rounded-full text-sm font-bold',
              toneComparison.driftDetected
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            )}>
              {Math.round(toneComparison.similarity * 100)}% Match
            </div>
          </div>
        </Card>
      )}

      {/* Dimension Scores */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Detailed Scores</h3>
        <div className="space-y-3">
          <DimensionScore
            name="Authenticity"
            score={analysis.scores.authenticity.score}
            rationale={analysis.scores.authenticity.rationale}
          />
          <DimensionScore
            name="School Fit"
            score={analysis.scores.school_fit.score}
            rationale={analysis.scores.school_fit.rationale}
            evidence={analysis.scores.school_fit.evidence}
          />
          <DimensionScore
            name="Reflection"
            score={analysis.scores.reflection.score}
            rationale={analysis.scores.reflection.rationale}
          />
          <DimensionScore
            name="Structure"
            score={analysis.scores.structure.score}
            rationale={analysis.scores.structure.rationale}
          />
          <DimensionScore
            name="Specificity"
            score={analysis.scores.specificity.score}
            rationale={analysis.scores.specificity.rationale}
            evidence={analysis.scores.specificity.generic_phrases}
          />
          <DimensionScore
            name="Clarity"
            score={analysis.scores.clarity.score}
            rationale={analysis.scores.clarity.rationale}
          />
          <DimensionScore
            name="Mechanics"
            score={analysis.scores.mechanics.score}
            rationale={analysis.scores.mechanics.rationale}
          />
        </div>
      </Card>

      {/* School Fit Analysis */}
      <FitAnalysisCard fitAnalysis={analysis.school_fit_analysis} />

      {/* Suggestions */}
      <SuggestionsCard
        suggestions={analysis.suggestions}
        onRequestRewrite={onRequestRewrite}
      />

      {/* Action Items */}
      <Card className="p-4 bg-primary/5 border-primary">
        <h3 className="font-semibold mb-2">Next Steps</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          {analysis.overall.action_items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
