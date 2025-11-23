import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, DollarSign, Target, MousePointerClick } from 'lucide-react';

async function getConversionMetrics() {
  const events = await prisma.analyticsEvent.findMany({
    where: {
      event: {
        in: ['upsell_viewed', 'upsell_clicked', 'upsell_purchased'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate metrics by package
  const packageMetrics: Record<string, {
    views: number;
    clicks: number;
    purchases: number;
    revenue: number;
  }> = {};

  events.forEach(event => {
    const props = event.properties as any;
    const packageType = props.upsell_package || props.package;

    if (!packageType) return;

    if (!packageMetrics[packageType]) {
      packageMetrics[packageType] = {
        views: 0,
        clicks: 0,
        purchases: 0,
        revenue: 0,
      };
    }

    if (event.event === 'upsell_viewed') {
      packageMetrics[packageType].views++;
    } else if (event.event === 'upsell_clicked') {
      packageMetrics[packageType].clicks++;
    } else if (event.event === 'upsell_purchased') {
      packageMetrics[packageType].purchases++;
      packageMetrics[packageType].revenue += (props.price_cents || 0) / 100;
    }
  });

  // Calculate overall metrics
  const totalViews = Object.values(packageMetrics).reduce((sum, m) => sum + m.views, 0);
  const totalClicks = Object.values(packageMetrics).reduce((sum, m) => sum + m.clicks, 0);
  const totalPurchases = Object.values(packageMetrics).reduce((sum, m) => sum + m.purchases, 0);
  const totalRevenue = Object.values(packageMetrics).reduce((sum, m) => sum + m.revenue, 0);

  const clickThroughRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const conversionRate = totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;

  return {
    packageMetrics,
    overall: {
      totalViews,
      totalClicks,
      totalPurchases,
      totalRevenue,
      clickThroughRate,
      conversionRate,
    },
  };
}

export default async function AdminConversionsPage() {
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

  const metrics = await getConversionMetrics();

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
          <h1 className="text-2xl font-bold">Conversion Tracking</h1>
          <div className="w-32"></div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Overall Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upsell Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.overall.totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From {metrics.overall.totalPurchases} upsells</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
              <MousePointerClick className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overall.clickThroughRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{metrics.overall.totalClicks} / {metrics.overall.totalViews} views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overall.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">{metrics.overall.totalPurchases} / {metrics.overall.totalClicks} clicks</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Upsells</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.overall.totalPurchases}</div>
              <p className="text-xs text-muted-foreground">Successfully converted</p>
            </CardContent>
          </Card>
        </div>

        {/* Package Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Package</CardTitle>
            <CardDescription>Detailed conversion metrics for each upsell package</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Package</th>
                    <th className="text-right py-3 px-4 font-semibold">Views</th>
                    <th className="text-right py-3 px-4 font-semibold">Clicks</th>
                    <th className="text-right py-3 px-4 font-semibold">CTR</th>
                    <th className="text-right py-3 px-4 font-semibold">Purchases</th>
                    <th className="text-right py-3 px-4 font-semibold">Conv Rate</th>
                    <th className="text-right py-3 px-4 font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(metrics.packageMetrics)
                    .sort(([, a], [, b]) => b.revenue - a.revenue)
                    .map(([packageName, data]) => {
                      const ctr = data.views > 0 ? (data.clicks / data.views) * 100 : 0;
                      const convRate = data.clicks > 0 ? (data.purchases / data.clicks) * 100 : 0;

                      return (
                        <tr key={packageName} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {packageName.replace(/_/g, ' ')}
                          </td>
                          <td className="text-right py-3 px-4">{data.views}</td>
                          <td className="text-right py-3 px-4">{data.clicks}</td>
                          <td className="text-right py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              ctr > 30 ? 'bg-green-100 text-green-800' :
                              ctr > 15 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {ctr.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">{data.purchases}</td>
                          <td className="text-right py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              convRate > 20 ? 'bg-green-100 text-green-800' :
                              convRate > 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {convRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold">
                            ${data.revenue.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {Object.keys(metrics.packageMetrics).length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No conversion data yet. Upsell tracking will appear here once users interact with upsells.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.overall.conversionRate > 15 && (
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Strong Conversion Performance</p>
                    <p className="text-sm text-green-700">Your {metrics.overall.conversionRate.toFixed(1)}% conversion rate is excellent for SaaS upsells.</p>
                  </div>
                </div>
              )}

              {metrics.overall.clickThroughRate < 20 && metrics.overall.totalViews > 10 && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">Improve Click-Through Rate</p>
                    <p className="text-sm text-yellow-700">Your {metrics.overall.clickThroughRate.toFixed(1)}% CTR could be improved with better copy or positioning.</p>
                  </div>
                </div>
              )}

              {metrics.overall.totalViews === 0 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Getting Started</p>
                    <p className="text-sm text-blue-700">No upsell data yet. Once users complete orders, upsell tracking will begin.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
