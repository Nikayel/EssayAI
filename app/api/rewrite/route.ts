import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { generateRewrites, compareTone } from '@/lib/ai/analyzer';
import { z } from 'zod';

const RewriteRequestSchema = z.object({
  versionId: z.string(),
  goals: z.array(z.string()),
  toneSample: z.string().optional(),
});

/**
 * POST /api/rewrite
 * Generate rewrite suggestions for an essay version
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validated = RewriteRequestSchema.parse(body);

    // Fetch version and verify ownership
    const version = await prisma.essayVersion.findFirst({
      where: {
        id: validated.versionId,
      },
      include: {
        essay: true,
      },
    });

    if (!version || version.essay.userId !== user.id) {
      return NextResponse.json(
        { error: 'Version not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check package/credits
    // TODO: Implement package check - rewrites should be Pro+ only

    // Get user's tone sample if not provided
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    const toneSample = validated.toneSample || profile?.toneSample || undefined;

    // Generate rewrites
    const rewriteResult = await generateRewrites({
      essayText: version.content,
      goals: validated.goals,
      toneSample,
    });

    // Optionally run tone comparison if tone sample exists
    let toneComparison = null;
    if (toneSample) {
      toneComparison = await compareTone({
        essayText: version.content,
        toneSample,
      });
    }

    // Store rewrite in database
    const rewrite = await prisma.rewrite.create({
      data: {
        versionId: version.id,
        rewriteJson: rewriteResult as any,
        modelRef: 'claude-3-5-sonnet-20241022',
      },
    });

    return NextResponse.json({
      success: true,
      rewriteId: rewrite.id,
      result: rewriteResult,
      toneComparison,
    });
  } catch (error) {
    console.error('Rewrite error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Rewrite failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
