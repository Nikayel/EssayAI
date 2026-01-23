# Essay Analysis & Scoring Engine Specification
## EssayEdge AI - Flagship Product

**Version:** 1.0
**Last Updated:** 2026-01-23
**Status:** Design Spec

---

## Executive Summary

Our flagship product analyzes college application essays using a **5-dimension scoring engine** calibrated against Ivy League admissions criteria. The system:

1. Collects comprehensive student context after essay upload
2. Scores essays across 5 dimensions with 25+ sub-criteria
3. Detects generic phrases, jargon, and red flags
4. Provides school-specific feedback aligned with each institution's values
5. Benchmarks against successful essays in our RAG database

**Key Principle:** Essays should reveal *who you are*, not repeat your resume.

---

## Part 1: Student Intake Flow

### 1.1 Trigger: Post-Essay Upload

Once a student uploads their essay, we present a guided intake form. This context is **critical** for accurate scoring.

### 1.2 Required Intake Fields

#### Demographics & Background

| Field | Type | Options/Format | Why We Need It |
|-------|------|----------------|----------------|
| `isFirstGen` | boolean | Yes/No | First-gen context changes how we evaluate "achievements" |
| `familyEducationLevel` | enum | `no_college`, `some_college`, `bachelors`, `graduate` | Calibrates expectations |
| `householdIncome` | enum | `<30k`, `30-75k`, `75-150k`, `150k+`, `prefer_not_say` | Financial context affects opportunities |
| `isInternational` | boolean | Yes/No | International context matters for "Why US" |
| `countryOfOrigin` | string | Country selector | Cultural context |
| `primaryLanguage` | string | Text | ESL consideration |
| `immigrationStory` | enum | `citizen`, `immigrant_self`, `immigrant_parent`, `visa`, `undocumented`, `prefer_not_say` | Major context for personal story |
| `geographicContext` | enum | `rural`, `suburban`, `urban` | Opportunity access differs |
| `schoolType` | enum | `public`, `private`, `charter`, `magnet`, `homeschool`, `international` | Resource context |
| `familyResponsibilities` | multiselect | `caregiving`, `work_to_support`, `sibling_care`, `translation`, `none` | Time/commitment context |

#### Academic Context

| Field | Type | Options/Format | Why We Need It |
|-------|------|----------------|----------------|
| `intendedMajor` | string | Major selector | Alignment with essay themes |
| `academicInterests` | string[] | Multi-select + free text | Intellectual curiosity evaluation |
| `intellectualPassion` | text | 100-word description | "What keeps you up at night?" |
| `researchExperience` | boolean + text | If yes, describe | STEM/academic depth |
| `academicChallenges` | text | Optional | Context for grade dips |

#### Activities & Experience

| Field | Type | Options/Format | Why We Need It |
|-------|------|----------------|----------------|
| `spike` | text | 50-100 words | Main narrative thread |
| `topActivities` | structured[] | Name, role, hours, years, impact | Cross-reference with essay |
| `workExperience` | structured[] | Job, hours/week, reason for working | Economic context |
| `leadershipRoles` | string[] | List | Leadership evaluation |
| `summerExperiences` | text | Description | How they use unstructured time |

#### Personal Identity & Story

| Field | Type | Options/Format | Why We Need It |
|-------|------|----------------|----------------|
| `identityFactors` | multiselect | `race_ethnicity`, `gender`, `lgbtq`, `disability`, `religion`, `military`, `other` | Context for diversity essays |
| `significantChallenges` | text | Optional description | Adversity context |
| `uniquePerspective` | text | "What makes you different?" | Authenticity baseline |
| `whatAOsShouldKnow` | text | "What's not in your app?" | Catch missing context |

#### Essay-Specific Context

| Field | Type | Options/Format | Why We Need It |
|-------|------|----------------|----------------|
| `targetSchool` | string | School selector | School-specific scoring |
| `essayType` | enum | `personal_statement`, `why_us`, `supplemental`, `activity`, `diversity`, `community` | Prompt-specific criteria |
| `essayPrompt` | text | Full prompt text | Prompt alignment scoring |
| `wordLimit` | number | Integer | Length evaluation |
| `biggestConcern` | enum | `too_generic`, `not_enough_depth`, `wrong_tone`, `school_fit`, `grammar`, `structure`, `other` | Prioritize feedback |
| `previousFeedback` | boolean + text | Has anyone reviewed? What did they say? | Avoid redundant feedback |
| `draftNumber` | enum | `first`, `second`, `third_plus`, `final` | Calibrate feedback intensity |

#### Voice Calibration

| Field | Type | Options/Format | Why We Need It |
|-------|------|----------------|----------------|
| `toneSample` | text | 150-250 word writing sample | Voice preservation baseline |
| `writingStyle` | enum | `formal`, `conversational`, `storytelling`, `analytical` | Tone consistency check |
| `humor` | boolean | Do they use humor? | Validate if humor in essay is authentic |

---

## Part 2: The 5-Dimension Scoring Engine

### Overview

```
Total Score (0-100) = Weighted sum of 5 dimensions

Dimension 1: Authenticity & Voice     (25%)  →  0-25 points
Dimension 2: Insight & Reflection     (25%)  →  0-25 points
Dimension 3: School Fit & Alignment   (20%)  →  0-20 points
Dimension 4: Specificity & Craft      (20%)  →  0-20 points
Dimension 5: Risk & Red Flags         (10%)  →  0-10 points (deduction-based)
```

---

### Dimension 1: Authenticity & Voice (25 points)

**Core Question:** Does this sound like a real 17-year-old, or a consultant?

#### Sub-Criteria (5 points each)

| Sub-Criterion | Score Range | What We Measure |
|---------------|-------------|-----------------|
| **1.1 Tone Consistency** | 0-5 | Cosine similarity between essay and voice sample (>0.75 = good) |
| **1.2 Age-Appropriate Language** | 0-5 | Flesch-Kincaid grade level, thesaurus abuse detection |
| **1.3 Unique Perspective** | 0-5 | Could only THIS student have written this? |
| **1.4 Personal Idioms** | 0-5 | Natural expressions vs. corporate-speak |
| **1.5 Cliche Density** | 0-5 | Generic phrase detection (see Section 3) |

#### Scoring Logic

```typescript
interface AuthenticityScore {
  toneConsistency: {
    score: number;           // 0-5
    cosineSimilarity: number; // 0-1 with tone sample
    driftLocations: string[]; // Where voice changes
  };
  ageAppropriateness: {
    score: number;
    fleschKincaid: number;   // Target: 9-12 grade level
    thesaurusFlags: string[]; // Words that seem forced
  };
  uniquePerspective: {
    score: number;
    uniqueElements: string[]; // What's distinctive
    genericElements: string[];// What could be anyone
  };
  personalIdioms: {
    score: number;
    naturalPhrases: string[];
    corporateSpeak: string[];
  };
  clicheDensity: {
    score: number;
    clichesFound: string[];
    clichePercentage: number; // % of sentences with cliches
  };
}
```

#### Detection Patterns: Generic Phrases & Jargon

**Hard Flags (Auto-deduct):**
- "I learned the importance of..."
- "This experience taught me..."
- "I realized that..."
- "From a young age..."
- "I have always been passionate about..."
- "I want to make a difference..."
- "In today's society..."
- "As a leader, I..."
- "This was a turning point..."
- "I am a hard worker who..."

**Soft Flags (Warn):**
- "diverse community"
- "step outside my comfort zone"
- "broaden my horizons"
- "think outside the box"
- "follow my dreams"
- "unique opportunity"
- "prestigious institution"
- "make an impact"
- "holistic education"
- "global perspective"

**Thesaurus Abuse Patterns:**
- "utilize" instead of "use"
- "endeavor" instead of "try"
- "plethora" instead of "many"
- "myriad" instead of "many"
- "facilitate" instead of "help"
- "implement" instead of "do"
- "leverage" instead of "use"
- "synergy" in any context
- "paradigm" in any context

---

### Dimension 2: Insight & Reflection (25 points)

**Core Question:** Is there a "so what?" Does the essay reveal something non-obvious?

#### Sub-Criteria (5 points each)

| Sub-Criterion | Score Range | What We Measure |
|---------------|-------------|-----------------|
| **2.1 Depth of Reflection** | 0-5 | Surface observation vs. genuine insight |
| **2.2 Growth Arc** | 0-5 | Clear before/after transformation |
| **2.3 Self-Awareness** | 0-5 | Understanding of own strengths/weaknesses |
| **2.4 Non-Obvious Connections** | 0-5 | Links between experiences and broader meaning |
| **2.5 "So What" Factor** | 0-5 | Does reader learn something meaningful about applicant? |

#### Scoring Logic

```typescript
interface InsightScore {
  depthOfReflection: {
    score: number;
    surfaceStatements: string[];  // "I felt happy"
    deepStatements: string[];     // "I realized my discomfort came from..."
    depthRatio: number;           // deep / (surface + deep)
  };
  growthArc: {
    score: number;
    hasBeforeState: boolean;
    hasAfterState: boolean;
    transformationClarity: number; // 0-1
    growthEvidence: string[];
  };
  selfAwareness: {
    score: number;
    strengthsAcknowledged: string[];
    weaknessesAcknowledged: string[];
    blindSpots: string[];         // What's missing
  };
  nonObviousConnections: {
    score: number;
    connections: Array<{
      elementA: string;
      elementB: string;
      insightLevel: 'surface' | 'moderate' | 'deep';
    }>;
  };
  soWhatFactor: {
    score: number;
    readerTakeaway: string;       // What do we learn?
    memorability: number;         // 0-1
  };
}
```

#### Detection Patterns: Shallow Reflection

**Surface-Level Epiphanies (Penalize):**
- "I learned that hard work pays off"
- "I discovered the value of teamwork"
- "I realized I was stronger than I thought"
- "This taught me perseverance"
- "I gained confidence in myself"
- "I learned to believe in myself"
- "I discovered my passion for [field]"

**Missing Growth Indicators:**
- No "before" state described
- No specific moment of change
- Telling without showing
- Abstract conclusions without concrete evidence

---

### Dimension 3: School Fit & Alignment (20 points)

**Core Question:** Does this essay prove they researched THIS specific school?

#### Sub-Criteria (4 points each)

| Sub-Criterion | Score Range | What We Measure |
|---------------|-------------|-----------------|
| **3.1 Specific Program Knowledge** | 0-4 | Names courses, professors, programs correctly |
| **3.2 Value Alignment** | 0-4 | Essay reflects school's stated values |
| **3.3 Culture Fit Signals** | 0-4 | References school-specific culture |
| **3.4 "Why Not Elsewhere"** | 0-4 | Could this essay work for a different school? |
| **3.5 Future Contribution** | 0-4 | How will they give back to the community? |

#### School-Specific Weighting

```typescript
const SCHOOL_FIT_WEIGHTS: Record<string, SchoolFitConfig> = {
  harvard: {
    primaryEmphasis: ['intellectual_curiosity', 'leadership', 'impact'],
    secondaryEmphasis: ['community', 'veritas'],
    mustMention: ['specific_course_or_program', 'house_system'],
    redFlags: ['prestige_chasing', 'name_dropping_without_substance'],
  },
  yale: {
    primaryEmphasis: ['intellectual_depth', 'community', 'arts_culture'],
    secondaryEmphasis: ['residential_colleges', 'new_haven'],
    mustMention: ['residential_college_culture', 'specific_program'],
    redFlags: ['comparing_to_harvard', 'ignoring_community'],
  },
  princeton: {
    primaryEmphasis: ['service', 'honor', 'independent_work'],
    secondaryEmphasis: ['undergraduate_focus', 'precepts'],
    mustMention: ['service_commitment', 'senior_thesis'],
    redFlags: ['service_as_resume_padding', 'no_reflection'],
  },
  columbia: {
    primaryEmphasis: ['core_curriculum', 'nyc_as_resource', 'intellectual_rigor'],
    secondaryEmphasis: ['global_perspective', 'debate'],
    mustMention: ['core_curriculum', 'nyc_educational_value'],
    redFlags: ['nyc_for_lifestyle_only', 'no_core_mention'],
  },
  brown: {
    primaryEmphasis: ['open_curriculum', 'self_direction', 'autonomy'],
    secondaryEmphasis: ['risd_partnership', 'collaboration'],
    mustMention: ['specific_use_of_open_curriculum'],
    redFlags: ['wanting_freedom_to_avoid_work', 'no_self_direction'],
  },
  dartmouth: {
    primaryEmphasis: ['community', 'outdoors', 'd_plan'],
    secondaryEmphasis: ['undergraduate_focus', 'traditions'],
    mustMention: ['rural_appreciation', 'community_contribution'],
    redFlags: ['treating_location_as_negative', 'ignoring_outdoor_culture'],
  },
  cornell: {
    primaryEmphasis: ['college_specific_fit', 'any_person_any_study'],
    secondaryEmphasis: ['research', 'applied_learning'],
    mustMention: ['specific_college_programs'],
    redFlags: ['generic_cornell_essay', 'wrong_college_focus'],
  },
  upenn: {
    primaryEmphasis: ['cross_school_collaboration', 'practical_impact'],
    secondaryEmphasis: ['entrepreneurship', 'philadelphia'],
    mustMention: ['one_university_philosophy', 'specific_school'],
    redFlags: ['wharton_prestige_only', 'ignoring_collaboration'],
  },
};
```

#### Detection Patterns: Generic "Why Us"

**Lazy Research Flags:**
- "I want to attend [School] because of its diverse community" (every school says this)
- "The beautiful campus" (not specific)
- "World-renowned faculty" (generic)
- "Amazing opportunities" (vague)
- "Top-ranked program" (prestige-chasing)
- "I've always dreamed of attending" (doesn't show fit)

**Mission Statement Parroting:**
- Copying exact phrases from school website
- Using school motto without connecting to personal experience
- Listing programs without explaining relevance

---

### Dimension 4: Specificity & Craft (20 points)

**Core Question:** Does the essay show, not tell? Are there concrete scenes?

#### Sub-Criteria (4 points each)

| Sub-Criterion | Score Range | What We Measure |
|---------------|-------------|-----------------|
| **4.1 Concrete Detail Density** | 0-4 | Specific nouns, verbs, sensory details |
| **4.2 Scene vs. Summary Ratio** | 0-4 | How much is "showing" vs. "telling" |
| **4.3 Dialogue/Quotes** | 0-4 | Real conversations that reveal character |
| **4.4 Structure & Flow** | 0-4 | Clear arc, transitions, pacing |
| **4.5 Opening Hook** | 0-4 | Does first sentence grab attention? |

#### Scoring Logic

```typescript
interface SpecificityScore {
  concreteDetails: {
    score: number;
    specificNouns: string[];      // "my grandmother's kitchen" vs. "a room"
    vagueNouns: string[];         // "things", "stuff", "people"
    sensoryDetails: string[];     // sight, sound, smell, touch, taste
    detailDensity: number;        // specific / total nouns
  };
  sceneVsSummary: {
    score: number;
    sceneMoments: Array<{
      text: string;
      lineNumbers: number[];
    }>;
    summaryMoments: Array<{
      text: string;
      lineNumbers: number[];
    }>;
    showTellRatio: number;        // Target: >0.6
  };
  dialogue: {
    score: number;
    dialogueInstances: string[];
    characterRevealed: boolean;
    natural: boolean;
  };
  structure: {
    score: number;
    hasHook: boolean;
    hasClearArc: boolean;
    transitionQuality: number;    // 0-1
    pacing: 'rushed' | 'balanced' | 'slow';
  };
  openingHook: {
    score: number;
    hookType: 'in_medias_res' | 'question' | 'statement' | 'scene' | 'weak';
    grabsAttention: boolean;
    firstSentence: string;
  };
}
```

#### Detection Patterns: Vague Language

**Vague Words to Flag:**
- "things" → ask: what things specifically?
- "stuff" → ask: what stuff?
- "people" → ask: which people?
- "interesting" → ask: interesting how?
- "important" → ask: important why?
- "good" → ask: good in what way?
- "nice" → ask: nice how?
- "amazing" → ask: amazing in what specific way?
- "incredible" → too hyperbolic
- "life-changing" → too hyperbolic

**Show vs. Tell Detection:**

TELLING (penalize):
- "I was nervous" → SHOWING: "My hands trembled as I..."
- "She was kind" → SHOWING: "She handed me her umbrella without a word"
- "It was difficult" → SHOWING: "I stayed up until 3am, erasing and rewriting"
- "I learned a lot" → SHOWING: Specific example of what was learned

---

### Dimension 5: Risk & Red Flags (10 points)

**Core Question:** Are there any elements that could hurt the application?

This dimension is **deduction-based**. Start at 10, subtract for issues.

#### Risk Categories

| Risk Category | Deduction | Detection |
|---------------|-----------|-----------|
| **5.1 Ethical Concerns** | -3 to -10 | Plagiarism signals, dishonesty, illegal activity |
| **5.2 Exaggeration Signals** | -1 to -3 | Inflated claims, impossible timelines |
| **5.3 Cultural Insensitivity** | -2 to -5 | Savior complex, stereotyping, privilege blindness |
| **5.4 Trauma Without Agency** | -1 to -3 | Sad story without growth, pity-seeking |
| **5.5 Negative Tone** | -1 to -2 | Complaining, blaming others, arrogance |

#### Scoring Logic

```typescript
interface RiskScore {
  baseScore: 10;

  ethicalConcerns: {
    deduction: number;
    issues: Array<{
      type: 'plagiarism_signal' | 'dishonesty' | 'illegal_activity' | 'academic_dishonesty';
      evidence: string;
      severity: 'minor' | 'moderate' | 'severe';
    }>;
  };

  exaggerationSignals: {
    deduction: number;
    issues: Array<{
      claim: string;
      reason: string; // Why it seems exaggerated
    }>;
  };

  culturalSensitivity: {
    deduction: number;
    issues: Array<{
      type: 'savior_complex' | 'stereotyping' | 'privilege_blindness' | 'appropriation';
      text: string;
      suggestion: string;
    }>;
  };

  traumaWithoutAgency: {
    deduction: number;
    issues: Array<{
      traumaElement: string;
      missingElement: 'growth' | 'agency' | 'reflection' | 'resolution';
    }>;
  };

  negativeTone: {
    deduction: number;
    issues: Array<{
      type: 'complaining' | 'blaming' | 'arrogance' | 'entitlement';
      text: string;
    }>;
  };

  finalScore: number; // 10 - total deductions (min 0)
}
```

#### Detection Patterns: Red Flags

**Savior Complex (Volunteer Trips):**
- "I went to Africa and helped the poor children"
- "I taught them English and changed their lives"
- "They had so little but were so happy"
- "I realized how lucky I am"
- Focus on own feelings, not community's reality

**Privilege Blindness:**
- Complaining about "hardships" that are actually privileges
- Not acknowledging access/resources others lack
- "I had to work at my dad's company over summer"
- Treating normal challenges as exceptional adversity

**Exaggeration Flags:**
- "I single-handedly..."
- "I created a nonprofit that raised $100,000" (verify)
- Impossible time commitments (100+ hours/week)
- Claims that contradict application elsewhere

**Trauma Dumping:**
- Detailed trauma without growth
- Seeking pity rather than showing resilience
- No "what I learned" or "how I grew"
- Ending on a sad note

---

## Part 3: School-Specific Calibration

### Scoring Weight Adjustments by School

```typescript
const SCHOOL_CALIBRATION: Record<string, DimensionWeights> = {
  harvard: {
    authenticity: 0.25,
    insight: 0.25,
    schoolFit: 0.20,
    specificity: 0.20,
    risk: 0.10,
    // Harvard-specific boosts
    boostFor: ['intellectual_curiosity', 'leadership', 'impact_orientation'],
    penalizeFor: ['prestige_chasing', 'name_dropping'],
  },
  yale: {
    authenticity: 0.25,
    insight: 0.30,  // Yale cares more about intellectual depth
    schoolFit: 0.20,
    specificity: 0.15,
    risk: 0.10,
    boostFor: ['quirky_interests', 'artistic_expression', 'community'],
    penalizeFor: ['purely_pre_professional', 'no_community_focus'],
  },
  princeton: {
    authenticity: 0.25,
    insight: 0.25,
    schoolFit: 0.25,  // Princeton cares a lot about service alignment
    specificity: 0.15,
    risk: 0.10,
    boostFor: ['genuine_service', 'honor_integrity', 'independent_thinking'],
    penalizeFor: ['service_as_resume', 'no_reflection'],
  },
  columbia: {
    authenticity: 0.20,
    insight: 0.25,
    schoolFit: 0.25,  // Core curriculum understanding is crucial
    specificity: 0.20,
    risk: 0.10,
    boostFor: ['intellectual_rigor', 'global_perspective', 'core_engagement'],
    penalizeFor: ['nyc_lifestyle_only', 'no_core_mention'],
  },
  brown: {
    authenticity: 0.30,  // Brown values authentic self-direction
    insight: 0.25,
    schoolFit: 0.20,
    specificity: 0.15,
    risk: 0.10,
    boostFor: ['self_direction', 'intellectual_risk_taking', 'creativity'],
    penalizeFor: ['wanting_easy_path', 'no_demonstrated_autonomy'],
  },
  dartmouth: {
    authenticity: 0.25,
    insight: 0.20,
    schoolFit: 0.30,  // Dartmouth fit is very specific
    specificity: 0.15,
    risk: 0.10,
    boostFor: ['community_orientation', 'outdoor_appreciation', 'close_knit'],
    penalizeFor: ['treating_rural_as_negative', 'ignoring_community'],
  },
  cornell: {
    authenticity: 0.20,
    insight: 0.20,
    schoolFit: 0.35,  // College-specific fit is paramount
    specificity: 0.15,
    risk: 0.10,
    boostFor: ['college_specific_knowledge', 'applied_learning', 'research'],
    penalizeFor: ['generic_cornell', 'wrong_college'],
  },
  upenn: {
    authenticity: 0.20,
    insight: 0.20,
    schoolFit: 0.30,
    specificity: 0.20,
    risk: 0.10,
    boostFor: ['practical_application', 'cross_school', 'entrepreneurship'],
    penalizeFor: ['wharton_prestige_only', 'no_cross_school'],
  },
};
```

---

## Part 4: Output Format

### Analysis Response Structure

```typescript
interface EssayAnalysisResult {
  // Overall Score
  overallScore: number;  // 0-100
  scoreLabel: 'needs_work' | 'developing' | 'competitive' | 'strong' | 'exceptional';
  // 0-39: needs_work, 40-59: developing, 60-74: competitive, 75-89: strong, 90-100: exceptional

  // Dimension Breakdown
  dimensions: {
    authenticity: DimensionResult;
    insight: DimensionResult;
    schoolFit: DimensionResult;
    specificity: DimensionResult;
    risk: DimensionResult;
  };

  // Line-by-Line Annotations
  annotations: Array<{
    lineNumber: number;
    text: string;
    type: 'strength' | 'issue' | 'suggestion';
    category: string;
    message: string;
    severity?: 'low' | 'medium' | 'high';
    fix?: string;
  }>;

  // Top Issues (Prioritized)
  topIssues: Array<{
    rank: number;
    issue: string;
    impact: string;
    howToFix: string;
    exampleBefore?: string;
    exampleAfter?: string;
  }>;

  // Strengths
  strengths: Array<{
    element: string;
    why: string;
    keepThis: boolean;
  }>;

  // School-Specific Feedback
  schoolFeedback?: {
    school: string;
    fitScore: number;
    alignedElements: string[];
    missingElements: string[];
    opportunities: string[];
  };

  // Benchmark Comparison
  benchmark?: {
    percentile: number;  // How does this compare to successful essays?
    similarSuccessfulEssays: number;
    keyDifferences: string[];
  };

  // Metadata
  metadata: {
    wordCount: number;
    readingLevel: number;
    analysisModel: string;
    ragContextUsed: boolean;
    processingTimeMs: number;
  };
}

interface DimensionResult {
  score: number;
  maxScore: number;
  percentage: number;
  subCriteria: Array<{
    name: string;
    score: number;
    maxScore: number;
    feedback: string;
    evidence?: string[];
  }>;
  summary: string;
}
```

---

## Part 5: Implementation Phases

### Phase 1: Intake Flow Enhancement (Week 1)
- [ ] Design intake form UI/UX
- [ ] Add new fields to Profile schema
- [ ] Build progressive disclosure (don't overwhelm)
- [ ] Implement required vs. optional field logic
- [ ] Add validation rules

### Phase 2: Generic Phrase Database (Week 1)
- [ ] Compile master list of 500+ cliches/generic phrases
- [ ] Categorize by severity (hard/soft flag)
- [ ] Build detection regex patterns
- [ ] Create suggestion alternatives for each
- [ ] Add embeddings for semantic matching

### Phase 3: Sub-Criteria Scoring (Week 2)
- [ ] Implement Dimension 1: Authenticity scorers
- [ ] Implement Dimension 2: Insight scorers
- [ ] Implement Dimension 3: School Fit scorers
- [ ] Implement Dimension 4: Specificity scorers
- [ ] Implement Dimension 5: Risk scorers

### Phase 4: School-Specific Calibration (Week 2)
- [ ] Build school config system
- [ ] Implement weight adjustments
- [ ] Add school-specific detection patterns
- [ ] Test against known successful essays

### Phase 5: Line-by-Line Annotation (Week 3)
- [ ] Build annotation engine
- [ ] Map issues to specific text spans
- [ ] Implement severity ranking
- [ ] Create inline suggestion system

### Phase 6: RAG Integration (Week 3)
- [ ] Connect scoring to example essay retrieval
- [ ] Build benchmark comparison
- [ ] Implement pattern matching feedback
- [ ] Add school insight integration

### Phase 7: Testing & Calibration (Week 4)
- [ ] Test with 100+ real essays
- [ ] Calibrate thresholds
- [ ] A/B test vs. current system
- [ ] Gather reviewer feedback

---

## Part 6: Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Scoring Accuracy** | 85%+ agreement with expert reviewers | Blind comparison study |
| **Generic Phrase Detection** | 95%+ recall | Known cliche test set |
| **False Positive Rate** | <10% | Unique phrases flagged incorrectly |
| **User Satisfaction** | 4.5+ / 5 | Post-analysis survey |
| **Revision Improvement** | +15 points average | Score delta after revision |
| **Time to Analysis** | <30 seconds | P95 latency |

---

## Appendix A: Generic Phrase Database (Sample)

### Category: Opening Lines

| Phrase | Severity | Alternative Suggestion |
|--------|----------|----------------------|
| "From a young age, I have always..." | HARD | Start with a specific moment instead |
| "Ever since I can remember..." | HARD | Show, don't tell your history |
| "I have always been passionate about..." | HARD | Demonstrate passion through action |
| "Growing up, I learned..." | SOFT | Start in the present, flashback if needed |
| "As a child, I..." | SOFT | Consider starting with recent moment |

### Category: Conclusion Lines

| Phrase | Severity | Alternative Suggestion |
|--------|----------|----------------------|
| "This experience taught me..." | HARD | Show the teaching through change |
| "I learned the importance of..." | HARD | Demonstrate importance through specifics |
| "I am now a stronger person" | SOFT | Prove strength with evidence |
| "I look forward to..." | SOFT | Be specific about what and why |

### Category: Jargon & Buzzwords

| Phrase | Severity | Context |
|--------|----------|---------|
| "holistic" | SOFT | AOs know their process |
| "diverse community" | SOFT | Every school claims this |
| "global perspective" | SOFT | Too vague |
| "leadership skills" | SOFT | Show leadership instead |
| "critical thinking" | SOFT | Demonstrate it |
| "make a difference" | SOFT | How specifically? |
| "step outside my comfort zone" | HARD | Overused |
| "broaden my horizons" | HARD | Cliche |

---

## Appendix B: Risk Pattern Database (Sample)

### Savior Complex Patterns

```regex
/(?:helped?|saved?|taught|gave).{0,30}(?:poor|underprivileged|less fortunate|third world|developing)/i
/(?:Africa|Haiti|Guatemala|orphan).{0,50}(?:changed my life|eye-opening|grateful|blessed)/i
/they (?:had|have) (?:so little|nothing) but (?:were|are) (?:so happy|smiled)/i
```

### Exaggeration Patterns

```regex
/(?:single-handedly|completely transformed|revolutionized)/i
/raised \$\d{5,}/i  // Claims of raising $10,000+ need verification
/(?:\d{2,}|hundred|thousand).{0,10}(?:hours|people|members)/i  // Large numbers
```

### Privilege Blindness Indicators

```regex
/had to (?:work at|intern at).{0,30}(?:father'?s?|dad'?s?|family'?s?|parent'?s?) (?:company|firm|business)/i
/forced to (?:vacation|travel|visit).{0,30}(?:Europe|abroad|overseas)/i
```

---

## Appendix C: School-Specific Keywords

### Harvard
**Positive:** veritas, truth-seeking, house system, Gen Ed, freshman seminars, intellectual curiosity, public service
**Negative:** prestige, ranking, best school, networking, career outcomes only

### Yale
**Positive:** residential colleges, lux et veritas, Directed Studies, singing groups, New Haven, arts, Dwight Hall
**Negative:** Harvard comparison, ignoring community, pre-professional only

### Princeton
**Positive:** honor code, service, senior thesis, precepts, independent work, "in the nation's service"
**Negative:** prestige-seeking, service without reflection, no thesis mention

### Columbia
**Positive:** Core Curriculum, NYC as classroom, Morningside Heights, intellectual rigor, Contemporary Civilization, Lit Hum
**Negative:** NYC nightlife, "the city," no Core mention, treating as backup

### Brown
**Positive:** Open Curriculum, self-directed, RISD, independent concentration, intellectual freedom
**Negative:** avoiding requirements, no direction, purely pre-professional

### Dartmouth
**Positive:** D-Plan, outdoors, DOC, close-knit, Hanover, traditions, undergraduate focus
**Negative:** rural as negative, ignoring outdoors, wanting big city

### Cornell
**Positive:** specific college name, "any person any study," research, project teams, land grant
**Negative:** generic Cornell, wrong college, not understanding differences

### Penn
**Positive:** One University, cross-school, Wharton + College, entrepreneurship, Philadelphia, practical
**Negative:** Wharton prestige only, no cross-school, ignoring civic engagement

---

*This document is the source of truth for the Essay Scoring Engine. All implementation should reference this spec.*
