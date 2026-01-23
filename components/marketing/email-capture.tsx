'use client';

/**
 * Email Capture Component
 * Reusable email collection form for lead generation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

interface EmailCaptureProps {
  source: string;
  leadMagnet?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  className?: string;
  variant?: 'inline' | 'stacked' | 'minimal';
  showIcon?: boolean;
  onSuccess?: (email: string) => void;
}

export function EmailCapture({
  source,
  leadMagnet,
  placeholder = 'Enter your email',
  buttonText = 'Get Started',
  successMessage = 'Thanks! Check your email.',
  className = '',
  variant = 'inline',
  showIcon = true,
  onSuccess,
}: EmailCaptureProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || status === 'loading') return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/email-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source,
          leadMagnet,
          marketingConsent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      onSuccess?.(email);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Please try again');
    }
  }

  if (status === 'success') {
    return (
      <div className={`flex items-center gap-2 text-green-600 ${className}`}>
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">{successMessage}</span>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          className="flex-1"
          disabled={status === 'loading'}
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </Button>
      </form>
    );
  }

  if (variant === 'stacked') {
    return (
      <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
        <div className="relative">
          {showIcon && (
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          )}
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={placeholder}
            required
            className={showIcon ? 'pl-10' : ''}
            disabled={status === 'loading'}
          />
        </div>
        <Button type="submit" className="w-full" disabled={status === 'loading'}>
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Please wait...
            </>
          ) : (
            <>
              {buttonText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
        {status === 'error' && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </form>
    );
  }

  // Default: inline variant
  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        {showIcon && (
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          className={`${showIcon ? 'pl-10' : ''} h-12`}
          disabled={status === 'loading'}
        />
      </div>
      <Button type="submit" size="lg" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            {buttonText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
      {status === 'error' && (
        <p className="text-sm text-red-600 mt-1 w-full">{errorMessage}</p>
      )}
    </form>
  );
}

// =============================================================================
// SPECIALIZED VARIANTS
// =============================================================================

interface LeadMagnetCaptureProps {
  leadMagnet: string;
  title: string;
  description: string;
  buttonText?: string;
  source?: string;
  className?: string;
}

export function LeadMagnetCapture({
  leadMagnet,
  title,
  description,
  buttonText = 'Get Free Guide',
  source = 'lead-magnet',
  className = '',
}: LeadMagnetCaptureProps) {
  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100 ${className}`}>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <EmailCapture
        source={source}
        leadMagnet={leadMagnet}
        buttonText={buttonText}
        variant="stacked"
        successMessage="Check your email for the download link!"
      />
    </div>
  );
}

interface PopupCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  leadMagnet?: string;
  source?: string;
}

export function PopupCapture({
  isOpen,
  onClose,
  title = 'Get Exclusive Essay Tips',
  description = 'Join thousands of students getting free essay advice delivered to their inbox.',
  leadMagnet,
  source = 'popup',
}: PopupCaptureProps) {
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-2">{description}</p>
        </div>

        <EmailCapture
          source={source}
          leadMagnet={leadMagnet}
          variant="stacked"
          buttonText="Subscribe Free"
          onSuccess={() => setSubmitted(true)}
        />

        {submitted && (
          <p className="text-center text-sm text-gray-500 mt-4">
            This popup won&apos;t show again.
          </p>
        )}
      </div>
    </div>
  );
}
