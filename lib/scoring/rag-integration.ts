/**
 * RAG Integration for Scoring Engine
 * Connects the scoring system with the existing RAG infrastructure
 * Includes converter from StandardAnalysisResult → AdminAnalysisData
 */

import type { StudentIntake, EssayAnalysisResult, BenchmarkComparison } from './types';
import type { StudentProfile, RetrievedContext, AnalysisHistoryEntry } from '../rag/types';
import type { AdminAnalysisData, TextAnnotation } from '../rag/types';
import type { StandardAnalysisResult, AnnotationWithFix, PrioritizedIssueWithFix } from './tiers/types';

// Type aliases for backwards compatibility
type RAGContext = RetrievedContext;
type AnalysisHistory = AnalysisHistoryEntry;

// =============================================================================
// CONVERT INTAKE TO STUDENT PROFILE (for RAG compatibility)
// =============================================================================

/**
 * Convert StudentIntake to StudentProfile for RAG system compatibility
 * This ensures DRY principle - we have one source of truth for student data
 */
export function intakeToStudentProfile(intake: StudentIntake): StudentProfile {
  return {
    // Core narrative
    spike: intake.activities?.spike,
    topActivities: intake.activities?.topActivities?.map(a => `${a.name} (${a.role})`),
    biggestWorry: intake.essayContext?.biggestConcern,
    toneSample: intake.voice?.toneSample,
    graduationYear: undefined, // Would come from profile

    // Demographics & Background
    isFirstGen: intake.demographics?.isFirstGen,
    familyEducationLevel: intake.demographics?.familyEducationLevel,
    isInternational: intake.demographics?.isInternational,
    countryOfOrigin: intake.demographics?.countryOfOrigin,
    primaryLanguage: intake.demographics?.primaryLanguage,
    immigrationStory: intake.demographics?.immigrationStory,
    geographicContext: intake.demographics?.geographicContext,
    schoolType: intake.demographics?.schoolType,
    familyResponsibilities: intake.demographics?.familyResponsibilities,

    // Academic Context
    intendedMajor: intake.academic?.intendedMajor,
    academicInterests: intake.academic?.academicInterests,
    intellectualPassion: intake.academic?.intellectualPassion,
    hasResearchExperience: intake.academic?.researchExperience?.hasExperience,
    researchDescription: intake.academic?.researchExperience?.description,
    academicChallenges: intake.academic?.academicChallenges,

    // Activities & Experience
    activitiesStructured: intake.activities?.topActivities?.map(a => ({
      name: a.name,
      role: a.role,
      hoursPerWeek: a.hoursPerWeek,
      weeksPerYear: a.weeksPerYear,
      yearsInvolved: a.yearsInvolved,
      impact: a.impact,
    })),
    workExperience: intake.activities?.workExperience?.map(w => ({
      job: w.job,
      hoursPerWeek: w.hoursPerWeek,
      reasonForWorking: w.reasonForWorking,
    })),
    leadershipRoles: intake.activities?.leadershipRoles,
    summerExperiences: intake.activities?.summerExperiences,

    // Personal Identity & Story
    identityFactors: intake.personal?.identityFactors,
    significantChallenges: intake.personal?.significantChallenges,
    uniquePerspective: intake.personal?.uniquePerspective,
    whatAOsShouldKnow: intake.personal?.whatAOsShouldKnow,

    // Voice Calibration
    writingStyle: intake.voice?.writingStyle,
    usesHumor: intake.voice?.usesHumor,
  };
}

/**
 * Convert StudentProfile from database to StudentIntake for scoring
 */
export function studentProfileToIntake(
  profile: StudentProfile,
  essayContext: StudentIntake['essayContext']
): StudentIntake {
  return {
    demographics: {
      isFirstGen: profile.isFirstGen || false,
      familyEducationLevel: (profile.familyEducationLevel || 'bachelors') as 'no_college' | 'some_college' | 'bachelors' | 'graduate',
      householdIncome: undefined,
      isInternational: profile.isInternational || false,
      countryOfOrigin: profile.countryOfOrigin,
      primaryLanguage: profile.primaryLanguage,
      immigrationStory: profile.immigrationStory as 'citizen' | 'visa' | 'undocumented' | 'prefer_not_say' | 'immigrant_self' | 'immigrant_parent' | undefined,
      geographicContext: (profile.geographicContext || 'suburban') as 'rural' | 'suburban' | 'urban',
      schoolType: (profile.schoolType || 'public') as 'public' | 'private' | 'charter' | 'magnet' | 'homeschool' | 'international',
      familyResponsibilities: (profile.familyResponsibilities || []) as ('none' | 'caregiving' | 'work_to_support' | 'sibling_care' | 'translation')[],
    },
    academic: {
      intendedMajor: profile.intendedMajor || '',
      academicInterests: profile.academicInterests || [],
      intellectualPassion: profile.intellectualPassion,
      researchExperience: profile.hasResearchExperience ? {
        hasExperience: true,
        description: profile.researchDescription,
      } : undefined,
      academicChallenges: profile.academicChallenges,
    },
    activities: {
      spike: profile.spike || '',
      topActivities: profile.activitiesStructured?.map(a => ({
        name: a.name,
        role: a.role,
        hoursPerWeek: a.hoursPerWeek,
        weeksPerYear: a.weeksPerYear,
        yearsInvolved: a.yearsInvolved,
        impact: a.impact,
      })) || [],
      workExperience: profile.workExperience?.map(w => ({
        job: w.job,
        hoursPerWeek: w.hoursPerWeek,
        reasonForWorking: w.reasonForWorking as any,
      })),
      leadershipRoles: profile.leadershipRoles || [],
      summerExperiences: profile.summerExperiences,
    },
    personal: {
      identityFactors: (profile.identityFactors || []) as StudentIntake['personal']['identityFactors'],
      significantChallenges: profile.significantChallenges,
      uniquePerspective: profile.uniquePerspective,
      whatAOsShouldKnow: profile.whatAOsShouldKnow,
    },
    essayContext,
    voice: {
      toneSample: profile.toneSample || '',
      writingStyle: profile.writingStyle || 'conversational',
      usesHumor: profile.usesHumor || false,
    },
  };
}

// =============================================================================
// CONVERT SCORING RESULT TO RAG ANALYSIS HISTORY
// =============================================================================

/**
 * Convert EssayAnalysisResult to format compatible with RAG AnalysisHistoryEntry
 */
export function scoringResultToAnalysisHistory(
  result: EssayAnalysisResult,
  essayVersionId: string,
  userId: string,
  schoolId?: string,
  essayType?: string
): Omit<AnalysisHistory, 'id' | 'createdAt'> {
  return {
    essayVersionId,
    userId,
    schoolId,
    essayType: essayType || 'personal_statement',
    overallScore: result.overallScore,
    dimensionScores: {
      authenticity: result.dimensions.authenticity.totalScore,
      insight: result.dimensions.insight.totalScore,
      schoolFit: result.dimensions.schoolFit.totalScore,
      specificity: result.dimensions.specificity.totalScore,
      risk: result.dimensions.risk.totalScore,
    },
    issuesIdentified: result.topIssues.map(i => `${i.dimension}: ${i.issue}`),
    patternsMatched: [], // Would be filled from RAG retrieval
    ragContextUsed: {
      exampleIds: [],
      patternIds: [],
      insightIds: [],
    },
  };
}

// =============================================================================
// ENHANCE SCORING WITH RAG CONTEXT
// =============================================================================

export interface RAGEnhancedScoringOptions {
  ragContext?: RAGContext;
  similarEssays?: Array<{
    score: number;
    school: string;
    themes: string[];
  }>;
  feedbackPatterns?: Array<{
    issueType: string;
    successRate: number;
    fixStrategy: string;
  }>;
}

/**
 * Enhance scoring results with RAG context
 * This adds benchmarking and pattern-based suggestions
 */
export function enhanceWithRAGContext(
  result: EssayAnalysisResult,
  options: RAGEnhancedScoringOptions
): EssayAnalysisResult {
  const enhanced = { ...result };

  // Enhance benchmark with similar essays
  if (options.similarEssays && options.similarEssays.length > 0) {
    const avgSimilarScore = options.similarEssays.reduce((sum, e) => sum + e.score, 0) / options.similarEssays.length;

    enhanced.benchmark = {
      percentile: calculatePercentile(result.overallScore, options.similarEssays),
      similarSuccessfulEssays: options.similarEssays.length,
      keyDifferences: generateKeyDifferences(result, options.similarEssays),
      improvementPotential: Math.max(0, avgSimilarScore - result.overallScore),
    };
  }

  // Enhance top issues with proven fix strategies
  if (options.feedbackPatterns && options.feedbackPatterns.length > 0) {
    enhanced.topIssues = enhanced.topIssues.map(issue => {
      const pattern = options.feedbackPatterns?.find(p =>
        p.issueType.toLowerCase().includes(issue.dimension.toLowerCase())
      );

      if (pattern) {
        return {
          ...issue,
          howToFix: `${issue.howToFix} (${Math.round(pattern.successRate * 100)}% of students who applied this fix improved their scores)`,
        };
      }

      return issue;
    });
  }

  // Add RAG context to metadata
  enhanced.metadata = {
    ...enhanced.metadata,
    ragContextUsed: !!(options.ragContext || options.similarEssays),
  };

  return enhanced;
}

function calculatePercentile(
  score: number,
  similarEssays: Array<{ score: number }>
): number {
  const scores = similarEssays.map(e => e.score).sort((a, b) => a - b);
  const belowCount = scores.filter(s => s < score).length;
  return Math.round((belowCount / scores.length) * 100);
}

function generateKeyDifferences(
  result: EssayAnalysisResult,
  similarEssays: Array<{ score: number; themes: string[] }>
): string[] {
  const differences: string[] = [];
  const avgScore = similarEssays.reduce((sum, e) => sum + e.score, 0) / similarEssays.length;

  if (result.overallScore < avgScore - 10) {
    // Find weakest dimension
    const dimensions = [
      { name: 'authenticity', score: result.dimensions.authenticity.totalScore, max: 25 },
      { name: 'insight', score: result.dimensions.insight.totalScore, max: 25 },
      { name: 'school fit', score: result.dimensions.schoolFit.totalScore, max: 20 },
      { name: 'specificity', score: result.dimensions.specificity.totalScore, max: 20 },
    ];

    const weakest = dimensions.sort((a, b) => (a.score / a.max) - (b.score / b.max))[0];
    differences.push(`Successful essays score higher in ${weakest.name}`);
  }

  // Theme differences
  const commonThemes = getCommonThemes(similarEssays);
  if (commonThemes.length > 0) {
    differences.push(`Common themes in successful essays: ${commonThemes.slice(0, 3).join(', ')}`);
  }

  return differences;
}

function getCommonThemes(essays: Array<{ themes: string[] }>): string[] {
  const themeCounts = new Map<string, number>();

  for (const essay of essays) {
    for (const theme of essay.themes) {
      themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
    }
  }

  return [...themeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([theme]) => theme);
}

// =============================================================================
// SCORING METRICS FOR RAG FEEDBACK LOOP
// =============================================================================

export interface ScoringMetrics {
  totalAnalyses: number;
  averageScore: number;
  scoreDistribution: {
    needsWork: number;
    developing: number;
    competitive: number;
    strong: number;
    exceptional: number;
  };
  commonIssues: Array<{
    issue: string;
    frequency: number;
    avgImpact: number;
  }>;
  dimensionAverages: {
    authenticity: number;
    insight: number;
    schoolFit: number;
    specificity: number;
    risk: number;
  };
}

/**
 * Calculate aggregate metrics from multiple scoring results
 * Used for RAG feedback loop and calibration
 */
export function calculateScoringMetrics(
  results: EssayAnalysisResult[]
): ScoringMetrics {
  if (results.length === 0) {
    return {
      totalAnalyses: 0,
      averageScore: 0,
      scoreDistribution: { needsWork: 0, developing: 0, competitive: 0, strong: 0, exceptional: 0 },
      commonIssues: [],
      dimensionAverages: { authenticity: 0, insight: 0, schoolFit: 0, specificity: 0, risk: 0 },
    };
  }

  // Calculate averages
  const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;

  // Score distribution
  const distribution = {
    needsWork: results.filter(r => r.scoreLabel === 'needs_work').length,
    developing: results.filter(r => r.scoreLabel === 'developing').length,
    competitive: results.filter(r => r.scoreLabel === 'competitive').length,
    strong: results.filter(r => r.scoreLabel === 'strong').length,
    exceptional: results.filter(r => r.scoreLabel === 'exceptional').length,
  };

  // Common issues
  const issueCounts = new Map<string, { count: number; impacts: number[] }>();
  for (const result of results) {
    for (const issue of result.topIssues) {
      const key = issue.issue;
      const existing = issueCounts.get(key) || { count: 0, impacts: [] };
      existing.count++;
      existing.impacts.push(issue.rank);
      issueCounts.set(key, existing);
    }
  }

  const commonIssues = [...issueCounts.entries()]
    .map(([issue, data]) => ({
      issue,
      frequency: data.count / results.length,
      avgImpact: data.impacts.reduce((a, b) => a + b, 0) / data.impacts.length,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  // Dimension averages
  const dimensionAverages = {
    authenticity: results.reduce((sum, r) => sum + r.dimensions.authenticity.totalScore, 0) / results.length,
    insight: results.reduce((sum, r) => sum + r.dimensions.insight.totalScore, 0) / results.length,
    schoolFit: results.reduce((sum, r) => sum + r.dimensions.schoolFit.totalScore, 0) / results.length,
    specificity: results.reduce((sum, r) => sum + r.dimensions.specificity.totalScore, 0) / results.length,
    risk: results.reduce((sum, r) => sum + r.dimensions.risk.totalScore, 0) / results.length,
  };

  return {
    totalAnalyses: results.length,
    averageScore: Math.round(avgScore * 10) / 10,
    scoreDistribution: distribution,
    commonIssues,
    dimensionAverages,
  };
}

// =============================================================================
// STANDARD RESULT → ADMIN ANALYSIS CONVERTER
// Bridges the tiered scoring pipeline with the admin 3-tier display
// =============================================================================

/**
 * Convert a StandardAnalysisResult into AdminAnalysisData
 * so the admin/reviewer dashboard shows the 3-tier evaluation view
 * regardless of which pipeline produced the analysis.
 */
export function standardResultToAdminAnalysis(
  result: StandardAnalysisResult,
  essayText: string,
  intake?: StudentIntake,
): AdminAnalysisData {
  const wordCount = result.metadata.wordCount;
  const wordLimit = intake?.essayContext?.wordLimit;

  // =========================================================================
  // TIER 1: STRUCTURAL REQUIREMENTS (pass/fail)
  // =========================================================================
  const wordCountPass = wordLimit ? (wordCount <= wordLimit * 1.1 && wordCount >= wordLimit * 0.5) : true;
  const schoolName = intake?.essayContext?.targetSchool || '';
  const schoolNameInEssay = schoolName
    ? essayText.toLowerCase().includes(schoolName.toLowerCase())
    : true;

  const tier1_structural = {
    word_count_compliant: {
      pass: wordCountPass,
      detail: wordLimit
        ? `${wordCount}/${wordLimit} words (${Math.round((wordCount / wordLimit) * 100)}%)`
        : `${wordCount} words`,
    },
    prompt_fully_addressed: {
      pass: result.schoolFeedback.missingElements.length === 0,
      detail: result.schoolFeedback.missingElements.length > 0
        ? `Missing: ${result.schoolFeedback.missingElements.map(m => m.element).join(', ')}`
        : 'All prompt elements addressed',
    },
    school_name_correct: {
      pass: schoolNameInEssay,
      detail: schoolNameInEssay
        ? `School "${schoolName}" referenced correctly`
        : `School name "${schoolName}" not found in essay`,
    },
    grammar_spelling: {
      pass: result.dimensions.risk.totalScore >= 7,
      detail: result.dimensions.risk.totalScore >= 7
        ? 'No major grammar or spelling issues detected'
        : 'Some grammar or spelling issues detected',
    },
    formatting: {
      pass: result.metadata.paragraphCount >= 2,
      detail: `${result.metadata.paragraphCount} paragraphs, ${result.metadata.sentenceCount} sentences`,
    },
    all_passed: wordCountPass && schoolNameInEssay && result.schoolFeedback.missingElements.length === 0,
    flags: [
      ...(wordCountPass ? [] : ['Word count out of range']),
      ...(!schoolNameInEssay && schoolName ? ['School name not found in essay'] : []),
      ...result.schoolFeedback.missingElements.map(m => `Missing: ${m.element}`),
    ],
  };

  // =========================================================================
  // TIER 2: CONTENT QUALITY (dimension scores mapped to 1-5 scale)
  // =========================================================================
  const dims = result.dimensions;

  // Map 0-25/0-20/0-10 scores to 1-5 scale
  const mapScore = (score: number, max: number): number =>
    Math.max(1, Math.min(5, Math.round((score / max) * 5)));

  const tier2_content = {
    thesis_focus: {
      score: mapScore(dims.insight.soWhatFactor.score * 5 + dims.authenticity.uniquePerspective.score * 5, 25),
      rationales: [
        dims.insight.soWhatFactor.feedback,
        dims.authenticity.uniquePerspective.feedback,
      ].filter(Boolean),
    },
    specificity_evidence: {
      score: mapScore(dims.specificity.totalScore, 20),
      rationales: [
        dims.specificity.concreteDetails.feedback,
        dims.specificity.sceneVsSummary.feedback,
      ].filter(Boolean),
      vague_claims: dims.specificity.concreteDetails.vagueNouns.map(v => ({
        text: v.phrase,
        start_index: 0,
        end_index: 0,
        what_to_ask: v.suggestion || 'Can you be more specific?',
      })),
      strong_details: dims.specificity.concreteDetails.specificNouns.map(s => ({
        text: s,
        start_index: 0,
        end_index: 0,
        why_it_works: 'Concrete detail that grounds the essay',
      })),
    },
    personal_voice: {
      score: mapScore(dims.authenticity.totalScore, 25),
      rationales: [
        dims.authenticity.toneConsistency.feedback,
        dims.authenticity.personalIdioms.feedback,
      ].filter(Boolean),
      authentic_moments: dims.authenticity.personalIdioms.naturalPhrases.map(p => ({
        text: p,
        start_index: 0,
        end_index: 0,
      })),
      inauthenticity_signals: [
        ...dims.authenticity.clicheDensity.clichesFound.map(c => ({
          text: c.phrase,
          start_index: 0,
          end_index: 0,
          signal: `Cliché: "${c.phrase}"`,
        })),
        ...dims.authenticity.ageAppropriateness.thesaurusFlags.map(t => ({
          text: t.phrase,
          start_index: 0,
          end_index: 0,
          signal: `Unnatural vocabulary: "${t.phrase}"`,
        })),
      ],
    },
    insight_reflection: {
      score: mapScore(dims.insight.totalScore, 25),
      rationales: [
        dims.insight.depthOfReflection.feedback,
        dims.insight.selfAwareness.feedback,
      ].filter(Boolean),
      reveals_thinking: dims.insight.selfAwareness.strengthsAcknowledged.length > 0,
      growth_demonstrated: dims.insight.growthArc.hasBeforeState && dims.insight.growthArc.hasAfterState,
      surface_vs_deep: dims.insight.depthOfReflection.depthRatio > 0.6 ? 'deep' as const
        : dims.insight.depthOfReflection.depthRatio > 0.3 ? 'moderate' as const
        : 'surface' as const,
    },
    program_fit: {
      score: mapScore(dims.schoolFit.totalScore, 20),
      rationales: [
        dims.schoolFit.specificProgramKnowledge.feedback,
        dims.schoolFit.valueAlignment.feedback,
        dims.schoolFit.futureContribution.feedback,
      ].filter(Boolean),
      specific_references: dims.schoolFit.specificProgramKnowledge.programsMentioned.map(p => ({
        text: p,
        start_index: 0,
        end_index: 0,
        reference_type: 'program',
      })),
      missing_elements: dims.schoolFit.valueAlignment.missingValues,
      contribution_mentioned: dims.schoolFit.futureContribution.contributionsPlanned.length > 0,
    },
    structure_flow: {
      score: mapScore(
        dims.specificity.structure.score * 5 + dims.specificity.openingHook.score * 5,
        20
      ),
      rationales: [
        dims.specificity.structure.feedback,
        dims.specificity.openingHook.feedback,
      ].filter(Boolean),
      opening_type: dims.specificity.openingHook.hookType,
      opening_strength: dims.specificity.openingHook.grabsAttention ? 'strong' as const
        : dims.specificity.openingHook.score >= 2.5 ? 'moderate' as const
        : 'weak' as const,
      conclusion_resonates: dims.insight.soWhatFactor.memorability > 0.6,
      transitions_quality: dims.specificity.structure.transitionQuality >= 3 ? 'smooth' as const
        : dims.specificity.structure.transitionQuality >= 2 ? 'adequate' as const
        : 'poor' as const,
    },
  };

  // =========================================================================
  // TIER 3: RED FLAGS
  // =========================================================================
  const redFlags: AdminAnalysisData['tier3_red_flags'] = {
    has_red_flags: result.schoolFeedback.redFlags.length > 0 ||
      dims.risk.ethicalConcerns.issues.length > 0 ||
      result.aiDetection.aiLikelihood === 'high',
    flags: [
      ...result.schoolFeedback.redFlags.map(rf => ({
        type: rf.flag,
        severity: rf.severity as 'critical' | 'warning',
        description: rf.text,
        recommendation: `Address the "${rf.flag}" issue for this school`,
      })),
      ...dims.risk.ethicalConcerns.issues.map(e => ({
        type: 'ethical_concern',
        severity: 'critical' as const,
        description: e.evidence,
        recommendation: 'Revise to address ethical concern',
      })),
      ...dims.risk.exaggerationSignals.issues.map(e => ({
        type: 'exaggeration',
        severity: 'warning' as const,
        description: e.claim,
        recommendation: 'Tone down or provide supporting evidence',
      })),
    ],
    ai_content_signals: {
      likelihood: result.aiDetection.aiLikelihood === 'high' ? 'high' as const
        : result.aiDetection.aiScore > 30 ? 'medium' as const
        : 'low' as const,
      signals_detected: result.aiFeedback
        .filter(f => f.severity === 'critical' || f.severity === 'major')
        .map(f => f.headline),
      recommendation: result.aiDetection.aiLikelihood === 'high'
        ? 'Essay shows patterns typical of AI-generated content. Recommend investigation.'
        : undefined,
    },
  };

  // =========================================================================
  // TEXT ANNOTATIONS (from scoring annotations)
  // =========================================================================
  const textAnnotations: TextAnnotation[] = result.annotations.map(ann => {
    // Map scoring annotation types to admin annotation types
    const typeMap: Record<string, TextAnnotation['type']> = {
      strength: 'strength',
      issue: 'issue',
      suggestion: 'suggestion',
    };
    const severityMap: Record<string, TextAnnotation['severity']> = {
      high: 'critical',
      medium: 'major',
      low: 'minor',
    };

    // Try to find the text position in the essay
    const textLower = essayText.toLowerCase();
    const annTextLower = ann.text.toLowerCase();
    const idx = textLower.indexOf(annTextLower);

    return {
      type: typeMap[ann.type] || 'issue',
      severity: ann.type === 'strength' ? 'positive' as const : (severityMap[ann.severity || 'medium'] || 'minor' as const),
      text: ann.text,
      start_index: idx >= 0 ? idx : 0,
      end_index: idx >= 0 ? idx + ann.text.length : 0,
      category: ann.category,
      message: ann.message,
      suggestion: (ann as AnnotationWithFix).fixSuggestion,
    };
  }).filter(a => a.text && a.start_index >= 0);

  // =========================================================================
  // FEEDBACK SECTION
  // =========================================================================
  const feedback = {
    overall_assessment: result.scoreSummary + (result.aoInsights?.overallVerdict ? ` ${result.aoInsights.overallVerdict}` : ''),
    whats_working: result.strengths.slice(0, 5).map(s => ({
      passage: s.element,
      why: `${s.why}${s.aoThought ? ` AO: ${s.aoThought}` : ''}`,
    })),
    priority_improvements: result.allIssues.slice(0, 3).map((issue, i) => ({
      rank: i + 1,
      issue: issue.issue,
      why_it_matters: issue.impact,
      coaching_suggestion: issue.bluntFeedback.fix || issue.howToFix,
    })),
    questions_for_writer: [
      ...(dims.insight.depthOfReflection.score < 3 ? [{
        question: 'What did this experience teach you about yourself that surprised you?',
        context: 'Your reflection could go deeper',
      }] : []),
      ...(dims.specificity.concreteDetails.vagueNouns.length > 0 ? [{
        question: 'Can you give a specific example or memory that illustrates this?',
        context: 'Some claims lack concrete evidence',
      }] : []),
      ...(dims.schoolFit.totalScore < 15 ? [{
        question: `What specifically about ${intake?.essayContext?.targetSchool || 'this school'} can't you find elsewhere?`,
        context: 'School fit could be stronger',
      }] : []),
    ].slice(0, 4),
    prompt_compliance: tier1_structural.prompt_fully_addressed.pass ? 'Complete' : `Missing: ${tier1_structural.prompt_fully_addressed.detail}`,
  };

  return {
    tier1_structural,
    tier2_content,
    tier3_red_flags: redFlags,
    text_annotations: textAnnotations,
    feedback,
  };
}
