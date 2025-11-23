import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, User, FileText, MessageCircle } from 'lucide-react';
import { QAMessageList } from '@/components/qa/qa-message-list';
import { QAAdminResponseForm } from '@/components/qa/qa-admin-response-form';

async function getQASession(orderId: string) {
  return await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      essay: {
        include: {
          versions: {
            orderBy: { versionIndex: 'desc' },
            take: 1,
          },
        },
      },
      messages: {
        include: {
          sender: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });
}

export default async function AdminQASessionPage({ params }: { params: { orderId: string } }) {
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

  const qaSession = await getQASession(params.orderId);

  if (!qaSession) {
    redirect('/admin/qa');
  }

  const isQAPackage = ['EXPERT_QA_PREMIUM', 'EXPERT_QA_STANDARD'].includes(qaSession.package);
  if (!isQAPackage) {
    redirect('/admin/qa');
  }

  const isPremium = qaSession.package === 'EXPERT_QA_PREMIUM';
  const hoursRemaining = isPremium ? 48 : 24;
  const createdAt = new Date(qaSession.createdAt);
  const expiresAt = new Date(createdAt.getTime() + hoursRemaining * 60 * 60 * 1000);
  const isActive = new Date() < expiresAt;

  const userName = qaSession.user.profile?.name || qaSession.user.email.split('@')[0];
  const latestVersion = qaSession.essay?.versions[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin/qa">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Q&A Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Q&A Session</h1>
          <div className="w-32"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Student Info & Essay */}
          <div className="md:col-span-1 space-y-4">
            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Student Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm">{qaSession.user.email}</p>
                  </div>
                  {qaSession.user.profile?.gradeLevel && (
                    <div>
                      <p className="text-sm text-gray-600">Grade Level</p>
                      <p className="text-sm">{qaSession.user.profile.gradeLevel}</p>
                    </div>
                  )}
                  {qaSession.user.profile?.intendedMajor && (
                    <div>
                      <p className="text-sm text-gray-600">Intended Major</p>
                      <p className="text-sm">{qaSession.user.profile.intendedMajor}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Package</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      isPremium ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isPremium ? 'Premium 48hr' : 'Standard 24hr'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {isActive ? 'Active' : 'Expired'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-sm">{createdAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expires</p>
                    <p className="text-sm">{expiresAt.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Messages</p>
                    <p className="font-semibold">{qaSession.messages.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Essay Reference */}
            {latestVersion && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Essay Reference
                  </CardTitle>
                  <CardDescription>
                    {qaSession.essay?.type.replace(/_/g, ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{latestVersion.content}</p>
                  </div>
                  <Link href={`/dashboard/essays/${qaSession.essay?.id}`}>
                    <Button variant="outline" size="sm" className="mt-4 w-full">
                      View Full Essay
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Conversation */}
          <div className="md:col-span-2 space-y-4">
            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Conversation
                </CardTitle>
                <CardDescription>
                  Q&A session with {userName}
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <QAMessageList messages={qaSession.messages} currentUserId={user.id} />
              </CardContent>
            </Card>

            {/* Response Form */}
            {isActive ? (
              <Card>
                <CardHeader>
                  <CardTitle>Send Response</CardTitle>
                  <CardDescription>
                    Target response time: &lt; 2 hours during business hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QAAdminResponseForm orderId={qaSession.id} />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-100">
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600">
                    This Q&A session has expired. No new messages can be sent.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
