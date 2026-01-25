'use client';

/**
 * Reviewer Dashboard
 *
 * Shows the reviewer their assigned essays and allows them to:
 * - View their queue of assignments
 * - Start/continue working on reviews
 * - Mark reviews as complete
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getReviewAssignmentStatus,
  REVIEW_ASSIGNMENT_STATUS_CONFIG,
} from '@/lib/utils/status';
import {
  PenTool,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  User,
  Calendar,
  Target,
  Loader2,
} from 'lucide-react';

interface Assignment {
  id: string;
  status: string;
  studentEmail: string;
  targetSchool: string | null;
  essayType: string | null;
  dueAt: string;
  assignedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  isOverdue: boolean;
}

interface ReviewerStats {
  queued: number;
  assigned: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export default function ReviewerDashboard() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<ReviewerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    try {
      setIsLoading(true);
      const res = await fetch('/api/reviewer/assignments');
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push('/login');
          return;
        }
        throw new Error(data.error || 'Failed to fetch assignments');
      }

      setAssignments(data.assignments);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
    } finally {
      setIsLoading(false);
    }
  }

  const activeAssignments = assignments.filter(
    (a) => ['ASSIGNED', 'IN_PROGRESS'].includes(a.status)
  );
  const completedAssignments = assignments.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">IvyWay</span>
            <Badge variant="secondary" className="ml-2">Reviewer</Badge>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">Your Review Queue</h1>
          <p className="text-neutral-600 mt-1">
            Manage your assigned essay reviews
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mb-4" />
            <p className="text-neutral-600">Loading your assignments...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (
          <>
            {/* Stats Grid */}
            {stats && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.assigned + stats.inProgress}</p>
                        <p className="text-sm text-gray-500">Active Reviews</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Clock className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.inProgress}</p>
                        <p className="text-sm text-gray-500">In Progress</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.completed}</p>
                        <p className="text-sm text-gray-500">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-100">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.overdue}</p>
                        <p className="text-sm text-gray-500">Overdue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Active Assignments */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Active Assignments ({activeAssignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeAssignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No active assignments</p>
                    <p className="text-sm">New assignments will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onRefresh={fetchAssignments}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Completed Assignments */}
            {completedAssignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Recently Completed ({completedAssignments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {completedAssignments.slice(0, 5).map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onRefresh={fetchAssignments}
                        isCompleted
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function AssignmentCard({
  assignment,
  onRefresh,
  isCompleted = false,
}: {
  assignment: Assignment;
  onRefresh: () => void;
  isCompleted?: boolean;
}) {
  const statusConfig = getReviewAssignmentStatus(assignment.status);
  const StatusIcon = statusConfig.icon;

  const dueDate = new Date(assignment.dueAt);
  const isOverdue = assignment.isOverdue;
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div
      className={`
        p-4 rounded-lg border transition-colors
        ${isOverdue && !isCompleted ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-brand-200'}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant={statusConfig.badgeVariant}
              className="flex items-center gap-1"
            >
              <StatusIcon className={`w-3 h-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
              {statusConfig.label}
            </Badge>
            {isOverdue && !isCompleted && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Target className="w-4 h-4" />
              <span className="font-medium">
                {assignment.targetSchool || 'General'}
              </span>
              {assignment.essayType && (
                <span className="text-gray-400">• {assignment.essayType}</span>
              )}
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              <User className="w-4 h-4" />
              <span>{assignment.studentEmail}</span>
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4" />
              {isCompleted ? (
                <span>
                  Completed {assignment.completedAt
                    ? new Date(assignment.completedAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              ) : (
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  Due {dueDate.toLocaleDateString()}
                  {!isOverdue && daysUntilDue <= 1 && (
                    <span className="ml-1 text-orange-600">(Due soon!)</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/reviewer/assignments/${assignment.id}`}>
            <Button
              size="sm"
              variant={isCompleted ? 'outline' : 'default'}
            >
              {isCompleted ? 'View' : 'Review'}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
