'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Calendar, GraduationCap, Target, Sparkles, AlertCircle, Users, Plus, X } from 'lucide-react';

interface TargetSchoolInput {
  schoolName: string;
  deadlineType: string;
  deadline: string;
}

interface OnboardingData {
  graduationYear: number | null;
  spike: string;
  topActivities: string[];
  biggestWorry: string;
  previousReviews: boolean | null;
  howHeardAboutUs: string;
  targetSchools: TargetSchoolInput[];
}

const GRADUATION_YEARS = [2025, 2026, 2027, 2028];

const DEADLINE_TYPES = [
  { value: 'EARLY_DECISION', label: 'Early Decision (Binding)' },
  { value: 'EARLY_ACTION', label: 'Early Action' },
  { value: 'RESTRICTIVE_EA', label: 'Restrictive Early Action' },
  { value: 'REGULAR_DECISION', label: 'Regular Decision' },
  { value: 'ROLLING', label: 'Rolling Admissions' },
];

const WORRY_OPTIONS = [
  'My essay is too generic/boring',
  'I don\'t know what makes me unique',
  'I\'m worried about my "hook" or angle',
  'I can\'t fit everything in the word limit',
  'I don\'t sound authentic',
  'I\'m not sure if my topic is strong enough',
  'Running out of time before deadline',
  'Other',
];

const SOURCE_OPTIONS = [
  'Google search',
  'Friend/classmate recommendation',
  'School counselor',
  'Parent recommendation',
  'Reddit/College Confidential',
  'TikTok/Instagram/YouTube',
  'Other',
];

const IVY_SCHOOLS = [
  'Harvard', 'Yale', 'Princeton', 'Columbia',
  'UPenn', 'Dartmouth', 'Brown', 'Cornell',
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    graduationYear: null,
    spike: '',
    topActivities: ['', '', ''],
    biggestWorry: '',
    previousReviews: null,
    howHeardAboutUs: '',
    targetSchools: [{ schoolName: '', deadlineType: 'EARLY_DECISION', deadline: '' }],
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const updateField = <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addSchool = () => {
    setData(prev => ({
      ...prev,
      targetSchools: [...prev.targetSchools, { schoolName: '', deadlineType: 'REGULAR_DECISION', deadline: '' }],
    }));
  };

  const removeSchool = (index: number) => {
    setData(prev => ({
      ...prev,
      targetSchools: prev.targetSchools.filter((_, i) => i !== index),
    }));
  };

  const updateSchool = (index: number, field: keyof TargetSchoolInput, value: string) => {
    setData(prev => ({
      ...prev,
      targetSchools: prev.targetSchools.map((school, i) =>
        i === index ? { ...school, [field]: value } : school
      ),
    }));
  };

  const updateActivity = (index: number, value: string) => {
    setData(prev => ({
      ...prev,
      topActivities: prev.topActivities.map((act, i) => i === index ? value : act),
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.graduationYear !== null;
      case 2: return data.targetSchools.some(s => s.schoolName && s.deadline);
      case 3: return data.spike.length > 20 || data.topActivities.some(a => a.length > 5);
      case 4: return data.biggestWorry !== '';
      case 5: return data.howHeardAboutUs !== '';
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/profile/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to save profile');

      router.push('/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEarliestDeadline = () => {
    const deadlines = data.targetSchools
      .filter(s => s.deadline)
      .map(s => new Date(s.deadline));
    if (deadlines.length === 0) return null;
    return new Date(Math.min(...deadlines.map(d => d.getTime())));
  };

  const getDaysUntilDeadline = () => {
    const earliest = getEarliestDeadline();
    if (!earliest) return null;
    const today = new Date();
    const diffTime = earliest.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Progress */}
      <div className="mb-6 sm:mb-8">
        <div className="flex justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          <span>Step {step} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1: Graduation Year */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-brand-600" />
              <CardTitle className="text-2xl">When do you graduate high school?</CardTitle>
            </div>
            <CardDescription>
              This helps us tailor advice to your timeline and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {GRADUATION_YEARS.map(year => (
                <button
                  key={year}
                  onClick={() => updateField('graduationYear', year)}
                  className={`p-4 rounded-lg border-2 text-lg font-semibold transition-all ${
                    data.graduationYear === year
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                      : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                  }`}
                >
                  Class of {year}
                </button>
              ))}
            </div>

            <Button onClick={() => setStep(2)} className="w-full mt-6" disabled={!canProceed()}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Target Schools & Deadlines */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-8 h-8 text-brand-600" />
              <CardTitle className="text-2xl">Where are you applying?</CardTitle>
            </div>
            <CardDescription>
              Add your target schools and their deadlines. We'll track essays for each.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.targetSchools.map((school, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                {index > 0 && (
                  <button
                    onClick={() => removeSchool(index)}
                    className="absolute top-2 right-2 text-neutral-400 hover:text-error-500 dark:text-neutral-500 dark:hover:text-error-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                <div>
                  <Label>School Name</Label>
                  <Input
                    placeholder="e.g., Harvard, MIT, Stanford"
                    value={school.schoolName}
                    onChange={(e) => updateSchool(index, 'schoolName', e.target.value)}
                    list="ivy-schools"
                  />
                  <datalist id="ivy-schools">
                    {IVY_SCHOOLS.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Deadline Type</Label>
                    <select
                      className="w-full px-3 py-2 border rounded-md dark:bg-neutral-800 dark:border-neutral-700"
                      value={school.deadlineType}
                      onChange={(e) => updateSchool(index, 'deadlineType', e.target.value)}
                    >
                      {DEADLINE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Deadline Date</Label>
                    <Input
                      type="date"
                      value={school.deadline}
                      onChange={(e) => updateSchool(index, 'deadline', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addSchool} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Another School
            </Button>

            {getDaysUntilDeadline() !== null && (
              <div className={`p-4 rounded-lg border ${
                getDaysUntilDeadline()! <= 14
                  ? 'bg-error-50 border-error-200 dark:bg-error-900/20 dark:border-error-800'
                  : 'bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-5 h-5 ${getDaysUntilDeadline()! <= 14 ? 'text-error-600 dark:text-error-400' : 'text-brand-600 dark:text-brand-400'}`} />
                  <span className="font-semibold">
                    {getDaysUntilDeadline()! <= 0
                      ? 'Your earliest deadline has passed!'
                      : `Your earliest deadline is in ${getDaysUntilDeadline()} days`
                    }
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1" disabled={!canProceed()}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Spike & Activities */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-brand-600" />
              <CardTitle className="text-2xl">Tell us your story</CardTitle>
            </div>
            <CardDescription>
              This helps us check if your essay connects to your overall narrative
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base">What's your "spike" or main theme?</Label>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                The central narrative that ties your application together (1-2 sentences)
              </p>
              <textarea
                className="w-full px-3 py-2 border rounded-md min-h-[80px] dark:bg-neutral-800 dark:border-neutral-700"
                placeholder="Example: 'I'm a first-gen student who discovered my passion for biotech through my grandmother's battle with cancer, which I've pursued through research and founding a health education nonprofit...'"
                value={data.spike}
                onChange={(e) => updateField('spike', e.target.value)}
              />
            </div>

            <div>
              <Label className="text-base">Your top 3 activities/achievements</Label>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-2">
                We'll check if your essay mentions these or misses opportunities
              </p>
              {[0, 1, 2].map(i => (
                <Input
                  key={i}
                  className="mb-2"
                  placeholder={`Activity ${i + 1} (e.g., "Founded coding club", "State debate champion")`}
                  value={data.topActivities[i]}
                  onChange={(e) => updateActivity(i, e.target.value)}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(4)} className="flex-1" disabled={!canProceed()}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Biggest Worry */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 text-brand-600" />
              <CardTitle className="text-2xl">What's your biggest concern?</CardTitle>
            </div>
            <CardDescription>
              We'll focus extra attention on addressing this in our feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {WORRY_OPTIONS.map(worry => (
              <button
                key={worry}
                onClick={() => updateField('biggestWorry', worry)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  data.biggestWorry === worry
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                }`}
              >
                {worry}
              </button>
            ))}

            <div>
              <Label>Has anyone reviewed your essays before?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <button
                  onClick={() => updateField('previousReviews', true)}
                  className={`p-3 rounded-lg border-2 ${
                    data.previousReviews === true
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  Yes
                </button>
                <button
                  onClick={() => updateField('previousReviews', false)}
                  className={`p-3 rounded-lg border-2 ${
                    data.previousReviews === false
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-neutral-200 dark:border-neutral-700'
                  }`}
                >
                  No, this is my first review
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Back</Button>
              <Button onClick={() => setStep(5)} className="flex-1" disabled={!canProceed()}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: How did you hear about us */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-brand-600" />
              <CardTitle className="text-2xl">One last question!</CardTitle>
            </div>
            <CardDescription>
              How did you discover IvyWay?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SOURCE_OPTIONS.map(source => (
              <button
                key={source}
                onClick={() => updateField('howHeardAboutUs', source)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  data.howHeardAboutUs === source
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                }`}
              >
                {source}
              </button>
            ))}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Back</Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Start Analyzing Essays'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
