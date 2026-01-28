'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, X, GraduationCap } from 'lucide-react';

/**
 * Social Proof Toast - Real-time activity notifications
 *
 * Psychology principles used:
 * 1. Social Proof: Others are using this = safe/good choice
 * 2. FOMO: Activity happening now = don't miss out
 * 3. Specificity: Real school names = credibility
 * 4. Recency: "just now" = active platform
 */

interface Activity {
  id: number;
  name: string;
  location: string;
  school: string;
  action: 'analyzed' | 'improved' | 'submitted';
  timeAgo: string;
}

// Realistic activity data - mix of schools and states
const ACTIVITIES: Activity[] = [
  { id: 1, name: 'Sarah M.', location: 'CA', school: 'Stanford', action: 'analyzed', timeAgo: 'just now' },
  { id: 2, name: 'James K.', location: 'NY', school: 'Harvard', action: 'improved', timeAgo: '2 min ago' },
  { id: 3, name: 'Emily R.', location: 'TX', school: 'Yale', action: 'analyzed', timeAgo: '5 min ago' },
  { id: 4, name: 'Michael C.', location: 'MA', school: 'MIT', action: 'analyzed', timeAgo: 'just now' },
  { id: 5, name: 'Priya S.', location: 'NJ', school: 'Princeton', action: 'improved', timeAgo: '3 min ago' },
  { id: 6, name: 'David L.', location: 'IL', school: 'Columbia', action: 'analyzed', timeAgo: '1 min ago' },
  { id: 7, name: 'Sophia W.', location: 'WA', school: 'Brown', action: 'analyzed', timeAgo: 'just now' },
  { id: 8, name: 'Alex T.', location: 'FL', school: 'UPenn', action: 'improved', timeAgo: '4 min ago' },
  { id: 9, name: 'Jennifer H.', location: 'GA', school: 'Cornell', action: 'analyzed', timeAgo: '2 min ago' },
  { id: 10, name: 'Ryan P.', location: 'PA', school: 'Dartmouth', action: 'analyzed', timeAgo: 'just now' },
];

const ACTION_TEXT: Record<Activity['action'], string> = {
  analyzed: 'analyzed their',
  improved: 'improved their',
  submitted: 'submitted their',
};

interface SocialProofToastProps {
  /** Delay before first toast appears (ms) */
  initialDelay?: number;
  /** Interval between toasts (ms) */
  interval?: number;
  /** How long each toast is visible (ms) */
  duration?: number;
  /** Position of the toast */
  position?: 'bottom-left' | 'bottom-right';
}

export function SocialProofToast({
  initialDelay = 5000,
  interval = 15000,
  duration = 4000,
  position = 'bottom-left',
}: SocialProofToastProps) {
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activityIndex, setActivityIndex] = useState(0);

  // Check if dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('social-proof-dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  const showNextToast = useCallback(() => {
    if (isDismissed) return;

    // Cycle through activities
    const activity = ACTIVITIES[activityIndex % ACTIVITIES.length];
    setCurrentActivity(activity);
    setIsVisible(true);

    // Hide after duration
    setTimeout(() => {
      setIsVisible(false);
    }, duration);

    // Move to next activity
    setActivityIndex((prev) => prev + 1);
  }, [activityIndex, duration, isDismissed]);

  useEffect(() => {
    if (isDismissed) return;

    // Initial delay before first toast
    const initialTimer = setTimeout(() => {
      showNextToast();
    }, initialDelay);

    return () => clearTimeout(initialTimer);
  }, [initialDelay, showNextToast, isDismissed]);

  useEffect(() => {
    if (isDismissed || activityIndex === 0) return;

    // Set up recurring toasts
    const intervalTimer = setInterval(() => {
      showNextToast();
    }, interval);

    return () => clearInterval(intervalTimer);
  }, [interval, showNextToast, activityIndex, isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('social-proof-dismissed', 'true');
  };

  if (isDismissed || !currentActivity) return null;

  const positionClasses = {
    'bottom-left': 'left-4 bottom-20 md:bottom-6',
    'bottom-right': 'right-4 bottom-20 md:bottom-6',
  };

  return (
    <div
      className={`fixed z-40 ${positionClasses[position]} transition-all duration-300 transform ${
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-3 pr-10 max-w-[320px] relative overflow-hidden">
        {/* Green success bar at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-success-400 to-success-500" />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Dismiss notifications"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-success-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-neutral-900 leading-snug">
              <span className="font-semibold">{currentActivity.name}</span>
              <span className="text-neutral-500"> from {currentActivity.location}</span>
              {' '}
              {ACTION_TEXT[currentActivity.action]}
              {' '}
              <span className="font-medium text-brand-600">
                {currentActivity.school}
              </span>
              {' '}essay
            </p>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-success-500" />
              {currentActivity.timeAgo}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for embedding in other components
 */
export function SocialProofMini({ className = '' }: { className?: string }) {
  const [activity, setActivity] = useState(ACTIVITIES[0]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setActivity(ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]);
        setIsVisible(true);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-50 border border-success-200/60 text-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
      </span>
      <span className="text-success-700">
        <span className="font-medium">{activity.name}</span> analyzed their{' '}
        <span className="font-medium">{activity.school}</span> essay
      </span>
    </div>
  );
}
