import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MessageCircle, Clock, CheckCircle } from 'lucide-react';

async function getQASessions() {
  return await prisma.order.findMany({
    where: {
      package: {
        in: ['EXPERT_QA_PREMIUM', 'EXPERT_QA_STANDARD'],
      },
      status: 'PAID',
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      essay: true,
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
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
}

export default async function AdminQAPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Check if user is admin or reviewer
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || !['ADMIN', 'REVIEWER'].includes(dbUser.role)) {
    redirect('/dashboard');
  }

  const sessions = await getQASessions();

  // Categorize sessions
  const activeSessions = sessions.filter(s => {
    const isPremium = s.package === 'EXPERT_QA_PREMIUM';
    const hoursRemaining = isPremium ? 48 : 24;
    const expiresAt = new Date(s.createdAt.getTime() + hoursRemaining * 60 * 60 * 1000);
    return new Date() < expiresAt;
  });

  const expiredSessions = sessions.filter(s => !activeSessions.includes(s));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Q&A Session Management</h1>
          <p className="text-gray-600 mt-1">Answer student questions about their essays</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <MessageCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSessions.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting responses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessions.length}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredSessions.length}</div>
              <p className="text-xs text-muted-foreground">Expired sessions</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Sessions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Active Sessions</h2>
          {activeSessions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-600">
                No active Q&A sessions
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeSessions.map((session) => {
                const userName = session.user.profile?.name || session.user.email.split('@')[0];
                const isPremium = session.package === 'EXPERT_QA_PREMIUM';
                const hoursRemaining = isPremium ? 48 : 24;
                const expiresAt = new Date(session.createdAt.getTime() + hoursRemaining * 60 * 60 * 1000);
                const lastMessage = session.messages[0];
                const hasUnreadMessages = lastMessage && lastMessage.senderId === session.userId;

                return (
                  <Card key={session.id} className={hasUnreadMessages ? 'border-blue-500 border-2' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{userName}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              isPremium ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isPremium ? 'Premium 48hr' : 'Standard 24hr'}
                            </span>
                            {hasUnreadMessages && (
                              <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-semibold">
                                New Message
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Essay: {session.essay?.type.replace(/_/g, ' ') || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            {session._count.messages} messages • Expires: {expiresAt.toLocaleString()}
                          </p>
                          {lastMessage && (
                            <p className="text-sm text-gray-500 italic truncate">
                              Last: "{lastMessage.text.substring(0, 100)}..."
                            </p>
                          )}
                        </div>
                        <Link href={`/admin/qa/${session.id}`}>
                          <Button>
                            View & Respond
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Expired Sessions */}
        {expiredSessions.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4">Completed Sessions</h2>
            <div className="grid gap-4">
              {expiredSessions.slice(0, 5).map((session) => {
                const userName = session.user.profile?.name || session.user.email.split('@')[0];

                return (
                  <Card key={session.id} className="bg-gray-50">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{userName}</h3>
                          <p className="text-sm text-gray-600">
                            {session._count.messages} messages • Expired
                          </p>
                        </div>
                        <Link href={`/admin/qa/${session.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
