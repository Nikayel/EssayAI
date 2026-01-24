import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Input validation schema
const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gradeLevel: z.string().max(50).optional(),
  intendedMajor: z.string().max(100).optional(),
});

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

    // Validate input
    const validated = ProfileUpdateSchema.parse(body);
    const { name, gradeLevel, intendedMajor } = validated;

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
