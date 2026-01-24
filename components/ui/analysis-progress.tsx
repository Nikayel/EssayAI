'use client';

/**
 * Unified Analysis Progress Component
 * Apple-style: Simple, honest, beautiful
 *
 * Replaces both AnalyzingScreen and AnalysisLoadingScreen
 * with one consistent experience.
 */

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface AnalysisProgressProps {
  status: 'queued' | 'processing' | 'complete' | 'error';
  /** Current step being processed (shown to user) */
  currentStep?: string;
  /** Error message if status is 'error' */
  errorMessage?: string;
  /** Callback when user clicks retry */
  onRetry?: () => void;
  /** Optional: Show estimated time */
  showEstimate?: boolean;
  /** Optional: Custom class */
  className?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const PROCESSING_MESSAGES = [
  'Reading your essay...',
  'Analyzing your voice and authenticity...',
  'Evaluating narrative structure...',
  'Checking for common patterns...',
  'Generating personalized feedback...',
  'Finalizing your analysis...',
];

const TIPS = [
  'Great essays reveal something your transcript can\'t',
  'Specific details are more memorable than grand statements',
  'Your authentic voice matters more than perfect grammar',
  'The best essays answer "So what?" and "Why does this matter?"',
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AnalysisProgress({
  status,
  currentStep,
  errorMessage,
  onRetry,
  showEstimate = true,
  className,
}: AnalysisProgressProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Rotate through messages while processing
  useEffect(() => {
    if (status !== 'processing') return;

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 4000);

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 8000);

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(tipInterval);
      clearInterval(dotsInterval);
    };
  }, [status]);

  const displayMessage = currentStep || PROCESSING_MESSAGES[messageIndex];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[400px] p-8',
        className
      )}
    >
      {/* Main Content */}
      <div className="flex flex-col items-center max-w-md text-center">

        {/* Spinner / Status Icon */}
        <div className="relative mb-8">
          {status === 'processing' || status === 'queued' ? (
            <ProgressRing />
          ) : status === 'complete' ? (
            <CompleteIcon />
          ) : (
            <ErrorIcon />
          )}
        </div>

        {/* Status Message */}
        <h2 className="text-xl font-semibold text-neutral-900 mb-2 min-h-[28px]">
          {status === 'queued' && 'Starting analysis...'}
          {status === 'processing' && displayMessage}
          {status === 'complete' && 'Analysis complete!'}
          {status === 'error' && 'Something went wrong'}
        </h2>

        {/* Subtitle / Estimate */}
        {status === 'processing' && showEstimate && (
          <p className="text-neutral-500 mb-6">
            This usually takes about a minute{dots}
          </p>
        )}

        {status === 'error' && (
          <p className="text-neutral-500 mb-6">
            {errorMessage || 'We couldn\'t complete your analysis. Please try again.'}
          </p>
        )}

        {/* Retry Button */}
        {status === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-full font-medium
                       hover:bg-brand-700 transition-colors duration-200
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        )}

        {/* Tip (only during processing) */}
        {status === 'processing' && (
          <div className="mt-8 p-4 bg-neutral-50 rounded-2xl max-w-sm">
            <p className="text-sm text-neutral-600 italic">
              "{TIPS[tipIndex]}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/**
 * Apple-style progress ring with smooth animation
 */
function ProgressRing() {
  return (
    <div className="relative w-20 h-20">
      {/* Outer ring (track) */}
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-neutral-200"
        />
        {/* Animated progress arc */}
        <circle
          cx="40"
          cy="40"
          r="36"
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="226"
          strokeDashoffset="60"
          className="animate-spin-slow origin-center"
          style={{ animationDuration: '2s' }}
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 bg-brand-500 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Success checkmark with animation
 */
function CompleteIcon() {
  return (
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
      <svg
        className="w-10 h-10 text-green-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
          className="animate-draw-check"
          style={{
            strokeDasharray: 24,
            strokeDashoffset: 24,
            animation: 'drawCheck 0.4s ease-out 0.2s forwards',
          }}
        />
      </svg>
    </div>
  );
}

/**
 * Error icon
 */
function ErrorIcon() {
  return (
    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center animate-scale-in">
      <svg
        className="w-10 h-10 text-red-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </div>
  );
}

// =============================================================================
// COMPACT VARIANT (for inline use)
// =============================================================================

export function AnalysisProgressCompact({
  status,
  currentStep,
}: Pick<AnalysisProgressProps, 'status' | 'currentStep'>) {
  return (
    <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-xl">
      {status === 'processing' ? (
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      ) : status === 'complete' ? (
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ) : (
        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      )}
      <span className="text-sm text-neutral-700">
        {currentStep || (status === 'processing' ? 'Analyzing...' : status === 'complete' ? 'Complete' : 'Error')}
      </span>
    </div>
  );
}

export default AnalysisProgress;
