'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  FileSearch,
  AlertTriangle,
  Bot,
  Target,
  Eye,
  Users,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface ProgressEvent {
  type: 'step_start' | 'step_complete' | 'thinking' | 'progress' | 'complete' | 'error';
  stepId?: string;
  stepLabel?: string;
  stepMessage?: string;
  message?: string;
  sentiment?: 'positive' | 'neutral' | 'warning';
  percent?: number;
  resultUrl?: string;
}

interface ThinkingItem {
  id: string;
  message: string;
  sentiment: 'positive' | 'neutral' | 'warning';
  timestamp: number;
}

interface StepState {
  id: string;
  label: string;
  message: string;
  status: 'pending' | 'active' | 'complete';
}

// =============================================================================
// COMPONENT
// =============================================================================

interface AnalysisLoadingScreenProps {
  sessionId: string;
  school?: string;
  onComplete?: (resultUrl: string) => void;
  onError?: (message: string) => void;
}

const STEP_ICONS: Record<string, typeof FileSearch> = {
  parse: FileSearch,
  cliche_scan: AlertTriangle,
  ai_detect: Bot,
  opening_analyze: Eye,
  authenticity: Users,
  school_fit: Target,
  ao_simulation: Eye,
  rag_compare: Users,
  generate_feedback: Sparkles,
};

export function AnalysisLoadingScreen({
  sessionId,
  school,
  onComplete,
  onError,
}: AnalysisLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [currentStep, setCurrentStep] = useState<StepState | null>(null);
  const [thinkingMessages, setThinkingMessages] = useState<ThinkingItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'complete' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource(`/api/tiered-analysis/${sessionId}/progress`);

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        handleProgressEvent(data);
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };

    eventSource.onerror = () => {
      // EventSource will automatically reconnect, but if we keep erroring, show error
      setTimeout(() => {
        if (status === 'loading') {
          setStatus('error');
          setErrorMessage('Connection lost. Please refresh the page.');
        }
      }, 5000);
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId, status]);

  const handleProgressEvent = useCallback((event: ProgressEvent) => {
    switch (event.type) {
      case 'step_start':
        if (event.stepId && event.stepLabel && event.stepMessage) {
          // Mark previous step as complete
          setSteps((prev) => {
            const updated = prev.map((s) =>
              s.status === 'active' ? { ...s, status: 'complete' as const } : s
            );
            // Add new step
            return [
              ...updated,
              {
                id: event.stepId!,
                label: event.stepLabel!,
                message: event.stepMessage!,
                status: 'active' as const,
              },
            ];
          });
          setCurrentStep({
            id: event.stepId,
            label: event.stepLabel,
            message: event.stepMessage,
            status: 'active',
          });
        }
        break;

      case 'step_complete':
        setSteps((prev) =>
          prev.map((s) =>
            s.id === event.stepId ? { ...s, status: 'complete' as const } : s
          )
        );
        break;

      case 'thinking':
        if (event.message && event.sentiment) {
          const newThinking: ThinkingItem = {
            id: `thinking-${Date.now()}`,
            message: event.message,
            sentiment: event.sentiment,
            timestamp: Date.now(),
          };
          setThinkingMessages((prev) => [...prev.slice(-4), newThinking]);
        }
        break;

      case 'progress':
        if (event.percent !== undefined) {
          setProgress(event.percent);
        }
        break;

      case 'complete':
        setStatus('complete');
        if (event.resultUrl && onComplete) {
          setTimeout(() => onComplete(event.resultUrl!), 500);
        }
        break;

      case 'error':
        setStatus('error');
        setErrorMessage(event.message || 'Analysis failed');
        if (onError) {
          onError(event.message || 'Analysis failed');
        }
        break;
    }
  }, [onComplete, onError]);

  // =============================================================================
  // RENDER
  // =============================================================================

  if (status === 'error') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <Card className="border-2 border-red-200 shadow-xl">
          <CardContent className="py-12 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-900 mb-2">Analysis Failed</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'complete') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <Card className="border-2 border-green-200 shadow-xl">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">Analysis Complete!</h2>
            <p className="text-gray-600">Loading your results...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card className="border-2 border-blue-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-white/20 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-1">
            Analyzing Your Essay
          </h2>
          <p className="text-center text-blue-100 text-sm">
            {school ? `Evaluating for ${school} fit...` : 'Running deep analysis...'}
          </p>
        </div>

        <CardContent className="py-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-blue-600">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Step Message */}
          {currentStep && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = STEP_ICONS[currentStep.id] || Sparkles;
                  return <Icon className="w-5 h-5 text-blue-600 animate-pulse" />;
                })()}
                <div>
                  <p className="font-medium text-blue-900">{currentStep.label}</p>
                  <p className="text-sm text-blue-700">{currentStep.message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Thinking Messages */}
          {thinkingMessages.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Live Findings
              </h4>
              <div className="space-y-2">
                {thinkingMessages.map((item) => (
                  <ThinkingMessage key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Steps */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Completed Steps
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {steps
                .filter((s) => s.status === 'complete')
                .map((step) => {
                  const Icon = STEP_ICONS[step.id] || CheckCircle2;
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded px-3 py-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>{step.label}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-center text-xs text-gray-500">
              Our AI evaluates your essay across 5 dimensions: Authenticity, Insight,
              School Fit, Specificity, and Risk Assessment. This analysis is calibrated
              against patterns from thousands of successful essays.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ThinkingMessage({ item }: { item: ThinkingItem }) {
  const bgColors = {
    positive: 'bg-green-50 border-green-100',
    neutral: 'bg-gray-50 border-gray-100',
    warning: 'bg-amber-50 border-amber-100',
  };

  const textColors = {
    positive: 'text-green-800',
    neutral: 'text-gray-700',
    warning: 'text-amber-800',
  };

  const iconColors = {
    positive: 'text-green-500',
    neutral: 'text-gray-400',
    warning: 'text-amber-500',
  };

  const Icon =
    item.sentiment === 'positive'
      ? CheckCircle2
      : item.sentiment === 'warning'
      ? AlertCircle
      : Sparkles;

  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-lg border ${bgColors[item.sentiment]} animate-fade-in`}
    >
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColors[item.sentiment]}`} />
      <p className={`text-sm ${textColors[item.sentiment]}`}>{item.message}</p>
    </div>
  );
}

// Add to global styles or tailwind config
// @keyframes fade-in {
//   from { opacity: 0; transform: translateY(-4px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in { animation: fade-in 0.3s ease-out; }
