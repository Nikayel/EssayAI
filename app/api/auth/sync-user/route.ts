import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { sendEmail, welcomeEmail } from '@/lib/email/send';

/**
 * POST /api/auth/sync-user
 * Sync Supabase auth user with public.users table
 * Sends welcome email on first user creation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already exists (for welcome email logic)
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    const isNewUser = !existingUser;

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
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
      },
    });

    // Send welcome email for new users (non-blocking)
    if (isNewUser && user.email) {
      const userName = user.email.split('@')[0] || 'there';
      sendEmail({
        to: user.email,
        subject: 'Welcome to IvyWay - Let\'s make your essay unforgettable',
        html: welcomeEmail(userName, profile.referralCode || undefined),
      }).catch((err) => {
        // Log but don't fail the request
        console.error('Failed to send welcome email:', err);
      });
    }

    return NextResponse.json({ success: true, user: dbUser, isNewUser });
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    );
  }
}
