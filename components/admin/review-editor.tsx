'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Save, FileText, AlertCircle, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToastActions } from '@/components/ui/toast';
import { AdminAnalysisDisplay } from './admin-analysis-display';
import type { AdminAnalysisData } from '@/lib/rag/types';

export function AdminReviewEditor({ review, adminId }: { review: any; adminId: string }) {
  const router = useRouter();
  const toast = useToastActions();
  const [feedback, setFeedback] = useState(review.reviewerNotes || '');
  const [summary, setSummary] = useState(review.summary || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(true);
  const [showEssayInfo, setShowEssayInfo] = useState(false);

  const essay = review.version.essay;
  const aiAnalysis = review.version.analyses[0];
  const userName = review.order.user.profile?.name || review.order.user.email.split('@')[0];
  const wordCount = review.version.content.split(/\s+/).length;

  // Extract admin analysis data from the AI analysis JSON
  const analysisJson = aiAnalysis?.analysisJson || {};
  const adminAnalysisData: AdminAnalysisData = analysisJson.admin_analysis || {
    tier1_structural: analysisJson.tier1_structural,
    tier2_content: analysisJson.tier2_content,
    tier3_red_flags: analysisJson.tier3_red_flags,
    text_annotations: analysisJson.text_annotations,
    feedback: analysisJson.feedback,
  };

  const hasAdminData = !!(
    adminAnalysisData.tier1_structural ||
    adminAnalysisData.tier2_content ||
    adminAnalysisData.tier3_red_flags ||
    adminAnalysisData.text_annotations?.length ||
    adminAnalysisData.feedback
  );

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerNotes: feedback,
          summary,
          status: 'IN_PROGRESS',
          reviewerId: adminId,
        }),
      });

      if (!res.ok) throw new Error('Failed to save draft');

      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeliver = async () => {
    if (!feedback.trim() || !summary.trim()) {
      toast.warning('Please provide both feedback and summary before delivering.');
      return;
    }

    // Using window.confirm for delivery confirmation is intentional for critical action
    if (!window.confirm('Are you sure you want to deliver this review? The student will be notified via email.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerNotes: feedback,
          summary,
          reviewerId: adminId,
        }),
      });

      if (!res.ok) throw new Error('Failed to deliver review');

      toast.success('Review delivered! Student has been notified.');
      router.push('/admin');
    } catch (error) {
      console.error('Delivery error:', error);
      toast.error('Failed to deliver review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Queue
              </Button>
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{userName}</span>
              <span className="text-gray-400">|</span>
              <span>{essay.type.replace(/_/g, ' ')}</span>
              {essay.targetSchool && (
                <>
                  <span className="text-gray-400">|</span>
                  <Badge variant="secondary" className="text-[10px]">{essay.targetSchool}</Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              className="text-xs"
            >
              {showFullAnalysis ? (
                <><EyeOff className="w-3.5 h-3.5 mr-1.5" />Hide Analysis</>
              ) : (
                <><Eye className="w-3.5 h-3.5 mr-1.5" />Show Analysis</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button size="sm" onClick={handleDeliver} disabled={isSubmitting}>
              <Send className="w-3.5 h-3.5 mr-1.5" />
              {isSubmitting ? 'Delivering...' : 'Deliver'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Essay Info Bar (collapsible) */}
        <div className="mb-6">
          <button
            onClick={() => setShowEssayInfo(!showEssayInfo)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 text-sm">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-700">Essay Details</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">{wordCount} words</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">v{review.version.versionIndex}</span>
              <span className="text-gray-400">|</span>
              <Badge variant="outline" className="text-[10px]">
                {review.order.package.replace(/_/g, ' ')}
              </Badge>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">Due: {new Date(review.dueAt).toLocaleDateString()}</span>
            </div>
            {showEssayInfo ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>

          {showEssayInfo && (
            <Card className="mt-2 border-gray-200">
              <CardContent className="py-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide block mb-0.5">Student</span>
                    <span className="text-gray-900">{userName}</span>
                    <span className="text-gray-500 text-xs block">{review.order.user.email}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide block mb-0.5">Essay Type</span>
                    <span className="text-gray-900">{essay.type.replace(/_/g, ' ')}</span>
                  </div>
                  {essay.targetSchool && (
                    <div>
                      <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide block mb-0.5">Target School</span>
                      <span className="text-gray-900">{essay.targetSchool}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-500 text-xs uppercase tracking-wide block mb-0.5">Essay Prompt</span>
                    <p className="text-gray-700 text-xs leading-relaxed line-clamp-3">{essay.promptText}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Layout: Analysis + Review Form */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Full AI Analysis (wider column) */}
          {showFullAnalysis && (
            <div className="lg:col-span-3 space-y-6">
              {hasAdminData ? (
                <AdminAnalysisDisplay
                  essayText={review.version.content}
                  analysisData={adminAnalysisData}
                  rawScores={analysisJson.scores}
                  overallScore={aiAnalysis ? Math.round(aiAnalysis.overallScore) : undefined}
                  summary={analysisJson.overall?.summary || analysisJson.overall?.recommendation}
                  benchmarks={analysisJson.benchmarks}
                  patternMatches={analysisJson.pattern_matches}
                  sanitization={analysisJson.sanitization}
                  commonsCheck={analysisJson.commons_check}
                />
              ) : aiAnalysis ? (
                /* Fallback: show old-style analysis if no admin data available */
                <LegacyAnalysisDisplay
                  essayText={review.version.content}
                  aiAnalysis={aiAnalysis}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No AI analysis available</p>
                    <p className="text-xs text-gray-400 mt-1">Analysis may still be processing or was not run for this essay.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Right: Review Form */}
          <div className={`${showFullAnalysis ? 'lg:col-span-2' : 'lg:col-span-5 max-w-3xl mx-auto w-full'} space-y-5`}>
            {/* Voice Preservation Reminder */}
            <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900">
                    <p className="font-semibold">Voice Preservation</p>
                    <p className="mt-0.5 leading-relaxed">
                      Coach, don&apos;t write. Suggest and question, never replace their voice.
                      Focus on 3 highest-impact changes. Use &ldquo;Consider...&rdquo; not &ldquo;Change to...&rdquo;
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overall Assessment</CardTitle>
                <CardDescription className="text-xs">2-3 sentences: Does the essay work? Core strength/weakness.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="This essay has a compelling central story but currently tells rather than shows. The strongest section is [X] where specific detail creates genuine engagement. The main priority is adding concrete examples to support claims about [Y]."
                  rows={4}
                  className="text-sm"
                />
              </CardContent>
            </Card>

            {/* Detailed Feedback */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Detailed Feedback</CardTitle>
                <CardDescription className="text-xs">
                  Structured feedback following the evaluation framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={`## What's Working
- [Specific passage that succeeds and WHY]
- [Strong moment with quoted text]

## Priority Improvements

1. [MOST IMPORTANT CHANGE]
   - What: [specific issue]
   - Why it matters: [impact on admissions]
   - Direction: [coaching suggestion, NOT rewrite]
   - Refers to: "[quoted text from essay]"

2. [SECOND PRIORITY]
   ...

3. [THIRD PRIORITY]
   ...

## Questions for You
- What did that moment feel like?
- Can you give a specific example of [X]?
- What did you learn from [Y]?

## Scores (1-5)
- Thesis & Focus: X/5
- Specificity & Evidence: X/5
- Personal Voice: X/5
- Insight & Reflection: X/5
- Program Fit: X/5
- Structure & Flow: X/5

## Prompt Compliance: Complete / Missing [X]

## Red Flags: None / [list]`}
                    rows={30}
                    className="font-mono text-xs leading-relaxed"
                  />

                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="font-semibold">Format:</span>
                    <Badge variant="outline" className="text-[10px]">Markdown supported</Badge>
                    <span className="text-gray-300">|</span>
                    <span>Quote passages for context</span>
                    <span className="text-gray-300">|</span>
                    <span>Max 3 priorities</span>
                    <span className="text-gray-300">|</span>
                    <span>End with questions</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// LEGACY ANALYSIS DISPLAY (fallback when no admin_analysis data)
// =============================================================================

function LegacyAnalysisDisplay({
  essayText,
  aiAnalysis,
}: {
  essayText: string;
  aiAnalysis: any;
}) {
  return (
    <div className="space-y-6">
      {/* Essay Text (plain, no highlights) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            Essay Text
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap font-serif text-base leading-[1.8] text-gray-800 border border-gray-200">
            {essayText}
          </div>
        </CardContent>
      </Card>

      {/* Score */}
      <Card className="border-2 border-blue-200">
        <CardContent className="py-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full border-3 border-blue-400 bg-blue-50 flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-700">{Math.round(aiAnalysis.overallScore)}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                {aiAnalysis.analysisJson.overall?.summary || aiAnalysis.analysisJson.overall?.recommendation || 'Analysis complete.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scores Grid */}
      {aiAnalysis.analysisJson.scores && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Dimension Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {Object.entries(aiAnalysis.analysisJson.scores).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-600 text-xs capitalize">{key.replace(/_/g, ' ')}</span>
                  <span className={`font-bold text-sm ${
                    value.score <= 2 ? 'text-red-600' :
                    value.score <= 3 ? 'text-amber-600' :
                    value.score <= 4 ? 'text-blue-600' :
                    'text-emerald-600'
                  }`}>{value.score}/6</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Issues */}
      {aiAnalysis.analysisJson.suggestions?.top5?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiAnalysis.analysisJson.suggestions.top5.slice(0, 5).map((s: any, i: number) => (
              <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm font-medium text-gray-900">{s.issue}</p>
                <p className="text-xs text-gray-600 mt-0.5">{s.why_it_matters}</p>
                {s.example_edit && (
                  <p className="text-xs text-blue-700 mt-1 italic">{s.example_edit}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
