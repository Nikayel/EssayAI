/**
 * Loading Screen Steps
 * Hybrid of real analysis actions and marketing-rich messaging
 *
 * Design:
 * - Some steps are REAL (actually run analysis)
 * - Some steps are THEATRICAL (paced for effect)
 * - Mix feels authentic, not fake
 * - "Thinking" messages show real findings when possible
 */

// =============================================================================
// TYPES
// =============================================================================

export interface LoadingStep {
  id: string;
  label: string;                    // Short label
  marketingMessage: string;         // Detailed marketing text
  isRealStep: boolean;              // True if this runs actual code
  duration: { min: number; max: number };  // Milliseconds
}

export interface ThinkingMessage {
  trigger: string;
  template: string;
  sentiment: 'positive' | 'neutral' | 'warning';
}

export interface LoadingProgress {
  currentStep: number;
  totalSteps: number;
  stepId: string;
  stepLabel: string;
  stepMessage: string;
  percentComplete: number;
  thinkingMessage?: string;
  thinkingSentiment?: 'positive' | 'neutral' | 'warning';
}

// =============================================================================
// ANALYSIS STEPS
// =============================================================================

export function getAnalysisSteps(school: string, wordCount: number): LoadingStep[] {
  return [
    {
      id: 'parse',
      label: 'Reading your essay',
      marketingMessage: `Parsing ${wordCount} words across your essay...`,
      isRealStep: true,
      duration: { min: 400, max: 800 },
    },
    {
      id: 'cliche_scan',
      label: 'Scanning for generic phrases',
      marketingMessage: 'Checking against 700+ clichés that admissions officers instantly recognize...',
      isRealStep: true,
      duration: { min: 1000, max: 2000 },
    },
    {
      id: 'ai_detect',
      label: 'Checking for AI patterns',
      marketingMessage: 'Looking for ChatGPT signatures that AOs are trained to spot...',
      isRealStep: true,
      duration: { min: 800, max: 1500 },
    },
    {
      id: 'opening_analyze',
      label: 'Analyzing your opening',
      marketingMessage: 'AOs decide to keep reading in the first 30 seconds...',
      isRealStep: false, // Part of full analysis
      duration: { min: 1200, max: 2000 },
    },
    {
      id: 'authenticity',
      label: 'Evaluating authenticity',
      marketingMessage: 'Does this sound like a real teenager or a coached essay?',
      isRealStep: false,
      duration: { min: 1500, max: 2500 },
    },
    {
      id: 'school_fit',
      label: `Analyzing ${school} alignment`,
      marketingMessage: `Checking for ${school}-specific values, culture, and red flags...`,
      isRealStep: false,
      duration: { min: 1200, max: 2000 },
    },
    {
      id: 'ao_simulation',
      label: 'Simulating AO first read',
      marketingMessage: 'What would an admissions officer think reading this?',
      isRealStep: false, // Theatrical
      duration: { min: 2000, max: 3000 },
    },
    {
      id: 'rag_compare',
      label: 'Comparing to successful essays',
      marketingMessage: 'Matching against patterns from essays that got students accepted...',
      isRealStep: true, // RAG retrieval
      duration: { min: 2000, max: 4000 },
    },
    {
      id: 'generate_feedback',
      label: 'Generating personalized feedback',
      marketingMessage: 'Building your custom analysis report...',
      isRealStep: true,
      duration: { min: 1500, max: 2500 },
    },
  ];
}

// =============================================================================
// THINKING MESSAGES (Shown during analysis)
// =============================================================================

export const THINKING_MESSAGE_TEMPLATES: ThinkingMessage[] = [
  // Cliche detections
  {
    trigger: 'cliche_found',
    template: 'Found "{phrase}" — this appears in {percent}% of rejected essays.',
    sentiment: 'warning',
  },
  {
    trigger: 'cliche_hard',
    template: '"{phrase}" is a hard red flag. AOs see this and think "copy-paste."',
    sentiment: 'warning',
  },

  // AI detection
  {
    trigger: 'ai_em_dash',
    template: 'Detected {count} em-dashes — ChatGPT overuses these.',
    sentiment: 'warning',
  },
  {
    trigger: 'ai_vocabulary',
    template: 'Words like "{word}" appear much more in AI text than teen writing.',
    sentiment: 'warning',
  },
  {
    trigger: 'ai_low',
    template: 'No significant AI patterns detected. Your writing sounds human.',
    sentiment: 'positive',
  },

  // Opening
  {
    trigger: 'opening_weak',
    template: 'Opening line starts with a common pattern. Consider revising.',
    sentiment: 'warning',
  },
  {
    trigger: 'opening_strong',
    template: 'Strong opening hook. AO will want to keep reading.',
    sentiment: 'positive',
  },

  // School fit
  {
    trigger: 'school_keyword',
    template: 'Good: You mentioned "{keyword}" which {school} values.',
    sentiment: 'positive',
  },
  {
    trigger: 'school_missing',
    template: 'No specific {school} references found. This could be sent to any school.',
    sentiment: 'warning',
  },
  {
    trigger: 'school_red_flag',
    template: '"{phrase}" is a known red flag for {school} applications.',
    sentiment: 'warning',
  },

  // Reflection
  {
    trigger: 'reflection_found',
    template: 'Found a moment of genuine reflection in paragraph {num}.',
    sentiment: 'positive',
  },
  {
    trigger: 'reflection_missing',
    template: 'Paragraph {num} describes but doesn\'t reflect. Consider adding "so what?"',
    sentiment: 'warning',
  },

  // Strengths
  {
    trigger: 'dialogue_found',
    template: 'Good use of dialogue. This creates a vivid scene.',
    sentiment: 'positive',
  },
  {
    trigger: 'sensory_found',
    template: 'Nice sensory detail: "{detail}". This makes the essay memorable.',
    sentiment: 'positive',
  },
];

/**
 * Generate a thinking message based on analysis findings
 */
export function generateThinkingMessage(
  trigger: string,
  context: Record<string, string | number>
): { message: string; sentiment: 'positive' | 'neutral' | 'warning' } | null {
  const template = THINKING_MESSAGE_TEMPLATES.find(t => t.trigger === trigger);
  if (!template) return null;

  let message = template.template;

  // Replace placeholders
  for (const [key, value] of Object.entries(context)) {
    message = message.replace(`{${key}}`, String(value));
  }

  return {
    message,
    sentiment: template.sentiment,
  };
}

// =============================================================================
// PROGRESS CALCULATION
// =============================================================================

/**
 * Calculate loading progress for display
 */
export function calculateProgress(
  completedSteps: string[],
  allSteps: LoadingStep[],
  currentThinking?: { message: string; sentiment: 'positive' | 'neutral' | 'warning' }
): LoadingProgress {
  const currentStepIndex = completedSteps.length;
  const currentStep = allSteps[currentStepIndex];

  const percentComplete = Math.round(
    (completedSteps.length / allSteps.length) * 100
  );

  return {
    currentStep: currentStepIndex + 1,
    totalSteps: allSteps.length,
    stepId: currentStep?.id || 'complete',
    stepLabel: currentStep?.label || 'Analysis complete',
    stepMessage: currentStep?.marketingMessage || 'Your results are ready!',
    percentComplete: Math.min(percentComplete, 99), // Never show 100% until done
    thinkingMessage: currentThinking?.message,
    thinkingSentiment: currentThinking?.sentiment,
  };
}

// =============================================================================
// STEP TIMING HELPERS
// =============================================================================

/**
 * Get randomized duration for a step (for realistic feel)
 */
export function getStepDuration(step: LoadingStep): number {
  const range = step.duration.max - step.duration.min;
  return step.duration.min + Math.random() * range;
}

/**
 * Get total estimated time for all steps
 */
export function getEstimatedTotalTime(steps: LoadingStep[]): number {
  return steps.reduce((total, step) => {
    const avgDuration = (step.duration.min + step.duration.max) / 2;
    return total + avgDuration;
  }, 0);
}

// =============================================================================
// SSE EVENT TYPES (For streaming progress)
// =============================================================================

export type ProgressEvent =
  | { type: 'step_start'; stepId: string; stepLabel: string; stepMessage: string }
  | { type: 'step_complete'; stepId: string }
  | { type: 'thinking'; message: string; sentiment: 'positive' | 'neutral' | 'warning' }
  | { type: 'progress'; percent: number }
  | { type: 'complete'; resultUrl: string }
  | { type: 'error'; message: string };

/**
 * Create a progress event for SSE streaming
 */
export function createProgressEvent(event: ProgressEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
