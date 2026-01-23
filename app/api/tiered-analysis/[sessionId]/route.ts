/**
 * Analysis Session API
 * GET /api/tiered-analysis/[sessionId] - Get session status and results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// =============================================================================
// GET - Get Session Status and Results
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Get session
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        humanReview: {
          include: {
            reviewer: {
              select: {
                name: true,
                credentials: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check authorization - either authenticated user or email match
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const isAuthorized =
      (user && session.userId === user.id) ||
      (user && user.email === session.userEmail) ||
      !session.userId; // Allow access for guest sessions

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build response based on session status
    const response: any = {
      sessionId: session.id,
      tier: session.tier,
      status: session.status,
      targetSchool: session.targetSchool,
      essayType: session.essayType,
      createdAt: session.createdAt,
    };

    // Add results if available
    if (session.aiResult) {
      response.result = session.aiResult;
      response.score = session.aiScore;
      response.completedAt = session.aiCompletedAt;
    }

    // Add human review status for premium tier
    if (session.tier === 'premium' && session.humanReview) {
      response.humanReview = {
        status: session.humanReview.status,
        assignedTo: session.humanReview.reviewer?.name,
        credentials: session.humanReview.reviewer?.credentials,
        dueAt: session.humanReview.dueAt,
        completedAt: session.humanReview.completedAt,
      };
    }

    // Add status-specific messaging
    switch (session.status) {
      case 'PENDING':
        response.message = 'Awaiting payment confirmation...';
        break;
      case 'ANALYZING':
        response.message = 'AI analysis in progress...';
        response.progressUrl = `/api/tiered-analysis/${sessionId}/progress`;
        break;
      case 'AI_COMPLETE':
        response.message = 'AI analysis complete.';
        break;
      case 'HUMAN_QUEUED':
        response.message = 'In queue for human expert review. You\'ll receive an email within 48 hours.';
        break;
      case 'HUMAN_IN_PROGRESS':
        response.message = 'Human expert is reviewing your essay...';
        break;
      case 'COMPLETED':
        response.message = 'Analysis complete!';
        break;
      case 'FAILED':
        response.message = 'Analysis failed. Please contact support.';
        break;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Session fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
