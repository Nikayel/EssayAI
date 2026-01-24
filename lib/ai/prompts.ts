/**
 * AI Prompt Templates for Essay Analysis
 * Based on PRD section 8: AI prompt engineering
 *
 * Score Anchors (0-6 scale) - Based on real AO evaluation criteria:
 * 0: Missing or fundamentally flawed - major concerns that could hurt application
 * 1: Significant weaknesses - needs substantial revision before submission
 * 2: Below expectations - notable gaps that weaken the essay's impact
 * 3: Meets minimum expectations - acceptable but unremarkable, won't stand out
 * 4: Solid - demonstrates competence, would be competitive at most schools
 * 5: Strong - memorable and distinctive, would stand out in applicant pool
 * 6: Exceptional - top 5% of essays, the kind AOs remember and advocate for
 */

export const SCORE_ANCHORS = {
  0: 'Missing or fundamentally flawed',
  1: 'Significant weaknesses - needs major revision',
  2: 'Below expectations - notable gaps',
  3: 'Meets minimum expectations - acceptable but unremarkable',
  4: 'Solid - demonstrates competence, competitive',
  5: 'Strong - memorable and distinctive, stands out',
  6: 'Exceptional - top 5%, AOs remember and advocate for',
} as const;

export const ANALYSIS_SYSTEM_PROMPT = `You are a college essay coach with 15+ years of admissions reading experience at selective institutions. You have read 10,000+ essays and know exactly what makes one stand out.

SCORING SCALE (0-6):
- 0: Missing or fundamentally flawed - major concerns
- 1: Significant weaknesses - needs substantial revision
- 2: Below expectations - notable gaps
- 3: Meets minimum expectations - acceptable but unremarkable
- 4: Solid - competitive, demonstrates competence
- 5: Strong - memorable, distinctive, stands out
- 6: Exceptional - top 5%, the kind of essay AOs advocate for

CRITICAL RULES:
1. Preserve the student's authentic voice - never impose "proper" academic English
2. Coach, don't write - provide direction, not replacement text
3. Ground every claim in specific text from the essay
4. Return valid JSON matching the schema. No preamble.`;

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
  return `Context:
- Essay type: ${params.essayType}
- Target school(s): ${params.school || 'Not specified'}
- Prompt: ${params.prompt}
- Word limit: ${params.wordLimit || 'Not specified'}
- Previous draft? ${params.hasPreviousDraft ? 'Yes' : 'No'}
${params.toneSample ? `- Prior tone sample (150-250 words): ${params.toneSample}` : ''}

SCORING SCALE (use these anchors):
- 0: Missing or fundamentally flawed
- 1: Significant weaknesses - needs major revision
- 2: Below expectations - notable gaps
- 3: Meets minimum expectations - acceptable but unremarkable
- 4: Solid - competitive, demonstrates competence
- 5: Strong - memorable, distinctive, stands out
- 6: Exceptional - top 5%, AOs remember and advocate for

THE "SO WHAT?" TEST (CRITICAL):
Before scoring, ask yourself: "Does this essay reveal something meaningful about this student that I couldn't learn from their activities list, transcript, or other application materials?"
- If YES: The essay passes the "So What?" test
- If NO: Flag this in the uniqueness_contribution field - this is often the #1 issue with essays

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
    "school": "${params.school || ''}"
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
    "ethics_originality": {"score": 0-6, "rationales": ["..."]}
  },
  "commons_check": {
    "about_applicant": {"flag": true/false, "evidence": ["quoted text"]},
    "jargon_overuse": {"flag": true/false, "evidence": ["quoted text"]},
    "goals_articulated": {"flag": true/false, "evidence": ["quoted text"]},
    "school_alignment": {"flag": true/false, "evidence": ["quoted text"]},
    "buzzwords_cliches": {"flag": true/false, "phrases": ["phrase1", "phrase2"]},
    "genericness": {"flag": true/false, "evidence": ["quoted text"]},
    "trauma_without_reflection": {"flag": true/false, "evidence": ["quoted text"]},
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
    "score_100": <weighted score>,
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
    "trauma_without_reflection": {"flag": true/false, "evidence": ["quotes"]},
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
 * Weights based on real AO priorities:
 * - Authenticity & Reflection are highest (what AOs actually care about most)
 * - Mechanics reduced to 5% (competitive students rarely have grammar issues,
 *   and over-weighting mechanics disadvantages ESL/multilingual students)
 * - Ethics/Originality increased to include "So What?" uniqueness value
 */
export const RUBRIC_WEIGHTS = {
  authenticity: 0.20,      // Is this genuinely the student's voice?
  reflection: 0.20,        // Does it show growth, self-awareness, learning?
  structure: 0.15,         // Flow, organization, logical progression
  specificity_fit: 0.15,   // Concrete details vs. generic statements
  clarity_style: 0.10,     // Clear expression, readable prose
  mechanics: 0.05,         // Grammar, spelling (reduced - rarely an issue at this level)
  ethics_originality: 0.15, // Originality, "So What?" value, ethical considerations
} as const;

/**
 * Calculate weighted overall score from dimension scores
 */
export function calculateOverallScore(scores: {
  authenticity: number;
  reflection: number;
  structure: number;
  specificity_fit: number;
  clarity_style: number;
  mechanics: number;
  ethics_originality: number;
}): number {
  const rawScore =
    scores.authenticity * RUBRIC_WEIGHTS.authenticity +
    scores.reflection * RUBRIC_WEIGHTS.reflection +
    scores.structure * RUBRIC_WEIGHTS.structure +
    scores.specificity_fit * RUBRIC_WEIGHTS.specificity_fit +
    scores.clarity_style * RUBRIC_WEIGHTS.clarity_style +
    scores.mechanics * RUBRIC_WEIGHTS.mechanics +
    scores.ethics_originality * RUBRIC_WEIGHTS.ethics_originality;

  // Convert from 0-6 scale to 0-100 scale
  return Math.round((rawScore / 6) * 100);
}
