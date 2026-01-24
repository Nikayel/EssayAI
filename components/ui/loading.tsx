'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// =============================================================================
// RESEARCH-BACKED LOADING UX
// =============================================================================
// - < 1 second: No indicator needed (or subtle skeleton)
// - 1-3 seconds: Skeleton loaders (reduce perceived wait time by 20-30%)
// - > 3 seconds: Progress indicators with steps (reduces anxiety)
// - Always: Show what's happening, not just "loading..."
// =============================================================================

// =============================================================================
// SKELETON - For content placeholders (1-3 second loads)
// =============================================================================

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-neutral-200 dark:bg-neutral-700';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  if (lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, variantClasses.text)}
            style={{
              ...style,
              width: i === lines - 1 ? '75%' : style.width || '100%',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
}

// =============================================================================
// SKELETON PRESETS - Common loading patterns
// =============================================================================

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-neutral-200 dark:border-neutral-700 p-6', className)}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <div className="mt-4">
        <Skeleton variant="text" lines={3} />
      </div>
    </div>
  );
}

export function SkeletonEssayCard() {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Skeleton variant="text" width={150} height={24} />
            <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
          </div>
          <Skeleton variant="text" width="80%" />
        </div>
        <Skeleton variant="rectangular" width={100} height={28} className="rounded-full" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Skeleton variant="text" width={80} />
          <Skeleton variant="rectangular" width={96} height={8} />
        </div>
        <Skeleton variant="rectangular" width={100} height={36} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Header */}
      <div className="bg-neutral-50 dark:bg-neutral-800 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-4">
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="20%" />
          <Skeleton variant="text" width="15%" />
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
          <div className="flex gap-4 items-center">
            <Skeleton variant="text" width="20%" />
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="20%" />
            <Skeleton variant="rectangular" width={60} height={28} />
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// SPINNER - For short operations (< 1 second) or inline loading
// =============================================================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2
        className={cn(spinnerSizes[size], 'animate-spin text-brand-600 dark:text-brand-400')}
        aria-hidden="true"
      />
      {label && (
        <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      )}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
}

// =============================================================================
// LOADING OVERLAY - For blocking operations on a container
// =============================================================================

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  label?: string;
  blur?: boolean;
}

export function LoadingOverlay({
  isLoading,
  children,
  label = 'Loading...',
  blur = true,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center z-10',
            'bg-white/90 dark:bg-neutral-900/90',
            // Use lighter blur on mobile for better performance
            blur && 'backdrop-blur-[2px] md:backdrop-blur-sm will-change-[backdrop-filter]'
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// STEP PROGRESS - For long operations (> 3 seconds)
// =============================================================================

export interface LoadingStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StepProgressProps {
  steps: LoadingStep[];
  currentStep: number;
  progress?: number; // 0-100, optional overall progress
  title?: string;
  subtitle?: string;
  className?: string;
}

export function StepProgress({
  steps,
  currentStep,
  progress,
  title = 'Processing...',
  subtitle,
  className,
}: StepProgressProps) {
  return (
    <div className={cn('max-w-lg mx-auto', className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <Spinner size="xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/50 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">{subtitle}</p>
        )}
      </div>

      {/* Overall Progress Bar */}
      {progress !== undefined && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-neutral-600 dark:text-neutral-400">Progress</span>
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isActive = index === currentStep;
          const isPending = index > currentStep;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-all duration-200',
                isActive && 'bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-500',
                isComplete && 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800',
                isPending && 'bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700'
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0" />
              ) : StepIcon ? (
                <StepIcon
                  className={cn(
                    'w-5 h-5 flex-shrink-0',
                    isActive && 'text-brand-600 dark:text-brand-400 animate-pulse',
                    isPending && 'text-neutral-400 dark:text-neutral-500'
                  )}
                />
              ) : (
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold',
                    isActive && 'bg-brand-600 text-white',
                    isPending && 'bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-400',
                    isComplete && 'bg-success-600 text-white'
                  )}
                >
                  {isComplete ? '✓' : index + 1}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'font-medium block truncate',
                    isActive && 'text-brand-900 dark:text-brand-100',
                    isComplete && 'text-success-900 dark:text-success-100',
                    isPending && 'text-neutral-500 dark:text-neutral-400'
                  )}
                >
                  {step.label}
                </span>
                {step.description && isActive && (
                  <span className="text-sm text-brand-700 dark:text-brand-300">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// FULL-PAGE LOADING - For route transitions or initial loads
// =============================================================================

interface PageLoadingProps {
  title?: string;
  subtitle?: string;
}

export function PageLoading({
  title = 'Loading...',
  subtitle
}: PageLoadingProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" className="justify-center mb-4" />
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h2>
        {subtitle && (
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// INLINE LOADING BUTTON STATE
// =============================================================================

interface LoadingButtonContentProps {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function LoadingButtonContent({
  isLoading,
  loadingText = 'Loading...',
  children,
}: LoadingButtonContentProps) {
  if (isLoading) {
    return (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{loadingText}</span>
      </>
    );
  }
  return <>{children}</>;
}

// =============================================================================
// ERROR STATE - For failed operations
// =============================================================================

interface LoadingErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function LoadingError({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: LoadingErrorProps) {
  return (
    <div className={cn('text-center py-12', className)}>
      <AlertCircle className="w-12 h-12 text-error-500 dark:text-error-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-error-900 dark:text-error-100 mb-2">
        {title}
      </h3>
      <p className="text-neutral-600 dark:text-neutral-400 mb-4 max-w-sm mx-auto">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-error-600 hover:bg-error-700 text-white rounded-lg transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
