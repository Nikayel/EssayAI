/**
 * Scoring Engine Calibration Tests
 * Tests to ensure scoring is consistent and well-calibrated
 */

import { analyzeEssay } from '../engine';
import { detectGenericPhrases, TOTAL_PHRASE_COUNT } from '../generic-phrases';
import type { StudentIntake } from '../types';

// =============================================================================
// TEST ESSAYS
// =============================================================================

const WEAK_ESSAY = `
From a young age, I have always been passionate about helping others. Ever since I can remember,
I have wanted to make a difference in the world. This experience taught me the importance of
hard work and perseverance.

When I volunteered at the local hospital, I learned a lot about myself. It was an amazing and
incredible experience that changed my life. I stepped outside my comfort zone and broadened
my horizons.

Harvard is the best school for me because of its prestigious reputation and world-class faculty.
I have always dreamed of attending this institution. The diverse community and unique opportunities
will help me follow my dreams.

In conclusion, I look forward to the opportunity to make an impact on campus. I am excited for
what the future holds and ready to make a difference in the world.
`;

const STRONG_ESSAY = `
The fluorescent lights of Room 302 buzzed overhead as I stared at the chessboard, my opponent's
clock ticking down. My grandmother, watching from the doorway, caught my eye and nodded once—the
same nod she'd given me years ago in Beijing when I'd asked if I could beat my father at weiqi.

"Zugzwang," whispered Marcus, my teammate. I didn't need him to tell me. Every move my opponent
made would weaken his position. But I wasn't thinking about chess anymore. I was thinking about
the seventeen kids from the Dorchester Boys Club who'd shown up to our free chess clinic that
morning, the ones who'd never touched a knight before.

When we started Chess for Change three years ago, my co-founder Aisha and I had twelve borrowed
boards and zero credibility. "Rich kids playing rich kids' games," someone commented on our
Instagram post. They weren't wrong—not then.

So we stopped posting and started listening. We learned that Marcus's little brother couldn't
come to Saturday sessions because he had to watch his siblings. We learned that transportation
was a barrier, that some kids were hungry, that chess felt like homework to kids drowning in
homework.

We adapted. Thursday afternoon sessions at the rec center. Snacks (funded by a bake sale, then
a local bakery sponsor). A curriculum that connected chess strategy to real decisions: "You
have $50 and need groceries for the week. What's your opening?"

Last month, Marcus's brother won his first tournament game. He's nine. When he called to tell
me, he said, "I'm gonna teach my sister." That's when I understood what I want to study at
Columbia.

The Core Curriculum's focus on primary texts connects to how we redesigned our chess teaching—
going back to fundamentals, questioning assumptions. Professor Elise Crull's work on philosophy
of physics particularly interests me because she examines how foundational questions reshape
entire fields. That's what I want to do: not just play the game, but understand why certain
moves matter in the first place.

Zugzwang. Every move matters, even when you don't want to move at all.
`;

const MEDIUM_ESSAY = `
The smell of antiseptic hit me as I walked through the hospital doors for my first volunteer
shift. I was nervous, unsure of what to expect.

Working in the pediatric ward taught me about resilience. Children like Maya, who was only
seven and undergoing chemotherapy, showed incredible bravery. She would draw pictures for
the nurses even on her hardest days.

I learned that being present matters more than having answers. When a parent asked me why
this was happening to their child, I couldn't respond with medical facts. I just sat with
them.

This experience shaped my interest in medicine, but more specifically, in the human side of
healthcare. I want to study biology at Yale because of the university's integration of
science with humanities through programs like Directed Studies.

The residential college system also appeals to me because it creates smaller communities
within the larger university. I hope to find my own community there, people who care about
both scientific inquiry and human connection.
`;

// =============================================================================
// TEST INTAKE
// =============================================================================

const createTestIntake = (school: string): StudentIntake => ({
  demographics: {
    isFirstGen: false,
    familyEducationLevel: 'bachelors',
    isInternational: false,
    geographicContext: 'suburban',
    schoolType: 'public',
    familyResponsibilities: [],
  },
  academic: {
    intendedMajor: 'Biology',
    academicInterests: ['Science', 'Philosophy'],
  },
  activities: {
    spike: 'Healthcare and community service',
    topActivities: [],
    leadershipRoles: [],
  },
  personal: {
    identityFactors: [],
  },
  essayContext: {
    targetSchool: school,
    essayType: 'why_us',
    essayPrompt: 'Why this school?',
    wordLimit: 650,
    biggestConcern: 'school_fit',
    draftNumber: 'first',
  },
  voice: {
    toneSample: '',
    writingStyle: 'conversational',
    usesHumor: false,
  },
});

// =============================================================================
// TESTS
// =============================================================================

describe('Phrase Database', () => {
  it('should have 200+ phrases', () => {
    expect(TOTAL_PHRASE_COUNT).toBeGreaterThan(200);
  });

  it('should detect cliches in weak essay', () => {
    const result = detectGenericPhrases(WEAK_ESSAY);
    expect(result.hardFlags.length).toBeGreaterThan(5);
    expect(result.clicheDensity).toBeGreaterThan(0.3);
  });

  it('should find few cliches in strong essay', () => {
    const result = detectGenericPhrases(STRONG_ESSAY);
    expect(result.hardFlags.length).toBeLessThan(3);
    expect(result.clicheDensity).toBeLessThan(0.1);
  });
});

describe('Scoring Engine Calibration', () => {
  it('should score weak essay below 50', async () => {
    const result = await analyzeEssay(WEAK_ESSAY, createTestIntake('harvard'));
    expect(result.overallScore).toBeLessThan(50);
    expect(result.scoreLabel).toMatch(/needs_work|developing/);
  });

  it('should score strong essay above 70', async () => {
    const result = await analyzeEssay(STRONG_ESSAY, createTestIntake('columbia'));
    expect(result.overallScore).toBeGreaterThan(70);
    expect(result.scoreLabel).toMatch(/competitive|strong|exceptional/);
  });

  it('should score medium essay between 50-75', async () => {
    const result = await analyzeEssay(MEDIUM_ESSAY, createTestIntake('yale'));
    expect(result.overallScore).toBeGreaterThan(50);
    expect(result.overallScore).toBeLessThan(75);
    expect(result.scoreLabel).toMatch(/developing|competitive/);
  });
});

describe('Dimension Scoring', () => {
  it('should penalize authenticity for cliche-heavy essay', async () => {
    const result = await analyzeEssay(WEAK_ESSAY, createTestIntake('harvard'));
    expect(result.dimensions.authenticity.clicheDensity.score).toBeLessThan(3);
  });

  it('should reward specificity for scene-based essay', async () => {
    const result = await analyzeEssay(STRONG_ESSAY, createTestIntake('columbia'));
    expect(result.dimensions.specificity.sceneVsSummary.showTellRatio).toBeGreaterThan(0.5);
  });

  it('should detect school-specific content', async () => {
    const result = await analyzeEssay(STRONG_ESSAY, createTestIntake('columbia'));
    expect(result.dimensions.schoolFit.specificProgramKnowledge.programsMentioned.length).toBeGreaterThan(0);
  });
});

describe('Issue Detection', () => {
  it('should identify top issues for weak essay', async () => {
    const result = await analyzeEssay(WEAK_ESSAY, createTestIntake('harvard'));
    expect(result.topIssues.length).toBeGreaterThan(0);
    expect(result.topIssues[0].howToFix).toBeDefined();
  });

  it('should identify strengths for strong essay', async () => {
    const result = await analyzeEssay(STRONG_ESSAY, createTestIntake('columbia'));
    expect(result.strengths.length).toBeGreaterThan(0);
  });
});

describe('School-Specific Scoring', () => {
  it('should provide school-specific feedback', async () => {
    const result = await analyzeEssay(MEDIUM_ESSAY, createTestIntake('yale'));
    expect(result.schoolFeedback).toBeDefined();
    expect(result.schoolFeedback?.school).toBe('Yale University');
  });

  it('should detect missing school elements', async () => {
    const result = await analyzeEssay(WEAK_ESSAY, createTestIntake('brown'));
    expect(result.schoolFeedback?.missingElements.length).toBeGreaterThan(0);
  });
});

describe('Metadata', () => {
  it('should calculate word count correctly', async () => {
    const result = await analyzeEssay(STRONG_ESSAY, createTestIntake('columbia'));
    expect(result.metadata.wordCount).toBeGreaterThan(300);
    expect(result.metadata.wordCount).toBeLessThan(500);
  });

  it('should track processing time', async () => {
    const result = await analyzeEssay(MEDIUM_ESSAY, createTestIntake('yale'));
    expect(result.metadata.processingTimeMs).toBeGreaterThan(0);
  });
});
