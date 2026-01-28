import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, Users, Sparkles, ArrowRight, UserCheck, PenTool } from 'lucide-react';
import { getAnalysisSessionStatus, getTierDisplayName, getResultsUrl } from '@/lib/utils/status';
import { HumanReviewQueue } from '@/components/admin/human-review-queue';
import { AdminMobileNav, AdminDesktopNav } from '@/components/admin/admin-nav';
import { StatCardGroup } from '@/components/admin/stat-card';

async function getReviews() {
  return await prisma.review.findMany({
    where: {
      status: {
        in: ['ASSIGNED', 'IN_PROGRESS'],
      },
    },
    include: {
      version: {
        include: {
          essay: {
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
            },
          },
          analyses: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
      },
      order: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
    orderBy: {
      dueAt: 'asc',
    },
  });
}

/**
 * Get analysis sessions for admin overview
 * Focuses on sessions needing attention: human review queue, failed, stuck
 */
async function getAnalysisSessions() {
  return await prisma.analysisSession.findMany({
    where: {
      status: {
        in: ['HUMAN_QUEUED', 'HUMAN_IN_PROGRESS', 'FAILED', 'ANALYZING'],
      },
    },
    orderBy: {
      createdAt: 'asc', // Oldest first for queue
    },
    take: 50,
  });
}

/**
 * Get summary stats for all analysis sessions
 */
async function getAnalysisStats() {
  const [pending, analyzing, humanQueued, humanInProgress, completed, failed] = await Promise.all([
    prisma.analysisSession.count({ where: { status: 'PENDING' } }),
    prisma.analysisSession.count({ where: { status: 'ANALYZING' } }),
    prisma.analysisSession.count({ where: { status: 'HUMAN_QUEUED' } }),
    prisma.analysisSession.count({ where: { status: 'HUMAN_IN_PROGRESS' } }),
    prisma.analysisSession.count({ where: { status: { in: ['COMPLETED', 'AI_COMPLETE'] } } }),
    prisma.analysisSession.count({ where: { status: 'FAILED' } }),
  ]);

  return { pending, analyzing, humanQueued, humanInProgress, completed, failed };
}

/**
 * Get human review assignments for admin queue management
 */
async function getHumanReviewAssignments() {
  return await prisma.humanReviewAssignment.findMany({
    where: {
      status: {
        in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'OVERDUE'],
      },
    },
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          email: true,
          credentials: true,
        },
      },
    },
    orderBy: [
      { status: 'asc' },
      { dueAt: 'asc' },
    ],
    take: 20,
  });
}

/**
 * Get human review assignment stats
 */
async function getHumanReviewStats() {
  const [queued, assigned, inProgress, completed, overdue] = await Promise.all([
    prisma.humanReviewAssignment.count({ where: { status: 'QUEUED' } }),
    prisma.humanReviewAssignment.count({ where: { status: 'ASSIGNED' } }),
    prisma.humanReviewAssignment.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.humanReviewAssignment.count({ where: { status: 'COMPLETED' } }),
    prisma.humanReviewAssignment.count({ where: { status: 'OVERDUE' } }),
  ]);

  return { queued, assigned, inProgress, completed, overdue };
}

/**
 * Get available reviewers for assignment dropdown
 */
async function getAvailableReviewers() {
  return await prisma.humanReviewer.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      credentials: true,
      maxActiveReviews: true,
      _count: {
        select: {
          assignments: {
            where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Check if user is admin
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || dbUser.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [reviews, analysisSessions, analysisStats, humanReviewAssignments, humanReviewStats, availableReviewers] = await Promise.all([
    getReviews(),
    getAnalysisSessions(),
    getAnalysisStats(),
    getHumanReviewAssignments(),
    getHumanReviewStats(),
    getAvailableReviewers(),
  ]);

  const reviewStats = {
    assigned: reviews.filter(r => r.status === 'ASSIGNED').length,
    inProgress: reviews.filter(r => r.status === 'IN_PROGRESS').length,
    overdue: reviews.filter(r => new Date(r.dueAt) < new Date()).length,
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
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

          {/* Desktop Navigation */}
          <AdminDesktopNav />

          {/* Mobile Navigation */}
          <AdminMobileNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Analysis Sessions Stats (New Tiered Flow) */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Analysis Sessions</h2>
          </div>
          {/* Stats Grid - DRY: Using StatCardGroup */}
          <div className="mb-4 sm:mb-6">
            <StatCardGroup
              cols={6}
              stats={[
                { label: 'Pending', value: analysisStats.pending, color: 'default' },
                { label: 'Analyzing', value: analysisStats.analyzing, color: 'blue' },
                { label: 'Queue', value: analysisStats.humanQueued, color: 'warning', highlight: true },
                { label: 'Expert', value: analysisStats.humanInProgress, color: 'purple' },
                { label: 'Done', value: analysisStats.completed, color: 'success' },
                { label: 'Failed', value: analysisStats.failed, color: 'error', highlight: true, highlightColor: 'error' },
              ]}
            />
          </div>

          {/* Analysis Sessions Needing Attention */}
          {analysisSessions.length > 0 && (
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                Needs Attention ({analysisSessions.length})
              </h3>
              {analysisSessions.slice(0, 10).map((session) => {
                const statusInfo = getAnalysisSessionStatus(session.status);
                const StatusIcon = statusInfo.icon;
                const userName = session.userEmail?.split('@')[0] || 'Guest';

                return (
                  <Card key={session.id} className="border-l-4 border-l-brand-500">
                    <CardContent className="p-3 sm:py-4 sm:px-6">
                      {/* Mobile: Stack vertically, Desktop: Horizontal */}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
                        {/* Top row on mobile / Left side on desktop */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                          <Badge variant={statusInfo.badgeVariant} className="text-xs">
                            <StatusIcon className={`w-3 h-3 ${statusInfo.animate ? 'animate-spin' : ''}`} />
                            <span className="hidden xs:inline ml-1">{statusInfo.label}</span>
                          </Badge>
                          <span className="font-medium text-sm">{getTierDisplayName(session.tier)}</span>
                          {session.targetSchool && (
                            <span className="text-xs sm:text-sm text-neutral-500">· {session.targetSchool}</span>
                          )}
                        </div>

                        {/* Bottom row on mobile / Right side on desktop */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <span>{userName}</span>
                            {session.aiScore !== null && (
                              <span className="font-medium text-brand-600">
                                {Math.round(session.aiScore)}/100
                              </span>
                            )}
                            <span className="hidden sm:inline">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <Link href={getResultsUrl(session.id, session.tier)}>
                            <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3">
                              View
                              <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Human Review Assignments (Premium Tier) */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck className="w-5 h-5 text-pink-600 flex-shrink-0" />
              <h2 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 truncate">Expert Queue</h2>
            </div>
            <Link href="/admin/reviewers" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                <span className="hidden sm:inline">Manage </span>Reviewers
              </Button>
            </Link>
          </div>

          {/* Human Review Stats - DRY: Using StatCardGroup */}
          <div className="mb-4 sm:mb-6">
            <StatCardGroup
              cols={5}
              stats={[
                { label: 'Queue', value: humanReviewStats.queued, color: 'warning', highlight: true },
                { label: 'Assign', value: humanReviewStats.assigned, color: 'blue' },
                { label: 'Active', value: humanReviewStats.inProgress, color: 'purple' },
                { label: 'Done', value: humanReviewStats.completed, color: 'success' },
                { label: 'Late', value: humanReviewStats.overdue, color: 'error', highlight: true, highlightColor: 'error' },
              ]}
            />
          </div>

          {/* Human Review Assignment Queue */}
          <HumanReviewQueue
            assignments={humanReviewAssignments.map(a => ({
              id: a.id,
              status: a.status,
              studentEmail: a.studentEmail,
              targetSchool: a.targetSchool,
              essayType: a.essayType,
              dueAt: a.dueAt.toISOString(),
              assignedAt: a.assignedAt?.toISOString() || null,
              createdAt: a.createdAt.toISOString(),
              isOverdue: a.dueAt < new Date() && a.status !== 'COMPLETED',
              reviewer: a.reviewer,
            }))}
            reviewers={availableReviewers.map(r => ({
              id: r.id,
              name: r.name,
              email: r.email,
              credentials: r.credentials,
              activeCount: r._count.assignments,
              maxActive: r.maxActiveReviews,
            }))}
          />
        </div>

        {/* Legacy Review Queue */}
        <div className="mb-6 sm:mb-10">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Legacy Queue</h2>
          </div>

          {/* Stats - DRY: Using StatCardGroup */}
          <div className="mb-4 sm:mb-6">
            <StatCardGroup
              cols={3}
              stats={[
                { label: 'Assigned', value: reviewStats.assigned, color: 'warning' },
                { label: 'Active', value: reviewStats.inProgress, color: 'purple' },
                { label: 'Overdue', value: reviewStats.overdue, color: 'error', highlight: true, highlightColor: 'error' },
              ]}
            />
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {(() => {
            // Compute current time once outside the render loop for pure rendering
            const now = Date.now();
            const currentDate = new Date(now);

            if (reviews.length === 0) {
              return (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-success-600 mb-4" />
                    <h3 className="text-xl font-semibold">All caught up!</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-2">No pending reviews at this time</p>
                  </CardContent>
                </Card>
              );
            }

            return reviews.map((review) => {
              const isOverdue = new Date(review.dueAt) < currentDate;
              const hoursUntilDue = Math.round(
                (new Date(review.dueAt).getTime() - now) / (1000 * 60 * 60)
              );
              const wordCount = review.version.content.split(/\s+/).length;
              const aiAnalysis = review.version.analyses[0];
              const userName = review.order.user.profile?.name || review.order.user.email.split('@')[0];
              const userGrade = review.order.user.profile?.gradeLevel;
              const userMajor = review.order.user.profile?.intendedMajor;

              return (
                <Card key={review.id} className={isOverdue ? 'border-2 border-error-500' : 'border-l-4 border-l-brand-600'}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {review.version.essay.type.replace(/_/g, ' ')}
                          </CardTitle>
                          {review.version.essay.targetSchool && (
                            <span className="px-3 py-1 bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 rounded-full text-sm font-semibold">
                              {review.version.essay.targetSchool}
                            </span>
                          )}
                        </div>

                        {/* Student Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-neutral-700 dark:text-neutral-300 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Student:</span>
                            <span>{userName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Email:</span>
                            <span className="text-neutral-600 dark:text-neutral-400">{review.order.user.email}</span>
                          </div>
                          {userGrade && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Grade:</span>
                              <span>{userGrade}</span>
                            </div>
                          )}
                          {userMajor && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Major:</span>
                              <span>{userMajor}</span>
                            </div>
                          )}
                        </div>

                        {/* Essay Preview */}
                        <CardDescription className="mt-3 text-sm leading-relaxed">
                          <span className="font-semibold text-neutral-700 dark:text-neutral-300">Prompt:</span>{' '}
                          {review.version.essay.promptText.substring(0, 150)}
                          {review.version.essay.promptText.length > 150 && '...'}
                        </CardDescription>
                      </div>

                      <div className="text-right ml-4">
                        {isOverdue ? (
                          <div className="flex items-center gap-2 text-error-600 font-semibold mb-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>OVERDUE</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 mb-2">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold">
                              {hoursUntilDue > 0 ? `${hoursUntilDue}h left` : 'Due now'}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-neutral-500">
                          Due: {new Date(review.dueAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-600 dark:text-neutral-400">Package:</span>
                          <span className="font-semibold text-accent-700 dark:text-accent-400">
                            {review.order.package.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-600 dark:text-neutral-400">Words:</span>
                          <span className="font-semibold">{wordCount}</span>
                        </div>
                        {aiAnalysis && (
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-600 dark:text-neutral-400">AI Score:</span>
                            <span className="font-semibold text-brand-600">
                              {Math.round(aiAnalysis.overallScore)}/100
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-600 dark:text-neutral-400">Status:</span>
                          <span className={`font-semibold px-2 py-0.5 rounded ${
                            review.status === 'IN_PROGRESS'
                              ? 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300'
                              : 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300'
                          }`}>
                            {review.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <Link href={`/admin/review/${review.id}`}>
                        <Button size="lg">
                          {review.status === 'ASSIGNED' ? 'Start Review' : 'Continue Review'}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()}
        </div>
      </main>
    </div>
  );
}
