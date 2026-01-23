/**
 * Intake Components
 * Multi-step form for collecting student context
 */

export { IntakeForm } from './intake-form';
export type { IntakeFormProps } from './intake-form';

// Individual steps (for custom implementations)
export { EssayContextStep } from './steps/essay-context-step';
export { DemographicsStep } from './steps/demographics-step';
export { AcademicStep } from './steps/academic-step';
export { ActivitiesStep } from './steps/activities-step';
export { PersonalStep } from './steps/personal-step';
export { VoiceStep } from './steps/voice-step';
