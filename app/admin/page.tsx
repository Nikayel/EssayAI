import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

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

  const reviews = await getReviews();

  const stats = {
    assigned: reviews.filter(r => r.status === 'ASSIGNED').length,
    inProgress: reviews.filter(r => r.status === 'IN_PROGRESS').length,
    overdue: reviews.filter(r => new Date(r.dueAt) < new Date()).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex gap-4">
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
        <h2 className="text-3xl font-bold mb-6">Review Queue</h2>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-yellow-600">Assigned</CardTitle>
              <CardDescription>Awaiting review</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.assigned}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">In Progress</CardTitle>
              <CardDescription>Being reviewed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">Overdue</CardTitle>
              <CardDescription>Past SLA deadline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <h3 className="text-xl font-semibold">All caught up!</h3>
                <p className="text-gray-600 mt-2">No pending reviews at this time</p>
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
                <Card key={review.id} className={isOverdue ? 'border-2 border-red-500' : 'border-l-4 border-l-blue-600'}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {review.version.essay.type.replace(/_/g, ' ')}
                          </CardTitle>
                          {review.version.essay.targetSchool && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                              {review.version.essay.targetSchool}
                            </span>
                          )}
                        </div>

                        {/* Student Info */}
                        <div className="flex gap-4 text-sm text-gray-700 mt-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Student:</span>
                            <span>{userName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Email:</span>
                            <span className="text-gray-600">{review.order.user.email}</span>
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
                          <span className="font-semibold text-gray-700">Prompt:</span>{' '}
                          {review.version.essay.promptText.substring(0, 150)}
                          {review.version.essay.promptText.length > 150 && '...'}
                        </CardDescription>
                      </div>

                      <div className="text-right ml-4">
                        {isOverdue ? (
                          <div className="flex items-center gap-2 text-red-600 font-semibold mb-2">
                            <AlertCircle className="w-5 h-5" />
                            <span>OVERDUE</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-700 mb-2">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold">
                              {hoursUntilDue > 0 ? `${hoursUntilDue}h left` : 'Due now'}
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Due: {new Date(review.dueAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Package:</span>
                          <span className="font-semibold text-purple-700">
                            {review.order.package.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Words:</span>
                          <span className="font-semibold">{wordCount}</span>
                        </div>
                        {aiAnalysis && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">AI Score:</span>
                            <span className="font-semibold text-blue-600">
                              {Math.round(aiAnalysis.overallScore)}/100
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-semibold px-2 py-0.5 rounded ${
                            review.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
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
