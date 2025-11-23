'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Send, Save, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function AdminReviewEditor({ review, adminId }: { review: any; adminId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(review.reviewerNotes || '');
  const [summary, setSummary] = useState(review.summary || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const essay = review.version.essay;
  const aiAnalysis = review.version.analyses[0];
  const userName = review.order.user.profile?.name || review.order.user.email.split('@')[0];
  const wordCount = review.version.content.split(/\s+/).length;

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

      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save draft. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeliver = async () => {
    if (!feedback.trim() || !summary.trim()) {
      alert('Please provide both feedback and summary before delivering.');
      return;
    }

    if (!confirm('Are you sure you want to deliver this review? The student will be notified via email.')) {
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

      alert('Review delivered successfully! Student has been notified.');
      router.push('/admin');
    } catch (error) {
      console.error('Delivery error:', error);
      alert('Failed to deliver review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Queue
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button onClick={handleDeliver} disabled={isSubmitting}>
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Delivering...' : 'Deliver Review'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column: Essay & AI Analysis */}
          <div className="space-y-6">
            {/* Student & Essay Info */}
            <Card>
              <CardHeader>
                <CardTitle>Essay Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-semibold">Student:</span>
                    <span>{userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Email:</span>
                    <span className="text-gray-600">{review.order.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Essay Type:</span>
                    <span>{essay.type.replace(/_/g, ' ')}</span>
                  </div>
                  {essay.targetSchool && (
                    <div className="flex justify-between">
                      <span className="font-semibold">Target School:</span>
                      <span>{essay.targetSchool}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-semibold">Word Count:</span>
                    <span>{wordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Package:</span>
                    <span className="text-purple-700">{review.order.package.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Due:</span>
                    <span>{new Date(review.dueAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prompt */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Essay Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed">{essay.promptText}</p>
              </CardContent>
            </Card>

            {/* Essay Content */}
            <Card>
              <CardHeader>
                <CardTitle>Student's Essay</CardTitle>
                <CardDescription>Version {review.version.versionIndex}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-serif text-base leading-relaxed text-gray-800">
                    {review.version.content}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            {aiAnalysis && (
              <Card className="border-2 border-blue-500">
                <CardHeader>
                  <CardTitle>AI Analysis Reference</CardTitle>
                  <CardDescription>Use this as a starting point - add your human expertise!</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {Math.round(aiAnalysis.overallScore)}/100
                      </div>
                      <p className="text-sm text-gray-700">
                        {aiAnalysis.analysisJson.overall.summary}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Top Issues Identified:</h4>
                      <ul className="space-y-2">
                        {aiAnalysis.analysisJson.suggestions.top5.slice(0, 3).map((suggestion: any, idx: number) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium text-blue-700">{suggestion.issue}:</span>{' '}
                            <span className="text-gray-700">{suggestion.why_it_matters}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Rubric Scores:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(aiAnalysis.analysisJson.scores).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-600">{key.replace(/_/g, ' ')}:</span>
                            <span className="font-semibold">{value.score}/6</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Review Form */}
          <div className="space-y-6">
            {/* Important Notice */}
            <Card className="border-2 border-amber-500 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <p className="font-semibold mb-1">Voice Preservation Reminder:</p>
                    <p>
                      Never rewrite the student's essay. Provide suggestions and examples, but preserve
                      their authentic voice. Focus on helping them improve their own writing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Summary</CardTitle>
                <CardDescription>High-level assessment (2-3 sentences)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Example: This essay shows strong personal reflection but needs more specific examples. The narrative structure is clear, but the conclusion feels rushed. With targeted revisions, this could be a compelling piece."
                  rows={4}
                  className="text-base"
                />
              </CardContent>
            </Card>

            {/* Detailed Feedback */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Feedback & Suggestions</CardTitle>
                <CardDescription>
                  Line-by-line comments, improvement suggestions, and examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="feedback">Your Feedback</Label>
                    <Textarea
                      id="feedback"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Structure your feedback clearly:

STRENGTHS:
- [What's working well]
- [Strong moments]

AREAS FOR IMPROVEMENT:

1. OPENING HOOK
   Current: [Quote the current opening]
   Issue: [What's not working]
   Suggestion: [How to improve]
   Example: [Show, don't just tell]

2. SPECIFIC DETAILS
   [Continue with structured feedback...]

NEXT STEPS:
1. [Priority action]
2. [Second priority]
..."
                      rows={25}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="text-xs text-gray-600">
                    <p className="font-semibold mb-1">Formatting Tips:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Use CAPS for section headers</li>
                      <li>Quote specific passages for context</li>
                      <li>Provide concrete examples, not vague advice</li>
                      <li>End with clear next steps</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Attachments (Future Enhancement) */}
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">File attachments coming soon</p>
                  <p className="text-xs mt-1">For now, include all feedback in the text above</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
