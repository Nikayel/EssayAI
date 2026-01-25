/**
 * Quick Analysis Tier ($9.99)
 * Fast, high-level analysis with 3-5 actionable items
 *
 * ENHANCED (Jan 2026): Now uses spike, activities, and background context
 * to deliver personalized feedback that feels worth $9.99.
 *
 * What user provides:
 *   - Essay + target school + essay type (required)
 *   - Spike/main angle (optional but recommended)
 *   - Top 3 activities (optional but recommended)
 *   - First-gen/international status (optional)
 *   - Draft status (optional)
 *
 * What user gets:
 *   - Score + 3-5 specific issues
 *   - PERSONALIZED feedback referencing THEIR spike/activities
 *   - Context-aware feedback for first-gen/international students
 *   - No fixes (upgrade for that)
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

  // Generate teaser for upgrade (personalized based on intake)
  const teaser = generateUpgradeTeaser(quickScores, intake.targetSchool, intake);

  // Get hidden insights count
  const hiddenInsights = countHiddenInsights(clicheResult, aiDetection, quickScores);

  return {
    tier: 'quick',
    overallScore: Math.round(overallScore * 10) / 10,
    scoreLabel,
    scoreSummary: generateQuickSummary(overallScore, scoreLabel, actionableItems, intake.essayType, intake),

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
  spikeConnection: number;      // NEW: How well essay connects to their spike
  activityMentions: number;     // NEW: How many of their activities are mentioned
  issues: QuickIssue[];
}

interface QuickIssue {
  type: string;
  score: number;
  location: string;
  text?: string;
  /** Personalized context from intake */
  personalContext?: string;
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

  // ==========================================================================
  // 7. SPIKE CONNECTION CHECK (NEW - uses intake context)
  // Does the essay connect to their stated main angle/theme?
  // ==========================================================================
  let spikeConnection = 3; // Default: neutral
  if (intake.spike && intake.spike.length > 10) {
    const spikeKeywords = extractKeywords(intake.spike);
    const essayLower = essayText.toLowerCase();
    const matchedKeywords = spikeKeywords.filter(kw => essayLower.includes(kw.toLowerCase()));
    const matchRatio = matchedKeywords.length / Math.max(1, spikeKeywords.length);

    if (matchRatio < 0.2) {
      // Essay doesn't mention their spike at all
      spikeConnection = 1;
      overall -= 12;
      issues.push({
        type: 'spike_disconnect',
        score: 1,
        location: 'Throughout',
        text: intake.spike.slice(0, 60),
        personalContext: `Your spike is "${intake.spike.slice(0, 50)}..." but your essay doesn't clearly connect to this theme.`,
      });
    } else if (matchRatio < 0.4) {
      // Weak connection
      spikeConnection = 2;
      overall -= 6;
      issues.push({
        type: 'spike_weak',
        score: 2,
        location: 'Throughout',
        personalContext: `Your essay touches on your spike but the connection could be stronger.`,
      });
    } else {
      // Good connection
      spikeConnection = 4;
    }
  }

  // ==========================================================================
  // 8. ACTIVITY MENTION CHECK (NEW - uses intake context)
  // Are they leveraging their top activities or listing them resume-style?
  // ==========================================================================
  let activityMentions = 0;
  const mentionedActivities: string[] = [];
  const missedActivities: string[] = [];

  if (intake.topActivities && intake.topActivities.length > 0) {
    const essayLower = essayText.toLowerCase();

    for (const activity of intake.topActivities) {
      if (!activity || activity.length < 3) continue;

      const activityKeywords = extractKeywords(activity);
      const isDirectlyMentioned = activityKeywords.some(kw =>
        kw.length > 3 && essayLower.includes(kw.toLowerCase())
      );

      if (isDirectlyMentioned) {
        activityMentions++;
        mentionedActivities.push(activity);
      } else {
        missedActivities.push(activity);
      }
    }

    // Check for resume-style listing (bad) vs. meaningful integration (good)
    const resumePatterns = [
      /I (?:founded|started|created|organized|led) (?:a |the |my )/gi,
      /As (?:president|founder|captain|leader|editor) of/gi,
      /I (?:was|am|became) (?:the )?\w+ of/gi,
    ];
    const resumeMatches = resumePatterns.reduce((count, p) =>
      count + (essayText.match(p)?.length || 0), 0);

    if (resumeMatches >= 3 && activityMentions >= 2) {
      // Resume-style listing detected
      overall -= 10;
      issues.push({
        type: 'resume_essay',
        score: 1,
        location: 'Throughout',
        personalContext: `Your essay reads like a resume - you list achievements (${mentionedActivities.slice(0, 2).join(', ')}) but don't show WHO you are through them.`,
      });
    } else if (missedActivities.length > 0 && activityMentions === 0) {
      // None of their activities are mentioned
      overall -= 5;
      issues.push({
        type: 'activities_missed',
        score: 2,
        location: 'Throughout',
        personalContext: `Your top activities (${missedActivities.slice(0, 2).join(', ')}) aren't mentioned. AOs will wonder about the disconnect.`,
      });
    }
  }

  // ==========================================================================
  // 9. FIRST-GEN / INTERNATIONAL CONTEXT (NEW)
  // Adjust feedback tone and note when context matters
  // ==========================================================================
  if (intake.isFirstGen || intake.isInternational) {
    // These students may express things differently - don't penalize certain patterns
    // But DO note if they're missing opportunities to share their unique perspective

    const hasUniqueContext = /first.*generation|immigrant|country|culture|language|family.*college/i.test(essayText);

    if (!hasUniqueContext && intake.isFirstGen) {
      // First-gen but not leveraging this perspective
      issues.push({
        type: 'firstgen_opportunity',
        score: 3, // Not a penalty, an opportunity
        location: 'Throughout',
        personalContext: `As a first-gen student, your perspective is valuable. Consider whether your unique journey could strengthen this essay.`,
      });
    }

    if (!hasUniqueContext && intake.isInternational) {
      issues.push({
        type: 'international_opportunity',
        score: 3,
        location: 'Throughout',
        personalContext: `Your international background could add depth. AOs value diverse perspectives when authentically shared.`,
      });
    }
  }

  // Clamp score to 0-100
  overall = Math.max(0, Math.min(100, overall));

  // Sort issues by score (lowest first = highest priority)
  issues.sort((a, b) => a.score - b.score);

  return {
    overall,
    clicheScore,
    openingScore,
    lengthScore,
    schoolFitScore,
    aiPenalty,
    spikeConnection,
    activityMentions,
    issues,
  };
}

/**
 * Extract meaningful keywords from a text string (for spike/activity matching)
 * Filters out common stop words to get the substance
 */
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'i', 'my', 'me', 'we', 'our', 'you',
    'your', 'it', 'its', 'this', 'that', 'these', 'those', 'am', 'about',
    'through', 'into', 'during', 'before', 'after', 'above', 'below', 'how',
    'what', 'when', 'where', 'why', 'who', 'which', 'very', 'just', 'also',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
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

    // =========================================================================
    // NEW: Personalized feedback types (from enhanced intake)
    // =========================================================================

    case 'spike_disconnect':
      return {
        priority: 0,
        issue: 'Essay doesn\'t connect to your main angle',
        location: issue.location,
        bluntFeedback: issue.personalContext ||
          'Your essay doesn\'t reflect the spike/theme you shared. AOs want a cohesive narrative across your application.',
        severity: 'critical',
      };

    case 'spike_weak':
      return {
        priority: 0,
        issue: 'Weak connection to your main angle',
        location: issue.location,
        bluntFeedback: issue.personalContext ||
          'Your essay touches on your theme but the connection could be stronger. Make it unmistakable.',
        severity: 'major',
      };

    case 'resume_essay':
      return {
        priority: 0,
        issue: 'Essay reads like a resume',
        location: issue.location,
        bluntFeedback: issue.personalContext ||
          'You\'re listing achievements instead of showing who you are. AOs already have your activities list - they want to hear your voice.',
        severity: 'critical',
      };

    case 'activities_missed':
      return {
        priority: 0,
        issue: 'Top activities not leveraged',
        location: issue.location,
        bluntFeedback: issue.personalContext ||
          'Your major activities aren\'t mentioned. This could be a missed opportunity to create a cohesive narrative.',
        severity: 'minor',
      };

    case 'firstgen_opportunity':
      return {
        priority: 0,
        issue: 'First-gen perspective opportunity',
        location: issue.location,
        bluntFeedback: issue.personalContext ||
          'As a first-gen student, you have a unique story. Consider if authentically sharing this could strengthen your essay.',
        severity: 'minor',
      };

    case 'international_opportunity':
      return {
        priority: 0,
        issue: 'International perspective opportunity',
        location: issue.location,
        bluntFeedback: issue.personalContext ||
          'Your international background is valuable. AOs appreciate authentic global perspectives when relevant.',
        severity: 'minor',
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
  essayType?: string,
  intake?: QuickIntake
): string {
  // Use our supportive score messaging to reduce anxiety and keep users engaged
  const scoreContext: ScoreContext = {
    score,
    essayType: essayType || 'supplemental',
    isDraft: intake?.draftStatus === 'first_draft',
  };

  const message = getScoreMessage(scoreContext);

  // Build summary: encouraging headline + context + critical issues count
  let summary = `${message.headline}. ${message.context}`;

  const criticalCount = items.filter(i => i.severity === 'critical').length;
  if (criticalCount > 0) {
    summary += ` We found ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} to address first.`;
  }

  // Add personalized context if we have intake data
  const hasSpikeIssue = items.some(i => i.issue.includes('angle') || i.issue.includes('spike'));
  const hasResumeIssue = items.some(i => i.issue.includes('resume'));

  if (hasSpikeIssue && intake?.spike) {
    summary += ` Your stated angle ("${intake.spike.slice(0, 30)}...") isn't coming through clearly.`;
  } else if (hasResumeIssue) {
    summary += ` Focus on showing WHO you are, not just WHAT you've done.`;
  }

  // Adjust tone for first-gen/international students
  if (intake?.isFirstGen || intake?.isInternational) {
    summary += ` ${message.encouragement}`;
    summary += ` Your unique background is an asset - make sure it's authentically represented.`;
  } else {
    summary += ` ${message.encouragement}`;
  }

  return summary;
}

function generateUpgradeTeaser(scores: QuickScores, school: string, intake?: QuickIntake): string {
  const weakest = scores.issues[0];
  const totalIssues = scores.issues.length;

  // Build compelling upgrade message based on what we found
  const benefits: string[] = [];

  // Personalized benefits based on what we found
  const hasSpikeIssue = scores.issues.some(i => i.type.includes('spike'));
  const hasResumeIssue = scores.issues.some(i => i.type === 'resume_essay');
  const hasSchoolIssue = scores.issues.some(i => i.type.includes('school'));

  if (hasSpikeIssue && intake?.spike) {
    benefits.push(`how to weave your "${intake.spike.slice(0, 25)}..." angle throughout`);
  } else if (totalIssues > 0) {
    benefits.push(`exactly how to fix ${totalIssues === 1 ? 'this issue' : `all ${totalIssues} issues`}`);
  }

  if (hasResumeIssue) {
    benefits.push('techniques to show WHO you are (not just list achievements)');
  }

  // School-specific value
  if (hasSchoolIssue) {
    benefits.push(`what ${school} AOs actually want to see`);
  } else {
    benefits.push(`${school}-specific insights from real AO perspectives`);
  }

  // Line-by-line (consultants charge $10k for this)
  benefits.push('line-by-line feedback on every paragraph');

  // Strengths (students want to know what to KEEP)
  benefits.push('your essay\'s hidden strengths to preserve');

  // Build the teaser
  if (!weakest) {
    return `Upgrade to see ${benefits.slice(0, 2).join(', ')}.`;
  }

  const issueArea = weakest.type.includes('spike')
    ? 'narrative connection'
    : weakest.type === 'resume_essay'
      ? 'resume-style writing'
      : weakest.type.includes('school')
        ? `${school}-specific fit`
        : weakest.type.includes('opening')
          ? 'opening hook'
          : weakest.type.includes('ai')
            ? 'AI detection flags'
            : weakest.type.includes('reflection')
              ? 'reflection depth'
              : 'this issue';

  return `Your ${issueArea} needs work. Upgrade to Ivy Single ($39) to see ${benefits[0]}, plus ${benefits.slice(1, 3).join(', ')}.`;
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
