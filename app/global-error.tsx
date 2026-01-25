'use client';

import { useEffect } from 'react';

/**
 * Global error handler for root layout errors
 * This catches errors in the root layout itself
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fafafa',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#171717',
                marginBottom: '0.5rem',
              }}
            >
              Something went wrong
            </h1>
            <p style={{ color: '#525252', marginBottom: '1.5rem' }}>
              We're having trouble loading the page. Please try again.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'white',
                  color: '#171717',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Go Home
              </button>
            </div>
            {error.digest && (
              <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#a3a3a3' }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
