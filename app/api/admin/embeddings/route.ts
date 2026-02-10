/**
 * Admin Embeddings API
 * GET /api/admin/embeddings - Get counts and recent items for all embedding tables
 * POST /api/admin/embeddings - Create new entries in any of the 3 tables
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// =============================================================================
// MIDDLEWARE - Check Admin
// =============================================================================

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== 'ADMIN') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { user };
}

// =============================================================================
// GET - Counts and Recent Items
// =============================================================================

export async function GET() {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Fetch counts and recent items for all 3 tables in parallel
    const [
      exampleEssayTotal,
      exampleEssayWithEmbedding,
      exampleEssayWithoutEmbedding,
      recentExampleEssays,
      feedbackPatternTotal,
      feedbackPatternWithEmbedding,
      feedbackPatternWithoutEmbedding,
      recentFeedbackPatterns,
      schoolInsightTotal,
      schoolInsightWithEmbedding,
      schoolInsightWithoutEmbedding,
      recentSchoolInsights,
    ] = await Promise.all([
      // ExampleEssay counts
      prisma.exampleEssay.count(),
      prisma.exampleEssay.count({ where: { embedding: { not: Prisma.DbNull } } }),
      prisma.exampleEssay.count({ where: { embedding: { equals: Prisma.DbNull } } }),
      // ExampleEssay recent 20
      prisma.exampleEssay.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          schoolId: true,
          essayType: true,
          outcome: true,
          themeTags: true,
          embedding: true,
          isActive: true,
          createdAt: true,
        },
      }),

      // FeedbackPattern counts
      prisma.feedbackPattern.count(),
      prisma.feedbackPattern.count({ where: { embedding: { not: Prisma.DbNull } } }),
      prisma.feedbackPattern.count({ where: { embedding: { equals: Prisma.DbNull } } }),
      // FeedbackPattern recent 20
      prisma.feedbackPattern.findMany({
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
      }),

      // SchoolInsight counts
      prisma.schoolInsight.count(),
      prisma.schoolInsight.count({ where: { embedding: { not: Prisma.DbNull } } }),
      prisma.schoolInsight.count({ where: { embedding: { equals: Prisma.DbNull } } }),
      // SchoolInsight recent 20
      prisma.schoolInsight.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          schoolId: true,
          insightType: true,
          source: true,
          relevanceScore: true,
          embedding: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      exampleEssays: {
        total: exampleEssayTotal,
        withEmbedding: exampleEssayWithEmbedding,
        withoutEmbedding: exampleEssayWithoutEmbedding,
        recent: recentExampleEssays.map((e) => ({
          id: e.id,
          schoolId: e.schoolId,
          essayType: e.essayType,
          outcome: e.outcome,
          themeTags: e.themeTags,
          hasEmbedding: e.embedding !== null,
          isActive: e.isActive,
          createdAt: e.createdAt,
        })),
      },
      feedbackPatterns: {
        total: feedbackPatternTotal,
        withEmbedding: feedbackPatternWithEmbedding,
        withoutEmbedding: feedbackPatternWithoutEmbedding,
        recent: recentFeedbackPatterns.map((p) => ({
          id: p.id,
          patternName: p.patternName,
          issueType: p.issueType,
          issueCategory: p.issueCategory,
          severity: p.severity,
          hasEmbedding: p.embedding !== null,
          isActive: p.isActive,
          createdAt: p.createdAt,
        })),
      },
      schoolInsights: {
        total: schoolInsightTotal,
        withEmbedding: schoolInsightWithEmbedding,
        withoutEmbedding: schoolInsightWithoutEmbedding,
        recent: recentSchoolInsights.map((s) => ({
          id: s.id,
          schoolId: s.schoolId,
          insightType: s.insightType,
          source: s.source,
          relevanceScore: s.relevanceScore,
          hasEmbedding: s.embedding !== null,
          isActive: s.isActive,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Failed to fetch embedding data:', error);
    return NextResponse.json({ error: 'Failed to fetch embedding data' }, { status: 500 });
  }
}

// =============================================================================
// POST - Create New Entry
// =============================================================================

const ExampleEssaySchema = z.object({
  schoolId: z.string().min(1),
  essayType: z.string().min(1),
  promptId: z.string().optional(),
  contentSnippet: z.string().min(10),
  contentHash: z.string().min(1),
  outcome: z.string().optional(),
  scoreRange: z.string().optional(),
  themeTags: z.array(z.string()).default([]),
  spikeCategory: z.string().optional(),
  strengthNotes: z.string().optional(),
  keyTechniques: z.array(z.string()).default([]),
});

const FeedbackPatternSchema = z.object({
  issueType: z.string().min(1),
  issueCategory: z.string().min(1),
  essayType: z.string().optional(),
  schoolId: z.string().optional(),
  patternName: z.string().min(1),
  description: z.string().min(1),
  exampleBefore: z.string().optional(),
  exampleAfter: z.string().optional(),
  fixStrategy: z.string().optional(),
  severity: z.number().min(1).max(5).default(3),
});

const SchoolInsightSchema = z.object({
  schoolId: z.string().min(1),
  insightType: z.string().min(1),
  content: z.string().min(1),
  source: z.string().optional(),
  essayTypes: z.array(z.string()).default([]),
  relevanceScore: z.number().min(1).max(5).default(3),
});

const CreateSchema = z.object({
  type: z.enum(['example_essay', 'feedback_pattern', 'school_insight']),
  data: z.record(z.string(), z.any()),
});

export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { type, data } = CreateSchema.parse(body);

    let created;

    switch (type) {
      case 'example_essay': {
        const validated = ExampleEssaySchema.parse(data);
        created = await prisma.exampleEssay.create({ data: validated });
        break;
      }
      case 'feedback_pattern': {
        const validated = FeedbackPatternSchema.parse(data);
        created = await prisma.feedbackPattern.create({ data: validated });
        break;
      }
      case 'school_insight': {
        const validated = SchoolInsightSchema.parse(data);
        created = await prisma.schoolInsight.create({ data: validated });
        break;
      }
    }

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: 'embedding_entry_created',
        resource: type,
        details: { id: created.id },
      },
    });

    return NextResponse.json({
      success: true,
      item: created,
      message: `${type} entry created successfully.`,
    });
  } catch (error) {
    console.error('Failed to create embedding entry:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create embedding entry' }, { status: 500 });
  }
}
