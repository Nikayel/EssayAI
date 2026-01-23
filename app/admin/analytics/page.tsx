import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Users, FileText, TrendingUp } from 'lucide-react';

async function getAnalytics() {
  const [users, essays, orders, reviews] = await Promise.all([
    prisma.user.count(),
    prisma.essay.count(),
    prisma.order.findMany({
      where: { status: 'PAID' },
    }),
    prisma.review.findMany({
      where: { status: 'DELIVERED' },
      include: {
        order: true,
      },
    }),
  ]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Calculate average turnaround time for reviews
  const turnaroundTimes = reviews
    .filter(r => r.deliveredAt)
    .map(r => {
      const created = new Date(r.createdAt).getTime();
      const delivered = new Date(r.deliveredAt!).getTime();
      return (delivered - created) / (1000 * 60 * 60); // hours
    });

  const avgTurnaround = turnaroundTimes.length > 0
    ? turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length
    : 0;

  // Package breakdown
  const packageBreakdown = orders.reduce((acc: any, order) => {
    acc[order.package] = (acc[order.package] || 0) + 1;
    return acc;
  }, {});

  return {
    totalUsers: users,
    totalEssays: essays,
    totalOrders: orders.length,
    totalRevenue,
    avgOrderValue,
    avgTurnaround,
    packageBreakdown,
  };
}

export default async function AdminAnalyticsPage() {
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

  const analytics = await getAnalytics();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/admin">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <div className="w-32"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(analytics.totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From {analytics.totalOrders} orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Essays</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalEssays}</div>
              <p className="text-xs text-muted-foreground">Submitted for review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(analytics.avgOrderValue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per order</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Package Breakdown</CardTitle>
              <CardDescription>Orders by package type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.packageBreakdown).map(([pkg, count]: [string, any]) => (
                  <div key={pkg} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{pkg.replace(/_/g, ' ')}</span>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Service quality indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Avg Turnaround Time</p>
                  <p className="text-3xl font-bold">{analytics.avgTurnaround.toFixed(1)} hrs</p>
                  <p className="text-xs text-gray-600 mt-1">For human reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
