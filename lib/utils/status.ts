import { Clock, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';

// Application status configuration
export const APPLICATION_STATUS_CONFIG = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-700', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: Clock },
  ESSAYS_DRAFTING: { label: 'Essays Drafting', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
  ESSAYS_COMPLETE: { label: 'Essays Complete', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  SUBMITTED: { label: 'Submitted', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  ACCEPTED: { label: 'Accepted', color: 'bg-green-500 text-white', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  WAITLISTED: { label: 'Waitlisted', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  DEFERRED: { label: 'Deferred', color: 'bg-orange-100 text-orange-700', icon: Clock },
} as const;

// Essay status configuration
export const ESSAY_STATUS_CONFIG = {
  PAYMENT_PENDING: { label: 'Payment Required', color: 'text-yellow-600', icon: Clock },
  AI_ANALYZING: { label: 'AI Analyzing...', color: 'text-blue-600', icon: Loader2, animate: true },
  AWAITING_ASSIGNMENT: { label: 'Awaiting Reviewer', color: 'text-purple-600', icon: Clock },
  IN_HUMAN_REVIEW: { label: 'Under Review', color: 'text-purple-600', icon: Loader2, animate: true },
  REVIEW_COMPLETE: { label: 'Review Complete', color: 'text-green-600', icon: CheckCircle },
  AI_COMPLETE: { label: 'Analysis Complete', color: 'text-green-600', icon: CheckCircle },
} as const;

export function getApplicationStatus(status: keyof typeof APPLICATION_STATUS_CONFIG) {
  return APPLICATION_STATUS_CONFIG[status] || APPLICATION_STATUS_CONFIG.NOT_STARTED;
}

export function getEssayStatus(status: keyof typeof ESSAY_STATUS_CONFIG) {
  return ESSAY_STATUS_CONFIG[status] || ESSAY_STATUS_CONFIG.PAYMENT_PENDING;
}
