'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, X } from 'lucide-react';

interface StickyMobileCTAProps {
  className?: string;
}

/**
 * Mobile-first sticky CTA bar
 * Appears when user scrolls past hero section
 * Based on Apple's conversion psychology - persistent but non-intrusive
 */
export function StickyMobileCTA({ className = '' }: StickyMobileCTAProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const dismissed = sessionStorage.getItem('cta-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    const handleScroll = () => {
      // Show after scrolling 400px (past hero on most mobiles)
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('cta-dismissed', 'true');
  };

  // Only show on mobile, when visible, and not dismissed
  if (isDismissed || !isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transform transition-transform duration-300 ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      } ${className}`}
    >
      {/* Gradient fade effect at top */}
      <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />

      {/* Main CTA bar */}
      <div className="bg-white/95 backdrop-blur-lg border-t border-neutral-200 shadow-[0_-4px_20px_0_rgba(0,0,0,0.08)] px-4 py-3 safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Value prop */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              Free essay analysis
            </p>
            <p className="text-xs text-neutral-500 truncate">
              Results in 60 seconds
            </p>
          </div>

          {/* CTA Button */}
          <Link href="/signup" className="flex-shrink-0">
            <Button size="sm" className="px-4 shadow-md">
              Start Free
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Floating action button style
 * Use for minimal design preference
 */
export function FloatingCTA({ className = '' }: { className?: string }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <Link
      href="/signup"
      className={`fixed bottom-6 right-4 z-50 md:hidden ${className}`}
    >
      <Button
        size="lg"
        className="rounded-full shadow-xl shadow-brand-500/30 px-6"
      >
        Try Free
        <ArrowRight className="w-4 h-4" />
      </Button>
    </Link>
  );
}
