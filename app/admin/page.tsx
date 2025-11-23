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
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      order: {
        include: {
          user: {
            select: {
              email: true,
              name: true,
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

              return (
                <Card key={review.id} className={isOverdue ? 'border-2 border-red-500' : ''}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>
                          {review.version.essay.type.replace(/_/g, ' ')}
                          {review.version.essay.targetSchool && (
                            <span className="text-sm font-normal text-gray-600 ml-2">
                              for {review.version.essay.targetSchool}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Student: {review.order.user.email}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        {isOverdue ? (
                          <div className="flex items-center gap-2 text-red-600 font-semibold">
                            <AlertCircle className="w-5 h-5" />
                            <span>OVERDUE</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-5 h-5" />
                            <span>
                              {hoursUntilDue > 0 ? `${hoursUntilDue}h remaining` : 'Due now'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Package: {review.order.package.replace(/_/g, ' ')}</span>
                        <span>Due: {new Date(review.dueAt).toLocaleDateString()}</span>
                        <span className={`font-semibold ${review.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-yellow-600'}`}>
                          {review.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <Link href={`/admin/review/${review.id}`}>
                        <Button>
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
