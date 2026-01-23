import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// Called when a referred user signs up
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'No referral code provided' }, { status: 400 });
    }

    // Find the referral record or create one
    const existingReferral = await prisma.referral.findFirst({
      where: { referredEmail: user.email || '' },
    });

    if (existingReferral) {
      // Update existing referral
      await prisma.referral.update({
        where: { id: existingReferral.id },
        data: {
          referredUserId: user.id,
          status: 'SIGNED_UP',
          convertedAt: new Date(),
        },
      });
    } else {
      // Find the referrer by their profile's referral code
      const referrerProfile = await prisma.profile.findFirst({
        where: { referralCode: code },
      });

      if (referrerProfile) {
        // Create new referral record
        await prisma.referral.create({
          data: {
            referrerId: referrerProfile.userId,
            referredEmail: user.email || '',
            referredUserId: user.id,
            code,
            status: 'SIGNED_UP',
            rewardAmount: 2000, // $20 credit in cents
            convertedAt: new Date(),
          },
        });
      }
    }

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        event: 'referral_signup',
        properties: { code },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking referral:', error);
    return NextResponse.json(
      { error: 'Failed to track referral' },
      { status: 500 }
    );
  }
}
