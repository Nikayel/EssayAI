'use client';

/**
 * Human Review Queue Component
 *
 * Displays pending human review assignments and allows admins to:
 * - View assignment details
 * - Assign reviewers to queued assignments
 * - Monitor status and due dates
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getReviewAssignmentStatus,
} from '@/lib/utils/status';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Target,
  ArrowRight,
  Loader2,
  UserPlus,
} from 'lucide-react';

interface Assignment {
  id: string;
  status: string;
  studentEmail: string;
  targetSchool: string | null;
  essayType: string | null;
  dueAt: string;
  assignedAt: string | null;
  createdAt: string;
  isOverdue: boolean;
  reviewer: {
    id: string;
    name: string;
    email: string;
    credentials: string;
  } | null;
}

interface Reviewer {
  id: string;
  name: string;
  email: string;
  credentials: string;
  activeCount: number;
  maxActive: number;
}

interface HumanReviewQueueProps {
  assignments: Assignment[];
  reviewers: Reviewer[];
}

export function HumanReviewQueue({ assignments, reviewers }: HumanReviewQueueProps) {
  const router = useRouter();
  const [assigningId, setAssigningId] = useState<string | null>(null);

  async function handleAssignReviewer(assignmentId: string, reviewerId: string) {
    if (!reviewerId) return;

    setAssigningId(assignmentId);
    try {
      const res = await fetch(`/api/admin/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerId }),
      });

      if (res.ok) {
        // Refresh the page to show updated data
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to assign reviewer');
      }
    } catch (error) {
      console.error('Failed to assign reviewer:', error);
      alert('Failed to assign reviewer');
    } finally {
      setAssigningId(null);
    }
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto text-success-600 mb-4" />
          <h3 className="text-xl font-semibold">No pending expert reviews</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Premium tier assignments will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group assignments by status
  const queuedAssignments = assignments.filter(a => a.status === 'QUEUED');
  const activeAssignments = assignments.filter(a => ['ASSIGNED', 'IN_PROGRESS'].includes(a.status));
  const overdueAssignments = assignments.filter(a => a.status === 'OVERDUE' || a.isOverdue);

  return (
    <div className="space-y-6">
      {/* Queued - Need Assignment */}
      {queuedAssignments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-warning-600" />
            Needs Assignment ({queuedAssignments.length})
          </h3>
          <div className="space-y-3">
            {queuedAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                reviewers={reviewers}
                onAssign={handleAssignReviewer}
                isAssigning={assigningId === assignment.id}
                showAssignDropdown
              />
            ))}
          </div>
        </div>
      )}

      {/* Overdue - Urgent */}
      {overdueAssignments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-error-700 dark:text-error-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Overdue ({overdueAssignments.length})
          </h3>
          <div className="space-y-3">
            {overdueAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                reviewers={reviewers}
                onAssign={handleAssignReviewer}
                isAssigning={assigningId === assignment.id}
                isOverdue
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Reviews */}
      {activeAssignments.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            Active Reviews ({activeAssignments.length})
          </h3>
          <div className="space-y-3">
            {activeAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                reviewers={reviewers}
                onAssign={handleAssignReviewer}
                isAssigning={assigningId === assignment.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  reviewers,
  onAssign,
  isAssigning,
  showAssignDropdown = false,
  isOverdue = false,
}: {
  assignment: Assignment;
  reviewers: Reviewer[];
  onAssign: (assignmentId: string, reviewerId: string) => void;
  isAssigning: boolean;
  showAssignDropdown?: boolean;
  isOverdue?: boolean;
}) {
  const [selectedReviewer, setSelectedReviewer] = useState('');
  const statusConfig = getReviewAssignmentStatus(assignment.status);
  const StatusIcon = statusConfig.icon;

  // Compute time values once per component mount for pure rendering
  const [timeInfo] = useState(() => {
    const due = new Date(assignment.dueAt);
    const now = new Date();
    const hours = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60));
    return { dueDate: due, hoursUntilDue: hours };
  });
  const { dueDate, hoursUntilDue } = timeInfo;

  // Filter reviewers who have capacity
  const availableReviewers = reviewers.filter(r => r.activeCount < r.maxActive);

  return (
    <Card className={`border-l-4 ${isOverdue || assignment.isOverdue ? 'border-l-error-500 bg-error-50/50' : 'border-l-brand-500'}`}>
      <CardContent className="py-4">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          {/* Assignment Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={statusConfig.badgeVariant} className="flex items-center gap-1">
                <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                {statusConfig.label}
              </Badge>
              {(isOverdue || assignment.isOverdue) && (
                <Badge variant="destructive">Overdue</Badge>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-600">{assignment.studentEmail}</span>
              </div>

              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-neutral-400" />
                <span className="font-medium">{assignment.targetSchool || 'General'}</span>
                {assignment.essayType && (
                  <span className="text-neutral-400">• {assignment.essayType}</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-400" />
                <span className={isOverdue || assignment.isOverdue ? 'text-error-600 font-medium' : 'text-neutral-600'}>
                  Due: {dueDate.toLocaleDateString()}
                  {!isOverdue && hoursUntilDue > 0 && hoursUntilDue < 24 && (
                    <span className="ml-1 text-warning-600">({hoursUntilDue}h left)</span>
                  )}
                </span>
              </div>

              {assignment.reviewer && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-500" />
                  <span className="text-brand-700 font-medium">{assignment.reviewer.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {showAssignDropdown && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedReviewer}
                  onValueChange={setSelectedReviewer}
                >
                  <SelectTrigger className="w-[200px]" disabled={isAssigning}>
                    <SelectValue placeholder="Select reviewer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableReviewers.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-neutral-500">
                        No reviewers available
                      </div>
                    ) : (
                      availableReviewers.map((reviewer) => (
                        <SelectItem key={reviewer.id} value={reviewer.id}>
                          <div className="flex flex-col">
                            <span>{reviewer.name}</span>
                            <span className="text-xs text-neutral-500">
                              {reviewer.activeCount}/{reviewer.maxActive} active
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => onAssign(assignment.id, selectedReviewer)}
                  disabled={!selectedReviewer || isAssigning}
                >
                  {isAssigning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Assign'
                  )}
                </Button>
              </div>
            )}

            <a href={`/reviewer/assignments/${assignment.id}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                View
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
