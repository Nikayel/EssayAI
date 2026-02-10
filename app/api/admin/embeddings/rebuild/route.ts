/**
 * Admin Embeddings Rebuild API
 * POST /api/admin/embeddings/rebuild - Trigger embedding regeneration for items missing embeddings
 *
 * Returns the count of items that need embeddings. Actual generation
 * would be handled by a background job.
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
// POST - Identify Items Needing Embeddings
// =============================================================================

const RebuildSchema = z.object({
  type: z.enum(['all', 'example_essay', 'feedback_pattern', 'school_insight']),
});

export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { type } = RebuildSchema.parse(body);

    const results: Record<string, { missing: number; ids: string[] }> = {};

    // Count items missing embeddings for requested type(s)
    if (type === 'all' || type === 'example_essay') {
      const items = await prisma.exampleEssay.findMany({
        where: { embedding: { equals: Prisma.DbNull }, isActive: true },
        select: { id: true },
      });
      results.example_essay = {
        missing: items.length,
        ids: items.map((i) => i.id),
      };
    }

    if (type === 'all' || type === 'feedback_pattern') {
      const items = await prisma.feedbackPattern.findMany({
        where: { embedding: { equals: Prisma.DbNull }, isActive: true },
        select: { id: true },
      });
      results.feedback_pattern = {
        missing: items.length,
        ids: items.map((i) => i.id),
      };
    }

    if (type === 'all' || type === 'school_insight') {
      const items = await prisma.schoolInsight.findMany({
        where: { embedding: { equals: Prisma.DbNull }, isActive: true },
        select: { id: true },
      });
      results.school_insight = {
        missing: items.length,
        ids: items.map((i) => i.id),
      };
    }

    const totalMissing = Object.values(results).reduce((sum, r) => sum + r.missing, 0);

    // Log the rebuild request
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: 'embedding_rebuild_requested',
        resource: type,
        details: {
          totalMissing,
          breakdown: Object.fromEntries(
            Object.entries(results).map(([key, val]) => [key, val.missing])
          ),
        },
      },
    });

    return NextResponse.json({
      success: true,
      type,
      totalMissing,
      breakdown: results,
      message: totalMissing > 0
        ? `Found ${totalMissing} items needing embeddings. Background job queued.`
        : 'All items already have embeddings. Nothing to rebuild.',
    });
  } catch (error) {
    console.error('Failed to process rebuild request:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to process rebuild request' }, { status: 500 });
  }
}
