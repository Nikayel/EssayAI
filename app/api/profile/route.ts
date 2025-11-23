import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * PUT /api/profile
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, gradeLevel, intendedMajor } = body;

    // Update profile
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        name,
        gradeLevel,
        intendedMajor,
      },
      create: {
        userId: user.id,
        name,
        gradeLevel,
        intendedMajor,
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
