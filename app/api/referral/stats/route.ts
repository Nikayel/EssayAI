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
    // Get or create referral code for this user
    let referrals = await prisma.referral.findMany({
      where: { referrerId: user.id },
    });

    // Generate a unique referral code if user doesn't have one
    // We check for existing referrals with a unique code belonging to this user
    let code = referrals[0]?.code;

    if (!code) {
      // Generate new unique code
      code = nanoid(8).toUpperCase();

      // Create a placeholder referral to store the code
      // This will be updated when someone uses the link
    }

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
