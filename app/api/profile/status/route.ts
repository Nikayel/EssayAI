import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { isOnboarded: true },
    });

    return NextResponse.json({
      isOnboarded: profile?.isOnboarded ?? false,
    });
  } catch (error) {
    console.error('Error fetching profile status:', error);
    return NextResponse.json({ isOnboarded: false });
  }
}
