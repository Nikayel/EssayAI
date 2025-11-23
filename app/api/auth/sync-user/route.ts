import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/sync-user
 * Sync Supabase auth user with public.users table
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create or update user in public.users
    const dbUser = await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email!,
        updatedAt: new Date(),
      },
      create: {
        id: user.id,
        email: user.email!,
        role: 'STUDENT',
      },
    });

    // Create profile if doesn't exist
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, user: dbUser });
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}
