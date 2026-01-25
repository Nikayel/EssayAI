/**
 * Ivy League School-Specific Prompts
 * Each school has unique culture, values, and what AOs look for
 *
 * DRY Architecture:
 * - Base prompts in ivy-prompts.ts
 * - School-specific overrides and insights here
 * - Composition via buildSchoolSpecificPrompt()
 */

import type { IvySchool, EssayPrompt } from '../data/ivy-league';
import { getIvySchool, IVY_LEAGUE_SCHOOLS } from '../data/ivy-league';
import type { StudentIntake, Activity } from '../scoring/types';

// =============================================================================
// ESSAY REQUIREMENTS BY SCHOOL (2025-26 Cycle)
// =============================================================================

export interface SchoolEssayRequirements {
  schoolId: string;
  totalEssays: number;
  totalWordCount: number;
  requiredEssays: number;
  optionalEssays: number;
  shortAnswers: number;
  hasPortfolio: boolean; // Multiple essays that should be analyzed together
  essayBreakdown: {
    id: string;
    title: string;
    wordLimit: number;
    type: 'required' | 'optional' | 'choose_one' | 'short_answer';
    portfolioWeight: number; // How important this essay is relative to others (1-5)
  }[];
}

export const IVY_ESSAY_REQUIREMENTS: Record<string, SchoolEssayRequirements> = {
  harvard: {
    schoolId: 'harvard',
    totalEssays: 3,
    totalWordCount: 600,
    requiredEssays: 1,
    optionalEssays: 2,
    shortAnswers: 0,
    hasPortfolio: true,
    essayBreakdown: [
      { id: 'harvard-supplement-1', title: 'Diversity & Contribution', wordLimit: 200, type: 'required', portfolioWeight: 5 },
      { id: 'harvard-intellectual', title: 'Intellectual Experience', wordLimit: 200, type: 'optional', portfolioWeight: 4 },
      { id: 'harvard-future', title: 'Activities/Experience', wordLimit: 200, type: 'optional', portfolioWeight: 3 },
    ],
  },
  yale: {
    schoolId: 'yale',
    totalEssays: 4,
    totalWordCount: 760, // 125+125+250+35*3+35
    requiredEssays: 4,
    optionalEssays: 0,
    shortAnswers: 3, // Short takes
    hasPortfolio: true,
    essayBreakdown: [
      { id: 'yale-why', title: 'Why Yale', wordLimit: 125, type: 'required', portfolioWeight: 5 },
      { id: 'yale-contribution', title: 'Residential College Contribution', wordLimit: 125, type: 'required', portfolioWeight: 4 },
      { id: 'yale-engage', title: 'Issue You\'ll Address', wordLimit: 250, type: 'required', portfolioWeight: 5 },
      { id: 'yale-short-takes', title: 'Short Takes (3 prompts)', wordLimit: 35, type: 'short_answer', portfolioWeight: 3 },
    ],
  },
  princeton: {
    schoolId: 'princeton',
    totalEssays: 3,
    totalWordCount: 450, // 150+250+50*3
    requiredEssays: 3,
    optionalEssays: 0,
    shortAnswers: 3, // Voice questions
    hasPortfolio: true,
    essayBreakdown: [
      { id: 'princeton-extracurricular', title: 'Extracurricular Depth', wordLimit: 150, type: 'required', portfolioWeight: 4 },
      { id: 'princeton-community', title: 'Service & Civic Engagement', wordLimit: 250, type: 'required', portfolioWeight: 5 },
      { id: 'princeton-voice', title: 'Voice Questions (3 prompts)', wordLimit: 50, type: 'short_answer', portfolioWeight: 3 },
    ],
  },
  columbia: {
    schoolId: 'columbia',
    totalEssays: 3,
    totalWordCount: 550, // 150+200+200
    requiredEssays: 3,
    optionalEssays: 0,
    shortAnswers: 1, // The list prompt
    hasPortfolio: true,
    essayBreakdown: [
      { id: 'columbia-list', title: 'Community Description List', wordLimit: 150, type: 'required', portfolioWeight: 3 },
      { id: 'columbia-why', title: 'Why Columbia', wordLimit: 200, type: 'required', portfolioWeight: 5 },
      { id: 'columbia-core', title: 'Intellectual Engagement', wordLimit: 200, type: 'required', portfolioWeight: 5 },
    ],
  },
  brown: {
    schoolId: 'brown',
    totalEssays: 3,
    totalWordCount: 600, // 200*3
    requiredEssays: 3,
    optionalEssays: 0,
    shortAnswers: 0,
    hasPortfolio: true,
    essayBreakdown: [
      { id: 'brown-open-curriculum', title: 'Open Curriculum', wordLimit: 200, type: 'required', portfolioWeight: 5 },
      { id: 'brown-community', title: 'Community Contribution', wordLimit: 200, type: 'required', portfolioWeight: 4 },
      { id: 'brown-curious', title: 'Intellectual Curiosity', wordLimit: 200, type: 'required', portfolioWeight: 4 },
    ],
  },
  dartmouth: {
    schoolId: 'dartmouth',
    totalEssays: 2,
    totalWordCount: 500, // 250*2
    requiredEssays: 2,
    optionalEssays: 0,
    shortAnswers: 0,
    hasPortfolio: true,
    essayBreakdown: [
      { id: 'dartmouth-why', title: 'Why Dartmouth', wordLimit: 250, type: 'required', portfolioWeight: 5 },
      { id: 'dartmouth-belonging', title: 'Belonging', wordLimit: 250, type: 'required', portfolioWeight: 5 },
    ],
  },
  cornell: {
    schoolId: 'cornell',
    totalEssays: 1,
    totalWordCount: 650,
    requiredEssays: 1,
    optionalEssays: 0,
    shortAnswers: 0,
    hasPortfolio: false, // Single essay, but college-specific
    essayBreakdown: [
      { id: 'cornell-college', title: 'Why Your College at Cornell', wordLimit: 650, type: 'required', portfolioWeight: 5 },
    ],
  },
  upenn: {
    schoolId: 'upenn',
    totalEssays: 2,
    totalWordCount: 650, // 450+200
    requiredEssays: 2,
    optionalEssays: 0,
    shortAnswers: 0,
    hasPortfolio: true,
    essayBreakdown: [
      { id: 'penn-why', title: 'Why Penn', wordLimit: 450, type: 'required', portfolioWeight: 5 },
      { id: 'penn-community', title: 'Community Contribution', wordLimit: 200, type: 'required', portfolioWeight: 4 },
    ],
  },
};

// =============================================================================
// SCHOOL-SPECIFIC AO PERSPECTIVES
// Written as if by a former AO from each school
// =============================================================================

export interface SchoolAOPerspective {
  schoolId: string;
  voiceIntro: string; // How this AO introduces themselves
  whatIMustSee: string[]; // Non-negotiables
  instantRejects: string[]; // Auto-ding signals
  whatMakesMyEyesLightUp: string[]; // What makes me advocate in committee
  readingMindset: string; // How I approach reading essays
  committeePitch: string; // How I'd pitch a strong applicant
  uniqueToThisSchool: string; // What ONLY this school cares about
}

export const SCHOOL_AO_PERSPECTIVES: Record<string, SchoolAOPerspective> = {
  harvard: {
    schoolId: 'harvard',
    voiceIntro: 'I read 1,200+ applications per cycle at Harvard. I have about 8 minutes per app. Make me remember you.',
    whatIMustSee: [
      'Evidence of genuine intellectual curiosity - not just achievements',
      'Something that makes you distinctly YOU, not "generic high achiever"',
      'How you\'ll contribute to the House community, not just take from Harvard',
      'Self-awareness and reflection, not a resume in prose form',
    ],
    instantRejects: [
      'Essays that read like extended resume bullets',
      '"I\'ve dreamed of Harvard since childhood" without substance',
      'Mentioning prestige, rankings, or name recognition',
      'Generic praise of "world-class faculty" or "amazing opportunities"',
      'Trauma essays that are all pain, no growth',
    ],
    whatMakesMyEyesLightUp: [
      'A student who\'s genuinely weird about something intellectual',
      'Evidence they\'ve already contributed to communities before Harvard',
      'Authentic voice that sounds like a real 17-year-old, not a consultant',
      'A "spike" that shows depth, not breadth of achievements',
    ],
    readingMindset: 'I\'m looking for "citizen-leaders" - people who will change the world AND be good community members. Harvard can give anyone resources; I want students who\'ll use them for others.',
    committeePitch: 'When I advocate for you in committee, I need ONE sentence that captures you. If I can\'t say "this is the kid who..." you won\'t stand out.',
    uniqueToThisSchool: 'Harvard\'s 200-word supplement is brutal. Every word counts. We\'re testing: can you be concise AND compelling? Can you answer "how will you contribute" not just "why do you want Harvard"?',
  },

  yale: {
    schoolId: 'yale',
    voiceIntro: 'At Yale, we build residential communities. I\'m not just admitting students; I\'m choosing future suitemates for 4 years.',
    whatIMustSee: [
      'Understanding of residential college culture (not just dorms)',
      'Creative or artistic interests alongside academics',
      'Genuine personality in the "short takes"',
      'Engagement with issues bigger than yourself',
    ],
    instantRejects: [
      'Treating Yale as a Harvard backup or safety',
      'Not understanding residential colleges at all',
      'Short takes that try too hard to be clever',
      'All academics, no personality or creative interests',
      'Generic "New Haven is cool" without understanding town-gown',
    ],
    whatMakesMyEyesLightUp: [
      'A quirky intellectual who would be fascinating at a dinner table',
      'Evidence of creative expression - theater, music, art, writing',
      'Someone who\'d make residential college life richer',
      'Genuine interest in Yale\'s specific programs, not just prestige',
    ],
    readingMindset: 'I\'m asking: would I want this person in my residential college? Would they sing in a singing group, start a tradition, make the common room more interesting?',
    committeePitch: 'The short takes are my window into your real personality. If they feel calculated or safe, I\'ll assume the rest of your app is too.',
    uniqueToThisSchool: 'Yale\'s residential college system is NOT just dorms. You\'ll eat, study, and live with the same 400 people for 4 years. If you can\'t articulate how you\'d contribute to that community, you haven\'t understood Yale.',
  },

  princeton: {
    schoolId: 'princeton',
    voiceIntro: 'Princeton\'s Honor Code isn\'t just a policy - it defines our culture. I\'m looking for genuine integrity, not performed ethics.',
    whatIMustSee: [
      'Authentic service commitment (not resume-padding volunteering)',
      'Excitement about independent scholarly work (senior thesis)',
      'Genuine reflection, not just accomplishment listing',
      'Understanding of "in the nation\'s service" mission',
    ],
    instantRejects: [
      'Service described like resume bullets ("served 500 meals")',
      'No reflection on WHY service matters to you',
      'Treating Princeton as Harvard-in-New-Jersey',
      'Exaggeration or stretching the truth (Honor Code culture)',
      '"Voice" answers that feel calculated rather than genuine',
    ],
    whatMakesMyEyesLightUp: [
      'A student who serves because they genuinely care, not for college apps',
      'Excitement about writing a 100-page thesis on something nerdy',
      'Honesty about failures and growth',
      'Understanding of Princeton\'s undergraduate-focused model',
    ],
    readingMindset: 'I\'m looking for students who would thrive in an environment of trust and honor. The senior thesis requires self-motivation. The Honor Code requires integrity. Are you that person?',
    committeePitch: 'Princeton is smaller and more intimate than Harvard or Yale. We\'re building a community of scholars who will know each other. Character matters as much as achievement.',
    uniqueToThisSchool: 'The Honor Code means exams are unproctored. You pledge your integrity on every assignment. If anything in your app feels exaggerated, it\'s a fundamental mismatch with Princeton culture.',
  },

  columbia: {
    schoolId: 'columbia',
    voiceIntro: 'At Columbia, the Core Curriculum is sacred. Every student reads the same great books. I\'m looking for students who genuinely want that shared intellectual experience.',
    whatIMustSee: [
      'Genuine engagement with ideas, not just performance',
      'Understanding of Core Curriculum philosophy',
      'How you\'d use NYC as an educational resource (not just fun)',
      'Intellectual range shown in book list',
    ],
    instantRejects: [
      'Book list that\'s all "impressive" books you haven\'t actually read',
      'Focusing on NYC nightlife, food, or social scene',
      'Not mentioning or understanding the Core',
      'Treating Columbia as "backup Ivy in a cool city"',
      'Only valuing Columbia for Morningside Heights location',
    ],
    whatMakesMyEyesLightUp: [
      'A book list that reveals genuine, eclectic intellectual curiosity',
      'Plans to use NYC museums, internships, neighborhoods as learning',
      'Understanding that the Core is about shared experience, not requirement',
      'Engagement with an idea outside schoolwork that shows intellectual passion',
    ],
    readingMindset: 'Columbia is intellectually intense. We discuss Homer in seminars. I\'m looking for students who find that exciting, not students who want to "get through" requirements.',
    committeePitch: 'The Core means you\'ll be in a room discussing Plato with 20 other students. Will you make that discussion better or just sit silently?',
    uniqueToThisSchool: 'The book/reading list isn\'t a test of how "smart" your choices are. It\'s a window into your genuine intellectual life. All philosophy classics or all trendy books both miss the point. Show range AND authenticity.',
  },

  brown: {
    schoolId: 'brown',
    voiceIntro: 'Brown\'s Open Curriculum is real freedom - no required courses. But freedom requires responsibility. I need to see you can handle it.',
    whatIMustSee: [
      'Evidence of self-directed learning ALREADY happening',
      'Understanding of Open Curriculum as opportunity, not escape from requirements',
      'Intellectual risk-taking, not just achievement',
      'Authenticity over polish',
    ],
    instantRejects: [
      '"I want Brown because I hate requirements"',
      'No evidence of self-direction before college',
      'Pure pre-professional focus without intellectual curiosity',
      'Over-polished essays that feel consultant-written',
      'Not understanding that Open Curriculum still requires depth',
    ],
    whatMakesMyEyesLightUp: [
      'A student who already created their own learning path',
      'Intellectual risk-taking - taking hard classes in unfamiliar subjects',
      'Creative interests connected to academics (RISD partnership)',
      'Authenticity that feels almost unpolished but genuine',
    ],
    readingMindset: 'I\'m looking for students who don\'t need requirements to learn. If you need structure to stay motivated, Brown isn\'t for you. If you\'ll thrive with freedom, show me evidence.',
    committeePitch: 'At Brown, you could graduate without taking a single math class. Or you could design your own interdisciplinary major. I\'m admitting students who\'ll use that freedom well.',
    uniqueToThisSchool: 'The Open Curriculum means you MUST show evidence of self-direction. This isn\'t "I\'ll figure it out at Brown." Show me you\'ve already demonstrated this ability.',
  },

  dartmouth: {
    schoolId: 'dartmouth',
    voiceIntro: 'Dartmouth is small, rural, and intense. I\'m looking for students who specifically WANT this, not students who see us as a consolation prize.',
    whatIMustSee: [
      'Genuine enthusiasm for small-town, outdoor culture',
      'Understanding of D-Plan (quarter system)',
      'Interest in tight-knit community',
      'Appreciation for traditions and school spirit',
    ],
    instantRejects: [
      'Treating Dartmouth as backup because it\'s "less selective"',
      'No mention of outdoor culture or DOC',
      'Urban students who clearly want city life',
      'Not understanding D-Plan at all',
      'Seeing small size as limitation rather than feature',
    ],
    whatMakesMyEyesLightUp: [
      'A student genuinely excited about First-Year Trips',
      'Understanding that small = everyone knows everyone',
      'Interest in D-Plan flexibility for study abroad/internships',
      'Appreciation for New Hampshire wilderness',
    ],
    readingMindset: 'Dartmouth is the smallest Ivy by far. We have intense school spirit, outdoor culture, and a rural campus. I\'m looking for students who want THAT specifically.',
    committeePitch: 'First-Year Trips is a week in the wilderness with strangers. 95% of students do it. If that sounds miserable to you, Dartmouth isn\'t your place.',
    uniqueToThisSchool: 'The Dartmouth Outing Club is the oldest college outing club in America. Outdoor culture isn\'t a club here - it\'s central to identity. Essays that ignore this miss who we are.',
  },

  cornell: {
    schoolId: 'cornell',
    voiceIntro: 'Cornell has 7 different colleges with 7 different cultures. I\'m a [specific college] reader. I know my college. Don\'t fake expertise with me.',
    whatIMustSee: [
      'Deep understanding of YOUR specific college, not generic Cornell',
      'Why THIS college, not just "Cornell is great"',
      'Connection to "any person, any study" land-grant mission',
      'Specific programs, courses, or faculty in your college',
    ],
    instantRejects: [
      'Generic Cornell essay that doesn\'t mention your college',
      'Confusing colleges or their purposes',
      'Applying to wrong college for your interests',
      'Not understanding land-grant accessibility mission',
      'Treating Cornell as "easiest Ivy to get into"',
    ],
    whatMakesMyEyesLightUp: [
      'A student who deeply understands why Hotel School is different from Wharton',
      'Evidence of real research into college-specific programs',
      'Connection to "any person, any study" philosophy',
      'Understanding of Ithaca\'s isolation as feature, not bug',
    ],
    readingMindset: 'I read for ONE college. When I see a generic "Cornell is prestigious" essay, I know you didn\'t do your research. Each college has its own culture and mission.',
    committeePitch: 'Cornell\'s 7 colleges are genuinely different. ILR is labor relations. Hotel is hospitality. CALS is agriculture. If your essay could work for multiple colleges, it doesn\'t work for any.',
    uniqueToThisSchool: 'The 650-word essay is ENTIRELY about your specific college. Not Cornell generally. Not the Ivy League. Your college. If you can\'t write 650 words specifically about Engineering or Hotel or Arts & Sciences, you haven\'t done the work.',
  },

  upenn: {
    schoolId: 'upenn',
    voiceIntro: 'Penn is proudly pre-professional. We value impact and action. I\'m looking for students who want to DO things in the world, not just study them.',
    whatIMustSee: [
      'Understanding of YOUR specific school (College, Wharton, Engineering, Nursing)',
      'Excitement about cross-school "One University" opportunities',
      'Entrepreneurial or impact-oriented mindset',
      'West Philadelphia civic engagement awareness',
    ],
    instantRejects: [
      'Only caring about Wharton prestige',
      'Confusing Penn schools or applying to wrong one',
      'No cross-school interests (missing "One University")',
      'Pure academic focus without real-world application',
      'Ignoring Philadelphia community engagement entirely',
    ],
    whatMakesMyEyesLightUp: [
      'A student who\'d combine Wharton + Engineering, or College + Nursing',
      'Evidence of entrepreneurial or startup interests',
      'Understanding of West Philly partnership programs',
      'Action-oriented students who want to make things happen',
    ],
    readingMindset: 'Penn is where you come to DO things. Wharton students start companies. Engineering students build things. I\'m looking for doers, not just learners.',
    committeePitch: '"One University" is real - you can take Wharton classes as an Engineering student. But you have to show you understand BOTH your school AND how you\'d cross over.',
    uniqueToThisSchool: 'Penn is the most pre-professional Ivy, and we\'re proud of it. If you want pure academic exploration, go to Brown. If you want to build, create, and impact - show me you understand Penn\'s culture.',
  },
};

// =============================================================================
// RESUME-ESSAY DETECTION
// Critical: Essays should reveal character, not list achievements
// =============================================================================

export interface ResumeEssaySignals {
  isResumeEssay: boolean;
  confidence: 'low' | 'medium' | 'high';
  signals: ResumeSignal[];
  recommendation: string;
}

interface ResumeSignal {
  type: 'listing' | 'metrics_heavy' | 'chronological' | 'activity_parade' | 'no_reflection';
  evidence: string;
  location?: string;
  severity: 'warning' | 'critical';
}

export const RESUME_ESSAY_PATTERNS = {
  // Listing activities without reflection
  activityListing: [
    /(?:i (?:also )?(?:served as|was|became|am) (?:the |a )?(?:president|captain|leader|founder|member|volunteer))/gi,
    /(?:in addition|additionally|i also|moreover|furthermore|besides this)/gi,
    /(?:another (?:activity|experience|role|position))/gi,
  ],

  // Metrics without meaning
  metricsWithoutMeaning: [
    /(?:raised|collected|donated|served|helped|impacted) (?:\$?[\d,]+(?:\+)?\s*(?:dollars?|meals?|hours?|people|students|families))/gi,
    /(?:for|over|during) (?:the past |)(\d+)\s*(?:years?|months?|weeks?|hours?)/gi,
    /(?:led|managed|supervised|oversaw) (?:a team of |)(\d+)\s*(?:people|members|students|volunteers)/gi,
  ],

  // Chronological activity parade
  chronological: [
    /(?:in (?:my )?(?:freshman|sophomore|junior|senior) year)/gi,
    /(?:(?:when|since) i was (?:in |)(?:\d+|young|a child))/gi,
    /(?:started|began|joined) in (?:\d{4}|grade \d+|(?:freshman|sophomore|junior|senior) year)/gi,
  ],

  // Missing reflection indicators
  noReflection: [
    // High action-to-reflection ratio
    /(?:i (?:did|made|created|built|organized|planned|executed|implemented|developed|launched))/gi,
  ],

  // Reflection indicators (positive - essay is NOT just a resume)
  hasReflection: [
    /(?:i (?:realized|learned|understood|discovered|recognized|felt|thought|wondered))/gi,
    /(?:this (?:taught|showed|made|helped) me)/gi,
    /(?:looking back|in retrospect|reflecting on)/gi,
    /(?:what (?:i|this) (?:really )?(?:meant|means|mattered|matters))/gi,
    /(?:the (?:moment|time|experience) (?:that )?changed)/gi,
  ],
};

export function detectResumeEssay(essayText: string): ResumeEssaySignals {
  const signals: ResumeSignal[] = [];
  const textLower = essayText.toLowerCase();

  // Check activity listing patterns
  for (const pattern of RESUME_ESSAY_PATTERNS.activityListing) {
    const matches = essayText.match(pattern);
    if (matches && matches.length >= 2) {
      signals.push({
        type: 'activity_parade',
        evidence: `Found ${matches.length} instances of activity-listing language: "${matches.slice(0, 2).join('", "')}"`,
        severity: matches.length >= 3 ? 'critical' : 'warning',
      });
    }
  }

  // Check metrics without meaning
  let metricsCount = 0;
  for (const pattern of RESUME_ESSAY_PATTERNS.metricsWithoutMeaning) {
    const matches = essayText.match(pattern);
    if (matches) {
      metricsCount += matches.length;
    }
  }
  if (metricsCount >= 3) {
    signals.push({
      type: 'metrics_heavy',
      evidence: `Essay contains ${metricsCount} metrics/numbers without explaining why they matter`,
      severity: metricsCount >= 5 ? 'critical' : 'warning',
    });
  }

  // Check chronological structure
  let chronoCount = 0;
  for (const pattern of RESUME_ESSAY_PATTERNS.chronological) {
    const matches = essayText.match(pattern);
    if (matches) {
      chronoCount += matches.length;
    }
  }
  if (chronoCount >= 2) {
    signals.push({
      type: 'chronological',
      evidence: 'Essay follows a chronological activity timeline rather than thematic depth',
      severity: 'warning',
    });
  }

  // Check reflection ratio
  let actionCount = 0;
  let reflectionCount = 0;

  for (const pattern of RESUME_ESSAY_PATTERNS.noReflection) {
    const matches = essayText.match(pattern);
    if (matches) actionCount += matches.length;
  }

  for (const pattern of RESUME_ESSAY_PATTERNS.hasReflection) {
    const matches = essayText.match(pattern);
    if (matches) reflectionCount += matches.length;
  }

  const reflectionRatio = actionCount > 0 ? reflectionCount / actionCount : 1;
  if (reflectionRatio < 0.3 && actionCount >= 3) {
    signals.push({
      type: 'no_reflection',
      evidence: `High action-to-reflection ratio (${actionCount} actions, only ${reflectionCount} reflections). Essay tells what you DID, not who you BECAME.`,
      severity: reflectionRatio < 0.15 ? 'critical' : 'warning',
    });
  }

  // Determine overall assessment
  const criticalCount = signals.filter(s => s.severity === 'critical').length;
  const warningCount = signals.filter(s => s.severity === 'warning').length;

  let isResumeEssay = false;
  let confidence: 'low' | 'medium' | 'high' = 'low';

  if (criticalCount >= 2 || (criticalCount >= 1 && warningCount >= 2)) {
    isResumeEssay = true;
    confidence = 'high';
  } else if (criticalCount >= 1 || warningCount >= 3) {
    isResumeEssay = true;
    confidence = 'medium';
  } else if (warningCount >= 2) {
    isResumeEssay = true;
    confidence = 'low';
  }

  let recommendation: string;
  if (isResumeEssay && confidence === 'high') {
    recommendation = 'CRITICAL: This essay reads like a resume in prose form. AOs already have your activities list - they want to know WHO YOU ARE, not WHAT YOU DID. Pick ONE moment and go deep on the reflection.';
  } else if (isResumeEssay && confidence === 'medium') {
    recommendation = 'WARNING: This essay leans toward listing achievements. Remember: AOs want insight into your character, not a summary of activities. Add more reflection on WHY experiences mattered.';
  } else if (isResumeEssay) {
    recommendation = 'SUGGESTION: Consider deepening the reflection. You mention what you did - now explain what it meant and how it changed you.';
  } else {
    recommendation = 'Good: This essay focuses on reflection and insight rather than activity listing.';
  }

  return {
    isResumeEssay,
    confidence,
    signals,
    recommendation,
  };
}

// =============================================================================
// LEVERAGE POINTS - How to weave activities/research into essays
// =============================================================================

export interface LeveragePoint {
  source: 'activity' | 'research' | 'work' | 'spike' | 'challenge' | 'identity';
  element: string;
  currentMention: 'not_mentioned' | 'mentioned_surface' | 'mentioned_deep';
  weavingAdvice: string;
  exampleIntegration: string;
  warning: string; // What NOT to do
}

export interface LeverageAnalysis {
  leveragePoints: LeveragePoint[];
  untoldStories: string[];
  narrativeGaps: string[];
  overallAdvice: string;
}

/**
 * Analyze what student context could strengthen the essay
 * WITHOUT turning it into a resume
 */
export function analyzeLeveragePoints(
  essayText: string,
  intake: StudentIntake | null | undefined
): LeverageAnalysis {
  const leveragePoints: LeveragePoint[] = [];
  const untoldStories: string[] = [];
  const narrativeGaps: string[] = [];

  // Early return if no intake data
  if (!intake) {
    return {
      leveragePoints: [],
      untoldStories: [],
      narrativeGaps: [],
      overallAdvice: 'No background information provided. Consider adding intake data for personalized leverage analysis.',
    };
  }

  const textLower = essayText.toLowerCase();

  // Check spike/main narrative
  const spike = intake.activities?.spike;
  if (spike) {
    const spikeWords = spike.toLowerCase().split(' ').filter(w => w.length > 4);
    const spikeMentioned = spikeWords.some(w => textLower.includes(w));

    if (!spikeMentioned) {
      leveragePoints.push({
        source: 'spike',
        element: spike,
        currentMention: 'not_mentioned',
        weavingAdvice: `Your spike is "${spike}" but this essay doesn't connect to that narrative. Consider: how did a moment in this essay connect to or influence your main passion?`,
        exampleIntegration: 'Don\'t add your spike activities. Instead, show how the THINKING or VALUES from this essay connect to your broader narrative.',
        warning: 'DON\'T just mention your spike. SHOW how the essay\'s theme connects to it thematically.',
      });
      untoldStories.push(`Connection between this essay and your spike ("${spike}")`);
    }
  }

  // Check research experience
  const research = intake.academic?.researchExperience;
  if (research?.hasExperience && research.description) {
    const researchKeywords = research.description.toLowerCase().split(' ').filter(w => w.length > 4);
    const researchMentioned = researchKeywords.slice(0, 5).some(w => textLower.includes(w));

    if (!researchMentioned) {
      leveragePoints.push({
        source: 'research',
        element: research.description,
        currentMention: 'not_mentioned',
        weavingAdvice: 'You have research experience but didn\'t mention it. If relevant, share a specific MOMENT of discovery or failure - not a description of your research.',
        exampleIntegration: 'Instead of "I researched X at Y lab," try: "The afternoon I realized my hypothesis was completely wrong was the afternoon I fell in love with science."',
        warning: 'DON\'T describe your research process. DO share a moment that changed how you think.',
      });
    }
  }

  // Check top activities
  const topActivities = intake.activities?.topActivities;
  if (topActivities && topActivities.length > 0) {
    const topActivity = topActivities[0];
    if (topActivity?.name && topActivity?.role) {
      const activityMentioned = textLower.includes(topActivity.name.toLowerCase()) ||
                               textLower.includes(topActivity.role.toLowerCase());

      if (!activityMentioned && topActivity.impact) {
        leveragePoints.push({
          source: 'activity',
          element: `${topActivity.name} (${topActivity.role})`,
          currentMention: 'not_mentioned',
          weavingAdvice: `Your top activity (${topActivity.name}) isn't mentioned. IF it connects to this essay's theme, consider: what moment from this activity shaped the person you're describing in this essay?`,
          exampleIntegration: 'Don\'t add the activity itself. Ask: "Is there a moment from this activity that illustrates who I became?"',
          warning: 'Only add if genuinely relevant. Forced connections weaken essays.',
        });
      }
    }
  }

  // Check challenges/background
  const challenges = intake.personal?.significantChallenges;
  if (challenges) {
    const challengeWords = challenges.toLowerCase().split(' ').filter(w => w.length > 4);
    const challengeMentioned = challengeWords.slice(0, 5).some(w => textLower.includes(w));

    if (!challengeMentioned) {
      untoldStories.push('The challenges you\'ve overcome and how they shaped your perspective');
      narrativeGaps.push('AOs want context. If challenges affected your journey, consider whether adding context strengthens this essay.');
    }
  }

  // Check family responsibilities
  const familyResp = intake.demographics?.familyResponsibilities;
  if (familyResp && familyResp.length > 0 && !familyResp.includes('none')) {
    const hasFamilyContext = textLower.includes('family') ||
                            textLower.includes('sibling') ||
                            textLower.includes('parent') ||
                            textLower.includes('work');

    if (!hasFamilyContext) {
      leveragePoints.push({
        source: 'challenge',
        element: `Family responsibilities: ${familyResp.join(', ')}`,
        currentMention: 'not_mentioned',
        weavingAdvice: 'You have family responsibilities that affect your time. If relevant, this context helps AOs understand your commitments.',
        exampleIntegration: 'A brief mention that shows maturity: "Between work shifts and helping at home, I found moments to..."',
        warning: 'Don\'t make this the focus unless it\'s central to your essay. Just provide context if helpful.',
      });
    }
  }

  // Check intellectual passion
  const passion = intake.academic?.intellectualPassion;
  if (passion) {
    const passionWords = passion.toLowerCase().split(' ').filter(w => w.length > 4);
    const passionMentioned = passionWords.slice(0, 3).some(w => textLower.includes(w));

    if (!passionMentioned) {
      untoldStories.push(`Your intellectual passion ("${passion.slice(0, 50)}...") and how it connects to this essay`);
    }
  }

  // Generate overall advice
  let overallAdvice: string;
  if (leveragePoints.length === 0 && untoldStories.length === 0) {
    overallAdvice = 'Good news: This essay uses your background well. The key elements of your story are represented.';
  } else if (leveragePoints.length >= 3) {
    overallAdvice = `There are ${leveragePoints.length} elements from your background that COULD strengthen this essay - but be careful. Only add what genuinely connects to your essay's theme. Forced additions weaken essays.`;
  } else {
    overallAdvice = `Consider these potential leverage points, but only if they naturally connect to your essay's theme. The goal is depth on ONE story, not breadth across many.`;
  }

  return {
    leveragePoints,
    untoldStories,
    narrativeGaps,
    overallAdvice,
  };
}

// =============================================================================
// PORTFOLIO ANALYSIS - Multi-essay coherence for schools with multiple prompts
// =============================================================================

export interface PortfolioAnalysis {
  school: string;
  essaysAnalyzed: number;
  coherenceScore: number; // 0-100
  themes: {
    theme: string;
    essaysWithTheme: string[];
    overrepresented: boolean;
  }[];
  characterTraits: {
    trait: string;
    demonstratedIn: string[];
    missing: boolean;
  }[];
  voiceConsistency: {
    consistent: boolean;
    issues: string[];
  };
  strategicGaps: string[];
  redundancies: string[];
  recommendations: string[];
}

export interface EssayForPortfolio {
  promptId: string;
  promptTitle: string;
  essayText: string;
  themes: string[];
  traitsShown: string[];
}

/**
 * Analyze multiple essays for the same school as a portfolio
 */
export function analyzePortfolio(
  schoolId: string,
  essays: EssayForPortfolio[]
): PortfolioAnalysis {
  const school = getIvySchool(schoolId);
  if (!school) {
    throw new Error(`Unknown school: ${schoolId}`);
  }

  // Track themes across essays
  const themeCount: Record<string, string[]> = {};
  for (const essay of essays) {
    for (const theme of essay.themes) {
      if (!themeCount[theme]) themeCount[theme] = [];
      themeCount[theme].push(essay.promptTitle);
    }
  }

  const themes = Object.entries(themeCount).map(([theme, essaysWithTheme]) => ({
    theme,
    essaysWithTheme,
    overrepresented: essaysWithTheme.length > essays.length / 2,
  }));

  // Track character traits
  const desiredTraits = [
    'intellectual curiosity',
    'leadership',
    'resilience',
    'creativity',
    'community contribution',
    'self-awareness',
    'vulnerability',
    'growth mindset',
  ];

  const traitCount: Record<string, string[]> = {};
  for (const essay of essays) {
    for (const trait of essay.traitsShown) {
      if (!traitCount[trait]) traitCount[trait] = [];
      traitCount[trait].push(essay.promptTitle);
    }
  }

  const characterTraits = desiredTraits.map(trait => ({
    trait,
    demonstratedIn: traitCount[trait] || [],
    missing: !traitCount[trait] || traitCount[trait].length === 0,
  }));

  // Check voice consistency (simplified - real implementation would use embeddings)
  const voiceIssues: string[] = [];
  // In real implementation, compare tone/style across essays

  // Find strategic gaps
  const strategicGaps: string[] = [];
  const missingTraits = characterTraits.filter(t => t.missing);
  if (missingTraits.length > 0) {
    strategicGaps.push(`Essays don't demonstrate: ${missingTraits.map(t => t.trait).join(', ')}`);
  }

  // Find redundancies
  const redundancies: string[] = [];
  const overrepThemes = themes.filter(t => t.overrepresented);
  for (const theme of overrepThemes) {
    redundancies.push(`"${theme.theme}" appears in ${theme.essaysWithTheme.length}/${essays.length} essays - consider varying themes`);
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (redundancies.length > 0) {
    recommendations.push('Diversify your essay themes. Each essay should reveal a DIFFERENT facet of who you are.');
  }

  if (missingTraits.length >= 3) {
    recommendations.push(`Consider showing more: ${missingTraits.slice(0, 3).map(t => t.trait).join(', ')}`);
  }

  // Add school-specific portfolio advice
  const requirements = IVY_ESSAY_REQUIREMENTS[schoolId];
  if (requirements?.hasPortfolio) {
    recommendations.push(`${school.shortName} reads all ${requirements.totalEssays} essays together. Make sure they tell a COMPLETE picture of you, not the same story ${requirements.totalEssays} times.`);
  }

  // Calculate coherence score
  const themeVariety = themes.filter(t => !t.overrepresented).length / Math.max(themes.length, 1);
  const traitCoverage = characterTraits.filter(t => !t.missing).length / characterTraits.length;
  const coherenceScore = Math.round(((themeVariety + traitCoverage) / 2) * 100);

  return {
    school: school.name,
    essaysAnalyzed: essays.length,
    coherenceScore,
    themes,
    characterTraits,
    voiceConsistency: {
      consistent: voiceIssues.length === 0,
      issues: voiceIssues,
    },
    strategicGaps,
    redundancies,
    recommendations,
  };
}

// =============================================================================
// BUILD COMPLETE SCHOOL-SPECIFIC PROMPT
// Composition of base + school-specific + resume detection + leverage
// =============================================================================

interface SchoolSpecificPromptParams {
  schoolId: string;
  essayText: string;
  essayPromptId: string;
  intake: StudentIntake;
  includePortfolioContext?: boolean;
  portfolioEssays?: EssayForPortfolio[];
}

export function buildSchoolSpecificAnalysisPrompt(params: SchoolSpecificPromptParams): string {
  const school = getIvySchool(params.schoolId);
  const aoPerspective = SCHOOL_AO_PERSPECTIVES[params.schoolId];
  const requirements = IVY_ESSAY_REQUIREMENTS[params.schoolId];

  if (!school || !aoPerspective) {
    throw new Error(`Unknown school: ${params.schoolId}`);
  }

  // Find specific prompt being analyzed
  const essayPrompt = school.essayPrompts.find(p => p.id === params.essayPromptId);
  const promptContext = essayPrompt
    ? `SPECIFIC PROMPT: "${essayPrompt.prompt}" (${essayPrompt.wordLimit} words)
COMMON MISTAKES FOR THIS PROMPT: ${essayPrompt.commonMistakes.join('; ')}
TIPS: ${essayPrompt.tips.join('; ')}`
    : '';

  // Build the prompt
  return `=== ${school.name.toUpperCase()} ESSAY ANALYSIS ===
Version: 2.1.0

${aoPerspective.voiceIntro}

SCHOOL CONTEXT:
- Acceptance Rate: ${school.acceptanceRate}%
- Essay Requirements: ${requirements?.totalEssays || 'varies'} essays, ${requirements?.totalWordCount || 'varies'} total words
- Mission: "${school.mission}"
- What makes ${school.shortName} different: ${school.whatMakesThisSchoolDifferent}
- Student body character: ${school.studentBodyCharacter}

${promptContext}

=== MY READING MINDSET AS A ${school.shortName.toUpperCase()} AO ===
${aoPerspective.readingMindset}

WHAT I MUST SEE:
${aoPerspective.whatIMustSee.map(s => `• ${s}`).join('\n')}

INSTANT REJECT SIGNALS:
${aoPerspective.instantRejects.map(s => `• ${s}`).join('\n')}

WHAT MAKES MY EYES LIGHT UP:
${aoPerspective.whatMakesMyEyesLightUp.map(s => `• ${s}`).join('\n')}

HOW I'D PITCH A STRONG APPLICANT IN COMMITTEE:
"${aoPerspective.committeePitch}"

WHAT'S UNIQUE TO ${school.shortName.toUpperCase()}:
${aoPerspective.uniqueToThisSchool}

=== CRITICAL: RESUME-ESSAY DETECTION ===
FIRST, check if this essay reads like a resume in prose form:
- Does it LIST activities rather than REFLECT on experiences?
- Are there metrics (hours, people served, money raised) without meaning?
- Does it follow a chronological "in freshman year... in sophomore year..." structure?
- Is there a high action-to-reflection ratio?

If this is a resume-essay, flag it as CRITICAL. AOs already have the activities list. They want to know WHO this person IS, not WHAT they DID.

=== ESSAY TO ANALYZE ===
"""
${params.essayText}
"""

=== STUDENT CONTEXT (use for leverage analysis, not to excuse weak writing) ===
- Spike/Main Narrative: ${params.intake.activities?.spike || 'Not provided'}
- Top Activity: ${params.intake.activities?.topActivities?.[0]?.name || 'Not provided'}
- Research Experience: ${params.intake.academic?.researchExperience?.hasExperience ? 'Yes' : 'No'}
- First-Gen: ${params.intake.demographics?.isFirstGen ? 'Yes' : 'No'}
- Family Responsibilities: ${params.intake.demographics?.familyResponsibilities?.join(', ') || 'None specified'}

=== REQUIRED OUTPUT (JSON) ===
{
  "meta": {
    "school": "${params.schoolId}",
    "prompt_id": "${params.essayPromptId}",
    "word_count": <count>,
    "analysis_version": "2.1.0"
  },

  "resume_essay_check": {
    "is_resume_essay": true/false,
    "confidence": "low|medium|high",
    "signals": ["<specific evidence>"],
    "recommendation": "<what to do about it>"
  },

  "school_specific_analysis": {
    "ao_first_impression": "<what a ${school.shortName} AO thinks in first 30 seconds>",
    "meets_must_see": [{"requirement": "", "met": true/false, "evidence": ""}],
    "instant_reject_signals": ["<any matched>"],
    "eyes_light_up_moments": ["<if any>"],
    "committee_pitch_ready": true/false,
    "committee_pitch_attempt": "<how I'd try to pitch this student>",
    "unique_to_${params.schoolId}_issues": ["<school-specific problems>"]
  },

  "leverage_analysis": {
    "untold_stories": ["<elements from intake that could strengthen essay>"],
    "weaving_suggestions": [
      {"element": "", "advice": "", "warning": ""}
    ],
    "overall": "<summary advice on using background without making it a resume>"
  },

  "scores": {
    "authenticity": {"score": 0-6, "rationale": "", "${params.schoolId}_specific": ""},
    "school_fit": {"score": 0-6, "rationale": "", "specific_references": []},
    "reflection": {"score": 0-6, "rationale": ""},
    "specificity": {"score": 0-6, "rationale": ""},
    "structure": {"score": 0-6, "rationale": ""},
    "mechanics": {"score": 0-6, "rationale": ""}
  },

  "so_what_test": {
    "passes": true/false,
    "what_we_learn": "<what this reveals about the student>",
    "what_we_dont_learn": "<what's missing>",
    "memorable_after_reading_100_essays": true/false
  },

  "top_issues": [
    {
      "rank": 1,
      "issue": "",
      "why_matters_for_${params.schoolId}": "",
      "coaching_direction": "",
      "ao_thought": ""
    }
  ],

  "strengths": [
    {"element": "", "why_works": "", "keep_this": true}
  ],

  "overall": {
    "score_100": <number>,
    "would_help_or_hurt": "help|neutral|hurt",
    "honest_assessment": "<straight talk about this essay's chances at ${school.shortName}>",
    "one_thing_to_fix": "<if they fix ONE thing, it should be this>"
  }
}`;
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  getIvySchool,
  IVY_LEAGUE_SCHOOLS,
};
