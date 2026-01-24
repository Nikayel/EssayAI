'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Brain, FileSearch, Sparkles, CheckCircle2 } from 'lucide-react';

export function AnalyzingScreen({ onComplete }: { onComplete?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Reading your essay', icon: FileSearch, duration: 15 },
    { label: 'Analyzing authenticity & voice', icon: Brain, duration: 20 },
    { label: 'Evaluating structure & clarity', icon: Sparkles, duration: 20 },
    { label: 'Generating suggestions', icon: Sparkles, duration: 25 },
    { label: 'Finalizing feedback', icon: CheckCircle2, duration: 20 },
  ];

  useEffect(() => {
    // Total duration: ~60 seconds
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0) * 1000;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Update current step based on progress
      let cumulativeDuration = 0;
      for (let i = 0; i < steps.length; i++) {
        cumulativeDuration += steps[i].duration;
        if (newProgress < (cumulativeDuration / (totalDuration / 1000)) * 100) {
          setCurrentStep(i);
          break;
        }
      }

      // Complete after 60 seconds
      if (elapsed >= totalDuration && onComplete) {
        clearInterval(interval);
        onComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <Card className="border-2 border-brand-500 shadow-xl">
        <CardContent className="py-12">
          {/* Main Spinner */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-brand-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-brand-100 rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Main Message */}
          <h2 className="text-3xl font-bold text-center mb-2">
            AI is Analyzing Your Essay
          </h2>
          <p className="text-center text-neutral-600 mb-8">
            This usually takes about 1 minute...
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 rounded-full h-3 mb-8">
            <div
              className="bg-gradient-to-r from-brand-500 to-brand-600 h-3 rounded-full transition-all duration-300 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isComplete = index < currentStep;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-brand-50 border-2 border-brand-500'
                      : isComplete
                      ? 'bg-success-50'
                      : 'bg-neutral-50'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-6 h-6 text-success-600" />
                  ) : (
                    <StepIcon
                      className={`w-6 h-6 ${
                        isActive ? 'text-brand-600 animate-pulse' : 'text-neutral-400'
                      }`}
                    />
                  )}
                  <span
                    className={`font-medium ${
                      isActive ? 'text-brand-900' : isComplete ? 'text-success-900' : 'text-neutral-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer Message */}
          <p className="text-center text-sm text-neutral-500 mt-8">
            Our AI is evaluating your essay across 7 dimensions: authenticity, reflection,
            structure, specificity, clarity, mechanics, and ethics.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
