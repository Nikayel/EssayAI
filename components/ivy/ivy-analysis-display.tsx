'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { IvySchoolBadge, IVY_SCHOOLS } from './school-selector';
import { cn } from '@/lib/utils/cn';
import type {
  IvyAnalysisResult,
  IvySchoolAnalysis,
  IvySingleEssayAnalysis,
} from '@/lib/scoring/tiers/ivy-analysis';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lightbulb,
  Quote,
  FileText,
  Users,
  Target,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Sparkles,
  BookOpen,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface IvyAnalysisDisplayProps {
  result: IvyAnalysisResult;
  onRequestRewrite?: (schoolId: string, essayIndex: number, goals: string[]) => void;
}

// =============================================================================
// SCORE HELPERS
// =============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 70) return 'bg-blue-100';
  if (score >= 60) return 'bg-amber-100';
  if (score >= 50) return 'bg-orange-100';
  return 'bg-red-100';
}

function getScoreBorder(score: number): string {
  if (score >= 80) return 'border-green-500';
  if (score >= 70) return 'border-blue-500';
  if (score >= 60) return 'border-amber-500';
  if (score >= 50) return 'border-orange-500';
  return 'border-red-500';
}

function getVerdictIcon(verdict: 'help' | 'neutral' | 'hurt') {
  switch (verdict) {
    case 'help':
      return <ThumbsUp className="w-5 h-5 text-green-600" />;
    case 'hurt':
      return <ThumbsDown className="w-5 h-5 text-red-600" />;
    default:
      return <Minus className="w-5 h-5 text-amber-600" />;
  }
}

// =============================================================================
// SCORE CIRCLE COMPONENT
// =============================================================================

function ScoreCircle({ score, label, size = 'default' }: { score: number; label: string; size?: 'default' | 'large' }) {
  const circumference = 2 * Math.PI * 45;
  const progress = (score / 100) * circumference;
  const isLarge = size === 'large';

  return (
    <div className="flex flex-col items-center">
      <div className={cn('relative', isLarge ? 'w-32 h-32' : 'w-24 h-24')}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-neutral-200"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={cn(getScoreBorder(score).replace('border-', 'stroke-'), 'transition-all duration-1000')}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold tabular-nums', getScoreColor(score), isLarge ? 'text-3xl' : 'text-2xl')}>
            {score}
          </span>
          <span className="text-xs text-neutral-400">/100</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium text-neutral-600">{label}</span>
    </div>
  );
}

// =============================================================================
// ESSAY ANALYSIS CARD
// =============================================================================

function EssayAnalysisCard({
  essay,
  schoolId,
  index,
  onRequestRewrite,
}: {
  essay: IvySingleEssayAnalysis;
  schoolId: string;
  index: number;
  onRequestRewrite?: (goals: string[]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className={cn('border-l-4', getScoreBorder(essay.overallScore))}>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <CardTitle className="text-base">{essay.promptTitle}</CardTitle>
              {getVerdictIcon(essay.wouldHelpOrHurt)}
            </div>
            <CardDescription>
              {essay.wordCount} words
              {essay.resumeEssayCheck.isResumeEssay && essay.resumeEssayCheck.confidence !== 'low' && (
                <Badge variant="warning" className="ml-2">Resume Essay Detected</Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('px-3 py-1 rounded-full font-bold text-sm', getScoreBg(essay.overallScore), getScoreColor(essay.overallScore))}>
              {essay.overallScore}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* AO First Impression */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Quote className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1">AO First Impression</p>
                <p className="text-sm text-neutral-600 italic">&quot;{essay.aoFirstImpression}&quot;</p>
              </div>
            </div>
          </div>

          {/* Honest Assessment */}
          <div>
            <p className="font-medium text-neutral-800 mb-2">{essay.honestAssessment}</p>
            <p className="text-sm text-brand-700 font-medium">
              One thing to fix: {essay.oneThingToFix}
            </p>
          </div>

          {/* So What Test */}
          <div className={cn(
            'rounded-lg p-4 border',
            essay.soWhatTest.passes ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          )}>
            <div className="flex items-center gap-2 mb-2">
              {essay.soWhatTest.passes ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="font-medium">
                &quot;So What?&quot; Test: {essay.soWhatTest.passes ? 'PASSES' : 'NEEDS WORK'}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <p><strong>What we learn:</strong> {essay.soWhatTest.whatWeLEarn}</p>
              <p><strong>What&apos;s missing:</strong> {essay.soWhatTest.whatWeDontLearn}</p>
              {essay.soWhatTest.memorableAfter100Essays && (
                <p className="text-green-700 font-medium">This essay would be memorable after reading 100 applications.</p>
              )}
            </div>
          </div>

          {/* Top Issues */}
          {essay.topIssues.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Top Issues to Address
              </h4>
              <div className="space-y-4">
                {essay.topIssues.map((issue, i) => (
                  <div key={i} className="border-l-2 border-amber-400 pl-4">
                    <p className="font-medium">{issue.rank}. {issue.issue}</p>
                    <p className="text-sm text-neutral-600 mt-1">
                      <strong>Why it matters:</strong> {issue.whyMattersForSchool}
                    </p>
                    <p className="text-sm text-brand-700 mt-1">
                      <strong>How to fix:</strong> {issue.coachingDirection}
                    </p>
                    <p className="text-sm text-neutral-500 italic mt-1">
                      AO thought: {issue.aoThought}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {essay.strengths.length > 0 && (
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-green-500" />
                What&apos;s Working
              </h4>
              <div className="space-y-2">
                {essay.strengths.map((strength, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{strength.element}</p>
                      <p className="text-sm text-neutral-600">{strength.whyWorks}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Eyes Light Up Moments */}
          {essay.eyesLightUpMoments.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-600" />
                &quot;Eyes Light Up&quot; Moments
              </h4>
              <ul className="text-sm space-y-1">
                {essay.eyesLightUpMoments.map((moment, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-600">+</span>
                    <span>{moment}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instant Reject Signals */}
          {essay.instantRejectSignals.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-red-700">
                <XCircle className="w-4 h-4" />
                Instant Reject Signals Detected
              </h4>
              <ul className="text-sm space-y-1 text-red-700">
                {essay.instantRejectSignals.map((signal, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Committee Pitch */}
          <div className={cn(
            'rounded-lg p-4',
            essay.committeePitchReady ? 'bg-green-50' : 'bg-neutral-50'
          )}>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Committee Pitch {essay.committeePitchReady ? '(Ready!)' : '(Not Yet)'}
            </h4>
            <p className="text-sm text-neutral-600 italic">&quot;{essay.committeePitchAttempt}&quot;</p>
          </div>

          {/* Requirements Check */}
          {essay.meetsRequirements.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">School Requirements Check</h4>
              <div className="space-y-2">
                {essay.meetsRequirements.map((req, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {req.met ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={req.met ? 'text-green-700' : 'text-red-700'}>{req.requirement}</span>
                      <p className="text-neutral-500 text-xs">{req.evidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewrite Actions */}
          {onRequestRewrite && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
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
        </CardContent>
      )}
    </Card>
  );
}

// =============================================================================
// SCHOOL ANALYSIS SECTION
// =============================================================================

function SchoolAnalysisSection({
  school,
  onRequestRewrite,
}: {
  school: IvySchoolAnalysis;
  onRequestRewrite?: (essayIndex: number, goals: string[]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const schoolInfo = IVY_SCHOOLS.find(s => s.id === school.schoolId);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: schoolInfo?.color || '#666' }}
            >
              {school.schoolName[0]}
            </div>
            <div>
              <CardTitle>{school.schoolName}</CardTitle>
              <CardDescription>
                {school.essays.length} essay{school.essays.length !== 1 ? 's' : ''} analyzed
                {school.readyForSubmission && (
                  <Badge variant="success" className="ml-2">Ready for Submission</Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ScoreCircle score={school.overallFitScore} label="Fit Score" />
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Overall Verdict */}
          <div className={cn(
            'rounded-xl p-5',
            school.readyForSubmission ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
          )}>
            <p className="font-medium">{school.overallVerdict}</p>
          </div>

          {/* Critical Fixes */}
          {school.criticalFixes.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="font-medium mb-3 flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                Critical Fixes Required
              </h4>
              <ul className="space-y-2">
                {school.criticalFixes.map((fix, i) => (
                  <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Portfolio Analysis */}
          {school.portfolioAnalysis && (
            <div className="bg-brand-50 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" />
                Portfolio Coherence Analysis
              </h4>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <Progress value={school.portfolioAnalysis.coherenceScore} className="h-2" />
                </div>
                <span className="text-sm font-medium">
                  {school.portfolioAnalysis.coherenceScore}/100
                </span>
              </div>
              <div className="space-y-3 text-sm">
                {school.portfolioAnalysis.redundancies.length > 0 && (
                  <div>
                    <p className="font-medium text-amber-700">Redundancies Found:</p>
                    <ul className="list-disc list-inside text-amber-600">
                      {school.portfolioAnalysis.redundancies.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {school.portfolioAnalysis.strategicGaps.length > 0 && (
                  <div>
                    <p className="font-medium text-brand-700">Strategic Gaps:</p>
                    <ul className="list-disc list-inside text-brand-600">
                      {school.portfolioAnalysis.strategicGaps.map((gap, i) => (
                        <li key={i}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {school.portfolioAnalysis.recommendations.length > 0 && (
                  <div>
                    <p className="font-medium text-green-700">Recommendations:</p>
                    <ul className="list-disc list-inside text-green-600">
                      {school.portfolioAnalysis.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Individual Essay Analyses */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Essay-by-Essay Analysis
            </h4>
            {school.essays.map((essay, index) => (
              <EssayAnalysisCard
                key={index}
                essay={essay}
                schoolId={school.schoolId}
                index={index}
                onRequestRewrite={onRequestRewrite ? (goals) => onRequestRewrite(index, goals) : undefined}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// =============================================================================
// CROSS-SCHOOL ANALYSIS
// =============================================================================

function CrossSchoolAnalysis({
  analysis,
}: {
  analysis: NonNullable<IvyAnalysisResult['crossSchoolAnalysis']>;
}) {
  return (
    <Card variant="brand">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Cross-School Narrative Analysis
        </CardTitle>
        <CardDescription>
          How your essays work together across schools
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Narrative Consistency */}
        <div className={cn(
          'rounded-lg p-4',
          analysis.narrativeConsistency ? 'bg-green-100' : 'bg-amber-100'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {analysis.narrativeConsistency ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            )}
            <span className="font-medium">
              Narrative Consistency: {analysis.narrativeConsistency ? 'Strong' : 'Needs Work'}
            </span>
          </div>
          <p className="text-sm">{analysis.masterNarrative}</p>
        </div>

        {/* Theme Overlap */}
        {analysis.themeOverlap.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Repeated Themes Across Schools</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.themeOverlap.map((theme, i) => (
                <Badge key={i} variant="secondary">{theme}</Badge>
              ))}
            </div>
            <p className="text-sm text-neutral-500 mt-2">
              Consider showing different facets of yourself to each school.
            </p>
          </div>
        )}

        {/* Differentiation Tips */}
        {analysis.differentiationTips.length > 0 && (
          <div>
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Differentiation Tips
            </h4>
            <div className="space-y-2">
              {analysis.differentiationTips.map((tip, i) => (
                <div key={i} className="text-sm p-3 bg-white rounded-lg">
                  {tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function IvyAnalysisDisplay({ result, onRequestRewrite }: IvyAnalysisDisplayProps) {
  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="premium" className="mb-2">
                {result.tier === 'ivy_single' && 'Ivy Single School'}
                {result.tier === 'ivy_bundle_3' && 'Ivy 3-School Bundle'}
                {result.tier === 'ivy_bundle_8' && 'Complete Ivy Coverage'}
              </Badge>
              <CardTitle className="text-2xl">Your Ivy League Analysis</CardTitle>
              <CardDescription>
                {result.metadata.totalEssaysAnalyzed} essays across {result.schools.length} school{result.schools.length !== 1 ? 's' : ''} •{' '}
                {result.metadata.totalWordCount.toLocaleString()} total words
              </CardDescription>
            </div>
            <div className="text-right text-sm text-neutral-500">
              Analysis v{result.metadata.analysisVersion}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* School Overview Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {result.schools.map((school) => {
              const schoolInfo = IVY_SCHOOLS.find(s => s.id === school.schoolId);
              return (
                <div
                  key={school.schoolId}
                  className={cn(
                    'p-4 rounded-xl border-2',
                    school.readyForSubmission ? 'border-green-300 bg-green-50' : 'border-neutral-200'
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: schoolInfo?.color || '#666' }}
                    >
                      {school.schoolName[0]}
                    </div>
                    <span className="font-medium">{school.schoolName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-500">{school.essays.length} essays</span>
                    <span className={cn('font-bold', getScoreColor(school.overallFitScore))}>
                      {school.overallFitScore}/100
                    </span>
                  </div>
                  {school.readyForSubmission && (
                    <Badge variant="success" className="mt-2 w-full justify-center">
                      <CheckCircle2 className="w-3 h-3" />
                      Ready
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cross-School Analysis (for bundles) */}
      {result.crossSchoolAnalysis && (
        <CrossSchoolAnalysis analysis={result.crossSchoolAnalysis} />
      )}

      {/* Individual School Analyses */}
      <div className="space-y-6">
        {result.schools.map((school) => (
          <SchoolAnalysisSection
            key={school.schoolId}
            school={school}
            onRequestRewrite={
              onRequestRewrite
                ? (essayIndex, goals) => onRequestRewrite(school.schoolId, essayIndex, goals)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

export default IvyAnalysisDisplay;
