import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/analytics/track
 * Track analytics events for conversion monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Store analytics event
    await prisma.analyticsEvent.create({
      data: {
        userId: user?.id,
        event,
        properties: properties || {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    // Never fail - analytics should never break the app
    return NextResponse.json({ success: true });
  }
}

/**
 * GET /api/analytics/track
 * Get analytics events (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const limit = parseInt(searchParams.get('limit') || '100');

    const events = await prisma.analyticsEvent.findMany({
      where: event ? { event } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Analytics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    );
  }
}
