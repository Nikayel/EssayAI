import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, Loader2, Users, Sparkles, ArrowRight } from 'lucide-react';
import {
  getAnalysisSessionStatus,
  getReviewStatus,
  getTierDisplayName,
  getResultsUrl,
} from '@/lib/utils/status';

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

  const [reviews, analysisSessions, analysisStats] = await Promise.all([
    getReviews(),
    getAnalysisSessions(),
    getAnalysisStats(),
  ]);

  const reviewStats = {
    assigned: reviews.filter(r => r.status === 'ASSIGNED').length,
    inProgress: reviews.filter(r => r.status === 'IN_PROGRESS').length,
    overdue: reviews.filter(r => new Date(r.dueAt) < new Date()).length,
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Admin Panel</h1>
          <div className="flex gap-4 flex-wrap">
            <Link href="/admin/users">
              <Button variant="ghost">Users</Button>
            </Link>
            <Link href="/admin/reviewers">
              <Button variant="ghost">Reviewers</Button>
            </Link>
            <Link href="/admin/config">
              <Button variant="ghost">Config</Button>
            </Link>
            <Link href="/admin/analytics">
              <Button variant="ghost">Analytics</Button>
            </Link>
            <Link href="/admin/conversions">
              <Button variant="ghost">Conversions</Button>
            </Link>
            <Link href="/admin/qa">
              <Button variant="ghost">Q&A Sessions</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">My Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Analysis Sessions Stats (New Tiered Flow) */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Analysis Sessions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Payment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-neutral-600">{analysisStats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>AI Analyzing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analysisStats.analyzing}</div>
              </CardContent>
            </Card>
            <Card className={analysisStats.humanQueued > 0 ? 'border-2 border-warning-500' : ''}>
              <CardHeader className="pb-2">
                <CardDescription>Expert Queue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning-600">{analysisStats.humanQueued}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Expert Review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{analysisStats.humanInProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success-600">{analysisStats.completed}</div>
              </CardContent>
            </Card>
            <Card className={analysisStats.failed > 0 ? 'border-2 border-error-500' : ''}>
              <CardHeader className="pb-2">
                <CardDescription>Failed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-error-600">{analysisStats.failed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Sessions Needing Attention */}
          {analysisSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                Needs Attention ({analysisSessions.length})
              </h3>
              {analysisSessions.slice(0, 10).map((session) => {
                const statusInfo = getAnalysisSessionStatus(session.status);
                const StatusIcon = statusInfo.icon;
                const userName = session.userEmail?.split('@')[0] || 'Guest';

                return (
                  <Card key={session.id} className="border-l-4 border-l-brand-500">
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <Badge variant={statusInfo.badgeVariant}>
                            <StatusIcon className={`w-3 h-3 ${statusInfo.animate ? 'animate-spin' : ''}`} />
                            {statusInfo.label}
                          </Badge>
                          <div>
                            <span className="font-medium">{getTierDisplayName(session.tier)}</span>
                            {session.targetSchool && (
                              <span className="text-neutral-500 ml-2">· {session.targetSchool}</span>
                            )}
                          </div>
                          <span className="text-sm text-neutral-500">{userName}</span>
                          {session.aiScore !== null && (
                            <span className="text-sm font-medium text-brand-600">
                              {Math.round(session.aiScore)}/100
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-400">
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          <Link href={getResultsUrl(session.id, session.tier)}>
                            <Button variant="outline" size="sm">
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

        {/* Legacy Review Queue */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Legacy Review Queue</h2>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Assigned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning-600">{reviewStats.assigned}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>In Progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-600">{reviewStats.inProgress}</div>
              </CardContent>
            </Card>

            <Card className={reviewStats.overdue > 0 ? 'border-2 border-error-500' : ''}>
              <CardHeader className="pb-2">
                <CardDescription>Overdue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-error-600">{reviewStats.overdue}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-success-600 mb-4" />
                <h3 className="text-xl font-semibold">All caught up!</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mt-2">No pending reviews at this time</p>
              </CardContent>
            </Card>
          ) : (
            reviews.map((review) => {
              const isOverdue = new Date(review.dueAt) < new Date();
              const hoursUntilDue = Math.round(
                (new Date(review.dueAt).getTime() - Date.now()) / (1000 * 60 * 60)
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
            })
          )}
        </div>
      </main>
    </div>
  );
}
