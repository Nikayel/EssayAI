/**
 * Human Review Assignment Management API
 *
 * Handles the full reviewer workflow for premium tier:
 * - GET: Fetch assignment details
 * - PATCH: Update status, assign reviewer, add notes
 * - POST: Complete review (marks done + updates AnalysisSession + sends email)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail, humanReviewCompleteEmail, reviewAssignedEmail } from '@/lib/email/send';

type Params = Promise<{ assignmentId: string }>;

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const AssignmentUpdateSchema = z.object({
  status: z.enum(['QUEUED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional(),
  reviewerId: z.string().optional(),
  internalNotes: z.string().max(10000).optional(),
});

const CompleteReviewSchema = z.object({
  internalNotes: z.string().max(10000).optional(),
  sendNotification: z.boolean().default(true),
});

// =============================================================================
// MIDDLEWARE - Check Admin or Assigned Reviewer
// =============================================================================

async function checkAccess(assignmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, email: true },
  });

  if (!dbUser) {
    return { error: 'User not found', status: 404 };
  }

  // Admin has full access
  if (dbUser.role === 'ADMIN') {
    return { user: dbUser, isAdmin: true };
  }

  // Reviewer can only access their own assignments
  if (dbUser.role === 'REVIEWER') {
    const assignment = await prisma.humanReviewAssignment.findUnique({
      where: { id: assignmentId },
      select: { reviewerId: true },
    });

    if (assignment?.reviewerId === dbUser.id) {
      return { user: dbUser, isAdmin: false };
    }
  }

  return { error: 'Forbidden', status: 403 };
}

// =============================================================================
// GET - Get Assignment Details
// =============================================================================

export async function GET(
  request: NextRequest,
  context: { params: Params }
) {
  const { assignmentId } = await context.params;
  const auth = await checkAccess(assignmentId);

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const assignment = await prisma.humanReviewAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            credentials: true,
          },
        },
        session: {
          select: {
            id: true,
            tier: true,
            status: true,
            aiScore: true,
            targetSchool: true,
            createdAt: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        status: assignment.status,
        studentEmail: assignment.studentEmail,
        essayText: assignment.essayText,
        targetSchool: assignment.targetSchool,
        essayType: assignment.essayType,
        intakeData: assignment.intakeData,
        aiAnalysis: assignment.aiAnalysis,
        internalNotes: assignment.internalNotes,
        dueAt: assignment.dueAt,
        assignedAt: assignment.assignedAt,
        completedAt: assignment.completedAt,
        createdAt: assignment.createdAt,
        isOverdue: assignment.dueAt < new Date() && assignment.status !== 'COMPLETED',
        reviewer: assignment.reviewer,
        session: assignment.session,
      },
    });
  } catch (error) {
    console.error('Failed to fetch assignment:', error);
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 });
  }
}

// =============================================================================
// PATCH - Update Assignment (status, reviewer, notes)
// =============================================================================

export async function PATCH(
  request: NextRequest,
  context: { params: Params }
) {
  const { assignmentId } = await context.params;
  const auth = await checkAccess(assignmentId);

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validated = AssignmentUpdateSchema.parse(body);
    const { status, reviewerId, internalNotes } = validated;

    // Fetch current assignment
    const currentAssignment = await prisma.humanReviewAssignment.findUnique({
      where: { id: assignmentId },
      include: { reviewer: true },
    });

    if (!currentAssignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Non-admin reviewers can only update notes and status to IN_PROGRESS/COMPLETED
    if (!auth.isAdmin) {
      if (reviewerId) {
        return NextResponse.json({ error: 'Only admins can reassign reviewers' }, { status: 403 });
      }
      if (status && !['IN_PROGRESS', 'COMPLETED'].includes(status)) {
        return NextResponse.json({ error: 'Reviewers can only mark IN_PROGRESS or COMPLETED' }, { status: 403 });
      }
    }

    // Build update data
    const updateData: any = {};

    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    if (status) {
      updateData.status = status;

      // Auto-set timestamps based on status
      if (status === 'ASSIGNED' && !currentAssignment.assignedAt) {
        updateData.assignedAt = new Date();
      }
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        updateData.markedDoneAt = new Date();
      }
    }

    // Handle reviewer assignment (admin only)
    if (reviewerId && auth.isAdmin) {
      // Verify reviewer exists and is active
      const reviewer = await prisma.humanReviewer.findUnique({
        where: { id: reviewerId },
        select: { id: true, name: true, email: true, isActive: true },
      });

      if (!reviewer || !reviewer.isActive) {
        return NextResponse.json({ error: 'Invalid or inactive reviewer' }, { status: 400 });
      }

      updateData.reviewerId = reviewerId;
      updateData.status = 'ASSIGNED';
      updateData.assignedAt = new Date();

      // Send notification to newly assigned reviewer
      try {
        await sendEmail({
          to: reviewer.email,
          subject: 'New Essay Review Assignment',
          html: `
            <h2>New Review Assignment</h2>
            <p>Hi ${reviewer.name},</p>
            <p>You have been assigned a new essay to review.</p>
            <ul>
              <li><strong>School:</strong> ${currentAssignment.targetSchool || 'Not specified'}</li>
              <li><strong>Essay Type:</strong> ${currentAssignment.essayType || 'Not specified'}</li>
              <li><strong>Due:</strong> ${currentAssignment.dueAt.toLocaleString()}</li>
            </ul>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/reviewer/assignments/${assignmentId}">View Assignment</a></p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send reviewer notification:', emailError);
        // Don't fail the request if email fails
      }

      // Also notify the student that their review is assigned
      try {
        const dueDate = currentAssignment.dueAt.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        });
        await sendEmail({
          to: currentAssignment.studentEmail,
          subject: 'Your Expert Reviewer Has Been Assigned!',
          html: reviewAssignedEmail(currentAssignment.studentEmail.split('@')[0], dueDate),
        });
      } catch (emailError) {
        console.error('Failed to send student notification:', emailError);
      }
    }

    // Update assignment
    const updatedAssignment = await prisma.humanReviewAssignment.update({
      where: { id: assignmentId },
      data: updateData,
      include: { reviewer: true },
    });

    // If status changed to COMPLETED, update the linked AnalysisSession
    if (status === 'COMPLETED') {
      await updateAnalysisSessionOnComplete(assignmentId, updatedAssignment.reviewer?.id);
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: updatedAssignment.id,
        status: updatedAssignment.status,
        reviewerId: updatedAssignment.reviewerId,
        assignedAt: updatedAssignment.assignedAt,
        completedAt: updatedAssignment.completedAt,
        reviewer: updatedAssignment.reviewer,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Failed to update assignment:', error);
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

// =============================================================================
// POST - Complete Review (shortcut for marking complete with all side effects)
// =============================================================================

export async function POST(
  request: NextRequest,
  context: { params: Params }
) {
  const { assignmentId } = await context.params;
  const auth = await checkAccess(assignmentId);

  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validated = CompleteReviewSchema.parse(body);
    const { internalNotes, sendNotification } = validated;

    // Fetch assignment with reviewer
    const assignment = await prisma.humanReviewAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        reviewer: true,
        session: true,
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Assignment already completed' }, { status: 400 });
    }

    // Update assignment to COMPLETED
    const updatedAssignment = await prisma.humanReviewAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        markedDoneAt: new Date(),
        internalNotes: internalNotes || assignment.internalNotes,
      },
    });

    // Update reviewer stats
    if (assignment.reviewerId) {
      await prisma.humanReviewer.update({
        where: { id: assignment.reviewerId },
        data: {
          totalReviews: { increment: 1 },
        },
      });
    }

    // Update linked AnalysisSession to COMPLETED
    await updateAnalysisSessionOnComplete(assignmentId, assignment.reviewerId || undefined);

    // Send completion email to student
    if (sendNotification && assignment.studentEmail) {
      try {
        const reviewerName = assignment.reviewer?.name || 'Your Expert Reviewer';
        const sessionId = assignment.session?.id;

        if (sessionId) {
          await sendEmail({
            to: assignment.studentEmail,
            subject: '🎉 Your Expert Review is Complete!',
            html: humanReviewCompleteEmail(
              assignment.studentEmail.split('@')[0],
              sessionId,
              reviewerName
            ),
          });
        }
      } catch (emailError) {
        console.error('Failed to send completion email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Review completed successfully',
      assignment: {
        id: updatedAssignment.id,
        status: updatedAssignment.status,
        completedAt: updatedAssignment.completedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 });
    }
    console.error('Failed to complete review:', error);
    return NextResponse.json({ error: 'Failed to complete review' }, { status: 500 });
  }
}

// =============================================================================
// HELPER - Update AnalysisSession when human review completes
// =============================================================================

async function updateAnalysisSessionOnComplete(
  assignmentId: string,
  reviewerId?: string
) {
  try {
    // Find the AnalysisSession linked to this assignment
    const session = await prisma.analysisSession.findFirst({
      where: { humanReviewId: assignmentId },
    });

    if (session) {
      await prisma.analysisSession.update({
        where: { id: session.id },
        data: {
          status: 'COMPLETED',
        },
      });
      console.log(`[REVIEW] Updated AnalysisSession ${session.id} to COMPLETED`);
    } else {
      console.warn(`[REVIEW] No AnalysisSession found for assignment ${assignmentId}`);
    }
  } catch (error) {
    console.error('[REVIEW] Failed to update AnalysisSession:', error);
    // Don't throw - this shouldn't fail the main operation
  }
}
