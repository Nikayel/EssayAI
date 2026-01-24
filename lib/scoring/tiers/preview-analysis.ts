/**
 * Preview Analysis Tier (FREE)
 * Shows score and teases issues, but blurs all actionable details
 *
 * What user provides: Essay + target school + essay type
 * What user gets: Score + issue COUNTS (not details) + upgrade teaser
 *
 * Strategy: Hook them with the score, show them problems exist,
 * but make them pay $9.99 to see WHAT the problems are
 */

import type {
  QuickIntake,
  PreviewAnalysisResult,
  TieredAnalysisOptions,
} from './types';
import { parseText } from '../text-utils';
import { detectGenericPhrases } from '../generic-phrases';
import { detectAIWriting } from '../ai-detection';
import { getSchoolConfig } from '../school-configs';
import { getScoreLabel } from '@/lib/config';
import { getScoreMessage, type ScoreContext } from '@/lib/rag/score-messaging';

// =============================================================================
// MAIN PREVIEW ANALYSIS FUNCTION
// =============================================================================

/**
 * Run free preview analysis
 * Shows score and issue counts, but NO actionable details
 */
export async function runPreviewAnalysis(
  essayText: string,
  intake: QuickIntake,
  options: TieredAnalysisOptions = {}
): Promise<PreviewAnalysisResult> {
  const startTime = Date.now();

  // Parse text for metadata
  const parsed = parseText(essayText);

  // Run fast checks in parallel (same as Quick tier)
  const [clicheResult, aiDetection] = await Promise.all([
    Promise.resolve(detectGenericPhrases(essayText)),
    Promise.resolve(detectAIWriting(essayText)),
  ]);

  // Calculate score (same logic as Quick tier)
  const quickScores = calculatePreviewScores(essayText, intake, clicheResult, aiDetection);
  const overallScore = Math.round(quickScores.overall * 10) / 10;
  const scoreLabel = getScoreLabel(overallScore);

  // Generate encouraging score summary
  const scoreContext: ScoreContext = {
    score: overallScore,
    essayType: intake.essayType || 'supplemental',
    isDraft: true,
  };
  const message = getScoreMessage(scoreContext);
  const scoreSummary = `${message.headline}. ${message.context} ${message.encouragement}`;

  // Count issues by severity (but don't reveal details)
  const criticalCount = quickScores.issues.filter(i => i.severity === 'critical').length;
  const majorCount = quickScores.issues.filter(i => i.severity === 'major').length;
  const minorCount = quickScores.issues.filter(i => i.severity === 'minor').length;
  const totalCount = quickScores.issues.length;

  // Generate issue summary message
  let issueMessage = '';
  if (totalCount === 0) {
    issueMessage = 'No major issues detected. Upgrade to see detailed feedback.';
  } else if (criticalCount > 0) {
    issueMessage = `We found ${totalCount} issue${totalCount > 1 ? 's' : ''} including ${criticalCount} critical problem${criticalCount > 1 ? 's' : ''} that could hurt your application.`;
  } else if (majorCount > 0) {
    issueMessage = `We found ${totalCount} issue${totalCount > 1 ? 's' : ''} that should be addressed before submitting.`;
  } else {
    issueMessage = `We found ${totalCount} minor issue${totalCount > 1 ? 's' : ''} to polish.`;
  }

  // AI warning (high-level only)
  const aiWarning = {
    flagged: aiDetection.aiLikelihood !== 'low',
    message: aiDetection.aiLikelihood === 'high'
      ? '⚠️ AI writing patterns detected. This could flag your essay.'
      : aiDetection.aiLikelihood === 'medium'
        ? '⚠️ Some AI-like patterns found. Pay to see specifics.'
        : '✓ Your essay appears authentic.'
  };

  // Build compelling upgrade teaser
  const upgradeTeaser = generateUpgradeTeaser(quickScores, intake.targetSchool, totalCount, criticalCount);

  return {
    tier: 'preview',
    overallScore,
    scoreLabel,
    scoreSummary,

    issuesSummary: {
      total: totalCount,
      critical: criticalCount,
      major: majorCount,
      minor: minorCount,
      message: issueMessage,
    },

    aiWarning,

    upgradeTeaser,

    metadata: {
      wordCount: parsed.wordCount,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// =============================================================================
// PREVIEW SCORING (Same as Quick, we need the data)
// =============================================================================

interface PreviewScores {
  overall: number;
  issues: PreviewIssue[];
}

interface PreviewIssue {
  type: string;
  severity: 'critical' | 'major' | 'minor';
}

function calculatePreviewScores(
  essayText: string,
  intake: QuickIntake,
  clicheResult: ReturnType<typeof detectGenericPhrases>,
  aiDetection: ReturnType<typeof detectAIWriting>
): PreviewScores {
  const issues: PreviewIssue[] = [];
  let overall = 70;

  // 1. Cliche detection
  const clichePenalty = Math.min(20, clicheResult.found.length * 4);
  overall -= clichePenalty;
  if (clicheResult.found.length >= 3) {
    issues.push({ type: 'cliche', severity: 'major' });
  } else if (clicheResult.found.length > 0) {
    issues.push({ type: 'cliche', severity: 'minor' });
  }

  // 2. Opening analysis
  const firstSentence = essayText.split(/[.!?]/)[0]?.trim() || '';
  const openingScore = analyzeOpening(firstSentence);
  if (openingScore < 2) {
    overall -= 15;
    issues.push({ type: 'opening', severity: 'critical' });
  } else if (openingScore < 3) {
    overall -= 10;
    issues.push({ type: 'opening', severity: 'major' });
  }

  // 3. Length check
  const wordCount = essayText.split(/\s+/).length;
  if (wordCount < 250) {
    overall -= 10;
    issues.push({ type: 'too_short', severity: 'major' });
  } else if (wordCount > 800) {
    overall -= 5;
    issues.push({ type: 'too_long', severity: 'minor' });
  }

  // 4. School fit
  const schoolConfig = getSchoolConfig(intake.targetSchool);
  if (schoolConfig) {
    const textLower = essayText.toLowerCase();
    const cultureMatches = schoolConfig.cultureKeywords.filter(kw =>
      textLower.includes(kw.toLowerCase())
    );
    const redFlagMatches = schoolConfig.redFlags.filter(rf =>
      textLower.includes(rf.toLowerCase())
    );

    if (cultureMatches.length === 0) {
      overall -= 10;
      issues.push({ type: 'no_school_specifics', severity: 'critical' });
    }
    if (redFlagMatches.length > 0) {
      overall -= 15;
      issues.push({ type: 'school_red_flag', severity: 'critical' });
    }
  }

  // 5. AI detection
  if (aiDetection.aiLikelihood === 'high') {
    overall -= 25;
    issues.push({ type: 'ai_detected', severity: 'critical' });
  } else if (aiDetection.aiLikelihood === 'medium') {
    overall -= 15;
    issues.push({ type: 'ai_detected', severity: 'major' });
  }

  // 6. Reflection check
  const reflectionPatterns = [
    /I (?:realized|learned|understood|discovered)/gi,
    /this (?:taught|showed|made) me/gi,
    /I began to (?:see|understand|realize)/gi,
  ];
  const hasReflection = reflectionPatterns.some(p => p.test(essayText));
  if (!hasReflection) {
    overall -= 10;
    issues.push({ type: 'no_reflection', severity: 'major' });
  }

  overall = Math.max(0, Math.min(100, overall));

  return { overall, issues };
}

function analyzeOpening(firstSentence: string): number {
  const lower = firstSentence.toLowerCase();

  if (/^i have always/i.test(lower)) return 0;
  if (/^ever since/i.test(lower)) return 1;
  if (/^webster'?s? (?:dictionary )?defines/i.test(lower)) return 0;
  if (/^according to/i.test(lower)) return 1;
  if (/^from a young age/i.test(lower)) return 1;
  if (/^growing up/i.test(lower)) return 2;

  if (/^["']/.test(firstSentence)) return 4;
  if (/^The (?:moment|day|first|last)/i.test(lower)) return 3.5;
  if (firstSentence.length < 60) return 3.5;

  return 3;
}

// =============================================================================
// UPGRADE TEASER
// =============================================================================

function generateUpgradeTeaser(
  scores: PreviewScores,
  school: string,
  totalIssues: number,
  criticalIssues: number
): PreviewAnalysisResult['upgradeTeaser'] {
  const benefits = [
    `See exactly what ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} we found`,
    'Get blunt, consultant-level feedback on each problem',
    `Specific ${school} fit analysis`,
    'Line-by-line locations of issues',
    'AI detection details',
  ];

  let message: string;
  if (criticalIssues > 0) {
    message = `⚠️ We found ${criticalIssues} critical issue${criticalIssues > 1 ? 's' : ''} that could get your essay rejected. Unlock for $9.99 to see what they are and how to fix them.`;
  } else if (totalIssues > 0) {
    message = `We found ${totalIssues} issue${totalIssues > 1 ? 's' : ''} in your essay. Unlock for $9.99 to see the details and improve your score.`;
  } else {
    message = `Your essay looks good! Unlock for $9.99 to see detailed feedback and ensure nothing slips through.`;
  }

  return {
    message,
    benefits,
    price: '$9.99',
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { runPreviewAnalysis };
