'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { IvySchoolSelector, IVY_SCHOOLS } from '@/components/ivy/school-selector';
import { IvyPortfolioUpload } from '@/components/ivy/portfolio-upload';
import { IntakeForm } from '@/components/intake/intake-form';
import type { StudentIntake } from '@/lib/scoring';
import { cn } from '@/lib/utils/cn';
import {
  PenTool,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  School,
  FileText,
  Shield,
  Zap,
  Users,
  ChevronRight,
  Loader2,
  Lock,
  Eye,
  Star,
} from 'lucide-react';

type Step = 'school' | 'intake' | 'essays' | 'analyzing' | 'results';

const STEP_LABELS: Record<Step, string> = {
  school: 'Choose School',
  intake: 'About You',
  essays: 'Your Essays',
  analyzing: 'Analyzing',
  results: 'Results',
};

export default function IvyAnalysisPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('school');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [intake, setIntake] = useState<StudentIntake | null>(null);
  const [essays, setEssays] = useState<{ promptId: string; content: string }[]>([]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSchoolInfo = IVY_SCHOOLS.find(s => s.id === selectedSchool);

  // Handle school selection
  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchool(schoolId);
  };

  // Handle intake completion
  const handleIntakeComplete = (data: StudentIntake) => {
    setIntake(data);
    setStep('essays');
  };

  // Handle essays update
  const handleEssaysUpdate = useCallback((schoolId: string, newEssays: { promptId: string; content: string }[]) => {
    setEssays(newEssays);
  }, []);

  // Run analysis (FREE - then blur results)
  const runAnalysis = async () => {
    if (!selectedSchool || !intake || essays.length === 0) return;

    setStep('analyzing');
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ivy/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedSchool,
          essays: essays.map(e => ({
            promptId: e.promptId,
            essayText: e.content,
          })),
          intake,
          // No payment - this is the free analysis
          tier: 'preview',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysisResult(data.result);
      setStep('results');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStep('essays'); // Go back to essays step
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle payment/unlock
  const handleUnlock = async (tier: 'quick' | 'standard' | 'ivy_single') => {
    try {
      const response = await fetch('/api/tiered-analysis/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          essayText: essays.map(e => e.content).join('\n\n---\n\n'),
          intake,
          schools: [selectedSchool],
          essaysBySchool: {
            [selectedSchool!]: essays.map(e => ({
              promptId: e.promptId,
              essayText: e.content,
            })),
          },
        }),
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  const canProceedToIntake = selectedSchool !== null;
  const canProceedToAnalysis = essays.length > 0 && essays.every(e => e.content.trim().length > 50);

  const goBack = () => {
    if (step === 'intake') setStep('school');
    else if (step === 'essays') setStep('intake');
    else if (step === 'results') setStep('essays');
  };

  const goForward = () => {
    if (step === 'school' && canProceedToIntake) setStep('intake');
    else if (step === 'essays' && canProceedToAnalysis) runAnalysis();
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
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Progress Steps */}
      {step !== 'analyzing' && step !== 'results' && (
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {(['school', 'intake', 'essays'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                    step === s
                      ? 'bg-brand-600 text-white'
                      : ['school', 'intake', 'essays'].indexOf(step) > i
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-neutral-100 text-neutral-400'
                  )}
                >
                  {['school', 'intake', 'essays'].indexOf(step) > i ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    'ml-2 text-sm hidden md:block',
                    step === s ? 'text-brand-700 font-medium' : 'text-neutral-500'
                  )}
                >
                  {STEP_LABELS[s]}
                </span>
                {i < 2 && <ChevronRight className="w-4 h-4 text-neutral-300 mx-2 md:mx-4" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        {/* Step 1: School Selection */}
        {step === 'school' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <Badge variant="new" size="lg" className="mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Free Ivy Analysis
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                Which Ivy Are You Applying To?
              </h1>
              <p className="text-lg text-neutral-600">
                Get school-specific feedback from the perspective of actual admissions officers.
                <span className="block text-brand-600 font-medium mt-2">
                  Start for free - pay only to unlock full results.
                </span>
              </p>
            </div>

            <IvySchoolSelector
              selectedSchool={selectedSchool}
              onSelect={handleSchoolSelect}
              mode="single"
            />

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={() => setStep('intake')}
                disabled={!canProceedToIntake}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Essays never shared</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Results in 60 seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>10,000+ essays analyzed</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Intake Form */}
        {step === 'intake' && selectedSchoolInfo && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: selectedSchoolInfo.color }}
              >
                {selectedSchoolInfo.name[0]}
              </div>
              <div>
                <h2 className="font-semibold">{selectedSchoolInfo.fullName}</h2>
                <p className="text-sm text-neutral-500">Tell us about yourself for personalized feedback</p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Help Us Help You</CardTitle>
                <CardDescription>
                  This context lets our AI calibrate feedback specifically for your background.
                  First-gen? Low-income? International? We adjust our analysis accordingly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IntakeForm
                  onComplete={handleIntakeComplete}
                  onSkip={() => {
                    // Create minimal intake and proceed
                    setIntake({
                      demographics: {
                        isFirstGen: false,
                        familyEducationLevel: 'bachelors',
                        isInternational: false,
                        geographicContext: 'suburban',
                        schoolType: 'public',
                        familyResponsibilities: ['none'],
                      },
                      academic: {
                        intendedMajor: 'Undecided',
                        academicInterests: [],
                      },
                      activities: {
                        spike: '',
                        topActivities: [],
                        leadershipRoles: [],
                      },
                      personal: {
                        identityFactors: [],
                      },
                      essayContext: {
                        targetSchool: selectedSchool!,
                        essayType: 'supplemental',
                        essayPrompt: '',
                        wordLimit: 650,
                        biggestConcern: 'school_fit',
                        draftNumber: 'first',
                      },
                      voice: {
                        toneSample: '',
                        writingStyle: 'conversational',
                        usesHumor: false,
                      },
                    } as StudentIntake);
                    setStep('essays');
                  }}
                  targetSchool={selectedSchool!}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Essay Upload */}
        {step === 'essays' && selectedSchool && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: selectedSchoolInfo?.color }}
              >
                {selectedSchoolInfo?.name[0]}
              </div>
              <div>
                <h2 className="font-semibold">Upload Your {selectedSchoolInfo?.name} Essays</h2>
                <p className="text-sm text-neutral-500">Add all essays for this school</p>
              </div>
            </div>

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-4">
                  <p className="text-red-700">{error}</p>
                </CardContent>
              </Card>
            )}

            <IvyPortfolioUpload
              selectedSchools={[selectedSchool]}
              essaysBySchool={{ [selectedSchool]: essays }}
              onEssaysUpdate={handleEssaysUpdate}
            />

            <div className="flex justify-between items-center pt-4">
              <p className="text-sm text-neutral-500">
                {essays.length} essay{essays.length !== 1 ? 's' : ''} ready
              </p>
              <Button
                size="lg"
                onClick={runAnalysis}
                disabled={!canProceedToAnalysis}
              >
                <Sparkles className="w-4 h-4" />
                Analyze My Essays (Free)
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Analyzing */}
        {step === 'analyzing' && (
          <div className="max-w-xl mx-auto text-center">
            <Card>
              <CardContent className="py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-100 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  Analyzing Your Essays...
                </h2>
                <p className="text-neutral-600 mb-6">
                  Our AI is reviewing your essays from {selectedSchoolInfo?.name}&apos;s AO perspective
                </p>
                <div className="space-y-2 text-sm text-neutral-500">
                  <p>Checking for &quot;resume essay&quot; patterns...</p>
                  <p>Running the &quot;So What?&quot; test...</p>
                  <p>Evaluating school fit signals...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Results (BLURRED with Paywall) */}
        {step === 'results' && analysisResult && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Score Teaser - Visible */}
            <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-white">
              <CardContent className="py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                      Your {selectedSchoolInfo?.name} Analysis is Ready!
                    </h2>
                    <p className="text-neutral-600">
                      We found <span className="font-semibold text-brand-600">
                        {analysisResult.issueCount || 5} specific issues
                      </span> to improve
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-brand-600">
                      {analysisResult.overallScore || 72}
                    </div>
                    <p className="text-sm text-neutral-500">Overall Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blurred Results Preview */}
            <div className="relative">
              {/* Blur Overlay */}
              <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center">
                <div className="text-center max-w-md px-6">
                  <Lock className="w-12 h-12 text-brand-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                    Unlock Your Full Analysis
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    See exactly what AOs will think, line-by-line feedback, and how to fix each issue.
                  </p>

                  {/* Pricing Options */}
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={() => handleUnlock('quick')}
                    >
                      <Eye className="w-4 h-4" />
                      Unlock for $9.99
                    </Button>

                    <p className="text-xs text-neutral-500">
                      Or upgrade for more features:
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlock('standard')}
                      >
                        Full Analysis - $79
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlock('ivy_single')}
                      >
                        Ivy Deep Dive - $39
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blurred Content (teaser) */}
              <Card className="select-none">
                <CardHeader>
                  <CardTitle>Detailed Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Fake blurred sections */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">AO First Impression</h4>
                      <div className="h-4 bg-neutral-200 rounded w-full" />
                      <div className="h-4 bg-neutral-200 rounded w-3/4 mt-2" />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Top Issues to Fix</h4>
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3 items-start mb-3">
                          <div className="w-6 h-6 rounded-full bg-amber-200" />
                          <div className="flex-1">
                            <div className="h-4 bg-neutral-200 rounded w-full" />
                            <div className="h-3 bg-neutral-100 rounded w-2/3 mt-2" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">School-Specific Feedback</h4>
                      <div className="h-4 bg-neutral-200 rounded w-full" />
                      <div className="h-4 bg-neutral-200 rounded w-5/6 mt-2" />
                      <div className="h-4 bg-neutral-200 rounded w-4/5 mt-2" />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Line-by-Line Suggestions</h4>
                      <div className="border rounded-lg p-4">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-3 bg-neutral-100 rounded mb-2" style={{ width: `${80 + Math.random() * 20}%` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* What you get */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What You&apos;ll Unlock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  {[
                    'AO first impression & honest assessment',
                    '"So What?" test - does your essay reveal something?',
                    'Resume-essay detection (common killer)',
                    'School-specific fit signals',
                    'Top 5 issues ranked by impact',
                    'Line-by-line suggestions',
                    'Strength highlights to keep',
                    'Committee pitch readiness check',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4 border-t pt-6">
                <Button size="lg" className="w-full" onClick={() => handleUnlock('quick')}>
                  <Eye className="w-4 h-4" />
                  Unlock Full Analysis - $9.99
                </Button>
                <p className="text-xs text-neutral-500 text-center">
                  Secure payment via Stripe. 100% money-back guarantee if not satisfied.
                </p>
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
