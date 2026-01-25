/**
 * Human Review Assignment System
 * Simple workflow: Queue -> Assign -> Reviewer emails student -> Mark done
 */

import type { FullIntake, StandardAnalysisResult } from '@/lib/scoring/tiers/types';
import { sendEmail } from '@/lib/email/send';
import type { Prisma } from '@prisma/client';

// =============================================================================
// TYPES
// =============================================================================

export interface ReviewData {
  essay: string;
  intake: FullIntake;
  aiAnalysis: StandardAnalysisResult;
  userEmail: string;
}

export interface ReviewAssignment {
  id: string;
  sessionId: string;
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  reviewer?: {
    id: string;
    name: string;
    credentials: string;
    email: string;
  };
  dueAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
}

export class ReviewAssignmentError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ReviewAssignmentError';
  }
}

// =============================================================================
// QUEUE FOR HUMAN REVIEW
// =============================================================================

/**
 * Queue an analysis session for human review
 * Automatically assigns to available reviewer if possible
 */
export async function queueForHumanReview(
  sessionId: string,
  data: ReviewData
): Promise<ReviewAssignment> {
  const { prisma } = await import('@/lib/db');

  try {
    const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create the assignment
    const assignment = await prisma.humanReviewAssignment.create({
      data: {
        studentEmail: data.userEmail,
        essayText: data.essay,
        targetSchool: data.intake.essayContext?.targetSchool,
        essayType: data.intake.essayContext?.essayType,
        intakeData: data.intake as unknown as Prisma.InputJsonValue,
        aiAnalysis: data.aiAnalysis as unknown as Prisma.InputJsonValue,
        status: 'QUEUED',
        dueAt,
      },
    });

    // Try to auto-assign to available reviewer
    const availableReviewer = await findAvailableReviewer(
      data.intake.essayContext?.targetSchool
    );

    if (availableReviewer) {
      await prisma.humanReviewAssignment.update({
        where: { id: assignment.id },
        data: {
          reviewerId: availableReviewer.id,
          status: 'ASSIGNED',
          assignedAt: new Date(),
        },
      });

      // Send notification email to reviewer
      await sendReviewerNotification(availableReviewer.email, availableReviewer.name, assignment.id);

      return {
        id: assignment.id,
        sessionId,
        status: 'ASSIGNED',
        reviewer: {
          id: availableReviewer.id,
          name: availableReviewer.name,
          credentials: availableReviewer.credentials,
          email: availableReviewer.email,
        },
        dueAt,
        assignedAt: new Date(),
      };
    }

    return {
      id: assignment.id,
      sessionId,
      status: 'QUEUED',
      dueAt,
    };
  } catch (error) {
    console.error('[REVIEW] Failed to queue for human review:', error);
    throw new ReviewAssignmentError(
      'Failed to queue essay for human review',
      'QUEUE_FAILED'
    );
  }
}

// =============================================================================
// FIND AVAILABLE REVIEWER
// =============================================================================

async function findAvailableReviewer(targetSchool?: string) {
  const { prisma } = await import('@/lib/db');

  try {
    // Find active reviewers with capacity
    const reviewers = await prisma.humanReviewer.findMany({
      where: {
        isActive: true,
        // Has capacity (current active < max)
        assignments: {
          none: {
            status: { in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'] },
          },
        },
      },
      include: {
        _count: {
          select: {
            assignments: {
              where: { status: { in: ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'] } },
            },
          },
        },
      },
      orderBy: {
        totalReviews: 'desc', // Prefer experienced reviewers
      },
    });

    // Filter to those under capacity and preferably matching school expertise
    for (const reviewer of reviewers) {
      const activeCount = reviewer._count.assignments;
      if (activeCount < reviewer.maxActiveReviews) {
        // Prefer school match
        if (targetSchool && reviewer.schoolExpertise.includes(targetSchool.toLowerCase())) {
          return reviewer;
        }
      }
    }

    // Return any available reviewer
    for (const reviewer of reviewers) {
      const activeCount = reviewer._count.assignments;
      if (activeCount < reviewer.maxActiveReviews) {
        return reviewer;
      }
    }

    return null;
  } catch (error) {
    console.error('[REVIEW] Failed to find available reviewer:', error);
    return null;
  }
}

// =============================================================================
// NOTIFICATION
// =============================================================================

async function sendReviewerNotification(
  reviewerEmail: string,
  reviewerName: string,
  assignmentId: string
): Promise<void> {
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ivyway.ai';
  const reviewUrl = `${dashboardUrl}/reviewer/assignments/${assignmentId}`;

  try {
    await sendEmail({
      to: reviewerEmail,
      subject: 'New Essay Review Assignment - Due in 48 hours',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .due-badge { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .button { background: #8b5cf6; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Essay Assignment</h1>
    </div>
    <div class="content">
      <p>Hi ${reviewerName},</p>
      <p>You have a new essay review assignment.</p>

      <div class="due-badge">
        <strong>Due:</strong> 48 hours from now<br/>
        <span style="color: #92400e;">Please complete this review promptly to maintain our quality standards.</span>
      </div>

      <p>What to do:</p>
      <ol>
        <li>Review the essay and AI analysis</li>
        <li>Add detailed margin comments</li>
        <li>Write a comprehensive summary</li>
        <li>Mark as complete when done</li>
      </ol>

      <div style="text-align: center;">
        <a href="${reviewUrl}" class="button">
          Start Review →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>IvyWay Reviewer Portal</p>
    </div>
  </div>
</body>
</html>
      `,
    });
    console.log(`[REVIEW] Notification sent to ${reviewerEmail} for assignment ${assignmentId}`);
  } catch (error) {
    // Log but don't fail the assignment if email fails
    console.error(`[REVIEW] Failed to send notification to ${reviewerEmail}:`, error);
  }
}

// =============================================================================
// MARK REVIEW AS DONE
// =============================================================================

export async function markReviewComplete(
  assignmentId: string,
  reviewerId: string,
  notes?: string
): Promise<void> {
  const { prisma } = await import('@/lib/db');

  try {
    // Get the assignment to retrieve student email
    const assignment = await prisma.humanReviewAssignment.findUnique({
      where: { id: assignmentId },
      select: { studentEmail: true },
    });

    await prisma.humanReviewAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        markedDoneAt: new Date(),
        internalNotes: notes,
      },
    });

    // Update reviewer stats
    await prisma.humanReviewer.update({
      where: { id: reviewerId },
      data: {
        totalReviews: { increment: 1 },
      },
    });

    // Send notification to student that review is complete
    if (assignment?.studentEmail) {
      try {
        await sendEmail({
          to: assignment.studentEmail,
          subject: 'Your Expert Review is Ready!',
          html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .button { background: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Expert Review is Complete!</h1>
    </div>
    <div class="content">
      <p>Great news! Your essay has been reviewed by one of our expert reviewers.</p>
      <p>Your review includes:</p>
      <ul>
        <li>Detailed margin comments</li>
        <li>Comprehensive written feedback</li>
        <li>Actionable improvement suggestions</li>
      </ul>
      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
          View Your Review →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>IvyWay - Expert essay feedback</p>
    </div>
  </div>
</body>
</html>
          `,
        });
      } catch (emailError) {
        console.error('[REVIEW] Failed to send completion email to student:', emailError);
      }
    }
  } catch (error) {
    console.error('[REVIEW] Failed to mark review complete:', error);
    throw new ReviewAssignmentError(
      'Failed to mark review as complete',
      'COMPLETE_FAILED'
    );
  }
}

// =============================================================================
// GET REVIEWER QUEUE
// =============================================================================

export async function getReviewerQueue(reviewerId: string): Promise<ReviewAssignment[]> {
  const { prisma } = await import('@/lib/db');

  try {
    const assignments = await prisma.humanReviewAssignment.findMany({
      where: {
        reviewerId,
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
      orderBy: { dueAt: 'asc' },
      include: {
        reviewer: true,
      },
    });

    return assignments.map(a => ({
      id: a.id,
      sessionId: a.id, // Using assignment ID as session reference
      status: a.status as ReviewAssignment['status'],
      reviewer: a.reviewer ? {
        id: a.reviewer.id,
        name: a.reviewer.name,
        credentials: a.reviewer.credentials,
        email: a.reviewer.email,
      } : undefined,
      dueAt: a.dueAt,
      assignedAt: a.assignedAt ?? undefined,
      completedAt: a.completedAt ?? undefined,
    }));
  } catch (error) {
    console.error('[REVIEW] Failed to get reviewer queue:', error);
    throw new ReviewAssignmentError(
      'Failed to retrieve reviewer queue',
      'QUEUE_FETCH_FAILED'
    );
  }
}

// =============================================================================
// GET ASSIGNMENT DETAILS (For reviewer dashboard)
// =============================================================================

export async function getAssignmentDetails(assignmentId: string) {
  const { prisma } = await import('@/lib/db');

  try {
    const assignment = await prisma.humanReviewAssignment.findUnique({
      where: { id: assignmentId },
      include: { reviewer: true },
    });

    if (!assignment) return null;

    return {
      id: assignment.id,
      status: assignment.status,
      studentEmail: assignment.studentEmail,
      essayText: assignment.essayText,
      targetSchool: assignment.targetSchool,
      essayType: assignment.essayType,
      intakeData: assignment.intakeData,
      aiAnalysis: assignment.aiAnalysis,
      dueAt: assignment.dueAt,
      reviewer: assignment.reviewer ? {
        id: assignment.reviewer.id,
        name: assignment.reviewer.name,
        credentials: assignment.reviewer.credentials,
      } : null,
    };
  } catch (error) {
    console.error('[REVIEW] Failed to get assignment details:', error);
    throw new ReviewAssignmentError(
      'Failed to retrieve assignment details',
      'DETAILS_FETCH_FAILED'
    );
  }
}
