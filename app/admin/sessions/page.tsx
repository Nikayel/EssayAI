import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PenTool, FileSearch, ArrowRight } from 'lucide-react';
import { getAnalysisSessionStatus, getTierDisplayName } from '@/lib/utils/status';
import { AdminMobileNav, AdminDesktopNav } from '@/components/admin/admin-nav';
import { StatCardGroup } from '@/components/admin/stat-card';
import { SessionFilters, SessionPagination } from '@/components/admin/session-filters';
import { Suspense } from 'react';

const PAGE_SIZE = 30;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getGlobalStats() {
  const [total, completed, inProgress, failed, scoreAgg, revenueAgg] = await Promise.all([
    prisma.analysisSession.count(),
    prisma.analysisSession.count({ where: { status: { in: ['COMPLETED', 'AI_COMPLETE'] } } }),
    prisma.analysisSession.count({ where: { status: { in: ['ANALYZING', 'HUMAN_QUEUED', 'HUMAN_IN_PROGRESS'] } } }),
    prisma.analysisSession.count({ where: { status: 'FAILED' } }),
    prisma.analysisSession.aggregate({ _avg: { aiScore: true }, where: { aiScore: { not: null } } }),
    prisma.analysisSession.aggregate({ _sum: { paidAmount: true } }),
  ]);

  return {
    total,
    completed,
    inProgress,
    failed,
    avgScore: scoreAgg._avg.aiScore ? Math.round(scoreAgg._avg.aiScore * 10) / 10 : 0,
    totalRevenue: revenueAgg._sum.paidAmount || 0,
  };
}

async function getSessions(page: number, status?: string, tier?: string) {
  const where: Record<string, unknown> = {};

  if (status && status !== 'all') {
    where.status = status;
  }
  if (tier && tier !== 'all') {
    where.tier = tier;
  }

  const [sessions, totalCount] = await Promise.all([
    prisma.analysisSession.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        tier: true,
        userEmail: true,
        targetSchool: true,
        aiScore: true,
        paidAmount: true,
        createdAt: true,
        intakeData: true,
      },
    }),
    prisma.analysisSession.count({ where }),
  ]);

  return { sessions, totalCount };
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

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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

  const resolvedParams = await searchParams;
  const statusFilter = (resolvedParams.status as string) || 'all';
  const tierFilter = (resolvedParams.tier as string) || 'all';
  const currentPage = Math.max(1, parseInt((resolvedParams.page as string) || '1', 10));

  const [stats, { sessions, totalCount }] = await Promise.all([
    getGlobalStats(),
    getSessions(currentPage, statusFilter, tierFilter),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

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

      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Page Title */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <FileSearch className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Analysis Sessions
          </h2>
        </div>

        {/* Stats Row */}
        <div className="mb-4 sm:mb-6">
          <StatCardGroup
            cols={6}
            stats={[
              { label: 'Total Sessions', value: stats.total, color: 'default' },
              { label: 'Completed', value: stats.completed, color: 'success' },
              { label: 'In Progress', value: stats.inProgress, color: 'blue' },
              { label: 'Failed', value: stats.failed, color: 'error', highlight: stats.failed > 0, highlightColor: 'error' },
              { label: 'Avg Score', value: stats.avgScore || '--', color: 'purple' },
              { label: 'Revenue', value: formatCurrency(stats.totalRevenue), color: 'success' },
            ]}
          />
        </div>

        {/* Filter Bar */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="py-4 px-4 sm:px-6">
            <Suspense fallback={<div className="h-20" />}>
              <SessionFilters currentStatus={statusFilter} currentTier={tierFilter} />
            </Suspense>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="py-12 text-center">
                <FileSearch className="w-10 h-10 mx-auto text-neutral-300 mb-3" />
                <p className="text-neutral-500 font-medium">No sessions found</p>
                <p className="text-sm text-neutral-400 mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                {/* Table Header - Desktop */}
                <div className="hidden md:grid md:grid-cols-[1fr_0.7fr_1.2fr_1fr_0.6fr_0.8fr_0.5fr] gap-4 px-6 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-500 uppercase tracking-wide">
                  <span>Status</span>
                  <span>Tier</span>
                  <span>User</span>
                  <span>Target School</span>
                  <span>Score</span>
                  <span>Created</span>
                  <span></span>
                </div>

                {/* Session Rows */}
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {sessions.map((session) => {
                    const statusConfig = getAnalysisSessionStatus(session.status);
                    const StatusIcon = statusConfig.icon;
                    const intake = session.intakeData as Record<string, unknown> | null;
                    const targetSchool = session.targetSchool || (intake?.target_school as string) || (intake?.targetSchool as string) || '--';
                    const userName = session.userEmail?.split('@')[0] || 'Guest';

                    return (
                      <div
                        key={session.id}
                        className="group px-4 sm:px-6 py-3 sm:py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
                      >
                        {/* Desktop Layout */}
                        <div className="hidden md:grid md:grid-cols-[1fr_0.7fr_1.2fr_1fr_0.6fr_0.8fr_0.5fr] gap-4 items-center">
                          {/* Status */}
                          <div>
                            <Badge variant={getStatusBadgeVariant(session.status)} size="sm">
                              <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Tier */}
                          <div>
                            <Badge variant={getTierBadgeVariant(session.tier)} size="sm">
                              {getTierDisplayName(session.tier)}
                            </Badge>
                          </div>

                          {/* User */}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                              {userName}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">
                              {session.userEmail || 'Guest'}
                            </p>
                          </div>

                          {/* Target School */}
                          <div>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                              {targetSchool}
                            </p>
                          </div>

                          {/* Score */}
                          <div>
                            {session.aiScore !== null ? (
                              <span className={`text-sm font-semibold ${
                                session.aiScore >= 70 ? 'text-success-600' :
                                session.aiScore >= 50 ? 'text-warning-600' :
                                'text-error-600'
                              }`}>
                                {Math.round(session.aiScore)}/100
                              </span>
                            ) : (
                              <span className="text-sm text-neutral-400">--</span>
                            )}
                          </div>

                          {/* Created */}
                          <div>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                              {new Date(session.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-xs text-neutral-400">
                              {new Date(session.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="text-right">
                            <Link href={`/admin/sessions/${session.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                View
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="md:hidden space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusBadgeVariant(session.status)} size="sm">
                                <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                                {statusConfig.label}
                              </Badge>
                              <Badge variant={getTierBadgeVariant(session.tier)} size="sm">
                                {getTierDisplayName(session.tier)}
                              </Badge>
                            </div>
                            <Link href={`/admin/sessions/${session.id}`}>
                              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                View
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                {session.userEmail || 'Guest'}
                              </p>
                              <p className="text-xs text-neutral-500 truncate">{targetSchool}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-3">
                              {session.aiScore !== null ? (
                                <span className={`text-sm font-semibold ${
                                  session.aiScore >= 70 ? 'text-success-600' :
                                  session.aiScore >= 50 ? 'text-warning-600' :
                                  'text-error-600'
                                }`}>
                                  {Math.round(session.aiScore)}/100
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-400">No score</span>
                              )}
                              <p className="text-xs text-neutral-400">
                                {new Date(session.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800">
                  <Suspense fallback={null}>
                    <SessionPagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalCount={totalCount}
                    />
                  </Suspense>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
