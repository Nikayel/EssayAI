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
    const { schoolName, deadlineType, deadline, notes } = body;

    if (!schoolName || !deadlineType || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create profile
    let profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: user.id },
      });
    }

    // Create target school
    const school = await prisma.targetSchool.create({
      data: {
        profileId: profile.id,
        schoolName,
        deadlineType,
        deadline: new Date(deadline),
        notes,
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        event: 'school_added',
        properties: {
          schoolName,
          deadlineType,
          daysUntilDeadline: Math.ceil(
            (new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        },
      },
    });

    return NextResponse.json({ school });
  } catch (error: any) {
    // Handle unique constraint violation (school already exists)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already added this school' },
        { status: 400 }
      );
    }

    console.error('Error adding school:', error);
    return NextResponse.json(
      { error: 'Failed to add school' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      include: {
        targetSchools: {
          orderBy: { deadline: 'asc' },
        },
      },
    });

    return NextResponse.json({ schools: profile?.targetSchools || [] });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}
