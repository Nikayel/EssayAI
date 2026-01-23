import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CreateEssaySchema = z.object({
  type: z.enum(['PERSONAL_STATEMENT', 'WHY_US', 'SUPPLEMENTAL', 'ACTIVITY', 'OTHER']),
  promptText: z.string().min(10),
  targetSchool: z.string().optional(),
  targetSchoolId: z.string().optional(), // Links to portfolio TargetSchool
  wordLimit: z.number().optional(),
  content: z.string().min(50),
});

/**
 * POST /api/essays
 * Create a new essay with initial version
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = CreateEssaySchema.parse(body);

    // Create essay and initial version in a transaction
    const essay = await prisma.essay.create({
      data: {
        userId: user.id,
        type: validated.type,
        promptText: validated.promptText,
        targetSchool: validated.targetSchool,
        targetSchoolId: validated.targetSchoolId, // Link to portfolio
        wordLimit: validated.wordLimit,
        versions: {
          create: {
            content: validated.content,
            versionIndex: 1,
          },
        },
      },
      include: {
        versions: {
          orderBy: {
            versionIndex: 'desc',
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      essay: {
        id: essay.id,
        type: essay.type,
        versionId: essay.versions[0].id,
      },
    });
  } catch (error) {
    console.error('Essay creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create essay' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/essays
 * List user's essays
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const essays = await prisma.essay.findMany({
      where: {
        userId: user.id,
      },
      include: {
        versions: {
          orderBy: {
            versionIndex: 'desc',
          },
          take: 1,
          include: {
            analyses: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ essays });
  } catch (error) {
    console.error('Essay fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch essays' },
      { status: 500 }
    );
  }
}
