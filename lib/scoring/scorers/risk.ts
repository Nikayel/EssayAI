/**
 * Risk & Red Flags Scorer (Dimension 5)
 * 10 points total (deduction-based) - Are there elements that could hurt the application?
 */

import type { RiskScore, StudentIntake, TextSpan } from '../types';
import { findPatternSpans } from '../text-utils';

// =============================================================================
// MAIN SCORER
// =============================================================================

export async function scoreRisk(
  essayText: string,
  intake: StudentIntake
): Promise<RiskScore> {
  const [
    ethicalConcerns,
    exaggerationSignals,
    culturalSensitivity,
    traumaWithoutAgency,
    negativeTone,
  ] = await Promise.all([
    scoreEthicalConcerns(essayText),
    scoreExaggerationSignals(essayText, intake),
    scoreCulturalSensitivity(essayText),
    scoreTraumaWithoutAgency(essayText),
    scoreNegativeTone(essayText),
  ]);

  // Calculate total (start at 10, apply deductions)
  const totalDeductions =
    ethicalConcerns.deduction +
    exaggerationSignals.deduction +
    culturalSensitivity.deduction +
    traumaWithoutAgency.deduction +
    negativeTone.deduction;

  const totalScore = Math.max(0, 10 - totalDeductions);

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    ethicalConcerns,
    exaggerationSignals,
    culturalSensitivity,
    traumaWithoutAgency,
    negativeTone,
  };
}

// =============================================================================
// SUB-CRITERION 5.1: ETHICAL CONCERNS (0-10 deduction)
// =============================================================================

interface EthicalIssue {
  type: 'plagiarism_signal' | 'dishonesty' | 'illegal_activity' | 'academic_dishonesty';
  evidence: string;
  severity: 'minor' | 'moderate' | 'severe';
}

async function scoreEthicalConcerns(
  essayText: string
): Promise<RiskScore['ethicalConcerns']> {
  const issues: EthicalIssue[] = [];

  // Plagiarism signals (unusual phrases that suggest copy-paste)
  const plagiarismPatterns = [
    { pattern: /\[citation needed\]/i, type: 'plagiarism_signal' as const, severity: 'severe' as const },
    { pattern: /click here|read more|learn more about/i, type: 'plagiarism_signal' as const, severity: 'moderate' as const },
    { pattern: /©|\(c\)|all rights reserved/i, type: 'plagiarism_signal' as const, severity: 'severe' as const },
    { pattern: /source:|reference:|bibliography:/i, type: 'plagiarism_signal' as const, severity: 'minor' as const },
  ];

  for (const { pattern, type, severity } of plagiarismPatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      issues.push({
        type,
        evidence: match?.[0] || 'Unknown match',
        severity,
      });
    }
  }

  // Dishonesty signals
  const dishonestyPatterns = [
    { pattern: /(?:I (?:never|always) tell the truth|to be honest|honestly speaking)/i, type: 'dishonesty' as const, severity: 'minor' as const },
  ];

  for (const { pattern, type, severity } of dishonestyPatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      issues.push({
        type,
        evidence: match?.[0] || '',
        severity,
      });
    }
  }

  // Illegal activity mentions
  const illegalPatterns = [
    { pattern: /\b(?:drugs?|cocaine|marijuana|weed|drunk driving|shoplifting|stealing)\b/i, type: 'illegal_activity' as const, severity: 'moderate' as const },
    { pattern: /\b(?:cheated?|plagiarized?|copied)\b(?!.{0,20}(?:on me|my heart))/i, type: 'academic_dishonesty' as const, severity: 'severe' as const },
  ];

  for (const { pattern, type, severity } of illegalPatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      // Only flag if not in redemption context
      const redemptionContext = /(?:learned|grew|changed|mistake|regret)/i.test(essayText);
      if (!redemptionContext || severity === 'severe') {
        issues.push({
          type,
          evidence: match?.[0] || '',
          severity: redemptionContext ? 'minor' : severity,
        });
      }
    }
  }

  // Calculate deduction
  let deduction = 0;
  for (const issue of issues) {
    if (issue.severity === 'severe') deduction += 5;
    else if (issue.severity === 'moderate') deduction += 2;
    else deduction += 0.5;
  }

  deduction = Math.min(10, deduction);

  let feedback = 'No ethical concerns detected.';
  if (issues.length > 0) {
    feedback = `Found ${issues.length} potential ethical concern(s). Review flagged content carefully.`;
  }

  return {
    deduction: Math.round(deduction * 10) / 10,
    issues,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 5.2: EXAGGERATION SIGNALS (0-3 deduction)
// =============================================================================

interface ExaggerationIssue {
  claim: string;
  reason: string;
}

async function scoreExaggerationSignals(
  essayText: string,
  intake: StudentIntake
): Promise<RiskScore['exaggerationSignals']> {
  const issues: ExaggerationIssue[] = [];

  // Large number claims
  const numberPatterns = [
    { pattern: /raised \$(\d{4,})/i, check: (n: number) => n > 50000 },
    { pattern: /(\d{3,})\s*(?:hours?|people|members|volunteers)/i, check: (n: number) => n > 500 },
    { pattern: /started (?:a|my) (?:nonprofit|organization|company).{0,50}(?:raised|earned|generated) \$(\d{4,})/i, check: (n: number) => n > 10000 },
  ];

  for (const { pattern, check } of numberPatterns) {
    const match = essayText.match(pattern);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (check(num)) {
        issues.push({
          claim: match[0],
          reason: 'Large numbers may seem exaggerated without context',
        });
      }
    }
  }

  // Superlative claims
  const superlativePatterns = [
    { pattern: /\bsingle-handedly\b/i, reason: 'Claiming sole credit may seem exaggerated' },
    { pattern: /\bcompletely transformed\b/i, reason: 'Strong claim - ensure you can back it up' },
    { pattern: /\brevolutionized\b/i, reason: 'Strong claim for a high schooler' },
    { pattern: /\bfirst (?:ever|person) to\b/i, reason: 'First-ever claims are hard to verify' },
    { pattern: /\bchanged (?:the world|everything|everyone)\b/i, reason: 'Overly broad claim' },
  ];

  for (const { pattern, reason } of superlativePatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      issues.push({
        claim: match?.[0] || '',
        reason,
      });
    }
  }

  // Impossible time commitments
  const timePattern = /(\d{2,})\s*hours?\s*(?:a|per)\s*(?:day|week)/i;
  const timeMatch = essayText.match(timePattern);
  if (timeMatch && parseInt(timeMatch[1], 10) > 80) {
    issues.push({
      claim: timeMatch[0],
      reason: 'Time commitment seems unrealistic',
    });
  }

  // Calculate deduction
  let deduction = Math.min(3, issues.length * 0.75);

  let feedback = 'No exaggeration concerns detected.';
  if (issues.length > 0) {
    feedback = `Found ${issues.length} potential exaggeration(s). Ensure claims are verifiable.`;
  }

  return {
    deduction: Math.round(deduction * 10) / 10,
    issues,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 5.3: CULTURAL SENSITIVITY (0-5 deduction)
// =============================================================================

interface CulturalIssue {
  type: 'savior_complex' | 'stereotyping' | 'privilege_blindness' | 'appropriation';
  text: string;
  suggestion: string;
}

async function scoreCulturalSensitivity(
  essayText: string
): Promise<RiskScore['culturalSensitivity']> {
  const issues: CulturalIssue[] = [];
  const textLower = essayText.toLowerCase();

  // Savior complex patterns
  const saviorPatterns = [
    {
      pattern: /(?:helped?|saved?|taught)\s+(?:the\s+)?(?:poor|underprivileged|less fortunate|needy)\s+(?:children|kids|people|families)/i,
      suggestion: 'Reframe to focus on mutual exchange and what YOU learned from the community',
    },
    {
      pattern: /(?:Africa|Haiti|Guatemala|Honduras|India|Mexico)\s+(?:trip|mission|volunteer)/i,
      followUp: /(?:changed my life|eye-opening|grateful|blessed|lucky)/i,
      suggestion: 'Focus on the community\'s strengths, not just your transformation',
    },
    {
      pattern: /they (?:had|have) (?:so little|nothing) but (?:were|are) (?:so happy|still smiled|grateful)/i,
      suggestion: 'This is a common trope. Show genuine understanding of the community.',
    },
    {
      pattern: /I (?:taught|showed|gave) them/i,
      followUp: /and (?:they|their)/i,
      suggestion: 'Balance what you gave with what you received/learned',
    },
  ];

  for (const item of saviorPatterns) {
    if (item.pattern.test(essayText)) {
      if (!item.followUp || item.followUp.test(essayText)) {
        const match = essayText.match(item.pattern);
        issues.push({
          type: 'savior_complex',
          text: match?.[0] || '',
          suggestion: item.suggestion,
        });
      }
    }
  }

  // Privilege blindness patterns
  const privilegePatterns = [
    {
      pattern: /(?:had to|forced to)\s+(?:work at|intern at)\s+(?:my\s+)?(?:father'?s?|dad'?s?|mom'?s?|parent'?s?|family'?s?)\s+(?:company|firm|business)/i,
      suggestion: 'Acknowledge this as an opportunity, not a hardship',
    },
    {
      pattern: /(?:forced to|had to)\s+(?:vacation|travel|visit)\s+(?:Europe|abroad|overseas)/i,
      suggestion: 'Travel is a privilege - don\'t frame it as a burden',
    },
    {
      pattern: /(?:my\s+)?(?:maid|nanny|housekeeper|driver|chef)\s+(?:taught|helped|showed)/i,
      suggestion: 'Be thoughtful about mentioning household staff',
    },
  ];

  for (const { pattern, suggestion } of privilegePatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      issues.push({
        type: 'privilege_blindness',
        text: match?.[0] || '',
        suggestion,
      });
    }
  }

  // Stereotyping patterns
  const stereotypingPatterns = [
    {
      pattern: /(?:all|every)\s+(?:Asian|Black|Latino|Hispanic|Indian|Chinese|Mexican|African)\s+(?:people|students|families)/i,
      suggestion: 'Avoid generalizations about entire groups',
    },
    {
      pattern: /typical\s+(?:Asian|immigrant|first-gen)\s+(?:family|parents?|household)/i,
      suggestion: 'Avoid stereotypical descriptions of communities',
    },
  ];

  for (const { pattern, suggestion } of stereotypingPatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      issues.push({
        type: 'stereotyping',
        text: match?.[0] || '',
        suggestion,
      });
    }
  }

  // Calculate deduction
  let deduction = 0;
  for (const issue of issues) {
    if (issue.type === 'savior_complex') deduction += 2;
    else if (issue.type === 'privilege_blindness') deduction += 1.5;
    else deduction += 1;
  }

  deduction = Math.min(5, deduction);

  let feedback = 'No cultural sensitivity concerns detected.';
  if (issues.length > 0) {
    feedback = `Found ${issues.length} cultural sensitivity concern(s). These can be red flags for AOs.`;
  }

  return {
    deduction: Math.round(deduction * 10) / 10,
    issues,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 5.4: TRAUMA WITHOUT AGENCY (0-3 deduction)
// =============================================================================

interface TraumaIssue {
  traumaElement: string;
  missingElement: 'growth' | 'agency' | 'reflection' | 'resolution';
}

async function scoreTraumaWithoutAgency(
  essayText: string
): Promise<RiskScore['traumaWithoutAgency']> {
  const issues: TraumaIssue[] = [];

  // Trauma indicators
  const traumaPatterns = [
    /\b(?:abuse|abused|abusive)\b/i,
    /\b(?:depression|depressed|suicidal|suicide)\b/i,
    /\b(?:death|died|passed away|lost)\s+(?:my|our)\s+(?:parent|mother|father|mom|dad|sibling|brother|sister|grandparent)/i,
    /\b(?:divorce|separated|custody)\b/i,
    /\b(?:poverty|homeless|evicted|foreclosure)\b/i,
    /\b(?:addiction|alcoholic|addict)\b/i,
    /\b(?:violence|violent|assault)\b/i,
    /\b(?:illness|cancer|hospital|surgery|diagnosed)\b/i,
  ];

  const hasTrauma = traumaPatterns.some(p => p.test(essayText));

  if (hasTrauma) {
    // Check for growth/agency/resolution
    const growthPatterns = [
      /(?:I learned|I grew|I became|I developed|this taught me|I found strength)/i,
      /(?:now I|today I|since then|because of this)/i,
    ];

    const agencyPatterns = [
      /I (?:decided|chose|took|made|started|created|built|founded)/i,
      /I (?:reached out|sought help|found support|talked to)/i,
    ];

    const resolutionPatterns = [
      /(?:overcame|survived|recovered|healed|moved forward|found peace)/i,
      /(?:stronger|resilient|grateful|hopeful|optimistic)/i,
    ];

    const hasGrowth = growthPatterns.some(p => p.test(essayText));
    const hasAgency = agencyPatterns.some(p => p.test(essayText));
    const hasResolution = resolutionPatterns.some(p => p.test(essayText));

    // Find the trauma mention
    let traumaText = '';
    for (const pattern of traumaPatterns) {
      const match = essayText.match(pattern);
      if (match) {
        traumaText = match[0];
        break;
      }
    }

    if (!hasGrowth) {
      issues.push({ traumaElement: traumaText, missingElement: 'growth' });
    }
    if (!hasAgency) {
      issues.push({ traumaElement: traumaText, missingElement: 'agency' });
    }
    if (!hasResolution && !hasGrowth) {
      issues.push({ traumaElement: traumaText, missingElement: 'resolution' });
    }
  }

  // Calculate deduction
  let deduction = Math.min(3, issues.length * 0.75);

  let feedback = 'No concerns about trauma framing.';
  if (issues.length > 0) {
    const missing = [...new Set(issues.map(i => i.missingElement))];
    feedback = `Essay discusses difficult topics but lacks ${missing.join(' and ')}. AOs need to see resilience, not just hardship.`;
  }

  return {
    deduction: Math.round(deduction * 10) / 10,
    issues,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 5.5: NEGATIVE TONE (0-2 deduction)
// =============================================================================

interface ToneIssue {
  type: 'complaining' | 'blaming' | 'arrogance' | 'entitlement';
  text: string;
}

async function scoreNegativeTone(
  essayText: string
): Promise<RiskScore['negativeTone']> {
  const issues: ToneIssue[] = [];

  // Complaining patterns
  const complainingPatterns = [
    /\b(?:unfair|didn't deserve|shouldn't have to|why do I have to)\b/i,
    /\b(?:hate|hated|can't stand|sick of|tired of)\b.{0,30}(?:school|class|teacher|work)/i,
  ];

  for (const pattern of complainingPatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      issues.push({ type: 'complaining', text: match?.[0] || '' });
    }
  }

  // Blaming patterns
  const blamingPatterns = [
    /(?:my\s+)?(?:teacher|counselor|coach|parent).{0,20}(?:fault|failed|didn't help|never supported|didn't care)/i,
    /\bif only\s+(?:my|they|he|she)\b.{0,30}(?:had|would|could)/i,
    /\bthey never\b.{0,20}(?:understood|helped|cared|listened)/i,
  ];

  for (const pattern of blamingPatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      issues.push({ type: 'blaming', text: match?.[0] || '' });
    }
  }

  // Arrogance patterns
  const arrogancePatterns = [
    /I'?m (?:obviously|clearly|definitely)\s+(?:the best|better than|smarter than|more qualified)/i,
    /\bI deserve\b.{0,20}(?:to be|a spot|admission|acceptance)/i,
    /\bmost (?:students|people|applicants)\b.{0,20}(?:don't|can't|wouldn't|couldn't)/i,
  ];

  for (const pattern of arrogancePatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      issues.push({ type: 'arrogance', text: match?.[0] || '' });
    }
  }

  // Entitlement patterns
  const entitlementPatterns = [
    /\bI (?:expect|demand|require|need)\b.{0,20}(?:admission|acceptance|scholarship)/i,
    /\b(?:owe|owes) me\b/i,
  ];

  for (const pattern of entitlementPatterns) {
    if (pattern.test(essayText)) {
      const match = essayText.match(pattern);
      issues.push({ type: 'entitlement', text: match?.[0] || '' });
    }
  }

  // Calculate deduction
  let deduction = Math.min(2, issues.length * 0.5);

  let feedback = 'Tone is positive and appropriate.';
  if (issues.length > 0) {
    const types = [...new Set(issues.map(i => i.type))];
    feedback = `Detected ${types.join(', ')} tone. This can hurt your application. Maintain a positive, grateful perspective.`;
  }

  return {
    deduction: Math.round(deduction * 10) / 10,
    issues,
    feedback,
  };
}
