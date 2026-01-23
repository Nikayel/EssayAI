/**
 * Specificity & Craft Scorer (Dimension 4)
 * 20 points total - Does the essay show, not tell? Are there concrete scenes?
 */

import type { SpecificityScore, TextSpan, StudentIntake, FlaggedPhrase } from '../types';
import {
  parseText,
  calculateShowTellRatio,
  calculateSpecificity,
  analyzeOpeningHook,
  analyzeStructure,
  findPatternSpans,
} from '../text-utils';

// =============================================================================
// MAIN SCORER
// =============================================================================

export async function scoreSpecificity(
  essayText: string,
  intake: StudentIntake
): Promise<SpecificityScore> {
  const [
    concreteDetails,
    sceneVsSummary,
    dialogue,
    structure,
    openingHook,
  ] = await Promise.all([
    scoreConcreteDetails(essayText),
    scoreSceneVsSummary(essayText),
    scoreDialogue(essayText),
    scoreStructure(essayText),
    scoreOpeningHook(essayText),
  ]);

  const totalScore =
    concreteDetails.score +
    sceneVsSummary.score +
    dialogue.score +
    structure.score +
    openingHook.score;

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    concreteDetails,
    sceneVsSummary,
    dialogue,
    structure,
    openingHook,
  };
}

// =============================================================================
// SUB-CRITERION 4.1: CONCRETE DETAIL DENSITY (0-4)
// =============================================================================

async function scoreConcreteDetails(
  essayText: string
): Promise<SpecificityScore['concreteDetails']> {
  const result = calculateSpecificity(essayText);

  // Find vague nouns with locations
  const vagueNouns: FlaggedPhrase[] = [];
  const vaguePatterns = [
    { word: 'things', pattern: /\bthings\b/gi },
    { word: 'stuff', pattern: /\bstuff\b/gi },
    { word: 'something', pattern: /\bsomething\b/gi },
    { word: 'someone', pattern: /\bsomeone\b/gi },
    { word: 'people', pattern: /\bpeople\b(?!\s+(?:of color|with|who))/gi },
  ];

  for (const { word, pattern } of vaguePatterns) {
    const spans = findPatternSpans(essayText, pattern);
    for (const span of spans) {
      vagueNouns.push({
        phrase: span.text,
        location: span,
        severity: 'soft',
        category: 'vague_language',
        suggestion: `What ${word} specifically? Name them.`,
      });
    }
  }

  // Find sensory details
  const sensoryPatterns = [
    /\b(?:red|blue|green|yellow|orange|purple|black|white|gray|golden|silver|bright|dark|pale)\b/gi,
    /\b(?:loud|quiet|soft|sharp|smooth|rough|cold|warm|hot|cool|wet|dry)\b/gi,
    /\b(?:sweet|sour|bitter|salty|spicy|fresh|stale)\b/gi,
    /\b(?:smell(?:ed)?|tast(?:ed?)|hear(?:d)?|saw|felt|touch(?:ed)?)\b/gi,
  ];

  const sensoryDetails: string[] = [];
  for (const pattern of sensoryPatterns) {
    const matches = essayText.match(pattern) || [];
    sensoryDetails.push(...matches);
  }

  // Calculate detail density
  const words = essayText.split(/\s+/).length;
  const detailDensity = words > 0 ? (result.specificElements.length + sensoryDetails.length) / words * 100 : 0;

  // Calculate score (0-4 scale)
  let score = (result.score / 5) * 4; // Convert from 0-5 to 0-4

  // Adjust for sensory details
  if (sensoryDetails.length >= 5) score += 0.5;
  else if (sensoryDetails.length < 2) score -= 0.5;

  // Penalize heavy vague word usage
  if (vagueNouns.length > 5) score -= 0.5;

  let feedback = 'Moderate level of concrete details.';

  if (score >= 3.5) {
    feedback = 'Excellent use of specific, concrete details. Your essay creates vivid imagery.';
  } else if (score >= 2.5) {
    feedback = 'Good details. Replace vague words with specifics for more impact.';
  } else {
    feedback = 'Add more specific nouns, sensory details, and concrete examples.';
  }

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    specificNouns: result.specificElements,
    vagueNouns,
    sensoryDetails: [...new Set(sensoryDetails)].slice(0, 15),
    detailDensity: Math.round(detailDensity * 100) / 100,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 4.2: SCENE VS. SUMMARY RATIO (0-4)
// =============================================================================

async function scoreSceneVsSummary(
  essayText: string
): Promise<SpecificityScore['sceneVsSummary']> {
  const result = calculateShowTellRatio(essayText);

  // Convert to TextSpans for scene moments
  const sceneMoments: TextSpan[] = result.sentences
    .filter(s => s.type === 'showing' || s.type === 'dialogue')
    .map((s, i) => ({
      text: s.text.substring(0, 100) + (s.text.length > 100 ? '...' : ''),
      startLine: i + 1,
      endLine: i + 1,
      startChar: 0,
      endChar: s.text.length,
    }))
    .slice(0, 5);

  const summaryMoments: TextSpan[] = result.sentences
    .filter(s => s.type === 'telling')
    .map((s, i) => ({
      text: s.text.substring(0, 100) + (s.text.length > 100 ? '...' : ''),
      startLine: i + 1,
      endLine: i + 1,
      startChar: 0,
      endChar: s.text.length,
    }))
    .slice(0, 5);

  // Calculate score based on ratio
  let score = result.ratio * 4; // Direct mapping: 100% showing = 4 points

  // Bonus for balanced mix
  if (result.ratio >= 0.5 && result.ratio <= 0.8) {
    score += 0.25; // Some telling is fine, even good
  }

  let feedback = 'Balance between showing and telling.';

  if (result.ratio >= 0.7) {
    feedback = 'Excellent! Essay shows through scenes rather than just telling.';
  } else if (result.ratio >= 0.5) {
    feedback = 'Good balance. Consider converting more telling statements to scenes.';
  } else if (result.ratio >= 0.3) {
    feedback = 'Too much telling. Show through action, dialogue, and sensory detail.';
  } else {
    feedback = 'Essay relies heavily on summary. Add specific scenes and moments.';
  }

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    sceneMoments,
    summaryMoments,
    showTellRatio: Math.round(result.ratio * 100) / 100,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 4.3: DIALOGUE (0-4)
// =============================================================================

async function scoreDialogue(
  essayText: string
): Promise<SpecificityScore['dialogue']> {
  // Find dialogue instances
  const dialoguePatterns = [
    /"[^"]{5,}"/g,  // Double quotes
    /'[^']{5,}'/g,  // Single quotes
    /"[^"]{5,}"/g,  // Smart quotes
  ];

  const dialogueInstances: TextSpan[] = [];

  for (const pattern of dialoguePatterns) {
    const spans = findPatternSpans(essayText, pattern);
    dialogueInstances.push(...spans);
  }

  // Check for dialogue tags
  const hasDialogueTags = /\b(?:said|asked|replied|whispered|shouted|muttered|exclaimed)\b/i.test(essayText);

  // Analyze dialogue quality
  let characterRevealed = false;
  let natural = true;

  for (const instance of dialogueInstances) {
    // Check if dialogue reveals character
    if (instance.text.length > 20) {
      characterRevealed = true;
    }

    // Check if dialogue sounds natural (not too formal)
    if (/\b(?:shall|whom|henceforth|furthermore)\b/i.test(instance.text)) {
      natural = false;
    }
  }

  // Calculate score
  let score = 1; // Base score

  if (dialogueInstances.length >= 3) score = 3.5;
  else if (dialogueInstances.length >= 2) score = 3;
  else if (dialogueInstances.length >= 1) score = 2;

  if (characterRevealed) score += 0.25;
  if (natural && dialogueInstances.length > 0) score += 0.25;
  if (!natural) score -= 0.5;

  let feedback = 'Consider adding dialogue to bring moments to life.';

  if (dialogueInstances.length >= 2 && natural) {
    feedback = 'Good use of dialogue to create vivid scenes and reveal character.';
  } else if (dialogueInstances.length >= 1) {
    feedback = 'Some dialogue present. Consider adding more to create memorable moments.';
  }

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    dialogueInstances: dialogueInstances.slice(0, 5),
    characterRevealed,
    natural,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 4.4: STRUCTURE & FLOW (0-4)
// =============================================================================

async function scoreStructure(
  essayText: string
): Promise<SpecificityScore['structure']> {
  const analysis = analyzeStructure(essayText);
  const hookAnalysis = analyzeOpeningHook(essayText);

  // Calculate score based on structure analysis
  let score = 1;

  if (analysis.hasHook) score += 1;
  if (analysis.hasClearArc) score += 1;
  if (analysis.transitionQuality >= 0.5) score += 0.5;
  if (analysis.pacing === 'balanced') score += 0.5;

  // Penalties
  if (analysis.pacing === 'rushed') score -= 0.25;
  if (analysis.pacing === 'slow') score -= 0.25;

  let feedback = 'Structure needs improvement.';

  if (score >= 3.5) {
    feedback = 'Strong structure with clear arc and good pacing.';
  } else if (score >= 2.5) {
    feedback = 'Decent structure. ' + analysis.feedback.join(' ');
  } else {
    feedback = 'Work on essay structure. ' + analysis.feedback.join(' ');
  }

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    hasHook: analysis.hasHook,
    hasClearArc: analysis.hasClearArc,
    transitionQuality: analysis.transitionQuality,
    pacing: analysis.pacing,
    feedback,
  };
}

// =============================================================================
// SUB-CRITERION 4.5: OPENING HOOK (0-4)
// =============================================================================

async function scoreOpeningHook(
  essayText: string
): Promise<SpecificityScore['openingHook']> {
  const analysis = analyzeOpeningHook(essayText);

  // Convert 0-5 score to 0-4
  const score = (analysis.score / 5) * 4;

  return {
    score: Math.max(0, Math.min(4, Math.round(score * 10) / 10)),
    hookType: analysis.hookType,
    grabsAttention: analysis.grabsAttention,
    firstSentence: analysis.firstSentence,
    feedback: analysis.feedback,
  };
}
