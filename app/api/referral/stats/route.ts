import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get or create profile with referral code
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    let code = profile?.referralCode;

    // Generate and save referral code if user doesn't have one
    if (!code) {
      code = nanoid(8).toUpperCase();

      // Upsert profile with referral code
      profile = await prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          referralCode: code,
        },
        update: {
          referralCode: code,
        },
      });
    }

    // Get referral stats
    const referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
    });

    // Calculate stats
    const totalReferred = referrals.length;
    const signedUp = referrals.filter(r => r.status !== 'PENDING').length;
    const converted = referrals.filter(r => r.status === 'CONVERTED').length;
    const totalEarnings = referrals
      .filter(r => r.rewardClaimed)
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);
    const pendingEarnings = referrals
      .filter(r => r.status === 'CONVERTED' && !r.rewardClaimed)
      .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    return NextResponse.json({
      code,
      totalReferred,
      signedUp,
      converted,
      totalEarnings,
      pendingEarnings,
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    );
  }
}
