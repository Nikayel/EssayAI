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
import type {
  Tier1Structural,
  Tier2Content,
  Tier3RedFlags,
  TextAnnotation,
  FeedbackSection,
  AdminAnalysisData,
} from './types';

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
  // Full admin/reviewer analysis data with 3-tier evaluation
  admin_analysis?: AdminAnalysisData;
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
  // parseAndValidate returns both Zod-validated data AND the raw JSON
  // (Zod strips unknown fields like tier1_structural, text_annotations, etc.)
  const { validated: rawAnalysis, raw: rawJsonWithAdminFields } = parseAndValidate(content.text);

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

  // Step 11: Extract admin analysis data from the RAW AI response (pre-Zod)
  // rawJsonWithAdminFields has tier1_structural, tier2_content, tier3_red_flags,
  // text_annotations, feedback - all of which Zod would have stripped
  const adminAnalysis = extractAdminAnalysisData(rawJsonWithAdminFields, cleanedText);

  // Step 12: Build enhanced response
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
    // Full admin/reviewer analysis with 3-tier evaluation
    admin_analysis: adminAnalysis,
  };

  return ragResponse;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse and validate AI response
 * Returns both the Zod-validated response AND the raw parsed JSON.
 * Zod strips unknown fields (tier1_structural, tier2_content, etc.)
 * so we need the raw object for admin analysis extraction.
 */
function parseAndValidate(text: string): { validated: AnalysisResponse; raw: Record<string, unknown> } {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  // Clean up common issues
  const cleaned = jsonText
    .replace(/[\u0000-\u001F]+/g, ' ')
    .replace(/,\s*([}\]])/g, '$1');

  try {
    const parsed = JSON.parse(cleaned);
    const validated = AnalysisResponseSchema.parse(parsed) as AnalysisResponse;
    return { validated, raw: parsed };
  } catch (error) {
    // Try to find JSON object in the text
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      const parsed = JSON.parse(objectMatch[0]);
      const validated = AnalysisResponseSchema.parse(parsed) as AnalysisResponse;
      return { validated, raw: parsed };
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

/**
 * Extract admin analysis data from raw AI response
 * Pulls out tier1/2/3, text_annotations, and feedback sections
 * from the raw LLM output (before sanitization strips unknown fields)
 */
function extractAdminAnalysisData(
  rawAnalysis: Record<string, unknown>,
  essayText: string
): AdminAnalysisData {
  const adminData: AdminAnalysisData = {};

  // Extract Tier 1: Structural Requirements
  if (rawAnalysis.tier1_structural && typeof rawAnalysis.tier1_structural === 'object') {
    const t1 = rawAnalysis.tier1_structural as Record<string, unknown>;
    adminData.tier1_structural = {
      word_count_compliant: extractPassFail(t1.word_count_compliant),
      prompt_fully_addressed: extractPassFail(t1.prompt_fully_addressed),
      school_name_correct: extractPassFail(t1.school_name_correct),
      grammar_spelling: extractPassFail(t1.grammar_spelling),
      formatting: extractPassFail(t1.formatting),
      all_passed: t1.all_passed === true,
      flags: Array.isArray(t1.flags) ? t1.flags.filter((f): f is string => typeof f === 'string') : [],
    };
  }

  // Extract Tier 2: Content Quality
  if (rawAnalysis.tier2_content && typeof rawAnalysis.tier2_content === 'object') {
    const t2 = rawAnalysis.tier2_content as Record<string, unknown>;
    adminData.tier2_content = {};

    const dimensionKeys = [
      'thesis_focus', 'specificity_evidence', 'personal_voice',
      'insight_reflection', 'program_fit', 'structure_flow',
    ] as const;

    for (const key of dimensionKeys) {
      if (t2[key] && typeof t2[key] === 'object') {
        const dim = t2[key] as Record<string, unknown>;
        const baseDim = {
          score: typeof dim.score === 'number' ? Math.min(6, Math.max(0, dim.score)) : 3,
          rationales: Array.isArray(dim.rationales) ? dim.rationales.filter((r): r is string => typeof r === 'string') : [],
          evidence_quotes: extractTextPositions(dim.evidence_quotes, essayText),
        };

        // Add dimension-specific fields
        if (key === 'thesis_focus') {
          (adminData.tier2_content as Record<string, unknown>)[key] = {
            ...baseDim,
            one_sentence_summary: typeof dim.one_sentence_summary === 'string' ? dim.one_sentence_summary : undefined,
          };
        } else if (key === 'specificity_evidence') {
          (adminData.tier2_content as Record<string, unknown>)[key] = {
            ...baseDim,
            vague_claims: extractTextPositionsWithField(dim.vague_claims, essayText, 'what_to_ask'),
            strong_details: extractTextPositionsWithField(dim.strong_details, essayText, 'why_it_works'),
          };
        } else if (key === 'personal_voice') {
          (adminData.tier2_content as Record<string, unknown>)[key] = {
            ...baseDim,
            authentic_moments: extractTextPositions(dim.authentic_moments, essayText),
            inauthenticity_signals: extractTextPositionsWithField(dim.inauthenticity_signals, essayText, 'signal'),
          };
        } else if (key === 'insight_reflection') {
          (adminData.tier2_content as Record<string, unknown>)[key] = {
            ...baseDim,
            reveals_thinking: typeof dim.reveals_thinking === 'boolean' ? dim.reveals_thinking : undefined,
            growth_demonstrated: typeof dim.growth_demonstrated === 'boolean' ? dim.growth_demonstrated : undefined,
            surface_vs_deep: typeof dim.surface_vs_deep === 'string' ? dim.surface_vs_deep : undefined,
          };
        } else if (key === 'program_fit') {
          (adminData.tier2_content as Record<string, unknown>)[key] = {
            ...baseDim,
            specific_references: extractTextPositionsWithField(dim.specific_references, essayText, 'reference_type'),
            missing_elements: Array.isArray(dim.missing_elements) ? dim.missing_elements : [],
            contribution_mentioned: typeof dim.contribution_mentioned === 'boolean' ? dim.contribution_mentioned : undefined,
          };
        } else if (key === 'structure_flow') {
          (adminData.tier2_content as Record<string, unknown>)[key] = {
            ...baseDim,
            opening_type: typeof dim.opening_type === 'string' ? dim.opening_type : undefined,
            opening_strength: typeof dim.opening_strength === 'string' ? dim.opening_strength : undefined,
            conclusion_resonates: typeof dim.conclusion_resonates === 'boolean' ? dim.conclusion_resonates : undefined,
            transitions_quality: typeof dim.transitions_quality === 'string' ? dim.transitions_quality : undefined,
            redundancy_with_resume: typeof dim.redundancy_with_resume === 'boolean' ? dim.redundancy_with_resume : undefined,
          };
        } else {
          (adminData.tier2_content as Record<string, unknown>)[key] = baseDim;
        }
      }
    }
  }

  // Extract Tier 3: Red Flags
  if (rawAnalysis.tier3_red_flags && typeof rawAnalysis.tier3_red_flags === 'object') {
    const t3 = rawAnalysis.tier3_red_flags as Record<string, unknown>;
    adminData.tier3_red_flags = {
      has_red_flags: t3.has_red_flags === true,
      flags: Array.isArray(t3.flags) ? t3.flags.map((f: Record<string, unknown>) => ({
        type: String(f.type || 'other'),
        severity: f.severity === 'critical' ? 'critical' as const : 'warning' as const,
        description: String(f.description || ''),
        evidence: f.evidence && typeof f.evidence === 'object' ? validateTextPosition(f.evidence as Record<string, unknown>, essayText) : undefined,
        recommendation: String(f.recommendation || ''),
      })) : [],
      ai_content_signals: t3.ai_content_signals && typeof t3.ai_content_signals === 'object'
        ? {
          likelihood: (['low', 'medium', 'high'] as const).includes((t3.ai_content_signals as Record<string, unknown>).likelihood as 'low' | 'medium' | 'high')
            ? (t3.ai_content_signals as Record<string, unknown>).likelihood as 'low' | 'medium' | 'high'
            : 'low',
          signals_detected: Array.isArray((t3.ai_content_signals as Record<string, unknown>).signals_detected)
            ? ((t3.ai_content_signals as Record<string, unknown>).signals_detected as unknown[]).filter((s): s is string => typeof s === 'string')
            : [],
          evidence: extractTextPositionsWithField(
            (t3.ai_content_signals as Record<string, unknown>).evidence,
            essayText,
            'signal'
          ),
          recommendation: typeof (t3.ai_content_signals as Record<string, unknown>).recommendation === 'string'
            ? (t3.ai_content_signals as Record<string, unknown>).recommendation as string
            : undefined,
        }
        : undefined,
    };
  }

  // Extract Text Annotations
  if (Array.isArray(rawAnalysis.text_annotations)) {
    adminData.text_annotations = rawAnalysis.text_annotations
      .filter((a): a is Record<string, unknown> => a !== null && typeof a === 'object')
      .map(a => ({
        type: (['strength', 'issue', 'red_flag', 'ai_signal', 'suggestion'] as const).includes(a.type as never)
          ? a.type as TextAnnotation['type']
          : 'issue' as const,
        severity: (['critical', 'major', 'minor', 'positive'] as const).includes(a.severity as never)
          ? a.severity as TextAnnotation['severity']
          : 'minor' as const,
        text: String(a.text || ''),
        start_index: typeof a.start_index === 'number' ? a.start_index : 0,
        end_index: typeof a.end_index === 'number' ? a.end_index : 0,
        category: String(a.category || 'other'),
        message: String(a.message || ''),
        suggestion: typeof a.suggestion === 'string' ? a.suggestion : undefined,
      }))
      // Validate that quoted text actually exists in essay
      .filter(a => {
        if (!a.text) return false;
        const normalizedEssay = essayText.toLowerCase().replace(/\s+/g, ' ');
        const normalizedQuote = a.text.toLowerCase().replace(/\s+/g, ' ');
        return normalizedEssay.includes(normalizedQuote);
      });
  }

  // Extract Feedback section
  if (rawAnalysis.feedback && typeof rawAnalysis.feedback === 'object') {
    const fb = rawAnalysis.feedback as Record<string, unknown>;
    adminData.feedback = {
      overall_assessment: String(fb.overall_assessment || ''),
      whats_working: Array.isArray(fb.whats_working)
        ? fb.whats_working.map((w: Record<string, unknown>) => ({
          passage: String(w.passage || ''),
          start_index: typeof w.start_index === 'number' ? w.start_index : undefined,
          end_index: typeof w.end_index === 'number' ? w.end_index : undefined,
          why: String(w.why || ''),
        }))
        : [],
      priority_improvements: Array.isArray(fb.priority_improvements)
        ? fb.priority_improvements.slice(0, 3).map((p: Record<string, unknown>) => ({
          rank: typeof p.rank === 'number' ? p.rank : 0,
          issue: String(p.issue || ''),
          why_it_matters: String(p.why_it_matters || ''),
          coaching_suggestion: String(p.coaching_suggestion || ''),
          affected_text: p.affected_text && typeof p.affected_text === 'object'
            ? validateTextPosition(p.affected_text as Record<string, unknown>, essayText)
            : undefined,
        }))
        : [],
      questions_for_writer: Array.isArray(fb.questions_for_writer)
        ? fb.questions_for_writer.map((q: Record<string, unknown>) => ({
          question: String(q.question || ''),
          context: String(q.context || ''),
          related_text: typeof q.related_text === 'string' ? q.related_text : undefined,
        }))
        : [],
      prompt_compliance: String(fb.prompt_compliance || 'unknown'),
    };
  }

  return adminData;
}

/** Extract pass/fail check from raw data */
function extractPassFail(raw: unknown): { pass: boolean; detail: string } {
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    return {
      pass: obj.pass === true,
      detail: String(obj.detail || ''),
    };
  }
  return { pass: true, detail: '' };
}

/** Extract and validate text positions from raw data */
function extractTextPositions(raw: unknown, essayText: string): Array<{ text: string; start_index: number; end_index: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map(item => ({
      text: String(item.text || ''),
      start_index: typeof item.start_index === 'number' ? item.start_index : 0,
      end_index: typeof item.end_index === 'number' ? item.end_index : 0,
    }))
    .filter(item => {
      if (!item.text) return false;
      const normalizedEssay = essayText.toLowerCase().replace(/\s+/g, ' ');
      const normalizedQuote = item.text.toLowerCase().replace(/\s+/g, ' ');
      return normalizedEssay.includes(normalizedQuote);
    });
}

/** Extract text positions with an extra string field */
function extractTextPositionsWithField<F extends string>(
  raw: unknown,
  essayText: string,
  fieldName: F
): Array<{ text: string; start_index: number; end_index: number } & Record<F, string>> {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => item !== null && typeof item === 'object')
    .map(item => ({
      text: String(item.text || ''),
      start_index: typeof item.start_index === 'number' ? item.start_index : 0,
      end_index: typeof item.end_index === 'number' ? item.end_index : 0,
      [fieldName]: String(item[fieldName] || ''),
    } as { text: string; start_index: number; end_index: number } & Record<F, string>))
    .filter(item => {
      if (!item.text) return false;
      const normalizedEssay = essayText.toLowerCase().replace(/\s+/g, ' ');
      const normalizedQuote = item.text.toLowerCase().replace(/\s+/g, ' ');
      return normalizedEssay.includes(normalizedQuote);
    });
}

/** Validate a single text position */
function validateTextPosition(raw: Record<string, unknown>, essayText: string): { text: string; start_index: number; end_index: number } | undefined {
  const text = String(raw.text || '');
  if (!text) return undefined;
  const normalizedEssay = essayText.toLowerCase().replace(/\s+/g, ' ');
  const normalizedQuote = text.toLowerCase().replace(/\s+/g, ' ');
  if (!normalizedEssay.includes(normalizedQuote)) return undefined;
  return {
    text,
    start_index: typeof raw.start_index === 'number' ? raw.start_index : 0,
    end_index: typeof raw.end_index === 'number' ? raw.end_index : 0,
  };
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
