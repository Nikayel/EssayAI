import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, PenTool } from 'lucide-react';
import { AdminMobileNav, AdminDesktopNav } from '@/components/admin/admin-nav';
import { StatCardGroup } from '@/components/admin/stat-card';
import {
  RebuildButton,
  DeleteItemButton,
  AddEntryButton,
  EmbeddingStatusDot,
} from '@/components/admin/embedding-actions';

// =============================================================================
// DATA FETCHING
// =============================================================================

async function getEmbeddingStats() {
  const [
    essayTotal,
    essayWithEmbed,
    essayWithoutEmbed,
    patternTotal,
    patternWithEmbed,
    patternWithoutEmbed,
    insightTotal,
    insightWithEmbed,
    insightWithoutEmbed,
  ] = await Promise.all([
    prisma.exampleEssay.count(),
    prisma.exampleEssay.count({ where: { embedding: { not: Prisma.DbNull } } }),
    prisma.exampleEssay.count({ where: { embedding: { equals: Prisma.DbNull } } }),
    prisma.feedbackPattern.count(),
    prisma.feedbackPattern.count({ where: { embedding: { not: Prisma.DbNull } } }),
    prisma.feedbackPattern.count({ where: { embedding: { equals: Prisma.DbNull } } }),
    prisma.schoolInsight.count(),
    prisma.schoolInsight.count({ where: { embedding: { not: Prisma.DbNull } } }),
    prisma.schoolInsight.count({ where: { embedding: { equals: Prisma.DbNull } } }),
  ]);

  const totalItems = essayTotal + patternTotal + insightTotal;
  const totalWithEmbed = essayWithEmbed + patternWithEmbed + insightWithEmbed;
  const coverage = totalItems > 0 ? Math.round((totalWithEmbed / totalItems) * 100) : 0;

  return {
    essays: { total: essayTotal, withEmbed: essayWithEmbed, withoutEmbed: essayWithoutEmbed },
    patterns: { total: patternTotal, withEmbed: patternWithEmbed, withoutEmbed: patternWithoutEmbed },
    insights: { total: insightTotal, withEmbed: insightWithEmbed, withoutEmbed: insightWithoutEmbed },
    totalItems,
    totalWithEmbed,
    totalMissing: totalItems - totalWithEmbed,
    coverage,
  };
}

async function getRecentExampleEssays() {
  return prisma.exampleEssay.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      schoolId: true,
      essayType: true,
      outcome: true,
      embedding: true,
      isActive: true,
      createdAt: true,
    },
  });
}

async function getRecentFeedbackPatterns() {
  return prisma.feedbackPattern.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      patternName: true,
      issueType: true,
      issueCategory: true,
      severity: true,
      embedding: true,
      isActive: true,
      createdAt: true,
    },
  });
}

async function getRecentSchoolInsights() {
  return prisma.schoolInsight.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      schoolId: true,
      insightType: true,
      source: true,
      embedding: true,
      isActive: true,
      createdAt: true,
    },
  });
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function AdminEmbeddingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (dbUser?.role !== 'ADMIN') redirect('/dashboard');

  const [stats, recentEssays, recentPatterns, recentInsights] = await Promise.all([
    getEmbeddingStats(),
    getRecentExampleEssays(),
    getRecentFeedbackPatterns(),
    getRecentSchoolInsights(),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Admin</h1>
            </div>
          </Link>
          <AdminDesktopNav />
          <AdminMobileNav />
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Page Title */}
        <div className="flex items-center gap-2 mb-6">
          <Database className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Embedding Management
          </h2>
        </div>

        {/* Stats Row */}
        <div className="mb-6 sm:mb-8">
          <StatCardGroup
            cols={6}
            stats={[
              { label: 'Essays', value: stats.essays.total, color: 'blue' },
              { label: 'Essays Missing', value: stats.essays.withoutEmbed, color: 'error', highlight: true, highlightColor: 'error' },
              { label: 'Patterns', value: stats.patterns.total, color: 'purple' },
              { label: 'Patterns Missing', value: stats.patterns.withoutEmbed, color: 'error', highlight: true, highlightColor: 'error' },
              { label: 'Insights', value: stats.insights.total, color: 'warning' },
              { label: 'Insights Missing', value: stats.insights.withoutEmbed, color: 'error', highlight: true, highlightColor: 'error' },
            ]}
          />
        </div>

        {/* Embedding Health Card */}
        <Card className="mb-6 sm:mb-8 border-l-4 border-l-brand-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Embedding Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Coverage</p>
                  <p className={`text-2xl font-bold ${
                    stats.coverage >= 90
                      ? 'text-success-600'
                      : stats.coverage >= 70
                        ? 'text-warning-600'
                        : 'text-error-600'
                  }`}>
                    {stats.coverage}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Total Items</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    {stats.totalItems}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">With Embeddings</p>
                  <p className="text-2xl font-bold text-success-600">{stats.totalWithEmbed}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Missing</p>
                  <p className="text-2xl font-bold text-error-600">{stats.totalMissing}</p>
                </div>
              </div>
              <RebuildButton totalMissing={stats.totalMissing} />
            </div>

            {/* Coverage Bar */}
            <div className="mt-4">
              <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    stats.coverage >= 90
                      ? 'bg-success-500'
                      : stats.coverage >= 70
                        ? 'bg-warning-500'
                        : 'bg-error-500'
                  }`}
                  style={{ width: `${stats.coverage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Example Essays Section */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Example Essays
              </h3>
              <Badge variant="info" size="sm">{stats.essays.total}</Badge>
              {stats.essays.withoutEmbed > 0 && (
                <Badge variant="destructive" size="sm">
                  {stats.essays.withoutEmbed} missing
                </Badge>
              )}
            </div>
            <AddEntryButton type="example_essay" typeLabel="Example Essay" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">ID</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">School</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Outcome</th>
                      <th className="text-center px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Embed</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Created</th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentEssays.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                          No example essays yet
                        </td>
                      </tr>
                    ) : (
                      recentEssays.map((essay) => (
                        <tr
                          key={essay.id}
                          className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                            {essay.id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 font-medium">{essay.schoolId}</td>
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                            {essay.essayType.replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 py-3">
                            {essay.outcome ? (
                              <Badge variant={essay.outcome === 'ACCEPTED' ? 'success' : 'secondary'} size="sm">
                                {essay.outcome}
                              </Badge>
                            ) : (
                              <span className="text-neutral-400">--</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <EmbeddingStatusDot hasEmbedding={essay.embedding !== null} />
                          </td>
                          <td className="px-4 py-3 text-neutral-500 text-xs">
                            {new Date(essay.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DeleteItemButton id={essay.id} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Feedback Patterns Section */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Feedback Patterns
              </h3>
              <Badge variant="info" size="sm">{stats.patterns.total}</Badge>
              {stats.patterns.withoutEmbed > 0 && (
                <Badge variant="destructive" size="sm">
                  {stats.patterns.withoutEmbed} missing
                </Badge>
              )}
            </div>
            <AddEntryButton type="feedback_pattern" typeLabel="Feedback Pattern" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">ID</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Pattern Name</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Category</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Severity</th>
                      <th className="text-center px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Embed</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Created</th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatterns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                          No feedback patterns yet
                        </td>
                      </tr>
                    ) : (
                      recentPatterns.map((pattern) => (
                        <tr
                          key={pattern.id}
                          className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                            {pattern.id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 font-medium">{pattern.patternName}</td>
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                            {pattern.issueCategory}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                pattern.severity >= 4
                                  ? 'destructive'
                                  : pattern.severity >= 3
                                    ? 'warning'
                                    : 'secondary'
                              }
                              size="sm"
                            >
                              {pattern.severity}/5
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <EmbeddingStatusDot hasEmbedding={pattern.embedding !== null} />
                          </td>
                          <td className="px-4 py-3 text-neutral-500 text-xs">
                            {new Date(pattern.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DeleteItemButton id={pattern.id} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* School Insights Section */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                School Insights
              </h3>
              <Badge variant="info" size="sm">{stats.insights.total}</Badge>
              {stats.insights.withoutEmbed > 0 && (
                <Badge variant="destructive" size="sm">
                  {stats.insights.withoutEmbed} missing
                </Badge>
              )}
            </div>
            <AddEntryButton type="school_insight" typeLabel="School Insight" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">ID</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">School</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Source</th>
                      <th className="text-center px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Embed</th>
                      <th className="text-left px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400">Created</th>
                      <th className="text-right px-4 py-3 font-medium text-neutral-600 dark:text-neutral-400"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInsights.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                          No school insights yet
                        </td>
                      </tr>
                    ) : (
                      recentInsights.map((insight) => (
                        <tr
                          key={insight.id}
                          className="border-b border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                            {insight.id.substring(0, 8)}...
                          </td>
                          <td className="px-4 py-3 font-medium">{insight.schoolId}</td>
                          <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                            {insight.insightType.replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 py-3 text-neutral-500 text-xs">
                            {insight.source || <span className="text-neutral-400">--</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <EmbeddingStatusDot hasEmbedding={insight.embedding !== null} />
                          </td>
                          <td className="px-4 py-3 text-neutral-500 text-xs">
                            {new Date(insight.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DeleteItemButton id={insight.id} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
