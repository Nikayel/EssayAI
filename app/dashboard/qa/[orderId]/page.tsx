import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { QAMessageForm } from '@/components/qa/qa-message-form';
import { QAMessageList } from '@/components/qa/qa-message-list';

async function getQASession(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId, userId },
    include: {
      essay: true,
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

  if (!order) return null;

  // Check if this is a Q&A package
  const isQAPackage = ['EXPERT_QA_PREMIUM', 'EXPERT_QA_STANDARD'].includes(order.package);
  if (!isQAPackage) return null;

  return order;
}

export default async function QASessionPage({ params }: { params: { orderId: string } }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const qaSession = await getQASession(params.orderId, user.id);

  if (!qaSession) {
    redirect('/dashboard');
  }

  const isPremium = qaSession.package === 'EXPERT_QA_PREMIUM';
  const hoursRemaining = isPremium ? 48 : 24;
  const createdAt = new Date(qaSession.createdAt);
  const expiresAt = new Date(createdAt.getTime() + hoursRemaining * 60 * 60 * 1000);
  const isActive = new Date() < expiresAt;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Expert Q&A Session</h1>
          <div className="w-32"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Session Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-blue-600" />
                <div>
                  <CardTitle>
                    {isPremium ? '2-Day Premium Q&A' : '1-Day Standard Q&A'}
                  </CardTitle>
                  <CardDescription>
                    Ask unlimited questions about: {qaSession.essay?.type.replace(/_/g, ' ') || 'Your Essay'}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                {isActive ? (
                  <>
                    <div className="text-2xl font-bold text-green-600">Active</div>
                    <p className="text-sm text-gray-600">
                      Expires: {expiresAt.toLocaleDateString()} at {expiresAt.toLocaleTimeString()}
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-gray-400">Expired</div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold text-blue-600">{qaSession.messages.length}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-lg font-bold text-purple-600">&lt; 2 hours</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Questions Limit</p>
                <p className="text-2xl font-bold text-green-600">Unlimited</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Your questions and expert responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QAMessageList messages={qaSession.messages} currentUserId={user.id} />
          </CardContent>
        </Card>

        {/* Message Form */}
        {isActive && (
          <Card>
            <CardHeader>
              <CardTitle>Ask a Question</CardTitle>
              <CardDescription>
                Your expert will respond within 2 hours during business hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QAMessageForm orderId={qaSession.id} />
            </CardContent>
          </Card>
        )}

        {!isActive && (
          <Card className="bg-gray-100">
            <CardContent className="py-8 text-center">
              <p className="text-gray-600 mb-4">
                This Q&A session has expired. You can still view past messages.
              </p>
              <Link href="/dashboard">
                <Button>Return to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
