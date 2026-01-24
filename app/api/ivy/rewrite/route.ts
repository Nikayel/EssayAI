import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { generateIvyRewrites } from '@/lib/ai/ivy-analyzer';
import { validateSchoolId } from '@/lib/ai/ivy-prompts';
import { getIvySchool } from '@/lib/data/ivy-league';
import { z } from 'zod';

// ============================================================================
// REQUEST SCHEMA
// ============================================================================

const IvyRewriteRequestSchema = z.object({
  versionId: z.string(),
  schoolId: z.string().refine(validateSchoolId, 'Invalid Ivy League school'),
  goals: z.array(
    z.enum(['school_fit', 'specificity', 'voice', 'structure', 'clarity'])
  ).min(1, 'At least one goal required'),
});

// ============================================================================
// POST /api/ivy/rewrite - Generate Ivy-specific rewrite suggestions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const validated = IvyRewriteRequestSchema.parse(body);

    // Fetch version and verify ownership
    const version = await prisma.essayVersion.findFirst({
      where: { id: validated.versionId },
      include: { essay: true },
    });

    if (!version || version.essay.userId !== user.id) {
      return NextResponse.json(
        { error: 'Version not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get user profile for tone sample
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    // Get school info
    const school = getIvySchool(validated.schoolId);
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 400 }
      );
    }

    // Generate rewrites
    const rewriteResult = await generateIvyRewrites({
      essayText: version.content,
      schoolId: validated.schoolId,
      goals: validated.goals,
      toneSample: profile?.toneSample || undefined,
    });

    // Store rewrite in database
    await prisma.rewrite.create({
      data: {
        versionId: version.id,
        rewriteJson: {
          ...rewriteResult,
          ivy_specific: true,
          school_id: validated.schoolId,
          goals: validated.goals,
        } as any,
        modelRef: 'claude-3-5-sonnet-20241022-ivy-rewrite',
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        event: 'ivy_rewrite_generated',
        properties: {
          school_id: validated.schoolId,
          school_name: school.name,
          goals: validated.goals,
          rewrite_count: rewriteResult.rewrites.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
      },
      goals: validated.goals,
      result: rewriteResult,
    });

  } catch (error) {
    console.error('Ivy rewrite error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate suggestions. Please try again.' },
      { status: 500 }
    );
  }
}
