import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      graduationYear,
      spike,
      topActivities,
      biggestWorry,
      previousReviews,
      howHeardAboutUs,
      targetSchools,
    } = body;

    // Upsert profile with onboarding data
    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        graduationYear,
        applicationCycle: graduationYear ? `${graduationYear - 1}-${graduationYear}` : null,
        spike,
        topActivities: topActivities.filter((a: string) => a.trim()),
        biggestWorry,
        previousReviews,
        howHeardAboutUs,
        isOnboarded: true,
      },
      update: {
        graduationYear,
        applicationCycle: graduationYear ? `${graduationYear - 1}-${graduationYear}` : null,
        spike,
        topActivities: topActivities.filter((a: string) => a.trim()),
        biggestWorry,
        previousReviews,
        howHeardAboutUs,
        isOnboarded: true,
      },
    });

    // Create target schools
    if (targetSchools && targetSchools.length > 0) {
      const validSchools = targetSchools.filter(
        (s: any) => s.schoolName && s.deadline
      );

      for (const school of validSchools) {
        await prisma.targetSchool.upsert({
          where: {
            profileId_schoolName: {
              profileId: profile.id,
              schoolName: school.schoolName,
            },
          },
          create: {
            profileId: profile.id,
            schoolName: school.schoolName,
            deadlineType: school.deadlineType,
            deadline: new Date(school.deadline),
          },
          update: {
            deadlineType: school.deadlineType,
            deadline: new Date(school.deadline),
          },
        });
      }
    }

    // Track analytics event
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        event: 'onboarding_completed',
        properties: {
          graduationYear,
          schoolCount: targetSchools?.filter((s: any) => s.schoolName).length || 0,
          biggestWorry,
          howHeardAboutUs,
          hasSpike: spike && spike.length > 20,
          activityCount: topActivities.filter((a: string) => a.trim()).length,
        },
      },
    });

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Failed to save onboarding data' },
      { status: 500 }
    );
  }
}
