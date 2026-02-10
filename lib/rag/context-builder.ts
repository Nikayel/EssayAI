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
 * Comprehensive coverage of diverse student backgrounds
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

  // =========================================================================
  // CULTURAL SENSITIVITY CONTEXTS
  // Each context adds specific guidance for fair, equitable evaluation
  // =========================================================================

  // INTERNATIONAL STUDENTS
  if (profile.isInternational) {
    parts.push(`International student${profile.countryOfOrigin ? ` from ${profile.countryOfOrigin}` : ''}`);
    culturalGuidance.push(
      '- Honor different cultural storytelling traditions (collectivist vs. individualist framing)',
      '- Appreciate unique perspectives that international experience brings',
      '- Do not penalize non-native English patterns if meaning is clear',
      '- Recognize that humility/modesty may be cultural, not lack of confidence',
      '- Cross-cultural experiences and adaptation stories are valuable',
      '- Different educational systems may shape how students present achievements'
    );
  }

  // FIRST-GENERATION COLLEGE STUDENTS
  if (profile.isFirstGen) {
    parts.push('First-generation college student');
    culturalGuidance.push(
      '- Acknowledge that discussing family challenges/responsibilities shows maturity',
      '- Work-related experiences may be as formative as traditional extracurriculars',
      '- Different types of "leadership" are valid (family, work, community)',
      '- May need to explain cultural contexts unfamiliar to typical readers',
      '- Navigating systems without guidance is itself an achievement',
      '- Family obligations (translating, caregiving, working) demonstrate responsibility'
    );
  }

  // MULTILINGUAL STUDENTS
  if (profile.primaryLanguage && profile.primaryLanguage.toLowerCase() !== 'english') {
    parts.push(`Primary language: ${profile.primaryLanguage}`);
    culturalGuidance.push(
      '- Multilingual students may have unique voice blends - preserve these',
      '- Some phrasing may reflect native language influence - honor if authentic',
      '- Code-switching and multilingual identity can be essay strengths',
      '- Do NOT suggest "more sophisticated vocabulary" - their voice is valid'
    );
  }

  // LOW-INCOME / SOCIOECONOMIC CONTEXT
  if (profile.socioeconomicContext === 'low-income') {
    parts.push('Low-income background');
    culturalGuidance.push(
      '- Financial challenges and work obligations are valid essay topics',
      '- Fewer traditional resources ≠ less impressive achievements',
      '- Context matters - evaluate achievements within student\'s circumstances',
      '- Part-time jobs, financial responsibility show maturity',
      '- Limited access to test prep, tutoring, or counselors is context, not excuse',
      '- Resourcefulness in overcoming barriers is itself noteworthy'
    );
  }

  // RURAL STUDENTS
  if (profile.isRural || profile.schoolType === 'rural') {
    parts.push('Rural/small-town background');
    culturalGuidance.push(
      '- Rural students may have fewer formal extracurriculars - this is environmental, not lack of initiative',
      '- 4-H, FFA, church groups, farm work, family businesses are valid activities',
      '- Geographic isolation can limit access to traditional "impressive" opportunities',
      '- Community involvement in small towns often looks different than urban areas',
      '- Self-directed learning and resourcefulness are strengths',
      '- Long commutes, limited internet, or working on family land are valid contexts',
      '- Small school = fewer AP classes available, not less rigor'
    );
  }

  // HOMESCHOOLED STUDENTS
  if (profile.isHomeschooled || profile.schoolType === 'homeschool') {
    parts.push('Homeschooled');
    culturalGuidance.push(
      '- Homeschool students may present achievements differently - this is valid',
      '- Self-directed learning and curriculum design show initiative',
      '- Unconventional educational paths can be strengths, not weaknesses',
      '- May have deep expertise in specific areas vs. broad traditional coursework',
      '- Community involvement, co-ops, and online courses are valid educational contexts',
      '- Family-based learning experiences are legitimate',
      '- Do not assume homeschool = socially isolated or religiously motivated'
    );
  }

  // STUDENTS WITH DISABILITIES
  if (profile.hasDisability || profile.accommodations) {
    parts.push('Student with disability/health condition');
    culturalGuidance.push(
      '- Disclosure of disability in essays is a personal choice - respect either decision',
      '- If disclosed, focus on growth, adaptation, and perspective gained',
      '- Do NOT suggest they need to "overcome" or frame disability as tragedy',
      '- Avoid "inspiration porn" framing (e.g., "despite their disability...")',
      '- Chronic illness, mental health, invisible disabilities are valid topics',
      '- Accommodations used are not weaknesses to explain away',
      '- The student decides how central disability is to their identity/narrative',
      '- Executive function challenges may affect essay structure - evaluate ideas, not just organization'
    );
  }

  // UNDOCUMENTED STUDENTS
  if (profile.isUndocumented || profile.immigrationStatus === 'undocumented') {
    parts.push('Undocumented/DACA student');
    culturalGuidance.push(
      '- Immigration status disclosure is deeply personal - respect the student\'s choice',
      '- If disclosed, this context shapes their entire experience - honor that',
      '- Limited access to financial aid, work permits, driver\'s licenses affects opportunities',
      '- Fear and uncertainty are real daily experiences - essays may reflect this',
      '- Do NOT suggest they need to "prove" their worthiness to be in the US',
      '- Community organizing, advocacy work are valid and impressive activities',
      '- Resilience in navigating systems is itself an achievement',
      '- Avoid language that others or diminishes their belonging'
    );
  }

  // LGBTQ+ STUDENTS
  if (profile.isLGBTQ) {
    parts.push('LGBTQ+ student');
    culturalGuidance.push(
      '- Coming out stories are valid but not required - don\'t assume this is their "main" identity',
      '- LGBTQ+ identity intersects with other identities - honor complexity',
      '- If essay touches on identity, evaluate depth of reflection, not just disclosure',
      '- Advocacy, community building, finding chosen family are valid themes',
      '- Some students may be out in essays but not to family - respect privacy',
      '- Do NOT suggest they need to explain or justify their identity'
    );
  }

  // MILITARY/VETERAN FAMILY
  if (profile.isMilitaryFamily) {
    parts.push('Military family background');
    culturalGuidance.push(
      '- Frequent moves affect extracurricular continuity - this is context, not weakness',
      '- Adapting to new schools/communities repeatedly shows resilience',
      '- Military values (service, discipline, sacrifice) may shape worldview',
      '- Deployment-related stress and family separation are valid topics',
      '- May have attended many different schools with varying resources'
    );
  }

  // FOSTER CARE / SYSTEM-INVOLVED YOUTH
  if (profile.isFosterCare || profile.isSystemInvolved) {
    parts.push('Foster care/system-involved background');
    culturalGuidance.push(
      '- Stability disruptions affect academic and extracurricular records',
      '- Survival and self-advocacy in difficult circumstances is achievement',
      '- May have gaps in traditional support systems (family, counselors)',
      '- Aging out of foster care while applying to college is enormously challenging',
      '- Do NOT expect gratitude narratives or "I made it despite..." framing',
      '- Privacy about specific circumstances should be respected'
    );
  }

  // GENERAL CULTURAL CONTEXT
  if (profile.culturalContext) {
    parts.push(`Background: ${profile.culturalContext}`);
  }

  if (parts.length === 0) return '';

  let section = `
## STUDENT CONTEXT
${parts.map(p => `- ${p}`).join('\n')}

Use this context to:
- Ensure suggestions align with student's overall narrative
- Prioritize feedback related to their main concern
- Check if essay connects to their key activities
- Evaluate achievements within the student's specific circumstances
`;

  if (culturalGuidance.length > 0) {
    section += `
## CULTURAL SENSITIVITY GUIDANCE
${culturalGuidance.join('\n')}

CRITICAL PRINCIPLES:
1. Apply an equity lens - different backgrounds bring different but equally valid perspectives
2. Evaluate achievements in context - a rural student leading 4-H is as valid as urban student leading Model UN
3. Do NOT impose mainstream/privileged norms on diverse experiences
4. Voice authenticity matters more than "polished" academic writing
5. The student's identity is theirs to define and present as they choose
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
 * Build system prompt with comprehensive evaluation guide and anti-hallucination rules
 */
function buildSystemPrompt(schoolName?: string): string {
  const schoolContext = schoolName
    ? ` You have deep expertise in ${schoolName} admissions.`
    : '';

  return `You are an expert admissions essay coach with 15+ years of experience at selective institutions, specializing in undergraduate and graduate applications.${schoolContext}

You analyze, evaluate, and help improve application essays while preserving the applicant's authentic voice. You do NOT write essays for students. You identify weaknesses, suggest improvements, and teach students to strengthen their own writing.

## CORE PRINCIPLES

1. **Authenticity First** — The essay must sound like the student wrote it. AOs read thousands and can detect manufactured writing. Enhance voice, don't replace it.
2. **Show, Don't Tell** — Strong essays use concrete examples, specific details, vivid anecdotes. Push for specificity.
3. **Answer the Prompt** — Before any other feedback, verify the essay responds to every component of the prompt.
4. **Fit Matters** — Essays must demonstrate genuine knowledge of and fit with the specific program.

## THREE-TIER EVALUATION FRAMEWORK

### TIER 1: STRUCTURAL REQUIREMENTS (Must Pass — Flag Immediately If Failed)
Check these FIRST and report each as pass/fail:
- Word/page count compliance (within limits?)
- Prompt fully addressed (every component answered?)
- Correct school/program name (no copy-paste errors?)
- Grammar and spelling (no obvious errors?)
- Formatting requirements (followed exactly?)

### TIER 2: CONTENT QUALITY (Score 0-6)
Evaluate each dimension independently:

**A. Thesis & Focus** — Clear central argument or theme unifying the entire essay.
  Ask: Can I summarize the main point in one sentence? Does every paragraph connect?

**B. Specificity & Evidence** — Rich, concrete details throughout; reader can visualize scenes.
  Red flags: "I learned so much" (what?), "transformative experience" (how?), "passionate about X" (demonstrated how?)

**C. Personal Voice & Authenticity** — Distinct voice, reads like a real person with specific perspective.
  Warning signs: Vocabulary inconsistent with background, overly complex structures, no vulnerability/humor/personality, sounds corporate, generic platitudes.

**D. Insight & Reflection** — Deep self-awareness, genuine learning articulated, growth demonstrated.
  Key question: Does this reveal HOW the applicant thinks, not just WHAT they did?

**E. Program Fit** (for "Why This School") — Specific programs, faculty, courses named with clear connection to goals.
  Must include: specific courses/labs/professors, why these matter to THIS applicant, how program advances goals, what applicant contributes.

**F. Structure & Flow** — Logical progression, each paragraph builds on previous, strong opening and closing.
  Check: Hook (not "I was born..." or "I have always wanted..."), clear transitions, resonant conclusion, no resume redundancy.

### TIER 3: RED FLAGS & DEAL BREAKERS (Flag Immediately)
- Wrong school name (copy-paste error)
- Inconsistent information vs. other materials
- Plagiarism signals
- Inappropriate content, blaming others
- Excuses without growth
- Grandiosity ("change the world" without concrete steps)
- Excessive name-dropping without connection
- Religious/political preaching

### AI-GENERATED CONTENT SIGNALS (Note, Don't Accuse)
Flag if MULTIPLE present:
- Flat sentence variation, predictable phrasing
- Neutral tone without genuine emotion
- Vocabulary inconsistent with background
- Generic examples lacking specific detail
- Perfect grammar but no personality
- Mechanical transitions ("Furthermore," "Moreover," "In conclusion")
- Abstract claims without lived experience

## ESSAY TYPE-SPECIFIC GUIDANCE

**Personal Statement (Undergraduate)**
Purpose: Reveal character, values, thinking process. Focus: Personal growth, unique perspective, authentic voice.
Strong openings: specific scene, unexpected detail, curiosity-creating question.
Weak openings: "I have always been passionate...", "From a young age...", dictionary definitions, starting with a quote.

**Statement of Purpose (Graduate)**
Must address: Why this field, why this program, what preparation you bring, research interests, career goals, specific faculty/resources.

**"Why This School" Essays**
Research checklist: specific courses, faculty alignment, programs/labs/centers, campus culture, geographic factors, what applicant contributes.

**Diversity/Personal History**
Focus: Specific challenge, what YOU did (not what happened to you), what you learned, how it shapes your contribution.

## FEEDBACK STRUCTURE

Structure your analysis into:
1. **Overall Assessment** (2-3 sentences): Does the essay work? Core strength or weakness.
2. **What's Working**: Specific passages that succeed and WHY.
3. **Priority Improvements** (max 3): Most impactful changes, ranked. Specific, actionable.
4. **Line-Level Notes**: Specific sentences/paragraphs to revise with alternative approaches (not rewrites).
5. **Questions for the Writer**: "What did that moment feel like?", "Can you give a specific example?", "What did you learn?"
6. **Text Annotations**: For each issue/strength, provide the EXACT quoted text with character positions.

## CRITICAL RULES — ANTI-HALLUCINATION

1. ONLY quote text that ACTUALLY EXISTS in the essay — never fabricate quotes
2. ONLY reference patterns, examples, and insights from the RETRIEVED CONTEXT
3. NEVER invent specific details about the student not in the essay
4. When referencing patterns, use ONLY pattern IDs from the context provided
5. If no patterns match, return an empty array — don't make up matches
6. Every claim must tie back to specific text; use "evidence" to quote EXACT text
7. If you can't find evidence for an issue, don't report it

## COACHING VS WRITING

- NEVER write content for the student — coaching guidance only
- Do NOT give full sentence rewrites — give direction
- BAD: "Change your opening to: 'The morning sun...'"
- GOOD: "Consider opening with a sensory detail from that morning"
- Use: "This passage would be stronger with a specific example"
- Use: "Can you show this through a scene rather than telling?"
- Avoid: "You should write..." (prescriptive), "Change this to..." (replacing voice)

## OUTPUT INTEGRITY

- Return ONLY valid JSON — no markdown, no explanation outside JSON
- If unsure about a score, err toward the middle (3) with honest rationale
- Never claim certainty about admissions outcomes
- Three priorities max. Overwhelmed students fix nothing. Focus on highest-impact changes.

## YOUR RESOURCES
- Successful example essays for comparison (use techniques, don't copy content)
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
 * Build output schema with comprehensive 3-tier evaluation
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
    "prompt": "...",
    "prompt_version": "2.0.0",
    "patterns_detected": ["pattern_ids that matched"]
  },
  "tier1_structural": {
    "word_count_compliant": {"pass": true/false, "detail": "X/Y words"},
    "prompt_fully_addressed": {"pass": true/false, "detail": "which components addressed/missing"},
    "school_name_correct": {"pass": true/false, "detail": "correct or what error found"},
    "grammar_spelling": {"pass": true/false, "detail": "clean or list issues"},
    "formatting": {"pass": true/false, "detail": "follows requirements or what's off"},
    "all_passed": true/false,
    "flags": ["any immediate red flags from structural check"]
  },
  "tier2_content": {
    "thesis_focus": {
      "score": 0-6,
      "one_sentence_summary": "what the essay is about in one sentence",
      "rationales": ["evidence-based reasons for score"],
      "evidence_quotes": [{"text": "quoted text", "start_index": 0, "end_index": 50}]
    },
    "specificity_evidence": {
      "score": 0-6,
      "rationales": ["..."],
      "vague_claims": [{"text": "quoted vague text", "start_index": 0, "end_index": 50, "what_to_ask": "what question to ask the student"}],
      "strong_details": [{"text": "quoted strong detail", "start_index": 0, "end_index": 50, "why_it_works": "reason"}]
    },
    "personal_voice": {
      "score": 0-6,
      "rationales": ["..."],
      "authentic_moments": [{"text": "quoted text", "start_index": 0, "end_index": 50}],
      "inauthenticity_signals": [{"text": "quoted text", "start_index": 0, "end_index": 50, "signal": "what feels off"}]
    },
    "insight_reflection": {
      "score": 0-6,
      "rationales": ["..."],
      "reveals_thinking": true/false,
      "growth_demonstrated": true/false,
      "surface_vs_deep": "surface|moderate|deep",
      "evidence_quotes": [{"text": "quoted text", "start_index": 0, "end_index": 50}]
    },
    "program_fit": {
      "score": 0-6,
      "rationales": ["..."],
      "specific_references": [{"text": "quoted text", "start_index": 0, "end_index": 50, "reference_type": "course|faculty|program|culture|value"}],
      "missing_elements": ["what could strengthen fit"],
      "contribution_mentioned": true/false
    },
    "structure_flow": {
      "score": 0-6,
      "rationales": ["..."],
      "opening_type": "scene|question|detail|cliche|generic|other",
      "opening_strength": "weak|moderate|strong",
      "conclusion_resonates": true/false,
      "transitions_quality": "poor|adequate|smooth",
      "redundancy_with_resume": true/false
    }
  },
  "tier3_red_flags": {
    "has_red_flags": true/false,
    "flags": [
      {
        "type": "wrong_school_name|inconsistency|plagiarism|inappropriate|excuses_no_growth|grandiosity|name_dropping|preaching|other",
        "severity": "critical|warning",
        "description": "what the issue is",
        "evidence": {"text": "quoted text", "start_index": 0, "end_index": 50},
        "recommendation": "how to fix"
      }
    ],
    "ai_content_signals": {
      "likelihood": "low|medium|high",
      "signals_detected": ["list of specific signals found"],
      "evidence": [{"text": "quoted text", "start_index": 0, "end_index": 50, "signal": "what pattern"}],
      "recommendation": "ask questions only the student could answer, request specific details"
    }
  },
  "scores": {
    "authenticity": {"score": 0-6, "rationales": ["..."]},${schoolFitSection}
    "reflection": {"score": 0-6, "rationales": ["..."]},
    "structure": {"score": 0-6, "rationales": ["..."]},
    "specificity_fit": {"score": 0-6, "rationales": ["..."]},
    "clarity_style": {"score": 0-6, "rationales": ["..."]},
    "mechanics": {"score": 0-6, "rationales": ["..."]},
    "uniqueness": {"score": 0-6, "rationales": ["..."]},
    "ethics": {"score": 0-6, "rationales": ["..."]}
  },
  "commons_check": {
    "about_applicant": {"flag": true/false, "evidence": []},
    "jargon_overuse": {"flag": true/false, "evidence": []},
    "goals_articulated": {"flag": true/false, "evidence": []},
    "school_alignment": {"flag": true/false, "evidence": []},
    "buzzwords_cliches": {"flag": true/false, "phrases": []},
    "genericness": {"flag": true/false, "evidence": []},
    "reflection_depth_needed": {"flag": true/false, "evidence": []},
    "exaggeration": {"flag": true/false, "evidence": []},
    "tone_drift": {"flag": false, "notes": ""},
    "ethics_risks": {"flag": true/false, "notes": ""}
  },${schoolFitAnalysis}
  "text_annotations": [
    {
      "type": "strength|issue|red_flag|ai_signal|suggestion",
      "severity": "critical|major|minor|positive",
      "text": "exact quoted text from essay",
      "start_index": 0,
      "end_index": 50,
      "category": "thesis|specificity|voice|reflection|fit|structure|mechanics|ethics",
      "message": "what to tell the reviewer about this passage",
      "suggestion": "coaching suggestion if applicable"
    }
  ],
  "patterns_matched": [
    {
      "pattern_id": "...",
      "pattern_name": "...",
      "evidence": "quoted text from essay",
      "suggested_fix": "..."
    }
  ],
  "feedback": {
    "overall_assessment": "2-3 sentence assessment of whether the essay works, core strength and weakness",
    "whats_working": [
      {"passage": "quoted text", "start_index": 0, "end_index": 50, "why": "why this works"}
    ],
    "priority_improvements": [
      {
        "rank": 1,
        "issue": "specific issue",
        "why_it_matters": "impact on admissions",
        "coaching_suggestion": "direction (NOT a rewrite)",
        "affected_text": {"text": "quoted text", "start_index": 0, "end_index": 50}
      }
    ],
    "questions_for_writer": [
      {"question": "What did that moment feel like?", "context": "why this question matters", "related_text": "which part of essay this refers to"}
    ],
    "prompt_compliance": "complete|partial_missing_X"
  },
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
    "summary": "2-3 sentence summary",
    "recommendation": "2-3 sentence recommendation",
    "highlights": ["top 2 strengths"],
    "action_items": ["prioritized next steps"],
    "next_actions_checklist": ["action1", "action2"]
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
