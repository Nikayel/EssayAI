'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IvyAnalysisDisplay } from '@/components/ivy/ivy-analysis-display';
import { PostPurchaseUpsell } from '@/components/ivy/post-purchase-upsell';
import { useToastActions } from '@/components/ui/toast';
import type { IvyAnalysisResult } from '@/lib/scoring/tiers/ivy-analysis';
import type { AllTiers } from '@/lib/pricing';
import {
  PenTool,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Download,
  Share2,
  CheckCircle2,
  Plus,
} from 'lucide-react';

type SessionStatus = 'loading' | 'analyzing' | 'complete' | 'error';

interface AnalysisProgress {
  stage: string;
  schoolsComplete: number;
  totalSchools: number;
  currentSchool?: string;
}

export default function IvyResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const toast = useToastActions();
  const sessionId = params.sessionId as string;

  const [status, setStatus] = useState<SessionStatus>('loading');
  const [result, setResult] = useState<IvyAnalysisResult | null>(null);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<AllTiers>('quick');
  const [showUpsell, setShowUpsell] = useState(false);
  const [justPaid, setJustPaid] = useState(false);

  // Check for payment/upgrade success
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const upgradeStatus = searchParams.get('upgrade');
    const newTier = searchParams.get('tier');

    if (paymentStatus === 'success' || upgradeStatus === 'success') {
      setJustPaid(true);
      setShowUpsell(true);
      if (newTier && ['quick', 'standard', 'premium', 'ivy_single', 'ivy_bundle_3', 'ivy_bundle_8'].includes(newTier)) {
        setCurrentTier(newTier as AllTiers);
      }
      // Auto-hide success banner after 5 seconds
      setTimeout(() => setJustPaid(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/tiered-analysis/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to load session');
          setStatus('error');
          return;
        }

        if (data.status === 'COMPLETED' && data.result) {
          setResult(data.result);
          setStatus('complete');
          // Set tier from session data
          if (data.tier) {
            setCurrentTier(data.tier as AllTiers);
          }
          if (pollInterval) clearInterval(pollInterval);
        } else if (data.status === 'ANALYZING') {
          setStatus('analyzing');
          setProgress(data.progress);
        } else if (data.status === 'FAILED') {
          setError(data.error || 'Analysis failed');
          setStatus('error');
          if (pollInterval) clearInterval(pollInterval);
        } else if (data.status === 'PENDING') {
          // Still waiting for payment confirmation or analysis to start
          setStatus('loading');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to connect to server');
        setStatus('error');
      }
    };

    fetchSession();

    // Poll for updates if still analyzing
    pollInterval = setInterval(() => {
      if (status === 'loading' || status === 'analyzing') {
        fetchSession();
      }
    }, 3000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [sessionId, status]);

  const handleRewrite = async (schoolId: string, essayIndex: number, goals: string[]) => {
    try {
      const response = await fetch('/api/ivy/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          schoolId,
          essayIndex,
          goals,
        }),
      });

      if (response.ok) {
        // TODO: Open modal with rewritten essay data
        toast.success('Rewrite generated! Opening results...');
      }
    } catch (err) {
      console.error('Rewrite error:', err);
      toast.error('Failed to generate rewrite. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">IvyWay</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-neutral-700">Loading your analysis...</p>
          </div>
        )}

        {/* Analyzing State */}
        {status === 'analyzing' && progress && (
          <div className="max-w-xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Analyzing Your Essays
                </h2>
                <p className="text-neutral-600 mb-6">
                  {progress.currentSchool
                    ? `Currently analyzing: ${progress.currentSchool}`
                    : progress.stage}
                </p>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge variant="default">
                    {progress.schoolsComplete} of {progress.totalSchools} schools complete
                  </Badge>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.schoolsComplete / progress.totalSchools) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-neutral-500 mt-6">
                  This usually takes 1-2 minutes per school. Please don&apos;t close this page.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="max-w-xl mx-auto">
            <Card className="border-red-200">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Something Went Wrong
                </h2>
                <p className="text-neutral-600 mb-6">
                  {error || 'An unexpected error occurred'}
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try Again
                  </Button>
                  <Link href="/dashboard">
                    <Button>Back to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results */}
        {status === 'complete' && result && (
          <div className="space-y-6">
            {/* Payment Success Banner */}
            {justPaid && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Payment successful!</p>
                      <p className="text-sm text-green-600">Your full analysis is now unlocked.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Post-Purchase Upsell */}
            {showUpsell && currentTier !== 'premium' && (
              <PostPurchaseUpsell
                currentTier={currentTier}
                sessionId={sessionId}
                onDismiss={() => setShowUpsell(false)}
                onUpgrade={(tier) => setCurrentTier(tier)}
              />
            )}

            {/* Actions Bar */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Analysis Complete</h1>
                <p className="text-neutral-600">
                  Review your detailed feedback below
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/ivy">
                  <Button size="sm">
                    <Plus className="w-4 h-4" />
                    New Ivy Analysis
                  </Button>
                </Link>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Analysis Display */}
            <IvyAnalysisDisplay
              result={result}
              onRequestRewrite={handleRewrite}
            />
          </div>
        )}
      </main>
    </div>
  );
}
