'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EssayTextHighlighter } from './essay-text-highlighter';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Shield,
  Target,
  Eye,
  Brain,
  Sparkles,
  FileText,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Bot,
  Quote,
  Layers,
} from 'lucide-react';
import type {
  TextAnnotation,
  Tier1Structural,
  Tier2Content,
  Tier3RedFlags,
  FeedbackSection,
  AdminAnalysisData,
} from '@/lib/rag/types';

// =============================================================================
// TYPES
// =============================================================================

interface AdminAnalysisDisplayProps {
  essayText: string;
  analysisData: AdminAnalysisData;
  /** Raw scores from the base analysis (0-6 scale) */
  rawScores?: Record<string, { score: number; rationales: string[] }>;
  /** Overall score out of 100 */
  overallScore?: number;
  /** Summary text */
  summary?: string;
  /** Benchmark data */
  benchmarks?: {
    percentile: number;
    vs_average: number;
    estimated_improvement: number;
    sample_size: number;
  };
  /** Pattern matches from RAG */
  patternMatches?: Array<{
    pattern_id: string;
    pattern_name: string;
    avg_improvement: number;
    evidence?: string;
  }>;
  /** Sanitization/trust data */
  sanitization?: {
    trust_score: number;
    was_modified: boolean;
    modifications_count: number;
    modifications: string[];
  };
  /** Commons check flags */
  commonsCheck?: Record<string, { flag: boolean; evidence?: string[]; phrases?: string[]; notes?: string }>;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AdminAnalysisDisplay({
  essayText,
  analysisData,
  rawScores,
  overallScore,
  summary,
  benchmarks,
  patternMatches,
  sanitization,
  commonsCheck,
}: AdminAnalysisDisplayProps) {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [activeAnnotation, setActiveAnnotation] = useState<TextAnnotation | null>(null);

  const annotations = analysisData.text_annotations || [];

  return (
    <div className="space-y-6">
      {/* Overall Score Banner */}
      <OverallScoreBanner
        score={overallScore}
        summary={summary}
        benchmarks={benchmarks}
        sanitization={sanitization}
      />

      {/* Tab Navigation */}
      <TabNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        tier1Data={analysisData.tier1_structural}
        tier3Data={analysisData.tier3_red_flags}
        annotationCount={annotations.length}
      />

      {/* Content by active tab */}
      {activeSection === 'overview' && (
        <OverviewSection
          analysisData={analysisData}
          rawScores={rawScores}
          commonsCheck={commonsCheck}
          patternMatches={patternMatches}
        />
      )}

      {activeSection === 'essay' && (
        <EssaySection
          essayText={essayText}
          annotations={annotations}
          activeAnnotation={activeAnnotation}
          onAnnotationClick={setActiveAnnotation}
        />
      )}

      {activeSection === 'tier1' && (
        <Tier1Section data={analysisData.tier1_structural} />
      )}

      {activeSection === 'tier2' && (
        <Tier2Section data={analysisData.tier2_content} rawScores={rawScores} />
      )}

      {activeSection === 'tier3' && (
        <Tier3Section data={analysisData.tier3_red_flags} />
      )}

      {activeSection === 'feedback' && (
        <FeedbackFrameworkSection data={analysisData.feedback} />
      )}
    </div>
  );
}

// =============================================================================
// TAB NAVIGATION
// =============================================================================

function TabNavigation({
  activeSection,
  onSectionChange,
  tier1Data,
  tier3Data,
  annotationCount,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  tier1Data?: Tier1Structural;
  tier3Data?: Tier3RedFlags;
  annotationCount: number;
}) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    {
      id: 'essay',
      label: 'Essay',
      icon: FileText,
      badge: annotationCount > 0 ? `${annotationCount}` : undefined,
    },
    {
      id: 'tier1',
      label: 'Structural',
      icon: Shield,
      badge: tier1Data && !tier1Data.all_passed ? 'FAIL' : undefined,
      badgeColor: tier1Data && !tier1Data.all_passed ? 'bg-red-500' : undefined,
    },
    { id: 'tier2', label: 'Content', icon: Brain },
    {
      id: 'tier3',
      label: 'Red Flags',
      icon: AlertTriangle,
      badge: tier3Data?.has_red_flags ? `${tier3Data.flags.length}` : undefined,
      badgeColor: tier3Data?.has_red_flags ? 'bg-red-500' : undefined,
    },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  ];

  return (
    <div className="flex gap-1 overflow-x-auto pb-2 border-b border-gray-200">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeSection === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSectionChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              isActive
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
            {tab.badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700')
              } ${tab.badgeColor ? 'text-white' : ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// OVERALL SCORE BANNER
// =============================================================================

function OverallScoreBanner({
  score,
  summary,
  benchmarks,
  sanitization,
}: {
  score?: number;
  summary?: string;
  benchmarks?: AdminAnalysisDisplayProps['benchmarks'];
  sanitization?: AdminAnalysisDisplayProps['sanitization'];
}) {
  const scoreLabel = getScoreLabel(score || 0);
  const scoreColor = getScoreColor(scoreLabel);

  return (
    <Card className={`border-2 ${scoreColor.border} overflow-hidden`}>
      <div className={`${scoreColor.gradient} p-6`}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Score Circle */}
          <div className="flex-shrink-0">
            <div className={`w-24 h-24 rounded-full border-4 ${scoreColor.circleBorder} bg-white flex items-center justify-center shadow-lg`}>
              <div className="text-center">
                <span className={`text-3xl font-bold ${scoreColor.text}`}>{score || 0}</span>
                <span className="text-xs text-gray-500 block">/100</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${scoreColor.badge} text-xs font-bold`}>
                {scoreLabel}
              </Badge>
              {sanitization && (
                <Badge variant="outline" className="text-xs">
                  Trust: {sanitization.trust_score}/100
                  {sanitization.was_modified && ` (${sanitization.modifications_count} fixes)`}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{summary || 'Analysis complete.'}</p>
          </div>

          {/* Benchmarks */}
          {benchmarks && (
            <div className="flex-shrink-0 grid grid-cols-2 gap-3 text-center">
              <div className="bg-white/80 rounded-lg px-4 py-2">
                <p className="text-lg font-bold text-gray-900">{benchmarks.percentile}th</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Percentile</p>
              </div>
              <div className="bg-white/80 rounded-lg px-4 py-2">
                <p className="text-lg font-bold text-emerald-600">+{benchmarks.estimated_improvement}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Potential</p>
              </div>
              <div className="bg-white/80 rounded-lg px-4 py-2 col-span-2">
                <p className="text-xs text-gray-600">
                  {benchmarks.vs_average > 0 ? '+' : ''}{benchmarks.vs_average.toFixed(1)} vs avg
                  <span className="text-gray-400 ml-1">({benchmarks.sample_size} essays)</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// OVERVIEW SECTION
// =============================================================================

function OverviewSection({
  analysisData,
  rawScores,
  commonsCheck,
  patternMatches,
}: {
  analysisData: AdminAnalysisData;
  rawScores?: Record<string, { score: number; rationales: string[] }>;
  commonsCheck?: Record<string, { flag: boolean; evidence?: string[]; phrases?: string[]; notes?: string }>;
  patternMatches?: AdminAnalysisDisplayProps['patternMatches'];
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left: Dimension Scores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4 text-blue-600" />
            Dimension Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rawScores && Object.entries(rawScores).map(([key, data]) => (
            <DimensionScoreBar key={key} dimension={key} score={data.score} maxScore={6} />
          ))}
        </CardContent>
      </Card>

      {/* Right: Quick Flags & Patterns */}
      <div className="space-y-6">
        {/* Commons Check Summary */}
        {commonsCheck && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="w-4 h-4 text-amber-600" />
                Commons Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(commonsCheck).map(([key, val]) => (
                  <CommonsCheckBadge key={key} name={key} flagged={val.flag} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pattern Matches */}
        {patternMatches && patternMatches.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Layers className="w-4 h-4 text-purple-600" />
                Pattern Matches
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {patternMatches.map((match, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-800">{match.pattern_name}</span>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{match.avg_improvement} pts
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {analysisData.tier1_structural && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-4 h-4 text-green-600" />
                Structural Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {analysisData.tier1_structural.all_passed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">All structural requirements passed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      {analysisData.tier1_structural.flags.length} structural issue(s) found
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ESSAY SECTION (with highlights)
// =============================================================================

function EssaySection({
  essayText,
  annotations,
  activeAnnotation,
  onAnnotationClick,
}: {
  essayText: string;
  annotations: TextAnnotation[];
  activeAnnotation: TextAnnotation | null;
  onAnnotationClick: (a: TextAnnotation | null) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Annotated Essay
        </h3>
        <span className="text-xs text-gray-400">
          {essayText.split(/\s+/).filter(w => w.length > 0).length} words
        </span>
      </div>
      <EssayTextHighlighter
        essayText={essayText}
        annotations={annotations}
        onAnnotationClick={onAnnotationClick}
        activeAnnotation={activeAnnotation}
        showLegend={true}
      />

      {/* Active annotation detail panel */}
      {activeAnnotation && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-xs capitalize">{activeAnnotation.type.replace('_', ' ')}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{activeAnnotation.severity}</Badge>
                  <Badge variant="secondary" className="text-xs capitalize">{activeAnnotation.category}</Badge>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{activeAnnotation.message}</p>
                {activeAnnotation.suggestion && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-600 mb-0.5">Coaching Suggestion</p>
                    <p className="text-sm text-gray-700">{activeAnnotation.suggestion}</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 italic">
                  &ldquo;{activeAnnotation.text}&rdquo;
                </p>
              </div>
              <button
                onClick={() => onAnnotationClick(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// TIER 1: STRUCTURAL REQUIREMENTS
// =============================================================================

function Tier1Section({ data }: { data?: Tier1Structural }) {
  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Structural analysis not available for this essay.
        </CardContent>
      </Card>
    );
  }

  const checks = [
    { key: 'word_count_compliant', label: 'Word Count', icon: FileText, ...data.word_count_compliant },
    { key: 'prompt_fully_addressed', label: 'Prompt Addressed', icon: Target, ...data.prompt_fully_addressed },
    { key: 'school_name_correct', label: 'School Name', icon: Shield, ...data.school_name_correct },
    { key: 'grammar_spelling', label: 'Grammar & Spelling', icon: Eye, ...data.grammar_spelling },
    { key: 'formatting', label: 'Formatting', icon: Layers, ...data.formatting },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Tier 1: Structural Requirements
        </h3>
        <Badge className={data.all_passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {data.all_passed ? 'ALL PASS' : 'ISSUES FOUND'}
        </Badge>
      </div>

      <div className="space-y-3">
        {checks.map(check => {
          const Icon = check.icon;
          return (
            <Card key={check.key} className={`border ${check.pass ? 'border-green-200' : 'border-red-200'}`}>
              <CardContent className="py-4 px-5">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${check.pass ? 'bg-green-50' : 'bg-red-50'}`}>
                    {check.pass ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-sm text-gray-900">{check.label}</span>
                      <Badge variant={check.pass ? 'secondary' : 'destructive'} className="text-[10px]">
                        {check.pass ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{check.detail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.flags.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-red-800">
              <AlertTriangle className="w-4 h-4" />
              Immediate Flags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {data.flags.map((flag, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  {flag}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// TIER 2: CONTENT QUALITY
// =============================================================================

function Tier2Section({
  data,
  rawScores,
}: {
  data?: Tier2Content;
  rawScores?: Record<string, { score: number; rationales: string[] }>;
}) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

  if (!data && !rawScores) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Content analysis not available.
        </CardContent>
      </Card>
    );
  }

  const dimensions = [
    {
      key: 'thesis_focus',
      label: 'Thesis & Focus',
      icon: Target,
      color: 'blue',
      data: data?.thesis_focus,
      rawScore: rawScores?.authenticity,
    },
    {
      key: 'specificity_evidence',
      label: 'Specificity & Evidence',
      icon: Eye,
      color: 'amber',
      data: data?.specificity_evidence,
      rawScore: rawScores?.specificity_fit,
    },
    {
      key: 'personal_voice',
      label: 'Personal Voice & Authenticity',
      icon: MessageSquare,
      color: 'emerald',
      data: data?.personal_voice,
      rawScore: rawScores?.authenticity,
    },
    {
      key: 'insight_reflection',
      label: 'Insight & Reflection',
      icon: Brain,
      color: 'purple',
      data: data?.insight_reflection,
      rawScore: rawScores?.reflection,
    },
    {
      key: 'program_fit',
      label: 'Program Fit',
      icon: Sparkles,
      color: 'indigo',
      data: data?.program_fit,
      rawScore: rawScores?.specificity_fit,
    },
    {
      key: 'structure_flow',
      label: 'Structure & Flow',
      icon: Layers,
      color: 'orange',
      data: data?.structure_flow,
      rawScore: rawScores?.structure,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Tier 2: Content Quality (0-6 Scale)
      </h3>

      <div className="space-y-3">
        {dimensions.map(dim => {
          const score = dim.data?.score ?? dim.rawScore?.score ?? 3;
          const isExpanded = expandedDim === dim.key;
          const Icon = dim.icon;

          return (
            <Card key={dim.key} className="overflow-hidden">
              <button
                onClick={() => setExpandedDim(isExpanded ? null : dim.key)}
                className="w-full px-5 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <Icon className={`w-5 h-5 text-${dim.color}-600`} />
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900">{dim.label}</span>
                    <div className="flex items-center gap-3">
                      <ScorePill score={score} />
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  <Progress value={(score / 6) * 100} className="h-1.5 mt-2" />
                </div>
              </button>

              {isExpanded && (
                <CardContent className="pt-0 pb-5 px-5 border-t border-gray-100">
                  <div className="mt-3 space-y-3">
                    {/* Rationales */}
                    {(dim.data?.rationales || dim.rawScore?.rationales) && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Analysis</p>
                        <ul className="space-y-1.5">
                          {(dim.data?.rationales || dim.rawScore?.rationales || []).map((r, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-gray-300 mt-0.5">-</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Dimension-specific details */}
                    {dim.key === 'thesis_focus' && dim.data && 'one_sentence_summary' in dim.data && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs font-semibold text-blue-600 mb-0.5">One-Sentence Summary</p>
                        <p className="text-sm text-blue-800">{(dim.data as { one_sentence_summary?: string }).one_sentence_summary}</p>
                      </div>
                    )}

                    {dim.key === 'specificity_evidence' && dim.data && 'vague_claims' in dim.data && (
                      <VagueClaimsDisplay data={dim.data as { vague_claims?: Array<{ text: string; what_to_ask: string }>; strong_details?: Array<{ text: string; why_it_works: string }> }} />
                    )}

                    {dim.key === 'insight_reflection' && dim.data && 'surface_vs_deep' in dim.data && (
                      <InsightDepthDisplay data={dim.data as { reveals_thinking?: boolean; growth_demonstrated?: boolean; surface_vs_deep?: string }} />
                    )}

                    {dim.key === 'structure_flow' && dim.data && 'opening_type' in dim.data && (
                      <StructureDetailsDisplay data={dim.data as { opening_type?: string; opening_strength?: string; conclusion_resonates?: boolean; transitions_quality?: string; redundancy_with_resume?: boolean }} />
                    )}

                    {dim.key === 'program_fit' && dim.data && 'missing_elements' in dim.data && (
                      <ProgramFitDisplay data={dim.data as { specific_references?: Array<{ text: string; reference_type: string }>; missing_elements?: string[]; contribution_mentioned?: boolean }} />
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// TIER 2 DETAIL SUB-COMPONENTS
// =============================================================================

function VagueClaimsDisplay({
  data,
}: {
  data: {
    vague_claims?: Array<{ text: string; what_to_ask: string }>;
    strong_details?: Array<{ text: string; why_it_works: string }>;
  };
}) {
  return (
    <div className="space-y-3">
      {data.vague_claims && data.vague_claims.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1.5">Vague Claims</p>
          {data.vague_claims.map((v, i) => (
            <div key={i} className="p-2.5 bg-amber-50 rounded-lg mb-2 border border-amber-100">
              <p className="text-sm text-amber-900 italic">&ldquo;{v.text}&rdquo;</p>
              <p className="text-xs text-amber-700 mt-1">
                <HelpCircle className="w-3 h-3 inline mr-1" />
                Ask: {v.what_to_ask}
              </p>
            </div>
          ))}
        </div>
      )}
      {data.strong_details && data.strong_details.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">Strong Details</p>
          {data.strong_details.map((s, i) => (
            <div key={i} className="p-2.5 bg-emerald-50 rounded-lg mb-2 border border-emerald-100">
              <p className="text-sm text-emerald-900 italic">&ldquo;{s.text}&rdquo;</p>
              <p className="text-xs text-emerald-700 mt-1">
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                {s.why_it_works}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightDepthDisplay({
  data,
}: {
  data: { reveals_thinking?: boolean; growth_demonstrated?: boolean; surface_vs_deep?: string };
}) {
  const depthColors: Record<string, string> = {
    surface: 'bg-red-100 text-red-800',
    moderate: 'bg-amber-100 text-amber-800',
    deep: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {data.surface_vs_deep && (
        <Badge className={depthColors[data.surface_vs_deep] || 'bg-gray-100 text-gray-800'}>
          Depth: {data.surface_vs_deep}
        </Badge>
      )}
      <Badge variant={data.reveals_thinking ? 'default' : 'outline'}>
        {data.reveals_thinking ? 'Reveals thinking' : 'Missing: how they think'}
      </Badge>
      <Badge variant={data.growth_demonstrated ? 'default' : 'outline'}>
        {data.growth_demonstrated ? 'Growth shown' : 'Missing: growth narrative'}
      </Badge>
    </div>
  );
}

function StructureDetailsDisplay({
  data,
}: {
  data: {
    opening_type?: string;
    opening_strength?: string;
    conclusion_resonates?: boolean;
    transitions_quality?: string;
    redundancy_with_resume?: boolean;
  };
}) {
  const strengthColors: Record<string, string> = {
    weak: 'bg-red-100 text-red-800',
    moderate: 'bg-amber-100 text-amber-800',
    strong: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {data.opening_type && (
        <div className="p-2 bg-gray-50 rounded text-xs">
          <span className="font-semibold text-gray-500">Opening:</span>{' '}
          <span className="capitalize">{data.opening_type}</span>
        </div>
      )}
      {data.opening_strength && (
        <div className="p-2 bg-gray-50 rounded text-xs">
          <Badge className={strengthColors[data.opening_strength] || ''}>
            Hook: {data.opening_strength}
          </Badge>
        </div>
      )}
      <div className="p-2 bg-gray-50 rounded text-xs">
        <span className="font-semibold text-gray-500">Conclusion:</span>{' '}
        {data.conclusion_resonates ? (
          <span className="text-emerald-700">Resonates</span>
        ) : (
          <span className="text-red-700">Needs work</span>
        )}
      </div>
      {data.transitions_quality && (
        <div className="p-2 bg-gray-50 rounded text-xs">
          <span className="font-semibold text-gray-500">Transitions:</span>{' '}
          <span className="capitalize">{data.transitions_quality}</span>
        </div>
      )}
      {data.redundancy_with_resume && (
        <div className="p-2 bg-amber-50 rounded text-xs col-span-2">
          <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-600" />
          <span className="text-amber-800">Resume redundancy detected</span>
        </div>
      )}
    </div>
  );
}

function ProgramFitDisplay({
  data,
}: {
  data: {
    specific_references?: Array<{ text: string; reference_type: string }>;
    missing_elements?: string[];
    contribution_mentioned?: boolean;
  };
}) {
  return (
    <div className="space-y-3">
      {data.specific_references && data.specific_references.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-600 mb-1.5">References Found</p>
          {data.specific_references.map((ref, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="text-[10px]">{ref.reference_type}</Badge>
              <span className="text-sm text-gray-700 italic">&ldquo;{ref.text}&rdquo;</span>
            </div>
          ))}
        </div>
      )}
      {data.missing_elements && data.missing_elements.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-600 mb-1.5">Missing Elements</p>
          <ul className="space-y-1">
            {data.missing_elements.map((el, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                {el}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center gap-2">
        {data.contribution_mentioned ? (
          <Badge className="bg-emerald-100 text-emerald-800 text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Contribution mentioned
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-800 text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            Missing: what applicant contributes
          </Badge>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TIER 3: RED FLAGS
// =============================================================================

function Tier3Section({ data }: { data?: Tier3RedFlags }) {
  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Red flag analysis not available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Tier 3: Red Flags & Deal Breakers
        </h3>
        <Badge className={data.has_red_flags ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
          {data.has_red_flags ? `${data.flags.length} FLAG(S)` : 'CLEAR'}
        </Badge>
      </div>

      {data.has_red_flags ? (
        <div className="space-y-3">
          {data.flags.map((flag, i) => (
            <Card key={i} className={`border-l-4 ${flag.severity === 'critical' ? 'border-l-red-500 bg-red-50' : 'border-l-amber-500 bg-amber-50'}`}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start gap-3">
                  {flag.severity === 'critical' ? (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={flag.severity === 'critical' ? 'destructive' : 'outline'} className="text-[10px]">
                        {flag.severity}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {flag.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{flag.description}</p>
                    {flag.evidence && (
                      <p className="text-xs text-gray-600 italic mt-1">
                        <Quote className="w-3 h-3 inline mr-1" />
                        &ldquo;{flag.evidence.text}&rdquo;
                      </p>
                    )}
                    {flag.recommendation && (
                      <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                        <p className="text-xs font-semibold text-blue-600">
                          <Lightbulb className="w-3 h-3 inline mr-1" />
                          Recommendation
                        </p>
                        <p className="text-sm text-gray-700">{flag.recommendation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-800">No red flags detected</p>
            <p className="text-xs text-green-600 mt-1">Essay passes all deal-breaker checks</p>
          </CardContent>
        </Card>
      )}

      {/* AI Content Signals */}
      {data.ai_content_signals && (
        <Card className={`border ${
          data.ai_content_signals.likelihood === 'high' ? 'border-purple-300 bg-purple-50' :
          data.ai_content_signals.likelihood === 'medium' ? 'border-amber-300 bg-amber-50' :
          'border-green-200 bg-green-50'
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bot className="w-4 h-4" />
              AI-Generated Content Analysis
              <Badge className={`text-[10px] ${
                data.ai_content_signals.likelihood === 'high' ? 'bg-purple-200 text-purple-800' :
                data.ai_content_signals.likelihood === 'medium' ? 'bg-amber-200 text-amber-800' :
                'bg-green-200 text-green-800'
              }`}>
                {data.ai_content_signals.likelihood} likelihood
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.ai_content_signals.signals_detected.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Signals Detected</p>
                <ul className="space-y-1">
                  {data.ai_content_signals.signals_detected.map((signal, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-purple-400 mt-0.5">-</span>
                      {signal}
                    </li>
                  ))}
                </ul>
                {data.ai_content_signals.recommendation && (
                  <div className="p-2 bg-white rounded border border-gray-200 mt-2">
                    <p className="text-xs font-semibold text-blue-600 mb-0.5">Next Step</p>
                    <p className="text-sm text-gray-700">{data.ai_content_signals.recommendation}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-green-700">No AI-generated content signals detected.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// FEEDBACK FRAMEWORK
// =============================================================================

function FeedbackFrameworkSection({ data }: { data?: FeedbackSection }) {
  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Structured feedback not available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Structured Feedback (Student-Ready)
      </h3>

      {/* Overall Assessment */}
      <Card className="border-2 border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Overall Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-800 leading-relaxed">{data.overall_assessment}</p>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              Prompt: {data.prompt_compliance}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* What's Working */}
      {data.whats_working.length > 0 && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              What&apos;s Working
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.whats_working.map((item, i) => (
              <div key={i} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-sm text-emerald-900 italic mb-1">&ldquo;{item.passage}&rdquo;</p>
                <p className="text-xs text-emerald-700">{item.why}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Priority Improvements */}
      {data.priority_improvements.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              Priority Improvements (Top 3)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.priority_improvements.map((item, i) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                    {item.rank || i + 1}
                  </span>
                  <span className="font-medium text-sm text-gray-900">{item.issue}</span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <p className="text-sm text-gray-700">{item.why_it_matters}</p>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 mb-0.5">Coaching Direction</p>
                    <p className="text-sm text-blue-800">{item.coaching_suggestion}</p>
                  </div>
                  {item.affected_text && (
                    <p className="text-xs text-gray-500 italic">
                      <Quote className="w-3 h-3 inline mr-1" />
                      Refers to: &ldquo;{item.affected_text.text}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Questions for Writer */}
      {data.questions_for_writer.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-800">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Questions for the Writer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.questions_for_writer.map((q, i) => (
              <div key={i} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-900">{q.question}</p>
                <p className="text-xs text-blue-700 mt-1">{q.context}</p>
                {q.related_text && (
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Re: &ldquo;{q.related_text}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// SHARED HELPERS
// =============================================================================

function DimensionScoreBar({
  dimension,
  score,
  maxScore,
}: {
  dimension: string;
  score: number;
  maxScore: number;
}) {
  const percentage = (score / maxScore) * 100;
  const label = dimension.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const colorClass =
    score <= 2 ? 'text-red-600' :
    score <= 3 ? 'text-amber-600' :
    score <= 4 ? 'text-blue-600' :
    'text-emerald-600';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-gray-600 w-28 truncate">{label}</span>
      <div className="flex-1">
        <Progress value={percentage} className="h-2" />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${colorClass}`}>{score}</span>
      <span className="text-xs text-gray-400">/{maxScore}</span>
    </div>
  );
}

function ScorePill({ score }: { score: number }) {
  const bg =
    score <= 2 ? 'bg-red-100 text-red-800' :
    score <= 3 ? 'bg-amber-100 text-amber-800' :
    score <= 4 ? 'bg-blue-100 text-blue-800' :
    'bg-emerald-100 text-emerald-800';

  return (
    <span className={`${bg} text-xs font-bold px-2 py-0.5 rounded-full`}>
      {score}/6
    </span>
  );
}

function CommonsCheckBadge({ name, flagged }: { name: string; flagged: boolean }) {
  const positiveFlags = ['about_applicant', 'goals_articulated', 'school_alignment'];
  const isPositive = positiveFlags.includes(name);
  const isGood = isPositive ? flagged : !flagged;

  const label = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs ${
      isGood ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
    }`}>
      {isGood ? (
        <CheckCircle2 className="w-3 h-3 text-green-500" />
      ) : (
        <AlertCircle className="w-3 h-3 text-red-500" />
      )}
      <span className="truncate">{label}</span>
    </div>
  );
}

function getScoreLabel(score: number): string {
  if (score >= 85) return 'Exceptional';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Competitive';
  if (score >= 40) return 'Developing';
  return 'Needs Work';
}

function getScoreColor(label: string) {
  const colors: Record<string, {
    border: string;
    gradient: string;
    circleBorder: string;
    text: string;
    badge: string;
  }> = {
    'Exceptional': {
      border: 'border-purple-200',
      gradient: 'bg-gradient-to-r from-purple-50 to-indigo-50',
      circleBorder: 'border-purple-400',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800',
    },
    'Strong': {
      border: 'border-emerald-200',
      gradient: 'bg-gradient-to-r from-emerald-50 to-green-50',
      circleBorder: 'border-emerald-400',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    'Competitive': {
      border: 'border-blue-200',
      gradient: 'bg-gradient-to-r from-blue-50 to-sky-50',
      circleBorder: 'border-blue-400',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800',
    },
    'Developing': {
      border: 'border-amber-200',
      gradient: 'bg-gradient-to-r from-amber-50 to-orange-50',
      circleBorder: 'border-amber-400',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-800',
    },
    'Needs Work': {
      border: 'border-red-200',
      gradient: 'bg-gradient-to-r from-red-50 to-rose-50',
      circleBorder: 'border-red-400',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800',
    },
  };

  return colors[label] || colors['Developing'];
}
