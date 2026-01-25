/**
 * RAG-Enhanced Essay Analyzer
 * Integrates RAG context retrieval with the existing essay analysis pipeline
 */

import { anthropic, MODELS } from '../ai/clients';
import { calculateOverallScore, RUBRIC_WEIGHTS } from '../ai/prompts';
import { AnalysisResponseSchema } from '../validations/ai-schemas';
import type { AnalysisResponse } from '@/types/ai';

import {
  runGuardrails,
  validateAnalysisOutput,
  verifyQuotedEvidence,
  retrieveAllContext,
  buildEnhancedPrompt,
  storeAnalysisHistory,
  calculateScorePercentile,
  estimateImprovementPotential,
  prioritizeSuggestions,
  type StudentProfile,
  type RetrievedContext,
} from './index';
import { sanitizeAnalysisOutput, type SanitizationResult } from './output-sanitizer';

// =============================================================================
// TYPES
// =============================================================================

export interface RAGAnalysisParams {
  essayText: string;
  essayType: string;
  schoolId?: string;
  promptText: string;
  wordLimit?: number;
  profile?: StudentProfile;
  versionId?: string;
  userId?: string;
  skipRAG?: boolean; // For A/B testing
}

export interface RAGAnalysisResponse extends AnalysisResponse {
  rag_enhanced: boolean;
  rag_context: {
    examples_used: number;
    patterns_matched: string[];
    insights_applied: number;
    retrieval_time_ms: number;
  };
  benchmarks: {
    percentile: number;
    vs_average: number;
    estimated_improvement: number;
    sample_size: number;
  };
  pattern_matches: Array<{
    pattern_id: string;
    pattern_name: string;
    avg_improvement: number;
    evidence?: string;
  }>;
  // Code-level anti-hallucination results
  sanitization: {
    trust_score: number;        // 0-100, higher = more trustworthy
    was_modified: boolean;      // True if LLM output was sanitized
    modifications_count: number; // Number of hallucinations removed
    modifications: string[];    // List of what was modified
  };
}

// =============================================================================
// MAIN RAG ANALYSIS FUNCTION
// =============================================================================

/**
 * Analyze essay with RAG enhancement
 * This is the main entry point for RAG-enhanced analysis
 */
export async function analyzeEssayWithRAG(
  params: RAGAnalysisParams
): Promise<RAGAnalysisResponse> {
  const startTime = Date.now();

  const {
    essayText,
    essayType,
    schoolId,
    promptText,
    wordLimit,
    profile,
    versionId,
    userId,
    skipRAG = false,
  } = params;

  // Step 1: Run guardrails
  const guardrailResult = await runGuardrails(essayText);

  if (!guardrailResult.passed) {
    const blockingViolations = guardrailResult.violations.filter(
      v => v.severity === 'block'
    );
    throw new Error(
      `Input validation failed: ${blockingViolations.map(v => v.message).join(', ')}`
    );
  }

  // Use sanitized text if available
  const cleanedText = guardrailResult.sanitizedText || essayText;

  // Step 2: Retrieve RAG context (skip if A/B testing)
  let retrievedContext: RetrievedContext;
  let retrievalTimeMs = 0;

  if (!skipRAG) {
    const retrievalStart = Date.now();
    retrievedContext = await retrieveAllContext({
      essayText: cleanedText,
      schoolId,
      essayType,
      spikeCategory: profile?.spike ? categorizeSpike(profile.spike) : undefined,
    });
    retrievalTimeMs = Date.now() - retrievalStart;
  } else {
    retrievedContext = {
      exampleEssays: [],
      feedbackPatterns: [],
      schoolInsights: [],
      retrievalMetadata: {
        totalTimeMs: 0,
        exampleEssaysCount: 0,
        feedbackPatternsCount: 0,
        schoolInsightsCount: 0,
      },
    };
  }

  // Step 3: Build enhanced prompt
  const { systemPrompt, userPrompt, contextSummary } = buildEnhancedPrompt({
    essayText: cleanedText,
    essayType,
    schoolId,
    promptText,
    wordLimit,
    profile,
    retrievedContext,
  });

  // Step 4: Call Claude with enhanced prompt
  const response = await anthropic.messages.create({
    model: MODELS.CLAUDE_SONNET,
    max_tokens: 4096,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Step 5: Parse and validate response
  const rawAnalysis = parseAndValidate(content.text);

  // Step 5.5: CODE-LEVEL ANTI-HALLUCINATION (cannot be bypassed by prompts)
  // This is the HARD enforcement layer - it actually modifies the output
  const sanitizationResult: SanitizationResult = sanitizeAnalysisOutput(
    rawAnalysis,
    {
      essayText: cleanedText,
      allowedPatternIds: retrievedContext.feedbackPatterns.map(p => p.id),
      allowedExampleIds: retrievedContext.exampleEssays.map(e => e.id),
      schoolId,
    }
  );

  // Use the SANITIZED analysis, not the raw LLM output
  const analysis = sanitizationResult.sanitized;

  // Log what was modified (for monitoring, not blocking)
  if (sanitizationResult.wasModified) {
    console.warn(
      `Output sanitized (trust score: ${sanitizationResult.trustScore}/100):`,
      sanitizationResult.modifications.map(m => `${m.type}: ${m.reason}`).join('; ')
    );
  }

  // Additional soft validation (for metrics, already enforced above)
  const outputValidation = validateAnalysisOutput(
    analysis,
    cleanedText,
    {
      patternIds: retrievedContext.feedbackPatterns.map(p => p.id),
      exampleIds: retrievedContext.exampleEssays.map(e => e.id),
    }
  );

  // Step 6: Recalculate overall score for consistency
  // v2.0.0: Now uses uniqueness and ethics instead of ethics_originality
  const essayTypeKey = (essayType || 'other') as import('../scoring/rubric-config').EssayType;
  const calculatedScore = calculateOverallScore({
    authenticity: analysis.scores.authenticity.score,
    reflection: analysis.scores.reflection.score,
    structure: analysis.scores.structure.score,
    specificity_fit: analysis.scores.specificity_fit.score,
    clarity_style: analysis.scores.clarity_style.score,
    mechanics: analysis.scores.mechanics.score,
    uniqueness: analysis.scores.uniqueness.score,
    ethics: analysis.scores.ethics.score,
  }, essayTypeKey);

  analysis.overall.score_100 = calculatedScore;

  // Step 7: Calculate benchmarks
  const benchmarks = await calculateBenchmarks(
    calculatedScore,
    schoolId,
    essayType,
    retrievedContext.feedbackPatterns.map(p => p.id)
  );

  // Step 8: Match patterns to suggestions
  const patternMatches = matchPatternsToAnalysis(
    analysis,
    retrievedContext.feedbackPatterns
  );

  // Step 9: Prioritize suggestions based on profile
  if (profile?.biggestWorry && analysis.suggestions.top5) {
    // Cast to work with prioritizeSuggestions, preserving original properties
    const prioritized = prioritizeSuggestions(
      analysis.suggestions.top5.map(s => ({
        issue: s.issue,
        estimated_impact: 'medium',
      })),
      profile.biggestWorry
    );
    // Reconstruct with original properties, preserving order from prioritization
    analysis.suggestions.top5 = prioritized.map(p => {
      const original = analysis.suggestions.top5.find(s => s.issue === p.issue);
      return original || { issue: p.issue, why_it_matters: '', example_edit: '' };
    });
  }

  // Step 10: Store in analysis history for feedback loop
  if (versionId && userId) {
    try {
      await storeAnalysisHistory({
        essayVersionId: versionId,
        userId,
        schoolId,
        essayType,
        overallScore: calculatedScore,
        dimensionScores: {
          authenticity: analysis.scores.authenticity.score,
          reflection: analysis.scores.reflection.score,
          structure: analysis.scores.structure.score,
          specificity_fit: analysis.scores.specificity_fit.score,
          clarity_style: analysis.scores.clarity_style.score,
          mechanics: analysis.scores.mechanics.score,
          uniqueness: analysis.scores.uniqueness.score,
          ethics: analysis.scores.ethics.score,
        },
        issuesIdentified: extractIssues(analysis),
        patternsMatched: patternMatches.map(p => p.pattern_id),
        suggestionsGiven: analysis.suggestions,
        ragContextUsed: {
          exampleIds: retrievedContext.exampleEssays.map(e => e.id),
          patternIds: retrievedContext.feedbackPatterns.map(p => p.id),
          insightIds: retrievedContext.schoolInsights.map(i => i.id),
        },
      });
    } catch (error) {
      // Don't fail analysis if history storage fails
      console.error('Failed to store analysis history:', error);
    }
  }

  // Step 11: Build enhanced response
  const ragResponse: RAGAnalysisResponse = {
    ...analysis,
    rag_enhanced: !skipRAG && retrievedContext.exampleEssays.length > 0,
    rag_context: {
      examples_used: contextSummary.examplesUsed,
      patterns_matched: patternMatches.map(p => p.pattern_name),
      insights_applied: contextSummary.insightsUsed,
      retrieval_time_ms: retrievalTimeMs,
    },
    benchmarks: {
      percentile: benchmarks.percentile,
      vs_average: calculatedScore - benchmarks.averageScore,
      estimated_improvement: benchmarks.estimatedImprovement,
      sample_size: benchmarks.sampleSize,
    },
    pattern_matches: patternMatches,
    // Code-level anti-hallucination results (HARD enforcement, not prompt-based)
    sanitization: {
      trust_score: sanitizationResult.trustScore,
      was_modified: sanitizationResult.wasModified,
      modifications_count: sanitizationResult.modifications.length,
      modifications: sanitizationResult.modifications.map(m => `${m.type}: ${m.reason}`),
    },
  };

  return ragResponse;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse and validate AI response
 */
function parseAndValidate(text: string): AnalysisResponse {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  // Clean up common issues
  const cleaned = jsonText
    .replace(/[\u0000-\u001F]+/g, ' ')
    .replace(/,\s*([}\]])/g, '$1');

  try {
    const parsed = JSON.parse(cleaned);
    return AnalysisResponseSchema.parse(parsed) as AnalysisResponse;
  } catch (error) {
    // Try to find JSON object in the text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      const parsed = JSON.parse(objectMatch[0]);
      return AnalysisResponseSchema.parse(parsed) as AnalysisResponse;
    }
    throw new Error(`Failed to parse AI response: ${(error as Error).message}`);
  }
}

/**
 * Extract issues from analysis for storage
 */
function extractIssues(analysis: AnalysisResponse): string[] {
  const issues: string[] = [];

  // Extract from commons check
  if (analysis.commons_check) {
    for (const [key, value] of Object.entries(analysis.commons_check)) {
      if (value && typeof value === 'object' && 'flag' in value && value.flag) {
        issues.push(key);
      }
    }
  }

  // Extract from low scores
  for (const [dimension, data] of Object.entries(analysis.scores)) {
    if (data && typeof data === 'object' && 'score' in data && data.score < 4) {
      issues.push(`low_${dimension}`);
    }
  }

  return issues;
}

/**
 * Match patterns to analysis issues
 */
function matchPatternsToAnalysis(
  analysis: AnalysisResponse,
  patterns: Array<{
    id: string;
    patternName: string;
    issueType: string;
    avgScoreImprovement: number;
  }>
): Array<{
  pattern_id: string;
  pattern_name: string;
  avg_improvement: number;
  evidence?: string;
}> {
  const matches: Array<{
    pattern_id: string;
    pattern_name: string;
    avg_improvement: number;
    evidence?: string;
  }> = [];

  const issues = extractIssues(analysis);

  for (const pattern of patterns) {
    // Check if pattern matches any detected issues
    const issueMatch = issues.some(
      issue =>
        issue.includes(pattern.issueType) ||
        pattern.issueType.includes(issue)
    );

    if (issueMatch) {
      matches.push({
        pattern_id: pattern.id,
        pattern_name: pattern.patternName,
        avg_improvement: pattern.avgScoreImprovement,
      });
    }
  }

  return matches;
}

/**
 * Calculate benchmarks from analysis history
 */
async function calculateBenchmarks(
  score: number,
  schoolId?: string,
  essayType?: string,
  patternIds?: string[]
): Promise<{
  percentile: number;
  averageScore: number;
  estimatedImprovement: number;
  sampleSize: number;
}> {
  const [percentileData, improvementData] = await Promise.all([
    calculateScorePercentile(score, schoolId, essayType),
    patternIds && patternIds.length > 0
      ? estimateImprovementPotential(patternIds)
      : Promise.resolve({ estimatedImprovement: 0 }),
  ]);

  return {
    percentile: percentileData.percentile,
    averageScore: percentileData.averageScore,
    estimatedImprovement: improvementData.estimatedImprovement,
    sampleSize: percentileData.sampleSize,
  };
}

/**
 * Categorize spike/narrative into standard categories
 */
function categorizeSpike(spike: string): string {
  const spikeCategories: Record<string, string[]> = {
    'stem-research': ['research', 'science', 'lab', 'experiment', 'engineering', 'math', 'computer', 'technology'],
    'arts': ['art', 'music', 'theater', 'creative', 'writing', 'film', 'design', 'photography'],
    'social-impact': ['community', 'service', 'volunteer', 'nonprofit', 'advocacy', 'justice', 'environment'],
    'entrepreneurship': ['business', 'startup', 'company', 'entrepreneur', 'founder', 'innovation'],
    'athletics': ['sport', 'athlete', 'team', 'competition', 'coach', 'training'],
    'leadership': ['lead', 'president', 'organize', 'initiative', 'founded'],
    'humanities': ['history', 'philosophy', 'literature', 'language', 'culture', 'political'],
  };

  const spikeLower = spike.toLowerCase();

  for (const [category, keywords] of Object.entries(spikeCategories)) {
    if (keywords.some(kw => spikeLower.includes(kw))) {
      return category;
    }
  }

  return 'general';
}

// =============================================================================
// COMMONS CHECK (FAST)
// =============================================================================

/**
 * Run quick commons check without full RAG
 * Uses Haiku for speed
 */
export async function runCommonsCheckWithRAG(
  essayText: string,
  schoolId?: string
): Promise<{
  commons_check: AnalysisResponse['commons_check'];
  quick_tips: string[];
  risk_score: number;
}> {
  // Run guardrails first
  const guardrailResult = await runGuardrails(essayText);
  const cleanedText = guardrailResult.sanitizedText || essayText;

  // Build minimal prompt
  const prompt = `Quickly scan this college essay and flag common issues:
${schoolId ? `Target school: ${schoolId}\n` : ''}
${cleanedText}

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

  const response = await anthropic.messages.create({
    model: MODELS.CLAUDE_HAIKU,
    max_tokens: 2048,
    temperature: 0.3,
    system: 'You are a rapid essay screener. Identify common issues quickly. Return valid JSON only.',
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  // Extract JSON with proper error handling
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Failed to extract JSON from commons check response:', content.text.slice(0, 200));
    // Return safe defaults instead of throwing
    return {
      commons_check: getDefaultCommonsCheck(),
      quick_tips: ['Unable to perform automated check - manual review recommended'],
      risk_score: guardrailResult.riskScore,
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('Failed to parse commons check JSON:', parseError);
    return {
      commons_check: getDefaultCommonsCheck(),
      quick_tips: ['Unable to parse analysis - manual review recommended'],
      risk_score: guardrailResult.riskScore,
    };
  }

  // Validate we have the expected structure
  if (!parsed.commons_check || typeof parsed.commons_check !== 'object') {
    console.warn('Commons check response missing expected structure');
    return {
      commons_check: getDefaultCommonsCheck(),
      quick_tips: parsed.quick_tips || [],
      risk_score: guardrailResult.riskScore,
    };
  }

  return {
    commons_check: parsed.commons_check,
    quick_tips: parsed.quick_tips || [],
    risk_score: guardrailResult.riskScore,
  };
}

/**
 * Get default commons check flags (all false)
 */
function getDefaultCommonsCheck(): AnalysisResponse['commons_check'] {
  return {
    about_applicant: { flag: false },
    jargon_overuse: { flag: false },
    goals_articulated: { flag: false },
    school_alignment: { flag: false },
    buzzwords_cliches: { flag: false },
    genericness: { flag: false },
    reflection_depth_needed: { flag: false },
    exaggeration: { flag: false },
    tone_drift: { flag: false },
    ethics_risks: { flag: false },
  };
}
