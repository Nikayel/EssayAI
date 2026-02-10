'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ANALYZING', label: 'Analyzing' },
  { value: 'HUMAN_QUEUED', label: 'Human Queue' },
  { value: 'HUMAN_IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'AI_COMPLETE', label: 'AI Complete' },
  { value: 'FAILED', label: 'Failed' },
] as const;

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'preview', label: 'Preview' },
  { value: 'quick', label: 'Quick' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium', label: 'Premium' },
] as const;

interface SessionFiltersProps {
  currentStatus: string;
  currentTier: string;
}

export function SessionFilters({ currentStatus, currentTier }: SessionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      // Reset to page 1 on filter change
      params.delete('page');
      router.push(`/admin/sessions?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="space-y-3">
      {/* Status Filters */}
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((option) => {
            const isActive = currentStatus === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateFilter('status', option.value)}
                className="transition-all"
              >
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={`cursor-pointer ${
                    isActive
                      ? ''
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {option.label}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier Filters */}
      <div>
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Tier</p>
        <div className="flex flex-wrap gap-1.5">
          {TIER_OPTIONS.map((option) => {
            const isActive = currentTier === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateFilter('tier', option.value)}
                className="transition-all"
              >
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={`cursor-pointer ${
                    isActive
                      ? ''
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {option.label}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Pagination controls for sessions list
 */
interface SessionPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function SessionPagination({ currentPage, totalPages, totalCount }: SessionPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) {
        params.delete('page');
      } else {
        params.set('page', String(page));
      }
      router.push(`/admin/sessions?${params.toString()}`);
    },
    [router, searchParams]
  );

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-neutral-500">
        {totalCount} total sessions
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
        >
          Previous
        </button>
        <span className="text-sm text-neutral-600 px-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}
