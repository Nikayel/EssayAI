import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  ArrowRight,
  Target,
  TrendingUp
} from 'lucide-react';

async function getPortfolioData(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      targetSchools: {
        orderBy: { deadline: 'asc' },
        include: {
          essays: {
            include: {
              versions: {
                orderBy: { versionIndex: 'desc' },
                take: 1,
                include: {
                  analyses: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return profile;
}

function getDaysUntil(date: Date): number {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getDeadlineColor(days: number): string {
  if (days <= 0) return 'text-red-600 bg-red-50';
  if (days <= 7) return 'text-red-600 bg-red-50';
  if (days <= 14) return 'text-yellow-600 bg-yellow-50';
  if (days <= 30) return 'text-blue-600 bg-blue-50';
  return 'text-gray-600 bg-gray-50';
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: Clock },
    IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
    ESSAYS_DRAFTING: { label: 'Essays Drafting', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
    ESSAYS_COMPLETE: { label: 'Essays Complete', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    SUBMITTED: { label: 'Submitted', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
    ACCEPTED: { label: 'Accepted', color: 'bg-green-500 text-white', icon: CheckCircle },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    WAITLISTED: { label: 'Waitlisted', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    DEFERRED: { label: 'Deferred', color: 'bg-orange-100 text-orange-700', icon: Clock },
  };

  return statusConfig[status] || statusConfig.NOT_STARTED;
}

export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  const profile = await getPortfolioData(user.id);

  if (!profile || !profile.isOnboarded) {
    redirect('/onboarding');
  }

  const targetSchools = profile.targetSchools || [];

  // Calculate overall stats
  const totalSchools = targetSchools.length;
  const totalEssays = targetSchools.reduce((sum, school) => sum + school.essays.length, 0);
  const completedEssays = targetSchools.reduce((sum, school) =>
    sum + school.essays.filter(e => e.versions[0]?.analyses[0]).length, 0
  );
  const avgScore = totalEssays > 0
    ? targetSchools.reduce((sum, school) =>
        sum + school.essays.reduce((essaySum, essay) =>
          essaySum + (essay.versions[0]?.analyses[0]?.overallScore || 0), 0
        ), 0) / totalEssays
    : 0;

  // Find next deadline
  const nextDeadline = targetSchools[0]; // Already sorted by deadline

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">EssayEdge AI</h1>
          <div className="flex gap-4 items-center">
            <Link href="/dashboard">
              <Button variant="ghost">Essays</Button>
            </Link>
            <Link href="/dashboard/portfolio">
              <Button variant="ghost" className="bg-gray-100">Portfolio</Button>
            </Link>
            <Link href="/dashboard/orders">
              <Button variant="ghost">Orders</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{totalSchools}</p>
                  <p className="text-sm text-gray-600">Target Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{completedEssays}/{totalEssays}</p>
                  <p className="text-sm text-gray-600">Essays Analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{avgScore > 0 ? Math.round(avgScore) : '--'}</p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={nextDeadline ? getDeadlineColor(getDaysUntil(nextDeadline.deadline)) : 'bg-gray-50'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8" />
                <div>
                  <p className="text-2xl font-bold">
                    {nextDeadline ? getDaysUntil(nextDeadline.deadline) : '--'}
                  </p>
                  <p className="text-sm">
                    {nextDeadline ? `Days to ${nextDeadline.schoolName}` : 'No deadlines set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spike/Narrative Reminder */}
        {profile.spike && (
          <Card className="mb-8 bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900">Your Narrative/Spike</p>
                  <p className="text-blue-800 text-sm">{profile.spike}</p>
                  <p className="text-blue-600 text-xs mt-1">
                    Keep this consistent across all your essays
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schools List */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Application Portfolio</h2>
            <p className="text-gray-600">Track progress across all your target schools</p>
          </div>
          <Link href="/dashboard/portfolio/add-school">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add School
            </Button>
          </Link>
        </div>

        {targetSchools.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No schools added yet</h3>
              <p className="text-gray-600 mb-4">
                Add your target schools to track deadlines and essays in one place
              </p>
              <Link href="/dashboard/portfolio/add-school">
                <Button>Add Your First School</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {targetSchools.map((school) => {
              const daysUntil = getDaysUntil(school.deadline);
              const status = getStatusBadge(school.status);
              const StatusIcon = status.icon;
              const essayCount = school.essays.length;
              const analyzedCount = school.essays.filter(e => e.versions[0]?.analyses[0]).length;
              const avgSchoolScore = essayCount > 0
                ? school.essays.reduce((sum, e) => sum + (e.versions[0]?.analyses[0]?.overallScore || 0), 0) / essayCount
                : 0;

              return (
                <Card
                  key={school.id}
                  className={`${daysUntil <= 7 && daysUntil > 0 ? 'border-red-300 border-2' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {school.schoolName}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          <span>{school.deadlineType.replace(/_/g, ' ')}</span>
                          <span>•</span>
                          <span className={daysUntil <= 14 ? 'text-red-600 font-semibold' : ''}>
                            {daysUntil <= 0
                              ? 'Deadline passed'
                              : `${daysUntil} days until deadline`
                            }
                          </span>
                        </CardDescription>
                      </div>

                      <div className={`px-3 py-2 rounded-lg ${getDeadlineColor(daysUntil)}`}>
                        <Calendar className="w-5 h-5 inline mr-2" />
                        <span className="font-semibold">
                          {new Date(school.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Essays analyzed</span>
                        <span className="font-semibold">{analyzedCount}/{essayCount}</span>
                      </div>
                      <Progress
                        value={essayCount > 0 ? (analyzedCount / essayCount) * 100 : 0}
                        className="h-2"
                      />
                    </div>

                    {/* Essays for this school */}
                    {essayCount > 0 ? (
                      <div className="space-y-2">
                        {school.essays.map((essay) => {
                          const analysis = essay.versions[0]?.analyses[0];
                          return (
                            <div
                              key={essay.id}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                {analysis ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Clock className="w-5 h-5 text-gray-400" />
                                )}
                                <span className="font-medium">
                                  {essay.type.replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                {analysis && (
                                  <span className="font-semibold">
                                    Score: {Math.round(analysis.overallScore)}
                                  </span>
                                )}
                                <Link href={`/dashboard/essay/${essay.id}`}>
                                  <Button variant="outline" size="sm">
                                    View
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm py-2">No essays added for this school yet</p>
                    )}

                    {/* Add essay button */}
                    <div className="mt-4 flex justify-between items-center">
                      <Link href={`/dashboard/new?school=${encodeURIComponent(school.schoolName)}&schoolId=${school.id}`}>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Essay for {school.schoolName}
                        </Button>
                      </Link>

                      {avgSchoolScore > 0 && (
                        <span className="text-sm text-gray-600">
                          Avg score: <strong>{Math.round(avgSchoolScore)}</strong>
                        </span>
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
