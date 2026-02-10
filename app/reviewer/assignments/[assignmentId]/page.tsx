'use client';

/**
 * Reviewer Assignment Detail Page
 *
 * Where reviewers view the essay, student context, AI analysis,
 * and can mark the review as complete.
 */

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToastActions } from '@/components/ui/toast';
import {
  getReviewAssignmentStatus,
} from '@/lib/utils/status';
import {
  PenTool,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Target,
  Loader2,
  Send,
  BookOpen,
  Brain,
  Sparkles,
  Mail,
} from 'lucide-react';
import { AdminAnalysisDisplay } from '@/components/admin/admin-analysis-display';
import type { AdminAnalysisData } from '@/lib/rag/types';

interface IntakeData {
  spike?: string;
  topActivities?: string[];
  draftStatus?: string;
  isFirstGen?: boolean;
  isInternational?: boolean;
  essayContext?: {
    targetSchool?: string;
    essayType?: string;
    wordLimit?: number;
  };
}

interface Assignment {
  id: string;
  status: string;
  studentEmail: string;
  essayText: string;
  targetSchool: string | null;
  essayType: string | null;
  intakeData: IntakeData;
  aiAnalysis: any;
  internalNotes: string | null;
  dueAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  isOverdue: boolean;
  reviewer: {
    id: string;
    name: string;
    email: string;
    credentials: string;
  } | null;
  session: {
    id: string;
    tier: string;
    status: string;
    aiScore: number | null;
    targetSchool: string | null;
    createdAt: string;
  } | null;
}

export default function ReviewerAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = use(params);
  const router = useRouter();
  const toast = useToastActions();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    fetchAssignment();
  }, [assignmentId]);

  async function fetchAssignment() {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/assignments/${assignmentId}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Failed to fetch assignment');
      }

      setAssignment(data.assignment);
      setNotes(data.assignment.internalNotes || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignment');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartReview() {
    if (!assignment) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      });

      if (res.ok) {
        fetchAssignment();
      }
    } catch (err) {
      console.error('Failed to start review:', err);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSaveNotes() {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: notes }),
      });

      if (res.ok) {
        fetchAssignment();
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleCompleteReview() {
    // Using window.confirm for critical action confirmation
    if (!window.confirm('Mark this review as complete? The student will be notified.')) {
      return;
    }

    setIsCompleting(true);
    try {
      const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          internalNotes: notes,
          sendNotification: true,
        }),
      });

      if (res.ok) {
        toast.success('Review completed! Student has been notified.');
        router.push('/reviewer');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to complete review');
      }
    } catch (err) {
      console.error('Failed to complete review:', err);
      toast.error('Failed to complete review');
    } finally {
      setIsCompleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Assignment not found'}</p>
            <Link href="/reviewer">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = getReviewAssignmentStatus(assignment.status);
  const StatusIcon = statusConfig.icon;
  const isCompleted = assignment.status === 'COMPLETED';
  const intake = assignment.intakeData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/reviewer">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-neutral-900">Review Assignment</span>
            </div>
          </div>
          <Badge
            variant={statusConfig.badgeVariant}
            className="flex items-center gap-1"
          >
            <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
            {statusConfig.label}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Essay & AI Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Essay Text */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Essay
                  {assignment.targetSchool && (
                    <Badge variant="secondary">{assignment.targetSchool}</Badge>
                  )}
                  {assignment.essayType && (
                    <Badge variant="outline">{assignment.essayType}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gray-50 rounded-lg p-6 whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {assignment.essayText}
                  </div>
                  <div className="text-sm text-gray-500 mt-4">
                    Word count: {assignment.essayText.split(/\s+/).length}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis - Full Admin Display */}
            {assignment.aiAnalysis ? (
              <ReviewerAnalysisSection
                essayText={assignment.essayText}
                aiAnalysis={assignment.aiAnalysis}
                aiScore={assignment.session?.aiScore}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No AI analysis available</p>
                </CardContent>
              </Card>
            )}

            {/* Student Context */}
            <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                      Student Background
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Spike/Theme */}
                      {intake.spike && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-500 mb-1">
                            Central Theme / Spike
                          </h4>
                          <p className="text-gray-800">{intake.spike}</p>
                        </div>
                      )}

                      {/* Activities */}
                      {intake.topActivities && intake.topActivities.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-gray-500 mb-1">
                            Top Activities
                          </h4>
                          <ul className="list-disc list-inside text-gray-800">
                            {intake.topActivities.map((activity, i) => (
                              <li key={i}>{activity}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Flags */}
                      <div className="flex flex-wrap gap-2">
                        {intake.isFirstGen && (
                          <Badge variant="secondary">First Generation</Badge>
                        )}
                        {intake.isInternational && (
                          <Badge variant="secondary">International Student</Badge>
                        )}
                        {intake.draftStatus && (
                          <Badge variant="outline">
                            Draft: {intake.draftStatus}
                          </Badge>
                        )}
                      </div>

                      {/* Essay Context */}
                      {intake.essayContext && (
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                          {intake.essayContext.targetSchool && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-500">Target School</h4>
                              <p className="text-gray-800">{intake.essayContext.targetSchool}</p>
                            </div>
                          )}
                          {intake.essayContext.essayType && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-500">Essay Type</h4>
                              <p className="text-gray-800">{intake.essayContext.essayType}</p>
                            </div>
                          )}
                          {intake.essayContext.wordLimit && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-500">Word Limit</h4>
                              <p className="text-gray-800">{intake.essayContext.wordLimit}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Raw data for reference */}
                      <details className="mt-4">
                        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                          View all intake data
                        </summary>
                        <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-96">
                          {JSON.stringify(intake, null, 2)}
                        </pre>
                      </details>
                    </div>
                  </CardContent>
                </Card>
          </div>

          {/* Sidebar - Actions & Info */}
          <div className="space-y-6">
            {/* Assignment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Student:</span>
                  <span className="font-medium">{assignment.studentEmail}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">School:</span>
                  <span className="font-medium">{assignment.targetSchool || 'Not specified'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Due:</span>
                  <span className={`font-medium ${assignment.isOverdue && !isCompleted ? 'text-red-600' : ''}`}>
                    {new Date(assignment.dueAt).toLocaleDateString()}
                    {assignment.isOverdue && !isCompleted && ' (Overdue)'}
                  </span>
                </div>

                {assignment.assignedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Assigned:</span>
                    <span>{new Date(assignment.assignedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {assignment.completedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">Completed:</span>
                    <span>{new Date(assignment.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this review (not visible to student)..."
                  rows={6}
                  disabled={isCompleted}
                  className="resize-none"
                />
                {!isCompleted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Save Notes
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            {!isCompleted && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {assignment.status === 'ASSIGNED' && (
                    <Button
                      className="w-full"
                      onClick={handleStartReview}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      Start Review
                    </Button>
                  )}

                  <Button
                    className="w-full"
                    variant="default"
                    onClick={handleCompleteReview}
                    disabled={isCompleting || assignment.status === 'ASSIGNED'}
                  >
                    {isCompleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Complete Review
                  </Button>

                  {assignment.status === 'ASSIGNED' && (
                    <p className="text-xs text-gray-500 text-center">
                      Start the review before marking it complete
                    </p>
                  )}

                  <div className="pt-3 border-t text-sm text-gray-600">
                    <p className="font-medium mb-2">Review Process:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Read the essay and student context</li>
                      <li>Email the student directly with your feedback</li>
                      <li>Add internal notes (optional)</li>
                      <li>Mark as complete when done</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// =============================================================================
// REVIEWER ANALYSIS SECTION
// =============================================================================

function ReviewerAnalysisSection({
  essayText,
  aiAnalysis,
  aiScore,
}: {
  essayText: string;
  aiAnalysis: any;
  aiScore?: number | null;
}) {
  // Extract admin analysis data from the AI analysis
  const adminAnalysisData: AdminAnalysisData = aiAnalysis.admin_analysis || {
    tier1_structural: aiAnalysis.tier1_structural,
    tier2_content: aiAnalysis.tier2_content,
    tier3_red_flags: aiAnalysis.tier3_red_flags,
    text_annotations: aiAnalysis.text_annotations,
    feedback: aiAnalysis.feedback,
  };

  const hasAdminData = !!(
    adminAnalysisData.tier1_structural ||
    adminAnalysisData.tier2_content ||
    adminAnalysisData.tier3_red_flags ||
    adminAnalysisData.text_annotations?.length ||
    adminAnalysisData.feedback
  );

  if (hasAdminData) {
    return (
      <AdminAnalysisDisplay
        essayText={essayText}
        analysisData={adminAnalysisData}
        rawScores={aiAnalysis.scores}
        overallScore={aiScore ? Math.round(aiScore) : undefined}
        summary={aiAnalysis.overall?.summary || aiAnalysis.overall?.recommendation || aiAnalysis.summary}
        benchmarks={aiAnalysis.benchmarks}
        patternMatches={aiAnalysis.pattern_matches}
        sanitization={aiAnalysis.sanitization}
        commonsCheck={aiAnalysis.commons_check}
      />
    );
  }

  // Fallback: show raw analysis data
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-600" />
          AI Analysis Reference
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {aiScore && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {Math.round(aiScore)}
              </div>
              <div>
                <p className="font-medium">AI Score</p>
                <p className="text-sm text-gray-500">Overall assessment</p>
              </div>
            </div>
          )}

          {aiAnalysis.summary && (
            <div>
              <h4 className="font-medium mb-2">Summary</h4>
              <p className="text-gray-700">{aiAnalysis.summary}</p>
            </div>
          )}

          {aiAnalysis.scores && (
            <div>
              <h4 className="font-medium mb-2">Scores</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(aiAnalysis.scores).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex justify-between p-2 bg-gray-50 rounded">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{typeof value === 'object' ? value.score : value}/6</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <details className="mt-4">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
              View raw AI analysis data
            </summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto max-h-96">
              {JSON.stringify(aiAnalysis, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  );
}
