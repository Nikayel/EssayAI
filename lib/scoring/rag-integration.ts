/**
 * RAG Integration for Scoring Engine
 * Connects the scoring system with the existing RAG infrastructure
 */

import type { StudentIntake, EssayAnalysisResult, BenchmarkComparison } from './types';
import type { StudentProfile, RetrievedContext, AnalysisHistoryEntry } from '../rag/types';

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
      familyEducationLevel: profile.familyEducationLevel || 'bachelors',
      householdIncome: undefined,
      isInternational: profile.isInternational || false,
      countryOfOrigin: profile.countryOfOrigin,
      primaryLanguage: profile.primaryLanguage,
      immigrationStory: profile.immigrationStory,
      geographicContext: profile.geographicContext || 'suburban',
      schoolType: profile.schoolType || 'public',
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
        reasonForWorking: w.reasonForWorking as 'financial_necessity' | 'career_exploration' | 'family_business' | 'personal_growth',
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
 * Convert EssayAnalysisResult to format compatible with RAG AnalysisHistory
 */
export function scoringResultToAnalysisHistory(
  result: EssayAnalysisResult,
  essayVersionId: string,
  userId: string
): AnalysisHistoryEntry {
  return {
    essayVersionId,
    userId,
    essayType: 'scoring',
    overallScore: result.overallScore,
    dimensionScores: {
      authenticity: result.dimensions.authenticity.totalScore,
      insight: result.dimensions.insight.totalScore,
      schoolFit: result.dimensions.schoolFit.totalScore,
      specificity: result.dimensions.specificity.totalScore,
      risk: result.dimensions.risk.totalScore,
    },
    issuesIdentified: result.topIssues.map(i => i.issue),
    patternsMatched: [],
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
  ragContext?: RetrievedContext;
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
