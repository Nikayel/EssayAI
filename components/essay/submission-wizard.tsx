'use client';

/**
 * Essay Submission Wizard
 *
 * 4-Step Flow:
 * 1. Basic Info (essay type, school, prompt)
 * 2. Essay Content (paste essay)
 * 3. Quick Intake (personalization - spike, activities, background)
 * 4. Package Selection (Quick $9.99, Ivy Single $39, Ivy 3-Pack $79, Premium $249)
 *
 * Uses tiered-analysis checkout API to process payment and store intake data.
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { QuickIntakeForm } from '@/components/intake/quick-intake-form';
import type { QuickIntake } from '@/lib/scoring/tiers/types';
import { Check, Sparkles, Star, Crown, Zap } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

type AnalysisTier = 'quick' | 'ivy_single' | 'ivy_bundle_3' | 'premium';

interface TierOption {
  id: AnalysisTier;
  name: string;
  price: number;
  description: string;
  features: string[];
  badge?: string;
  icon: React.ReactNode;
  popular?: boolean;
}

const TIER_OPTIONS: TierOption[] = [
  {
    id: 'quick',
    name: 'Quick Score',
    price: 9.99,
    description: 'Personalized feedback using YOUR spike & activities',
    icon: <Zap className="w-5 h-5" />,
    features: [
      'Overall score (0-100)',
      'Top 5 critical issues',
      'Resume-essay detection',
      'Personalized to YOUR story',
    ],
  },
  {
    id: 'ivy_single',
    name: 'Full Analysis',
    price: 39,
    description: 'Complete analysis with line-by-line feedback',
    icon: <Sparkles className="w-5 h-5" />,
    popular: true,
    badge: 'Most Popular',
    features: [
      'Everything in Quick',
      'Line-by-line annotations',
      'School-fit analysis',
      'AO perspective simulation',
      '"So What?" test on each paragraph',
      'Rewrite suggestions',
    ],
  },
  {
    id: 'ivy_bundle_3',
    name: '3-School Bundle',
    price: 79,
    description: 'Full analysis for 3 different schools',
    icon: <Star className="w-5 h-5" />,
    badge: 'Best Value',
    features: [
      'Everything in Full Analysis',
      'Tailored for 3 schools',
      'Cross-school narrative check',
      'Strategic differentiation tips',
      'Save $38 vs individual',
    ],
  },
  {
    id: 'premium',
    name: 'Premium + Expert',
    price: 249,
    description: 'AI analysis + human expert review',
    icon: <Crown className="w-5 h-5" />,
    features: [
      'Everything in 3-School Bundle',
      'Former AO human review',
      'Detailed margin comments',
      'Video feedback option',
      '48-hour turnaround',
    ],
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function EssaySubmissionWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Read URL params for pre-filling from portfolio
  const schoolFromUrl = searchParams.get('school') || '';
  const schoolIdFromUrl = searchParams.get('schoolId') || '';

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    essayType: 'PERSONAL_STATEMENT',
    targetSchool: '',
    targetSchoolId: '', // Links to portfolio TargetSchool
    wordLimit: 650,
    prompt: '',

    // Step 2: Essay Content
    content: '',

    // Step 3: Quick Intake (filled by QuickIntakeForm)
    intake: null as QuickIntake | null,

    // Step 4: Package Selection
    tier: 'ivy_single' as AnalysisTier,
  });

  // Pre-fill from URL params on mount
  useEffect(() => {
    if (schoolFromUrl || schoolIdFromUrl) {
      setFormData(prev => ({
        ...prev,
        targetSchool: schoolFromUrl || prev.targetSchool,
        targetSchoolId: schoolIdFromUrl || prev.targetSchoolId,
      }));
    }
  }, [schoolFromUrl, schoolIdFromUrl]);

  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const countWords = (text: string) => {
    const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(count);
    return count;
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    updateField('content', text);
    countWords(text);
  };

  const handleIntakeComplete = (intake: QuickIntake) => {
    setFormData(prev => ({ ...prev, intake }));
    setStep(4); // Move to package selection
  };

  const handleIntakeSkip = () => {
    // Create minimal intake with just the school from step 1
    const minimalIntake: QuickIntake = {
      targetSchool: formData.targetSchool,
      essayType: formData.essayType.toLowerCase(),
      wordLimit: formData.wordLimit,
    };
    setFormData(prev => ({ ...prev, intake: minimalIntake }));
    setStep(4);
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.essayType && formData.prompt.length > 10;
    }
    if (step === 2) {
      return formData.content.length > 50 && wordCount <= (formData.wordLimit || 1000);
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.intake) {
      alert('Please complete the personalization step first.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the new tiered-analysis checkout API
      const checkoutRes = await fetch('/api/tiered-analysis/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: formData.tier,
          essayText: formData.content,
          intake: {
            ...formData.intake,
            // Include essay prompt in intake for context
            essayPrompt: formData.prompt,
            wordLimit: formData.wordLimit,
          },
        }),
      });

      if (!checkoutRes.ok) {
        const error = await checkoutRes.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const { checkoutUrl } = await checkoutRes.json();
      window.location.href = checkoutUrl; // Redirect to Stripe
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit essay. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================================================
  // STEP LABELS
  // =============================================================================

  const getStepLabel = (s: number) => {
    switch (s) {
      case 1: return 'Basic Information';
      case 2: return 'Your Essay';
      case 3: return 'Personalize';
      case 4: return 'Choose Package';
      default: return '';
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-4">
      {/* Progress Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Step {step} of {totalSteps}
          </span>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {getStepLabel(step)}
          </span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        {/* Step dots */}
        <div className="flex justify-between mt-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex items-center gap-1 text-xs ${
                s <= step ? 'text-brand-600' : 'text-neutral-400'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  s < step
                    ? 'bg-brand-600'
                    : s === step
                    ? 'bg-brand-600 ring-2 ring-brand-200'
                    : 'bg-neutral-300'
                }`}
              />
              <span className="hidden sm:inline">{getStepLabel(s)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your essay</CardTitle>
            <CardDescription>This helps our AI give you better feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="essayType">Essay Type</Label>
              <select
                id="essayType"
                className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                value={formData.essayType}
                onChange={(e) => updateField('essayType', e.target.value)}
              >
                <option value="PERSONAL_STATEMENT">Personal Statement (Common App)</option>
                <option value="WHY_US">Why This School?</option>
                <option value="SUPPLEMENTAL">Supplemental Essay</option>
                <option value="ACTIVITY">Activity Description</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="targetSchool">Target School (Optional)</Label>
              <Input
                id="targetSchool"
                placeholder="e.g., Stanford, MIT, Harvard"
                value={formData.targetSchool}
                onChange={(e) => updateField('targetSchool', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="wordLimit">Word Limit</Label>
              <Input
                id="wordLimit"
                type="number"
                placeholder="650"
                value={formData.wordLimit}
                onChange={(e) => updateField('wordLimit', parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="prompt">Essay Prompt *</Label>
              <textarea
                id="prompt"
                className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px] bg-background"
                placeholder="Paste your essay prompt here. Example: 'The lessons we take from obstacles we encounter can be fundamental to later success...'"
                value={formData.prompt}
                onChange={(e) => updateField('prompt', e.target.value)}
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Providing the exact prompt helps us evaluate relevance and alignment
              </p>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full"
              disabled={!canProceed()}
            >
              Next: Add Your Essay
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Essay Content */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Paste your essay</CardTitle>
            <CardDescription>
              Don't worry about perfection - we'll help you improve it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content">Essay Content *</Label>
              <textarea
                id="content"
                className="w-full mt-1 px-3 py-2 border rounded-md min-h-[200px] sm:min-h-[400px] font-serif bg-background"
                placeholder="Start typing or paste your essay here..."
                value={formData.content}
                onChange={handleContentChange}
              />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Word Count: <span className={wordCount > (formData.wordLimit || 1000) ? 'text-error-600 font-semibold' : 'font-semibold'}>{wordCount}</span> / {formData.wordLimit || 1000}
                </span>
                {wordCount > (formData.wordLimit || 1000) && (
                  <span className="text-sm text-error-600">
                    Over limit by {wordCount - (formData.wordLimit || 1000)} words
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1"
                disabled={!canProceed()}
              >
                Next: Personalize Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Quick Intake Form */}
      {step === 3 && (
        <div className="space-y-4">
          <Button
            onClick={() => setStep(2)}
            variant="ghost"
            className="mb-2"
          >
            ← Back to essay
          </Button>

          <QuickIntakeForm
            initialData={{
              targetSchool: formData.targetSchool,
              essayType: formData.essayType.toLowerCase(),
              wordLimit: formData.wordLimit,
            }}
            targetSchool={formData.targetSchool || undefined}
            onComplete={handleIntakeComplete}
            onSkip={handleIntakeSkip}
          />
        </div>
      )}

      {/* Step 4: Package Selection */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose your analysis</CardTitle>
            <CardDescription>
              Your feedback will be personalized based on your spike & activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tier Options */}
            <div className="grid gap-4">
              {TIER_OPTIONS.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.tier === tier.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
                  }`}
                  onClick={() => updateField('tier', tier.id)}
                >
                  {tier.badge && (
                    <Badge
                      className={`absolute -top-2 right-4 ${
                        tier.popular ? 'bg-brand-600' : 'bg-accent-600'
                      }`}
                    >
                      {tier.badge}
                    </Badge>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1.5 rounded-lg ${
                          formData.tier === tier.id
                            ? 'bg-brand-100 text-brand-600'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {tier.icon}
                        </div>
                        <h3 className="font-semibold text-lg">{tier.name}</h3>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {tier.description}
                      </p>
                      <ul className="text-sm space-y-1 text-neutral-700 dark:text-neutral-300">
                        {tier.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-brand-500 mt-0.5 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ${tier.price < 10 ? tier.price.toFixed(2) : tier.price}
                      </div>
                      <div className="text-xs text-neutral-500">one-time</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Personalization indicator */}
            {formData.intake?.spike && (
              <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg">
                <p className="text-sm text-brand-800">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  <strong>Personalized for:</strong> "{formData.intake.spike.slice(0, 60)}..."
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setStep(3)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : `Continue to Payment - $${
                  TIER_OPTIONS.find(t => t.id === formData.tier)?.price || 39
                }`}
              </Button>
            </div>

            <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
              Secure payment via Stripe. Analysis starts immediately after payment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
