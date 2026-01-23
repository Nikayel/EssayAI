/**
 * Human Review Assignment System
 * Simple workflow: Queue -> Assign -> Reviewer emails student -> Mark done
 */

import type { FullIntake, StandardAnalysisResult } from '@/lib/scoring/tiers/types';

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
  const { prisma } = await import('@/lib/prisma');

  const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  // Create the assignment
  const assignment = await prisma.humanReviewAssignment.create({
    data: {
      studentEmail: data.userEmail,
      essayText: data.essay,
      targetSchool: data.intake.essayContext?.targetSchool,
      essayType: data.intake.essayContext?.essayType,
      intakeData: data.intake as any,
      aiAnalysis: data.aiAnalysis as any,
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
    await sendReviewerNotification(availableReviewer.email, assignment.id);

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
}

// =============================================================================
// FIND AVAILABLE REVIEWER
// =============================================================================

async function findAvailableReviewer(targetSchool?: string) {
  const { prisma } = await import('@/lib/prisma');

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
}

// =============================================================================
// NOTIFICATION
// =============================================================================

async function sendReviewerNotification(
  reviewerEmail: string,
  assignmentId: string
): Promise<void> {
  // In production, send email via Resend/SendGrid
  // For now, just log
  console.log(`[REVIEW] Notification sent to ${reviewerEmail} for assignment ${assignmentId}`);

  // TODO: Implement email sending
  // await resend.emails.send({
  //   from: 'reviews@essayai.com',
  //   to: reviewerEmail,
  //   subject: 'New Essay Review Assignment',
  //   html: `You have a new essay to review. Due in 48 hours. <a href="${DASHBOARD_URL}/admin/reviews/${assignmentId}">View Assignment</a>`,
  // });
}

// =============================================================================
// MARK REVIEW AS DONE
// =============================================================================

export async function markReviewComplete(
  assignmentId: string,
  reviewerId: string,
  notes?: string
): Promise<void> {
  const { prisma } = await import('@/lib/prisma');

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
}

// =============================================================================
// GET REVIEWER QUEUE
// =============================================================================

export async function getReviewerQueue(reviewerId: string): Promise<ReviewAssignment[]> {
  const { prisma } = await import('@/lib/prisma');

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
}

// =============================================================================
// GET ASSIGNMENT DETAILS (For reviewer dashboard)
// =============================================================================

export async function getAssignmentDetails(assignmentId: string) {
  const { prisma } = await import('@/lib/prisma');

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
}

// ReviewData exported inline at declaration
