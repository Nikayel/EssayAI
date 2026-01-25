import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  FileText,
  Loader2,
  CheckCircle2,
  Clock,
  MessageCircle,
  PenTool,
  FolderOpen,
  ShoppingBag,
  User,
  LogOut,
  Plus,
  Sparkles,
  Gift,
  GraduationCap,
} from 'lucide-react';
import { ReferralCard } from '@/components/referral/referral-card';
import {
  getEssayStatusConfig,
  getAnalysisSessionStatus,
  getTierDisplayName,
  getResultsUrl,
  ESSAY_STATUS_CONFIG,
} from '@/lib/utils/status';

async function getEssays(userId: string) {
  return await prisma.essay.findMany({
    where: { userId },
    include: {
      versions: {
        orderBy: { versionIndex: 'desc' },
        take: 1,
        include: {
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Derive essay status from essay data using shared status config
 * Returns config with `variant` alias for Badge component compatibility
 */
function deriveEssayStatus(essay: any) {
  const latestVersion = essay.versions[0];
  const latestOrder = essay.orders[0];
  const latestReview = latestVersion?.reviews[0];

  const mapConfig = (status: string, config: ReturnType<typeof getEssayStatusConfig>) => ({
    status,
    ...config,
    variant: config.badgeVariant, // Alias for Badge component
  });

  // Check payment status
  if (!latestOrder || latestOrder.status !== 'PAID') {
    return mapConfig('PAYMENT_PENDING', getEssayStatusConfig('PAYMENT_PENDING'));
  }

  // Check if AI analysis is complete
  if (!latestVersion?.analyses[0]) {
    return mapConfig('AI_ANALYZING', getEssayStatusConfig('AI_ANALYZING'));
  }

  // Check if human review is needed
  const needsHumanReview = ['HUMAN_LITE', 'HUMAN_FULL_1', 'HUMAN_FULL_3', 'HUMAN_FULL_5'].includes(latestOrder.package);

  if (needsHumanReview) {
    if (!latestReview) {
      return mapConfig('AWAITING_ASSIGNMENT', getEssayStatusConfig('AWAITING_ASSIGNMENT'));
    }
    if (latestReview.status === 'ASSIGNED' || latestReview.status === 'IN_PROGRESS') {
      return mapConfig('IN_HUMAN_REVIEW', getEssayStatusConfig('IN_HUMAN_REVIEW'));
    }
    if (latestReview.status === 'DELIVERED') {
      return mapConfig('REVIEW_COMPLETE', getEssayStatusConfig('REVIEW_COMPLETE'));
    }
  }

  // AI-only packages - complete once analysis is done
  return mapConfig('AI_COMPLETE', getEssayStatusConfig('AI_COMPLETE'));
}

async function getAnalysisSessions(userId: string) {
  return await prisma.analysisSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}

async function getQASessions(userId: string) {
  const sessions = await prisma.order.findMany({
    where: {
      userId,
      package: {
        in: ['EXPERT_QA_PREMIUM', 'EXPERT_QA_STANDARD'],
      },
      status: 'PAID',
    },
    include: {
      essay: true,
      _count: {
        select: {
          messages: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Filter only active sessions
  return sessions.filter(session => {
    const isPremium = session.package === 'EXPERT_QA_PREMIUM';
    const hoursRemaining = isPremium ? 48 : 24;
    const expiresAt = new Date(session.createdAt.getTime() + hoursRemaining * 60 * 60 * 1000);
    return new Date() < expiresAt;
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Check if user has completed onboarding
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile?.isOnboarded) {
    redirect('/onboarding');
  }

  const essays = await getEssays(user.id);
  const qaSessions = await getQASessions(user.id);
  const analysisSessions = await getAnalysisSessions(user.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">IvyWay</span>
          </Link>
          <div className="flex gap-2 items-center">
            <span className="text-sm text-neutral-500 mr-2 hidden md:block">{user.email}</span>
            <Link href="/dashboard/portfolio">
              <Button variant="ghost" size="sm">
                <FolderOpen className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Portfolio</span>
              </Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button variant="ghost" size="sm">
                <ShoppingBag className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Orders</span>
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Profile</span>
              </Button>
            </Link>
            <form action="/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Active Q&A Sessions */}
        {qaSessions.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="info" size="lg">
                <MessageCircle className="w-3.5 h-3.5" />
                Active Sessions
              </Badge>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {qaSessions.map((session) => {
                const isPremium = session.package === 'EXPERT_QA_PREMIUM';
                const hoursRemaining = isPremium ? 48 : 24;
                const expiresAt = new Date(session.createdAt.getTime() + hoursRemaining * 60 * 60 * 1000);
                const now = new Date();
                const hoursLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

                return (
                  <Card key={session.id} variant="brand">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-brand-500">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {isPremium ? '2-Day Premium Q&A' : '1-Day Standard Q&A'}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {session.essay?.type.replace(/_/g, ' ') || 'Your Essay'}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={hoursLeft < 6 ? 'warning' : 'secondary'} size="sm">
                          {hoursLeft}h left
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm mb-4">
                        <span className="text-neutral-500">{session._count.messages} messages</span>
                        <span className="text-neutral-600 font-medium">
                          Expires {expiresAt.toLocaleDateString()}
                        </span>
                      </div>
                      <Link href={`/dashboard/qa/${session.id}`}>
                        <Button className="w-full" size="sm">
                          Open Session
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Analysis Sessions (New Tiered Flow) */}
        {analysisSessions.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="default" size="lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recent Analyses
                </Badge>
              </div>
              <Link href="/dashboard/new">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                  New Analysis
                </Button>
              </Link>
            </div>
            <div className="grid gap-4">
              {analysisSessions.map((session) => {
                const statusInfo = getAnalysisSessionStatus(session.status);
                const StatusIcon = statusInfo.icon;
                const resultsUrl = getResultsUrl(session.id, session.tier);

                return (
                  <Card key={session.id} variant="interactive">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <CardTitle className="text-lg truncate">
                              {getTierDisplayName(session.tier)}
                            </CardTitle>
                            {session.targetSchool && (
                              <Badge variant="secondary" size="sm">
                                {session.targetSchool}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="line-clamp-1">
                            {session.essayType?.replace(/_/g, ' ') || 'Essay Analysis'}
                            {' · '}
                            {new Date(session.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Badge variant={statusInfo.badgeVariant}>
                          <StatusIcon
                            className={`w-3 h-3 ${statusInfo.animate ? 'animate-spin' : ''}`}
                          />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3 sm:gap-6 text-sm">
                          {session.aiScore !== null && (
                            <div className="flex items-center gap-3">
                              <div className="w-20 sm:w-24">
                                <Progress value={session.aiScore} size="sm" />
                              </div>
                              <span className="text-sm font-semibold text-neutral-900">
                                {Math.round(session.aiScore)}/100
                              </span>
                            </div>
                          )}
                          {session.paidAmount && (
                            <span className="text-neutral-500">
                              ${(session.paidAmount / 100).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {session.status === 'COMPLETED' || session.status === 'AI_COMPLETE' ? (
                          <Link href={resultsUrl} className="w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              View Results
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        ) : session.status === 'ANALYZING' ? (
                          <Link href={resultsUrl} className="w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              Check Progress
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        ) : session.status === 'PENDING' ? (
                          <Button variant="premium" size="sm" disabled className="w-full sm:w-auto">
                            Awaiting Payment
                          </Button>
                        ) : (
                          <Link href={resultsUrl} className="w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                              View Details
                              <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Essays Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">My Essays</h1>
            <p className="text-neutral-500 mt-1">Track progress and view feedback</p>
          </div>
          <Link href="/dashboard/new">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              New Essay
            </Button>
          </Link>
        </div>

        {/* Ivy League Promo Card */}
        <Card className="mb-6 bg-gradient-to-r from-brand-50 to-violet-50 border-brand-200">
          <CardContent className="py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900">Applying to Ivy League?</h3>
                  <p className="text-sm text-neutral-600">
                    Get school-specific analysis from the AO perspective. All essays analyzed as a portfolio.
                  </p>
                </div>
              </div>
              <Link href="/ivy">
                <Button size="sm">
                  <Sparkles className="w-4 h-4" />
                  Ivy Analysis
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Essays List */}
        {essays.length === 0 ? (
          <Card variant="elevated" className="text-center">
            <CardContent className="py-16">
              <div className="p-4 rounded-2xl bg-brand-100 w-fit mx-auto mb-6">
                <FileText className="w-10 h-10 text-brand-600" />
              </div>
              <h3 className="text-2xl font-semibold text-neutral-900 mb-3">Your essay is waiting</h3>
              <p className="text-neutral-600 mb-2 max-w-md mx-auto">
                Most students find 3-5 critical improvements they missed. Let's see what's hiding in yours.
              </p>
              <p className="text-sm text-neutral-500 mb-8">
                Free Commons Check for essays up to 650 words. Takes 60 seconds.
              </p>
              <Link href="/dashboard/new">
                <Button size="lg">
                  <Sparkles className="w-4 h-4" />
                  Analyze Your First Essay
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {essays.map((essay) => {
              const status = deriveEssayStatus(essay);
              const StatusIcon = status.icon;
              const latestVersion = essay.versions[0];
              const latestAnalysis = latestVersion?.analyses[0];
              const wordCount = latestVersion?.content.split(/\s+/).length || 0;
              const score = latestAnalysis ? Math.round(latestAnalysis.overallScore) : null;

              return (
                <Card key={essay.id} variant="interactive">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <CardTitle className="text-lg truncate">
                            {essay.type.replace(/_/g, ' ')}
                          </CardTitle>
                          {essay.targetSchool && (
                            <Badge variant="secondary" size="sm">
                              {essay.targetSchool}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-1">
                          {essay.promptText}
                        </CardDescription>
                      </div>
                      <Badge variant={status.variant}>
                        <StatusIcon
                          className={`w-3 h-3 ${status.animate ? 'animate-spin' : ''}`}
                        />
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                        <div className="flex items-center gap-2 sm:gap-4 text-sm">
                          <span className="text-neutral-500">{wordCount} words</span>
                          <span className="text-neutral-400">|</span>
                          <span className="text-neutral-500">v{latestVersion?.versionIndex || 1}</span>
                        </div>
                        {score !== null && (
                          <div className="flex items-center gap-3">
                            <div className="w-20 sm:w-24">
                              <Progress value={score} size="sm" />
                            </div>
                            <span className="text-sm font-semibold text-neutral-900">
                              {score}/100
                            </span>
                          </div>
                        )}
                      </div>

                      {status.status !== 'PAYMENT_PENDING' ? (
                        <Link href={`/dashboard/essay/${essay.id}`} className="w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            View Details
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/pricing?essay=${essay.id}`} className="w-full sm:w-auto">
                          <Button variant="premium" size="sm" className="w-full sm:w-auto">
                            Complete Payment
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Referral Section */}
        <section className="mt-8 sm:mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-success-600 dark:text-success-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">Invite Friends</h2>
          </div>
          <ReferralCard />
        </section>
      </main>
    </div>
  );
}
