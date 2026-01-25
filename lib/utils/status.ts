import { Clock, CheckCircle, AlertTriangle, FileText, Loader2, XCircle, UserCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// =============================================================================
// SHARED TYPES
// =============================================================================

export interface StatusConfig {
  label: string;
  color: string;
  icon: LucideIcon;
  animate?: boolean;
  badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

// =============================================================================
// APPLICATION STATUS (Portfolio tracking)
// =============================================================================

export const APPLICATION_STATUS_CONFIG: Record<string, StatusConfig> = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: Clock, badgeVariant: 'secondary' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock, badgeVariant: 'info' },
  ESSAYS_DRAFTING: { label: 'Essays Drafting', color: 'bg-yellow-100 text-yellow-700', icon: FileText, badgeVariant: 'warning' },
  ESSAYS_COMPLETE: { label: 'Essays Complete', color: 'bg-green-100 text-green-700', icon: CheckCircle, badgeVariant: 'success' },
  SUBMITTED: { label: 'Submitted', color: 'bg-purple-100 text-purple-700', icon: CheckCircle, badgeVariant: 'default' },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-500 text-white', icon: CheckCircle, badgeVariant: 'success' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: AlertTriangle, badgeVariant: 'destructive' },
  WAITLISTED: { label: 'Waitlisted', color: 'bg-yellow-100 text-yellow-700', icon: Clock, badgeVariant: 'warning' },
  DEFERRED: { label: 'Deferred', color: 'bg-orange-100 text-orange-700', icon: Clock, badgeVariant: 'warning' },
};

// =============================================================================
// LEGACY ESSAY STATUS (Essay + Order flow)
// =============================================================================

export const ESSAY_STATUS_CONFIG: Record<string, StatusConfig> = {
  PAYMENT_PENDING: { label: 'Payment Required', color: 'text-yellow-600', icon: Clock, badgeVariant: 'warning' },
  AI_ANALYZING: { label: 'AI Analyzing...', color: 'text-blue-600', icon: Loader2, animate: true, badgeVariant: 'info' },
  AWAITING_ASSIGNMENT: { label: 'Awaiting Reviewer', color: 'text-purple-600', icon: Clock, badgeVariant: 'default' },
  IN_HUMAN_REVIEW: { label: 'Under Review', color: 'text-purple-600', icon: Loader2, animate: true, badgeVariant: 'default' },
  REVIEW_COMPLETE: { label: 'Review Complete', color: 'text-green-600', icon: CheckCircle, badgeVariant: 'success' },
  AI_COMPLETE: { label: 'Analysis Complete', color: 'text-green-600', icon: CheckCircle, badgeVariant: 'success' },
};

// =============================================================================
// ANALYSIS SESSION STATUS (New Tiered Analysis flow)
// =============================================================================

export const ANALYSIS_SESSION_STATUS_CONFIG: Record<string, StatusConfig> = {
  PENDING: { label: 'Payment Pending', color: 'text-yellow-600', icon: Clock, badgeVariant: 'warning' },
  ANALYZING: { label: 'Analyzing...', color: 'text-blue-600', icon: Loader2, animate: true, badgeVariant: 'info' },
  AI_COMPLETE: { label: 'AI Complete', color: 'text-green-600', icon: CheckCircle, badgeVariant: 'success' },
  HUMAN_QUEUED: { label: 'Expert Queued', color: 'text-purple-600', icon: Users, badgeVariant: 'default' },
  HUMAN_IN_PROGRESS: { label: 'Expert Review', color: 'text-purple-600', icon: Loader2, animate: true, badgeVariant: 'default' },
  COMPLETED: { label: 'Complete', color: 'text-green-600', icon: CheckCircle, badgeVariant: 'success' },
  FAILED: { label: 'Failed', color: 'text-red-600', icon: XCircle, badgeVariant: 'destructive' },
};

// =============================================================================
// HUMAN REVIEW ASSIGNMENT STATUS (Reviewer workflow)
// =============================================================================

export const REVIEW_ASSIGNMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
  QUEUED: { label: 'Queued', color: 'text-yellow-600', icon: Clock, badgeVariant: 'warning' },
  ASSIGNED: { label: 'Assigned', color: 'text-blue-600', icon: UserCheck, badgeVariant: 'info' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-purple-600', icon: Loader2, animate: true, badgeVariant: 'default' },
  COMPLETED: { label: 'Completed', color: 'text-green-600', icon: CheckCircle, badgeVariant: 'success' },
  OVERDUE: { label: 'Overdue', color: 'text-red-600', icon: AlertTriangle, badgeVariant: 'destructive' },
};

// =============================================================================
// LEGACY REVIEW STATUS (Review model)
// =============================================================================

export const REVIEW_STATUS_CONFIG: Record<string, StatusConfig> = {
  ASSIGNED: { label: 'Assigned', color: 'text-blue-600', icon: UserCheck, badgeVariant: 'info' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-purple-600', icon: Loader2, animate: true, badgeVariant: 'default' },
  DELIVERED: { label: 'Delivered', color: 'text-green-600', icon: CheckCircle, badgeVariant: 'success' },
  REVISION_REQUESTED: { label: 'Revision Requested', color: 'text-orange-600', icon: AlertTriangle, badgeVariant: 'warning' },
};

// =============================================================================
// TIER DISPLAY NAMES
// =============================================================================

export const TIER_DISPLAY_NAMES: Record<string, string> = {
  quick: 'Quick Score',
  standard: 'Full Analysis',
  premium: 'Premium + Expert',
  ivy_single: 'Ivy Single',
  ivy_bundle_3: 'Ivy 3-Pack',
  ivy_bundle_8: 'Ivy Complete',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getApplicationStatus(status: string): StatusConfig {
  return APPLICATION_STATUS_CONFIG[status] || APPLICATION_STATUS_CONFIG.NOT_STARTED;
}

export function getEssayStatusConfig(status: string): StatusConfig {
  return ESSAY_STATUS_CONFIG[status] || ESSAY_STATUS_CONFIG.PAYMENT_PENDING;
}

export function getAnalysisSessionStatus(status: string): StatusConfig {
  return ANALYSIS_SESSION_STATUS_CONFIG[status] || ANALYSIS_SESSION_STATUS_CONFIG.PENDING;
}

export function getReviewAssignmentStatus(status: string): StatusConfig {
  return REVIEW_ASSIGNMENT_STATUS_CONFIG[status] || REVIEW_ASSIGNMENT_STATUS_CONFIG.QUEUED;
}

export function getReviewStatus(status: string): StatusConfig {
  return REVIEW_STATUS_CONFIG[status] || REVIEW_STATUS_CONFIG.ASSIGNED;
}

export function getTierDisplayName(tier: string): string {
  return TIER_DISPLAY_NAMES[tier] || tier;
}

/**
 * Check if a tier requires human review
 */
export function tierRequiresHumanReview(tier: string): boolean {
  return tier === 'premium';
}

/**
 * Check if a tier is an Ivy tier
 */
export function isIvyTier(tier: string): boolean {
  return tier.startsWith('ivy_');
}

/**
 * Get the results page URL for a session
 */
export function getResultsUrl(sessionId: string, tier: string): string {
  return isIvyTier(tier) ? `/ivy/results/${sessionId}` : `/analysis/${sessionId}`;
}
