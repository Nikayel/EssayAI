'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * Error component for catching errors in route segments
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console (or error tracking service)
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-neutral-600 mb-6">
          We encountered an unexpected error. Our team has been notified and is working on a fix.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs text-neutral-400">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
