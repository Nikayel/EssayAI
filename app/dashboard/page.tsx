import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, FileText, Loader2, CheckCircle2, Clock, MessageCircle } from 'lucide-react';

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
      color: 'text-yellow-600',
    };
  }

  // Check if AI analysis is complete
  if (!latestVersion?.analyses[0]) {
    return {
      status: 'AI_ANALYZING',
      label: 'AI Analyzing...',
      icon: Loader2,
      color: 'text-blue-600',
      animate: true,
    };
  }

  // Check if human review is needed
  const needsHumanReview = ['HUMAN_LITE', 'HUMAN_FULL_1', 'HUMAN_FULL_3', 'HUMAN_FULL_5'].includes(latestOrder.package);

  if (needsHumanReview) {
    if (!latestReview) {
      return {
        status: 'AWAITING_ASSIGNMENT',
        label: 'Awaiting Reviewer Assignment',
        icon: Clock,
        color: 'text-purple-600',
      };
    }

    if (latestReview.status === 'ASSIGNED' || latestReview.status === 'IN_PROGRESS') {
      return {
        status: 'IN_HUMAN_REVIEW',
        label: 'Under Human Review',
        icon: Loader2,
        color: 'text-purple-600',
        animate: true,
      };
    }

    if (latestReview.status === 'DELIVERED') {
      return {
        status: 'REVIEW_COMPLETE',
        label: 'Review Complete',
        icon: CheckCircle2,
        color: 'text-green-600',
      };
    }
  }

  // AI-only packages - complete once analysis is done
  return {
    status: 'AI_COMPLETE',
    label: 'Analysis Complete',
    icon: CheckCircle2,
    color: 'text-green-600',
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">EssayEdge AI</h1>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-600">{user.email}</span>
            <Link href="/dashboard/orders">
              <Button variant="ghost">Orders</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
            <form action="/auth/signout" method="post">
              <Button variant="outline" type="submit">Sign Out</Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Active Q&A Sessions */}
        {qaSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Active Q&A Sessions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {qaSessions.map((session) => {
                const isPremium = session.package === 'EXPERT_QA_PREMIUM';
                const hoursRemaining = isPremium ? 48 : 24;
                const expiresAt = new Date(session.createdAt.getTime() + hoursRemaining * 60 * 60 * 1000);

                return (
                  <Card key={session.id} className="border-2 border-blue-500">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageCircle className="w-6 h-6 text-blue-600" />
                        <CardTitle className="text-lg">
                          {isPremium ? '2-Day Premium Q&A' : '1-Day Standard Q&A'}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        {session.essay?.type.replace(/_/g, ' ') || 'Your Essay'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Messages</span>
                          <span className="font-semibold">{session._count.messages}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Expires</span>
                          <span className="font-semibold">
                            {expiresAt.toLocaleDateString()} at {expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <Link href={`/dashboard/qa/${session.id}`}>
                        <Button className="w-full">
                          Open Q&A Session
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">My Essays</h2>
            <p className="text-gray-600 mt-1">Track progress and view feedback</p>
          </div>
          <Link href="/dashboard/new">
            <Button size="lg">
              <FileText className="w-4 h-4 mr-2" />
              New Essay
            </Button>
          </Link>
        </div>

        {/* Essays List */}
        {essays.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No essays yet</h3>
              <p className="text-gray-600 mb-4">
                Get started by submitting your first essay for analysis
              </p>
              <Link href="/dashboard/new">
                <Button>Submit Your First Essay</Button>
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

              return (
                <Card key={essay.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">
                          {essay.type.replace(/_/g, ' ')}
                          {essay.targetSchool && (
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              for {essay.targetSchool}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {essay.promptText.substring(0, 100)}
                          {essay.promptText.length > 100 && '...'}
                        </CardDescription>
                      </div>
                      <div className={`flex items-center gap-2 ${status.color}`}>
                        <StatusIcon
                          className={`w-5 h-5 ${status.animate ? 'animate-spin' : ''}`}
                        />
                        <span className="font-medium">{status.label}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-6 text-sm text-gray-600">
                        <span>{wordCount} words</span>
                        <span>v{latestVersion?.versionIndex || 1}</span>
                        {latestAnalysis && (
                          <span className="font-semibold text-gray-900">
                            Score: {Math.round(latestAnalysis.overallScore)}/100
                          </span>
                        )}
                      </div>

                      {status.status !== 'PAYMENT_PENDING' ? (
                        <Link href={`/dashboard/essay/${essay.id}`}>
                          <Button variant="outline">
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/pricing?essay=${essay.id}`}>
                          <Button>
                            Complete Payment
                            <ArrowRight className="w-4 h-4 ml-2" />
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
