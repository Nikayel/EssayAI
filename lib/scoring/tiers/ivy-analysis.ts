/**
 * Ivy League Analysis Tier
 *
 * $39 Single School: Complete analysis of ALL essays for one school
 * $79 Three Schools: Same depth for 3 schools
 *
 * What makes this different from Standard ($79):
 * - School-specific AO perspective (written as if by former AO)
 * - Portfolio analysis (all essays analyzed together)
 * - Resume-essay detection with coaching
 * - Leverage points (how to use background without making it a resume)
 * - Instant reject signal detection
 * - Committee pitch readiness assessment
 */

import type { StudentIntake } from '../types';
import type { FullIntake } from './types';
import {
  buildSchoolSpecificAnalysisPrompt,
  detectResumeEssay,
  analyzeLeveragePoints,
  analyzePortfolio,
  IVY_ESSAY_REQUIREMENTS,
  SCHOOL_AO_PERSPECTIVES,
  type SchoolEssayRequirements,
  type ResumeEssaySignals,
  type LeverageAnalysis,
  type PortfolioAnalysis,
  type EssayForPortfolio,
} from '@/lib/ai/ivy-school-prompts';
import { getIvySchool, type IvySchool, type EssayPrompt } from '@/lib/data/ivy-league';
import { analyzeEssay } from '../engine';
import { applyBackgroundAdjustments } from '../background-adjustments';

// =============================================================================
// TYPES
// =============================================================================

export interface IvySingleEssayAnalysis {
  promptId: string;
  promptTitle: string;
  wordCount: number;

  // Core analysis
  overallScore: number;
  scoreLabel: string;

  // Resume-essay detection
  resumeEssayCheck: ResumeEssaySignals;

  // School-specific AO perspective
  aoFirstImpression: string;
  meetsRequirements: { requirement: string; met: boolean; evidence: string }[];
  instantRejectSignals: string[];
  eyesLightUpMoments: string[];
  committeePitchReady: boolean;
  committeePitchAttempt: string;
  schoolSpecificIssues: string[];

  // So What test
  soWhatTest: {
    passes: boolean;
    whatWeLEarn: string;
    whatWeDontLearn: string;
    memorableAfter100Essays: boolean;
  };

  // Leverage analysis
  leverageAnalysis: LeverageAnalysis;

  // Detailed feedback
  topIssues: {
    rank: number;
    issue: string;
    whyMattersForSchool: string;
    coachingDirection: string;
    aoThought: string;
  }[];

  strengths: {
    element: string;
    whyWorks: string;
  }[];

  // Overall assessment
  wouldHelpOrHurt: 'help' | 'neutral' | 'hurt';
  honestAssessment: string;
  oneThingToFix: string;
}

export interface IvySchoolAnalysis {
  schoolId: string;
  schoolName: string;

  // School context
  requirements: SchoolEssayRequirements;
  aoPerspective: typeof SCHOOL_AO_PERSPECTIVES[string];

  // Individual essay analyses
  essays: IvySingleEssayAnalysis[];

  // Portfolio analysis (if multiple essays)
  portfolioAnalysis?: PortfolioAnalysis;

  // Overall school verdict
  overallFitScore: number;
  overallVerdict: string;
  readyForSubmission: boolean;
  criticalFixes: string[];
}

export interface IvyAnalysisResult {
  tier: 'ivy_single' | 'ivy_bundle_3' | 'ivy_bundle_8';
  schools: IvySchoolAnalysis[];

  // Cross-school analysis (for bundles)
  crossSchoolAnalysis?: {
    narrativeConsistency: boolean;
    themeOverlap: string[];
    differentiationTips: string[];
    masterNarrative: string;
  };

  metadata: {
    totalEssaysAnalyzed: number;
    totalWordCount: number;
    processingTimeMs: number;
    analysisVersion: string;
  };
}

// =============================================================================
// MAIN ANALYSIS FUNCTIONS
// =============================================================================

interface IvyEssayInput {
  promptId: string;
  essayText: string;
}

interface IvyAnalysisOptions {
  includePortfolio?: boolean;
}

/**
 * Run Ivy analysis for a single school ($39 tier)
 * Analyzes ALL essays for this school as a cohesive portfolio
 */
export async function runIvySingleSchoolAnalysis(
  schoolId: string,
  essays: IvyEssayInput[],
  intake: FullIntake,
  options: IvyAnalysisOptions = {}
): Promise<IvySchoolAnalysis> {
  const startTime = Date.now();

  const school = getIvySchool(schoolId);
  if (!school) {
    throw new Error(`Unknown Ivy school: ${schoolId}`);
  }

  const requirements = IVY_ESSAY_REQUIREMENTS[schoolId];
  const aoPerspective = SCHOOL_AO_PERSPECTIVES[schoolId];

  if (!requirements || !aoPerspective) {
    throw new Error(`Missing configuration for school: ${schoolId}`);
  }

  // Analyze each essay individually
  const essayAnalyses: IvySingleEssayAnalysis[] = [];

  for (const essay of essays) {
    const analysis = await analyzeIvyEssay(
      schoolId,
      essay.promptId,
      essay.essayText,
      intake
    );
    essayAnalyses.push(analysis);
  }

  // Run portfolio analysis if multiple essays
  let portfolioAnalysis: PortfolioAnalysis | undefined;

  if (essays.length > 1 && (options.includePortfolio ?? true)) {
    const portfolioEssays: EssayForPortfolio[] = essayAnalyses.map((analysis, i) => ({
      promptId: analysis.promptId,
      promptTitle: analysis.promptTitle,
      essayText: essays[i].essayText,
      themes: extractThemes(essays[i].essayText),
      traitsShown: extractTraits(analysis),
    }));

    portfolioAnalysis = analyzePortfolio(schoolId, portfolioEssays);
  }

  // Calculate overall school verdict
  const avgScore = essayAnalyses.reduce((sum, e) => sum + e.overallScore, 0) / essayAnalyses.length;
  const anyResumeEssays = essayAnalyses.some(e => e.resumeEssayCheck.isResumeEssay && e.resumeEssayCheck.confidence !== 'low');
  const anyInstantRejects = essayAnalyses.some(e => e.instantRejectSignals.length > 0);
  const allSoWhatPass = essayAnalyses.every(e => e.soWhatTest.passes);

  // Compile critical fixes
  const criticalFixes: string[] = [];

  if (anyResumeEssays) {
    criticalFixes.push('CRITICAL: One or more essays read like a resume. AOs already have your activities list - they need to see WHO YOU ARE.');
  }

  if (anyInstantRejects) {
    const rejectSignals = essayAnalyses.flatMap(e => e.instantRejectSignals);
    criticalFixes.push(`CRITICAL: Detected instant-reject signals: ${rejectSignals.slice(0, 3).join('; ')}`);
  }

  if (!allSoWhatPass) {
    criticalFixes.push('Some essays fail the "So What?" test - they tell what you DID but not who you BECAME.');
  }

  if (portfolioAnalysis && portfolioAnalysis.coherenceScore < 60) {
    criticalFixes.push(`Portfolio coherence is low (${portfolioAnalysis.coherenceScore}/100). Essays may be repetitive or missing key dimensions of your character.`);
  }

  // Generate overall verdict
  let overallVerdict: string;
  let readyForSubmission = false;

  if (avgScore >= 80 && !anyResumeEssays && !anyInstantRejects && allSoWhatPass) {
    overallVerdict = `Strong application portfolio for ${school.shortName}. These essays would help your application. Minor refinements possible but not critical.`;
    readyForSubmission = true;
  } else if (avgScore >= 70 && criticalFixes.length <= 1) {
    overallVerdict = `Good foundation for ${school.shortName}, but address the critical issues before submission. These essays are competitive with fixes.`;
    readyForSubmission = false;
  } else if (avgScore >= 60) {
    overallVerdict = `Essays need significant work before helping your ${school.shortName} application. The ideas are there but execution needs improvement.`;
    readyForSubmission = false;
  } else {
    overallVerdict = `Essays would likely hurt your ${school.shortName} application in current form. Major revision needed. Consider the structural feedback seriously.`;
    readyForSubmission = false;
  }

  return {
    schoolId,
    schoolName: school.name,
    requirements,
    aoPerspective,
    essays: essayAnalyses,
    portfolioAnalysis,
    overallFitScore: Math.round(avgScore),
    overallVerdict,
    readyForSubmission,
    criticalFixes,
  };
}

/**
 * Run Ivy analysis for 3 schools ($79 tier)
 */
export async function runIvyThreeSchoolAnalysis(
  schools: { schoolId: string; essays: IvyEssayInput[] }[],
  intake: FullIntake
): Promise<IvyAnalysisResult> {
  const startTime = Date.now();

  if (schools.length > 3) {
    throw new Error('Ivy 3-school bundle supports maximum 3 schools');
  }

  // Analyze each school
  const schoolAnalyses: IvySchoolAnalysis[] = [];

  for (const school of schools) {
    const analysis = await runIvySingleSchoolAnalysis(
      school.schoolId,
      school.essays,
      intake
    );
    schoolAnalyses.push(analysis);
  }

  // Cross-school analysis
  const crossSchoolAnalysis = analyzeCrossSchool(schoolAnalyses, intake);

  // Calculate totals
  const totalEssays = schoolAnalyses.reduce((sum, s) => sum + s.essays.length, 0);
  const totalWords = schoolAnalyses.reduce((sum, s) =>
    sum + s.essays.reduce((eSum, e) => eSum + e.wordCount, 0), 0);

  return {
    tier: 'ivy_bundle_3',
    schools: schoolAnalyses,
    crossSchoolAnalysis,
    metadata: {
      totalEssaysAnalyzed: totalEssays,
      totalWordCount: totalWords,
      processingTimeMs: Date.now() - startTime,
      analysisVersion: '2.1.0',
    },
  };
}

/**
 * Run Ivy analysis for all 8 schools ($149 tier)
 */
export async function runIvyAllSchoolsAnalysis(
  schools: { schoolId: string; essays: IvyEssayInput[] }[],
  intake: FullIntake
): Promise<IvyAnalysisResult> {
  const startTime = Date.now();

  // Analyze each school
  const schoolAnalyses: IvySchoolAnalysis[] = [];

  for (const school of schools) {
    const analysis = await runIvySingleSchoolAnalysis(
      school.schoolId,
      school.essays,
      intake
    );
    schoolAnalyses.push(analysis);
  }

  // Cross-school analysis
  const crossSchoolAnalysis = analyzeCrossSchool(schoolAnalyses, intake);

  // Calculate totals
  const totalEssays = schoolAnalyses.reduce((sum, s) => sum + s.essays.length, 0);
  const totalWords = schoolAnalyses.reduce((sum, s) =>
    sum + s.essays.reduce((eSum, e) => eSum + e.wordCount, 0), 0);

  return {
    tier: 'ivy_bundle_8',
    schools: schoolAnalyses,
    crossSchoolAnalysis,
    metadata: {
      totalEssaysAnalyzed: totalEssays,
      totalWordCount: totalWords,
      processingTimeMs: Date.now() - startTime,
      analysisVersion: '2.1.0',
    },
  };
}

// =============================================================================
// INTERNAL ANALYSIS FUNCTIONS
// =============================================================================

/**
 * Analyze a single Ivy essay with school-specific AO perspective
 */
async function analyzeIvyEssay(
  schoolId: string,
  promptId: string,
  essayText: string,
  intake: FullIntake
): Promise<IvySingleEssayAnalysis> {
  const school = getIvySchool(schoolId)!;
  const prompt = school.essayPrompts.find(p => p.id === promptId);
  const aoPerspective = SCHOOL_AO_PERSPECTIVES[schoolId];

  // Run base analysis
  const baseAnalysis = await analyzeEssay(essayText, intake, {
    includeAnnotations: true,
  });

  // Run resume-essay detection
  const resumeCheck = detectResumeEssay(essayText);

  // Run leverage analysis
  const leverageAnalysis = analyzeLeveragePoints(essayText, intake);

  // Check for instant reject signals
  const instantRejectSignals = detectInstantRejectSignals(
    essayText,
    aoPerspective.instantRejects
  );

  // Check for "eyes light up" moments
  const eyesLightUpMoments = detectPositiveSignals(
    essayText,
    baseAnalysis,
    aoPerspective.whatMakesMyEyesLightUp
  );

  // Check if requirements are met
  const meetsRequirements = checkRequirements(
    essayText,
    baseAnalysis,
    aoPerspective.whatIMustSee
  );

  // Evaluate "So What" test
  const soWhatTest = evaluateSoWhatTest(essayText, baseAnalysis);

  // Generate AO first impression
  const aoFirstImpression = generateAOFirstImpression(
    essayText,
    schoolId,
    baseAnalysis.dimensions.specificity.openingHook.score
  );

  // Generate committee pitch attempt
  const committeePitchReady = baseAnalysis.overallScore >= 75 &&
                               !resumeCheck.isResumeEssay &&
                               soWhatTest.passes;
  const committeePitchAttempt = generateCommitteePitch(
    essayText,
    intake,
    baseAnalysis,
    school
  );

  // Generate top issues with school context
  const topIssues = generateSchoolSpecificIssues(
    baseAnalysis.topIssues,
    schoolId,
    resumeCheck,
    leverageAnalysis
  );

  // Determine overall verdict
  let wouldHelpOrHurt: 'help' | 'neutral' | 'hurt' = 'neutral';
  if (baseAnalysis.overallScore >= 75 && !resumeCheck.isResumeEssay && instantRejectSignals.length === 0) {
    wouldHelpOrHurt = 'help';
  } else if (baseAnalysis.overallScore < 60 || resumeCheck.confidence === 'high' || instantRejectSignals.length > 0) {
    wouldHelpOrHurt = 'hurt';
  }

  // Generate honest assessment
  const honestAssessment = generateHonestAssessment(
    baseAnalysis.overallScore,
    resumeCheck,
    soWhatTest,
    instantRejectSignals,
    school
  );

  // One thing to fix
  const oneThingToFix = determineOneThingToFix(
    resumeCheck,
    soWhatTest,
    instantRejectSignals,
    topIssues
  );

  return {
    promptId,
    promptTitle: prompt?.title || promptId,
    wordCount: baseAnalysis.metadata.wordCount,
    overallScore: baseAnalysis.overallScore,
    scoreLabel: baseAnalysis.scoreLabel,
    resumeEssayCheck: resumeCheck,
    aoFirstImpression,
    meetsRequirements,
    instantRejectSignals,
    eyesLightUpMoments,
    committeePitchReady,
    committeePitchAttempt,
    schoolSpecificIssues: findSchoolSpecificIssues(essayText, school),
    soWhatTest,
    leverageAnalysis,
    topIssues,
    strengths: baseAnalysis.strengths.slice(0, 3).map(s => ({
      element: s.element,
      whyWorks: s.why,
    })),
    wouldHelpOrHurt,
    honestAssessment,
    oneThingToFix,
  };
}

/**
 * Analyze cross-school narrative consistency
 */
function analyzeCrossSchool(
  schoolAnalyses: IvySchoolAnalysis[],
  intake: FullIntake
): IvyAnalysisResult['crossSchoolAnalysis'] {
  // Find common themes across all essays
  const allThemes: string[] = [];
  for (const school of schoolAnalyses) {
    for (const essay of school.essays) {
      // Extract themes (simplified - would use NLP in production)
      const essayThemes = extractThemesFromAnalysis(essay);
      allThemes.push(...essayThemes);
    }
  }

  // Count theme occurrences
  const themeCounts: Record<string, number> = {};
  for (const theme of allThemes) {
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  }

  const themeOverlap = Object.entries(themeCounts)
    .filter(([_, count]) => count >= schoolAnalyses.length)
    .map(([theme]) => theme);

  // Check narrative consistency
  const narrativeConsistency = themeOverlap.length >= 1 &&
    schoolAnalyses.every(s => s.overallFitScore >= 60);

  // Generate differentiation tips
  const differentiationTips: string[] = [];

  if (themeOverlap.length > 2) {
    differentiationTips.push(`You're repeating themes (${themeOverlap.join(', ')}) across schools. Each school should see a DIFFERENT facet of who you are.`);
  }

  for (const school of schoolAnalyses) {
    const schoolSpecific = SCHOOL_AO_PERSPECTIVES[school.schoolId]?.uniqueToThisSchool;
    if (schoolSpecific) {
      differentiationTips.push(`${school.schoolName}: Remember - ${schoolSpecific.slice(0, 100)}...`);
    }
  }

  // Master narrative
  const masterNarrative = intake.activities?.spike
    ? `Your spike is "${intake.activities.spike}". Make sure each school sees how this narrative connects to their specific culture and values.`
    : 'Define your master narrative - the throughline that connects all your essays while allowing school-specific tailoring.';

  return {
    narrativeConsistency,
    themeOverlap,
    differentiationTips,
    masterNarrative,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function detectInstantRejectSignals(text: string, rejectPatterns: string[]): string[] {
  const signals: string[] = [];
  const textLower = text.toLowerCase();

  for (const pattern of rejectPatterns) {
    const patternLower = pattern.toLowerCase();
    // Check for key phrases
    const keyPhrases = patternLower.split(' ').filter(w => w.length > 4);
    if (keyPhrases.some(phrase => textLower.includes(phrase))) {
      signals.push(pattern);
    }
  }

  // Additional pattern checks
  if (/world[- ]class|prestigious|top[- ]ranked|best professors/i.test(text)) {
    signals.push('Generic prestige language detected');
  }

  if (/i('ve| have) (always )?dream(ed|t) of (attending|going to)/i.test(text)) {
    signals.push('"I\'ve always dreamed of..." without substantive reasons');
  }

  return signals;
}

function detectPositiveSignals(
  text: string,
  analysis: Awaited<ReturnType<typeof analyzeEssay>>,
  positivePatterns: string[]
): string[] {
  const moments: string[] = [];

  // Check for authentic voice indicators
  if (analysis.dimensions.authenticity.totalScore >= 20) {
    moments.push('Authentic voice that sounds like a real student');
  }

  // Check for specific details
  if (analysis.dimensions.specificity.concreteDetails.specificNouns.length >= 3) {
    moments.push(`Specific details: ${analysis.dimensions.specificity.concreteDetails.specificNouns.slice(0, 2).join(', ')}`);
  }

  // Check for reflection depth
  if (analysis.dimensions.insight.depthOfReflection.score >= 4) {
    moments.push('Genuine reflection and self-awareness');
  }

  // Check for dialogue
  if (analysis.dimensions.specificity.dialogue.dialogueInstances.length > 0) {
    moments.push('Effective use of dialogue');
  }

  return moments;
}

function checkRequirements(
  text: string,
  analysis: Awaited<ReturnType<typeof analyzeEssay>>,
  requirements: string[]
): { requirement: string; met: boolean; evidence: string }[] {
  return requirements.map(req => {
    let met = false;
    let evidence = '';

    if (req.toLowerCase().includes('intellectual curiosity')) {
      met = analysis.dimensions.insight.totalScore >= 18;
      evidence = met ? 'Demonstrates genuine intellectual engagement' : 'Needs more depth of intellectual exploration';
    } else if (req.toLowerCase().includes('authentic')) {
      met = analysis.dimensions.authenticity.totalScore >= 18;
      evidence = met ? 'Voice feels genuine' : 'Voice feels coached or artificial';
    } else if (req.toLowerCase().includes('self-awareness') || req.toLowerCase().includes('reflection')) {
      met = analysis.dimensions.insight.selfAwareness.score >= 3;
      evidence = met ? 'Shows self-awareness' : 'Lacks reflection on growth or weaknesses';
    } else if (req.toLowerCase().includes('contribute') || req.toLowerCase().includes('community')) {
      met = text.toLowerCase().includes('contribute') || text.toLowerCase().includes('community');
      evidence = met ? 'Mentions contribution' : 'Doesn\'t address how you\'ll contribute';
    } else {
      // Generic check
      const keywords = req.toLowerCase().split(' ').filter(w => w.length > 4);
      met = keywords.some(kw => text.toLowerCase().includes(kw));
      evidence = met ? `References: ${req.slice(0, 30)}...` : `Missing: ${req.slice(0, 30)}...`;
    }

    return { requirement: req, met, evidence };
  });
}

function evaluateSoWhatTest(
  text: string,
  analysis: Awaited<ReturnType<typeof analyzeEssay>>
): IvySingleEssayAnalysis['soWhatTest'] {
  const passes = analysis.dimensions.insight.soWhatFactor.score >= 3.5;

  return {
    passes,
    whatWeLEarn: passes
      ? analysis.dimensions.insight.soWhatFactor.readerTakeaway || 'Reveals meaningful insight about the student'
      : 'Activities and achievements, but not who the student really is',
    whatWeDontLearn: passes
      ? 'Minor gaps only'
      : 'How the student THINKS, what they VALUE, who they ARE beyond achievements',
    memorableAfter100Essays: passes && analysis.dimensions.insight.soWhatFactor.memorability >= 0.7,
  };
}

function generateAOFirstImpression(
  text: string,
  schoolId: string,
  hookScore: number
): string {
  const school = getIvySchool(schoolId)!;
  const firstSentence = text.split(/[.!?]/)[0]?.trim() || '';

  if (/^i have always/i.test(firstSentence)) {
    return `"I have always..." - I see this opening 50 times a day. Already tempted to skim. This student has 7 seconds to change my mind.`;
  }

  if (hookScore >= 4) {
    return `Interesting start. I want to keep reading. This could be someone who\'d add something to ${school.shortName}.`;
  }

  if (hookScore >= 3) {
    return `Decent opening, but not memorable yet. I\'m reading, but I\'m not leaning forward.`;
  }

  return `Weak opening. I\'ve seen this before. Already categorizing this as "probably a no" and looking for reasons to change my mind.`;
}

function generateCommitteePitch(
  text: string,
  intake: FullIntake,
  analysis: Awaited<ReturnType<typeof analyzeEssay>>,
  school: IvySchool
): string {
  if (analysis.overallScore < 70) {
    return `I can't effectively pitch this student yet. The essay doesn't give me a clear "this is the kid who..." angle.`;
  }

  const spike = intake.activities?.spike || '';
  const uniqueElement = analysis.strengths[0]?.element || 'genuine voice';

  return `"This is the student who ${spike ? spike.toLowerCase() : 'shows genuine ' + uniqueElement}. What struck me was ${uniqueElement.toLowerCase()}. They'd bring ${school.shortName === 'Yale' ? 'real creativity and community engagement' : school.shortName === 'Harvard' ? 'intellectual curiosity and leadership' : 'something unique'} to campus."`;
}

function generateSchoolSpecificIssues(
  baseIssues: Awaited<ReturnType<typeof analyzeEssay>>['topIssues'],
  schoolId: string,
  resumeCheck: ResumeEssaySignals,
  leverageAnalysis: LeverageAnalysis
): IvySingleEssayAnalysis['topIssues'] {
  const issues: IvySingleEssayAnalysis['topIssues'] = [];
  const aoPerspective = SCHOOL_AO_PERSPECTIVES[schoolId];

  // Resume essay is always #1 if detected
  if (resumeCheck.isResumeEssay && resumeCheck.confidence !== 'low') {
    issues.push({
      rank: 1,
      issue: 'Essay reads like a resume',
      whyMattersForSchool: `${aoPerspective?.voiceIntro?.split('.')[0] || 'AOs'} already have your activities list. They need to see WHO YOU ARE.`,
      coachingDirection: 'Pick ONE moment from this essay and go 3x deeper on the reflection. Cut the activity listing entirely.',
      aoThought: '"Another resume in prose form. I know what they DID, but I don\'t know who they ARE."',
    });
  }

  // Add base issues with school context
  for (const issue of baseIssues.slice(0, resumeCheck.isResumeEssay ? 2 : 3)) {
    issues.push({
      rank: issues.length + 1,
      issue: issue.issue,
      whyMattersForSchool: issue.impact,
      coachingDirection: issue.howToFix,
      aoThought: `"${issue.dimension === 'insight' ? 'So what?' : 'This needs work.'}"`,
    });
  }

  // Add leverage gap if relevant
  if (leverageAnalysis.leveragePoints.length > 0 && issues.length < 4) {
    const topLeverage = leverageAnalysis.leveragePoints[0];
    issues.push({
      rank: issues.length + 1,
      issue: `Untold story: ${topLeverage.element.slice(0, 50)}...`,
      whyMattersForSchool: 'Your background could strengthen this essay without making it a resume.',
      coachingDirection: topLeverage.weavingAdvice,
      aoThought: '"I sense there\'s more to this student than they\'re showing me."',
    });
  }

  return issues;
}

function findSchoolSpecificIssues(text: string, school: IvySchool): string[] {
  const issues: string[] = [];

  for (const avoid of school.avoidSignals) {
    const avoidLower = avoid.toLowerCase();
    if (text.toLowerCase().includes(avoidLower.slice(0, 20))) {
      issues.push(avoid);
    }
  }

  return issues;
}

function generateHonestAssessment(
  score: number,
  resumeCheck: ResumeEssaySignals,
  soWhatTest: IvySingleEssayAnalysis['soWhatTest'],
  instantRejects: string[],
  school: IvySchool
): string {
  if (instantRejects.length > 0) {
    return `Honest truth: This essay has instant-reject signals that would concern a ${school.shortName} AO. ${instantRejects[0]}. Fix this before submission.`;
  }

  if (resumeCheck.isResumeEssay && resumeCheck.confidence === 'high') {
    return `Honest truth: This reads like a resume in essay form. ${school.shortName} AOs see thousands of these. It won't stand out. You need a fundamental rewrite focused on ONE reflective moment.`;
  }

  if (!soWhatTest.passes) {
    return `Honest truth: This essay tells me what you DID but not who you ARE. A ${school.shortName} AO would finish reading and still not know what makes you unique.`;
  }

  if (score >= 80) {
    return `Honest truth: This is a strong essay that would help your ${school.shortName} application. Minor refinements possible, but the core is solid.`;
  }

  if (score >= 70) {
    return `Honest truth: Good foundation, but not yet memorable. A ${school.shortName} AO would think "solid student" but not advocate strongly in committee.`;
  }

  return `Honest truth: This essay needs significant work before it helps your ${school.shortName} application. The ideas might be there, but the execution isn't.`;
}

function determineOneThingToFix(
  resumeCheck: ResumeEssaySignals,
  soWhatTest: IvySingleEssayAnalysis['soWhatTest'],
  instantRejects: string[],
  issues: IvySingleEssayAnalysis['topIssues']
): string {
  if (resumeCheck.isResumeEssay && resumeCheck.confidence !== 'low') {
    return 'Stop listing activities. Pick ONE moment and reflect deeply on what it taught you about yourself.';
  }

  if (instantRejects.length > 0) {
    return `Remove or rewrite the section with "${instantRejects[0].slice(0, 30)}..."`;
  }

  if (!soWhatTest.passes) {
    return 'Add genuine reflection. After each "I did X," ask yourself "So what? What did I learn about myself?"';
  }

  if (issues.length > 0) {
    return issues[0].coachingDirection;
  }

  return 'Polish the details. The structure is sound - now make every word count.';
}

function extractThemes(text: string): string[] {
  const themes: string[] = [];

  // Simplified theme extraction - production would use NLP
  if (/leadership|led|captain|president/i.test(text)) themes.push('leadership');
  if (/community|service|volunteer|help/i.test(text)) themes.push('community');
  if (/research|experiment|discover|science/i.test(text)) themes.push('intellectual');
  if (/creative|art|music|write|design/i.test(text)) themes.push('creativity');
  if (/challenge|overcome|difficult|struggle/i.test(text)) themes.push('resilience');
  if (/family|home|culture|heritage/i.test(text)) themes.push('identity');
  if (/learn|growth|change|realize/i.test(text)) themes.push('growth');

  return themes;
}

function extractTraits(analysis: IvySingleEssayAnalysis): string[] {
  const traits: string[] = [];

  if (analysis.soWhatTest.passes) traits.push('self-awareness');
  if (analysis.eyesLightUpMoments.length > 0) traits.push('memorable');
  if (analysis.overallScore >= 75) traits.push('strong writing');

  return traits;
}

function extractThemesFromAnalysis(analysis: IvySingleEssayAnalysis): string[] {
  // Extract from strengths and issues
  const themes: string[] = [];

  for (const strength of analysis.strengths) {
    if (strength.element.toLowerCase().includes('voice')) themes.push('authenticity');
    if (strength.element.toLowerCase().includes('reflect')) themes.push('reflection');
    if (strength.element.toLowerCase().includes('specific')) themes.push('specificity');
  }

  return themes;
}
