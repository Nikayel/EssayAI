/**
 * RAG Context Builder Module
 * Builds enhanced prompts with retrieved context for better analysis
 */

import { getIvySchool, getSchoolFactsForPrompt } from '../data/ivy-league';
import type {
  RetrievedContext,
  StudentProfile,
  EnhancedPromptInput,
  EnhancedPromptOutput,
  ExampleEssayMatch,
  FeedbackPatternMatch,
  SchoolInsightMatch,
} from './types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
  // Maximum context lengths (in characters) to stay within token limits
  maxExampleLength: 500,
  maxPatternLength: 300,
  maxInsightLength: 200,
  maxTotalContextLength: 4000,

  // How many of each to include
  maxExamples: 3,
  maxPatterns: 5,
  maxInsights: 3,
};

// =============================================================================
// MAIN CONTEXT BUILDER
// =============================================================================

/**
 * Build enhanced prompt with RAG context
 * Integrates retrieved examples, patterns, and insights into the analysis prompt
 */
export function buildEnhancedPrompt(
  input: EnhancedPromptInput
): EnhancedPromptOutput {
  const {
    essayText,
    essayType,
    schoolId,
    promptText,
    wordLimit,
    profile,
    retrievedContext,
  } = input;

  // Get school data if available
  const school = schoolId ? getIvySchool(schoolId) : undefined;
  const schoolFacts = schoolId ? getSchoolFactsForPrompt(schoolId) : '';

  // Build context sections
  const profileSection = buildProfileSection(profile);
  const examplesSection = buildExamplesSection(retrievedContext.exampleEssays);
  const patternsSection = buildPatternsSection(retrievedContext.feedbackPatterns);
  const insightsSection = buildInsightsSection(retrievedContext.schoolInsights);

  // Build the system prompt
  const systemPrompt = buildSystemPrompt(school?.shortName || schoolId);

  // Build the user prompt with all context
  const userPrompt = buildUserPrompt({
    essayText,
    essayType,
    schoolId,
    schoolFacts,
    promptText,
    wordLimit,
    profileSection,
    examplesSection,
    patternsSection,
    insightsSection,
    school,
  });

  return {
    systemPrompt,
    userPrompt,
    contextSummary: {
      examplesUsed: Math.min(retrievedContext.exampleEssays.length, CONFIG.maxExamples),
      patternsUsed: Math.min(retrievedContext.feedbackPatterns.length, CONFIG.maxPatterns),
      insightsUsed: Math.min(retrievedContext.schoolInsights.length, CONFIG.maxInsights),
    },
  };
}

// =============================================================================
// SECTION BUILDERS
// =============================================================================

/**
 * Build student profile section with cultural sensitivity guidance
 */
function buildProfileSection(profile?: StudentProfile): string {
  if (!profile) return '';

  const parts: string[] = [];
  const culturalGuidance: string[] = [];

  if (profile.spike) {
    parts.push(`Main narrative/spike: ${profile.spike}`);
  }

  if (profile.topActivities && profile.topActivities.length > 0) {
    parts.push(`Key activities: ${profile.topActivities.slice(0, 3).join(', ')}`);
  }

  if (profile.biggestWorry) {
    parts.push(`Primary concern: ${profile.biggestWorry}`);
  }

  if (profile.graduationYear) {
    parts.push(`Graduation: ${profile.graduationYear}`);
  }

  // Handle diversity context with sensitivity
  if (profile.isInternational) {
    parts.push(`International student${profile.countryOfOrigin ? ` from ${profile.countryOfOrigin}` : ''}`);
    culturalGuidance.push(
      '- Honor different cultural storytelling traditions (e.g., collectivist vs. individualist framing)',
      '- Appreciate unique perspectives that international experience brings',
      '- Do not penalize non-native English patterns if meaning is clear',
      '- Recognize that humility/modesty may be cultural, not lack of confidence'
    );
  }

  if (profile.isFirstGen) {
    parts.push('First-generation college student');
    culturalGuidance.push(
      '- Acknowledge that discussing family challenges/responsibilities shows maturity',
      '- Work-related experiences may be as formative as traditional extracurriculars',
      '- Different types of "leadership" are valid (family, work, community)',
      '- May need to explain cultural contexts that are unfamiliar to readers'
    );
  }

  if (profile.primaryLanguage && profile.primaryLanguage.toLowerCase() !== 'english') {
    parts.push(`Primary language: ${profile.primaryLanguage}`);
    culturalGuidance.push(
      '- Multilingual students may have unique voice blends - preserve these',
      '- Some phrasing may reflect native language influence - honor if authentic'
    );
  }

  if (profile.culturalContext) {
    parts.push(`Background: ${profile.culturalContext}`);
  }

  if (profile.socioeconomicContext === 'low-income') {
    culturalGuidance.push(
      '- Financial challenges and work obligations are valid essay topics',
      '- Fewer traditional resources ≠ less impressive achievements',
      '- Context matters - evaluate achievements within student\'s circumstances'
    );
  }

  if (parts.length === 0) return '';

  let section = `
## STUDENT CONTEXT
${parts.map(p => `- ${p}`).join('\n')}

Use this context to:
- Ensure suggestions align with student's overall narrative
- Prioritize feedback related to their main concern
- Check if essay connects to their key activities
`;

  if (culturalGuidance.length > 0) {
    section += `
## CULTURAL SENSITIVITY GUIDANCE
${culturalGuidance.join('\n')}

IMPORTANT: Apply an equity lens. Different backgrounds bring different but equally valid perspectives.
`;
  }

  return section;
}

/**
 * Build examples section from retrieved essays
 */
function buildExamplesSection(examples: ExampleEssayMatch[]): string {
  if (examples.length === 0) return '';

  const topExamples = examples.slice(0, CONFIG.maxExamples);

  const exampleStrings = topExamples.map((ex, i) => {
    const snippet = truncateText(ex.contentSnippet, CONFIG.maxExampleLength);
    const themes = ex.themeTags.slice(0, 3).join(', ');
    const techniques = ex.keyTechniques.slice(0, 3).join(', ');

    return `
### Example ${i + 1}${ex.outcome ? ` (${ex.outcome})` : ''}${ex.scoreRange ? ` - Score: ${ex.scoreRange}` : ''}
**Themes**: ${themes || 'N/A'}
**Techniques**: ${techniques || 'N/A'}
${ex.strengthNotes ? `**Why it worked**: ${truncateText(ex.strengthNotes, 100)}` : ''}

> "${snippet}"
`;
  });

  return `
## SIMILAR SUCCESSFUL ESSAYS
The following excerpts are from essays that succeeded${topExamples[0]?.schoolId ? ` at ${topExamples[0].schoolId}` : ''}:
${exampleStrings.join('\n')}

When analyzing, consider:
- What techniques from these examples could improve the essay?
- Does the student's essay show similar depth and specificity?
- Are there structural elements worth emulating?
`;
}

/**
 * Build patterns section from retrieved feedback patterns
 */
function buildPatternsSection(patterns: FeedbackPatternMatch[]): string {
  if (patterns.length === 0) return '';

  const topPatterns = patterns.slice(0, CONFIG.maxPatterns);

  const patternStrings = topPatterns.map(p => {
    const improvement = p.avgScoreImprovement > 0
      ? ` (avg +${p.avgScoreImprovement.toFixed(1)} points when fixed)`
      : '';
    const success = p.successRate > 0
      ? ` [${Math.round(p.successRate * 100)}% success rate]`
      : '';

    let patternInfo = `- **${p.patternName}**: ${truncateText(p.description, 150)}${improvement}${success}`;

    if (p.exampleBefore && p.exampleAfter) {
      patternInfo += `\n  - Before: "${truncateText(p.exampleBefore, 80)}"\n  - After: "${truncateText(p.exampleAfter, 80)}"`;
    }

    return patternInfo;
  });

  return `
## COMMON PATTERNS TO CHECK
Check if this essay exhibits any of these common issues:
${patternStrings.join('\n')}

If you detect any of these patterns:
1. Note the specific issue in your analysis
2. Reference the average improvement when addressed
3. Provide a targeted suggestion based on the fix strategy
`;
}

/**
 * Build insights section from school insights
 */
function buildInsightsSection(insights: SchoolInsightMatch[]): string {
  if (insights.length === 0) return '';

  const topInsights = insights.slice(0, CONFIG.maxInsights);

  // Group by type for cleaner presentation
  const grouped: Record<string, SchoolInsightMatch[]> = {};
  for (const insight of topInsights) {
    if (!grouped[insight.insightType]) {
      grouped[insight.insightType] = [];
    }
    grouped[insight.insightType].push(insight);
  }

  const sections: string[] = [];

  for (const [type, items] of Object.entries(grouped)) {
    const typeLabel = formatInsightType(type);
    const itemStrings = items.map(i => {
      const source = i.source ? ` _(${i.source})_` : '';
      return `- ${truncateText(i.content, CONFIG.maxInsightLength)}${source}`;
    });
    sections.push(`**${typeLabel}:**\n${itemStrings.join('\n')}`);
  }

  return `
## SCHOOL-SPECIFIC INSIGHTS
${sections.join('\n\n')}

Use these insights to:
- Evaluate how well the essay demonstrates school fit
- Identify missing opportunities to reference specific programs/values
- Flag any content that contradicts school expectations
`;
}

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

/**
 * Build system prompt with anti-hallucination and grounding rules
 */
function buildSystemPrompt(schoolName?: string): string {
  const schoolContext = schoolName
    ? ` You have deep expertise in ${schoolName} admissions.`
    : '';

  return `You are an expert college admissions counselor with 15+ years of experience reviewing essays.${schoolContext}

## CRITICAL RULES - MUST FOLLOW

### Anti-Hallucination (MOST IMPORTANT)
1. ONLY quote text that ACTUALLY EXISTS in the essay - never fabricate quotes
2. ONLY reference patterns, examples, and insights from the RETRIEVED CONTEXT
3. If you're uncertain about something, say "based on the essay" not "the student said"
4. NEVER invent specific details about the student (names, places, activities) not in the essay
5. When referencing patterns, use ONLY pattern IDs from the context provided
6. If no patterns match, return an empty patterns_matched array - don't make up matches

### Coaching vs Writing
7. NEVER write content for the student - provide coaching guidance only
8. DO NOT give full sentence rewrites - give direction and let them write
9. BAD: "Change your opening to: 'The morning sun...'"
10. GOOD: "Consider opening with a sensory detail from that morning"

### Voice & Cultural Sensitivity
11. PRESERVE the student's authentic voice - don't impose "proper" academic English
12. RESPECT cultural differences in storytelling and expression
13. International students may have different narrative styles - this is valid
14. First-generation college students may discuss challenges differently - honor their perspective
15. Avoid assumptions about socioeconomic background

### Grounding & Evidence
16. Every claim must tie back to specific text from the essay
17. Use "evidence" field to quote the EXACT text you're referencing
18. If you can't find evidence for an issue, don't report that issue
19. Base scores ONLY on what's present in the essay, not what's missing

### Output Integrity
20. Return ONLY valid JSON - no markdown, no explanation outside JSON
21. If unsure about a score, err toward the middle (3) with honest rationale
22. Never claim certainty about admissions outcomes - use probabilistic language

## YOUR RESOURCES
- Successful example essays for comparison (use their techniques, don't copy their content)
- Common patterns with proven improvement data (reference by ID when detected)
- School-specific insights from admissions sources (ground suggestions in these)

Analyze thoughtfully. Ground everything in evidence. Coach, don't write.`;
}

/**
 * Build the complete user prompt
 */
function buildUserPrompt(params: {
  essayText: string;
  essayType: string;
  schoolId?: string;
  schoolFacts: string;
  promptText: string;
  wordLimit?: number;
  profileSection: string;
  examplesSection: string;
  patternsSection: string;
  insightsSection: string;
  school: ReturnType<typeof getIvySchool>;
}): string {
  const {
    essayText,
    essayType,
    schoolId,
    schoolFacts,
    promptText,
    wordLimit,
    profileSection,
    examplesSection,
    patternsSection,
    insightsSection,
    school,
  } = params;

  // Calculate word count
  const wordCount = essayText.split(/\s+/).filter(w => w.length > 0).length;
  const wordLimitInfo = wordLimit
    ? `Word limit: ${wordLimit} | Current: ${wordCount} (${wordCount > wordLimit ? 'OVER' : 'OK'})`
    : `Word count: ${wordCount}`;

  // Build sections conditionally
  let contextSections = '';

  if (profileSection) {
    contextSections += profileSection;
  }

  if (schoolFacts) {
    contextSections += `
## SCHOOL DATA
${schoolFacts}
`;
  }

  if (examplesSection) {
    contextSections += examplesSection;
  }

  if (patternsSection) {
    contextSections += patternsSection;
  }

  if (insightsSection) {
    contextSections += insightsSection;
  }

  // Build output schema based on whether it's school-specific
  const outputSchema = buildOutputSchema(!!schoolId);

  return `# ESSAY ANALYSIS REQUEST

## METADATA
- Essay Type: ${essayType}
- Target School: ${schoolId || 'General'}
- ${wordLimitInfo}
- Prompt: "${truncateText(promptText, 200)}"
${contextSections}
## ESSAY TO ANALYZE
"""
${essayText}
"""

## YOUR TASK
Analyze this essay comprehensively. Use the retrieved context above to:
1. Score each dimension (0-6 scale)
2. Check for common patterns and flag any matches
3. Compare to successful examples where relevant
4. Provide specific, actionable suggestions
5. ${schoolId ? 'Evaluate school fit with specific evidence' : 'Provide general improvement suggestions'}

${outputSchema}`;
}

/**
 * Build output schema
 */
function buildOutputSchema(isSchoolSpecific: boolean): string {
  const schoolFitSection = isSchoolSpecific
    ? `
    "school_fit": {
      "score": 0-6,
      "rationale": "...",
      "evidence_found": ["specific references to school"],
      "opportunities_missed": ["what could strengthen fit"]
    },`
    : '';

  const schoolFitAnalysis = isSchoolSpecific
    ? `
  "school_fit_analysis": {
    "demonstrated_research": ["specific school references found"],
    "value_alignment": ["how essay aligns with school values"],
    "missing_opportunities": ["what could strengthen school fit"],
    "red_flags": ["problematic elements"],
    "fit_score": 0-100
  },`
    : '';

  return `## REQUIRED OUTPUT FORMAT
Return valid JSON:
{
  "meta": {
    "essay_type": "...",
    "word_count": <number>,
    "school": "...",
    "patterns_detected": ["pattern_ids that matched"]
  },
  "scores": {
    "authenticity": {"score": 0-6, "rationales": ["..."]},${schoolFitSection}
    "reflection": {"score": 0-6, "rationales": ["..."]},
    "structure": {"score": 0-6, "rationales": ["..."]},
    "specificity_fit": {"score": 0-6, "rationales": ["..."]},
    "clarity_style": {"score": 0-6, "rationales": ["..."]},
    "mechanics": {"score": 0-6, "rationales": ["..."]}
  },
  "commons_check": {
    "about_applicant": {"flag": true/false, "evidence": []},
    "buzzwords_cliches": {"flag": true/false, "phrases": []},
    "genericness": {"flag": true/false, "evidence": []}
  },${schoolFitAnalysis}
  "patterns_matched": [
    {
      "pattern_id": "...",
      "pattern_name": "...",
      "evidence": "quoted text from essay",
      "suggested_fix": "..."
    }
  ],
  "suggestions": {
    "top5": [
      {
        "issue": "specific issue found",
        "why_it_matters": "impact on admissions",
        "example_edit": "coaching suggestion (NOT a rewrite)"
      }
    ],
    "outline_fix": ["structural suggestions"],
    "sentence_level": [{"from": "original", "to": "suggestion"}]
  },
  "overall": {
    "score_100": <weighted 0-100>,
    "recommendation": "2-3 sentence summary",
    "highlights": ["top 2 strengths"],
    "action_items": ["prioritized next steps"]
  }
}`;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Truncate text to max length, ending at word boundary
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    return truncated.slice(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Format insight type for display
 */
function formatInsightType(type: string): string {
  const labels: Record<string, string> = {
    ao_quote: 'Admissions Officer Insights',
    student_tip: 'Student Tips',
    common_mistake: 'Common Mistakes to Avoid',
    what_works: 'What Works',
    program_detail: 'Program Details',
  };

  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// =============================================================================
// PERSONALIZATION HELPERS
// =============================================================================

/**
 * Prioritize suggestions based on student's biggest worry
 */
export function prioritizeSuggestions(
  suggestions: Array<{ issue: string; estimated_impact: string }>,
  biggestWorry?: string
): Array<{ issue: string; estimated_impact: string }> {
  if (!biggestWorry) return suggestions;

  const worryMapping: Record<string, string[]> = {
    'My essay is too generic/boring': ['specificity', 'hook', 'anecdote', 'detail', 'generic'],
    "I don't know what makes me unique": ['authenticity', 'voice', 'perspective', 'unique'],
    "I can't fit everything in the word limit": ['concision', 'focus', 'cut', 'trim', 'length'],
    "I don't sound authentic": ['voice', 'tone', 'natural', 'authentic'],
    'My structure is messy': ['structure', 'flow', 'organization', 'transition'],
    "I'm not sure if I answered the prompt": ['prompt', 'answer', 'address', 'response'],
  };

  const priorityKeywords = worryMapping[biggestWorry] || [];

  return suggestions.sort((a, b) => {
    const aMatch = priorityKeywords.some(kw =>
      a.issue.toLowerCase().includes(kw)
    ) ? 1 : 0;
    const bMatch = priorityKeywords.some(kw =>
      b.issue.toLowerCase().includes(kw)
    ) ? 1 : 0;

    // First sort by worry match, then by impact
    if (bMatch !== aMatch) return bMatch - aMatch;

    const impactOrder = { high: 3, medium: 2, low: 1 };
    return (impactOrder[b.estimated_impact as keyof typeof impactOrder] || 0) -
           (impactOrder[a.estimated_impact as keyof typeof impactOrder] || 0);
  });
}

/**
 * Build minimal context for quick checks (Commons Check)
 */
export function buildMinimalContext(
  essayText: string,
  schoolId?: string
): string {
  const school = schoolId ? getIvySchool(schoolId) : null;

  return `${school ? `Target: ${school.shortName}\nValues: ${school.valueKeywords.slice(0, 5).join(', ')}\n\n` : ''}Essay:
${essayText}

Quickly scan for common issues and return JSON with commons_check flags.`;
}
