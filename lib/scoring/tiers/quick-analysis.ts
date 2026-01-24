/**
 * Quick Analysis Tier ($9.99)
 * Fast, high-level analysis with 3-5 actionable items
 *
 * What user provides: Essay + target school + essay type
 * What user gets: Score + 3-5 specific issues (no fixes - upgrade for that)
 */

import type {
  QuickIntake,
  QuickAnalysisResult,
  QuickActionableItem,
  TieredAnalysisOptions,
} from './types';
import { parseText } from '../text-utils';
import { detectGenericPhrases } from '../generic-phrases';
import { detectAIWriting } from '../ai-detection';
import { getSchoolConfig } from '../school-configs';
import { getScoreLabel, config } from '@/lib/config';
import { BLUNT_TEMPLATES } from '../blunt-feedback';
import { getScoreMessage, type ScoreContext } from '@/lib/rag/score-messaging';

// =============================================================================
// MAIN QUICK ANALYSIS FUNCTION
// =============================================================================

/**
 * Run quick analysis for $9.99 tier
 * Fast path - no RAG, minimal processing
 */
export async function runQuickAnalysis(
  essayText: string,
  intake: QuickIntake,
  options: TieredAnalysisOptions = {}
): Promise<QuickAnalysisResult> {
  const startTime = Date.now();

  // Parse text for metadata
  const parsed = parseText(essayText);

  // Run fast checks in parallel
  const [clicheResult, aiDetection] = await Promise.all([
    Promise.resolve(detectGenericPhrases(essayText)),
    Promise.resolve(detectAIWriting(essayText)),
  ]);

  // Quick score calculation (simplified for speed)
  const quickScores = calculateQuickScores(essayText, intake, clicheResult, aiDetection);

  // Get overall score
  const overallScore = quickScores.overall;
  const scoreLabel = getScoreLabel(overallScore);

  // Generate top 5 actionable items
  const actionableItems = generateActionableItems(
    essayText,
    intake,
    clicheResult,
    aiDetection,
    quickScores
  );

  // Generate teaser for upgrade
  const teaser = generateUpgradeTeaser(quickScores, intake.targetSchool);

  // Get hidden insights count
  const hiddenInsights = countHiddenInsights(clicheResult, aiDetection, quickScores);

  return {
    tier: 'quick',
    overallScore: Math.round(overallScore * 10) / 10,
    scoreLabel,
    scoreSummary: generateQuickSummary(overallScore, scoreLabel, actionableItems, intake.essayType),

    actionableItems: actionableItems.slice(0, 5),

    aiDetection: {
      likelihood: aiDetection.aiLikelihood,
      verdict: aiDetection.bluntVerdict,
    },

    teaser: {
      dimensionsBlurred: true,
      schoolFeedbackBlurred: true,
      message: teaser,
    },

    hiddenInsights,

    metadata: {
      wordCount: parsed.wordCount,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// =============================================================================
// QUICK SCORING (Simplified for speed)
// =============================================================================

interface QuickScores {
  overall: number;
  clicheScore: number;
  openingScore: number;
  lengthScore: number;
  schoolFitScore: number;
  aiPenalty: number;
  issues: QuickIssue[];
}

interface QuickIssue {
  type: string;
  score: number;
  location: string;
  text?: string;
}

function calculateQuickScores(
  essayText: string,
  intake: QuickIntake,
  clicheResult: ReturnType<typeof detectGenericPhrases>,
  aiDetection: ReturnType<typeof detectAIWriting>
): QuickScores {
  const issues: QuickIssue[] = [];
  let overall = 70; // Start at baseline

  // 1. Cliche score (up to -20 points)
  const allCliches = [...clicheResult.hardFlags, ...clicheResult.softFlags];
  const clicheScore = Math.max(0, 5 - allCliches.length * 0.5);
  const clichePenalty = Math.min(20, allCliches.length * 4);
  overall -= clichePenalty;

  if (allCliches.length > 0) {
    allCliches.slice(0, 3).forEach((cliche) => {
      issues.push({
        type: 'cliche',
        score: clicheScore,
        location: `Character ${cliche.index}`,
        text: cliche.phrase.phrase,
      });
    });
  }

  // 2. Opening analysis (up to -15 points)
  const firstSentence = essayText.split(/[.!?]/)[0]?.trim() || '';
  const openingScore = analyzeOpening(firstSentence);

  if (openingScore < 3) {
    overall -= (3 - openingScore) * 5;
    issues.push({
      type: 'opening',
      score: openingScore,
      location: 'Opening',
      text: firstSentence,
    });
  }

  // 3. Length check
  const wordCount = essayText.split(/\s+/).length;
  let lengthScore = 5;

  if (wordCount < 250) {
    lengthScore = 2;
    overall -= 10;
    issues.push({
      type: 'too_short',
      score: lengthScore,
      location: 'Overall',
      text: `${wordCount} words`,
    });
  } else if (wordCount > 800) {
    lengthScore = 3;
    overall -= 5;
  }

  // 4. School fit (quick check)
  const schoolConfig = getSchoolConfig(intake.targetSchool);
  let schoolFitScore = 3;

  if (schoolConfig) {
    const textLower = essayText.toLowerCase();
    const cultureMatches = schoolConfig.cultureKeywords.filter(kw =>
      textLower.includes(kw.toLowerCase())
    );
    const redFlagMatches = schoolConfig.redFlags.filter(rf =>
      textLower.includes(rf.toLowerCase())
    );

    schoolFitScore = Math.min(5, 2 + cultureMatches.length);
    schoolFitScore -= redFlagMatches.length;

    if (cultureMatches.length === 0) {
      overall -= 10;
      issues.push({
        type: 'no_school_specifics',
        score: schoolFitScore,
        location: 'Overall',
      });
    }

    if (redFlagMatches.length > 0) {
      overall -= 15;
      issues.push({
        type: 'school_red_flag',
        score: 0,
        location: 'Various',
        text: redFlagMatches[0],
      });
    }
  }

  // 5. AI detection penalty (up to -25 points)
  let aiPenalty = 0;
  if (aiDetection.aiLikelihood === 'high') {
    aiPenalty = 25;
    issues.push({
      type: 'ai_detected_high',
      score: 0,
      location: 'Overall',
    });
  } else if (aiDetection.aiLikelihood === 'medium') {
    aiPenalty = 15;
    issues.push({
      type: 'ai_detected_medium',
      score: 2,
      location: 'Various',
    });
  }
  overall -= aiPenalty;

  // 6. Check for reflection (quick pattern check)
  const reflectionPatterns = [
    /I (?:realized|learned|understood|discovered)/gi,
    /this (?:taught|showed|made) me/gi,
    /I began to (?:see|understand|realize)/gi,
  ];

  const hasReflection = reflectionPatterns.some(p => p.test(essayText));
  if (!hasReflection) {
    overall -= 10;
    issues.push({
      type: 'no_reflection',
      score: 2,
      location: 'Overall',
    });
  }

  // Clamp score to 0-100
  overall = Math.max(0, Math.min(100, overall));

  // Sort issues by score (lowest first)
  issues.sort((a, b) => a.score - b.score);

  return {
    overall,
    clicheScore,
    openingScore,
    lengthScore,
    schoolFitScore,
    aiPenalty,
    issues,
  };
}

function analyzeOpening(firstSentence: string): number {
  const lower = firstSentence.toLowerCase();

  // Instant fails
  if (/^i have always/i.test(lower)) return 0;
  if (/^ever since/i.test(lower)) return 1;
  if (/^webster'?s? (?:dictionary )?defines/i.test(lower)) return 0;
  if (/^according to/i.test(lower)) return 1;
  if (/^from a young age/i.test(lower)) return 1;
  if (/^growing up/i.test(lower)) return 2;

  // Good openings
  if (/^["']/.test(firstSentence)) return 4; // Starts with dialogue
  if (/^The (?:moment|day|first|last)/i.test(lower)) return 3.5; // Scene setting
  if (firstSentence.length < 60) return 3.5; // Short, punchy

  return 3; // Default
}

// =============================================================================
// ACTIONABLE ITEMS GENERATION
// =============================================================================

function generateActionableItems(
  essayText: string,
  intake: QuickIntake,
  clicheResult: ReturnType<typeof detectGenericPhrases>,
  aiDetection: ReturnType<typeof detectAIWriting>,
  scores: QuickScores
): QuickActionableItem[] {
  const items: QuickActionableItem[] = [];

  // Process issues in priority order
  for (const issue of scores.issues) {
    const item = issueToActionable(issue, intake, essayText);
    if (item) {
      items.push(item);
    }
  }

  // Add AI detection if significant
  if (aiDetection.aiLikelihood !== 'low' && !items.find(i => i.issue.includes('AI'))) {
    items.push({
      priority: items.length + 1,
      issue: 'AI writing patterns detected',
      location: 'Multiple sections',
      bluntFeedback: aiDetection.bluntVerdict,
      severity: aiDetection.aiLikelihood === 'high' ? 'critical' : 'major',
    });
  }

  // Ensure we have at least 3 items
  if (items.length < 3) {
    // Add generic improvement suggestions
    if (!items.find(i => i.issue.includes('specific'))) {
      items.push({
        priority: items.length + 1,
        issue: 'Essay could use more specific details',
        location: 'Throughout',
        bluntFeedback: 'Your essay speaks in generalities. Specific details make essays memorable.',
        severity: 'minor',
      });
    }
  }

  // Number priorities
  return items.slice(0, 7).map((item, idx) => ({
    ...item,
    priority: idx + 1,
  }));
}

function issueToActionable(
  issue: QuickIssue,
  intake: QuickIntake,
  essayText: string
): QuickActionableItem | null {
  switch (issue.type) {
    case 'cliche':
      return {
        priority: 0,
        issue: `Generic phrase: "${issue.text}"`,
        location: issue.location,
        bluntFeedback: `This exact phrase appears in thousands of rejected essays. AOs see it and think "nothing original here."`,
        severity: 'major',
      };

    case 'opening':
      const openingFeedback = getOpeningFeedback(issue.text || '');
      return {
        priority: 0,
        issue: 'Weak opening hook',
        location: 'Opening',
        bluntFeedback: openingFeedback,
        severity: 'critical',
      };

    case 'too_short':
      return {
        priority: 0,
        issue: `Essay too short (${issue.text})`,
        location: 'Overall',
        bluntFeedback: `At ${issue.text}, your essay lacks the depth AOs expect. You need room to show who you are.`,
        severity: 'major',
      };

    case 'no_school_specifics':
      return {
        priority: 0,
        issue: `No ${intake.targetSchool}-specific content`,
        location: 'Throughout',
        bluntFeedback: `This essay could be sent to any school. AOs can tell when you copy-paste. Research ${intake.targetSchool} for 30 minutes.`,
        severity: 'critical',
      };

    case 'school_red_flag':
      return {
        priority: 0,
        issue: `Red flag for ${intake.targetSchool}`,
        location: issue.location,
        bluntFeedback: `"${issue.text}" is exactly what ${intake.targetSchool} AOs flag as problematic. Remove it.`,
        severity: 'critical',
      };

    case 'ai_detected_high':
      return {
        priority: 0,
        issue: 'Essay appears AI-generated',
        location: 'Throughout',
        bluntFeedback: 'This reads like ChatGPT wrote it. AOs are trained to spot this. Rewrite in your own voice.',
        severity: 'critical',
      };

    case 'ai_detected_medium':
      return {
        priority: 0,
        issue: 'AI writing patterns detected',
        location: issue.location,
        bluntFeedback: 'Several phrases and structures typical of AI. Even if you wrote it, it will raise flags.',
        severity: 'major',
      };

    case 'no_reflection':
      return {
        priority: 0,
        issue: 'Missing the "so what" factor',
        location: 'Throughout',
        bluntFeedback: 'You describe what happened but never explain why it matters. AOs will think "so what?"',
        severity: 'major',
      };

    default:
      return null;
  }
}

function getOpeningFeedback(firstSentence: string): string {
  const lower = firstSentence.toLowerCase();

  if (/^i have always/i.test(lower)) {
    return BLUNT_TEMPLATES.opening['i_have_always'].explanation + ' ' +
      BLUNT_TEMPLATES.opening['i_have_always'].aoThought;
  }

  if (/^webster/i.test(lower)) {
    return BLUNT_TEMPLATES.opening['webster_defines'].explanation + ' ' +
      BLUNT_TEMPLATES.opening['webster_defines'].aoThought;
  }

  return BLUNT_TEMPLATES.opening.generic.explanation + ' ' +
    BLUNT_TEMPLATES.opening.generic.aoThought;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function generateQuickSummary(
  score: number,
  label: string,
  items: QuickActionableItem[],
  essayType?: string
): string {
  // Use our supportive score messaging to reduce anxiety and keep users engaged
  const scoreContext: ScoreContext = {
    score,
    essayType: essayType || 'supplemental',
    isDraft: true, // Assume first submission is a draft - more encouraging
  };

  const message = getScoreMessage(scoreContext);

  // Build summary: encouraging headline + context + critical issues count
  let summary = `${message.headline}. ${message.context}`;

  const criticalCount = items.filter(i => i.severity === 'critical').length;
  if (criticalCount > 0) {
    summary += ` We found ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} to address first.`;
  }

  // Add reassurance to keep them engaged (but they need to upgrade for the "how")
  summary += ` ${message.encouragement}`;

  return summary;
}

function generateUpgradeTeaser(scores: QuickScores, school: string): string {
  const weakest = scores.issues[0];
  const totalIssues = scores.issues.length;

  // Build compelling upgrade message based on what we found
  const benefits: string[] = [];

  // If we found issues, emphasize HOW to fix them
  if (totalIssues > 0) {
    benefits.push(`exactly how to fix ${totalIssues === 1 ? 'this issue' : `all ${totalIssues} issues`}`);
  }

  // Always emphasize school-specific value
  benefits.push(`${school}-specific insights from real AO perspectives`);

  // Emphasize line-by-line (this is what consultants charge $10k for)
  benefits.push('line-by-line feedback on every paragraph');

  // Emphasize strengths (students want to know what to KEEP)
  benefits.push('your essay\'s hidden strengths to preserve');

  // Build the teaser
  if (!weakest) {
    return `Upgrade to see ${benefits.slice(0, 2).join(', ')}.`;
  }

  const issueArea = weakest.type.includes('school')
    ? `${school}-specific fit`
    : weakest.type.includes('opening')
      ? 'opening hook'
      : weakest.type.includes('ai')
        ? 'AI detection flags'
        : weakest.type.includes('reflection')
          ? 'reflection depth'
          : 'this issue';

  return `Your ${issueArea} needs work. Upgrade to see ${benefits[0]}, plus ${benefits.slice(1).join(', ')}.`;
}

function countHiddenInsights(
  clicheResult: ReturnType<typeof detectGenericPhrases>,
  aiDetection: ReturnType<typeof detectAIWriting>,
  scores: QuickScores
): QuickAnalysisResult['hiddenInsights'] {
  return {
    totalIssuesFound: Math.max(
      scores.issues.length,
      clicheResult.totalFound + aiDetection.issues.length
    ),
    schoolSpecificIssues: scores.issues.filter(i =>
      i.type.includes('school')
    ).length + 3, // Tease more
    strengthsFound: 3, // Always tease some strengths
  };
}

// runQuickAnalysis is already exported at definition
