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
  Sparkles
} from 'lucide-react';

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

function getEssayStatus(essay: any) {
  const latestVersion = essay.versions[0];
  const latestOrder = essay.orders[0];
  const latestReview = latestVersion?.reviews[0];

  // Check payment status
  if (!latestOrder || latestOrder.status !== 'PAID') {
    return {
      status: 'PAYMENT_PENDING',
      label: 'Payment Required',
      icon: Clock,
      variant: 'warning' as const,
    };
  }

  // Check if AI analysis is complete
  if (!latestVersion?.analyses[0]) {
    return {
      status: 'AI_ANALYZING',
      label: 'AI Analyzing...',
      icon: Loader2,
      variant: 'info' as const,
      animate: true,
    };
  }

  // Check if human review is needed
  const needsHumanReview = ['HUMAN_LITE', 'HUMAN_FULL_1', 'HUMAN_FULL_3', 'HUMAN_FULL_5'].includes(latestOrder.package);

  if (needsHumanReview) {
    if (!latestReview) {
      return {
        status: 'AWAITING_ASSIGNMENT',
        label: 'Awaiting Reviewer',
        icon: Clock,
        variant: 'default' as const,
      };
    }

    if (latestReview.status === 'ASSIGNED' || latestReview.status === 'IN_PROGRESS') {
      return {
        status: 'IN_HUMAN_REVIEW',
        label: 'Under Review',
        icon: Loader2,
        variant: 'default' as const,
        animate: true,
      };
    }

    if (latestReview.status === 'DELIVERED') {
      return {
        status: 'REVIEW_COMPLETE',
        label: 'Complete',
        icon: CheckCircle2,
        variant: 'success' as const,
      };
    }
  }

  // AI-only packages - complete once analysis is done
  return {
    status: 'AI_COMPLETE',
    label: 'Complete',
    icon: CheckCircle2,
    variant: 'success' as const,
  };
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">EssayEdge AI</span>
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

        {/* Essays Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">My Essays</h1>
            <p className="text-neutral-500 mt-1">Track progress and view feedback</p>
          </div>
          <Link href="/dashboard/new">
            <Button size="lg">
              <Plus className="w-4 h-4" />
              New Essay
            </Button>
          </Link>
        </div>

        {/* Essays List */}
        {essays.length === 0 ? (
          <Card variant="elevated" className="text-center">
            <CardContent className="py-16">
              <div className="p-4 rounded-2xl bg-neutral-100 w-fit mx-auto mb-6">
                <FileText className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">No essays yet</h3>
              <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                Get started by submitting your first essay for AI-powered analysis
              </p>
              <Link href="/dashboard/new">
                <Button size="lg">
                  <Sparkles className="w-4 h-4" />
                  Submit Your First Essay
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {essays.map((essay) => {
              const status = getEssayStatus(essay);
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
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-neutral-500">{wordCount} words</span>
                          <span className="text-neutral-400">|</span>
                          <span className="text-neutral-500">v{latestVersion?.versionIndex || 1}</span>
                        </div>
                        {score !== null && (
                          <div className="flex items-center gap-3">
                            <div className="w-24">
                              <Progress value={score} size="sm" />
                            </div>
                            <span className="text-sm font-semibold text-neutral-900">
                              {score}/100
                            </span>
                          </div>
                        )}
                      </div>

                      {status.status !== 'PAYMENT_PENDING' ? (
                        <Link href={`/dashboard/essay/${essay.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/pricing?essay=${essay.id}`}>
                          <Button variant="premium" size="sm">
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
      </main>
    </div>
  );
}
