'use client';

/**
 * Analysis Results Page
 *
 * Displays results for Quick, Standard, and Premium tier analyses.
 * For Ivy-specific analyses, users are redirected to /ivy/results/[sessionId].
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnalysisResults } from '@/components/analysis/analysis-results';
import { PostPurchaseUpsell } from '@/components/ivy/post-purchase-upsell';
import type { QuickAnalysisResult, StandardAnalysisResult, PremiumAnalysisResult } from '@/lib/scoring/tiers/types';
import type { AllTiers } from '@/lib/pricing';

// Local type that includes legacy 'standard' for backwards compatibility
type ResultTier = AllTiers | 'standard';
import {
  PenTool,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Download,
  Share2,
  CheckCircle2,
} from 'lucide-react';

type SessionStatus = 'loading' | 'analyzing' | 'complete' | 'error';
type AnalysisResult = QuickAnalysisResult | StandardAnalysisResult | PremiumAnalysisResult;

export default function AnalysisResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [status, setStatus] = useState<SessionStatus>('loading');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<ResultTier>('quick');
  const [showUpsell, setShowUpsell] = useState(false);
  const [justPaid, setJustPaid] = useState(false);
  const [targetSchool, setTargetSchool] = useState<string | null>(null);

  // Check for payment success
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const upgradeStatus = searchParams.get('upgrade');
    const newTier = searchParams.get('tier');

    if (paymentStatus === 'success' || upgradeStatus === 'success') {
      setJustPaid(true);
      setShowUpsell(true);
      if (newTier && ['quick', 'standard', 'premium', 'ivy_single', 'ivy_bundle_3'].includes(newTier)) {
        setCurrentTier(newTier as ResultTier);
      }
      // Auto-hide success banner after 5 seconds
      setTimeout(() => setJustPaid(false), 5000);
    }
  }, [searchParams]);

  // Fetch session data
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

        // Redirect Ivy tiers to the Ivy results page
        if (data.tier?.startsWith('ivy_')) {
          router.replace(`/ivy/results/${sessionId}`);
          return;
        }

        // Set school name for display
        if (data.targetSchool) {
          setTargetSchool(data.targetSchool);
        }

        if (data.status === 'COMPLETED' && data.result) {
          setResult(data.result);
          setStatus('complete');
          if (data.tier) {
            setCurrentTier(data.tier as ResultTier);
          }
          if (pollInterval) clearInterval(pollInterval);
        } else if (data.status === 'ANALYZING' || data.status === 'AI_COMPLETE') {
          setStatus('analyzing');
        } else if (data.status === 'FAILED') {
          setError(data.error || 'Analysis failed');
          setStatus('error');
          if (pollInterval) clearInterval(pollInterval);
        } else if (data.status === 'PENDING') {
          // Trigger analysis run after payment
          await triggerAnalysis();
          setStatus('analyzing');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to connect to server');
        setStatus('error');
      }
    };

    const triggerAnalysis = async () => {
      try {
        await fetch(`/api/tiered-analysis/${sessionId}/run`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to trigger analysis:', err);
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
  }, [sessionId, status, router]);

  const handleUpgrade = async (tier: 'standard' | 'premium' | 'ivy_single' | 'ivy_bundle_3') => {
    try {
      const response = await fetch('/api/tiered-analysis/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fromTier: currentTier,
          toTier: tier,
        }),
      });

      if (response.ok) {
        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error('Upgrade error:', err);
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
        {status === 'analyzing' && (
          <div className="max-w-xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-brand-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Analyzing Your Essay
                </h2>
                <p className="text-neutral-600 mb-4">
                  {targetSchool
                    ? `We're reviewing your essay for ${targetSchool}...`
                    : "We're reviewing your essay..."}
                </p>
                <p className="text-sm text-neutral-500">
                  This usually takes 30-60 seconds. Please don&apos;t close this page.
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
                      <p className="text-sm text-green-600">Your analysis is ready below.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Post-Purchase Upsell (only for quick tier) */}
            {showUpsell && currentTier === 'quick' && (
              <PostPurchaseUpsell
                currentTier={currentTier}
                sessionId={sessionId}
                schoolName={targetSchool || undefined}
                onDismiss={() => setShowUpsell(false)}
                onUpgrade={(tier) => setCurrentTier(tier)}
              />
            )}

            {/* Actions Bar */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  {targetSchool ? `${targetSchool} Essay Analysis` : 'Essay Analysis'}
                </h1>
                <p className="text-neutral-600">
                  {currentTier === 'quick' && 'Quick feedback - upgrade for full analysis'}
                  {currentTier === 'standard' && 'Full analysis with school-specific insights'}
                  {currentTier === 'premium' && 'Premium analysis with expert review'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                  Export PDF
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>

            {/* Analysis Display */}
            <AnalysisResults
              result={result}
              onUpgrade={handleUpgrade}
            />
          </div>
        )}
      </main>
    </div>
  );
}
