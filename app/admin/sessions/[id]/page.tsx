import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSearch,
  User,
  Calendar,
  DollarSign,
  School,
  FileText,
  ClipboardList,
  PenTool,
} from 'lucide-react';
import { getAnalysisSessionStatus, getTierDisplayName } from '@/lib/utils/status';
import { AdminMobileNav, AdminDesktopNav } from '@/components/admin/admin-nav';
import { AdminAnalysisDisplay } from '@/components/admin/admin-analysis-display';
import type { AdminAnalysisData } from '@/lib/rag/types';

type Params = Promise<{ id: string }>;

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getSession(sessionId: string) {
  return await prisma.analysisSession.findUnique({
    where: { id: sessionId },
  });
}

// =============================================================================
// STATUS BADGE HELPERS
// =============================================================================

function getStatusBadgeVariant(status: string): 'success' | 'info' | 'warning' | 'destructive' | 'default' | 'secondary' {
  switch (status) {
    case 'COMPLETED':
    case 'AI_COMPLETE':
      return 'success';
    case 'ANALYZING':
      return 'info';
    case 'HUMAN_QUEUED':
    case 'HUMAN_IN_PROGRESS':
      return 'warning';
    case 'FAILED':
      return 'destructive';
    case 'PENDING':
      return 'secondary';
    default:
      return 'default';
  }
}

function getTierBadgeVariant(tier: string): 'default' | 'secondary' | 'premium' | 'info' {
  switch (tier) {
    case 'premium':
      return 'premium';
    case 'standard':
      return 'default';
    case 'quick':
      return 'info';
    default:
      return 'secondary';
  }
}

function formatCurrency(cents: number | null): string {
  if (cents === null || cents === undefined) return '--';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const session = await getSession(id);

  if (!session) {
    notFound();
  }

  const statusConfig = getAnalysisSessionStatus(session.status);
  const StatusIcon = statusConfig.icon;
  const aiResult = session.aiResult as Record<string, unknown> | null;
  const adminAnalysis = aiResult?.admin_analysis as AdminAnalysisData | undefined;
  const intake = session.intakeData as Record<string, unknown> | null;

  // Extract data for AdminAnalysisDisplay
  const rawScores = aiResult?.scores as Record<string, { score: number; rationales: string[] }> | undefined;
  const overallScore = session.aiScore ?? (aiResult?.overall_score as number | undefined);
  const summary = aiResult?.summary as string | undefined;
  const benchmarks = aiResult?.benchmarks as {
    percentile: number;
    vs_average: number;
    estimated_improvement: number;
    sample_size: number;
  } | undefined;
  const commonsCheck = aiResult?.commons_check as Record<string, { flag: boolean; evidence?: string[]; phrases?: string[]; notes?: string }> | undefined;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Admin</h1>
            </div>
          </Link>

          <AdminDesktopNav />
          <AdminMobileNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        {/* Back Link + Session Header */}
        <div className="mb-6">
          <Link
            href="/admin/sessions"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sessions
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 break-all">
              Session {session.id.slice(0, 8)}...
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(session.status)} size="lg">
                <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                {statusConfig.label}
              </Badge>
              <Badge variant={getTierBadgeVariant(session.tier)} size="lg">
                {getTierDisplayName(session.tier)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left Column - Analysis Content */}
          <div className="space-y-6 min-w-0">
            {/* Admin Analysis Display */}
            {adminAnalysis ? (
              <AdminAnalysisDisplay
                essayText={session.essayText}
                analysisData={adminAnalysis}
                rawScores={rawScores}
                overallScore={overallScore ?? undefined}
                summary={summary}
                benchmarks={benchmarks}
                commonsCheck={commonsCheck}
              />
            ) : aiResult ? (
              /* Raw AI Result Display (no admin_analysis) */
              <div className="space-y-6">
                {/* Score Summary */}
                {(overallScore || rawScores) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileSearch className="w-4 h-4 text-brand-600" />
                        Analysis Results
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {overallScore && (
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full border-4 border-brand-300 bg-white flex items-center justify-center">
                            <span className="text-xl font-bold text-brand-700">{Math.round(overallScore)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">Overall Score</p>
                            {summary && (
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{summary}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {rawScores && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Dimension Scores</p>
                          {Object.entries(rawScores).map(([key, data]) => (
                            <div key={key} className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
                              <span className="text-sm text-neutral-700 dark:text-neutral-300 capitalize">
                                {key.replace(/_/g, ' ')}
                              </span>
                              <span className={`text-sm font-semibold ${
                                data.score >= 5 ? 'text-success-600' :
                                data.score >= 3 ? 'text-warning-600' :
                                'text-error-600'
                              }`}>
                                {data.score}/6
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Raw JSON Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardList className="w-4 h-4 text-neutral-500" />
                      Raw AI Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(aiResult, null, 2)}
                    </pre>
                  </CardContent>
                </Card>

                {/* Essay Text */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="w-4 h-4 text-neutral-500" />
                      Essay Text
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 sm:p-6 max-h-[600px] overflow-y-auto">
                        <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                          {session.essayText}
                        </p>
                      </div>
                      <p className="text-xs text-neutral-400 mt-2">
                        {session.essayText.split(/\s+/).filter((w: string) => w.length > 0).length} words
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* No Results Yet */
              <Card>
                <CardContent className="py-12 text-center">
                  <FileSearch className="w-10 h-10 mx-auto text-neutral-300 mb-3" />
                  <p className="text-neutral-500 font-medium">No analysis results yet</p>
                  <p className="text-sm text-neutral-400 mt-1">
                    {session.status === 'PENDING'
                      ? 'This session is awaiting payment or processing.'
                      : session.status === 'ANALYZING'
                      ? 'Analysis is currently in progress.'
                      : session.status === 'FAILED'
                      ? 'This analysis failed. Check logs for details.'
                      : 'Results will appear here once analysis completes.'}
                  </p>

                  {/* Still show the essay text */}
                  <div className="mt-6 text-left">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <FileText className="w-4 h-4 text-neutral-500" />
                          Essay Text
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 sm:p-6 max-h-[400px] overflow-y-auto">
                          <p className="text-sm text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                            {session.essayText}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-400 mt-2">
                          {session.essayText.split(/\s+/).filter((w: string) => w.length > 0).length} words
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-4">
            {/* Session Metadata */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSearch className="w-4 h-4 text-brand-600" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <MetadataRow label="Session ID" value={session.id} mono />
                  <MetadataRow label="Tier">
                    <Badge variant={getTierBadgeVariant(session.tier)} size="sm">
                      {getTierDisplayName(session.tier)}
                    </Badge>
                  </MetadataRow>
                  <MetadataRow label="Status">
                    <Badge variant={getStatusBadgeVariant(session.status)} size="sm">
                      <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                      {statusConfig.label}
                    </Badge>
                  </MetadataRow>
                  <MetadataRow label="User Email">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {session.userEmail || 'Guest'}
                      </span>
                    </div>
                  </MetadataRow>
                  <MetadataRow label="Created">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {new Date(session.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </MetadataRow>
                  {session.aiCompletedAt && (
                    <MetadataRow label="Completed">
                      <span className="text-sm text-neutral-700 dark:text-neutral-300">
                        {new Date(session.aiCompletedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </MetadataRow>
                  )}
                  {session.aiScore !== null && (
                    <MetadataRow label="AI Score">
                      <span className={`text-sm font-semibold ${
                        (session.aiScore ?? 0) >= 70 ? 'text-success-600' :
                        (session.aiScore ?? 0) >= 50 ? 'text-warning-600' :
                        'text-error-600'
                      }`}>
                        {Math.round(session.aiScore ?? 0)}/100
                      </span>
                    </MetadataRow>
                  )}
                  <MetadataRow label="Paid Amount">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {formatCurrency(session.paidAmount)}
                      </span>
                    </div>
                  </MetadataRow>
                  {session.humanReviewId && (
                    <MetadataRow label="Human Review ID" value={session.humanReviewId} mono />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Intake Data */}
            {intake && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <School className="w-4 h-4 text-brand-600" />
                    Intake Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <MetadataRow
                      label="Target School"
                      value={
                        (intake.target_school as string) ||
                        (intake.targetSchool as string) ||
                        session.targetSchool ||
                        '--'
                      }
                    />
                    <MetadataRow
                      label="Essay Type"
                      value={
                        (intake.essay_type as string) ||
                        (intake.essayType as string) ||
                        session.essayType ||
                        '--'
                      }
                    />
                    {(intake.word_limit || intake.wordLimit) ? (
                      <MetadataRow
                        label="Word Limit"
                        value={String(intake.word_limit || intake.wordLimit)}
                      />
                    ) : null}
                    {(intake.spike || intake.narrative_spike) ? (
                      <MetadataRow label="Spike / Narrative">
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {(intake.spike as string) || (intake.narrative_spike as string)}
                        </p>
                      </MetadataRow>
                    ) : null}
                    {(intake.draft_status || intake.draftStatus) ? (
                      <MetadataRow
                        label="Draft Status"
                        value={String(intake.draft_status || intake.draftStatus)}
                      />
                    ) : null}
                    {(intake.prompt_text || intake.promptText || intake.essay_prompt) ? (
                      <MetadataRow label="Essay Prompt">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed italic">
                          {((intake.prompt_text as string) || (intake.promptText as string) || (intake.essay_prompt as string))?.substring(0, 200)}
                          {((intake.prompt_text as string) || (intake.promptText as string) || (intake.essay_prompt as string))?.length > 200 ? '...' : null}
                        </p>
                      </MetadataRow>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                    <FileSearch className="w-4 h-4 mr-2" />
                    Re-run Analysis
                    <span className="ml-auto text-xs text-neutral-400">Coming soon</span>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" disabled>
                    Mark as Completed
                    <span className="ml-auto text-xs text-neutral-400">Coming soon</span>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-error-600 hover:text-error-700 hover:bg-error-50" disabled>
                    Mark as Failed
                    <span className="ml-auto text-xs text-neutral-400">Coming soon</span>
                  </Button>
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
// METADATA ROW COMPONENT
// =============================================================================

function MetadataRow({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
        {label}
      </span>
      {children || (
        <span
          className={`text-sm text-neutral-800 dark:text-neutral-200 ${
            mono ? 'font-mono text-xs break-all' : ''
          }`}
        >
          {value || '--'}
        </span>
      )}
    </div>
  );
}
