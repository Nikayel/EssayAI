/**
 * School Fit & Alignment Scorer (Dimension 3)
 * 20 points total - Does this essay prove they researched THIS specific school?
 */

import type { SchoolFitScore, StudentIntake } from '../types';
import { getSchoolConfig, detectSchoolKeywords } from '../school-configs';
import { findPatternSpans } from '../text-utils';

// =============================================================================
// MAIN SCORER
// =============================================================================

export async function scoreSchoolFit(
  essayText: string,
  intake: StudentIntake
): Promise<SchoolFitScore> {
  const schoolId = intake.essayContext?.targetSchool?.toLowerCase() || '';
  const config = getSchoolConfig(schoolId);

  // If no school specified or not an Ivy, return neutral scores
  if (!config) {
    return createNeutralScore('No target school specified or school not in our database.');
  }

  const [
    specificProgramKnowledge,
    valueAlignment,
    cultureFitSignals,
    whyNotElsewhere,
    futureContribution,
  ] = await Promise.all([
    scoreSpecificProgramKnowledge(essayText, config),
    scoreValueAlignment(essayText, config),
    scoreCultureFitSignals(essayText, config),
    scoreWhyNotElsewhere(essayText, config),
    scoreFutureContribution(essayText, config),
  ]);

  const totalScore =
    specificProgramKnowledge.score +
    valueAlignment.score +
    cultureFitSignals.score +
    whyNotElsewhere.score +
    futureContribution.score;

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    specificProgramKnowledge,
    valueAlignment,
    cultureFitSignals,
    whyNotElsewhere,
    futureContribution,
  };
}

function createNeutralScore(feedback: string): SchoolFitScore {
  const neutralSub = {
    score: 2,
    feedback,
  };

  return {
    totalScore: 10,
    specificProgramKnowledge: { ...neutralSub, programsMentioned: [], correctReferences: false },
    valueAlignment: { ...neutralSub, alignedValues: [], missingValues: [] },
    cultureFitSignals: { ...neutralSub, cultureReferences: [], authenticSignals: false },
    whyNotElsewhere: { ...neutralSub, uniqueToSchool: false, couldWorkForOther: [] },
    futureContribution: { ...neutralSub, contributionsPlanned: [], specificEnough: false },
  };
}

// =============================================================================
// SUB-CRITERION 3.1: SPECIFIC PROGRAM KNOWLEDGE (0-4)
// =============================================================================

interface SchoolConfig {
  id: string;
  name: string;
  cultureKeywords: string[];
  valueKeywords: string[];
  mustMention: string[];
  redFlags: string[];
  boostFor: string[];
  penalizeFor: string[];
}

async function scoreSpecificProgramKnowledge(
  essayText: string,
  config: SchoolConfig
): Promise<SchoolFitScore['specificProgramKnowledge']> {
  const textLower = essayText.toLowerCase();
  const programsMentioned: string[] = [];

  // Check for culture/program keywords
  for (const keyword of config.cultureKeywords) {
    if (textLower.includes(keyword.toLowerCase())) {
      programsMentioned.push(keyword);
    }
  }

  // Check for specific patterns by school
  const schoolSpecificPatterns = getSchoolSpecificPatterns(config.id);
  for (const pattern of schoolSpecificPatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      if (match) programsMentioned.push(match[0]);
    }
  }

  // Calculate score
  let score = 0;
  const uniquePrograms = [...new Set(programsMentioned)];

  if (uniquePrograms.length >= 3) score = 4;
  else if (uniquePrograms.length >= 2) score = 3;
  else if (uniquePrograms.length >= 1) score = 2;
  else score = 0.5;

  // Check if references are correct (not generic)
  const genericReferences = [
    'great program', 'amazing professors', 'excellent education',
    'top-ranked', 'prestigious', 'best school',
  ];

  const hasGeneric = genericReferences.some(g => textLower.includes(g));
  const correctReferences = uniquePrograms.length > 0 && !hasGeneric;

  if (hasGeneric) score = Math.max(0, score - 1);

  let feedback = `Found ${uniquePrograms.length} specific ${config.name} reference(s).`;

  if (score >= 3.5) {
    feedback = `Excellent! You demonstrate deep knowledge of ${config.name}'s specific offerings.`;
  } else if (score >= 2) {
    feedback = `Good start. Add more specific ${config.name} programs, courses, or professors.`;
  } else {
    feedback = `Add specific ${config.name} references. Mention courses, programs, or professors by name.`;
  }

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    programsMentioned: uniquePrograms.slice(0, 10),
    correctReferences,
    feedback,
  };
}

function getSchoolSpecificPatterns(schoolId: string): RegExp[] {
  const patterns: Record<string, RegExp[]> = {
    harvard: [
      /\b(?:Gen Ed|General Education|Freshman Seminar|House System|Pforzheimer|Quincy|Adams|Lowell|Leverett|Winthrop|Mather|Dunster|Eliot|Kirkland|Cabot|Currier)\b/i,
      /\b(?:PRISE|Radcliffe|Harvard Innovation Labs?|i-lab)\b/i,
      /\b(?:Q Guide|Veritas)\b/i,
    ],
    yale: [
      /\b(?:Directed Studies|residential college|Silliman|Timothy Dwight|Benjamin Franklin|Pauli Murray|Jonathan Edwards|Branford|Saybrook|Davenport|Pierson|Morse|Stiles|Ezra Stiles|Trumbull|Berkeley|Grace Hopper)\b/i,
      /\b(?:Whiffenpoofs?|Yale Daily News|Dwight Hall)\b/i,
      /\b(?:Lux et Veritas|New Haven)\b/i,
    ],
    princeton: [
      /\b(?:senior thesis|junior paper|JP|precept|honor code|eating club|residential college|Butler|Mathey|Rocky|Rockefeller|Whitman|Forbes|First)\b/i,
      /\b(?:Bridge Year|Princeton Prizes|service|in the nation'?s service)\b/i,
    ],
    columbia: [
      /\b(?:Core Curriculum|Contemporary Civilization|CC|Literature Humanities|Lit Hum|Art Humanities|Frontiers of Science|University Writing)\b/i,
      /\b(?:Morningside Heights|Columbia Spectator)\b/i,
    ],
    brown: [
      /\b(?:Open Curriculum|RISD|Brown-RISD|independent concentration|shopping period|Swearer Center|S\/NC)\b/i,
    ],
    dartmouth: [
      /\b(?:D-Plan|quarter system|DOC|Dartmouth Outing Club|First-Year Trips?|Green Key|Winter Carnival|Hanover|Tucker Foundation|Hopkins Center|the Green)\b/i,
    ],
    cornell: [
      /\b(?:any person,? any study|College of (?:Arts and Sciences|Engineering|Agriculture|Human Ecology|Architecture)|CALS|ILR|Hotel School|SHA|AAP|project team)\b/i,
      /\b(?:Ithaca|gorges?)\b/i,
    ],
    upenn: [
      /\b(?:One University|Wharton|College of Arts and Sciences|School of Engineering|Nursing|Huntsman|Jerome Fisher|M&T|Civic House|West Philly|West Philadelphia)\b/i,
    ],
  };

  return patterns[schoolId] || [];
}

// =============================================================================
// SUB-CRITERION 3.2: VALUE ALIGNMENT (0-4)
// =============================================================================

async function scoreValueAlignment(
  essayText: string,
  config: SchoolConfig
): Promise<SchoolFitScore['valueAlignment']> {
  const textLower = essayText.toLowerCase();
  const alignedValues: string[] = [];
  const missingValues: string[] = [];

  // Check for value keywords
  for (const value of config.valueKeywords) {
    if (textLower.includes(value.toLowerCase())) {
      alignedValues.push(value);
    } else {
      missingValues.push(value);
    }
  }

  // Check for boost/penalize patterns
  let hasBoostPattern = false;
  let hasPenalizePattern = false;

  for (const boost of config.boostFor) {
    const boostWords = boost.split('_');
    if (boostWords.some(w => textLower.includes(w))) {
      hasBoostPattern = true;
      break;
    }
  }

  for (const penalize of config.penalizeFor) {
    const penalizeWords = penalize.split('_');
    if (penalizeWords.every(w => textLower.includes(w))) {
      hasPenalizePattern = true;
      break;
    }
  }

  // Calculate score
  let score = 1;

  const alignmentRatio = config.valueKeywords.length > 0
    ? alignedValues.length / config.valueKeywords.length
    : 0;

  if (alignmentRatio >= 0.4) score = 3;
  else if (alignmentRatio >= 0.2) score = 2;
  else score = 1;

  if (hasBoostPattern) score += 0.5;
  if (hasPenalizePattern) score -= 1;

  let feedback = 'Some value alignment detected.';

  if (score >= 3.5) {
    feedback = `Strong alignment with ${config.name}'s core values.`;
  } else if (score >= 2) {
    feedback = `Partial alignment. Emphasize ${config.name}'s values: ${missingValues.slice(0, 3).join(', ')}.`;
  } else {
    feedback = `Limited value alignment. ${config.name} cares about: ${config.valueKeywords.slice(0, 4).join(', ')}.`;
  }

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    alignedValues: alignedValues.slice(0, 10),
    missingValues: missingValues.slice(0, 5),
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 3.3: CULTURE FIT SIGNALS (0-4)
// =============================================================================

async function scoreCultureFitSignals(
  essayText: string,
  config: SchoolConfig
): Promise<SchoolFitScore['cultureFitSignals']> {
  const textLower = essayText.toLowerCase();
  const cultureReferences: string[] = [];

  // Check culture keywords
  for (const keyword of config.cultureKeywords) {
    if (textLower.includes(keyword.toLowerCase())) {
      cultureReferences.push(keyword);
    }
  }

  // Check for authentic signals (not just name-dropping)
  const authenticPatterns = [
    /I (?:would|want to|hope to|plan to|am excited to) (?:join|participate|engage|contribute)/i,
    /(?:specifically|particularly) (?:interests?|excites?|appeals?)/i,
    /I (?:see myself|imagine myself|picture myself)/i,
  ];

  const authenticSignals = authenticPatterns.some(p => p.test(essayText));

  // Check for red flags
  const hasRedFlags = config.redFlags.some(rf => textLower.includes(rf.toLowerCase()));

  // Calculate score
  let score = 1;

  if (cultureReferences.length >= 3) score = 3;
  else if (cultureReferences.length >= 2) score = 2;
  else if (cultureReferences.length >= 1) score = 1.5;

  if (authenticSignals) score += 0.5;
  if (hasRedFlags) score -= 1.5;

  let feedback = 'Some culture references detected.';

  if (score >= 3.5) {
    feedback = `Excellent understanding of ${config.name}'s culture and community.`;
  } else if (score >= 2) {
    feedback = `Good culture references. Go deeper on how you'd engage with ${config.name}'s community.`;
  } else {
    feedback = `Research ${config.name}'s unique culture: ${config.cultureKeywords.slice(0, 4).join(', ')}.`;
  }

  if (hasRedFlags) {
    feedback = `Warning: Your essay contains language that may be seen as a red flag for ${config.name}.`;
  }

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    cultureReferences: cultureReferences.slice(0, 10),
    authenticSignals,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 3.4: "WHY NOT ELSEWHERE" (0-4)
// =============================================================================

async function scoreWhyNotElsewhere(
  essayText: string,
  config: SchoolConfig
): Promise<SchoolFitScore['whyNotElsewhere']> {
  // Schools where this essay could work (based on generic content)
  const couldWorkForOther: string[] = [];

  // Check if essay is too generic
  const genericPhrases = [
    'great academics', 'diverse community', 'beautiful campus',
    'amazing opportunities', 'world-class', 'top-tier',
    'excellent professors', 'strong program', 'good reputation',
  ];

  const textLower = essayText.toLowerCase();
  const genericCount = genericPhrases.filter(p => textLower.includes(p)).length;

  // Check for school-specific uniqueness
  const schoolSpecificPatterns = getSchoolSpecificPatterns(config.id);
  const specificCount = schoolSpecificPatterns.filter(p => p.test(essayText)).length;

  // If generic and no specific references, could work for other schools
  if (genericCount > 2 && specificCount < 2) {
    const otherSchools = ['Harvard', 'Yale', 'Princeton', 'Columbia', 'Penn', 'Brown', 'Dartmouth', 'Cornell']
      .filter(s => s.toLowerCase() !== config.id);
    couldWorkForOther.push(...otherSchools.slice(0, 3));
  }

  const uniqueToSchool = specificCount >= 2 && couldWorkForOther.length === 0;

  // Calculate score
  let score = 2;

  if (uniqueToSchool) score = 4;
  else if (specificCount >= 2) score = 3;
  else if (specificCount >= 1) score = 2;
  else score = 1;

  if (couldWorkForOther.length > 2) score -= 1;

  let feedback = 'Essay has some school-specific elements.';

  if (uniqueToSchool) {
    feedback = `This essay could only be for ${config.name}. Strong school-specific content.`;
  } else if (couldWorkForOther.length > 0) {
    feedback = `Essay is too generic - could work for ${couldWorkForOther.join(', ')}. Add ${config.name}-specific details.`;
  }

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    uniqueToSchool,
    couldWorkForOther,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 3.5: FUTURE CONTRIBUTION (0-4)
// =============================================================================

async function scoreFutureContribution(
  essayText: string,
  config: SchoolConfig
): Promise<SchoolFitScore['futureContribution']> {
  const contributionsPlanned: string[] = [];

  // Contribution patterns
  const contributionPatterns = [
    /I (?:will|would|want to|hope to|plan to) (?:contribute|bring|add|offer)/i,
    /(?:I would|I'd like to) (?:join|participate in|be part of|start|create|lead)/i,
    /(?:share|bring) my (?:experience|perspective|skills|knowledge)/i,
    /(?:give back|help others|mentor|support)/i,
  ];

  for (const pattern of contributionPatterns) {
    const matches = essayText.match(new RegExp(pattern, 'gi'));
    if (matches) {
      contributionsPlanned.push(...matches);
    }
  }

  // Check for specificity
  const specificContributionPatterns = [
    /I (?:will|would|want to).{0,50}(?:club|organization|team|group|community)/i,
    /I (?:hope|plan) to.{0,50}(?:research|study|explore|investigate)/i,
  ];

  const specificEnough = specificContributionPatterns.some(p => p.test(essayText));

  // Calculate score
  let score = 1;

  if (contributionsPlanned.length >= 2 && specificEnough) score = 4;
  else if (contributionsPlanned.length >= 2) score = 3;
  else if (contributionsPlanned.length >= 1) score = 2;
  else score = 0.5;

  let feedback = 'Limited mention of how you\'d contribute to the community.';

  if (score >= 3.5) {
    feedback = `Clear and specific plans for contributing to ${config.name}'s community.`;
  } else if (score >= 2) {
    feedback = 'Good start on contributions. Be more specific about HOW you\'d engage.';
  } else {
    feedback = `Add specific ways you\'d contribute to ${config.name}. What will you DO there?`;
  }

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    contributionsPlanned: [...new Set(contributionsPlanned)].slice(0, 5),
    specificEnough,
    feedback,
  };
}
