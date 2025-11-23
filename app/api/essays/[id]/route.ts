import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

type Params = Promise<{ id: string }>;

/**
 * GET /api/essays/[id]
 * Get essay details with all versions
 */
export async function GET(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const essay = await prisma.essay.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        versions: {
          orderBy: {
            versionIndex: 'desc',
          },
          include: {
            analyses: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              include: {
                commonsFlags: true,
              },
            },
            rewrites: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    return NextResponse.json({ essay });
  } catch (error) {
    console.error('Essay fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch essay' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/essays/[id]
 * Delete an essay
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Params }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const essay = await prisma.essay.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!essay) {
      return NextResponse.json({ error: 'Essay not found' }, { status: 404 });
    }

    await prisma.essay.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Essay deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete essay' },
      { status: 500 }
    );
  }
}
