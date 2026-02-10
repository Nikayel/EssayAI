import { z } from 'zod';

/**
 * Zod validation schemas for AI responses
 * Ensures type safety and runtime validation
 */

export const ScoreDimensionSchema = z.object({
  score: z.number().min(0).max(6),
  rationales: z.array(z.string()),
});

export const CommonsCheckFlagSchema = z.object({
  flag: z.boolean(),
  evidence: z.array(z.string()).optional(),
  phrases: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const CommonsCheckSchema = z.object({
  about_applicant: CommonsCheckFlagSchema,
  jargon_overuse: CommonsCheckFlagSchema,
  goals_articulated: CommonsCheckFlagSchema,
  school_alignment: CommonsCheckFlagSchema,
  buzzwords_cliches: CommonsCheckFlagSchema,
  genericness: CommonsCheckFlagSchema,
  /** Renamed from trauma_without_reflection for more sensitive framing */
  reflection_depth_needed: CommonsCheckFlagSchema,
  exaggeration: CommonsCheckFlagSchema,
  tone_drift: CommonsCheckFlagSchema,
  ethics_risks: CommonsCheckFlagSchema,
});

export const SuggestionFixSchema = z.object({
  issue: z.string(),
  why_it_matters: z.string(),
  example_edit: z.string(),
});

export const SentenceLevelEditSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const SuggestionsSchema = z.object({
  top5: z.array(SuggestionFixSchema),
  outline_fix: z.array(z.string()),
  sentence_level: z.array(SentenceLevelEditSchema),
});

export const AnalysisResponseSchema = z.object({
  meta: z.object({
    essay_type: z.enum(['personal_statement', 'why_us', 'supplemental', 'activity', 'other']),
    word_count: z.number(),
    prompt: z.string(),
    school: z.string(),
    prompt_version: z.string().optional(),
  }),
  scores: z.object({
    authenticity: ScoreDimensionSchema,
    reflection: ScoreDimensionSchema,
    structure: ScoreDimensionSchema,
    specificity_fit: ScoreDimensionSchema,
    clarity_style: ScoreDimensionSchema,
    mechanics: ScoreDimensionSchema,
    uniqueness: ScoreDimensionSchema,
    ethics: ScoreDimensionSchema,
  }),
  score_anchors: z.record(z.string(), z.object({
    label: z.string(),
    userFriendly: z.string(),
  })).optional(),
  commons_check: CommonsCheckSchema,
  suggestions: SuggestionsSchema,
  overall: z.object({
    score_100: z.number().min(0).max(100),
    summary: z.string(),
    recommendation: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    action_items: z.array(z.string()).optional(),
    next_actions_checklist: z.array(z.string()),
  }),
});

export const ParagraphRewriteSchema = z.object({
  goal: z.enum(['tighten_intro', 'show_specificity', 'clarify_goals', 'tone', 'structure', 'voice']),
  paragraph_original: z.string(),
  paragraph_rewrite: z.string(),
  note_on_voice: z.string(),
});

export const RewriteResponseSchema = z.object({
  rewrites: z.array(ParagraphRewriteSchema),
});

export const SchoolFitAlignmentSchema = z.object({
  tags: z.array(z.enum(['course_match', 'location_reason', 'faculty_reference', 'mission_link'])),
  evidence: z.array(z.string()),
});

export const ToneComparisonResultSchema = z.object({
  similarity_score: z.number().min(0).max(1),
  drift_detected: z.boolean(),
  notes: z.string(),
});
