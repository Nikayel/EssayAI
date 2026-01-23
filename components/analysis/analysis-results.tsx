'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Lock,
  Sparkles,
  MessageSquare,
  Target,
  Eye,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type {
  QuickAnalysisResult,
  StandardAnalysisResult,
  PremiumAnalysisResult,
  AnnotationWithFix,
  PrioritizedIssueWithFix,
} from '@/lib/scoring/tiers/types';

// =============================================================================
// TYPES
// =============================================================================

type AnalysisResult = QuickAnalysisResult | StandardAnalysisResult | PremiumAnalysisResult;

interface AnalysisResultsProps {
  result: AnalysisResult;
  onUpgrade?: (tier: 'standard' | 'premium') => void;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AnalysisResults({ result, onUpgrade }: AnalysisResultsProps) {
  const tier = result.tier;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Score Header */}
      <ScoreHeader result={result} />

      {/* Tier-specific content */}
      {tier === 'quick' && (
        <QuickTierResults result={result as QuickAnalysisResult} onUpgrade={onUpgrade} />
      )}

      {(tier === 'standard' || tier === 'premium') && (
        <StandardTierResults result={result as StandardAnalysisResult} />
      )}

      {tier === 'premium' && (
        <PremiumTierResults result={result as PremiumAnalysisResult} />
      )}
    </div>
  );
}

// =============================================================================
// SCORE HEADER
// =============================================================================

function ScoreHeader({ result }: { result: AnalysisResult }) {
  const scoreColors: Record<string, string> = {
    needs_work: 'text-red-600 bg-red-50 border-red-200',
    developing: 'text-orange-600 bg-orange-50 border-orange-200',
    competitive: 'text-blue-600 bg-blue-50 border-blue-200',
    strong: 'text-green-600 bg-green-50 border-green-200',
    exceptional: 'text-purple-600 bg-purple-50 border-purple-200',
  };

  const scoreLabels: Record<string, string> = {
    needs_work: 'Needs Work',
    developing: 'Developing',
    competitive: 'Competitive',
    strong: 'Strong',
    exceptional: 'Exceptional',
  };

  return (
    <Card className={`border-2 ${scoreColors[result.scoreLabel]}`}>
      <CardContent className="py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Score Circle */}
          <div className="text-center">
            <div
              className={`w-32 h-32 rounded-full border-4 ${scoreColors[result.scoreLabel]} flex items-center justify-center`}
            >
              <div>
                <span className="text-4xl font-bold">{result.overallScore}</span>
                <span className="text-lg text-gray-500">/100</span>
              </div>
            </div>
            <div className="mt-3">
              <Badge className={scoreColors[result.scoreLabel]}>
                {scoreLabels[result.scoreLabel]}
              </Badge>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">Your Essay Score</h2>
            <p className="text-gray-600">{result.scoreSummary}</p>

            {/* Quick stats for non-quick tiers */}
            {result.tier !== 'quick' && 'metadata' in result && (
              <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
                <StatBadge icon={FileText} label="Words" value={result.metadata.wordCount} />
                {'sentenceCount' in result.metadata && (
                  <StatBadge icon={MessageSquare} label="Sentences" value={result.metadata.sentenceCount} />
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBadge({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Icon className="w-4 h-4" />
      <span>
        {value} {label}
      </span>
    </div>
  );
}

// =============================================================================
// QUICK TIER RESULTS
// =============================================================================

function QuickTierResults({
  result,
  onUpgrade,
}: {
  result: QuickAnalysisResult;
  onUpgrade?: (tier: 'standard' | 'premium') => void;
}) {
  return (
    <>
      {/* AI Detection Warning */}
      {result.aiDetection.likelihood !== 'low' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900">AI Writing Detected</h4>
                <p className="text-sm text-amber-800">{result.aiDetection.verdict}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actionable Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Top Issues to Fix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.actionableItems.map((item, index) => (
            <ActionableItem key={index} item={item} index={index + 1} />
          ))}
        </CardContent>
      </Card>

      {/* Upgrade Teaser */}
      <UpgradeTeaser result={result} onUpgrade={onUpgrade} />
    </>
  );
}

function ActionableItem({
  item,
  index,
}: {
  item: QuickAnalysisResult['actionableItems'][0];
  index: number;
}) {
  const severityColors = {
    critical: 'border-red-200 bg-red-50',
    major: 'border-orange-200 bg-orange-50',
    minor: 'border-yellow-200 bg-yellow-50',
  };

  const severityIcons = {
    critical: <XCircle className="w-5 h-5 text-red-600" />,
    major: <AlertTriangle className="w-5 h-5 text-orange-600" />,
    minor: <AlertCircle className="w-5 h-5 text-yellow-600" />,
  };

  return (
    <div className={`border rounded-lg p-4 ${severityColors[item.severity]}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
          {index}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {severityIcons[item.severity]}
            <span className="text-xs text-gray-500">{item.location}</span>
          </div>
          <p className="font-semibold text-gray-900">{item.issue}</p>
          <p className="text-sm text-gray-700 mt-1">{item.bluntFeedback}</p>
        </div>
      </div>
    </div>
  );
}

function UpgradeTeaser({
  result,
  onUpgrade,
}: {
  result: QuickAnalysisResult;
  onUpgrade?: (tier: 'standard' | 'premium') => void;
}) {
  return (
    <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardContent className="py-8">
        <div className="text-center mb-6">
          <Lock className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Unlock Full Analysis
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">{result.teaser.message}</p>
        </div>

        {/* Blurred Preview */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <BlurredPreview
            title="5 Dimensions"
            value={`${result.hiddenInsights.totalIssuesFound} issues found`}
            icon={Target}
          />
          <BlurredPreview
            title="School Fit"
            value={`${result.hiddenInsights.schoolSpecificIssues} school-specific`}
            icon={Target}
          />
          <BlurredPreview
            title="Strengths"
            value={`${result.hiddenInsights.strengthsFound} identified`}
            icon={Sparkles}
          />
        </div>

        {/* Upgrade Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onUpgrade?.('standard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            Full Analysis - $79
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpgrade?.('premium')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
          >
            Expert Review - $249
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

function BlurredPreview({ title, value, icon: Icon }: { title: string; value: string; icon: any }) {
  return (
    <div className="bg-white/60 backdrop-blur rounded-lg p-4 text-center border border-white">
      <Icon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <p className="text-xs text-gray-500 blur-[2px]">{value}</p>
    </div>
  );
}

// =============================================================================
// STANDARD TIER RESULTS
// =============================================================================

function StandardTierResults({ result }: { result: StandardAnalysisResult }) {
  const [expandedSection, setExpandedSection] = useState<string | null>('dimensions');

  return (
    <>
      {/* AI Detection */}
      {result.aiDetection.aiLikelihood !== 'low' && (
        <AIDetectionCard result={result} />
      )}

      {/* Dimension Breakdown */}
      <CollapsibleSection
        title="Score Breakdown"
        icon={Target}
        isOpen={expandedSection === 'dimensions'}
        onToggle={() => setExpandedSection(expandedSection === 'dimensions' ? null : 'dimensions')}
      >
        <DimensionBreakdown dimensions={result.dimensions} />
      </CollapsibleSection>

      {/* School-Specific Feedback */}
      <CollapsibleSection
        title={`${result.schoolFeedback.schoolDisplayName} Fit Analysis`}
        icon={Target}
        isOpen={expandedSection === 'school'}
        onToggle={() => setExpandedSection(expandedSection === 'school' ? null : 'school')}
      >
        <SchoolFeedback feedback={result.schoolFeedback} />
      </CollapsibleSection>

      {/* AO Insights */}
      <CollapsibleSection
        title="What Admissions Officers Think"
        icon={Eye}
        isOpen={expandedSection === 'ao'}
        onToggle={() => setExpandedSection(expandedSection === 'ao' ? null : 'ao')}
      >
        <AOInsightsDisplay insights={result.aoInsights} />
      </CollapsibleSection>

      {/* All Issues with Fixes */}
      <CollapsibleSection
        title="All Issues & How to Fix"
        icon={AlertCircle}
        isOpen={expandedSection === 'issues'}
        onToggle={() => setExpandedSection(expandedSection === 'issues' ? null : 'issues')}
        badge={`${result.allIssues.length} issues`}
      >
        <IssuesList issues={result.allIssues} />
      </CollapsibleSection>

      {/* Strengths */}
      <CollapsibleSection
        title="Strengths to Keep"
        icon={CheckCircle2}
        isOpen={expandedSection === 'strengths'}
        onToggle={() => setExpandedSection(expandedSection === 'strengths' ? null : 'strengths')}
      >
        <StrengthsList strengths={result.strengths} />
      </CollapsibleSection>
    </>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  badge,
}: {
  title: string;
  icon: any;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: string;
}) {
  return (
    <Card>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-blue-600" />
          <span className="font-semibold">{title}</span>
          {badge && (
            <Badge variant="secondary" className="ml-2">
              {badge}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}

function AIDetectionCard({ result }: { result: StandardAnalysisResult }) {
  const likelihoodColors = {
    low: 'bg-green-50 border-green-200',
    medium: 'bg-amber-50 border-amber-200',
    high: 'bg-red-50 border-red-200',
  };

  return (
    <Card className={`border-2 ${likelihoodColors[result.aiDetection.aiLikelihood]}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="w-5 h-5" />
          AI Writing Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold">{result.aiDetection.aiScore}%</div>
            <div className="text-sm text-gray-500">AI Likelihood</div>
          </div>
          <div className="flex-1">
            <p className="font-medium">{result.aiDetection.bluntVerdict}</p>
          </div>
        </div>

        {result.aiFeedback.length > 0 && (
          <div className="space-y-2">
            {result.aiFeedback.map((feedback, i) => (
              <div key={i} className="text-sm p-3 bg-white rounded border">
                <p className="font-semibold">{feedback.headline}</p>
                <p className="text-gray-600">{feedback.explanation}</p>
                {feedback.aoThought && (
                  <p className="text-gray-500 italic mt-1">AO thinks: &quot;{feedback.aoThought}&quot;</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DimensionBreakdown({ dimensions }: { dimensions: StandardAnalysisResult['dimensions'] }) {
  return (
    <div className="space-y-4">
      {Object.entries(dimensions).map(([key, dim]) => (
        <div key={key} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{dim.name}</span>
            <span className="font-bold text-lg">
              {dim.totalScore}/{dim.maxScore}
            </span>
          </div>
          <Progress value={(dim.totalScore / dim.maxScore) * 100} className="h-2 mb-2" />
          <p className="text-sm text-gray-600">{dim.summary}</p>
        </div>
      ))}
    </div>
  );
}

function SchoolFeedback({ feedback }: { feedback: StandardAnalysisResult['schoolFeedback'] }) {
  const fitColors = {
    weak: 'text-red-600',
    moderate: 'text-orange-600',
    strong: 'text-green-600',
    excellent: 'text-purple-600',
  };

  return (
    <div className="space-y-6">
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500 mb-1">School Fit Score</p>
        <p className={`text-3xl font-bold ${fitColors[feedback.fitLabel]}`}>
          {feedback.fitScore}/100
        </p>
        <Badge className={`mt-2 ${fitColors[feedback.fitLabel]}`}>
          {feedback.fitLabel.charAt(0).toUpperCase() + feedback.fitLabel.slice(1)} Fit
        </Badge>
      </div>

      {feedback.alignedElements.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-green-700">What You Got Right</h4>
          <ul className="space-y-1">
            {feedback.alignedElements.map((el, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{el}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {feedback.missingElements.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-amber-700">What&apos;s Missing</h4>
          <div className="space-y-3">
            {feedback.missingElements.map((el, i) => (
              <div key={i} className="p-3 bg-amber-50 rounded border border-amber-100">
                <p className="font-medium text-sm">{el.element}</p>
                <p className="text-sm text-gray-600">{el.why}</p>
                <p className="text-sm text-amber-700 mt-1">
                  <strong>How to add:</strong> {el.howToAdd}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {feedback.redFlags.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2 text-red-700">Red Flags</h4>
          <div className="space-y-2">
            {feedback.redFlags.map((flag, i) => (
              <div
                key={i}
                className={`p-3 rounded border ${
                  flag.severity === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <p className="font-medium text-sm">{flag.flag}</p>
                <p className="text-sm text-gray-600">Found: &quot;{flag.text}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AOInsightsDisplay({ insights }: { insights: StandardAnalysisResult['aoInsights'] }) {
  return (
    <div className="space-y-6">
      {/* First Impression */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2">First Impression</h4>
        <p className="text-sm text-gray-700">{insights.firstImpression.hookVerdict}</p>
        <p className="text-xs text-gray-500 mt-1">{insights.firstImpression.timeToDecision}</p>
      </div>

      {/* What They Value */}
      <div>
        <h4 className="font-semibold mb-3">What {insights.school} Values</h4>
        <div className="grid gap-3">
          {insights.whatTheyValue.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
              {item.yourEssayHas ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
              )}
              <div>
                <p className="font-medium">{item.trait}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AO Thoughts While Reading */}
      {insights.aoThoughts.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">AO Thoughts While Reading</h4>
          <div className="space-y-2">
            {insights.aoThoughts.map((thought, i) => {
              const sentimentColors = {
                positive: 'border-l-green-500 bg-green-50',
                neutral: 'border-l-gray-400 bg-gray-50',
                negative: 'border-l-red-500 bg-red-50',
              };
              return (
                <div
                  key={i}
                  className={`border-l-4 ${sentimentColors[thought.sentiment]} p-3 rounded-r`}
                >
                  <p className="text-xs text-gray-500 mb-1">{thought.location}</p>
                  <p className="text-sm italic">&quot;{thought.thought}&quot;</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overall Verdict */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <h4 className="font-semibold mb-2">Overall AO Verdict</h4>
        <p className="text-gray-700">{insights.overallVerdict}</p>
      </div>
    </div>
  );
}

function IssuesList({ issues }: { issues: PrioritizedIssueWithFix[] }) {
  return (
    <div className="space-y-4">
      {issues.map((issue, i) => (
        <div key={i} className="p-4 border rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold">
              {issue.rank}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{issue.issue}</p>
              <p className="text-sm text-gray-600 mt-1">{issue.bluntFeedback.explanation}</p>
              {issue.bluntFeedback.aoThought && (
                <p className="text-sm text-gray-500 italic mt-2">
                  AO thinks: &quot;{issue.bluntFeedback.aoThought}&quot;
                </p>
              )}
              {issue.bluntFeedback.fix && (
                <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                  <strong>How to fix:</strong> {issue.bluntFeedback.fix}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StrengthsList({
  strengths,
}: {
  strengths: StandardAnalysisResult['strengths'];
}) {
  return (
    <div className="space-y-3">
      {strengths.map((strength, i) => (
        <div key={i} className="p-4 bg-green-50 border border-green-100 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">{strength.element}</p>
              {strength.location && (
                <p className="text-xs text-green-700 mb-1">{strength.location}</p>
              )}
              <p className="text-sm text-gray-700">{strength.why}</p>
              <p className="text-sm text-green-700 italic mt-1">
                AO: &quot;{strength.aoThought}&quot;
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// PREMIUM TIER RESULTS
// =============================================================================

function PremiumTierResults({ result }: { result: PremiumAnalysisResult }) {
  return (
    <>
      {/* Human Review Status */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-1">
                Human Expert Review
              </h3>
              <p className="text-sm text-purple-800">
                Status: <strong>{result.humanReview.status}</strong>
              </p>
              {result.humanReview.assignedTo && (
                <p className="text-sm text-purple-700 mt-1">
                  Reviewer: {result.humanReview.assignedTo}
                  {result.humanReview.credentials && ` (${result.humanReview.credentials})`}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-2">{result.humanReview.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Rewrite Suggestions */}
      {result.rewriteSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Rewrite Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.rewriteSuggestions.map((suggestion, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500 mb-2">
                  Paragraph {suggestion.location.paragraphNumber}, Lines{' '}
                  {suggestion.location.lineStart}-{suggestion.location.lineEnd}
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-1">ORIGINAL</p>
                    <p className="text-sm p-2 bg-red-50 rounded">{suggestion.original}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-1">SUGGESTED</p>
                    <p className="text-sm p-2 bg-green-50 rounded">
                      {suggestion.suggestedRewrite}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{suggestion.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
