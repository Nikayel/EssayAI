/**
 * Standard Analysis Tier ($79)
 * Full line-by-line analysis with school-specific insights
 *
 * What user provides: Essay + full intake (background, activities, etc.)
 * What user gets: Complete analysis + AO insights + personalized tips
 */

import type {
  FullIntake,
  StandardAnalysisResult,
  AnnotationWithFix,
  PrioritizedIssueWithFix,
  StandardSchoolFeedback,
  AOInsights,
  IdentifiedStrengthWithDetail,
  PersonalizedTip,
  TieredAnalysisOptions,
} from './types';
import { analyzeEssay } from '../engine';
import { detectAIWriting } from '../ai-detection';
import {
  generateAIDetectionFeedback,
  generateBluntFeedback,
  generateClicheFeedback,
  generateSchoolFitFeedback,
  BLUNT_TEMPLATES,
} from '../blunt-feedback';
import { getSchoolConfig } from '../school-configs';
import { getScoreLabel, getSchoolDisplayName } from '@/lib/config';
import { AO_INSIGHTS_BY_SCHOOL } from './ao-insights';
import { IVY_LEAGUE_SCHOOLS, type IvySchool } from '@/lib/data/ivy-league';
import { applyBackgroundAdjustments, type BackgroundAdjustmentResult } from '../background-adjustments';

// =============================================================================
// MAIN STANDARD ANALYSIS FUNCTION
// =============================================================================

/**
 * Run standard analysis for $79 tier
 * Full analysis with RAG, school-specific feedback, and AO insights
 */
export async function runStandardAnalysis(
  essayText: string,
  intake: FullIntake,
  options: TieredAnalysisOptions = {}
): Promise<StandardAnalysisResult> {
  const startTime = Date.now();

  // Run full analysis engine
  const fullAnalysis = await analyzeEssay(essayText, intake, {
    includeAnnotations: true,
    includeBenchmark: true,
    toneEmbedding: options.toneEmbedding,
  });

  // Run AI detection
  const aiDetection = detectAIWriting(essayText);
  const aiFeedback = generateAIDetectionFeedback(aiDetection);

  // Enhance annotations with blunt feedback
  const annotations = enhanceAnnotations(fullAnalysis.annotations, essayText);

  // Enhance issues with blunt feedback
  const allIssues = enhanceIssues(fullAnalysis.topIssues, intake);

  // Generate school-specific deep dive
  const schoolFeedback = generateSchoolDeepDive(
    essayText,
    intake,
    fullAnalysis
  );

  // Generate AO insights
  const aoInsights = generateAOInsights(
    essayText,
    intake,
    fullAnalysis
  );

  // Enhance strengths with details
  const strengths = enhanceStrengths(fullAnalysis.strengths);

  // Apply background-aware adjustments
  // This adds context for diverse student backgrounds (first-gen, international, etc.)
  const backgroundAdjustments = applyBackgroundAdjustments(
    intake,
    {
      authenticity: fullAnalysis.dimensions.authenticity.totalScore,
      insight: fullAnalysis.dimensions.insight.totalScore,
      schoolFit: fullAnalysis.dimensions.schoolFit.totalScore,
      specificity: fullAnalysis.dimensions.specificity.totalScore,
      risk: fullAnalysis.dimensions.risk.totalScore,
    },
    essayText
  );

  // Generate personalized tips based on intake
  const personalizedTips = generatePersonalizedTips(intake, fullAnalysis);

  // Merge background-specific notes into personalized tips
  const backgroundNotes = backgroundAdjustments.personalizedNotes.map(note => ({
    context: 'Based on your background',
    tip: note,
    reason: 'Personalized context for your situation',
  }));

  return {
    tier: 'standard',

    overallScore: fullAnalysis.overallScore,
    scoreLabel: fullAnalysis.scoreLabel,
    scoreSummary: fullAnalysis.scoreSummary,

    dimensions: fullAnalysis.dimensions,

    annotations,
    allIssues,

    aiDetection,
    aiFeedback,

    schoolFeedback,
    aoInsights,

    strengths,
    personalizedTips: [...backgroundNotes, ...personalizedTips].slice(0, 6), // Background context first

    // Include background context summary if applicable
    backgroundContext: backgroundAdjustments.adjustments.length > 0 ? {
      recognized: true,
      adjustmentsApplied: backgroundAdjustments.adjustments.map(a => a.dimension),
      note: 'We\'ve considered your background when providing feedback. See personalized tips above.',
    } : undefined,

    premiumTeaser: {
      message: 'Want a human expert to review this? Former AOs available.',
      turnaround: '48 hours',
    },

    metadata: {
      wordCount: fullAnalysis.metadata.wordCount,
      sentenceCount: fullAnalysis.metadata.sentenceCount,
      paragraphCount: fullAnalysis.metadata.paragraphCount,
      readingLevel: fullAnalysis.metadata.readingLevel,
      processingTimeMs: Date.now() - startTime,
    },
  };
}

// =============================================================================
// ANNOTATION ENHANCEMENT
// =============================================================================

function enhanceAnnotations(
  annotations: StandardAnalysisResult['annotations'],
  essayText: string
): AnnotationWithFix[] {
  return annotations.map(annotation => {
    let bluntFeedback = '';
    let aoThought = '';
    let fixSuggestion = '';
    let exampleRewrite = '';

    // Generate feedback based on annotation type
    if (annotation.category === 'cliche') {
      const clicheFeedback = generateClicheFeedback(annotation.text, annotation.fix);
      bluntFeedback = clicheFeedback.explanation;
      aoThought = clicheFeedback.aoThought;
      fixSuggestion = clicheFeedback.fix;
      exampleRewrite = annotation.fix || '';
    } else if (annotation.category === 'vocabulary') {
      bluntFeedback = BLUNT_TEMPLATES.voice.thesaurus_abuse(
        annotation.text,
        annotation.fix || 'simpler word'
      ).explanation;
      aoThought = '"Trying too hard to sound smart."';
      fixSuggestion = `Use "${annotation.fix || 'simpler words'}" instead`;
    } else if (annotation.type === 'strength') {
      bluntFeedback = 'This is working. Keep it.';
      aoThought = '"Now THIS is interesting."';
    } else if (annotation.category === 'cultural_sensitivity') {
      bluntFeedback = BLUNT_TEMPLATES.risk.savior_complex.explanation;
      aoThought = BLUNT_TEMPLATES.risk.savior_complex.aoThought;
      fixSuggestion = BLUNT_TEMPLATES.risk.savior_complex.fix;
    }

    return {
      ...annotation,
      bluntFeedback,
      aoThought,
      fixSuggestion,
      exampleRewrite,
    };
  });
}

// =============================================================================
// ISSUE ENHANCEMENT
// =============================================================================

function enhanceIssues(
  issues: StandardAnalysisResult['allIssues'],
  intake: FullIntake
): PrioritizedIssueWithFix[] {
  return issues.map(issue => {
    let bluntFeedback = generateBluntFeedback(
      `${issue.dimension.toLowerCase()}.${issue.issue.toLowerCase().replace(/\s+/g, '_')}`,
      { school: intake.essayContext?.targetSchool }
    );

    // Fallback to generic feedback
    if (!bluntFeedback) {
      bluntFeedback = {
        category: issue.dimension.toLowerCase() as any,
        severity: 'major',
        headline: issue.issue,
        explanation: issue.impact,
        aoThought: '"This needs work."',
        fix: issue.howToFix,
      };
    }

    return {
      ...issue,
      bluntFeedback,
    };
  });
}

// =============================================================================
// SCHOOL-SPECIFIC DEEP DIVE
// =============================================================================

function generateSchoolDeepDive(
  essayText: string,
  intake: FullIntake,
  analysis: Awaited<ReturnType<typeof analyzeEssay>>
): StandardSchoolFeedback {
  const schoolId = intake.essayContext?.targetSchool?.toLowerCase() || 'harvard';
  const schoolConfig = getSchoolConfig(schoolId);

  const textLower = essayText.toLowerCase();

  // Find aligned elements
  const alignedElements: string[] = [];
  if (schoolConfig) {
    for (const keyword of schoolConfig.cultureKeywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        alignedElements.push(keyword);
      }
    }
    for (const value of schoolConfig.valueKeywords) {
      if (textLower.includes(value.toLowerCase())) {
        alignedElements.push(value);
      }
    }
  }

  // Find missing elements
  const missingElements: StandardSchoolFeedback['missingElements'] = [];
  if (schoolConfig) {
    for (const must of schoolConfig.mustMention) {
      const mustWords = must.split('_').join(' ');
      if (!textLower.includes(mustWords)) {
        missingElements.push({
          element: mustWords,
          why: `${getSchoolDisplayName(schoolId)} values essays that address ${mustWords}`,
          howToAdd: getMissingElementSuggestion(must, schoolId),
        });
      }
    }
  }

  // Find red flags
  const redFlags: StandardSchoolFeedback['redFlags'] = [];
  if (schoolConfig) {
    for (const flag of schoolConfig.redFlags) {
      if (textLower.includes(flag.toLowerCase())) {
        redFlags.push({
          flag: flag,
          text: extractContextAroundMatch(essayText, flag),
          severity: 'critical',
        });
      }
    }
  }

  // Calculate fit score
  const fitScore = analysis.schoolFeedback?.fitScore ?? calculateFitScore(alignedElements, missingElements, redFlags);
  const fitLabel = getFitLabel(fitScore);

  // Generate school-specific tips
  const tips = generateSchoolTips(schoolId, alignedElements, missingElements);

  return {
    school: schoolId,
    schoolDisplayName: getSchoolDisplayName(schoolId),
    fitScore,
    fitLabel,
    alignedElements: [...new Set(alignedElements)],
    missingElements: missingElements.slice(0, 3),
    redFlags,
    tips,
  };
}

function getMissingElementSuggestion(element: string, schoolId: string): string {
  const suggestions: Record<string, Record<string, string>> = {
    harvard: {
      specific_course_professor_or_program: 'Research a specific professor or course. Mention them by name with why their work matters to you.',
      contribution_to_community: 'Describe how you\'ll contribute to the House system or campus life.',
      intellectual_pursuit: 'Share a genuine intellectual question you want to explore at Harvard.',
    },
    yale: {
      residential_college_culture: 'Mention a specific residential college or Yale tradition that excites you.',
      specific_academic_program: 'Name a specific program, like Directed Studies, and why it fits your interests.',
      community_contribution: 'Describe how you\'ll engage with Yale\'s community beyond academics.',
    },
    // Add more schools...
  };

  return suggestions[schoolId]?.[element] || `Add specific reference to ${element.split('_').join(' ')}`;
}

function extractContextAroundMatch(text: string, match: string): string {
  const index = text.toLowerCase().indexOf(match.toLowerCase());
  if (index === -1) return match;

  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + match.length + 30);

  let context = text.slice(start, end);
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';

  return context;
}

function calculateFitScore(
  aligned: string[],
  missing: StandardSchoolFeedback['missingElements'],
  redFlags: StandardSchoolFeedback['redFlags']
): number {
  let score = 10;
  score += aligned.length * 2;
  score -= missing.length * 2;
  score -= redFlags.length * 5;
  return Math.max(0, Math.min(20, score));
}

function getFitLabel(score: number): 'weak' | 'moderate' | 'strong' | 'excellent' {
  if (score >= 16) return 'excellent';
  if (score >= 12) return 'strong';
  if (score >= 8) return 'moderate';
  return 'weak';
}

function generateSchoolTips(schoolId: string, aligned: string[], missing: StandardSchoolFeedback['missingElements']): string[] {
  const tips: string[] = [];

  if (missing.length > 0) {
    tips.push(`Research ${getSchoolDisplayName(schoolId)}'s specific programs related to your interests.`);
  }

  if (aligned.length > 0) {
    tips.push(`Good: You mentioned ${aligned.slice(0, 2).join(' and ')}. Expand on why these matter to you personally.`);
  }

  // School-specific tips
  const schoolTips: Record<string, string[]> = {
    harvard: [
      'Harvard values intellectual curiosity over career ambition. Show genuine love of learning.',
      'Reference the House system and how you\'d contribute to residential life.',
    ],
    yale: [
      'Yale loves "quirky intellectuals" — show your unique interests.',
      'Mention residential colleges and Yale\'s community-focused culture.',
    ],
    princeton: [
      'Princeton\'s motto is "In the Nation\'s Service." Show genuine service commitment.',
      'Reference the honor code and independent work (thesis).',
    ],
    brown: [
      'Brown values self-directed learners. Show how you\'d use the Open Curriculum.',
      'Don\'t say you like Brown because it\'s "less stressful."',
    ],
  };

  tips.push(...(schoolTips[schoolId] || []));

  return tips.slice(0, 4);
}

// =============================================================================
// AO INSIGHTS GENERATION
// Uses both ao-insights.ts AND detailed ivy-league.ts data
// =============================================================================

/**
 * Get detailed school data from ivy-league.ts
 */
function getSchoolData(schoolId: string): IvySchool | undefined {
  return IVY_LEAGUE_SCHOOLS.find(s => s.id === schoolId.toLowerCase());
}

function generateAOInsights(
  essayText: string,
  intake: FullIntake,
  analysis: Awaited<ReturnType<typeof analyzeEssay>>
): AOInsights {
  const schoolId = intake.essayContext?.targetSchool?.toLowerCase() || 'harvard';
  const schoolInsights = AO_INSIGHTS_BY_SCHOOL[schoolId] || AO_INSIGHTS_BY_SCHOOL.harvard;
  const schoolData = getSchoolData(schoolId);

  // Analyze first impression
  const firstSentence = essayText.split(/[.!?]/)[0]?.trim() || '';
  const hookScore = analysis.dimensions.specificity.openingHook.score;

  // Get school-specific reading time if available
  const readingTime = schoolInsights.readingProcess?.timeSpent || '6-10 minutes';

  const firstImpression = {
    hookStrength: (hookScore >= 3.5 ? 'strong' : hookScore >= 2.5 ? 'moderate' : 'weak') as 'weak' | 'moderate' | 'strong',
    hookVerdict: getHookVerdict(hookScore, firstSentence, schoolInsights),
    timeToDecision: `${getSchoolDisplayName(schoolId)} AOs spend ${readingTime} on first read. They decide quickly if you're worth a second look.`,
  };

  // Generate AO thoughts throughout the essay - SCHOOL-SPECIFIC
  const aoThoughts: AOInsights['aoThoughts'] = [];

  // Opening thought - use school-specific instant turnoffs
  const instantTurnoffs = schoolInsights.readingProcess?.instantTurnoffs || [];
  const firstSentenceLower = firstSentence.toLowerCase();
  const matchedTurnoff = instantTurnoffs.find(t => firstSentenceLower.includes(t.toLowerCase().replace(/"/g, '')));

  if (matchedTurnoff) {
    aoThoughts.push({
      location: 'Opening',
      thought: `"${matchedTurnoff}" - instant red flag for ${getSchoolDisplayName(schoolId)}.`,
      sentiment: 'negative',
    });
  } else if (hookScore < 3) {
    aoThoughts.push({
      location: 'Opening',
      thought: '"I\'ve read this opening a hundred times today. Nothing makes me want to keep reading."',
      sentiment: 'negative',
    });
  } else if (hookScore >= 4) {
    aoThoughts.push({
      location: 'Opening',
      thought: '"Okay, this is different. I want to keep reading to see where this goes."',
      sentiment: 'positive',
    });
  }

  // Add school-specific what they notice
  const whatTheyNotice = schoolInsights.readingProcess?.whatTheyNotice || [];
  for (const notice of whatTheyNotice.slice(0, 2)) {
    // Check if essay fails this criterion
    if (notice.toLowerCase().includes('interesting') && hookScore < 3.5) {
      aoThoughts.push({
        location: 'Throughout',
        thought: `${getSchoolDisplayName(schoolId)} AOs ask: "${notice}" Your essay doesn't quite answer "yes" to this.`,
        sentiment: 'negative',
      });
      break;
    }
  }

  // Reflection thought - the "So What?" test
  if (analysis.dimensions.insight.depthOfReflection.score < 3) {
    aoThoughts.push({
      location: 'Middle paragraphs',
      thought: '"You told me what happened, but not why it matters. So what?"',
      sentiment: 'negative',
    });
  }

  // School fit thought - use school-specific common mistakes
  const commonMistakes = schoolInsights.commonMistakes || [];
  if (analysis.dimensions.schoolFit.totalScore < 12) {
    const relevantMistake = commonMistakes[0] || 'Not showing genuine fit';
    aoThoughts.push({
      location: 'School references',
      thought: `"${relevantMistake}" - this is exactly what we see too often.`,
      sentiment: 'negative',
    });
  }

  // Add positive thought if essay demonstrates what they love
  const whatTheyLove = schoolInsights.whatTheyLove || [];
  for (const loved of whatTheyLove) {
    const lovedKeywords = loved.toLowerCase().split(' ').filter(w => w.length > 4);
    if (lovedKeywords.some(kw => essayText.toLowerCase().includes(kw))) {
      aoThoughts.push({
        location: 'Content',
        thought: `"This student might be one of ${whatTheyLove[0].includes('interesting') ? 'the interesting ones' : 'what we\'re looking for'}."`,
        sentiment: 'positive',
      });
      break;
    }
  }

  // Check which values the essay demonstrates
  const whatTheyValue = schoolInsights.values.map(v => ({
    trait: v.trait,
    description: v.description,
    yourEssayHas: checkForTrait(essayText, v.keywords),
  }));

  // Add school-specific context from ivy-league.ts
  if (schoolData) {
    // Add what makes this school different as context
    if (schoolData.whatMakesThisSchoolDifferent && analysis.dimensions.schoolFit.totalScore < 15) {
      aoThoughts.push({
        location: 'School fit',
        thought: `What makes ${schoolData.shortName} different: ${schoolData.whatMakesThisSchoolDifferent.slice(0, 120)}...`,
        sentiment: 'neutral',
      });
    }

    // Add student body character as benchmark
    if (schoolData.studentBodyCharacter) {
      const isGoodFit = analysis.overallScore >= 75;
      aoThoughts.push({
        location: 'Overall fit',
        thought: isGoodFit
          ? `This student could fit our culture: ${schoolData.studentBodyCharacter.slice(0, 80)}...`
          : `Our students are: ${schoolData.studentBodyCharacter.slice(0, 80)}... Does this essay show that?`,
        sentiment: isGoodFit ? 'positive' : 'neutral',
      });
    }
  }

  // Use detailed aoInsights from ivy-league.ts for extra context
  const detailedInsights = schoolData?.aoInsights || [];
  const readerPerspective = detailedInsights.find(i => i.type === 'reader_perspective');
  if (readerPerspective) {
    aoThoughts.push({
      location: 'Reader mindset',
      thought: readerPerspective.content.slice(0, 150) + (readerPerspective.content.length > 150 ? '...' : ''),
      sentiment: 'neutral',
    });
  }

  // Overall verdict - more nuanced based on school
  const score = analysis.overallScore;
  let overallVerdict: string;

  if (score >= 80) {
    overallVerdict = `This essay would likely get a favorable read at ${getSchoolDisplayName(schoolId)}. The AO would have something positive to say in committee.`;
  } else if (score >= 70) {
    overallVerdict = `This essay is competitive but has gaps. A ${getSchoolDisplayName(schoolId)} AO might think "good student, but this essay doesn't seal the deal."`;
  } else if (score >= 60) {
    overallVerdict = `This essay needs work before it helps your ${getSchoolDisplayName(schoolId)} application. Right now, it's not memorable enough.`;
  } else {
    overallVerdict = `This essay could hurt your application. ${getSchoolDisplayName(schoolId)} AOs would likely move on quickly. Significant revision needed.`;
  }

  return {
    school: getSchoolDisplayName(schoolId),
    whatTheyValue,
    firstImpression,
    aoThoughts: aoThoughts.slice(0, 6), // Limit to 6 most important thoughts
    overallVerdict,
  };
}

function getHookVerdict(
  score: number,
  firstSentence: string,
  schoolInsights: typeof AO_INSIGHTS_BY_SCHOOL[string]
): string {
  const instantTurnoffs = schoolInsights.readingProcess?.instantTurnoffs || [];

  // Check for school-specific instant turnoffs
  const firstSentenceLower = firstSentence.toLowerCase();
  for (const turnoff of instantTurnoffs) {
    const cleanTurnoff = turnoff.toLowerCase().replace(/"/g, '');
    if (firstSentenceLower.includes(cleanTurnoff.slice(0, 20))) {
      return `"${turnoff}" - this is an instant red flag for this school.`;
    }
  }

  if (score >= 4) {
    return 'Strong opening. AO will keep reading with genuine interest.';
  }
  if (score >= 3) {
    return 'Decent opening, but not memorable. Consider starting with a specific moment, dialogue, or sensory detail.';
  }
  if (/^i have always/i.test(firstSentence)) {
    return '"I have always..." is the #1 most overused opening. AOs see this and immediately think "here we go again."';
  }
  if (/^webster|^according to|^the dictionary/i.test(firstSentence)) {
    return 'Dictionary definitions and famous quotes are essay killers. AOs groan when they see these.';
  }
  return 'Weak opening. The AO is already tempted to skim rather than read carefully.';
}

function checkForTrait(text: string, keywords: string[]): boolean {
  const textLower = text.toLowerCase();
  return keywords.some(kw => textLower.includes(kw.toLowerCase()));
}

// =============================================================================
// STRENGTH ENHANCEMENT
// =============================================================================

function enhanceStrengths(
  strengths: StandardAnalysisResult['strengths']
): IdentifiedStrengthWithDetail[] {
  return strengths.map(strength => ({
    element: strength.element,
    location: strength.location ? `Paragraph ${strength.location.startLine}` : undefined,
    why: strength.why,
    aoThought: getStrengthAOThought(strength.element),
    keepThis: true,
  }));
}

function getStrengthAOThought(element: string): string {
  const thoughts: Record<string, string> = {
    'Unique personal perspective': '"This could only have been written by this student."',
    'Original language': '"Fresh writing. They actually thought about their words."',
    'Deep reflection': '"This student is self-aware. They\'ll grow in college."',
    'Clear growth arc': '"I can see how they\'ve matured. That\'s what we want."',
    'School-specific knowledge': '"They actually researched us. They\'re serious."',
    'Strong opening': '"Hooked. I want to read more."',
    'Effective use of dialogue': '"I can hear the conversation. This is vivid."',
  };

  return thoughts[element] || '"This stands out."';
}

// =============================================================================
// PERSONALIZED TIPS
// =============================================================================

function generatePersonalizedTips(
  intake: FullIntake,
  analysis: Awaited<ReturnType<typeof analyzeEssay>>
): PersonalizedTip[] {
  const tips: PersonalizedTip[] = [];

  // First-gen specific tips
  if (intake.demographics?.isFirstGen) {
    tips.push({
      context: 'As a first-generation student',
      tip: 'Your perspective is an asset. Don\'t hide it — lean into the unique challenges and insights you bring.',
      reason: 'AOs value first-gen perspectives. Being explicit about your background adds context.',
    });

    if (analysis.dimensions.authenticity.totalScore < 18) {
      tips.push({
        context: 'As a first-gen student',
        tip: 'Your essay might benefit from more of your authentic voice. Don\'t try to sound like what you think colleges want.',
        reason: 'First-gen students sometimes over-correct to sound "academic." Your real voice is valuable.',
      });
    }
  }

  // International student tips
  if (intake.demographics?.isInternational) {
    tips.push({
      context: 'As an international student',
      tip: 'Show specific knowledge of American college culture and why THIS school fits you specifically.',
      reason: 'AOs want to see you understand what you\'re applying to.',
    });
  }

  // Low-income tips
  if (intake.demographics?.householdIncome === '<30k' || intake.demographics?.householdIncome === '30-75k') {
    tips.push({
      context: 'Given your background',
      tip: 'If work or family responsibilities affected your activities, mention it. Context matters.',
      reason: 'AOs read applications holistically. They\'ll consider your circumstances if you share them.',
    });
  }

  // Essay type specific
  if (intake.essayContext?.essayType === 'why_us') {
    tips.push({
      context: 'For a "Why Us" essay',
      tip: 'The best essays are 70% about you and 30% about the school. Don\'t just list programs.',
      reason: 'AOs want to see fit, not a research report on their website.',
    });
  }

  // Weak areas
  if (analysis.dimensions.schoolFit.totalScore < 12) {
    tips.push({
      context: 'To improve school fit',
      tip: `Spend 30 minutes researching ${intake.essayContext?.targetSchool}. Find one specific program, professor, or tradition.`,
      reason: 'Generic essays signal lack of genuine interest.',
    });
  }

  return tips.slice(0, 4);
}

// =============================================================================
// EXPORTS
// =============================================================================

export { runStandardAnalysis };
