/**
 * Ivy League-Specific AI Prompts
 * DRY principle: Composable prompt builders using school data
 *
 * Score Anchors (0-6 scale) - Calibrated for Ivy-level competition:
 * 0: Missing or fundamentally flawed - would hurt application
 * 1: Significant weaknesses - not competitive for Ivy admissions
 * 2: Below Ivy expectations - would blend into the pile
 * 3: Meets minimum - acceptable but won't help stand out in Ivy pool
 * 4: Solid - competitive, demonstrates potential fit
 * 5: Strong - memorable, would make AO want to advocate
 * 6: Exceptional - top 5% of Ivy applicant essays
 */

import {
  getIvySchool,
  getSchoolFactsForPrompt,
  type IvySchool,
  type FitSignal
} from '../data/ivy-league';

// ============================================================================
// SCORE ANCHORS - Ivy-calibrated definitions
// ============================================================================

export const IVY_SCORE_ANCHORS = {
  0: 'Missing or fundamentally flawed - would hurt application',
  1: 'Significant weaknesses - not competitive for Ivy admissions',
  2: 'Below Ivy expectations - would blend into the pile',
  3: 'Meets minimum - acceptable but won\'t stand out in Ivy pool',
  4: 'Solid - competitive, demonstrates potential fit',
  5: 'Strong - memorable, AO would want to advocate',
  6: 'Exceptional - top 5% of Ivy applicant essays',
} as const;

// ============================================================================
// CONSTANTS - Single source of truth for scoring weights
// ============================================================================

export const IVY_RUBRIC_WEIGHTS = {
  authenticity: 0.20,     // Is this genuinely the student?
  schoolFit: 0.20,        // Demonstrated research and genuine connection
  reflection: 0.15,       // Growth mindset, self-awareness
  structure: 0.12,        // Flow and organization
  specificity: 0.15,      // Concrete details, not generic
  clarity: 0.10,          // Clear expression
  mechanics: 0.03,        // Minimal weight - Ivy applicants rarely have issues here
  uniqueness: 0.05,       // "So What?" test - what does this reveal?
} as const;

export const FIT_CATEGORY_WEIGHTS: Record<FitSignal['category'], number> = {
  academic: 0.30,
  values: 0.25,
  culture: 0.20,
  extracurricular: 0.15,
  location: 0.10,
};

// ============================================================================
// SYSTEM PROMPTS - Composable and reusable
// ============================================================================

const BASE_SYSTEM_CONTEXT = `You are an expert college admissions counselor with 15+ years reviewing essays for Ivy League universities. You have personally read 10,000+ applications and served on admissions committees. You know exactly what makes essays stand out in a pool of 50,000+ applicants.

SCORING SCALE (0-6, calibrated for Ivy competition):
- 0: Missing or fundamentally flawed - would hurt application
- 1: Significant weaknesses - not competitive for Ivy admissions
- 2: Below Ivy expectations - would blend into the pile
- 3: Meets minimum - acceptable but won't stand out in Ivy pool
- 4: Solid - competitive, demonstrates potential fit
- 5: Strong - memorable, AO would want to advocate for this student
- 6: Exceptional - top 5% of Ivy applicant essays

THE "SO WHAT?" TEST (CRITICAL - apply to every essay):
Ask yourself: "After reading this essay, do I know something meaningful about this student that I couldn't learn from their activities list, transcript, or recommendations?"
- If the essay just DESCRIBES activities/achievements: It fails the test
- If the essay reveals HOW THEY THINK, WHAT THEY VALUE, or WHO THEY ARE: It passes

CRITICAL RULES:
1. NEVER write content for the student - provide coaching direction only
2. PRESERVE the student's authentic voice - don't impose "proper" English
3. PROVIDE specific, actionable feedback grounded in the text
4. REFERENCE the specific school's values and culture
5. Apply cultural sensitivity - international students, first-gen, etc. may express things differently
6. Return ONLY valid JSON matching the schema`;

export const IVY_ANALYSIS_SYSTEM_PROMPT = `${BASE_SYSTEM_CONTEXT}

You are analyzing an essay for an Ivy League school. Your evaluation must address:

1. THE "SO WHAT?" TEST
   - Does this essay reveal something meaningful we couldn't learn elsewhere?
   - Would this make an AO remember this student 3 hours later?

2. SCHOOL-SPECIFIC FIT
   - Has the student done real research on this school?
   - Do their reasons feel genuine or could they apply to any top school?
   - Do they reference specific programs, professors, opportunities?

3. AUTHENTIC VOICE
   - Does this sound like a 17-18 year old wrote it?
   - Is the vocabulary natural or does it feel thesaurus-heavy?
   - Are there moments of genuine personality?

4. REFLECTION DEPTH
   - Does the student show growth and self-awareness?
   - Do they demonstrate how they think, not just what they did?

5. SPECIFICITY VS. GENERIC
   - Are there concrete details, sensory moments, specific examples?
   - Could another student have written this exact essay?`;

export const IVY_FIT_SYSTEM_PROMPT = `${BASE_SYSTEM_CONTEXT}

You are evaluating how well this essay demonstrates fit with a specific Ivy League school.

WHAT REAL FIT LOOKS LIKE:
- Student references a specific professor's research and explains why it matters to them
- Student mentions a unique program/initiative and connects it to their goals
- Student shows understanding of the school's culture beyond rankings
- Student's values genuinely align with the institution's mission

WHAT FAKE FIT LOOKS LIKE (flag these):
- Generic praise that could apply to any top school ("world-class faculty")
- Name-dropping without substance
- Copying language from the school's website without personal connection
- "I've dreamed of attending X since I was young" without specific reasons

Score based on:
- Evidence of genuine school research (specific, not googleable in 5 minutes)
- Alignment with school values and mission (with personal connection)
- Cultural fit signals (do they understand what makes this school different?)
- Specificity of "why this school" reasoning (would this essay work for a competitor?)`;

// ============================================================================
// PROMPT BUILDERS - DRY composable functions
// ============================================================================

interface IvyAnalysisParams {
  essayText: string;
  schoolId: string;
  essayType: string;
  promptText: string;
  wordLimit?: number;
  toneSample?: string;
}

/**
 * Build Ivy League essay analysis prompt
 * Composes school-specific context with analysis template
 */
export function buildIvyAnalysisPrompt(params: IvyAnalysisParams): string {
  const school = getIvySchool(params.schoolId);
  if (!school) {
    throw new Error(`Unknown Ivy school: ${params.schoolId}`);
  }

  const schoolContext = buildSchoolContext(school);
  const analysisInstructions = buildAnalysisInstructions(params, school);
  const outputSchema = buildAnalysisOutputSchema();

  return `${schoolContext}

${analysisInstructions}

ESSAY:
"""
${params.essayText}
"""

${outputSchema}`;
}

/**
 * Build school-specific context section
 */
function buildSchoolContext(school: IvySchool): string {
  return `=== ${school.name.toUpperCase()} CONTEXT ===
Location: ${school.location}
Acceptance Rate: ${school.acceptanceRate}%
Mission: "${school.mission}"

Core Values: ${school.valueKeywords.join(', ')}
Culture: ${school.cultureKeywords.join(', ')}
Notable Programs: ${school.notablePrograms.slice(0, 5).join(', ')}

WHAT ADMISSIONS LOOKS FOR:
${school.fitSignals.map(s => `• ${s.signal} [${s.category}]`).join('\n')}

RED FLAGS TO IDENTIFY:
${school.avoidSignals.map(s => `• ${s}`).join('\n')}`;
}

/**
 * Build analysis instructions
 */
function buildAnalysisInstructions(
  params: IvyAnalysisParams,
  school: IvySchool
): string {
  const wordLimitNote = params.wordLimit
    ? `Word limit: ${params.wordLimit}`
    : '';

  const toneNote = params.toneSample
    ? `\nTONE SAMPLE (student's natural voice):\n"${params.toneSample.slice(0, 500)}..."`
    : '';

  return `=== ANALYSIS TASK ===
Essay Type: ${params.essayType}
Prompt: "${params.promptText}"
${wordLimitNote}
Target School: ${school.name}
${toneNote}

Analyze this essay for ${school.shortName} application. Evaluate:
1. How well does it demonstrate FIT with ${school.shortName}?
2. Does it show genuine school research?
3. Is the voice authentic or does it sound coached/AI-generated?
4. Are there specific details or is it generic?
5. Does it address the prompt directly?`;
}

/**
 * Build output schema for analysis
 */
function buildAnalysisOutputSchema(): string {
  return `=== REQUIRED OUTPUT FORMAT (JSON) ===
{
  "meta": {
    "school": "<school_id>",
    "essay_type": "<type>",
    "word_count": <number>,
    "prompt": "<prompt_text>"
  },
  "so_what_test": {
    "passes": true/false,
    "uniqueness_contribution": "What does this essay reveal that we couldn't learn from activities/transcript?",
    "memorable_elements": ["Specific moments/details that would stick with an AO"],
    "missing_depth": "If fails, what deeper insight about the student is missing?"
  },
  "scores": {
    "authenticity": {"score": 0-6, "rationale": "<why>", "voice_moments": ["<quotes showing authentic voice>"]},
    "school_fit": {"score": 0-6, "rationale": "<why>", "evidence": ["<quoted school references>"]},
    "reflection": {"score": 0-6, "rationale": "<why>"},
    "structure": {"score": 0-6, "rationale": "<why>"},
    "specificity": {"score": 0-6, "rationale": "<why>", "generic_phrases": ["<phrases to make specific>"]},
    "clarity": {"score": 0-6, "rationale": "<why>"},
    "mechanics": {"score": 0-6, "rationale": "<why>"}
  },
  "school_fit_analysis": {
    "demonstrated_research": ["<specific school references found - programs, professors, initiatives>"],
    "value_alignment": ["<how essay genuinely aligns with school values>"],
    "missing_opportunities": ["<specific things about this school they could reference>"],
    "red_flags": ["<generic praise, name-dropping without substance, copied website language>"],
    "could_work_for_competitor": true/false,
    "fit_score": 0-100
  },
  "commons_check": {
    "about_applicant": {"flag": true/false, "evidence": []},
    "generic_language": {"flag": true/false, "phrases": []},
    "school_specific": {"flag": true/false, "evidence": []},
    "cliches": {"flag": true/false, "phrases": []},
    "voice_authentic": {"flag": true/false, "notes": ""},
    "so_what_fails": {"flag": true/false, "notes": "Why this essay doesn't pass the So What test"}
  },
  "suggestions": {
    "top_priorities": [
      {"issue": "", "why_matters_for_ivy": "", "coaching_direction": "", "do_not_write": "Remember: suggest direction, don't write for them"}
    ],
    "school_fit_improvements": ["<specific ways to improve fit - reference actual programs/people>"],
    "so_what_improvements": ["<how to make this essay reveal something meaningful>"],
    "sentence_edits": [{"original": "", "direction": "", "reason": ""}]
  },
  "overall": {
    "score_100": <weighted_score>,
    "summary": "<2-3 sentence summary>",
    "passes_so_what_test": true/false,
    "strengths": ["<top 2 strengths>"],
    "action_items": ["<prioritized next steps>"],
    "honest_assessment": "<Would this essay help or hurt their application at this specific school?>"
  }
}`;
}

// ============================================================================
// SCHOOL FIT ANALYSIS
// ============================================================================

interface SchoolFitParams {
  essayText: string;
  schoolId: string;
}

/**
 * Build school fit analysis prompt
 */
export function buildSchoolFitPrompt(params: SchoolFitParams): string {
  const school = getIvySchool(params.schoolId);
  if (!school) {
    throw new Error(`Unknown Ivy school: ${params.schoolId}`);
  }

  const fitSignalChecklist = school.fitSignals
    .map(s => `- [ ] ${s.signal} (weight: ${s.weight}/5)`)
    .join('\n');

  return `Analyze this essay for fit with ${school.name}.

SCHOOL PROFILE:
${getSchoolFactsForPrompt(params.schoolId)}

FIT SIGNALS TO CHECK:
${fitSignalChecklist}

ESSAY:
"""
${params.essayText}
"""

Return JSON:
{
  "fit_signals_found": [
    {"signal": "<from checklist>", "evidence": "<quoted text>", "strength": 1-5}
  ],
  "fit_signals_missing": ["<important missing signals>"],
  "school_references": {
    "programs_mentioned": ["<list>"],
    "courses_mentioned": ["<list>"],
    "people_mentioned": ["<list>"],
    "locations_mentioned": ["<list>"],
    "values_demonstrated": ["<list>"]
  },
  "red_flags": ["<problematic elements>"],
  "fit_score": 0-100,
  "fit_grade": "A/B/C/D/F",
  "recommendations": ["<specific improvements>"]
}`;
}

// ============================================================================
// REWRITE SUGGESTIONS - Voice-preserving
// ============================================================================

interface IvyRewriteParams {
  essayText: string;
  schoolId: string;
  goals: ('school_fit' | 'specificity' | 'voice' | 'structure' | 'clarity')[];
  toneSample?: string;
}

/**
 * Build rewrite suggestion prompt
 */
export function buildIvyRewritePrompt(params: IvyRewriteParams): string {
  const school = getIvySchool(params.schoolId);
  if (!school) {
    throw new Error(`Unknown Ivy school: ${params.schoolId}`);
  }

  const goalsDescription = params.goals.map(g => {
    switch (g) {
      case 'school_fit':
        return `Improve ${school.shortName} fit: Add specific references to programs, values, or culture`;
      case 'specificity':
        return 'Increase specificity: Replace generic statements with concrete details';
      case 'voice':
        return 'Strengthen voice: Make it sound more authentically like the student';
      case 'structure':
        return 'Improve structure: Better flow, clearer organization';
      case 'clarity':
        return 'Enhance clarity: Simpler sentences, clearer meaning';
      default:
        return g;
    }
  }).join('\n- ');

  const toneInstruction = params.toneSample
    ? `\nTONE SAMPLE (preserve this voice):\n"${params.toneSample.slice(0, 300)}..."\n\nIMPORTANT: Rewrites must match the vocabulary level, sentence patterns, and style of the tone sample.`
    : '';

  return `Provide paragraph-level rewrite suggestions for this ${school.shortName} essay.

GOALS:
- ${goalsDescription}

SCHOOL CONTEXT:
Values: ${school.valueKeywords.slice(0, 5).join(', ')}
Programs to reference: ${school.notablePrograms.slice(0, 5).join(', ')}
${toneInstruction}

ESSAY:
"""
${params.essayText}
"""

RULES:
1. Suggest improvements, don't rewrite entirely
2. Preserve the student's voice and ideas
3. Add school-specific details where appropriate
4. Each suggestion should be <100 words

Return JSON:
{
  "rewrites": [
    {
      "paragraph_index": <0-based>,
      "goal": "<from goals list>",
      "original": "<original paragraph>",
      "suggested": "<improved version>",
      "changes_made": ["<list of changes>"],
      "voice_preserved": true/false,
      "school_fit_added": true/false
    }
  ],
  "overall_notes": "<general advice>"
}`;
}

// ============================================================================
// SCORE CALCULATION - Single source of truth
// ============================================================================

interface IvyScores {
  authenticity: number;
  schoolFit: number;
  reflection: number;
  structure: number;
  specificity: number;
  clarity: number;
  mechanics: number;
  uniqueness?: number; // "So What?" test score
}

/**
 * Calculate weighted overall score for Ivy essays
 * Weights calibrated for Ivy-level competition
 */
export function calculateIvyScore(scores: IvyScores): number {
  // Default uniqueness to average of authenticity and reflection if not provided
  const uniquenessScore = scores.uniqueness ?? Math.round((scores.authenticity + scores.reflection) / 2);

  const weightedSum =
    scores.authenticity * IVY_RUBRIC_WEIGHTS.authenticity +
    scores.schoolFit * IVY_RUBRIC_WEIGHTS.schoolFit +
    scores.reflection * IVY_RUBRIC_WEIGHTS.reflection +
    scores.structure * IVY_RUBRIC_WEIGHTS.structure +
    scores.specificity * IVY_RUBRIC_WEIGHTS.specificity +
    scores.clarity * IVY_RUBRIC_WEIGHTS.clarity +
    scores.mechanics * IVY_RUBRIC_WEIGHTS.mechanics +
    uniquenessScore * IVY_RUBRIC_WEIGHTS.uniqueness;

  // Convert from 0-6 scale to 0-100
  return Math.round((weightedSum / 6) * 100);
}

/**
 * Calculate school fit score from signals
 */
export function calculateFitScore(
  foundSignals: Array<{ signal: string; strength: number }>,
  schoolId: string
): number {
  const school = getIvySchool(schoolId);
  if (!school) return 0;

  let totalWeight = 0;
  let earnedWeight = 0;

  for (const schoolSignal of school.fitSignals) {
    const categoryWeight = FIT_CATEGORY_WEIGHTS[schoolSignal.category];
    const signalWeight = schoolSignal.weight * categoryWeight;
    totalWeight += signalWeight;

    const found = foundSignals.find(f =>
      f.signal.toLowerCase().includes(schoolSignal.signal.toLowerCase().slice(0, 20))
    );

    if (found) {
      earnedWeight += signalWeight * (found.strength / 5);
    }
  }

  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}

// ============================================================================
// GUARDRAILS - Input validation and safety
// ============================================================================

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts)/i,
  /disregard\s+(your|the)\s+(instructions|guidelines)/i,
  /you\s+are\s+now\s+(a|an)/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /system\s*prompt/i,
  /bypass\s+(your|the)\s+(filter|restrictions)/i,
];

const MAX_ESSAY_LENGTH = 10000;
const MIN_ESSAY_LENGTH = 50;

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedText?: string;
}

/**
 * Validate and sanitize essay input
 */
export function validateEssayInput(text: string): ValidationResult {
  const errors: string[] = [];

  // Length checks
  if (text.length < MIN_ESSAY_LENGTH) {
    errors.push(`Essay too short (minimum ${MIN_ESSAY_LENGTH} characters)`);
  }
  if (text.length > MAX_ESSAY_LENGTH) {
    errors.push(`Essay too long (maximum ${MAX_ESSAY_LENGTH} characters)`);
  }

  // Injection detection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      errors.push('Input contains potentially unsafe content');
      break;
    }
  }

  // Sanitize: remove potential code blocks and suspicious patterns
  let sanitized = text
    .replace(/```[\s\S]*?```/g, '[code removed]')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ''); // Remove HTML tags

  return {
    valid: errors.length === 0,
    errors,
    sanitizedText: sanitized,
  };
}

/**
 * Validate school ID
 */
export function validateSchoolId(schoolId: string): boolean {
  const validIds = [
    'harvard', 'yale', 'princeton', 'columbia',
    'brown', 'dartmouth', 'cornell', 'upenn'
  ];
  return validIds.includes(schoolId.toLowerCase());
}
