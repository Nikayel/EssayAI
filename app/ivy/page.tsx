'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IvySchoolSelector, IVY_SCHOOLS } from '@/components/ivy/school-selector';
import { IvyPortfolioUpload } from '@/components/ivy/portfolio-upload';
import { PRICING, PACKAGE_INFO } from '@/lib/stripe/config';
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
} from 'lucide-react';

type IvyTier = 'ivy_single' | 'ivy_bundle_3' | 'ivy_bundle_8';

interface TierOption {
  id: IvyTier;
  name: string;
  price: number;
  schoolsIncluded: number;
  description: string;
  features: string[];
  popular?: boolean;
  bestValue?: boolean;
}

const TIER_OPTIONS: TierOption[] = [
  {
    id: 'ivy_single',
    name: 'Single School',
    price: PRICING.IVY_SINGLE,
    schoolsIncluded: 1,
    description: 'Complete analysis for ONE Ivy League school',
    features: [
      'ALL essays for this school analyzed',
      'School-specific AO perspective',
      'Portfolio coherence analysis',
      'Resume-essay detection',
      '"So What?" test on each essay',
      'Instant reject signal detection',
    ],
  },
  {
    id: 'ivy_bundle_3',
    name: '3-School Bundle',
    price: PRICING.IVY_BUNDLE_3,
    schoolsIncluded: 3,
    description: 'Complete analysis for THREE Ivy League schools',
    features: [
      'Everything in Single School x3',
      'Cross-school narrative consistency',
      'Strategic differentiation tips',
      'Portfolio comparison across schools',
      'Save $38 vs buying individually',
    ],
    popular: true,
  },
  {
    id: 'ivy_bundle_8',
    name: 'Complete Ivy',
    price: PRICING.IVY_BUNDLE_8,
    schoolsIncluded: 8,
    description: 'All 8 Ivy League schools covered',
    features: [
      'Everything for ALL 8 schools',
      'Master narrative tracking',
      'Full cross-school analysis',
      'Best value for serious applicants',
      'Save $163 vs buying individually',
    ],
    bestValue: true,
  },
];

type Step = 'tier' | 'schools' | 'essays' | 'review';

export default function IvyTierSelectorPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('tier');
  const [selectedTier, setSelectedTier] = useState<IvyTier | null>(null);
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]);
  const [essaysBySchool, setEssaysBySchool] = useState<Record<string, { promptId: string; content: string }[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTier = TIER_OPTIONS.find(t => t.id === selectedTier);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`;

  const canProceedToSchools = selectedTier !== null;
  const canProceedToEssays = selectedSchools.length === (currentTier?.schoolsIncluded || 0);
  const canProceedToReview = Object.keys(essaysBySchool).length === selectedSchools.length &&
    Object.values(essaysBySchool).every(essays => essays.length > 0);

  const handleTierSelect = (tierId: IvyTier) => {
    setSelectedTier(tierId);
    // Reset schools if changing tier
    if (tierId === 'ivy_bundle_8') {
      setSelectedSchools(IVY_SCHOOLS.map(s => s.id));
    } else {
      setSelectedSchools([]);
    }
    setEssaysBySchool({});
  };

  const handleSchoolsChange = (schools: string[]) => {
    const tier = TIER_OPTIONS.find(t => t.id === selectedTier);
    if (tier && schools.length <= tier.schoolsIncluded) {
      setSelectedSchools(schools);
      // Remove essays for unselected schools
      const newEssaysBySchool = { ...essaysBySchool };
      Object.keys(newEssaysBySchool).forEach(schoolId => {
        if (!schools.includes(schoolId)) {
          delete newEssaysBySchool[schoolId];
        }
      });
      setEssaysBySchool(newEssaysBySchool);
    }
  };

  const handleEssaysUpdate = (schoolId: string, essays: { promptId: string; content: string }[]) => {
    setEssaysBySchool(prev => ({
      ...prev,
      [schoolId]: essays,
    }));
  };

  const handleCheckout = async () => {
    if (!selectedTier || !canProceedToReview) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tiered-analysis/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          schools: selectedSchools,
          essaysBySchool,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 'schools') setStep('tier');
    else if (step === 'essays') setStep('schools');
    else if (step === 'review') setStep('essays');
  };

  const goForward = () => {
    if (step === 'tier' && canProceedToSchools) setStep('schools');
    else if (step === 'schools' && canProceedToEssays) setStep('essays');
    else if (step === 'essays' && canProceedToReview) setStep('review');
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
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          {(['tier', 'schools', 'essays', 'review'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors',
                  step === s
                    ? 'bg-brand-600 text-white'
                    : ['tier', 'schools', 'essays', 'review'].indexOf(step) > i
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-neutral-100 text-neutral-400'
                )}
              >
                {i + 1}
              </div>
              <span
                className={cn(
                  'ml-2 text-sm hidden md:block',
                  step === s ? 'text-brand-700 font-medium' : 'text-neutral-500'
                )}
              >
                {s === 'tier' && 'Choose Plan'}
                {s === 'schools' && 'Select Schools'}
                {s === 'essays' && 'Upload Essays'}
                {s === 'review' && 'Review & Pay'}
              </span>
              {i < 3 && <ChevronRight className="w-4 h-4 text-neutral-300 mx-2 md:mx-4" />}
            </div>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Step 1: Tier Selection */}
        {step === 'tier' && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <Badge variant="default" size="lg" className="mb-4">
                <School className="w-3.5 h-3.5" />
                Ivy League Analysis
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                Choose Your Ivy Package
              </h1>
              <p className="text-lg text-neutral-600">
                Get school-specific feedback from the perspective of actual admissions officers.
                Every essay analyzed as a cohesive portfolio.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {TIER_OPTIONS.map((tier) => (
                <Card
                  key={tier.id}
                  className={cn(
                    'relative cursor-pointer transition-all',
                    selectedTier === tier.id
                      ? 'border-2 border-brand-500 ring-4 ring-brand-500/20'
                      : 'border-2 border-transparent hover:border-brand-300',
                    tier.popular && 'md:-my-2 shadow-xl shadow-brand-500/10',
                    tier.bestValue && 'bg-gradient-to-b from-amber-50/50 to-white'
                  )}
                  onClick={() => handleTierSelect(tier.id)}
                >
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}
                  {tier.bestValue && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Best Value
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <div
                      className={cn(
                        'w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center',
                        tier.popular
                          ? 'bg-gradient-to-br from-brand-500 to-brand-600'
                          : tier.bestValue
                          ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                          : 'bg-neutral-100'
                      )}
                    >
                      {tier.schoolsIncluded === 1 && <School className={cn('w-6 h-6', tier.popular || tier.bestValue ? 'text-white' : 'text-neutral-600')} />}
                      {tier.schoolsIncluded === 3 && <Users className={cn('w-6 h-6', tier.popular || tier.bestValue ? 'text-white' : 'text-neutral-600')} />}
                      {tier.schoolsIncluded === 8 && <Sparkles className={cn('w-6 h-6', tier.popular || tier.bestValue ? 'text-white' : 'text-neutral-600')} />}
                    </div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="text-4xl font-bold mt-4">{formatPrice(tier.price)}</div>
                    <p className="text-sm text-neutral-500">
                      {tier.schoolsIncluded === 1 ? '1 school' : `${tier.schoolsIncluded} schools`}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-4">
                    <ul className="space-y-2">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={selectedTier === tier.id ? 'default' : 'outline'}
                    >
                      {selectedTier === tier.id ? 'Selected' : 'Select'}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={goForward}
                disabled={!canProceedToSchools}
              >
                Continue to School Selection
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: School Selection */}
        {step === 'schools' && currentTier && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Select Your {currentTier.schoolsIncluded === 1 ? 'School' : 'Schools'}
              </h1>
              <p className="text-neutral-600">
                {currentTier.schoolsIncluded === 8
                  ? 'All 8 Ivy League schools are included'
                  : `Choose ${currentTier.schoolsIncluded} ${currentTier.schoolsIncluded === 1 ? 'school' : 'schools'} for your analysis`}
              </p>
            </div>

            <IvySchoolSelector
              selectedSchool={selectedSchools[0] || null}
              onSelect={(schoolId) => {
                if (currentTier.schoolsIncluded === 1) {
                  setSelectedSchools([schoolId]);
                }
              }}
              mode={currentTier.schoolsIncluded > 1 ? 'multi' : 'single'}
              selectedSchools={selectedSchools}
              onMultiSelect={handleSchoolsChange}
              disabled={currentTier.schoolsIncluded === 8}
            />

            {currentTier.schoolsIncluded > 1 && currentTier.schoolsIncluded < 8 && (
              <p className="text-center text-sm text-neutral-500">
                {selectedSchools.length} of {currentTier.schoolsIncluded} schools selected
              </p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={goForward} disabled={!canProceedToEssays}>
                Continue to Essays
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Essay Upload */}
        {step === 'essays' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Upload Your Essays
              </h1>
              <p className="text-neutral-600">
                Add all essays for each school. We&apos;ll analyze them as a cohesive portfolio.
              </p>
            </div>

            <IvyPortfolioUpload
              selectedSchools={selectedSchools}
              essaysBySchool={essaysBySchool}
              onEssaysUpdate={handleEssaysUpdate}
            />

            <div className="flex justify-between">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={goForward} disabled={!canProceedToReview}>
                Review Order
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Checkout */}
        {step === 'review' && currentTier && (
          <div className="space-y-8 max-w-3xl mx-auto">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Review Your Order
              </h1>
              <p className="text-neutral-600">
                Confirm your selections before proceeding to payment.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Package */}
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <p className="font-medium">{currentTier.name}</p>
                    <p className="text-sm text-neutral-500">{currentTier.description}</p>
                  </div>
                  <p className="text-xl font-bold">{formatPrice(currentTier.price)}</p>
                </div>

                {/* Schools */}
                <div>
                  <p className="font-medium mb-3">Selected Schools ({selectedSchools.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSchools.map((schoolId) => {
                      const school = IVY_SCHOOLS.find(s => s.id === schoolId);
                      return (
                        <Badge key={schoolId} variant="secondary">
                          {school?.name || schoolId}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Essays */}
                <div>
                  <p className="font-medium mb-3">Essays to Analyze</p>
                  <div className="space-y-2">
                    {selectedSchools.map((schoolId) => {
                      const school = IVY_SCHOOLS.find(s => s.id === schoolId);
                      const essays = essaysBySchool[schoolId] || [];
                      return (
                        <div key={schoolId} className="flex items-center gap-3 text-sm">
                          <FileText className="w-4 h-4 text-neutral-400" />
                          <span>{school?.name}</span>
                          <span className="text-neutral-400">-</span>
                          <span className="text-neutral-500">{essays.length} essay{essays.length !== 1 ? 's' : ''}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* What you get */}
                <div className="bg-brand-50 rounded-xl p-4">
                  <p className="font-medium mb-3 text-brand-900">What&apos;s Included</p>
                  <ul className="space-y-2">
                    {currentTier.features.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex gap-2 text-sm text-brand-800">
                        <Check className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-4">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Secure Checkout - {formatPrice(currentTier.price)}
                    </>
                  )}
                </Button>
                <p className="text-xs text-neutral-500 text-center">
                  Secure payment powered by Stripe. Your essay is never shared or used to train AI.
                </p>
              </CardFooter>
            </Card>

            <div className="flex justify-start">
              <Button variant="outline" onClick={goBack}>
                <ArrowLeft className="w-4 h-4" />
                Back to Essays
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
