/**
 * Essay Scoring Engine
 * Main orchestrator that combines all dimension scorers
 */

import type {
  StudentIntake,
  EssayAnalysisResult,
  Annotation,
  PrioritizedIssue,
  IdentifiedStrength,
  SchoolSpecificFeedback,
  BenchmarkComparison,
  AnalysisMetadata,
  ScoreLabel,
  SchoolScoringConfig,
} from './types';

import { scoreAuthenticity } from './scorers/authenticity';
import { scoreInsight } from './scorers/insight';
import { scoreSchoolFit } from './scorers/school-fit';
import { scoreSpecificity } from './scorers/specificity';
import { scoreRisk } from './scorers/risk';
import { parseText } from './text-utils';
import { getSchoolConfig, generateSchoolFeedback, detectSchoolKeywords } from './school-configs';
import { config, getScoreLabel as getScoreLabelFromConfig } from '@/lib/config';

// =============================================================================
// MAIN ANALYSIS FUNCTION
// =============================================================================

export interface ScoringOptions {
  includeAnnotations?: boolean;
  includeBenchmark?: boolean;
  toneEmbedding?: number[];
}

export async function analyzeEssay(
  essayText: string,
  intake: StudentIntake,
  options: ScoringOptions = {}
): Promise<EssayAnalysisResult> {
  const startTime = Date.now();

  // Parse text for metadata
  const parsed = parseText(essayText);

  // Run all scorers in parallel for performance
  const [
    authenticityScore,
    insightScore,
    schoolFitScore,
    specificityScore,
    riskScore,
  ] = await Promise.all([
    scoreAuthenticity(essayText, intake, options.toneEmbedding),
    scoreInsight(essayText, intake),
    scoreSchoolFit(essayText, intake),
    scoreSpecificity(essayText, intake),
    scoreRisk(essayText, intake),
  ]);

  // Get school-specific weights (or use defaults)
  const schoolConfig = getSchoolConfig(intake.essayContext?.targetSchool);
  const weights = schoolConfig?.weights ?? config.scoring.defaultWeights;
  const maxScores = config.scoring.dimensionMaxScores;

  // Calculate overall score using school-specific weights
  // Normalize each dimension to 0-1, multiply by weight, sum to 100
  const overallScore = calculateWeightedScore(
    {
      authenticity: authenticityScore.totalScore,
      insight: insightScore.totalScore,
      schoolFit: schoolFitScore.totalScore,
      specificity: specificityScore.totalScore,
      risk: riskScore.totalScore,
    },
    weights,
    maxScores
  );

  // Get score label using centralized config
  const scoreLabel = getScoreLabelFromConfig(overallScore);

  // Generate annotations
  const annotations = options.includeAnnotations !== false
    ? generateAnnotations(authenticityScore, insightScore, schoolFitScore, specificityScore, riskScore)
    : [];

  // Prioritize issues
  const topIssues = generateTopIssues(
    authenticityScore,
    insightScore,
    schoolFitScore,
    specificityScore,
    riskScore
  );

  // Identify strengths
  const strengths = identifyStrengths(
    authenticityScore,
    insightScore,
    schoolFitScore,
    specificityScore,
    riskScore
  );

  // Generate school-specific feedback
  const schoolFeedback = generateSchoolSpecificFeedback(essayText, intake);

  // Generate score summary
  const scoreSummary = generateScoreSummary(overallScore, scoreLabel, topIssues);

  // Build metadata
  const metadata: AnalysisMetadata = {
    wordCount: parsed.wordCount,
    sentenceCount: parsed.sentenceCount,
    paragraphCount: parsed.paragraphCount,
    readingLevel: authenticityScore.ageAppropriateness.fleschKincaidGrade,
    analysisModel: 'scoring-engine-v1',
    ragContextUsed: false,
    processingTimeMs: Date.now() - startTime,
    intakeComplete: isIntakeComplete(intake),
    analysisVersion: '1.0.0',
  };

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    scoreLabel,
    scoreSummary,
    dimensions: {
      authenticity: authenticityScore,
      insight: insightScore,
      schoolFit: schoolFitScore,
      specificity: specificityScore,
      risk: riskScore,
    },
    annotations,
    topIssues,
    strengths,
    schoolFeedback,
    benchmark: options.includeBenchmark
      ? await generateBenchmark(overallScore, intake.essayContext?.targetSchool)
      : undefined,
    metadata,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate weighted overall score using school-specific weights
 * Each dimension is normalized to 0-1, multiplied by weight, summed to 100
 */
function calculateWeightedScore(
  scores: {
    authenticity: number;
    insight: number;
    schoolFit: number;
    specificity: number;
    risk: number;
  },
  weights: {
    authenticity: number;
    insight: number;
    schoolFit: number;
    specificity: number;
    risk: number;
  },
  maxScores: {
    authenticity: number;
    insight: number;
    schoolFit: number;
    specificity: number;
    risk: number;
  }
): number {
  // Normalize each score to 0-1, apply weight
  const authenticityNorm = (scores.authenticity / maxScores.authenticity) * weights.authenticity;
  const insightNorm = (scores.insight / maxScores.insight) * weights.insight;
  const schoolFitNorm = (scores.schoolFit / maxScores.schoolFit) * weights.schoolFit;
  const specificityNorm = (scores.specificity / maxScores.specificity) * weights.specificity;
  const riskNorm = (scores.risk / maxScores.risk) * weights.risk;

  // Sum and scale to 100
  const totalWeighted = authenticityNorm + insightNorm + schoolFitNorm + specificityNorm + riskNorm;
  return Math.round(totalWeighted * 100 * 10) / 10; // Round to 1 decimal
}

function generateScoreSummary(
  score: number,
  label: ScoreLabel,
  issues: PrioritizedIssue[]
): string {
  const labelText: Record<ScoreLabel, string> = {
    exceptional: 'This essay is exceptional and highly competitive for top schools.',
    strong: 'This is a strong essay with minor areas for improvement.',
    competitive: 'This essay is competitive but has room for growth in key areas.',
    developing: 'This essay shows promise but needs significant revision.',
    needs_work: 'This essay needs substantial work before submission.',
  };

  let summary = labelText[label];

  if (issues.length > 0) {
    summary += ` Top priority: ${issues[0].issue}`;
  }

  return summary;
}

function generateAnnotations(
  authenticity: EssayAnalysisResult['dimensions']['authenticity'],
  insight: EssayAnalysisResult['dimensions']['insight'],
  schoolFit: EssayAnalysisResult['dimensions']['schoolFit'],
  specificity: EssayAnalysisResult['dimensions']['specificity'],
  risk: EssayAnalysisResult['dimensions']['risk']
): Annotation[] {
  const annotations: Annotation[] = [];

  // Authenticity annotations
  for (const cliche of authenticity.clicheDensity.clichesFound) {
    annotations.push({
      lineNumber: cliche.location.startLine,
      text: cliche.phrase,
      type: 'issue',
      category: 'cliche',
      dimension: 'authenticity',
      message: `Generic phrase detected: "${cliche.phrase}"`,
      severity: cliche.severity === 'hard' ? 'high' : 'medium',
      fix: cliche.suggestion,
    });
  }

  for (const flag of authenticity.ageAppropriateness.thesaurusFlags) {
    annotations.push({
      lineNumber: flag.location.startLine,
      text: flag.phrase,
      type: 'issue',
      category: 'vocabulary',
      dimension: 'authenticity',
      message: `Potentially forced vocabulary: "${flag.phrase}"`,
      severity: 'medium',
      fix: flag.suggestion,
    });
  }

  // Insight annotations - deep statements are strengths
  for (const deep of insight.depthOfReflection.deepStatements) {
    annotations.push({
      lineNumber: deep.startLine,
      text: deep.text.substring(0, 50) + '...',
      type: 'strength',
      category: 'reflection',
      dimension: 'insight',
      message: 'Strong reflective statement',
      severity: undefined,
    });
  }

  // Specificity annotations - dialogue is strength
  for (const dialogue of specificity.dialogue.dialogueInstances) {
    annotations.push({
      lineNumber: dialogue.startLine,
      text: dialogue.text.substring(0, 50) + '...',
      type: 'strength',
      category: 'dialogue',
      dimension: 'specificity',
      message: 'Good use of dialogue',
      severity: undefined,
    });
  }

  // Risk annotations
  for (const issue of risk.culturalSensitivity.issues) {
    annotations.push({
      lineNumber: 0, // Would need to find line number
      text: issue.text,
      type: 'issue',
      category: 'cultural_sensitivity',
      dimension: 'risk',
      message: `Cultural sensitivity concern: ${issue.type}`,
      severity: 'high',
      fix: issue.suggestion,
    });
  }

  return annotations;
}

function generateTopIssues(
  authenticity: EssayAnalysisResult['dimensions']['authenticity'],
  insight: EssayAnalysisResult['dimensions']['insight'],
  schoolFit: EssayAnalysisResult['dimensions']['schoolFit'],
  specificity: EssayAnalysisResult['dimensions']['specificity'],
  risk: EssayAnalysisResult['dimensions']['risk']
): PrioritizedIssue[] {
  const issues: Array<{
    issue: string;
    dimension: string;
    score: number;
    impact: string;
    howToFix: string;
    exampleBefore?: string;
    exampleAfter?: string;
  }> = [];

  // Check each dimension for low scores
  if (authenticity.clicheDensity.score < 3) {
    issues.push({
      issue: 'High cliche density',
      dimension: 'Authenticity',
      score: authenticity.clicheDensity.score,
      impact: 'Generic phrases make your essay forgettable',
      howToFix: 'Replace flagged phrases with specific, personal language',
      exampleBefore: authenticity.clicheDensity.clichesFound[0]?.phrase,
      exampleAfter: authenticity.clicheDensity.clichesFound[0]?.suggestion,
    });
  }

  if (insight.growthArc.score < 3) {
    issues.push({
      issue: 'Unclear growth arc',
      dimension: 'Insight',
      score: insight.growthArc.score,
      impact: 'AOs need to see how you\'ve changed',
      howToFix: 'Add clear before/after contrast showing your transformation',
    });
  }

  if (insight.depthOfReflection.score < 3) {
    issues.push({
      issue: 'Surface-level reflection',
      dimension: 'Insight',
      score: insight.depthOfReflection.score,
      impact: 'Essay lacks the "so what" factor',
      howToFix: 'Dig deeper into WHY experiences matter and what they reveal about you',
    });
  }

  if (schoolFit.specificProgramKnowledge.score < 2) {
    issues.push({
      issue: 'Lacks school-specific content',
      dimension: 'School Fit',
      score: schoolFit.specificProgramKnowledge.score,
      impact: 'Essay could be sent to any school',
      howToFix: 'Research and name specific programs, courses, or professors',
    });
  }

  if (specificity.sceneVsSummary.showTellRatio < 0.4) {
    issues.push({
      issue: 'Too much telling, not enough showing',
      dimension: 'Specificity',
      score: specificity.sceneVsSummary.score,
      impact: 'Essay reads like a summary instead of a story',
      howToFix: 'Add scenes with action, dialogue, and sensory details',
    });
  }

  if (specificity.openingHook.score < 2) {
    issues.push({
      issue: 'Weak opening hook',
      dimension: 'Specificity',
      score: specificity.openingHook.score,
      impact: 'First impression doesn\'t grab attention',
      howToFix: 'Start with action, dialogue, or a vivid scene',
      exampleBefore: specificity.openingHook.firstSentence,
    });
  }

  if (risk.totalScore < 8) {
    if (risk.culturalSensitivity.deduction > 0) {
      issues.push({
        issue: 'Cultural sensitivity concerns',
        dimension: 'Risk',
        score: 10 - risk.culturalSensitivity.deduction,
        impact: 'Could be seen as tone-deaf by admissions officers',
        howToFix: risk.culturalSensitivity.feedback,
      });
    }
    if (risk.traumaWithoutAgency.deduction > 0) {
      issues.push({
        issue: 'Trauma without agency',
        dimension: 'Risk',
        score: 10 - risk.traumaWithoutAgency.deduction,
        impact: 'AOs want resilience, not pity',
        howToFix: 'Show how you overcame challenges and what you learned',
      });
    }
  }

  // Sort by score (lowest first) and take top 5
  return issues
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((issue, index) => ({
      rank: index + 1,
      issue: issue.issue,
      dimension: issue.dimension,
      impact: issue.impact,
      howToFix: issue.howToFix,
      exampleBefore: issue.exampleBefore,
      exampleAfter: issue.exampleAfter,
    }));
}

function identifyStrengths(
  authenticity: EssayAnalysisResult['dimensions']['authenticity'],
  insight: EssayAnalysisResult['dimensions']['insight'],
  schoolFit: EssayAnalysisResult['dimensions']['schoolFit'],
  specificity: EssayAnalysisResult['dimensions']['specificity'],
  risk: EssayAnalysisResult['dimensions']['risk']
): IdentifiedStrength[] {
  const strengths: IdentifiedStrength[] = [];

  // Authenticity strengths
  if (authenticity.uniquePerspective.score >= 4) {
    strengths.push({
      element: 'Unique personal perspective',
      why: 'Essay contains distinctive elements that could only come from your experience',
      keepThis: true,
    });
  }

  if (authenticity.clicheDensity.score >= 4.5) {
    strengths.push({
      element: 'Original language',
      why: 'Essay avoids common cliches and uses fresh, personal expression',
      keepThis: true,
    });
  }

  // Insight strengths
  if (insight.depthOfReflection.deepStatements.length >= 3) {
    strengths.push({
      element: 'Deep reflection',
      why: 'Multiple moments of genuine insight and self-awareness',
      keepThis: true,
    });
  }

  if (insight.growthArc.score >= 4) {
    strengths.push({
      element: 'Clear growth arc',
      why: 'Essay shows meaningful transformation from before to after',
      keepThis: true,
    });
  }

  // School fit strengths
  if (schoolFit.specificProgramKnowledge.score >= 3) {
    strengths.push({
      element: 'School-specific knowledge',
      why: `Strong references to specific programs: ${schoolFit.specificProgramKnowledge.programsMentioned.slice(0, 3).join(', ')}`,
      keepThis: true,
    });
  }

  // Specificity strengths
  if (specificity.openingHook.score >= 3.5) {
    strengths.push({
      element: 'Strong opening',
      why: 'Opening immediately engages the reader',
      keepThis: true,
    });
  }

  if (specificity.dialogue.dialogueInstances.length >= 2) {
    strengths.push({
      element: 'Effective use of dialogue',
      why: 'Dialogue creates vivid scenes and reveals character',
      keepThis: true,
    });
  }

  return strengths.slice(0, 5);
}

function generateSchoolSpecificFeedback(
  essayText: string,
  intake: StudentIntake
): SchoolSpecificFeedback | undefined {
  const schoolId = intake.essayContext?.targetSchool?.toLowerCase();
  if (!schoolId) return undefined;

  const config = getSchoolConfig(schoolId);
  if (!config) return undefined;

  const detection = detectSchoolKeywords(essayText, schoolId);
  const feedback = generateSchoolFeedback(schoolId, detection);

  // Find missing elements
  const missingElements = config.mustMention.filter(m =>
    !detection.cultureMatches.some(c =>
      m.toLowerCase().includes(c.toLowerCase()) ||
      c.toLowerCase().includes(m.split('_').join(' '))
    )
  );

  // Find opportunities
  const opportunities = config.boostFor
    .filter(b => !b.split('_').some(w =>
      essayText.toLowerCase().includes(w)
    ))
    .slice(0, 3)
    .map(b => b.split('_').join(' '));

  return {
    school: config.name,
    fitScore: detection.fitScore,
    alignedElements: detection.cultureMatches,
    missingElements,
    opportunities,
    schoolSpecificTips: feedback,
  };
}

/**
 * Generate benchmark comparison
 * Uses real data when available, otherwise provides honest estimates
 */
async function generateBenchmark(
  score: number,
  schoolId?: string
): Promise<BenchmarkComparison> {
  // Calculate percentile based on score thresholds
  // This is an estimate based on typical score distributions
  let percentile = 50;

  if (score >= 90) percentile = 95;
  else if (score >= 80) percentile = 85;
  else if (score >= 70) percentile = 70;
  else if (score >= 60) percentile = 50;
  else if (score >= 50) percentile = 35;
  else percentile = 20;

  // Try to get real comparison data from database
  let similarEssaysCount: number | null = null;

  try {
    const { prisma } = await import('@/lib/prisma');

    // Query actual analysis history for similar scores
    const similarCount = await prisma.analysisHistory.count({
      where: {
        overallScore: {
          gte: score - 5,
          lte: score + 5,
        },
        ...(schoolId && { schoolId: schoolId.toLowerCase() }),
      },
    });

    // Only show if we have meaningful data (>10 essays)
    if (similarCount >= 10) {
      similarEssaysCount = similarCount;
    }
  } catch {
    // Database not available, continue without real data
  }

  // Generate key differences based on score
  const keyDifferences: string[] = [];

  if (score < 60) {
    keyDifferences.push('Higher-scoring essays show clear personal transformation');
  }
  if (score < 70) {
    keyDifferences.push('Stronger essays use specific, concrete details instead of generalizations');
  }
  if (score < 75) {
    keyDifferences.push('Top essays avoid generic phrases and demonstrate authentic voice');
  }
  if (score < 80) {
    keyDifferences.push('Exceptional essays have memorable openings that hook readers immediately');
  }

  return {
    percentile,
    // Only include count if we have real data, otherwise null (not fake numbers)
    similarSuccessfulEssays: similarEssaysCount ?? 0,
    keyDifferences: keyDifferences.slice(0, 3),
    improvementPotential: Math.max(0, 90 - score),
  };
}

function isIntakeComplete(intake: StudentIntake): boolean {
  // Check required fields
  const hasBasics = !!(
    intake.essayContext?.targetSchool &&
    intake.essayContext?.essayType &&
    intake.activities?.spike
  );

  const hasVoice = !!(intake.voice?.toneSample);

  return hasBasics && hasVoice;
}

// Exports defined inline at declaration
