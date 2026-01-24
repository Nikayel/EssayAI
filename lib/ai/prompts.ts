/**
 * AI Prompt Templates for Essay Analysis
 * Based on PRD section 8: AI prompt engineering
 *
 * NOTE: Score anchors and weights are now centralized in lib/scoring/rubric-config.ts
 * This file re-exports them for backward compatibility and contains prompt templates.
 */

import {
  SCORE_ANCHORS as _SCORE_ANCHORS,
  DEFAULT_RUBRIC_WEIGHTS,
  RUBRIC_WEIGHTS_BY_ESSAY_TYPE,
  SCORE_CALIBRATION,
  PROMPT_VERSION,
  calculateOverallScore as _calculateOverallScore,
  formatScoreAnchorsForPrompt,
  formatWeightsForPrompt,
  type EssayType,
} from '../scoring/rubric-config';

// Re-export for backward compatibility
export const SCORE_ANCHORS = {
  0: _SCORE_ANCHORS[0].label,
  1: _SCORE_ANCHORS[1].label,
  2: _SCORE_ANCHORS[2].label,
  3: _SCORE_ANCHORS[3].label,
  4: _SCORE_ANCHORS[4].label,
  5: _SCORE_ANCHORS[5].label,
  6: _SCORE_ANCHORS[6].label,
} as const;

export const ANALYSIS_SYSTEM_PROMPT = `You are a college essay coach with 15+ years of admissions reading experience at selective institutions. You have read 10,000+ essays and know exactly what makes one stand out.

PROMPT VERSION: ${PROMPT_VERSION}

SCORING SCALE (0-6) with expected distribution:
${formatScoreAnchorsForPrompt(false)}

CALIBRATION GUIDANCE:
${SCORE_CALIBRATION.general.guidance}

CRITICAL RULES:
1. Preserve the student's authentic voice - never impose "proper" academic English
2. Coach, don't write - provide direction, not replacement text
3. Ground every claim in specific text from the essay
4. Return valid JSON matching the schema. No preamble.
5. Scores of 5-6 should be RARE - reserve for truly exceptional writing`;

export const COMMONS_CHECK_SYSTEM_PROMPT = `You are a rapid essay screener. Identify common issues in college application essays quickly. Return valid JSON only. No preamble.`;

export const REWRITE_SYSTEM_PROMPT = `You improve clarity, structure, and specificity while preserving writer voice. Show paragraph-level rewrites only. No new stories. Return the rewrite JSON. No commentary outside JSON.`;

export function createAnalysisPrompt(params: {
  essayType: string;
  school?: string;
  prompt: string;
  wordLimit?: number;
  hasPreviousDraft: boolean;
  toneSample?: string;
  essayText: string;
}): string {
  const essayTypeKey = (params.essayType as EssayType) || 'other';

  return `Context:
- Essay type: ${params.essayType}
- Target school(s): ${params.school || 'Not specified'}
- Prompt: ${params.prompt}
- Word limit: ${params.wordLimit || 'Not specified'}
- Previous draft? ${params.hasPreviousDraft ? 'Yes' : 'No'}
${params.toneSample ? `- Prior tone sample (150-250 words): ${params.toneSample}` : ''}

SCORING SCALE (0-6) with expected distribution:
${formatScoreAnchorsForPrompt(false)}

CALIBRATION: ${SCORE_CALIBRATION.general.guidance}

RUBRIC WEIGHTS FOR ${params.essayType.toUpperCase()}:
${formatWeightsForPrompt(essayTypeKey)}

THE "SO WHAT?" TEST (CRITICAL - score in 'uniqueness' dimension):
Ask yourself: "Does this essay reveal something meaningful about this student that I couldn't learn from their activities list, transcript, or other application materials?"
- If YES: High uniqueness score (4-6)
- If NO: Low uniqueness score (1-3) - this is often the #1 issue with essays

Task:
Analyze the student's essay and return JSON per schema. ${params.essayType === 'why_us' ? 'Weight school-specific values heavily.' : ''} Identify commons flags with quoted evidence.

Essay:
${params.essayText}

Return a JSON object with the following structure:
{
  "meta": {
    "essay_type": "${params.essayType}",
    "word_count": <count>,
    "prompt": "${params.prompt}",
    "school": "${params.school || ''}",
    "prompt_version": "${PROMPT_VERSION}"
  },
  "so_what_test": {
    "passes": true/false,
    "uniqueness_contribution": "What does this essay reveal that we couldn't learn elsewhere?",
    "missing_depth": "If fails, what deeper insight is missing?"
  },
  "scores": {
    "authenticity": {"score": 0-6, "rationales": ["..."]},
    "reflection": {"score": 0-6, "rationales": ["..."]},
    "structure": {"score": 0-6, "rationales": ["..."]},
    "specificity_fit": {"score": 0-6, "rationales": ["..."]},
    "clarity_style": {"score": 0-6, "rationales": ["..."]},
    "mechanics": {"score": 0-6, "rationales": ["..."]},
    "uniqueness": {"score": 0-6, "rationales": ["...based on So What? test..."]},
    "ethics": {"score": 0-6, "rationales": ["...any red flags or concerns..."]}
  },
  "commons_check": {
    "about_applicant": {"flag": true/false, "evidence": ["quoted text"]},
    "jargon_overuse": {"flag": true/false, "evidence": ["quoted text"]},
    "goals_articulated": {"flag": true/false, "evidence": ["quoted text"]},
    "school_alignment": {"flag": true/false, "evidence": ["quoted text"]},
    "buzzwords_cliches": {"flag": true/false, "phrases": ["phrase1", "phrase2"]},
    "genericness": {"flag": true/false, "evidence": ["quoted text"]},
    "reflection_depth_needed": {"flag": true/false, "evidence": ["quoted text"]},
    "exaggeration": {"flag": true/false, "evidence": ["quoted text"]},
    "tone_drift": {"flag": true/false, "notes": ""},
    "ethics_risks": {"flag": true/false, "notes": ""}
  },
  "suggestions": {
    "top5": [{"issue": "", "why_it_matters": "", "example_edit": ""}],
    "outline_fix": ["structural suggestions"],
    "sentence_level": [{"from": "original", "to": "improved"}]
  },
  "overall": {
    "score_100": <weighted score based on rubric weights above>,
    "summary": "2-3 sentence summary",
    "next_actions_checklist": ["action1", "action2"]
  }
}`;
}

export function createRewritePrompt(params: {
  essayText: string;
  goals: string[];
  toneSample?: string;
}): string {
  return `Task:
Provide paragraph-level rewrites for the following essay. Focus on these goals: ${params.goals.join(', ')}.
${params.toneSample ? `\nPreserve this tone sample:\n${params.toneSample}\n` : ''}

Essay:
${params.essayText}

Return JSON with this structure:
{
  "rewrites": [
    {
      "goal": "tighten_intro|show_specificity|clarify_goals|tone|structure|voice",
      "paragraph_original": "...",
      "paragraph_rewrite": "...",
      "note_on_voice": "explanation of voice preservation"
    }
  ]
}`;
}

export function createCommonsCheckPrompt(essayText: string): string {
  return `Quickly scan this college essay and flag common issues:

${essayText}

Return JSON:
{
  "commons_check": {
    "about_applicant": {"flag": true/false, "evidence": ["quotes"]},
    "jargon_overuse": {"flag": true/false, "evidence": ["quotes"]},
    "goals_articulated": {"flag": true/false, "evidence": ["quotes"]},
    "school_alignment": {"flag": true/false, "evidence": ["quotes"]},
    "buzzwords_cliches": {"flag": true/false, "phrases": ["phrase1"]},
    "genericness": {"flag": true/false, "evidence": ["quotes"]},
    "reflection_depth_needed": {"flag": true/false, "evidence": ["quotes"], "notes": "If flagged, suggest how to add deeper reflection"},
    "exaggeration": {"flag": true/false, "evidence": ["quotes"]},
    "tone_drift": {"flag": false, "notes": ""},
    "ethics_risks": {"flag": true/false, "notes": ""}
  },
  "quick_tips": ["tip1", "tip2", "tip3"]
}`;
}

export function createSchoolFitPrompt(params: {
  essayText: string;
  schoolFacts: string;
}): string {
  return `Analyze school-specific alignment:

School facts:
${params.schoolFacts}

Essay:
${params.essayText}

Return JSON:
{
  "tags": ["course_match", "location_reason", "faculty_reference", "mission_link"],
  "evidence": ["quoted evidence for each tag"]
}`;
}

/**
 * Rubric weights for calculating overall score (out of 100)
 *
 * NOTE: Weights are now centralized in lib/scoring/rubric-config.ts
 * This export is for backward compatibility.
 *
 * v2.0.0 changes:
 * - Split ethics_originality (15%) into:
 *   - uniqueness (10%): "So What?" test - what does essay reveal?
 *   - ethics (5%): Red flags, ethical concerns
 * - Added essay-type-specific weights
 */
export const RUBRIC_WEIGHTS = DEFAULT_RUBRIC_WEIGHTS;

// Re-export essay-type-specific weights
export { RUBRIC_WEIGHTS_BY_ESSAY_TYPE };

/**
 * Calculate weighted overall score from dimension scores
 * @param scores - All dimension scores (0-6 scale)
 * @param essayType - Optional essay type for type-specific weights
 * @returns Score on 0-100 scale
 */
export function calculateOverallScore(
  scores: {
    authenticity: number;
    reflection: number;
    structure: number;
    specificity_fit: number;
    clarity_style: number;
    mechanics: number;
    uniqueness: number;
    ethics: number;
  },
  essayType: EssayType = 'other'
): number {
  return _calculateOverallScore(scores, essayType);
}
