'use client';

/**
 * Essay Intake Form
 * Multi-step form to collect student context for accurate scoring
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DemographicsStep } from './steps/demographics-step';
import { AcademicStep } from './steps/academic-step';
import { ActivitiesStep } from './steps/activities-step';
import { PersonalStep } from './steps/personal-step';
import { EssayContextStep } from './steps/essay-context-step';
import { VoiceStep } from './steps/voice-step';
import type { StudentIntake } from '@/lib/scoring';

// =============================================================================
// TYPES
// =============================================================================

export interface IntakeFormProps {
  initialData?: Partial<StudentIntake>;
  onComplete: (intake: StudentIntake) => void;
  onSkip?: () => void;
  essayText?: string;
  targetSchool?: string;
}

type Step = 'essay-context' | 'demographics' | 'academic' | 'activities' | 'personal' | 'voice';

const STEPS: Step[] = ['essay-context', 'demographics', 'academic', 'activities', 'personal', 'voice'];

const STEP_INFO: Record<Step, { title: string; description: string; required: boolean }> = {
  'essay-context': {
    title: 'About This Essay',
    description: 'Tell us about the essay you\'re submitting',
    required: true,
  },
  demographics: {
    title: 'Your Background',
    description: 'This helps us calibrate our feedback (optional but recommended)',
    required: false,
  },
  academic: {
    title: 'Academic Interests',
    description: 'What are you passionate about learning?',
    required: false,
  },
  activities: {
    title: 'Activities & Spike',
    description: 'What\'s your main narrative?',
    required: false,
  },
  personal: {
    title: 'Your Story',
    description: 'What makes you unique?',
    required: false,
  },
  voice: {
    title: 'Your Voice',
    description: 'Help us understand your natural writing style',
    required: false,
  },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function IntakeForm({
  initialData,
  onComplete,
  onSkip,
  essayText,
  targetSchool,
}: IntakeFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>('essay-context');
  const [formData, setFormData] = useState<Partial<StudentIntake>>(initialData || {});

  const currentIndex = STEPS.indexOf(currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;
  const stepInfo = STEP_INFO[currentStep];

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleStepComplete = (stepData: Partial<StudentIntake>) => {
    setFormData(prev => ({ ...prev, ...stepData }));

    // Move to next step or complete
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    } else {
      // Complete form
      const completeIntake = buildCompleteIntake(formData, stepData);
      onComplete(completeIntake);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleSkipStep = () => {
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    } else {
      const completeIntake = buildCompleteIntake(formData, {});
      onComplete(completeIntake);
    }
  };

  const handleSkipAll = () => {
    if (onSkip) {
      onSkip();
    } else {
      const minimalIntake = buildMinimalIntake(formData, targetSchool);
      onComplete(minimalIntake);
    }
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Card className="w-full max-w-2xl mx-4 sm:mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Step {currentIndex + 1} of {STEPS.length}</span>
            {!stepInfo.required && <span className="text-xs">(Optional)</span>}
          </div>
          {onSkip && (
            <Button variant="ghost" size="sm" onClick={handleSkipAll}>
              Skip All & Analyze
            </Button>
          )}
        </div>

        <Progress value={progress} className="h-2 mb-4" />

        <CardTitle>{stepInfo.title}</CardTitle>
        <CardDescription>{stepInfo.description}</CardDescription>
      </CardHeader>

      <CardContent>
        {currentStep === 'essay-context' && (
          <EssayContextStep
            initialData={formData.essayContext}
            targetSchool={targetSchool}
            onComplete={(data) => handleStepComplete({ essayContext: data })}
            onBack={handleBack}
            isFirst={true}
          />
        )}

        {currentStep === 'demographics' && (
          <DemographicsStep
            initialData={formData.demographics}
            onComplete={(data) => handleStepComplete({ demographics: data })}
            onBack={handleBack}
            onSkip={handleSkipStep}
          />
        )}

        {currentStep === 'academic' && (
          <AcademicStep
            initialData={formData.academic}
            onComplete={(data) => handleStepComplete({ academic: data })}
            onBack={handleBack}
            onSkip={handleSkipStep}
          />
        )}

        {currentStep === 'activities' && (
          <ActivitiesStep
            initialData={formData.activities}
            onComplete={(data) => handleStepComplete({ activities: data })}
            onBack={handleBack}
            onSkip={handleSkipStep}
          />
        )}

        {currentStep === 'personal' && (
          <PersonalStep
            initialData={formData.personal}
            onComplete={(data) => handleStepComplete({ personal: data })}
            onBack={handleBack}
            onSkip={handleSkipStep}
          />
        )}

        {currentStep === 'voice' && (
          <VoiceStep
            initialData={formData.voice}
            essayText={essayText}
            onComplete={(data) => handleStepComplete({ voice: data })}
            onBack={handleBack}
            onSkip={handleSkipStep}
          />
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function buildCompleteIntake(
  formData: Partial<StudentIntake>,
  stepData: Partial<StudentIntake>
): StudentIntake {
  const merged = { ...formData, ...stepData };

  return {
    demographics: merged.demographics || {
      isFirstGen: false,
      familyEducationLevel: 'bachelors',
      isInternational: false,
      geographicContext: 'suburban',
      schoolType: 'public',
      familyResponsibilities: [],
    },
    academic: merged.academic || {
      intendedMajor: '',
      academicInterests: [],
    },
    activities: merged.activities || {
      spike: '',
      topActivities: [],
      leadershipRoles: [],
    },
    personal: merged.personal || {
      identityFactors: [],
    },
    essayContext: merged.essayContext || {
      targetSchool: '',
      essayType: 'personal_statement',
      essayPrompt: '',
      wordLimit: 650,
      biggestConcern: 'too_generic',
      draftNumber: 'first',
    },
    voice: merged.voice || {
      toneSample: '',
      writingStyle: 'conversational',
      usesHumor: false,
    },
  };
}

function buildMinimalIntake(
  formData: Partial<StudentIntake>,
  targetSchool?: string
): StudentIntake {
  return {
    demographics: formData.demographics || {
      isFirstGen: false,
      familyEducationLevel: 'bachelors',
      isInternational: false,
      geographicContext: 'suburban',
      schoolType: 'public',
      familyResponsibilities: [],
    },
    academic: formData.academic || {
      intendedMajor: '',
      academicInterests: [],
    },
    activities: formData.activities || {
      spike: '',
      topActivities: [],
      leadershipRoles: [],
    },
    personal: formData.personal || {
      identityFactors: [],
    },
    essayContext: formData.essayContext || {
      targetSchool: targetSchool || '',
      essayType: 'personal_statement',
      essayPrompt: '',
      wordLimit: 650,
      biggestConcern: 'too_generic',
      draftNumber: 'first',
    },
    voice: formData.voice || {
      toneSample: '',
      writingStyle: 'conversational',
      usesHumor: false,
    },
  };
}
