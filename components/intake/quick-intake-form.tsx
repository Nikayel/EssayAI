'use client';

/**
 * Quick Intake Form - Collects context BEFORE payment
 *
 * Strategy: More questions = more sunk cost = higher conversion
 * BUT also = better RAG personalization = happier customers
 *
 * Collects:
 * - Target school + essay type (required)
 * - Spike/main angle (required - makes feedback personalized)
 * - Top activities (required - detects resume-essay patterns)
 * - Intended major (required - for school fit analysis)
 * - Biggest challenge (recommended - personalizes tone)
 * - Why this school (for Why School essays only)
 * - First-gen/international status (visible, not hidden)
 * - Draft status (helps calibrate feedback intensity)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Users,
  Plus,
  X,
  Lightbulb,
  GraduationCap,
  Heart,
  School,
  CheckCircle2,
} from 'lucide-react';
import type { QuickIntake } from '@/lib/scoring/tiers/types';
import { cn } from '@/lib/utils/cn';

// =============================================================================
// TYPES
// =============================================================================

interface QuickIntakeFormProps {
  initialData?: Partial<QuickIntake>;
  targetSchool?: string;
  onComplete: (intake: QuickIntake) => void;
  onSkip?: () => void;
  className?: string;
}

const ESSAY_TYPES = [
  { value: 'personal_statement', label: 'Personal Statement (Common App)' },
  { value: 'why_school', label: '"Why This School?" Essay' },
  { value: 'supplemental', label: 'Supplemental Essay' },
  { value: 'diversity', label: 'Diversity / Background Essay' },
  { value: 'activity', label: 'Activity / Extracurricular Essay' },
  { value: 'intellectual', label: 'Intellectual Curiosity Essay' },
  { value: 'community', label: 'Community / Impact Essay' },
  { value: 'other', label: 'Other' },
];

const DRAFT_STATUS = [
  { value: 'first_draft', label: 'First draft - be brutally honest' },
  { value: 'revised', label: 'Revised a few times - need fresh eyes' },
  { value: 'final_polish', label: 'Almost done - just need final tweaks' },
];

const COMMON_MAJORS = [
  'Computer Science',
  'Engineering',
  'Business / Economics',
  'Biology / Pre-Med',
  'Psychology',
  'Political Science',
  'English / Literature',
  'Mathematics',
  'Chemistry',
  'Physics',
  'History',
  'Art / Design',
  'Communications',
  'Nursing',
  'Education',
  'Undecided',
  'Other',
];

// =============================================================================
// COMPONENT
// =============================================================================

export function QuickIntakeForm({
  initialData,
  targetSchool,
  onComplete,
  onSkip,
  className,
}: QuickIntakeFormProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const [formData, setFormData] = useState<Partial<QuickIntake> & {
    whyThisSchool?: string;
    biggestChallenge?: string;
    intendedMajor?: string;
  }>({
    targetSchool: targetSchool || initialData?.targetSchool || '',
    essayType: initialData?.essayType || 'personal_statement',
    spike: initialData?.spike || '',
    topActivities: initialData?.topActivities || [],
    draftStatus: initialData?.draftStatus || 'first_draft',
    isFirstGen: initialData?.isFirstGen || false,
    isInternational: initialData?.isInternational || false,
    wordLimit: initialData?.wordLimit || 650,
    intendedMajor: initialData?.intendedMajor || '',
    whyThisSchool: '',
    biggestChallenge: '',
  });

  const [newActivity, setNewActivity] = useState('');

  // Show "Why this school" field only for relevant essay types
  const showWhyThisSchool = ['why_school', 'supplemental'].includes(formData.essayType || '');

  // Calculate progress
  const progress = (step / totalSteps) * 100;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const intake: QuickIntake = {
      targetSchool: formData.targetSchool || '',
      essayType: formData.essayType || 'personal_statement',
      spike: formData.spike,
      topActivities: formData.topActivities,
      draftStatus: formData.draftStatus,
      isFirstGen: formData.isFirstGen,
      isInternational: formData.isInternational,
      wordLimit: formData.wordLimit,
      intendedMajor: formData.intendedMajor,
      // Include extra context in spike if provided
      ...(formData.biggestChallenge && {
        spike: `${formData.spike || ''}\n\nBiggest challenge: ${formData.biggestChallenge}`.trim(),
      }),
      ...(formData.whyThisSchool && {
        spike: `${formData.spike || ''}\n\nWhy ${formData.targetSchool}: ${formData.whyThisSchool}`.trim(),
      }),
    };

    onComplete(intake);
  };

  const handleAddActivity = () => {
    if (newActivity.trim() && (formData.topActivities?.length || 0) < 5) {
      setFormData(prev => ({
        ...prev,
        topActivities: [...(prev.topActivities || []), newActivity.trim()],
      }));
      setNewActivity('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topActivities: prev.topActivities?.filter((_, i) => i !== index),
    }));
  };

  const canProceedStep1 = formData.targetSchool && formData.essayType && formData.intendedMajor;
  const canProceedStep2 = formData.spike && (formData.topActivities?.length || 0) >= 1;

  return (
    <Card className={cn('w-full max-w-xl', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/30">
              <Target className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <Badge variant="outline" className="text-xs">
              Step {step} of {totalSteps}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground">~60 seconds</span>
        </div>
        <Progress value={progress} className="h-1.5 mb-3" />
        <CardTitle>
          {step === 1 ? 'About Your Application' : 'Your Story & Strengths'}
        </CardTitle>
        <CardDescription>
          {step === 1
            ? 'This helps us tailor feedback to your specific situation'
            : 'Help us check if your essay connects to YOUR unique narrative'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ============================================================= */}
          {/* STEP 1: Basic Context */}
          {/* ============================================================= */}
          {step === 1 && (
            <>
              {/* Target School */}
              {!targetSchool && (
                <div className="space-y-2">
                  <Label htmlFor="targetSchool" className="flex items-center gap-2">
                    <School className="w-4 h-4 text-muted-foreground" />
                    Target School *
                  </Label>
                  <Input
                    id="targetSchool"
                    placeholder="e.g., Harvard, Stanford, MIT"
                    value={formData.targetSchool}
                    onChange={e => setFormData(prev => ({ ...prev, targetSchool: e.target.value }))}
                    required
                  />
                </div>
              )}

              {/* Essay Type */}
              <div className="space-y-2">
                <Label htmlFor="essayType">Essay Type *</Label>
                <Select
                  value={formData.essayType}
                  onValueChange={value => setFormData(prev => ({ ...prev, essayType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select essay type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESSAY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Intended Major */}
              <div className="space-y-2">
                <Label htmlFor="intendedMajor" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                  Intended Major *
                </Label>
                <Select
                  value={formData.intendedMajor}
                  onValueChange={value => setFormData(prev => ({ ...prev, intendedMajor: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your intended major" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_MAJORS.map(major => (
                      <SelectItem key={major} value={major.toLowerCase().replace(/\s+/g, '_')}>
                        {major}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Helps us check if your essay aligns with your academic interests
                </p>
              </div>

              {/* Draft Status */}
              <div className="space-y-2">
                <Label htmlFor="draftStatus">Where are you in the writing process?</Label>
                <Select
                  value={formData.draftStatus}
                  onValueChange={value => setFormData(prev => ({ ...prev, draftStatus: value as QuickIntake['draftStatus'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select draft status" />
                  </SelectTrigger>
                  <SelectContent>
                    {DRAFT_STATUS.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Background Checkboxes - Now visible by default */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <p className="text-sm font-medium">Background (helps us calibrate feedback)</p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFirstGen"
                    checked={formData.isFirstGen}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isFirstGen: !!checked }))}
                  />
                  <Label htmlFor="isFirstGen" className="text-sm font-normal cursor-pointer">
                    I&apos;m a first-generation college student
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isInternational"
                    checked={formData.isInternational}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isInternational: !!checked }))}
                  />
                  <Label htmlFor="isInternational" className="text-sm font-normal cursor-pointer">
                    I&apos;m an international student
                  </Label>
                </div>
              </div>

              {/* Next Button */}
              <Button
                type="button"
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {/* ============================================================= */}
          {/* STEP 2: Personal Story */}
          {/* ============================================================= */}
          {step === 2 && (
            <>
              {/* Spike (Main Angle) - Now required */}
              <div className="space-y-2">
                <Label htmlFor="spike" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Your Main Angle / "Spike" *
                </Label>
                <Textarea
                  id="spike"
                  placeholder="What's the central theme of your application? e.g., 'Environmental activism - I started a recycling program that my school district adopted'"
                  value={formData.spike || ''}
                  onChange={e => setFormData(prev => ({ ...prev, spike: e.target.value }))}
                  className="min-h-[80px]"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  AOs look for a cohesive narrative. We&apos;ll check if your essay reinforces this theme.
                </p>
              </div>

              {/* Top Activities - Now required (at least 1) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Your Top Activities * (add at least 1)
                </Label>

                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Captain of debate team, Founded coding club"
                    value={newActivity}
                    onChange={e => setNewActivity(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                    disabled={(formData.topActivities?.length || 0) >= 5}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddActivity}
                    disabled={(formData.topActivities?.length || 0) >= 5 || !newActivity.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.topActivities && formData.topActivities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.topActivities.map((activity, i) => (
                      <Badge key={i} variant="secondary" className="pr-1 py-1">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                        {activity}
                        <button
                          type="button"
                          onClick={() => handleRemoveActivity(i)}
                          className="ml-1.5 hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  We&apos;ll flag if your essay just lists achievements instead of showing depth.
                </p>
              </div>

              {/* Why This School - Only for relevant essays */}
              {showWhyThisSchool && formData.targetSchool && (
                <div className="space-y-2">
                  <Label htmlFor="whyThisSchool" className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    Why {formData.targetSchool} specifically?
                  </Label>
                  <Textarea
                    id="whyThisSchool"
                    placeholder={`What specifically about ${formData.targetSchool} excites you? (programs, professors, culture, opportunities)`}
                    value={formData.whyThisSchool || ''}
                    onChange={e => setFormData(prev => ({ ...prev, whyThisSchool: e.target.value }))}
                    className="min-h-[70px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll check if your essay mentions specific, researched details about the school.
                  </p>
                </div>
              )}

              {/* Biggest Challenge - Recommended */}
              <div className="space-y-2">
                <Label htmlFor="biggestChallenge" className="flex items-center gap-2">
                  Biggest challenge you&apos;ve faced
                  <Badge variant="outline" className="text-xs">Recommended</Badge>
                </Label>
                <Textarea
                  id="biggestChallenge"
                  placeholder="A significant obstacle or hardship you've overcome (optional but helps personalize feedback)"
                  value={formData.biggestChallenge || ''}
                  onChange={e => setFormData(prev => ({ ...prev, biggestChallenge: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>

              {/* Value Prop Reminder */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>This info makes your feedback 10x better.</strong> Generic advice is useless -
                  we use this to tell you if YOUR essay connects to YOUR specific story.
                </p>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!canProceedStep2}
                >
                  Get Personalized Feedback
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSkip}
                  className="w-full text-muted-foreground"
                >
                  Skip personalization (not recommended)
                </Button>
              )}
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default QuickIntakeForm;
